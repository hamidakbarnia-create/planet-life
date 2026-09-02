/**
 * Persist resolved Decision Frame onto Decision Case (authoritative SoR).
 * sessionStorage remains navigation convenience only.
 *
 * Canonical persisted shapes:
 * EVALUATE → operation, time_scope=specific_date, date
 * COMPARE  → operation, time_scope=multiple_dates, dates[]
 * FIND     → operation, time_scope=date_range, start, end
 */

import { canExecuteInProduction } from '@/lib/ask-home';
import {
  createDecisionCaseFromFraming,
  DecisionCaseApiError,
  getDecisionCase,
  updateDecisionCaseFraming,
  type DecisionCaseResource,
  type PersistedDecisionFraming,
} from '@/lib/decision-case';
import type { DecisionFrameV1 } from './types';
import { canSelectOperationRenderer } from './frame';
import { isValidFindInclusiveRange } from './resolve';

/**
 * @deprecated Do not use for evaluation Case create.
 * Free-text must not invent a Decision Type to force Case creation.
 * Kept only for non-evaluate legacy callers / tests that still reference it.
 */
export const DEFAULT_FRAMING_DECISION_TYPE_ID = 'mar-wedding-date';

export function isFramingPersistReady(frame: DecisionFrameV1): boolean {
  if (!canSelectOperationRenderer(frame)) return false;
  if (frame.operation === 'evaluate') {
    if (frame.time.scope === 'specific_date') {
      return (frame.time.dates?.length ?? 0) === 1;
    }
    return frame.time.scope === 'none';
  }
  if (frame.operation === 'compare') {
    const count = frame.time.dates?.length ?? 0;
    return (
      frame.time.scope === 'multiple_dates' && count >= 2 && count <= 5
    );
  }
  if (frame.operation === 'find') {
    return (
      frame.time.scope === 'date_range' &&
      !!frame.time.range_start &&
      !!frame.time.range_end &&
      isValidFindInclusiveRange(frame.time.range_start, frame.time.range_end)
    );
  }
  return false;
}

export function toPersistedFraming(
  frame: DecisionFrameV1
): PersistedDecisionFraming {
  if (
    frame.operation !== 'evaluate' &&
    frame.operation !== 'compare' &&
    frame.operation !== 'find'
  ) {
    throw new Error('Cannot persist unresolved operation');
  }

  const base: PersistedDecisionFraming = {
    operation: frame.operation,
    time_scope: frame.time.scope,
    options: (frame.options ?? []).map((o) => ({
      id: o.id,
      label: o.label,
      ...(o.date ? { date: o.date } : {}),
    })),
    objective: frame.objective,
    raw_intent: frame.raw_intent,
  };

  if (frame.operation === 'evaluate') {
    if (frame.time.scope === 'specific_date' && frame.time.dates?.[0]) {
      return { ...base, date: frame.time.dates[0] };
    }
    return base;
  }

  if (frame.operation === 'compare') {
    return { ...base, dates: frame.time.dates ?? [] };
  }

  // FIND
  return {
    ...base,
    start: frame.time.range_start,
    end: frame.time.range_end,
  };
}

export function frameFromPersistedIntake(
  intake: Record<string, unknown> | undefined,
  fallbackIntent = ''
): DecisionFrameV1 | null {
  const raw = intake?.decision_frame;
  if (!raw || typeof raw !== 'object') return null;
  const framing = raw as Record<string, unknown>;
  const operation = framing.operation;
  const time_scope = framing.time_scope;
  if (
    operation !== 'evaluate' &&
    operation !== 'compare' &&
    operation !== 'find'
  ) {
    return null;
  }
  if (
    time_scope !== 'specific_date' &&
    time_scope !== 'multiple_dates' &&
    time_scope !== 'date_range' &&
    time_scope !== 'none'
  ) {
    return null;
  }

  let dates: string[] = [];
  if (typeof framing.date === 'string' && framing.date) {
    dates = [framing.date];
  } else if (Array.isArray(framing.dates)) {
    dates = framing.dates.filter((d): d is string => typeof d === 'string');
  }

  const range_start =
    typeof framing.start === 'string'
      ? framing.start
      : typeof framing.range_start === 'string'
        ? framing.range_start
        : undefined;
  const range_end =
    typeof framing.end === 'string'
      ? framing.end
      : typeof framing.range_end === 'string'
        ? framing.range_end
        : undefined;

  const options = Array.isArray(framing.options)
    ? framing.options
        .filter((o): o is Record<string, unknown> => !!o && typeof o === 'object')
        .map((o, i) => ({
          id: String(o.id ?? `opt-${i + 1}`),
          label: String(o.label ?? ''),
          ...(typeof o.date === 'string' ? { date: o.date } : {}),
        }))
        .filter((o) => o.label)
    : undefined;

  return {
    schema_version: '1.0.0',
    raw_intent:
      typeof framing.raw_intent === 'string' && framing.raw_intent
        ? framing.raw_intent
        : fallbackIntent || 'Persisted decision',
    objective:
      typeof framing.objective === 'string' ? framing.objective : undefined,
    operation,
    time: {
      scope: time_scope,
      dates: dates.length ? dates : undefined,
      range_start,
      range_end,
    },
    options,
    unknowns: [],
    open_ended: false,
    pending_clarification: null,
  };
}

export async function persistFrameToCase(input: {
  frame: DecisionFrameV1;
  caseId?: string | null;
  caseVersion?: number | null;
  decisionTypeId?: string;
  title?: string;
}): Promise<{
  case: DecisionCaseResource;
  framing: Record<string, unknown>;
  intake: Record<string, unknown>;
}> {
  if (!isFramingPersistReady(input.frame)) {
    throw new Error('Frame is not ready to persist');
  }
  const framing = toPersistedFraming(input.frame);
  const decisionTypeId =
    input.decisionTypeId || input.frame.decision_type_id || undefined;

  // Client UX gate: avoid creating Cases for flows the shipped web matrix
  // does not offer. Backend Decision Case validation remains authoritative
  // and may still reject even when this hint passes.
  // Never invent mar-wedding-date (or any other type) for free-text.
  if (
    !decisionTypeId ||
    !canExecuteInProduction(decisionTypeId, input.frame.operation)
  ) {
    throw new DecisionCaseApiError({
      status: 400,
      code: 'UNSUPPORTED_DECISION_TYPE',
      message: 'Decision type is not supported for this operation',
      details: {
        decision_type_id: decisionTypeId ?? null,
        operation: input.frame.operation,
      },
    });
  }

  const title =
    input.title ||
    input.frame.objective ||
    input.frame.raw_intent.slice(0, 120) ||
    'Decision';

  if (input.caseId && input.caseVersion != null) {
    return updateDecisionCaseFraming({
      caseId: input.caseId,
      expectedCaseVersion: input.caseVersion,
      framing,
    });
  }

  return createDecisionCaseFromFraming({
    decisionTypeId,
    title,
    framing,
  });
}

export async function loadFrameFromCase(
  caseId: string
): Promise<{
  frame: DecisionFrameV1;
  case: DecisionCaseResource;
} | null> {
  const detail = await getDecisionCase(caseId);
  const frame = frameFromPersistedIntake(
    detail.intake as Record<string, unknown> | undefined
  );
  if (!frame) return null;
  if (detail.decision_type_id) {
    frame.decision_type_id = detail.decision_type_id;
  }
  return { frame, case: detail };
}

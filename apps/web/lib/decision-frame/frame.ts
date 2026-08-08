import {
  DECISION_FRAME_SCHEMA_VERSION,
  type DecisionFrameV1,
  type DecisionOperation,
  type TimeScope,
} from './types';
import {
  detectOperation,
  detectTimeScope,
  isOpenEndedIntent,
  optionsFromDates,
} from './resolve';

function uniqueUnknowns(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

export function buildDecisionFrame(
  rawIntent: string,
  extras?: {
    decision_type_id?: string;
    objective?: string;
    operation?: DecisionOperation;
    time_scope?: TimeScope;
    dates?: string[];
    range_start?: string;
    range_end?: string;
    reference_year?: number;
  }
): DecisionFrameV1 {
  const raw_intent = rawIntent.trim();
  const detectedTime = detectTimeScope(
    raw_intent,
    extras?.reference_year ?? new Date().getUTCFullYear()
  );
  const scope = extras?.time_scope ?? detectedTime.scope;
  const dates = extras?.dates ?? detectedTime.dates;
  const operation =
    extras?.operation ?? detectOperation(raw_intent, scope);
  const open_ended = isOpenEndedIntent(raw_intent);

  const unknowns: string[] = [];
  if (!extras?.decision_type_id) unknowns.push('Decision type');
  if (!extras?.objective) unknowns.push('Objective');
  if (operation === 'unresolved') unknowns.push('Operation');
  if (scope === 'none') unknowns.push('Time');
  if (scope === 'specific_date' && dates.length === 0) {
    unknowns.push('Specific date value');
  }
  if (scope === 'multiple_dates' && dates.length < 2) {
    unknowns.push('Dates to compare');
  }
  if (scope === 'date_range' && !extras?.range_start && !detectedTime.range_start) {
    unknowns.push('Date range bounds');
  }
  if (open_ended) {
    unknowns.push('Decision axis (whether / where / when)');
  }

  let pending_clarification: DecisionFrameV1['pending_clarification'] = null;
  if (open_ended) {
    pending_clarification = 'open_ended_axis';
  } else if (operation === 'unresolved') {
    pending_clarification = 'operation';
  } else if (operation === 'compare' && dates.length < 2) {
    pending_clarification = 'time';
  }
  // EVALUATE may proceed without a date (yes/no directional). FIND with
  // date_range intent may proceed with unknown bounds visible in unknowns.

  return {
    schema_version: DECISION_FRAME_SCHEMA_VERSION,
    decision_type_id: extras?.decision_type_id,
    raw_intent: raw_intent || 'Untitled decision',
    objective: extras?.objective,
    operation,
    time: {
      scope,
      dates: dates.length ? dates : undefined,
      range_start: extras?.range_start ?? detectedTime.range_start,
      range_end: extras?.range_end ?? detectedTime.range_end,
    },
    options: dates.length ? optionsFromDates(dates) : undefined,
    unknowns: uniqueUnknowns(unknowns),
    open_ended,
    pending_clarification,
  };
}

export function applyOperationChoice(
  frame: DecisionFrameV1,
  operation: Exclude<DecisionOperation, 'unresolved'>
): DecisionFrameV1 {
  const next = buildDecisionFrame(frame.raw_intent, {
    decision_type_id: frame.decision_type_id,
    objective: frame.objective,
    operation,
    time_scope: frame.time.scope,
    dates: frame.time.dates,
    range_start: frame.time.range_start,
    range_end: frame.time.range_end,
  });
  // Force chosen operation even if detector disagrees.
  const unknowns = next.unknowns.filter((u) => u !== 'Operation');
  let pending = next.pending_clarification;
  if (pending === 'operation') pending = null;
  if (operation === 'compare' && (next.time.dates?.length ?? 0) < 2) {
    pending = 'time';
    next.time = { ...next.time, scope: 'multiple_dates' };
    if (!unknowns.includes('Dates to compare')) unknowns.push('Dates to compare');
  }
  if (operation === 'find' && next.time.scope === 'none') {
    next.time = { ...next.time, scope: 'date_range' };
    pending = null;
    if (!unknowns.includes('Date range bounds')) unknowns.push('Date range bounds');
  }
  if (operation === 'evaluate' && next.time.scope === 'none') {
    if (!unknowns.includes('Time')) unknowns.push('Time');
  }
  return {
    ...next,
    operation,
    unknowns,
    pending_clarification: pending,
    open_ended: false,
  };
}

export function applyOpenEndedAxis(
  frame: DecisionFrameV1,
  axis: 'whether' | 'where' | 'when'
): DecisionFrameV1 {
  const objective =
    axis === 'whether'
      ? 'Decide whether to proceed'
      : axis === 'where'
        ? 'Decide where / which place'
        : 'Decide when / timing';
  const operation: DecisionOperation =
    axis === 'when' ? 'unresolved' : 'evaluate';
  const time_scope: TimeScope = axis === 'when' ? 'none' : frame.time.scope;
  return buildDecisionFrame(frame.raw_intent, {
    decision_type_id: frame.decision_type_id,
    objective,
    operation,
    time_scope,
    dates: frame.time.dates,
  });
}

/** True when the frame may select an operation renderer (no recommendation leap for open-ended). */
export function canSelectOperationRenderer(frame: DecisionFrameV1): boolean {
  if (frame.open_ended) return false;
  if (frame.pending_clarification === 'open_ended_axis') return false;
  if (frame.pending_clarification === 'operation') return false;
  if (frame.operation === 'unresolved') return false;
  return true;
}

/** Set an explicit EVALUATE date — never invents today. */
export function applyEvaluateDate(
  frame: DecisionFrameV1,
  isoDate: string
): DecisionFrameV1 {
  const date = isoDate.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return frame;
  }
  return buildDecisionFrame(frame.raw_intent, {
    decision_type_id: frame.decision_type_id,
    objective: frame.objective,
    operation: 'evaluate',
    time_scope: 'specific_date',
    dates: [date],
  });
}

export type CompareDateDraft = {
  id: string;
  label: string;
  date: string;
};

/** Set 2–3 labeled COMPARE dates — never invents today or collapses to target_date. */
export function applyCompareDates(
  frame: DecisionFrameV1,
  drafts: CompareDateDraft[]
): DecisionFrameV1 {
  const cleaned = drafts
    .map((item, index) => ({
      id: (item.id || `opt-${index + 1}`).trim() || `opt-${index + 1}`,
      label: item.label.trim() || item.date.trim(),
      date: item.date.trim(),
    }))
    .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item.date));

  if (cleaned.length < 2 || cleaned.length > 3) {
    return {
      ...frame,
      operation: 'compare',
      time: { scope: 'multiple_dates', dates: cleaned.map((c) => c.date) },
      options: cleaned,
      pending_clarification: 'time',
    };
  }

  const dates = cleaned.map((c) => c.date);
  const next = buildDecisionFrame(frame.raw_intent, {
    decision_type_id: frame.decision_type_id,
    objective: frame.objective,
    operation: 'compare',
    time_scope: 'multiple_dates',
    dates,
  });
  return {
    ...next,
    operation: 'compare',
    options: cleaned,
    pending_clarification: null,
    unknowns: next.unknowns.filter((u) => u !== 'Dates to compare'),
  };
}

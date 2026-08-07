/**
 * Framing-complete presentation shells (internal / legacy adapter helpers).
 * Used when Frame can select a renderer but Decision Runtime has not run.
 * Values stay unknown — no invented scores, no coaching prose.
 *
 * Product ASK recovery must NOT mount these shells for consumers.
 * Consumer path: AskClarificationFlow → Case evaluate → EvaluateProductResult.
 */

import type { DecisionFrameV1, OperationResultViewModel } from './types';
import { formatDisplayDate } from './resolve';
import { canSelectOperationRenderer } from './frame';

export function framingReadyResult(
  frame: DecisionFrameV1
): OperationResultViewModel | null {
  if (!canSelectOperationRenderer(frame)) return null;

  if (frame.operation === 'compare') {
    const options = (frame.options ?? []).map((o) => ({
      label: o.label,
      strength: 'unknown' as const,
    }));
    return {
      operation: 'compare',
      options:
        options.length >= 2
          ? options
          : [
              { label: 'Option A', strength: 'unknown' },
              { label: 'Option B', strength: 'unknown' },
            ],
      winner_label: 'Unknown',
      deciding_factor: undefined,
      advantages: [],
      confidence: 'unknown',
      unknown: [...frame.unknowns, 'Decision Runtime has not evaluated this frame'],
    };
  }

  if (frame.operation === 'find') {
    return {
      operation: 'find',
      best_date_label: 'Unknown',
      strength: 'unknown',
      best_window: undefined,
      alternative: undefined,
      avoid: undefined,
      range_context:
        frame.time.range_start && frame.time.range_end
          ? `${formatDisplayDate(frame.time.range_start)} – ${formatDisplayDate(frame.time.range_end)}`
          : 'Date range stated — bounds may still be unknown',
      timeline: [],
      confidence: 'unknown',
      unknown: [...frame.unknowns, 'Decision Runtime has not evaluated this frame'],
    };
  }

  const subject =
    frame.time.dates?.[0] != null
      ? formatDisplayDate(frame.time.dates[0])
      : 'Selected date';

  return {
    operation: 'evaluate',
    subject_label: subject,
    strength: 'unknown',
    best_window: undefined,
    avoid: undefined,
    best_alternative: undefined,
    confidence: 'unknown',
    why: [],
    conditions: [],
    unknown: [...frame.unknowns, 'Decision Runtime has not evaluated this frame'],
  };
}

export function resultContainsForbiddenCoaching(
  text: string
): boolean {
  const lower = text.toLowerCase();
  return [
    'run a small experiment',
    'find a fact that would change your mind',
    'best case',
    'most likely',
    'downside case',
    'opportunity score',
    'risk score',
  ].some((marker) => lower.includes(marker));
}

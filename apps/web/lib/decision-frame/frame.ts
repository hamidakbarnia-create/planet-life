import {
  DECISION_FRAME_SCHEMA_VERSION,
  type DecisionFrameV1,
  type DecisionOperation,
  type TimeScope,
} from './types';
import {
  type ParseReference,
  detectOperation,
  detectTimeScope,
  isOpenEndedIntent,
  isValidFindInclusiveRange,
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
    /** Gregorian ISO reference date. Fixes the Jalali year for yearless
     * Jalali months more precisely than `reference_year` alone. */
    reference_date?: string;
  }
): DecisionFrameV1 {
  const raw_intent = rawIntent.trim();
  const reference: ParseReference =
    extras?.reference_date ??
    extras?.reference_year ??
    new Date().getUTCFullYear();
  const detectedTime = detectTimeScope(raw_intent, reference);
  const scope = extras?.time_scope ?? detectedTime.scope;
  const dates = extras?.dates ?? detectedTime.dates;
  const operation =
    extras?.operation ?? detectOperation(raw_intent, scope, reference);
  const open_ended = isOpenEndedIntent(raw_intent);

  const unknowns: string[] = [];
  if (!extras?.decision_type_id) unknowns.push('Decision type');
  if (!extras?.objective) unknowns.push('Objective');
  if (operation === 'unresolved') unknowns.push('Operation');
  if (scope === 'none') unknowns.push('Time');
  if (scope === 'specific_date' && dates.length === 0) {
    unknowns.push('Specific date value');
  }
  if (scope === 'multiple_dates' && (dates.length < 2 || dates.length > 5)) {
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
  } else if (
    operation === 'compare' &&
    (dates.length < 2 || dates.length > 5)
  ) {
    pending_clarification = 'time';
  } else if (
    operation === 'find' &&
    scope === 'date_range' &&
    !(extras?.range_start && extras?.range_end) &&
    !(detectedTime.range_start && detectedTime.range_end)
  ) {
    pending_clarification = 'time';
  }
  // EVALUATE may proceed without a date (yes/no directional). FIND with
  // date_range intent keeps unknown bounds visible until the user supplies ISO.

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

/** Detector suggestion only — never persist or skip the selector. */
export function recommendedOperation(
  rawIntent: string,
  reference?: ParseReference
): DecisionOperation {
  const ref = reference ?? new Date().getUTCFullYear();
  const time = detectTimeScope(rawIntent, ref);
  return detectOperation(rawIntent, time.scope, ref);
}

function isIsoDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

/**
 * Commit an explicit operation. Clears incompatible time fields so Find
 * ranges never become Compare candidates and Compare dates never become
 * a Find range.
 */
export function applyOperationChoice(
  frame: DecisionFrameV1,
  operation: Exclude<DecisionOperation, 'unresolved'>
): DecisionFrameV1 {
  const base = {
    decision_type_id: frame.decision_type_id,
    objective: frame.objective,
    operation,
  };

  if (operation === 'evaluate') {
    const keepDate =
      (frame.operation === 'evaluate' || frame.time.scope === 'specific_date') &&
      isIsoDate(frame.time.dates?.[0])
        ? frame.time.dates[0]
        : undefined;
    const next = buildDecisionFrame(frame.raw_intent, {
      ...base,
      time_scope: keepDate ? 'specific_date' : 'none',
      dates: keepDate ? [keepDate] : [],
    });
    const unknowns = next.unknowns.filter(
      (item) =>
        item !== 'Operation' &&
        item !== 'Date range bounds' &&
        item !== 'Dates to compare'
    );
    if (!keepDate && !unknowns.includes('Time')) unknowns.push('Time');
    if (!keepDate && !unknowns.includes('Specific date value')) {
      unknowns.push('Specific date value');
    }
    return {
      ...next,
      operation: 'evaluate',
      time: {
        scope: keepDate ? 'specific_date' : 'none',
        dates: keepDate ? [keepDate] : undefined,
      },
      options: undefined,
      unknowns: uniqueUnknowns(unknowns),
      pending_clarification: keepDate ? null : 'time',
      open_ended: false,
    };
  }

  if (operation === 'compare') {
    const preserve =
      frame.operation === 'compare' || frame.time.scope === 'multiple_dates';
    const fromOptions = preserve
      ? (frame.options ?? []).filter((item) => isIsoDate(item.date))
      : [];
    const dates = preserve
      ? fromOptions.length
        ? fromOptions.map((item) => item.date as string)
        : (frame.time.dates ?? []).filter(isIsoDate)
      : [];
    const options =
      fromOptions.length > 0
        ? fromOptions
        : dates.length
          ? optionsFromDates(dates)
          : undefined;
    const next = buildDecisionFrame(frame.raw_intent, {
      ...base,
      time_scope: 'multiple_dates',
      dates,
    });
    const unknowns = next.unknowns.filter(
      (item) => item !== 'Operation' && item !== 'Date range bounds'
    );
    if (dates.length < 2 && !unknowns.includes('Dates to compare')) {
      unknowns.push('Dates to compare');
    }
    return {
      ...next,
      operation: 'compare',
      time: { scope: 'multiple_dates', dates: dates.length ? dates : undefined },
      options,
      unknowns: uniqueUnknowns(unknowns),
      pending_clarification: dates.length < 2 ? 'time' : null,
      open_ended: false,
    };
  }

  const preserveRange =
    frame.operation === 'find' || frame.time.scope === 'date_range';
  const rangeStart = preserveRange ? frame.time.range_start : undefined;
  const rangeEnd = preserveRange ? frame.time.range_end : undefined;
  const next = buildDecisionFrame(frame.raw_intent, {
    ...base,
    time_scope: 'date_range',
    dates: [],
    range_start: rangeStart,
    range_end: rangeEnd,
  });
  const unknowns = next.unknowns.filter(
    (item) =>
      item !== 'Operation' &&
      item !== 'Dates to compare' &&
      item !== 'Specific date value'
  );
  if ((!rangeStart || !rangeEnd) && !unknowns.includes('Date range bounds')) {
    unknowns.push('Date range bounds');
  }
  return {
    ...next,
    operation: 'find',
    time: {
      scope: 'date_range',
      range_start: rangeStart,
      range_end: rangeEnd,
    },
    options: undefined,
    unknowns: uniqueUnknowns(unknowns),
    pending_clarification: rangeStart && rangeEnd ? null : 'time',
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

/** Set inclusive FIND date range — never invents today. */
export function applyFindDateRange(
  frame: DecisionFrameV1,
  rangeStart: string,
  rangeEnd: string
): DecisionFrameV1 {
  const start = rangeStart.trim();
  const end = rangeEnd.trim();
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(end) ||
    start > end ||
    !isValidFindInclusiveRange(start, end)
  ) {
    return {
      ...frame,
      operation: 'find',
      time: {
        scope: 'date_range',
        range_start: /^\d{4}-\d{2}-\d{2}$/.test(start) ? start : undefined,
        range_end: /^\d{4}-\d{2}-\d{2}$/.test(end) ? end : undefined,
      },
      pending_clarification: 'time',
    };
  }

  const next = buildDecisionFrame(frame.raw_intent, {
    decision_type_id: frame.decision_type_id,
    objective: frame.objective,
    operation: 'find',
    time_scope: 'date_range',
    range_start: start,
    range_end: end,
  });
  return {
    ...next,
    operation: 'find',
    pending_clarification: null,
    unknowns: next.unknowns.filter((u) => u !== 'Date range bounds'),
  };
}

/** Set 2–5 labeled COMPARE dates — never invents today or collapses to target_date. */
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

  if (cleaned.length < 2 || cleaned.length > 5) {
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

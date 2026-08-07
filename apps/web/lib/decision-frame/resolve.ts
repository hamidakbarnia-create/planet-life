/**
 * Operation + time-scope resolution for Decision Frame v1.
 *
 * Rules:
 * - Never silently assume today.
 * - Prefer unresolved over invented operation/time.
 * - Window is not an operation (FIND owns best-window rendering).
 */

import type {
  DecisionFrameOption,
  DecisionOperation,
  TimeScope,
} from './types';

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toIso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() !== month - 1 ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** Extract explicit calendar dates from text. Does not invent "today". */
export function extractExplicitDates(
  text: string,
  referenceYear = new Date().getUTCFullYear()
): string[] {
  const found = new Set<string>();
  const iso = text.matchAll(/\b(20\d{2})-(\d{2})-(\d{2})\b/g);
  for (const m of iso) {
    const value = toIso(Number(m[1]), Number(m[2]), Number(m[3]));
    if (value) found.add(value);
  }

  const dmy = text.matchAll(
    /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](20\d{2})\b/g
  );
  for (const m of dmy) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);
    const value = toIso(year, month, day);
    if (value) found.add(value);
  }

  const named = text.matchAll(
    /\b(?:(\d{1,2})\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(20\d{2}))?\b/gi
  );
  for (const m of named) {
    const month = MONTHS[m[2].toLowerCase()];
    const day = Number(m[3]);
    const year = m[4] ? Number(m[4]) : referenceYear;
    const value = toIso(year, month, day);
    if (value) found.add(value);
  }

  const dayMonth = text.matchAll(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:,?\s*(20\d{2}))?\b/gi
  );
  for (const m of dayMonth) {
    const day = Number(m[1]);
    const month = MONTHS[m[2].toLowerCase()];
    const year = m[3] ? Number(m[3]) : referenceYear;
    const value = toIso(year, month, day);
    if (value) found.add(value);
  }

  // "14 or 18 August" — shared month across compared day numbers.
  const orDays = text.matchAll(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+or\s+(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:,?\s*(20\d{2}))?\b/gi
  );
  for (const m of orDays) {
    const month = MONTHS[m[3].toLowerCase()];
    const year = m[4] ? Number(m[4]) : referenceYear;
    const a = toIso(year, month, Number(m[1]));
    const b = toIso(year, month, Number(m[2]));
    if (a) found.add(a);
    if (b) found.add(b);
  }

  return [...found].sort();
}

export function detectTimeScope(
  text: string,
  referenceYear = new Date().getUTCFullYear()
): {
  scope: TimeScope;
  dates: string[];
  range_start?: string;
  range_end?: string;
} {
  const dates = extractExplicitDates(text, referenceYear);
  const lower = text.toLowerCase();

  const rangeHint =
    /\b(next\s+\d+\s+days?|next\s+(week|month)|within\s+\d+\s+days?|in the next|date range|best (date|day|window) (in|within|over))\b/i.test(
      text
    ) || /\bfind the best\b/i.test(text);

  if (rangeHint && dates.length < 2) {
    return { scope: 'date_range', dates: [], range_start: undefined, range_end: undefined };
  }

  if (dates.length >= 2) {
    return { scope: 'multiple_dates', dates };
  }
  if (dates.length === 1) {
    return { scope: 'specific_date', dates };
  }
  if (rangeHint) {
    return { scope: 'date_range', dates: [] };
  }

  // Explicit "today" is a stated scope — still not an implicit default.
  if (/\b(today|tonight|this morning|this afternoon)\b/i.test(lower)) {
    return { scope: 'specific_date', dates: [] };
  }

  return { scope: 'none', dates: [] };
}

export function detectOperation(
  text: string,
  timeScope: TimeScope
): DecisionOperation {
  const lower = text.toLowerCase();

  if (
    /\b(find the best|best date|best day|best window|when (should|is|can) i|what's the best (date|day|time))\b/i.test(
      lower
    ) ||
    timeScope === 'date_range'
  ) {
    return 'find';
  }

  if (
    timeScope === 'multiple_dates' ||
    /\b(or|vs\.?|versus|compare|which (date|day|one) (is )?better)\b/i.test(lower)
  ) {
    // "14 or 18" style without verbs still compares when multiple dates exist.
    if (timeScope === 'multiple_dates') return 'compare';
    if (/\b(compare|which|vs\.?|versus)\b/i.test(lower)) return 'compare';
  }

  if (
    timeScope === 'specific_date' ||
    /\b(is .+ good|evaluate|check (this|the) date|how (is|good) .+ for)\b/i.test(
      lower
    )
  ) {
    if (timeScope === 'specific_date') return 'evaluate';
  }

  if (/\b(should i accept|should i go|should i take)\b/i.test(lower)) {
    // Yes/no directional — evaluate when time known; else unresolved time.
    return timeScope === 'none' ? 'evaluate' : 'evaluate';
  }

  return 'unresolved';
}

export function isOpenEndedIntent(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (
    /\b(i('m| am) thinking about|considering|exploring|not sure (what|where|when)|moving abroad|changing careers?)\b/i.test(
      t
    )
  ) {
    // Open-ended if no explicit evaluate/compare/find cue and no dates.
    const { scope } = detectTimeScope(t);
    const op = detectOperation(t, scope);
    return op === 'unresolved' && scope === 'none';
  }
  return false;
}

export function optionsFromDates(dates: string[]): DecisionFrameOption[] {
  return dates.map((date, index) => ({
    id: `date-${index + 1}`,
    label: formatDisplayDate(date),
    date,
  }));
}

export function formatDisplayDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${Number(m[3])} ${months[Number(m[2]) - 1]}`;
}

/** Map package timing band → product strength band (no false precision). */
export function timingBandToStrength(
  band: string | null | undefined
): import('./types').StrengthBand {
  switch (band) {
    case 'high':
      return 'strong';
    case 'moderate':
      return 'favorable';
    case 'low':
      return 'unfavorable';
    case 'na':
      return 'unknown';
    default:
      // Unrecognized band — do not invent "mixed".
      return 'unknown';
  }
}

export function confidenceValueToBand(
  value: number | null | undefined
): import('./types').ConfidenceBand {
  if (value == null || Number.isNaN(value)) return 'unknown';
  if (value >= 80) return 'high';
  if (value >= 65) return 'medium-high';
  if (value >= 45) return 'medium';
  return 'low';
}

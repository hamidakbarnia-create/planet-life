/**
 * Operation + time-scope resolution for Decision Frame v1.
 *
 * Rules:
 * - Never silently assume today.
 * - Prefer unresolved over invented operation/time.
 * - Window is not an operation (FIND owns best-window rendering).
 * - Digit folding is parse-only. raw_intent stays the original input.
 * - Jalali month names and Jalali numeric dates are not converted here
 *   (Phase 1B.1B). Relative ISO materialization is Phase 1B.2.
 */

import type {
  DecisionFrameOption,
  DecisionOperation,
  TimeScope,
} from './types';

/**
 * Inclusive FIND range bounds. Mirror of
 * `packages/decision_engine/find_windows.py`:
 * FIND_MIN_RANGE_DAYS = 7, FIND_MAX_RANGE_DAYS = 90.
 * Client validation must not weaken the backend contract.
 */
export const FIND_MIN_RANGE_DAYS = 7;
export const FIND_MAX_RANGE_DAYS = 90;

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
  // Persian spellings of Gregorian months (home/calendar i18n + common August aliases).
  ژانویه: 1,
  فوریه: 2,
  مارس: 3,
  آوریل: 4,
  مه: 5,
  ژوئن: 6,
  ژوئیه: 7,
  اوت: 8,
  آگوست: 8,
  آگست: 8,
  سپتامبر: 9,
  اکتبر: 10,
  نوامبر: 11,
  دسامبر: 12,
};

const EN_MONTH_RE =
  'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?';

const FA_MONTH_RE =
  'ژانویه|فوریه|مارس|آوریل|ژوئن|ژوئیه|سپتامبر|اکتبر|نوامبر|دسامبر|آگوست|آگست|اوت|مه';

const MONTH_RE = `(?:${EN_MONTH_RE}|${FA_MONTH_RE})`;

type DateHit = { index: number; iso: string };

/** Parse-only: Persian and Arabic-Indic digits → ASCII 0–9. */
export function foldLocaleDigits(text: string): string {
  let out = '';
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code == null) continue;
    if (code >= 0x06f0 && code <= 0x06f9) {
      out += String(code - 0x06f0);
    } else if (code >= 0x0660 && code <= 0x0669) {
      out += String(code - 0x0660);
    } else {
      out += ch;
    }
  }
  return out;
}

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

function monthFromToken(token: string): number | undefined {
  return MONTHS[token.toLowerCase()] ?? MONTHS[token];
}

function pushHit(hits: DateHit[], index: number, iso: string | null): void {
  if (iso) hits.push({ index, iso });
}

function uniqueInAppearanceOrder(hits: DateHit[]): string[] {
  hits.sort((a, b) => a.index - b.index);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const hit of hits) {
    if (seen.has(hit.iso)) continue;
    seen.add(hit.iso);
    out.push(hit.iso);
  }
  return out;
}

function isoDayCount(start: string, end: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return null;
  }
  if (start > end) return null;
  const a = Date.parse(`${start}T00:00:00Z`);
  const b = Date.parse(`${end}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86_400_000) + 1;
}

/** Inclusive day count for a Gregorian ISO range, or null if invalid/reversed. */
export function inclusiveFindDayCount(
  start: string,
  end: string
): number | null {
  return isoDayCount(start, end);
}

/** True when start/end are ISO and the inclusive span is 7–90 days. */
export function isValidFindInclusiveRange(
  start: string,
  end: string
): boolean {
  const days = isoDayCount(start, end);
  return (
    days != null &&
    days >= FIND_MIN_RANGE_DAYS &&
    days <= FIND_MAX_RANGE_DAYS
  );
}

function hasFaFindHint(text: string): boolean {
  return (
    /\d+\s*روز[\u200c\s]*آینده/.test(text) ||
    /هفته[\u200c\s]*آینده/.test(text) ||
    /ماه[\u200c\s]*آینده/.test(text) ||
    /پیدا[\u200c\s]*کن/.test(text) ||
    /چه[\u200c\s]+روز/.test(text) ||
    /چه[\u200c\s]+تاریخ/.test(text) ||
    /بهترین[\u200c\s]+(?:روز|تاریخ)/.test(text)
  );
}

function hasFaCompareLanguage(text: string): boolean {
  return (
    /مقایسه/.test(text) ||
    /کدام/.test(text) ||
    /کدوم/.test(text) ||
    /بین[\u200c\s]+\d/.test(text)
  );
}

/** Extract explicit Gregorian calendar dates. Does not invent "today". */
export function extractExplicitDates(
  text: string,
  referenceYear = new Date().getUTCFullYear()
): string[] {
  const parseText = foldLocaleDigits(text);
  const hits: DateHit[] = [];

  const iso = parseText.matchAll(/\b(20\d{2})-(\d{2})-(\d{2})\b/g);
  for (const m of iso) {
    const value = toIso(Number(m[1]), Number(m[2]), Number(m[3]));
    pushHit(hits, m.index ?? 0, value);
  }

  const dmy = parseText.matchAll(
    /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](20\d{2})\b/g
  );
  for (const m of dmy) {
    const value = toIso(Number(m[3]), Number(m[2]), Number(m[1]));
    pushHit(hits, m.index ?? 0, value);
  }

  const named = parseText.matchAll(
    new RegExp(
      `\\b(?:(\\d{1,2})\\s+)?(${EN_MONTH_RE})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(20\\d{2}))?\\b`,
      'gi'
    )
  );
  for (const m of named) {
    const month = monthFromToken(m[2]);
    if (!month) continue;
    const day = Number(m[3]);
    const year = m[4] ? Number(m[4]) : referenceYear;
    pushHit(hits, m.index ?? 0, toIso(year, month, day));
  }

  const dayMonth = parseText.matchAll(
    new RegExp(
      `(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_RE})ه?(?![\\p{L}])(?:,?\\s*(20\\d{2}))?`,
      'giu'
    )
  );
  for (const m of dayMonth) {
    const month = monthFromToken(m[2]);
    if (!month) continue;
    const day = Number(m[1]);
    const year = m[3] ? Number(m[3]) : referenceYear;
    pushHit(hits, m.index ?? 0, toIso(year, month, day));
  }

  // Shared-month lists: "14 or 18 August", "۱۲ یا ۱۵ سپتامبر",
  // "بین ۱۲ و ۱۵ سپتامبر", "۱۲، ۱۵ و ۱۸ سپتامبر".
  const orDays = parseText.matchAll(
    new RegExp(
      `(?:بین[\\u200c\\s]+)?(\\d{1,2}(?:st|nd|rd|th)?(?:[\\u200c\\s]*(?:یا|و|,|،|or|and)[\\u200c\\s]*\\d{1,2}(?:st|nd|rd|th)?)+)\\s+(${MONTH_RE})ه?(?![\\p{L}])(?:,?\\s*(20\\d{2}))?`,
      'giu'
    )
  );
  for (const m of orDays) {
    const month = monthFromToken(m[2]);
    if (!month) continue;
    const year = m[3] ? Number(m[3]) : referenceYear;
    const list = m[1];
    const listStart = m.index ?? 0;
    for (const dayMatch of list.matchAll(/\d{1,2}/g)) {
      const day = Number(dayMatch[0]);
      pushHit(
        hits,
        listStart + (dayMatch.index ?? 0),
        toIso(year, month, day)
      );
    }
  }

  return uniqueInAppearanceOrder(hits);
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
  const parseText = foldLocaleDigits(text);
  const lower = parseText.toLowerCase();

  const rangeHint =
    /\b(next\s+\d+\s+days?|next\s+(week|month)|within\s+\d+\s+days?|in the next|date range|best (date|day|window) (in|within|over))\b/i.test(
      parseText
    ) ||
    /\bfind the best\b/i.test(parseText) ||
    hasFaFindHint(parseText);

  // Explicit Gregorian dates beat relative/search hints (Evaluate/Compare
  // precedence). Relative phrases never materialize ISO bounds here.
  if (dates.length >= 2) {
    return { scope: 'multiple_dates', dates };
  }
  if (dates.length === 1) {
    return { scope: 'specific_date', dates };
  }
  if (rangeHint) {
    return {
      scope: 'date_range',
      dates: [],
      range_start: undefined,
      range_end: undefined,
    };
  }

  // Explicit "today" is a stated EN scope — still not an implicit default.
  if (/\b(today|tonight|this morning|this afternoon)\b/i.test(lower)) {
    return { scope: 'specific_date', dates: [] };
  }

  return { scope: 'none', dates: [] };
}

export function detectOperation(
  text: string,
  timeScope: TimeScope,
  referenceYear = new Date().getUTCFullYear()
): DecisionOperation {
  const parseText = foldLocaleDigits(text);
  const lower = parseText.toLowerCase();
  const dates = extractExplicitDates(text, referenceYear);

  // A. 2+ parsed Gregorian candidates → Compare (order preserved upstream).
  if (dates.length >= 2 || timeScope === 'multiple_dates') {
    return 'compare';
  }

  // B. Exactly one explicit date (or EN "today" scope) → Evaluate.
  // One date beats "best"/"بهترین" so Find is not inferred.
  if (dates.length === 1 || timeScope === 'specific_date') {
    return 'evaluate';
  }

  // C. Find requires search/range semantics — not every بهتر/بهترین.
  if (
    /\b(find the best|best date|best day|best window|when (should|is|can) i|what's the best (date|day|time))\b/i.test(
      lower
    ) ||
    timeScope === 'date_range' ||
    hasFaFindHint(parseText)
  ) {
    return 'find';
  }

  if (
    hasFaCompareLanguage(parseText) ||
    /\b(or|vs\.?|versus|compare|which (date|day|one) (is )?better)\b/i.test(
      lower
    )
  ) {
    if (/\b(compare|which|vs\.?|versus)\b/i.test(lower) || hasFaCompareLanguage(parseText)) {
      return 'compare';
    }
  }

  if (
    /\b(is .+ good|evaluate|check (this|the) date|how (is|good) .+ for)\b/i.test(
      lower
    )
  ) {
    return 'evaluate';
  }

  if (/\b(should i accept|should i go|should i take)\b/i.test(lower)) {
    return 'evaluate';
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

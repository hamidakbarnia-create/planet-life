import { API_BASE } from './api-config';
import type { CalendarDayIntelligence } from './calendar-day-intelligence';
import type { ScoreBreakdown } from './score-breakdown';
import type { ScoreReasoning } from './score-reasoning';

/**
 * Scoring-identity schema for month cache keys.
 * Old v1 city-only entries are never reused.
 *
 * `CALENDAR_CACHE_VERSION` is the fingerprint / storage-key identity (v2).
 * `CALENDAR_CACHE_CONTENT_VERSION` is the stored-value schema (v3 days).
 * They are independent: do not bump the fingerprint version to store
 * Day Intelligence.
 */
export const CALENDAR_CACHE_VERSION = 'v2' as const;
export const CALENDAR_CACHE_CONTENT_VERSION = 'v3' as const;

/** True once month cache round-trips additive Day Intelligence. Not UI. */
export const CALENDAR_CACHE_STORES_DAY_INTELLIGENCE = true;

const MONTH_CACHE_TTL_MS = 1000 * 60 * 60 * 12;

const V1_CACHE_PREFIX = 'planet-life-cal-';
const V2_CACHE_PREFIX = 'metioro-cal-v2-';

/**
 * Every field that can change `/api/batch` day scores.
 * Locale / language / presentation-only fields must never appear here.
 */
export type CalendarScoringInput = {
  birth_date: string;
  birth_time: string;
  birth_location: string;
  birth_latitude: number | null;
  birth_longitude: number | null;
  evaluation_location: string;
  evaluation_latitude: number | null;
  evaluation_longitude: number | null;
  evaluation_timezone: string | null;
  house_system: string;
  zodiac: string;
  action_type: string;
  year: number;
  month: number;
  /** Gregorian YYYY-MM-DD dates requested for the month batch (sorted). */
  dates: string[];
  scoring_identity_version: typeof CALENDAR_CACHE_VERSION;
};

export type CalendarCachedDay = {
  score: number;
  breakdown?: ScoreBreakdown | null;
  reasoning?: ScoreReasoning | null;
  dayIntelligence?: CalendarDayIntelligence | null;
};

export type MonthCacheRecord = {
  version: typeof CALENDAR_CACHE_CONTENT_VERSION;
  scoringIdentityVersion: typeof CALENDAR_CACHE_VERSION;
  inputFingerprint: string;
  savedAt: number;
  dates: string[];
  days: Record<string, CalendarCachedDay>;
  backendVersion?: string | null;
};

export type CalendarScoreFetchDiagnostic = {
  cache: 'hit' | 'miss';
  cacheVersion: typeof CALENDAR_CACHE_VERSION;
  contentVersion: typeof CALENDAR_CACHE_CONTENT_VERSION | 'legacy-v2' | 'none';
  inputFingerprint: string;
  apiHost: string;
  dateCount: number;
  scoreMapChecksum: string;
};

let lastFetchDiagnostic: CalendarScoreFetchDiagnostic | null = null;

/** Dev-only diagnostic. Always null in production builds. */
export function getLastCalendarScoreFetchDiagnostic(): CalendarScoreFetchDiagnostic | null {
  if (process.env.NODE_ENV === 'production') return null;
  return lastFetchDiagnostic;
}

export function setLastCalendarScoreFetchDiagnostic(
  diagnostic: CalendarScoreFetchDiagnostic | null
): void {
  if (process.env.NODE_ENV === 'production') {
    lastFetchDiagnostic = null;
    return;
  }
  lastFetchDiagnostic = diagnostic;
}

function normalizeString(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ');
}

function normalizeCoord(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  // Stable 6-decimal geospatial identity (avoids float noise across storage).
  return Math.round(value * 1e6) / 1e6;
}

/** Stable JSON with sorted object keys (arrays keep order). */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`)
    .join(',')}}`;
}

/** Deterministic FNV-1a 64-bit hex fingerprint (browser-safe, sync). */
export function fnv1a64Hex(text: string): string {
  // BigInt() constructors (not `n` literals) — required below ES2020 target.
  let hash = BigInt('14695981039346656037'); // FNV offset basis 0xcbf29ce484222325
  const prime = BigInt('1099511628211'); // FNV prime 0x100000001b3
  const mask = BigInt('18446744073709551615'); // 0xffffffffffffffff
  for (let i = 0; i < text.length; i += 1) {
    hash ^= BigInt(text.charCodeAt(i));
    hash = (hash * prime) & mask;
  }
  return hash.toString(16).padStart(16, '0');
}

export function normalizeCalendarScoringInput(
  input: Omit<CalendarScoringInput, 'scoring_identity_version' | 'dates'> & {
    dates: string[];
  }
): CalendarScoringInput {
  const dates = [...input.dates]
    .map((d) => normalizeString(d))
    .filter(Boolean)
    .sort();
  return {
    birth_date: normalizeString(input.birth_date),
    birth_time: normalizeString(input.birth_time),
    birth_location: normalizeString(input.birth_location),
    birth_latitude: normalizeCoord(input.birth_latitude),
    birth_longitude: normalizeCoord(input.birth_longitude),
    evaluation_location: normalizeString(input.evaluation_location),
    evaluation_latitude: normalizeCoord(input.evaluation_latitude),
    evaluation_longitude: normalizeCoord(input.evaluation_longitude),
    evaluation_timezone: normalizeString(input.evaluation_timezone) || null,
    house_system: normalizeString(input.house_system).toLowerCase(),
    zodiac: normalizeString(input.zodiac).toLowerCase(),
    action_type: normalizeString(input.action_type).toLowerCase(),
    year: input.year,
    month: input.month,
    dates,
    scoring_identity_version: CALENDAR_CACHE_VERSION,
  };
}

/**
 * Fingerprint over normalized score-affecting inputs only.
 * Does not embed raw birth PII in the storage key plaintext beyond the hash.
 */
export function fingerprintCalendarScoringInput(
  input: CalendarScoringInput
): string {
  const normalized = normalizeCalendarScoringInput(input);
  return fnv1a64Hex(stableStringify(normalized));
}

export function scoreMapChecksum(scores: Record<string, number>): string {
  const entries = Object.keys(scores)
    .sort()
    .map((date) => [date, scores[date]] as const);
  return fnv1a64Hex(stableStringify(entries));
}

export function monthCacheStorageKey(
  year: number,
  month: number,
  actionType: string,
  inputFingerprint: string
): string {
  const action = normalizeString(actionType).toLowerCase().replace(/\s+/g, '_');
  return `${V2_CACHE_PREFIX}${year}-${String(month).padStart(2, '0')}-${action}-${inputFingerprint}`;
}

function isFiniteScore(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isCompleteScoreMap(
  scores: Record<string, number>,
  dates: string[]
): boolean {
  if (!dates.length) return false;
  for (const date of dates) {
    if (!isFiniteScore(scores[date])) return false;
  }
  return true;
}

function isCompleteDayMap(
  days: Record<string, CalendarCachedDay>,
  dates: string[]
): boolean {
  if (!dates.length) return false;
  for (const date of dates) {
    const day = days[date];
    if (!day || !isFiniteScore(day.score)) return false;
  }
  return true;
}

function hasSemanticKeys(
  days: Record<string, CalendarCachedDay>,
  dates: string[]
): boolean {
  return dates.every((date) => {
    const day = days[date];
    return day != null && Object.prototype.hasOwnProperty.call(day, 'dayIntelligence');
  });
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function scoresFromCachedDays(
  days: Record<string, CalendarCachedDay>
): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const [date, day] of Object.entries(days)) {
    if (day && isFiniteScore(day.score)) scores[date] = day.score;
  }
  return scores;
}

export function breakdownsFromCachedDays(
  days: Record<string, CalendarCachedDay>
): Record<string, ScoreBreakdown | null> {
  const out: Record<string, ScoreBreakdown | null> = {};
  for (const [date, day] of Object.entries(days)) {
    out[date] = day?.breakdown ?? null;
  }
  return out;
}

export function reasoningFromCachedDays(
  days: Record<string, CalendarCachedDay>
): Record<string, ScoreReasoning | null> {
  const out: Record<string, ScoreReasoning | null> = {};
  for (const [date, day] of Object.entries(days)) {
    out[date] = day?.reasoning ?? null;
  }
  return out;
}

export function dayIntelligenceFromCachedDays(
  days: Record<string, CalendarCachedDay>
): Record<string, CalendarDayIntelligence | null> {
  const out: Record<string, CalendarDayIntelligence | null> = {};
  for (const [date, day] of Object.entries(days)) {
    out[date] = day?.dayIntelligence ?? null;
  }
  return out;
}

type ParsedStore =
  | { kind: 'v3'; record: MonthCacheRecord }
  | {
      kind: 'legacy-v2';
      inputFingerprint: string;
      savedAt: number;
      dates: string[];
      scores: Record<string, number>;
    }
  | null;

function parseStoredValue(raw: string): ParsedStore {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.version !== 'string') return null;
    if (typeof parsed.inputFingerprint !== 'string') return null;
    if (typeof parsed.savedAt !== 'number' || !Number.isFinite(parsed.savedAt)) {
      return null;
    }
    if (!Array.isArray(parsed.dates)) return null;
    const dates = parsed.dates.filter((d): d is string => typeof d === 'string');

    if (parsed.version === CALENDAR_CACHE_CONTENT_VERSION) {
      if (!parsed.days || typeof parsed.days !== 'object') return null;
      const days = parsed.days as Record<string, CalendarCachedDay>;
      return {
        kind: 'v3',
        record: {
          version: CALENDAR_CACHE_CONTENT_VERSION,
          scoringIdentityVersion:
            parsed.scoringIdentityVersion === CALENDAR_CACHE_VERSION
              ? CALENDAR_CACHE_VERSION
              : CALENDAR_CACHE_VERSION,
          inputFingerprint: parsed.inputFingerprint,
          savedAt: parsed.savedAt,
          dates,
          days: cloneJson(days),
          backendVersion:
            typeof parsed.backendVersion === 'string' || parsed.backendVersion == null
              ? (parsed.backendVersion as string | null) ?? null
              : null,
        },
      };
    }

    if (parsed.version === CALENDAR_CACHE_VERSION && parsed.scores && typeof parsed.scores === 'object' && !parsed.days) {
      return {
        kind: 'legacy-v2',
        inputFingerprint: parsed.inputFingerprint,
        savedAt: parsed.savedAt,
        dates,
        scores: { ...(parsed.scores as Record<string, number>) },
      };
    }
    return null;
  } catch {
    return null;
  }
}

function readRawRecord(input: CalendarScoringInput): {
  key: string;
  fingerprint: string;
  normalized: CalendarScoringInput;
  stored: ParsedStore;
} | null {
  if (typeof window === 'undefined') return null;
  const normalized = normalizeCalendarScoringInput(input);
  const fingerprint = fingerprintCalendarScoringInput(normalized);
  const key = monthCacheStorageKey(
    normalized.year,
    normalized.month,
    normalized.action_type,
    fingerprint
  );
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { key, fingerprint, normalized, stored: null };
    return { key, fingerprint, normalized, stored: parseStoredValue(raw) };
  } catch {
    return { key, fingerprint, normalized, stored: null };
  }
}

function isFresh(savedAt: number): boolean {
  return Date.now() - savedAt <= MONTH_CACHE_TTL_MS;
}

function datesMatch(cached: string[], requested: string[]): boolean {
  return [...cached].sort().join('|') === requested.join('|');
}

/**
 * Load month scores for a fully-specified scoring input.
 * Accepts v3 day maps and legacy v2 numeric records (scores only).
 * Rejects v1 city-only keys, fingerprint mismatch, incomplete maps,
 * expiry, and malformed values.
 */
export function loadMonthCache(
  input: CalendarScoringInput
): Record<string, number> | null {
  const loaded = readRawRecord(input);
  if (!loaded?.stored) return null;

  if (loaded.stored.kind === 'v3') {
    const record = loaded.stored.record;
    if (record.inputFingerprint !== loaded.fingerprint) return null;
    if (!isFresh(record.savedAt)) return null;
    if (!datesMatch(record.dates, loaded.normalized.dates)) return null;
    const scores = scoresFromCachedDays(record.days);
    if (!isCompleteScoreMap(scores, loaded.normalized.dates)) return null;
    return scores;
  }

  if (loaded.stored.inputFingerprint !== loaded.fingerprint) return null;
  if (!isFresh(loaded.stored.savedAt)) return null;
  if (!datesMatch(loaded.stored.dates, loaded.normalized.dates)) return null;
  if (!isCompleteScoreMap(loaded.stored.scores, loaded.normalized.dates)) {
    return null;
  }
  return { ...loaded.stored.scores };
}

/**
 * Load a v3 semantic month record. Legacy numeric v2 entries return null
 * so fetchMonthScores refreshes from /api/batch instead of serving empty
 * Day Intelligence indefinitely.
 */
export function loadMonthCacheRecord(
  input: CalendarScoringInput
): MonthCacheRecord | null {
  const loaded = readRawRecord(input);
  if (!loaded?.stored || loaded.stored.kind !== 'v3') return null;
  if (loaded.stored.record.inputFingerprint !== loaded.fingerprint) return null;
  if (!isFresh(loaded.stored.record.savedAt)) return null;
  if (!datesMatch(loaded.stored.record.dates, loaded.normalized.dates)) {
    return null;
  }
  const { days } = loaded.stored.record;
  if (!isCompleteDayMap(days, loaded.normalized.dates)) return null;
  if (!hasSemanticKeys(days, loaded.normalized.dates)) return null;
  return loaded.stored.record;
}

export function saveMonthCache(
  input: CalendarScoringInput,
  days: Record<string, CalendarCachedDay>,
  options?: { backendVersion?: string | null }
): void {
  if (typeof window === 'undefined') return;

  const normalized = normalizeCalendarScoringInput(input);
  if (!isCompleteDayMap(days, normalized.dates)) {
    // Never persist incomplete months — forces a clean refetch next time.
    return;
  }

  const fingerprint = fingerprintCalendarScoringInput(normalized);
  const key = monthCacheStorageKey(
    normalized.year,
    normalized.month,
    normalized.action_type,
    fingerprint
  );

  const record: MonthCacheRecord = {
    version: CALENDAR_CACHE_CONTENT_VERSION,
    scoringIdentityVersion: CALENDAR_CACHE_VERSION,
    inputFingerprint: fingerprint,
    savedAt: Date.now(),
    dates: [...normalized.dates],
    days: cloneJson(days),
    backendVersion: options?.backendVersion ?? null,
  };

  localStorage.setItem(key, JSON.stringify(record));
}

/** Clears v2 fingerprint caches (including v3 content) and legacy v1 keys. */
export function clearMonthScoreCaches(): void {
  if (typeof window === 'undefined') return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (
      key?.startsWith(V1_CACHE_PREFIX) ||
      key?.startsWith(V2_CACHE_PREFIX)
    ) {
      keys.push(key);
    }
  }
  for (const key of keys) {
    localStorage.removeItem(key);
  }
}

export function buildCalendarFetchDiagnostic(args: {
  cache: 'hit' | 'miss';
  input: CalendarScoringInput;
  scores: Record<string, number>;
  contentVersion?: CalendarScoreFetchDiagnostic['contentVersion'];
}): CalendarScoreFetchDiagnostic {
  const normalized = normalizeCalendarScoringInput(args.input);
  return {
    cache: args.cache,
    cacheVersion: CALENDAR_CACHE_VERSION,
    contentVersion: args.contentVersion ?? (args.cache === 'hit' ? CALENDAR_CACHE_CONTENT_VERSION : 'none'),
    inputFingerprint: fingerprintCalendarScoringInput(normalized),
    apiHost: API_BASE,
    dateCount: normalized.dates.length,
    scoreMapChecksum: scoreMapChecksum(args.scores),
  };
}

/** @deprecated v1 helper retained only for tests proving old keys are ignored. */
export function legacyV1MonthCacheKey(
  year: number,
  month: number,
  action: string,
  evalCity?: string
): string {
  const loc = evalCity ? evalCity.replace(/\s+/g, '_') : 'default';
  return `${V1_CACHE_PREFIX}${year}-${String(month).padStart(2, '0')}-${action}-${loc}`;
}

export function daysFromScoreMap(
  scores: Record<string, number>
): Record<string, CalendarCachedDay> {
  const days: Record<string, CalendarCachedDay> = {};
  for (const [date, score] of Object.entries(scores)) {
    days[date] = { score, dayIntelligence: null };
  }
  return days;
}

import { API_BASE } from './api-config';

/** Explicit cache / scoring-identity schema. Old v1 city-only entries are never reused. */
export const CALENDAR_CACHE_VERSION = 'v2' as const;

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

export type MonthCacheRecord = {
  version: string;
  inputFingerprint: string;
  savedAt: number;
  dates: string[];
  scores: Record<string, number>;
  backendVersion?: string | null;
};

export type CalendarScoreFetchDiagnostic = {
  cache: 'hit' | 'miss';
  cacheVersion: typeof CALENDAR_CACHE_VERSION;
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
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;
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

function isCompleteScoreMap(
  scores: Record<string, number>,
  dates: string[]
): boolean {
  if (!dates.length) return false;
  for (const date of dates) {
    const score = scores[date];
    if (typeof score !== 'number' || !Number.isFinite(score)) return false;
  }
  return true;
}

function parseCacheRecord(raw: string): MonthCacheRecord | null {
  try {
    const parsed = JSON.parse(raw) as Partial<MonthCacheRecord>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.version !== 'string') return null;
    if (typeof parsed.inputFingerprint !== 'string') return null;
    if (typeof parsed.savedAt !== 'number' || !Number.isFinite(parsed.savedAt)) {
      return null;
    }
    if (!Array.isArray(parsed.dates)) return null;
    if (!parsed.scores || typeof parsed.scores !== 'object') return null;
    return {
      version: parsed.version,
      inputFingerprint: parsed.inputFingerprint,
      savedAt: parsed.savedAt,
      dates: parsed.dates.filter((d): d is string => typeof d === 'string'),
      scores: parsed.scores as Record<string, number>,
      backendVersion:
        typeof parsed.backendVersion === 'string' || parsed.backendVersion == null
          ? parsed.backendVersion ?? null
          : null,
    };
  } catch {
    return null;
  }
}

/**
 * Load month scores for a fully-specified scoring input.
 * Rejects v1 city-only keys (never read), version/fingerprint mismatch,
 * incomplete maps, expiry, and malformed values.
 */
export function loadMonthCache(
  input: CalendarScoringInput
): Record<string, number> | null {
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
    if (!raw) return null;

    const record = parseCacheRecord(raw);
    if (!record) return null;
    if (record.version !== CALENDAR_CACHE_VERSION) return null;
    if (record.inputFingerprint !== fingerprint) return null;
    if (Date.now() - record.savedAt > MONTH_CACHE_TTL_MS) return null;
    if (!isCompleteScoreMap(record.scores, normalized.dates)) return null;

    // Ensure cached date list matches the requested identity.
    const cachedDates = [...record.dates].sort().join('|');
    const requestedDates = normalized.dates.join('|');
    if (cachedDates !== requestedDates) return null;

    return { ...record.scores };
  } catch {
    return null;
  }
}

export function saveMonthCache(
  input: CalendarScoringInput,
  scores: Record<string, number>,
  options?: { backendVersion?: string | null }
): void {
  if (typeof window === 'undefined') return;

  const normalized = normalizeCalendarScoringInput(input);
  if (!isCompleteScoreMap(scores, normalized.dates)) {
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
    version: CALENDAR_CACHE_VERSION,
    inputFingerprint: fingerprint,
    savedAt: Date.now(),
    dates: [...normalized.dates],
    scores: { ...scores },
    backendVersion: options?.backendVersion ?? null,
  };

  localStorage.setItem(key, JSON.stringify(record));
}

/** Clears v2 fingerprint caches and legacy v1 city-only caches. */
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
}): CalendarScoreFetchDiagnostic {
  const normalized = normalizeCalendarScoringInput(args.input);
  return {
    cache: args.cache,
    cacheVersion: CALENDAR_CACHE_VERSION,
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

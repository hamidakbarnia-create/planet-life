/**
 * Frontend-safe adapter for API component_breakdown.
 * UI should consume ScoreBreakdown — not raw snake_case API fields.
 */

export type LocationMode =
  | 'birthOnly'
  | 'currentLiving'
  | 'eventLocation'
  | 'targetSubject'
  | 'birthAndTarget';

/** Normalized score decomposition for UI layers. */
export interface ScoreBreakdown {
  aspectScore: number;
  natalHouseBonus: number;
  transitHouseScore: number;
  transitAngularScore: number;
  locationComponentScore: number;
  retrogradePenalty: number;
  finalScore: number;
  locationMode: LocationMode | string;
  calculatedFor: string;
  resolvedLocalDatetime: string;
  resolvedUtcDatetime: string;
  timezone: string;
  targetTime: string;
}

/** Raw API shape (snake_case) — internal to adapter only. */
export interface RawComponentBreakdown {
  aspect_score?: unknown;
  natal_house_bonus?: unknown;
  transit_house_score?: unknown;
  transit_angular_score?: unknown;
  location_component_score?: unknown;
  retrograde_penalty?: unknown;
  final_score?: unknown;
  location_mode?: unknown;
  calculated_for?: unknown;
  resolved_local_datetime?: unknown;
  resolved_utc_datetime?: unknown;
  timezone?: unknown;
  target_time?: unknown;
}

const LOCATION_SUM_TOLERANCE = 0.02;

function isDev(): boolean {
  return process.env.NODE_ENV === 'development';
}

function warnDev(message: string): void {
  if (isDev()) {
    console.warn(`[ScoreBreakdown] ${message}`);
  }
}

function readNumber(value: unknown, field: string): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    warnDev(`Invalid or missing numeric field: ${field}`);
    return null;
  }
  return value;
}

function readString(value: unknown, field: string): string | null {
  if (typeof value !== 'string' || value.trim() === '') {
    warnDev(`Invalid or missing string field: ${field}`);
    return null;
  }
  return value;
}

function readFinalScore(value: unknown): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    warnDev('Invalid or missing numeric field: final_score');
    return null;
  }
  return Math.round(value);
}

/**
 * Map raw API component_breakdown to camelCase ScoreBreakdown.
 * Returns null when missing or invalid — never throws in production UI path.
 */
export function mapComponentBreakdown(raw: unknown): ScoreBreakdown | null {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }

  const src = raw as RawComponentBreakdown;

  const aspectScore = readNumber(src.aspect_score, 'aspect_score');
  const natalHouseBonus = readNumber(src.natal_house_bonus, 'natal_house_bonus');
  const transitHouseScore = readNumber(src.transit_house_score, 'transit_house_score');
  const transitAngularScore = readNumber(
    src.transit_angular_score,
    'transit_angular_score'
  );
  const locationComponentScore = readNumber(
    src.location_component_score,
    'location_component_score'
  );
  const retrogradePenalty = readNumber(src.retrograde_penalty, 'retrograde_penalty');
  const finalScore = readFinalScore(src.final_score);
  const locationMode = readString(src.location_mode, 'location_mode');
  const calculatedFor = readString(src.calculated_for, 'calculated_for');
  const resolvedLocalDatetime = readString(
    src.resolved_local_datetime,
    'resolved_local_datetime'
  );
  const resolvedUtcDatetime = readString(
    src.resolved_utc_datetime,
    'resolved_utc_datetime'
  );
  const timezone = readString(src.timezone, 'timezone');
  const targetTime = readString(src.target_time, 'target_time');

  if (
    aspectScore == null ||
    natalHouseBonus == null ||
    transitHouseScore == null ||
    transitAngularScore == null ||
    locationComponentScore == null ||
    retrogradePenalty == null ||
    finalScore == null ||
    locationMode == null ||
    calculatedFor == null ||
    resolvedLocalDatetime == null ||
    resolvedUtcDatetime == null ||
    timezone == null ||
    targetTime == null
  ) {
    return null;
  }

  const expectedLocationScore = round2(transitHouseScore + transitAngularScore);
  if (Math.abs(locationComponentScore - expectedLocationScore) > LOCATION_SUM_TOLERANCE) {
    warnDev(
      `location_component_score (${locationComponentScore}) != transit_house_score + transit_angular_score (${expectedLocationScore})`
    );
    return null;
  }

  return {
    aspectScore,
    natalHouseBonus,
    transitHouseScore,
    transitAngularScore,
    locationComponentScore,
    retrogradePenalty,
    finalScore,
    locationMode,
    calculatedFor,
    resolvedLocalDatetime,
    resolvedUtcDatetime,
    timezone,
    targetTime,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Extract breakdown from a full analyze/batch-day API payload. */
export function extractAnalyzeScoreBreakdown(data: unknown): ScoreBreakdown | null {
  if (data == null || typeof data !== 'object') return null;
  const strategic = (data as { strategic?: { component_breakdown?: unknown } }).strategic;
  return mapComponentBreakdown(strategic?.component_breakdown);
}

/** Extract breakdown from a calendar hourly batch entry. */
export function extractHourlyScoreBreakdown(entry: unknown): ScoreBreakdown | null {
  if (entry == null || typeof entry !== 'object') return null;
  return mapComponentBreakdown(
    (entry as { component_breakdown?: unknown }).component_breakdown
  );
}

/** Parsed analyze response with optional normalized breakdown. */
export interface ParsedAnalyzeResponse {
  score: number | null;
  breakdown: ScoreBreakdown | null;
}

export function parseAnalyzeResponse(data: unknown): ParsedAnalyzeResponse {
  if (data == null || typeof data !== 'object') {
    return { score: null, breakdown: null };
  }
  const payload = data as { executive?: { score?: unknown }; detail?: unknown };
  if (payload.detail) {
    return { score: null, breakdown: null };
  }
  const score =
    typeof payload.executive?.score === 'number' && !Number.isNaN(payload.executive.score)
      ? payload.executive.score
      : null;
  return {
    score,
    breakdown: extractAnalyzeScoreBreakdown(data),
  };
}

/** Calendar month fetch bundle — scores for UI + breakdown map. */
export interface MonthScoresResult {
  scores: Record<string, number>;
  breakdowns: Record<string, ScoreBreakdown | null>;
}

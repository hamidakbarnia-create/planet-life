import type { BirthProfile } from './birth-profile';
import { chartPreferenceFields } from './app-settings';
import {
  extractAnalyzeScoreBreakdown,
  extractHourlyScoreBreakdown,
  parseAnalyzeResponse,
  type MonthScoresResult,
  type ScoreBreakdown,
} from './score-breakdown';
import { extractBatchDayReasoning } from './score-reasoning';
import type { ScoreReasoning } from './score-reasoning';
import {
  buildScoringLocationPayload,
  resolveCalendarEvaluationLocation,
  type UserLocation,
} from './user-locations';
import {
  scoreToBand,
  type ScoreBand,
} from './timing-presentation';
import {
  loadMonthCache,
  saveMonthCache,
} from './calendar-cache';

import {
  postCalendarAnalyze,
  postCalendarBatch,
  postCalendarBatchHourly,
  postCalendarTransit,
} from './calendar-client';

export { API_BASE } from './api-config';

export interface DayScore {
  date: string;
  score: number;
  rating?: string;
  breakdown?: ScoreBreakdown | null;
}

export interface HourScore {
  hour: number;
  time: string;
  score: number;
  band: ScoreBand;
  breakdown?: ScoreBreakdown | null;
}

export type { MonthScoresResult, ScoreBreakdown };
export type { ScoreReasoning } from './score-reasoning';
export {
  BAND_STYLES,
  formatHourLabel,
  isDangerHour,
  isGoldenHour,
  scoreToBand,
  type ScoreBand,
} from './timing-presentation';
export {
  loadMonthCache,
  saveMonthCache,
} from './calendar-cache';

export function scoringLocationFields(
  profile: BirthProfile,
  evaluation?: UserLocation | null
): Record<string, string | number> | null {
  const payload = buildScoringLocationPayload(
    profile,
    evaluation ?? resolveCalendarEvaluationLocation(profile)
  );
  if (!payload) return null;
  const out: Record<string, string | number> = {
    location: payload.location,
    evaluation_location: payload.evaluation_location,
  };
  if (payload.evaluation_latitude != null) {
    out.evaluation_latitude = payload.evaluation_latitude;
  }
  if (payload.evaluation_longitude != null) {
    out.evaluation_longitude = payload.evaluation_longitude;
  }
  if (payload.evaluation_timezone) {
    out.evaluation_timezone = payload.evaluation_timezone;
  }
  return out;
}

export async function fetchDayScore(
  profile: BirthProfile,
  targetDate: string,
  targetTime?: string,
  evaluation?: UserLocation | null
): Promise<number | null> {
  const detail = await fetchDayScoreDetail(profile, targetDate, targetTime, evaluation);
  return detail.score;
}

export async function fetchDayScoreDetail(
  profile: BirthProfile,
  targetDate: string,
  targetTime?: string,
  evaluation?: UserLocation | null
): Promise<{ score: number | null; breakdown: ScoreBreakdown | null }> {
  const locFields = scoringLocationFields(profile, evaluation);
  if (!locFields) return { score: null, breakdown: null };
  try {
    const res = await postCalendarAnalyze({
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      action_type: profile.action_type,
      target_date: targetDate,
      ...(targetTime ? { target_time: targetTime } : {}),
      ...locFields,
      ...chartPreferenceFields(),
    });
    const data = await res.json();
    return parseAnalyzeResponse(data);
  } catch {
    return { score: null, breakdown: null };
  }
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function formatDateYMD(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker)
  );
  return results;
}

export async function fetchMonthScores(
  profile: BirthProfile,
  year: number,
  month: number,
  onProgress?: (done: number, total: number) => void,
  evaluation?: UserLocation | null
): Promise<MonthScoresResult> {
  const evalLoc = evaluation ?? resolveCalendarEvaluationLocation(profile);
  const evalLabel = evalLoc?.city;
  const locFields = scoringLocationFields(profile, evalLoc);
  if (!locFields) return { scores: {}, breakdowns: {}, reasoning: {} };

  const cached = loadMonthCache(year, month, profile.action_type, evalLabel);
  if (cached) return { scores: cached, breakdowns: {}, reasoning: {} };

  const total = daysInMonth(year, month);
  const dates = Array.from({ length: total }, (_, i) =>
    formatDateYMD(year, month, i + 1)
  );

  onProgress?.(0, total);

  const prefs = chartPreferenceFields();
  const scores: Record<string, number> = {};
  const breakdowns: Record<string, ScoreBreakdown | null> = {};
  const reasoning: Record<string, ScoreReasoning | null> = {};

  try {
    const res = await postCalendarBatch({
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      action_type: profile.action_type,
      dates,
      house_system: prefs.house_system,
      zodiac: prefs.zodiac,
      ...locFields,
    });
    const data = await res.json();
    if (data.scores && typeof data.scores === 'object') {
      for (const [date, payload] of Object.entries(data.scores)) {
        const entry = payload as {
          executive?: { score?: number };
          error?: string;
        };
        const score = entry.executive?.score;
        if (typeof score === 'number' && !Number.isNaN(score)) {
          scores[date] = score;
        }
        breakdowns[date] = extractAnalyzeScoreBreakdown(payload);
        reasoning[date] = extractBatchDayReasoning(payload);
      }
    }
  } catch {
    // leave scores empty on failure
  }

  onProgress?.(total, total);
  saveMonthCache(year, month, profile.action_type, scores, evalLabel);
  return { scores, breakdowns, reasoning };
}

export async function fetchHourlyScores(
  profile: BirthProfile,
  targetDate: string,
  evaluation?: UserLocation | null
): Promise<HourScore[]> {
  const locFields = scoringLocationFields(
    profile,
    evaluation ?? resolveCalendarEvaluationLocation(profile)
  );
  if (!locFields) return [];
  const prefs = chartPreferenceFields();

  // Prefer the new single-request hourly batch (parallelised on the backend).
  try {
    const res = await postCalendarBatchHourly({
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      action_type: profile.action_type,
      target_date: targetDate,
      house_system: prefs.house_system,
      zodiac: prefs.zodiac,
      ...locFields,
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.hours && typeof data.hours === 'object') {
        const out: HourScore[] = [];
        for (let hour = 0; hour < 24; hour++) {
          const entry = (data.hours as Record<string, { score?: number; error?: string }>)[
            String(hour)
          ];
          const score = typeof entry?.score === 'number' ? entry.score : 0;
          out.push({
            hour,
            time: `${String(hour).padStart(2, '0')}:00`,
            score,
            band: scoreToBand(entry?.score),
            breakdown: extractHourlyScoreBreakdown(entry),
          });
        }
        return out;
      }
    }
  } catch {
    // fall through to per-hour fallback
  }

  // Fallback: per-hour /analyze calls if the batch endpoint isn't available.
  const hours = Array.from({ length: 24 }, (_, h) => h);
  const results = await mapPool(hours, 12, async (hour) => {
    const time = `${String(hour).padStart(2, '0')}:00`;
    const detail = await fetchDayScoreDetail(profile, targetDate, time, evaluation);
    const s = detail.score ?? 0;
    return {
      hour,
      time,
      score: s,
      band: scoreToBand(detail.score),
      breakdown: detail.breakdown,
    };
  });
  return results.sort((a, b) => a.hour - b.hour);
}

// ── Transit snapshot (per-day astrology details for the calendar) ──────────

export interface PlanetTransit {
  name: string;
  longitude: number;
  sign: string;
  signIndex: number;
  degreeInSign: number;
  house?: number;
  retrograde?: boolean;
}

export interface TransitSnapshotMeta {
  calculatedFor?: string;
  timezone?: string;
  localIso?: string;
  utcIso?: string;
}

export interface TransitSnapshotResult {
  planets: PlanetTransit[];
  meta: TransitSnapshotMeta;
}

const ZODIAC_SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

function longitudeToSign(longitude: number) {
  const lon = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(lon / 30);
  return {
    sign: ZODIAC_SIGNS[signIndex] ?? 'Aries',
    signIndex,
    degreeInSign: lon - signIndex * 30,
  };
}

export async function fetchTransitSnapshot(
  profile: BirthProfile,
  targetDate: string,
  targetTime?: string,
  evaluation?: UserLocation | null
): Promise<TransitSnapshotResult> {
  const locFields = scoringLocationFields(
    profile,
    evaluation ?? resolveCalendarEvaluationLocation(profile)
  );
  if (!locFields) return { planets: [], meta: {} };
  const prefs = chartPreferenceFields();
  try {
    const res = await postCalendarTransit({
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      target_date: targetDate,
      ...(targetTime ? { target_time: targetTime } : {}),
      house_system: prefs.house_system,
      zodiac: prefs.zodiac,
      ...locFields,
    });
    if (!res.ok) return { planets: [], meta: {} };
    const data = await res.json();
    const planets = data?.transit ?? {};
    const ctx = (data?.location_context ?? {}) as Record<string, unknown>;
    const out: PlanetTransit[] = [];
    for (const [name, raw] of Object.entries(planets)) {
      const body = raw as {
        longitude?: number;
        house?: number;
        retrograde?: boolean;
      };
      if (typeof body?.longitude !== 'number') continue;
      const sign = longitudeToSign(body.longitude);
      out.push({
        name,
        longitude: body.longitude,
        sign: sign.sign,
        signIndex: sign.signIndex,
        degreeInSign: sign.degreeInSign,
        house: body.house,
        retrograde: body.retrograde === true,
      });
    }
    return {
      planets: out,
      meta: {
        calculatedFor:
          typeof ctx.calculated_for === 'string'
            ? ctx.calculated_for
            : typeof ctx.location === 'string'
              ? ctx.location
              : undefined,
        timezone: typeof ctx.timezone === 'string' ? ctx.timezone : undefined,
        localIso:
          typeof ctx.resolved_local_datetime === 'string'
            ? ctx.resolved_local_datetime
            : undefined,
        utcIso:
          typeof ctx.resolved_utc_datetime === 'string'
            ? ctx.resolved_utc_datetime
            : typeof ctx.calculation_instant === 'string'
              ? ctx.calculation_instant
              : undefined,
      },
    };
  } catch {
    return { planets: [], meta: {} };
  }
}

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

// Backend base URL. Override at build/dev time with NEXT_PUBLIC_API_BASE
// (e.g. when sharing the app over a Cloudflare/ngrok tunnel).
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000';

export type ScoreBand = 'green' | 'yellow' | 'orange' | 'red' | 'empty';

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

export function scoreToBand(score: number | null | undefined): ScoreBand {
  if (score == null || Number.isNaN(score)) return 'empty';
  if (score >= 85) return 'green';
  if (score >= 60) return 'yellow';
  if (score >= 40) return 'orange';
  return 'red';
}

export const BAND_STYLES: Record<
  ScoreBand,
  { bg: string; border: string; text: string }
> = {
  green: {
    bg: 'rgba(74,222,128,0.32)',
    border: '#4ade80',
    text: '#4ade80',
  },
  yellow: {
    bg: 'rgba(251,191,36,0.28)',
    border: '#fbbf24',
    text: '#fbbf24',
  },
  orange: {
    bg: 'rgba(251,146,60,0.28)',
    border: '#fb923c',
    text: '#fb923c',
  },
  red: {
    bg: 'rgba(248,113,113,0.28)',
    border: '#f87171',
    text: '#f87171',
  },
  empty: {
    bg: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.1)',
    text: 'rgba(255,255,255,0.25)',
  },
};

function cacheKey(year: number, month: number, action: string, evalCity?: string) {
  const loc = evalCity ? evalCity.replace(/\s+/g, '_') : 'default';
  return `planet-life-cal-${year}-${String(month).padStart(2, '0')}-${action}-${loc}`;
}

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
  return out;
}

export function loadMonthCache(
  year: number,
  month: number,
  action: string,
  evalCity?: string
): Record<string, number> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(cacheKey(year, month, action, evalCity));
    if (!raw) return null;
    const { scores, savedAt } = JSON.parse(raw) as {
      scores: Record<string, number>;
      savedAt: number;
    };
    if (Date.now() - savedAt > 1000 * 60 * 60 * 12) return null;
    return scores;
  } catch {
    return null;
  }
}

export function saveMonthCache(
  year: number,
  month: number,
  action: string,
  scores: Record<string, number>,
  evalCity?: string
) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    cacheKey(year, month, action, evalCity),
    JSON.stringify({ scores, savedAt: Date.now() })
  );
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
    const res = await fetch(`${API_BASE}/api/business/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        birth_date: profile.birth_date,
        birth_time: profile.birth_time,
        action_type: profile.action_type,
        target_date: targetDate,
        ...(targetTime ? { target_time: targetTime } : {}),
        ...locFields,
        ...chartPreferenceFields(),
      }),
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

// Format an hour (0-23) for display. English uses 12-hour with AM/PM
// (e.g. 18 -> "6:00 PM"), other locales keep 24-hour (e.g. "18:00") which
// is the native convention there.
export function formatHourLabel(hour: number, lang: string = 'en'): string {
  const safe = ((hour % 24) + 24) % 24;
  if (lang === 'en') {
    const period = safe >= 12 ? 'PM' : 'AM';
    const h12 = safe % 12 === 0 ? 12 : safe % 12;
    return `${h12}:00 ${period}`;
  }
  return `${String(safe).padStart(2, '0')}:00`;
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
    const res = await fetch(`${API_BASE}/api/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        birth_date: profile.birth_date,
        birth_time: profile.birth_time,
        action_type: profile.action_type,
        dates,
        house_system: prefs.house_system,
        zodiac: prefs.zodiac,
        ...locFields,
      }),
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
    const res = await fetch(`${API_BASE}/api/batch-hourly`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        birth_date: profile.birth_date,
        birth_time: profile.birth_time,
        action_type: profile.action_type,
        target_date: targetDate,
        house_system: prefs.house_system,
        zodiac: prefs.zodiac,
        ...locFields,
      }),
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
): Promise<PlanetTransit[]> {
  const locFields = scoringLocationFields(
    profile,
    evaluation ?? resolveCalendarEvaluationLocation(profile)
  );
  if (!locFields) return [];
  const prefs = chartPreferenceFields();
  try {
    const res = await fetch(`${API_BASE}/api/transit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        birth_date: profile.birth_date,
        birth_time: profile.birth_time,
        target_date: targetDate,
        ...(targetTime ? { target_time: targetTime } : {}),
        house_system: prefs.house_system,
        zodiac: prefs.zodiac,
        ...locFields,
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const planets = data?.transit ?? {};
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
    return out;
  } catch {
    return [];
  }
}

export function isGoldenHour(score: number) {
  return score >= 85;
}

export function isDangerHour(score: number) {
  return score <= 39;
}

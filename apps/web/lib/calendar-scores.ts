import type { BirthProfile } from './birth-profile';
import { chartPreferenceFields } from './app-settings';

export const API_BASE = 'http://localhost:8000';

export type ScoreBand = 'green' | 'yellow' | 'orange' | 'red' | 'empty';

export interface DayScore {
  date: string;
  score: number;
  rating?: string;
}

export interface HourScore {
  hour: number;
  time: string;
  score: number;
  band: ScoreBand;
}

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

function cacheKey(year: number, month: number, action: string) {
  return `planet-life-cal-${year}-${String(month).padStart(2, '0')}-${action}`;
}

export function loadMonthCache(
  year: number,
  month: number,
  action: string
): Record<string, number> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(cacheKey(year, month, action));
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
  scores: Record<string, number>
) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    cacheKey(year, month, action),
    JSON.stringify({ scores, savedAt: Date.now() })
  );
}

export async function fetchDayScore(
  profile: BirthProfile,
  targetDate: string,
  targetTime?: string
): Promise<number | null> {
  try {
    const res = await fetch(`${API_BASE}/api/business/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        birth_date: profile.birth_date,
        birth_time: profile.birth_time,
        location: profile.location,
        action_type: profile.action_type,
        target_date: targetDate,
        ...(targetTime ? { target_time: targetTime } : {}),
        ...chartPreferenceFields(),
      }),
    });
    const data = await res.json();
    if (data.detail) return null;
    return data.executive?.score ?? null;
  } catch {
    return null;
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
  onProgress?: (done: number, total: number) => void
): Promise<Record<string, number>> {
  const cached = loadMonthCache(year, month, profile.action_type);
  if (cached) return cached;

  const total = daysInMonth(year, month);
  const dates = Array.from({ length: total }, (_, i) =>
    formatDateYMD(year, month, i + 1)
  );

  let done = 0;
  const pairs = await mapPool(dates, 4, async (date) => {
    const score = await fetchDayScore(profile, date);
    done += 1;
    onProgress?.(done, total);
    return [date, score ?? -1] as const;
  });

  const scores: Record<string, number> = {};
  pairs.forEach(([date, score]) => {
    if (score >= 0) scores[date] = score;
  });

  saveMonthCache(year, month, profile.action_type, scores);
  return scores;
}

export async function fetchHourlyScores(
  profile: BirthProfile,
  targetDate: string
): Promise<HourScore[]> {
  const hours = Array.from({ length: 24 }, (_, h) => h);
  const results = await mapPool(hours, 4, async (hour) => {
    const time = `${String(hour).padStart(2, '0')}:00`;
    const score = await fetchDayScore(profile, targetDate, time);
    const s = score ?? 0;
    return { hour, time, score: s, band: scoreToBand(score) };
  });
  return results.sort((a, b) => a.hour - b.hour);
}

export function isGoldenHour(score: number) {
  return score >= 85;
}

export function isDangerHour(score: number) {
  return score <= 39;
}

/** Timing windows for Pathfinder — reuses calendar score APIs. */

import type { BirthProfile } from '@/lib/birth-profile';
import {
  fetchDayScore,
  fetchMonthScores,
  scoreToBand,
} from '@/lib/calendar-scores';
import { todayYMD } from '@/lib/calendar-utils';
import type { DecisionTiming, TimingWindow } from './types';
import type { TimingSignals } from './scores';

function addDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatRange(start: string, end: string): string {
  return start === end ? start : `${start} → ${end}`;
}

function windowFrom(
  label: string,
  dateRange: string,
  score: number,
  note: string
): TimingWindow {
  return { label, dateRange, score: Math.max(0, Math.min(100, Math.round(score))), note };
}

function bestInScores(
  scores: Record<string, number>,
  from: string,
  to: string
): { date: string; score: number } | null {
  let best: { date: string; score: number } | null = null;
  for (const [date, score] of Object.entries(scores)) {
    if (date < from || date > to) continue;
    if (!best || score > best.score) best = { date, score };
  }
  return best;
}

function worstInScores(
  scores: Record<string, number>,
  from: string,
  to: string
): { date: string; score: number } | null {
  let worst: { date: string; score: number } | null = null;
  for (const [date, score] of Object.entries(scores)) {
    if (date < from || date > to) continue;
    if (!worst || score < worst.score) worst = { date, score };
  }
  return worst;
}

/**
 * Load timing signals from existing analyze/batch endpoints.
 * Falls back to neutral signals if profile/API unavailable (scores still filled later).
 */
export async function loadPathfinderTiming(
  profile: BirthProfile | null
): Promise<{ timing: DecisionTiming; signals: TimingSignals }> {
  const today = todayYMD();
  const weekEnd = addDays(today, 6);
  const monthEnd = addDays(today, 27);

  if (!profile) {
    const neutral = 50;
    return {
      signals: { todayScore: null, weekScore: null, monthScore: null, avoidScore: null },
      timing: {
        bestToday: windowFrom('Best Today', today, neutral, 'Add a birth profile to personalize timing.'),
        bestThisWeek: windowFrom('Best This Week', formatRange(today, weekEnd), neutral, 'Timing engine needs a saved profile.'),
        bestThisMonth: windowFrom('Best This Month', formatRange(today, monthEnd), neutral, 'Timing engine needs a saved profile.'),
        avoidWindow: windowFrom('Avoid Window', formatRange(today, weekEnd), neutral, 'No avoid window until profile timing loads.'),
      },
    };
  }

  const [todayScore, monthResult] = await Promise.all([
    fetchDayScore(profile, today),
    (async () => {
      const y = Number(today.slice(0, 4));
      const m = Number(today.slice(5, 7));
      try {
        return await fetchMonthScores(profile, y, m);
      } catch {
        return null;
      }
    })(),
  ]);

  const scores = monthResult?.scores ?? {};
  const weekBest = bestInScores(scores, today, weekEnd);
  const monthBest = bestInScores(scores, today, monthEnd);
  const avoid = worstInScores(scores, today, monthEnd);

  const todayVal = todayScore ?? weekBest?.score ?? 52;
  const weekVal = weekBest?.score ?? todayVal;
  const monthVal = monthBest?.score ?? weekVal;
  const avoidVal = avoid?.score ?? Math.max(5, 100 - monthVal);

  const signals: TimingSignals = {
    todayScore: todayScore,
    weekScore: weekBest?.score ?? null,
    monthScore: monthBest?.score ?? null,
    avoidScore: avoid?.score ?? null,
  };

  return {
    signals,
    timing: {
      bestToday: windowFrom(
        'Best Today',
        today,
        todayVal,
        `Band: ${scoreToBand(todayVal)}. Use for reversible moves.`
      ),
      bestThisWeek: windowFrom(
        'Best This Week',
        weekBest ? weekBest.date : formatRange(today, weekEnd),
        weekVal,
        weekBest ? 'Highest-scoring day in the next 7 days.' : 'Week window estimated from available signals.'
      ),
      bestThisMonth: windowFrom(
        'Best This Month',
        monthBest ? monthBest.date : formatRange(today, monthEnd),
        monthVal,
        monthBest ? 'Peak day in the current month search.' : 'Month window estimated from available signals.'
      ),
      avoidWindow: windowFrom(
        'Avoid Window',
        avoid ? avoid.date : formatRange(today, weekEnd),
        avoidVal,
        avoid
          ? 'Lowest-scoring day in range — defer irreversible commitments.'
          : 'Avoid window inferred from inverse timing pressure.'
      ),
    },
  };
}

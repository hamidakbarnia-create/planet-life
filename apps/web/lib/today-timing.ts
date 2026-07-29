import type { AppLang } from './app-settings';
import type { BirthProfile } from './birth-profile';
import {
  fetchDayScoreDetail,
  fetchHourlyScores,
  type HourScore,
  type ScoreReasoning,
} from './calendar-scores';
import type { ParsedAnalyzeResponse } from './score-breakdown';
import { buildStrategicGps } from './strategic-gps';

export type TodayTimingBundle = {
  score: number | null;
  reasoning: ScoreReasoning | null;
  hourly: HourScore[];
  bestHour: HourScore | null;
  riskHour: HourScore | null;
};

/**
 * Today as a pure consumer of existing Calendar timing APIs.
 * ScoreReasoning is taken from the analyze response already returned by
 * fetchDayScoreDetail (runtime shape = ParsedAnalyzeResponse). No new scoring.
 */
export async function loadTodayTiming(
  profile: BirthProfile,
  targetDate: string,
  lang: AppLang
): Promise<TodayTimingBundle> {
  const [detailRaw, hourly] = await Promise.all([
    fetchDayScoreDetail(profile, targetDate),
    fetchHourlyScores(profile, targetDate),
  ]);

  // Implementation returns parseAnalyzeResponse; public type currently omits reasoning.
  const detail = detailRaw as ParsedAnalyzeResponse;
  const gps = buildStrategicGps({}, hourly, lang);

  return {
    score: detail.score,
    reasoning: detail.reasoning ?? null,
    hourly,
    bestHour: gps.bestHour,
    riskHour: gps.riskHour,
  };
}

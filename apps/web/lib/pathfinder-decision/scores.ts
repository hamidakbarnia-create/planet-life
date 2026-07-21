/** Derive Pathfinder decision scores from timing signals + clarification (0–100, never empty). */

import type { PathfinderRiskContext } from '@/lib/intelligence';
import type { PathfinderProfileContext } from '@/lib/intelligence-profile';
import type { ClarificationAnswer, DecisionCategory, DecisionScores } from './types';

export type TimingSignals = {
  todayScore: number | null;
  weekScore: number | null;
  monthScore: number | null;
  avoidScore: number | null;
};

/** Accepts legacy PathfinderProfileContext or Core PathfinderRiskContext. */
export type IntelligenceScoreInput =
  | PathfinderProfileContext
  | PathfinderRiskContext
  | null
  | undefined;

function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function blob(answers: ClarificationAnswer[], decisionText: string): string {
  return `${decisionText} ${answers.map((a) => a.answer).join(' ')}`.toLowerCase();
}

function urgencyPressure(text: string): number {
  if (/(this week|asap|urgent|immediately|today)/.test(text)) return 85;
  if (/(this month|soon|deadline)/.test(text)) return 65;
  if (/(this quarter|few months)/.test(text)) return 45;
  if (/(no hard deadline|whenever|flexible)/.test(text)) return 25;
  return 50;
}

function resolveRiskTilt(
  intelligence: IntelligenceScoreInput
): 'balanced' | 'cautious' | 'bold' | undefined {
  if (!intelligence) return undefined;
  if ('riskOrientation' in intelligence && intelligence.riskOrientation) {
    return intelligence.riskOrientation;
  }
  if ('riskTilt' in intelligence) return intelligence.riskTilt;
  return undefined;
}

function riskPressure(
  text: string,
  category: DecisionCategory | null,
  riskTilt?: 'balanced' | 'cautious' | 'bold'
): number {
  let base = 40;
  if (/(permanent|irreversible|nearly permanent|costly to reverse)/.test(text)) base += 25;
  if (/(easily reversible)/.test(text)) base -= 20;
  if (/(afraid|worry|concern|risk|downside)/.test(text)) base += 15;
  if (category === 'Investment' || category === 'Relocation') base += 8;
  if (category === 'Health') base += 5;
  if (riskTilt === 'cautious') base += 8;
  if (riskTilt === 'bold') base -= 6;
  return clampScore(base);
}

function confidenceFromUncertainty(uncertainty: string | null | undefined): number | null {
  if (!uncertainty) return null;
  const u = uncertainty.toLowerCase();
  if (/(high confidence|low uncertainty|clear)/.test(u)) return 78;
  if (/(moderate|medium)/.test(u)) return 58;
  if (/(high uncertainty|unclear|ambiguous)/.test(u)) return 38;
  return 55;
}

function isFastDecision(intelligence: IntelligenceScoreInput): boolean {
  if (!intelligence) return false;
  return intelligence.decisionStyles.some((s) =>
    /fast|execution-focused|exploratory/i.test(s)
  );
}

function isPatientDecision(intelligence: IntelligenceScoreInput): boolean {
  if (!intelligence) return false;
  if (resolveRiskTilt(intelligence) === 'cautious') return true;
  return intelligence.decisionStyles.some((s) =>
    /patient|cautious|deliberate|strategic/i.test(s)
  );
}

/**
 * Build GO / WAIT / Risk / Timing / Confidence from real timing API signals
 * and clarification content. Always returns filled 0–100 scores.
 * Intelligence context is optional — Pathfinder works without a profile.
 */
export function deriveDecisionScores(
  timing: TimingSignals,
  answers: ClarificationAnswer[],
  decisionText: string,
  category: DecisionCategory | null,
  conversationUncertainty?: string | null,
  intelligence?: IntelligenceScoreInput
): DecisionScores {
  const text = blob(answers, decisionText);
  const timingRaw =
    timing.todayScore ?? timing.weekScore ?? timing.monthScore ?? 52;
  const timingScore = clampScore(timingRaw);
  const riskTilt = resolveRiskTilt(intelligence);
  const risk = riskPressure(text, category, riskTilt);
  const urgency = urgencyPressure(text);
  const confFromApi = confidenceFromUncertainty(conversationUncertainty);
  const confidence = clampScore(
    confFromApi ??
      40 +
        (answers.length / 5) * 25 +
        (timing.todayScore != null ? 15 : 0) -
        (risk > 70 ? 10 : 0)
  );

  let go = timingScore * 0.5 + (100 - risk) * 0.35 + confidence * 0.15;
  if (urgency >= 75) go += 4;
  if (isFastDecision(intelligence)) go += 3;
  if (isPatientDecision(intelligence)) go -= 2;
  go = clampScore(go);

  let wait = clampScore(100 - go + (urgency < 40 ? 8 : 0) - (urgency > 80 ? 10 : 0));
  if (Math.abs(go - wait) < 4) {
    wait = clampScore(wait + (go >= 50 ? -5 : 5));
  }

  return {
    go,
    wait,
    risk: clampScore(risk),
    timing: timingScore,
    confidence,
  };
}

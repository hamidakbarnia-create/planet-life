/** Opportunity zones — controlled zone ids, scores 0–100. */

import type {
  IntelligenceSeed,
  OpportunityZoneId,
  OpportunityZoneInsight,
  TimingContextInput,
} from './types';
import { OPPORTUNITY_ZONE_IDS } from './types';
import { clampScore, confidenceFromGaps } from './util';

const ZONE_COPY: Record<
  OpportunityZoneId,
  { rationale: string; bestUse: string; caution: string }
> = {
  career: {
    rationale: 'Timing anchors favor structured progress against clear role goals.',
    bestUse: 'Prioritize one career lever with a weekly review.',
    caution: 'Do not treat the score as a promotion forecast.',
  },
  business: {
    rationale: 'Profile pattern supports option generation and staged launches.',
    bestUse: 'Pilot offers before full commitment.',
    caution: 'Avoid all-or-nothing launches on low readiness days.',
  },
  money: {
    rationale: 'Analytical banding supports deliberate capital decisions.',
    bestUse: 'Set downside limits before allocating.',
    caution: 'Score is comparative — not market advice.',
  },
  relationships: {
    rationale: 'Relational decisions benefit from communication clarity windows.',
    bestUse: 'Schedule important conversations in stronger energy bands.',
    caution: 'Not a relationship outcome prediction.',
  },
  learning: {
    rationale: 'Learning speed / pattern signals support skill acquisition.',
    bestUse: 'Pair study with a small applied experiment.',
    caution: 'Completion still depends on practice design.',
  },
  travel: {
    rationale: 'Movement and context change can stimulate option quality.',
    bestUse: 'Use travel for exploration when decisions are reversible.',
    caution: 'Do not schedule irreversible moves solely around travel windows.',
  },
  networking: {
    rationale: 'Collaborative bias improves signal from trusted peers.',
    bestUse: 'Ask for one dissenting view before major locks.',
    caution: 'Volume of contacts ≠ decision quality.',
  },
  creativity: {
    rationale: 'Creative banding supports alternative framing under constraints.',
    bestUse: 'Force a third option before binary choices.',
    caution: 'Novelty without checkpoints increases execution risk.',
  },
  leadership: {
    rationale: 'Influence patterns favor clarifying ownership and outcomes.',
    bestUse: 'Lead decisions by stating criteria and next owner.',
    caution: 'Leadership here means influence, not job title.',
  },
  wellbeing: {
    rationale: 'Recovery windows affect decision quality under load.',
    bestUse: 'Protect recovery before high-stakes calls.',
    caution: 'Not medical advice — schedule rest as a decision input.',
  },
};

export function buildOpportunityZones(
  seed: IntelligenceSeed,
  derivedAt: string,
  timing?: TimingContextInput | null
): OpportunityZoneInsight[] {
  void derivedAt;
  const timingBoost =
    timing?.todayScore != null ? clampScore((timing.todayScore - 50) / 5) : 0;

  const weights: Record<OpportunityZoneId, number> = {
    career: 55 + (seed.deepWorkBias ? 18 : 4),
    business: 50 + (seed.collaborativeBias ? 8 : 14),
    money: 48 + (seed.analyticalBias ? 16 : 6),
    relationships: 50 + (seed.dow % 2 === 0 ? 12 : 6),
    learning: 52 + (seed.creativeBias ? 14 : 8),
    travel: 42 + (seed.month % 3 === 0 ? 18 : 5),
    networking: 45 + (seed.collaborativeBias ? 20 : 3),
    creativity: 48 + (seed.creativeBias ? 18 : 4),
    leadership: 50 + (seed.analyticalBias ? 10 : seed.collaborativeBias ? 12 : 6),
    wellbeing: 46 + (seed.eveningBias ? 12 : 6),
  };

  return OPPORTUNITY_ZONE_IDS.map((zone) => {
    const copy = ZONE_COPY[zone];
    const score = clampScore(weights[zone] + (seed.h % 7) - 3 + timingBoost);
    return {
      zone,
      score,
      rationale: copy.rationale,
      bestUse: copy.bestUse,
      caution: copy.caution,
      confidence: confidenceFromGaps(
        seed.missing,
        timing?.todayScore != null ? 70 : 60,
        'Opportunity scores are relative strengths across zones, not forecasts.',
        ['Do not interpret as certainty of outcomes.']
      ),
    };
  }).sort((a, b) => b.score - a.score);
}

/** Growth areas — 3 to 5 actionable practices. */

import type {
  BlindSpotInsight,
  GrowthAreaInsight,
  IntelligenceSeed,
} from './types';
import { confidenceFromGaps } from './util';

export function buildGrowthAreas(
  seed: IntelligenceSeed,
  blindSpots: BlindSpotInsight[]
): GrowthAreaInsight[] {
  const conf = () =>
    confidenceFromGaps(
      seed.missing,
      62,
      'Growth areas are decision-practice recommendations, not self-help promises.'
    );

  const items: GrowthAreaInsight[] = [
    {
      area: 'Reversible-first commitments',
      reason: 'Irreversible moves without pilots raise downside.',
      specificPractice:
        'Define a 48-hour reversible experiment before any irreversible commitment.',
      successSignal: 'Every major decision log includes a pilot step and date.',
      reviewPeriod: 'Monthly',
      confidence: conf(),
    },
    {
      area: blindSpots[0]?.label ?? 'Primary blind-spot watch',
      reason: blindSpots[0]
        ? `Pattern “${blindSpots[0].label}” appears under load.`
        : 'Unnamed risk slows recovery after decisions.',
      specificPractice: blindSpots[0]
        ? blindSpots[0].practicalMitigation
        : 'Name your top risk in one sentence before deciding.',
      successSignal: 'One explicit checkpoint attached to the next high-stakes decision.',
      reviewPeriod: 'Biweekly',
      confidence: conf(),
    },
    {
      area: 'Protected decision blocks',
      reason: 'Judgment quality drops without uninterrupted focus.',
      specificPractice: 'Protect one deep-work decision block on high-stakes days.',
      successSignal: 'Calendar shows a labeled decision block before major calls.',
      reviewPeriod: 'Weekly',
      confidence: conf(),
    },
    {
      area: seed.collaborativeBias ? 'Direct conflict practice' : 'Dissenting input',
      reason: seed.collaborativeBias
        ? 'Alignment preference can delay necessary friction.'
        : 'Independent drive can miss risk-reducing stakeholders.',
      specificPractice: seed.collaborativeBias
        ? 'Practice one prepared direct conversation per month.'
        : 'Invite one dissenting view before locking major moves.',
      successSignal: 'Decision notes include at least one contrary input.',
      reviewPeriod: 'Monthly',
      confidence: conf(),
    },
    {
      area: 'Decision review habit',
      reason: 'Without review, recommendations do not compound into skill.',
      specificPractice:
        'Review saved decisions monthly: what changed vs. what you recommended.',
      successSignal: 'Vault or Pathfinder history shows a dated review note.',
      reviewPeriod: 'Monthly',
      confidence: conf(),
    },
  ];

  return items.slice(0, 5);
}

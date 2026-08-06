/** Pressure response section. */

import type { IntelligenceSeed, PressureResponseInsight } from './types';
import { confidenceFromGaps, makeEvidence } from './util';

export function buildPressureResponse(
  seed: IntelligenceSeed,
  derivedAt: string
): PressureResponseInsight {
  const likelyResponse = seed.analyticalBias
    ? 'Narrows focus and seeks more data; urgency can feel like incomplete information.'
    : 'Accelerates toward action; ambiguity can feel like lost momentum.';

  const commonTriggers = [
    'Hard deadlines with incomplete information',
    seed.collaborativeBias
      ? 'Interpersonal disagreement'
      : 'Stakeholder silence when ownership is unclear',
    'Irreversible downside without a pilot path',
  ];

  const decisionRiskUnderPressure = seed.analyticalBias
    ? 'Over-collecting inputs delays reversible learning.'
    : 'Compressing deliberation increases irreversible error risk.';

  const recoveryPattern = seed.morningBias
    ? 'Early quiet resets plus a written priority list restore judgment quality.'
    : 'A short walk-away, then one concrete next step, restores pacing.';

  const recommendedProtocol =
    'Name the irreversible part, shrink the next step to a reversible action, and decide inside a stronger energy band with a dated checkpoint.';

  return {
    likelyResponse,
    commonTriggers,
    decisionRiskUnderPressure,
    recoveryPattern,
    recommendedProtocol,
    confidence: confidenceFromGaps(
      seed.missing,
      66,
      'Pressure patterns are timing-derived tendencies, not clinical assessments.'
    ),
    evidence: makeEvidence(
      'pressure-response.v2',
      ['birth_time', 'birth_date'],
      derivedAt
    ),
  };
}

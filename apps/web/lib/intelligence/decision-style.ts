/** Decision style section generator. */

import type {
  DecisionStyleInsight,
  IntelligenceSeed,
  PrimaryDecisionStyle,
} from './types';
import { confidenceFromGaps, makeEvidence } from './util';
import { PRIMARY_DECISION_STYLES } from './types';

function assertStyle(value: PrimaryDecisionStyle): PrimaryDecisionStyle {
  if (!(PRIMARY_DECISION_STYLES as readonly string[]).includes(value)) {
    return 'adaptive';
  }
  return value;
}

export function buildDecisionStyle(
  seed: IntelligenceSeed,
  derivedAt: string
): DecisionStyleInsight {
  const primaryStyle = assertStyle(
    seed.analyticalBias
      ? 'analytical'
      : seed.creativeBias
        ? 'exploratory'
        : seed.collaborativeBias
          ? 'collaborative'
          : 'adaptive'
  );

  const secondary: PrimaryDecisionStyle[] = [];
  if (seed.morningBias) secondary.push('strategic');
  else if (seed.eveningBias) secondary.push('cautious');
  else secondary.push('execution-focused');

  if (seed.deepWorkBias && !secondary.includes('execution-focused')) {
    secondary.push('execution-focused');
  }
  if (seed.collaborativeBias && primaryStyle !== 'collaborative') {
    secondary.push('collaborative');
  }

  const secondaryStyles = [...new Set(secondary)]
    .filter((s) => s !== primaryStyle)
    .slice(0, 3)
    .map(assertStyle);

  const riskOrientation = seed.eveningBias
    ? 'cautious'
    : seed.morningBias && !seed.analyticalBias
      ? 'bold'
      : 'balanced';

  const decisionSpeed = seed.eveningBias || seed.analyticalBias
    ? 'deliberate'
    : seed.morningBias
      ? 'measured'
      : 'fast';

  const independenceLevel = seed.collaborativeBias
    ? 'collaborative'
    : seed.analyticalBias
      ? 'selective'
      : 'independent';

  const planningHorizon = seed.morningBias || seed.deepWorkBias
    ? 'long-term'
    : seed.eveningBias
      ? 'near-term'
      : 'balanced';

  const explanation = [
    `Primary mode is ${primaryStyle}, with secondary leanings toward ${secondaryStyles.join(', ') || 'adaptive adjustment'}.`,
    `Risk posture is ${riskOrientation}; pace tends ${decisionSpeed}.`,
    'Derived from birth timing anchors and profile metadata — comparative, not predictive.',
  ].join(' ');

  return {
    primaryStyle,
    secondaryStyles,
    riskOrientation,
    decisionSpeed,
    independenceLevel,
    planningHorizon,
    explanation,
    confidence: confidenceFromGaps(
      seed.missing,
      seed.missing.length === 0 ? 72 : 58,
      'Decision style confidence tracks completeness of birth timing inputs.',
      ['Style labels are controlled enums, not free-form personality claims.']
    ),
    evidence: makeEvidence(
      'decision-style.v2',
      ['birth_date', 'birth_time', 'birth_location'],
      derivedAt,
      'birth_timing'
    ),
  };
}

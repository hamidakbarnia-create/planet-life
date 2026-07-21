/** Leadership as influence — works without management titles. */

import type { IntelligenceSeed, LeadershipStyleInsight } from './types';
import { confidenceFromGaps } from './util';

export function buildLeadershipStyle(seed: IntelligenceSeed): LeadershipStyleInsight {
  const primaryStyle = seed.analyticalBias
    ? 'Analyst'
    : seed.collaborativeBias
      ? 'Mentor'
      : seed.creativeBias
        ? 'Vision driven'
        : 'Builder';

  const secondaryStyle = seed.deepWorkBias ? 'Operational' : 'Adaptive';

  return {
    primaryStyle,
    secondaryStyle,
    strengths:
      primaryStyle === 'Analyst'
        ? ['Clarifies trade-offs', 'Raises decision quality with evidence']
        : primaryStyle === 'Mentor'
          ? ['Develops people', 'Aligns shared outcomes']
          : primaryStyle === 'Vision driven'
            ? ['Sets destination', 'Invites contribution']
            : ['Ships progress', 'Refines systems in motion'],
    risks:
      primaryStyle === 'Analyst'
        ? ['Analysis delay under urgency']
        : primaryStyle === 'Mentor'
          ? ['Conflict avoidance']
          : primaryStyle === 'Vision driven'
            ? ['Under-specified execution']
            : ['Over-optimizing the build before alignment'],
    bestEnvironment:
      'Clear ownership, explicit success signals, and room for reversible experiments.',
    recommendedDevelopment:
      'Practice stating criteria and next owner in every decision brief you lead.',
    confidence: confidenceFromGaps(
      seed.missing,
      64,
      'Leadership here means influence and responsibility, not job title.'
    ),
  };
}

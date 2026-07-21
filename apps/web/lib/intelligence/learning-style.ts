/** Learning style section. */

import type { IntelligenceSeed, LearningStyleInsight } from './types';
import { confidenceFromGaps } from './util';

export function buildLearningStyle(seed: IntelligenceSeed): LearningStyleInsight {
  const primaryMethod = seed.analyticalBias ? 'Analytical' : 'Practical';
  const secondaryMethods = [
    seed.collaborativeBias ? 'Discussion' : 'Reading',
    seed.creativeBias ? 'Experimentation' : 'Visual mapping',
  ];

  return {
    primaryMethod,
    secondaryMethods,
    processingPreference: seed.analyticalBias
      ? 'Models that explain real cases'
      : 'Small real versions first',
    practicePreference: 'Apply within 48 hours of learning',
    retentionStrategy: 'Teach-back or written decision note after practice',
    commonBarrier: seed.analyticalBias
      ? 'Collecting frameworks without a live application'
      : 'Skipping reflection after experiments',
    recommendedMethod: `${primaryMethod} first, then ${secondaryMethods[0]} to stress-test understanding.`,
    confidence: confidenceFromGaps(
      seed.missing,
      63,
      'Learning preferences support decision skill growth, not academic labels.'
    ),
  };
}

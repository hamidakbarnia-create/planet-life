/** Decision environment section. */

import type { DecisionEnvironmentInsight, IntelligenceSeed } from './types';
import { confidenceFromGaps } from './util';

export function buildDecisionEnvironment(
  seed: IntelligenceSeed
): DecisionEnvironmentInsight {
  const preferredSettings = [
    seed.collaborativeBias ? 'Collaborative' : 'Quiet',
    seed.deepWorkBias ? 'Remote / controlled' : 'Flexible',
    seed.month % 2 === 0 ? 'Travel-friendly' : 'Stable workspace',
  ];

  return {
    preferredSettings,
    distractionSensitivity: seed.deepWorkBias ? 'High' : 'Moderate',
    collaborationNeed: seed.collaborativeBias ? 'High for major calls' : 'Selective consultation',
    timePressureTolerance: seed.analyticalBias || seed.eveningBias ? 'Low–moderate' : 'Moderate–high',
    informationNeed: seed.analyticalBias
      ? 'Criteria and evidence before commit'
      : 'Clear options and a reversible next step',
    recommendedDecisionSetup:
      'Quiet or prepared small-group setting, written criteria, one reversible pilot, and a hard review time.',
    confidence: confidenceFromGaps(
      seed.missing,
      65,
      'Environment recommendations support judgment quality, not workplace mandates.'
    ),
  };
}

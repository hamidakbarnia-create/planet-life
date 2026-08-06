/** Work style section. */

import type { IntelligenceSeed, WorkStyleInsight } from './types';
import { confidenceFromGaps } from './util';

export function buildWorkStyle(seed: IntelligenceSeed): WorkStyleInsight {
  return {
    focusMode: seed.deepWorkBias ? 'Deep work' : 'Flexible switching',
    collaborationPreference: seed.collaborativeBias ? 'Team-oriented' : 'Owner-driven',
    structurePreference: seed.analyticalBias ? 'Structured plans' : 'Adaptive structure',
    executionRhythm: seed.morningBias
      ? 'Front-load critical work'
      : seed.eveningBias
        ? 'Late-day refinement'
        : 'Midday execution peaks',
    changeTolerance: seed.creativeBias ? 'High — seeks useful novelty' : 'Measured — prefers sequenced change',
    productivityRisks: [
      seed.deepWorkBias
        ? 'Interruptions collapse judgment quality'
        : 'Context switching without batching',
      'Starting irreversible work before a reversible pilot',
    ],
    recommendedEnvironment: seed.deepWorkBias
      ? 'Low-interruption blocks for high-stakes decisions'
      : 'Flexible space with clean decision inputs',
    confidence: confidenceFromGaps(
      seed.missing,
      66,
      'Work style describes decision-supporting rhythm, not productivity guarantees.'
    ),
  };
}

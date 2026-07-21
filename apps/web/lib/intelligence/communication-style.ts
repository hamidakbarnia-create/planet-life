/** Communication style — for People / Julia consumers. */

import type { CommunicationStyleInsight, IntelligenceSeed } from './types';
import { confidenceFromGaps } from './util';

export function buildCommunicationStyle(
  seed: IntelligenceSeed
): CommunicationStyleInsight {
  return {
    primaryStyle: seed.collaborativeBias
      ? 'Relational and context-rich'
      : 'Direct and outcome-oriented',
    preferredEnvironment: seed.deepWorkBias
      ? 'Prepared 1:1 or focused small groups'
      : 'Flexible forums with explicit goals',
    listeningStyle: seed.analyticalBias
      ? 'Listens for structure, inconsistencies, and decision criteria'
      : 'Listens for intent and momentum; summarizes toward action',
    conflictStyle: seed.collaborativeBias
      ? 'Seeks alignment; may delay confrontation until stakes force it'
      : 'Addresses issues head-on; may under-index on emotional pacing',
    persuasionStyle: seed.analyticalBias
      ? 'Evidence and criteria first'
      : seed.creativeBias
        ? 'Narrative and options first'
        : 'Clear ask and ownership first',
    communicationRisks: [
      seed.collaborativeBias
        ? 'Harmony preference can bury disagreement'
        : 'Brevity can skip emotional context others need',
      'Unstated decision criteria create false agreement',
    ],
    recommendedApproach:
      'State the decision, the criteria, and the ask in three sentences before debating options.',
    confidence: confidenceFromGaps(
      seed.missing,
      65,
      'Communication style is a decision-support model for People and Julia.'
    ),
  };
}

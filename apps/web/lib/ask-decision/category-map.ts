/** Map Ask intents onto Pathfinder categories for shared timing/scoring helpers. */

import type { DecisionCategory } from '@/lib/pathfinder-decision/types';
import type { AskIntent } from './types';
import { normalizeIntent } from './intent';

export function intentToPathfinderCategory(
  intent: AskIntent | string
): DecisionCategory | null {
  switch (normalizeIntent(intent)) {
    case 'career':
      return 'Career';
    case 'business':
      return 'Business';
    case 'money':
      return 'Money';
    case 'relationship':
      return 'Relationship';
    case 'education':
      return 'Education';
    case 'health':
    case 'wellbeing':
      return 'Health';
    case 'family':
      return 'Family';
    case 'relocation':
    case 'travel':
      return 'Relocation';
    case 'investment':
      return 'Investment';
    case 'legal':
    case 'general':
      return 'Other';
    case 'unknown':
    default:
      return null;
  }
}

/**
 * Bridge DecisionIntent taxonomy v1 → legacy AskIntent used by framing/scores.
 * Compatibility only — does not replace detectIntent / AskIntent in this task.
 */

import type { AskIntent } from '../types';
import type { DecisionIntent } from './taxonomy';

const TO_ASK: Record<DecisionIntent, AskIntent> = {
  career: 'career',
  business: 'business',
  finance: 'money',
  relationship: 'relationship',
  family: 'family',
  relocation: 'relocation',
  education: 'education',
  health: 'health',
  personal_growth: 'wellbeing',
  timing: 'general',
  other: 'general',
};

export function decisionIntentToAskIntent(intent: DecisionIntent): AskIntent {
  return TO_ASK[intent] ?? 'general';
}

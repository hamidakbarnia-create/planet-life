/**
 * Ask Conversation API serialization — concise, token-efficient, no raw PII.
 * Full Ask redesign is out of scope; this prepares the structured context.
 */

import type { PersonalIntelligenceProfile } from './types';
import { getDecisionContext } from './selectors';

export type AskIntelligencePayload = {
  decision_primary: string;
  decision_secondary: string[];
  risk_orientation: string;
  decision_speed: string;
  independence: string;
  planning_horizon: string;
  pressure_protocol: string;
  energy_decision: number;
  energy_creative: number;
  energy_social: number;
  top_strengths: string[];
  top_caution: string | null;
  confidence_level: string;
  confidence_score: number;
  missing_inputs: string[];
  profile_version: string;
};

/**
 * Serialize intelligence for Conversation API prompts.
 * Omits birth details, locations, fingerprint, and raw evidence.
 */
export function serializeAskIntelligenceContext(
  profile: PersonalIntelligenceProfile | null | undefined
): AskIntelligencePayload | null {
  if (!profile) return null;
  const decision = getDecisionContext(profile);
  if (!decision) return null;

  return {
    decision_primary: decision.primaryStyle,
    decision_secondary: decision.secondaryStyles,
    risk_orientation: decision.riskOrientation,
    decision_speed: decision.decisionSpeed,
    independence: decision.independenceLevel,
    planning_horizon: decision.planningHorizon,
    pressure_protocol: profile.pressureResponse.recommendedProtocol.slice(0, 160),
    energy_decision: profile.energyRhythm.decisionEnergy,
    energy_creative: profile.energyRhythm.creativeEnergy,
    energy_social: profile.energyRhythm.socialEnergy,
    top_strengths: profile.strengths.slice(0, 3).map((s) => s.label),
    top_caution: profile.blindSpots[0]?.label ?? null,
    confidence_level: profile.confidence.level,
    confidence_score: profile.confidence.score,
    missing_inputs: profile.confidence.missingInputs,
    profile_version: profile.profileVersion,
  };
}

/** Compact single-line string for prompt injection. */
export function formatAskIntelligencePromptLine(
  payload: AskIntelligencePayload | null
): string | null {
  if (!payload) return null;
  return [
    `decision=${payload.decision_primary}`,
    `risk=${payload.risk_orientation}`,
    `speed=${payload.decision_speed}`,
    `energy_d=${payload.energy_decision}`,
    `strengths=${payload.top_strengths.join('|')}`,
    `confidence=${payload.confidence_level}:${payload.confidence_score}`,
    payload.missing_inputs.length
      ? `missing=${payload.missing_inputs.join(',')}`
      : null,
  ]
    .filter(Boolean)
    .join('; ');
}

/** Guard: serialized payload must not contain birth/location substrings. */
export function assertAskPayloadPrivacy(
  payload: AskIntelligencePayload,
  forbiddenSubstrings: string[]
): boolean {
  const blob = JSON.stringify(payload).toLowerCase();
  return !forbiddenSubstrings.some(
    (s) => s.trim().length > 2 && blob.includes(s.trim().toLowerCase())
  );
}

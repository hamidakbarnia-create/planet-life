/** Validate generated intelligence before use. */

import {
  CONFIDENCE_LEVELS,
  INTELLIGENCE_CORE_VERSION,
  OPPORTUNITY_ZONE_IDS,
  PRIMARY_DECISION_STYLES,
  RISK_ORIENTATIONS,
  type InsightConfidence,
  type PersonalIntelligenceProfile,
} from './types';

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] };

function isConfidence(value: unknown): value is InsightConfidence {
  if (!value || typeof value !== 'object') return false;
  const c = value as InsightConfidence;
  return (
    (CONFIDENCE_LEVELS as readonly string[]).includes(c.level) &&
    typeof c.score === 'number' &&
    c.score >= 0 &&
    c.score <= 100 &&
    typeof c.explanation === 'string' &&
    c.explanation.trim().length > 0 &&
    Array.isArray(c.missingInputs) &&
    Array.isArray(c.limitations)
  );
}

function bounded(n: unknown): boolean {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100;
}

export function validatePersonalIntelligenceProfile(
  profile: PersonalIntelligenceProfile
): ValidationResult {
  const errors: string[] = [];

  if (!profile.profileId?.trim()) errors.push('profileId required');
  if (profile.profileVersion !== INTELLIGENCE_CORE_VERSION) {
    errors.push('profileVersion mismatch');
  }
  if (!profile.generatedAt || Number.isNaN(Date.parse(profile.generatedAt))) {
    errors.push('generatedAt invalid');
  }
  if (!profile.updatedAt || Number.isNaN(Date.parse(profile.updatedAt))) {
    errors.push('updatedAt invalid');
  }
  if (!profile.sourceProfileFingerprint?.trim()) {
    errors.push('sourceProfileFingerprint required');
  }

  const ds = profile.decisionStyle;
  if (!ds || !(PRIMARY_DECISION_STYLES as readonly string[]).includes(ds.primaryStyle)) {
    errors.push('decisionStyle.primaryStyle invalid');
  }
  if (ds && !(RISK_ORIENTATIONS as readonly string[]).includes(ds.riskOrientation)) {
    errors.push('decisionStyle.riskOrientation invalid');
  }
  if (ds && !ds.explanation?.trim()) errors.push('decisionStyle.explanation empty');
  if (ds && !isConfidence(ds.confidence)) errors.push('decisionStyle.confidence invalid');
  if (ds && !ds.evidence?.calculationId) errors.push('decisionStyle.evidence missing');

  if (!Array.isArray(profile.strengths) || profile.strengths.length === 0) {
    errors.push('strengths required');
  }
  if (profile.strengths?.length > 6) errors.push('strengths exceed max 6');
  for (const s of profile.strengths ?? []) {
    if (!s.decisionApplication?.trim()) {
      errors.push(`strength ${s.id} missing decisionApplication`);
    }
    if (!isConfidence(s.confidence)) errors.push(`strength ${s.id} confidence invalid`);
  }

  if (!Array.isArray(profile.blindSpots) || profile.blindSpots.length === 0) {
    errors.push('blindSpots required');
  }
  if (profile.blindSpots?.length > 6) errors.push('blindSpots exceed max 6');

  if (!Array.isArray(profile.opportunityZones) || profile.opportunityZones.length === 0) {
    errors.push('opportunityZones required');
  }
  for (const z of profile.opportunityZones ?? []) {
    if (!(OPPORTUNITY_ZONE_IDS as readonly string[]).includes(z.zone)) {
      errors.push(`opportunity zone invalid: ${z.zone}`);
    }
    if (!bounded(z.score)) errors.push(`opportunity score out of bounds: ${z.zone}`);
  }

  if (!profile.pressureResponse?.recommendedProtocol?.trim()) {
    errors.push('pressureResponse.recommendedProtocol required');
  }
  if (!isConfidence(profile.pressureResponse?.confidence)) {
    errors.push('pressureResponse.confidence invalid');
  }

  if (!profile.communicationStyle?.recommendedApproach?.trim()) {
    errors.push('communicationStyle.recommendedApproach required');
  }
  if (!profile.leadershipStyle?.primaryStyle?.trim()) {
    errors.push('leadershipStyle.primaryStyle required');
  }
  if (!profile.workStyle?.focusMode?.trim()) errors.push('workStyle.focusMode required');
  if (!profile.learningStyle?.primaryMethod?.trim()) {
    errors.push('learningStyle.primaryMethod required');
  }

  const er = profile.energyRhythm;
  if (
    !er ||
    !bounded(er.morning) ||
    !bounded(er.afternoon) ||
    !bounded(er.evening) ||
    !bounded(er.decisionEnergy) ||
    !bounded(er.creativeEnergy) ||
    !bounded(er.socialEnergy)
  ) {
    errors.push('energyRhythm scores invalid');
  }

  if (!profile.decisionEnvironment?.recommendedDecisionSetup?.trim()) {
    errors.push('decisionEnvironment.recommendedDecisionSetup required');
  }

  const ga = profile.growthAreas?.length ?? 0;
  if (ga < 3 || ga > 5) errors.push('growthAreas must be 3–5');

  const summaryWords = profile.personalSummary?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (summaryWords.length === 0) errors.push('personalSummary empty');
  if (summaryWords.length > 120) errors.push('personalSummary exceeds 120 words');

  if (!isConfidence(profile.confidence)) errors.push('profile.confidence invalid');
  if (!Array.isArray(profile.evidence) || profile.evidence.length === 0) {
    errors.push('evidence required');
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}

/** Check stored profile still matches current source fingerprint + version. */
export function isProfileStale(
  profile: PersonalIntelligenceProfile,
  currentFingerprint: string
): boolean {
  return (
    profile.sourceProfileFingerprint !== currentFingerprint ||
    profile.profileVersion !== INTELLIGENCE_CORE_VERSION
  );
}

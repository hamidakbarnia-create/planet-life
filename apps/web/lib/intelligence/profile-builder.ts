/** Single entry point: buildPersonalIntelligenceProfile. */

import type { BirthProfile } from '@/lib/birth-profile';
import { buildBlindSpots } from './blind-spots';
import { buildCommunicationStyle } from './communication-style';
import { buildDecisionEnvironment } from './decision-environment';
import { buildDecisionStyle } from './decision-style';
import { buildEnergyRhythm } from './energy-rhythm';
import { buildGrowthAreas } from './growth-areas';
import { buildLeadershipStyle } from './leadership-style';
import { buildLearningStyle } from './learning-style';
import { buildOpportunityZones } from './opportunity-zones';
import { buildPressureResponse } from './pressure-response';
import { buildStrengths } from './strengths';
import { buildPersonalSummary } from './summary';
import { buildWorkStyle } from './work-style';
import {
  assessSourceCompleteness,
  buildIntelligenceSeed,
  fingerprintSourceProfile,
  normalizeSourceProfile,
  profileIdFromFingerprint,
} from './source-profile';
import {
  INTELLIGENCE_CORE_VERSION,
  type DecisionHistorySummary,
  type PersonalIntelligenceProfile,
  type SourceProfileInput,
  type TimingContextInput,
} from './types';
import { confidenceFromGaps, makeEvidence } from './util';
import { validatePersonalIntelligenceProfile } from './validation';

export type BuildIntelligenceOptions = {
  nowIso?: string;
  timingContext?: TimingContextInput | null;
  /** Pre-normalized source; otherwise derived from birth profile. */
  source?: SourceProfileInput;
  /**
   * Optional decision-history enrichment from the product layer.
   * Omitted ⇒ count 0. Core never imports Pathfinder storage.
   */
  decisionHistory?: DecisionHistorySummary | null;
};

/**
 * Canonical builder. Pages must not assemble conflicting profiles from section generators.
 * Returns null only when even a partial profile cannot be built (no birth date).
 */
export function buildPersonalIntelligenceProfile(
  birth: BirthProfile | null | undefined,
  options: BuildIntelligenceOptions = {}
): PersonalIntelligenceProfile | null {
  const source =
    options.source ??
    normalizeSourceProfile(birth, {
      decisionHistory: options.decisionHistory,
    });
  const completeness = assessSourceCompleteness(source);
  if (!completeness.canGeneratePartial) {
    return null;
  }

  const derivedAt = options.nowIso ?? new Date().toISOString();
  const seed = buildIntelligenceSeed(source);
  const fingerprint = fingerprintSourceProfile(source);
  const decisionStyle = buildDecisionStyle(seed, derivedAt);
  const strengths = buildStrengths(seed, derivedAt);
  const blindSpots = buildBlindSpots(seed, derivedAt);
  const opportunityZones = buildOpportunityZones(
    seed,
    derivedAt,
    options.timingContext
  );
  const pressureResponse = buildPressureResponse(seed, derivedAt);
  const communicationStyle = buildCommunicationStyle(seed);
  const leadershipStyle = buildLeadershipStyle(seed);
  const workStyle = buildWorkStyle(seed);
  const learningStyle = buildLearningStyle(seed);
  const energyRhythm = buildEnergyRhythm(seed, options.timingContext);
  const decisionEnvironment = buildDecisionEnvironment(seed);
  const growthAreas = buildGrowthAreas(seed, blindSpots);
  const personalSummary = buildPersonalSummary({
    decisionStyle,
    strengths,
    leadership: leadershipStyle,
    work: workStyle,
  });

  const evidence = [
    decisionStyle.evidence,
    ...strengths.slice(0, 2).map((s) => s.evidence),
    pressureResponse.evidence,
    makeEvidence(
      'profile-builder.v2',
      ['source_fingerprint', ...completeness.missingFields],
      derivedAt,
      'derived',
      completeness.missingFields.length
        ? ['Partial profile — missing inputs reduced confidence.']
        : []
    ),
  ];

  if (source.hasDecisionHistory) {
    evidence.push(
      makeEvidence(
        'decision-history.count',
        ['pathfinder_saved_decisions'],
        derivedAt,
        'decision_history',
        ['Count only — raw history not embedded in profile.']
      )
    );
  }

  const profile: PersonalIntelligenceProfile = {
    profileId: profileIdFromFingerprint(fingerprint),
    profileVersion: INTELLIGENCE_CORE_VERSION,
    generatedAt: derivedAt,
    updatedAt: derivedAt,
    sourceProfileFingerprint: fingerprint,
    decisionStyle,
    strengths,
    blindSpots,
    opportunityZones,
    pressureResponse,
    communicationStyle,
    leadershipStyle,
    workStyle,
    learningStyle,
    energyRhythm,
    decisionEnvironment,
    growthAreas,
    personalSummary,
    confidence: confidenceFromGaps(
      completeness.missingFields,
      completeness.complete ? 74 : 52,
      completeness.complete
        ? 'Profile built from complete birth timing inputs.'
        : 'Partial profile — complete onboarding to raise confidence.',
      [
        'Comparative decision-support only.',
        ...(options.timingContext?.todayScore == null
          ? ['Live timing context not supplied at build time.']
          : []),
      ]
    ),
    evidence,
  };

  const validation = validatePersonalIntelligenceProfile(profile);
  if (!validation.ok) {
    return null;
  }

  return profile;
}

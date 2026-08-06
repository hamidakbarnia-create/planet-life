/**
 * Narrow module selectors — consumers read only what they need.
 * Prefer passing an already-loaded profile; getters fall back to storage.
 */

import { getPersonalIntelligenceProfile } from './profile-storage';
import type {
  CommunicationStyleInsight,
  DecisionStyleInsight,
  EnergyRhythmInsight,
  OpportunityZoneInsight,
  PersonalIntelligenceProfile,
  PressureResponseInsight,
  RiskOrientation,
} from './types';

function resolve(
  profile?: PersonalIntelligenceProfile | null
): PersonalIntelligenceProfile | null {
  return profile ?? getPersonalIntelligenceProfile();
}

export type DecisionContext = {
  primaryStyle: DecisionStyleInsight['primaryStyle'];
  secondaryStyles: DecisionStyleInsight['secondaryStyles'];
  riskOrientation: RiskOrientation;
  decisionSpeed: DecisionStyleInsight['decisionSpeed'];
  independenceLevel: DecisionStyleInsight['independenceLevel'];
  planningHorizon: DecisionStyleInsight['planningHorizon'];
  explanation: string;
  confidenceLevel: DecisionStyleInsight['confidence']['level'];
  confidenceScore: number;
};

export function getDecisionContext(
  profile?: PersonalIntelligenceProfile | null
): DecisionContext | null {
  const p = resolve(profile);
  if (!p) return null;
  const d = p.decisionStyle;
  return {
    primaryStyle: d.primaryStyle,
    secondaryStyles: d.secondaryStyles,
    riskOrientation: d.riskOrientation,
    decisionSpeed: d.decisionSpeed,
    independenceLevel: d.independenceLevel,
    planningHorizon: d.planningHorizon,
    explanation: d.explanation,
    confidenceLevel: d.confidence.level,
    confidenceScore: d.confidence.score,
  };
}

export type TodayEnergyContext = {
  rhythm: EnergyRhythmInsight;
};

export function getTodayEnergyContext(
  profile?: PersonalIntelligenceProfile | null
): TodayEnergyContext | null {
  const p = resolve(profile);
  if (!p) return null;
  return { rhythm: p.energyRhythm };
}

export type PeopleCommunicationContext = {
  communication: CommunicationStyleInsight;
  leadershipPrimary: string;
  leadershipSecondary: string;
};

export function getPeopleCommunicationContext(
  profile?: PersonalIntelligenceProfile | null
): PeopleCommunicationContext | null {
  const p = resolve(profile);
  if (!p) return null;
  return {
    communication: p.communicationStyle,
    leadershipPrimary: p.leadershipStyle.primaryStyle,
    leadershipSecondary: p.leadershipStyle.secondaryStyle,
  };
}

export type PathfinderRiskContext = {
  decisionStyles: string[];
  riskOrientation: RiskOrientation;
  /** @deprecated alias for Pathfinder scores — mirrors riskOrientation */
  riskTilt: RiskOrientation;
  pressureProtocol: string;
  decisionSetup: string;
  explanation: string;
  confidenceLevel: string;
  confidenceScore: number;
};

export function getPathfinderRiskContext(
  profile?: PersonalIntelligenceProfile | null
): PathfinderRiskContext | null {
  const p = resolve(profile);
  if (!p) return null;
  const styles = [
    p.decisionStyle.primaryStyle,
    ...p.decisionStyle.secondaryStyles,
  ];
  return {
    decisionStyles: styles,
    riskOrientation: p.decisionStyle.riskOrientation,
    riskTilt: p.decisionStyle.riskOrientation,
    pressureProtocol: p.pressureResponse.recommendedProtocol,
    decisionSetup: p.decisionEnvironment.recommendedDecisionSetup,
    explanation: p.decisionStyle.explanation,
    confidenceLevel: p.confidence.level,
    confidenceScore: p.confidence.score,
  };
}

export type JuliaProfileContext = {
  summary: string;
  decisionStyle: DecisionStyleInsight;
  communication: CommunicationStyleInsight;
  pressure: PressureResponseInsight;
  strengths: string[];
  growthAreas: string[];
  version: string;
  confidenceLevel: string;
};

export function getJuliaProfileContext(
  profile?: PersonalIntelligenceProfile | null
): JuliaProfileContext | null {
  const p = resolve(profile);
  if (!p) return null;
  return {
    summary: p.personalSummary,
    decisionStyle: p.decisionStyle,
    communication: p.communicationStyle,
    pressure: p.pressureResponse,
    strengths: p.strengths.map((s) => s.label),
    growthAreas: p.growthAreas.map((g) => g.area),
    version: p.profileVersion,
    confidenceLevel: p.confidence.level,
  };
}

export type WorldOpportunityContext = {
  zones: OpportunityZoneInsight[];
};

export function getWorldOpportunityContext(
  profile?: PersonalIntelligenceProfile | null
): WorldOpportunityContext | null {
  const p = resolve(profile);
  if (!p) return null;
  return { zones: p.opportunityZones.slice(0, 5) };
}

export type CalendarEnergyContext = {
  rhythm: EnergyRhythmInsight;
};

export function getCalendarEnergyContext(
  profile?: PersonalIntelligenceProfile | null
): CalendarEnergyContext | null {
  const p = resolve(profile);
  if (!p) return null;
  return { rhythm: p.energyRhythm };
}

export type VaultProfileMetadata = {
  profileId: string;
  version: string;
  updatedAt: string;
  generatedAt: string;
  fingerprintPrefix: string;
  confidenceLevel: string;
  summary: string;
};

export function getVaultProfileMetadata(
  profile?: PersonalIntelligenceProfile | null
): VaultProfileMetadata | null {
  const p = resolve(profile);
  if (!p) return null;
  return {
    profileId: p.profileId,
    version: p.profileVersion,
    updatedAt: p.updatedAt,
    generatedAt: p.generatedAt,
    fingerprintPrefix: p.sourceProfileFingerprint.slice(0, 8),
    confidenceLevel: p.confidence.level,
    summary: p.personalSummary,
  };
}

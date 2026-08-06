/** Personal Intelligence Profile — canonical types (single source of truth). */

export const INTELLIGENCE_PROFILE_VERSION = '2.0.0';

export type IntelligenceProfileMeta = {
  version: string;
  generatedAt: string;
  updatedAt: string;
  /** Fingerprint of birth inputs used to generate this profile. */
  sourceFingerprint: string;
};

export type LabeledInsight = {
  label: string;
  why: string;
};

export type OpportunityZone = {
  zone: string;
  /** Relative strength 0–100 (comparative, not absolute prediction). */
  relative: number;
};

export type PressureResponse = {
  underStress: string;
  recovery: string;
  approach: string;
};

export type CommunicationStyle = {
  usual: string;
  environment: string;
  conflict: string;
  listening: string;
};

export type EnergyRhythm = {
  morning: number;
  afternoon: number;
  evening: number;
  decision: number;
  creative: number;
  social: number;
  note: string;
};

export type PersonalIntelligenceProfile = {
  meta: IntelligenceProfileMeta;
  decisionStyle: LabeledInsight[];
  strengths: LabeledInsight[];
  blindSpots: LabeledInsight[];
  opportunityZones: OpportunityZone[];
  pressureResponse: PressureResponse;
  communicationStyle: CommunicationStyle;
  leadershipStyle: LabeledInsight;
  workStyle: LabeledInsight[];
  learningStyle: LabeledInsight[];
  energyRhythm: EnergyRhythm;
  decisionEnvironment: LabeledInsight[];
  growthAreas: string[];
  summary: string;
};

/** Slim views for cross-module consumption (avoid re-deriving traits). */
export type AskProfileContext = {
  decisionStyles: string[];
  why: string;
};

export type TodayEnergyContext = {
  rhythm: EnergyRhythm;
};

export type PeopleProfileContext = {
  communication: CommunicationStyle;
  leadership: string;
};

export type PathfinderProfileContext = {
  decisionStyles: string[];
  riskTilt: 'balanced' | 'cautious' | 'bold';
  why: string;
};

export type JuliaProfileContext = PersonalIntelligenceProfile;

export type VaultProfileContext = {
  version: string;
  updatedAt: string;
  summary: string;
};

export type CalendarEnergyContext = {
  rhythm: EnergyRhythm;
};

export type WorldOpportunityContext = {
  zones: OpportunityZone[];
};

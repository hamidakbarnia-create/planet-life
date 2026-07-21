/**
 * Personal Intelligence Core — canonical domain types.
 * Single source of truth for module consumers. No mystical language.
 */

export const INTELLIGENCE_CORE_VERSION = '2.0.0';
export const INTELLIGENCE_STORAGE_KEY = 'planet-life-personal-intelligence-core';

/** Controlled primary decision styles. */
export const PRIMARY_DECISION_STYLES = [
  'strategic',
  'analytical',
  'adaptive',
  'intuitive',
  'collaborative',
  'execution-focused',
  'cautious',
  'exploratory',
] as const;
export type PrimaryDecisionStyle = (typeof PRIMARY_DECISION_STYLES)[number];

export const RISK_ORIENTATIONS = ['cautious', 'balanced', 'bold'] as const;
export type RiskOrientation = (typeof RISK_ORIENTATIONS)[number];

export const DECISION_SPEEDS = ['deliberate', 'measured', 'fast'] as const;
export type DecisionSpeed = (typeof DECISION_SPEEDS)[number];

export const INDEPENDENCE_LEVELS = ['independent', 'selective', 'collaborative'] as const;
export type IndependenceLevel = (typeof INDEPENDENCE_LEVELS)[number];

export const PLANNING_HORIZONS = ['near-term', 'balanced', 'long-term'] as const;
export type PlanningHorizon = (typeof PLANNING_HORIZONS)[number];

export const OPPORTUNITY_ZONE_IDS = [
  'career',
  'business',
  'money',
  'relationships',
  'learning',
  'travel',
  'networking',
  'creativity',
  'leadership',
  'wellbeing',
] as const;
export type OpportunityZoneId = (typeof OPPORTUNITY_ZONE_IDS)[number];

export const CONFIDENCE_LEVELS = ['low', 'medium', 'high'] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export type InsightConfidence = {
  level: ConfidenceLevel;
  /** 0–100 comparative confidence — never certainty. */
  score: number;
  explanation: string;
  missingInputs: string[];
  limitations: string[];
};

export type InsightEvidence = {
  sourceType: 'birth_timing' | 'profile_metadata' | 'decision_history' | 'timing_engine' | 'derived';
  sourceFields: string[];
  calculationId: string;
  derivedAt: string;
  limitations: string[];
};

export type DecisionStyleInsight = {
  primaryStyle: PrimaryDecisionStyle;
  secondaryStyles: PrimaryDecisionStyle[];
  riskOrientation: RiskOrientation;
  decisionSpeed: DecisionSpeed;
  independenceLevel: IndependenceLevel;
  planningHorizon: PlanningHorizon;
  explanation: string;
  confidence: InsightConfidence;
  evidence: InsightEvidence;
};

export type StrengthInsight = {
  id: string;
  label: string;
  description: string;
  decisionApplication: string;
  confidence: InsightConfidence;
  evidence: InsightEvidence;
};

export type BlindSpotInsight = {
  id: string;
  label: string;
  description: string;
  trigger: string;
  practicalMitigation: string;
  confidence: InsightConfidence;
  evidence: InsightEvidence;
};

export type OpportunityZoneInsight = {
  zone: OpportunityZoneId;
  /** Relative comparative score 0–100 — not a prediction. */
  score: number;
  rationale: string;
  bestUse: string;
  caution: string;
  confidence: InsightConfidence;
};

export type PressureResponseInsight = {
  likelyResponse: string;
  commonTriggers: string[];
  decisionRiskUnderPressure: string;
  recoveryPattern: string;
  recommendedProtocol: string;
  confidence: InsightConfidence;
  evidence: InsightEvidence;
};

export type CommunicationStyleInsight = {
  primaryStyle: string;
  preferredEnvironment: string;
  listeningStyle: string;
  conflictStyle: string;
  persuasionStyle: string;
  communicationRisks: string[];
  recommendedApproach: string;
  confidence: InsightConfidence;
};

export type LeadershipStyleInsight = {
  primaryStyle: string;
  secondaryStyle: string;
  strengths: string[];
  risks: string[];
  bestEnvironment: string;
  recommendedDevelopment: string;
  confidence: InsightConfidence;
};

export type WorkStyleInsight = {
  focusMode: string;
  collaborationPreference: string;
  structurePreference: string;
  executionRhythm: string;
  changeTolerance: string;
  productivityRisks: string[];
  recommendedEnvironment: string;
  confidence: InsightConfidence;
};

export type LearningStyleInsight = {
  primaryMethod: string;
  secondaryMethods: string[];
  processingPreference: string;
  practicePreference: string;
  retentionStrategy: string;
  commonBarrier: string;
  recommendedMethod: string;
  confidence: InsightConfidence;
};

export type EnergyRhythmInsight = {
  morning: number;
  afternoon: number;
  evening: number;
  decisionEnergy: number;
  creativeEnergy: number;
  socialEnergy: number;
  recoveryWindow: string;
  explanation: string;
  confidence: InsightConfidence;
};

export type DecisionEnvironmentInsight = {
  preferredSettings: string[];
  distractionSensitivity: string;
  collaborationNeed: string;
  timePressureTolerance: string;
  informationNeed: string;
  recommendedDecisionSetup: string;
  confidence: InsightConfidence;
};

export type GrowthAreaInsight = {
  area: string;
  reason: string;
  specificPractice: string;
  successSignal: string;
  reviewPeriod: string;
  confidence: InsightConfidence;
};

/** Canonical Personal Intelligence Profile. */
export type PersonalIntelligenceProfile = {
  profileId: string;
  profileVersion: string;
  generatedAt: string;
  updatedAt: string;
  sourceProfileFingerprint: string;
  decisionStyle: DecisionStyleInsight;
  strengths: StrengthInsight[];
  blindSpots: BlindSpotInsight[];
  opportunityZones: OpportunityZoneInsight[];
  pressureResponse: PressureResponseInsight;
  communicationStyle: CommunicationStyleInsight;
  leadershipStyle: LeadershipStyleInsight;
  workStyle: WorkStyleInsight;
  learningStyle: LearningStyleInsight;
  energyRhythm: EnergyRhythmInsight;
  decisionEnvironment: DecisionEnvironmentInsight;
  growthAreas: GrowthAreaInsight[];
  personalSummary: string;
  confidence: InsightConfidence;
  evidence: InsightEvidence[];
};

/** Normalized source inputs — missing fields explicit. */
/**
 * Neutral optional enrichment for Personal Intelligence Core.
 * Product layers MAY supply this; Core MUST NOT import Pathfinder storage.
 */
export type DecisionHistorySummary = {
  /** Non-negative count of prior saved decisions available to the product. */
  count: number;
};

export type SourceProfileInput = {
  birthDate: string | null;
  birthTime: string | null;
  birthLocationLabel: string | null;
  actionType: string | null;
  currentCity: string | null;
  hasDecisionHistory: boolean;
  decisionHistoryCount: number;
};

export type TimingContextInput = {
  todayScore: number | null;
  weekScore: number | null;
  monthScore: number | null;
};

export type SourceCompleteness = {
  complete: boolean;
  missingFields: string[];
  canGeneratePartial: boolean;
};

/** Internal deterministic seed — not exported to UI. */
export type IntelligenceSeed = {
  hour: number | null;
  month: number;
  day: number;
  dow: number;
  h: number;
  morningBias: boolean;
  eveningBias: boolean;
  deepWorkBias: boolean;
  collaborativeBias: boolean;
  analyticalBias: boolean;
  creativeBias: boolean;
  missing: string[];
};

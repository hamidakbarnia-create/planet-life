/** Personal Intelligence Core — public barrel. */

export {
  INTELLIGENCE_CORE_VERSION,
  INTELLIGENCE_STORAGE_KEY,
  PRIMARY_DECISION_STYLES,
  RISK_ORIENTATIONS,
  OPPORTUNITY_ZONE_IDS,
  CONFIDENCE_LEVELS,
} from './types';

export type {
  PersonalIntelligenceProfile,
  SourceProfileInput,
  DecisionHistorySummary,
  TimingContextInput,
  SourceCompleteness,
  InsightConfidence,
  InsightEvidence,
  DecisionStyleInsight,
  StrengthInsight,
  BlindSpotInsight,
  OpportunityZoneInsight,
  PressureResponseInsight,
  CommunicationStyleInsight,
  LeadershipStyleInsight,
  WorkStyleInsight,
  LearningStyleInsight,
  EnergyRhythmInsight,
  DecisionEnvironmentInsight,
  GrowthAreaInsight,
  PrimaryDecisionStyle,
  RiskOrientation,
  ConfidenceLevel,
} from './types';

export {
  normalizeSourceProfile,
  fingerprintSourceProfile,
  assessSourceCompleteness,
  buildIntelligenceSeed,
  profileIdFromFingerprint,
} from './source-profile';

export { buildPersonalIntelligenceProfile } from './profile-builder';
export type { BuildIntelligenceOptions } from './profile-builder';

export {
  validatePersonalIntelligenceProfile,
  isProfileStale,
} from './validation';
export type { ValidationResult } from './validation';

export {
  ensurePersonalIntelligenceProfile,
  getPersonalIntelligenceProfile,
  regeneratePersonalIntelligenceProfile,
  clearIntelligenceProfileStorage,
  loadStoredIntelligenceProfile,
  migrateLegacyIntelligenceStorage,
} from './profile-storage';
export type { EnsureIntelligenceOptions } from './profile-storage';

export {
  getDecisionContext,
  getTodayEnergyContext,
  getPeopleCommunicationContext,
  getPathfinderRiskContext,
  getJuliaProfileContext,
  getWorldOpportunityContext,
  getCalendarEnergyContext,
  getVaultProfileMetadata,
} from './selectors';
export type {
  DecisionContext,
  TodayEnergyContext,
  PeopleCommunicationContext,
  PathfinderRiskContext,
  JuliaProfileContext,
  WorldOpportunityContext,
  CalendarEnergyContext,
  VaultProfileMetadata,
} from './selectors';

export {
  serializeAskIntelligenceContext,
  formatAskIntelligencePromptLine,
  assertAskPayloadPrivacy,
} from './ask-serialize';
export type { AskIntelligencePayload } from './ask-serialize';

export { toLegacyIntelligenceProfile } from './legacy-bridge';
export { safeLogMeta } from './util';

// React hook: import from '@/lib/intelligence/profile-context' to avoid
// pulling the client boundary into non-React modules via this barrel.

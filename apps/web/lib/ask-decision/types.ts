/** Ask Decision Intelligence Engine V3 — canonical types. */

export const ASK_DECISION_SCHEMA_VERSION = '3.0.0';

export const ASK_INTENTS = [
  'career',
  'business',
  'money',
  'relationship',
  'education',
  'health',
  'family',
  'relocation',
  'travel',
  'investment',
  'legal',
  'wellbeing',
  'general',
  'unknown',
] as const;

export type AskIntent = (typeof ASK_INTENTS)[number];

/** @deprecated legacy Title-Case intents — mapped via normalizeIntent */
export type LegacyAskIntent =
  | 'Career'
  | 'Business'
  | 'Money'
  | 'Relationship'
  | 'Education'
  | 'Health'
  | 'Family'
  | 'Travel'
  | 'Investment'
  | 'Legal'
  | 'General'
  | 'Unknown';

export const URGENCY_LEVELS = ['low', 'moderate', 'high', 'immediate'] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

export const TIME_HORIZONS = [
  'today',
  'days',
  'weeks',
  'months',
  'long-term',
  'unknown',
] as const;
export type TimeHorizon = (typeof TIME_HORIZONS)[number];

export const RECOMMENDATION_STATUSES = [
  'proceed',
  'proceed-with-caution',
  'wait',
  'gather-more-information',
  'avoid-for-now',
  'neutral',
] as const;
export type RecommendationStatus = (typeof RECOMMENDATION_STATUSES)[number];

export const CONFIDENCE_LEVELS = ['low', 'medium', 'high'] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export const LIKELIHOOD_BANDS = ['low', 'medium', 'high', 'uncertain'] as const;
export type LikelihoodBand = (typeof LIKELIHOOD_BANDS)[number];

export const ACTION_PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;
export type ActionPriority = (typeof ACTION_PRIORITIES)[number];

export const MODULE_IDS = [
  'pathfinder',
  'calendar',
  'today',
  'people',
  'julia',
  'vault',
  'profile',
] as const;
export type RelatedModuleId = (typeof MODULE_IDS)[number];

export type IntentDetection = {
  primaryIntent: AskIntent;
  secondaryIntent: AskIntent | null;
  confidence: number;
  rationale: string;
  detectedEntities: string[];
  decisionPresent: boolean;
  timingRelevant: boolean;
  peopleRelevant: boolean;
  financialImpactLikely: boolean;
  highStakesFlag: boolean;
};

export type DecisionFrame = {
  originalQuestion: string;
  decisionStatement: string;
  decisionType: AskIntent;
  objective: string;
  mainConcern: string;
  options: string[];
  urgency: UrgencyLevel;
  timeHorizon: TimeHorizon;
  reversibility: string;
  affectedAreas: string[];
  unknowns: string[];
  assumptions: string[];
  requiresClarification: boolean;
};

export type ScoreWithRationale = {
  value: number;
  rationale: string;
};

export type AskDecisionScores = {
  opportunity: ScoreWithRationale;
  risk: ScoreWithRationale;
  timing: ScoreWithRationale;
  readiness: ScoreWithRationale;
  confidence: ScoreWithRationale;
};

export type AnalysisSection = {
  id:
    | 'situation'
    | 'factors'
    | 'opportunities'
    | 'risks'
    | 'tradeoffs'
    | 'personal-fit'
    | 'what-could-change'
    | 'why';
  title: string;
  body: string;
};

export type TimingIntelligence = {
  applicable: boolean;
  available: boolean;
  today: { label: string; dateRange: string; score: number | null; note: string } | null;
  next7Days: { label: string; dateRange: string; score: number | null; note: string } | null;
  next30Days: { label: string; dateRange: string; score: number | null; note: string } | null;
  bestWindow: { label: string; dateRange: string; score: number | null; note: string } | null;
  cautionWindow: { label: string; dateRange: string; score: number | null; note: string } | null;
  timingRationale: string;
  timingConfidence: ConfidenceLevel;
};

export type ScenarioBlock = {
  outcome: string;
  likelihoodBand: LikelihoodBand;
  keyConditions: string[];
  earlySignals: string[];
  mitigation: string;
};

export type AskScenarios = {
  bestCase: ScenarioBlock;
  mostLikely: ScenarioBlock;
  downsideCase: ScenarioBlock;
};

export type ActionItem = {
  action: string;
  purpose: string;
  priority: ActionPriority;
  completionSignal: string;
};

export type AskActionPlan = {
  now: ActionItem[];
  next7Days: ActionItem[];
  next30Days: ActionItem[];
};

export type AlternativeOption = {
  option: string;
  bestFor: string;
  advantages: string[];
  disadvantages: string[];
  risk: string;
  timingFit: string;
  recommendationFit: string;
};

export type AskConfidence = {
  level: ConfidenceLevel;
  score: number;
  explanation: string;
  missingInputs: string[];
  limitingFactors: string[];
};

export type RelatedModule = {
  module: RelatedModuleId;
  reason: string;
  actionLabel: string;
  route: string;
};

/**
 * Internal frontend decision-intelligence presentation / domain contract.
 *
 * Not the public Conversation API response (ADR-0007
 * `POST /api/v1/conversation/execute`). Populated client-side from the
 * Conversation success `message` (parsed/repaired JSON) plus local
 * intent framing, intelligence context, and timing. Schema-versioned
 * independently (`ASK_DECISION_SCHEMA_VERSION`) for frontend parsing
 * and rendering — not an OpenAPI HTTP response schema.
 */
export type AskDecisionResult = {
  schemaVersion: string;
  intent: IntentDetection;
  decisionFrame: DecisionFrame;
  executiveSummary: string;
  recommendation: string;
  recommendationStatus: RecommendationStatus;
  scores: AskDecisionScores;
  analysis: AnalysisSection[];
  timing: TimingIntelligence;
  scenarios: AskScenarios;
  actionPlan: AskActionPlan;
  alternatives: AlternativeOption[];
  assumptions: string[];
  confidence: AskConfidence;
  limitations: string[];
  relatedModules: RelatedModule[];
  followUpQuestions: string[];
  safetyNotice: string | null;
  generatedAt: string;
  /** Internal metadata — not for primary UI. */
  meta?: {
    sources: string[];
    requestId: string | null;
    clarificationAnswer: string | null;
    usedProfile: boolean;
    usedTiming: boolean;
    fallback: boolean;
    loadingStage?: string;
    /** P2.1a InputAnalysis foundation — presentation must ignore. */
    inputAnalysis?: import('./input-analysis').InputAnalysis;
    /** P2.1a-02 UnifiedDecisionContext — presentation must ignore. */
    decisionContext?: import('./context-builder').UnifiedDecisionContext;
    /** P2.1b-01 ReasoningPlan — presentation must ignore. */
    reasoningPlan?: import('./reasoning-planner').ReasoningPlan;
    /** P2.1b-02 structured prompt-context status — presentation must ignore. */
    promptContext?: import('./prompt-context').PromptContextMeta;
    /**
     * P2.1b-03 grounding provenance — presentation must ignore.
     * Observes final localized/WQ AskDecisionResult only (not raw provider).
     * Claim-level grounding needs stage-aware / pre-transform capture later.
     */
    grounding?: import('./grounding').GroundingProvenance;
    /**
     * P2.1b-04 claim-level validation report — presentation must ignore.
     * Consumes meta.grounding only; does not mutate user-facing fields.
     * Observation-only until Safe Regeneration (P2.1b-05) consumes it.
     */
    validation?: import('./claim-validation').ValidationReport;
  };
};

export type ClarificationState = {
  required: boolean;
  question: string | null;
  canContinueWithAssumptions: boolean;
};

export type AskContextSnapshot = {
  currentDate: string;
  locale: string;
  intelligenceLine: string | null;
  decisionStyles: string[];
  energyNote: string | null;
  usedProfile: boolean;
  timingAvailable: boolean;
  missingInputs: string[];
};

/** Legacy aliases kept for transitional imports during migration. */
export type DecisionSummary = {
  question: string;
  intent: AskIntent;
  coreDecision: string;
  urgency: string;
  timeHorizon: string;
};

export type ReasoningCard = AnalysisSection;
export type ConfidenceBlock = AskConfidence;
export type AlternativePath = AlternativeOption;
export type AskTimingBlock = TimingIntelligence;
export type AskActionPlanLegacy = {
  today: string[];
  week: string[];
  month: string[];
};

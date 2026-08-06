/** Pathfinder Decision Intelligence — shared types (client-side workflow). */

export const DECISION_CATEGORIES = [
  'Career',
  'Business',
  'Money',
  'Relationship',
  'Education',
  'Health',
  'Relocation',
  'Family',
  'Investment',
  'Other',
] as const;

export type DecisionCategory = (typeof DECISION_CATEGORIES)[number];

export type PathfinderPhase =
  | 'input'
  | 'clarifying'
  | 'analyzing'
  | 'results';

export type ClarificationAnswer = {
  questionId: string;
  question: string;
  answer: string;
};

export type DecisionScores = {
  go: number;
  wait: number;
  risk: number;
  timing: number;
  confidence: number;
};

export type AnalysisField =
  | 'summary'
  | 'decisionType'
  | 'urgency'
  | 'complexity'
  | 'financialImpact'
  | 'relationshipImpact'
  | 'reversibility'
  | 'confidence';

export type DecisionAnalysis = Record<AnalysisField, string>;

export type TimingWindow = {
  label: string;
  dateRange: string;
  score: number;
  note: string;
};

export type DecisionTiming = {
  bestToday: TimingWindow;
  bestThisWeek: TimingWindow;
  bestThisMonth: TimingWindow;
  avoidWindow: TimingWindow;
};

export type ScenarioKind = 'best' | 'likely' | 'worst';

export type DecisionScenario = {
  kind: ScenarioKind;
  title: string;
  outcome: string;
  probability: number;
  reason: string;
  recommendation: string;
};

export type ActionHorizon = 'today' | 'week' | 'month';

export type ActionPlanItem = {
  horizon: ActionHorizon;
  title: string;
  actions: string[];
};

export type ComparisonOption = {
  id: string;
  label: string;
  opportunity: number;
  risk: number;
  timing: number;
  confidence: number;
  pros: string[];
  cons: string[];
  recommendation: string;
};

export type RelatedDecisionSummary = {
  id: string;
  title: string;
  category: DecisionCategory;
  date: string;
  whatChanged: string;
  previousRecommendation: string;
  currentRecommendation: string;
};

export type DecisionStatus = 'active' | 'review' | 'resolved' | 'archived';

export type SavedDecision = {
  id: string;
  title: string;
  category: DecisionCategory;
  date: string;
  status: DecisionStatus;
  scores: DecisionScores;
  decisionText: string;
  recommendation: string;
  reviewAt?: string;
};

export type PathfinderWorkflowResult = {
  analysis: DecisionAnalysis;
  scores: DecisionScores;
  timing: DecisionTiming;
  scenarios: DecisionScenario[];
  actionPlan: ActionPlanItem[];
  comparison: ComparisonOption[] | null;
  related: RelatedDecisionSummary | null;
  recommendation: string;
  sources: string[];
};

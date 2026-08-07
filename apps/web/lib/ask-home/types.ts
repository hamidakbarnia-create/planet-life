import type { GuidedQuestionId } from '@/lib/question-library';

export type DecisionTypeRecord = {
  decision_type_id: string;
  family_id: string;
  label: string;
  create_mode: string;
  available_entry_modes: string[];
  allowed_modes: string[];
  output_profile: string;
};

export type DecisionTypeRegistryDocument = {
  schema_version: string;
  decision_types: DecisionTypeRecord[];
};

/** Curated popular-slot binding — IDs only; labels resolve from registry / library. */
export type PopularDecisionRef = {
  id: string;
  decisionTypeId?: string;
  guidedQuestionId?: GuidedQuestionId;
};

export type PopularDecision = {
  id: string;
  label: string;
  decisionTypeId?: string;
  guidedQuestionId?: GuidedQuestionId;
  familyId?: string;
  source: 'registry' | 'question-library' | 'mock';
};

export type DecisionEntryModeId = 'help-me-decide' | 'ask-anything';

export type DecisionEntryMode = {
  id: DecisionEntryModeId;
  title: string;
  description: string;
};

export type HowItWorksStepId = 'share' | 'analyze' | 'guide';

export type HowItWorksStep = {
  id: HowItWorksStepId;
  title: string;
  description: string;
};

export type RecentDecisionRow = {
  id: string;
  title: string;
  decisionType: string;
  status: string;
  confidence: number;
  date: string;
  href: string;
};

export type AskHomeEnergyState = {
  score: number | null;
  loading: boolean;
  description: string;
  bestWindowLabel: string;
  detailsHref: string;
};

export type AskHomeTimingPoint = {
  hour: number;
  label: string;
  score: number;
  isBest: boolean;
};

export type AskHomeTimingState = {
  loading: boolean;
  points: AskHomeTimingPoint[];
  bestWindowLabel: string;
  emptyLabel: string;
};

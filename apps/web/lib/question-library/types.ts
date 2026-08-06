import type { AppLang } from '../app-settings';

export type QuestionCategoryId =
  | 'career-work'
  | 'relationships'
  | 'money-business'
  | 'health-wellness'
  | 'travel-place'
  | 'communication'
  | 'decisions-timing'
  | 'energy-focus'
  | 'home-family'
  | 'growth-learning';

export type GuidedQuestionId = string;

export type LocalizedText = Record<AppLang, string>;

export interface QuestionCategory {
  id: QuestionCategoryId;
  order: number;
  labels: LocalizedText;
  descriptions: LocalizedText;
}

export interface GuidedQuestion {
  id: GuidedQuestionId;
  categoryId: QuestionCategoryId;
  actionType: string;
  needsTime: boolean;
  labels: LocalizedText;
}

import type { AppLang } from '../app-settings';
import { QUESTION_CATEGORIES } from './categories';
import { GUIDED_QUESTIONS } from './questions';
import type {
  GuidedQuestion,
  GuidedQuestionId,
  LocalizedText,
  QuestionCategory,
  QuestionCategoryId,
} from './types';

const SUPPORTED_LANGS: readonly AppLang[] = ['en', 'ru', 'fa', 'ar'];

export function resolveLocalizedText(text: LocalizedText, lang: AppLang): string {
  return text[lang] ?? text.en;
}

export function resolveCategoryLabel(category: QuestionCategory, lang: AppLang): string {
  return resolveLocalizedText(category.labels, lang);
}

export function resolveCategoryDescription(category: QuestionCategory, lang: AppLang): string {
  return resolveLocalizedText(category.descriptions, lang);
}

export function resolveGuidedQuestionText(question: GuidedQuestion, lang: AppLang): string {
  return resolveLocalizedText(question.labels, lang);
}

export function findQuestionCategory(id: QuestionCategoryId): QuestionCategory | undefined {
  return QUESTION_CATEGORIES.find((category) => category.id === id);
}

export function findGuidedQuestion(id: GuidedQuestionId): GuidedQuestion | undefined {
  return GUIDED_QUESTIONS.find((question) => question.id === id);
}

export function getAllQuestionCategories(): QuestionCategory[] {
  return [...QUESTION_CATEGORIES].sort((a, b) => a.order - b.order);
}

export function getAllGuidedQuestions(): GuidedQuestion[] {
  return [...GUIDED_QUESTIONS];
}

export function questionsByCategory(categoryId: QuestionCategoryId): GuidedQuestion[] {
  return GUIDED_QUESTIONS.filter((question) => question.categoryId === categoryId);
}

export interface QuestionLibraryValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateQuestionLibrary(): QuestionLibraryValidationResult {
  const errors: string[] = [];
  const categoryIds = new Set(QUESTION_CATEGORIES.map((category) => category.id));
  const questionIds = new Set<string>();

  if (QUESTION_CATEGORIES.length !== 10) {
    errors.push(`expected 10 categories, found ${QUESTION_CATEGORIES.length}`);
  }

  if (GUIDED_QUESTIONS.length !== 80) {
    errors.push(`expected 80 questions, found ${GUIDED_QUESTIONS.length}`);
  }

  for (const category of QUESTION_CATEGORIES) {
    for (const lang of SUPPORTED_LANGS) {
      if (!category.labels[lang]?.trim()) {
        errors.push(`category ${category.id} missing label for ${lang}`);
      }
      if (!category.descriptions[lang]?.trim()) {
        errors.push(`category ${category.id} missing description for ${lang}`);
      }
    }
  }

  for (const question of GUIDED_QUESTIONS) {
    if (questionIds.has(question.id)) {
      errors.push(`duplicate question id: ${question.id}`);
    }
    questionIds.add(question.id);

    if (!categoryIds.has(question.categoryId)) {
      errors.push(`question ${question.id} references unknown category ${question.categoryId}`);
    }

    if (!question.actionType.trim()) {
      errors.push(`question ${question.id} missing actionType`);
    }

    for (const lang of SUPPORTED_LANGS) {
      if (!question.labels[lang]?.trim()) {
        errors.push(`question ${question.id} missing label for ${lang}`);
      }
    }
  }

  for (const category of QUESTION_CATEGORIES) {
    const count = questionsByCategory(category.id).length;
    if (count !== 8) {
      errors.push(`category ${category.id} expected 8 questions, found ${count}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

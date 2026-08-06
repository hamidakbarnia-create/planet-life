import { describe, expect, it } from 'vitest';
import {
  findGuidedQuestion,
  findQuestionCategory,
  getAllGuidedQuestions,
  getAllQuestionCategories,
  questionsByCategory,
  resolveCategoryDescription,
  resolveCategoryLabel,
  resolveGuidedQuestionText,
  resolveLocalizedText,
  validateQuestionLibrary,
} from './resolver';

describe('question-library resolver', () => {
  it('returns categories in display order', () => {
    const categories = getAllQuestionCategories();
    expect(categories).toHaveLength(10);
    expect(categories[0]?.id).toBe('career-work');
    expect(categories[9]?.id).toBe('growth-learning');
    expect(categories.map((category) => category.order)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it('localizes category labels and descriptions', () => {
    const category = findQuestionCategory('relationships');
    expect(category).toBeDefined();
    expect(resolveCategoryLabel(category!, 'en')).toBe('Love & People');
    expect(resolveCategoryLabel(category!, 'fa')).toBe('عشق و افراد');
    expect(resolveCategoryDescription(category!, 'ru').toLowerCase()).toContain('примирение');
  });

  it('localizes guided question text by locale', () => {
    const question = findGuidedQuestion('job-interview');
    expect(question).toBeDefined();
    expect(resolveGuidedQuestionText(question!, 'en')).toBe('Job interview');
    expect(resolveGuidedQuestionText(question!, 'fa')).toBe('مصاحبه کاری');
    expect(resolveGuidedQuestionText(question!, 'ar')).toBe('مقابلة عمل');
  });

  it('falls back to English when a locale entry is missing', () => {
    const text = resolveLocalizedText({ en: 'English only' } as never, 'fa');
    expect(text).toBe('English only');
  });

  it('filters questions by category', () => {
    const career = questionsByCategory('career-work');
    expect(career).toHaveLength(8);
    expect(career.every((question) => question.categoryId === 'career-work')).toBe(true);
  });

  it('exposes the full curated library', () => {
    expect(getAllGuidedQuestions()).toHaveLength(80);
  });
});

describe('question-library model', () => {
  it('passes structural validation for categories and questions', () => {
    const result = validateQuestionLibrary();
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('keeps question ids unique across the library', () => {
    const ids = getAllGuidedQuestions().map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

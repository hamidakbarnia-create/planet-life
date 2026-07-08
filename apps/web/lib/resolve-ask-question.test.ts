import { describe, expect, it } from 'vitest';
import type { FtueAskQuestion } from './ask-question-repository';
import {
  getSuggestionText,
  hasStoredAskQuestion,
  resolveStoredAskQuestionText,
} from './resolve-ask-question';

describe('resolve-ask-question', () => {
  it('localizes a stored suggestion id for the active locale', () => {
    const question: FtueAskQuestion = {
      submitted_at: Date.now(),
      source: 'suggestion',
      suggestion_id: 'career',
    };

    expect(resolveStoredAskQuestionText(question, 'en')).toBe(
      'What should I focus on in my career this week?'
    );
    expect(resolveStoredAskQuestionText(question, 'fa')).toBe(
      'این هفته روی چه چیزی در مسیر شغلی‌ام تمرکز کنم؟'
    );
  });

  it('returns typed text unchanged across locales', () => {
    const question: FtueAskQuestion = {
      submitted_at: Date.now(),
      source: 'typed',
      text: 'My custom question',
    };

    expect(resolveStoredAskQuestionText(question, 'en')).toBe('My custom question');
    expect(resolveStoredAskQuestionText(question, 'fa')).toBe('My custom question');
  });

  it('detects stored questions by source', () => {
    expect(
      hasStoredAskQuestion({
        submitted_at: Date.now(),
        source: 'suggestion',
        suggestion_id: 'energy',
      })
    ).toBe(true);
    expect(
      hasStoredAskQuestion({
        submitted_at: Date.now(),
        source: 'typed',
        text: 'Hello',
      })
    ).toBe(true);
    expect(
      hasStoredAskQuestion({
        submitted_at: Date.now(),
        source: 'typed',
        text: '   ',
      })
    ).toBe(false);
  });

  it('looks up suggestion text by id', () => {
    expect(getSuggestionText('fa', 'relationships')).toBe(
      'چطور می‌توانم یک رابطه مهم را همین حالا تقویت کنم؟'
    );
  });
});

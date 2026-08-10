import { describe, expect, it } from 'vitest';
import type { FtueAskQuestion } from './ask-question-repository';
import {
  getSuggestionText,
  hasStoredAskQuestion,
  resolveAskQuestion,
  resolveStoredAskQuestionText,
} from './resolve-ask-question';

describe('resolveAskQuestion', () => {
  it('resolves a guided question with execution metadata', () => {
    const question: FtueAskQuestion = {
      submitted_at: Date.now(),
      source: 'suggestion',
      suggestion_id: 'career-focus-week',
    };

    const resolved = resolveAskQuestion(question, 'en');

    expect(resolved.source).toBe('suggestion');
    expect(resolved.displayText).toBe('What should I focus on in my career this week?');
    expect(resolved.guidedQuestion?.id).toBe('career-focus-week');
    expect(resolved.executionMetadata).toEqual({
      actionType: 'career_focus',
      categoryId: 'career-work',
      needsTime: false,
    });
    expect(resolved.executionUnresolvedReason).toBeUndefined();
    expect(resolved.typedText).toBeUndefined();
  });

  it('resolves unsupported typed questions without inventing a Decision Type', () => {
    const question: FtueAskQuestion = {
      submitted_at: Date.now(),
      source: 'typed',
      text: 'My custom question',
    };

    const resolved = resolveAskQuestion(question, 'en');

    expect(resolved.source).toBe('typed');
    expect(resolved.displayText).toBe('My custom question');
    expect(resolved.typedText).toBe('My custom question');
    expect(resolved.guidedQuestion).toBeUndefined();
    expect(resolved.executionMetadata).toBeUndefined();
    expect(resolved.decisionTypeId).toBeUndefined();
    expect(resolved.executionUnresolvedReason).toBe(
      'typed_decision_unsupported'
    );
    expect(resolved.typedResolution).toEqual({ status: 'unsupported' });
  });

  it('binds typed exact questions to a shipped Decision Type', () => {
    const resolved = resolveAskQuestion(
      {
        submitted_at: Date.now(),
        source: 'typed',
        text: 'Is September 12 good for my job interview?',
      },
      'en'
    );

    expect(resolved.decisionTypeId).toBe('car-interview');
    expect(resolved.executionUnresolvedReason).toBeUndefined();
    expect(resolved.typedResolution).toEqual({
      status: 'exact',
      decisionTypeId: 'car-interview',
      domain: 'career',
    });
  });

  it('lets explicit decision_type_id win over typed resolver', () => {
    const resolved = resolveAskQuestion(
      {
        submitted_at: Date.now(),
        source: 'typed',
        text: 'Is September 12 good for my job interview?',
        decision_type_id: 'mar-wedding-date',
      },
      'en'
    );

    expect(resolved.decisionTypeId).toBe('mar-wedding-date');
    expect(resolved.typedResolution).toBeUndefined();
    expect(resolved.executionUnresolvedReason).toBeUndefined();
  });

  it('returns typed_decision_ambiguous without a Decision Type', () => {
    const resolved = resolveAskQuestion(
      {
        submitted_at: Date.now(),
        source: 'typed',
        text: 'Close an important business deal',
      },
      'en'
    );

    expect(resolved.decisionTypeId).toBeUndefined();
    expect(resolved.executionUnresolvedReason).toBe('typed_decision_ambiguous');
    expect(resolved.typedResolution?.status).toBe('ambiguous');
  });

  it('returns typed_decision_unsupported without a Decision Type', () => {
    const resolved = resolveAskQuestion(
      {
        submitted_at: Date.now(),
        source: 'typed',
        text: 'Should I relocate to Spain?',
      },
      'en'
    );

    expect(resolved.decisionTypeId).toBeUndefined();
    expect(resolved.executionUnresolvedReason).toBe(
      'typed_decision_unsupported'
    );
    expect(resolved.typedResolution).toEqual({
      status: 'unsupported',
      domain: 'relocation',
    });
  });

  it('resolves legacy suggestion ids for display without execution metadata', () => {
    const question: FtueAskQuestion = {
      submitted_at: Date.now(),
      source: 'suggestion',
      suggestion_id: 'career',
    };

    const resolved = resolveAskQuestion(question, 'en');

    expect(resolved.displayText).toBe('What should I focus on in my career this week?');
    expect(resolved.guidedQuestion).toBeUndefined();
    expect(resolved.executionMetadata).toBeUndefined();
    expect(resolved.executionUnresolvedReason).toBe('legacy_suggestion_id');
  });

  it('handles unknown suggestion ids safely', () => {
    const question: FtueAskQuestion = {
      submitted_at: Date.now(),
      source: 'suggestion',
      suggestion_id: 'not-a-real-guided-question',
    };

    const resolved = resolveAskQuestion(question, 'en');

    expect(resolved.displayText).toBe('');
    expect(resolved.guidedQuestion).toBeUndefined();
    expect(resolved.executionMetadata).toBeUndefined();
    expect(resolved.executionUnresolvedReason).toBe('unknown_suggestion_id');
  });

  it('handles missing suggestion id on suggestion source', () => {
    const question: FtueAskQuestion = {
      submitted_at: Date.now(),
      source: 'suggestion',
    };

    const resolved = resolveAskQuestion(question, 'en');

    expect(resolved.displayText).toBe('');
    expect(resolved.executionUnresolvedReason).toBe('missing_suggestion_id');
    expect(resolved.executionMetadata).toBeUndefined();
  });

  it('handles empty typed text as missing repository data', () => {
    const question: FtueAskQuestion = {
      submitted_at: Date.now(),
      source: 'typed',
      text: '   ',
    };

    const resolved = resolveAskQuestion(question, 'en');

    expect(resolved.displayText).toBe('');
    expect(resolved.typedText).toBe('');
    expect(resolved.executionUnresolvedReason).toBe('missing_question_text');
    expect(resolved.executionMetadata).toBeUndefined();
  });

  it('updates display text when locale changes for guided questions', () => {
    const question: FtueAskQuestion = {
      submitted_at: Date.now(),
      source: 'suggestion',
      suggestion_id: 'career-focus-week',
    };

    const en = resolveAskQuestion(question, 'en');
    const fa = resolveAskQuestion(question, 'fa');

    expect(en.displayText).toBe('What should I focus on in my career this week?');
    expect(fa.displayText).toBe('این هفته روی چه چیزی در مسیر شغلی‌ام تمرکز کنم؟');
    expect(en.executionMetadata?.actionType).toBe(fa.executionMetadata?.actionType);
  });

  it('keeps typed display text unchanged across locales', () => {
    const question: FtueAskQuestion = {
      submitted_at: Date.now(),
      source: 'typed',
      text: 'My custom question',
    };

    expect(resolveAskQuestion(question, 'en').displayText).toBe('My custom question');
    expect(resolveAskQuestion(question, 'fa').displayText).toBe('My custom question');
  });
});

describe('resolve-ask-question compatibility', () => {
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

  it('retuns typed text unchanged across locales', () => {
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
    expect(hasStoredAskQuestion(null)).toBe(false);
  });

  it('looks up suggestion text by id through the unified resolver', () => {
    expect(getSuggestionText('fa', 'relationships')).toBe(
      'چطور می‌توانم یک رابطه مهم را همین حالا تقویت کنم؟'
    );
    expect(getSuggestionText('en', 'career-focus-week')).toBe(
      'What should I focus on in my career this week?'
    );
    expect(getSuggestionText('en', 'not-a-real-guided-question')).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import type { FtueAskQuestion } from '../ask-question-repository';
import { resolveAskQuestion } from '../resolve-ask-question';
import { resolveDecisionRequest } from './resolver';

function fromStored(question: FtueAskQuestion, lang: 'en' | 'fa' = 'en') {
  return resolveDecisionRequest(resolveAskQuestion(question, lang));
}

describe('resolveDecisionRequest', () => {
  it('maps a resolved guided question with execution metadata', () => {
    const request = fromStored({
      submitted_at: Date.now(),
      source: 'suggestion',
      suggestion_id: 'career-focus-week',
    });

    expect(request).toEqual({
      displayText: 'What should I focus on in my career this week?',
      question: { source: 'guided' },
      execution: {
        guidedQuestionId: 'career-focus-week',
        actionType: 'career_focus',
        categoryId: 'career-work',
        needsTime: false,
      },
    });
  });

  it('maps typed questions without execution metadata', () => {
    const request = fromStored({
      submitted_at: Date.now(),
      source: 'typed',
      text: 'My custom question',
    });

    expect(request).toEqual({
      displayText: 'My custom question',
      question: { source: 'typed' },
      execution: {
        unresolvedReason: 'typed_question_unresolved',
      },
    });
    expect(request.execution.actionType).toBeUndefined();
    expect(request.execution.guidedQuestionId).toBeUndefined();
  });

  it('maps legacy suggestion ids as unresolved guided questions', () => {
    const request = fromStored({
      submitted_at: Date.now(),
      source: 'suggestion',
      suggestion_id: 'career',
    });

    expect(request).toEqual({
      displayText: 'What should I focus on in my career this week?',
      question: { source: 'guided' },
      execution: {
        unresolvedReason: 'legacy_suggestion_id',
      },
    });
    expect(request.execution.actionType).toBeUndefined();
    expect(request.execution.guidedQuestionId).toBeUndefined();
  });

  it('maps unknown suggestion ids as unresolved guided questions', () => {
    const request = fromStored({
      submitted_at: Date.now(),
      source: 'suggestion',
      suggestion_id: 'not-a-real-guided-question',
    });

    expect(request).toEqual({
      displayText: '',
      question: { source: 'guided' },
      execution: {
        unresolvedReason: 'unknown_suggestion_id',
      },
    });
  });

  it('maps missing suggestion id as unresolved guided question', () => {
    const request = fromStored({
      submitted_at: Date.now(),
      source: 'suggestion',
    });

    expect(request).toEqual({
      displayText: '',
      question: { source: 'guided' },
      execution: {
        unresolvedReason: 'missing_suggestion_id',
      },
    });
  });

  it('maps empty typed text as unresolved typed question', () => {
    const request = fromStored({
      submitted_at: Date.now(),
      source: 'typed',
      text: '   ',
    });

    expect(request).toEqual({
      displayText: '',
      question: { source: 'typed' },
      execution: {
        unresolvedReason: 'missing_question_text',
      },
    });
  });

  it('passes through display text without modification', () => {
    const resolved = resolveAskQuestion(
      {
        submitted_at: Date.now(),
        source: 'typed',
        text: '  leading and trailing  ',
      },
      'en'
    );

    const request = resolveDecisionRequest(resolved);

    expect(request.displayText).toBe(resolved.displayText);
    expect(resolved.displayText).toBe('leading and trailing');
  });

  it('maps deterministically for the same resolved input', () => {
    const resolved = resolveAskQuestion(
      {
        submitted_at: Date.now(),
        source: 'suggestion',
        suggestion_id: 'job-interview',
      },
      'en'
    );

    const first = resolveDecisionRequest(resolved);
    const second = resolveDecisionRequest(resolved);

    expect(first).toEqual(second);
    expect(first).toEqual({
      displayText: 'Job interview',
      question: { source: 'guided' },
      execution: {
        guidedQuestionId: 'job-interview',
        actionType: 'job_interview',
        categoryId: 'career-work',
        needsTime: true,
      },
    });
  });

  it('does not mutate the resolved input', () => {
    const resolved = resolveAskQuestion(
      {
        submitted_at: Date.now(),
        source: 'suggestion',
        suggestion_id: 'career-focus-week',
      },
      'en'
    );
    const snapshot = structuredClone(resolved);

    resolveDecisionRequest(resolved);

    expect(resolved).toEqual(snapshot);
  });

  it('maps guided questions with needsTime execution metadata', () => {
    const request = fromStored({
      submitted_at: Date.now(),
      source: 'suggestion',
      suggestion_id: 'job-interview',
    });

    expect(request.execution.needsTime).toBe(true);
    expect(request.execution.actionType).toBe('job_interview');
    expect(request.execution.guidedQuestionId).toBe('job-interview');
    expect(request.execution.unresolvedReason).toBeUndefined();
  });
});

import { describe, expect, it } from 'vitest';
import type { DecisionRequest } from '../decision-request';
import { prepareDecisionExecution } from './prepare';

function guidedRequest(
  overrides: Partial<DecisionRequest> & {
    execution?: Partial<DecisionRequest['execution']>;
  } = {}
): DecisionRequest {
  const base: DecisionRequest = {
    displayText: 'What should I focus on in my career this week?',
    question: { source: 'guided' },
    execution: {
      guidedQuestionId: 'career-focus-week',
      actionType: 'career_focus',
      categoryId: 'career-work',
      needsTime: false,
    },
  };

  return {
    ...base,
    ...overrides,
    question: { ...base.question, ...overrides.question },
    execution: { ...base.execution, ...overrides.execution },
  };
}

describe('prepareDecisionExecution', () => {
  it('marks a fully resolved guided request as ready', () => {
    const request = guidedRequest();

    const preparation = prepareDecisionExecution(request);

    expect(preparation.status).toBe('ready');
    if (preparation.status !== 'ready') return;

    expect(preparation.request).toEqual({
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

  it('keeps typed requests unresolved', () => {
    const request: DecisionRequest = {
      displayText: 'My custom question',
      question: { source: 'typed' },
      execution: { unresolvedReason: 'typed_question_unresolved' },
    };

    const preparation = prepareDecisionExecution(request);

    expect(preparation).toEqual({
      status: 'unresolved',
      request,
      reason: 'typed_question_unresolved',
    });
  });

  it('preserves an existing unresolved reason exactly', () => {
    const request = guidedRequest({
      execution: { unresolvedReason: 'legacy_suggestion_id' },
    });

    const preparation = prepareDecisionExecution(request);

    expect(preparation).toEqual({
      status: 'unresolved',
      request,
      reason: 'legacy_suggestion_id',
    });
  });

  it('keeps legacy guided requests unresolved', () => {
    const request = guidedRequest({
      displayText: 'What should I focus on in my career this week?',
      execution: {
        unresolvedReason: 'legacy_suggestion_id',
      },
    });

    const preparation = prepareDecisionExecution(request);

    expect(preparation.status).toBe('unresolved');
    if (preparation.status === 'ready') return;
    expect(preparation.reason).toBe('legacy_suggestion_id');
  });

  it('keeps unknown suggestion requests unresolved', () => {
    const request = guidedRequest({
      displayText: '',
      execution: {
        unresolvedReason: 'unknown_suggestion_id',
      },
    });

    const preparation = prepareDecisionExecution(request);

    expect(preparation).toEqual({
      status: 'unresolved',
      request,
      reason: 'unknown_suggestion_id',
    });
  });

  it('keeps guided requests missing actionType unresolved', () => {
    const request = guidedRequest({
      execution: {
        actionType: undefined,
      },
    });

    const preparation = prepareDecisionExecution(request);

    expect(preparation.status).toBe('unresolved');
    if (preparation.status === 'ready') return;
    expect(preparation.reason).toBe('incomplete_execution_metadata');
  });

  it('keeps guided requests missing guidedQuestionId unresolved', () => {
    const request = guidedRequest({
      execution: {
        guidedQuestionId: undefined,
      },
    });

    const preparation = prepareDecisionExecution(request);

    expect(preparation.status).toBe('unresolved');
    if (preparation.status === 'ready') return;
    expect(preparation.reason).toBe('incomplete_execution_metadata');
  });

  it('keeps guided requests missing categoryId unresolved', () => {
    const request = guidedRequest({
      execution: {
        categoryId: undefined,
      },
    });

    const preparation = prepareDecisionExecution(request);

    expect(preparation.status).toBe('unresolved');
    if (preparation.status === 'ready') return;
    expect(preparation.reason).toBe('incomplete_execution_metadata');
  });

  it('keeps guided requests missing needsTime unresolved', () => {
    const request = guidedRequest({
      execution: {
        needsTime: undefined,
      },
    });

    const preparation = prepareDecisionExecution(request);

    expect(preparation.status).toBe('unresolved');
    if (preparation.status === 'ready') return;
    expect(preparation.reason).toBe('incomplete_execution_metadata');
  });

  it('accepts needsTime false as ready', () => {
    const request = guidedRequest({
      execution: { needsTime: false },
    });

    const preparation = prepareDecisionExecution(request);

    expect(preparation.status).toBe('ready');
    if (preparation.status !== 'ready') return;
    expect(preparation.request.execution.needsTime).toBe(false);
  });

  it('accepts needsTime true as ready', () => {
    const request = guidedRequest({
      execution: {
        guidedQuestionId: 'job-interview',
        actionType: 'job_interview',
        categoryId: 'career-work',
        needsTime: true,
      },
    });

    const preparation = prepareDecisionExecution(request);

    expect(preparation.status).toBe('ready');
    if (preparation.status !== 'ready') return;
    expect(preparation.request.execution.needsTime).toBe(true);
  });

  it('returns ready output without optional execution fields', () => {
    const preparation = prepareDecisionExecution(guidedRequest());

    expect(preparation.status).toBe('ready');
    if (preparation.status !== 'ready') return;

    const { execution } = preparation.request;
    expect(Object.keys(execution).sort()).toEqual([
      'actionType',
      'categoryId',
      'guidedQuestionId',
      'needsTime',
    ]);
    expect('unresolvedReason' in execution).toBe(false);
  });

  it('does not mutate the input request', () => {
    const request = guidedRequest();
    const snapshot = structuredClone(request);

    prepareDecisionExecution(request);

    expect(request).toEqual(snapshot);
  });

  it('maps deterministically for the same request', () => {
    const request = guidedRequest({
      execution: {
        guidedQuestionId: 'job-interview',
        actionType: 'job_interview',
        categoryId: 'career-work',
        needsTime: true,
      },
    });

    expect(prepareDecisionExecution(request)).toEqual(
      prepareDecisionExecution(request)
    );
  });

  it('evaluates only the provided DecisionRequest contract', () => {
    const request: DecisionRequest = {
      displayText: 'Job interview',
      question: { source: 'guided' },
      execution: {
        guidedQuestionId: 'job-interview',
        actionType: 'job_interview',
        categoryId: 'career-work',
        needsTime: true,
      },
    };

    const preparation = prepareDecisionExecution(request);

    expect(preparation.status).toBe('ready');
    expect(preparation).toEqual({
      status: 'ready',
      request: {
        displayText: 'Job interview',
        question: { source: 'guided' },
        execution: {
          guidedQuestionId: 'job-interview',
          actionType: 'job_interview',
          categoryId: 'career-work',
          needsTime: true,
        },
      },
    });
  });

  it('defaults typed requests without an unresolved reason', () => {
    const request: DecisionRequest = {
      displayText: 'Typed without reason',
      question: { source: 'typed' },
      execution: {},
    };

    const preparation = prepareDecisionExecution(request);

    expect(preparation).toEqual({
      status: 'unresolved',
      request,
      reason: 'typed_question_unresolved',
    });
  });
});

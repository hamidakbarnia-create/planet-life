import { describe, expect, it } from 'vitest';
import type { DecisionExecutionPreparation } from '../decision-execution';
import { executePreparedDecision } from './facade';

const readyPreparation: DecisionExecutionPreparation = {
  status: 'ready',
  request: {
    displayText: 'What should I focus on in my career this week?',
    question: { source: 'guided' },
    execution: {
      guidedQuestionId: 'career-focus-week',
      actionType: 'career_focus',
      categoryId: 'career-work',
      needsTime: false,
    },
  },
};

describe('executePreparedDecision', () => {
  it('returns completed for ready preparation', () => {
    const response = executePreparedDecision(readyPreparation);

    expect(response.status).toBe('completed');
  });

  it('returns unresolved for unresolved preparation', () => {
    const preparation: DecisionExecutionPreparation = {
      status: 'unresolved',
      request: {
        displayText: 'Legacy question',
        question: { source: 'guided' },
        execution: { unresolvedReason: 'legacy_suggestion_id' },
      },
      reason: 'legacy_suggestion_id',
    };

    const response = executePreparedDecision(preparation);

    expect(response).toEqual({
      status: 'unresolved',
      reason: 'legacy_suggestion_id',
    });
  });

  it('preserves an existing unresolved reason exactly', () => {
    const preparation: DecisionExecutionPreparation = {
      status: 'unresolved',
      request: {
        displayText: '',
        question: { source: 'guided' },
        execution: { unresolvedReason: 'unknown_suggestion_id' },
      },
      reason: 'unknown_suggestion_id',
    };

    const response = executePreparedDecision(preparation);

    expect(response).toEqual({
      status: 'unresolved',
      reason: 'unknown_suggestion_id',
    });
  });

  it('keeps typed-question unresolved reasons unresolved', () => {
    const preparation: DecisionExecutionPreparation = {
      status: 'unresolved',
      request: {
        displayText: 'My custom question',
        question: { source: 'typed' },
        execution: { unresolvedReason: 'typed_question_unresolved' },
      },
      reason: 'typed_question_unresolved',
    };

    const response = executePreparedDecision(preparation);

    expect(response).toEqual({
      status: 'unresolved',
      reason: 'typed_question_unresolved',
    });
  });

  it('preserves actionType in completed results', () => {
    const response = executePreparedDecision(readyPreparation);

    expect(response.status).toBe('completed');
    if (response.status !== 'completed') return;
    expect(response.result.actionType).toBe('career_focus');
  });

  it('preserves guidedQuestionId in completed results', () => {
    const response = executePreparedDecision(readyPreparation);

    expect(response.status).toBe('completed');
    if (response.status !== 'completed') return;
    expect(response.result.guidedQuestionId).toBe('career-focus-week');
  });

  it('preserves categoryId in completed results', () => {
    const response = executePreparedDecision(readyPreparation);

    expect(response.status).toBe('completed');
    if (response.status !== 'completed') return;
    expect(response.result.categoryId).toBe('career-work');
  });

  it('preserves needsTime true in completed results', () => {
    const preparation: DecisionExecutionPreparation = {
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
    };

    const response = executePreparedDecision(preparation);

    expect(response.status).toBe('completed');
    if (response.status !== 'completed') return;
    expect(response.result.needsTime).toBe(true);
  });

  it('preserves needsTime false in completed results', () => {
    const response = executePreparedDecision(readyPreparation);

    expect(response.status).toBe('completed');
    if (response.status !== 'completed') return;
    expect(response.result.needsTime).toBe(false);
  });

  it('derives completed summary from displayText', () => {
    const response = executePreparedDecision(readyPreparation);

    expect(response.status).toBe('completed');
    if (response.status !== 'completed') return;
    expect(response.result.summary).toBe(
      'What should I focus on in my career this week?'
    );
  });

  it('builds a deterministic request ID from execution fields', () => {
    const response = executePreparedDecision(readyPreparation);

    expect(response.status).toBe('completed');
    if (response.status !== 'completed') return;
    expect(response.result.requestId).toBe('career-focus-week:career_focus');
  });

  it('returns deeply equal output for the same input', () => {
    expect(executePreparedDecision(readyPreparation)).toEqual(
      executePreparedDecision(readyPreparation)
    );
  });

  it('builds different request IDs for different guided question IDs', () => {
    const first = executePreparedDecision(readyPreparation);
    const second = executePreparedDecision({
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

    expect(first.status).toBe('completed');
    expect(second.status).toBe('completed');
    if (first.status !== 'completed' || second.status !== 'completed') return;

    expect(first.result.requestId).toBe('career-focus-week:career_focus');
    expect(second.result.requestId).toBe('job-interview:job_interview');
    expect(first.result.requestId).not.toBe(second.result.requestId);
  });

  it('does not mutate the input preparation', () => {
    const preparation = structuredClone(readyPreparation);
    const snapshot = structuredClone(preparation);

    executePreparedDecision(preparation);

    expect(preparation).toEqual(snapshot);
  });

  it('marks completed results with placeholder source', () => {
    const response = executePreparedDecision(readyPreparation);

    expect(response.status).toBe('completed');
    if (response.status !== 'completed') return;
    expect(response.result.source).toBe('placeholder');
  });

  it('does not depend on randomness or current time', () => {
    const first = executePreparedDecision(readyPreparation);
    const second = executePreparedDecision(readyPreparation);

    expect(first).toEqual(second);
    if (first.status !== 'completed' || second.status !== 'completed') return;

    expect(first.result.requestId).not.toMatch(/^\d{13}$/);
    expect(first.result.requestId).not.toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-/
    );
  });

  it('evaluates only the provided preparation contract', () => {
    const preparation: DecisionExecutionPreparation = {
      status: 'ready',
      request: {
        displayText: 'Contract-only request',
        question: { source: 'guided' },
        execution: {
          guidedQuestionId: 'contract-only',
          actionType: 'contract_action',
          categoryId: 'decisions-timing',
          needsTime: false,
        },
      },
    };

    expect(executePreparedDecision(preparation)).toEqual({
      status: 'completed',
      result: {
        requestId: 'contract-only:contract_action',
        actionType: 'contract_action',
        guidedQuestionId: 'contract-only',
        categoryId: 'decisions-timing',
        needsTime: false,
        summary: 'Contract-only request',
        source: 'placeholder',
      },
    });
  });
});

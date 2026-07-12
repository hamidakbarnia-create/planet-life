import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DecisionExecutionPreparation } from '../decision-execution';
import type { ProfileRecord } from '../profile/profile-types';
import * as decisionApi from '../decision-api';
import {
  executePreparedDecision,
  GUIDED_DECISION_CLIENT_TIMEOUT_MS,
} from './facade';

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

const completeProfile: ProfileRecord = {
  birth_date: '1990-06-15',
  birth_time: '14:30',
  birth_place: {
    name: 'New York, United States',
    short: 'New York',
    lat: 40.7128,
    lon: -74.006,
  },
  action_type: 'business_launch',
};

const readyOptions = {
  profile: completeProfile,
  locale: 'en' as const,
};

const successApiResult = {
  ok: true as const,
  httpStatus: 200 as const,
  body: {
    status: 'completed' as const,
    result: {
      requestId: 'career-focus-week:career_focus',
      actionType: 'career_focus',
      guidedQuestionId: 'career-focus-week',
      categoryId: 'career-work',
      needsTime: false,
      summary: 'What should I focus on in my career this week?',
      source: 'decision_api_boundary',
    },
  },
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('executePreparedDecision', () => {
  it('returns completed for ready preparation without options', async () => {
    const postSpy = vi.spyOn(decisionApi, 'postDecisionExecute');
    const response = await executePreparedDecision(readyPreparation);

    expect(response.status).toBe('completed');
    expect(postSpy).not.toHaveBeenCalled();
    if (response.status !== 'completed') return;
    expect(response.execution).toEqual({
      executed: false,
      reason: 'no_execution_context',
    });
    expect(response.api).toBeUndefined();
  });

  it('returns explicit no_execution_context without network when ready lacks options', async () => {
    const postSpy = vi.spyOn(decisionApi, 'postDecisionExecute');
    const response = await executePreparedDecision(readyPreparation);

    expect(postSpy).not.toHaveBeenCalled();
    expect(response).toEqual({
      status: 'completed',
      result: {
        requestId: 'career-focus-week:career_focus',
        actionType: 'career_focus',
        guidedQuestionId: 'career-focus-week',
        categoryId: 'career-work',
        needsTime: false,
        summary: 'What should I focus on in my career this week?',
        source: 'placeholder',
      },
      execution: { executed: false, reason: 'no_execution_context' },
    });
  });

  it('returns unresolved for unresolved preparation', async () => {
    const preparation: DecisionExecutionPreparation = {
      status: 'unresolved',
      request: {
        displayText: 'Legacy question',
        question: { source: 'guided' },
        execution: { unresolvedReason: 'legacy_suggestion_id' },
      },
      reason: 'legacy_suggestion_id',
    };

    const postSpy = vi.spyOn(decisionApi, 'postDecisionExecute');
    const response = await executePreparedDecision(preparation, readyOptions);

    expect(response).toEqual({
      status: 'unresolved',
      reason: 'legacy_suggestion_id',
    });
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('preserves an existing unresolved reason exactly', async () => {
    const preparation: DecisionExecutionPreparation = {
      status: 'unresolved',
      request: {
        displayText: '',
        question: { source: 'guided' },
        execution: { unresolvedReason: 'unknown_suggestion_id' },
      },
      reason: 'unknown_suggestion_id',
    };

    const response = await executePreparedDecision(preparation);

    expect(response).toEqual({
      status: 'unresolved',
      reason: 'unknown_suggestion_id',
    });
  });

  it('keeps typed-question unresolved reasons unresolved without network', async () => {
    const preparation: DecisionExecutionPreparation = {
      status: 'unresolved',
      request: {
        displayText: 'My custom question',
        question: { source: 'typed' },
        execution: { unresolvedReason: 'typed_question_unresolved' },
      },
      reason: 'typed_question_unresolved',
    };

    const postSpy = vi.spyOn(decisionApi, 'postDecisionExecute');
    const response = await executePreparedDecision(preparation, readyOptions);

    expect(response).toEqual({
      status: 'unresolved',
      reason: 'typed_question_unresolved',
    });
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('preserves actionType in completed results', async () => {
    const response = await executePreparedDecision(readyPreparation);

    expect(response.status).toBe('completed');
    if (response.status !== 'completed') return;
    expect(response.result.actionType).toBe('career_focus');
  });

  it('preserves guidedQuestionId in completed results', async () => {
    const response = await executePreparedDecision(readyPreparation);

    expect(response.status).toBe('completed');
    if (response.status !== 'completed') return;
    expect(response.result.guidedQuestionId).toBe('career-focus-week');
  });

  it('preserves categoryId in completed results', async () => {
    const response = await executePreparedDecision(readyPreparation);

    expect(response.status).toBe('completed');
    if (response.status !== 'completed') return;
    expect(response.result.categoryId).toBe('career-work');
  });

  it('preserves needsTime true in completed results', async () => {
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

    const response = await executePreparedDecision(preparation);

    expect(response.status).toBe('completed');
    if (response.status !== 'completed') return;
    expect(response.result.needsTime).toBe(true);
  });

  it('preserves needsTime false in completed results', async () => {
    const response = await executePreparedDecision(readyPreparation);

    expect(response.status).toBe('completed');
    if (response.status !== 'completed') return;
    expect(response.result.needsTime).toBe(false);
  });

  it('derives completed summary from displayText', async () => {
    const response = await executePreparedDecision(readyPreparation);

    expect(response.status).toBe('completed');
    if (response.status !== 'completed') return;
    expect(response.result.summary).toBe(
      'What should I focus on in my career this week?'
    );
  });

  it('builds a deterministic request ID from execution fields', async () => {
    const response = await executePreparedDecision(readyPreparation);

    expect(response.status).toBe('completed');
    if (response.status !== 'completed') return;
    expect(response.result.requestId).toBe('career-focus-week:career_focus');
  });

  it('returns deeply equal output for the same input without options', async () => {
    expect(await executePreparedDecision(readyPreparation)).toEqual(
      await executePreparedDecision(readyPreparation)
    );
  });

  it('builds different request IDs for different guided question IDs', async () => {
    const first = await executePreparedDecision(readyPreparation);
    const second = await executePreparedDecision({
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

  it('does not mutate the input preparation', async () => {
    const preparation = structuredClone(readyPreparation);
    const snapshot = structuredClone(preparation);

    await executePreparedDecision(preparation);

    expect(preparation).toEqual(snapshot);
  });

  it('marks completed results with placeholder source', async () => {
    const response = await executePreparedDecision(readyPreparation);

    expect(response.status).toBe('completed');
    if (response.status !== 'completed') return;
    expect(response.result.source).toBe('placeholder');
  });

  it('does not depend on randomness or current time without options', async () => {
    const first = await executePreparedDecision(readyPreparation);
    const second = await executePreparedDecision(readyPreparation);

    expect(first).toEqual(second);
    if (first.status !== 'completed' || second.status !== 'completed') return;

    expect(first.result.requestId).not.toMatch(/^\d{13}$/);
    expect(first.result.requestId).not.toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-/
    );
  });

  it('evaluates only the provided preparation contract without options', async () => {
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

    expect(await executePreparedDecision(preparation)).toEqual({
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
      execution: { executed: false, reason: 'no_execution_context' },
    });
  });
});

describe('executePreparedDecision Guided Ready wiring', () => {
  it('observes a successful Decision API response once', async () => {
    const postSpy = vi
      .spyOn(decisionApi, 'postDecisionExecute')
      .mockResolvedValue(successApiResult);

    const response = await executePreparedDecision(
      readyPreparation,
      readyOptions
    );

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
    expect(response.status).toBe('completed');
    if (response.status !== 'completed') return;
    expect(response.result.source).toBe('placeholder');
    expect(response.execution).toEqual({ executed: true });
    expect(response.api).toEqual(successApiResult);
  });

  it('observes a contract error envelope without retry', async () => {
    const errorResult = {
      ok: false as const,
      kind: 'contract_error' as const,
      httpStatus: 500,
      body: {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal decision execution failure',
          requestId: 'career-focus-week:career_focus',
        },
      },
    };
    const postSpy = vi
      .spyOn(decisionApi, 'postDecisionExecute')
      .mockResolvedValue(errorResult);

    const response = await executePreparedDecision(
      readyPreparation,
      readyOptions
    );

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(response.status).toBe('completed');
    if (response.status !== 'completed') return;
    expect(response.execution).toEqual({ executed: true });
    expect(response.api).toEqual(errorResult);
  });

  it('observes network_error on timeout abort without retry', async () => {
    vi.useFakeTimers();
    const postSpy = vi
      .spyOn(decisionApi, 'postDecisionExecute')
      .mockImplementation(async (_request, options) => {
        return await new Promise((resolve) => {
          options?.signal?.addEventListener('abort', () => {
            resolve({ ok: false, kind: 'network_error' });
          });
        });
      });

    const pending = executePreparedDecision(readyPreparation, readyOptions);
    await vi.advanceTimersByTimeAsync(GUIDED_DECISION_CLIENT_TIMEOUT_MS);
    const response = await pending;

    expect(GUIDED_DECISION_CLIENT_TIMEOUT_MS).toBe(5000);
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(response.status).toBe('completed');
    if (response.status !== 'completed') return;
    expect(response.execution).toEqual({ executed: true });
    expect(response.api).toEqual({ ok: false, kind: 'network_error' });
  });

  it('observes transport network_error without retry', async () => {
    const postSpy = vi
      .spyOn(decisionApi, 'postDecisionExecute')
      .mockResolvedValue({ ok: false, kind: 'network_error' });

    const response = await executePreparedDecision(
      readyPreparation,
      readyOptions
    );

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(response.status).toBe('completed');
    if (response.status !== 'completed') return;
    expect(response.execution).toEqual({ executed: true });
    expect(response.api).toEqual({ ok: false, kind: 'network_error' });
  });

  it('observes malformed_response without retry', async () => {
    const postSpy = vi
      .spyOn(decisionApi, 'postDecisionExecute')
      .mockResolvedValue({
        ok: false,
        kind: 'malformed_response',
        httpStatus: 200,
      });

    const response = await executePreparedDecision(
      readyPreparation,
      readyOptions
    );

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(response.status).toBe('completed');
    if (response.status !== 'completed') return;
    expect(response.execution).toEqual({ executed: true });
    expect(response.api).toEqual({
      ok: false,
      kind: 'malformed_response',
      httpStatus: 200,
    });
  });

  it('uses the Task 2.2 request builder for Guided Ready transport', async () => {
    const buildSpy = vi.spyOn(decisionApi, 'buildDecisionExecuteRequest');
    const postSpy = vi
      .spyOn(decisionApi, 'postDecisionExecute')
      .mockResolvedValue(successApiResult);

    await executePreparedDecision(readyPreparation, readyOptions);

    expect(buildSpy).toHaveBeenCalledTimes(1);
    expect(buildSpy).toHaveBeenCalledWith({
      request: readyPreparation.request,
      profile: completeProfile,
      locale: 'en',
    });
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        request_id: 'career-focus-week:career_focus',
        guided_question_id: 'career-focus-week',
      })
    );
  });

  it('does not call the HTTP client when the builder rejects', async () => {
    const postSpy = vi.spyOn(decisionApi, 'postDecisionExecute');
    const response = await executePreparedDecision(readyPreparation, {
      profile: {
        ...completeProfile,
        birth_date: '',
      },
      locale: 'en',
    });

    expect(postSpy).not.toHaveBeenCalled();
    expect(response.status).toBe('completed');
    if (response.status !== 'completed') return;
    expect(response.execution).toEqual({
      executed: false,
      reason: 'build_failed',
    });
    expect(response.api).toBeUndefined();
  });

  it('clears the timeout timer after success', async () => {
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
    vi.spyOn(decisionApi, 'postDecisionExecute').mockResolvedValue(
      successApiResult
    );

    await executePreparedDecision(readyPreparation, readyOptions);

    expect(clearSpy).toHaveBeenCalled();
  });

  it('clears the timeout timer after failure', async () => {
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
    vi.spyOn(decisionApi, 'postDecisionExecute').mockResolvedValue({
      ok: false,
      kind: 'network_error',
    });

    await executePreparedDecision(readyPreparation, readyOptions);

    expect(clearSpy).toHaveBeenCalled();
  });

  it('aborts the internal request when the external signal aborts', async () => {
    const external = new AbortController();
    const postSpy = vi
      .spyOn(decisionApi, 'postDecisionExecute')
      .mockImplementation(async (_request, options) => {
        return await new Promise((resolve) => {
          options?.signal?.addEventListener('abort', () => {
            resolve({ ok: false, kind: 'network_error' });
          });
        });
      });

    const pending = executePreparedDecision(readyPreparation, {
      ...readyOptions,
      signal: external.signal,
    });
    external.abort();
    const response = await pending;

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(response.status).toBe('completed');
    if (response.status !== 'completed') return;
    expect(response.execution).toEqual({ executed: true });
    expect(response.api).toEqual({ ok: false, kind: 'network_error' });
  });

  it('aborts immediately when the external signal is already aborted', async () => {
    const external = new AbortController();
    external.abort();
    let seenAborted = false;
    const postSpy = vi
      .spyOn(decisionApi, 'postDecisionExecute')
      .mockImplementation(async (_request, options) => {
        seenAborted = options?.signal?.aborted === true;
        return { ok: false, kind: 'network_error' };
      });

    const response = await executePreparedDecision(readyPreparation, {
      ...readyOptions,
      signal: external.signal,
    });

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(seenAborted).toBe(true);
    expect(response.status).toBe('completed');
    if (response.status !== 'completed') return;
    expect(response.api).toEqual({ ok: false, kind: 'network_error' });
  });

  it('removes the external abort listener after completion', async () => {
    const external = new AbortController();
    const addSpy = vi.spyOn(external.signal, 'addEventListener');
    const removeSpy = vi.spyOn(external.signal, 'removeEventListener');
    vi.spyOn(decisionApi, 'postDecisionExecute').mockResolvedValue(
      successApiResult
    );

    await executePreparedDecision(readyPreparation, {
      ...readyOptions,
      signal: external.signal,
    });

    expect(addSpy).toHaveBeenCalledWith('abort', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('abort', expect.any(Function));
    const added = addSpy.mock.calls[0]?.[1];
    const removed = removeSpy.mock.calls[0]?.[1];
    expect(removed).toBe(added);
  });

  it('does not retry after a transport failure', async () => {
    const postSpy = vi
      .spyOn(decisionApi, 'postDecisionExecute')
      .mockResolvedValue({ ok: false, kind: 'network_error' });

    await executePreparedDecision(readyPreparation, readyOptions);
    await Promise.resolve();
    await Promise.resolve();

    expect(postSpy).toHaveBeenCalledTimes(1);
  });
});

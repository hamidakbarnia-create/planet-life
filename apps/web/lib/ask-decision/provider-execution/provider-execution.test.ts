/**
 * P2.2-03 Ask provider-execution boundary tests.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { ASK_DECISION_SCHEMA_VERSION } from '@/lib/ask-decision';
import { createProviderCallBudget } from '@/lib/ask-decision/safe-regeneration';
import {
  ASK_PROVIDER_TIMEOUT_MS_DEFAULT,
  classifyAskMessageUsability,
  executeAskProviderCall,
  resolveAskProviderTimeoutMs,
  toFallbackReason,
} from '@/lib/ask-decision/provider-execution';

function decisionJson(message = 'ok') {
  return JSON.stringify({
    schemaVersion: ASK_DECISION_SCHEMA_VERSION,
    executiveSummary: message,
    recommendation: message,
    recommendationStatus: 'proceed-with-caution',
    scores: {
      opportunity: { value: 60, rationale: 'r' },
      risk: { value: 40, rationale: 'r' },
      timing: { value: 50, rationale: 'r' },
      readiness: { value: 55, rationale: 'r' },
      confidence: { value: 50, rationale: 'r' },
    },
    analysis: [],
    scenarios: {},
    actionPlan: { now: [], next7Days: [], next30Days: [] },
    alternatives: [],
    assumptions: [],
    confidence: {
      level: 'medium',
      score: 50,
      explanation: 'e',
      missingInputs: [],
      limitingFactors: [],
    },
    limitations: [],
    relatedModules: [],
    followUpQuestions: ['a', 'b', 'c'],
    safetyNotice: null,
  });
}

describe('provider timeout config', () => {
  it('defaults to 25s and accepts positive override', () => {
    expect(ASK_PROVIDER_TIMEOUT_MS_DEFAULT).toBe(25_000);
    expect(resolveAskProviderTimeoutMs({})).toBe(25_000);
    expect(
      resolveAskProviderTimeoutMs({ NEXT_PUBLIC_ASK_PROVIDER_TIMEOUT_MS: '12000' })
    ).toBe(12_000);
    expect(
      resolveAskProviderTimeoutMs({ NEXT_PUBLIC_ASK_PROVIDER_TIMEOUT_MS: '-1' })
    ).toBe(25_000);
  });
});

describe('message usability', () => {
  it('rejects empty / whitespace / non-JSON for structured ask', () => {
    expect(classifyAskMessageUsability(undefined, true)).toBe('empty_response');
    expect(classifyAskMessageUsability(null, true)).toBe('empty_response');
    expect(classifyAskMessageUsability('', true)).toBe('empty_response');
    expect(classifyAskMessageUsability('   ', true)).toBe('empty_response');
    expect(classifyAskMessageUsability('hello world', true)).toBe(
      'invalid_output'
    );
    expect(classifyAskMessageUsability(decisionJson(), true)).toBeNull();
  });
});

describe('executeAskProviderCall', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('normal success: call count 1, no failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        status: 200,
        json: async () => ({
          type: 'decision',
          message: decisionJson('success'),
          sources: [],
          request_id: 'r1',
          reasoning: null,
          uncertainty: null,
        }),
      }))
    );
    const budget = createProviderCallBudget();
    const out = await executeAskProviderCall({
      messages: [{ role: 'user', content: 'q' }],
      locale: 'en',
      purpose: 'initial',
      budget,
    });
    expect(out.ok).toBe(true);
    expect(out.attempt.status).toBe('success');
    expect(budget.used).toBe(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('timeout: classifies timeout, call count 1, no retry', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init?: { signal?: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              const err = new Error('aborted');
              err.name = 'AbortError';
              reject(err);
            });
          })
      )
    );
    const budget = createProviderCallBudget();
    const pending = executeAskProviderCall({
      messages: [{ role: 'user', content: 'q' }],
      locale: 'en',
      purpose: 'initial',
      budget,
      timeoutMs: 50,
    });
    await vi.advanceTimersByTimeAsync(60);
    const out = await pending;
    expect(out.ok).toBe(false);
    expect(out.failureReason).toBe('timeout');
    expect(budget.used).toBe(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(toFallbackReason('timeout')).toBe('timeout');
  });

  it('network failure: call count 1', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('network down');
      })
    );
    const budget = createProviderCallBudget();
    const out = await executeAskProviderCall({
      messages: [{ role: 'user', content: 'q' }],
      locale: 'en',
      purpose: 'initial',
      budget,
    });
    expect(out.failureReason).toBe('network_error');
    expect(budget.used).toBe(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each([400, 401, 403, 429, 500, 503])(
    'HTTP %s → http_error, call count 1',
    async (status) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          status,
          json: async () => ({ error: 'x' }),
        }))
      );
      const budget = createProviderCallBudget();
      const out = await executeAskProviderCall({
        messages: [{ role: 'user', content: 'q' }],
        locale: 'en',
        purpose: 'initial',
        budget,
      });
      expect(out.failureReason).toBe('http_error');
      expect(out.httpStatus).toBe(status);
      expect(budget.used).toBe(1);
      expect(fetch).toHaveBeenCalledTimes(1);
    }
  );

  it('empty / whitespace message → empty_response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        status: 200,
        json: async () => ({
          type: 'decision',
          message: '   ',
          sources: [],
          request_id: 'r-empty',
          reasoning: null,
          uncertainty: null,
        }),
      }))
    );
    const budget = createProviderCallBudget();
    const out = await executeAskProviderCall({
      messages: [{ role: 'user', content: 'q' }],
      locale: 'en',
      purpose: 'initial',
      budget,
    });
    expect(out.ok).toBe(false);
    expect(out.failureReason).toBe('empty_response');
    expect(budget.used).toBe(1);
  });

  it('malformed structured output → invalid_output', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        status: 200,
        json: async () => ({
          type: 'decision',
          message: 'not-json-at-all',
          sources: [],
          request_id: 'r-bad',
          reasoning: null,
          uncertainty: null,
        }),
      }))
    );
    const budget = createProviderCallBudget();
    const out = await executeAskProviderCall({
      messages: [{ role: 'user', content: 'q' }],
      locale: 'en',
      purpose: 'initial',
      budget,
    });
    expect(out.failureReason).toBe('invalid_output');
    expect(budget.used).toBe(1);
  });

  it('cancelled via external abort', async () => {
    const controller = new AbortController();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init?: { signal?: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              const err = new Error('aborted');
              err.name = 'AbortError';
              reject(err);
            });
          })
      )
    );
    const budget = createProviderCallBudget();
    const pending = executeAskProviderCall({
      messages: [{ role: 'user', content: 'q' }],
      locale: 'en',
      purpose: 'initial',
      budget,
      signal: controller.signal,
      timeoutMs: 60_000,
    });
    controller.abort();
    const out = await pending;
    expect(out.failureReason).toBe('cancelled');
    expect(budget.used).toBe(1);
  });

  it('budget exhaustion does not invoke provider', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const budget = createProviderCallBudget();
    budget.consume();
    budget.consume();
    const out = await executeAskProviderCall({
      messages: [{ role: 'user', content: 'q' }],
      locale: 'en',
      purpose: 'safe_regeneration',
      budget,
    });
    expect(out.failureReason).toBe('budget_exhausted');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(budget.used).toBe(2);
  });

  it('second call for language_retry then budget blocks further calls', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        status: 200,
        json: async () => ({
          type: 'decision',
          message: decisionJson(),
          sources: [],
          request_id: 'r',
          reasoning: null,
          uncertainty: null,
        }),
      }))
    );
    const budget = createProviderCallBudget();
    const a = await executeAskProviderCall({
      messages: [{ role: 'user', content: '1' }],
      locale: 'fa',
      purpose: 'initial',
      budget,
    });
    const b = await executeAskProviderCall({
      messages: [{ role: 'user', content: '2' }],
      locale: 'fa',
      purpose: 'language_retry',
      budget,
    });
    const c = await executeAskProviderCall({
      messages: [{ role: 'user', content: '3' }],
      locale: 'fa',
      purpose: 'safe_regeneration',
      budget,
    });
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    expect(c.failureReason).toBe('budget_exhausted');
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(budget.used).toBe(2);
  });
});

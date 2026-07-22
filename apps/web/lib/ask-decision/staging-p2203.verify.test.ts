/**
 * P2.2-03 staging verification — provider hardening.
 * Runs only when STAGING_E2E=1.
 *
 * Live paths hit the staging Conversation API.
 * Failure paths use controlled injection (mock fetch / callProvider)
 * so production behaviour is unchanged and no public failure controls exist.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import type { BirthProfile } from '@/lib/birth-profile';
import { API_BASE } from '@/lib/calendar-scores';
import {
  ASK_DECISION_SCHEMA_VERSION,
  runAskDecision,
} from '@/lib/ask-decision';
import {
  ASK_MAX_PROVIDER_CALLS,
  ASK_PROVIDER_TIMEOUT_MS_DEFAULT,
  buildSafeRegenerationDecision,
  createProviderCallBudget,
  executeAskProviderCall,
  executeSafeRegeneration,
  resolveAskProviderTimeoutMs,
} from '@/lib/ask-decision';
import {
  fullySupportedReport,
  largeStructuralMismatchReport,
} from '@/lib/ask-decision/safe-regeneration/fixtures';
import { postConversationExecute } from '@/lib/conversation-client';
import type { ConversationLocale } from '@/lib/conversation-client';
import { englishProviderResult } from '@/lib/ask-decision/english-provider-result.fixture';
import type { AskDecisionResult } from '@/lib/ask-decision';
import type { GroundingProvenance } from '@/lib/ask-decision/grounding';

const ENABLED = process.env.STAGING_E2E === '1';
const OUT_DIR = join(process.cwd(), 'locale-evidence', 'p2.2-03-staging');

const PROFILE: BirthProfile = {
  birth_date: '1990-06-15',
  birth_time: '14:30',
  location: 'London',
  action_type: 'business_launch',
};

type Row = Record<string, unknown>;
const rows: Row[] = [];

function groundingStub(): GroundingProvenance {
  return {
    version: '1.0.0',
    status: 'used',
    builtAt: new Date().toISOString(),
    evidence: [],
    claims: [],
  } as GroundingProvenance;
}

function decisionJson(message = 'ok') {
  return JSON.stringify({
    schemaVersion: ASK_DECISION_SCHEMA_VERSION,
    executiveSummary: message,
    recommendation: message,
    recommendationStatus: 'proceed-with-caution',
    scores: {
      opportunity: { value: 60, explanation: 'r' },
      risk: { value: 40, explanation: 'r' },
      timing: { value: 50, explanation: 'r' },
      readiness: { value: 55, explanation: 'r' },
      confidence: { value: 50, explanation: 'r' },
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

describe.skipIf(!ENABLED)('P2.2-03 staging provider hardening', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('targets staging API and documents budget + timeout defaults', () => {
    expect(new URL(API_BASE).hostname).not.toBe('api.metioro.com');
    expect(ASK_MAX_PROVIDER_CALLS).toBe(2);
    expect(resolveAskProviderTimeoutMs()).toBe(ASK_PROVIDER_TIMEOUT_MS_DEFAULT);
    rows.push({
      id: 'policy',
      maxProviderCalls: ASK_MAX_PROVIDER_CALLS,
      timeoutMsDefault: ASK_PROVIDER_TIMEOUT_MS_DEFAULT,
      apiBase: API_BASE,
      cancellationMode: 'client_abort_of_wait_not_proven_server_cancel',
    });
  });

  it('live: normal provider success with providerExecution metadata', async () => {
    const out = await runAskDecision({
      question:
        'Should I negotiate a 12% raise with peer salary data before the review?',
      profile: PROFILE,
      locale: 'en',
      continueWithAssumptions: true,
    });
    const pe = out.result.meta?.providerExecution;
    expect(out.pendingClarification).toBe(false);
    expect(pe).toBeDefined();
    expect(pe!.maxCalls).toBe(2);
    expect(pe!.callCount).toBeGreaterThanOrEqual(1);
    expect(pe!.callCount).toBeLessThanOrEqual(2);
    expect(pe!.attempts.length).toBe(pe!.callCount);
    expect(JSON.stringify(out.result)).not.toMatch(/stack|TypeError|ECONNREFUSED/i);
    rows.push({
      id: 'live-success',
      callCount: pe?.callCount,
      status: pe?.status,
      fallbackUsed: pe?.fallbackUsed,
      fallback: out.result.meta?.fallback,
      retained12: JSON.stringify(out.result).includes('12%'),
      requestId: out.result.meta?.requestId,
    });
  }, 120_000);

  it.each([
    ['en', 'Should I accept a Series B offer with a 14 month runway?'],
    ['fa', 'Should I accept a Series B offer with a 14 month runway?'],
    ['ar', 'Should I accept a Series B offer with a 14 month runway?'],
    ['ru', 'Should I accept a Series B offer with a 14 month runway?'],
  ] as const)(
    'live locale %s providerExecution bounded + no raw error leak',
    async (locale, question) => {
      const out = await runAskDecision({
        question,
        profile: PROFILE,
        locale: locale as ConversationLocale,
        continueWithAssumptions: true,
      });
      const pe = out.result.meta?.providerExecution;
      expect(pe).toBeDefined();
      expect(pe!.callCount).toBeLessThanOrEqual(2);
      expect(out.result.recommendationStatus).toBeTruthy();
      const blob = JSON.stringify(out.result);
      expect(blob).not.toMatch(/AbortError|network down|ECONNRESET/);
      rows.push({
        id: `locale-${locale}`,
        callCount: pe?.callCount,
        status: pe?.status,
        fallbackUsed: pe?.fallbackUsed,
        retained14: blob.toLowerCase().includes('14'),
        retainedSeriesB: blob.includes('Series B'),
      });
    },
    180_000
  );

  it('controlled: timeout → classified, callCount=1, no retry', async () => {
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
      timeoutMs: 40,
    });
    await vi.advanceTimersByTimeAsync(50);
    const out = await pending;
    expect(out.failureReason).toBe('timeout');
    expect(budget.used).toBe(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    rows.push({ id: 'timeout', failureReason: out.failureReason, used: budget.used });
  });

  it('controlled: empty response → empty_response, no second call', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        status: 200,
        json: async () => ({
          type: 'decision',
          message: '   ',
          sources: [],
          request_id: 'empty',
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
    expect(out.failureReason).toBe('empty_response');
    expect(budget.used).toBe(1);
    rows.push({ id: 'empty', failureReason: out.failureReason });
  });

  it('controlled: invalid structured output → invalid_output', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        status: 200,
        json: async () => ({
          type: 'decision',
          message: 'not-json',
          sources: [],
          request_id: 'bad',
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
      requireStructuredJson: true,
    });
    expect(out.failureReason).toBe('invalid_output');
    expect(budget.used).toBe(1);
    rows.push({ id: 'invalid_output', failureReason: out.failureReason });
  });

  it('controlled: provider exception → normalized, no raw leak', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('secret-sdk-boom');
      })
    );
    const budget = createProviderCallBudget();
    const out = await executeAskProviderCall({
      messages: [{ role: 'user', content: 'q' }],
      locale: 'en',
      purpose: 'initial',
      budget,
    });
    expect(out.ok).toBe(false);
    expect(['provider_exception', 'unknown_failure', 'network_error']).toContain(
      out.failureReason
    );
    expect(JSON.stringify(out)).not.toContain('secret-sdk-boom');
    expect(budget.used).toBe(1);
    rows.push({ id: 'provider_exception', failureReason: out.failureReason });
  });

  it('controlled: language retry failure retains original (budget=2)', async () => {
    const englishOk = {
      ok: true as const,
      body: {
        type: 'decision' as const,
        message: decisionJson(
          'Should I accept Series B with 14 month runway? Proceed carefully.'
        ),
        sources: [] as string[],
        request_id: 'en-1',
        reasoning: null,
        uncertainty: null,
      },
    };
    let calls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        calls += 1;
        if (calls === 1) {
          return {
            status: 200,
            json: async () => englishOk.body,
          };
        }
        throw new TypeError('network');
      })
    );

    // Direct boundary: initial + language_retry failure
    const budget = createProviderCallBudget();
    const first = await executeAskProviderCall({
      messages: [{ role: 'user', content: '1' }],
      locale: 'fa',
      purpose: 'initial',
      budget,
      requireStructuredJson: true,
    });
    expect(first.ok).toBe(true);
    const second = await executeAskProviderCall({
      messages: [{ role: 'user', content: '2' }],
      locale: 'fa',
      purpose: 'language_retry',
      budget,
    });
    expect(second.ok).toBe(false);
    expect(budget.used).toBe(2);
    const third = await executeAskProviderCall({
      messages: [{ role: 'user', content: '3' }],
      locale: 'fa',
      purpose: 'safe_regeneration',
      budget,
    });
    expect(third.failureReason).toBe('budget_exhausted');
    expect(calls).toBe(2);
    rows.push({
      id: 'language_retry_failure',
      calls,
      budgetUsed: budget.used,
      third: third.failureReason,
    });
  });

  it('controlled: Safe Regeneration failure retains original, no third call', async () => {
    const budget = createProviderCallBudget();
    budget.consume();
    const decision = buildSafeRegenerationDecision(
      largeStructuralMismatchReport()
    );
    const original = {
      ...(englishProviderResult as AskDecisionResult),
      executiveSummary:
        'Keep 40% savings constraint and liquidity lock risk framing.',
      recommendation: 'Do not commit 40% until downside cap exists.',
    };
    let providerCalls = 0;
    const out = await executeSafeRegeneration({
      decision,
      originalResult: original,
      originalGrounding: groundingStub(),
      originalValidation: largeStructuralMismatchReport(),
      promptMessages: [{ role: 'user', content: 'x' }],
      budget,
      callProvider: async () => {
        providerCalls += 1;
        return { ok: false, kind: 'network_error' };
      },
      parseResult: () => original,
      groundAndValidate: () => ({
        grounding: groundingStub(),
        validation: fullySupportedReport(),
      }),
    });
    expect(providerCalls).toBe(1);
    expect(budget.used).toBe(2);
    expect(out.result).toBe(original);
    expect(out.safeRegeneration.outcome).toBe('regeneration_failed');
    expect(JSON.stringify(out.result)).toContain('40%');
    expect(JSON.stringify(out.result)).toContain('liquidity lock');
    rows.push({
      id: 'safe_regen_failure',
      outcome: out.safeRegeneration.outcome,
      providerCalls,
      budgetUsed: budget.used,
    });
  });

  it('controlled: budget exhaustion does not invoke provider', async () => {
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
    rows.push({ id: 'budget_exhausted', failureReason: out.failureReason });
  });

  it('live smoke: staging conversation execute still healthy', async () => {
    const res = await postConversationExecute(
      [{ role: 'user', content: 'P2.2-03 staging health probe' }],
      'en'
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.body.request_id).toBeTruthy();
      expect(typeof res.body.message).toBe('string');
    }
    rows.push({
      id: 'api-smoke',
      ok: res.ok,
      requestId: res.ok ? res.body.request_id : null,
    });
  }, 60_000);
});

afterAll(() => {
  if (!ENABLED) return;
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    join(OUT_DIR, 'VERIFICATION.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        commit: process.env.NEXT_PUBLIC_RELEASE_SHA ?? null,
        apiBase: API_BASE,
        maxProviderCalls: ASK_MAX_PROVIDER_CALLS,
        timeoutMsDefault: ASK_PROVIDER_TIMEOUT_MS_DEFAULT,
        cancellation:
          'Client AbortSignal aborts the local await/fetch wait. Server-side provider cancellation is not proven (logical timeout / client abort).',
        rows,
      },
      null,
      2
    )
  );
});

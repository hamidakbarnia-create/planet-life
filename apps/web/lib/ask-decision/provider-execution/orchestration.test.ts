/**
 * P2.2-03 orchestration: initial provider failure → safe fallback, no regen, ≤2 calls.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ASK_DECISION_SCHEMA_VERSION, runAskDecision } from '@/lib/ask-decision';
import { postConversationExecute } from '@/lib/conversation-client';

vi.mock('@/lib/pathfinder-decision/timing', () => ({
  loadPathfinderTiming: vi.fn(async () => null),
}));

vi.mock('@/lib/conversation-client', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/lib/conversation-client')>();
  return {
    ...actual,
    postConversationExecute: vi.fn(),
  };
});

describe('provider hardening orchestration', () => {
  const originalFlag = process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED;

  beforeEach(() => {
    process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED = 'false';
    vi.mocked(postConversationExecute).mockReset();
  });

  afterEach(() => {
    if (originalFlag === undefined) {
      delete process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED;
    } else {
      process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED = originalFlag;
    }
  });

  it('initial network failure → fallback, unavailable grounding, no second call', async () => {
    vi.mocked(postConversationExecute).mockResolvedValueOnce({
      ok: false,
      kind: 'network_error',
    });

    const out = await runAskDecision({
      question: 'Should I accept the Series B offer with 14 months runway?',
      profile: null,
      locale: 'en',
      continueWithAssumptions: true,
    });

    expect(postConversationExecute).toHaveBeenCalledTimes(1);
    expect(out.result.meta?.fallback).toBe(true);
    expect(out.result.meta?.grounding?.status).toBe('unavailable');
    expect(out.result.meta?.validation?.status).toBe('unavailable');
    expect(out.result.meta?.safeRegeneration?.outcome).toBe('not_requested');
    expect(out.result.meta?.providerExecution?.callCount).toBe(1);
    expect(out.result.meta?.providerExecution?.maxCalls).toBe(2);
    expect(out.result.meta?.providerExecution?.fallbackUsed).toBe(true);
    expect(out.result.recommendationStatus).toBe('gather-more-information');
  });

  it('initial empty message → empty_response fallback, call count 1', async () => {
    vi.mocked(postConversationExecute).mockResolvedValueOnce({
      ok: true,
      body: {
        type: 'decision',
        message: '  ',
        sources: [],
        request_id: 'empty-1',
        reasoning: null,
        uncertainty: null,
      },
    });

    const out = await runAskDecision({
      question: 'Should I wait?',
      profile: null,
      locale: 'en',
      continueWithAssumptions: true,
    });

    expect(postConversationExecute).toHaveBeenCalledTimes(1);
    expect(out.result.meta?.fallback).toBe(true);
    expect(
      out.result.meta?.providerExecution?.attempts[0]?.failureReason
    ).toBe('empty_response');
    expect(out.result.meta?.grounding?.status).toBe('unavailable');
  });

  it('locales EN/FA/AR/RU survive initial http 503 without crash', async () => {
    for (const locale of ['en', 'fa', 'ar', 'ru'] as const) {
      vi.mocked(postConversationExecute).mockReset();
      vi.mocked(postConversationExecute).mockResolvedValueOnce({
        ok: false,
        kind: 'contract_error',
        httpStatus: 503,
      });
      const out = await runAskDecision({
        question: 'Should I ask for a 12% raise?',
        profile: null,
        locale,
        continueWithAssumptions: true,
      });
      expect(postConversationExecute).toHaveBeenCalledTimes(1);
      expect(out.result.meta?.fallback).toBe(true);
      expect(out.result.meta?.providerExecution?.callCount).toBe(1);
      expect(out.result.recommendation).toBeTruthy();
      // No English "Proceed with" scaffold leakage expected for non-en fallback copy
      if (locale !== 'en') {
        expect(out.result.recommendation).not.toMatch(/\bProceed with\b/i);
      }
    }
  });

  it('does not invent schema version on fallback', async () => {
    vi.mocked(postConversationExecute).mockResolvedValueOnce({
      ok: false,
      kind: 'contract_error',
      httpStatus: 500,
    });
    const out = await runAskDecision({
      question: 'x',
      profile: null,
      locale: 'en',
      continueWithAssumptions: true,
    });
    expect(out.result.schemaVersion).toBe(ASK_DECISION_SCHEMA_VERSION);
  });
});

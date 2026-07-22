/**
 * runAskDecision ↔ meta.safeRegeneration (P2.1b-05).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ASK_DECISION_SCHEMA_VERSION,
  SAFE_REGENERATION_SOURCE,
  SAFE_REGENERATION_VERSION,
  runAskDecision,
} from '@/lib/ask-decision';
import { postConversationExecute } from '@/lib/conversation-client';

vi.mock('@/lib/pathfinder-decision/timing', () => ({
  loadPathfinderTiming: vi.fn(async () => null),
}));

vi.mock('@/lib/conversation-client', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/lib/conversation-client')>();
  return {
    ...actual,
    postConversationExecute: vi.fn(async () => ({
      ok: true as const,
      body: {
        type: 'decision' as const,
        message: JSON.stringify({
          schemaVersion: ASK_DECISION_SCHEMA_VERSION,
          executiveSummary: 'Summary.',
          recommendation: 'Proceed carefully.',
          recommendationStatus: 'proceed-with-caution',
          scores: {
            opportunity: { value: 60, rationale: 'ok' },
            risk: { value: 40, rationale: 'ok' },
            timing: { value: 50, rationale: 'ok' },
            readiness: { value: 55, rationale: 'ok' },
            confidence: { value: 50, rationale: 'ok' },
          },
          analysis: [
            { id: 'situation', title: 'S', body: 'b' },
            { id: 'factors', title: 'F', body: 'b' },
            { id: 'opportunities', title: 'O', body: 'b' },
            { id: 'risks', title: 'R', body: 'b' },
            { id: 'tradeoffs', title: 'T', body: 'b' },
            { id: 'personal-fit', title: 'P', body: 'b' },
            { id: 'what-could-change', title: 'W', body: 'b' },
            { id: 'why', title: 'Y', body: 'b' },
          ],
          scenarios: {
            bestCase: {
              outcome: 'a',
              likelihoodBand: 'medium',
              keyConditions: [],
              earlySignals: [],
              mitigation: 'm',
            },
            mostLikely: {
              outcome: 'a',
              likelihoodBand: 'medium',
              keyConditions: [],
              earlySignals: [],
              mitigation: 'm',
            },
            downsideCase: {
              outcome: 'a',
              likelihoodBand: 'medium',
              keyConditions: [],
              earlySignals: [],
              mitigation: 'm',
            },
          },
          actionPlan: {
            now: [
              {
                action: 'a',
                purpose: 'p',
                priority: 'high',
                completionSignal: 'c',
              },
            ],
            next7Days: [],
            next30Days: [],
          },
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
          followUpQuestions: ['q1', 'q2', 'q3'],
          safetyNotice: null,
        }),
        request_id: 'req-safe-regen-1',
      },
    })),
  };
});

describe('runAskDecision safeRegeneration meta', () => {
  const originalFlag = process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED;

  beforeEach(() => {
    process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED = 'false';
    vi.mocked(postConversationExecute).mockClear();
  });

  afterEach(() => {
    if (originalFlag === undefined) {
      delete process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED;
    } else {
      process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED = originalFlag;
    }
  });

  it('attaches meta.safeRegeneration without regenerating or extra provider calls', async () => {
    const out = await runAskDecision({
      question: 'Should I accept this job offer?',
      profile: null,
      locale: 'en',
      continueWithAssumptions: true,
    });

    expect(out.result.meta?.safeRegeneration?.version).toBe(
      SAFE_REGENERATION_VERSION
    );
    expect(out.result.meta?.safeRegeneration?.source).toBe(
      SAFE_REGENERATION_SOURCE
    );
    expect(['used', 'unavailable']).toContain(
      out.result.meta?.safeRegeneration?.status
    );
    expect(typeof out.result.meta?.safeRegeneration?.shouldRegenerate).toBe(
      'boolean'
    );
    expect(out.result.meta?.safeRegeneration?.confidence).toBeGreaterThanOrEqual(
      0
    );
    expect(out.result.meta?.safeRegeneration?.confidence).toBeLessThanOrEqual(1);
    expect(out.result.meta?.validation).toBeDefined();
    expect('safeRegeneration' in out).toBe(false);

    // Decision only — single provider call, no retry for regeneration
    expect(postConversationExecute).toHaveBeenCalledTimes(1);

    // Public fields unchanged
    expect(out.result.schemaVersion).toBe(ASK_DECISION_SCHEMA_VERSION);
    expect(out.result.recommendationStatus).toBe('proceed-with-caution');
  });
});

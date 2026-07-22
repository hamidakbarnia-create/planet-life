/**
 * runAskDecision ↔ grounding meta attachment (P2.1b-03).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ASK_DECISION_SCHEMA_VERSION,
  GROUNDING_PROVENANCE_VERSION,
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
            next7Days: [
              {
                action: 'a',
                purpose: 'p',
                priority: 'medium',
                completionSignal: 'c',
              },
            ],
            next30Days: [
              {
                action: 'a',
                purpose: 'p',
                priority: 'low',
                completionSignal: 'c',
              },
            ],
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
        request_id: 'req-grounding-1',
      },
    })),
  };
});

describe('runAskDecision grounding meta', () => {
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

  it('attaches meta.grounding only (presentation-safe)', async () => {
    const out = await runAskDecision({
      question: 'Should I accept this job offer?',
      profile: null,
      locale: 'en',
      continueWithAssumptions: true,
    });

    expect(out.result.schemaVersion).toBe(ASK_DECISION_SCHEMA_VERSION);
    expect(out.result.meta?.grounding?.version).toBe(
      GROUNDING_PROVENANCE_VERSION
    );
    expect(out.result.meta?.grounding?.status).toBe('used');
    expect(out.result.meta?.grounding?.evidence.length).toBeGreaterThan(0);
    expect(out.result.meta?.grounding?.claims.length).toBeGreaterThan(0);
    expect(
      out.result.meta?.grounding?.claims.every((c) => c.status === 'unknown')
    ).toBe(true);
    expect(out.result.meta?.sources).toContain('grounding-v1');
    expect('grounding' in out).toBe(false);

    // Public fields still present / unchanged contract
    expect(out.result.recommendationStatus).toBe('proceed-with-caution');
    expect(out.result.recommendation).toBeTruthy();
  });

  it('attaches grounding on clarification pending path', async () => {
    const out = await runAskDecision({
      question: 'Should I accept it?',
      profile: null,
      locale: 'en',
    });
    expect(out.pendingClarification).toBe(true);
    expect(out.result.meta?.grounding?.version).toBe(
      GROUNDING_PROVENANCE_VERSION
    );
    expect(['used', 'degraded', 'unavailable']).toContain(
      out.result.meta?.grounding?.status
    );
  });
});

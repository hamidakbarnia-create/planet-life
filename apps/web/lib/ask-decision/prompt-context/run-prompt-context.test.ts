/**
 * runAskDecision ↔ structured prompt-context flag / degradation.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ASK_DECISION_SCHEMA_VERSION, runAskDecision } from '@/lib/ask-decision';
import * as serializeModule from '@/lib/ask-decision/prompt-context/serialize';
import { postConversationExecute } from '@/lib/conversation-client';

function countExactOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let i = 0;
  while ((i = haystack.indexOf(needle, i)) !== -1) {
    count += 1;
    i += needle.length;
  }
  return count;
}

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
        request_id: 'req-pc-1',
      },
    })),
  };
});

describe('runAskDecision promptContext meta', () => {
  const original = process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED;
    } else {
      process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED = original;
    }
    vi.restoreAllMocks();
  });

  it('uses legacy prompt when flag unset (opt-in default)', async () => {
    delete process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED;
    const out = await runAskDecision({
      question: 'Should I accept this job offer?',
      profile: null,
      locale: 'en',
      continueWithAssumptions: true,
    });
    expect(out.result.meta?.promptContext).toEqual({
      version: '1.0.0',
      status: 'unavailable',
    });
    expect(out.result.meta?.sources ?? []).not.toContain('prompt-context-v1');
    expect('promptContext' in out).toBe(false);

    const prompt = vi.mocked(postConversationExecute).mock.calls[0][0][0]
      .content;
    expect(prompt).toContain('USER QUESTION:');
    expect(prompt).not.toContain('DECISION_CONTEXT_JSON:');
  });

  it('uses structured prompt when flag enabled', async () => {
    process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED = '1';
    const exactQuestion = 'Should I accept this job offer?';
    const out = await runAskDecision({
      question: exactQuestion,
      profile: null,
      locale: 'en',
      continueWithAssumptions: true,
    });
    expect(out.result.meta?.promptContext).toEqual({
      version: '1.0.0',
      status: 'used',
    });
    expect(out.result.meta?.sources).toContain('prompt-context-v1');

    const prompt = vi.mocked(postConversationExecute).mock.calls[0][0][0]
      .content;
    expect(prompt).toContain('DECISION_CONTEXT_JSON:');
    expect(prompt).toContain('DECISION_INSTRUCTIONS:');
    expect(prompt).not.toContain('USER QUESTION:');
    expect(countExactOccurrences(prompt, exactQuestion)).toBe(1);
  });

  it('uses legacy prompt when flag disabled', async () => {
    process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED = '0';
    // Long enough that decisionStatement is truncated ≠ exact question.
    const exactQuestion =
      'Should I accept the uniquely-phrased NovaCorp Senior Engineer offer with relocation support and a twelve percent raise after careful comparison against my current stable role in London this quarter?';
    const out = await runAskDecision({
      question: exactQuestion,
      profile: null,
      locale: 'en',
      continueWithAssumptions: true,
    });
    expect(out.result.meta?.promptContext).toEqual({
      version: '1.0.0',
      status: 'unavailable',
    });
    expect(out.result.meta?.sources ?? []).not.toContain('prompt-context-v1');

    const prompt = vi.mocked(postConversationExecute).mock.calls[0][0][0]
      .content;
    expect(prompt).not.toContain('DECISION_CONTEXT_JSON:');
    expect(prompt).toContain('USER QUESTION:');
    expect(prompt).toContain(`USER QUESTION:\n${exactQuestion}`);
    expect(prompt).toContain('RESPONSE SCHEMA:');
    expect(countExactOccurrences(prompt, exactQuestion)).toBe(1);
  });

  it('degrades to legacy prompt when serializer fails', async () => {
    process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED = 'true';
    vi.spyOn(serializeModule, 'serializeDecisionPromptContext').mockReturnValue({
      ok: false,
      errors: ['forced serialize failure'],
    });

    const exactQuestion =
      'Should I accept the uniquely-phrased NovaCorp Senior Engineer offer with relocation support and a twelve percent raise after careful comparison against my current stable role in London this quarter?';
    const out = await runAskDecision({
      question: exactQuestion,
      profile: null,
      locale: 'en',
      continueWithAssumptions: true,
    });

    expect(out.result.meta?.promptContext?.status).toBe('degraded');
    expect(out.result.meta?.sources ?? []).not.toContain('prompt-context-v1');
    expect(out.result.recommendationStatus).toBeTruthy();
    expect(out.pendingClarification).toBe(false);

    const prompt = vi.mocked(postConversationExecute).mock.calls[0][0][0]
      .content;
    expect(prompt).not.toContain('DECISION_CONTEXT_JSON:');
    expect(prompt).toContain('USER QUESTION:');
    expect(prompt).toContain(`USER QUESTION:\n${exactQuestion}`);
    expect(prompt).toContain('RESPONSE SCHEMA:');
    expect(countExactOccurrences(prompt, exactQuestion)).toBe(1);
  });

  it('marks promptContext unavailable on clarification pending', async () => {
    delete process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED;
    const out = await runAskDecision({
      question: 'Should I accept it?',
      profile: null,
      locale: 'en',
    });
    expect(out.pendingClarification).toBe(true);
    expect(out.result.meta?.promptContext).toEqual({
      version: '1.0.0',
      status: 'unavailable',
    });
  });
});

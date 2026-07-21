/**
 * Contract regression: Ask V3 must use ADR-0007 Conversation API surface
 * without inventing a new public HTTP contract.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ASK_DECISION_SCHEMA_VERSION,
  runAskDecision,
  sanitizeAskAnalyticsProperties,
  toAskVaultSavePayload,
  saveAskDecisionToVault,
} from '@/lib/ask-decision';
import {
  clearIntelligenceProfileStorage,
  regeneratePersonalIntelligenceProfile,
} from '@/lib/intelligence';
import type { BirthProfile } from '@/lib/birth-profile';
import {
  CONVERSATION_EXECUTE_PATH,
  postConversationExecute,
} from '@/lib/conversation-client';

vi.mock('@/lib/pathfinder-decision/timing', () => ({
  loadPathfinderTiming: vi.fn(async () => null),
}));

vi.mock('@/lib/conversation-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/conversation-client')>();
  return {
    ...actual,
    postConversationExecute: vi.fn(async () => ({
      ok: true as const,
      body: {
        type: 'decision' as const,
        message: JSON.stringify({
          schemaVersion: ASK_DECISION_SCHEMA_VERSION,
          executiveSummary:
            'Decision: wait for one more signal. Recommendation: gather more information. Caution: missing terms. Next: write criteria.',
          recommendation: 'Gather one more written constraint before deciding.',
          recommendationStatus: 'gather-more-information',
          scores: {
            opportunity: { value: 52, rationale: 'Moderate upside.' },
            risk: { value: 48, rationale: 'Manageable risk.' },
            timing: { value: 50, rationale: 'Neutral timing.' },
            readiness: { value: 45, rationale: 'Needs one input.' },
            confidence: { value: 40, rationale: 'Limited inputs.' },
          },
          analysis: [
            { id: 'situation', title: 'Situation', body: 'Open decision.' },
            { id: 'factors', title: 'Main Factors', body: 'Terms unclear.' },
            { id: 'opportunities', title: 'Opportunities', body: 'Upside if terms improve.' },
            { id: 'risks', title: 'Risks', body: 'Lock-in.' },
            { id: 'tradeoffs', title: 'Trade-offs', body: 'Speed vs clarity.' },
            { id: 'personal-fit', title: 'Personal Fit', body: 'Needs checklist.' },
            { id: 'what-could-change', title: 'What Could Change', body: 'New terms.' },
            { id: 'why', title: 'Why', body: 'Missing constraint.' },
          ],
          scenarios: {
            bestCase: {
              outcome: 'Clear terms',
              likelihoodBand: 'medium',
              keyConditions: ['Written constraints'],
              earlySignals: ['Reply received'],
              mitigation: 'Keep options open',
            },
            mostLikely: {
              outcome: 'Deferred decision',
              likelihoodBand: 'high',
              keyConditions: ['Partial info'],
              earlySignals: ['Silence'],
              mitigation: 'Ask one question',
            },
            downsideCase: {
              outcome: 'Rushed accept',
              likelihoodBand: 'low',
              keyConditions: ['Pressure'],
              earlySignals: ['Deadline push'],
              mitigation: 'Pause',
            },
          },
          actionPlan: {
            now: [
              {
                action: 'Write success criteria',
                purpose: 'Clarify bar',
                priority: 'critical',
                completionSignal: 'Criteria written',
              },
            ],
            next7Days: [
              {
                action: 'Request missing terms in writing',
                purpose: 'Reduce unknowns',
                priority: 'high',
                completionSignal: 'Reply received',
              },
            ],
            next30Days: [
              {
                action: 'Re-evaluate with criteria',
                purpose: 'Validate',
                priority: 'medium',
                completionSignal: 'Review note',
              },
            ],
          },
          alternatives: [],
          assumptions: ['Details roughly as stated'],
          confidence: {
            level: 'low',
            score: 40,
            explanation: 'Missing constraint.',
            missingInputs: ['written terms'],
            limitingFactors: ['Not a prediction'],
          },
          limitations: ['Comparative support only'],
          relatedModules: [],
          followUpQuestions: [
            'What constraint is still missing?',
            'What would make waiting better?',
            'What proves progress this week?',
          ],
          safetyNotice: null,
        }),
        sources: [],
        request_id: 'conv-req-contract-1',
        reasoning: 'Missing written constraints reduce confidence.',
        uncertainty: 'Moderate — terms incomplete.',
      },
    })),
  };
});

const sample: BirthProfile = {
  birth_date: '1990-06-15',
  birth_time: '09:30',
  location: 'London',
  action_type: 'business_launch',
};

describe('Ask V3 ↔ Conversation API contract', () => {
  beforeEach(() => {
    localStorage.clear();
    clearIntelligenceProfileStorage();
    vi.mocked(postConversationExecute).mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls the existing conversation execute client (no new endpoint)', async () => {
    expect(CONVERSATION_EXECUTE_PATH).toBe('/api/v1/conversation/execute');
    await runAskDecision({
      question: 'Should I accept this job offer?',
      profile: sample,
      locale: 'en',
      continueWithAssumptions: true,
    });
    expect(postConversationExecute).toHaveBeenCalledTimes(1);
  });

  it('uses existing messages + locale request structure', async () => {
    await runAskDecision({
      question: 'Should I accept this job offer?',
      profile: sample,
      locale: 'en',
      continueWithAssumptions: true,
    });
    const [messages, locale, options] = vi.mocked(postConversationExecute).mock.calls[0]!;
    expect(locale).toBe('en');
    expect(Array.isArray(messages)).toBe(true);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(
      expect.objectContaining({
        role: 'user',
        content: expect.any(String),
      })
    );
    expect(options?.conversationId).toBeUndefined();
  });

  it('consumes public success envelope fields without requiring a new response shape', async () => {
    const out = await runAskDecision({
      question: 'Should I accept this job offer?',
      profile: sample,
      locale: 'en',
      continueWithAssumptions: true,
    });
    const body = await vi.mocked(postConversationExecute).mock.results[0]!.value;
    expect(body.ok).toBe(true);
    if (!body.ok) return;
    expect(body.body).toEqual(
      expect.objectContaining({
        type: 'decision',
        message: expect.any(String),
        sources: expect.any(Array),
        request_id: 'conv-req-contract-1',
        reasoning: expect.any(String),
        uncertainty: expect.any(String),
      })
    );
    expect(out.result.schemaVersion).toBe(ASK_DECISION_SCHEMA_VERSION);
    expect(out.result.meta?.requestId).toBe('conv-req-contract-1');
  });

  it('retains request_id only as internal metadata', async () => {
    const out = await runAskDecision({
      question: 'Should I accept this job offer?',
      profile: sample,
      locale: 'en',
      continueWithAssumptions: true,
    });
    expect(out.result.meta?.requestId).toBe('conv-req-contract-1');
    expect(JSON.stringify(out.result)).toContain('conv-req-contract-1');
    expect(out.result.executiveSummary).not.toContain('conv-req-contract-1');
    expect(out.result.recommendation).not.toContain('conv-req-contract-1');
  });

  it('does not place raw birth profile values into the Conversation API message', async () => {
    regeneratePersonalIntelligenceProfile(sample);
    await runAskDecision({
      question: 'Should I accept this job offer?',
      profile: sample,
      locale: 'en',
      continueWithAssumptions: true,
    });
    const [messages] = vi.mocked(postConversationExecute).mock.calls[0]!;
    const content = messages[0]!.content;
    expect(content).not.toContain('1990-06-15');
    expect(content).not.toContain('09:30');
    expect(content).not.toContain('London');
  });

  it('converts failed public responses to structured fallback without leaking provider output', async () => {
    vi.mocked(postConversationExecute).mockResolvedValueOnce({
      ok: false,
      kind: 'contract_error',
    });
    const out = await runAskDecision({
      question: 'Should I accept this job offer?',
      profile: sample,
      locale: 'en',
      continueWithAssumptions: true,
    });
    expect(out.result.meta?.fallback).toBe(true);
    expect(out.result.confidence.level).toBe('low');
    const serialized = JSON.stringify(out.result);
    expect(serialized).not.toMatch(/openai|anthropic|stack trace|sdk exception/i);
    expect(serialized).not.toContain('provider_response_body');
  });
});

describe('Ask analytics + local vault semantics', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sanitises case variants and suspicious nested analytics values', () => {
    const safe = sanitizeAskAnalyticsProperties({
      Question: 'secret question',
      TEXT: 'nope',
      Prompt: 'system prompt leak',
      Birth: '1990-06-15',
      PROFILE: { birth_date: '1990-06-15' },
      nested: { question: 'hidden', intent: 'career' },
      payload: { x: 1 },
      intent: 'career',
      high_stakes: true,
      used_profile: false,
    });
    expect(safe.Question).toBeUndefined();
    expect(safe.TEXT).toBeUndefined();
    expect(safe.Prompt).toBeUndefined();
    expect(safe.Birth).toBeUndefined();
    expect(safe.PROFILE).toBeUndefined();
    expect(safe.nested).toBeUndefined();
    expect(safe.payload).toBeUndefined();
    expect(safe.intent).toBe('career');
    expect(safe.high_stakes).toBe(true);
    expect(safe.used_profile).toBe(false);
  });

  it('documents localStorage vault adapter semantics without backend Vault', async () => {
    const out = await runAskDecision({
      question: 'Should I wait before accepting?',
      profile: null,
      locale: 'en',
      continueWithAssumptions: true,
    });
    const payload = toAskVaultSavePayload('Should I wait before accepting?', out.result);
    expect(payload.question).toBe('Should I wait before accepting?');
    expect(JSON.stringify(payload)).not.toContain('1990-06-15');
    expect(JSON.stringify(payload)).not.toContain('PERSONAL INTELLIGENCE');

    const saved = saveAskDecisionToVault('Should I wait before accepting?', out.result);
    expect(saved?.question).toBe('Should I wait before accepting?');
    const raw = localStorage.getItem('planet-life-ask-decision-saves');
    expect(raw).toBeTruthy();
    const list = JSON.parse(raw!) as unknown[];
    expect(list).toHaveLength(1);
  });
});

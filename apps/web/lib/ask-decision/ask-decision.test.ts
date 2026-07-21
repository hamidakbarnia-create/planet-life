/**
 * Ask Decision Intelligence Engine V3 — focused tests.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ASK_DECISION_SCHEMA_VERSION,
  clampScore,
  detectIntent,
  evaluateClarification,
  extractJsonObject,
  frameDecision,
  parseAskDecisionResponse,
  runAskDecision,
  sanitizeAskAnalyticsProperties,
  validateAskDecisionResult,
  buildStructuredFallback,
  toAskVaultSavePayload,
} from '@/lib/ask-decision';
import { serializeAskIntelligenceContext as serializeCore } from '@/lib/intelligence';
import {
  buildPersonalIntelligenceProfile,
  clearIntelligenceProfileStorage,
  regeneratePersonalIntelligenceProfile,
} from '@/lib/intelligence';
import type { BirthProfile } from '@/lib/birth-profile';
import { buildTimingIntelligence } from '@/lib/ask-decision/local-build';

vi.mock('@/lib/pathfinder-decision/timing', () => ({
  loadPathfinderTiming: vi.fn(async () => ({
    signals: {
      todayScore: 62,
      weekScore: 58,
      monthScore: 55,
      avoidScore: 31,
    },
    timing: {
      bestToday: {
        label: 'Best Today',
        dateRange: '2026-07-20',
        score: 62,
        note: 'Supportive',
      },
      bestThisWeek: {
        label: 'Best This Week',
        dateRange: '2026-07-20 → 2026-07-26',
        score: 58,
        note: 'Week peak',
      },
      bestThisMonth: {
        label: 'Best This Month',
        dateRange: '2026-07-20 → 2026-08-16',
        score: 70,
        note: 'Month peak',
      },
      avoidWindow: {
        label: 'Avoid Window',
        dateRange: '2026-07-22',
        score: 31,
        note: 'Low window',
      },
    },
  })),
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
            'Decision: accept the offer with checkpoints. Recommendation: proceed with caution. Caution: downside terms. Next: list non-negotiables.',
          recommendation: 'Proceed with a written checklist before accepting.',
          recommendationStatus: 'proceed-with-caution',
          scores: {
            opportunity: { value: 68, rationale: 'Clear upside if terms hold.' },
            risk: { value: 44, rationale: 'Contract downside manageable.' },
            timing: { value: 60, rationale: 'Timing supportive this week.' },
            readiness: { value: 58, rationale: 'Ready with one more check.' },
            confidence: { value: 61, rationale: 'Moderate clarity.' },
          },
          analysis: [
            { id: 'situation', title: 'Situation', body: 'Offer decision.' },
            { id: 'factors', title: 'Main Factors', body: 'Terms and timing.' },
            { id: 'opportunities', title: 'Opportunities', body: 'Career step.' },
            { id: 'risks', title: 'Risks', body: 'Lock-in.' },
            { id: 'tradeoffs', title: 'Trade-offs', body: 'Speed vs terms.' },
            { id: 'personal-fit', title: 'Personal Fit', body: 'Fits analytical style.' },
            { id: 'what-could-change', title: 'What Could Change', body: 'Worse terms.' },
            { id: 'why', title: 'Why', body: 'Reversible checks first.' },
          ],
          scenarios: {
            bestCase: {
              outcome: 'Strong terms',
              likelihoodBand: 'medium',
              keyConditions: ['Negotiation succeeds'],
              earlySignals: ['Written concessions'],
              mitigation: 'Keep offer open',
            },
            mostLikely: {
              outcome: 'Accept with trade-offs',
              likelihoodBand: 'high',
              keyConditions: ['Mixed terms'],
              earlySignals: ['Partial flexibility'],
              mitigation: 'Checklist',
            },
            downsideCase: {
              outcome: 'Regret lock-in',
              likelihoodBand: 'low',
              keyConditions: ['Skipped review'],
              earlySignals: ['Pressure'],
              mitigation: 'Delay signature',
            },
          },
          actionPlan: {
            now: [
              {
                action: 'List three non-negotiable terms',
                purpose: 'Clarify bar',
                priority: 'critical',
                completionSignal: 'List written',
              },
            ],
            next7Days: [
              {
                action: 'Request termination clause in writing',
                purpose: 'Reduce lock-in',
                priority: 'high',
                completionSignal: 'Clause received',
              },
            ],
            next30Days: [
              {
                action: 'Review decision against success criteria',
                purpose: 'Validate',
                priority: 'medium',
                completionSignal: 'Review note',
              },
            ],
          },
          alternatives: [],
          assumptions: ['Offer details roughly as stated'],
          confidence: {
            level: 'medium',
            score: 61,
            explanation: 'Proceed with checkpoints.',
            missingInputs: [],
            limitingFactors: ['Not a prediction'],
          },
          limitations: ['Comparative support only'],
          relatedModules: [
            {
              module: 'pathfinder',
              reason: 'Deeper workflow',
              actionLabel: 'Open Pathfinder',
            },
          ],
          followUpQuestions: [
            'What terms should I negotiate before accepting?',
            'What would make waiting worthwhile?',
            'How should I discuss compensation without escalating?',
          ],
          safetyNotice: null,
        }),
        sources: [],
        request_id: 'ask-v3-1',
        reasoning: null,
        uncertainty: 'Moderate',
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

describe('intent detection V3', () => {
  it('classifies career questions with controlled intent', () => {
    const intent = detectIntent('Should I accept this job offer?');
    expect(intent.primaryIntent).toBe('career');
    expect(intent.decisionPresent).toBe(true);
    expect(intent.confidence).toBeGreaterThan(0);
  });

  it('flags high-stakes legal/health/investment', () => {
    expect(detectIntent('Should I sign this legal contract?').highStakesFlag).toBe(
      true
    );
    expect(detectIntent('Should I invest in this stock?').highStakesFlag).toBe(true);
    expect(detectIntent('Is this medical treatment right?').highStakesFlag).toBe(
      true
    );
  });

  it('returns unknown for empty text', () => {
    expect(detectIntent('').primaryIntent).toBe('unknown');
  });
});

describe('decision framing + clarification', () => {
  it('frames a decision with explicit unknowns', () => {
    const intent = detectIntent('Should I accept this job offer this month?');
    const frame = frameDecision('Should I accept this job offer this month?', intent);
    expect(frame.timeHorizon).toBe('weeks');
    expect(frame.urgency).toBeTruthy();
    expect(frame.requiresClarification).toBe(false);
  });

  it('requires clarification for vague subjects', () => {
    const intent = detectIntent('Should I accept it?');
    const frame = frameDecision('Should I accept it?', intent);
    const clarification = evaluateClarification(frame, intent);
    expect(clarification.required).toBe(true);
    expect(clarification.question).toBeTruthy();
  });

  it('does not require clarification when subject is clear', () => {
    const intent = detectIntent('Should I wait before launching the product?');
    const frame = frameDecision('Should I wait before launching the product?', intent);
    expect(evaluateClarification(frame, intent).required).toBe(false);
  });
});

describe('privacy + no-profile', () => {
  beforeEach(() => {
    localStorage.clear();
    clearIntelligenceProfileStorage();
  });

  it('serialized intelligence context excludes raw birth data', () => {
    regeneratePersonalIntelligenceProfile(sample);
    const payload = serializeCore(
      buildPersonalIntelligenceProfile(sample, {
        nowIso: '2026-07-20T12:00:00.000Z',
        decisionHistory: null,
      })
    )!;
    expect(JSON.stringify(payload).includes('London')).toBe(false);
    expect(JSON.stringify(payload).includes('1990-06-15')).toBe(false);
  });

  it('runs without a profile', async () => {
    const out = await runAskDecision({
      question: 'Should I accept this job offer?',
      profile: null,
      locale: 'en',
      continueWithAssumptions: true,
    });
    expect(out.pendingClarification).toBe(false);
    expect(out.result.scores.opportunity.value).toBeGreaterThanOrEqual(0);
    expect(out.result.confidence.missingInputs.length).toBeGreaterThanOrEqual(0);
  });
});

describe('parsing, scores, validation', () => {
  it('clamps scores', () => {
    expect(clampScore(150)).toBe(100);
    expect(clampScore(-4)).toBe(0);
    expect(clampScore('x', 50)).toBe(50);
  });

  it('extracts JSON from fenced content', () => {
    const raw = '```json\n{"recommendation":"Wait"}\n```';
    expect(extractJsonObject(raw)).toEqual({ recommendation: 'Wait' });
  });

  it('parses structured response and validates', () => {
    const intent = detectIntent('Should I accept this job offer?');
    const frame = frameDecision('Should I accept this job offer?', intent);
    const timing = buildTimingIntelligence(null, true, false);
    const result = parseAskDecisionResponse({
      conversationMessage: JSON.stringify({
        schemaVersion: ASK_DECISION_SCHEMA_VERSION,
        executiveSummary: 'Accept with caution. Check terms. Next: list non-negotiables now.',
        recommendation: 'Proceed with caution after term review.',
        recommendationStatus: 'proceed-with-caution',
        scores: {
          opportunity: { value: 200, rationale: 'High' },
          risk: { value: -10, rationale: 'Low' },
          timing: { value: 55, rationale: 'Ok' },
          readiness: { value: 50, rationale: 'Ok' },
          confidence: { value: 50, rationale: 'Ok' },
        },
        analysis: [],
        actionPlan: {
          now: [
            {
              action: 'List non-negotiables',
              purpose: 'Clarity',
              priority: 'critical',
              completionSignal: 'Done',
            },
          ],
          next7Days: [
            {
              action: 'Request clause',
              purpose: 'Risk',
              priority: 'high',
              completionSignal: 'Done',
            },
          ],
          next30Days: [
            {
              action: 'Review',
              purpose: 'Validate',
              priority: 'medium',
              completionSignal: 'Done',
            },
          ],
        },
        followUpQuestions: ['A?', 'B?', 'C?'],
        confidence: {
          level: 'medium',
          score: 50,
          explanation: 'Ok',
          missingInputs: [],
          limitingFactors: [],
        },
        assumptions: [],
        limitations: [],
        relatedModules: [],
        alternatives: [],
        safetyNotice: null,
      }),
      intent,
      frame,
      timing,
      usedProfile: false,
      usedTiming: false,
      decisionStyles: [],
      generatedAt: '2026-07-20T12:00:00.000Z',
      requestId: 'r1',
      clarificationAnswer: null,
      sources: [],
    });
    expect(result.scores.opportunity.value).toBe(100);
    expect(result.scores.risk.value).toBe(0);
    expect(validateAskDecisionResult(result).ok).toBe(true);
  });

  it('builds structured fallback with low confidence', () => {
    const intent = detectIntent('Should I launch this week?');
    const frame = frameDecision('Should I launch this week?', intent);
    const fallback = buildStructuredFallback({
      intent,
      frame,
      timing: buildTimingIntelligence(null, true, false),
      usedProfile: false,
      usedTiming: false,
      decisionStyles: [],
      generatedAt: '2026-07-20T12:00:00.000Z',
      requestId: null,
      clarificationAnswer: null,
      reason: 'network',
    });
    expect(fallback.meta?.fallback).toBe(true);
    expect(fallback.confidence.level).toBe('low');
    expect(fallback.actionPlan.now.length).toBeGreaterThan(0);
  });
});

describe('module routing + analytics privacy', () => {
  it('suggests people module for relationship intent', async () => {
    const out = await runAskDecision({
      question: 'How should I handle this relationship conflict with my partner?',
      profile: sample,
      locale: 'en',
    });
    expect(out.result.relatedModules.some((m) => m.module === 'people')).toBe(true);
  });

  it('strips question text from analytics properties', () => {
    const safe = sanitizeAskAnalyticsProperties({
      question: 'secret question',
      intent: 'career',
      text: 'nope',
    });
    expect(safe.question).toBeUndefined();
    expect(safe.text).toBeUndefined();
    expect(safe.intent).toBe('career');
  });

  it('bounds local vault payload question and summary lengths', () => {
    const intent = detectIntent('Should I accept this job offer?');
    const frame = frameDecision('Should I accept this job offer?', intent);
    const result = buildStructuredFallback({
      intent,
      frame,
      timing: buildTimingIntelligence(null, true, false),
      usedProfile: false,
      usedTiming: false,
      decisionStyles: [],
      generatedAt: '2026-07-20T12:00:00.000Z',
      requestId: null,
      clarificationAnswer: null,
      reason: 'network',
    });
    result.executiveSummary = 'S'.repeat(1200);
    result.recommendation = 'R'.repeat(900);
    const payload = toAskVaultSavePayload('Q'.repeat(800), result);
    expect(payload.question.length).toBe(500);
    expect(payload.decisionSummary.length).toBe(800);
    expect(payload.recommendation.length).toBe(500);
  });
});

describe('runAskDecision end-to-end', () => {
  beforeEach(() => {
    localStorage.clear();
    clearIntelligenceProfileStorage();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns a complete V3 result', async () => {
    const out = await runAskDecision({
      question: 'Should I accept this job offer?',
      profile: sample,
      locale: 'en',
    });
    expect(out.result.schemaVersion).toBe(ASK_DECISION_SCHEMA_VERSION);
    expect(out.result.recommendationStatus).toBeTruthy();
    expect(out.result.scores.opportunity.value).toBeGreaterThanOrEqual(0);
    expect(out.result.actionPlan.now.length).toBeGreaterThan(0);
    expect(out.result.followUpQuestions).toHaveLength(3);
    expect(out.result.analysis.length).toBeGreaterThanOrEqual(6);
  });

  it('shows clarification pending for vague questions', async () => {
    const out = await runAskDecision({
      question: 'Should I accept it?',
      profile: sample,
      locale: 'en',
    });
    expect(out.pendingClarification).toBe(true);
    expect(out.clarification.required).toBe(true);
  });
});

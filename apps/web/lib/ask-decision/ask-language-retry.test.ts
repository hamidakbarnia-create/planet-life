/**
 * Ask language-guard: one controlled retry + safe failure paths.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ASK_DECISION_SCHEMA_VERSION, runAskDecision } from '@/lib/ask-decision';
import { postConversationExecute } from '@/lib/conversation-client';
import { askCopy } from '@/lib/ask-decision/ask-local-copy';

vi.mock('@/lib/pathfinder-decision/timing', () => ({
  loadPathfinderTiming: vi.fn(async () => null),
}));

vi.mock('@/lib/conversation-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/conversation-client')>();
  return {
    ...actual,
    postConversationExecute: vi.fn(),
  };
});

function askPayload(prose: {
  executiveSummary: string;
  recommendation: string;
  analysisBody: string;
  action: string;
  explanation: string;
}) {
  return JSON.stringify({
    schemaVersion: ASK_DECISION_SCHEMA_VERSION,
    executiveSummary: prose.executiveSummary,
    recommendation: prose.recommendation,
    recommendationStatus: 'proceed-with-caution',
    scores: {
      opportunity: { value: 68, rationale: prose.explanation },
      risk: { value: 44, rationale: prose.explanation },
      timing: { value: 60, rationale: prose.explanation },
      readiness: { value: 58, rationale: prose.explanation },
      confidence: { value: 61, rationale: prose.explanation },
    },
    analysis: [
      { id: 'situation', title: 'وضعیت', body: prose.analysisBody },
      { id: 'factors', title: 'عوامل', body: prose.analysisBody },
      { id: 'opportunities', title: 'فرصت‌ها', body: prose.analysisBody },
      { id: 'risks', title: 'ریسک‌ها', body: prose.analysisBody },
      { id: 'tradeoffs', title: 'بده‌بستان', body: prose.analysisBody },
      { id: 'personal-fit', title: 'تناسب', body: prose.analysisBody },
      { id: 'what-could-change', title: 'تغییر', body: prose.analysisBody },
      { id: 'why', title: 'چرا', body: prose.analysisBody },
    ],
    scenarios: {
      bestCase: {
        outcome: prose.analysisBody,
        likelihoodBand: 'medium',
        keyConditions: [prose.analysisBody],
        earlySignals: [prose.analysisBody],
        mitigation: prose.analysisBody,
      },
      mostLikely: {
        outcome: prose.analysisBody,
        likelihoodBand: 'high',
        keyConditions: [prose.analysisBody],
        earlySignals: [prose.analysisBody],
        mitigation: prose.analysisBody,
      },
      downsideCase: {
        outcome: prose.analysisBody,
        likelihoodBand: 'low',
        keyConditions: [prose.analysisBody],
        earlySignals: [prose.analysisBody],
        mitigation: prose.analysisBody,
      },
    },
    actionPlan: {
      now: [
        {
          action: prose.action,
          purpose: prose.explanation,
          priority: 'critical',
          completionSignal: prose.explanation,
        },
      ],
      next7Days: [
        {
          action: prose.action,
          purpose: prose.explanation,
          priority: 'high',
          completionSignal: prose.explanation,
        },
      ],
      next30Days: [
        {
          action: prose.action,
          purpose: prose.explanation,
          priority: 'medium',
          completionSignal: prose.explanation,
        },
      ],
    },
    alternatives: [],
    assumptions: [prose.explanation],
    confidence: {
      level: 'medium',
      score: 61,
      explanation: prose.explanation,
      missingInputs: [],
      limitingFactors: [],
    },
    limitations: [prose.explanation],
    relatedModules: [],
    followUpQuestions: [prose.explanation, prose.explanation, prose.explanation],
    safetyNotice: null,
  });
}

const ENGLISH = {
  executiveSummary:
    'Decision: accept the offer with checkpoints. Recommendation: proceed with caution. Caution: downside terms. Next: list non-negotiables carefully before you sign anything irreversible.',
  recommendation: 'Proceed with a written checklist before accepting the offer this week.',
  analysisBody:
    'The opportunity looks solid if terms hold. Risk is manageable with a clear review. Timing is supportive this week for careful negotiation.',
  action: 'List three non-negotiable terms before accepting',
  explanation: 'Moderate clarity with checkpoints and a reversible review path.',
};

const PERSIAN = {
  executiveSummary:
    'تصمیم: پیشنهاد را با نقاط کنترل بپذیرید. توصیه: با احتیاط پیش بروید. احتیاط: بندهای منفی. بعدی: شرایط غیرقابل‌مذاکره را فهرست کنید.',
  recommendation: 'قبل از پذیرش، یک چک‌لیست مکتوب آماده کنید و بندهای کلیدی را بررسی کنید.',
  analysisBody:
    'اگر شرایط حفظ شود فرصت مناسب است. ریسک با بازبینی روشن قابل‌مدیریت است. زمان‌بندی این هفته برای مذاکره محتاطانه حمایت‌کننده است.',
  action: 'سه شرط غیرقابل‌مذاکره را قبل از پذیرش فهرست کنید',
  explanation: 'شفافیت متوسط با نقاط کنترل و مسیر بازبینی برگشت‌پذیر.',
};

const PERSIAN_WITH_BRAND = {
  ...PERSIAN,
  executiveSummary:
    'METIORO توصیه می‌کند پیشنهاد را با نقاط کنترل بپذیرید و قبل از امضا شرایط را بازبینی کنید تا تصمیم برگشت‌پذیر بماند.',
};

function okBody(message: string, requestId: string) {
  return {
    ok: true as const,
    body: {
      type: 'decision' as const,
      message,
      sources: [],
      request_id: requestId,
      reasoning: null,
      uncertainty: 'Moderate',
    },
  };
}

describe('ask language retry orchestration', () => {
  beforeEach(() => {
    vi.mocked(postConversationExecute).mockReset();
  });

  it('accepts a valid Persian provider response without retry', async () => {
    vi.mocked(postConversationExecute).mockResolvedValueOnce(
      okBody(askPayload(PERSIAN), 'ask-fa-ok')
    );

    const out = await runAskDecision({
      question: 'Should I accept this job offer this month?',
      profile: null,
      locale: 'fa',
      continueWithAssumptions: true,
    });

    expect(postConversationExecute).toHaveBeenCalledTimes(1);
    expect(out.result.recommendation).toMatch(/[\u0600-\u06FF]/);
    expect(out.result.recommendation).not.toMatch(/Proceed with a written checklist/i);
  });

  it('retries once when first response is English-dominant for fa', async () => {
    vi.mocked(postConversationExecute)
      .mockResolvedValueOnce(okBody(askPayload(ENGLISH), 'ask-en-1'))
      .mockResolvedValueOnce(okBody(askPayload(PERSIAN), 'ask-fa-2'));

    const out = await runAskDecision({
      question: 'Should I accept this job offer this month?',
      profile: null,
      locale: 'fa',
      continueWithAssumptions: true,
    });

    expect(postConversationExecute).toHaveBeenCalledTimes(2);
    const retryMsgs = vi.mocked(postConversationExecute).mock.calls[1]![0];
    expect(retryMsgs.at(-1)?.content).toMatch(/فارسی/);
    expect(out.result.recommendation).toMatch(/[\u0600-\u06FF]/);
    expect(out.result.recommendation).not.toMatch(/Proceed with a written checklist/i);
  });

  it('allows METIORO brand token inside Persian prose', async () => {
    vi.mocked(postConversationExecute).mockResolvedValueOnce(
      okBody(askPayload(PERSIAN_WITH_BRAND), 'ask-brand')
    );

    const out = await runAskDecision({
      question: 'Should I accept this job offer this month?',
      profile: null,
      locale: 'fa',
      continueWithAssumptions: true,
    });

    expect(postConversationExecute).toHaveBeenCalledTimes(1);
    expect(out.result.executiveSummary).toContain('METIORO');
    expect(out.result.executiveSummary).toMatch(/[\u0600-\u06FF]/);
  });

  it('returns localized safe failure when retry is still English', async () => {
    vi.mocked(postConversationExecute)
      .mockResolvedValueOnce(okBody(askPayload(ENGLISH), 'ask-en-1'))
      .mockResolvedValueOnce(okBody(askPayload(ENGLISH), 'ask-en-2'));

    const out = await runAskDecision({
      question: 'Should I accept this job offer this month?',
      profile: null,
      locale: 'fa',
      continueWithAssumptions: true,
    });

    expect(postConversationExecute).toHaveBeenCalledTimes(2);
    expect(out.result.recommendation).toBe(askCopy('fa', 'safe.languageFailure'));
    expect(out.result.executiveSummary).toBe(askCopy('fa', 'safe.languageFailure'));
    expect(out.result.recommendation).toMatch(/[\u0600-\u06FF]/);
    expect(out.result.recommendation).not.toMatch(/Proceed with/i);
  });

  it('retains original when language retry provider fails (no extra call)', async () => {
    vi.mocked(postConversationExecute)
      .mockResolvedValueOnce(okBody(askPayload(ENGLISH), 'ask-en-1'))
      .mockResolvedValueOnce({
        ok: false as const,
        kind: 'network_error' as const,
      });

    const out = await runAskDecision({
      question: 'Should I accept this job offer this month?',
      profile: null,
      locale: 'fa',
      continueWithAssumptions: true,
    });

    expect(postConversationExecute).toHaveBeenCalledTimes(2);
    expect(out.result.meta?.fallback).toBe(false);
    expect(out.result.meta?.providerExecution?.callCount).toBe(2);
    expect(out.result.meta?.providerExecution?.maxCalls).toBe(2);
    expect(
      out.result.meta?.providerExecution?.attempts.some(
        (a) => a.purpose === 'language_retry' && a.failureReason === 'network_error'
      )
    ).toBe(true);
    // Localized presentation of retained original — not English scaffolds
    expect(out.result.recommendation).not.toMatch(/\bProceed with\b/i);
  });

  it('retains original when language retry aborts (no third call)', async () => {
    vi.mocked(postConversationExecute)
      .mockResolvedValueOnce(okBody(askPayload(ENGLISH), 'ask-en-1'))
      .mockResolvedValueOnce({
        ok: false as const,
        kind: 'aborted' as const,
      });

    const out = await runAskDecision({
      question: 'Should I accept this job offer this month?',
      profile: null,
      locale: 'fa',
      continueWithAssumptions: true,
    });

    expect(postConversationExecute).toHaveBeenCalledTimes(2);
    expect(out.result.meta?.fallback).toBe(false);
    expect(out.result.meta?.providerExecution?.callCount).toBeLessThanOrEqual(2);
    expect(
      out.result.meta?.providerExecution?.attempts.some(
        (a) => a.purpose === 'language_retry'
      )
    ).toBe(true);
  });
});

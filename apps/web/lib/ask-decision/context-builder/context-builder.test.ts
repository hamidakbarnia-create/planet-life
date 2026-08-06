import { describe, expect, it, vi } from 'vitest';
import { runAskDecision } from '../run';
import {
  CONTEXT_RECENT_MESSAGE_LIMIT,
  CONTEXT_SOURCE_PRIORITY,
  UNIFIED_DECISION_CONTEXT_VERSION,
  buildUnifiedDecisionContext,
  stripBuiltAt,
  validateUnifiedDecisionContext,
} from './index';
import {
  CONVERSATION_AVAILABLE,
  FIXED_NOW,
  FIXTURE_QUESTIONS,
  INTERNAL_PROMPT_MESSAGE,
  PROFILE_AVAILABLE,
  PROFILE_MINIMAL,
  TIMING_AVAILABLE,
  TIMING_UNAVAILABLE,
  analysisFallback,
  analysisFor,
} from './fixtures';
import * as adapters from './adapters';
import type { UnifiedDecisionContext } from './types';

function build(partial: {
  question?: string;
  locale?: string;
  analysis?: ReturnType<typeof analysisFor>;
  profile?: Parameters<typeof buildUnifiedDecisionContext>[0]['profile'];
  timing?: Parameters<typeof buildUnifiedDecisionContext>[0]['timing'];
  conversationMessages?: Parameters<
    typeof buildUnifiedDecisionContext
  >[0]['conversationMessages'];
}) {
  const question = partial.question ?? FIXTURE_QUESTIONS.career;
  return buildUnifiedDecisionContext({
    question,
    locale: partial.locale ?? 'en',
    analysis: partial.analysis ?? analysisFor(question),
    profile: partial.profile ?? null,
    timing: partial.timing ?? null,
    conversationMessages: partial.conversationMessages ?? [],
    now: () => FIXED_NOW,
  });
}

describe('UnifiedDecisionContext contract', () => {
  it('question only', () => {
    const ctx = build({ question: FIXTURE_QUESTIONS.career });
    expect(ctx.version).toBe(UNIFIED_DECISION_CONTEXT_VERSION);
    expect(ctx.builtAt).toBe(FIXED_NOW);
    expect(ctx.user.profileAvailable).toBe(false);
    expect(ctx.timing.available).toBe(false);
    expect(ctx.conversation.available).toBe(false);
    expect(ctx.sourcePriority).toEqual([...CONTEXT_SOURCE_PRIORITY]);
    expect(validateUnifiedDecisionContext(ctx).ok).toBe(true);
  });

  it('question + valid InputAnalysis', () => {
    const analysis = analysisFor(FIXTURE_QUESTIONS.career);
    const ctx = build({ analysis });
    expect(ctx.analysis).toEqual(analysis);
    expect(ctx.decision.primaryIntent).toBe(analysis.intent);
    expect(ctx.missingContext).toEqual(analysis.missingCriticalContext);
  });

  it('profile available (minimal fields only)', () => {
    const ctx = build({ profile: PROFILE_AVAILABLE });
    expect(ctx.user.profileAvailable).toBe(true);
    expect(ctx.user.country).toBe('Germany');
    expect(ctx.user.timezone).toBe('Europe/Berlin');
    expect(ctx.user.preferredLanguage).toBe('en');
    const raw = JSON.stringify(ctx);
    expect(raw).not.toContain('1990-06-15');
    expect(raw).not.toContain('14:30');
    expect(raw).not.toContain('52.52');
    expect(raw).not.toContain('13.405');
  });

  it('profile unavailable', () => {
    const ctx = build({ profile: null });
    expect(ctx.user).toEqual({ profileAvailable: false });
  });

  it('timing available / unavailable', () => {
    const available = build({ timing: TIMING_AVAILABLE });
    expect(available.timing.available).toBe(true);
    expect(available.timing.score).toBe(71);
    expect(available.timing.confidence).toBe(0.6);
    expect(available.timing.source).toBe('timing-engine');

    const unavailable = build({ timing: TIMING_UNAVAILABLE });
    expect(unavailable.timing).toEqual({ available: false });
  });

  it('conversation available / empty', () => {
    const withMsgs = build({ conversationMessages: CONVERSATION_AVAILABLE });
    expect(withMsgs.conversation.available).toBe(true);
    expect(withMsgs.conversation.messageCount).toBe(3);
    expect(withMsgs.conversation.recentMessages[0]?.role).toBe('user');

    const empty = build({ conversationMessages: [] });
    expect(empty.conversation).toEqual({
      available: false,
      messageCount: 0,
      recentMessages: [],
    });
  });

  it('mixed career + relocation analysis', () => {
    const q = FIXTURE_QUESTIONS.mixedCareerRelocation;
    const analysis = analysisFor(q);
    const ctx = build({ question: q, analysis });
    expect(ctx.decision.primaryIntent).toBe('career');
    expect(ctx.decision.secondaryIntents).toContain('relocation');
  });

  it('missing critical context preserved from analysis', () => {
    const analysis = analysisFor(FIXTURE_QUESTIONS.vague);
    const ctx = build({
      question: FIXTURE_QUESTIONS.vague,
      analysis,
    });
    expect(ctx.missingContext).toEqual(
      [...new Set(analysis.missingCriticalContext)]
    );
    for (const key of ctx.missingContext) {
      expect(typeof key).toBe('string');
    }
  });
});

describe('conversation filtering', () => {
  it('excludes duplicate current question and internal prompts', () => {
    const q = FIXTURE_QUESTIONS.career;
    const ctx = build({
      question: q,
      conversationMessages: [
        { role: 'user', content: q },
        INTERNAL_PROMPT_MESSAGE,
        { role: 'assistant', content: 'Tell me more about the offer.' },
        { role: 'system', content: 'hidden system' } as { role: string; content: string },
      ],
    });
    expect(ctx.conversation.recentMessages).toEqual([
      { role: 'assistant', content: 'Tell me more about the offer.' },
    ]);
  });

  it('truncates to CONTEXT_RECENT_MESSAGE_LIMIT preserving order/tail', () => {
    const msgs = Array.from({ length: CONTEXT_RECENT_MESSAGE_LIMIT + 3 }, (_, i) => ({
      role: 'user' as const,
      content: `turn-${i}`,
    }));
    const ctx = build({ conversationMessages: msgs });
    expect(ctx.conversation.messageCount).toBe(CONTEXT_RECENT_MESSAGE_LIMIT);
    expect(ctx.conversation.recentMessages[0]?.content).toBe('turn-3');
    expect(
      ctx.conversation.recentMessages[CONTEXT_RECENT_MESSAGE_LIMIT - 1]?.content
    ).toBe(`turn-${CONTEXT_RECENT_MESSAGE_LIMIT + 2}`);
  });
});

describe('strict validation', () => {
  const valid = build({});

  it('rejects unknown fields', () => {
    expect(
      validateUnifiedDecisionContext({ ...valid, extra: true }).ok
    ).toBe(false);
  });

  it('rejects invalid source on fact', () => {
    const bad = {
      ...valid,
      knownFacts: [
        {
          key: 'x',
          value: 1,
          source: 'made_up',
          confidence: 1,
        },
      ],
    };
    expect(validateUnifiedDecisionContext(bad).ok).toBe(false);
  });

  it('rejects invalid confidence', () => {
    const bad = {
      ...valid,
      knownFacts: [
        {
          key: 'x',
          value: 1,
          source: 'locale',
          confidence: 1.5,
        },
      ],
    };
    expect(validateUnifiedDecisionContext(bad).ok).toBe(false);
  });

  it('rejects duplicate fact key/source', () => {
    const fact = {
      key: 'dup',
      value: true,
      source: 'locale' as const,
      confidence: 1,
    };
    expect(
      validateUnifiedDecisionContext({
        ...valid,
        knownFacts: [fact, fact],
      }).ok
    ).toBe(false);
  });

  it('rejects invalid message role', () => {
    expect(
      validateUnifiedDecisionContext({
        ...valid,
        conversation: {
          available: true,
          messageCount: 1,
          recentMessages: [{ role: 'system', content: 'nope' }],
        },
      }).ok
    ).toBe(false);
  });

  it('rejects reordered sourcePriority', () => {
    expect(
      validateUnifiedDecisionContext({
        ...valid,
        sourcePriority: [...CONTEXT_SOURCE_PRIORITY].reverse(),
      }).ok
    ).toBe(false);
  });

  it('rejects arbitrary missingContext strings', () => {
    expect(
      validateUnifiedDecisionContext({
        ...valid,
        missingContext: ['not_a_real_key'],
      }).ok
    ).toBe(false);
  });

  it('rejects timing score outside 0–100', () => {
    expect(
      validateUnifiedDecisionContext({
        ...valid,
        timing: {
          available: true,
          source: 'timing-engine',
          score: 140,
          confidence: 0.5,
        },
      }).ok
    ).toBe(false);
  });
});

describe('degradation + privacy + determinism', () => {
  it('source adapter failure degrades that source only', () => {
    const spy = vi.spyOn(adapters, 'adaptProfile').mockImplementation(() => {
      throw new Error('profile boom');
    });
    // adaptProfile catches internally — simulate via throwing wrapper in build path
    spy.mockRestore();

    const spyTiming = vi
      .spyOn(adapters, 'adaptTiming')
      .mockImplementationOnce(() => {
        throw new Error('timing boom');
      });
    // adaptTiming also catches — call through public API with a proxy timing object
    spyTiming.mockRestore();

    // Force degradation via throwing getters on profile
    const hostileProfile = new Proxy(PROFILE_AVAILABLE, {
      get() {
        throw new Error('hostile');
      },
    });
    const ctx = build({
      profile: hostileProfile,
      timing: TIMING_AVAILABLE,
      conversationMessages: CONVERSATION_AVAILABLE,
    });
    expect(ctx.user.profileAvailable).toBe(false);
    expect(ctx.timing.available).toBe(true);
    expect(ctx.conversation.available).toBe(true);
    expect(ctx.analysis.intent).toBeTruthy();
  });

  it('privacy exclusion: birth secrets never appear', () => {
    const ctx = build({ profile: PROFILE_MINIMAL });
    const raw = JSON.stringify(ctx);
    expect(raw).not.toContain('Secret Birth City');
    expect(raw).not.toContain('1990-06-15');
    expect(raw).not.toContain('14:30');
    expect(raw).not.toMatch(/password|token|authorization|api[_-]?key/i);
  });

  it('deterministic output excluding builtAt', () => {
    const a = stripBuiltAt(build({}));
    const b = stripBuiltAt(build({}));
    expect(a).toEqual(b);
  });

  it('invalid analysis falls back without blanking other sources', () => {
    const ctx = buildUnifiedDecisionContext({
      question: FIXTURE_QUESTIONS.career,
      locale: 'en',
      analysis: { bad: true } as unknown as ReturnType<typeof analysisFor>,
      profile: PROFILE_AVAILABLE,
      timing: TIMING_AVAILABLE,
      conversationMessages: CONVERSATION_AVAILABLE,
      now: () => FIXED_NOW,
    });
    expect(ctx.analysis).toEqual(analysisFallback());
    expect(ctx.user.profileAvailable).toBe(true);
    expect(ctx.timing.available).toBe(true);
    expect(ctx.conversation.available).toBe(true);
  });
});

describe('pipeline meta-only wiring', () => {
  it('attaches decisionContext on meta only; no clarification/UI behavior change', async () => {
    const out = await runAskDecision({
      question: 'Should I wait before launching the product?',
      profile: null,
      locale: 'en',
    });
    expect(out.pendingClarification).toBe(false);
    expect(out.clarification.required).toBe(false);
    expect(out.result.meta?.decisionContext?.version).toBe('1.0.0');
    expect(out.result.meta?.inputAnalysis).toBeDefined();
    expect('decisionContext' in out).toBe(false);
    expect(out.result.meta?.sources).toContain('context-builder-v1');
  });

  it('does not mutate InputAnalysis object', () => {
    const analysis = analysisFor(FIXTURE_QUESTIONS.career);
    const before = structuredClone(analysis);
    build({ analysis });
    expect(analysis).toEqual(before);
  });
});

describe('type shape smoke', () => {
  it('satisfies UnifiedDecisionContext assignment', () => {
    const ctx: UnifiedDecisionContext = build({});
    expect(ctx.question.locale).toBe('en');
  });
});

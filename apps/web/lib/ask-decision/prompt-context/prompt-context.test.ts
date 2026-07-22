import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectIntent } from '../intent';
import { frameDecision } from '../framing';
import { collectAskContext } from '../context';
import { buildAskDecisionPrompt } from '../prompt-builder';
import { ASK_DECISION_SCHEMA_VERSION } from '../types';
import {
  buildScenarioPair,
  manyFacts,
  manyMessages,
  SCENARIO_QUESTIONS,
  type ScenarioKey,
} from './fixtures';
import {
  PROMPT_CONTEXT_LIMITS,
  SERIALIZED_DECISION_PROMPT_CONTEXT_VERSION,
  isStructuredPromptContextEnabled,
  serializeDecisionPromptContext,
  validateSerializedDecisionPromptContext,
  buildDecisionInstructions,
  buildRiskDomainInstructions,
} from './index';
import { buildReasoningPlan } from '../reasoning-planner';
import { buildUnifiedDecisionContext } from '../context-builder';
import { buildInputAnalysis } from '../input-analysis';
import { TIMING_AVAILABLE } from '../context-builder/fixtures';

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

describe('isStructuredPromptContextEnabled (explicit opt-in)', () => {
  const original = process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED;
    } else {
      process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED = original;
    }
  });

  it('truth table: unset/empty/false/off/0/unknown → legacy; 1/true/on → structured', () => {
    delete process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED;
    expect(isStructuredPromptContextEnabled()).toBe(false);

    process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED = '';
    expect(isStructuredPromptContextEnabled()).toBe(false);

    process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED = 'false';
    expect(isStructuredPromptContextEnabled()).toBe(false);

    process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED = 'off';
    expect(isStructuredPromptContextEnabled()).toBe(false);

    process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED = '0';
    expect(isStructuredPromptContextEnabled()).toBe(false);

    process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED = 'maybe';
    expect(isStructuredPromptContextEnabled()).toBe(false);

    process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED = 'true';
    expect(isStructuredPromptContextEnabled()).toBe(true);

    process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED = 'on';
    expect(isStructuredPromptContextEnabled()).toBe(true);

    process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED = '1';
    expect(isStructuredPromptContextEnabled()).toBe(true);
  });
});

describe('serializeDecisionPromptContext', () => {
  it('emits exact contract version and required fields', () => {
    const { context, plan } = buildScenarioPair('jobChange');
    const result = serializeDecisionPromptContext({
      decisionContext: context,
      reasoningPlan: plan,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.version).toBe(SERIALIZED_DECISION_PROMPT_CONTEXT_VERSION);
    expect(result.value.question).toBe(SCENARIO_QUESTIONS.jobChange);
    expect(result.value.locale).toBe('en');
    expect(Array.isArray(result.value.facts)).toBe(true);
    expect(Array.isArray(result.value.evaluationPlan)).toBe(true);
    expect(typeof result.value.clarificationRecommended).toBe('boolean');
    expect(result.json).toBe(JSON.stringify(result.value));
  });

  it('rejects unknown fields on validate', () => {
    const { context, plan } = buildScenarioPair('jobChange');
    const result = serializeDecisionPromptContext({
      decisionContext: context,
      reasoningPlan: plan,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const bad = { ...result.value, planId: 'x', sourcePriority: [] };
    const validated = validateSerializedDecisionPromptContext(bad);
    expect(validated.ok).toBe(false);
    if (validated.ok) return;
    expect(validated.errors.some((e) => e.includes('Unknown field'))).toBe(
      true
    );
  });

  it('is deterministic (byte-identical JSON)', () => {
    const { context, plan } = buildScenarioPair('relocation');
    const a = serializeDecisionPromptContext({
      decisionContext: context,
      reasoningPlan: plan,
    });
    const b = serializeDecisionPromptContext({
      decisionContext: context,
      reasoningPlan: plan,
    });
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(a.json).toBe(b.json);
  });

  it('orders facts by source priority then key', () => {
    const { context, plan } = buildScenarioPair('jobChange');
    const withMixed: typeof context = {
      ...context,
      knownFacts: [
        {
          key: 'z_late',
          value: 1,
          source: 'timing',
          confidence: 0.5,
        },
        {
          key: 'b_mid',
          value: 2,
          source: 'conversation',
          confidence: 0.5,
        },
        {
          key: 'a_early',
          value: 3,
          source: 'current_question',
          confidence: 0.5,
        },
        {
          key: 'c_mid',
          value: 4,
          source: 'conversation',
          confidence: 0.5,
        },
      ],
    };
    const result = serializeDecisionPromptContext({
      decisionContext: withMixed,
      reasoningPlan: plan,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.facts.map((f) => f.key)).toEqual([
      'a_early',
      'b_mid',
      'c_mid',
      'z_late',
    ]);
  });

  it('enforces fact limit', () => {
    const { context, plan } = buildScenarioPair('jobChange');
    const oversized = {
      ...context,
      knownFacts: manyFacts(PROMPT_CONTEXT_LIMITS.maxFacts + 5),
    };
    const result = serializeDecisionPromptContext({
      decisionContext: oversized,
      reasoningPlan: plan,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.facts.length).toBe(PROMPT_CONTEXT_LIMITS.maxFacts);
  });

  it('enforces constraint limit', () => {
    const { context, plan } = buildScenarioPair('financialRisk');
    const oversized = {
      ...context,
      constraints: manyFacts(PROMPT_CONTEXT_LIMITS.maxConstraints + 4),
    };
    const result = serializeDecisionPromptContext({
      decisionContext: oversized,
      reasoningPlan: plan,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.constraints.length).toBe(
      PROMPT_CONTEXT_LIMITS.maxConstraints
    );
  });

  it('enforces conversation message limit', () => {
    const { context, plan } = buildScenarioPair('jobChange', {
      conversation: manyMessages(PROMPT_CONTEXT_LIMITS.maxConversationMessages + 3),
    });
    // buildUnifiedDecisionContext already trims; force more on the object
    const forced = {
      ...context,
      conversation: {
        ...context.conversation,
        recentMessages: manyMessages(
          PROMPT_CONTEXT_LIMITS.maxConversationMessages + 3
        ),
        messageCount: PROMPT_CONTEXT_LIMITS.maxConversationMessages + 3,
        available: true,
      },
    };
    const result = serializeDecisionPromptContext({
      decisionContext: forced,
      reasoningPlan: plan,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.conversation.length).toBe(
      PROMPT_CONTEXT_LIMITS.maxConversationMessages
    );
  });

  it('truncates long fact string values', () => {
    const { context, plan } = buildScenarioPair('jobChange');
    const long = 'x'.repeat(PROMPT_CONTEXT_LIMITS.factValueChars + 80);
    const withLong = {
      ...context,
      knownFacts: [
        {
          key: 'long.value',
          value: long,
          source: 'current_question' as const,
          confidence: 0.9,
        },
      ],
    };
    const result = serializeDecisionPromptContext({
      decisionContext: withLong,
      reasoningPlan: plan,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const fact = result.value.facts.find((f) => f.key === 'long.value');
    expect(fact).toBeTruthy();
    expect(typeof fact!.value).toBe('string');
    expect(String(fact!.value).length).toBeLessThanOrEqual(
      PROMPT_CONTEXT_LIMITS.factValueChars
    );
  });

  it('fails when total JSON exceeds size limit', () => {
    const { context, plan } = buildScenarioPair('jobChange');
    const huge = 'H'.repeat(2000);
    const bloated = {
      ...context,
      knownFacts: manyFacts(12).map((f, i) => ({
        ...f,
        value: `${huge}-${i}`,
      })),
      constraints: manyFacts(8).map((f, i) => ({
        ...f,
        value: `${huge}-c-${i}`,
      })),
      conversation: {
        available: true,
        messageCount: 8,
        recentMessages: manyMessages(8).map((m, i) => ({
          ...m,
          content: `${huge}-m-${i}`,
        })),
      },
      timing: {
        available: true,
        summary: 'S'.repeat(PROMPT_CONTEXT_LIMITS.timingSummaryChars),
        score: 50,
        confidence: 0.5,
      },
      question: {
        ...context.question,
        original: 'Q'.repeat(PROMPT_CONTEXT_LIMITS.questionChars),
      },
    };
    // Temporarily tighten limit via spy on stringify length check by
    // constructing a payload that still validates then exceeds — if 12k
    // still fits truncated values, force failure through validate path.
    const spy = vi
      .spyOn(JSON, 'stringify')
      .mockImplementationOnce((value: unknown) => {
        const real = JSON.stringify(value);
        return real + 'x'.repeat(PROMPT_CONTEXT_LIMITS.maxJsonChars);
      });
    const result = serializeDecisionPromptContext({
      decisionContext: bloated,
      reasoningPlan: plan,
    });
    spy.mockRestore();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toMatch(/exceeds/);
  });

  it('excludes sensitive fields and question duplicates from facts', () => {
    const { context, plan } = buildScenarioPair('jobChange');
    const withSensitive = {
      ...context,
      knownFacts: [
        {
          key: 'question.original',
          value: context.question.original,
          source: 'current_question' as const,
          confidence: 1,
        },
        {
          key: 'api_key',
          value: 'secret',
          source: 'user_profile' as const,
          confidence: 0.5,
        },
        {
          key: 'auth.token',
          value: 'tok',
          source: 'user_profile' as const,
          confidence: 0.5,
        },
        {
          key: 'safe.fact',
          value: 'ok',
          source: 'current_question' as const,
          confidence: 0.9,
        },
      ],
    };
    const result = serializeDecisionPromptContext({
      decisionContext: withSensitive,
      reasoningPlan: plan,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const keys = result.value.facts.map((f) => f.key);
    expect(keys).not.toContain('question.original');
    expect(keys).not.toContain('api_key');
    expect(keys).not.toContain('auth.token');
    expect(keys).toContain('safe.fact');
    expect(result.json).not.toContain('planId');
    expect(result.json).not.toContain('sourcePriority');
    expect(result.json).not.toContain('builtAt');
  });

  it('serializes blocked and partial dimensions', () => {
    const { context, plan } = buildScenarioPair('jobChange');
    const forcedPlan = {
      ...plan,
      dimensions: plan.dimensions.map((d, i) => ({
        ...d,
        status: (i === 0 ? 'blocked' : i === 1 ? 'partial' : d.status) as
          | 'ready'
          | 'partial'
          | 'blocked',
      })),
    };
    const result = serializeDecisionPromptContext({
      decisionContext: context,
      reasoningPlan: forcedPlan,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.evaluationPlan.some((d) => d.status === 'blocked')).toBe(
      true
    );
    expect(result.value.evaluationPlan.some((d) => d.status === 'partial')).toBe(
      true
    );
  });

  it('omits empty timing when unavailable', () => {
    const analysis = buildInputAnalysis(SCENARIO_QUESTIONS.jobChange);
    const context = buildUnifiedDecisionContext({
      question: SCENARIO_QUESTIONS.jobChange,
      locale: 'en',
      analysis,
      profile: null,
      timing: null,
      conversationMessages: [],
      now: () => '2026-07-21T12:00:00.000Z',
    });
    const plan = buildReasoningPlan({ analysis, context });
    const result = serializeDecisionPromptContext({
      decisionContext: context,
      reasoningPlan: plan,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.timing).toBeUndefined();
    expect(result.json).not.toMatch(/"timing"\s*:/);
  });

  it('includes timing when available', () => {
    const { context, plan } = buildScenarioPair('jobChange', {
      timing: TIMING_AVAILABLE,
    });
    const result = serializeDecisionPromptContext({
      decisionContext: context,
      reasoningPlan: plan,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.timing).toBeTruthy();
  });
});

describe('risk domain instructions', () => {
  it('includes health rules only when health selected', () => {
    const lines = buildRiskDomainInstructions(['health']);
    const text = lines.join('\n');
    expect(text).toMatch(/No medical diagnosis/);
    expect(text).not.toMatch(/guaranteed returns/i);
    expect(text).not.toMatch(/legal conclusion/i);
  });

  it('includes finance rules only when financial selected', () => {
    const lines = buildRiskDomainInstructions(['financial']);
    const text = lines.join('\n');
    expect(text).toMatch(/Educational guidance/);
    expect(text).toMatch(/No guaranteed returns/);
    expect(text).not.toMatch(/No medical diagnosis/);
  });

  it('includes no unrelated risk rules', () => {
    const lines = buildRiskDomainInstructions(['legal']);
    const text = lines.join('\n');
    expect(text).toMatch(/General information only/);
    expect(text).not.toMatch(/No medical diagnosis/);
    expect(text).not.toMatch(/guaranteed returns/i);
  });
});

describe('prompt-builder structured section', () => {
  const original = process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED;
    } else {
      process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED = original;
    }
  });

  function legacyPromptParts(question: string) {
    const intent = detectIntent(question);
    const frame = frameDecision(question, intent);
    const context = collectAskContext(null, { locale: 'en', intent });
    return { intent, frame, context };
  }

  it('includes DECISION_CONTEXT_JSON when structured json provided', () => {
    const { context, plan, question } = buildScenarioPair('raiseRequest');
    const serialized = serializeDecisionPromptContext({
      decisionContext: context,
      reasoningPlan: plan,
    });
    expect(serialized.ok).toBe(true);
    if (!serialized.ok) return;
    const { intent, frame, context: snap } = legacyPromptParts(question);
    const messages = buildAskDecisionPrompt({
      question,
      intent,
      frame,
      context: snap,
      structuredPromptContextJson: serialized.json,
      structuredRiskDomains: plan.riskDomains,
    });
    const content = messages[0].content;
    expect(content).toContain('DECISION_CONTEXT_JSON:');
    expect(content).toContain('DECISION_INSTRUCTIONS:');
    expect(content).toContain('"schemaVersion": "3.0.0"');
    expect(content).toContain(ASK_DECISION_SCHEMA_VERSION);
    expect(content).toMatch(/recommendationStatus/);
    expect(content).toMatch(/scores 0–100/);
    expect(content).toMatch(/Do not fabricate blocked/);
    expect(content).not.toMatch(/show your reasoning/i);
    expect(content).not.toMatch(/chain-of-thought/i);
    expect(content).not.toMatch(/step-by-step hidden reasoning/i);
    expect(content).toMatch(/Do not expose internal deliberation/);
    expect(content).not.toContain('USER QUESTION:');
    expect(countExactOccurrences(content, question)).toBe(1);
    expect(serialized.value.facts.every((f) => !f.key.startsWith('question.'))).toBe(
      true
    );
  });

  it('omits structured section when no json (legacy)', () => {
    const question = SCENARIO_QUESTIONS.jobChange;
    const { intent, frame, context } = legacyPromptParts(question);
    const messages = buildAskDecisionPrompt({
      question,
      intent,
      frame,
      context,
    });
    const content = messages[0].content;
    expect(content).not.toContain('DECISION_CONTEXT_JSON:');
    expect(content).not.toContain('DECISION_INSTRUCTIONS:');
    expect(content).toContain('USER QUESTION:');
    expect(content).toContain('RESPONSE SCHEMA:');
    expect(content).toMatch(/recommendationStatus/);
    expect(content).toMatch(/scores 0–100/);
  });

  describe('final-prompt question authority (exactly one)', () => {
    it('structured enabled → question appears once (JSON only)', () => {
      const { context, plan, question } = buildScenarioPair('jobChange');
      const serialized = serializeDecisionPromptContext({
        decisionContext: context,
        reasoningPlan: plan,
      });
      expect(serialized.ok).toBe(true);
      if (!serialized.ok) return;
      const { intent, frame, context: snap } = legacyPromptParts(question);
      const finalPrompt = buildAskDecisionPrompt({
        question,
        intent,
        frame,
        context: snap,
        structuredPromptContextJson: serialized.json,
        structuredRiskDomains: plan.riskDomains,
      })[0].content;
      expect(finalPrompt).not.toContain('USER QUESTION:');
      expect(finalPrompt).toContain('DECISION_CONTEXT_JSON:');
      expect(countExactOccurrences(finalPrompt, question)).toBe(1);
    });

    it('structured disabled → question appears once (USER QUESTION only)', () => {
      const question = SCENARIO_QUESTIONS.jobChange;
      const { intent, frame, context } = legacyPromptParts(question);
      // Use a frame whose decisionStatement is not the exact question so the
      // legacy authority location (USER QUESTION) is uniquely countable.
      const frameUnique = {
        ...frame,
        decisionStatement: 'Choose between offer and current role',
      };
      const finalPrompt = buildAskDecisionPrompt({
        question,
        intent,
        frame: frameUnique,
        context,
      })[0].content;
      expect(finalPrompt).toContain('USER QUESTION:');
      expect(finalPrompt).not.toContain('DECISION_CONTEXT_JSON:');
      expect(countExactOccurrences(finalPrompt, question)).toBe(1);
    });

    it('serializer degradation → legacy USER QUESTION once', () => {
      const question = SCENARIO_QUESTIONS.relocation;
      const { intent, frame, context } = legacyPromptParts(question);
      const frameUnique = {
        ...frame,
        decisionStatement: 'Relocate or stay',
      };
      // Degradation path: build legacy prompt (no structured JSON).
      const finalPrompt = buildAskDecisionPrompt({
        question,
        intent,
        frame: frameUnique,
        context,
      })[0].content;
      expect(finalPrompt).toContain('USER QUESTION:');
      expect(finalPrompt).not.toContain('DECISION_CONTEXT_JSON:');
      expect(countExactOccurrences(finalPrompt, question)).toBe(1);
    });

    it('long question → still exactly one occurrence in structured mode', () => {
      const question =
        'Should I accept the Senior Engineer offer at NovaCorp with a 12% raise, relocating to Berlin in September after 18 months, or stay in my current London role with limited growth?';
      const analysis = buildInputAnalysis(question);
      const base = buildUnifiedDecisionContext({
        question,
        locale: 'en',
        analysis,
        profile: null,
        timing: TIMING_AVAILABLE,
        conversationMessages: [],
        now: () => '2026-07-21T12:00:00.000Z',
      });
      const plan = buildReasoningPlan({ analysis, context: base });
      const serialized = serializeDecisionPromptContext({
        decisionContext: base,
        reasoningPlan: plan,
      });
      expect(serialized.ok).toBe(true);
      if (!serialized.ok) return;
      const { intent, frame, context: snap } = legacyPromptParts(question);
      const finalPrompt = buildAskDecisionPrompt({
        question,
        intent,
        frame,
        context: snap,
        structuredPromptContextJson: serialized.json,
        structuredRiskDomains: plan.riskDomains,
      })[0].content;
      expect(finalPrompt).not.toContain('USER QUESTION:');
      expect(countExactOccurrences(finalPrompt, question)).toBe(1);
    });

    it('question also in conversation history → still exactly one after final-prompt dedupe', () => {
      const question = SCENARIO_QUESTIONS.jobChange;
      const { context, plan } = buildScenarioPair('jobChange', {
        conversation: [
          { role: 'user', content: question },
          { role: 'assistant', content: 'What matters most?' },
          { role: 'user', content: 'Growth and compensation.' },
        ],
      });
      // Force exact-question message onto context (conversation-dedupe is separate).
      const withDup = {
        ...context,
        conversation: {
          available: true,
          messageCount: 3,
          recentMessages: [
            { role: 'user' as const, content: question },
            { role: 'assistant' as const, content: 'What matters most?' },
            { role: 'user' as const, content: 'Growth and compensation.' },
          ],
        },
      };
      const serialized = serializeDecisionPromptContext({
        decisionContext: withDup,
        reasoningPlan: plan,
      });
      expect(serialized.ok).toBe(true);
      if (!serialized.ok) return;
      // Serializer final-prompt dedupe drops exact question from conversation.
      expect(
        serialized.value.conversation.every((m) => m.content !== question)
      ).toBe(true);

      const { intent, frame, context: snap } = legacyPromptParts(question);
      const finalPrompt = buildAskDecisionPrompt({
        question,
        intent,
        frame,
        context: snap,
        structuredPromptContextJson: serialized.json,
        structuredRiskDomains: plan.riskDomains,
      })[0].content;
      expect(countExactOccurrences(finalPrompt, question)).toBe(1);
    });

    it('question with punctuation/regex characters → exactly one occurrence', () => {
      // Avoid " / \ which JSON-escape inside DECISION_CONTEXT_JSON; still
      // cover punctuation and regex metacharacters in the exact string.
      const question =
        'Should I take job #1 (50% raise) vs. role B$+.* — now?!';
      const analysis = buildInputAnalysis(question);
      const base = buildUnifiedDecisionContext({
        question,
        locale: 'en',
        analysis,
        profile: null,
        timing: TIMING_AVAILABLE,
        conversationMessages: [{ role: 'user', content: question }],
        now: () => '2026-07-21T12:00:00.000Z',
      });
      const plan = buildReasoningPlan({ analysis, context: base });
      const serialized = serializeDecisionPromptContext({
        decisionContext: base,
        reasoningPlan: plan,
      });
      expect(serialized.ok).toBe(true);
      if (!serialized.ok) return;
      expect(serialized.value.question).toBe(question);
      const { intent, frame, context: snap } = legacyPromptParts(question);
      const finalPrompt = buildAskDecisionPrompt({
        question,
        intent,
        frame,
        context: snap,
        structuredPromptContextJson: serialized.json,
        structuredRiskDomains: plan.riskDomains,
      })[0].content;
      expect(finalPrompt).not.toContain('USER QUESTION:');
      expect(countExactOccurrences(finalPrompt, question)).toBe(1);
    });
  });

  it('preserves schema / recommendation / score instructions with structured on', () => {
    const { context, plan, question } = buildScenarioPair('financialRisk');
    const serialized = serializeDecisionPromptContext({
      decisionContext: context,
      reasoningPlan: plan,
    });
    expect(serialized.ok).toBe(true);
    if (!serialized.ok) return;
    const { intent, frame, context: snap } = legacyPromptParts(question);
    const content = buildAskDecisionPrompt({
      question,
      intent,
      frame,
      context: snap,
      structuredPromptContextJson: serialized.json,
      structuredRiskDomains: ['financial'],
    })[0].content;
    expect(content).toContain(
      '"recommendationStatus": "proceed|proceed-with-caution|wait|gather-more-information|avoid-for-now|neutral"'
    );
    expect(content).toContain('"opportunity": {"value":0-100,"rationale":"..."}');
    expect(content).toMatch(/Educational guidance/);
    // Legacy safety line remains; risk-domain block must not add health rules.
    const riskBlock = content.slice(content.indexOf('Risk domain'));
    expect(riskBlock).toMatch(/Educational guidance/);
    expect(riskBlock).not.toMatch(/No medical diagnosis/);
  });

  it('decision instructions forbid chain-of-thought exposure', () => {
    const text = buildDecisionInstructions({ riskDomains: [] });
    expect(text).toMatch(/Do not expose internal deliberation/);
    expect(text).not.toMatch(/show your reasoning/i);
    expect(text).not.toMatch(/chain-of-thought/i);
    expect(text).not.toMatch(/step-by-step hidden reasoning/i);
    expect(text).toMatch(/Cover the ready and partial/);
    expect(text).toMatch(/Do not fabricate blocked/);
  });
});

describe('scenario prompt fixtures', () => {
  const scenarios: ScenarioKey[] = [
    'raiseRequest',
    'jobChange',
    'relocation',
    'relationship',
    'financialRisk',
  ];

  const mustRetain: Record<ScenarioKey, string[]> = {
    raiseRequest: ['15%', '18', 'Acme'],
    jobChange: ['NovaCorp', 'Senior Engineer'],
    relocation: ['Berlin', 'London', 'September'],
    relationship: ['2', 'partner', 'move in'],
    financialRisk: ['40%', 'index fund', 'this quarter'],
  };

  for (const key of scenarios) {
    it(`preserves must-retain facts for ${key}`, () => {
      const { context, plan, question } = buildScenarioPair(key, {
        locale: 'en',
      });
      const serialized = serializeDecisionPromptContext({
        decisionContext: context,
        reasoningPlan: plan,
      });
      expect(serialized.ok).toBe(true);
      if (!serialized.ok) return;

      const intent = detectIntent(question);
      const frame = frameDecision(question, intent);
      const snap = collectAskContext(null, { locale: 'en', intent });
      const content = buildAskDecisionPrompt({
        question,
        intent,
        frame,
        context: snap,
        structuredPromptContextJson: serialized.json,
        structuredRiskDomains: plan.riskDomains,
      })[0].content;

      expect(content).toContain('DECISION_CONTEXT_JSON:');
      expect(content).not.toContain('USER QUESTION:');
      expect(content).toContain(`Locale: ${snap.locale}`);
      expect(content).toContain('RESPONSE SCHEMA:');
      expect(content).toContain(ASK_DECISION_SCHEMA_VERSION);
      expect(content).toMatch(/recommendationStatus/);
      expect(content).toMatch(/scores 0–100/);
      expect(content).toMatch(/now \/ next7Days \/ next30Days/);
      expect(content).toMatch(/No medical diagnosis/);
      expect(countExactOccurrences(content, question)).toBe(1);

      const blob = `${serialized.json}\n${content}`;
      for (const token of mustRetain[key]) {
        expect(blob.toLowerCase()).toContain(token.toLowerCase());
      }

      // no sensitive / internal leakage
      expect(serialized.json).not.toContain('birth_date');
      expect(serialized.json).not.toContain('planId');
      expect(content).not.toMatch(/show your reasoning/i);
      expect(content).not.toMatch(/chain-of-thought/i);
      expect(content).toMatch(/Do not expose internal deliberation/);
    });
  }
});

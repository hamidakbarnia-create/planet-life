import { describe, expect, it } from 'vitest';
import { runAskDecision } from '../run';
import {
  DECISION_INTENT_ALIASES,
  DECISION_INTENT_TAXONOMY_VERSION,
  DECISION_INTENTS_V1,
  INPUT_ANALYSIS_CLARIFICATION_CONFIDENCE_THRESHOLD,
  INPUT_ANALYSIS_VERSION,
  MAX_SECONDARY_INTENTS,
  REQUIRED_CONTEXT_KEYS,
  SAFETY_DOMAINS,
  DECISION_STAGES,
  INPUT_URGENCY_LEVELS,
  CLARIFICATION_REASONS,
  buildInputAnalysis,
  buildSafeInputAnalysisFallback,
  normalizeIntent,
  parseInputAnalysis,
  validateInputAnalysis,
  decisionIntentToAskIntent,
  type InputAnalysis,
} from './index';
import { INPUT_ANALYSIS_FIXTURES } from './fixtures';

function validBase(
  overrides: Partial<InputAnalysis> = {}
): InputAnalysis {
  return {
    version: INPUT_ANALYSIS_VERSION,
    taxonomyVersion: DECISION_INTENT_TAXONOMY_VERSION,
    intent: 'career',
    secondaryIntents: [],
    intentConfidence: 0.9,
    urgency: 'medium',
    complexity: 'medium',
    decisionStage: 'ready_to_act',
    requiredContext: ['primary_goal'],
    missingCriticalContext: [],
    clarificationRequired: false,
    clarificationReason: 'none',
    safetyDomain: 'none',
    ...overrides,
  };
}

describe('Decision Intent Taxonomy v1', () => {
  it('exposes the exact v1 taxonomy and threshold', () => {
    expect([...DECISION_INTENTS_V1]).toEqual([
      'career',
      'business',
      'finance',
      'relationship',
      'family',
      'relocation',
      'education',
      'health',
      'personal_growth',
      'timing',
      'other',
    ]);
    expect(DECISION_INTENT_TAXONOMY_VERSION).toBe('1.0.0');
    expect(INPUT_ANALYSIS_CLARIFICATION_CONFIDENCE_THRESHOLD).toBe(0.65);
  });

  it('exposes required controlled vocabularies', () => {
    expect([...REQUIRED_CONTEXT_KEYS]).toEqual([
      'decision_deadline',
      'current_option',
      'alternative_option',
      'financial_impact',
      'reversibility',
      'primary_goal',
      'primary_risk',
      'location',
      'relationship_status',
      'health_context',
      'known_constraints',
    ]);
    expect([...SAFETY_DOMAINS]).toEqual([
      'none',
      'health',
      'financial',
      'legal',
      'self_harm',
      'other_high_risk',
    ]);
    expect([...DECISION_STAGES]).toEqual([
      'exploring',
      'comparing',
      'ready_to_act',
      'post_decision',
      'unknown',
    ]);
    expect([...INPUT_URGENCY_LEVELS]).toEqual([
      'low',
      'medium',
      'high',
      'critical',
    ]);
    expect([...CLARIFICATION_REASONS]).toEqual([
      'missing_critical_context',
      'ambiguous_intent',
      'safety',
      'none',
    ]);
  });

  it('normalizes aliases deterministically', () => {
    expect(normalizeIntent('job')).toBe('career');
    expect(normalizeIntent('employment')).toBe('career');
    expect(normalizeIntent('promotion')).toBe('career');
    expect(normalizeIntent('marriage')).toBe('relationship');
    expect(normalizeIntent('dating')).toBe('relationship');
    expect(normalizeIntent('divorce')).toBe('relationship');
    expect(normalizeIntent('money')).toBe('finance');
    expect(normalizeIntent('investment')).toBe('finance');
    expect(normalizeIntent('startup')).toBe('business');
    expect(normalizeIntent('entrepreneurship')).toBe('business');
    expect(normalizeIntent('moving')).toBe('relocation');
    expect(normalizeIntent('immigration')).toBe('relocation');
    expect(normalizeIntent('children')).toBe('family');
    expect(normalizeIntent('parenting')).toBe('family');
    expect(DECISION_INTENT_ALIASES.job).toBe('career');
  });

  it('maps unknown values to other', () => {
    expect(normalizeIntent('legal')).toBe('other');
    expect(normalizeIntent('travel')).toBe('other');
    expect(normalizeIntent('xyzzy')).toBe('other');
    expect(normalizeIntent('')).toBe('other');
    expect(normalizeIntent(null)).toBe('other');
  });
});

describe('buildInputAnalysis fixtures', () => {
  it('career', () => {
    const a = buildInputAnalysis(INPUT_ANALYSIS_FIXTURES.career.question);
    expect(a.intent).toBe('career');
    expect(validateInputAnalysis(a).ok).toBe(true);
  });

  it('business', () => {
    expect(
      buildInputAnalysis(INPUT_ANALYSIS_FIXTURES.business.question).intent
    ).toBe('business');
  });

  it('finance', () => {
    expect(
      buildInputAnalysis(INPUT_ANALYSIS_FIXTURES.finance.question).intent
    ).toBe('finance');
  });

  it('relationship', () => {
    expect(
      buildInputAnalysis(INPUT_ANALYSIS_FIXTURES.relationship.question).intent
    ).toBe('relationship');
  });

  it('family', () => {
    expect(
      buildInputAnalysis(INPUT_ANALYSIS_FIXTURES.family.question).intent
    ).toBe('family');
  });

  it('relocation', () => {
    expect(
      buildInputAnalysis(INPUT_ANALYSIS_FIXTURES.relocation.question).intent
    ).toBe('relocation');
  });

  it('education', () => {
    expect(
      buildInputAnalysis(INPUT_ANALYSIS_FIXTURES.education.question).intent
    ).toBe('education');
  });

  it('health-safe', () => {
    const a = buildInputAnalysis(INPUT_ANALYSIS_FIXTURES.healthSafe.question);
    expect(a.intent).toBe('health');
    expect(a.safetyDomain).toBe('health');
    expect(a.clarificationRequired).toBe(true);
    expect(a.clarificationReason).toBe('safety');
  });

  it('legal fallback → other + legal safety', () => {
    const a = buildInputAnalysis(
      INPUT_ANALYSIS_FIXTURES.legalFallback.question
    );
    expect(a.intent).toBe('other');
    expect(a.safetyDomain).toBe('legal');
    expect(a.clarificationRequired).toBe(true);
    expect(a.clarificationReason).toBe('safety');
  });

  it('vague question', () => {
    const a = buildInputAnalysis(INPUT_ANALYSIS_FIXTURES.vague.question);
    expect(a.intent).toBe('other');
    expect(a.clarificationRequired).toBe(true);
    expect(validateInputAnalysis(a).ok).toBe(true);
  });

  it('mixed career + relocation', () => {
    const a = buildInputAnalysis(
      INPUT_ANALYSIS_FIXTURES.mixedCareerRelocation.question
    );
    expect(a.intent).toBe('career');
    expect(a.secondaryIntents).toContain('relocation');
    expect(a.secondaryIntents.length).toBeLessThanOrEqual(MAX_SECONDARY_INTENTS);
    expect(a.secondaryIntents).not.toContain(a.intent);
  });

  it('urgent finance', () => {
    const a = buildInputAnalysis(
      INPUT_ANALYSIS_FIXTURES.urgentFinance.question
    );
    expect(a.intent).toBe('finance');
    expect(a.urgency).toBe('critical');
    expect(a.safetyDomain).toBe('financial');
    expect(a.clarificationReason).toBe('safety');
  });

  it('conversational / non-decision', () => {
    const a = buildInputAnalysis(
      INPUT_ANALYSIS_FIXTURES.conversational.question
    );
    expect(a.intent).toBe('other');
    expect(a.clarificationRequired).toBe(true);
    expect(a.clarificationReason).toBe('ambiguous_intent');
    expect(a.requiredContext).toEqual([]);
    expect(a.missingCriticalContext).toEqual([]);
  });
});

describe('strict structural validation', () => {
  it('rejects unknown fields (no silent strip)', () => {
    const r = validateInputAnalysis({ ...validBase(), extra: true });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.includes('Unknown field'))).toBe(true);
  });

  it('does not silently repair invalid enums outside intent', () => {
    const r = validateInputAnalysis({
      ...validBase(),
      urgency: 'immediate' as InputAnalysis['urgency'],
    });
    expect(r.ok).toBe(false);
    expect(parseInputAnalysis({ ...validBase(), urgency: 'immediate' })).toEqual(
      buildSafeInputAnalysisFallback()
    );
  });

  it('rejects invalid confidence', () => {
    expect(validateInputAnalysis({ ...validBase(), intentConfidence: 1.5 }).ok).toBe(
      false
    );
    expect(
      validateInputAnalysis({ ...validBase(), intentConfidence: Number.NaN }).ok
    ).toBe(false);
  });

  it('rejects unknown intent (not silently mapped in validator)', () => {
    expect(validateInputAnalysis({ ...validBase(), intent: 'money' }).ok).toBe(
      false
    );
  });

  it('rejects >2 secondary intents and duplicates (no silent repair)', () => {
    expect(
      validateInputAnalysis({
        ...validBase(),
        secondaryIntents: ['finance', 'relocation', 'education'],
      }).ok
    ).toBe(false);
    expect(
      validateInputAnalysis({
        ...validBase(),
        secondaryIntents: ['finance', 'finance'],
      }).ok
    ).toBe(false);
    // Documented: builder may collapse duplicates only after alias normalization;
    // validator must still reject duplicate secondaries on raw objects.
  });

  it('rejects primary duplicated in secondaryIntents', () => {
    expect(
      validateInputAnalysis({
        ...validBase(),
        secondaryIntents: ['career', 'relocation'],
      }).ok
    ).toBe(false);
  });

  it('rejects arbitrary requiredContext strings', () => {
    expect(
      validateInputAnalysis({
        ...validBase(),
        requiredContext: ['foo_bar' as InputAnalysis['requiredContext'][number]],
        missingCriticalContext: [],
      }).ok
    ).toBe(false);
  });

  it('invalid structure → deterministic fallback via parse (no repair)', () => {
    const a = parseInputAnalysis({ bad: true });
    const b = parseInputAnalysis({ bad: true });
    expect(a).toEqual(b);
    expect(a).toEqual(buildSafeInputAnalysisFallback());
    expect(validateInputAnalysis(a).ok).toBe(true);
  });
});

describe('semantic clarification invariants', () => {
  it('zero confidence + clarification false → invalid', () => {
    const r = validateInputAnalysis(
      validBase({
        intentConfidence: 0,
        clarificationRequired: false,
        clarificationReason: 'none',
      })
    );
    expect(r.ok).toBe(false);
  });

  it('confidence below threshold + clarification false → invalid', () => {
    const r = validateInputAnalysis(
      validBase({
        intentConfidence: INPUT_ANALYSIS_CLARIFICATION_CONFIDENCE_THRESHOLD - 0.01,
        clarificationRequired: false,
        clarificationReason: 'none',
      })
    );
    expect(r.ok).toBe(false);
  });

  it('missing critical context + clarification false → invalid', () => {
    const r = validateInputAnalysis(
      validBase({
        intentConfidence: 0.9,
        requiredContext: ['primary_goal'],
        missingCriticalContext: ['primary_goal'],
        clarificationRequired: false,
        clarificationReason: 'none',
      })
    );
    expect(r.ok).toBe(false);
  });

  it('safety reason + safetyDomain none → invalid', () => {
    const r = validateInputAnalysis(
      validBase({
        clarificationRequired: true,
        clarificationReason: 'safety',
        safetyDomain: 'none',
        intentConfidence: 0.2,
      })
    );
    expect(r.ok).toBe(false);
  });

  it('ambiguous reason with high-confidence non-other intent → invalid', () => {
    const r = validateInputAnalysis(
      validBase({
        intent: 'career',
        intentConfidence: 0.9,
        clarificationRequired: true,
        clarificationReason: 'ambiguous_intent',
        missingCriticalContext: [],
      })
    );
    expect(r.ok).toBe(false);
  });

  it('reason none + clarification true → invalid', () => {
    const r = validateInputAnalysis(
      validBase({
        clarificationRequired: true,
        clarificationReason: 'none',
        intentConfidence: 0.2,
      })
    );
    expect(r.ok).toBe(false);
  });

  it('clarification false requires reason none; reason none requires false', () => {
    expect(
      validateInputAnalysis(
        validBase({
          clarificationRequired: false,
          clarificationReason: 'ambiguous_intent',
          intentConfidence: 0.2,
        })
      ).ok
    ).toBe(false);
    expect(
      validateInputAnalysis(
        validBase({
          clarificationRequired: true,
          clarificationReason: 'none',
          intentConfidence: 0.2,
        })
      ).ok
    ).toBe(false);
  });

  it('missing_critical_context reason requires non-empty missing', () => {
    expect(
      validateInputAnalysis(
        validBase({
          clarificationRequired: true,
          clarificationReason: 'missing_critical_context',
          missingCriticalContext: [],
          intentConfidence: 0.2,
        })
      ).ok
    ).toBe(false);
  });

  it('fallback is deterministic and semantically valid', () => {
    const a = buildSafeInputAnalysisFallback();
    const b = buildSafeInputAnalysisFallback();
    expect(a).toEqual(b);
    expect(a).toEqual({
      version: '1.0.0',
      taxonomyVersion: '1.0.0',
      intent: 'other',
      secondaryIntents: [],
      intentConfidence: 0,
      urgency: 'medium',
      complexity: 'medium',
      decisionStage: 'unknown',
      requiredContext: [],
      missingCriticalContext: [],
      clarificationRequired: true,
      clarificationReason: 'ambiguous_intent',
      safetyDomain: 'none',
    });
    expect(validateInputAnalysis(a).ok).toBe(true);
  });

  it('analyzer and validator share the same confidence threshold constant', () => {
    expect(INPUT_ANALYSIS_CLARIFICATION_CONFIDENCE_THRESHOLD).toBe(0.65);
    const justBelow = validBase({
      intentConfidence: 0.6499,
      clarificationRequired: true,
      clarificationReason: 'ambiguous_intent',
      intent: 'other',
    });
    expect(validateInputAnalysis(justBelow).ok).toBe(true);
    const justBelowNoClarify = validBase({
      intentConfidence: 0.6499,
      clarificationRequired: false,
      clarificationReason: 'none',
    });
    expect(validateInputAnalysis(justBelowNoClarify).ok).toBe(false);
  });
});

describe('pipeline compatibility', () => {
  it('fallback meta does not trigger legacy clarification UI', async () => {
    // Legacy gate: this question does not require clarification.
    const out = await runAskDecision({
      question: 'Should I wait before launching the product?',
      profile: null,
      locale: 'en',
    });
    expect(out.pendingClarification).toBe(false);
    expect(out.clarification.required).toBe(false);
    // Informational InputAnalysis may still request clarification in meta.
    expect(out.result.meta?.inputAnalysis).toBeDefined();
    expect(typeof out.result.meta?.inputAnalysis?.clarificationRequired).toBe(
      'boolean'
    );
    // No top-level inputAnalysis field (type-compatible with existing mocks).
    expect('inputAnalysis' in out).toBe(false);
  });

  it('maps DecisionIntent → AskIntent bridge without replacing detectIntent', () => {
    expect(decisionIntentToAskIntent('finance')).toBe('money');
    expect(decisionIntentToAskIntent('other')).toBe('general');
  });
});

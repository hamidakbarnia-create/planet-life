import { describe, expect, it } from 'vitest';
import {
  DECISION_INTENTS_V1,
  validateInputAnalysis,
} from '../input-analysis';
import {
  DIMENSION_READINESS_RULES,
  getIntentTemplate,
} from '../intent-templates';
import { buildUnifiedDecisionContext } from '../context-builder';
import { runAskDecision } from '../run';
import {
  buildDegradedReasoningPlan,
  buildReasoningPlan,
  buildSafeReasoningPlanFallback,
  calculatePlannerConfidence,
  deriveContextSets,
  dimensionStatus,
  gatherPositiveEvidence,
  hasDeadlineEvidence,
  validateReasoningPlan,
} from './index';
import {
  QUESTIONS,
  analysisFallback,
  analysisFor,
  analysisWithAvailability,
  contextFor,
  FIXED_NOW,
} from './fixtures';
import { TIMING_AVAILABLE } from '../context-builder/fixtures';

describe('ReasoningPlanner — primary intent plans', () => {
  for (const intent of DECISION_INTENTS_V1) {
    it(`${intent} plan uses matching template`, () => {
      const analysis = analysisFor(intent);
      const plan = buildReasoningPlan({
        analysis,
        context: contextFor(analysis),
      });
      expect(validateReasoningPlan(plan).ok).toBe(true);
      expect(plan.primaryIntent).toBe(analysis.intent);
      expect(plan.templateId).toBe(`intent.${analysis.intent}.v1`);
      const primaryDims = getIntentTemplate(analysis.intent).dimensions;
      expect(plan.dimensions.map((d) => d.dimension).slice(0, primaryDims.length)).toEqual(
        primaryDims
      );
      expect(plan).not.toHaveProperty('recommendation');
      expect(plan).not.toHaveProperty('prompt');
    });
  }
});

describe('availability — positive evidence only', () => {
  it('required but not missing does not automatically become available', () => {
    const analysis = analysisWithAvailability({
      intent: 'career',
      required: ['primary_goal', 'current_option'],
      missing: [],
      intentConfidence: 0.9,
      clarificationRequired: false,
    });
    // Question with no goal language
    const context = buildUnifiedDecisionContext({
      question: 'Hello there.',
      locale: 'en',
      analysis,
      now: () => FIXED_NOW,
    });
    const { availableContext, missingContext } = deriveContextSets({
      analysis,
      context,
      finalRequiredContext: ['primary_goal', 'current_option'],
    });
    expect(availableContext).not.toContain('primary_goal');
    expect(missingContext).toContain('primary_goal');
  });

  it('missingCriticalContext adds missing keys', () => {
    const analysis = analysisWithAvailability({
      intent: 'career',
      required: ['primary_goal'],
      missing: ['primary_goal'],
      intentConfidence: 0.8,
    });
    const context = contextFor(analysis, QUESTIONS.career);
    const { missingContext, availableContext } = deriveContextSets({
      analysis,
      context,
      finalRequiredContext: ['primary_goal'],
    });
    expect(missingContext).toContain('primary_goal');
    expect(availableContext).not.toContain('primary_goal');
  });

  it('positive evidence creates availability', () => {
    const analysis = analysisWithAvailability({
      intent: 'career',
      required: ['location'],
      missing: [],
      intentConfidence: 0.9,
      clarificationRequired: false,
    });
    const context = buildUnifiedDecisionContext({
      question: 'Should I relocate to Berlin?',
      locale: 'en',
      analysis,
      profile: {
        birth_date: '1990-01-01',
        birth_time: '12:00',
        location: 'X',
        action_type: 'career',
        current_location: {
          city: 'Berlin',
          country: 'Germany',
          timezone: 'Europe/Berlin',
        },
      },
      now: () => FIXED_NOW,
    });
    const evidenced = gatherPositiveEvidence(context);
    expect(evidenced.has('location')).toBe(true);
    const { availableContext } = deriveContextSets({
      analysis,
      context,
      finalRequiredContext: ['location'],
    });
    expect(availableContext).toContain('location');
  });

  it('unrelated facts do not create availability', () => {
    const analysis = analysisWithAvailability({
      intent: 'career',
      required: ['primary_goal'],
      missing: [],
      intentConfidence: 0.9,
      clarificationRequired: false,
    });
    const context = contextFor(analysis, 'Hello.');
    const { availableContext } = deriveContextSets({
      analysis,
      context,
      finalRequiredContext: ['primary_goal'],
    });
    expect(availableContext).not.toContain('primary_goal');
    // analysis.* facts exist but must not evidence primary_goal
    expect(context.knownFacts.some((f) => f.key === 'analysis.intent')).toBe(
      true
    );
  });
});

describe('procedural readiness', () => {
  const base = {
    available: new Set<import('../input-analysis').RequiredContextKey>(),
    missingContext: [] as import('../input-analysis').RequiredContextKey[],
    question: 'Should I decide?',
    knownFactCount: 1,
    timing: { available: false } as const,
    intentConfidence: 0.8,
    isTotalFallback: false,
  };

  it('evidence_quality / missing_information / next_actions / decision_checkpoint', () => {
    expect(
      dimensionStatus('evidence_quality', {
        ...base,
        available: new Set(),
        question: '',
        knownFactCount: 0,
      }).status
    ).toBe('blocked');
    expect(
      dimensionStatus('evidence_quality', {
        ...base,
        available: new Set(),
        question: 'x',
        knownFactCount: 0,
      }).status
    ).toBe('partial');
    expect(
      dimensionStatus('evidence_quality', {
        ...base,
        available: new Set(['primary_goal']),
      }).status
    ).toBe('ready');

    expect(
      dimensionStatus('missing_information', {
        ...base,
        missingContext: [],
      }).status
    ).toBe('ready');
    expect(
      dimensionStatus('missing_information', {
        ...base,
        missingContext: ['primary_goal'],
      }).status
    ).toBe('partial');

    expect(
      dimensionStatus('next_actions', {
        ...base,
        available: new Set(),
      }).status
    ).toBe('blocked');
    expect(
      dimensionStatus('next_actions', {
        ...base,
        available: new Set(['location']),
      }).status
    ).toBe('partial');
    expect(
      dimensionStatus('next_actions', {
        ...base,
        available: new Set(['primary_goal']),
      }).status
    ).toBe('ready');

    expect(
      dimensionStatus('decision_checkpoint', {
        ...base,
        available: new Set(),
      }).status
    ).toBe('blocked');
    expect(
      dimensionStatus('decision_checkpoint', {
        ...base,
        available: new Set(['decision_deadline']),
      }).status
    ).toBe('ready');
  });

  it('confidence dimension: ready / partial / blocked', () => {
    expect(
      dimensionStatus('confidence', {
        ...base,
        intentConfidence: 0.8,
        available: new Set(['primary_goal']),
      }).status
    ).toBe('ready');
    expect(
      dimensionStatus('confidence', {
        ...base,
        intentConfidence: 0.8,
        available: new Set(),
        question: 'sparse',
      }).status
    ).toBe('partial');
    expect(
      dimensionStatus('confidence', {
        ...base,
        isTotalFallback: true,
        intentConfidence: 0,
        available: new Set(),
        question: '',
        knownFactCount: 0,
      }).status
    ).toBe('blocked');
  });

  it('timing dimension uses Timing Intelligence payload, not decision_deadline', () => {
    expect(
      dimensionStatus('timing', {
        ...base,
        timing: { available: false },
      }).status
    ).toBe('blocked');
    expect(
      dimensionStatus('timing', {
        ...base,
        timing: { available: true, source: 'timing-engine' },
      }).status
    ).toBe('partial');
    expect(
      dimensionStatus('timing', {
        ...base,
        timing: {
          available: true,
          source: 'timing-engine',
          score: 71,
          summary: 'Favorable window',
        },
      }).status
    ).toBe('ready');
  });

  it('empty context_required configuration is blocked, not ready', () => {
    for (const [dim, rule] of Object.entries(DIMENSION_READINESS_RULES)) {
      if (rule.mode === 'context_required') {
        expect(rule.requiredContext.length).toBeGreaterThan(0);
      }
      expect(dim).toBeTruthy();
    }
  });
});

describe('no false timing → decision_deadline mapping', () => {
  it('timing available/score/summary do not create decision_deadline', () => {
    const analysis = analysisWithAvailability({
      intent: 'career',
      required: ['decision_deadline'],
      missing: [],
      intentConfidence: 0.85,
      clarificationRequired: false,
    });
    const context = buildUnifiedDecisionContext({
      question: 'Should I accept this job offer or stay put?',
      locale: 'en',
      analysis,
      timing: TIMING_AVAILABLE,
      now: () => FIXED_NOW,
    });
    expect(context.timing.available).toBe(true);
    const evidenced = gatherPositiveEvidence(context);
    expect(evidenced.has('decision_deadline')).toBe(false);
    const { availableContext, missingContext } = deriveContextSets({
      analysis,
      context,
      finalRequiredContext: ['decision_deadline'],
    });
    expect(availableContext).not.toContain('decision_deadline');
    expect(missingContext).toContain('decision_deadline');

    const withTiming = buildReasoningPlan({ analysis, context });
    const withoutTiming = buildReasoningPlan({
      analysis,
      context: { ...context, timing: { available: false } },
    });
    expect(withTiming.availableContext).not.toContain('decision_deadline');
    expect(
      withTiming.dimensions.find((d) => d.dimension === 'decision_checkpoint')
        ?.status
    ).not.toBe('ready');
    // Numeric confidence must not rise from a false deadline mapping
    expect(withTiming.confidence).toBe(withoutTiming.confidence);
    // timing dimension itself can be ready from Timing Intelligence
    expect(
      withTiming.dimensions.find((d) => d.dimension === 'timing')?.status
    ).toBe('ready');
  });
});

describe('deadline evidence hardening', () => {
  it('rejects generic when/timing/schedule; accepts explicit deadlines', () => {
    expect(hasDeadlineEvidence('When should I move?')).toBe(false);
    expect(hasDeadlineEvidence('What is the best timing?')).toBe(false);
    expect(hasDeadlineEvidence('Help me schedule this')).toBe(false);
    expect(hasDeadlineEvidence('I must decide by Friday')).toBe(true);
    expect(hasDeadlineEvidence('The offer expires in two days')).toBe(true);
    expect(hasDeadlineEvidence('There is a hard deadline next week')).toBe(
      true
    );
  });
});

describe('secondary merge recalculation order', () => {
  it('career + relocation adds location requirement and affects readiness/confidence', () => {
    const analysis = analysisWithAvailability({
      intent: 'career',
      secondaryIntents: ['relocation'],
      required: [
        'current_option',
        'alternative_option',
        'financial_impact',
        'decision_deadline',
        'primary_goal',
      ],
      missing: [],
      intentConfidence: 0.85,
      clarificationRequired: false,
    });
    // No location evidence
    const context = contextFor(
      analysis,
      'Should I accept this job offer or stay put?'
    );
    const withRelocation = buildReasoningPlan({ analysis, context });
    expect(withRelocation.requiredContext).toContain('location');
    expect(withRelocation.missingContext).toContain('location');
    expect(
      withRelocation.dimensions.find((d) => d.dimension === 'location_impact')
        ?.status
    ).toBe('blocked');

    const without = buildReasoningPlan({
      analysis: { ...analysis, secondaryIntents: [] },
      context,
    });
    expect(withRelocation.confidence).toBeLessThanOrEqual(without.confidence);
    expect(
      withRelocation.requiredContext.filter((k) => k === 'location')
    ).toHaveLength(1);
  });

  it('other as secondary contributes nothing', () => {
    const analysis = analysisWithAvailability({
      intent: 'career',
      secondaryIntents: ['other'],
      required: ['primary_goal'],
      missing: [],
      intentConfidence: 0.9,
      clarificationRequired: false,
    });
    const plan = buildReasoningPlan({
      analysis,
      context: contextFor(analysis, QUESTIONS.career),
    });
    expect(plan.dimensions.map((d) => d.dimension)).toEqual(
      getIntentTemplate('career').dimensions
    );
  });
});

describe('confidence hardening', () => {
  it('zero required-context denominator uses ratio 0', () => {
    expect(
      calculatePlannerConfidence({
        intentConfidence: 1,
        availableRequiredCount: 0,
        templateRequiredCount: 0,
        blockedContextRequiredCount: 0,
        contextRequiredDimensionCount: 0,
        totalDimensionCount: 5,
      })
    ).toBe(0.5);
  });

  it('min / max / all blocked / all ready / mixed', () => {
    expect(
      calculatePlannerConfidence({
        intentConfidence: 0,
        availableRequiredCount: 0,
        templateRequiredCount: 10,
        blockedContextRequiredCount: 10,
        contextRequiredDimensionCount: 10,
        totalDimensionCount: 10,
      })
    ).toBe(0);
    expect(
      calculatePlannerConfidence({
        intentConfidence: 1,
        availableRequiredCount: 10,
        templateRequiredCount: 10,
        blockedContextRequiredCount: 0,
        contextRequiredDimensionCount: 10,
        totalDimensionCount: 10,
      })
    ).toBe(1);
    expect(
      calculatePlannerConfidence({
        intentConfidence: 0.5,
        availableRequiredCount: 5,
        templateRequiredCount: 10,
        blockedContextRequiredCount: 0,
        contextRequiredDimensionCount: 10,
        totalDimensionCount: 10,
      })
    ).toBe(0.575);
  });

  it('zero dimensions returns 0; non-finite inputs safe', () => {
    expect(
      calculatePlannerConfidence({
        intentConfidence: 1,
        availableRequiredCount: 1,
        templateRequiredCount: 1,
        blockedContextRequiredCount: 0,
        contextRequiredDimensionCount: 1,
        totalDimensionCount: 0,
      })
    ).toBe(0);
    expect(
      calculatePlannerConfidence({
        intentConfidence: Number.NaN,
        availableRequiredCount: Number.POSITIVE_INFINITY,
        templateRequiredCount: 2,
        blockedContextRequiredCount: 0,
        contextRequiredDimensionCount: 2,
        totalDimensionCount: 2,
      })
    ).toBeGreaterThanOrEqual(0);
  });

  it('fallback confidence remains appropriately low; confidence dim blocked', () => {
    const plan = buildSafeReasoningPlanFallback();
    expect(plan.confidence).toBeLessThan(0.4);
    expect(plan.primaryIntent).toBe('other');
    expect(
      plan.dimensions.find((d) => d.dimension === 'confidence')?.status
    ).toBe('blocked');
  });
});

describe('two-level fallback', () => {
  it('Level A: planner degradation preserves valid primary intent', () => {
    const analysis = analysisFor('career');
    expect(validateInputAnalysis(analysis).ok).toBe(true);
    const context = contextFor(analysis);
    const degraded = buildDegradedReasoningPlan(analysis, context);
    expect(degraded.primaryIntent).toBe('career');
    expect(degraded.templateId).toBe('intent.career.v1');
    expect(degraded.secondaryIntents).toEqual([]);
    expect(validateReasoningPlan(degraded).ok).toBe(true);
  });

  it('Level B: total fallback when analysis invalid', () => {
    const plan = buildReasoningPlan({
      analysis: { bad: true } as never,
      context: contextFor(analysisFallback(), 'x'),
    });
    expect(plan.primaryIntent).toBe('other');
    expect(plan.templateId).toBe('intent.other.v1');
  });
});

describe('clarification informational + pipeline', () => {
  it('clarificationRecommended true does not open legacy clarification UI', async () => {
    const out = await runAskDecision({
      question: 'Should I wait before launching the product?',
      profile: null,
      locale: 'en',
    });
    expect(out.result.meta?.reasoningPlan?.clarificationRecommended).toBe(true);
    expect(out.pendingClarification).toBe(false);
    expect(out.clarification.required).toBe(false);
    expect('reasoningPlan' in out).toBe(false);
  });

  it('deterministic plan output', () => {
    const analysis = analysisFor('career');
    const ctx = contextFor(analysis);
    expect(buildReasoningPlan({ analysis, context: ctx })).toEqual(
      buildReasoningPlan({ analysis, context: ctx })
    );
  });

  it('rejects unknown fields / bad templateId / bad confidence', () => {
    const analysis = analysisFor('career');
    const valid = buildReasoningPlan({
      analysis,
      context: contextFor(analysis),
    });
    expect(validateReasoningPlan({ ...valid, extra: true }).ok).toBe(false);
    expect(
      validateReasoningPlan({ ...valid, templateId: 'intent.business.v1' }).ok
    ).toBe(false);
    expect(validateReasoningPlan({ ...valid, confidence: 2 }).ok).toBe(false);
  });
});

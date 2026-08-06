/**
 * Deterministic ReasoningPlanner — declarative evaluation plan only.
 *
 * Calculation order:
 * 1. primary template
 * 2. secondary dimension/risk merge
 * 3. final dimension list
 * 4. final required context (from final dimensions + templates)
 * 5. available context (positive evidence only)
 * 6. missing context
 * 7. dimension readiness
 * 8. clarificationRecommended
 * 9. confidence
 * 10. planId
 */

import {
  buildSafeInputAnalysisFallback,
  validateInputAnalysis,
  type DecisionIntent,
  type InputAnalysis,
  type RequiredContextKey,
} from '../input-analysis';
import {
  CONTEXT_SOURCE_PRIORITY,
  UNIFIED_DECISION_CONTEXT_VERSION,
  validateUnifiedDecisionContext,
  type UnifiedDecisionContext,
} from '../context-builder';
import {
  DIMENSION_READINESS_RULES,
  getIntentTemplate,
  SECONDARY_SUPPLEMENTAL_DIMENSIONS,
  SECONDARY_SUPPLEMENTAL_RISKS,
  type ActionHorizon,
  type DecisionDimension,
  type RiskDomain,
} from '../intent-templates';
import { calculatePlannerConfidence } from './confidence';
import { deriveContextSets, dimensionStatus } from './context-readiness';
import { derivePlanId } from './plan-id';
import {
  REASONING_PLAN_TEMPLATE_VERSION,
  REASONING_PLAN_VERSION,
  type PlannedDimension,
  type ReasoningPlan,
} from './types';
import { validateReasoningPlan } from './validate';

export type BuildReasoningPlanInput = {
  analysis: InputAnalysis;
  context: UnifiedDecisionContext;
};

function uniqueOrdered<T>(items: T[]): T[] {
  const out: T[] = [];
  for (const item of items) {
    if (!out.includes(item)) out.push(item);
  }
  return out;
}

function mergeDimensions(
  primary: readonly DecisionDimension[],
  secondaryIntents: readonly DecisionIntent[]
): DecisionDimension[] {
  const dims = [...primary];
  for (const intent of secondaryIntents) {
    if (intent === 'other') continue;
    for (const d of SECONDARY_SUPPLEMENTAL_DIMENSIONS[intent]) {
      if (!dims.includes(d)) dims.push(d);
    }
  }
  return dims;
}

function mergeRisks(
  primary: readonly RiskDomain[],
  secondaryIntents: readonly DecisionIntent[]
): RiskDomain[] {
  const risks = [...primary];
  for (const intent of secondaryIntents) {
    if (intent === 'other') continue;
    for (const r of SECONDARY_SUPPLEMENTAL_RISKS[intent]) {
      if (r === 'none') continue;
      if (!risks.includes(r)) risks.push(r);
    }
  }
  if (risks.length > 1) {
    return risks.filter((r) => r !== 'none');
  }
  return risks;
}

function finalRequiredFromDimensions(
  dimensions: readonly DecisionDimension[],
  primaryTemplateRequired: readonly RequiredContextKey[],
  secondaryIntents: readonly DecisionIntent[]
): RequiredContextKey[] {
  const keys: RequiredContextKey[] = [...primaryTemplateRequired];
  for (const dim of dimensions) {
    for (const k of DIMENSION_READINESS_RULES[dim].requiredContext) {
      keys.push(k);
    }
  }
  for (const intent of secondaryIntents) {
    if (intent === 'other') continue;
    for (const k of getIntentTemplate(intent).requiredContext) {
      keys.push(k);
    }
  }
  return uniqueOrdered(keys);
}

function assemblePlan(args: {
  analysis: InputAnalysis;
  context: UnifiedDecisionContext;
  secondaryIntents: DecisionIntent[];
  includeSecondaries: boolean;
  isTotalFallback?: boolean;
}): ReasoningPlan {
  const { analysis, context } = args;
  const secondaryIntents = args.includeSecondaries
    ? args.secondaryIntents.slice(0, 2)
    : [];
  const template = getIntentTemplate(analysis.intent);

  // 1–3: primary + merge → final dimensions
  const dimensionList = mergeDimensions(template.dimensions, secondaryIntents);
  if (dimensionList.length === 0) {
    throw new Error('ReasoningPlan has zero dimensions');
  }

  // 4: final required context
  const requiredContext = finalRequiredFromDimensions(
    dimensionList,
    template.requiredContext,
    secondaryIntents
  );

  // 5–6: available / missing
  const { availableContext, missingContext } = deriveContextSets({
    analysis,
    context,
    finalRequiredContext: requiredContext,
  });
  const availableSet = new Set(availableContext);

  // 7: readiness
  const readinessInput = {
    available: availableSet,
    missingContext,
    question: context.question.original,
    knownFactCount: context.knownFacts.length,
    timing: context.timing,
    intentConfidence: analysis.intentConfidence,
    isTotalFallback: Boolean(args.isTotalFallback),
  };
  const dimensions: PlannedDimension[] = dimensionList.map((dimension, i) => {
    const { status, requiredContext: dimRequired } = dimensionStatus(
      dimension,
      readinessInput
    );
    return {
      dimension,
      priority: i + 1,
      status,
      requiredContext: dimRequired,
    };
  });

  // 8: clarification (after final context + readiness)
  const blockedContextRequired = dimensions.filter((d) => {
    const mode = DIMENSION_READINESS_RULES[d.dimension].mode;
    return mode === 'context_required' && d.status === 'blocked';
  });
  const clarificationRecommended =
    analysis.clarificationRequired ||
    missingContext.length > 0 ||
    blockedContextRequired.length > 0;

  // 9: confidence
  const contextRequiredDims = dimensions.filter(
    (d) => DIMENSION_READINESS_RULES[d.dimension].mode === 'context_required'
  );
  const confidence = calculatePlannerConfidence({
    intentConfidence: analysis.intentConfidence,
    availableRequiredCount: requiredContext.filter((k) =>
      availableSet.has(k)
    ).length,
    templateRequiredCount: requiredContext.length,
    blockedContextRequiredCount: blockedContextRequired.length,
    contextRequiredDimensionCount: contextRequiredDims.length,
    totalDimensionCount: dimensions.length,
  });

  const riskDomains = mergeRisks(template.riskDomains, secondaryIntents);
  const actionHorizons: ActionHorizon[] = [...template.actionHorizons];

  // 10: planId
  const planId = derivePlanId({
    primaryIntent: analysis.intent,
    secondaryIntents,
    templateId: template.templateId,
    dimensions: dimensions.map((d) => d.dimension),
    missingContext,
    clarificationRecommended,
    confidence,
    templateVersion: REASONING_PLAN_TEMPLATE_VERSION,
  });

  return {
    version: REASONING_PLAN_VERSION,
    templateVersion: REASONING_PLAN_TEMPLATE_VERSION,
    planId,
    primaryIntent: analysis.intent,
    secondaryIntents: [...secondaryIntents],
    templateId: template.templateId,
    dimensions,
    requiredContext,
    availableContext,
    missingContext,
    riskDomains,
    actionHorizons,
    clarificationRecommended,
    confidence,
  };
}

/**
 * Level A — planner degradation: preserve valid primary intent; primary template only.
 */
export function buildDegradedReasoningPlan(
  analysis: InputAnalysis,
  context: UnifiedDecisionContext
): ReasoningPlan {
  const plan = assemblePlan({
    analysis,
    context,
    secondaryIntents: [],
    includeSecondaries: false,
  });
  const validated = validateReasoningPlan(plan);
  if (validated.ok) return validated.value;
  return buildSafeReasoningPlanFallback(context);
}

/**
 * Level B — total fallback: InputAnalysis fallback + `other` template.
 */
export function buildSafeReasoningPlanFallback(
  context?: UnifiedDecisionContext | null
): ReasoningPlan {
  const analysis = buildSafeInputAnalysisFallback();
  const otherAnalysis: InputAnalysis = {
    ...analysis,
    intent: 'other',
    secondaryIntents: [],
  };

  const contextOk = context
    ? validateUnifiedDecisionContext(context)
    : { ok: false as const };
  const minimalContext: UnifiedDecisionContext = contextOk.ok
    ? {
        ...contextOk.value,
        analysis: otherAnalysis,
        decision: {
          ...contextOk.value.decision,
          primaryIntent: 'other',
          secondaryIntents: [],
        },
      }
    : {
        version: UNIFIED_DECISION_CONTEXT_VERSION,
        builtAt: '1970-01-01T00:00:00.000Z',
        question: { original: '', locale: 'en' },
        analysis: otherAnalysis,
        user: { profileAvailable: false },
        decision: {
          primaryIntent: 'other',
          secondaryIntents: [],
          stage: otherAnalysis.decisionStage,
          urgency: otherAnalysis.urgency,
          complexity: otherAnalysis.complexity,
        },
        timing: { available: false },
        conversation: {
          available: false,
          messageCount: 0,
          recentMessages: [],
        },
        knownFacts: [],
        constraints: [],
        missingContext: [],
        sourcePriority: [...CONTEXT_SOURCE_PRIORITY],
      };

  const plan = assemblePlan({
    analysis: otherAnalysis,
    context: minimalContext,
    secondaryIntents: [],
    includeSecondaries: false,
    isTotalFallback: true,
  });

  const validated = validateReasoningPlan(plan);
  if (validated.ok) return validated.value;
  throw new Error(
    `ReasoningPlan total fallback invalid: ${validated.ok === false ? validated.errors.join('; ') : 'unknown'}`
  );
}

/**
 * Build a validated ReasoningPlan with two-level degradation.
 */
export function buildReasoningPlan(
  input: BuildReasoningPlanInput
): ReasoningPlan {
  const analysisResult = validateInputAnalysis(input.analysis);
  const contextResult = validateUnifiedDecisionContext(input.context);

  if (!analysisResult.ok || !contextResult.ok) {
    return buildSafeReasoningPlanFallback(
      contextResult.ok ? contextResult.value : null
    );
  }

  const analysis = analysisResult.value;
  const context = contextResult.value;

  try {
    const plan = assemblePlan({
      analysis,
      context,
      secondaryIntents: analysis.secondaryIntents,
      includeSecondaries: true,
    });
    const validated = validateReasoningPlan(plan);
    if (validated.ok) return validated.value;
    // Level A: valid inputs, planner-stage failure
    return buildDegradedReasoningPlan(analysis, context);
  } catch {
    return buildDegradedReasoningPlan(analysis, context);
  }
}

/**
 * Build GroundingProvenance from structured decision inputs + parsed result.
 *
 * P2.1b-03: inventory evidence and claim containers with candidate refs.
 * Does not rewrite response text, assert support, or fabricate citations.
 *
 * Observes the post–Localization/Writing-Quality AskDecisionResult only.
 * See types.ts module header: not end-to-end / raw-provider claim provenance.
 */

import {
  validateUnifiedDecisionContext,
  type UnifiedDecisionContext,
} from '../context-builder';
import {
  validateReasoningPlan,
  type ReasoningPlan,
} from '../reasoning-planner';
import type { AskDecisionResult } from '../types';
import { claimId, digestValue, evidenceId } from './digest';
import {
  EVIDENCE_ITEM_VERSION,
  GROUNDING_CLAIM_FIELD_PATHS,
  GROUNDING_PROVENANCE_VERSION,
  type ClaimContainer,
  type Evidence,
  type EvidenceKind,
  type EvidenceRef,
  type GroundingProvenance,
  type GroundingStatus,
} from './types';
import { validateGroundingProvenance } from './validate';

export type BuildGroundingInput = {
  context: UnifiedDecisionContext;
  plan: ReasoningPlan;
  result: AskDecisionResult;
  builtAt?: string;
};

function refsForKinds(
  evidence: readonly Evidence[],
  kinds: readonly EvidenceKind[]
): EvidenceRef[] {
  const kindSet = new Set(kinds);
  const refs: EvidenceRef[] = [];
  const seen = new Set<string>();
  for (const e of evidence) {
    if (!kindSet.has(e.kind)) continue;
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    refs.push({ evidenceId: e.id });
  }
  return refs;
}

/** Structural candidate mapping — not claim-level support evaluation. */
function candidateKindsForField(fieldPath: string): EvidenceKind[] {
  if (
    fieldPath === 'timing.timingRationale' ||
    fieldPath === 'scores.timing.rationale'
  ) {
    return ['timing', 'plan', 'fact'];
  }
  if (
    fieldPath === 'scores.risk.rationale' ||
    fieldPath.startsWith('scenarios.downside')
  ) {
    return ['constraint', 'plan', 'fact', 'missing_context'];
  }
  if (
    fieldPath === 'scores.readiness.rationale' ||
    fieldPath === 'scores.confidence.rationale' ||
    fieldPath === 'confidence.explanation'
  ) {
    return ['plan', 'missing_context', 'fact', 'analysis'];
  }
  if (fieldPath === 'recommendation' || fieldPath === 'recommendationStatus') {
    return ['fact', 'constraint', 'plan', 'question', 'analysis'];
  }
  if (fieldPath === 'assumptions' || fieldPath === 'limitations') {
    return ['missing_context', 'constraint', 'analysis'];
  }
  if (fieldPath === 'executiveSummary') {
    return ['question', 'fact', 'plan', 'analysis'];
  }
  return ['question', 'fact', 'plan', 'analysis'];
}

function readFieldText(
  result: AskDecisionResult,
  fieldPath: string
): string | null {
  switch (fieldPath) {
    case 'executiveSummary':
      return result.executiveSummary ?? null;
    case 'recommendation':
      return result.recommendation ?? null;
    case 'recommendationStatus':
      return result.recommendationStatus ?? null;
    case 'scores.opportunity.rationale':
      return result.scores?.opportunity?.rationale ?? null;
    case 'scores.risk.rationale':
      return result.scores?.risk?.rationale ?? null;
    case 'scores.timing.rationale':
      return result.scores?.timing?.rationale ?? null;
    case 'scores.readiness.rationale':
      return result.scores?.readiness?.rationale ?? null;
    case 'scores.confidence.rationale':
      return result.scores?.confidence?.rationale ?? null;
    case 'timing.timingRationale':
      return result.timing?.timingRationale ?? null;
    case 'scenarios.bestCase.outcome':
      return result.scenarios?.bestCase?.outcome ?? null;
    case 'scenarios.mostLikely.outcome':
      return result.scenarios?.mostLikely?.outcome ?? null;
    case 'scenarios.downsideCase.outcome':
      return result.scenarios?.downsideCase?.outcome ?? null;
    case 'confidence.explanation':
      return result.confidence?.explanation ?? null;
    case 'assumptions':
      return Array.isArray(result.assumptions)
        ? result.assumptions.join('\n')
        : null;
    case 'limitations':
      return Array.isArray(result.limitations)
        ? result.limitations.join('\n')
        : null;
    default:
      return null;
  }
}

function pushEvidence(
  out: Evidence[],
  seen: Set<string>,
  item: Evidence
): void {
  if (seen.has(item.id)) return;
  seen.add(item.id);
  out.push(item);
}

function collectEvidence(
  context: UnifiedDecisionContext,
  plan: ReasoningPlan
): Evidence[] {
  const out: Evidence[] = [];
  const seen = new Set<string>();

  const questionKey = 'question.original';
  pushEvidence(out, seen, {
    version: EVIDENCE_ITEM_VERSION,
    id: evidenceId('question', questionKey),
    kind: 'question',
    source: 'current_question',
    key: questionKey,
    valueDigest: digestValue(context.question.original),
    confidence: 1,
  });

  pushEvidence(out, seen, {
    version: EVIDENCE_ITEM_VERSION,
    id: evidenceId('analysis', 'intent'),
    kind: 'analysis',
    source: 'input_analysis',
    key: 'intent',
    valueDigest: digestValue({
      intent: context.analysis.intent,
      secondary: context.analysis.secondaryIntents,
      stage: context.analysis.decisionStage,
      urgency: context.analysis.urgency,
      complexity: context.analysis.complexity,
    }),
    confidence: context.analysis.intentConfidence,
  });

  for (const fact of context.knownFacts) {
    pushEvidence(out, seen, {
      version: EVIDENCE_ITEM_VERSION,
      id: evidenceId('fact', fact.key),
      kind: 'fact',
      source: fact.source,
      key: fact.key,
      valueDigest: digestValue(fact.value),
      confidence: fact.confidence,
    });
  }

  for (const constraint of context.constraints) {
    pushEvidence(out, seen, {
      version: EVIDENCE_ITEM_VERSION,
      id: evidenceId('constraint', constraint.key),
      kind: 'constraint',
      source: constraint.source,
      key: constraint.key,
      valueDigest: digestValue(constraint.value),
      confidence: constraint.confidence,
    });
  }

  if (context.timing.available) {
    pushEvidence(out, seen, {
      version: EVIDENCE_ITEM_VERSION,
      id: evidenceId('timing', 'timing.summary'),
      kind: 'timing',
      source: 'timing',
      key: 'timing',
      valueDigest: digestValue({
        summary: context.timing.summary ?? null,
        score: context.timing.score ?? null,
        confidence: context.timing.confidence ?? null,
        source: context.timing.source ?? null,
      }),
      confidence: context.timing.confidence,
    });
  }

  if (context.conversation.available) {
    context.conversation.recentMessages.forEach((msg, i) => {
      const key = `conversation[${i}].${msg.role}`;
      pushEvidence(out, seen, {
        version: EVIDENCE_ITEM_VERSION,
        id: evidenceId('conversation', key),
        kind: 'conversation',
        source: 'conversation',
        key,
        valueDigest: digestValue(msg.content),
        confidence: 1,
      });
    });
  }

  pushEvidence(out, seen, {
    version: EVIDENCE_ITEM_VERSION,
    id: evidenceId('plan', plan.planId),
    kind: 'plan',
    source: 'reasoning_plan',
    key: 'planId',
    valueDigest: digestValue({
      planId: plan.planId,
      templateId: plan.templateId,
      dimensions: plan.dimensions.map((d) => ({
        dimension: d.dimension,
        status: d.status,
      })),
      riskDomains: plan.riskDomains,
      actionHorizons: plan.actionHorizons,
      clarificationRecommended: plan.clarificationRecommended,
      confidence: plan.confidence,
    }),
    confidence: plan.confidence,
  });

  for (const key of plan.missingContext) {
    pushEvidence(out, seen, {
      version: EVIDENCE_ITEM_VERSION,
      id: evidenceId('missing_context', key),
      kind: 'missing_context',
      source: 'reasoning_plan',
      key,
      valueDigest: digestValue(key),
      confidence: 1,
    });
  }

  // Stable order: kind then id
  out.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
    return a.id.localeCompare(b.id);
  });
  return out;
}

function collectClaims(
  result: AskDecisionResult,
  evidence: readonly Evidence[]
): ClaimContainer[] {
  const claims: ClaimContainer[] = [];

  for (const fieldPath of GROUNDING_CLAIM_FIELD_PATHS) {
    const text = readFieldText(result, fieldPath);
    const trimmed = typeof text === 'string' ? text.trim() : '';
    const textDigest = trimmed ? digestValue(trimmed) : null;
    const evidenceRefs = refsForKinds(
      evidence,
      candidateKindsForField(fieldPath)
    );
    claims.push({
      id: claimId(fieldPath),
      fieldPath,
      textDigest,
      evidenceRefs,
      // P2.1b-03: containers + candidates only — no claim-level verdicts yet.
      status: 'unknown',
    });
  }

  // Analysis sections (dynamic paths)
  for (const section of result.analysis ?? []) {
    const fieldPath = `analysis.${section.id}.body`;
    const trimmed = (section.body ?? '').trim();
    claims.push({
      id: claimId(fieldPath),
      fieldPath,
      textDigest: trimmed ? digestValue(trimmed) : null,
      evidenceRefs: refsForKinds(evidence, [
        'question',
        'fact',
        'plan',
        'analysis',
        'constraint',
      ]),
      status: 'unknown',
    });
  }

  claims.sort((a, b) => a.fieldPath.localeCompare(b.fieldPath));
  return claims;
}

function assembleProvenance(args: {
  context: UnifiedDecisionContext;
  plan: ReasoningPlan;
  result: AskDecisionResult;
  builtAt: string;
  status: GroundingStatus;
}): GroundingProvenance {
  const evidence = collectEvidence(args.context, args.plan);
  const claims = collectClaims(args.result, evidence);
  return {
    version: GROUNDING_PROVENANCE_VERSION,
    builtAt: args.builtAt,
    evidence,
    claims,
    status: args.status,
  };
}

export function buildUnavailableGrounding(
  builtAt: string
): GroundingProvenance {
  return {
    version: GROUNDING_PROVENANCE_VERSION,
    builtAt,
    evidence: [],
    claims: [],
    status: 'unavailable',
  };
}

export function buildDegradedGrounding(
  builtAt: string,
  partial?: {
    evidence?: Evidence[];
    claims?: ClaimContainer[];
  }
): GroundingProvenance {
  return {
    version: GROUNDING_PROVENANCE_VERSION,
    builtAt,
    evidence: partial?.evidence ?? [],
    claims: partial?.claims ?? [],
    status: 'degraded',
  };
}

/**
 * Build validated grounding provenance with degradation on failure.
 * Never throws — callers may always attach meta.grounding safely.
 */
export function buildGroundingProvenance(
  input: BuildGroundingInput
): GroundingProvenance {
  const builtAt =
    input.builtAt ??
    input.context.builtAt ??
    input.result.generatedAt ??
    new Date().toISOString();

  const contextResult = validateUnifiedDecisionContext(input.context);
  const planResult = validateReasoningPlan(input.plan);

  if (!contextResult.ok || !planResult.ok) {
    return buildUnavailableGrounding(builtAt);
  }

  try {
    const provenance = assembleProvenance({
      context: contextResult.value,
      plan: planResult.value,
      result: input.result,
      builtAt,
      status: 'used',
    });
    const validated = validateGroundingProvenance(provenance);
    if (validated.ok) return validated.value;
    return buildDegradedGrounding(builtAt, {
      evidence: provenance.evidence,
      claims: [],
    });
  } catch {
    return buildUnavailableGrounding(builtAt);
  }
}

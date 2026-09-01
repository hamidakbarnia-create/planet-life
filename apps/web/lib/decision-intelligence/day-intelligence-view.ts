/**
 * Product view-model for a single-day Decision Intelligence slice.
 * Uses the Phase 3F1 renderer. No ranking. No commands.
 */

import { explainFromAssessment, asExplanation, postureOf } from './explain';
import {
  DAY_INTELLIGENCE_CHROME,
  conditionsKindFromPosture,
  formatTimingStrength,
  namedConflictCopy,
  type ConditionsKind,
} from './product-copy';
import { renderSemanticExplanation, templateFor } from './semantic-render';
import type {
  SemanticExplanationInput,
  SemanticPreviewLocale,
  SemanticRenderContext,
} from './types';

const FORWARD = new Set(['high_leverage', 'action', 'build']);
const RESTRICTIVE = new Set(['defensive', 'recovery', 'review']);

export type DayIntelligenceView = {
  locale: SemanticPreviewLocale;
  textDirection: 'ltr' | 'rtl';
  title: string;
  titleKind: 'intelligence' | 'conditions';
  timingStrengthLabel: string;
  timingStrengthValue: string | null;
  conditionsKind: ConditionsKind | null;
  conditionsLabel: string | null;
  bridge: string | null;
  headline: string;
  interpretation: string | null;
  supports: string[];
  cautions: string[];
  safety: string[];
  whyItems: string[];
  insufficient: boolean;
  mixed: boolean;
};

function normalizeMessage(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

function substantiallySame(left: string, right: string): boolean {
  const a = normalizeMessage(left);
  const b = normalizeMessage(right);
  return Boolean(a) && a === b;
}

export function legacySemanticDisagree(
  stance: string | null | undefined,
  posture: string | null | undefined
): boolean {
  if (!stance || !posture) return false;
  if (stance === 'proceed' && RESTRICTIVE.has(posture)) return true;
  if (stance === 'proceed' && posture === 'insufficient') return true;
  if (stance === 'wait' && FORWARD.has(posture)) return true;
  if (stance === 'insufficient_data' && posture !== 'insufficient') return true;
  return false;
}

export function buildDayIntelligenceView(input: {
  explanation: SemanticExplanationInput | null | undefined;
  locale: SemanticPreviewLocale;
  score?: number | null;
  stance?: string | null;
  posture?: string | null;
  displayContext?: SemanticRenderContext;
  conflictedDimensionIds?: readonly string[] | null;
}): DayIntelligenceView | null {
  const rendered = renderSemanticExplanation(
    input.explanation ?? null,
    input.locale,
    input.displayContext
  );
  if (rendered.status !== 'ok' || !rendered.headline) return null;

  const chrome = DAY_INTELLIGENCE_CHROME[input.locale];
  const posture =
    input.posture ??
    (typeof input.explanation?.localization_args?.posture === 'string'
      ? String(input.explanation.localization_args.posture)
      : null);
  const insufficient =
    posture === 'insufficient' ||
    input.explanation?.headline_code === 'semantic.insufficient' ||
    input.explanation?.posture_code === 'semantic.posture_insufficient';
  const mixed =
    posture === 'mixed' ||
    input.explanation?.headline_code === 'semantic.mixed_conflict';
  const disagree = legacySemanticDisagree(input.stance, posture);
  const conditionsKind =
    conditionsKindFromPosture(posture) ??
    (insufficient ? 'insufficient' : mixed ? 'mixed' : null);
  const selectiveInterpretationRepeatsHeadline =
    input.explanation?.headline_code === 'semantic.strong_selective' &&
    input.explanation?.posture_code === 'semantic.posture_selective';
  const interpretation =
    rendered.posture &&
    !mixed &&
    !insufficient &&
    !selectiveInterpretationRepeatsHeadline &&
    !substantiallySame(rendered.headline, rendered.posture)
      ? rendered.posture
      : null;
  const supports = insufficient ? [] : rendered.supports.slice(0, 2);
  const namedConflict = namedConflictCopy(
    input.locale,
    input.conflictedDimensionIds ?? []
  );
  const genericConflict =
    templateFor(input.locale, 'semantic.same_dimension_conflict') ??
    chrome.conflictGeneric;
  const cautions = insufficient
    ? []
    : rendered.cautions.slice(0, 2).map((item) =>
        namedConflict && item === genericConflict ? namedConflict : item
      );
  const whyItems = [...supports, ...cautions];

  return {
    locale: input.locale,
    textDirection: rendered.text_direction,
    title: disagree ? chrome.conditions : chrome.beta,
    titleKind: disagree ? 'conditions' : 'intelligence',
    timingStrengthLabel: chrome.timingStrength,
    timingStrengthValue:
      input.score != null && Number.isFinite(input.score)
        ? formatTimingStrength(input.score)
        : null,
    conditionsKind,
    conditionsLabel: conditionsKind
      ? chrome.conditionsKinds[conditionsKind]
      : null,
    bridge: mixed && !insufficient ? chrome.mixedBridge : null,
    headline: rendered.headline,
    interpretation,
    supports,
    cautions,
    safety: rendered.safety,
    whyItems,
    insufficient,
    mixed,
  };
}

export function explanationFromDayIntelligence(
  intelligence: {
    finalScore?: number;
    explanation?: Record<string, unknown> | null;
    dimensionClassification?: Record<string, unknown> | null;
    dimensions?: Record<string, unknown> | null;
    policy?: Record<string, unknown> | null;
  } | null
): SemanticExplanationInput | null {
  if (!intelligence) return null;
  return (
    asExplanation(intelligence.explanation) ??
    explainFromAssessment({
      score: intelligence.finalScore,
      dimension_classification: intelligence.dimensionClassification,
      dimensions: intelligence.dimensions,
    }, intelligence.policy)
  );
}

export function explanationFromEvaluatePackage(pkg: {
  semantic_shadow?: {
    explanation?: Record<string, unknown>;
    policy?: Record<string, unknown>;
    assessments?: readonly Record<string, unknown>[];
  };
  timing?: { score?: number | null };
}): SemanticExplanationInput | null {
  const shadow = pkg.semantic_shadow;
  if (!shadow) return null;
  return (
    asExplanation(shadow.explanation) ??
    explainFromAssessment(shadow.assessments?.[0] ?? null, shadow.policy)
  );
}

export function evaluatePosture(pkg: {
  semantic_shadow?: {
    assessments?: readonly Record<string, unknown>[];
  };
}): string | null {
  const assessment = pkg.semantic_shadow?.assessments?.[0];
  return assessment ? postureOf(assessment) : null;
}

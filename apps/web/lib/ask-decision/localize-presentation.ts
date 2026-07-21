/**
 * Final presentation sanitizer for Ask Decision Result.
 *
 * Category A — safe structural localization (always for fa/ar/ru):
 *   section titles, resolved ids, known English frame phrases in assumptions.
 *
 * Category B — language correction fallback (field-selective only):
 *   recommendation / executiveSummary / analysis bodies / scenarios /
 *   action-plan / score rationales / confidence explanation —
 *   rebuilt from local templates ONLY when that field is English-dominant,
 *   wrong sibling script, or a known deterministic English scaffold.
 *
 * Valid localized, personalized provider prose is preserved.
 */

import type { AppLang } from '@/lib/app-settings';
import {
  checkResponseLanguage,
  isEnglishDominantProse,
} from '@/lib/locale-language-guard';
import {
  getDecisionUi,
  resolveAnalysisSectionId,
} from '@/lib/decision-ui-i18n';
import { askCopy } from './ask-local-copy';
import { localizeFramePhrase } from './frame-display';
import {
  buildExecutiveSummary,
  buildLocalActionPlan,
  buildLocalAnalysis,
  buildLocalConfidence,
  buildLocalScores,
  buildLocalScenarios,
} from './local-build';
import type { AnalysisSection, AskDecisionResult } from './types';
import { applyWritingQualityLayer } from './writing-quality';

type AnalysisId = AnalysisSection['id'];

function isNonEn(locale: AppLang): locale is 'fa' | 'ar' | 'ru' {
  return locale === 'fa' || locale === 'ar' || locale === 'ru';
}

/** Deterministic English scaffolds from framing / local-build templates. */
const ENGLISH_SCAFFOLD_RE =
  /^(Objective|Concern|Reversibility|Primary concern|Unknowns):\s*|Unknown — reversibility not stated|Primary concern not fully stated|Time horizon not stated|Explicit options not stated|Identify the highest-leverage next move|Opportunity lies in clarifying one reversible|Acting now trades speed for|Decision style signals \(/i;

/**
 * True when a single prose field must be language-corrected.
 * Does NOT treat incidental Latin (brand, user question fragments) as failure
 * when the field is otherwise in the expected script.
 */
export function fieldNeedsLanguageCorrection(
  text: string,
  locale: AppLang
): boolean {
  if (!text.trim() || !isNonEn(locale)) return false;
  if (ENGLISH_SCAFFOLD_RE.test(text.trim())) return true;
  if (isEnglishDominantProse(text)) return true;
  const check = checkResponseLanguage(text, locale);
  return !check.ok;
}

function asAnalysisId(id: string): AnalysisId {
  return id as AnalysisId;
}

function localizedRecommendationForStatus(
  locale: AppLang,
  status: AskDecisionResult['recommendationStatus']
): string {
  return askCopy(
    locale,
    status === 'wait' || status === 'avoid-for-now'
      ? 'parse.holdIrreversible'
      : status === 'gather-more-information'
        ? 'parse.gatherInput'
        : 'parse.advancePilot'
  );
}

function repairAnalysisBodies(
  result: AskDecisionResult,
  locale: AppLang,
  uiTitles: Record<string, string>
): AnalysisSection[] {
  const local = buildLocalAnalysis(
    result.decisionFrame,
    result.intent,
    result.recommendation,
    result.meta?.usedProfile ?? false,
    [],
    locale
  );
  const localById = new Map(local.map((c) => [c.id, c]));

  return result.analysis.map((card) => {
    const id = asAnalysisId(resolveAnalysisSectionId(card.id, card.title));
    const title = uiTitles[id] ?? uiTitles.situation ?? card.title;
    const needsBody = fieldNeedsLanguageCorrection(card.body, locale);
    if (!needsBody) {
      return { ...card, id, title, body: card.body };
    }
    const localCard = localById.get(id);
    return {
      ...card,
      id,
      title,
      body: localCard?.body ?? card.body,
    };
  });
}

/**
 * When provider/fallback left English titles or English/wrong-script prose,
 * apply structural localization always; rebuild only broken prose fields.
 */
export function localizeAskDecisionPresentation(
  result: AskDecisionResult,
  locale: AppLang
): AskDecisionResult {
  const withResolvedIds: AskDecisionResult = {
    ...result,
    analysis: result.analysis.map((card) => ({
      ...card,
      id: asAnalysisId(resolveAnalysisSectionId(card.id, card.title)),
    })),
  };

  if (!isNonEn(locale)) {
    return applyWritingQualityLayer(withResolvedIds, locale);
  }

  const uiTitles = getDecisionUi(locale).sectionTitles;
  const usedProfile = withResolvedIds.meta?.usedProfile ?? false;
  const usedTiming =
    withResolvedIds.meta?.usedTiming ?? withResolvedIds.timing.available;

  // --- Category A: always ---
  let next: AskDecisionResult = {
    ...withResolvedIds,
    analysis: withResolvedIds.analysis.map((card) => ({
      ...card,
      title: uiTitles[card.id] ?? uiTitles.situation ?? card.title,
    })),
    assumptions: withResolvedIds.assumptions.map((a) =>
      localizeFramePhrase(locale, a)
    ),
  };

  const recommendationBad = fieldNeedsLanguageCorrection(
    next.recommendation,
    locale
  );
  const summaryBad = fieldNeedsLanguageCorrection(
    next.executiveSummary,
    locale
  );
  const anyAnalysisBodyBad = next.analysis.some((c) =>
    fieldNeedsLanguageCorrection(c.body, locale)
  );
  const scenariosBad =
    fieldNeedsLanguageCorrection(next.scenarios.bestCase.outcome, locale) ||
    fieldNeedsLanguageCorrection(next.scenarios.mostLikely.outcome, locale) ||
    fieldNeedsLanguageCorrection(next.scenarios.downsideCase.outcome, locale);
  const actionBad = [
    ...next.actionPlan.now,
    ...next.actionPlan.next7Days,
    ...next.actionPlan.next30Days,
  ].some(
    (item) =>
      fieldNeedsLanguageCorrection(item.action, locale) ||
      fieldNeedsLanguageCorrection(item.purpose, locale)
  );
  const confidenceBad = fieldNeedsLanguageCorrection(
    next.confidence.explanation,
    locale
  );
  const scoreRationaleBad = (
    ['opportunity', 'risk', 'timing', 'readiness', 'confidence'] as const
  ).some((k) => fieldNeedsLanguageCorrection(next.scores[k].rationale, locale));

  // --- Category B: field-selective ---
  if (anyAnalysisBodyBad) {
    next = {
      ...next,
      analysis: repairAnalysisBodies(next, locale, uiTitles),
    };
  }

  if (recommendationBad) {
    next = {
      ...next,
      recommendation: localizedRecommendationForStatus(
        locale,
        next.recommendationStatus
      ),
    };
  }

  if (actionBad) {
    next = {
      ...next,
      actionPlan: buildLocalActionPlan(next.decisionFrame, locale),
    };
  }

  if (scenariosBad) {
    next = {
      ...next,
      scenarios: buildLocalScenarios(next.decisionFrame, locale),
    };
  }

  if (scoreRationaleBad) {
    const timingScore =
      next.timing.bestWindow?.score ?? next.timing.today?.score ?? null;
    const localScores = buildLocalScores(
      next.decisionFrame,
      next.intent,
      timingScore,
      usedProfile,
      locale
    );
    next = {
      ...next,
      scores: {
        opportunity: {
          value: next.scores.opportunity.value,
          rationale: localScores.opportunity.rationale,
        },
        risk: {
          value: next.scores.risk.value,
          rationale: localScores.risk.rationale,
        },
        timing: {
          value: next.scores.timing.value,
          rationale: localScores.timing.rationale,
        },
        readiness: {
          value: next.scores.readiness.value,
          rationale: localScores.readiness.rationale,
        },
        confidence: {
          value: next.scores.confidence.value,
          rationale: localScores.confidence.rationale,
        },
      },
    };
  }

  if (confidenceBad) {
    const rebuilt = buildLocalConfidence(
      next.scores,
      next.decisionFrame,
      usedProfile,
      usedTiming,
      next.intent.highStakesFlag,
      locale
    );
    next = {
      ...next,
      confidence: {
        ...next.confidence,
        explanation: rebuilt.explanation,
        missingInputs: next.confidence.missingInputs.some((m) =>
          fieldNeedsLanguageCorrection(m, locale)
        )
          ? rebuilt.missingInputs
          : next.confidence.missingInputs,
        limitingFactors: next.confidence.limitingFactors.some((m) =>
          fieldNeedsLanguageCorrection(m, locale)
        )
          ? rebuilt.limitingFactors
          : next.confidence.limitingFactors,
      },
    };
  }

  if (summaryBad || recommendationBad) {
    const nextAction =
      next.actionPlan.now[0]?.action ?? askCopy(locale, 'parse.nextStep');
    next = {
      ...next,
      executiveSummary: buildExecutiveSummary(
        next.decisionFrame,
        next.recommendationStatus,
        next.recommendation,
        nextAction,
        locale
      ),
    };
  }

  const touched =
    recommendationBad ||
    summaryBad ||
    anyAnalysisBodyBad ||
    scenariosBad ||
    actionBad ||
    confidenceBad ||
    scoreRationaleBad;

  if (touched) {
    next = {
      ...next,
      meta: {
        ...next.meta!,
        sources: [
          ...new Set([
            ...(next.meta?.sources ?? []),
            'locale-presentation',
          ]),
        ],
      },
    };
  }

  // Writing quality: restructure prose only — never change scores or status enums.
  return applyWritingQualityLayer(next, locale);
}

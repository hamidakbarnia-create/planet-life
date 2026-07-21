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
 * Semantic preservation:
 *   English fields that fail the language guard are NOT discarded wholesale.
 *   Scenario-specific actions are preserved (wrapped), not replaced by generic
 *   action.now.* unless empty/unusable. Score rationales are repaired per-field
 *   while retaining semantic tokens. Known mechanical scaffolds are polished.
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
import type {
  ActionItem,
  AnalysisSection,
  AskActionPlan,
  AskDecisionResult,
  AskDecisionScores,
} from './types';
import { applyWritingQualityLayer } from './writing-quality';
import { polishMechanicalScaffolds } from './scaffold-polish';
import {
  appendMissingTokens,
  extractSemanticTokens,
} from './semantic-tokens';

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

function withPreservedFacts(
  localized: string,
  source: string,
  locale: AppLang
): string {
  const polished = polishMechanicalScaffolds(localized, locale);
  const tokens = extractSemanticTokens(source);
  const join = askCopy(locale, 'semantic.factsJoin');
  return appendMissingTokens(polished, tokens, join, 'prepend');
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
      return {
        ...card,
        id,
        title,
        body: polishMechanicalScaffolds(card.body, locale),
      };
    }
    const localCard = localById.get(id);
    const rebuilt = localCard?.body ?? card.body;
    return {
      ...card,
      id,
      title,
      body: withPreservedFacts(rebuilt, card.body, locale),
    };
  });
}

function isUnusableAction(text: string): boolean {
  return !text.trim() || text.trim().length < 3;
}

/**
 * Per-item action repair: never wipe a whole plan for one English action.
 * Specific actions are preserved (detail kept); generics only for empty slots.
 */
function repairActionPlan(
  plan: AskActionPlan,
  frame: AskDecisionResult['decisionFrame'],
  locale: AppLang
): AskActionPlan {
  const safe = buildLocalActionPlan(frame, locale);

  const repairBucket = (
    items: ActionItem[],
    safeItems: ActionItem[]
  ): ActionItem[] => {
    if (items.length === 0) return items;

    return items.map((item, i) => {
      if (isUnusableAction(item.action)) {
        return safeItems[i] ?? item;
      }

      const actionBad = fieldNeedsLanguageCorrection(item.action, locale);
      const purposeBad = fieldNeedsLanguageCorrection(item.purpose, locale);
      const signalBad = fieldNeedsLanguageCorrection(
        item.completionSignal,
        locale
      );

      if (!actionBad && !purposeBad && !signalBad) {
        return item;
      }

      // Keep scenario-specific action text; do not swap for generic action.now.*
      return {
        ...item,
        action: actionBad
          ? askCopy(locale, 'action.preserveSpecific', {
              detail: item.action.trim(),
            })
          : item.action,
        purpose: purposeBad
          ? askCopy(locale, 'action.preserveSpecific.purpose')
          : item.purpose,
        completionSignal: signalBad
          ? askCopy(locale, 'action.preserveSpecific.signal')
          : item.completionSignal,
      };
    });
  };

  // If the entire now-plan is empty, use safe fallbacks once.
  const now =
    plan.now.filter((a) => a.action.trim()).length === 0
      ? safe.now
      : repairBucket(plan.now, safe.now);

  return {
    now,
    next7Days: repairBucket(plan.next7Days, safe.next7Days),
    next30Days: repairBucket(plan.next30Days, safe.next30Days),
  };
}

function repairScoreRationales(
  scores: AskDecisionScores,
  frame: AskDecisionResult['decisionFrame'],
  intent: AskDecisionResult['intent'],
  timingScore: number | null,
  usedProfile: boolean,
  locale: AppLang
): AskDecisionScores {
  const localScores = buildLocalScores(
    frame,
    intent,
    timingScore,
    usedProfile,
    locale
  );

  const repairOne = (
    key: keyof AskDecisionScores
  ): AskDecisionScores[typeof key] => {
    const current = scores[key];
    if (!fieldNeedsLanguageCorrection(current.rationale, locale)) {
      return {
        value: current.value,
        rationale: polishMechanicalScaffolds(current.rationale, locale),
      };
    }
    const local = localScores[key].rationale;
    const facts = extractSemanticTokens(current.rationale);
    let rationale = polishMechanicalScaffolds(local, locale);
    if (facts.length > 0) {
      rationale = askCopy(locale, 'rationale.preserve', {
        local: rationale,
        facts: facts.join(', '),
      });
    } else {
      // Still embed original rationale snippet so markers/direction survive
      rationale = askCopy(locale, 'rationale.preserve', {
        local: rationale,
        facts: current.rationale.trim().slice(0, 160),
      });
    }
    return { value: current.value, rationale };
  };

  return {
    opportunity: repairOne('opportunity'),
    risk: repairOne('risk'),
    timing: repairOne('timing'),
    readiness: repairOne('readiness'),
    confidence: repairOne('confidence'),
  };
}

function polishAssumptions(
  assumptions: string[],
  locale: AppLang
): string[] {
  return assumptions.map((a) =>
    polishMechanicalScaffolds(localizeFramePhrase(locale, a), locale)
  );
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
      body: polishMechanicalScaffolds(card.body, locale),
    })),
    assumptions: polishAssumptions(withResolvedIds.assumptions, locale),
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

  // Collect scenario tokens from the original result for summary/recommendation
  const sourceTokens = extractSemanticTokens(
    [
      result.executiveSummary,
      result.recommendation,
      result.decisionFrame.decisionStatement,
      result.decisionFrame.mainConcern,
      ...result.decisionFrame.unknowns,
      ...result.actionPlan.now.map((a) => a.action),
      ...result.analysis.map((c) => c.body),
    ].join('\n')
  );

  // --- Category B: field-selective ---
  if (anyAnalysisBodyBad) {
    next = {
      ...next,
      analysis: repairAnalysisBodies(next, locale, uiTitles),
    };
  } else {
    // Still polish scaffolds on kept bodies
    next = {
      ...next,
      analysis: next.analysis.map((card) => ({
        ...card,
        body: polishMechanicalScaffolds(card.body, locale),
      })),
    };
  }

  if (recommendationBad) {
    const statusRec = localizedRecommendationForStatus(
      locale,
      next.recommendationStatus
    );
    next = {
      ...next,
      recommendation: withPreservedFacts(
        statusRec,
        result.recommendation,
        locale
      ),
    };
  }

  if (actionBad) {
    next = {
      ...next,
      actionPlan: repairActionPlan(
        next.actionPlan,
        next.decisionFrame,
        locale
      ),
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
    next = {
      ...next,
      scores: repairScoreRationales(
        next.scores,
        next.decisionFrame,
        next.intent,
        timingScore,
        usedProfile,
        locale
      ),
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
        explanation: withPreservedFacts(
          rebuilt.explanation,
          result.confidence.explanation,
          locale
        ),
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
    const rebuilt = buildExecutiveSummary(
      next.decisionFrame,
      next.recommendationStatus,
      next.recommendation,
      nextAction,
      locale
    );
    next = {
      ...next,
      executiveSummary: withPreservedFacts(
        rebuilt,
        result.executiveSummary,
        locale
      ),
    };
  } else {
    next = {
      ...next,
      executiveSummary: withPreservedFacts(
        next.executiveSummary,
        result.executiveSummary,
        locale
      ),
    };
  }

  // Final pass: ensure global source tokens survive somewhere in user-facing prose
  const proseBlob = [
    next.executiveSummary,
    next.recommendation,
    ...next.actionPlan.now.map((a) => a.action),
    ...next.analysis.map((c) => c.body),
  ].join('\n');
  const stillMissing = sourceTokens.filter(
    (t) => !proseBlob.toLowerCase().includes(t.toLowerCase())
  );
  if (stillMissing.length > 0) {
    next = {
      ...next,
      executiveSummary: appendMissingTokens(
        next.executiveSummary,
        stillMissing,
        askCopy(locale, 'semantic.factsJoin'),
        'prepend'
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

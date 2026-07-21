/**
 * Writing Quality Layer — presentation only.
 *
 * MUST NOT change structured decision meaning:
 * recommendationStatus, confidence, scores, timing, intent,
 * risks/opportunities presence or bodies, uncertainty level,
 * or invent facts / astrological claims / deterministic guarantees.
 *
 * MAY: merge repetitive sentences, improve readability, remove template
 * jargon, convert fallback wording into practical guidance, improve
 * transitions/flow, reorganize paragraphs, polish action bullets.
 *
 * Actions rule: never invent bullets just to reach three. Keep existing
 * now-actions (wording polish only), or — when the plan is empty — use
 * the predefined safe fallbacks from ask-local-copy (`action.now.*`).
 *
 * Output shape (wording mapped onto existing fields):
 * - executiveSummary → decision summary (2–3 sentences)
 * - analysis[why] → why / main reasons
 * - actionPlan.now (≤3) → concrete pre-action steps
 * - analysis[what-could-change] → what info would sharpen the answer
 */

import type { AppLang } from '@/lib/app-settings';
import { askCopy } from './ask-local-copy';
import { localizeFramePhrase } from './frame-display';
import type {
  ActionItem,
  AnalysisSection,
  AskDecisionResult,
  RecommendationStatus,
} from './types';

const MECHANICAL_RE =
  /Decision:\s*|Recommendation:\s*|Primary concern not fully|Main concern not fully|Time horizon not stated|Explicit options not stated|Unknown — reversibility|شناسایی پراهرم‌ترین|نگرانی اصلی به‌طور کامل بیان نشده|فعل تصمیم مبهم|استفاده از چارچوب تصمیم عمومی|Provider path unavailable|مسیر ارائه‌دهنده|Structured fallback|بازگشت ساخت‌یافته|القلق الرئيسي غير مذكور|Основная озабоченность указана|Используйте общий каркас|Decision style signals \(/i;

const ASTROLOGY_RE =
  /\b(mercury retrograde|retrograde|horoscope|zodiac|birth chart|transit|行星|طالع|برج حمل|منزل قمر)\b/i;

export type WritingVariant = 0 | 1 | 2;

function isMechanical(text: string | null | undefined): boolean {
  if (!text?.trim()) return true;
  return MECHANICAL_RE.test(text);
}

function statusKey(status: RecommendationStatus): string {
  switch (status) {
    case 'proceed':
      return 'wq.status.proceed';
    case 'proceed-with-caution':
      return 'wq.status.caution';
    case 'wait':
      return 'wq.status.wait';
    case 'gather-more-information':
      return 'wq.status.gather';
    case 'avoid-for-now':
      return 'wq.status.avoid';
    default:
      return 'wq.status.neutral';
  }
}

/** Stable 0–2 pick from status + intent + decision — varies openings without randomness. */
export function writingVariant(result: AskDecisionResult): WritingVariant {
  const seed = [
    result.recommendationStatus,
    result.intent.primaryIntent,
    result.decisionFrame.decisionStatement,
    result.decisionFrame.mainConcern,
  ].join('|');
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 3 as WritingVariant;
}

function concernSnippet(result: AskDecisionResult, locale: AppLang): string {
  return localizeFramePhrase(locale, result.decisionFrame.mainConcern).slice(
    0,
    80
  );
}

function decisionSnippet(result: AskDecisionResult): string {
  return result.decisionFrame.decisionStatement.slice(0, 100);
}

function buildSummary(result: AskDecisionResult, locale: AppLang): string {
  const v = writingVariant(result);
  const decision = decisionSnippet(result);
  const concern = concernSnippet(result, locale);
  const lean = askCopy(locale, statusKey(result.recommendationStatus));
  return askCopy(locale, `wq.summary.v${v}`, {
    lean,
    decision,
    concern,
  });
}

function buildWhy(result: AskDecisionResult, locale: AppLang): string {
  const v = writingVariant(result);
  const concern = concernSnippet(result, locale);
  const unknowns = result.decisionFrame.unknowns
    .slice(0, 2)
    .map((u) => localizeFramePhrase(locale, u))
    .filter(Boolean);
  const unknownText =
    unknowns.length > 0
      ? unknowns.join(askCopy(locale, 'analysis.personalFit.styles.listSep'))
      : askCopy(locale, 'wq.why.noUnknowns');
  return askCopy(locale, `wq.why.v${v}`, {
    concern,
    unknowns: unknownText,
    lean: askCopy(locale, statusKey(result.recommendationStatus)),
  });
}

/** Predefined safe now-actions (same contract as local-build fallbacks). */
export function buildSafeNowFallbacks(
  result: AskDecisionResult,
  locale: AppLang
): ActionItem[] {
  const decision = decisionSnippet(result);
  return [
    {
      action: askCopy(locale, 'action.now.writeDecision', { decision }),
      purpose: askCopy(locale, 'action.now.writeDecision.purpose'),
      priority: 'high',
      completionSignal: askCopy(locale, 'action.now.writeDecision.signal'),
    },
    {
      action: askCopy(locale, 'action.now.listFact'),
      purpose: askCopy(locale, 'action.now.listFact.purpose'),
      priority: 'critical',
      completionSignal: askCopy(locale, 'action.now.listFact.signal'),
    },
    {
      action: askCopy(locale, 'action.now.identifyIrreversible'),
      purpose: askCopy(locale, 'action.now.identifyIrreversible.purpose'),
      priority: 'high',
      completionSignal: askCopy(locale, 'action.now.identifyIrreversible.signal'),
    },
  ];
}

/**
 * Polish existing now-actions only. Do not invent bullets to reach three.
 * If the plan is empty, use the three predefined safe fallbacks.
 */
function buildActions(
  result: AskDecisionResult,
  locale: AppLang
): ActionItem[] {
  const existing = result.actionPlan.now.filter((a) => a.action.trim());

  if (existing.length === 0) {
    return buildSafeNowFallbacks(result, locale);
  }

  const safe = buildSafeNowFallbacks(result, locale);

  return existing.slice(0, 3).map((a, i) => {
    if (!isMechanical(a.action)) {
      return {
        ...a,
        action: a.action.trim(),
        purpose: isMechanical(a.purpose) ? safe[i]?.purpose ?? a.purpose : a.purpose,
        completionSignal: isMechanical(a.completionSignal)
          ? safe[i]?.completionSignal ?? a.completionSignal
          : a.completionSignal,
      };
    }
    // Mechanical → replace with matching predefined safe fallback (not invented prose)
    const fallback = safe[i] ?? safe[0]!;
    return {
      ...fallback,
      priority: a.priority,
    };
  });
}

function buildMissingInfo(result: AskDecisionResult, locale: AppLang): string {
  const unknowns = result.decisionFrame.unknowns
    .slice(0, 3)
    .map((u) => localizeFramePhrase(locale, u))
    .filter(Boolean);
  if (unknowns.length === 0) {
    return askCopy(locale, 'wq.missing.default');
  }
  const v = writingVariant(result);
  return askCopy(locale, `wq.missing.v${v}`, {
    items: unknowns.join(
      askCopy(locale, 'analysis.personalFit.styles.listSep')
    ),
  });
}

function polishRecommendation(
  result: AskDecisionResult,
  locale: AppLang
): string {
  if (!isMechanical(result.recommendation)) {
    return result.recommendation.trim().slice(0, 320);
  }
  return askCopy(locale, statusKey(result.recommendationStatus));
}

const PRESERVED_ANALYSIS_IDS = new Set<AnalysisSection['id']>([
  'situation',
  'factors',
  'opportunities',
  'risks',
  'tradeoffs',
  'personal-fit',
]);

function patchAnalysis(
  analysis: AnalysisSection[],
  whyBody: string,
  missingBody: string,
  locale: AppLang
): AnalysisSection[] {
  const whyTitle = askCopy(locale, 'wq.why.title');
  const missingTitle = askCopy(locale, 'wq.missing.title');
  let hasWhy = false;
  let hasMissing = false;

  const next = analysis.map((card) => {
    if (PRESERVED_ANALYSIS_IDS.has(card.id)) {
      return card;
    }

    if (card.id === 'why') {
      hasWhy = true;
      return {
        ...card,
        title: whyTitle,
        body: isMechanical(card.body) ? whyBody : card.body,
      };
    }
    if (card.id === 'what-could-change') {
      hasMissing = true;
      return {
        ...card,
        title: missingTitle,
        body: isMechanical(card.body) ? missingBody : card.body,
      };
    }
    return card;
  });

  if (!hasWhy) {
    next.push({ id: 'why', title: whyTitle, body: whyBody });
  }
  if (!hasMissing) {
    next.push({
      id: 'what-could-change',
      title: missingTitle,
      body: missingBody,
    });
  }
  return next;
}

/**
 * Structured meaning that must be identical before and after WQ.
 * Prose fields are intentionally excluded.
 */
export function extractDecisionInvariants(result: AskDecisionResult) {
  const risks = result.analysis.find((c) => c.id === 'risks');
  const opportunities = result.analysis.find((c) => c.id === 'opportunities');
  const coreIds = result.analysis
    .map((c) => c.id)
    .filter((id) => PRESERVED_ANALYSIS_IDS.has(id));

  return {
    schemaVersion: result.schemaVersion,
    recommendationStatus: result.recommendationStatus,
    intent: {
      primaryIntent: result.intent.primaryIntent,
      secondaryIntent: result.intent.secondaryIntent,
      confidence: result.intent.confidence,
      decisionPresent: result.intent.decisionPresent,
      timingRelevant: result.intent.timingRelevant,
      peopleRelevant: result.intent.peopleRelevant,
      financialImpactLikely: result.intent.financialImpactLikely,
      highStakesFlag: result.intent.highStakesFlag,
    },
    decisionFrame: {
      decisionStatement: result.decisionFrame.decisionStatement,
      decisionType: result.decisionFrame.decisionType,
      objective: result.decisionFrame.objective,
      mainConcern: result.decisionFrame.mainConcern,
      options: [...result.decisionFrame.options],
      urgency: result.decisionFrame.urgency,
      timeHorizon: result.decisionFrame.timeHorizon,
      reversibility: result.decisionFrame.reversibility,
      affectedAreas: [...result.decisionFrame.affectedAreas],
      unknowns: [...result.decisionFrame.unknowns],
      assumptions: [...result.decisionFrame.assumptions],
      requiresClarification: result.decisionFrame.requiresClarification,
    },
    scores: {
      opportunity: result.scores.opportunity.value,
      risk: result.scores.risk.value,
      timing: result.scores.timing.value,
      readiness: result.scores.readiness.value,
      confidence: result.scores.confidence.value,
      opportunityRationale: result.scores.opportunity.rationale,
      riskRationale: result.scores.risk.rationale,
      timingRationale: result.scores.timing.rationale,
      readinessRationale: result.scores.readiness.rationale,
      confidenceRationale: result.scores.confidence.rationale,
    },
    confidence: {
      level: result.confidence.level,
      score: result.confidence.score,
      missingInputs: [...result.confidence.missingInputs],
      limitingFactors: [...result.confidence.limitingFactors],
    },
    timing: {
      applicable: result.timing.applicable,
      available: result.timing.available,
      timingConfidence: result.timing.timingConfidence,
      todayScore: result.timing.today?.score ?? null,
      next7Score: result.timing.next7Days?.score ?? null,
      next30Score: result.timing.next30Days?.score ?? null,
      bestScore: result.timing.bestWindow?.score ?? null,
      cautionScore: result.timing.cautionWindow?.score ?? null,
      todayRange: result.timing.today?.dateRange ?? null,
      next7Range: result.timing.next7Days?.dateRange ?? null,
      next30Range: result.timing.next30Days?.dateRange ?? null,
      bestRange: result.timing.bestWindow?.dateRange ?? null,
      cautionRange: result.timing.cautionWindow?.dateRange ?? null,
    },
    scenarios: {
      bestLikelihood: result.scenarios.bestCase.likelihoodBand,
      mostLikelyLikelihood: result.scenarios.mostLikely.likelihoodBand,
      downsideLikelihood: result.scenarios.downsideCase.likelihoodBand,
      bestConditions: [...result.scenarios.bestCase.keyConditions],
      mostLikelyConditions: [...result.scenarios.mostLikely.keyConditions],
      downsideConditions: [...result.scenarios.downsideCase.keyConditions],
    },
    coreAnalysisIds: coreIds,
    risksBody: risks?.body ?? null,
    opportunitiesBody: opportunities?.body ?? null,
    actionPlanNext7Days: result.actionPlan.next7Days,
    actionPlanNext30Days: result.actionPlan.next30Days,
    alternatives: result.alternatives,
    assumptions: [...result.assumptions],
    limitations: [...result.limitations],
    followUpQuestions: [...result.followUpQuestions],
    safetyNotice: result.safetyNotice,
    metaFlags: result.meta
      ? {
          usedProfile: result.meta.usedProfile,
          usedTiming: result.meta.usedTiming,
          fallback: result.meta.fallback,
          requestId: result.meta.requestId,
          clarificationAnswer: result.meta.clarificationAnswer,
        }
      : null,
  };
}

/** Readable outline used by snapshot / semantic tests (wording only). */
export function writingQualityOutline(result: AskDecisionResult) {
  const why = result.analysis.find((c) => c.id === 'why');
  const missing = result.analysis.find((c) => c.id === 'what-could-change');
  return {
    'خلاصه تصمیم': result.executiveSummary,
    'چرا؟': why?.body ?? '',
    'قبل از اقدام چه کار کنید؟': result.actionPlan.now.map(
      (a, i) => `${i + 1}. ${a.action}`
    ),
    'چه اطلاعاتی پاسخ را دقیق‌تر می‌کند؟': missing?.body ?? '',
  };
}

/** Flatten presentation prose for retention checks. */
export function writingQualityProseBlob(result: AskDecisionResult): string {
  const outline = writingQualityOutline(result);
  return [
    outline['خلاصه تصمیم'],
    outline['چرا؟'],
    ...outline['قبل از اقدام چه کار کنید؟'],
    outline['چه اطلاعاتی پاسخ را دقیق‌تر می‌کند؟'],
    result.recommendation,
  ].join('\n');
}

/**
 * Apply writing-quality presentation. Preserves numeric scores and status enums.
 */
export function applyWritingQualityLayer(
  result: AskDecisionResult,
  locale: AppLang
): AskDecisionResult {
  const summary = buildSummary(result, locale);
  const why = buildWhy(result, locale);
  const missing = buildMissingInfo(result, locale);
  const actions = buildActions(result, locale);
  const recommendation = polishRecommendation(result, locale);

  const executiveSummary =
    isMechanical(result.executiveSummary) ||
    /Decision:|تصمیم:|القرار:|Решение:/i.test(result.executiveSummary)
      ? summary
      : result.executiveSummary.trim().slice(0, 400) || summary;

  const safeSummary = ASTROLOGY_RE.test(executiveSummary)
    ? result.executiveSummary
    : executiveSummary;
  const safeRecommendation = ASTROLOGY_RE.test(recommendation)
    ? result.recommendation
    : recommendation;

  return {
    ...result,
    recommendation: safeRecommendation,
    executiveSummary: safeSummary,
    analysis: patchAnalysis(result.analysis, why, missing, locale),
    actionPlan: {
      now: actions,
      next7Days: result.actionPlan.next7Days,
      next30Days: result.actionPlan.next30Days,
    },
    recommendationStatus: result.recommendationStatus,
    scores: result.scores,
    confidence: result.confidence,
    timing: result.timing,
    intent: result.intent,
    decisionFrame: result.decisionFrame,
    scenarios: result.scenarios,
    alternatives: result.alternatives,
    assumptions: result.assumptions,
    limitations: result.limitations,
    followUpQuestions: result.followUpQuestions,
    safetyNotice: result.safetyNotice,
    meta: result.meta
      ? {
          ...result.meta,
          sources: [
            ...new Set([...(result.meta.sources ?? []), 'writing-quality']),
          ],
        }
      : result.meta,
  };
}

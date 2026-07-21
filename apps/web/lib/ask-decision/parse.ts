/** Parse + repair Conversation API content into AskDecisionResult. */

import { askCopy } from './ask-local-copy';
import type {
  AnalysisSection,
  AskActionPlan,
  AskConfidence,
  AskDecisionResult,
  AskDecisionScores,
  AskScenarios,
  DecisionFrame,
  IntentDetection,
  RecommendationStatus,
  RelatedModule,
  TimingIntelligence,
} from './types';
import {
  ACTION_PRIORITIES,
  ASK_DECISION_SCHEMA_VERSION,
  LIKELIHOOD_BANDS,
  MODULE_IDS,
  RECOMMENDATION_STATUSES,
} from './types';
import { asConfidenceLevel, clampScore, extractJsonObject, MODULE_ROUTES, wordLimit } from './util';
import {
  buildExecutiveSummary,
  buildLocalActionPlan,
  buildLocalAnalysis,
  buildLocalConfidence,
  buildLocalModules,
  buildLocalScores,
  buildLocalScenarios,
  recommendStatus,
  safetyNoticeFor,
} from './local-build';
import { validateAskDecisionResult } from './validate';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function scoreField(raw: unknown, fallback: number, rationale: string) {
  if (isRecord(raw)) {
    return {
      value: clampScore(raw.value, fallback),
      rationale:
        typeof raw.rationale === 'string' && raw.rationale.trim()
          ? raw.rationale.slice(0, 200)
          : rationale,
    };
  }
  return { value: clampScore(raw, fallback), rationale };
}

function parseScores(raw: unknown, local: AskDecisionScores): AskDecisionScores {
  if (!isRecord(raw)) return local;
  return {
    opportunity: scoreField(raw.opportunity, local.opportunity.value, local.opportunity.rationale),
    risk: scoreField(raw.risk, local.risk.value, local.risk.rationale),
    timing: scoreField(raw.timing, local.timing.value, local.timing.rationale),
    readiness: scoreField(raw.readiness, local.readiness.value, local.readiness.rationale),
    confidence: scoreField(raw.confidence, local.confidence.value, local.confidence.rationale),
  };
}

function parseActions(
  raw: unknown,
  local: AskActionPlan,
  locale: string
): AskActionPlan {
  const parseBucket = (key: keyof AskActionPlan) => {
    const list = isRecord(raw) && Array.isArray(raw[key]) ? raw[key] : local[key];
    return (list as unknown[])
      .slice(0, 3)
      .map((item, i) => {
        if (!isRecord(item)) return local[key][i] ?? local[key][0]!;
        const priority = String(item.priority ?? 'medium').toLowerCase();
        return {
          action: String(
            item.action ?? local[key][i]?.action ?? askCopy(locale, 'parse.defineNextStep')
          ).slice(0, 200),
          purpose: String(
            item.purpose ??
              local[key][i]?.purpose ??
              askCopy(locale, 'parse.advanceDecision')
          ).slice(0, 160),
          priority: (ACTION_PRIORITIES as readonly string[]).includes(priority)
            ? (priority as (typeof ACTION_PRIORITIES)[number])
            : 'medium',
          completionSignal: String(
            item.completionSignal ??
              local[key][i]?.completionSignal ??
              askCopy(locale, 'parse.stepCompleted')
          ).slice(0, 120),
        };
      });
  };
  return {
    now: parseBucket('now'),
    next7Days: parseBucket('next7Days'),
    next30Days: parseBucket('next30Days'),
  };
}

function parseAnalysis(raw: unknown, local: AnalysisSection[]): AnalysisSection[] {
  if (!Array.isArray(raw) || raw.length === 0) return local;
  const byId = new Map(local.map((s) => [s.id, s]));
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const id = String(item.id ?? '');
    if (!byId.has(id as AnalysisSection['id'])) continue;
    byId.set(id as AnalysisSection['id'], {
      id: id as AnalysisSection['id'],
      title: String(item.title ?? byId.get(id as AnalysisSection['id'])!.title),
      body: String(item.body ?? '').slice(0, 500) || byId.get(id as AnalysisSection['id'])!.body,
    });
  }
  return local.map((s) => byId.get(s.id) ?? s);
}

function parseScenarios(raw: unknown, local: AskScenarios): AskScenarios {
  const parseOne = (key: keyof AskScenarios) => {
    const src = isRecord(raw) && isRecord(raw[key]) ? raw[key] : null;
    const base = local[key];
    if (!src) return base;
    const band = String(src.likelihoodBand ?? base.likelihoodBand).toLowerCase();
    return {
      outcome: String(src.outcome ?? base.outcome).slice(0, 240),
      likelihoodBand: (LIKELIHOOD_BANDS as readonly string[]).includes(band)
        ? (band as (typeof LIKELIHOOD_BANDS)[number])
        : base.likelihoodBand,
      keyConditions: Array.isArray(src.keyConditions)
        ? src.keyConditions.map(String).slice(0, 4)
        : base.keyConditions,
      earlySignals: Array.isArray(src.earlySignals)
        ? src.earlySignals.map(String).slice(0, 4)
        : base.earlySignals,
      mitigation: String(src.mitigation ?? base.mitigation).slice(0, 200),
    };
  };
  return {
    bestCase: parseOne('bestCase'),
    mostLikely: parseOne('mostLikely'),
    downsideCase: parseOne('downsideCase'),
  };
}

function parseModules(
  raw: unknown,
  local: RelatedModule[],
  locale: string
): RelatedModule[] {
  if (!Array.isArray(raw)) return local;
  const out: RelatedModule[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const modId = String(item.module ?? '').toLowerCase();
    if (!(MODULE_IDS as readonly string[]).includes(modId)) continue;
    out.push({
      module: modId as RelatedModule['module'],
      reason: String(
        item.reason ?? askCopy(locale, 'parse.relevantNext')
      ).slice(0, 160),
      actionLabel: String(item.actionLabel ?? askCopy(locale, 'parse.open')).slice(
        0,
        40
      ),
      route: MODULE_ROUTES[modId] ?? '/',
    });
    if (out.length >= 3) break;
  }
  return out.length ? out : local;
}

function parseConfidence(raw: unknown, local: AskConfidence): AskConfidence {
  if (!isRecord(raw)) return local;
  return {
    level: asConfidenceLevel(raw.level, local.level),
    score: clampScore(raw.score, local.score),
    explanation: String(raw.explanation ?? local.explanation).slice(0, 240),
    missingInputs: Array.isArray(raw.missingInputs)
      ? raw.missingInputs.map(String).slice(0, 8)
      : local.missingInputs,
    limitingFactors: Array.isArray(raw.limitingFactors)
      ? raw.limitingFactors.map(String).slice(0, 6)
      : local.limitingFactors,
  };
}

export type ParseInput = {
  conversationMessage: string | null;
  intent: IntentDetection;
  frame: DecisionFrame;
  timing: TimingIntelligence;
  usedProfile: boolean;
  usedTiming: boolean;
  decisionStyles: string[];
  generatedAt: string;
  requestId: string | null;
  clarificationAnswer: string | null;
  sources: string[];
  locale?: 'en' | 'ru' | 'fa' | 'ar';
};

/**
 * Build a validated AskDecisionResult from model JSON + local repair.
 * Never returns raw JSON to UI callers.
 */
export function parseAskDecisionResponse(input: ParseInput): AskDecisionResult {
  const locale = input.locale ?? 'en';
  const localScores = buildLocalScores(
    input.frame,
    input.intent,
    input.timing.bestWindow?.score ?? input.timing.today?.score ?? null,
    input.usedProfile,
    locale
  );
  let status = recommendStatus(localScores, input.intent);
  let recommendation =
    status === 'wait'
      ? askCopy(locale, 'parse.holdIrreversible')
      : status === 'gather-more-information'
        ? askCopy(locale, 'parse.gatherInput')
        : askCopy(locale, 'parse.advancePilot');

  const localActions = buildLocalActionPlan(input.frame, locale);
  const nextActionFallback = askCopy(locale, 'parse.nextStep');
  const result: AskDecisionResult = {
    schemaVersion: ASK_DECISION_SCHEMA_VERSION,
    intent: input.intent,
    decisionFrame: input.frame,
    executiveSummary: buildExecutiveSummary(
      input.frame,
      status,
      recommendation,
      localActions.now[0]?.action ?? nextActionFallback,
      locale
    ),
    recommendation,
    recommendationStatus: status,
    scores: localScores,
    analysis: buildLocalAnalysis(
      input.frame,
      input.intent,
      recommendation,
      input.usedProfile,
      input.decisionStyles,
      locale
    ),
    timing: input.timing,
    scenarios: buildLocalScenarios(input.frame, locale),
    actionPlan: localActions,
    alternatives: input.frame.options.slice(0, 3).map((option) => ({
      option,
      bestFor: askCopy(locale, 'parse.alt.bestFor'),
      advantages: [askCopy(locale, 'parse.alt.advantage')],
      disadvantages: [askCopy(locale, 'parse.alt.disadvantage')],
      risk: input.frame.mainConcern,
      timingFit: input.frame.timeHorizon,
      recommendationFit: askCopy(locale, 'parse.alt.recommendationFit'),
    })),
    assumptions: [...input.frame.assumptions],
    confidence: buildLocalConfidence(
      localScores,
      input.frame,
      input.usedProfile,
      input.usedTiming,
      input.intent.highStakesFlag,
      locale
    ),
    limitations: [
      askCopy(locale, 'parse.limit.comparative'),
      ...(input.usedProfile ? [] : [askCopy(locale, 'parse.limit.noProfile')]),
      ...(input.usedTiming ? [] : [askCopy(locale, 'parse.limit.noTiming')]),
    ],
    relatedModules: buildLocalModules(input.intent, input.usedProfile, locale),
    followUpQuestions: [
      askCopy(locale, 'parse.followup.no', {
        decision: input.frame.decisionStatement.slice(0, 60),
      }),
      input.intent.financialImpactLikely
        ? askCopy(locale, 'parse.followup.downside')
        : askCopy(locale, 'parse.followup.stakeholder'),
      askCopy(locale, 'parse.followup.checkpoint'),
    ],
    safetyNotice: safetyNoticeFor(input.intent, locale),
    generatedAt: input.generatedAt,
    meta: {
      sources: input.sources,
      requestId: input.requestId,
      clarificationAnswer: input.clarificationAnswer,
      usedProfile: input.usedProfile,
      usedTiming: input.usedTiming,
      fallback: !input.conversationMessage,
    },
  };

  const parsed = input.conversationMessage
    ? extractJsonObject(input.conversationMessage)
    : null;

  if (isRecord(parsed)) {
    if (typeof parsed.recommendation === 'string' && parsed.recommendation.trim()) {
      recommendation = parsed.recommendation.slice(0, 320);
      result.recommendation = recommendation;
    }
    const statusRaw = String(parsed.recommendationStatus ?? '').toLowerCase();
    if ((RECOMMENDATION_STATUSES as readonly string[]).includes(statusRaw)) {
      status = statusRaw as RecommendationStatus;
      result.recommendationStatus = status;
    }
    if (typeof parsed.executiveSummary === 'string') {
      result.executiveSummary = wordLimit(parsed.executiveSummary, 90);
    } else {
      result.executiveSummary = buildExecutiveSummary(
        input.frame,
        status,
        recommendation,
        localActions.now[0]?.action ?? nextActionFallback,
        locale
      );
    }
    result.scores = parseScores(parsed.scores, localScores);
    result.analysis = parseAnalysis(parsed.analysis, result.analysis);
    result.scenarios = parseScenarios(parsed.scenarios, result.scenarios);
    result.actionPlan = parseActions(parsed.actionPlan, localActions, locale);
    result.relatedModules = parseModules(
      parsed.relatedModules,
      result.relatedModules,
      locale
    );
    // Ensure people routing when people-relevant even if model omitted it.
    if (
      input.intent.peopleRelevant &&
      !result.relatedModules.some((m) => m.module === 'people') &&
      result.relatedModules.length < 3
    ) {
      const peopleFallback =
        locale === 'fa'
          ? {
              reason: 'بافت ارتباطی برای این تصمیم مهم است.',
              actionLabel: 'مقایسه افراد',
            }
          : locale === 'ru'
            ? {
                reason: 'Контекст общения важен для этого решения.',
                actionLabel: 'Сравнить людей',
              }
            : locale === 'ar'
              ? {
                  reason: 'سياق التواصل مهم لهذا القرار.',
                  actionLabel: 'مقارنة الأشخاص',
                }
              : {
                  reason: 'Communication context matters for this decision.',
                  actionLabel: 'Compare People',
                };
      result.relatedModules = [
        ...result.relatedModules,
        {
          module: 'people' as const,
          reason: peopleFallback.reason,
          actionLabel: peopleFallback.actionLabel,
          route: MODULE_ROUTES.people,
        },
      ].slice(0, 3);
    }
    result.confidence = parseConfidence(parsed.confidence, result.confidence);
    if (Array.isArray(parsed.assumptions)) {
      result.assumptions = parsed.assumptions.map(String).slice(0, 8);
    }
    if (Array.isArray(parsed.limitations)) {
      result.limitations = parsed.limitations.map(String).slice(0, 8);
    }
    if (Array.isArray(parsed.followUpQuestions)) {
      const qs = parsed.followUpQuestions.map(String).filter(Boolean).slice(0, 3);
      if (qs.length === 3) result.followUpQuestions = qs;
    }
    if (parsed.safetyNotice === null) result.safetyNotice = null;
    else if (typeof parsed.safetyNotice === 'string') {
      result.safetyNotice = parsed.safetyNotice.slice(0, 280);
    }
    if (Array.isArray(parsed.alternatives)) {
      result.alternatives = parsed.alternatives
        .filter(isRecord)
        .slice(0, 3)
        .map((a) => ({
          option: String(a.option ?? askCopy(locale, 'parse.option')).slice(0, 80),
          bestFor: String(a.bestFor ?? '').slice(0, 120),
          advantages: Array.isArray(a.advantages) ? a.advantages.map(String).slice(0, 4) : [],
          disadvantages: Array.isArray(a.disadvantages)
            ? a.disadvantages.map(String).slice(0, 4)
            : [],
          risk: String(a.risk ?? '').slice(0, 120),
          timingFit: String(a.timingFit ?? '').slice(0, 80),
          recommendationFit: String(a.recommendationFit ?? '').slice(0, 120),
        }));
    }
    result.meta = {
      ...result.meta!,
      fallback: false,
      sources: [...new Set([...(result.meta?.sources ?? []), 'conversation-api'])],
    };
  }

  const validation = validateAskDecisionResult(result);
  if (!validation.ok) {
    // One safe local repair: rebuild critical sections from local builders
    result.scores = localScores;
    result.actionPlan = localActions;
    result.analysis = buildLocalAnalysis(
      input.frame,
      input.intent,
      result.recommendation,
      input.usedProfile,
      input.decisionStyles,
      locale
    );
    result.confidence = buildLocalConfidence(
      localScores,
      input.frame,
      input.usedProfile,
      input.usedTiming,
      input.intent.highStakesFlag,
      locale
    );
    result.meta = { ...result.meta!, fallback: true };
  }

  return result;
}

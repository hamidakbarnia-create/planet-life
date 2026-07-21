/** Structured non-generic fallback when provider/parse fails. */

import { askCopy } from './ask-local-copy';
import type {
  AskDecisionResult,
  DecisionFrame,
  IntentDetection,
  TimingIntelligence,
} from './types';
import { ASK_DECISION_SCHEMA_VERSION } from './types';
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

export function buildStructuredFallback(input: {
  intent: IntentDetection;
  frame: DecisionFrame;
  timing: TimingIntelligence;
  usedProfile: boolean;
  usedTiming: boolean;
  decisionStyles: string[];
  generatedAt: string;
  requestId: string | null;
  clarificationAnswer: string | null;
  reason: 'network' | 'timeout' | 'parse' | 'provider' | 'unknown';
  locale?: 'en' | 'ru' | 'fa' | 'ar';
}): AskDecisionResult {
  const locale = input.locale ?? 'en';
  const scores = buildLocalScores(
    input.frame,
    input.intent,
    input.timing.bestWindow?.score ?? null,
    input.usedProfile,
    locale
  );
  const status = recommendStatus(scores, input.intent);
  const recommendation = askCopy(locale, 'fallback.recommendation');
  const actions = buildLocalActionPlan(input.frame, locale);
  const confidenceBase = buildLocalConfidence(
    scores,
    input.frame,
    input.usedProfile,
    input.usedTiming,
    input.intent.highStakesFlag,
    locale
  );

  return {
    schemaVersion: ASK_DECISION_SCHEMA_VERSION,
    intent: input.intent,
    decisionFrame: input.frame,
    executiveSummary: buildExecutiveSummary(
      input.frame,
      status,
      recommendation,
      actions.now[0]!.action,
      locale
    ),
    recommendation,
    recommendationStatus: 'gather-more-information',
    scores,
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
    actionPlan: actions,
    alternatives: [],
    assumptions: [
      ...input.frame.assumptions,
      askCopy(locale, 'fallback.providerUnavailable', {
        reason: askCopy(locale, `fallback.reason.${input.reason}`),
      }),
    ],
    confidence: {
      ...confidenceBase,
      level: 'low',
      score: Math.min(40, confidenceBase.score),
      explanation: askCopy(locale, 'fallback.lowConfidence'),
    },
    limitations: [
      askCopy(locale, 'fallback.limit.structured'),
      askCopy(locale, 'fallback.limit.retry'),
    ],
    relatedModules: buildLocalModules(input.intent, input.usedProfile, locale),
    followUpQuestions: [
      askCopy(locale, 'fallback.followup.irreversible'),
      askCopy(locale, 'fallback.followup.fact'),
      askCopy(locale, 'fallback.followup.reversible'),
    ],
    safetyNotice: safetyNoticeFor(input.intent, locale),
    generatedAt: input.generatedAt,
    meta: {
      sources: ['ask-decision-fallback'],
      requestId: input.requestId,
      clarificationAnswer: input.clarificationAnswer,
      usedProfile: input.usedProfile,
      usedTiming: input.usedTiming,
      fallback: true,
    },
  };
}

/** Structured non-generic fallback when provider/parse fails. */

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
}): AskDecisionResult {
  const scores = buildLocalScores(
    input.frame,
    input.intent,
    input.timing.bestWindow?.score ?? null,
    input.usedProfile
  );
  const status = recommendStatus(scores, input.intent);
  const recommendation =
    'Use a general decision framework: name the irreversible step, shrink to a reversible pilot, and gather the one fact that would change your mind.';
  const actions = buildLocalActionPlan(input.frame);

  return {
    schemaVersion: ASK_DECISION_SCHEMA_VERSION,
    intent: input.intent,
    decisionFrame: input.frame,
    executiveSummary: buildExecutiveSummary(
      input.frame,
      status,
      recommendation,
      actions.now[0]!.action
    ),
    recommendation,
    recommendationStatus: 'gather-more-information',
    scores,
    analysis: buildLocalAnalysis(
      input.frame,
      input.intent,
      recommendation,
      input.usedProfile,
      input.decisionStyles
    ),
    timing: input.timing,
    scenarios: buildLocalScenarios(input.frame),
    actionPlan: actions,
    alternatives: [],
    assumptions: [
      ...input.frame.assumptions,
      `Provider path unavailable (${input.reason}) — using structured local framework.`,
    ],
    confidence: {
      ...buildLocalConfidence(
        scores,
        input.frame,
        input.usedProfile,
        input.usedTiming,
        input.intent.highStakesFlag
      ),
      level: 'low',
      score: Math.min(
        40,
        buildLocalConfidence(
          scores,
          input.frame,
          input.usedProfile,
          input.usedTiming,
          input.intent.highStakesFlag
        ).score
      ),
      explanation:
        'Low confidence because the conversational briefing could not be completed. Retry when connectivity returns.',
    },
    limitations: [
      'Structured fallback — not personalised model insight.',
      'Retry to regenerate a full briefing.',
    ],
    relatedModules: buildLocalModules(input.intent, input.usedProfile),
    followUpQuestions: [
      'What is the irreversible part of this decision?',
      'What single fact would change your mind?',
      'What is the smallest reversible next step this week?',
    ],
    safetyNotice: safetyNoticeFor(input.intent),
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

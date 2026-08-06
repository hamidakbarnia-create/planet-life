import {
  buildInputAnalysis,
  type DecisionIntent,
} from '../input-analysis';
import {
  buildUnifiedDecisionContext,
  type UnifiedDecisionContext,
} from '../context-builder';
import { TIMING_AVAILABLE } from '../context-builder/fixtures';
import { buildReasoningPlan, type ReasoningPlan } from '../reasoning-planner';
import {
  ASK_DECISION_SCHEMA_VERSION,
  type AskDecisionResult,
} from '../types';

export const FIXED_NOW = '2026-07-22T14:00:00.000Z';

export const CAREER_QUESTION =
  'Should I accept this job offer or stay in my current role?';

export function analysisForCareer() {
  return buildInputAnalysis(CAREER_QUESTION);
}

export function contextFor(
  intent: DecisionIntent = 'career',
  question = CAREER_QUESTION
): UnifiedDecisionContext {
  const analysis =
    intent === 'career'
      ? analysisForCareer()
      : buildInputAnalysis(question);
  return buildUnifiedDecisionContext({
    question,
    locale: 'en',
    analysis,
    profile: null,
    timing: TIMING_AVAILABLE,
    conversationMessages: [
      { role: 'user', content: 'I need an answer this month.' },
    ],
    now: () => FIXED_NOW,
  });
}

export function planFor(context: UnifiedDecisionContext): ReasoningPlan {
  return buildReasoningPlan({
    analysis: context.analysis,
    context,
  });
}

export function minimalAskResult(
  overrides?: Partial<AskDecisionResult>
): AskDecisionResult {
  return {
    schemaVersion: ASK_DECISION_SCHEMA_VERSION,
    intent: {
      primaryIntent: 'career',
      secondaryIntent: null,
      confidence: 0.8,
      rationale: 'job offer',
      detectedEntities: [],
      decisionPresent: true,
      timingRelevant: true,
      peopleRelevant: false,
      financialImpactLikely: true,
      highStakesFlag: false,
    },
    decisionFrame: {
      originalQuestion: CAREER_QUESTION,
      decisionStatement: 'Accept offer or stay',
      decisionType: 'career',
      objective: 'Choose role',
      mainConcern: 'Fit',
      options: ['accept', 'stay'],
      urgency: 'moderate',
      timeHorizon: 'weeks',
      reversibility: 'moderate',
      affectedAreas: ['career'],
      unknowns: [],
      assumptions: [],
      requiresClarification: false,
    },
    executiveSummary: 'Proceed with caution on the offer.',
    recommendation: 'Negotiate terms before accepting.',
    recommendationStatus: 'proceed-with-caution',
    scores: {
      opportunity: { value: 60, rationale: 'Solid upside.' },
      risk: { value: 40, rationale: 'Some downside.' },
      timing: { value: 55, rationale: 'Timing is acceptable.' },
      readiness: { value: 50, rationale: 'Partially ready.' },
      confidence: { value: 50, rationale: 'Moderate confidence.' },
    },
    analysis: [
      { id: 'situation', title: 'S', body: 'Situation body.' },
      { id: 'factors', title: 'F', body: 'Factors body.' },
      { id: 'opportunities', title: 'O', body: 'Opp body.' },
      { id: 'risks', title: 'R', body: 'Risk body.' },
      { id: 'tradeoffs', title: 'T', body: 'Tradeoff body.' },
      { id: 'personal-fit', title: 'P', body: 'Fit body.' },
      { id: 'what-could-change', title: 'W', body: 'Change body.' },
      { id: 'why', title: 'Y', body: 'Why body.' },
    ],
    timing: {
      applicable: true,
      available: true,
      today: null,
      next7Days: null,
      next30Days: null,
      bestWindow: null,
      cautionWindow: null,
      timingRationale: 'Timing is moderate.',
      timingConfidence: 'medium',
    },
    scenarios: {
      bestCase: {
        outcome: 'Best',
        likelihoodBand: 'medium',
        keyConditions: [],
        earlySignals: [],
        mitigation: 'm',
      },
      mostLikely: {
        outcome: 'Likely',
        likelihoodBand: 'medium',
        keyConditions: [],
        earlySignals: [],
        mitigation: 'm',
      },
      downsideCase: {
        outcome: 'Down',
        likelihoodBand: 'low',
        keyConditions: [],
        earlySignals: [],
        mitigation: 'm',
      },
    },
    actionPlan: {
      now: [
        {
          action: 'a',
          purpose: 'p',
          priority: 'high',
          completionSignal: 'c',
        },
      ],
      next7Days: [],
      next30Days: [],
    },
    alternatives: [],
    assumptions: ['Assume offer is real.'],
    confidence: {
      level: 'medium',
      score: 50,
      explanation: 'Limited profile context.',
      missingInputs: ['constraints'],
      limitingFactors: [],
    },
    limitations: ['No full profile.'],
    relatedModules: [],
    followUpQuestions: ['q1', 'q2', 'q3'],
    safetyNotice: null,
    generatedAt: FIXED_NOW,
    ...overrides,
  };
}

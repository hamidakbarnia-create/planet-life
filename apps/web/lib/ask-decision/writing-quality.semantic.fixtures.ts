/**
 * Semantic fixtures for Writing Quality Layer — real decision scenarios.
 * Each fixture carries mustRetain tokens that must survive wording polish.
 */

import { ASK_DECISION_SCHEMA_VERSION } from './types';
import type { AskDecisionResult, AskIntent, RecommendationStatus } from './types';

export type WritingSemanticFixture = {
  id:
    | 'raise-request'
    | 'job-change'
    | 'relocation'
    | 'relationship'
    | 'financial-risk';
  locale: 'en' | 'fa';
  question: string;
  /** Distinctive tokens that must appear in post-WQ presentation prose. */
  mustRetain: string[];
  result: AskDecisionResult;
};

function baseResult(opts: {
  id: string;
  intent: AskIntent;
  status: RecommendationStatus;
  decision: string;
  concern: string;
  unknowns: string[];
  options: string[];
  question: string;
  summary: string;
  recommendation: string;
  why: string;
  missing: string;
  risks: string;
  opportunities: string;
  nowActions: string[];
  financialImpactLikely?: boolean;
  peopleRelevant?: boolean;
}): AskDecisionResult {
  return {
    schemaVersion: ASK_DECISION_SCHEMA_VERSION,
    intent: {
      primaryIntent: opts.intent,
      secondaryIntent: null,
      confidence: 78,
      rationale: `${opts.intent} cues`,
      detectedEntities: [],
      decisionPresent: true,
      timingRelevant: true,
      peopleRelevant: opts.peopleRelevant ?? false,
      financialImpactLikely: opts.financialImpactLikely ?? false,
      highStakesFlag: true,
    },
    decisionFrame: {
      originalQuestion: opts.question,
      decisionStatement: opts.decision,
      decisionType: opts.intent,
      objective: opts.decision,
      mainConcern: opts.concern,
      options: opts.options,
      urgency: 'moderate',
      timeHorizon: 'months',
      reversibility: 'Partially reversible with cost',
      affectedAreas: [opts.intent],
      unknowns: opts.unknowns,
      assumptions: ['Timing flexible unless clarified'],
      requiresClarification: false,
    },
    executiveSummary: opts.summary,
    recommendation: opts.recommendation,
    recommendationStatus: opts.status,
    scores: {
      opportunity: {
        value: 58,
        rationale: `Constructive upside around: ${opts.decision.slice(0, 60)}`,
      },
      risk: {
        value: 52,
        rationale: `Material downside risk tied to: ${opts.concern.slice(0, 60)}`,
      },
      timing: {
        value: 49,
        rationale: 'Timing uncertain until the review window is clearer',
      },
      readiness: {
        value: 55,
        rationale: 'Partial readiness — profile signals incomplete',
      },
      confidence: {
        value: 62,
        rationale: 'Moderate confidence with incomplete inputs',
      },
    },
    analysis: [
      {
        id: 'situation',
        title: 'Situation',
        body: opts.summary,
      },
      {
        id: 'opportunities',
        title: 'Opportunities',
        body: opts.opportunities,
      },
      {
        id: 'risks',
        title: 'Risks',
        body: opts.risks,
      },
      {
        id: 'why',
        title: 'Why',
        body: opts.why,
      },
      {
        id: 'what-could-change',
        title: 'What could change',
        body: opts.missing,
      },
    ],
    timing: {
      applicable: true,
      available: false,
      today: null,
      next7Days: null,
      next30Days: null,
      bestWindow: null,
      cautionWindow: null,
      timingRationale: 'Timing provisional.',
      timingConfidence: 'medium',
    },
    scenarios: {
      bestCase: {
        outcome: 'Clean upside',
        likelihoodBand: 'medium',
        keyConditions: [],
        earlySignals: [],
        mitigation: 'Pilot',
      },
      mostLikely: {
        outcome: 'Partial progress',
        likelihoodBand: 'high',
        keyConditions: [],
        earlySignals: [],
        mitigation: 'Checkpoint',
      },
      downsideCase: {
        outcome: 'Costly reversal',
        likelihoodBand: 'low',
        keyConditions: [],
        earlySignals: [],
        mitigation: 'Cap exposure',
      },
    },
    actionPlan: {
      now: opts.nowActions.map((action, i) => ({
        action,
        purpose: 'Clarify before commit',
        priority: i === 0 ? 'critical' : 'high',
        completionSignal: 'Done',
      })),
      next7Days: [
        {
          action: 'Compare options on paper this week',
          purpose: 'Compare',
          priority: 'high',
          completionSignal: 'Table exists',
        },
      ],
      next30Days: [
        {
          action: 'Review commitment after one month',
          purpose: 'Checkpoint',
          priority: 'medium',
          completionSignal: 'Review note',
        },
      ],
    },
    alternatives: [],
    assumptions: ['Timing flexible unless clarified'],
    confidence: {
      level: 'medium',
      score: 62,
      explanation: 'Staged moves preferred.',
      missingInputs: [...opts.unknowns],
      limitingFactors: ['Incomplete inputs'],
    },
    limitations: ['Comparative guidance only'],
    relatedModules: [],
    followUpQuestions: ['What would make this a clear no?'],
    safetyNotice: null,
    generatedAt: '2026-07-21T12:00:00.000Z',
    meta: {
      fallback: false,
      sources: ['semantic-fixture'],
      usedProfile: true,
      usedTiming: false,
      requestId: opts.id,
      clarificationAnswer: null,
    },
  };
}

export const WRITING_SEMANTIC_FIXTURES: WritingSemanticFixture[] = [
  {
    id: 'raise-request',
    locale: 'en',
    question: 'Should I ask for a raise this month?',
    mustRetain: [
      'ask for a 12% raise',
      'manager budget freeze',
      'comp band evidence',
      'peer salary data',
    ],
    result: baseResult({
      id: 'raise-request',
      intent: 'career',
      status: 'proceed-with-caution',
      question: 'Should I ask for a raise this month?',
      decision: 'Whether to ask for a 12% raise this month',
      concern: 'manager budget freeze after Q2 cuts',
      unknowns: ['peer salary data for the same level', 'timing of next review cycle'],
      options: ['ask now', 'wait for review cycle'],
      summary:
        'You can ask for a 12% raise carefully if you bring comp band evidence; watch the manager budget freeze.',
      recommendation:
        'Proceed with caution: prepare comp band evidence before asking for a 12% raise.',
      why: 'The ask is reasonable, but manager budget freeze and missing peer salary data keep downside real.',
      missing: 'Need peer salary data for the same level and review-cycle timing.',
      risks: 'Pushing during a manager budget freeze can stall the conversation.',
      opportunities: 'Clear comp band evidence can unlock a staged increase.',
      nowActions: [
        'Gather peer salary data for the same level',
        'Draft the 12% raise ask with comp band evidence',
        'Separate reversible talking points from any hard ultimatum',
      ],
    }),
  },
  {
    id: 'job-change',
    locale: 'en',
    question: 'Should I leave my current role for the Series B offer?',
    mustRetain: [
      'Series B offer',
      'runway of 14 months',
      'vesting cliff',
      'notice period',
    ],
    result: baseResult({
      id: 'job-change',
      intent: 'career',
      status: 'gather-more-information',
      question: 'Should I leave my current role for the Series B offer?',
      decision: 'Whether to accept the Series B offer and leave current role',
      concern: 'vesting cliff and runway of 14 months',
      unknowns: ['role scope after 90 days', 'equity refresh policy'],
      options: ['accept Series B offer', 'stay and renegotiate'],
      summary:
        'Gather more on the Series B offer: confirm runway of 14 months and how the vesting cliff works before resigning.',
      recommendation:
        'Gather more information on vesting cliff and runway of 14 months before leaving.',
      why: 'Career upside exists, but vesting cliff plus unclear role scope after 90 days dominate.',
      missing: 'Need equity refresh policy and written role scope after 90 days.',
      risks: 'Leaving before clarifying vesting cliff can lock in asymmetric downside.',
      opportunities: 'Series B offer may accelerate scope if runway of 14 months holds.',
      nowActions: [
        'Confirm runway of 14 months in writing',
        'Map vesting cliff dates against notice period',
        'Write the stay-vs-leave decision in one sentence',
      ],
      financialImpactLikely: true,
    }),
  },
  {
    id: 'relocation',
    locale: 'en',
    question: 'Is moving to Berlin this year better than waiting?',
    mustRetain: [
      'Berlin',
      'visa timeline',
      'housing deposit',
      'remote-work approval',
    ],
    result: baseResult({
      id: 'relocation',
      intent: 'relocation',
      status: 'wait',
      question: 'Is moving to Berlin this year better than waiting?',
      decision: 'Whether to relocate to Berlin this year or wait',
      concern: 'visa timeline slipping past housing deposit deadlines',
      unknowns: ['remote-work approval from current employer', 'school waitlist'],
      options: ['move to Berlin this year', 'wait 12 months'],
      summary:
        'Waiting looks wiser until the Berlin visa timeline and remote-work approval are clear relative to the housing deposit.',
      recommendation:
        'Wait until visa timeline and remote-work approval line up with the housing deposit.',
      why: 'Relocation to Berlin is blocked more by visa timeline than by desire to move.',
      missing: 'Need remote-work approval and school waitlist clarity.',
      risks: 'Paying a housing deposit before visa timeline confirms can strand capital.',
      opportunities: 'A clear remote-work approval would unlock a reversible pilot month in Berlin.',
      nowActions: [
        'List visa timeline milestones before any housing deposit',
        'Request remote-work approval in writing',
        'Compare move-now vs wait-12-months on one page',
      ],
    }),
  },
  {
    id: 'relationship',
    locale: 'en',
    question: 'Should we move in together before the wedding?',
    mustRetain: [
      'moving in together',
      'lease co-sign',
      'conflict repair',
      'exit plan',
    ],
    result: baseResult({
      id: 'relationship',
      intent: 'relationship',
      status: 'proceed-with-caution',
      question: 'Should we move in together before the wedding?',
      decision: 'Whether moving in together before the wedding is wise',
      concern: 'lease co-sign without a shared exit plan',
      unknowns: ['conflict repair habits under stress', 'money split rules'],
      options: ['move in together now', 'wait until after wedding'],
      summary:
        'Moving in together can proceed carefully if lease co-sign sits behind a written exit plan and conflict repair agreement.',
      recommendation:
        'Proceed with caution: agree conflict repair and an exit plan before any lease co-sign.',
      why: 'Relationship closeness is fine; lease co-sign without exit plan is the irreversible piece.',
      missing: 'Need money split rules and conflict repair habits under stress.',
      risks: 'A lease co-sign without exit plan raises asymmetric breakup costs.',
      opportunities: 'A trial month without lease co-sign can test conflict repair first.',
      nowActions: [
        'Draft a shared exit plan before lease co-sign',
        'Agree one conflict repair ritual for hard weeks',
        'Separate a reversible trial month from any lease co-sign',
      ],
      peopleRelevant: true,
    }),
  },
  {
    id: 'financial-risk',
    locale: 'en',
    question: 'Should I put 40% of savings into this private deal?',
    mustRetain: [
      '40% of savings',
      'private deal',
      'liquidity lock',
      'downside cap',
    ],
    result: baseResult({
      id: 'financial-risk',
      intent: 'investment',
      status: 'avoid-for-now',
      question: 'Should I put 40% of savings into this private deal?',
      decision: 'Whether to allocate 40% of savings into the private deal',
      concern: 'liquidity lock longer than 36 months',
      unknowns: ['downside cap in the term sheet', 'second-lien exposure'],
      options: ['allocate 40% of savings', 'allocate ≤10% pilot', 'pass'],
      summary:
        'Avoid putting 40% of savings into this private deal while the liquidity lock and downside cap remain unclear.',
      recommendation:
        'Avoid for now: do not commit 40% of savings until downside cap and liquidity lock are explicit.',
      why: 'Concentration at 40% of savings plus liquidity lock dominates any upside story.',
      missing: 'Need downside cap in the term sheet and second-lien exposure details.',
      risks: 'A private deal with liquidity lock can trap 40% of savings through a drawdown.',
      opportunities: 'A ≤10% pilot only after downside cap is written could re-open the question later.',
      nowActions: [
        'Extract downside cap language from the private deal term sheet',
        'Measure liquidity lock months against emergency reserves',
        'Write a hard no-go if 40% of savings remains the ask',
      ],
      financialImpactLikely: true,
    }),
  },
];

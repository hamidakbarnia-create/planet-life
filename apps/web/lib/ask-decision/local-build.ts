/** Local structured builders used for repair + no-model fallback. */

import type {
  AnalysisSection,
  AskActionPlan,
  AskConfidence,
  AskDecisionScores,
  AskScenarios,
  DecisionFrame,
  IntentDetection,
  RecommendationStatus,
  RelatedModule,
  TimingIntelligence,
} from './types';
import { clampScore, wordLimit } from './util';
import { MODULE_ROUTES } from './util';

export function buildLocalScores(
  frame: DecisionFrame,
  intent: IntentDetection,
  timingScore: number | null,
  usedProfile: boolean
): AskDecisionScores {
  const timing = clampScore(timingScore ?? 52);
  const riskBase =
    intent.highStakesFlag ? 62 : frame.urgency === 'immediate' ? 55 : 42;
  const opportunityBase =
    frame.options.length > 0 ? 58 : intent.decisionPresent ? 55 : 48;
  const readinessBase = usedProfile ? 58 : 45;
  const confidenceBase =
    (usedProfile ? 12 : 0) +
    (timingScore != null ? 10 : 0) +
    (frame.unknowns.length === 0 ? 12 : 0) +
    40;

  return {
    opportunity: {
      value: clampScore(opportunityBase),
      rationale: 'Comparative opportunity pressure from framing and domain signals.',
    },
    risk: {
      value: clampScore(riskBase + (frame.reversibility.startsWith('Low') ? 10 : 0)),
      rationale: 'Risk reflects stakes language, reversibility, and domain.',
    },
    timing: {
      value: timing,
      rationale:
        timingScore != null
          ? 'Timing score from existing timing engine windows.'
          : 'Timing provisional — live timing unavailable.',
    },
    readiness: {
      value: clampScore(readinessBase),
      rationale: usedProfile
        ? 'Readiness considers personal decision context availability.'
        : 'Readiness limited without a personal intelligence profile.',
    },
    confidence: {
      value: clampScore(confidenceBase - frame.assumptions.length * 4),
      rationale: 'Confidence tracks clarity, profile, timing, and assumption load.',
    },
  };
}

export function recommendStatus(
  scores: AskDecisionScores,
  intent: IntentDetection
): RecommendationStatus {
  if (intent.highStakesFlag && scores.confidence.value < 55) {
    return 'gather-more-information';
  }
  if (scores.risk.value > scores.opportunity.value + 8) return 'wait';
  if (scores.opportunity.value >= 65 && scores.risk.value < 55) return 'proceed';
  if (scores.opportunity.value >= 55) return 'proceed-with-caution';
  if (scores.readiness.value < 45) return 'gather-more-information';
  return 'neutral';
}

export function buildLocalAnalysis(
  frame: DecisionFrame,
  intent: IntentDetection,
  recommendation: string,
  usedProfile: boolean,
  decisionStyles: string[]
): AnalysisSection[] {
  return [
    {
      id: 'situation',
      title: 'Situation',
      body: `You are deciding: ${frame.decisionStatement}. Intent: ${intent.primaryIntent}. Horizon: ${frame.timeHorizon}.`,
    },
    {
      id: 'factors',
      title: 'Main Factors',
      body: `Objective: ${frame.objective}. Concern: ${frame.mainConcern}. Reversibility: ${frame.reversibility}.`,
    },
    {
      id: 'opportunities',
      title: 'Opportunities',
      body:
        frame.options.length > 0
          ? `Named options: ${frame.options.join('; ')}. Prefer the option that stays reversible while learning.`
          : 'Opportunity lies in clarifying one reversible next step that reduces the top unknown.',
    },
    {
      id: 'risks',
      title: 'Risks',
      body: `Primary concern: ${frame.mainConcern}. Unknowns: ${frame.unknowns.join('; ') || 'none listed'}.`,
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      body: `Acting now trades speed for incomplete information (${frame.timeHorizon}). Waiting trades clarity for possible lost timing.`,
    },
    {
      id: 'personal-fit',
      title: 'Personal Fit',
      body: usedProfile
        ? `Decision style signals (${decisionStyles.slice(0, 3).join(', ') || 'available'}) suggest sequencing irreversible steps after a reversible pilot.`
        : 'Personal intelligence profile unavailable — using general decision hygiene. Completing your profile improves personal fit.',
    },
    {
      id: 'what-could-change',
      title: 'What Could Change the Recommendation',
      body:
        frame.unknowns[0] ||
        'A stated deadline, downside limit, or explicit option set would materially change this briefing.',
    },
    {
      id: 'why',
      title: 'Why This Recommendation',
      body: recommendation,
    },
  ];
}

export function buildLocalActionPlan(frame: DecisionFrame): AskActionPlan {
  const now: AskActionPlan['now'] = [
    {
      action: `Write the decision in one sentence: “${frame.decisionStatement.slice(0, 100)}”`,
      purpose: 'Make the decision explicit',
      priority: 'high',
      completionSignal: 'One written decision sentence exists',
    },
    {
      action: 'List the single fact that would change your mind in either direction',
      purpose: 'Surface the critical unknown',
      priority: 'critical',
      completionSignal: 'Decision-changing fact named',
    },
    {
      action: 'Identify the irreversible part of this choice',
      purpose: 'Protect downside',
      priority: 'high',
      completionSignal: 'Irreversible step named separately from pilots',
    },
  ];

  const next7Days: AskActionPlan['next7Days'] = [
    {
      action:
        frame.options.length >= 2
          ? `Score options (${frame.options.slice(0, 2).join(' vs ')}) on opportunity, risk, and timing`
          : 'Compare two concrete options on opportunity, risk, and timing',
      purpose: 'Create a comparable choice set',
      priority: 'high',
      completionSignal: 'Option score table exists',
    },
    {
      action: 'Schedule the decisive conversation or review inside your best available window',
      purpose: 'Align action with timing',
      priority: 'medium',
      completionSignal: 'Calendar event created',
    },
    {
      action: `Address concern: ${frame.mainConcern.slice(0, 80)}`,
      purpose: 'Reduce the stated risk',
      priority: 'high',
      completionSignal: 'One mitigation step completed',
    },
  ];

  const next30Days: AskActionPlan['next30Days'] = [
    {
      action: 'Run a checkpoint against your success criteria',
      purpose: 'Validate direction',
      priority: 'medium',
      completionSignal: 'Dated review note exists',
    },
    {
      action: 'Increase commitment only after the first reversible milestone succeeds',
      purpose: 'Sequence irreversibility',
      priority: 'high',
      completionSignal: 'Milestone marked complete before escalation',
    },
    {
      action: 'Archive what changed vs. this recommendation',
      purpose: 'Improve future decisions',
      priority: 'low',
      completionSignal: 'Decision log updated',
    },
  ];

  return {
    now: now.slice(0, 3),
    next7Days: next7Days.slice(0, 3),
    next30Days: next30Days.slice(0, 3),
  };
}

export function buildLocalScenarios(frame: DecisionFrame): AskScenarios {
  return {
    bestCase: {
      outcome: 'You advance with a reversible pilot and retain optionality.',
      likelihoodBand: 'medium',
      keyConditions: ['Critical unknown reduced', 'Timing window used'],
      earlySignals: ['Clear next owner', 'Written success criteria'],
      mitigation: 'Keep the first step reversible.',
    },
    mostLikely: {
      outcome: `Partial progress with trade-offs around ${frame.mainConcern.toLowerCase()}.`,
      likelihoodBand: 'high',
      keyConditions: ['Mixed information quality'],
      earlySignals: ['Delayed replies', 'Scope creep'],
      mitigation: 'Time-box information gathering.',
    },
    downsideCase: {
      outcome: 'An irreversible move lands before key facts are known.',
      likelihoodBand: 'low',
      keyConditions: ['Urgency overrides checkpoints'],
      earlySignals: ['Pressure to skip review'],
      mitigation: 'Separate pilot from commitment in writing.',
    },
  };
}

export function buildLocalModules(
  intent: IntentDetection,
  usedProfile: boolean
): RelatedModule[] {
  const modules: RelatedModule[] = [];
  if (intent.highStakesFlag || intent.decisionPresent) {
    modules.push({
      module: 'pathfinder',
      reason: 'Run a deeper multi-step workflow for irreversible or multi-option decisions.',
      actionLabel: 'Open Pathfinder',
      route: MODULE_ROUTES.pathfinder,
    });
  }
  if (intent.timingRelevant) {
    modules.push({
      module: 'calendar',
      reason: 'Inspect day-level timing across the month.',
      actionLabel: 'View Calendar',
      route: MODULE_ROUTES.calendar,
    });
  }
  modules.push({
    module: 'today',
    reason: 'Align the next action with today’s energy windows.',
    actionLabel: 'See Today',
    route: MODULE_ROUTES.today,
  });
  if (intent.peopleRelevant) {
    modules.push({
      module: 'people',
      reason: 'Communication context matters for this decision.',
      actionLabel: 'Compare People',
      route: MODULE_ROUTES.people,
    });
  }
  if (!usedProfile) {
    modules.push({
      module: 'profile',
      reason: 'Complete your profile to improve personalisation.',
      actionLabel: 'Complete Profile',
      route: MODULE_ROUTES.profile,
    });
  }
  return modules.slice(0, 3);
}

export function buildLocalConfidence(
  scores: AskDecisionScores,
  frame: DecisionFrame,
  usedProfile: boolean,
  usedTiming: boolean,
  highStakes: boolean
): AskConfidence {
  let score = scores.confidence.value;
  if (highStakes) score = Math.min(score, 58);
  const level = score >= 70 ? 'high' : score >= 45 ? 'medium' : 'low';
  const missingInputs = [
    ...frame.unknowns,
    ...(!usedProfile ? ['personal_intelligence_profile'] : []),
    ...(!usedTiming ? ['timing_engine'] : []),
  ];
  return {
    level,
    score: clampScore(score),
    explanation:
      level === 'high'
        ? 'Signals are aligned enough to act with checkpoints.'
        : level === 'medium'
          ? 'Proceed with staged moves; one more critical input would raise confidence.'
          : 'Treat this as directional — gather the missing input before irreversible steps.',
    missingInputs,
    limitingFactors: [
      'Comparative decision-support only — not a prediction.',
      ...(highStakes ? ['High-stakes domain — bounded educational guidance.'] : []),
      ...frame.assumptions.slice(0, 2),
    ],
  };
}

export function buildExecutiveSummary(
  frame: DecisionFrame,
  status: RecommendationStatus,
  recommendation: string,
  nextAction: string
): string {
  const text = [
    `Decision: ${frame.decisionStatement.slice(0, 80)}.`,
    `Recommendation: ${status.replace(/-/g, ' ')}.`,
    recommendation.slice(0, 120),
    `Caution: ${frame.mainConcern.slice(0, 60)}.`,
    `Next: ${nextAction.slice(0, 80)}.`,
  ].join(' ');
  return wordLimit(text, 90);
}

export function buildTimingIntelligence(
  timing: {
    bestToday: { label: string; dateRange: string; score: number; note: string };
    bestThisWeek: { label: string; dateRange: string; score: number; note: string };
    bestThisMonth: { label: string; dateRange: string; score: number; note: string };
    avoidWindow: { label: string; dateRange: string; score: number; note: string };
  } | null,
  applicable: boolean,
  available: boolean
): TimingIntelligence {
  if (!applicable) {
    return {
      applicable: false,
      available: false,
      today: null,
      next7Days: null,
      next30Days: null,
      bestWindow: null,
      cautionWindow: null,
      timingRationale: 'Timing advice not applicable for this question.',
      timingConfidence: 'low',
    };
  }
  if (!timing || !available) {
    return {
      applicable: true,
      available: false,
      today: null,
      next7Days: null,
      next30Days: null,
      bestWindow: null,
      cautionWindow: null,
      timingRationale: 'Timing data unavailable — no fabricated windows.',
      timingConfidence: 'low',
    };
  }
  return {
    applicable: true,
    available: true,
    today: {
      label: 'Today',
      dateRange: timing.bestToday.dateRange,
      score: timing.bestToday.score,
      note: timing.bestToday.note,
    },
    next7Days: {
      label: 'Next 7 days',
      dateRange: timing.bestThisWeek.dateRange,
      score: timing.bestThisWeek.score,
      note: timing.bestThisWeek.note,
    },
    next30Days: {
      label: 'Next 30 days',
      dateRange: timing.bestThisMonth.dateRange,
      score: timing.bestThisMonth.score,
      note: timing.bestThisMonth.note,
    },
    bestWindow: {
      label: 'Best window',
      dateRange: timing.bestThisWeek.dateRange,
      score: timing.bestThisWeek.score,
      note: timing.bestThisWeek.note,
    },
    cautionWindow: {
      label: 'Caution window',
      dateRange: timing.avoidWindow.dateRange,
      score: timing.avoidWindow.score,
      note: timing.avoidWindow.note,
    },
    timingRationale:
      'Windows derived from existing timing engine day scores — comparative, not predictive.',
    timingConfidence: 'medium',
  };
}

export function safetyNoticeFor(intent: IntentDetection): string | null {
  if (!intent.highStakesFlag) return null;
  if (intent.primaryIntent === 'health' || intent.secondaryIntent === 'health') {
    return 'Educational decision support only — not a diagnosis or treatment plan. Consult a qualified professional for medical decisions.';
  }
  if (intent.primaryIntent === 'legal' || intent.secondaryIntent === 'legal') {
    return 'Educational decision support only — not legal advice. Consult a qualified professional for legal conclusions.';
  }
  if (
    intent.primaryIntent === 'investment' ||
    intent.secondaryIntent === 'investment' ||
    intent.financialImpactLikely
  ) {
    return 'Educational decision support only — not investment advice. No outcomes are guaranteed.';
  }
  return 'High-stakes topic — treat this as bounded decision support, not a guarantee.';
}

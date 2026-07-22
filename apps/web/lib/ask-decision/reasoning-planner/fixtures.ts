import {
  buildInputAnalysis,
  buildSafeInputAnalysisFallback,
  INPUT_ANALYSIS_VERSION,
  DECISION_INTENT_TAXONOMY_VERSION,
  type ClarificationReason,
  type DecisionIntent,
  type InputAnalysis,
  type RequiredContextKey,
  type SafetyDomain,
} from '../input-analysis';
import {
  buildUnifiedDecisionContext,
  type UnifiedDecisionContext,
} from '../context-builder';

export const FIXED_NOW = '2026-07-21T12:00:00.000Z';

export const QUESTIONS: Record<DecisionIntent, string> = {
  career: 'Should I accept this job offer or stay in my current role?',
  business: 'Should I launch my startup this quarter or keep consulting?',
  finance: 'Should I invest my savings in an index fund or keep cash?',
  relationship: 'Should I marry my partner this year or wait?',
  family: 'Should we have children now or wait two years?',
  relocation: 'Should I move to Berlin for work or stay in London?',
  education: 'Should I pursue a university degree or take a short course?',
  health: 'Should I prioritize fitness and burnout recovery over overtime?',
  personal_growth:
    'Should I focus on personal growth and mindfulness this year?',
  timing: 'When should I make this decision — this week or next month?',
  other: 'What should I do?',
};

export function analysisFor(intent: DecisionIntent): InputAnalysis {
  return buildInputAnalysis(QUESTIONS[intent]);
}

export function contextFor(
  analysis: InputAnalysis,
  question?: string
): UnifiedDecisionContext {
  return buildUnifiedDecisionContext({
    question: question ?? QUESTIONS[analysis.intent],
    locale: 'en',
    analysis,
    profile: null,
    timing: null,
    conversationMessages: [],
    now: () => FIXED_NOW,
  });
}

/** Controlled analysis for readiness / merge tests. */
export function analysisWithAvailability(args: {
  intent: DecisionIntent;
  required: RequiredContextKey[];
  missing: RequiredContextKey[];
  secondaryIntents?: DecisionIntent[];
  intentConfidence?: number;
  clarificationRequired?: boolean;
}): InputAnalysis {
  const intentConfidence = args.intentConfidence ?? 0.9;
  const safetyDomain: SafetyDomain =
    args.intent === 'health' ? 'health' : 'none';

  let clarificationRequired: boolean;
  let clarificationReason: ClarificationReason;

  if (safetyDomain !== 'none') {
    clarificationRequired = true;
    clarificationReason = 'safety';
  } else if (args.clarificationRequired != null) {
    clarificationRequired = args.clarificationRequired;
    clarificationReason = clarificationRequired
      ? args.missing.length > 0
        ? 'missing_critical_context'
        : 'ambiguous_intent'
      : 'none';
  } else {
    clarificationRequired =
      args.missing.length > 0 || intentConfidence < 0.65;
    clarificationReason = clarificationRequired
      ? args.missing.length > 0
        ? 'missing_critical_context'
        : 'ambiguous_intent'
      : 'none';
  }

  return {
    version: INPUT_ANALYSIS_VERSION,
    taxonomyVersion: DECISION_INTENT_TAXONOMY_VERSION,
    intent: args.intent,
    secondaryIntents: args.secondaryIntents ?? [],
    intentConfidence,
    urgency: 'medium',
    complexity: 'medium',
    decisionStage: 'ready_to_act',
    requiredContext: args.required,
    missingCriticalContext: args.missing,
    clarificationRequired,
    clarificationReason,
    safetyDomain,
  };
}

export function analysisFallback(): InputAnalysis {
  return buildSafeInputAnalysisFallback();
}

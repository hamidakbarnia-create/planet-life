/**
 * Deterministic InputAnalysis builder from user question text.
 * Does not call external models. Always returns a validated contract
 * (falls back on validation failure).
 *
 * Does not replace legacy detectIntent / evaluateClarification.
 */

import {
  DECISION_INTENT_TAXONOMY_VERSION,
  normalizeIntent,
  type DecisionIntent,
} from './taxonomy';
import { buildSafeInputAnalysisFallback } from './fallback';
import { validateInputAnalysis } from './validate';
import {
  INPUT_ANALYSIS_CLARIFICATION_CONFIDENCE_THRESHOLD,
  INPUT_ANALYSIS_VERSION,
  MAX_SECONDARY_INTENTS,
  type ClarificationReason,
  type DecisionStage,
  type InputAnalysis,
  type InputComplexity,
  type InputUrgency,
  type RequiredContextKey,
  type SafetyDomain,
} from './types';

type ScoreRule = {
  intent: DecisionIntent;
  weight: number;
  patterns: RegExp[];
};

const RULES: ScoreRule[] = [
  {
    intent: 'career',
    weight: 3,
    patterns: [
      /\b(career|job|promotion|boss|employer|interview|workplace|employment)\b/i,
      /\b(accept.*(job|offer)|negotiate.*(salary|offer))\b/i,
    ],
  },
  {
    intent: 'business',
    weight: 3,
    patterns: [
      /\b(business|startup|launch|founder|company|client|product|pivot|entrepreneur)\b/i,
    ],
  },
  {
    intent: 'finance',
    weight: 4,
    patterns: [
      /\b(invest|investment|stock|equity|portfolio|crypto|fund|roi)\b/i,
      /\b(money|salary|pay|budget|cash|income|debt|savings|afford|finance)\b/i,
    ],
  },
  {
    intent: 'relationship',
    weight: 3,
    patterns: [
      /\b(relationship|partner|dating|spouse|romance|love|marriage|divorce|conflict)\b/i,
    ],
  },
  {
    intent: 'family',
    weight: 3,
    patterns: [
      /\b(family|parent|parents|kids|children|sibling|parenting)\b/i,
    ],
  },
  {
    intent: 'relocation',
    weight: 4,
    patterns: [
      /\b(relocate|relocation|relocating|moving|emigrate|emigration|immigrate|immigration)\b/i,
      /\bmove to\b/i,
      /\b(should i (stay|leave|move))\b/i,
    ],
  },
  {
    intent: 'education',
    weight: 3,
    patterns: [
      /\b(learn|study|course|degree|school|university|training|certification|education)\b/i,
    ],
  },
  {
    intent: 'health',
    weight: 4,
    patterns: [
      /\b(health|doctor|medical|diagnosis|symptom|treatment|fitness|burnout)\b/i,
    ],
  },
  {
    intent: 'personal_growth',
    weight: 3,
    patterns: [
      /\b(wellbeing|well-being|personal growth|self[- ]improve|mindfulness|purpose)\b/i,
    ],
  },
  {
    intent: 'timing',
    weight: 2,
    patterns: [
      /\b(best time|when should|timing|this week|this month|is now (a )?good)\b/i,
    ],
  },
];

const CONTEXT_BY_INTENT: Record<DecisionIntent, RequiredContextKey[]> = {
  career: [
    'current_option',
    'alternative_option',
    'financial_impact',
    'decision_deadline',
    'primary_goal',
  ],
  business: [
    'current_option',
    'alternative_option',
    'financial_impact',
    'decision_deadline',
    'primary_risk',
    'known_constraints',
  ],
  finance: [
    'financial_impact',
    'primary_risk',
    'decision_deadline',
    'primary_goal',
    'known_constraints',
  ],
  relationship: [
    'relationship_status',
    'reversibility',
    'primary_goal',
    'primary_risk',
  ],
  family: [
    'relationship_status',
    'primary_goal',
    'known_constraints',
    'decision_deadline',
  ],
  relocation: [
    'location',
    'current_option',
    'alternative_option',
    'financial_impact',
    'decision_deadline',
  ],
  education: [
    'current_option',
    'alternative_option',
    'financial_impact',
    'primary_goal',
  ],
  health: ['health_context', 'primary_goal', 'known_constraints', 'primary_risk'],
  personal_growth: ['primary_goal', 'known_constraints', 'decision_deadline'],
  timing: [
    'decision_deadline',
    'current_option',
    'alternative_option',
    'primary_goal',
  ],
  other: ['primary_goal', 'known_constraints', 'decision_deadline'],
};

function detectUrgency(text: string): InputUrgency {
  if (
    /\b(today|tonight|asap|immediately|right now|urgent|emergency|critical)\b/i.test(
      text
    )
  ) {
    return 'critical';
  }
  if (/\b(this week|few days|deadline|by friday|soon)\b/i.test(text)) {
    return 'high';
  }
  if (/\b(this month|coming weeks)\b/i.test(text)) {
    return 'medium';
  }
  return 'low';
}

function detectComplexity(text: string, intentCount: number): InputComplexity {
  if (intentCount >= 2 || /\b(and|vs|versus|or)\b/i.test(text)) return 'high';
  if (text.split(/\s+/).length > 28) return 'medium';
  return intentCount === 0 ? 'low' : 'medium';
}

function detectStage(text: string): DecisionStage {
  if (/\b(already decided|committed|signed|accepted|looking back|was that)\b/i.test(text)) {
    return 'post_decision';
  }
  if (/\b(compare|vs|versus|option a|option b)\b/i.test(text)) {
    return 'comparing';
  }
  if (/\b(should i|decide|choose|accept|reject|ready to)\b/i.test(text)) {
    return 'ready_to_act';
  }
  if (/\b(thinking about|considering|exploring|wondering)\b/i.test(text)) {
    return 'exploring';
  }
  return 'unknown';
}

function detectSafetyDomain(
  text: string,
  intent: DecisionIntent
): SafetyDomain {
  if (
    /\b(kill myself|suicide|self[- ]harm|end my life|hurt myself)\b/i.test(text)
  ) {
    return 'self_harm';
  }
  if (
    intent === 'health' ||
    /\b(diagnos|surgery|medication|symptom|treatment)\b/i.test(text)
  ) {
    return 'health';
  }
  if (/\b(legal|lawyer|lawsuit|sue|court|nda|contract dispute)\b/i.test(text)) {
    return 'legal';
  }
  if (intent === 'finance' || /\b(invest|crypto|loan|debt)\b/i.test(text)) {
    return 'financial';
  }
  if (/\b(irreversible|permanent|life[- ]changing)\b/i.test(text)) {
    return 'other_high_risk';
  }
  return 'none';
}

function isDecisionLanguage(text: string): boolean {
  return /\b(should i|do i|decide|choose|accept|reject|wait|or not|what if|worth|advise)\b/i.test(
    text
  );
}

function mentionedContext(text: string): Set<RequiredContextKey> {
  const found = new Set<RequiredContextKey>();
  if (/\b(deadline|by (monday|friday|sunday)|due|today|asap)\b/i.test(text)) {
    found.add('decision_deadline');
  }
  if (/\b(current (job|role|option)|now i |stay)\b/i.test(text)) {
    found.add('current_option');
  }
  if (/\b(option|vs|versus|either|or )\b/i.test(text)) {
    found.add('alternative_option');
  }
  if (/\b(salary|pay|cost|budget|afford|money|invest|debt)\b/i.test(text)) {
    found.add('financial_impact');
  }
  if (/\b(reversib|undo|permanent|irreversible)\b/i.test(text)) {
    found.add('reversibility');
  }
  if (/\b(goal|want to|hoping)\b/i.test(text)) found.add('primary_goal');
  if (/\b(risk|afraid|worried)\b/i.test(text)) found.add('primary_risk');
  if (/\b(city|country|berlin|london|move to|relocat)\b/i.test(text)) {
    found.add('location');
  }
  if (/\b(married|dating|partner|together|spouse)\b/i.test(text)) {
    found.add('relationship_status');
  }
  if (/\b(health|medical|doctor|burnout|fitness)\b/i.test(text)) {
    found.add('health_context');
  }
  if (/\b(constraint|can't|cannot|limited by|visa)\b/i.test(text)) {
    found.add('known_constraints');
  }
  return found;
}

function uniqueContext(keys: RequiredContextKey[]): RequiredContextKey[] {
  return [...new Set(keys)];
}

function resolveClarification(args: {
  safetyDomain: SafetyDomain;
  missingCriticalContext: RequiredContextKey[];
  intentConfidence: number;
  intent: DecisionIntent;
}): {
  clarificationRequired: boolean;
  clarificationReason: ClarificationReason;
} {
  const {
    safetyDomain,
    missingCriticalContext,
    intentConfidence,
    intent,
  } = args;
  const belowThreshold =
    intentConfidence < INPUT_ANALYSIS_CLARIFICATION_CONFIDENCE_THRESHOLD;

  if (safetyDomain !== 'none') {
    return { clarificationRequired: true, clarificationReason: 'safety' };
  }
  if (missingCriticalContext.length > 0) {
    return {
      clarificationRequired: true,
      clarificationReason: 'missing_critical_context',
    };
  }
  if (belowThreshold || intent === 'other') {
    return {
      clarificationRequired: true,
      clarificationReason: 'ambiguous_intent',
    };
  }
  return { clarificationRequired: false, clarificationReason: 'none' };
}

function buildCandidate(question: string): InputAnalysis {
  const text = question.trim();
  if (!text) return buildSafeInputAnalysisFallback();

  const scores = new Map<DecisionIntent, number>();
  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        scores.set(rule.intent, (scores.get(rule.intent) ?? 0) + rule.weight);
      }
    }
  }

  // Legal keywords → other + legal safety (taxonomy has no legal intent)
  const legalHit =
    /\b(legal|lawyer|lawsuit|sue|court|compliance|nda|settle the (case|lawsuit))\b/i.test(
      text
    );

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  let primary: DecisionIntent =
    ranked[0] && ranked[0][1] > 0 ? ranked[0][0] : 'other';

  if (legalHit) {
    primary = 'other';
  } else if (primary === 'other' && isDecisionLanguage(text)) {
    if (/\b(when|best time|timing)\b/i.test(text)) {
      primary = 'timing';
    }
  }

  const secondaryIntents: DecisionIntent[] = [];
  if (!legalHit) {
    const topScore = ranked[0]?.[1] ?? 0;
    for (const [intent, score] of ranked) {
      if (intent === primary) continue;
      if (score <= 0) continue;
      if (topScore > 0 && score >= topScore * 0.55) {
        secondaryIntents.push(intent);
      }
      if (secondaryIntents.length >= MAX_SECONDARY_INTENTS) break;
    }
  }

  const topScore = ranked[0]?.[1] ?? 0;
  const intentConfidence = Number(
    (topScore === 0
      ? primary === 'timing'
        ? 0.45
        : 0.22
      : Math.min(0.95, 0.35 + topScore * 0.1)
    ).toFixed(4)
  );

  const urgency = detectUrgency(text);
  const complexity = detectComplexity(
    text,
    secondaryIntents.length + (topScore > 0 ? 1 : 0)
  );
  const decisionStage = detectStage(text);
  const safetyDomain = detectSafetyDomain(text, primary);
  const decisionLike = isDecisionLanguage(text);

  // Non-decision chatter: no context requirements; ambiguous by confidence/intent.
  const requiredContext =
    !decisionLike && topScore === 0
      ? []
      : uniqueContext([...CONTEXT_BY_INTENT[primary]]);
  const known = mentionedContext(text);
  const missingCriticalContext = requiredContext.filter((k) => !known.has(k));

  const { clarificationRequired, clarificationReason } = resolveClarification({
    safetyDomain,
    missingCriticalContext,
    intentConfidence,
    intent: primary,
  });

  return {
    version: INPUT_ANALYSIS_VERSION,
    taxonomyVersion: DECISION_INTENT_TAXONOMY_VERSION,
    intent: primary,
    secondaryIntents,
    intentConfidence,
    urgency,
    complexity,
    decisionStage,
    requiredContext,
    missingCriticalContext,
    clarificationRequired,
    clarificationReason,
    safetyDomain,
  };
}

/**
 * Collapse duplicate secondaries after intent-alias normalization only.
 * Documented: validator still rejects duplicates on raw/untrusted input.
 */
function normalizeSecondaryIntents(
  primary: DecisionIntent,
  secondary: DecisionIntent[]
): DecisionIntent[] {
  const out: DecisionIntent[] = [];
  for (const s of secondary) {
    const n = normalizeIntent(s);
    if (n === primary) continue;
    if (out.includes(n)) continue;
    out.push(n);
    if (out.length >= MAX_SECONDARY_INTENTS) break;
  }
  return out;
}

/**
 * Build InputAnalysis for a question. Always returns a strictly valid object.
 * Intent aliases may be normalized; other enums are never silently rewritten.
 */
export function buildInputAnalysis(question: string): InputAnalysis {
  try {
    const candidate = buildCandidate(question);
    candidate.intent = normalizeIntent(candidate.intent);
    candidate.secondaryIntents = normalizeSecondaryIntents(
      candidate.intent,
      candidate.secondaryIntents
    );

    const validated = validateInputAnalysis(candidate);
    if (validated.ok) return validated.value;

    return buildSafeInputAnalysisFallback();
  } catch {
    return buildSafeInputAnalysisFallback();
  }
}

/**
 * Parse unknown JSON-like value into InputAnalysis or safe fallback.
 */
export function parseInputAnalysis(value: unknown): InputAnalysis {
  const validated = validateInputAnalysis(value);
  if (validated.ok) return validated.value;
  return buildSafeInputAnalysisFallback();
}

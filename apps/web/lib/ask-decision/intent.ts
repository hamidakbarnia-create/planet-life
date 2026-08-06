/** Intent detection V3 — controlled taxonomy, deterministic heuristics. */

import {
  ASK_INTENTS,
  type AskIntent,
  type IntentDetection,
} from './types';

type Rule = {
  intent: AskIntent;
  patterns: RegExp[];
  weight: number;
};

const RULES: Rule[] = [
  {
    intent: 'career',
    weight: 3,
    patterns: [
      /\b(career|job|promotion|boss|employer|interview|role|workplace|offer)\b/i,
      /\b(accept.*(job|offer)|negotiate.*(salary|offer))\b/i,
    ],
  },
  {
    intent: 'business',
    weight: 3,
    patterns: [
      /\b(business|startup|launch|founder|company|client|product|pivot)\b/i,
    ],
  },
  {
    intent: 'investment',
    weight: 4,
    patterns: [
      /\b(invest|investment|stock|equity|portfolio|crypto|fund|roi)\b/i,
    ],
  },
  {
    intent: 'money',
    weight: 3,
    patterns: [
      /\b(money|salary|pay|budget|cash|income|debt|savings|afford)\b/i,
    ],
  },
  {
    intent: 'relationship',
    weight: 3,
    patterns: [
      /\b(relationship|partner|dating|spouse|romance|love|conflict)\b/i,
    ],
  },
  {
    intent: 'family',
    weight: 3,
    patterns: [/\b(family|parent|parents|kids|children|sibling)\b/i],
  },
  {
    intent: 'education',
    weight: 3,
    patterns: [
      /\b(learn|study|course|degree|school|university|training|certification)\b/i,
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
    intent: 'wellbeing',
    weight: 3,
    patterns: [/\b(wellbeing|well-being|stress|sleep|balance|mental)\b/i],
  },
  {
    intent: 'relocation',
    weight: 4,
    patterns: [
      /\b(relocat|move to|moving|emigrat|immigrat)\b/i,
      /\b(should i (stay|leave|move))\b/i,
    ],
  },
  {
    intent: 'travel',
    weight: 3,
    patterns: [/\b(travel|trip|flight|vacation|visa|abroad)\b/i],
  },
  {
    intent: 'legal',
    weight: 4,
    patterns: [
      /\b(legal|lawyer|contract|lawsuit|court|compliance|nda)\b/i,
    ],
  },
];

export function normalizeIntent(value: string | null | undefined): AskIntent {
  if (!value) return 'unknown';
  const raw = value.trim().toLowerCase().replace(/\s+/g, '-');
  const mapped =
    raw === 'other' ? 'general' : raw;
  if ((ASK_INTENTS as readonly string[]).includes(mapped)) {
    return mapped as AskIntent;
  }
  // Legacy Title Case
  const legacy: Record<string, AskIntent> = {
    career: 'career',
    business: 'business',
    money: 'money',
    relationship: 'relationship',
    education: 'education',
    health: 'health',
    family: 'family',
    travel: 'travel',
    investment: 'investment',
    legal: 'legal',
    general: 'general',
    unknown: 'unknown',
    relocation: 'relocation',
    wellbeing: 'wellbeing',
  };
  return legacy[value.trim().toLowerCase()] ?? 'unknown';
}

export function isAskIntent(value: string): value is AskIntent {
  return (ASK_INTENTS as readonly string[]).includes(normalizeIntent(value));
}

function extractEntities(text: string): string[] {
  const entities: string[] = [];
  if (/\boffer\b/i.test(text)) entities.push('offer');
  if (/\blaunch\b/i.test(text)) entities.push('launch');
  if (/\bnegotiat/i.test(text)) entities.push('negotiation');
  if (/\bpartner|relationship\b/i.test(text)) entities.push('person');
  if (/\bcontract\b/i.test(text)) entities.push('contract');
  if (/\bmove|relocat/i.test(text)) entities.push('location-change');
  return entities.slice(0, 6);
}

/**
 * Detect intent from free text. Deterministic weighted rules;
 * server may refine later — client validates controlled values.
 */
export function detectIntent(question: string): IntentDetection {
  const text = question.trim();
  if (!text) {
    return {
      primaryIntent: 'unknown',
      secondaryIntent: null,
      confidence: 0,
      rationale: 'Empty question — intent unknown.',
      detectedEntities: [],
      decisionPresent: false,
      timingRelevant: false,
      peopleRelevant: false,
      financialImpactLikely: false,
      highStakesFlag: false,
    };
  }

  const scores = new Map<AskIntent, number>();
  for (const intent of ASK_INTENTS) scores.set(intent, 0);

  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        scores.set(rule.intent, (scores.get(rule.intent) ?? 0) + rule.weight);
      }
    }
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked[0]!;
  const second = ranked[1]!;

  let primaryIntent: AskIntent = top[1] > 0 ? top[0] : 'unknown';
  if (primaryIntent === 'unknown') {
    if (/\b(should i|decide|choose|option|or not|what if|prioritis|prioritize)\b/i.test(text)) {
      primaryIntent = 'general';
    }
  }

  const secondaryIntent =
    second[1] > 0 && second[0] !== primaryIntent && second[1] >= top[1] * 0.6
      ? second[0]
      : null;

  const decisionPresent = /\b(should i|do i|decide|accept|wait|launch|move|negotiat|choose)\b/i.test(
    text
  );
  const timingRelevant =
    /\b(when|timing|this week|this month|now|wait|delay|today|soon)\b/i.test(text) ||
    primaryIntent === 'relocation' ||
    primaryIntent === 'travel';
  const peopleRelevant =
    primaryIntent === 'relationship' ||
    primaryIntent === 'family' ||
    /\b(partner|family|team|boss|client)\b/i.test(text);
  const financialImpactLikely =
    primaryIntent === 'money' ||
    primaryIntent === 'investment' ||
    primaryIntent === 'business' ||
    /\b(salary|pay|cost|price|budget)\b/i.test(text);
  const highStakesFlag =
    primaryIntent === 'health' ||
    primaryIntent === 'legal' ||
    primaryIntent === 'investment' ||
    /\b(permanent|irreversible|lawsuit|surgery|diagnos)\b/i.test(text);

  const confidence =
    top[1] === 0
      ? primaryIntent === 'general'
        ? 45
        : 20
      : Math.min(92, 40 + top[1] * 12);

  return {
    primaryIntent,
    secondaryIntent,
    confidence,
    rationale:
      top[1] > 0
        ? `Primary signals point to ${primaryIntent} based on decision language and domain cues.`
        : primaryIntent === 'general'
          ? 'Decision language present without a clear domain — classified as general.'
          : 'Insufficient domain signals — intent unknown.',
    detectedEntities: extractEntities(text),
    decisionPresent,
    timingRelevant,
    peopleRelevant,
    financialImpactLikely,
    highStakesFlag,
  };
}

/** Simple legacy wrapper returning primary intent only. */
export function detectIntentLabel(question: string): AskIntent {
  return detectIntent(question).primaryIntent;
}

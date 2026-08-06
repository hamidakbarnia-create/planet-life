/**
 * Decision Intent Taxonomy v1 — versioned, additive-friendly.
 * Unknown / unmapped values normalize to `other`.
 */

export const DECISION_INTENT_TAXONOMY_VERSION = '1.0.0';

export const DECISION_INTENTS_V1 = [
  'career',
  'business',
  'finance',
  'relationship',
  'family',
  'relocation',
  'education',
  'health',
  'personal_growth',
  'timing',
  'other',
] as const;

export type DecisionIntent = (typeof DECISION_INTENTS_V1)[number];

/**
 * Alias → canonical DecisionIntent.
 * Matching is on normalized tokens (lowercase, `_`/`-`/spaces collapsed).
 */
export const DECISION_INTENT_ALIASES: Readonly<Record<string, DecisionIntent>> =
  {
    // career
    career: 'career',
    job: 'career',
    employment: 'career',
    promotion: 'career',
    employer: 'career',
    workplace: 'career',
    interview: 'career',
    offer: 'career',
    salary_negotiation: 'career',

    // business
    business: 'business',
    startup: 'business',
    entrepreneurship: 'business',
    entrepreneur: 'business',
    founder: 'business',
    company: 'business',
    launch: 'business',
    pivot: 'business',

    // finance
    finance: 'finance',
    money: 'finance',
    investment: 'finance',
    invest: 'finance',
    portfolio: 'finance',
    crypto: 'finance',
    budget: 'finance',
    debt: 'finance',
    savings: 'finance',
    income: 'finance',

    // relationship
    relationship: 'relationship',
    marriage: 'relationship',
    dating: 'relationship',
    divorce: 'relationship',
    partner: 'relationship',
    spouse: 'relationship',
    romance: 'relationship',

    // family
    family: 'family',
    children: 'family',
    parenting: 'family',
    kids: 'family',
    parents: 'family',
    sibling: 'family',

    // relocation
    relocation: 'relocation',
    moving: 'relocation',
    move: 'relocation',
    immigration: 'relocation',
    immigrate: 'relocation',
    emigration: 'relocation',
    emigrate: 'relocation',
    relocate: 'relocation',

    // education
    education: 'education',
    study: 'education',
    school: 'education',
    university: 'education',
    degree: 'education',
    course: 'education',
    training: 'education',

    // health
    health: 'health',
    medical: 'health',
    doctor: 'health',
    fitness: 'health',
    burnout: 'health',

    // personal growth
    personal_growth: 'personal_growth',
    growth: 'personal_growth',
    wellbeing: 'personal_growth',
    well_being: 'personal_growth',
    self_improvement: 'personal_growth',
    mindfulness: 'personal_growth',

    // timing
    timing: 'timing',
    when: 'timing',
    schedule: 'timing',

    // other / catch-alls that must not invent domains
    other: 'other',
    general: 'other',
    unknown: 'other',
    legal: 'other',
    travel: 'other',
    property: 'other',
    spiritual: 'other',
  };

function canonicalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_');
}

export function isDecisionIntent(value: string): value is DecisionIntent {
  return (DECISION_INTENTS_V1 as readonly string[]).includes(value);
}

/**
 * Deterministic normalize for taxonomy v1.
 * Unknown values → `other`.
 */
export function normalizeIntent(
  value: string | null | undefined
): DecisionIntent {
  if (value == null || !String(value).trim()) return 'other';
  const spaced = canonicalizeToken(
    String(value).replace(/([a-z])([A-Z])/g, '$1_$2')
  );
  if (isDecisionIntent(spaced)) return spaced;
  if (spaced in DECISION_INTENT_ALIASES) {
    return DECISION_INTENT_ALIASES[spaced]!;
  }
  // Prefer first alias match among underscore-separated tokens (e.g. "Job Offer").
  for (const part of spaced.split('_')) {
    if (!part) continue;
    if (isDecisionIntent(part)) return part;
    if (part in DECISION_INTENT_ALIASES) {
      return DECISION_INTENT_ALIASES[part]!;
    }
  }
  return 'other';
}

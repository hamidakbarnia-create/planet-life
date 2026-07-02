/**
 * Relationship intelligence profiles — interpretation, weighting, and presentation
 * for synastry. Aspect detection stays in synergy.ts; profiles shape how the same
 * cross-chart data is scored, reasoned about, and surfaced.
 */

import {
  resolveRelationshipProfileStrict,
} from './relationship-profile-validation';

export { RelationshipProfileValidationError } from './relationship-profile-validation';
export {
  resolveRelationshipProfileStrict,
  type ResolveRelationshipProfileResult,
} from './relationship-profile-validation';

export const SYNASTRY_PLANETS = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
] as const;

export type SynastryPlanet = (typeof SYNASTRY_PLANETS)[number];

export type RelationshipProfileKey =
  | 'spouse'
  | 'romantic_partner'
  | 'business_partner'
  | 'cofounder'
  | 'employee'
  | 'employer'
  | 'friend'
  | 'family'
  | 'parent_child'
  | 'mentor'
  | 'investor'
  | 'client';

/** Stored on Person — extended labels map to scoring profiles via aliases. */
export type RelationshipType =
  | RelationshipProfileKey
  | 'mother'
  | 'father'
  | 'brother'
  | 'sister'
  | 'son'
  | 'daughter'
  | 'professional'
  | 'colleague'
  | 'competitor'
  | 'rival';

/** Ordered options shown when adding/editing a person. */
export const RELATIONSHIP_PICKER_TYPES: RelationshipType[] = [
  'spouse',
  'romantic_partner',
  'mother',
  'father',
  'brother',
  'sister',
  'son',
  'daughter',
  'family',
  'friend',
  'professional',
  'business_partner',
  'investor',
  'client',
  'colleague',
  'mentor',
  'competitor',
];

export type ReasoningCategory =
  | 'emotional_bond'
  | 'stability'
  | 'communication'
  | 'power_dynamic'
  | 'shared_goals'
  | 'trust'
  | 'chemistry'
  | 'boundaries'
  | 'growth'
  | 'practical_fit';

export type InsightSectionKey = ReasoningCategory;

export interface InsightSectionDef {
  key: InsightSectionKey;
  planets: readonly SynastryPlanet[];
  harmonyWeight: number;
  tensionWeight: number;
}

export interface RecommendationTemplates {
  aligned: readonly string[];
  caution: readonly string[];
  tension: readonly string[];
}

/** Semantic meeting actions for relationship-aware electional timing. */
export type RelationshipMeetingActionType =
  | 'romantic_meeting'
  | 'relationship_repair'
  | 'shared_life_planning'
  | 'social_meeting'
  | 'mentorship_session'
  | 'family_discussion'
  | 'investor_pitch'
  | 'client_meeting'
  | 'cofounder_planning'
  | 'negotiation'
  | 'business_launch'
  | 'hiring'
  | 'investment'
  | 'contract_signing'
  | 'networking';

export interface RelationshipProfile {
  key: RelationshipProfileKey;
  label: string;
  /** Ordered scoring priorities — first items weigh most in featured reasoning. */
  scoringPriorities: readonly ReasoningCategory[];
  weightedPlanets: Readonly<Record<string, number>>;
  weightedHouses: Readonly<Record<number, number>>;
  weightedAspects: {
    harmony: Readonly<Record<string, number>>;
    tension: Readonly<Record<string, number>>;
  };
  reasoningCategories: readonly ReasoningCategory[];
  insightSections: readonly InsightSectionDef[];
  recommendationTemplates: RecommendationTemplates;
  preferredMeetingActionType: RelationshipMeetingActionType;
  fallbackMeetingActionType: RelationshipMeetingActionType;
  baseScore: number;
}

const DEFAULT_HARMONY_ASPECTS: Record<string, number> = {
  trine: 8,
  sextile: 6,
  conjunction: 5,
};

const DEFAULT_TENSION_ASPECTS: Record<string, number> = {
  square: 8,
  opposition: 7,
};

const DEFAULT_PLANET_WEIGHTS: Record<string, number> = {
  sun: 10,
  moon: 10,
  venus: 9,
  mars: 8,
  saturn: 9,
  jupiter: 6,
  mercury: 5,
};

function section(
  key: InsightSectionKey,
  planets: readonly SynastryPlanet[],
  harmonyWeight = 11,
  tensionWeight = 12
): InsightSectionDef {
  return { key, planets, harmonyWeight, tensionWeight };
}

function planets(
  weights: Partial<Record<SynastryPlanet, number>>
): Record<string, number> {
  const out: Record<string, number> = { ...DEFAULT_PLANET_WEIGHTS };
  for (const [k, v] of Object.entries(weights)) {
    if (v != null) out[k] = v;
  }
  return out;
}

function houses(...entries: [number, number][]): Record<number, number> {
  return Object.fromEntries(entries);
}

function meetingActions(
  preferred: RelationshipMeetingActionType,
  fallback: RelationshipMeetingActionType
): Pick<RelationshipProfile, 'preferredMeetingActionType' | 'fallbackMeetingActionType'> {
  return { preferredMeetingActionType: preferred, fallbackMeetingActionType: fallback };
}

const SPOUSE_SECTIONS: InsightSectionDef[] = [
  section('emotional_bond', ['moon', 'venus', 'sun'], 12, 13),
  section('stability', ['saturn', 'sun', 'moon'], 11, 12),
  section('trust', ['saturn', 'jupiter', 'venus'], 10, 11),
];

export const RELATIONSHIP_PROFILES: Record<RelationshipProfileKey, RelationshipProfile> = {
  spouse: {
    key: 'spouse',
    label: 'Spouse',
    scoringPriorities: ['emotional_bond', 'stability', 'trust', 'communication'],
    weightedPlanets: planets({ moon: 12, venus: 11, saturn: 10, sun: 9 }),
    weightedHouses: houses([4, 1.0], [7, 1.0], [8, 0.6]),
    weightedAspects: {
      harmony: { ...DEFAULT_HARMONY_ASPECTS, conjunction: 6 },
      tension: DEFAULT_TENSION_ASPECTS,
    },
    reasoningCategories: ['emotional_bond', 'stability', 'trust', 'communication', 'boundaries'],
    insightSections: SPOUSE_SECTIONS,
    recommendationTemplates: {
      aligned: [
        'Protect weekly rituals that keep tenderness alive alongside duty.',
        'Name appreciation aloud — Saturn bonds deepen when warmth is explicit.',
      ],
      caution: [
        'Slow down before discussing logistics when feelings are unspoken.',
        'Check whether care is landing as support, not management.',
      ],
      tension: [
        'Agree on one repair gesture after friction — loyalty needs repair, not silence.',
        'Separate household logistics from emotional bids; tackle them in different conversations.',
      ],
    },
    ...meetingActions('shared_life_planning', 'relationship_repair'),
    baseScore: 50,
  },

  romantic_partner: {
    key: 'romantic_partner',
    label: 'Romantic partner',
    scoringPriorities: ['chemistry', 'emotional_bond', 'communication', 'growth'],
    weightedPlanets: planets({ venus: 12, mars: 11, moon: 10, sun: 8 }),
    weightedHouses: houses([5, 1.0], [7, 0.9], [8, 0.8]),
    weightedAspects: {
      harmony: { trine: 9, sextile: 7, conjunction: 6 },
      tension: { square: 7, opposition: 6 },
    },
    reasoningCategories: ['chemistry', 'emotional_bond', 'communication', 'boundaries', 'growth'],
    insightSections: [
      section('chemistry', ['venus', 'mars', 'moon'], 13, 11),
      section('emotional_bond', ['moon', 'venus', 'sun'], 12, 12),
      section('communication', ['mercury', 'moon', 'venus'], 10, 11),
    ],
    recommendationTemplates: {
      aligned: [
        'Keep curiosity alive — plan something playful that is not about the relationship status.',
        'Celebrate small gestures; chemistry sustains through noticing, not grand events.',
      ],
      caution: [
        'Pace desire and comfort — name what feels exciting versus overwhelming.',
        'Do not keep score of who initiated affection last.',
      ],
      tension: [
        'Pause before sarcasm when spark turns sharp.',
        'Take space before the hard talk, then return with one clear need.',
      ],
    },
    ...meetingActions('romantic_meeting', 'relationship_repair'),
    baseScore: 52,
  },

  business_partner: {
    key: 'business_partner',
    label: 'Business partner',
    scoringPriorities: ['shared_goals', 'trust', 'communication', 'practical_fit'],
    weightedPlanets: planets({ mercury: 12, saturn: 11, jupiter: 10, sun: 9 }),
    weightedHouses: houses([10, 1.0], [7, 0.9], [11, 0.8], [2, 0.7]),
    weightedAspects: {
      harmony: { trine: 7, sextile: 6, conjunction: 5 },
      tension: { square: 9, opposition: 8 },
    },
    reasoningCategories: ['shared_goals', 'trust', 'communication', 'power_dynamic', 'practical_fit'],
    insightSections: [
      section('shared_goals', ['sun', 'jupiter', 'saturn'], 11, 12),
      section('trust', ['saturn', 'jupiter', 'mercury'], 10, 13),
      section('communication', ['mercury', 'moon', 'sun'], 11, 11),
    ],
    recommendationTemplates: {
      aligned: [
        'Document decisions while momentum is high — clarity now prevents drift later.',
        'Schedule a monthly alignment check on priorities and risk tolerance.',
      ],
      caution: [
        'Separate friendship warmth from governance — agree how you decide under stress.',
        'Name assumptions before they become silent resentments about fairness.',
      ],
      tension: [
        'Use a neutral facilitator for high-stakes negotiations this week.',
        'Write down each person\'s non-negotiables before the next working session.',
      ],
    },
    ...meetingActions('negotiation', 'client_meeting'),
    baseScore: 48,
  },

  cofounder: {
    key: 'cofounder',
    label: 'Co-founder',
    scoringPriorities: ['shared_goals', 'power_dynamic', 'stability', 'trust'],
    weightedPlanets: planets({ sun: 12, mars: 11, jupiter: 10, saturn: 10, mercury: 9 }),
    weightedHouses: houses([10, 1.0], [1, 0.9], [11, 0.9], [6, 0.7]),
    weightedAspects: {
      harmony: { trine: 7, sextile: 6, conjunction: 6 },
      tension: { square: 9, opposition: 8 },
    },
    reasoningCategories: ['shared_goals', 'power_dynamic', 'stability', 'trust', 'growth'],
    insightSections: [
      section('shared_goals', ['sun', 'mars', 'jupiter'], 12, 13),
      section('power_dynamic', ['sun', 'mars', 'saturn'], 11, 14),
      section('stability', ['saturn', 'jupiter', 'sun'], 10, 12),
    ],
    recommendationTemplates: {
      aligned: [
        'Ship one visible win together this week — shared momentum compounds trust.',
        'Clarify decision rights while collaboration feels easy.',
      ],
      caution: [
        'Watch for competing visions dressed as execution disagreements.',
        'Pause before equity-or-control conversations when tired.',
      ],
      tension: [
        'Bring roles and decision rights back to writing before the next sprint.',
        'Use an advisor for deadlocks — co-founder friction needs structure, not volume.',
      ],
    },
    ...meetingActions('cofounder_planning', 'business_launch'),
    baseScore: 47,
  },

  employee: {
    key: 'employee',
    label: 'Employee',
    scoringPriorities: ['practical_fit', 'communication', 'boundaries', 'growth'],
    weightedPlanets: planets({ mercury: 12, saturn: 10, moon: 9, jupiter: 8 }),
    weightedHouses: houses([6, 1.0], [10, 0.8], [3, 0.7]),
    weightedAspects: {
      harmony: DEFAULT_HARMONY_ASPECTS,
      tension: { square: 8, opposition: 7 },
    },
    reasoningCategories: ['practical_fit', 'communication', 'boundaries', 'growth', 'trust'],
    insightSections: [
      section('practical_fit', ['mercury', 'saturn', 'sun'], 11, 11),
      section('communication', ['mercury', 'moon'], 12, 10),
      section('boundaries', ['saturn', 'mars', 'moon'], 9, 12),
    ],
    recommendationTemplates: {
      aligned: [
        'Give clear scope and feedback loops — reliability thrives with visible expectations.',
        'Recognize specific contributions; generic praise lands flat.',
      ],
      caution: [
        'Check whether ambiguity reads as mistrust on their side.',
        'Clarify autonomy versus approval before deadlines tighten.',
      ],
      tension: [
        'Reset roles in writing after a tense exchange.',
        'Use one-on-one time for repair before group accountability.',
      ],
    },
    ...meetingActions('hiring', 'negotiation'),
    baseScore: 50,
  },

  employer: {
    key: 'employer',
    label: 'Employer',
    scoringPriorities: ['power_dynamic', 'stability', 'trust', 'practical_fit'],
    weightedPlanets: planets({ saturn: 12, sun: 11, jupiter: 9, mercury: 8 }),
    weightedHouses: houses([10, 1.0], [6, 0.9], [2, 0.7]),
    weightedAspects: {
      harmony: { trine: 7, sextile: 6, conjunction: 5 },
      tension: { square: 9, opposition: 8 },
    },
    reasoningCategories: ['power_dynamic', 'stability', 'trust', 'boundaries', 'practical_fit'],
    insightSections: [
      section('power_dynamic', ['saturn', 'sun', 'mars'], 10, 13),
      section('stability', ['saturn', 'jupiter', 'sun'], 11, 11),
      section('trust', ['saturn', 'jupiter', 'mercury'], 10, 12),
    ],
    recommendationTemplates: {
      aligned: [
        'Ask what support would make their best work sustainable.',
        'Offer predictability on priorities — authority feels safer with context.',
      ],
      caution: [
        'Do not conflate respect with agreement; dissent may be loyalty.',
        'Name promotion or growth paths before performance reviews.',
      ],
      tension: [
        'Separate performance feedback from identity — critique the work, not the person.',
        'Bring a neutral HR or peer into recurring friction.',
      ],
    },
    ...meetingActions('negotiation', 'hiring'),
    baseScore: 49,
  },

  friend: {
    key: 'friend',
    label: 'Friend',
    scoringPriorities: ['emotional_bond', 'communication', 'growth', 'boundaries'],
    weightedPlanets: planets({ moon: 11, mercury: 10, jupiter: 9, venus: 8 }),
    weightedHouses: houses([11, 1.0], [3, 0.8], [5, 0.7]),
    weightedAspects: {
      harmony: { trine: 9, sextile: 7, conjunction: 5 },
      tension: { square: 6, opposition: 6 },
    },
    reasoningCategories: ['emotional_bond', 'communication', 'growth', 'boundaries', 'chemistry'],
    insightSections: [
      section('emotional_bond', ['moon', 'venus', 'sun'], 12, 10),
      section('communication', ['mercury', 'moon', 'jupiter'], 11, 10),
      section('growth', ['jupiter', 'sun', 'mercury'], 10, 9),
    ],
    recommendationTemplates: {
      aligned: [
        'Keep a light recurring ritual — friendship deepens through repetition, not intensity.',
        'Share one honest appreciation; friends rarely hear what lands.',
      ],
      caution: [
        'Do not over-function as therapist — offer presence before advice.',
        'Check whether busyness is masking distance.',
      ],
      tension: [
        'Name the rupture directly; friendships repair faster with plain language.',
        'Take a walk before revisiting a sensitive topic.',
      ],
    },
    ...meetingActions('social_meeting', 'networking'),
    baseScore: 52,
  },

  family: {
    key: 'family',
    label: 'Family',
    scoringPriorities: ['emotional_bond', 'stability', 'boundaries', 'communication'],
    weightedPlanets: planets({ moon: 12, sun: 10, saturn: 9, jupiter: 8 }),
    weightedHouses: houses([4, 1.0], [3, 0.8], [10, 0.6]),
    weightedAspects: {
      harmony: { trine: 8, sextile: 6, conjunction: 6 },
      tension: { square: 8, opposition: 7 },
    },
    reasoningCategories: ['emotional_bond', 'stability', 'boundaries', 'communication', 'trust'],
    insightSections: [
      section('emotional_bond', ['moon', 'sun', 'venus'], 12, 12),
      section('stability', ['saturn', 'jupiter', 'moon'], 11, 11),
      section('boundaries', ['saturn', 'mars', 'mercury'], 9, 13),
    ],
    recommendationTemplates: {
      aligned: [
        'Honor shared history without replaying old roles — update who you are now.',
        'Keep one warm tradition that is not about obligation.',
      ],
      caution: [
        'Notice when helpfulness becomes control.',
        'Pause before holiday-or-obligation conversations when tired.',
      ],
      tension: [
        'Set time limits on hard topics; family repair needs breaks.',
        'Use "I need" language instead of revisiting old verdicts.',
      ],
    },
    ...meetingActions('family_discussion', 'relationship_repair'),
    baseScore: 50,
  },

  parent_child: {
    key: 'parent_child',
    label: 'Parent / child',
    scoringPriorities: ['emotional_bond', 'boundaries', 'growth', 'communication'],
    weightedPlanets: planets({ moon: 12, saturn: 11, sun: 10, mercury: 8 }),
    weightedHouses: houses([4, 1.0], [5, 0.8], [10, 0.7]),
    weightedAspects: {
      harmony: { trine: 8, sextile: 6, conjunction: 5 },
      tension: { square: 9, opposition: 8 },
    },
    reasoningCategories: ['emotional_bond', 'boundaries', 'growth', 'power_dynamic', 'communication'],
    insightSections: [
      section('emotional_bond', ['moon', 'sun', 'venus'], 12, 11),
      section('boundaries', ['saturn', 'mars', 'sun'], 10, 14),
      section('growth', ['jupiter', 'mercury', 'sun'], 11, 10),
    ],
    recommendationTemplates: {
      aligned: [
        'Celebrate autonomy milestones — the bond strengthens when roles evolve.',
        'Keep one channel that is not about tasks or advice.',
      ],
      caution: [
        'Watch for guilt or obligation masquerading as love.',
        'Slow down advice-giving; ask what support they want first.',
      ],
      tension: [
        'Separate respect from agreement — repair may need a mediator.',
        'Agree on pause words before generational patterns escalate.',
      ],
    },
    ...meetingActions('family_discussion', 'relationship_repair'),
    baseScore: 49,
  },

  mentor: {
    key: 'mentor',
    label: 'Mentor',
    scoringPriorities: ['growth', 'trust', 'communication', 'boundaries'],
    weightedPlanets: planets({ jupiter: 12, saturn: 11, mercury: 10, sun: 8 }),
    weightedHouses: houses([9, 1.0], [3, 0.8], [10, 0.7]),
    weightedAspects: {
      harmony: { trine: 8, sextile: 7, conjunction: 5 },
      tension: { square: 7, opposition: 7 },
    },
    reasoningCategories: ['growth', 'trust', 'communication', 'boundaries', 'power_dynamic'],
    insightSections: [
      section('growth', ['jupiter', 'sun', 'mercury'], 12, 9),
      section('trust', ['saturn', 'jupiter', 'mercury'], 11, 10),
      section('communication', ['mercury', 'moon', 'jupiter'], 11, 10),
    ],
    recommendationTemplates: {
      aligned: [
        'Set one concrete growth goal for the next month — mentorship needs direction.',
        'Exchange feedback both ways; the bond stays alive when learning is mutual.',
      ],
      caution: [
        'Clarify availability — boundaries protect the relationship long-term.',
        'Do not confuse admiration with agreement on life choices.',
      ],
      tension: [
        'Revisit expectations of access and response time.',
        'Use structured sessions instead of ad-hoc emotional labor.',
      ],
    },
    ...meetingActions('mentorship_session', 'networking'),
    baseScore: 51,
  },

  investor: {
    key: 'investor',
    label: 'Investor',
    scoringPriorities: ['trust', 'shared_goals', 'practical_fit', 'power_dynamic'],
    weightedPlanets: planets({ jupiter: 12, saturn: 11, mercury: 10, sun: 9 }),
    weightedHouses: houses([2, 1.0], [8, 0.9], [11, 0.8], [10, 0.7]),
    weightedAspects: {
      harmony: { trine: 7, sextile: 6, conjunction: 5 },
      tension: { square: 9, opposition: 8 },
    },
    reasoningCategories: ['trust', 'shared_goals', 'practical_fit', 'power_dynamic', 'stability'],
    insightSections: [
      section('trust', ['saturn', 'jupiter', 'mercury'], 11, 13),
      section('shared_goals', ['sun', 'jupiter', 'saturn'], 11, 12),
      section('practical_fit', ['mercury', 'saturn', 'jupiter'], 10, 11),
    ],
    recommendationTemplates: {
      aligned: [
        'Lead with metrics and milestones — confidence grows with visible execution.',
        'Schedule proactive updates before they ask; trust is rhythm as much as results.',
      ],
      caution: [
        'Align on risk appetite before capital decisions accelerate.',
        'Do not oversell vision when they need operational proof.',
      ],
      tension: [
        'Bring third-party validation to the next conversation.',
        'Separate personal rapport from fiduciary expectations in writing.',
      ],
    },
    ...meetingActions('investor_pitch', 'investment'),
    baseScore: 47,
  },

  client: {
    key: 'client',
    label: 'Client',
    scoringPriorities: ['practical_fit', 'communication', 'trust', 'boundaries'],
    weightedPlanets: planets({ mercury: 12, venus: 10, saturn: 10, jupiter: 8 }),
    weightedHouses: houses([7, 1.0], [2, 0.8], [6, 0.7]),
    weightedAspects: {
      harmony: { trine: 7, sextile: 6, conjunction: 5 },
      tension: { square: 8, opposition: 7 },
    },
    reasoningCategories: ['practical_fit', 'communication', 'trust', 'boundaries', 'shared_goals'],
    insightSections: [
      section('practical_fit', ['mercury', 'venus', 'saturn'], 11, 11),
      section('communication', ['mercury', 'moon'], 12, 10),
      section('trust', ['saturn', 'jupiter', 'venus'], 10, 12),
    ],
    recommendationTemplates: {
      aligned: [
        'Confirm scope and success criteria in writing while rapport is strong.',
        'Offer one proactive insight they did not ask for — value builds loyalty.',
      ],
      caution: [
        'Clarify revision limits and timelines before enthusiasm commits you.',
        'Watch tone under deadline pressure — clients remember how stress felt.',
      ],
      tension: [
        'Move difficult topics to a call; text amplifies client friction.',
        'Reset expectations with a written change order, not verbal assurances.',
      ],
    },
    ...meetingActions('client_meeting', 'contract_signing'),
    baseScore: 48,
  },
};

/** Throws on unknown types — use resolveRelationshipProfileStrict when handling errors explicitly. */
export function resolveRelationshipProfile(
  type: RelationshipType | string | null | undefined
): RelationshipProfile {
  const result = resolveRelationshipProfileStrict(type);
  if (!result.ok) {
    throw result.error;
  }
  return result.profile;
}

export function resolveMeetingActionType(
  profile: RelationshipProfile,
  tier: 'preferred' | 'fallback' = 'preferred'
): RelationshipMeetingActionType {
  return tier === 'preferred'
    ? profile.preferredMeetingActionType
    : profile.fallbackMeetingActionType;
}

export function relationshipProfileKeys(): RelationshipProfileKey[] {
  return Object.keys(RELATIONSHIP_PROFILES) as RelationshipProfileKey[];
}

export function planetSynastryWeight(
  profile: RelationshipProfile,
  planetA: string,
  planetB: string
): number {
  const wa = profile.weightedPlanets[planetA] ?? DEFAULT_PLANET_WEIGHTS[planetA] ?? 4;
  const wb = profile.weightedPlanets[planetB] ?? DEFAULT_PLANET_WEIGHTS[planetB] ?? 4;
  return Math.max(wa, wb);
}

export function aspectSynastryWeight(
  profile: RelationshipProfile,
  aspect: string,
  tone: 'harmony' | 'tension'
): number {
  const table =
    tone === 'harmony' ? profile.weightedAspects.harmony : profile.weightedAspects.tension;
  const fallback = tone === 'harmony' ? 4 : 6;
  return table[aspect] ?? (tone === 'harmony' ? DEFAULT_HARMONY_ASPECTS[aspect] : DEFAULT_TENSION_ASPECTS[aspect]) ?? fallback;
}

export function pickProfileRecommendations(
  profile: RelationshipProfile,
  badge: 'aligned' | 'caution' | 'tension'
): string[] {
  return [...profile.recommendationTemplates[badge]];
}

/**
 * Relationship profile validation — domain language guards and strict resolution.
 */

import {
  RELATIONSHIP_PROFILES,
  type RelationshipProfile,
  type RelationshipProfileKey,
  type RelationshipType,
} from './relationship-profile';
import { buildSynastryReasoning } from './synastry-reasoning';
import type { SynastryAspect } from './synergy';

export type ProfileLanguageGroup = 'business' | 'romantic' | 'professional' | 'family';

export const PROFILE_LANGUAGE_GROUPS: Record<ProfileLanguageGroup, readonly RelationshipProfileKey[]> = {
  business: ['business_partner', 'cofounder', 'investor', 'client'],
  romantic: ['spouse', 'romantic_partner'],
  professional: ['employee', 'employer'],
  family: ['parent_child', 'family'],
};

const FORBIDDEN_BY_GROUP: Record<ProfileLanguageGroup, RegExp> = {
  business: /\b(romance|romantic|sexual|sexuality|marriage|wedding|spouse|children|childbearing|intimacy|passion|seduction|lover|honeymoon)\b/i,
  romantic: /\b(equity stake|investor|board of directors|board seat|cash management|cap table|fiduciary|pitch deck|shareholder|venture capital|vc funding|term sheet)\b/i,
  professional: /\b(romance|romantic|sexual|marriage|wedding|spouse|family reunion|parenting|lover|intimacy)\b/i,
  family: /\b(sexual|sexuality|seduction|investor|equity stake|pitch deck|venture capital|cap table|board seat)\b/i,
};

export class RelationshipProfileValidationError extends Error {
  readonly code: 'UNKNOWN_RELATIONSHIP_PROFILE' | 'MISSING_RELATIONSHIP_TYPE';

  constructor(code: RelationshipProfileValidationError['code'], message: string) {
    super(message);
    this.name = 'RelationshipProfileValidationError';
    this.code = code;
  }
}

export type ResolveRelationshipProfileResult =
  | { ok: true; profile: RelationshipProfile; source: 'known' | 'legacy_alias' }
  | { ok: false; error: RelationshipProfileValidationError };

const RELATIONSHIP_TYPE_ALIASES: Record<string, RelationshipProfileKey> = {
  rival: 'business_partner',
  competitor: 'business_partner',
  mother: 'parent_child',
  father: 'parent_child',
  son: 'parent_child',
  daughter: 'parent_child',
  brother: 'family',
  sister: 'family',
  colleague: 'employee',
  professional: 'employer',
};

function normalizeRelationshipType(type: string): string {
  return type.trim().toLowerCase().replace(/-/g, '_').replace(/ /g, '_');
}

/** Strict resolver — unknown types fail; only explicit legacy aliases are remapped. */
export function resolveRelationshipProfileStrict(
  type: RelationshipType | string | null | undefined
): ResolveRelationshipProfileResult {
  if (type == null || String(type).trim() === '') {
    return {
      ok: false,
      error: new RelationshipProfileValidationError(
        'MISSING_RELATIONSHIP_TYPE',
        'Relationship type is required.'
      ),
    };
  }

  const raw = normalizeRelationshipType(String(type));

  if (raw in RELATIONSHIP_TYPE_ALIASES) {
    return {
      ok: true,
      profile: RELATIONSHIP_PROFILES[RELATIONSHIP_TYPE_ALIASES[raw]],
      source: 'legacy_alias',
    };
  }

  if (raw in RELATIONSHIP_PROFILES) {
    return {
      ok: true,
      profile: RELATIONSHIP_PROFILES[raw as RelationshipProfileKey],
      source: 'known',
    };
  }

  return {
    ok: false,
    error: new RelationshipProfileValidationError(
      'UNKNOWN_RELATIONSHIP_PROFILE',
      `Unknown relationship profile: ${type}`
    ),
  };
}

export function collectProfileLanguage(profile: RelationshipProfile): string {
  const chunks: string[] = [
    profile.label,
    ...profile.scoringPriorities,
    ...profile.reasoningCategories,
    ...profile.insightSections.map((s) => s.key),
    ...profile.recommendationTemplates.aligned,
    ...profile.recommendationTemplates.caution,
    ...profile.recommendationTemplates.tension,
  ];
  return chunks.join('\n');
}

export function findForbiddenLanguage(
  profile: RelationshipProfile,
  extraText = ''
): { group: ProfileLanguageGroup; match: string }[] {
  const text = `${collectProfileLanguage(profile)}\n${extraText}`;
  const hits: { group: ProfileLanguageGroup; match: string }[] = [];

  for (const [group, keys] of Object.entries(PROFILE_LANGUAGE_GROUPS) as Array<
    [ProfileLanguageGroup, readonly RelationshipProfileKey[]]
  >) {
    if (!keys.includes(profile.key)) continue;
    const pattern = FORBIDDEN_BY_GROUP[group];
    const match = text.match(pattern);
    if (match?.[0]) {
      hits.push({ group, match: match[0] });
    }
  }

  return hits;
}

export function profileAllowsRomanticDeepCopy(profile: RelationshipProfile): boolean {
  return (
    profile.key === 'spouse' ||
    profile.key === 'romantic_partner' ||
    profile.key === 'friend' ||
    profile.key === 'family' ||
    profile.key === 'parent_child'
  );
}

export function sampleReasoningLanguage(
  profile: RelationshipProfile,
  harmony: SynastryAspect[],
  tension: SynastryAspect[]
): string {
  const reasoning = buildSynastryReasoning(profile, 60, harmony, tension);
  return [
    reasoning.summary,
    ...reasoning.reasons.map((r) => `${r.title}\n${r.explanation}`),
  ].join('\n');
}

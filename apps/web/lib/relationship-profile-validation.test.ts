import { describe, expect, it } from 'vitest';
import { computeSynastry } from './synergy';
import {
  RELATIONSHIP_PROFILES,
  resolveRelationshipProfile,
  resolveMeetingActionType,
  relationshipProfileKeys,
  pickProfileRecommendations,
} from './relationship-profile';
import {
  findForbiddenLanguage,
  PROFILE_LANGUAGE_GROUPS,
  resolveRelationshipProfileStrict,
  RelationshipProfileValidationError,
  sampleReasoningLanguage,
} from './relationship-profile-validation';
import { buildSynastryReasoning } from './synastry-reasoning';
import { computeProfileInsightAreas } from './synastry-i18n';

const CHART_A = {
  sun: { longitude: 10 },
  moon: { longitude: 95 },
  mercury: { longitude: 25 },
  venus: { longitude: 40 },
  mars: { longitude: 120 },
  jupiter: { longitude: 200 },
  saturn: { longitude: 300 },
};

const CHART_B = {
  sun: { longitude: 12 },
  moon: { longitude: 98 },
  mercury: { longitude: 30 },
  venus: { longitude: 130 },
  mars: { longitude: 125 },
  jupiter: { longitude: 205 },
  saturn: { longitude: 295 },
};

describe('relationship profile meeting actions', () => {
  it('uses domain-specific preferred actions for romantic profiles', () => {
    expect(RELATIONSHIP_PROFILES.spouse.preferredMeetingActionType).toBe('shared_life_planning');
    expect(RELATIONSHIP_PROFILES.spouse.fallbackMeetingActionType).toBe('relationship_repair');
    expect(RELATIONSHIP_PROFILES.romantic_partner.preferredMeetingActionType).toBe('romantic_meeting');
    expect(RELATIONSHIP_PROFILES.romantic_partner.fallbackMeetingActionType).toBe('relationship_repair');
  });

  it('does not use negotiation as preferred for spouse or romantic partner', () => {
    for (const key of ['spouse', 'romantic_partner'] as const) {
      expect(RELATIONSHIP_PROFILES[key].preferredMeetingActionType).not.toBe('negotiation');
    }
  });

  it('maps professional and business profiles to semantic meeting actions', () => {
    expect(resolveMeetingActionType(RELATIONSHIP_PROFILES.investor, 'preferred')).toBe('investor_pitch');
    expect(resolveMeetingActionType(RELATIONSHIP_PROFILES.client, 'preferred')).toBe('client_meeting');
    expect(resolveMeetingActionType(RELATIONSHIP_PROFILES.cofounder, 'preferred')).toBe('cofounder_planning');
    expect(resolveMeetingActionType(RELATIONSHIP_PROFILES.mentor, 'preferred')).toBe('mentorship_session');
  });
});

describe('relationship profile strict resolution', () => {
  it('maps legacy rival via explicit legacy alias only', () => {
    const result = resolveRelationshipProfileStrict('rival');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.source).toBe('legacy_alias');
      expect(result.profile.key).toBe('business_partner');
    }
  });

  it('maps extended relationship types to scoring profiles', () => {
    expect(resolveRelationshipProfileStrict('mother').ok).toBe(true);
    if (resolveRelationshipProfileStrict('mother').ok) {
      expect(resolveRelationshipProfileStrict('mother').profile.key).toBe('parent_child');
    }
    expect(resolveRelationshipProfileStrict('colleague').profile?.key).toBe('employee');
    expect(resolveRelationshipProfileStrict('professional').profile?.key).toBe('employer');
    expect(resolveRelationshipProfileStrict('competitor').profile?.key).toBe('business_partner');
    expect(resolveRelationshipProfileStrict('sister').profile?.key).toBe('family');
  });

  it('rejects unknown profiles instead of falling back to friend or romantic', () => {
    const unknown = resolveRelationshipProfileStrict('mystery_connection');
    expect(unknown.ok).toBe(false);
    if (!unknown.ok) {
      expect(unknown.error.code).toBe('UNKNOWN_RELATIONSHIP_PROFILE');
    }

    const missing = resolveRelationshipProfileStrict(null);
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.error.code).toBe('MISSING_RELATIONSHIP_TYPE');
    }
  });

  it('throws on unknown profile when using resolveRelationshipProfile', () => {
    expect(() => resolveRelationshipProfile('not_a_profile')).toThrow(
      RelationshipProfileValidationError
    );
  });
});

describe('relationship profile differentiation', () => {
  it('differentiates spouse vs business_partner on score, sections, and recommendations', () => {
    const spouse = RELATIONSHIP_PROFILES.spouse;
    const business = RELATIONSHIP_PROFILES.business_partner;

    const spouseSyn = computeSynastry(CHART_A, CHART_B, spouse);
    const businessSyn = computeSynastry(CHART_A, CHART_B, business);
    expect(spouseSyn.score).not.toBe(businessSyn.score);

    const spouseAreas = computeProfileInsightAreas('en', spouse, spouseSyn.harmony, spouseSyn.tension);
    const businessAreas = computeProfileInsightAreas('en', business, businessSyn.harmony, businessSyn.tension);
    expect(spouseAreas.map((a) => a.key)).not.toEqual(businessAreas.map((a) => a.key));

    const spouseRecs = pickProfileRecommendations(spouse, 'aligned');
    const businessRecs = pickProfileRecommendations(business, 'aligned');
    expect(spouseRecs.join(' ')).not.toEqual(businessRecs.join(' '));
  });
});

describe('relationship profile forbidden language', () => {
  it('keeps business profiles free of romantic or family-intimacy language', () => {
    for (const key of PROFILE_LANGUAGE_GROUPS.business) {
      const profile = RELATIONSHIP_PROFILES[key];
      const syn = computeSynastry(CHART_A, CHART_B, profile);
      const reasoningText = sampleReasoningLanguage(profile, syn.harmony, syn.tension);
      const hits = findForbiddenLanguage(profile, reasoningText);
      expect(hits, `${key} leaked: ${hits.map((h) => h.match).join(', ')}`).toEqual([]);
    }
  });

  it('keeps romantic profiles free of investor and board language', () => {
    for (const key of PROFILE_LANGUAGE_GROUPS.romantic) {
      const profile = RELATIONSHIP_PROFILES[key];
      const hits = findForbiddenLanguage(profile);
      expect(hits, `${key} leaked: ${hits.map((h) => h.match).join(', ')}`).toEqual([]);
    }
  });

  it('keeps professional hierarchy profiles free of romance and family language', () => {
    for (const key of PROFILE_LANGUAGE_GROUPS.professional) {
      const profile = RELATIONSHIP_PROFILES[key];
      const hits = findForbiddenLanguage(profile);
      expect(hits, `${key} leaked: ${hits.map((h) => h.match).join(', ')}`).toEqual([]);
    }
  });

  it('keeps family profiles free of sexual and investor language', () => {
    for (const key of PROFILE_LANGUAGE_GROUPS.family) {
      const profile = RELATIONSHIP_PROFILES[key];
      const hits = findForbiddenLanguage(profile);
      expect(hits, `${key} leaked: ${hits.map((h) => h.match).join(', ')}`).toEqual([]);
    }
  });
});

describe('relationship profiles baseline', () => {
  it('defines all twelve profile keys', () => {
    expect(relationshipProfileKeys()).toHaveLength(12);
  });

  it('builds profile-specific reasoning', () => {
    const profile = RELATIONSHIP_PROFILES.cofounder;
    const syn = computeSynastry(CHART_A, CHART_B, profile);
    const reasoning = buildSynastryReasoning(profile, syn.score, syn.harmony, syn.tension);
    expect(reasoning.profileKey).toBe('cofounder');
    expect(reasoning.summary).toContain('Co-founder');
  });
});

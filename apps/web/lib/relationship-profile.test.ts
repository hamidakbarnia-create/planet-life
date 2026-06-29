import { describe, expect, it } from 'vitest';
import { computeSynastry } from './synergy';
import {
  RELATIONSHIP_PROFILES,
  resolveRelationshipProfile,
  relationshipProfileKeys,
} from './relationship-profile';

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

describe('relationship profiles', () => {
  it('defines all twelve profile keys', () => {
    expect(relationshipProfileKeys()).toHaveLength(12);
  });

  it('maps legacy rival to business partner profile', () => {
    expect(resolveRelationshipProfile('rival').key).toBe('business_partner');
  });

  it('produces different scores for different profiles on same charts', () => {
    const spouse = computeSynastry(CHART_A, CHART_B, RELATIONSHIP_PROFILES.spouse);
    const investor = computeSynastry(CHART_A, CHART_B, RELATIONSHIP_PROFILES.investor);
    expect(spouse.score).not.toBe(investor.score);
  });
});

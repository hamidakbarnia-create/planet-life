/**
 * Personal Intelligence Core — focused domain tests.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { BirthProfile } from '@/lib/birth-profile';
import {
  INTELLIGENCE_CORE_VERSION,
  assertAskPayloadPrivacy,
  assessSourceCompleteness,
  buildPersonalIntelligenceProfile,
  clearIntelligenceProfileStorage,
  ensurePersonalIntelligenceProfile,
  fingerprintSourceProfile,
  getDecisionContext,
  getPathfinderRiskContext,
  isProfileStale,
  normalizeSourceProfile,
  regeneratePersonalIntelligenceProfile,
  serializeAskIntelligenceContext,
  validatePersonalIntelligenceProfile,
  PRIMARY_DECISION_STYLES,
  OPPORTUNITY_ZONE_IDS,
} from '@/lib/intelligence';

const sample: BirthProfile = {
  birth_date: '1990-06-15',
  birth_time: '09:30',
  location: 'London',
  action_type: 'business_launch',
};

const fixedNow = '2026-07-20T12:00:00.000Z';

describe('source-profile normalization', () => {
  it('normalizes birth profile without inventing fields', () => {
    const source = normalizeSourceProfile(sample, { decisionHistory: null });
    expect(source.birthDate).toBe('1990-06-15');
    expect(source.birthTime).toBe('09:30');
    expect(source.birthLocationLabel).toBe('London');
    expect(source.currentCity).toBeNull();
  });

  it('lists missing fields for incomplete profiles', () => {
    const source = normalizeSourceProfile(
      { birth_date: '1990-06-15', birth_time: '', location: '', action_type: '' },
      { decisionHistory: null }
    );
    const c = assessSourceCompleteness(source);
    expect(c.complete).toBe(false);
    expect(c.missingFields).toContain('birth_time');
    expect(c.missingFields).toContain('birth_location');
    expect(c.canGeneratePartial).toBe(true);
  });

  it('fingerprint is stable for identical inputs', () => {
    const a = fingerprintSourceProfile(
      normalizeSourceProfile(sample, { decisionHistory: null })
    );
    const b = fingerprintSourceProfile(
      normalizeSourceProfile(sample, { decisionHistory: null })
    );
    expect(a).toBe(b);
  });

  it('fingerprint changes when birth time changes', () => {
    const a = fingerprintSourceProfile(
      normalizeSourceProfile(sample, { decisionHistory: null })
    );
    const b = fingerprintSourceProfile(
      normalizeSourceProfile(
        { ...sample, birth_time: '21:15' },
        { decisionHistory: null }
      )
    );
    expect(a).not.toBe(b);
  });

  it('defaults decision history to zero when not supplied', () => {
    const source = normalizeSourceProfile(sample);
    expect(source.decisionHistoryCount).toBe(0);
    expect(source.hasDecisionHistory).toBe(false);
  });

  it('accepts injected decision-history enrichment without Pathfinder', () => {
    const source = normalizeSourceProfile(sample, {
      decisionHistory: { count: 3 },
    });
    expect(source.decisionHistoryCount).toBe(3);
    expect(source.hasDecisionHistory).toBe(true);
  });

  it('normalizes malformed decision-history counts to zero', () => {
    expect(
      normalizeSourceProfile(sample, { decisionHistory: { count: -1 } })
        .decisionHistoryCount
    ).toBe(0);
    expect(
      normalizeSourceProfile(sample, { decisionHistory: { count: Number.NaN } })
        .decisionHistoryCount
    ).toBe(0);
    expect(
      normalizeSourceProfile(sample, {
        decisionHistory: { count: Number.POSITIVE_INFINITY },
      }).decisionHistoryCount
    ).toBe(0);
    expect(
      normalizeSourceProfile(sample, { decisionHistory: { count: 2.9 } })
        .decisionHistoryCount
    ).toBe(2);
  });

  it('fingerprint does not embed raw location plaintext', () => {
    const fp = fingerprintSourceProfile(
      normalizeSourceProfile(sample, { decisionHistory: null })
    );
    expect(fp.includes('London')).toBe(false);
  });
});

describe('profile generation', () => {
  it('builds a deterministic profile for identical inputs', () => {
    const a = buildPersonalIntelligenceProfile(sample, {
      nowIso: fixedNow,
      decisionHistory: null,
    });
    const b = buildPersonalIntelligenceProfile(sample, {
      nowIso: fixedNow,
      decisionHistory: null,
    });
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(a?.decisionStyle.primaryStyle).toBe(b?.decisionStyle.primaryStyle);
    expect(a?.strengths.map((s) => s.id)).toEqual(b?.strengths.map((s) => s.id));
    expect(a?.personalSummary).toBe(b?.personalSummary);
    expect(a?.profileVersion).toBe(INTELLIGENCE_CORE_VERSION);
  });

  it('uses controlled decision style enums', () => {
    const p = buildPersonalIntelligenceProfile(sample, {
      nowIso: fixedNow,
      decisionHistory: null,
    })!;
    expect(PRIMARY_DECISION_STYLES).toContain(p.decisionStyle.primaryStyle);
    for (const s of p.decisionStyle.secondaryStyles) {
      expect(PRIMARY_DECISION_STYLES).toContain(s);
    }
  });

  it('bounds opportunity scores 0–100 with controlled zones', () => {
    const p = buildPersonalIntelligenceProfile(sample, {
      nowIso: fixedNow,
      decisionHistory: null,
    })!;
    for (const z of p.opportunityZones) {
      expect(OPPORTUNITY_ZONE_IDS).toContain(z.zone);
      expect(z.score).toBeGreaterThanOrEqual(0);
      expect(z.score).toBeLessThanOrEqual(100);
    }
  });

  it('caps strengths and blind spots at 6', () => {
    const p = buildPersonalIntelligenceProfile(sample, {
      nowIso: fixedNow,
      decisionHistory: null,
    })!;
    expect(p.strengths.length).toBeLessThanOrEqual(6);
    expect(p.blindSpots.length).toBeLessThanOrEqual(6);
    expect(p.growthAreas.length).toBeGreaterThanOrEqual(3);
    expect(p.growthAreas.length).toBeLessThanOrEqual(5);
  });

  it('keeps personal summary within 120 words', () => {
    const p = buildPersonalIntelligenceProfile(sample, {
      nowIso: fixedNow,
      decisionHistory: null,
    })!;
    expect(p.personalSummary.trim().split(/\s+/).length).toBeLessThanOrEqual(120);
  });

  it('attaches confidence and evidence', () => {
    const p = buildPersonalIntelligenceProfile(sample, {
      nowIso: fixedNow,
      decisionHistory: null,
    })!;
    expect(['low', 'medium', 'high']).toContain(p.confidence.level);
    expect(p.confidence.score).toBeGreaterThanOrEqual(0);
    expect(p.evidence.length).toBeGreaterThan(0);
    expect(p.decisionStyle.evidence.calculationId).toBeTruthy();
  });
});

describe('missing data behavior', () => {
  it('reduces confidence when birth time is missing', () => {
    const complete = buildPersonalIntelligenceProfile(sample, {
      nowIso: fixedNow,
      decisionHistory: null,
    })!;
    const partial = buildPersonalIntelligenceProfile(
      { ...sample, birth_time: '' },
      { nowIso: fixedNow, decisionHistory: null }
    )!;
    expect(partial.confidence.missingInputs).toContain('birth_time');
    expect(partial.confidence.score).toBeLessThanOrEqual(complete.confidence.score);
  });

  it('reduces confidence when location is missing', () => {
    const partial = buildPersonalIntelligenceProfile(
      { ...sample, location: '' },
      { nowIso: fixedNow, decisionHistory: null }
    )!;
    expect(partial.confidence.missingInputs).toContain('birth_location');
    expect(partial.confidence.level).toBeTruthy();
  });

  it('returns null when birth date is missing', () => {
    expect(
      buildPersonalIntelligenceProfile(
        { ...sample, birth_date: '' },
        { nowIso: fixedNow, decisionHistory: null }
      )
    ).toBeNull();
  });
});

describe('validation', () => {
  it('accepts a valid generated profile', () => {
    const p = buildPersonalIntelligenceProfile(sample, {
      nowIso: fixedNow,
      decisionHistory: null,
    })!;
    expect(validatePersonalIntelligenceProfile(p).ok).toBe(true);
  });

  it('fails when required sections are corrupted', () => {
    const p = buildPersonalIntelligenceProfile(sample, {
      nowIso: fixedNow,
      decisionHistory: null,
    })!;
    const broken = {
      ...p,
      strengths: [],
      personalSummary: '',
    };
    const result = validatePersonalIntelligenceProfile(broken);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});

describe('persistence and invalidation', () => {
  beforeEach(() => {
    localStorage.clear();
    clearIntelligenceProfileStorage();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('persists and rehydrates until fingerprint changes', () => {
    const first = regeneratePersonalIntelligenceProfile(sample)!;
    const second = ensurePersonalIntelligenceProfile(sample);
    expect(second?.profileId).toBe(first.profileId);
    expect(second?.sourceProfileFingerprint).toBe(first.sourceProfileFingerprint);

    const changed = regeneratePersonalIntelligenceProfile({
      ...sample,
      birth_time: '21:15',
    })!;
    expect(changed.sourceProfileFingerprint).not.toBe(first.sourceProfileFingerprint);
  });

  it('marks profile stale when fingerprint diverges', () => {
    const p = regeneratePersonalIntelligenceProfile(sample)!;
    expect(isProfileStale(p, p.sourceProfileFingerprint)).toBe(false);
    expect(isProfileStale(p, 'other-fingerprint')).toBe(true);
  });

  it('no-profile fallback returns null safely', () => {
    expect(ensurePersonalIntelligenceProfile(null)).toBeNull();
    expect(getDecisionContext(null)).toBeNull();
    expect(getPathfinderRiskContext(null)).toBeNull();
  });
});

describe('module selectors', () => {
  beforeEach(() => {
    localStorage.clear();
    regeneratePersonalIntelligenceProfile(sample);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('Pathfinder selector exposes risk orientation and decision styles', () => {
    const ctx = getPathfinderRiskContext();
    expect(ctx).not.toBeNull();
    expect(['cautious', 'balanced', 'bold']).toContain(ctx!.riskOrientation);
    expect(ctx!.decisionStyles.length).toBeGreaterThan(0);
    expect(ctx!.pressureProtocol.length).toBeGreaterThan(0);
  });

  it('Ask selector serializes without raw sensitive data', () => {
    const core = ensurePersonalIntelligenceProfile(sample)!;
    const payload = serializeAskIntelligenceContext(core)!;
    expect(payload.decision_primary).toBeTruthy();
    expect(payload.profile_version).toBe(INTELLIGENCE_CORE_VERSION);
    expect(
      assertAskPayloadPrivacy(payload, [
        'London',
        '1990-06-15',
        '09:30',
        'birth_date',
        'birth_time',
        'timezone',
        'latitude',
        'longitude',
      ])
    ).toBe(true);
    const blob = JSON.stringify(payload);
    expect(blob.includes('London')).toBe(false);
    expect(blob.includes('1990-06-15')).toBe(false);
    expect(blob.includes('09:30')).toBe(false);
    expect(Object.keys(payload).some((k) => /birth|city|coord|tz|user/i.test(k))).toBe(
      false
    );
  });
});

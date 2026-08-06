/**
 * P2.1b-03 Grounding Preparation — unit tests.
 */

import { describe, expect, it } from 'vitest';
import {
  buildDegradedGrounding,
  buildGroundingProvenance,
  buildUnavailableGrounding,
  claimId,
  digestValue,
  GROUNDING_CLAIM_FIELD_PATHS,
  GROUNDING_PROVENANCE_VERSION,
  validateGroundingProvenance,
} from './index';
import {
  CAREER_QUESTION,
  contextFor,
  FIXED_NOW,
  minimalAskResult,
  planFor,
} from './fixtures';

describe('GroundingProvenance build', () => {
  it('builds versioned provenance with evidence + claim containers', () => {
    const context = contextFor();
    const plan = planFor(context);
    const result = minimalAskResult();
    const grounding = buildGroundingProvenance({
      context,
      plan,
      result,
      builtAt: FIXED_NOW,
    });

    expect(grounding.version).toBe(GROUNDING_PROVENANCE_VERSION);
    expect(grounding.builtAt).toBe(FIXED_NOW);
    expect(grounding.status).toBe('used');
    expect(grounding.evidence.length).toBeGreaterThan(0);
    expect(grounding.claims.length).toBeGreaterThan(
      GROUNDING_CLAIM_FIELD_PATHS.length
    );

    const kinds = new Set(grounding.evidence.map((e) => e.kind));
    expect(kinds.has('question')).toBe(true);
    expect(kinds.has('analysis')).toBe(true);
    expect(kinds.has('plan')).toBe(true);
    expect(kinds.has('timing')).toBe(true);
    expect(kinds.has('conversation')).toBe(true);

    const recommendation = grounding.claims.find(
      (c) => c.fieldPath === 'recommendation'
    );
    expect(recommendation).toBeDefined();
    expect(recommendation?.status).toBe('unknown');
    expect(recommendation?.textDigest).toBe(
      digestValue('Negotiate terms before accepting.')
    );
    expect(recommendation?.evidenceRefs.length).toBeGreaterThan(0);
    expect(recommendation?.id).toBe(claimId('recommendation'));
  });

  it('is deterministic for identical inputs', () => {
    const context = contextFor();
    const plan = planFor(context);
    const result = minimalAskResult();
    const a = buildGroundingProvenance({
      context,
      plan,
      result,
      builtAt: FIXED_NOW,
    });
    const b = buildGroundingProvenance({
      context,
      plan,
      result,
      builtAt: FIXED_NOW,
    });
    expect(a).toEqual(b);
  });

  it('does not rewrite AskDecisionResult user-facing fields', () => {
    const context = contextFor();
    const plan = planFor(context);
    const result = minimalAskResult();
    const before = structuredClone(result);
    buildGroundingProvenance({ context, plan, result, builtAt: FIXED_NOW });
    expect(result).toEqual(before);
  });

  it('attaches analysis.* claim containers for each section', () => {
    const context = contextFor();
    const plan = planFor(context);
    const result = minimalAskResult();
    const grounding = buildGroundingProvenance({
      context,
      plan,
      result,
      builtAt: FIXED_NOW,
    });
    const analysisClaims = grounding.claims.filter((c) =>
      c.fieldPath.startsWith('analysis.')
    );
    expect(analysisClaims).toHaveLength(result.analysis.length);
    expect(
      analysisClaims.every((c) => c.status === 'unknown')
    ).toBe(true);
  });

  it('returns unavailable when context/plan invalid', () => {
    const context = contextFor();
    const plan = planFor(context);
    const result = minimalAskResult();
    const bad = buildGroundingProvenance({
      context: { ...context, version: '0.0.0' as typeof context.version },
      plan,
      result,
      builtAt: FIXED_NOW,
    });
    expect(bad.status).toBe('unavailable');
    expect(bad.evidence).toEqual([]);
    expect(bad.claims).toEqual([]);
  });

  it('returns unavailable / degraded helpers with empty inventories', () => {
    expect(buildUnavailableGrounding(FIXED_NOW)).toEqual({
      version: GROUNDING_PROVENANCE_VERSION,
      builtAt: FIXED_NOW,
      evidence: [],
      claims: [],
      status: 'unavailable',
    });
    expect(buildDegradedGrounding(FIXED_NOW).status).toBe('degraded');
  });
});

describe('GroundingProvenance validate', () => {
  it('accepts a built provenance', () => {
    const context = contextFor();
    const plan = planFor(context);
    const grounding = buildGroundingProvenance({
      context,
      plan,
      result: minimalAskResult(),
      builtAt: FIXED_NOW,
    });
    const validated = validateGroundingProvenance(grounding);
    expect(validated.ok).toBe(true);
  });

  it('rejects unknown top-level fields', () => {
    const validated = validateGroundingProvenance({
      version: GROUNDING_PROVENANCE_VERSION,
      builtAt: FIXED_NOW,
      evidence: [],
      claims: [],
      status: 'used',
      extra: true,
    });
    expect(validated.ok).toBe(false);
    if (!validated.ok) {
      expect(validated.errors.some((e) => e.includes('Unknown field'))).toBe(
        true
      );
    }
  });

  it('rejects dangling evidenceRefs', () => {
    const validated = validateGroundingProvenance({
      version: GROUNDING_PROVENANCE_VERSION,
      builtAt: FIXED_NOW,
      evidence: [
        {
          version: '1.0.0',
          id: 'ev.question.abc',
          kind: 'question',
          source: 'current_question',
        },
      ],
      claims: [
        {
          id: 'cl.x',
          fieldPath: 'recommendation',
          textDigest: null,
          evidenceRefs: [{ evidenceId: 'missing-id' }],
          status: 'unknown',
        },
      ],
      status: 'used',
    });
    expect(validated.ok).toBe(false);
    if (!validated.ok) {
      expect(
        validated.errors.some((e) => e.includes('unknown evidenceId'))
      ).toBe(true);
    }
  });

  it('rejects invalid claim status', () => {
    const validated = validateGroundingProvenance({
      version: GROUNDING_PROVENANCE_VERSION,
      builtAt: FIXED_NOW,
      evidence: [],
      claims: [
        {
          id: 'cl.x',
          fieldPath: 'recommendation',
          textDigest: null,
          evidenceRefs: [],
          status: 'maybe',
        },
      ],
      status: 'used',
    });
    expect(validated.ok).toBe(false);
  });
});

describe('digest helpers', () => {
  it('produces stable digests', () => {
    expect(digestValue(CAREER_QUESTION)).toBe(digestValue(CAREER_QUESTION));
    expect(digestValue('a')).not.toBe(digestValue('b'));
  });
});

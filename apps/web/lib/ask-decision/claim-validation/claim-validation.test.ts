/**
 * P2.1b-04 Claim-level semantic validation — unit tests.
 */

import { describe, expect, it } from 'vitest';
import {
  buildUnavailableValidationReport,
  buildValidationReport,
  CLAIM_VALIDATION_REPORT_VERSION,
  classifyEvidenceKind,
  validateValidationReport,
} from './index';
import {
  brokenReferencesBundle,
  duplicateEvidenceBundle,
  makeBundle,
  makeClaim,
  makeEvidence,
  missingEvidenceBundle,
  partialTimingBundle,
  supportedRecommendationBundle,
  unknownEmptyClaimBundle,
  unsupportedUnrelatedBundle,
} from './fixtures';

describe('claim validation statuses', () => {
  it('marks supported when direct kinds are present and complete', () => {
    const report = buildValidationReport(supportedRecommendationBundle());
    expect(report.status).toBe('used');
    expect(report.claimResults).toHaveLength(1);
    expect(report.claimResults[0]?.status).toBe('supported');
    expect(report.claimResults[0]?.reasonCode).toBe('SUPPORTED');
    expect(report.summary.supported).toBe(1);
    expect(report.claimResults[0]?.matchedEvidence.length).toBeGreaterThan(0);
    expect(report.claimResults[0]?.missingEvidence).toEqual([]);
  });

  it('marks partial when only secondary kinds support the claim', () => {
    const report = buildValidationReport(partialTimingBundle());
    expect(report.claimResults[0]?.status).toBe('partial');
    expect(report.claimResults[0]?.reasonCode).toBe('MISSING_EVIDENCE');
    expect(report.claimResults[0]?.missingEvidence).toContain('kind:timing');
    expect(report.summary.partial).toBe(1);
  });

  it('marks unsupported for unrelated evidence only', () => {
    const report = buildValidationReport(unsupportedUnrelatedBundle());
    expect(report.claimResults[0]?.status).toBe('unsupported');
    expect(report.claimResults[0]?.reasonCode).toBe('STRUCTURAL_MISMATCH');
    expect(report.claimResults[0]?.notes).toContain('unrelated_evidence_ref');
  });

  it('marks unknown for empty claim text', () => {
    const report = buildValidationReport(unknownEmptyClaimBundle());
    expect(report.claimResults[0]?.status).toBe('unknown');
    expect(report.claimResults[0]?.reasonCode).toBe('UNKNOWN');
    expect(report.claimResults[0]?.notes).toContain('empty_claim_text');
    expect(report.statistics.emptyClaimCount).toBe(1);
  });

  it('marks unsupported when evidence is missing', () => {
    const report = buildValidationReport(missingEvidenceBundle());
    expect(report.claimResults[0]?.status).toBe('unsupported');
    expect(report.claimResults[0]?.reasonCode).toBe('MISSING_EVIDENCE');
    expect(report.claimResults[0]?.missingEvidence.length).toBeGreaterThan(0);
  });
});

describe('evidence refs edge cases', () => {
  it('notes duplicate evidence refs without failing the report', () => {
    const report = buildValidationReport(duplicateEvidenceBundle());
    expect(report.status).toBe('used');
    expect(report.statistics.duplicateReferenceCount).toBe(1);
    expect(report.claimResults[0]?.notes).toContain('duplicate_evidence_ref');
    // Still supported: all direct kinds present once resolved
    expect(report.claimResults[0]?.status).toBe('supported');
    expect(report.claimResults[0]?.reasonCode).toBe('SUPPORTED');
  });

  it('notes broken references and degrades claim support', () => {
    const report = buildValidationReport(brokenReferencesBundle());
    expect(report.statistics.brokenReferenceCount).toBe(1);
    expect(report.claimResults[0]?.notes).toContain('broken_evidence_ref');
    expect(report.claimResults[0]?.reasonCode).toBe('BROKEN_REFERENCE');
    // Has some direct (question) but missing other direct kinds + broken → partial
    expect(report.claimResults[0]?.status).toBe('partial');
  });
});

describe('determinism + contracts', () => {
  it('is deterministic for identical bundles', () => {
    const bundle = supportedRecommendationBundle();
    const a = buildValidationReport(bundle);
    const b = buildValidationReport(bundle);
    expect(a).toEqual(b);
  });

  it('never mutates the grounding bundle', () => {
    const bundle = supportedRecommendationBundle();
    const before = structuredClone(bundle);
    buildValidationReport(bundle);
    expect(bundle).toEqual(before);
    expect(bundle.claims[0]?.status).toBe('unknown');
  });

  it('uses stable claim ids from the bundle', () => {
    const report = buildValidationReport(supportedRecommendationBundle());
    expect(report.claimResults[0]?.claimId).toBe('cl.rec');
  });

  it('validates report shape and rejects unknown fields', () => {
    const ok = validateValidationReport(
      buildValidationReport(supportedRecommendationBundle())
    );
    expect(ok.ok).toBe(true);

    const bad = validateValidationReport({
      version: CLAIM_VALIDATION_REPORT_VERSION,
      status: 'used',
      summary: {
        total: 0,
        supported: 0,
        partial: 0,
        unsupported: 0,
        unknown: 0,
      },
      claimResults: [],
      statistics: {
        evidenceCount: 0,
        claimCount: 0,
        brokenReferenceCount: 0,
        duplicateReferenceCount: 0,
        emptyClaimCount: 0,
      },
      extra: true,
    });
    expect(bad.ok).toBe(false);
  });

  it('returns unavailable for unavailable grounding or invalid input', () => {
    expect(
      buildValidationReport(makeBundle({ status: 'unavailable' })).status
    ).toBe('unavailable');
    expect(buildValidationReport(null as never).status).toBe('unavailable');
    expect(buildUnavailableValidationReport().version).toBe(
      CLAIM_VALIDATION_REPORT_VERSION
    );
  });

  it('every claim receives a validation status', () => {
    const bundle = makeBundle({
      evidence: [
        makeEvidence({ id: 'ev.q', kind: 'question' }),
        makeEvidence({ id: 'ev.f', kind: 'fact' }),
        makeEvidence({ id: 'ev.a', kind: 'analysis' }),
        makeEvidence({ id: 'ev.p', kind: 'plan', source: 'reasoning_plan' }),
      ],
      claims: [
        makeClaim({
          id: 'cl.1',
          fieldPath: 'recommendation',
          evidenceRefs: [
            { evidenceId: 'ev.q' },
            { evidenceId: 'ev.f' },
            { evidenceId: 'ev.a' },
            { evidenceId: 'ev.p' },
          ],
        }),
        makeClaim({
          id: 'cl.2',
          fieldPath: 'executiveSummary',
          textDigest: null,
        }),
        makeClaim({
          id: 'cl.3',
          fieldPath: 'scores.timing.rationale',
          evidenceRefs: [{ evidenceId: 'ev.p' }],
        }),
      ],
    });
    const report = buildValidationReport(bundle);
    expect(report.claimResults).toHaveLength(3);
    expect(
      report.claimResults.every((r) =>
        ['supported', 'partial', 'unsupported', 'unknown'].includes(r.status)
      )
    ).toBe(true);
    expect(report.summary.total).toBe(3);
  });
});

describe('matching rules', () => {
  it('classifies timing vs conversation correctly', () => {
    expect(classifyEvidenceKind('timing', 'scores.timing.rationale')).toBe(
      'directly_supporting'
    );
    expect(classifyEvidenceKind('plan', 'scores.timing.rationale')).toBe(
      'partially_supporting'
    );
    expect(classifyEvidenceKind('conversation', 'recommendation')).toBe(
      'unrelated'
    );
  });
});

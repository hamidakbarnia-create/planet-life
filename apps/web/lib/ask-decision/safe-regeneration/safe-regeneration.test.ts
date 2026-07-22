/**
 * P2.1b-05 Safe Regeneration — unit tests (decision only, no regeneration).
 */

import { describe, expect, it } from 'vitest';
import {
  buildSafeRegenerationDecision,
  buildUnavailableSafeRegenerationDecision,
  calculateConfidence,
  SAFE_REGENERATION_SOURCE,
  SAFE_REGENERATION_VERSION,
} from './index';
import {
  emptyValidationReport,
  fullySupportedReport,
  largeStructuralMismatchReport,
  makeValidationReport,
  mixedValidationReport,
  multiBrokenReferenceReport,
  manyUnsupportedReport,
  singleMissingEvidenceReport,
  singleStructuralMismatchReport,
  singleUnknownReferenceReport,
  singleUnknownReport,
  singleUnsupportedReport,
  twoStructuralMismatchReport,
  makeClaimResult,
} from './fixtures';

describe('SafeRegenerationDecision rules', () => {
  it('fully supported → shouldRegenerate=false, high confidence', () => {
    const d = buildSafeRegenerationDecision(fullySupportedReport());
    expect(d.version).toBe(SAFE_REGENERATION_VERSION);
    expect(d.source).toBe(SAFE_REGENERATION_SOURCE);
    expect(d.status).toBe('used');
    expect(d.shouldRegenerate).toBe(false);
    expect(d.blockingClaims).toEqual([]);
    expect(d.supportedClaims).toEqual(['cl.a', 'cl.b']);
    expect(d.confidence).toBe(1);
    expect(d.reasonCodes).toEqual(['SUPPORTED']);
  });

  it('single unsupported / MISSING_EVIDENCE → shouldRegenerate=false', () => {
    const d = buildSafeRegenerationDecision(singleUnsupportedReport());
    expect(d.shouldRegenerate).toBe(false);
    expect(d.summary.unsupportedCount).toBe(1);
    expect(d.blockingClaims).toEqual([]);
  });

  it('one MISSING_EVIDENCE alone → shouldRegenerate=false', () => {
    const d = buildSafeRegenerationDecision(singleMissingEvidenceReport());
    expect(d.shouldRegenerate).toBe(false);
    expect(d.reasonCodes).toContain('MISSING_EVIDENCE');
    expect(d.blockingClaims).toEqual([]);
  });

  it('single UNKNOWN → shouldRegenerate=false', () => {
    expect(
      buildSafeRegenerationDecision(singleUnknownReport()).shouldRegenerate
    ).toBe(false);
  });

  it('single UNKNOWN_REFERENCE → shouldRegenerate=false', () => {
    expect(
      buildSafeRegenerationDecision(
        singleUnknownReferenceReport()
      ).shouldRegenerate
    ).toBe(false);
  });

  it('one STRUCTURAL_MISMATCH → shouldRegenerate=true', () => {
    const d = buildSafeRegenerationDecision(singleStructuralMismatchReport());
    expect(d.shouldRegenerate).toBe(true);
    expect(d.reasonCodes).toContain('STRUCTURAL_MISMATCH');
    expect(d.blockingClaims).toContain('cl.sm');
    expect(d.summary.structuralMismatchCount).toBe(1);
  });

  it('two STRUCTURAL_MISMATCH claims → shouldRegenerate=true', () => {
    const d = buildSafeRegenerationDecision(twoStructuralMismatchReport());
    expect(d.shouldRegenerate).toBe(true);
    expect(d.summary.structuralMismatchCount).toBe(2);
    expect(d.blockingClaims).toEqual(['cl.s1', 'cl.s2']);
  });

  it('many unsupported → shouldRegenerate=true with blockingClaims', () => {
    const d = buildSafeRegenerationDecision(manyUnsupportedReport());
    expect(d.shouldRegenerate).toBe(true);
    expect(d.blockingClaims).toEqual(['cl.1', 'cl.2', 'cl.3']);
    expect(d.confidence).toBeLessThan(0.5);
  });

  it('large structural mismatch (≥3) → shouldRegenerate=true', () => {
    const d = buildSafeRegenerationDecision(largeStructuralMismatchReport());
    expect(d.shouldRegenerate).toBe(true);
    expect(d.summary.structuralMismatchCount).toBe(3);
    expect(d.reasonCodes).toContain('STRUCTURAL_MISMATCH');
  });

  it('broken references across multiple claims → shouldRegenerate=true', () => {
    const d = buildSafeRegenerationDecision(multiBrokenReferenceReport());
    expect(d.shouldRegenerate).toBe(true);
    expect(d.summary.brokenReferenceCount).toBe(2);
    expect(d.blockingClaims).toEqual(['cl.b1', 'cl.b2']);
  });

  it('mixed validation without thresholds → shouldRegenerate=false', () => {
    const d = buildSafeRegenerationDecision(mixedValidationReport());
    expect(d.shouldRegenerate).toBe(false);
    expect(d.supportedClaims).toEqual(['cl.ok']);
    expect(d.summary.partialCount).toBe(1);
    expect(d.summary.unknownCount).toBe(1);
  });

  it('empty / unavailable validation → unavailable decision, no regen', () => {
    const d = buildSafeRegenerationDecision(emptyValidationReport());
    expect(d).toEqual(buildUnavailableSafeRegenerationDecision());
    expect(d.shouldRegenerate).toBe(false);
    expect(d.confidence).toBe(0);
    expect(d.status).toBe('unavailable');
  });

  it('null / invalid input degrades safely', () => {
    expect(buildSafeRegenerationDecision(null).status).toBe('unavailable');
    expect(buildSafeRegenerationDecision(undefined).shouldRegenerate).toBe(
      false
    );
  });
});

describe('confidence + determinism', () => {
  it('confidence decreases as evidence quality decreases', () => {
    const high = calculateConfidence(
      buildSafeRegenerationDecision(fullySupportedReport()).summary
    );
    const mid = calculateConfidence(
      buildSafeRegenerationDecision(mixedValidationReport()).summary
    );
    const low = calculateConfidence(
      buildSafeRegenerationDecision(manyUnsupportedReport()).summary
    );
    expect(high).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(low);
  });

  it('is deterministic for identical ValidationReport', () => {
    const report = manyUnsupportedReport();
    expect(buildSafeRegenerationDecision(report)).toEqual(
      buildSafeRegenerationDecision(report)
    );
  });

  it('collects multiple blocking claims for combined triggers', () => {
    const report = makeValidationReport([
      makeClaimResult({
        claimId: 'cl.x',
        status: 'unsupported',
        reasonCode: 'STRUCTURAL_MISMATCH',
      }),
      makeClaimResult({
        claimId: 'cl.y',
        status: 'unsupported',
        reasonCode: 'STRUCTURAL_MISMATCH',
      }),
      makeClaimResult({
        claimId: 'cl.z',
        status: 'unsupported',
        reasonCode: 'STRUCTURAL_MISMATCH',
      }),
      makeClaimResult({
        claimId: 'cl.ok',
        status: 'supported',
        reasonCode: 'SUPPORTED',
      }),
    ]);
    const d = buildSafeRegenerationDecision(report);
    expect(d.shouldRegenerate).toBe(true);
    expect(d.blockingClaims).toEqual(['cl.x', 'cl.y', 'cl.z']);
    expect(d.supportedClaims).toEqual(['cl.ok']);
  });
});

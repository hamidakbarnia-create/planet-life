/**
 * P2.2-02 Safe Regeneration execution — unit tests.
 */

import { describe, expect, it, vi } from 'vitest';
import type { AskDecisionResult } from '@/lib/ask-decision';
import { englishProviderResult } from '@/lib/ask-decision/english-provider-result.fixture';
import {
  buildUnavailableValidationReport,
  type ValidationReport,
} from '@/lib/ask-decision/claim-validation';
import type { GroundingProvenance } from '@/lib/ask-decision/grounding';
import {
  ASK_MAX_PROVIDER_CALLS,
  buildSafeRegenerationDecision,
  buildSafeRegenerationInstruction,
  compareValidationReports,
  createProviderCallBudget,
  executeSafeRegeneration,
} from '@/lib/ask-decision/safe-regeneration';
import {
  largeStructuralMismatchReport,
  manyUnsupportedReport,
  multiBrokenReferenceReport,
  makeValidationReport,
  makeClaimResult,
  fullySupportedReport,
} from '@/lib/ask-decision/safe-regeneration/fixtures';

function baseResult(label: string): AskDecisionResult {
  return {
    ...(englishProviderResult as AskDecisionResult),
    executiveSummary: `${label} summary with 12% and Berlin.`,
    recommendation: `${label} recommendation keep vesting cliff.`,
    actionPlan: {
      ...(englishProviderResult as AskDecisionResult).actionPlan,
      now: [
        {
          action: 'Confirm runway of 14 months in writing',
          purpose: 'p',
          priority: 'high',
          completionSignal: 'c',
        },
      ],
    },
  };
}

function groundingStub(
  status: GroundingProvenance['status'] = 'used'
): GroundingProvenance {
  return {
    version: '1.0.0',
    status,
    builtAt: '2026-07-22T00:00:00.000Z',
    evidence: [],
    claims: [],
  } as GroundingProvenance;
}

describe('provider call budget', () => {
  it('caps at ASK_MAX_PROVIDER_CALLS = 2', () => {
    const budget = createProviderCallBudget();
    expect(ASK_MAX_PROVIDER_CALLS).toBe(2);
    expect(budget.consume()).toBe(true);
    expect(budget.consume()).toBe(true);
    expect(budget.consume()).toBe(false);
    expect(budget.used).toBe(2);
    expect(budget.canCall).toBe(false);
  });
});

describe('compareValidationReports', () => {
  it('selects regenerated when structural mismatch is fixed', () => {
    const original = largeStructuralMismatchReport();
    const regenerated = fullySupportedReport();
    expect(compareValidationReports(original, regenerated)).toBe('regenerated');
  });

  it('retains original on tie', () => {
    const a = fullySupportedReport();
    expect(compareValidationReports(a, fullySupportedReport())).toBe(
      'original'
    );
  });

  it('retains original when regenerated is worse', () => {
    expect(
      compareValidationReports(fullySupportedReport(), manyUnsupportedReport())
    ).toBe('original');
  });

  it('returns unavailable when regenerated validation is unavailable', () => {
    expect(
      compareValidationReports(
        fullySupportedReport(),
        buildUnavailableValidationReport()
      )
    ).toBe('unavailable');
  });

  it('prefers fewer broken references', () => {
    const worse = multiBrokenReferenceReport();
    const better = makeValidationReport([
      makeClaimResult({
        claimId: 'cl.b1',
        status: 'partial',
        reasonCode: 'BROKEN_REFERENCE',
      }),
      makeClaimResult({
        claimId: 'cl.ok',
        status: 'supported',
        reasonCode: 'SUPPORTED',
      }),
    ]);
    expect(compareValidationReports(worse, better)).toBe('regenerated');
  });
});

describe('buildSafeRegenerationInstruction', () => {
  it('is narrow and includes blocking claims without user prose dumps', () => {
    const decision = buildSafeRegenerationDecision(
      largeStructuralMismatchReport()
    );
    const text = buildSafeRegenerationInstruction(decision);
    expect(text).toContain('SAFE REGENERATION');
    expect(text).toContain('STRUCTURAL_MISMATCH');
    expect(text).not.toMatch(/Should I/);
  });
});

describe('executeSafeRegeneration', () => {
  it('no regeneration when shouldRegenerate=false', async () => {
    const original = baseResult('orig');
    const validation = fullySupportedReport();
    const decision = buildSafeRegenerationDecision(validation);
    const callProvider = vi.fn();
    const budget = createProviderCallBudget();
    budget.consume();

    const out = await executeSafeRegeneration({
      decision,
      originalResult: original,
      originalGrounding: groundingStub(),
      originalValidation: validation,
      promptMessages: [{ role: 'user', content: 'prompt' }],
      budget,
      callProvider,
      parseResult: () => baseResult('regen'),
      groundAndValidate: () => ({
        grounding: groundingStub(),
        validation: fullySupportedReport(),
      }),
    });

    expect(callProvider).not.toHaveBeenCalled();
    expect(out.result).toBe(original);
    expect(out.safeRegeneration.outcome).toBe('not_requested');
    expect(out.safeRegeneration.selected).toBe('not_applicable');
    expect(budget.used).toBe(1);
  });

  it('selects regenerated when safer', async () => {
    const original = baseResult('orig');
    const validation = largeStructuralMismatchReport();
    const decision = buildSafeRegenerationDecision(validation);
    expect(decision.shouldRegenerate).toBe(true);
    const callProvider = vi.fn(async () => ({
      ok: true as const,
      body: {
        type: 'decision' as const,
        message: '{"ok":true}',
        sources: [],
        request_id: 'regen-1',
        reasoning: null,
        uncertainty: null,
      },
    }));
    const budget = createProviderCallBudget();
    budget.consume();

    const regenResult = baseResult('regen');
    const out = await executeSafeRegeneration({
      decision,
      originalResult: original,
      originalGrounding: groundingStub(),
      originalValidation: validation,
      promptMessages: [{ role: 'user', content: 'prompt' }],
      budget,
      callProvider,
      parseResult: () => regenResult,
      groundAndValidate: () => ({
        grounding: groundingStub(),
        validation: fullySupportedReport(),
      }),
    });

    expect(callProvider).toHaveBeenCalledTimes(1);
    expect(budget.used).toBe(2);
    expect(out.result).toBe(regenResult);
    expect(out.safeRegeneration.outcome).toBe('regenerated_selected');
    expect(out.safeRegeneration.selected).toBe('regenerated');
    expect(out.safeRegeneration.attempted).toBe(true);
  });

  it('retains original when regenerated does not improve', async () => {
    const original = baseResult('orig');
    const validation = largeStructuralMismatchReport();
    const decision = buildSafeRegenerationDecision(validation);
    const callProvider = vi.fn(async () => ({
      ok: true as const,
      body: {
        type: 'decision' as const,
        message: '{"ok":true}',
        sources: [],
        request_id: 'regen-2',
        reasoning: null,
        uncertainty: null,
      },
    }));
    const budget = createProviderCallBudget();
    budget.consume();

    const out = await executeSafeRegeneration({
      decision,
      originalResult: original,
      originalGrounding: groundingStub(),
      originalValidation: validation,
      promptMessages: [{ role: 'user', content: 'prompt' }],
      budget,
      callProvider,
      parseResult: () => baseResult('regen'),
      groundAndValidate: () => ({
        grounding: groundingStub(),
        validation: largeStructuralMismatchReport(),
      }),
    });

    expect(callProvider).toHaveBeenCalledTimes(1);
    expect(out.result).toBe(original);
    expect(out.safeRegeneration.outcome).toBe('original_retained');
    expect(out.safeRegeneration.reason).toBe('no_strict_improvement');
  });

  it('retains original on provider failure', async () => {
    const original = baseResult('orig');
    const validation = largeStructuralMismatchReport();
    const decision = buildSafeRegenerationDecision(validation);
    const callProvider = vi.fn(async () => ({
      ok: false as const,
      kind: 'network_error' as const,
    }));
    const budget = createProviderCallBudget();
    budget.consume();

    const out = await executeSafeRegeneration({
      decision,
      originalResult: original,
      originalGrounding: groundingStub(),
      originalValidation: validation,
      promptMessages: [{ role: 'user', content: 'prompt' }],
      budget,
      callProvider,
      parseResult: () => baseResult('regen'),
      groundAndValidate: () => ({
        grounding: groundingStub(),
        validation: fullySupportedReport(),
      }),
    });

    expect(out.result).toBe(original);
    expect(out.safeRegeneration.outcome).toBe('regeneration_failed');
    expect(out.safeRegeneration.reason).toBe('provider_network_error');
  });

  it('retains original on empty regeneration message', async () => {
    const original = baseResult('orig');
    const validation = largeStructuralMismatchReport();
    const decision = buildSafeRegenerationDecision(validation);
    const callProvider = vi.fn(async () => ({
      ok: true as const,
      body: {
        type: 'decision' as const,
        message: '   ',
        sources: [],
        request_id: 'regen-empty',
        reasoning: null,
        uncertainty: null,
      },
    }));
    const budget = createProviderCallBudget();
    budget.consume();

    const out = await executeSafeRegeneration({
      decision,
      originalResult: original,
      originalGrounding: groundingStub(),
      originalValidation: validation,
      promptMessages: [{ role: 'user', content: 'prompt' }],
      budget,
      callProvider,
      parseResult: () => baseResult('regen'),
      groundAndValidate: () => ({
        grounding: groundingStub(),
        validation: fullySupportedReport(),
      }),
    });

    expect(out.result).toBe(original);
    expect(out.safeRegeneration.reason).toBe('empty_response');
  });

  it('retains original when regenerated grounding is unavailable', async () => {
    const original = baseResult('orig');
    const validation = largeStructuralMismatchReport();
    const decision = buildSafeRegenerationDecision(validation);
    const callProvider = vi.fn(async () => ({
      ok: true as const,
      body: {
        type: 'decision' as const,
        message: '{"ok":true}',
        sources: [],
        request_id: 'regen-g',
        reasoning: null,
        uncertainty: null,
      },
    }));
    const budget = createProviderCallBudget();
    budget.consume();

    const out = await executeSafeRegeneration({
      decision,
      originalResult: original,
      originalGrounding: groundingStub(),
      originalValidation: validation,
      promptMessages: [{ role: 'user', content: 'prompt' }],
      budget,
      callProvider,
      parseResult: () => baseResult('regen'),
      groundAndValidate: () => ({
        grounding: groundingStub('unavailable'),
        validation: fullySupportedReport(),
      }),
    });

    expect(out.result).toBe(original);
    expect(out.safeRegeneration.reason).toBe(
      'regenerated_grounding_unavailable'
    );
  });

  it('retains original when regenerated validation is unavailable', async () => {
    const original = baseResult('orig');
    const validation = largeStructuralMismatchReport();
    const decision = buildSafeRegenerationDecision(validation);
    const callProvider = vi.fn(async () => ({
      ok: true as const,
      body: {
        type: 'decision' as const,
        message: '{"ok":true}',
        sources: [],
        request_id: 'regen-v',
        reasoning: null,
        uncertainty: null,
      },
    }));
    const budget = createProviderCallBudget();
    budget.consume();

    const out = await executeSafeRegeneration({
      decision,
      originalResult: original,
      originalGrounding: groundingStub(),
      originalValidation: validation,
      promptMessages: [{ role: 'user', content: 'prompt' }],
      budget,
      callProvider,
      parseResult: () => baseResult('regen'),
      groundAndValidate: () => ({
        grounding: groundingStub(),
        validation: buildUnavailableValidationReport(),
      }),
    });

    expect(out.result).toBe(original);
    expect(out.safeRegeneration.reason).toBe(
      'regenerated_validation_unavailable'
    );
  });

  it('skips regeneration when budget exhausted (language retry used slot)', async () => {
    const original = baseResult('orig');
    const validation = largeStructuralMismatchReport();
    const decision = buildSafeRegenerationDecision(validation);
    const callProvider = vi.fn();
    const budget = createProviderCallBudget();
    budget.consume();
    budget.consume();

    const out = await executeSafeRegeneration({
      decision,
      originalResult: original,
      originalGrounding: groundingStub(),
      originalValidation: validation,
      promptMessages: [{ role: 'user', content: 'prompt' }],
      budget,
      callProvider,
      parseResult: () => baseResult('regen'),
      groundAndValidate: () => ({
        grounding: groundingStub(),
        validation: fullySupportedReport(),
      }),
    });

    expect(callProvider).not.toHaveBeenCalled();
    expect(out.safeRegeneration.outcome).toBe('original_retained');
    expect(out.safeRegeneration.reason).toBe('provider_budget_exhausted');
    expect(budget.used).toBe(2);
  });

  it('never issues a third provider call even if regenerated still wants regen', async () => {
    const original = baseResult('orig');
    const validation = manyUnsupportedReport();
    const decision = buildSafeRegenerationDecision(validation);
    expect(decision.shouldRegenerate).toBe(true);

    const stillBad: ValidationReport = largeStructuralMismatchReport();
    const callProvider = vi.fn(async () => ({
      ok: true as const,
      body: {
        type: 'decision' as const,
        message: '{"ok":true}',
        sources: [],
        request_id: 'regen-loop',
        reasoning: null,
        uncertainty: null,
      },
    }));
    const budget = createProviderCallBudget();
    budget.consume();

    const out = await executeSafeRegeneration({
      decision,
      originalResult: original,
      originalGrounding: groundingStub(),
      originalValidation: validation,
      promptMessages: [{ role: 'user', content: 'prompt' }],
      budget,
      callProvider,
      parseResult: () => baseResult('regen'),
      groundAndValidate: () => ({
        grounding: groundingStub(),
        validation: stillBad,
      }),
    });

    expect(callProvider).toHaveBeenCalledTimes(1);
    expect(budget.used).toBe(2);
    expect(out.result).toBe(original);
    expect(out.safeRegeneration.attempted).toBe(true);
  });
});

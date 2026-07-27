/**
 * P2.2-01 — Staging Ask pipeline end-to-end verification.
 * Runs only when STAGING_E2E=1 with NEXT_PUBLIC_API_BASE pointing at staging API.
 * Does not mock Conversation client — hits real staging provider.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import type { BirthProfile } from '@/lib/birth-profile';
import { API_BASE } from '@/lib/api-config';
import {
  buildUnavailableValidationReport,
  buildValidationReport,
} from '@/lib/ask-decision/claim-validation';
import {
  brokenReferencesBundle,
  missingEvidenceBundle,
  unsupportedUnrelatedBundle,
} from '@/lib/ask-decision/claim-validation/fixtures';
import { buildSafeRegenerationDecision } from '@/lib/ask-decision/safe-regeneration';
import { runAskDecision } from '@/lib/ask-decision/run';
import type { ConversationLocale } from '@/lib/conversation-client';

const ENABLED = process.env.STAGING_E2E === '1';
const OUT_DIR = join(process.cwd(), 'locale-evidence', 'p2.2-01-staging');

const PROFILE: BirthProfile = {
  birth_date: '1990-06-15',
  birth_time: '14:30',
  location: 'London',
  action_type: 'business_launch',
};

type ScenarioResult = {
  id: string;
  locale: ConversationLocale;
  question: string;
  ok: boolean;
  pendingClarification?: boolean;
  recommendationStatus?: string | null;
  requestId?: string | null;
  fallback?: boolean;
  sources?: string[];
  groundingStatus?: string;
  validationStatus?: string;
  safeRegenStatus?: string;
  safeShouldRegenerate?: boolean;
  metaConsistent?: boolean;
  factsPreserved?: boolean;
  mustRetain?: string[];
  lostTokens?: string[];
  providerLatencyMs?: number | null;
  totalLatencyMs: number;
  responseBytes: number;
  error?: string;
};

const results: ScenarioResult[] = [];

function assertStagingTarget() {
  const host = new URL(API_BASE).hostname;
  expect(host).not.toBe('api.metioro.com');
  expect(host).not.toBe('localhost');
  expect(API_BASE.startsWith('https://')).toBe(true);
}

function metaConsistent(out: Awaited<ReturnType<typeof runAskDecision>>): boolean {
  const g = out.result.meta?.grounding;
  const v = out.result.meta?.validation;
  const s = out.result.meta?.safeRegeneration;
  if (!g || !v || !s) return false;
  if (v.status === 'unavailable') {
    return s.status === 'unavailable' && s.shouldRegenerate === false;
  }
  if (v.status === 'used' && s.status === 'used') {
    return (
      s.summary.totalClaims === v.summary.total &&
      s.summary.supportedCount === v.summary.supported &&
      s.summary.unsupportedCount === v.summary.unsupported &&
      s.summary.partialCount === v.summary.partial &&
      s.summary.unknownCount === v.summary.unknown
    );
  }
  return true;
}

function extractText(out: Awaited<ReturnType<typeof runAskDecision>>): string {
  const r = out.result;
  const parts = [
    r.executiveSummary,
    r.recommendation,
    r.recommendationStatus,
    ...(r.analysis ?? []).map((a) => `${a.title} ${a.body}`),
    ...(r.actionPlan?.now ?? []),
    JSON.stringify(r.scores ?? {}),
  ];
  return parts.join('\n').toLowerCase();
}

function checkRetain(
  out: Awaited<ReturnType<typeof runAskDecision>>,
  tokens: string[]
): { ok: boolean; lost: string[] } {
  const text = extractText(out);
  const lost = tokens.filter((t) => !text.includes(t.toLowerCase()));
  return { ok: lost.length === 0, lost };
}

async function runScenario(args: {
  id: string;
  locale: ConversationLocale;
  question: string;
  continueWithAssumptions?: boolean;
  clarificationAnswer?: string;
  mustRetain?: string[];
}): Promise<ScenarioResult> {
  const t0 = performance.now();
  try {
    const out = await runAskDecision({
      question: args.question,
      profile: PROFILE,
      locale: args.locale,
      continueWithAssumptions: args.continueWithAssumptions,
      clarificationAnswer: args.clarificationAnswer,
    });
    const totalLatencyMs = Math.round(performance.now() - t0);
    const retain = checkRetain(out, args.mustRetain ?? []);
    const payload = JSON.stringify(out.result);
    const row: ScenarioResult = {
      id: args.id,
      locale: args.locale,
      question: args.question,
      ok: true,
      pendingClarification: out.pendingClarification,
      recommendationStatus: out.result.recommendationStatus,
      requestId: out.result.meta?.requestId ?? null,
      fallback: Boolean(out.result.meta?.fallback),
      sources: out.result.meta?.sources ?? [],
      groundingStatus: out.result.meta?.grounding?.status,
      validationStatus: out.result.meta?.validation?.status,
      safeRegenStatus: out.result.meta?.safeRegeneration?.status,
      safeShouldRegenerate: out.result.meta?.safeRegeneration?.shouldRegenerate,
      metaConsistent: metaConsistent(out),
      factsPreserved: retain.ok,
      mustRetain: args.mustRetain,
      lostTokens: retain.lost,
      providerLatencyMs: null,
      totalLatencyMs,
      responseBytes: Buffer.byteLength(payload, 'utf8'),
    };
    results.push(row);
    return row;
  } catch (err) {
    const row: ScenarioResult = {
      id: args.id,
      locale: args.locale,
      question: args.question,
      ok: false,
      totalLatencyMs: Math.round(performance.now() - t0),
      responseBytes: 0,
      error: err instanceof Error ? err.message : String(err),
    };
    results.push(row);
    return row;
  }
}

describe.skipIf(!ENABLED)('P2.2-01 staging Ask E2E', () => {
  it('targets staging API host', () => {
    assertStagingTarget();
  });

  it('clarification required (no provider call path)', async () => {
    const row = await runScenario({
      id: 'clarification-required',
      locale: 'en',
      question: 'What should I do?',
    });
    expect(row.ok).toBe(true);
    expect(row.pendingClarification).toBe(true);
    expect(row.groundingStatus).toBeTruthy();
    expect(row.validationStatus).toBeTruthy();
    expect(row.safeRegenStatus).toBeTruthy();
    expect(row.metaConsistent).toBe(true);
  }, 60_000);

  it('normal ask (career offer)', async () => {
    const row = await runScenario({
      id: 'normal-ask',
      locale: 'en',
      question:
        'Should I accept the Series B offer with a runway of 14 months and a vesting cliff?',
      continueWithAssumptions: true,
      mustRetain: ['Series B', '14 months', 'vesting cliff'],
    });
    expect(row.ok).toBe(true);
    expect(row.pendingClarification).toBe(false);
    expect(row.fallback).toBe(false);
    expect(row.sources).toEqual(
      expect.arrayContaining([
        'grounding-v1',
        'claim-validation-v1',
        'safe-regeneration-v1',
      ])
    );
    expect(row.metaConsistent).toBe(true);
  }, 120_000);

  it('financial scenario', async () => {
    const row = await runScenario({
      id: 'financial',
      locale: 'en',
      question:
        'Should I put 40% of savings into a private deal with a liquidity lock and no clear downside cap?',
      continueWithAssumptions: true,
      mustRetain: ['40%', 'liquidity lock', 'downside cap'],
    });
    expect(row.ok).toBe(true);
    expect(row.pendingClarification).toBe(false);
    expect(row.metaConsistent).toBe(true);
  }, 120_000);

  it('career scenario', async () => {
    const row = await runScenario({
      id: 'career',
      locale: 'en',
      question:
        'Should I ask for a 12% raise despite a manager budget freeze, using peer salary data and comp band evidence?',
      continueWithAssumptions: true,
      mustRetain: ['12%', 'budget freeze', 'peer salary'],
    });
    expect(row.ok).toBe(true);
    expect(row.metaConsistent).toBe(true);
  }, 120_000);

  it('relationship scenario', async () => {
    const row = await runScenario({
      id: 'relationship',
      locale: 'en',
      question:
        'Should we move in together and lease co-sign before we have a shared exit plan and conflict repair ritual?',
      continueWithAssumptions: true,
      mustRetain: ['lease co-sign', 'exit plan'],
    });
    expect(row.ok).toBe(true);
    expect(row.metaConsistent).toBe(true);
  }, 120_000);

  it('relocation scenario', async () => {
    const row = await runScenario({
      id: 'relocation',
      locale: 'en',
      question:
        'Should I relocate to Berlin now given visa timeline risk, housing deposit, and remote-work approval still pending?',
      continueWithAssumptions: true,
      mustRetain: ['Berlin', 'visa', 'housing deposit'],
    });
    expect(row.ok).toBe(true);
    expect(row.metaConsistent).toBe(true);
  }, 120_000);

  it.each([
    ['en', 'Should I negotiate a 12% raise before the next review cycle?'],
    ['fa', 'Should I negotiate a 12% raise before the next review cycle?'],
    ['ar', 'Should I negotiate a 12% raise before the next review cycle?'],
    ['ru', 'Should I negotiate a 12% raise before the next review cycle?'],
  ] as const)(
    'localization %s',
    async (locale, question) => {
      const row = await runScenario({
        id: `locale-${locale}`,
        locale,
        question,
        continueWithAssumptions: true,
        mustRetain: ['12%'],
      });
      expect(row.ok).toBe(true);
      expect(row.pendingClarification).toBe(false);
      expect(row.metaConsistent).toBe(true);
      expect(row.recommendationStatus).toBeTruthy();
    },
    180_000
  );
});

describe('P2.2-01 validation edge fixtures (local, pipeline-consistent)', () => {
  it('missing evidence → safe regen decision stays consistent', () => {
    const validation = buildValidationReport(missingEvidenceBundle());
    const safe = buildSafeRegenerationDecision(validation);
    expect(validation.claimResults[0]?.reasonCode).toBe('MISSING_EVIDENCE');
    expect(safe.status).toBe('used');
    expect(safe.summary.missingEvidenceCount).toBeGreaterThan(0);
    expect(safe.summary.unsupportedCount).toBe(validation.summary.unsupported);
  });

  it('broken reference → safe regen decision stays consistent', () => {
    const validation = buildValidationReport(brokenReferencesBundle());
    const safe = buildSafeRegenerationDecision(validation);
    expect(validation.statistics.brokenReferenceCount).toBe(1);
    expect(validation.claimResults[0]?.reasonCode).toBe('BROKEN_REFERENCE');
    expect(safe.status).toBe('used');
    expect(safe.summary.brokenReferenceCount).toBeGreaterThan(0);
  });

  it('structural mismatch → safe regen decision stays consistent', () => {
    const validation = buildValidationReport(unsupportedUnrelatedBundle());
    const safe = buildSafeRegenerationDecision(validation);
    expect(validation.claimResults[0]?.reasonCode).toBe('STRUCTURAL_MISMATCH');
    expect(safe.status).toBe('used');
    expect(safe.summary.structuralMismatchCount).toBeGreaterThan(0);
  });

  it('validation unavailable → safe regen unavailable and never regenerates', () => {
    const validation = buildUnavailableValidationReport();
    const safe = buildSafeRegenerationDecision(validation);
    expect(validation.status).toBe('unavailable');
    expect(safe.status).toBe('unavailable');
    expect(safe.shouldRegenerate).toBe(false);
  });
});

afterAll(() => {
  if (!ENABLED && results.length === 0) return;
  mkdirSync(OUT_DIR, { recursive: true });
  const summary = {
    generatedAt: new Date().toISOString(),
    commit: process.env.NEXT_PUBLIC_RELEASE_SHA ?? null,
    apiBase: API_BASE,
    stagingE2E: ENABLED,
    scenarios: results,
    aggregates: {
      scenarioCount: results.length,
      passed: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      metaInconsistent: results.filter((r) => r.ok && r.metaConsistent === false)
        .length,
      factLoss: results.filter((r) => r.ok && r.factsPreserved === false).length,
      avgTotalLatencyMs:
        results.length === 0
          ? null
          : Math.round(
              results.reduce((a, r) => a + r.totalLatencyMs, 0) / results.length
            ),
      maxTotalLatencyMs:
        results.length === 0
          ? null
          : Math.max(...results.map((r) => r.totalLatencyMs)),
      avgResponseBytes:
        results.length === 0
          ? null
          : Math.round(
              results.reduce((a, r) => a + r.responseBytes, 0) / results.length
            ),
    },
  };
  writeFileSync(
    join(OUT_DIR, 'VERIFICATION.json'),
    JSON.stringify(summary, null, 2)
  );
});

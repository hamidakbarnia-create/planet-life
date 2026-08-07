/**
 * Test/contract helper for DecisionEvaluationPackage v1 fixtures.
 *
 * Production evaluation packages come from the Decision Case evaluation API.
 * Authoritative stub builder: packages/decision_engine/evaluate/stub_package.py
 * This module must not be used as the production result-page evaluation source.
 */

import demoFixture from './fixtures/car-interview-stub-package.demo.json';
import type { DecisionEvaluationPackage } from './package-types';
import type { CarInterviewIntake } from './car-interview-form';

export const STUB_ENGINE_ID = 'decision-engine-stub-v1' as const;

export const DEMO_STUB_NOTICE =
  'Demo evaluation — Decision Runtime is not connected yet.';

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0')}`;
}

/** Bind a demo package fixture to the active walking-skeleton case identity. */
export function bindDemoStubPackage(input: {
  caseId: string;
  caseVersion: number;
  intake: CarInterviewIntake;
  evaluationId?: string;
  createdAt?: string;
}): DecisionEvaluationPackage {
  const base = structuredClone(
    demoFixture
  ) as unknown as DecisionEvaluationPackage;

  const targetDate = input.intake.target_date ?? base.timing.candidates[0]?.date;

  return {
    ...base,
    case_id: input.caseId,
    evaluation_id: input.evaluationId ?? newId(),
    case_version: input.caseVersion,
    engine_id: STUB_ENGINE_ID,
    created_at: input.createdAt ?? new Date().toISOString(),
    timing: {
      ...base.timing,
      candidates: base.timing.candidates.map((candidate, index) =>
        index === 0 ? { ...candidate, date: targetDate } : candidate
      ),
    },
  };
}

/** Lightweight renderer/contract guard used by tests and the result view. */
export function assertPackageRenderContract(
  pkg: DecisionEvaluationPackage
): void {
  const requiredModules = [
    'recommendation',
    'timing',
    'confidence',
    'evidence',
    'drivers',
    'tradeoffs',
    'risks',
    'opportunities',
    'action_plan',
    'counter_recommendation',
    'explainability',
    'improve_accuracy',
    'next_decisions',
    'related_decisions',
  ] as const;

  for (const key of requiredModules) {
    if (!(key in pkg)) {
      throw new Error(`package missing module: ${key}`);
    }
  }
  if (pkg.schema_version !== '1.0.0') {
    throw new Error('invalid schema_version');
  }
  if (!pkg.engine_id || !pkg.engine_id.trim()) {
    throw new Error('package engine_id is required');
  }
  // Stub and real runtime packages are both valid render contracts.
  // Stub banner is gated on engine_id === STUB_ENGINE_ID in the view.
  if (pkg.mode === 'evaluate_date' && pkg.timing.candidates.length !== 1) {
    throw new Error('evaluate_date requires exactly one timing candidate');
  }
}

/**
 * PR-1 demo fixture adapter for DecisionEvaluationPackage v1.
 *
 * Authoritative stub builder: packages/decision_engine/evaluate/stub_package.py
 * This module only binds identity fields onto a checked-in schema-valid fixture
 * produced from that Python stub. It is not a second runtime implementation.
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
  if (pkg.engine_id !== STUB_ENGINE_ID) {
    throw new Error('demo fixture must use decision-engine-stub-v1');
  }
  if (pkg.mode === 'evaluate_date' && pkg.timing.candidates.length !== 1) {
    throw new Error('evaluate_date requires exactly one timing candidate');
  }
}

/**
 * ASK Web UX capability hint — NOT the production capability authority.
 *
 * Backend Decision Case / evaluation validation remains authoritative.
 * This module only:
 * - gates consumer UI away from known-unsupported flows
 * - mirrors currently shipped Runtime support on the web client
 *
 * Drift safety:
 * - Web false-negative (hides a later-supported flow): temporary UX lag only.
 * - Web false-positive (offers a flow backend rejects): backend rejects;
 *   consumer sees a localized capability error, never raw backend text.
 *
 * Sources consulted (hints only, no competing registry):
 * 1. Decision Type Registry — known type + allowed_modes
 * 2. Shipped-runtime mirror — currently shipped evaluate_date types
 *
 * Registry allowed_modes alone is insufficient for UX: a type may list
 * evaluate_date without a shipped Runtime on this client.
 */

import type { DecisionOperation } from '@/lib/decision-frame/types';
import { getDecisionType } from './decision-type-registry';

/**
 * Client mirror of Case modes with a shipped Decision Runtime.
 * Not authoritative — backend may reject even when listed here.
 */
const SHIPPED_RUNTIME_MODE_HINT: Readonly<
  Record<string, readonly ('evaluate_date' | 'compare_dates')[]>
> = {
  'car-interview': ['evaluate_date'],
  'bus-investor-meeting': ['evaluate_date'],
  'mar-wedding-date': ['evaluate_date'],
};

export type ProductionCaseMode = 'evaluate_date' | 'compare_dates';

/**
 * Map Frame operation → Case mode used by registry allowed_modes.
 * FIND has no Case mode in Package v1 — never offered as executable UX.
 */
export function frameOperationToCaseMode(
  operation: DecisionOperation
): ProductionCaseMode | null {
  if (operation === 'evaluate') return 'evaluate_date';
  if (operation === 'compare') return 'compare_dates';
  return null;
}

/** UX hint: shipped-runtime mirror lists this type+mode. */
export function hasProductionRuntime(
  decisionTypeId: string | undefined,
  mode: ProductionCaseMode
): boolean {
  if (!decisionTypeId) return false;
  const modes = SHIPPED_RUNTIME_MODE_HINT[decisionTypeId];
  return Boolean(modes?.includes(mode));
}

/**
 * UX hint: should the consumer UI offer this decision_type + operation?
 * Not a guarantee the backend will accept it.
 */
export function canExecuteInProduction(
  decisionTypeId: string | undefined,
  operation: DecisionOperation
): boolean {
  if (!decisionTypeId) return false;
  const mode = frameOperationToCaseMode(operation);
  if (!mode) return false;

  const record = getDecisionType(decisionTypeId);
  if (!record) return false;
  if (!record.allowed_modes.includes(mode)) return false;

  return hasProductionRuntime(decisionTypeId, mode);
}

/** UX hint: EVALUATE offered only for car-interview in the current shipped matrix. */
export function canEvaluateInProduction(
  decisionTypeId: string | undefined
): boolean {
  return canExecuteInProduction(decisionTypeId, 'evaluate');
}

export function listProductionEvaluateDecisionTypeIds(): string[] {
  return Object.entries(SHIPPED_RUNTIME_MODE_HINT)
    .filter(([, modes]) => modes.includes('evaluate_date'))
    .map(([id]) => id);
}

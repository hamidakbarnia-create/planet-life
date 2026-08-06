/**
 * Deterministic v1 planner confidence.
 *
 * Formula (after validating intermediates):
 *   0.50 * intentConfidence
 * + 0.35 * contextAvailabilityRatio
 * + 0.15 * (1 - blockedContextRequiredRatio)
 *
 * Guards:
 * - contextAvailabilityRatio = 0 when requiredContext count is 0
 *   (does not treat "no requirements" as fully available)
 * - blockedContextRequiredRatio uses only context_required dimensions;
 *   if none, ratio = 1 when availableRequiredCount === 0 else 0
 * - totalDimensionCount === 0 is invalid input → returns 0
 * - never NaN/Infinity; clamp once at the end; round to 4 dp once
 */

export type PlannerConfidenceInput = {
  intentConfidence: number;
  availableRequiredCount: number;
  templateRequiredCount: number;
  /** Blocked count among context_required dimensions only. */
  blockedContextRequiredCount: number;
  contextRequiredDimensionCount: number;
  totalDimensionCount: number;
};

export function calculatePlannerConfidence(
  input: PlannerConfidenceInput
): number {
  if (input.totalDimensionCount <= 0) {
    return 0;
  }

  const intent = finiteOrZero(input.intentConfidence);
  const available = finiteOrZero(input.availableRequiredCount);
  const required = finiteOrZero(input.templateRequiredCount);
  const blocked = finiteOrZero(input.blockedContextRequiredCount);
  const contextRequiredDims = finiteOrZero(input.contextRequiredDimensionCount);

  // Explicit: zero required-context ⇒ availability ratio 0 (not 1)
  const contextRatio = required <= 0 ? 0 : available / required;

  let blockedRatio: number;
  if (contextRequiredDims <= 0) {
    blockedRatio = available <= 0 ? 1 : 0;
  } else {
    blockedRatio = blocked / contextRequiredDims;
  }

  if (![intent, contextRatio, blockedRatio].every((n) => Number.isFinite(n))) {
    return 0;
  }

  const raw =
    0.5 * clamp01(intent) +
    0.35 * clamp01(contextRatio) +
    0.15 * (1 - clamp01(blockedRatio));

  if (!Number.isFinite(raw)) return 0;
  // Single documented round site after clamp
  return Number(clamp01(raw).toFixed(4));
}

function finiteOrZero(n: number): number {
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

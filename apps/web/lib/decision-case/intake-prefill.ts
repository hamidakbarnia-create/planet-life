/**
 * Prefill helpers for Decision Case intake screens.
 * Only copies explicit frame dates into target_date — never invents role/goal.
 */

export type IntakePrefillRecord = Record<string, unknown>;

/** Extract evaluate specific_date from Case decision_frame, if present. */
export function evaluateDateFromDecisionFrame(
  intake: IntakePrefillRecord | undefined
): string | null {
  const frame = intake?.decision_frame;
  if (!frame || typeof frame !== 'object') return null;
  const record = frame as Record<string, unknown>;
  if (record.operation !== 'evaluate') return null;
  if (record.time_scope !== 'specific_date') return null;
  if (typeof record.date !== 'string' || !record.date.trim()) return null;
  return record.date.trim();
}

/**
 * Prefill target_date from decision_frame when absent.
 * Does not invent meeting_goal, role, or other fields.
 */
export function prefillTargetDateFromFrame(
  intake: IntakePrefillRecord | undefined
): IntakePrefillRecord {
  const base: IntakePrefillRecord = { ...(intake ?? {}) };
  const existing = String(base.target_date ?? '').trim();
  if (existing) return base;
  const fromFrame = evaluateDateFromDecisionFrame(base);
  if (!fromFrame) return base;
  return { ...base, target_date: fromFrame };
}

export const SUPPORTED_INTAKE_DECISION_TYPE_IDS = [
  'car-interview',
  'bus-investor-meeting',
] as const;

export type SupportedIntakeDecisionTypeId =
  (typeof SUPPORTED_INTAKE_DECISION_TYPE_IDS)[number];

export function isSupportedIntakeDecisionType(
  decisionTypeId: string | undefined
): decisionTypeId is SupportedIntakeDecisionTypeId {
  return (
    decisionTypeId === 'car-interview' ||
    decisionTypeId === 'bus-investor-meeting'
  );
}

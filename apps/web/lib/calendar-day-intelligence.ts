/**
 * Frontend adapter for Calendar Phase 2A day_intelligence.
 * Data plane only — Calendar UI does not consume this yet.
 */

export type DayClass =
  | 'strongly_supportive'
  | 'supportive'
  | 'mixed'
  | 'caution'
  | 'adverse'
  | 'insufficient';

const DAY_CLASSES = new Set<DayClass>([
  'strongly_supportive',
  'supportive',
  'mixed',
  'caution',
  'adverse',
  'insufficient',
]);

export interface CalendarDayIntelligence {
  finalScore: number;
  dayClass: DayClass;
  conflict: boolean;
  rating: string;
  materialSupportiveCount: number;
  materialCautionCount: number;
  basis: string;
  evidence: Record<string, unknown>[];
}

function readNumber(value: unknown): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return value;
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  return value;
}

export function extractBatchDayIntelligence(
  payload: unknown
): CalendarDayIntelligence | null {
  if (payload == null || typeof payload !== 'object') return null;
  const raw = (payload as { day_intelligence?: unknown }).day_intelligence;
  if (raw == null || typeof raw !== 'object') return null;
  const src = raw as Record<string, unknown>;
  const finalScore = readNumber(src.final_score);
  const dayClass = readString(src.day_class);
  const rating = readString(src.rating);
  if (finalScore == null || dayClass == null || rating == null) return null;
  if (!DAY_CLASSES.has(dayClass as DayClass)) return null;
  if (typeof src.conflict !== 'boolean') return null;
  const supportive = readNumber(src.material_supportive_count);
  const caution = readNumber(src.material_caution_count);
  const basis = readString(src.basis);
  const evidence = Array.isArray(src.evidence)
    ? src.evidence.filter(
        (item): item is Record<string, unknown> =>
          item != null && typeof item === 'object' && !Array.isArray(item)
      )
    : [];
  return {
    finalScore,
    dayClass: dayClass as DayClass,
    conflict: src.conflict,
    rating,
    materialSupportiveCount: supportive ?? 0,
    materialCautionCount: caution ?? 0,
    basis: basis ?? 'score_bands+evidence_conflict',
    evidence,
  };
}

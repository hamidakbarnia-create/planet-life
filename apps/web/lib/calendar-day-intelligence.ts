/**
 * Frontend adapter for Calendar Day Intelligence (data plane only).
 *
 * Maps the additive `/api/batch` `day_intelligence` object. Calendar UI does
 * not consume this yet. Nested additive blobs (dimensions,
 * dimension_classification) keep API snake_case so cache round-trips cannot
 * silently drop classifier_version / semantic_status / evidence ids.
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

/** Nested additive payload from the API — snake_case, pass-through. */
export type DayIntelligenceObject = Record<string, unknown>;

export interface CalendarDayIntelligence {
  finalScore: number;
  dayClass: DayClass;
  conflict: boolean;
  rating: string;
  materialSupportiveCount: number;
  materialCautionCount: number;
  basis: string;
  evidence: Record<string, unknown>[];
  actionType: string | null;
  dominantAspects: Record<string, unknown>[];
  scoringContext: Record<string, unknown>;
  dimensions: DayIntelligenceObject | null;
  dimensionClassification: DayIntelligenceObject | null;
}

function readNumber(value: unknown): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return value;
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  return value;
}

function cloneObject(value: unknown): DayIntelligenceObject | null {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return JSON.parse(JSON.stringify(value)) as DayIntelligenceObject;
}

function cloneObjectList(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> =>
      item != null && typeof item === 'object' && !Array.isArray(item)
  ).map((item) => JSON.parse(JSON.stringify(item)) as Record<string, unknown>);
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
  return {
    finalScore,
    dayClass: dayClass as DayClass,
    conflict: src.conflict,
    rating,
    materialSupportiveCount: supportive ?? 0,
    materialCautionCount: caution ?? 0,
    basis: basis ?? 'score_bands+evidence_conflict',
    evidence: cloneObjectList(src.evidence),
    actionType: readString(src.action_type),
    dominantAspects: cloneObjectList(src.dominant_aspects),
    scoringContext: cloneObject(src.scoring_context) ?? {},
    dimensions: cloneObject(src.dimensions),
    dimensionClassification: cloneObject(src.dimension_classification),
  };
}

export function shadowClassifierVersion(
  intelligence: CalendarDayIntelligence | null | undefined
): string | null {
  const raw = intelligence?.dimensionClassification?.classifier_version;
  return typeof raw === 'string' ? raw : null;
}

export function shadowSemanticStatus(
  intelligence: CalendarDayIntelligence | null | undefined
): string | null {
  const raw = intelligence?.dimensionClassification?.semantic_status;
  return typeof raw === 'string' ? raw : null;
}

export function shadowDayClass(
  intelligence: CalendarDayIntelligence | null | undefined
): string | null {
  const raw = intelligence?.dimensionClassification?.day_class;
  return typeof raw === 'string' ? raw : null;
}

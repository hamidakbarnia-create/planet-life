/**
 * Decision Frame v1 — ASK input/framing contract.
 *
 * Boundary:
 * - Frame = ephemeral understanding / operation resolution (Ask path)
 * - Decision Case = persistence / lifecycle SoR
 * - DecisionEvaluationPackage = canonical evaluation payload (downstream)
 *
 * This is NOT a second output schema and NOT Decision Memory.
 */

export const DECISION_FRAME_SCHEMA_VERSION = '1.0.0' as const;

/** MVP operations only. Window is a FIND result form, not an operation. */
export const DECISION_OPERATIONS = [
  'evaluate',
  'compare',
  'find',
  'unresolved',
] as const;
export type DecisionOperation = (typeof DECISION_OPERATIONS)[number];

export const TIME_SCOPES = [
  'specific_date',
  'multiple_dates',
  'date_range',
  'none',
] as const;
export type TimeScope = (typeof TIME_SCOPES)[number];

/** Presentation strength bands — primary surface (not raw scores). */
export const STRENGTH_BANDS = [
  'strong',
  'favorable',
  'mixed',
  'unfavorable',
  'unknown',
] as const;
export type StrengthBand = (typeof STRENGTH_BANDS)[number];

export const CONFIDENCE_BANDS = [
  'low',
  'medium',
  'medium-high',
  'high',
  'unknown',
] as const;
export type ConfidenceBand = (typeof CONFIDENCE_BANDS)[number];

export type DecisionFrameOption = {
  id: string;
  label: string;
  /** ISO date when the option is temporal. */
  date?: string;
};

export type DecisionFrameTimePayload = {
  scope: TimeScope;
  /** ISO dates for specific_date / multiple_dates. Never defaulted to today. */
  dates?: string[];
  /** Inclusive ISO range for date_range. */
  range_start?: string;
  range_end?: string;
};

/**
 * Upstream framing object. Unknown fields stay visible as unknown —
 * never silently invent operation or time.
 */
export type DecisionFrameV1 = {
  schema_version: typeof DECISION_FRAME_SCHEMA_VERSION;
  decision_type_id?: string;
  raw_intent: string;
  objective?: string;
  operation: DecisionOperation;
  time: DecisionFrameTimePayload;
  options?: DecisionFrameOption[];
  priorities?: string[];
  unknowns: string[];
  /** Open-ended intents need structuring before evaluation. */
  open_ended: boolean;
  /** Next clarifying question id when operation/time unresolved. */
  pending_clarification?:
    | 'operation'
    | 'time'
    | 'open_ended_axis'
    | null;
};

export type EvaluateResultViewModel = {
  operation: 'evaluate';
  subject_label: string;
  strength: StrengthBand;
  best_window?: string;
  avoid?: string;
  best_alternative?: string;
  confidence: ConfidenceBand;
  why: string[];
  conditions?: string[];
  /** Below-fold evidence buckets (presentation only). */
  known?: string[];
  inferred?: string[];
  unknown?: string[];
};

export type CompareResultViewModel = {
  operation: 'compare';
  options: Array<{
    option_id?: string;
    label: string;
    /** Canonical Gregorian ISO date (ordering / honesty). */
    date?: string;
    /** Locale-aware display label for the consumer-facing date. */
    date_label?: string;
    rank?: number;
    score?: number;
    strength: StrengthBand;
    strengths?: string[];
    risks?: string[];
  }>;
  winner_label: string;
  unique_winner: boolean;
  relative_explanation?: string;
  deciding_factor?: string;
  advantages: Array<{
    option_label: string;
    advantage: string;
  }>;
  confidence: ConfidenceBand;
  limitations?: string[];
  known?: string[];
  inferred?: string[];
  unknown?: string[];
};

export type FindWindowViewModel = {
  window_id: string;
  /** Canonical Gregorian ISO start (ordering / honesty). */
  start_date: string;
  /** Canonical Gregorian ISO end (ordering / honesty). */
  end_date: string;
  /** Atomic locale-aware range label for display (not separate RTL fragments). */
  range_label: string;
  start_label: string;
  end_label: string;
  peak_dates: string[];
  peak_labels: string[];
  strength: StrengthBand;
  band: string;
  peak_score?: number;
};

export type FindResultViewModel = {
  operation: 'find';
  /** Stronger timing window / comparable windows / no clearly dominant window */
  headline: string;
  unique_dominant: boolean;
  windows: FindWindowViewModel[];
  /** Canonical Gregorian ISO scanned-range start when present. */
  range_start?: string;
  /** Canonical Gregorian ISO scanned-range end when present. */
  range_end?: string;
  range_context?: string;
  confidence: ConfidenceBand;
  limitations?: string[];
  known?: string[];
  inferred?: string[];
  unknown?: string[];
};

export type OperationResultViewModel =
  | EvaluateResultViewModel
  | CompareResultViewModel
  | FindResultViewModel;

/** Blocks that must never appear on the new ASK result path. */
export const FORBIDDEN_GENERIC_COACHING_MARKERS = [
  'run a small experiment',
  'find a fact that would change your mind',
  'generic readiness',
  'opportunity score',
  'risk score',
  'readiness',
  'best case',
  'most likely',
  'downside case',
] as const;

/**
 * Grounding foundation v1 — evidence inventory + claim containers.
 *
 * Internal provenance only. Does not assert claim-level support yet,
 * does not change public AskDecisionResult fields or Conversation API.
 *
 * OBSERVATION STAGE (P2.1b-03 — intentional, not a blocker):
 * Grounding provenance currently observes the final localized and
 * writing-quality-processed AskDecisionResult.
 * It does not retain or correlate raw-provider claim provenance.
 * Claim-level grounding must introduce stage-aware provenance or
 * pre-transformation claim capture before support evaluation is enabled.
 *
 * Implication: this is final-output provenance preparation, not
 * end-to-end claim provenance. Do not relocate this layer in P2.1b-03.
 */

export const GROUNDING_PROVENANCE_VERSION = '1.0.0';
export const EVIDENCE_ITEM_VERSION = '1.0.0';

export const GROUNDING_STATUSES = ['used', 'degraded', 'unavailable'] as const;
export type GroundingStatus = (typeof GROUNDING_STATUSES)[number];

export const EVIDENCE_KINDS = [
  'question',
  'fact',
  'constraint',
  'timing',
  'conversation',
  'analysis',
  'plan',
  'missing_context',
] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

/**
 * Evidence origin vocabulary — ContextSource plus grounding-only origins.
 * Mirrored (not imported) so grounding validation stays self-contained.
 */
export const EVIDENCE_SOURCES = [
  'current_question',
  'input_analysis',
  'conversation',
  'user_profile',
  'timing',
  'decision_history',
  'stored_memory',
  'birth_data',
  'birth_chart',
  'calendar',
  'locale',
  'reasoning_plan',
] as const;
export type EvidenceSource = (typeof EVIDENCE_SOURCES)[number];

export const CLAIM_SUPPORT_STATUSES = [
  'supported',
  'partial',
  'unsupported',
  'unknown',
] as const;
export type ClaimSupportStatus = (typeof CLAIM_SUPPORT_STATUSES)[number];

/**
 * Structured evidence unit — traceable to observation/plan inputs.
 * No user-facing citation text.
 */
export type Evidence = {
  version: typeof EVIDENCE_ITEM_VERSION;
  id: string;
  kind: EvidenceKind;
  source: EvidenceSource;
  /** Stable key when applicable (fact key, missing-context key, plan field). */
  key?: string;
  /** Short deterministic digest of the underlying value — not display text. */
  valueDigest?: string;
  /** Finite 0–1 when known. */
  confidence?: number;
};

export type EvidenceRef = {
  evidenceId: string;
};

/**
 * Claim container for a response field path.
 * P2.1b-03 prepares containers + candidate refs; support status stays `unknown`
 * until claim-level grounding evaluates them.
 */
export type ClaimContainer = {
  id: string;
  /** Dot/bracket path into AskDecisionResult, e.g. `scores.timing.rationale`. */
  fieldPath: string;
  /** FNV digest of current field text when non-empty; null if empty/absent. */
  textDigest: string | null;
  /** Candidate evidence refs for future claim-level evaluation. */
  evidenceRefs: EvidenceRef[];
  status: ClaimSupportStatus;
};

export type GroundingProvenance = {
  version: typeof GROUNDING_PROVENANCE_VERSION;
  builtAt: string;
  evidence: Evidence[];
  claims: ClaimContainer[];
  status: GroundingStatus;
};

export const EVIDENCE_KEYS = [
  'version',
  'id',
  'kind',
  'source',
  'key',
  'valueDigest',
  'confidence',
] as const;

export const CLAIM_CONTAINER_KEYS = [
  'id',
  'fieldPath',
  'textDigest',
  'evidenceRefs',
  'status',
] as const;

export const GROUNDING_PROVENANCE_KEYS = [
  'version',
  'builtAt',
  'evidence',
  'claims',
  'status',
] as const satisfies ReadonlyArray<keyof GroundingProvenance>;

/** Major AskDecisionResult field paths prepared for grounding. */
export const GROUNDING_CLAIM_FIELD_PATHS = [
  'executiveSummary',
  'recommendation',
  'recommendationStatus',
  'scores.opportunity.rationale',
  'scores.risk.rationale',
  'scores.timing.rationale',
  'scores.readiness.rationale',
  'scores.confidence.rationale',
  'timing.timingRationale',
  'scenarios.bestCase.outcome',
  'scenarios.mostLikely.outcome',
  'scenarios.downsideCase.outcome',
  'confidence.explanation',
  'assumptions',
  'limitations',
] as const;

export type GroundingClaimFieldPath =
  (typeof GROUNDING_CLAIM_FIELD_PATHS)[number];

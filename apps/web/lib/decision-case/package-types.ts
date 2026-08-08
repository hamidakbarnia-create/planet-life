/**
 * Read-only TypeScript mirror of DecisionEvaluationPackage v1.
 *
 * Canonical source:
 * packages/decision_engine/schemas/decision_evaluation_package.v1.json
 */

export type DecisionMode = "evaluate_date" | "compare_dates";

export type PrecisionLevel =
  | "L1"
  | "L2"
  | "L3"
  | "L4"
  | "L5"
  | "L6"
  | "L7";

export type DecisionStance =
  | "proceed"
  | "proceed_with_conditions"
  | "wait"
  | "prefer_alternate"
  | "no_unique_winner"
  | "insufficient_data";

export type TimingBand = "high" | "moderate" | "low" | "na";
export type CandidateBand = Exclude<TimingBand, "na">;

export interface TimingCandidate {
  readonly date: string;
  readonly rank: number;
  readonly score: number;
  readonly band: CandidateBand;
  readonly option_id?: string;
  readonly label?: string;
  readonly strengths?: readonly string[];
  readonly risks?: readonly string[];
}

export interface DecisionEvaluationPackage {
  readonly case_id: string;
  readonly evaluation_id: string;
  readonly evaluation_version: number;
  readonly case_version: number;
  readonly decision_type_id: string;
  readonly family_id: string;
  readonly mode: DecisionMode;
  readonly precision_level: PrecisionLevel;
  readonly engine_id: string;
  readonly created_at: string;
  readonly schema_version: "1.0.0";

  readonly recommendation: {
    readonly stance: DecisionStance;
    readonly conditions: readonly string[];
    readonly summary: string;
  };

  readonly timing: {
    readonly material: boolean;
    readonly band: TimingBand;
    readonly score: number | null;
    readonly candidates: readonly TimingCandidate[];
    readonly notes: string;
  };

  readonly confidence: {
    readonly value: number;
    readonly precision_level: PrecisionLevel;
    readonly penalties: readonly {
      readonly code: string;
      readonly message: string;
    }[];
  };

  readonly evidence: {
    readonly items: readonly {
      readonly framework_id: string;
      readonly eligibility: string;
      readonly artifact_ref: string;
      readonly limits: readonly string[];
    }[];
  };

  readonly drivers: {
    readonly items: readonly {
      readonly id: string;
      readonly label: string;
      readonly score: number;
      readonly band: string;
      readonly support: string;
      readonly friction: string;
    }[];
  };

  readonly tradeoffs: {
    readonly items: readonly string[];
  };

  readonly risks: {
    readonly items: readonly string[];
  };

  readonly opportunities: {
    readonly items: readonly string[];
  };

  readonly action_plan: {
    readonly steps: readonly {
      readonly order: number;
      readonly action: string;
      readonly condition: string | null;
    }[];
  };

  readonly counter_recommendation: {
    readonly stance: DecisionStance;
    readonly summary: string;
    readonly reason: string;
  };

  readonly explainability: {
    readonly why: string;
    readonly why_not: string;
    readonly assumptions: readonly string[];
    readonly limits: readonly string[];
  };

  readonly improve_accuracy: {
    readonly items: readonly string[];
  };

  readonly next_decisions: {
    readonly items: readonly DecisionLink[];
  };

  readonly related_decisions: {
    readonly items: readonly DecisionLink[];
  };
}

export interface DecisionLink {
  readonly decision_type_id: string;
  readonly label: string;
}

export type SemanticPreviewLocale = 'en' | 'fa' | 'ar' | 'ru';

export type SemanticExplanationInput = {
  schema_version?: string;
  semantic_status?: string;
  headline_code: string;
  summary_code: string;
  opportunity_code: string;
  posture_code: string;
  tradeoff_code?: string | null;
  caution_codes?: readonly string[];
  support_codes?: readonly string[];
  safety_codes?: readonly string[];
  evidence_refs?: readonly {
    code?: string;
    role?: string;
    dimension_id?: string | null;
    evidence_ids?: readonly string[];
  }[];
  localization_args?: Record<string, unknown>;
};

export type RenderedSemanticExplanation = {
  schema_version: 'semantic_render.v1-shadow';
  semantic_status: 'experimental_shadow';
  locale: string;
  text_direction: 'ltr' | 'rtl';
  status: 'ok' | 'unavailable';
  unavailable_code?: string | null;
  headline: string | null;
  summary: string | null;
  opportunity: string | null;
  posture: string | null;
  tradeoff: string | null;
  supports: string[];
  cautions: string[];
  safety: string[];
};

export type SemanticRenderContext = {
  option_labels?: Record<string, string>;
  left_label?: string;
  right_label?: string;
};

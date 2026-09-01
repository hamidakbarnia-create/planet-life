/**
 * Deterministic SemanticExplanation renderer (Phase 3F1 catalogs).
 * Same JSON catalogs as packages/decision_engine/i18n/catalogs.
 * No LLM. No English fallback for a supported locale.
 */

import arCatalog from './catalogs/ar.json';
import enCatalog from './catalogs/en.json';
import faCatalog from './catalogs/fa.json';
import ruCatalog from './catalogs/ru.json';
import type {
  RenderedSemanticExplanation,
  SemanticExplanationInput,
  SemanticPreviewLocale,
  SemanticRenderContext,
} from './types';

export const SUPPORTED_LOCALES = ['en', 'fa', 'ar', 'ru'] as const;

export const REQUIRED_SLOTS: Record<string, readonly string[]> = {
  'semantic.higher_score_stronger_opportunity': ['higher_score_option'],
  'semantic.cleaner_posture': ['option'],
  'semantic.lower_score_cleaner_posture': ['cleaner_posture_option'],
  'semantic.material_tradeoff': [
    'higher_score_option',
    'cleaner_posture_option',
  ],
  'semantic.near_tie_cleaner_posture': ['option'],
  'semantic.score_advantage_with_caution': ['higher_score_option'],
};

const CATALOGS = {
  en: enCatalog,
  fa: faCatalog,
  ar: arCatalog,
  ru: ruCatalog,
} as const;

const TEXT_DIRECTION: Record<string, 'ltr' | 'rtl'> = {
  en: 'ltr',
  fa: 'rtl',
  ar: 'rtl',
  ru: 'ltr',
};

export const UNAVAILABLE_UNSUPPORTED_LOCALE = 'render.unsupported_locale';
export const UNAVAILABLE_MISSING_ENTRY = 'render.missing_catalog_entry';
export const UNAVAILABLE_MISSING_ARGS = 'render.missing_placeholder_args';
export const UNAVAILABLE_MALFORMED_TEMPLATE = 'render.malformed_template';

const SLOT_RE = /\{([a-z][a-z0-9_]*)\}/g;
const UNSAFE_BRACE_RE = /[{}]/g;

type CatalogFile = {
  locale: string;
  dir: string;
  messages: Record<string, string>;
  posture_terms: Record<string, string>;
};

function catalogFor(locale: string): CatalogFile | null {
  if (!(locale in CATALOGS)) return null;
  return CATALOGS[locale as SemanticPreviewLocale] as CatalogFile;
}

function sanitize(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(UNSAFE_BRACE_RE, '');
}

function requiredSlots(code: string): readonly string[] {
  return REQUIRED_SLOTS[code] ?? [];
}

export function textDirection(locale: string): 'ltr' | 'rtl' {
  return TEXT_DIRECTION[locale] ?? 'ltr';
}

export function templateFor(locale: string, code: string): string | null {
  const catalog = catalogFor(locale);
  const template = catalog?.messages[code];
  if (!template || !template.trim()) return null;
  return template;
}

function interpolate(
  template: string,
  slots: Record<string, string>
): { ok: true; text: string } | { ok: false; code: string } {
  const missing: string[] = [];
  const rendered = template.replace(SLOT_RE, (_all, name: string) => {
    if (!slots[name]) {
      missing.push(name);
      return `{${name}}`;
    }
    return slots[name];
  });
  if (missing.length) {
    return { ok: false, code: UNAVAILABLE_MISSING_ARGS };
  }
  if (SLOT_RE.test(rendered) || rendered.includes('{') || rendered.includes('}')) {
    SLOT_RE.lastIndex = 0;
    return { ok: false, code: UNAVAILABLE_MALFORMED_TEMPLATE };
  }
  SLOT_RE.lastIndex = 0;
  return { ok: true, text: rendered };
}

export function buildNamedSlots(
  explanation: SemanticExplanationInput,
  displayContext: SemanticRenderContext = {}
): Record<string, string> {
  const args = explanation.localization_args ?? {};
  const labels = { ...(displayContext.option_labels ?? {}) };
  const leftId = args.left_id != null ? String(args.left_id) : '';
  const rightId = args.right_id != null ? String(args.right_id) : '';
  if (displayContext.left_label && leftId) {
    labels[leftId] ??= displayContext.left_label;
  }
  if (displayContext.right_label && rightId) {
    labels[rightId] ??= displayContext.right_label;
  }

  const labelFor = (optionId: unknown): string | null => {
    if (optionId == null || optionId === '') return null;
    const key = String(optionId);
    if (labels[key]) return sanitize(labels[key]);
    return sanitize(key);
  };

  const slots: Record<string, string> = {};
  const leftLabel = labelFor(leftId || null);
  const rightLabel = labelFor(rightId || null);
  if (leftLabel) slots.left_label = leftLabel;
  if (rightLabel) slots.right_label = rightLabel;
  const higher = labelFor(args.score_preference);
  const cleaner = labelFor(args.posture_preference);
  if (higher) slots.higher_score_option = higher;
  if (cleaner) {
    slots.cleaner_posture_option = cleaner;
    slots.option = cleaner;
  }
  return slots;
}

function renderCode(
  code: string | null | undefined,
  locale: string,
  slots: Record<string, string>
): { ok: true; text: string | null } | { ok: false; code: string } {
  if (!code) return { ok: true, text: null };
  for (const name of requiredSlots(code)) {
    if (!slots[name]) {
      return { ok: false, code: UNAVAILABLE_MISSING_ARGS };
    }
  }
  const template = templateFor(locale, code);
  if (!template) return { ok: false, code: UNAVAILABLE_MISSING_ENTRY };
  const interpolated = interpolate(template, slots);
  if (!interpolated.ok) return interpolated;
  return { ok: true, text: interpolated.text };
}

function unavailable(
  locale: string,
  code: string
): RenderedSemanticExplanation {
  return {
    schema_version: 'semantic_render.v1-shadow',
    semantic_status: 'experimental_shadow',
    locale,
    text_direction: textDirection(locale),
    status: 'unavailable',
    unavailable_code: code,
    headline: null,
    summary: null,
    opportunity: null,
    posture: null,
    tradeoff: null,
    supports: [],
    cautions: [],
    safety: [],
  };
}

export function renderSemanticExplanation(
  explanation: SemanticExplanationInput | null | undefined,
  locale: string,
  displayContext: SemanticRenderContext = {}
): RenderedSemanticExplanation {
  if (!explanation) {
    return unavailable(locale, 'render.missing_explanation');
  }
  if (!SUPPORTED_LOCALES.includes(locale as SemanticPreviewLocale)) {
    return unavailable(locale, UNAVAILABLE_UNSUPPORTED_LOCALE);
  }
  const slots = buildNamedSlots(explanation, displayContext);
  const fields = {
    headline: renderCode(explanation.headline_code, locale, slots),
    summary: renderCode(explanation.summary_code, locale, slots),
    opportunity: renderCode(explanation.opportunity_code, locale, slots),
    posture: renderCode(explanation.posture_code, locale, slots),
    tradeoff: renderCode(explanation.tradeoff_code, locale, slots),
  };
  for (const result of Object.values(fields)) {
    if (!result.ok) return unavailable(locale, result.code);
  }
  const supports: string[] = [];
  const cautions: string[] = [];
  const safety: string[] = [];
  for (const code of explanation.support_codes ?? []) {
    const result = renderCode(code, locale, slots);
    if (!result.ok) return unavailable(locale, result.code);
    if (result.text) supports.push(result.text);
  }
  for (const code of explanation.caution_codes ?? []) {
    const result = renderCode(code, locale, slots);
    if (!result.ok) return unavailable(locale, result.code);
    if (result.text) cautions.push(result.text);
  }
  for (const code of explanation.safety_codes ?? []) {
    const result = renderCode(code, locale, slots);
    if (!result.ok) return unavailable(locale, result.code);
    if (result.text) safety.push(result.text);
  }
  return {
    schema_version: 'semantic_render.v1-shadow',
    semantic_status: 'experimental_shadow',
    locale,
    text_direction: textDirection(locale),
    status: 'ok',
    unavailable_code: null,
    headline: fields.headline.ok ? fields.headline.text : null,
    summary: fields.summary.ok ? fields.summary.text : null,
    opportunity: fields.opportunity.ok ? fields.opportunity.text : null,
    posture: fields.posture.ok ? fields.posture.text : null,
    tradeoff: fields.tradeoff.ok ? fields.tradeoff.text : null,
    supports,
    cautions,
    safety,
  };
}

export function catalogMessages(locale: SemanticPreviewLocale): Record<string, string> {
  return { ...(catalogFor(locale)?.messages ?? {}) };
}

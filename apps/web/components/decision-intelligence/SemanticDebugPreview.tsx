'use client';

import { useMemo, useState } from 'react';
import { PREVIEW_CHROME } from '@/lib/decision-intelligence/preview-copy';
import { isDecisionSemanticsPreviewEnabled } from '@/lib/decision-intelligence/preview-flag';
import {
  SUPPORTED_LOCALES,
  renderSemanticExplanation,
} from '@/lib/decision-intelligence/semantic-render';
import type {
  SemanticExplanationInput,
  SemanticPreviewLocale,
  SemanticRenderContext,
} from '@/lib/decision-intelligence/types';

export type SemanticDebugPreviewProps = {
  explanation?: SemanticExplanationInput | null;
  policy?: Record<string, unknown> | null;
  assessment?: Record<string, unknown> | null;
  score?: number | null;
  posture?: string | null;
  riskLevel?: string | null;
  locale?: SemanticPreviewLocale;
  displayContext?: SemanticRenderContext;
  extra?: {
    windowKind?: string;
    daySequence?: readonly string[];
    evidenceIds?: readonly string[];
    dimensionValues?: Record<string, unknown>;
    rationaleCodes?: readonly string[];
    riskResolution?: string | null;
    schemaVersion?: string | null;
    classifierVersion?: string | null;
    policyVersion?: string | null;
    explanationVersion?: string | null;
  };
  forceEnabled?: boolean;
};

function asLocale(value: string | undefined): SemanticPreviewLocale {
  if (value === 'fa' || value === 'ar' || value === 'ru') return value;
  return 'en';
}

export function SemanticDebugPreview({
  explanation,
  policy,
  assessment,
  score,
  posture,
  riskLevel,
  locale: localeProp = 'en',
  displayContext,
  extra,
  forceEnabled = false,
}: SemanticDebugPreviewProps) {
  const enabled = forceEnabled || isDecisionSemanticsPreviewEnabled();
  const [locale, setLocale] = useState<SemanticPreviewLocale>(asLocale(localeProp));
  const chrome = PREVIEW_CHROME[locale];
  const rendered = useMemo(
    () => renderSemanticExplanation(explanation ?? null, locale, displayContext),
    [explanation, locale, displayContext]
  );

  if (!enabled) return null;

  const resolvedScore =
    score ??
    (typeof assessment?.score === 'number' ? assessment.score : null);
  const resolvedPosture =
    posture ??
    (typeof (assessment?.dimension_classification as { day_class?: string } | undefined)
      ?.day_class === 'string'
      ? (assessment?.dimension_classification as { day_class: string }).day_class
      : null);
  const relation =
    typeof policy?.relation === 'string'
      ? policy.relation
      : typeof policy?.evaluate_interpretation === 'string'
        ? policy.evaluate_interpretation
        : null;
  const risk =
    riskLevel ??
    (typeof policy?.risk_level === 'string' ? policy.risk_level : null) ??
    (typeof (assessment?.context as { risk_level?: string } | undefined)?.risk_level ===
    'string'
      ? (assessment?.context as { risk_level: string }).risk_level
      : null);

  const blob = [
    rendered.headline,
    rendered.summary,
    rendered.opportunity,
    rendered.posture,
    rendered.tradeoff,
    ...rendered.supports,
    ...rendered.cautions,
    ...rendered.safety,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    <aside
      data-testid="semantic-debug-preview"
      data-experimental="true"
      data-preview-locale={locale}
      data-preview-status={rendered.status}
      dir={rendered.text_direction}
      className="mt-4 rounded-xl px-3 py-3 space-y-3"
      style={{
        background: 'rgba(212,175,55,0.06)',
        border: '1px dashed rgba(212,175,55,0.45)',
      }}
    >
      <header className="space-y-1">
        <p
          className="fi text-[10px] uppercase tracking-[0.14em]"
          data-testid="semantic-debug-banner"
          style={{ color: 'rgba(251,191,36,0.95)' }}
        >
          {chrome.experimental}
        </p>
        <p className="fi text-[11px] text-white/55">{chrome.notForRanking}</p>
        <p className="fi text-[11px] text-white/45">{chrome.timingNotProbability}</p>
      </header>

      <div
        className="flex flex-wrap gap-1"
        data-testid="semantic-debug-locale-switch"
        aria-label={chrome.localeLabel}
      >
        {SUPPORTED_LOCALES.map((item) => (
          <button
            key={item}
            type="button"
            className="fi text-[10px] uppercase px-2 py-1 rounded"
            data-testid={`semantic-locale-${item}`}
            aria-pressed={locale === item}
            onClick={() => setLocale(item)}
            style={{
              border: '1px solid rgba(255,255,255,0.15)',
              background:
                locale === item ? 'rgba(212,175,55,0.2)' : 'transparent',
              color: 'rgba(255,255,255,0.8)',
            }}
          >
            {item}
          </button>
        ))}
      </div>

      {rendered.status === 'unavailable' || !explanation ? (
        <p
          className="fi text-sm text-amber-200/90"
          data-testid="semantic-debug-unavailable"
        >
          {chrome.unavailable}
          {rendered.unavailable_code ? ` (${rendered.unavailable_code})` : ''}
        </p>
      ) : (
        <div className="space-y-2" data-testid="semantic-debug-body">
          <dl className="fi text-[12px] text-white/75 space-y-1">
            {resolvedScore != null ? (
              <div>
                <dt className="text-white/40">{chrome.score}</dt>
                <dd data-testid="semantic-debug-score">{resolvedScore}</dd>
              </div>
            ) : null}
            {resolvedPosture ? (
              <div>
                <dt className="text-white/40">{chrome.posture}</dt>
                <dd data-testid="semantic-debug-posture">{resolvedPosture}</dd>
              </div>
            ) : null}
            {rendered.headline ? (
              <div>
                <dt className="text-white/40">{chrome.headline}</dt>
                <dd data-testid="semantic-debug-headline">{rendered.headline}</dd>
              </div>
            ) : null}
            {rendered.summary ? (
              <div>
                <dt className="text-white/40">{chrome.summary}</dt>
                <dd data-testid="semantic-debug-summary">{rendered.summary}</dd>
              </div>
            ) : null}
            {rendered.opportunity ? (
              <div>
                <dt className="text-white/40">{chrome.opportunity}</dt>
                <dd data-testid="semantic-debug-opportunity">
                  {rendered.opportunity}
                </dd>
              </div>
            ) : null}
            {rendered.posture ? (
              <div>
                <dt className="text-white/40">{chrome.postureMessage}</dt>
                <dd data-testid="semantic-debug-posture-copy">
                  {rendered.posture}
                </dd>
              </div>
            ) : null}
            {rendered.tradeoff ? (
              <div>
                <dt className="text-white/40">{chrome.tradeoff}</dt>
                <dd data-testid="semantic-debug-tradeoff">{rendered.tradeoff}</dd>
              </div>
            ) : null}
          </dl>
          {rendered.supports.length ? (
            <ul data-testid="semantic-debug-supports" className="fi text-[12px] text-white/70 list-disc ps-4">
              {rendered.supports.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {rendered.cautions.length ? (
            <ul data-testid="semantic-debug-cautions" className="fi text-[12px] text-white/70 list-disc ps-4">
              {rendered.cautions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {rendered.safety.length ? (
            <ul data-testid="semantic-debug-safety" className="fi text-[12px] text-amber-100/80 list-disc ps-4">
              {rendered.safety.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {relation ? (
            <p className="fi text-[11px] text-white/45" data-testid="semantic-debug-policy">
              {chrome.policy}: {relation}
            </p>
          ) : null}
          {risk ? (
            <p className="fi text-[11px] text-white/45" data-testid="semantic-debug-risk">
              {chrome.risk}: {risk}
            </p>
          ) : null}
          {extra?.windowKind ? (
            <p className="fi text-[11px] text-white/45" data-testid="semantic-debug-window-kind">
              {chrome.windowPolicy}: {extra.windowKind}
            </p>
          ) : null}
          {extra?.daySequence?.length ? (
            <p className="fi text-[11px] text-white/45" data-testid="semantic-debug-day-sequence">
              {chrome.daySequence}: {extra.daySequence.join(' → ')}
            </p>
          ) : null}
        </div>
      )}

      <details className="fi text-[11px] text-white/45" data-testid="semantic-debug-details">
        <summary className="cursor-pointer select-none">{chrome.debugDetails}</summary>
        <pre className="mt-2 whitespace-pre-wrap break-all text-[10px] text-white/40">
          {JSON.stringify(
            {
              schema_version: extra?.schemaVersion ?? explanation?.schema_version,
              classifier_version: extra?.classifierVersion,
              policy_version: extra?.policyVersion ?? policy?.policy_version,
              explanation_version: extra?.explanationVersion ?? explanation?.schema_version,
              evidence_ids: extra?.evidenceIds ??
                explanation?.evidence_refs?.flatMap((item) => item.evidence_ids ?? []),
              dimension_values: extra?.dimensionValues,
              rationale_codes: extra?.rationaleCodes ?? policy?.rationale_codes,
              risk_resolution: extra?.riskResolution,
              unavailable_code: rendered.unavailable_code,
            },
            null,
            2
          )}
        </pre>
      </details>
      <span hidden data-testid="semantic-debug-copy-scan">
        {blob}
      </span>
    </aside>
  );
}

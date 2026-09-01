'use client';

import type { AppLang } from '@/lib/app-settings';
import type { ScoreReasoning } from '@/lib/score-reasoning';
import type { CalendarDayIntelligence, PlanetTransit, TransitSnapshotMeta } from '@/lib/calendar-scores';
import { WhyThisTiming } from '@/components/timing/WhyThisTiming';
import { SemanticDebugPreview } from '@/components/decision-intelligence/SemanticDebugPreview';
import { DayIntelligencePanel } from '@/components/decision-intelligence/DayIntelligencePanel';
import { PREVIEW_CHROME } from '@/lib/decision-intelligence/preview-copy';
import { isDecisionSemanticsPreviewEnabled } from '@/lib/decision-intelligence/preview-flag';
import { shadowDayClass } from '@/lib/calendar-day-intelligence';
import {
  buildDayIntelligenceView,
  explanationFromDayIntelligence,
} from '@/lib/decision-intelligence/day-intelligence-view';
import { LtrNumericSequence } from '@/components/ui/LtrNumericSequence';
import {
  DAY_INTELLIGENCE_CHROME,
  formatTimingStrength,
} from '@/lib/decision-intelligence/product-copy';
import type { SemanticPreviewLocale } from '@/lib/decision-intelligence/types';

export type CalendarSelectedDayInsightLabels = {
  dir: 'ltr' | 'rtl';
  loading: string;
  whyTiming: string;
  whyTimingFallback: string;
  supportingReasons: string;
  seeDetails?: string;
  hideDetails?: string;
  advancedDetails: string;
  transit: {
    title: string;
    hint: string;
    in: string;
    house: string;
    empty: string;
    detailsSummary: string;
    detailsPlace: string;
    detailsLocalTime: string;
    detailsUtc: string;
    detailsTimezone: string;
  };
  signs: string[];
  planets: Record<string, string>;
};

const PLANET_GLYPHS: Record<string, string> = {
  sun: '☉',
  moon: '☾',
  mercury: '☿',
  venus: '♀',
  mars: '♂',
  jupiter: '♃',
  saturn: '♄',
  uranus: '♅',
  neptune: '♆',
  pluto: '♇',
  north_node: '☊',
};

const PLANET_ORDER = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
  'north_node',
];

type Props = {
  lang: AppLang;
  labels: CalendarSelectedDayInsightLabels;
  reasoning: ScoreReasoning | null | undefined;
  transit: PlanetTransit[];
  transitMeta: TransitSnapshotMeta;
  loadingTransit: boolean;
  score?: number | null;
  dayIntelligence?: CalendarDayIntelligence | null;
  forcePreview?: boolean;
  dateLabel?: string | null;
  selectedEyebrow?: string;
};

function conflictedDimensionIds(
  intelligence: CalendarDayIntelligence | null | undefined
): string[] {
  const raw = intelligence?.dimensionClassification?.conflicted_dimension_ids;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

/**
 * Selected-day presentation: producer ScoreReasoning first, then product
 * Decision Intelligence when a semantic explanation can be rendered.
 * Sky/transit stay in Advanced details. Does not invent explanations or
 * expose ScoreReasoning.confidence as platform Confidence.
 */
export function CalendarSelectedDayInsight({
  lang,
  labels: t,
  reasoning,
  transit,
  transitMeta,
  loadingTransit,
  score,
  dayIntelligence,
  forcePreview = false,
  dateLabel,
  selectedEyebrow,
}: Props) {
  const previewOn = forcePreview || isDecisionSemanticsPreviewEnabled();
  const chrome = PREVIEW_CHROME[lang];
  const productChrome = DAY_INTELLIGENCE_CHROME[lang as SemanticPreviewLocale];
  const explanation = explanationFromDayIntelligence(dayIntelligence ?? null);
  const productView = buildDayIntelligenceView({
    explanation,
    locale: lang as SemanticPreviewLocale,
    score: score ?? dayIntelligence?.finalScore,
    posture: shadowDayClass(dayIntelligence),
    conflictedDimensionIds: conflictedDimensionIds(dayIntelligence),
  });

  return (
    <div data-testid="calendar-selected-day-insight">
      {dateLabel ? (
        <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
          <div>
            {selectedEyebrow ? (
              <div
                className="fi text-[10px] uppercase tracking-widest mb-1"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                {selectedEyebrow}
              </div>
            ) : null}
            <div className="fc text-lg" style={{ color: '#c5a059' }}>
              {dateLabel}
            </div>
          </div>
          {score != null && Number.isFinite(score) ? (
            <div
              className="fi text-sm"
              style={{ color: 'rgba(255,255,255,0.65)' }}
              data-testid="calendar-selected-timing-strength"
            >
              {productChrome.timingStrength}:{' '}
              <LtrNumericSequence kind="fraction">
                {formatTimingStrength(score)}
              </LtrNumericSequence>
            </div>
          ) : null}
        </div>
      ) : null}

      {productView?.conditionsLabel ? (
        <p
          className="fi text-sm mb-3"
          style={{ color: 'rgba(255,255,255,0.75)' }}
          data-testid="calendar-selected-conditions"
        >
          {productChrome.conditions}: {productView.conditionsLabel}
        </p>
      ) : null}

      {productView ? (
        <div className="mb-4" data-testid="calendar-day-intelligence">
          <DayIntelligencePanel view={productView} hideScore={Boolean(dateLabel)} />
        </div>
      ) : null}

      <WhyThisTiming
        className="mb-4"
        lang={lang}
        compact={Boolean(productView)}
        labels={{
          dir: t.dir,
          whyTiming: t.whyTiming,
          whyTimingFallback: t.whyTimingFallback,
          supportingReasons: t.supportingReasons,
          seeDetails: t.seeDetails,
          hideDetails: t.hideDetails,
        }}
        reasoning={reasoning}
      />

      {previewOn ? (
        <div
          className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3"
          data-testid="calendar-semantic-compare"
        >
          <section
            className="rounded-lg px-3 py-2"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            data-testid="calendar-current-result"
          >
            <p className="fi text-[10px] uppercase tracking-widest text-white/40 mb-1">
              {chrome.currentResult}
            </p>
            {score != null ? (
              <p className="fi text-sm text-white/80" data-testid="calendar-current-score">
                {chrome.score}: {score}
              </p>
            ) : null}
          </section>
          <section data-testid="calendar-experimental-di">
            <p className="fi text-[10px] uppercase tracking-widest text-amber-200/80 mb-1">
              {chrome.experimentalDi}
            </p>
            <SemanticDebugPreview
              forceEnabled={forcePreview}
              explanation={explanation}
              policy={dayIntelligence?.policy ?? null}
              score={score ?? dayIntelligence?.finalScore}
              posture={shadowDayClass(dayIntelligence)}
              locale={lang as SemanticPreviewLocale}
              extra={{
                classifierVersion:
                  typeof dayIntelligence?.dimensionClassification?.classifier_version ===
                  'string'
                    ? String(
                        dayIntelligence.dimensionClassification.classifier_version
                      )
                    : null,
                schemaVersion: explanation?.schema_version ?? null,
                policyVersion:
                  typeof dayIntelligence?.policy?.policy_version === 'string'
                    ? String(dayIntelligence.policy.policy_version)
                    : null,
                dimensionValues: dayIntelligence?.dimensions ?? undefined,
              }}
            />
          </section>
        </div>
      ) : null}

      <details
        className="mb-5 rounded-lg px-3 py-2"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
        dir={t.dir}
        data-testid="calendar-advanced-details"
      >
        <summary
          className="fi text-[11px] cursor-pointer select-none"
          style={{ color: 'rgba(212,175,55,0.85)' }}
        >
          {t.advancedDetails}
        </summary>

        <div className="mt-3">
          <div
            className="fi text-[10px] uppercase tracking-widest mb-2"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            {t.transit.title}
          </div>
          <p className="fi text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {t.transit.hint}
          </p>

          {(transitMeta.localIso || transitMeta.utcIso || transitMeta.calculatedFor) && (
            <details
              className="mb-3 rounded-lg px-3 py-2"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              dir={t.dir}
            >
              <summary
                className="fi text-[11px] cursor-pointer select-none"
                style={{ color: 'rgba(212,175,55,0.85)' }}
              >
                {t.transit.detailsSummary}
              </summary>
              <dl
                className="fi mt-2 flex flex-col gap-1.5 text-[11px]"
                style={{ color: 'rgba(255,255,255,0.55)' }}
              >
                {transitMeta.calculatedFor ? (
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                    <dt style={{ color: 'rgba(255,255,255,0.35)' }}>{t.transit.detailsPlace}</dt>
                    <dd className="m-0">{transitMeta.calculatedFor}</dd>
                  </div>
                ) : null}
                {transitMeta.localIso ? (
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                    <dt style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {t.transit.detailsLocalTime}
                    </dt>
                    <dd className="m-0">{transitMeta.localIso}</dd>
                  </div>
                ) : null}
                {transitMeta.utcIso ? (
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                    <dt style={{ color: 'rgba(255,255,255,0.35)' }}>{t.transit.detailsUtc}</dt>
                    <dd className="m-0">{transitMeta.utcIso}</dd>
                  </div>
                ) : null}
                {transitMeta.timezone ? (
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                    <dt style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {t.transit.detailsTimezone}
                    </dt>
                    <dd className="m-0">{transitMeta.timezone}</dd>
                  </div>
                ) : null}
              </dl>
            </details>
          )}

          {loadingTransit ? (
            <div className="py-4 text-center fi text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {t.loading}
            </div>
          ) : transit.length === 0 ? (
            <div className="py-3 text-center fi text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {t.transit.empty}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PLANET_ORDER.map((name) => {
                const body = transit.find((p) => p.name === name);
                if (!body) return null;
                const signName = t.signs[body.signIndex] ?? body.sign;
                const deg = Math.floor(body.degreeInSign);
                const min = Math.floor((body.degreeInSign - deg) * 60);
                return (
                  <div
                    key={name}
                    className="rounded-lg px-2.5 py-2 flex items-center gap-2"
                    data-testid={`calendar-transit-${name}`}
                    style={{
                      background: body.retrograde
                        ? 'rgba(248,113,113,0.08)'
                        : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${
                        body.retrograde
                          ? 'rgba(248,113,113,0.35)'
                          : 'rgba(255,255,255,0.07)'
                      }`,
                    }}
                  >
                    <span
                      className="fc text-base shrink-0"
                      style={{
                        color: body.retrograde ? '#f87171' : '#fbbf24',
                        width: 18,
                      }}
                    >
                      {PLANET_GLYPHS[name] ?? '•'}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span
                        className="fc text-[11px] truncate"
                        style={{ color: 'rgba(255,255,255,0.9)' }}
                      >
                        {t.planets[name] ?? name}
                        {body.retrograde && (
                          <span className="fi text-[9px] ml-1" style={{ color: '#f87171' }}>
                            ℞
                          </span>
                        )}
                      </span>
                      <span className="fi text-[10px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        {deg}°{String(min).padStart(2, '0')}′ {t.transit.in} {signName}
                        {body.house ? ` · ${t.transit.house} ${body.house}` : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </details>
    </div>
  );
}

'use client';

import type { ScoreReasoning } from '@/lib/score-reasoning';
import type { PlanetTransit, TransitSnapshotMeta } from '@/lib/calendar-scores';
import { WhyThisTiming } from '@/components/timing/WhyThisTiming';

export type CalendarSelectedDayInsightLabels = {
  dir: 'ltr' | 'rtl';
  loading: string;
  whyTiming: string;
  supportingReasons: string;
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
  labels: CalendarSelectedDayInsightLabels;
  reasoning: ScoreReasoning | null | undefined;
  transit: PlanetTransit[];
  transitMeta: TransitSnapshotMeta;
  loadingTransit: boolean;
};

/**
 * Selected-day presentation: producer ScoreReasoning first, sky/transit in Advanced details.
 * Does not invent explanations or expose ScoreReasoning.confidence as platform Confidence.
 */
export function CalendarSelectedDayInsight({
  labels: t,
  reasoning,
  transit,
  transitMeta,
  loadingTransit,
}: Props) {
  return (
    <div data-testid="calendar-selected-day-insight">
      <WhyThisTiming
        className="mb-4"
        labels={{
          dir: t.dir,
          whyTiming: t.whyTiming,
          supportingReasons: t.supportingReasons,
        }}
        reasoning={reasoning}
      />

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

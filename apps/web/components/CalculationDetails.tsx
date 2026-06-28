'use client';

import { useState } from 'react';
import type { ChartData } from '@/lib/chart-types';
import { formatDms } from '@/lib/chart-types';
import {
  formatCoordinateSource,
  getCalculationDetailsLabels,
  isRtlLang,
  type ProfileLang,
} from '@/lib/chart-profile-i18n';

type Props = {
  chart: ChartData;
  lang?: ProfileLang;
};

export function CalculationDetails({ chart, lang = 'en' }: Props) {
  const [open, setOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const labels = getCalculationDetailsLabels(lang);
  const rtl = isRtlLang(lang);

  const nodeLabel =
    chart.node_type === 'mean' ? 'Mean Node (☊) — Astro-Seek compatible' : 'True Node (☊)';

  const basicRows = [
    { k: labels.calculatedWith, v: chart.ephemeris_engine ?? 'Swiss Ephemeris' },
    { k: labels.timezone, v: chart.timezone },
    {
      k: labels.coordinates,
      v: `${chart.latitude.toFixed(4)}, ${chart.longitude.toFixed(4)}`,
    },
    { k: labels.houseSystem, v: chart.house_system },
    { k: labels.zodiac, v: chart.zodiac_label ?? chart.zodiac },
    { k: labels.nodeType, v: nodeLabel },
  ];

  const advancedRows = [
    { k: labels.utc, v: chart.utc_datetime },
    { k: 'Julian Day', v: String(chart.julian_day) },
    {
      k: labels.coordinateSource,
      v: formatCoordinateSource(chart.coordinate_source, lang),
    },
    { k: labels.timezoneSource, v: chart.timezone_source ?? 'IANA' },
    { k: labels.ephemeris, v: chart.ephemeris_engine ?? 'Swiss Ephemeris' },
    ...(chart.ayanamsa != null
      ? [
          {
            k: labels.ayanamsa,
            v: `${chart.ayanamsa.toFixed(4)}° (${chart.ayanamsa_system ?? 'Fagan-Bradley'})`,
          },
        ]
      : []),
    { k: labels.ascendant, v: formatDms(chart.ascendant) },
    { k: labels.midheaven, v: formatDms(chart.midheaven) },
    {
      k: labels.houseCusps,
      v: chart.houses.map((h, i) => `${i + 1}: ${formatDms(h)}`).join(' · '),
    },
    {
      k: labels.planetLongitudes,
      v: Object.entries(chart.planets)
        .map(([name, p]) => `${name}: ${formatDms(p.longitude)}`)
        .join(' · '),
    },
  ];

  return (
    <div
      className="w-full mt-4 rounded-xl overflow-hidden"
      dir={rtl ? 'rtl' : 'ltr'}
      data-testid="calculation-details"
      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`fi w-full flex items-center justify-between px-4 py-3 transition-colors ${rtl ? 'text-right' : 'text-left'}`}
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        <span className="text-xs tracking-widest uppercase" style={{ color: '#fbbf24' }}>
          {labels.title}
        </span>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          <div data-testid="calculation-details-basic">
            <div
              className="fi text-[10px] tracking-widest uppercase mb-2"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              {labels.basicTitle}
            </div>
            <div className="flex flex-col gap-2">
              {basicRows.map((row) => (
                <DetailRow key={row.k} label={row.k} value={row.v} rtl={rtl} />
              ))}
            </div>
          </div>

          <div data-testid="calculation-details-advanced">
            <button
              type="button"
              onClick={() => setAdvancedOpen((o) => !o)}
              className={`fi w-full text-[10px] tracking-wide py-2 ${rtl ? 'text-right' : 'text-left'}`}
              style={{ color: 'rgba(251,191,36,0.65)' }}
            >
              {advancedOpen ? labels.hideAdvanced : labels.showAdvanced}
            </button>
            {advancedOpen && (
              <div className="flex flex-col gap-2 pt-1 border-t border-white/5">
                {advancedRows.map((row) => (
                  <DetailRow key={row.k} label={row.k} value={row.v} rtl={rtl} />
                ))}
              </div>
            )}
          </div>

          {chart.calculation_timestamp && (
            <div className="fi text-[10px] pt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {labels.calculatedAt}: {chart.calculation_timestamp}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  rtl,
}: {
  label: string;
  value: string;
  rtl: boolean;
}) {
  return (
    <div
      className={`flex gap-4 text-[11px] ${rtl ? 'flex-row-reverse justify-between' : 'justify-between'}`}
    >
      <span className="fi shrink-0" style={{ color: 'rgba(255,255,255,0.45)' }}>
        {label}
      </span>
      <span
        className={`fi ${rtl ? 'text-left' : 'text-right'} break-all`}
        style={{ color: 'rgba(255,255,255,0.85)' }}
      >
        {value}
      </span>
    </div>
  );
}

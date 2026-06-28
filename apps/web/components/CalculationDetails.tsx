'use client';

import { useState } from 'react';
import type { ChartData } from '@/lib/chart-types';
import { CHART_DEFAULTS } from '@/lib/chart-defaults';

const SOURCE_LABELS: Record<string, string> = {
  selected_city_coordinates: 'Verified city coordinates (dropdown)',
  explicit_coordinates: 'Explicit coordinates',
  geocoded_fallback: 'Geocoded from city name (please confirm)',
};

type Props = {
  chart: ChartData;
  labels?: {
    title: string;
    coordinates: string;
    timezone: string;
    utc: string;
    zodiac: string;
    houseSystem: string;
    nodeType: string;
    ephemeris: string;
    coordinateSource: string;
    ayanamsa: string;
  };
};

const DEFAULT_LABELS = {
  title: 'Calculation details',
  coordinates: 'Coordinates',
  timezone: 'Timezone',
  utc: 'UTC conversion',
  zodiac: 'Zodiac',
  houseSystem: 'House system',
  nodeType: 'Node type',
  ephemeris: 'Ephemeris engine',
  coordinateSource: 'Coordinate source',
  ayanamsa: 'Ayanamsa',
};

export function CalculationDetails({ chart, labels = DEFAULT_LABELS }: Props) {
  const [open, setOpen] = useState(false);
  const nodeLabel =
    chart.node_type === 'mean' ? 'Mean Node (☊) — Astro-Seek compatible' : 'True Node (☊)';
  const source =
    SOURCE_LABELS[chart.coordinate_source ?? ''] ?? chart.coordinate_source ?? '—';

  const rows = [
    { k: labels.coordinates, v: `${chart.latitude.toFixed(4)}, ${chart.longitude.toFixed(4)}` },
    { k: labels.timezone, v: `${chart.timezone} (${chart.timezone_source ?? 'IANA'})` },
    { k: labels.utc, v: chart.utc_datetime },
    { k: labels.zodiac, v: chart.zodiac_label ?? chart.zodiac },
    { k: labels.houseSystem, v: chart.house_system },
    { k: labels.nodeType, v: nodeLabel },
    { k: labels.ephemeris, v: chart.ephemeris_engine ?? 'Swiss Ephemeris' },
    { k: labels.coordinateSource, v: source },
  ];

  if (chart.ayanamsa != null) {
    rows.push({
      k: labels.ayanamsa,
      v: `${chart.ayanamsa.toFixed(4)}° (${chart.ayanamsa_system ?? 'Fagan-Bradley'})`,
    });
  }

  return (
    <div
      className="w-full mt-4 rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fi w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
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
        <div className="px-4 pb-4 flex flex-col gap-2">
          {rows.map((row) => (
            <div key={row.k} className="flex justify-between gap-4 text-[11px]">
              <span className="fi shrink-0" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {row.k}
              </span>
              <span className="fi text-right" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {row.v}
              </span>
            </div>
          ))}
          {chart.calculation_timestamp && (
            <div className="fi text-[10px] pt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Calculated {chart.calculation_timestamp}
            </div>
          )}
          <div
            className="fi text-[10px] mt-2 border-t border-white/5 pt-2"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            Defaults: {CHART_DEFAULTS.zodiac} · {CHART_DEFAULTS.houseSystem} ·{' '}
            {CHART_DEFAULTS.nodeType}. Sidereal uses {CHART_DEFAULTS.siderealAyanamsa} ayanamsa.
          </div>
        </div>
      )}
    </div>
  );
}

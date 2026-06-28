'use client';

import {
  type ChartData,
  computeScreenAngles,
  displayLongitude,
  formatDms,
  normalizeDegrees,
} from '@/lib/chart-types';

export function ChartDevPanel({ chart }: { chart: ChartData }) {
  const angles = computeScreenAngles(chart);
  const rows: { key: string; value: string }[] = [
    { key: 'city', value: chart.location },
    { key: 'country', value: chart.country ?? '—' },
    { key: 'latitude', value: String(chart.latitude) },
    { key: 'longitude', value: String(chart.longitude) },
    { key: 'timezone', value: chart.timezone },
    { key: 'local datetime', value: chart.local_datetime },
    { key: 'UTC datetime', value: chart.utc_datetime },
    { key: 'Julian Day', value: String(chart.julian_day) },
    { key: 'house system', value: chart.house_system },
    { key: 'zodiac', value: chart.zodiac },
    { key: 'node type', value: chart.node_type === 'mean' ? 'Mean Node (☊)' : 'True Node (☊)' },
    { key: 'ephemeris', value: chart.ephemeris_engine ?? '—' },
    { key: 'zodiac label', value: chart.zodiac_label ?? chart.zodiac },
    { key: 'timezone source', value: chart.timezone_source ?? '—' },
    { key: 'coordinate source', value: chart.coordinate_source ?? '—' },
    { key: 'calculated at', value: chart.calculation_timestamp ?? '—' },
    { key: 'ascendant', value: `${formatDms(chart.ascendant)} (${chart.ascendant.toFixed(4)}°)` },
    { key: 'midheaven', value: `${formatDms(chart.midheaven)} (${chart.midheaven.toFixed(4)}°)` },
    { key: 'houses[]', value: chart.houses.map((h, i) => `${i + 1}: ${h.toFixed(2)}°`).join(' · ') },
    { key: 'ASC screen °', value: `${angles.ascendant.toFixed(2)}° (expect ~270)` },
    { key: 'MC screen °', value: `${angles.midheaven.toFixed(2)}°` },
    { key: 'IC screen °', value: `${angles.ic.toFixed(2)}°` },
    { key: 'DSC screen °', value: `${angles.descendant.toFixed(2)}° (expect ~90)` },
  ];

  return (
    <div
      className="w-full mt-4 rounded-xl p-4 text-left"
      style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.35)' }}
    >
      <div className="fi text-[11px] tracking-widest uppercase mb-2" style={{ color: '#93c5fd' }}>
        Developer verification (dev only)
      </div>
      <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
        {rows.map((row) => (
          <div key={row.key} className="fi text-[11px] leading-snug">
            <span style={{ color: 'rgba(147,197,253,0.75)' }}>{row.key}: </span>
            <span style={{ color: 'rgba(255,255,255,0.85)' }}>{row.value}</span>
          </div>
        ))}
        <div className="fi text-[11px] mt-2" style={{ color: '#93c5fd' }}>Planets</div>
        {Object.entries(chart.planets).map(([name, p]) => (
          <div key={name} className="fi text-[11px] leading-snug pl-2">
            <span style={{ color: 'rgba(255,255,255,0.65)' }}>{name}: </span>
            <span style={{ color: 'rgba(255,255,255,0.9)' }}>
              {formatDms(p.longitude)} · sign {p.sign} · {p.degree.toFixed(2)}° in sign
              {p.retrograde ? ' · R' : ''} · screen {angles[name]?.toFixed(2) ?? '—'}°
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { displayLongitude, normalizeDegrees };

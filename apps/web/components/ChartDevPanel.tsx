'use client';

import {
  type ChartData,
  computeScreenAngles,
  formatDms,
} from '@/lib/chart-types';
import {
  formatCoordinateSource,
  getDevPanelLabels,
  type ProfileLang,
} from '@/lib/chart-profile-i18n';

type Props = {
  chart: ChartData;
  lang?: ProfileLang;
};

function DevRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="fi rounded-lg px-3 py-2.5"
      style={{ background: 'rgba(255,255,255,0.03)' }}
      data-testid="dev-panel-row"
    >
      <div
        className="text-[10px] tracking-wide mb-1 leading-normal"
        style={{ color: 'rgba(147,197,253,0.8)' }}
      >
        {label}
      </div>
      <div
        className="text-[11px] leading-relaxed break-words"
        style={{ color: 'rgba(255,255,255,0.9)' }}
      >
        {value}
      </div>
    </div>
  );
}

export function ChartDevPanel({ chart, lang = 'en' }: Props) {
  const labels = getDevPanelLabels(lang);
  const rtl = lang === 'fa' || lang === 'ar';
  const angles = computeScreenAngles(chart);

  const rows: { label: string; value: string }[] = [
    { label: labels.city, value: chart.location },
    { label: labels.country, value: chart.country ?? '—' },
    { label: labels.latitude, value: `${chart.latitude.toFixed(6)}°` },
    { label: labels.longitude, value: `${chart.longitude.toFixed(6)}°` },
    { label: labels.timezone, value: chart.timezone },
    { label: labels.localDatetime, value: chart.local_datetime },
    { label: labels.utcDatetime, value: chart.utc_datetime },
    { label: labels.julianDay, value: String(chart.julian_day) },
    { label: labels.houseSystem, value: chart.house_system },
    { label: labels.zodiac, value: chart.zodiac },
    {
      label: labels.nodeType,
      value: chart.node_type === 'mean' ? 'Mean Node (☊)' : 'True Node (☊)',
    },
    { label: labels.ephemeris, value: chart.ephemeris_engine ?? '—' },
    { label: labels.zodiacLabel, value: chart.zodiac_label ?? chart.zodiac },
    { label: labels.timezoneSource, value: chart.timezone_source ?? '—' },
    {
      label: labels.coordinateSource,
      value: formatCoordinateSource(chart.coordinate_source, lang),
    },
    { label: labels.calculatedAt, value: chart.calculation_timestamp ?? '—' },
    {
      label: labels.ascendant,
      value: `${formatDms(chart.ascendant)} (${chart.ascendant.toFixed(4)}°)`,
    },
    {
      label: labels.midheaven,
      value: `${formatDms(chart.midheaven)} (${chart.midheaven.toFixed(4)}°)`,
    },
    {
      label: labels.houses,
      value: chart.houses.map((h, i) => `${i + 1}: ${h.toFixed(2)}°`).join(' · '),
    },
    { label: labels.ascScreen, value: `${angles.ascendant.toFixed(2)}° (expect ~270)` },
    { label: labels.mcScreen, value: `${angles.midheaven.toFixed(2)}°` },
    { label: labels.icScreen, value: `${angles.ic.toFixed(2)}°` },
    { label: labels.dscScreen, value: `${angles.descendant.toFixed(2)}° (expect ~90)` },
  ];

  return (
    <div
      className="w-full mt-4 rounded-xl p-4"
      dir={rtl ? 'rtl' : 'ltr'}
      data-testid="chart-dev-panel"
      style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.35)' }}
    >
      <div
        className="fi text-[11px] tracking-widest uppercase mb-3 leading-normal"
        style={{ color: '#93c5fd' }}
        data-testid="dev-panel-title"
      >
        {labels.title}
      </div>
      <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
        {rows.map((row) => (
          <DevRow key={row.label} label={row.label} value={row.value} />
        ))}
        <div
          className="fi text-[10px] tracking-wide pt-2 mt-1 leading-normal"
          style={{ color: '#93c5fd' }}
        >
          {labels.planets}
        </div>
        {Object.entries(chart.planets).map(([name, p]) => (
          <DevRow
            key={name}
            label={name}
            value={`${formatDms(p.longitude)} · sign ${p.sign} · ${p.degree.toFixed(2)}° in sign${
              p.retrograde ? ' · R' : ''
            } · screen ${angles[name]?.toFixed(2) ?? '—'}°`}
          />
        ))}
      </div>
    </div>
  );
}

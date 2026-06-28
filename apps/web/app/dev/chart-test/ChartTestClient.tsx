'use client';

import { useState } from 'react';
import { NatalChart, type NatalChartLabels } from '@/components/NatalChart';
import { ChartDevPanel } from '@/components/ChartDevPanel';
import { CHART_FIXTURES } from '@/lib/chart-fixtures';
import { computeScreenAngles } from '@/lib/chart-types';

const LABELS: NatalChartLabels = {
  empty: 'No chart',
  elementsTitle: 'Elemental balance',
  strengthsTitle: 'Chart strengths',
  elements: { fire: 'Fire', earth: 'Earth', air: 'Air', water: 'Water' },
  planetNames: {
    sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
    jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
    pluto: 'Pluto', north_node: 'Mean Node (☊)',
  },
  signNames: {
    Aries: 'Aries', Taurus: 'Taurus', Gemini: 'Gemini', Cancer: 'Cancer',
    Leo: 'Leo', Virgo: 'Virgo', Libra: 'Libra', Scorpio: 'Scorpio',
    Sagittarius: 'Sagittarius', Capricorn: 'Capricorn', Aquarius: 'Aquarius', Pisces: 'Pisces',
  },
  aspectLegend: {
    trine: 'Trine', square: 'Square', sextile: 'Sextile',
    opposition: 'Opposition', conjunction: 'Conjunction',
  },
  lang: 'en',
};

export function ChartTestClient() {
  const [activeId, setActiveId] = useState<string>(CHART_FIXTURES[0].id);
  const fixture = CHART_FIXTURES.find((f) => f.id === activeId) ?? CHART_FIXTURES[0];
  const angles = computeScreenAngles(fixture.chart);

  return (
    <div className="min-h-screen bg-[#070B14] text-white p-8">
      <h1 className="text-xl font-semibold mb-2" style={{ color: '#fbbf24' }}>
        Chart visual regression (dev only)
      </h1>
      <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Fixed fixture charts for manual visual verification. Not available in production.
      </p>

      <div className="flex gap-2 mb-6 flex-wrap">
        {CHART_FIXTURES.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveId(f.id)}
            className="px-4 py-2 rounded-lg text-sm border transition-colors"
            style={{
              background: activeId === f.id ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)',
              borderColor: activeId === f.id ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.1)',
              color: activeId === f.id ? '#fbbf24' : 'rgba(255,255,255,0.7)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <NatalChart chart={fixture.chart} labels={LABELS} />
        </div>
        <div>
          <ChartDevPanel chart={fixture.chart} />
          <div className="mt-4 rounded-xl p-4 text-xs" style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="mb-2" style={{ color: '#93c5fd' }}>Screen angle assertions</div>
            <div>ASC screen: {angles.ascendant.toFixed(2)}° (expect 270)</div>
            <div>DSC screen: {angles.descendant.toFixed(2)}° (expect 90)</div>
            <div>MC screen: {angles.midheaven.toFixed(2)}°</div>
            <div>IC screen: {angles.ic.toFixed(2)}°</div>
          </div>
        </div>
      </div>
    </div>
  );
}

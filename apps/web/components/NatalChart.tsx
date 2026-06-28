'use client';

import {
  ASPECT_COLORS,
  findNatalAspects,
  type NatalAspect,
} from '@/lib/natal-aspects';
import {
  computeChartStrengths,
  computeElementBalance,
  type ChartLang,
  type ElementBalance,
  type ElementKey,
} from '@/lib/chart-insights';
import {
  type ChartData,
  type ChartPlanet,
  displayLongitude,
  normalizeDegrees,
} from '@/lib/chart-types';

export type { ChartPlanet };

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
] as const;

const PSYM: Record<string, string> = {
  sun: '☉',
  moon: '☽',
  mercury: '☿',
  venus: '♀',
  mars: '♂',
  jupiter: '♃',
  saturn: '♄',
  uranus: '⛢',
  neptune: '♆',
  pluto: '♇',
  north_node: '☊',
};

const PCOL: Record<string, string> = {
  sun: '#fbbf24',
  moon: '#a5f3fc',
  mercury: '#86efac',
  venus: '#f9a8d4',
  mars: '#f87171',
  jupiter: '#fb923c',
  saturn: '#94a3b8',
  uranus: '#67e8f9',
  neptune: '#818cf8',
  pluto: '#c084fc',
  north_node: '#fde68a',
};

const SIGN_GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
const SIGN_COLORS = [
  '#ef4444',
  '#22c55e',
  '#eab308',
  '#a5f3fc',
  '#f97316',
  '#6366f1',
  '#ec4899',
  '#dc2626',
  '#8b5cf6',
  '#64748b',
  '#06b6d4',
  '#0ea5e9',
];

export type NatalChartLabels = {
  empty: string;
  elementsTitle: string;
  strengthsTitle: string;
  elements: Record<ElementKey, string>;
  planetNames: Record<string, string>;
  signNames: Record<string, string>;
  aspectLegend: Record<string, string>;
  lang: ChartLang;
};

type PlanetLayout = { displayDeg: number; radius: number };

const CX = 160;
const CY = 160;
const R_OUTER = 118;
const R_MID = 88;
const R_INNER = 58;

function toXY(deg: number, radius: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

function midDisplayAngle(a: number, b: number): number {
  let diff = b - a;
  if (diff <= 0) diff += 360;
  return normalizeDegrees(a + diff / 2);
}

function computeLayouts(
  planets: Record<string, ChartPlanet>,
  ascendant: number
): Record<string, PlanetLayout> {
  const baseR = R_MID - 14;
  const items = PLANET_ORDER.filter((n) => planets[n]).map((name) => ({
    name,
    displayDeg: displayLongitude(planets[name].longitude, ascendant),
  }));

  items.sort((a, b) => a.displayDeg - b.displayDeg);
  const layouts: Record<string, PlanetLayout> = {};

  items.forEach((item, i) => {
    let radius = baseR;
    let displayDeg = item.displayDeg;

    if (i > 0) {
      const prevName = items[i - 1].name;
      const prev = layouts[prevName];
      let diff = Math.abs(displayDeg - prev.displayDeg);
      if (diff > 180) diff = 360 - diff;
      if (diff < 14) {
        radius = prev.radius === baseR ? baseR + 16 : baseR;
        if (diff < 8) displayDeg = prev.displayDeg + 4;
      }
    }

    layouts[item.name] = { displayDeg, radius };
  });

  return layouts;
}

function NatalChartWheel({
  chart,
  aspects,
  layouts,
}: {
  chart: ChartData;
  aspects: NatalAspect[];
  layouts: Record<string, PlanetLayout>;
}) {
  const { planets, ascendant, midheaven, houses } = chart;
  const planetNames = PLANET_ORDER.filter((n) => planets[n]);
  const dsc = normalizeDegrees(ascendant + 180);
  const ic = normalizeDegrees(midheaven + 180);
  const ascDeg = displayLongitude(ascendant, ascendant);
  const dscDeg = displayLongitude(dsc, ascendant);
  const mcDeg = displayLongitude(midheaven, ascendant);
  const icDeg = displayLongitude(ic, ascendant);

  return (
    <svg
      data-testid="chart-wheel"
      width="320"
      height="320"
      viewBox="0 0 320 320"
      className="w-[320px] md:w-[420px] h-auto"
      style={{ maxWidth: '100%' }}
    >
      <circle
        cx={CX}
        cy={CY}
        r={R_OUTER}
        fill="rgba(0,0,0,0.45)"
        stroke="rgba(251,191,36,0.35)"
        strokeWidth="1"
      />
      <circle
        cx={CX}
        cy={CY}
        r={R_MID}
        fill="rgba(0,0,0,0.2)"
        stroke="rgba(251,191,36,0.12)"
        strokeWidth="0.5"
      />
      <circle
        cx={CX}
        cy={CY}
        r={R_INNER}
        fill="rgba(0,0,0,0.1)"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="0.5"
      />

      {Array.from({ length: 12 }, (_, i) => {
        const startDeg = displayLongitude(i * 30, ascendant);
        const midDeg = displayLongitude(i * 30 + 15, ascendant);
        const p1 = toXY(startDeg, R_OUTER);
        const p2 = toXY(startDeg, R_MID);
        const ps = toXY(midDeg, R_OUTER + 14);
        return (
          <g key={`sign-${i}`}>
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="rgba(251,191,36,0.18)"
              strokeWidth="0.5"
            />
            <text
              x={ps.x}
              y={ps.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fill={SIGN_COLORS[i]}
            >
              {SIGN_GLYPHS[i]}
            </text>
          </g>
        );
      })}

      {houses.length === 12 &&
        houses.map((cusp, i) => {
          const deg = displayLongitude(cusp, ascendant);
          const p1 = toXY(deg, R_OUTER);
          const p2 = toXY(deg, R_INNER);
          const next = houses[(i + 1) % 12];
          const labelDeg = midDisplayAngle(
            displayLongitude(cusp, ascendant),
            displayLongitude(next, ascendant)
          );
          const label = toXY(labelDeg, R_MID - 6);
          return (
            <g key={`house-${i + 1}`} data-testid={`house-cusp-${i + 1}`}>
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="rgba(251,191,36,0.42)"
                strokeWidth="1"
              />
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="7"
                fill="rgba(255,255,255,0.55)"
              >
                {i + 1}
              </text>
            </g>
          );
        })}

      {Number.isFinite(ascendant) && (
        <g data-testid="axis-asc-dsc">
          <line
            x1={toXY(ascDeg, R_OUTER + 4).x}
            y1={toXY(ascDeg, R_OUTER + 4).y}
            x2={toXY(ascDeg, R_INNER).x}
            y2={toXY(ascDeg, R_INNER).y}
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="1.4"
          />
          <line
            x1={toXY(dscDeg, R_OUTER + 4).x}
            y1={toXY(dscDeg, R_OUTER + 4).y}
            x2={toXY(dscDeg, R_INNER).x}
            y2={toXY(dscDeg, R_INNER).y}
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="1.4"
          />
          <text
            data-testid="axis-ac"
            x={toXY(ascDeg, R_INNER - 10).x}
            y={toXY(ascDeg, R_INNER - 10).y}
            fontSize="8"
            fill="rgba(255,255,255,0.75)"
            textAnchor="middle"
          >
            AC
          </text>
          <text
            data-testid="axis-dc"
            x={toXY(dscDeg, R_INNER - 10).x}
            y={toXY(dscDeg, R_INNER - 10).y}
            fontSize="8"
            fill="rgba(255,255,255,0.75)"
            textAnchor="middle"
          >
            DC
          </text>
        </g>
      )}

      {Number.isFinite(midheaven) && (
        <g data-testid="axis-mc-ic">
          <line
            x1={toXY(mcDeg, R_OUTER + 4).x}
            y1={toXY(mcDeg, R_OUTER + 4).y}
            x2={toXY(icDeg, R_OUTER + 4).x}
            y2={toXY(icDeg, R_OUTER + 4).y}
            stroke="rgba(147,197,253,0.55)"
            strokeWidth="1.2"
            strokeDasharray="4 3"
          />
          <line
            x1={toXY(mcDeg, R_OUTER + 4).x}
            y1={toXY(mcDeg, R_OUTER + 4).y}
            x2={toXY(mcDeg, R_INNER).x}
            y2={toXY(mcDeg, R_INNER).y}
            stroke="rgba(147,197,253,0.45)"
            strokeWidth="1"
          />
          <line
            x1={toXY(icDeg, R_OUTER + 4).x}
            y1={toXY(icDeg, R_OUTER + 4).y}
            x2={toXY(icDeg, R_INNER).x}
            y2={toXY(icDeg, R_INNER).y}
            stroke="rgba(147,197,253,0.45)"
            strokeWidth="1"
          />
          <text
            data-testid="axis-mc"
            x={toXY(mcDeg, R_OUTER + 12).x}
            y={toXY(mcDeg, R_OUTER + 12).y}
            fontSize="8"
            fill="rgba(147,197,253,0.85)"
            textAnchor="middle"
          >
            MC
          </text>
          <text
            data-testid="axis-ic"
            x={toXY(icDeg, R_OUTER + 12).x}
            y={toXY(icDeg, R_OUTER + 12).y}
            fontSize="8"
            fill="rgba(147,197,253,0.85)"
            textAnchor="middle"
          >
            IC
          </text>
        </g>
      )}

      {aspects.map((asp, idx) => {
        const layA = layouts[asp.planetA];
        const layB = layouts[asp.planetB];
        if (!layA || !layB) return null;
        const pA = toXY(layA.displayDeg, layA.radius);
        const pB = toXY(layB.displayDeg, layB.radius);
        const color = ASPECT_COLORS[asp.aspect] ?? '#fff';
        return (
          <line
            key={`${asp.planetA}-${asp.planetB}-${idx}`}
            x1={pA.x}
            y1={pA.y}
            x2={pB.x}
            y2={pB.y}
            stroke={color}
            strokeWidth="1.2"
            strokeOpacity="0.75"
          />
        );
      })}

      <circle cx={CX} cy={CY} r={4} fill="#fbbf24" opacity="0.9" />

      {planetNames.map((name) => {
        const lay = layouts[name];
        if (!lay) return null;
        const p = toXY(lay.displayDeg, lay.radius);
        const sym = PSYM[name] ?? name[0].toUpperCase();
        const col = PCOL[name] ?? '#fff';
        const body = planets[name];
        const nodeLabel =
          name === 'north_node' && chart.node_type === 'mean' ? ' (M)' : '';
        return (
          <g key={name}>
            <circle
              cx={p.x}
              cy={p.y}
              r="11"
              fill="rgba(0,0,0,0.85)"
              stroke={col}
              strokeWidth="1"
            />
            <text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fill={col}
            >
              {sym}
            </text>
            {nodeLabel && (
              <title>Mean North Node (Astro-Seek compatible)</title>
            )}
            {body.retrograde && (
              <text
                x={p.x + 9}
                y={p.y - 9}
                fontSize="7"
                fill="#f87171"
                textAnchor="middle"
              >
                ℞
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function AspectLegend({ labels }: { labels: NatalChartLabels }) {
  const items = ['trine', 'square', 'sextile', 'opposition', 'conjunction'] as const;
  const rtl = labels.lang === 'fa' || labels.lang === 'ar';
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-3">
      {items.map((key) => (
        <div key={key} className="flex items-center gap-1.5">
          <span
            className="inline-block w-5 h-0.5 rounded"
            style={{ background: ASPECT_COLORS[key] }}
          />
          <span className={`fi ${rtl ? 'text-xs' : 'text-[10px]'}`} style={{ color: 'rgba(255,255,255,0.45)' }}>
            {labels.aspectLegend[key] ?? key}
          </span>
        </div>
      ))}
    </div>
  );
}

function ChartInsights({
  planets,
  aspects,
  labels,
}: {
  planets: Record<string, ChartPlanet>;
  aspects: NatalAspect[];
  labels: NatalChartLabels;
}) {
  const balance = computeElementBalance(planets);
  const strengths = computeChartStrengths(planets, aspects, labels.lang, 4);

  return (
    <div className="w-full mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
      <ElementBalanceCard balance={balance} labels={labels} />
      <StrengthsCard strengths={strengths} title={labels.strengthsTitle} lang={labels.lang} />
    </div>
  );
}

const ELEMENT_ORDER: ElementKey[] = ['earth', 'water', 'fire', 'air'];

function ElementBalanceCard({
  balance,
  labels,
}: {
  balance: ElementBalance;
  labels: NatalChartLabels;
}) {
  const rtl = labels.lang === 'fa' || labels.lang === 'ar';
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        className={`fi ${rtl ? 'text-xs' : 'text-[11px]'} tracking-widest uppercase mb-3`}
        style={{ color: 'rgba(255,255,255,0.45)' }}
      >
        {labels.elementsTitle}
      </div>
      <div className="flex flex-col gap-2.5">
        {ELEMENT_ORDER.map((key) => {
          const pct = balance.percent[key];
          const color = balance.color[key];
          return (
            <div key={key} className="flex items-center gap-2.5">
              <div
                className={`fi ${rtl ? 'text-sm' : 'text-xs'} w-12 shrink-0`}
                style={{ color }}
              >
                {labels.elements[key]}
              </div>
              <div
                className="flex-1 h-2 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: color,
                    transition: 'width 600ms ease-out',
                  }}
                />
              </div>
              <div
                className="fi text-[11px] w-9 text-right shrink-0"
                style={{ color: 'rgba(255,255,255,0.65)' }}
              >
                {pct}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StrengthsCard({
  strengths,
  title,
  lang,
}: {
  strengths: string[];
  title: string;
  lang: ChartLang;
}) {
  const rtl = lang === 'fa' || lang === 'ar';
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        className={`fi ${rtl ? 'text-xs' : 'text-[11px]'} tracking-widest uppercase mb-3`}
        style={{ color: 'rgba(255,255,255,0.45)' }}
      >
        {title}
      </div>
      <ul className="flex flex-col gap-2">
        {strengths.map((line, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span
              className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: '#fbbf24' }}
            />
            <span
              className={`fi ${rtl ? 'text-sm' : 'text-xs'} leading-relaxed`}
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              {line}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function NatalChart({
  chart,
  labels,
  empty,
}: {
  chart: ChartData | null;
  labels: NatalChartLabels;
  empty?: boolean;
}) {
  if (empty || !chart || Object.keys(chart.planets).length === 0) {
    return (
      <div className="w-[320px] h-[320px] flex items-center justify-center">
        <p className="fi text-xs text-center px-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
          {labels.empty}
        </p>
      </div>
    );
  }

  const aspects = findNatalAspects(chart.planets);
  const layouts = computeLayouts(chart.planets, chart.ascendant);

  return (
    <div className="w-full flex flex-col items-center">
      <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '50%', padding: 6 }}>
        <NatalChartWheel chart={chart} aspects={aspects} layouts={layouts} />
      </div>
      <AspectLegend labels={labels} />
      <ChartInsights planets={chart.planets} aspects={aspects} labels={labels} />
    </div>
  );
}

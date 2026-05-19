'use client';

import {
  ASPECT_COLORS,
  findNatalAspects,
  type NatalAspect,
} from '@/lib/natal-aspects';

export interface ChartPlanet {
  longitude: number;
  sign: number;
  degree: number;
  house: number;
  retrograde: boolean;
}

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

const SIGN_NAMES = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

export type NatalChartLabels = {
  empty: string;
  tablePlanet: string;
  tableSign: string;
  tableDegree: string;
  tableHouse: string;
  tableRetro: string;
  retroYes: string;
  retroNo: string;
  planetNames: Record<string, string>;
  signNames: Record<string, string>;
  aspectLegend: Record<string, string>;
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

function displayLongitude(lon: number, ascendant: number) {
  return lon - ascendant + 180;
}

function formatDegree(degInSign: number) {
  const d = Math.floor(degInSign);
  const m = Math.round((degInSign - d) * 60);
  if (m >= 60) return `${d + 1}°00′`;
  return `${d}°${String(m).padStart(2, '0')}′`;
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
  planets,
  ascendant,
  aspects,
  layouts,
}: {
  planets: Record<string, ChartPlanet>;
  ascendant: number;
  aspects: NatalAspect[];
  layouts: Record<string, PlanetLayout>;
}) {
  const planetNames = PLANET_ORDER.filter((n) => planets[n]);

  return (
    <svg width="320" height="320" viewBox="0 0 320 320" style={{ maxWidth: '100%' }}>
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
        const startDeg = i * 30 - ascendant + 180;
        const midDeg = startDeg + 15;
        const p1 = toXY(startDeg, R_OUTER);
        const p2 = toXY(startDeg, R_MID);
        const ps = toXY(midDeg, R_OUTER + 14);
        return (
          <g key={i}>
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="rgba(251,191,36,0.22)"
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

      {Number.isFinite(ascendant) && (
        <g>
          <line
            x1={toXY(180, R_OUTER + 4).x}
            y1={toXY(180, R_OUTER + 4).y}
            x2={toXY(180, R_INNER).x}
            y2={toXY(180, R_INNER).y}
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="1.2"
          />
          <line
            x1={toXY(0, R_OUTER + 4).x}
            y1={toXY(0, R_OUTER + 4).y}
            x2={toXY(0, R_INNER).x}
            y2={toXY(0, R_INNER).y}
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="1.2"
          />
          <text
            x={toXY(183, R_INNER - 10).x}
            y={toXY(183, R_INNER - 10).y}
            fontSize="8"
            fill="rgba(255,255,255,0.65)"
            textAnchor="middle"
          >
            AC
          </text>
          <text
            x={toXY(3, R_INNER - 10).x}
            y={toXY(3, R_INNER - 10).y}
            fontSize="8"
            fill="rgba(255,255,255,0.65)"
            textAnchor="middle"
          >
            DC
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
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-3">
      {items.map((key) => (
        <div key={key} className="flex items-center gap-1.5">
          <span
            className="inline-block w-5 h-0.5 rounded"
            style={{ background: ASPECT_COLORS[key] }}
          />
          <span className="fi text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {labels.aspectLegend[key] ?? key}
          </span>
        </div>
      ))}
    </div>
  );
}

function NatalDegreesTable({
  planets,
  labels,
}: {
  planets: Record<string, ChartPlanet>;
  labels: NatalChartLabels;
}) {
  const rows = PLANET_ORDER.filter((n) => planets[n]);

  return (
    <div className="w-full mt-4 overflow-x-auto">
      <table className="w-full fi text-xs border-collapse">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {[labels.tablePlanet, labels.tableSign, labels.tableDegree, labels.tableHouse, labels.tableRetro].map(
              (h) => (
                <th
                  key={h}
                  className="py-2 px-2 text-left font-medium"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((name) => {
            const p = planets[name];
            const signIdx = Math.min(11, Math.max(0, (p.sign ?? 1) - 1));
            const signName = SIGN_NAMES[signIdx];
            const signLabel = labels.signNames[signName] ?? signName;
            return (
              <tr
                key={name}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              >
                <td className="py-2 px-2" style={{ color: PCOL[name] ?? '#fff' }}>
                  <span className="mr-1.5">{PSYM[name]}</span>
                  {labels.planetNames[name] ?? name}
                </td>
                <td className="py-2 px-2" style={{ color: SIGN_COLORS[signIdx] }}>
                  {SIGN_GLYPHS[signIdx]} {signLabel}
                </td>
                <td className="py-2 px-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {formatDegree(p.degree)}
                </td>
                <td className="py-2 px-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {p.house}
                </td>
                <td className="py-2 px-2" style={{ color: p.retrograde ? '#f87171' : 'rgba(255,255,255,0.35)' }}>
                  {p.retrograde ? labels.retroYes : labels.retroNo}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function NatalChart({
  planets,
  ascendant,
  labels,
  empty,
}: {
  planets: Record<string, ChartPlanet> | null;
  ascendant: number;
  labels: NatalChartLabels;
  empty?: boolean;
}) {
  if (empty || !planets || Object.keys(planets).length === 0) {
    return (
      <div className="w-[320px] h-[320px] flex items-center justify-center">
        <p className="fi text-xs text-center px-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
          {labels.empty}
        </p>
      </div>
    );
  }

  const aspects = findNatalAspects(planets);
  const layouts = computeLayouts(planets, ascendant);

  return (
    <div className="w-full flex flex-col items-center">
      <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '50%', padding: 6 }}>
        <NatalChartWheel
          planets={planets}
          ascendant={ascendant}
          aspects={aspects}
          layouts={layouts}
        />
      </div>
      <AspectLegend labels={labels} />
      <NatalDegreesTable planets={planets} labels={labels} />
    </div>
  );
}

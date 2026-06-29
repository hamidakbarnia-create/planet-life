/**
 * Natal wheel screen projection — quadrant 4×90° piecewise linear (production default).
 *
 * Screen convention: 0° = top (12 o'clock), 90° = right, 180° = bottom, 270° = left.
 * Ecliptic longitudes come from Swiss Ephemeris via ChartData; never recomputed here.
 */

import { normalizeDegrees, type ChartData } from '@/lib/chart-types';

export type WheelProjectionMode = 'quadrant' | 'uniform';

/** Uniform rotation (legacy / dev comparison). ASC at left. */
export function projectUniformLongitude(lon: number, ascendant: number): number {
  return normalizeDegrees(lon - ascendant + 270);
}

function eclipticArcForward(start: number, end: number): number {
  return normalizeDegrees(end - start);
}

function eclipticArcBetweenCusps(cusps: number[], index: number): number {
  return eclipticArcForward(cusps[index % 12], cusps[(index + 1) % 12]);
}

function lonInArc(lon: number, start: number, end: number): number {
  const l = normalizeDegrees(lon);
  const s = normalizeDegrees(start);
  const arc = eclipticArcForward(s, normalizeDegrees(end));
  if (arc <= 0) return -1;
  const pos = eclipticArcForward(s, l);
  return pos <= arc + 1e-9 ? pos / arc : -1;
}

/** Precompute screen angle for each of 12 house cusps (quadrant model). */
export function computeQuadrantScreenCusps(cusps: number[]): number[] {
  if (cusps.length !== 12) {
    throw new Error('computeQuadrantScreenCusps requires 12 house cusps');
  }

  const sc = new Array<number>(12);
  sc[0] = 270;
  sc[3] = 180;
  sc[6] = 90;
  sc[9] = 0;

  for (const qStart of [0, 3, 6, 9] as const) {
    let eclQ = 0;
    for (let i = qStart; i < qStart + 3; i++) {
      eclQ += eclipticArcBetweenCusps(cusps, i);
    }
    let e = 0;
    for (let i = qStart; i < qStart + 2; i++) {
      const seg = eclipticArcBetweenCusps(cusps, i);
      sc[i + 1] = normalizeDegrees(sc[qStart] - ((e + seg) / eclQ) * 90);
      e += seg;
    }
  }

  return sc;
}

function projectQuadrantLongitude(lon: number, cusps: number[], screenCusps: number[]): number {
  const l = normalizeDegrees(lon);
  for (let i = 0; i < 12; i++) {
    const t = lonInArc(l, cusps[i], cusps[(i + 1) % 12]);
    if (t >= 0) {
      const s0 = screenCusps[i];
      const s1 = screenCusps[(i + 1) % 12];
      let span = normalizeDegrees(s0 - s1);
      if (span > 180) span = 360 - span;
      return normalizeDegrees(s0 - t * span);
    }
  }
  return NaN;
}

/**
 * Map ecliptic longitude to natal wheel screen angle.
 * Production default: fixed quadrant piecewise linear (4×90° anchors).
 */
export function projectEclipticLongitude(
  lon: number,
  chart: ChartData,
  mode: WheelProjectionMode = 'quadrant'
): number {
  if (mode === 'uniform') {
    return projectUniformLongitude(lon, chart.ascendant);
  }

  const cusps = chart.houses;
  if (!Array.isArray(cusps) || cusps.length !== 12) {
    return projectUniformLongitude(lon, chart.ascendant);
  }

  const screenCusps = computeQuadrantScreenCusps(cusps);
  const angle = projectQuadrantLongitude(lon, cusps, screenCusps);
  return Number.isFinite(angle) ? angle : projectUniformLongitude(lon, chart.ascendant);
}

/** Screen angles for angles, cusps, and planets using the active projection mode. */
export function computeProjectedScreenAngles(
  chart: ChartData,
  mode: WheelProjectionMode = 'quadrant'
): Record<string, number> {
  const project = (lon: number) => projectEclipticLongitude(lon, chart, mode);
  const asc = chart.ascendant;
  const out: Record<string, number> = {
    ascendant: project(asc),
    midheaven: project(chart.midheaven),
    ic: project(normalizeDegrees(chart.midheaven + 180)),
    descendant: project(normalizeDegrees(asc + 180)),
  };
  chart.houses.forEach((cusp, i) => {
    out[`house_${i + 1}`] = project(cusp);
  });
  Object.entries(chart.planets).forEach(([name, p]) => {
    out[name] = project(p.longitude);
  });
  return out;
}

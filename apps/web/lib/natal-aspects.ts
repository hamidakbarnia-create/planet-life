/** Natal chart aspect detection (mirrors packages/astro_engine/scoring.py orbs). */

export const ASPECT_ANGLES: Record<string, number> = {
  conjunction: 0,
  sextile: 60,
  square: 90,
  trine: 120,
  opposition: 180,
};

export const DEFAULT_ORBS: Record<string, number> = {
  conjunction: 8,
  sextile: 4,
  square: 6,
  trine: 6,
  opposition: 8,
};

export const ASPECT_COLORS: Record<string, string> = {
  trine: '#60a5fa',
  square: '#f87171',
  sextile: '#4ade80',
  opposition: '#fb923c',
  conjunction: '#fbbf24',
};

export function angularSeparation(lonA: number, lonB: number): number {
  const a = lonA % 360;
  const b = lonB % 360;
  const diff = Math.abs(a - b);
  return Math.min(diff, 360 - diff);
}

export function detectAspect(
  lonA: number,
  lonB: number,
  orbs: Record<string, number> = DEFAULT_ORBS
): { aspect: string; orb: number } | null {
  const separation = angularSeparation(lonA, lonB);
  let best: { aspect: string; orb: number } | null = null;

  for (const [aspect, target] of Object.entries(ASPECT_ANGLES)) {
    const orb = Math.abs(separation - target);
    const maxOrb = orbs[aspect] ?? DEFAULT_ORBS[aspect];
    if (orb <= maxOrb && (!best || orb < best.orb)) {
      best = { aspect, orb };
    }
  }
  return best;
}

export interface NatalAspect {
  planetA: string;
  planetB: string;
  aspect: string;
  orb: number;
}

export function findNatalAspects(
  planets: Record<string, { longitude: number }>
): NatalAspect[] {
  const names = Object.keys(planets);
  const out: NatalAspect[] = [];

  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const a = names[i];
      const b = names[j];
      const hit = detectAspect(planets[a].longitude, planets[b].longitude);
      if (hit) {
        out.push({ planetA: a, planetB: b, aspect: hit.aspect, orb: hit.orb });
      }
    }
  }

  return out.sort((x, y) => x.orb - y.orb);
}

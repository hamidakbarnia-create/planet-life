/**
 * Scroll-driven cinematic hero — scene breakpoints and copy.
 * Seven phases map linear scroll progress (0–1) to visual + overlay states.
 */

export const CINEMATIC_COLORS = {
  background: '#0B1736',
  line: '#305CDE',
  gold: '#F2C775',
  white: '#FFFFFF',
} as const;

export const CINEMATIC_COPY = {
  headline: 'Every decision has a better time',
  subheadline: 'AI-powered personal decision intelligence',
  tagline: 'Know your best next move',
  ctaLabel: 'Start METIORO',
  ctaHref: '/home',
} as const;

/** Total scroll length as viewport heights */
export const CINEMATIC_SCROLL_VH = 460;

export type CinematicSceneId =
  | 'field'
  | 'noise'
  | 'instrument'
  | 'alignment'
  | 'coordinate'
  | 'pathForward'
  | 'interfaceReveal';

export interface CinematicScene {
  id: CinematicSceneId;
  label: string;
  /** Inclusive start of scroll progress [0, 1] */
  start: number;
  /** Exclusive end of scroll progress [0, 1] */
  end: number;
}

export const CINEMATIC_SCENES: readonly CinematicScene[] = [
  { id: 'field', label: 'Field', start: 0, end: 0.14 },
  { id: 'noise', label: 'Noise', start: 0.14, end: 0.28 },
  { id: 'instrument', label: 'Instrument', start: 0.28, end: 0.42 },
  { id: 'alignment', label: 'Alignment', start: 0.42, end: 0.56 },
  { id: 'coordinate', label: 'Coordinate', start: 0.56, end: 0.7 },
  { id: 'pathForward', label: 'Path Forward', start: 0.7, end: 0.84 },
  { id: 'interfaceReveal', label: 'Interface Reveal', start: 0.84, end: 1 },
] as const;

export interface CinematicDensity {
  lineCount: number;
  nodeCount: number;
}

export const CINEMATIC_DENSITY: { desktop: CinematicDensity; mobile: CinematicDensity } = {
  desktop: { lineCount: 48, nodeCount: 36 },
  mobile: { lineCount: 22, nodeCount: 14 },
};

export interface TextReveal {
  opacity: number;
  translateY: number;
}

/** Overlay fade ranges keyed by content block */
export const TEXT_REVEALS = {
  headline: { fadeInStart: 0.26, fadeInEnd: 0.38, fadeOutStart: 0.78, fadeOutEnd: 0.88 },
  subheadline: { fadeInStart: 0.52, fadeInEnd: 0.64, fadeOutStart: 0.72, fadeOutEnd: 0.82 },
  decisionCard: { fadeInStart: 0.84, fadeInEnd: 0.94 },
} as const;

export function fadeOutRange(
  progress: number,
  start: number,
  end: number,
): number {
  return 1 - clamp01((progress - start) / (end - start));
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function sceneProgress(progress: number, scene: CinematicScene): number {
  const span = scene.end - scene.start;
  if (span <= 0) return 0;
  return clamp01((progress - scene.start) / span);
}

export function getActiveScene(progress: number): CinematicScene {
  const p = clamp01(progress);
  for (let i = CINEMATIC_SCENES.length - 1; i >= 0; i -= 1) {
    if (p >= CINEMATIC_SCENES[i].start) return CINEMATIC_SCENES[i];
  }
  return CINEMATIC_SCENES[0];
}

export function fadeRange(
  progress: number,
  start: number,
  end: number,
): TextReveal {
  const opacity = clamp01((progress - start) / (end - start));
  return {
    opacity,
    translateY: (1 - opacity) * 18,
  };
}

export function isLowPowerDevice(): boolean {
  if (typeof window === 'undefined') return false;

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  if (nav.connection?.saveData) return true;
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2) return true;
  if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 2) return true;

  return false;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 768px)').matches;
}

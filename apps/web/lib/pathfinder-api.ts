import type { BirthProfile } from './birth-profile';
import { chartPreferenceFields } from './app-settings';
import { API_BASE } from './api-config';

export type PathfinderArea =
  | 'love'
  | 'career'
  | 'wealth'
  | 'home'
  | 'wellbeing'
  | 'community'
  | 'spirituality';

export interface PathfinderReason {
  code: string;
  planet: string;
  angle: 'AC' | 'DC' | 'MC' | 'IC' | null;
  house: number | null;
}

export interface PathfinderEffect {
  area: PathfinderArea;
  icon: string;
  score: number;
  verdict: 'positive' | 'mixed' | 'challenging';
  reasons: PathfinderReason[];
}

export interface PathfinderLine {
  planet: string;
  planet_label: string;
  angle: 'AC' | 'DC' | 'MC' | 'IC';
  angle_label: string;
  orb: number;
  strength: 'exact' | 'strong' | 'moderate';
}

export interface PathfinderRelocation {
  target: {
    label: string;
    location: string;
    latitude: number;
    longitude: number;
  };
  angles: Record<'AC' | 'DC' | 'MC' | 'IC', number>;
  active_lines: PathfinderLine[];
  effects: PathfinderEffect[];
}

export interface PathfinderPeriod {
  start: string;
  end: string;
  days: number;
  score: number;
  label: 'Favorable' | 'Balanced' | 'Challenging';
  daily_scores: number[];
}

export interface PathfinderBestTimes {
  purpose: string;
  action_type: string;
  best_periods: PathfinderPeriod[];
  challenging_periods: PathfinderPeriod[];
}

export interface PathfinderCity {
  short: string;
  name: string;
  lat: number;
  lon: number;
}

export type AnalyzeFailureKind = 'unsupported_calculation' | 'validation' | 'unknown';

export type ClassifiedAnalyzeFailure = {
  kind: AnalyzeFailureKind;
  status: number;
  backendDetail: string;
};

export class PathfinderApiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(status: number, detail: unknown, fallback: string) {
    const message = typeof detail === 'string' && detail.trim() ? detail : fallback;
    super(message);
    this.name = 'PathfinderApiError';
    this.status = status;
    this.detail = detail;
  }
}

const POLAR_FAILURE_MARKERS = [
  'Placidus houses cannot be calculated reliably',
  'PlacidusLatitudeError',
  'swisseph.houses',
];

function analyzeErrorDetail(detail: unknown): string {
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail === 'object' && 'message' in detail) {
    const message = (detail as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return '';
}

export function classifyAnalyzeFailure(status: number, detail: unknown): ClassifiedAnalyzeFailure {
  const backendDetail = analyzeErrorDetail(detail);
  if (POLAR_FAILURE_MARKERS.some((marker) => backendDetail.includes(marker))) {
    return { kind: 'unsupported_calculation', status, backendDetail };
  }
  if (status === 422) {
    return { kind: 'validation', status, backendDetail };
  }
  return { kind: 'unknown', status, backendDetail };
}

function targetLocation(city: PathfinderCity): string {
  return `${city.lat},${city.lon}`;
}

async function readApiError(res: Response, fallback: string): Promise<never> {
  let detail: unknown;
  try {
    const data = (await res.json()) as { detail?: unknown };
    detail = data?.detail;
  } catch {
    detail = undefined;
  }
  throw new PathfinderApiError(res.status, detail, fallback);
}

export async function fetchPathfinderRelocation(
  profile: BirthProfile,
  city: PathfinderCity,
  lang: string
): Promise<PathfinderRelocation> {
  const prefs = chartPreferenceFields();
  const res = await fetch(`${API_BASE}/api/pathfinder/relocation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      birth_location: profile.location,
      target_location: targetLocation(city),
      target_label: city.short || city.name,
      lang,
      ...prefs,
    }),
  });
  if (!res.ok) {
    await readApiError(res, 'Pathfinder request failed');
  }
  return (await res.json()) as PathfinderRelocation;
}

export async function fetchPathfinderBestTimes(
  profile: BirthProfile,
  city: PathfinderCity,
  purpose: PathfinderArea | 'all',
  startDate: string,
  lang: string
): Promise<PathfinderBestTimes> {
  const prefs = chartPreferenceFields();
  const res = await fetch(`${API_BASE}/api/pathfinder/best-times`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      birth_location: profile.location,
      target_location: targetLocation(city),
      target_label: city.short || city.name,
      purpose,
      start_date: startDate,
      search_months: 3,
      trip_days: 7,
      lang,
      ...prefs,
    }),
  });
  if (!res.ok) {
    await readApiError(res, 'Best times request failed');
  }
  return (await res.json()) as PathfinderBestTimes;
}

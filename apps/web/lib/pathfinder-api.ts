import type { BirthProfile } from './birth-profile';
import { chartPreferenceFields } from './app-settings';
import { API_BASE } from './calendar-scores';

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

function targetLocation(city: PathfinderCity): string {
  return `${city.lat},${city.lon}`;
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
  const data = await res.json();
  if (!res.ok) {
    throw new Error(typeof data?.detail === 'string' ? data.detail : 'Pathfinder request failed');
  }
  return data as PathfinderRelocation;
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
  const data = await res.json();
  if (!res.ok) {
    throw new Error(typeof data?.detail === 'string' ? data.detail : 'Best times request failed');
  }
  return data as PathfinderBestTimes;
}

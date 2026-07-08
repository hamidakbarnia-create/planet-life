import { API_BASE } from './calendar-scores';
import { validateChartResponse, type ChartData } from './chart-types';
import type { ProfileRecord } from './profile/profile-types';

export interface ChartPlanetBody {
  longitude: number;
  sign?: number;
  degree?: number;
  house?: number;
  retrograde?: boolean;
}

export async function fetchNatalChart(
  birth_date: string,
  birth_time: string,
  location: string
): Promise<Record<string, ChartPlanetBody> | null> {
  try {
    const res = await fetch(`${API_BASE}/api/business/chart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        birth_date,
        birth_time,
        location,
        action_type: 'business_launch',
        target_date: new Date().toISOString().split('T')[0],
      }),
    });
    const data = await res.json();
    if (data.detail || !data.planets) return null;
    return data.planets as Record<string, ChartPlanetBody>;
  } catch {
    return null;
  }
}

/** Fetch and validate a full natal chart for FTUE Result — never throws. */
export async function fetchValidatedResultChart(
  profile: ProfileRecord
): Promise<ChartData | null> {
  try {
    const location =
      profile.birth_place?.short?.trim() || profile.birth_place?.name?.trim() || '';
    if (!profile.birth_date || !profile.birth_time || !location) return null;

    const body: Record<string, unknown> = {
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      location,
      action_type: profile.action_type || 'business_launch',
      target_date: new Date().toISOString().split('T')[0],
      house_system: 'placidus',
      zodiac: 'tropical',
      node_type: 'mean',
    };

    const { lat, lon } = profile.birth_place;
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      body.latitude = lat;
      body.longitude = lon;
    }
    if (profile.birth_place.country) {
      body.country = profile.birth_place.country;
    }

    const res = await fetch(`${API_BASE}/api/business/chart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data || data.detail) return null;

    const result = validateChartResponse(data, location);
    return result.ok ? result.data : null;
  } catch {
    return null;
  }
}

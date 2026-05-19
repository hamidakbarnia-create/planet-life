import { API_BASE } from './calendar-scores';

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

import type { CoordinateSource } from '@/lib/chart-types';

export type ResolvedLocationPreview = {
  latitude: number;
  longitude: number;
  timezone: string;
  coordinate_source: CoordinateSource;
  timezone_source: string;
};

export async function fetchLocationPreview(params: {
  location: string;
  latitude?: number | null;
  longitude?: number | null;
}): Promise<ResolvedLocationPreview> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000';
  const body: Record<string, unknown> = { location: params.location };
  if (params.latitude != null && params.longitude != null) {
    body.latitude = params.latitude;
    body.longitude = params.longitude;
  }
  const res = await fetch(`${apiBase}/api/business/location-preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(typeof data.detail === 'string' ? data.detail : 'Location preview failed');
  }
  return data as ResolvedLocationPreview;
}

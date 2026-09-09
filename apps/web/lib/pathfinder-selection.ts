import type { PathfinderCity } from './pathfinder-api';

export const PLACIDUS_MAX_RELIABLE_LATITUDE = 66.5;

export type PathfinderSelectedPoint = {
  source: 'city_search' | 'globe_point';
  displayName: string;
  latitude: number;
  longitude: number;
  country?: string;
  timezone?: string;
  placeResolutionStatus: 'resolved' | 'unresolved';
};

export type CitySearchHit = {
  short?: string;
  name?: string;
  lat: number;
  lon: number;
  country?: string;
};

const FIXED_OFFSET_STYLE_NAME = /^(?:UTC|GMT)?[+-]\d/i;

export type TimezoneLookup = (
  point: PathfinderSelectedPoint
) => Promise<string | undefined>;

export function normalizeLongitude(longitude: number): number {
  if (!Number.isFinite(longitude)) {
    throw new RangeError('Longitude must be a finite number.');
  }
  if (longitude >= -180 && longitude <= 180) {
    return Object.is(longitude, -0) ? 0 : longitude;
  }
  const wrapped = ((((longitude + 180) % 360) + 360) % 360) - 180;
  return Object.is(wrapped, -0) ? 0 : wrapped;
}

export function parseGeographicPoint(
  latitude: unknown,
  longitude: unknown
): { ok: true; latitude: number; longitude: number } | { ok: false; reason: string } {
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return { ok: false, reason: 'not_finite' };
  }
  if (latitude < -90 || latitude > 90) {
    return { ok: false, reason: 'invalid_latitude' };
  }
  return { ok: true, latitude, longitude: normalizeLongitude(longitude) };
}

function requireCoordinates(latitude: number, longitude: number) {
  const parsed = parseGeographicPoint(latitude, longitude);
  if (!parsed.ok) {
    throw new RangeError(`Rejected coordinates: ${parsed.reason}`);
  }
  return parsed;
}

export function formatSelectedCoordinates(point: PathfinderSelectedPoint): string {
  return `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}`;
}

export function selectedPointFromCitySearch(hit: CitySearchHit): PathfinderSelectedPoint {
  const coordinates = requireCoordinates(hit.lat, hit.lon);
  const verifiedName = (hit.short || hit.name || '').trim();
  if (!verifiedName) {
    throw new Error('City search results must include a verified display name.');
  }
  const country = hit.country?.trim();
  return {
    source: 'city_search',
    displayName: verifiedName,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    ...(country ? { country } : {}),
    placeResolutionStatus: 'resolved',
  };
}

export function selectedPointFromGlobePick(
  latitude: number,
  longitude: number,
  displayName: string
): PathfinderSelectedPoint {
  const coordinates = requireCoordinates(latitude, longitude);
  return {
    source: 'globe_point',
    displayName,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    placeResolutionStatus: 'unresolved',
  };
}

export function isAuthoritativeTimezoneName(timezone: string | undefined): boolean {
  const zone = timezone?.trim().replace(/\\/g, '/');
  if (!zone) return false;
  const folded = zone.toUpperCase();
  if (folded === 'UTC' || folded === 'GMT') return false;
  if (folded.startsWith('ETC/')) return false;
  if (!zone.includes('/')) return false;
  if (FIXED_OFFSET_STYLE_NAME.test(zone)) return false;
  return true;
}

export function withAuthoritativeTimezone(
  point: PathfinderSelectedPoint,
  timezone: string | undefined
): PathfinderSelectedPoint {
  const next = { ...point };
  delete next.timezone;
  if (!isAuthoritativeTimezoneName(timezone)) return next;
  return { ...point, timezone: timezone!.trim() };
}

export function isAnalyzeEligible(
  point: PathfinderSelectedPoint | null,
  hasBirthProfile: boolean
): boolean {
  return Boolean(hasBirthProfile && point && parseGeographicPoint(point.latitude, point.longitude).ok);
}

export function isBestTimesEligible(
  point: PathfinderSelectedPoint | null,
  hasRelocationResult: boolean
): boolean {
  return Boolean(
    hasRelocationResult &&
      point &&
      parseGeographicPoint(point.latitude, point.longitude).ok &&
      isAuthoritativeTimezoneName(point.timezone)
  );
}

export function isPolarCalculationRisk(latitude: number): boolean {
  return Number.isFinite(latitude) && Math.abs(latitude) > PLACIDUS_MAX_RELIABLE_LATITUDE;
}

export function selectedPointToApiTarget(point: PathfinderSelectedPoint): PathfinderCity {
  return {
    short: point.displayName,
    name: point.displayName,
    lat: point.latitude,
    lon: point.longitude,
  };
}

export function pathfinderAllowanceKey(point: PathfinderSelectedPoint): string {
  return `${point.latitude.toFixed(4)},${point.longitude.toFixed(4)}`;
}

export function canUseFreeTierAnalyze(
  point: PathfinderSelectedPoint,
  isPaidMember: boolean,
  usedAllowanceKey: string | null
): boolean {
  if (isPaidMember) return true;
  return !usedAllowanceKey || usedAllowanceKey === pathfinderAllowanceKey(point);
}

export async function enrichSelectedPointTimezone(
  point: PathfinderSelectedPoint,
  lookup: TimezoneLookup
): Promise<PathfinderSelectedPoint> {
  try {
    const timezone = await lookup(point);
    return withAuthoritativeTimezone(point, timezone);
  } catch {
    return withAuthoritativeTimezone(point, undefined);
  }
}

export function acceptTimezoneEnrichment(currentSeq: number, requestSeq: number): boolean {
  return currentSeq === requestSeq;
}

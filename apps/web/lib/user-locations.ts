import type { BirthProfile } from './birth-profile';

export type CoordinateSource =
  | 'selected_city_coordinates'
  | 'explicit_coordinates'
  | 'geocoded_fallback'
  | 'user_confirmed';

export interface UserLocation {
  city: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  coordinate_source?: CoordinateSource;
  confirmed?: boolean;
}

export type LocationRole = 'birth' | 'current' | 'target' | 'question';

export interface QuestionLocationContext {
  questionText?: string;
  date?: string;
  actionCategory?: string;
  selectedLocation: UserLocation;
  role: LocationRole;
}

export const CALENDAR_EVAL_LOCATION_KEY = 'planet-life-calendar-evaluation-location';

export function locationLabel(loc: Pick<UserLocation, 'city' | 'country'>): string {
  if (loc.country) return `${loc.city}, ${loc.country}`;
  return loc.city;
}

export function cityToUserLocation(city: {
  short: string;
  country?: string;
  lat: number;
  lon: number;
}): UserLocation {
  return {
    city: city.short,
    country: city.country,
    latitude: city.lat,
    longitude: city.lon,
    coordinate_source: 'selected_city_coordinates',
    confirmed: true,
  };
}

export function hasConfirmedCurrentLocation(profile: BirthProfile): boolean {
  const loc = profile.current_location;
  return !!(loc?.confirmed && loc.city?.trim());
}

export function resolveEvaluationLocation(
  profile: BirthProfile,
  override?: UserLocation | null
): UserLocation | null {
  if (override?.city?.trim()) return override;
  if (hasConfirmedCurrentLocation(profile)) return profile.current_location!;
  return null;
}

export function requiresTargetLocation(moduleId?: string): boolean {
  return moduleId === 'travel';
}

export interface ScoringLocationPayload {
  location: string;
  birth_latitude?: number;
  birth_longitude?: number;
  evaluation_location: string;
  evaluation_latitude?: number;
  evaluation_longitude?: number;
}

export function buildScoringLocationPayload(
  profile: BirthProfile,
  evaluation?: UserLocation | null
): ScoringLocationPayload | null {
  const evalLoc = evaluation ?? resolveEvaluationLocation(profile);
  if (!evalLoc?.city?.trim()) return null;

  const payload: ScoringLocationPayload = {
    location: profile.location,
    evaluation_location: locationLabel(evalLoc),
  };
  if (evalLoc.latitude != null && evalLoc.longitude != null) {
    payload.evaluation_latitude = evalLoc.latitude;
    payload.evaluation_longitude = evalLoc.longitude;
  }
  return payload;
}

export function loadCalendarEvaluationOverride(): UserLocation | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CALENDAR_EVAL_LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserLocation;
    return parsed?.city ? parsed : null;
  } catch {
    return null;
  }
}

export function saveCalendarEvaluationOverride(loc: UserLocation | null): void {
  if (typeof window === 'undefined') return;
  if (!loc?.city) {
    localStorage.removeItem(CALENDAR_EVAL_LOCATION_KEY);
    return;
  }
  localStorage.setItem(CALENDAR_EVAL_LOCATION_KEY, JSON.stringify(loc));
}

export function resolveCalendarEvaluationLocation(
  profile: BirthProfile
): UserLocation | null {
  // Profile current_location is the source of truth; calendar override is fallback only.
  if (hasConfirmedCurrentLocation(profile)) {
    return profile.current_location!;
  }
  return loadCalendarEvaluationOverride();
}

export function clearCalendarScoreCaches(): void {
  if (typeof window === 'undefined') return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('planet-life-cal-')) keys.push(key);
  }
  for (const key of keys) {
    localStorage.removeItem(key);
  }
}

export function sameUserLocation(
  a: UserLocation | null | undefined,
  b: UserLocation | null | undefined
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    a.city === b.city &&
    a.country === b.country &&
    a.latitude === b.latitude &&
    a.longitude === b.longitude &&
    a.timezone === b.timezone &&
    a.confirmed === b.confirmed
  );
}

export function currentLocationNeedsConfirm(
  selected: { short: string; lat: number; lon: number } | null,
  current: UserLocation | null
): boolean {
  if (!selected) return false;
  if (!current?.confirmed) return true;
  return (
    selected.short !== current.city ||
    selected.lat !== current.latitude ||
    selected.lon !== current.longitude
  );
}

export function logLocationDebug(label: string, data: unknown): void {
  if (process.env.NODE_ENV !== 'development') return;
  console.info(`[planet-life:location] ${label}`, data);
}

export function formatCalculatedFor(
  label: string,
  lang: 'en' | 'fa' | 'ru' | 'ar' = 'en'
): string {
  const templates: Record<typeof lang, string> = {
    en: `Calculated for: ${label}`,
    fa: `محاسبه‌شده برای: ${label}`,
    ru: `Расчёт для: ${label}`,
    ar: `محسوب لـ: ${label}`,
  };
  return templates[lang];
}

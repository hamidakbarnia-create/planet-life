/**
 * Planet Life chart model — single source of truth between API and renderer.
 * Swiss Ephemeris raw values are normalized here; the renderer must not recalculate.
 */

export interface ChartPlanet {
  longitude: number;
  sign: number;
  degree: number;
  house: number;
  retrograde: boolean;
  speed?: number;
}

export type CoordinateSource =
  | 'selected_city_coordinates'
  | 'explicit_coordinates'
  | 'geocoded_fallback';

export interface ChartData {
  planets: Record<string, ChartPlanet>;
  ascendant: number;
  midheaven: number;
  /** Placidus (or selected) house cusps, index 0 = house 1 */
  houses: number[];
  latitude: number;
  longitude: number;
  timezone: string;
  local_datetime: string;
  utc_datetime: string;
  julian_day: number;
  house_system: string;
  zodiac: string;
  node_type: 'mean' | 'true';
  location: string;
  country?: string | null;
  ephemeris_engine?: string;
  zodiac_label?: string;
  timezone_source?: string;
  coordinate_source?: CoordinateSource;
  calculation_timestamp?: string;
  ayanamsa?: number | null;
  ayanamsa_system?: string | null;
}

export interface CitySelection {
  name: string;
  short: string;
  country?: string;
  lat: number;
  lon: number;
}

export interface ChartApiResponse {
  planets?: Record<string, ChartPlanet>;
  ascendant?: number;
  midheaven?: number;
  houses?: number[];
  latitude?: number;
  longitude?: number;
  timezone?: string;
  local_datetime?: string;
  utc_datetime?: string;
  julian_day?: number;
  house_system?: string;
  zodiac?: string;
  node_type?: string;
  location?: string;
  country?: string | null;
  ephemeris_engine?: string;
  zodiac_label?: string;
  timezone_source?: string;
  coordinate_source?: string;
  calculation_timestamp?: string;
  ayanamsa?: number | null;
  ayanamsa_system?: string | null;
  detail?: string;
}

export type ChartValidationResult =
  | { ok: true; data: ChartData }
  | { ok: false; errors: string[] };

const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const REQUIRED_PLANETS = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'north_node',
] as const;

export function normalizeDegrees(deg: number): number {
  const d = deg % 360;
  return d < 0 ? d + 360 : d;
}

/** Map ecliptic longitude to wheel angle; ASC at left (270°). */
export function displayLongitude(lon: number, ascendant: number): number {
  return normalizeDegrees(lon - ascendant + 270);
}

export function signNameFromIndex(sign: number): string {
  return SIGN_NAMES[(sign - 1 + 12) % 12];
}

export function formatDms(longitude: number): string {
  const inSign = normalizeDegrees(longitude) % 30;
  const deg = Math.floor(inSign);
  const min = Math.round((inSign - deg) * 60);
  const sign = signNameFromIndex(Math.floor(normalizeDegrees(longitude) / 30) + 1);
  return `${deg}°${String(min === 60 ? 0 : min).padStart(2, '0')}' ${sign}`;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function validatePlanet(name: string, p: unknown): string[] {
  const errors: string[] = [];
  if (!p || typeof p !== 'object') {
    errors.push(`Planet "${name}" is missing or invalid.`);
    return errors;
  }
  const body = p as ChartPlanet;
  if (!isFiniteNumber(body.longitude)) {
    errors.push(`Planet "${name}" missing valid longitude.`);
  }
  if (!isFiniteNumber(body.sign) || body.sign < 1 || body.sign > 12) {
    errors.push(`Planet "${name}" missing valid sign (1–12).`);
  }
  if (!isFiniteNumber(body.degree) || body.degree < 0 || body.degree >= 30) {
    errors.push(`Planet "${name}" missing valid degree (0–30).`);
  }
  if (!isFiniteNumber(body.house) || body.house < 1 || body.house > 12) {
    errors.push(`Planet "${name}" missing valid house (1–12).`);
  }
  if (typeof body.retrograde !== 'boolean') {
    errors.push(`Planet "${name}" missing retrograde flag.`);
  }
  return errors;
}

/** Validate API response before rendering; returns structured errors when incomplete. */
export function validateChartResponse(
  raw: ChartApiResponse,
  fallbackLocation: string
): ChartValidationResult {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { ok: false, errors: ['Chart response is empty or invalid.'] };
  }

  if (!raw.planets || typeof raw.planets !== 'object') {
    errors.push('Missing planets object.');
  } else {
    for (const name of REQUIRED_PLANETS) {
      if (!(name in raw.planets)) {
        errors.push(`Missing planet: ${name}.`);
      } else {
        errors.push(...validatePlanet(name, raw.planets[name]));
      }
    }
  }

  if (!isFiniteNumber(raw.ascendant)) {
    errors.push('Missing or invalid ascendant.');
  }
  if (!isFiniteNumber(raw.midheaven)) {
    errors.push('Missing or invalid midheaven.');
  }
  if (!Array.isArray(raw.houses) || raw.houses.length !== 12) {
    errors.push('Missing or invalid houses array (expected 12 cusps).');
  } else if (raw.houses.some((h) => !isFiniteNumber(h))) {
    errors.push('One or more house cusps are not valid numbers.');
  }
  if (!raw.timezone || typeof raw.timezone !== 'string') {
    errors.push('Missing timezone.');
  }
  if (!raw.utc_datetime || typeof raw.utc_datetime !== 'string') {
    errors.push('Missing UTC datetime.');
  }
  if (!isFiniteNumber(raw.latitude)) {
    errors.push('Missing or invalid latitude.');
  }
  if (!isFiniteNumber(raw.longitude)) {
    errors.push('Missing or invalid longitude.');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const planets: Record<string, ChartPlanet> = {};
  Object.entries(raw.planets!).forEach(([name, p]) => {
    planets[name] = {
      longitude: p.longitude,
      sign: p.sign,
      degree: p.degree,
      house: p.house,
      retrograde: p.retrograde,
      speed: p.speed,
    };
  });

  const coordSource = raw.coordinate_source as CoordinateSource | undefined;
  const validCoordSources: CoordinateSource[] = [
    'selected_city_coordinates',
    'explicit_coordinates',
    'geocoded_fallback',
  ];

  return {
    ok: true,
    data: {
      planets,
      ascendant: raw.ascendant!,
      midheaven: raw.midheaven!,
      houses: raw.houses as number[],
      latitude: raw.latitude!,
      longitude: raw.longitude!,
      timezone: raw.timezone!,
      local_datetime: raw.local_datetime ?? '',
      utc_datetime: raw.utc_datetime!,
      julian_day: raw.julian_day ?? 0,
      house_system: raw.house_system ?? 'placidus',
      zodiac: raw.zodiac ?? 'tropical',
      node_type: raw.node_type === 'true' ? 'true' : 'mean',
      location: raw.location ?? fallbackLocation,
      country: raw.country ?? null,
      ephemeris_engine: raw.ephemeris_engine,
      zodiac_label: raw.zodiac_label,
      timezone_source: raw.timezone_source,
      coordinate_source: validCoordSources.includes(coordSource as CoordinateSource)
        ? (coordSource as CoordinateSource)
        : undefined,
      calculation_timestamp: raw.calculation_timestamp,
      ayanamsa: raw.ayanamsa ?? null,
      ayanamsa_system: raw.ayanamsa_system ?? null,
    },
  };
}

/** @deprecated Use validateChartResponse for explicit error handling. */
export function parseChartResponse(raw: ChartApiResponse, fallbackLocation: string): ChartData | null {
  const result = validateChartResponse(raw, fallbackLocation);
  return result.ok ? result.data : null;
}

import {
  computeProjectedScreenAngles,
  type WheelProjectionMode,
} from '@/lib/natal-wheel';

export function computeScreenAngles(
  chart: ChartData,
  mode: WheelProjectionMode = 'quadrant'
): Record<string, number> {
  return computeProjectedScreenAngles(chart, mode);
}

export function assertNoNaNScreenAngles(chart: ChartData): boolean {
  const angles = computeScreenAngles(chart);
  return Object.values(angles).every((a) => Number.isFinite(a) && !Number.isNaN(a));
}

export function isDevEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_CHART_TEST === '1'
  );
}

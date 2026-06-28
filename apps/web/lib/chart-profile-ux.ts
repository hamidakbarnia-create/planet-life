import type { ChartData, CitySelection, CoordinateSource } from '@/lib/chart-types';
import { CHART_DEFAULTS } from '@/lib/chart-defaults';
import { FA_CHART_CONFIRM } from '@/lib/chart-profile-i18n';
import type { ResolvedLocationPreview } from '@/lib/location-resolve';

export type PreConfirmSummary = {
  name: string;
  birthDate: string;
  birthTime: string;
  city: string;
  timezone: string | null;
  coordinates: string | null;
  zodiac: string;
  houseSystem: string;
  nodeType: string;
  showGeocodeWarning: boolean;
  resolving: boolean;
  latitude: number | null;
  longitude: number | null;
};

export type TrustCardRow = {
  key: string;
  label: string;
  value: string;
  verified: boolean;
};

/** Persian requires pre-generation confirmation before chart API call. */
export function shouldShowPreChartConfirm(lang: string): boolean {
  return lang === 'fa';
}

/** Dev panel only in NODE_ENV development — not bundled for production. */
export function shouldRenderChartDevPanel(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function shouldWarnGeocodeFallback(
  coordinateSource: CoordinateSource | null | undefined
): boolean {
  return coordinateSource === 'geocoded_fallback';
}

export function isPlaceholderCardContent(value: string | undefined | null): boolean {
  if (value == null) return true;
  const trimmed = value.trim();
  if (!trimmed || trimmed === '—' || trimmed === '-') return true;
  const lower = trimmed.toLowerCase();
  return (
    lower === 'coming soon' ||
    lower === 'به‌زودی' ||
    lower === 'скоро' ||
    lower === 'قريباً'
  );
}

/** Format coordinates for confirmation modal — lat/lon on separate lines with °. */
export function formatConfirmCoordinates(
  latitude: number | null,
  longitude: number | null
): string | null {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return `${latitude!.toFixed(6)}°\n${longitude!.toFixed(6)}°`;
}

export function resolveConfirmDisplayValue(
  value: string | null | undefined,
  resolving: boolean
): string {
  if (resolving) return FA_CHART_CONFIRM.resolving;
  if (value && value.trim()) return value;
  return FA_CHART_CONFIRM.unknown;
}

export function buildPreConfirmSummary(params: {
  name: string;
  birthDate: string;
  birthTime: string;
  location: string;
  resolved: ResolvedLocationPreview | null;
  resolving: boolean;
}): PreConfirmSummary {
  const { name, birthDate, birthTime, location, resolved, resolving } = params;
  const latitude = resolved?.latitude ?? null;
  const longitude = resolved?.longitude ?? null;
  const coordinates = formatConfirmCoordinates(latitude, longitude);

  return {
    name: name.trim() || '—',
    birthDate,
    birthTime,
    city: location.trim() || '—',
    timezone: resolved?.timezone ?? null,
    coordinates,
    latitude,
    longitude,
    zodiac: CHART_DEFAULTS.zodiac,
    houseSystem: CHART_DEFAULTS.houseSystem,
    nodeType: CHART_DEFAULTS.nodeType,
    showGeocodeWarning: shouldWarnGeocodeFallback(resolved?.coordinate_source),
    resolving,
  };
}

export function buildTrustCardRows(
  chart: ChartData | null,
  lang: string
): TrustCardRow[] {
  if (!chart) return [];

  const timeTz =
    chart.timezone && chart.utc_datetime
      ? `${chart.local_datetime?.split('T')[0] ?? chart.utc_datetime.split(' ')[0]} · ${chart.timezone}`
      : chart.timezone ?? '—';

  const coords =
    Number.isFinite(chart.latitude) && Number.isFinite(chart.longitude)
      ? `${chart.latitude.toFixed(4)}, ${chart.longitude.toFixed(4)}`
      : '—';

  const systems = `${chart.house_system} · ${chart.zodiac_label ?? chart.zodiac}`;

  return [
    {
      key: 'time-tz',
      label: lang === 'fa' ? 'زمان و منطقه زمانی' : 'Time & timezone',
      value: timeTz,
      verified: !!(chart.timezone && chart.utc_datetime),
    },
    {
      key: 'coords',
      label: lang === 'fa' ? 'مختصات شهر تولد' : 'Birth city coordinates',
      value: coords,
      verified: Number.isFinite(chart.latitude) && Number.isFinite(chart.longitude),
    },
    {
      key: 'systems',
      label: lang === 'fa' ? 'سیستم خانه‌ها و طالع' : 'House system & zodiac',
      value: systems,
      verified: !!chart.house_system && !!chart.zodiac,
    },
  ];
}

export type GenerateChartAction = 'show-confirm-modal' | 'call-api';

export function resolveGenerateChartAction(lang: string): GenerateChartAction {
  return shouldShowPreChartConfirm(lang) ? 'show-confirm-modal' : 'call-api';
}

/** Build chart API body coordinates from resolved preview (same data as confirmation modal). */
export function chartApiCoordinatesFromResolved(
  resolved: ResolvedLocationPreview | null,
  selectedCity: CitySelection | null
): { latitude?: number; longitude?: number } {
  if (resolved) {
    return { latitude: resolved.latitude, longitude: resolved.longitude };
  }
  if (selectedCity) {
    return { latitude: selectedCity.lat, longitude: selectedCity.lon };
  }
  return {};
}

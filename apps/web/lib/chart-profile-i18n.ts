import type { AppLang } from '@/lib/app-settings';

export type ProfileLang = AppLang | 'en';

export const FA_CHART_CONFIRM = {
  title: 'تأیید اطلاعات تولد',
  body: 'برای محاسبه دقیق نقشه تولد، لطفاً اطلاعات زیر را بررسی و تأیید کنید. دقت زمان تولد، شهر تولد و منطقه زمانی روی طالع، خانه‌ها و جایگاه سیارات اثر مستقیم دارد.',
  fields: {
    name: 'نام',
    birthDate: 'تاریخ تولد',
    birthTime: 'زمان تولد',
    city: 'شهر تولد',
    timezone: 'منطقه زمانی',
    coordinates: 'مختصات',
    zodiac: 'سیستم طالع',
    houseSystem: 'سیستم خانه‌ها',
    nodeType: 'نوع گره ماه',
  },
  confirm: 'تأیید و تولید نقشه',
  edit: 'ویرایش اطلاعات',
  geocodeWarning:
    'مختصات و منطقه زمانی شهر از پایگاه داده جغرافیایی استخراج شده‌اند.\nاگر شهر اشتباه انتخاب شده باشد، محاسبه طالع، خانه‌ها و زوایا ممکن است تغییر کند.',
  geocodeConfirm: 'مختصات درست است',
  resolving: 'در حال دریافت مختصات...',
  unknown: 'نامشخص',
} as const;

export type CalculationDetailsLabels = {
  title: string;
  basicTitle: string;
  advancedTitle: string;
  calculatedWith: string;
  coordinates: string;
  timezone: string;
  utc: string;
  zodiac: string;
  houseSystem: string;
  nodeType: string;
  ephemeris: string;
  coordinateSource: string;
  timezoneSource: string;
  ayanamsa: string;
  ascendant: string;
  midheaven: string;
  houseCusps: string;
  planetLongitudes: string;
  calculatedAt: string;
  showAdvanced: string;
  hideAdvanced: string;
};

export type TrustCardLabels = {
  title: string;
  body: string;
  rowTimeTz: string;
  rowCoords: string;
  rowSystems: string;
  verified: string;
};

const CALC_EN: CalculationDetailsLabels = {
  title: 'Calculation details',
  basicTitle: 'Summary',
  advancedTitle: 'Advanced',
  calculatedWith: 'Calculated with Swiss Ephemeris',
  coordinates: 'Birth city coordinates',
  timezone: 'Timezone',
  utc: 'UTC conversion',
  zodiac: 'Zodiac',
  houseSystem: 'House system',
  nodeType: 'Node type',
  ephemeris: 'Ephemeris engine',
  coordinateSource: 'Coordinate source',
  timezoneSource: 'Timezone source',
  ayanamsa: 'Ayanamsa',
  ascendant: 'ASC',
  midheaven: 'MC',
  houseCusps: 'House cusps',
  planetLongitudes: 'Planet longitudes',
  calculatedAt: 'Calculated at',
  showAdvanced: 'Show advanced details',
  hideAdvanced: 'Hide advanced details',
};

const CALC_FA: CalculationDetailsLabels = {
  title: 'جزئیات محاسبه',
  basicTitle: 'خلاصه',
  advancedTitle: 'پیشرفته',
  calculatedWith: 'محاسبه‌شده با Swiss Ephemeris',
  coordinates: 'مختصات شهر تولد',
  timezone: 'منطقه زمانی',
  utc: 'تبدیل به UTC',
  zodiac: 'سیستم طالع',
  houseSystem: 'سیستم خانه‌ها',
  nodeType: 'نوع گره ماه',
  ephemeris: 'موتور محاسبه',
  coordinateSource: 'منبع مختصات',
  timezoneSource: 'منبع منطقه زمانی',
  ayanamsa: 'آیانامسا',
  ascendant: 'طالع (ASC)',
  midheaven: 'وسط‌السماء (MC)',
  houseCusps: 'ابتدای خانه‌ها',
  planetLongitudes: 'طول‌های سیارات',
  calculatedAt: 'زمان محاسبه',
  showAdvanced: 'نمایش جزئیات فنی',
  hideAdvanced: 'پنهان کردن جزئیات فنی',
};

const TRUST_EN: TrustCardLabels = {
  title: 'Calculation accuracy',
  body: 'This chart is calculated with Swiss Ephemeris using birth time, city, geographic coordinates, and historical timezone.',
  rowTimeTz: 'Time & timezone',
  rowCoords: 'Birth city coordinates',
  rowSystems: 'House system & zodiac',
  verified: 'Verified',
};

const TRUST_FA: TrustCardLabels = {
  title: 'دقت محاسبه',
  body: 'این نقشه با استفاده از Swiss Ephemeris و بر اساس زمان تولد، شهر تولد، مختصات جغرافیایی و منطقه زمانی تاریخی محاسبه شده است.',
  rowTimeTz: 'زمان و منطقه زمانی',
  rowCoords: 'مختصات شهر تولد',
  rowSystems: 'سیستم خانه‌ها و طالع',
  verified: 'تأیید شده',
};

export function getCalculationDetailsLabels(lang: ProfileLang): CalculationDetailsLabels {
  if (lang === 'fa') return CALC_FA;
  return CALC_EN;
}

export function getTrustCardLabels(lang: ProfileLang): TrustCardLabels {
  if (lang === 'fa') return TRUST_FA;
  return TRUST_EN;
}

export function isRtlLang(lang: ProfileLang): boolean {
  return lang === 'fa' || lang === 'ar';
}

const COORD_SOURCE_FA: Record<string, string> = {
  selected_city_coordinates: 'مختصات تأییدشده شهر (انتخاب از فهرست)',
  explicit_coordinates: 'مختصات صریح',
  geocoded_fallback: 'شناسایی از روی نام شهر (لطفاً تأیید کنید)',
};

export function formatCoordinateSource(source: string | undefined, lang: ProfileLang): string {
  if (!source) return '—';
  if (lang === 'fa') return COORD_SOURCE_FA[source] ?? source;
  const en: Record<string, string> = {
    selected_city_coordinates: 'Verified city coordinates (dropdown)',
    explicit_coordinates: 'Explicit coordinates',
    geocoded_fallback: 'Geocoded from city name (please confirm)',
  };
  return en[source] ?? source;
}

export type DevPanelLabels = {
  title: string;
  planets: string;
  city: string;
  country: string;
  latitude: string;
  longitude: string;
  timezone: string;
  localDatetime: string;
  utcDatetime: string;
  julianDay: string;
  houseSystem: string;
  zodiac: string;
  nodeType: string;
  ephemeris: string;
  zodiacLabel: string;
  timezoneSource: string;
  coordinateSource: string;
  calculatedAt: string;
  ascendant: string;
  midheaven: string;
  houses: string;
  ascScreen: string;
  mcScreen: string;
  icScreen: string;
  dscScreen: string;
};

const DEV_EN: DevPanelLabels = {
  title: 'Developer verification (dev only)',
  planets: 'Planets',
  city: 'City',
  country: 'Country',
  latitude: 'Latitude',
  longitude: 'Longitude',
  timezone: 'Timezone',
  localDatetime: 'Local datetime',
  utcDatetime: 'UTC datetime',
  julianDay: 'Julian Day',
  houseSystem: 'House system',
  zodiac: 'Zodiac',
  nodeType: 'Node type',
  ephemeris: 'Ephemeris',
  zodiacLabel: 'Zodiac label',
  timezoneSource: 'Timezone source',
  coordinateSource: 'Coordinate source',
  calculatedAt: 'Calculated at',
  ascendant: 'Ascendant',
  midheaven: 'Midheaven',
  houses: 'House cusps',
  ascScreen: 'ASC screen °',
  mcScreen: 'MC screen °',
  icScreen: 'IC screen °',
  dscScreen: 'DSC screen °',
};

const DEV_FA: DevPanelLabels = {
  title: 'اطلاعات توسعه‌دهنده',
  planets: 'سیارات',
  city: 'شهر',
  country: 'کشور',
  latitude: 'عرض جغرافیایی',
  longitude: 'طول جغرافیایی',
  timezone: 'منطقه زمانی',
  localDatetime: 'زمان محلی',
  utcDatetime: 'زمان UTC',
  julianDay: 'روز ژولیوسی',
  houseSystem: 'سیستم خانه‌ها',
  zodiac: 'سیستم طالع',
  nodeType: 'نوع گره ماه',
  ephemeris: 'موتور محاسبه',
  zodiacLabel: 'برچسب طالع',
  timezoneSource: 'منبع منطقه زمانی',
  coordinateSource: 'منبع مختصات',
  calculatedAt: 'زمان محاسبه',
  ascendant: 'طالع',
  midheaven: 'وسط‌السماء',
  houses: 'ابتدای خانه‌ها',
  ascScreen: 'زاویه صفحه طالع',
  mcScreen: 'زاویه صفحه MC',
  icScreen: 'زاویه صفحه IC',
  dscScreen: 'زاویه صفحه DSC',
};

export function getDevPanelLabels(lang: ProfileLang): DevPanelLabels {
  if (lang === 'fa') return DEV_FA;
  return DEV_EN;
}

import type { AppLang } from '@/lib/app-settings';

export type ProfileLang = AppLang | 'en';

export type ChartConfirmLabels = {
  title: string;
  body: string;
  fields: {
    name: string;
    birthDate: string;
    birthTime: string;
    city: string;
    timezone: string;
    coordinates: string;
    zodiac: string;
    houseSystem: string;
    nodeType: string;
  };
  confirm: string;
  edit: string;
  geocodeWarning: string;
  geocodeConfirm: string;
  resolving: string;
  unknown: string;
};

const CHART_CONFIRM_EN: ChartConfirmLabels = {
  title: 'Confirm birth details',
  body:
    'Review the details below before creating your natal chart. Birth time, city, and timezone directly affect the ascendant, houses, and planetary positions.',
  fields: {
    name: 'Name',
    birthDate: 'Birth date',
    birthTime: 'Birth time',
    city: 'Birth city',
    timezone: 'Timezone',
    coordinates: 'Coordinates',
    zodiac: 'Zodiac system',
    houseSystem: 'House system',
    nodeType: 'Node type',
  },
  confirm: 'Confirm & Create Chart',
  edit: 'Edit Details',
  geocodeWarning:
    'City coordinates and timezone were resolved from the geographic database.\nIf the wrong city was selected, ascendant, houses, and aspects may change.',
  geocodeConfirm: 'Coordinates look correct',
  resolving: 'Fetching coordinates…',
  unknown: 'Unknown',
};

const CHART_CONFIRM_FA: ChartConfirmLabels = {
  title: 'تأیید اطلاعات تولد',
  body:
    'برای محاسبه دقیق نمودار تولد، لطفاً اطلاعات زیر را بررسی و تأیید کنید. دقت زمان تولد، شهر تولد و منطقه زمانی روی طالع، خانه‌ها و جایگاه سیارات اثر مستقیم دارد.',
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
  confirm: 'تأیید و ساخت نمودار',
  edit: 'ویرایش اطلاعات',
  geocodeWarning:
    'مختصات و منطقه زمانی شهر از پایگاه داده جغرافیایی استخراج شده‌اند.\nاگر شهر اشتباه انتخاب شده باشد، محاسبه طالع، خانه‌ها و زوایا ممکن است تغییر کند.',
  geocodeConfirm: 'مختصات درست است',
  resolving: 'در حال دریافت مختصات…',
  unknown: 'نامشخص',
};

const CHART_CONFIRM_RU: ChartConfirmLabels = {
  title: 'Подтверждение данных рождения',
  body:
    'Проверьте данные ниже перед созданием натальной карты. Время рождения, город и часовой пояс напрямую влияют на асцендент, дома и положения планет.',
  fields: {
    name: 'Имя',
    birthDate: 'Дата рождения',
    birthTime: 'Время рождения',
    city: 'Город рождения',
    timezone: 'Часовой пояс',
    coordinates: 'Координаты',
    zodiac: 'Система зодиака',
    houseSystem: 'Система домов',
    nodeType: 'Тип узла',
  },
  confirm: 'Подтвердить и создать карту',
  edit: 'Изменить данные',
  geocodeWarning:
    'Координаты и часовой пояс города получены из географической базы.\nЕсли выбран неверный город, асцендент, дома и аспекты могут измениться.',
  geocodeConfirm: 'Координаты верны',
  resolving: 'Получение координат…',
  unknown: 'Неизвестно',
};

const CHART_CONFIRM_AR: ChartConfirmLabels = {
  title: 'تأكيد بيانات الميلاد',
  body:
    'راجع البيانات أدناه قبل إنشاء مخطط الميلاد. وقت الميلاد والمدينة والمنطقة الزمنية تؤثر مباشرة على الطالع والبيوت ومواقع الكواكب.',
  fields: {
    name: 'الاسم',
    birthDate: 'تاريخ الميلاد',
    birthTime: 'وقت الميلاد',
    city: 'مدينة الميلاد',
    timezone: 'المنطقة الزمنية',
    coordinates: 'الإحداثيات',
    zodiac: 'نظام الطالع',
    houseSystem: 'نظام البيوت',
    nodeType: 'نوع العقدة',
  },
  confirm: 'تأكيد وإنشاء المخطط',
  edit: 'تعديل البيانات',
  geocodeWarning:
    'تم استخراج إحداثيات المدينة والمنطقة الزمنية من قاعدة البيانات الجغرافية.\nإذا اختيرت مدينة خاطئة، قد يتغير الطالع والبيوت والزوايا.',
  geocodeConfirm: 'الإحداثيات صحيحة',
  resolving: 'جاري جلب الإحداثيات…',
  unknown: 'غير معروف',
};

/** @deprecated Use getChartConfirmLabels('fa') */
export const FA_CHART_CONFIRM = CHART_CONFIRM_FA;

export function getChartConfirmLabels(lang: ProfileLang): ChartConfirmLabels {
  switch (lang) {
    case 'fa':
      return CHART_CONFIRM_FA;
    case 'ru':
      return CHART_CONFIRM_RU;
    case 'ar':
      return CHART_CONFIRM_AR;
    default:
      return CHART_CONFIRM_EN;
  }
}

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

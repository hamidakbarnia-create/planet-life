'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './pathfinder-visual-spike.css';
import { localeFontFamily } from '@/lib/brand-theme';
import { AppShell } from '@/components/AppShell';
import { loadBirthProfile, type BirthProfile } from '@/lib/birth-profile';
import { isPaid } from '@/lib/membership';
import { loadAppLang, saveAppLang } from '@/lib/calendar-preferences';
import { loadCalendarSystem, type AppLang, type CalendarSystem } from '@/lib/app-settings';
import { formatDisplayDateRange } from '@/lib/date-format';
import { HOME_LANGS } from '@/lib/home-i18n';
import { todayYMD } from '@/lib/calendar-utils';
import { PathfinderGlobe } from '@/components/pathfinder/PathfinderGlobe';
import { PathfinderSelectedLineCard } from '@/components/pathfinder/PathfinderSelectedLineCard';
import type { PathfinderSunAngle, PathfinderSunAngleFilter } from '@/lib/pathfinder-geometry-demo';
import { fetchLocationPreview } from '@/lib/location-resolve';
import {
  classifyAnalyzeFailure,
  fetchPathfinderBestTimes,
  fetchPathfinderRelocation,
  PathfinderApiError,
  type PathfinderArea,
  type PathfinderBestTimes,
  type PathfinderCity,
  type PathfinderEffect,
  type PathfinderLine,
  type PathfinderRelocation,
} from '@/lib/pathfinder-api';
import {
  composeEffectLead,
  composeReasons,
  pathfinderAngleName,
  pathfinderPlanetName,
  periodLabel,
} from '@/lib/pathfinder-i18n';
import {
  canUseFreeTierAnalyze,
  formatSelectedCoordinates,
  isAnalyzeEligible,
  isBestTimesEligible,
  isPolarCalculationRisk,
  pathfinderAllowanceKey,
  selectedPointFromCitySearch,
  selectedPointFromGlobePick,
  selectedPointToApiTarget,
  withAuthoritativeTimezone,
  type PathfinderSelectedPoint,
} from '@/lib/pathfinder-selection';

type Labels = {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  analyze: string;
  noProfile: string;
  goProfile: string;
  freeTeaser: string;
  upgrade: string;
  activeLines: string;
  noLines: string;
  effects: string;
  bestTimes: string;
  bestTimesSub: string;
  purpose: string;
  searchPeriods: string;
  loading: string;
  error: string;
  selectedCity: string;
  orbLabel: string;
  globeNote: string;
  selectedLocation: string;
  coordinates: string;
  timezoneUnavailable: string;
  localTimeUnavailable: string;
  bestTimesNeedsTimezone: string;
  unsupportedCalculation: string;
  polarShippingBlocker: string;
  globeLoading: string;
  globeUnavailable: string;
  reset: string;
  fullscreen: string;
  attribution: string;
  selectHint: string;
  timezoneLabel: string;
  localTimeLabel: string;
  areas: Record<PathfinderArea | 'all', string>;
  verdicts: Record<string, string>;
};

export const PATHFINDER_FREE_CITY_KEY = 'planet-life-pathfinder-free-city';

export async function executePathfinderAnalyze(input: {
  point: PathfinderSelectedPoint;
  profile: BirthProfile;
  isPaidMember: boolean;
  storage: Pick<Storage, 'getItem' | 'setItem'>;
  lang: string;
  unsupportedCalculation: string;
  fallbackError: string;
  fetchRelocation: (
    profile: BirthProfile,
    city: PathfinderCity,
    lang: string
  ) => Promise<PathfinderRelocation>;
}): Promise<
  | { status: 'success'; relocation: PathfinderRelocation }
  | { status: 'blocked_free_tier' }
  | { status: 'failed'; message: string; allowanceConsumed: false }
> {
  const used = input.storage.getItem(PATHFINDER_FREE_CITY_KEY);
  if (!canUseFreeTierAnalyze(input.point, input.isPaidMember, used)) {
    return { status: 'blocked_free_tier' };
  }
  try {
    const relocation = await input.fetchRelocation(
      input.profile,
      selectedPointToApiTarget(input.point),
      input.lang
    );
    input.storage.setItem(PATHFINDER_FREE_CITY_KEY, pathfinderAllowanceKey(input.point));
    return { status: 'success', relocation };
  } catch (error) {
    const failure =
      error instanceof PathfinderApiError
        ? classifyAnalyzeFailure(error.status, error.detail)
        : classifyAnalyzeFailure(0, error instanceof Error ? error.message : '');
    return {
      status: 'failed',
      message:
        failure.kind === 'unsupported_calculation' ? input.unsupportedCalculation : input.fallbackError,
      allowanceConsumed: false,
    };
  }
}

async function enrichSelectedPointTimezone(
  point: PathfinderSelectedPoint
): Promise<PathfinderSelectedPoint> {
  try {
    const preview = await fetchLocationPreview({
      location: `${point.latitude},${point.longitude}`,
      latitude: point.latitude,
      longitude: point.longitude,
    });
    return withAuthoritativeTimezone(point, preview.timezone);
  } catch {
    return point;
  }
}

function formatLocalTimeInZone(timezone: string, now: Date, locale: string): string | null {
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
    }).format(now);
  } catch {
    return null;
  }
}

export const PATHFINDER_PAGE_COPY: Record<AppLang, Labels> = {
  en: {
    title: 'Pathfinder',
    subtitle:
      'Relocation astrology for cities: see where love, career, wealth, home, and timing open for your chart.',
    searchPlaceholder: 'Search a city...',
    analyze: 'Analyze location',
    noProfile: 'Pathfinder needs your saved birth profile first.',
    goProfile: 'Go to Profile',
    freeTeaser: 'Free teaser includes one city. Unlock Pathfinder to compare more locations.',
    upgrade: 'Upgrade',
    activeLines: 'Active city lines',
    noLines: 'No planet is tightly on an angle here. The city feels neutral rather than extreme.',
    effects: 'Effects of this location',
    bestTimes: 'Best Times',
    bestTimesSub: 'Find favorable weeks to visit this location.',
    purpose: 'Purpose',
    searchPeriods: 'Search periods',
    loading: 'Reading the city chart...',
    error: 'Could not analyze this location.',
    selectedCity: 'Selected city',
    orbLabel: 'orb',
    globeNote: 'City compatibility now. Full astrocartography map lines in Phase 2.',
    selectedLocation: 'Selected location',
    coordinates: 'Coordinates',
    timezoneUnavailable: 'Local timezone is unavailable for this point.',
    localTimeUnavailable: 'Local time unavailable',
    bestTimesNeedsTimezone: 'Best Times needs an authoritative timezone for this point.',
    unsupportedCalculation:
      'This coordinate can be selected, but the current calculation cannot be completed for this latitude. The selected point is unchanged.',
    polarShippingBlocker:
      'Shipping blocker: high-latitude analysis is currently unsupported. The point stays selected. The house system was not changed.',
    globeLoading: 'Loading Earth…',
    globeUnavailable: 'The 3D Earth is unavailable. Search and Analyze still work.',
    reset: 'Reset view',
    fullscreen: 'Fullscreen',
    attribution: '© OpenStreetMap contributors © OpenFreeMap © MapLibre',
    selectHint: 'Select any point on Earth or search a place.',
    timezoneLabel: 'Timezone',
    localTimeLabel: 'Local time',
    areas: {
      all: 'All Areas',
      love: 'Love',
      career: 'Career',
      wealth: 'Wealth',
      home: 'Home & Family',
      wellbeing: 'Wellbeing',
      community: 'Community',
      spirituality: 'Spirituality',
    },
    verdicts: { positive: 'Supportive', mixed: 'Mixed', challenging: 'Careful' },
  },
  ru: {
    title: 'Маршрут',
    subtitle:
      'Астрология релокации по городам: где открываются любовь, карьера, деньги, дом и удачные периоды.',
    searchPlaceholder: 'Поиск города...',
    analyze: 'Анализировать город',
    noProfile: 'Сначала сохраните данные рождения в профиле.',
    goProfile: 'В профиль',
    freeTeaser: 'Бесплатно доступен один город. Для сравнения локаций нужен апгрейд.',
    upgrade: 'Апгрейд',
    activeLines: 'Активные линии города',
    noLines: 'Здесь нет планет близко к углам карты. Локация скорее нейтральная.',
    effects: 'Эффект этой локации',
    bestTimes: 'Лучшие периоды',
    bestTimesSub: 'Найдите удачные недели для поездки в этот город.',
    purpose: 'Цель',
    searchPeriods: 'Искать периоды',
    loading: 'Читаем карту города...',
    error: 'Не удалось проанализировать локацию.',
    selectedCity: 'Выбранный город',
    orbLabel: 'орб',
    globeNote: 'Сейчас — совместимость с городом. Полные линии астрокартографии во 2-й фазе.',
    selectedLocation: 'Выбранная точка',
    coordinates: 'Координаты',
    timezoneUnavailable: 'Часовой пояс для этой точки недоступен.',
    localTimeUnavailable: 'Местное время недоступно',
    bestTimesNeedsTimezone: 'Для Best Times нужен подтверждённый часовой пояс этой точки.',
    unsupportedCalculation:
      'Эту точку можно выбрать, но текущий расчёт для данной широты недоступен. Выбранная точка сохранена.',
    polarShippingBlocker:
      'Блокер выпуска: расчёт на высоких широтах сейчас недоступен. Точка остаётся выбранной. Система домов не менялась.',
    globeLoading: 'Загрузка Земли…',
    globeUnavailable: '3D-Земля недоступна. Поиск и анализ по-прежнему работают.',
    reset: 'Сбросить вид',
    fullscreen: 'Полный экран',
    attribution: '© участники OpenStreetMap © OpenFreeMap © MapLibre',
    selectHint: 'Выберите любую точку на Земле или найдите место.',
    timezoneLabel: 'Часовой пояс',
    localTimeLabel: 'Местное время',
    areas: {
      all: 'Все сферы',
      love: 'Любовь',
      career: 'Карьера',
      wealth: 'Деньги',
      home: 'Дом и семья',
      wellbeing: 'Самочувствие',
      community: 'Сообщество',
      spirituality: 'Духовность',
    },
    verdicts: { positive: 'Поддерживает', mixed: 'Неоднозначно', challenging: 'Осторожно' },
  },
  fa: {
    title: 'مسیر‌یاب',
    subtitle:
      'استرولوژی جابه‌جایی برای شهرها: ببین عشق، کار، پول، خانه و زمان سفر برای چارت تو کجا بهتر باز می‌شود.',
    searchPlaceholder: 'جستجوی شهر...',
    analyze: 'تحلیل شهر',
    noProfile: 'برای مسیر‌یاب ابتدا پروفایل تولد را ذخیره کنید.',
    goProfile: 'رفتن به پروفایل',
    freeTeaser: 'نسخه رایگان فقط یک شهر را نشان می‌دهد. برای مقایسه شهرها ارتقا دهید.',
    upgrade: 'ارتقا',
    activeLines: 'خطوط فعال شهر',
    noLines: 'اینجا هیچ سیاره‌ای خیلی نزدیک به زاویه‌های چارت نیست؛ اثر شهر بیشتر خنثی است.',
    effects: 'اثر این مکان',
    bestTimes: 'بهترین زمان‌ها',
    bestTimesSub: 'هفته‌های مناسب برای سفر به این شهر را پیدا کن.',
    purpose: 'هدف',
    searchPeriods: 'جستجوی دوره‌ها',
    loading: 'در حال خواندن چارت شهر...',
    error: 'تحلیل این مکان ممکن نشد.',
    selectedCity: 'شهر انتخاب‌شده',
    orbLabel: 'اوربیت',
    globeNote: 'فعلاً سازگاری با شهر. خطوط کامل آسترو‌کارتوگرافی در فاز دوم.',
    selectedLocation: 'مکان انتخاب‌شده',
    coordinates: 'مختصات',
    timezoneUnavailable: 'منطقه زمانی معتبر برای این نقطه در دسترس نیست.',
    localTimeUnavailable: 'ساعت محلی در دسترس نیست',
    bestTimesNeedsTimezone: 'بهترین زمان‌ها فقط با منطقه زمانی معتبر این نقطه فعال می‌شود.',
    unsupportedCalculation:
      'این مختصات قابل انتخاب است، اما محاسبه فعلی برای این عرض جغرافیایی انجام نمی‌شود. نقطه انتخاب‌شده حفظ شده است.',
    polarShippingBlocker:
      'مسدودکننده انتشار: تحلیل عرض‌های بالا فعلاً پشتیبانی نمی‌شود. نقطه انتخاب‌شده باقی می‌ماند. سامانه خانه‌ها تغییر نکرد.',
    globeLoading: 'در حال بارگذاری زمین…',
    globeUnavailable: 'کره سه‌بعدی در دسترس نیست. جستجو و تحلیل همچنان کار می‌کند.',
    reset: 'بازنشانی نما',
    fullscreen: 'تمام‌صفحه',
    attribution: '© مشارکت‌کنندگان OpenStreetMap © OpenFreeMap © MapLibre',
    selectHint: 'هر نقطه‌ای روی زمین را انتخاب کن یا مکانی را جستجو کن.',
    timezoneLabel: 'منطقه زمانی',
    localTimeLabel: 'ساعت محلی',
    areas: {
      all: 'همه حوزه‌ها',
      love: 'عشق',
      career: 'کار',
      wealth: 'ثروت',
      home: 'خانه و خانواده',
      wellbeing: 'حال خوب',
      community: 'جامعه و دوستان',
      spirituality: 'معنویت',
    },
    verdicts: { positive: 'حمایت‌گر', mixed: 'ترکیبی', challenging: 'با احتیاط' },
  },
  ar: {
    title: 'المسار',
    subtitle:
      'فلك الانتقال بين المدن: أين تنفتح لك فرص الحب والعمل والمال والبيت وأفضل توقيت للسفر.',
    searchPlaceholder: 'ابحث عن مدينة...',
    analyze: 'تحليل الموقع',
    noProfile: 'يحتاج المسار إلى حفظ بيانات ميلادك أولاً.',
    goProfile: 'إلى الملف',
    freeTeaser: 'المعاينة المجانية تشمل مدينة واحدة. افتح الخطة المدفوعة للمقارنة.',
    upgrade: 'ترقية',
    activeLines: 'الخطوط النشطة في المدينة',
    noLines: 'لا يوجد كوكب قريب جداً من زوايا الخريطة هنا؛ تأثير المكان أكثر حياداً.',
    effects: 'تأثير هذا الموقع',
    bestTimes: 'أفضل الأوقات',
    bestTimesSub: 'اعثر على الأسابيع الأنسب لزيارة هذا المكان.',
    purpose: 'الهدف',
    searchPeriods: 'البحث عن الفترات',
    loading: 'نقرأ خريطة المدينة...',
    error: 'تعذر تحليل هذا الموقع.',
    selectedCity: 'المدينة المختارة',
    orbLabel: 'فلك',
    globeNote: 'الآن توافق المدينة. خطوط خريطة الفلك الكاملة في المرحلة الثانية.',
    selectedLocation: 'الموقع المحدد',
    coordinates: 'الإحداثيات',
    timezoneUnavailable: 'المنطقة الزمنية غير متاحة لهذه النقطة.',
    localTimeUnavailable: 'الوقت المحلي غير متاح',
    bestTimesNeedsTimezone: 'أفضل الأوقات يحتاج إلى منطقة زمنية موثوقة لهذه النقطة.',
    unsupportedCalculation:
      'يمكن اختيار هذا الإحداثي، لكن الحساب الحالي غير متاح عند هذا العرض. بقيت النقطة المحددة كما هي.',
    polarShippingBlocker:
      'عائق إطلاق: التحليل عند العروض العالية غير مدعوم حالياً. بقيت النقطة محددة. لم يتغير نظام البيوت.',
    globeLoading: 'جارٍ تحميل الأرض…',
    globeUnavailable: 'الأرض ثلاثية الأبعاد غير متاحة. البحث والتحليل ما زالا يعملان.',
    reset: 'إعادة العرض',
    fullscreen: 'ملء الشاشة',
    attribution: '© مساهمو OpenStreetMap © OpenFreeMap © MapLibre',
    selectHint: 'اختر أي نقطة على الأرض أو ابحث عن مكان.',
    timezoneLabel: 'المنطقة الزمنية',
    localTimeLabel: 'الوقت المحلي',
    areas: {
      all: 'كل المجالات',
      love: 'الحب',
      career: 'العمل',
      wealth: 'المال',
      home: 'البيت والعائلة',
      wellbeing: 'العافية',
      community: 'المجتمع والأصدقاء',
      spirituality: 'الروحانية',
    },
    verdicts: { positive: 'داعمة', mixed: 'مختلطة', challenging: 'بحذر' },
  },
};

const PURPOSES: (PathfinderArea | 'all')[] = [
  'all',
  'love',
  'career',
  'wealth',
  'home',
  'wellbeing',
  'community',
  'spirituality',
];

type CitySearchResult = PathfinderCity & { country?: string };

function scoreColor(score: number) {
  if (score >= 70) return '#4ade80';
  if (score >= 55) return '#60a5fa';
  if (score >= 42) return '#fbbf24';
  return '#f87171';
}

function lineColor(line: PathfinderLine) {
  if (line.angle === 'MC') return '#fbbf24';
  if (line.angle === 'DC') return '#f472b6';
  if (line.angle === 'AC') return '#60a5fa';
  return '#4ade80';
}

function EffectCard({ effect, labels, lang }: { effect: PathfinderEffect; labels: Labels; lang: AppLang }) {
  const color = scoreColor(effect.score);
  const areaLabel = labels.areas[effect.area];
  const lead = composeEffectLead(lang, effect, areaLabel);
  const reasons = composeReasons(lang, effect);
  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="fi text-sm font-semibold text-white">{areaLabel}</div>
          <div className="fi mt-1 text-[11px]" style={{ color }}>{labels.verdicts[effect.verdict]}</div>
        </div>
        <div className="fi text-xl font-semibold" style={{ color }}>{effect.score}</div>
      </div>
      <p className="fi mt-3 text-xs leading-relaxed text-white/58">{lead}</p>
      {reasons.length > 0 && (
        <ul className="fi mt-2 space-y-1.5">
          {reasons.map((r, i) => (
            <li key={i} className="flex gap-2 text-xs leading-relaxed text-white/72">
              <span aria-hidden className="mt-[2px] shrink-0" style={{ color }}>•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PeriodCard({ period, lang, calendar }: { period: { start: string; end: string; score: number; daily_scores: number[] }; lang: AppLang; calendar: CalendarSystem }) {
  const color = scoreColor(period.score);
  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center justify-between">
        <div className="fi text-sm font-semibold text-white">{formatDisplayDateRange(lang, period.start, period.end, calendar)}</div>
        <div className="fi text-xs font-medium" style={{ color }}>{periodLabel(lang, period.score)} · {period.score}</div>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1">
        {period.daily_scores.map((score, idx) => (
          <span key={idx} className="h-1.5 rounded-full" style={{ background: scoreColor(score) }} />
        ))}
      </div>
    </div>
  );
}

export default function PathfinderPage() {
  const [lang, setLangState] = useState<AppLang>(() => {
    const stored = loadAppLang();
    return stored === 'en' || stored === 'ru' || stored === 'fa' || stored === 'ar'
      ? stored
      : 'en';
  });
  const [profile] = useState<BirthProfile | null>(() => loadBirthProfile());
  const [calendar] = useState<CalendarSystem>(() => loadCalendarSystem());
  const [citySearch, setCitySearch] = useState('');
  const [cities, setCities] = useState<CitySearchResult[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<PathfinderSelectedPoint | null>(null);
  const [showCities, setShowCities] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [error, setError] = useState('');
  const [relocation, setRelocation] = useState<PathfinderRelocation | null>(null);
  const [bestTimes, setBestTimes] = useState<PathfinderBestTimes | null>(null);
  const [purpose, setPurpose] = useState<PathfinderArea | 'all'>('all');
  const [blocked, setBlocked] = useState(false);
  const [angleFilter, setAngleFilter] = useState<PathfinderSunAngleFilter>('all');
  const [selectedLine, setSelectedLine] = useState<PathfinderSunAngle | null>(null);
  const debounceRef = useRef<number | null>(null);
  const selectionSeqRef = useRef(0);

  useEffect(() => {
    document.documentElement.classList.add('pathfinder-visual-spike');
    return () => document.documentElement.classList.remove('pathfinder-visual-spike');
  }, []);

  const labels = PATHFINDER_PAGE_COPY[lang];
  const shellLabels = HOME_LANGS[lang];
  const analyzeEnabled = isAnalyzeEligible(selectedPoint, Boolean(profile));
  const bestTimesEnabled = isBestTimesEligible(selectedPoint, Boolean(relocation));
  const localTime = selectedPoint?.timezone
    ? formatLocalTimeInZone(selectedPoint.timezone, new Date(), lang)
    : null;

  const setLang = (next: AppLang) => {
    setLangState(next);
    saveAppLang(next);
  };

  const searchCities = useCallback((q: string) => {
    if (debounceRef.current != null) window.clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setCities([]);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/cities?q=${encodeURIComponent(q)}&lang=${lang}`);
        const data = (await res.json()) as CitySearchResult[];
        setCities(data);
      } catch {
        setCities([]);
      }
    }, 250);
  }, [lang]);

  const applySelection = useCallback((point: PathfinderSelectedPoint) => {
    const seq = selectionSeqRef.current + 1;
    selectionSeqRef.current = seq;
    setSelectedPoint(point);
    setRelocation(null);
    setBestTimes(null);
    setBlocked(false);
    setError('');
    void enrichSelectedPointTimezone(point).then((enriched) => {
      if (selectionSeqRef.current !== seq) return;
      setSelectedPoint(enriched);
    });
  }, []);

  const analyze = async () => {
    if (!profile || !selectedPoint) return;
    setBlocked(false);
    setLoading(true);
    setError('');
    setBestTimes(null);
    const result = await executePathfinderAnalyze({
      point: selectedPoint,
      profile,
      isPaidMember: isPaid(),
      storage: window.localStorage,
      lang,
      unsupportedCalculation: labels.unsupportedCalculation,
      fallbackError: labels.error,
      fetchRelocation: fetchPathfinderRelocation,
    });
    if (result.status === 'blocked_free_tier') {
      setBlocked(true);
    } else if (result.status === 'success') {
      setRelocation(result.relocation);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const loadBestTimes = async () => {
    if (!profile || !selectedPoint || !bestTimesEnabled) return;
    setLoadingTimes(true);
    setError('');
    try {
      const data = await fetchPathfinderBestTimes(
        profile,
        selectedPointToApiTarget(selectedPoint),
        purpose,
        todayYMD(),
        lang
      );
      setBestTimes(data);
    } catch (e) {
      if (e instanceof PathfinderApiError) {
        const failure = classifyAnalyzeFailure(e.status, e.detail);
        setError(failure.kind === 'unsupported_calculation' ? labels.unsupportedCalculation : labels.error);
      } else {
        setError(e instanceof Error ? e.message : labels.error);
      }
    } finally {
      setLoadingTimes(false);
    }
  };

  const topEffects = useMemo(() => relocation?.effects ?? [], [relocation]);

  return (
    <AppShell
      lang={lang}
      setLang={setLang}
      dir={shellLabels.dir}
      navLabels={shellLabels.nav}
      fontFamily={localeFontFamily(lang)}
    >
      <div
        className="pathfinder-visual-page"
        data-testid="pathfinder-visual-page"
        data-has-selection={selectedPoint ? '1' : '0'}
      >
        <div className="pathfinder-visual-map-stage" data-testid="pathfinder-map-stage">
          <PathfinderGlobe
            selected={selectedPoint}
            angleFilter={angleFilter}
            selectedLine={selectedLine}
            onAngleFilterChange={setAngleFilter}
            onSelectLine={setSelectedLine}
            labels={{
              globeLoading: labels.globeLoading,
              globeUnavailable: labels.globeUnavailable,
              reset: labels.reset,
              fullscreen: labels.fullscreen,
              attribution: labels.attribution,
            }}
            onPick={(latitude, longitude) => {
              applySelection(selectedPointFromGlobePick(latitude, longitude, labels.selectedLocation));
            }}
          />
        </div>
        <div className="pathfinder-visual-decision" data-testid="pathfinder-decision-panel">
          {selectedLine ? (
            <div className="pathfinder-selected-line-desktop mb-4 hidden lg:block">
              <PathfinderSelectedLineCard angle={selectedLine} variant="desktop-panel" />
            </div>
          ) : null}
          <section className="rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="fc text-3xl tracking-wide text-amber-300">{labels.title}</div>
            <p className="fi mt-3 text-sm leading-relaxed text-white/55">{labels.subtitle}</p>

            {!profile && (
              <div className="mt-5 rounded-2xl p-4 fi text-sm" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.22)', color: 'rgba(255,255,255,0.78)' }}>
                {labels.noProfile}{' '}
                <Link href="/profile" className="text-amber-300 underline">{labels.goProfile}</Link>
              </div>
            )}

            <div className="relative mt-5">
              <input
                value={citySearch}
                onChange={(e) => {
                  setCitySearch(e.target.value);
                  setShowCities(true);
                  searchCities(e.target.value);
                }}
                onFocus={() => setShowCities(true)}
                placeholder={labels.searchPlaceholder}
                className="fi w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-amber-400/40"
              />
              {showCities && cities.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-64 overflow-auto rounded-2xl border border-white/10 bg-[#101624] shadow-2xl">
                  {cities.map((city) => (
                    <button
                      key={`${city.lat}-${city.lon}-${city.name}`}
                      type="button"
                      onClick={() => {
                        applySelection(selectedPointFromCitySearch(city));
                        setCitySearch(city.short || city.name);
                        setShowCities(false);
                      }}
                      className="fi block w-full px-4 py-3 text-left text-xs text-white/70 hover:bg-white/[0.05]"
                    >
                      <span className="block font-medium text-white">{city.short}</span>
                      <span className="text-white/40">{city.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedPoint && (
              <div
                data-testid="pathfinder-selected-point"
                data-source={selectedPoint.source}
                data-resolution={selectedPoint.placeResolutionStatus}
                className="fi mt-3 space-y-1 text-xs text-white/45"
              >
                <div>
                  {selectedPoint.displayName}
                  {selectedPoint.country ? ` · ${selectedPoint.country}` : ''}
                </div>
                <div data-testid="pathfinder-selected-coords">
                  {labels.coordinates}: {formatSelectedCoordinates(selectedPoint)}
                </div>
                <div data-testid="pathfinder-selected-timezone">
                  {selectedPoint.timezone
                    ? `${labels.timezoneLabel}: ${selectedPoint.timezone}`
                    : labels.timezoneUnavailable}
                </div>
                <div data-testid="pathfinder-selected-local-time">
                  {localTime
                    ? `${labels.localTimeLabel}: ${localTime}`
                    : labels.localTimeUnavailable}
                </div>
              </div>
            )}

            {selectedPoint && isPolarCalculationRisk(selectedPoint.latitude) && (
              <p
                data-testid="pathfinder-polar-shipping-blocker"
                className="fi mt-3 text-xs text-amber-200/80"
              >
                {labels.polarShippingBlocker}
              </p>
            )}

            <p className="fi mt-3 text-xs text-white/35">{labels.selectHint}</p>

            <button
              type="button"
              data-testid="pathfinder-analyze"
              disabled={!analyzeEnabled || loading}
              onClick={() => analyze()}
              className="fi mt-5 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: '#fbbf24', color: '#101010' }}
            >
              {loading ? labels.loading : labels.analyze}
            </button>

            {blocked && (
              <div className="mt-4 rounded-2xl p-4 fi text-sm" style={{ background: 'rgba(48,92,222,0.08)', border: '1px solid rgba(48,92,222,0.22)', color: 'rgba(255,255,255,0.78)' }}>
                {labels.freeTeaser}{' '}
                <Link href="/upgrade" className="underline" style={{ color: '#93B4FF' }}>{labels.upgrade}</Link>
              </div>
            )}
            {error && <div className="fi mt-4 text-sm text-red-300">{error}</div>}
          </section>

        {relocation && (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <section className="rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="fi text-[11px] uppercase tracking-[0.22em] text-white/35">{labels.activeLines}</div>
              <div className="mt-4 flex flex-col gap-3">
                {relocation.active_lines.length === 0 ? (
                  <p className="fi text-sm leading-relaxed text-white/55">{labels.noLines}</p>
                ) : (
                  relocation.active_lines.map((line) => (
                    <div key={`${line.planet}-${line.angle}`} className="flex items-center justify-between rounded-2xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div>
                        <div className="fi text-sm font-medium text-white">{pathfinderPlanetName(lang, line.planet)} · {line.angle}</div>
                        <div className="fi text-[11px] text-white/40">{pathfinderAngleName(lang, line.angle)} · {line.orb}° {labels.orbLabel}</div>
                      </div>
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: lineColor(line) }} />
                    </div>
                  ))
                )}
              </div>
            </section>

            <section>
              <div className="fi mb-4 text-[11px] uppercase tracking-[0.22em] text-white/35">{labels.effects}</div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {topEffects.map((effect) => (
                  <EffectCard key={effect.area} effect={effect} labels={labels} lang={lang} />
                ))}
              </div>
            </section>
          </div>
        )}

        {relocation && (
          <section className="mt-8 rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="fc text-2xl text-amber-300">{labels.bestTimes}</div>
                <p className="fi mt-1 text-sm text-white/45">{labels.bestTimesSub}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {PURPOSES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPurpose(item)}
                    className="fi rounded-xl border px-3 py-2 text-xs"
                    style={{
                      borderColor: purpose === item ? 'rgba(251,191,36,0.55)' : 'rgba(255,255,255,0.1)',
                      color: purpose === item ? '#fbbf24' : 'rgba(255,255,255,0.55)',
                      background: purpose === item ? 'rgba(251,191,36,0.08)' : 'transparent',
                    }}
                  >
                    {labels.areas[item]}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              data-testid="pathfinder-best-times"
              onClick={loadBestTimes}
              disabled={!bestTimesEnabled || loadingTimes}
              className="fi mt-5 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              {loadingTimes ? labels.loading : labels.searchPeriods}
            </button>
            {!bestTimesEnabled && (
              <p data-testid="pathfinder-best-times-reason" className="fi mt-3 text-xs text-white/45">
                {labels.bestTimesNeedsTimezone}
              </p>
            )}
            {bestTimes && (
              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                {bestTimes.best_periods.slice(0, 6).map((period) => (
                  <PeriodCard key={`${period.start}-${period.end}`} period={period} lang={lang} calendar={calendar} />
                ))}
              </div>
            )}
          </section>
        )}
        </div>
      </div>
    </AppShell>
  );
}

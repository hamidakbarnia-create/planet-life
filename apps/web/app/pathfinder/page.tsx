'use client';

import Link from 'next/link';
import { useCallback, useMemo, useRef, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { loadBirthProfile, type BirthProfile } from '@/lib/birth-profile';
import { isPaid } from '@/lib/membership';
import { loadAppLang, saveAppLang } from '@/lib/calendar-preferences';
import { loadCalendarSystem, type AppLang, type CalendarSystem } from '@/lib/app-settings';
import { HOME_LANGS } from '@/lib/home-i18n';
import { todayYMD } from '@/lib/calendar-utils';
import {
  fetchPathfinderBestTimes,
  fetchPathfinderRelocation,
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
  formatPathfinderDateRange,
  pathfinderAngleName,
  pathfinderPlanetName,
  periodLabel,
} from '@/lib/pathfinder-i18n';

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
  areas: Record<PathfinderArea | 'all', string>;
  verdicts: Record<string, string>;
};

const COPY: Record<AppLang, Labels> = {
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

const FREE_CITY_KEY = 'planet-life-pathfinder-free-city';
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

type CitySearchResult = PathfinderCity;

function cityKey(city: PathfinderCity) {
  return `${city.lat.toFixed(4)},${city.lon.toFixed(4)}`;
}

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

function GlobePreview({ note, title }: { note: string; title: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl min-h-[280px]"
      style={{
        background:
          'radial-gradient(circle at 45% 38%, rgba(96,165,250,0.5), rgba(20,30,60,0.55) 35%, rgba(4,8,18,0.95) 70%), radial-gradient(circle at 70% 20%, rgba(251,191,36,0.25), transparent 28%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
      }}
    >
      <div className="absolute inset-0 opacity-45" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.55) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
      <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
      {[
        ['left-[30%]', 'bg-pink-400', 'rotate-[7deg]'],
        ['left-[42%]', 'bg-amber-400', '-rotate-[4deg]'],
        ['left-[52%]', 'bg-sky-400', 'rotate-[10deg]'],
        ['left-[64%]', 'bg-violet-400', '-rotate-[7deg]'],
      ].map(([left, color, rotate], idx) => (
        <div key={idx} className={`absolute top-4 bottom-4 w-1 rounded-full ${left} ${color} ${rotate} opacity-80`} />
      ))}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="fc text-3xl tracking-wide text-white">{title}</div>
        <div className="fi mt-2 max-w-md text-sm text-white/55">
          {note}
        </div>
      </div>
    </div>
  );
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
        <div className="fi text-sm font-semibold text-white">{formatPathfinderDateRange(lang, period.start, period.end, calendar)}</div>
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
  const [selectedCity, setSelectedCity] = useState<PathfinderCity | null>(null);
  const [showCities, setShowCities] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [error, setError] = useState('');
  const [relocation, setRelocation] = useState<PathfinderRelocation | null>(null);
  const [bestTimes, setBestTimes] = useState<PathfinderBestTimes | null>(null);
  const [purpose, setPurpose] = useState<PathfinderArea | 'all'>('all');
  const [blocked, setBlocked] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const labels = COPY[lang];
  const shellLabels = HOME_LANGS[lang];

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

  const canAnalyzeCity = (city: PathfinderCity) => {
    // Paid members get unlimited cities; free users get one teaser city.
    if (isPaid()) return true;
    const used = localStorage.getItem(FREE_CITY_KEY);
    return !used || used === cityKey(city);
  };

  const analyze = async (city = selectedCity) => {
    if (!profile || !city) return;
    setBlocked(false);
    if (!canAnalyzeCity(city)) {
      setBlocked(true);
      return;
    }
    setLoading(true);
    setError('');
    setBestTimes(null);
    try {
      const data = await fetchPathfinderRelocation(profile, city, lang);
      setRelocation(data);
      localStorage.setItem(FREE_CITY_KEY, cityKey(city));
    } catch (e) {
      setError(e instanceof Error ? e.message : labels.error);
    } finally {
      setLoading(false);
    }
  };

  const loadBestTimes = async () => {
    if (!profile || !selectedCity) return;
    setLoadingTimes(true);
    setError('');
    try {
      const data = await fetchPathfinderBestTimes(profile, selectedCity, purpose, todayYMD(), lang);
      setBestTimes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : labels.error);
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
      fontFamily={lang === 'fa' || lang === 'ar' ? 'Vazirmatn, sans-serif' : 'Inter, sans-serif'}
    >
      <div className="mx-auto max-w-6xl px-5 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <GlobePreview note={labels.globeNote} title={labels.title} />
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
                        setSelectedCity(city);
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

            {selectedCity && (
              <div className="fi mt-3 text-xs text-white/45">
                {labels.selectedCity}: <span className="text-white/75">{selectedCity.short}</span>
              </div>
            )}

            <button
              type="button"
              disabled={!profile || !selectedCity || loading}
              onClick={() => analyze()}
              className="fi mt-5 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: '#fbbf24', color: '#101010' }}
            >
              {loading ? labels.loading : labels.analyze}
            </button>

            {blocked && (
              <div className="mt-4 rounded-2xl p-4 fi text-sm" style={{ background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.22)', color: 'rgba(255,255,255,0.78)' }}>
                {labels.freeTeaser}{' '}
                <Link href="/upgrade" className="text-pink-300 underline">{labels.upgrade}</Link>
              </div>
            )}
            {error && <div className="fi mt-4 text-sm text-red-300">{error}</div>}
          </section>
        </div>

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
              onClick={loadBestTimes}
              disabled={loadingTimes}
              className="fi mt-5 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              {loadingTimes ? labels.loading : labels.searchPeriods}
            </button>
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
    </AppShell>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { ActionDisclaimer } from '@/components/disclaimers/ActionDisclaimer';
import type { DisclaimerLang } from '@/lib/disclaimers';
import { getBirthProfile, loadBirthProfile } from '@/lib/birth-profile';
import type { BirthProfile } from '@/lib/birth-profile';
import {
  loadExportMode,
  saveAppLang,
  saveExportMode,
  type CalendarExportMode,
} from '@/lib/calendar-preferences';
import {
  buildDayHourlyIcs,
  buildMonthIcs,
  downloadIcs,
} from '@/lib/calendar-ics';
import {
  BAND_STYLES,
  fetchHourlyScores,
  fetchMonthScores,
  fetchTransitSnapshot,
  formatDateYMD,
  formatHourLabel,
  scoreToBand,
  type HourScore,
  type PlanetTransit,
  type ScoreBand,
} from '@/lib/calendar-scores';
import { HOME_LANGS } from '@/lib/home-i18n';
import type { AppLang } from '@/lib/app-settings';
import {
  hasConfirmedCurrentLocation,
  formatCalculatedFor,
  locationLabel,
  logLocationDebug,
  resolveCalendarEvaluationLocation,
} from '@/lib/user-locations';
import { todayYMD } from '@/lib/calendar-utils';
import { GPS_TONE_STYLES, buildStrategicGps } from '@/lib/strategic-gps';

type LangKey = AppLang;

type LangPack = {
  dir: 'ltr' | 'rtl';
  title: string;
  subtitle: string;
  prev: string;
  next: string;
  loading: string;
  noProfile: string;
  goProfile: string;
  noCurrentLocation: string;
  timingLocation: string;
  selected: string;
  hourly: string;
  golden: string;
  danger: string;
  neutral: string;
  export: string;
  exportAll: string;
  exportImportant: string;
  exportNotify: string;
  exportDownload: string;
  exportDisabled: string;
  score: string;
  dayScore: string;
  weekdays: string[];
  nav: Record<string, string>;
  months: string[];
  legend: {
    title: string;
    hint: string;
    bands: { range: string; label: string; color: string }[];
  };
  transit: {
    title: string;
    hint: string;
    retrograde: string;
    in: string;
    house: string;
    empty: string;
  };
  signs: string[];
  planets: Record<string, string>;
};

const LANGS: Record<LangKey, LangPack> = {
  en: {
    dir: 'ltr',
    title: 'Strategic Calendar',
    subtitle: 'Golden timing windows from your natal blueprint',
    prev: 'Prev',
    next: 'Next',
    loading: 'Reading the sky…',
    noProfile: 'Set your birth data on Profile first.',
    goProfile: 'Go to Profile',
    noCurrentLocation:
      'Add your current living city in Profile — calendar timing uses where you live now, not your birth city.',
    timingLocation: 'Timing location',
    selected: 'Selected day',
    hourly: 'Hourly timeline',
    golden: 'Golden window',
    danger: 'Danger zone',
    neutral: 'Neutral',
    export: 'Export',
    exportAll: 'All events (every scored day)',
    exportImportant: 'Important only (85+ and 0–39)',
    exportNotify: 'App notifications only',
    exportDownload: 'Download .ics',
    exportDisabled: 'Enable an export option above to download.',
    score: 'Score',
    dayScore: 'Day score',
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    nav: {
      '/dashboard': 'Dashboard',
      '/calendar': 'Calendar',
      '/people': 'People',
      '/profile': 'Profile',
    },
    months: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    legend: {
      title: 'What the numbers mean',
      hint: 'Each cell shows your daily readiness score (0–100) for this action.',
      bands: [
        { range: '85–100', label: 'Golden — make your move', color: '#4ade80' },
        { range: '60–84', label: 'Favorable — go ahead', color: '#fbbf24' },
        { range: '40–59', label: 'Neutral — proceed carefully', color: '#fb923c' },
        { range: '0–39', label: 'Avoid — wait for a better day', color: '#f87171' },
      ],
    },
    transit: {
      title: 'Sky on this day',
      hint: 'Live planetary positions transiting on the selected date.',
      retrograde: 'Retrograde',
      in: 'in',
      house: 'House',
      empty: 'No transit data yet.',
    },
    signs: [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
    ],
    planets: {
      sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
      jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
      pluto: 'Pluto', north_node: 'North Node',
    },
  },
  ru: {
    dir: 'ltr',
    title: 'Стратегический календарь',
    subtitle: 'Золотые окна по вашей натальной карте',
    prev: 'Назад',
    next: 'Вперёд',
    loading: 'Читаем небо…',
    noProfile: 'Сначала укажите данные рождения в Профиле.',
    goProfile: 'В профиль',
    noCurrentLocation:
      'Добавьте текущий город в Профиле — календарь использует место проживания, а не город рождения.',
    timingLocation: 'Город для тайминга',
    selected: 'Выбранный день',
    hourly: 'Почасовой таймлайн',
    golden: 'Золотое окно',
    danger: 'Опасная зона',
    neutral: 'Нейтрально',
    export: 'Экспорт',
    exportAll: 'Все события (каждый день со счётом)',
    exportImportant: 'Только важные (85+ и 0–39)',
    exportNotify: 'Только уведомления в приложении',
    exportDownload: 'Скачать .ics',
    exportDisabled: 'Выберите режим экспорта выше.',
    score: 'Счёт',
    dayScore: 'Счёт дня',
    weekdays: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    nav: {
      '/dashboard': 'Панель',
      '/calendar': 'Календарь',
      '/people': 'Люди',
      '/profile': 'Профиль',
    },
    months: [
      'Январь',
      'Февраль',
      'Март',
      'Апрель',
      'Май',
      'Июнь',
      'Июль',
      'Август',
      'Сентябрь',
      'Октябрь',
      'Ноябрь',
      'Декабрь',
    ],
    legend: {
      title: 'Что означают числа',
      hint: 'Каждая ячейка — ваш балл готовности (0–100) для этого действия.',
      bands: [
        { range: '85–100', label: 'Золотое окно — действуйте', color: '#4ade80' },
        { range: '60–84', label: 'Благоприятно — вперёд', color: '#fbbf24' },
        { range: '40–59', label: 'Нейтрально — осторожно', color: '#fb923c' },
        { range: '0–39', label: 'Избегайте — подождите', color: '#f87171' },
      ],
    },
    transit: {
      title: 'Небо в этот день',
      hint: 'Положения планет на выбранную дату.',
      retrograde: 'Ретроград',
      in: 'в',
      house: 'Дом',
      empty: 'Данных о транзитах пока нет.',
    },
    signs: [
      'Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева',
      'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы',
    ],
    planets: {
      sun: 'Солнце', moon: 'Луна', mercury: 'Меркурий', venus: 'Венера', mars: 'Марс',
      jupiter: 'Юпитер', saturn: 'Сатурн', uranus: 'Уран', neptune: 'Нептун',
      pluto: 'Плутон', north_node: 'Сев. узел',
    },
  },
  fa: {
    dir: 'rtl',
    title: 'تقویم استراتژیک',
    subtitle: 'پنجره‌های طلایی از نقشه تولد شما',
    prev: 'قبلی',
    next: 'بعدی',
    loading: 'در حال خواندن آسمان…',
    noProfile: 'ابتدا اطلاعات تولد را در پروفایل وارد کنید.',
    goProfile: 'رفتن به پروفایل',
    noCurrentLocation:
      'شهر محل زندگی فعلی را در پروفایل اضافه کن — تقویم از محل زندگی فعلی استفاده می‌کند، نه شهر تولد.',
    timingLocation: 'مکان زمان‌بندی',
    selected: 'روز انتخاب‌شده',
    hourly: 'خط زمانی ساعتی',
    golden: 'پنجره طلایی',
    danger: 'منطقه خطر',
    neutral: 'خنثی',
    export: 'خروجی',
    exportAll: 'همه رویدادها (هر روز با امتیاز)',
    exportImportant: 'فقط مهم (۸۵+ و ۰–۳۹)',
    exportNotify: 'فقط اعلان در برنامه',
    exportDownload: 'دانلود .ics',
    exportDisabled: 'یک گزینه خروجی بالا را انتخاب کنید.',
    score: 'امتیاز',
    dayScore: 'امتیاز روز',
    weekdays: ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'],
    nav: {
      '/dashboard': 'داشبورد',
      '/calendar': 'تقویم',
      '/people': 'افراد',
      '/profile': 'پروفایل',
    },
    months: [
      'ژانویه',
      'فوریه',
      'مارس',
      'آوریل',
      'مه',
      'ژوئن',
      'ژوئیه',
      'اوت',
      'سپتامبر',
      'اکتبر',
      'نوامبر',
      'دسامبر',
    ],
    legend: {
      title: 'معنای اعداد',
      hint: 'هر خانه امتیاز آمادگی روزانه شما (۰ تا ۱۰۰) برای این اقدام است.',
      bands: [
        { range: '۸۵ تا ۱۰۰', label: 'طلایی — اقدام کنید', color: '#4ade80' },
        { range: '۶۰ تا ۸۴', label: 'مساعد — جلو بروید', color: '#fbbf24' },
        { range: '۴۰ تا ۵۹', label: 'خنثی — با احتیاط', color: '#fb923c' },
        { range: '۰ تا ۳۹', label: 'اجتناب کنید — صبر', color: '#f87171' },
      ],
    },
    transit: {
      title: 'آسمان این روز',
      hint: 'موقعیت سیارات در روز انتخاب‌شده.',
      retrograde: 'برگشتی',
      in: 'در',
      house: 'خانه',
      empty: 'هنوز داده‌ای از ترانزیت‌ها نیست.',
    },
    signs: [
      'حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله',
      'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت',
    ],
    planets: {
      sun: 'خورشید', moon: 'ماه', mercury: 'عطارد', venus: 'زهره', mars: 'مریخ',
      jupiter: 'مشتری', saturn: 'زحل', uranus: 'اورانوس', neptune: 'نپتون',
      pluto: 'پلوتو', north_node: 'گره شمالی',
    },
  },
  ar: {
    dir: 'rtl',
    title: 'التقويم الاستراتيجي',
    subtitle: 'نوافذ ذهبية من خريطة ميلادك',
    prev: 'السابق',
    next: 'التالي',
    loading: 'نقرأ السماء…',
    noProfile: 'أدخل بيانات الميلاد في الملف أولاً.',
    goProfile: 'الذهاب للملف',
    noCurrentLocation:
      'أضف مدينة إقامتك الحالية في الملف — التقويم يستخدم مكان إقامتك الآن وليس مدينة الميلاد.',
    timingLocation: 'موقع التوقيت',
    selected: 'اليوم المحدد',
    hourly: 'الجدول الزمني بالساعة',
    golden: 'نافذة ذهبية',
    danger: 'منطقة خطر',
    neutral: 'محايد',
    export: 'تصدير',
    exportAll: 'كل الأحداث (كل يوم بدرجة)',
    exportImportant: 'المهم فقط (85+ و 0–39)',
    exportNotify: 'إشعارات التطبيق فقط',
    exportDownload: 'تنزيل .ics',
    exportDisabled: 'اختر خيار تصدير أعلاه.',
    score: 'الدرجة',
    dayScore: 'درجة اليوم',
    weekdays: ['أح', 'إث', 'ث', 'أر', 'خ', 'ج', 'س'],
    nav: {
      '/dashboard': 'لوحة',
      '/calendar': 'التقويم',
      '/people': 'الأشخاص',
      '/profile': 'الملف',
    },
    months: [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر',
    ],
    legend: {
      title: 'معنى الأرقام',
      hint: 'كل خلية تظهر درجة جاهزيتك اليومية (0–100) لهذا الإجراء.',
      bands: [
        { range: '85–100', label: 'ذهبي — تحرّك', color: '#4ade80' },
        { range: '60–84', label: 'مواتٍ — تقدّم', color: '#fbbf24' },
        { range: '40–59', label: 'محايد — بحذر', color: '#fb923c' },
        { range: '0–39', label: 'تجنّب — انتظر', color: '#f87171' },
      ],
    },
    transit: {
      title: 'سماء هذا اليوم',
      hint: 'مواقع الكواكب في التاريخ المحدد.',
      retrograde: 'تراجعي',
      in: 'في',
      house: 'البيت',
      empty: 'لا توجد بيانات عبور بعد.',
    },
    signs: [
      'الحمل', 'الثور', 'الجوزاء', 'السرطان', 'الأسد', 'العذراء',
      'الميزان', 'العقرب', 'القوس', 'الجدي', 'الدلو', 'الحوت',
    ],
    planets: {
      sun: 'الشمس', moon: 'القمر', mercury: 'عطارد', venus: 'الزهرة', mars: 'المريخ',
      jupiter: 'المشتري', saturn: 'زحل', uranus: 'أورانوس', neptune: 'نبتون',
      pluto: 'بلوتو', north_node: 'العقدة الشمالية',
    },
  },
};

const PLANET_GLYPHS: Record<string, string> = {
  sun: '☉', moon: '☾', mercury: '☿', venus: '♀', mars: '♂',
  jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆',
  pluto: '♇', north_node: '☊',
};

const PLANET_ORDER = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'north_node',
];

function calendarCells(year: number, month: number) {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const total = new Date(year, month, 0).getDate();
  const cells: Array<{ day: number | null; date: string | null }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: null, date: null });
  for (let d = 1; d <= total; d++) {
    cells.push({ day: d, date: formatDateYMD(year, month, d) });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, date: null });
  return cells;
}

function hourBarKind(band: ScoreBand): 'golden' | 'danger' | 'neutral' {
  if (band === 'green') return 'golden';
  if (band === 'red') return 'danger';
  return 'neutral';
}

export default function CalendarPage() {
  const today = new Date();
  const [lang, setLangState] = useState<LangKey>('en');
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [selectedDate, setSelectedDate] = useState<string | null>(
    formatDateYMD(today.getFullYear(), today.getMonth() + 1, today.getDate())
  );
  const [hourly, setHourly] = useState<HourScore[]>([]);
  const [loadingHourly, setLoadingHourly] = useState(false);
  const [transit, setTransit] = useState<PlanetTransit[]>([]);
  const [loadingTransit, setLoadingTransit] = useState(false);
  const [exportMode, setExportMode] = useState<CalendarExportMode>('important');
  const [hasProfile, setHasProfile] = useState(false);
  const [profile, setProfile] = useState<BirthProfile>(() => getBirthProfile());
  const evalLocation = useMemo(
    () => resolveCalendarEvaluationLocation(profile),
    [profile]
  );
  const hasCurrentLocation = hasConfirmedCurrentLocation(profile);

  const t = LANGS[lang];
  const cells = useMemo(() => calendarCells(year, month), [year, month]);
  const gps = useMemo(
    () => buildStrategicGps(scores, hourly, lang),
    [scores, hourly, lang]
  );

  const setLang = (l: LangKey) => {
    setLangState(l);
    saveAppLang(l);
  };

  useEffect(() => {
    const refreshProfile = () => {
      const saved = loadBirthProfile();
      if (saved) {
        setProfile(saved);
        setHasProfile(true);
        const evalLoc = resolveCalendarEvaluationLocation(saved);
        logLocationDebug('calendar loaded profile', saved);
        logLocationDebug('calendar evaluation location', evalLoc);
      } else {
        setHasProfile(false);
      }
    };
    const stored = localStorage.getItem('planet-life-lang');
    if (stored === 'en' || stored === 'ru' || stored === 'fa' || stored === 'ar') {
      setLangState(stored);
    }
    setExportMode(loadExportMode());
    refreshProfile();
    window.addEventListener('focus', refreshProfile);
    document.addEventListener('visibilitychange', refreshProfile);
    return () => {
      window.removeEventListener('focus', refreshProfile);
      document.removeEventListener('visibilitychange', refreshProfile);
    };
  }, []);

  const loadMonth = useCallback(async () => {
    setLoadingMonth(true);
    setProgress({ done: 0, total: 0 });
    try {
      const data = await fetchMonthScores(profile, year, month, (done, total) =>
        setProgress({ done, total })
      );
      setScores(data);
    } finally {
      setLoadingMonth(false);
    }
  }, [profile, year, month]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  useEffect(() => {
    if (!selectedDate) return;
    let cancelled = false;
    setLoadingHourly(true);
    setLoadingTransit(true);
    // Kick off hourly + transit in parallel so the panel populates fast.
    fetchHourlyScores(profile, selectedDate).then((data) => {
      if (!cancelled) {
        setHourly(data);
        setLoadingHourly(false);
      }
    });
    fetchTransitSnapshot(profile, selectedDate).then((data) => {
      if (!cancelled) {
        setTransit(data);
        setLoadingTransit(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedDate, profile]);

  const shiftMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  };

  const handleExportMode = (mode: CalendarExportMode) => {
    setExportMode(mode);
    saveExportMode(mode);
  };

  const handleDownloadMonth = () => {
    const ics = buildMonthIcs(scores, exportMode, {
      golden: t.golden,
      danger: t.danger,
      dayScore: t.dayScore,
    });
    if (!ics) return;
    downloadIcs(ics, `planet-life-${year}-${String(month).padStart(2, '0')}.ics`);
  };

  const handleDownloadDay = () => {
    if (!selectedDate) return;
    const ics = buildDayHourlyIcs(
      selectedDate,
      hourly.map((h) => ({ hour: h.hour, score: h.score })),
      exportMode,
      { golden: t.golden, danger: t.danger }
    );
    if (!ics) return;
    downloadIcs(ics, `planet-life-${selectedDate}-hourly.ics`);
  };

  const selectedScore = selectedDate ? scores[selectedDate] : undefined;
  const todayStr = todayYMD();

  return (
    <AppShell
      lang={lang}
      setLang={setLang}
      dir={t.dir}
      navLabels={HOME_LANGS[lang].nav}
      fontFamily={
        lang === 'fa' || lang === 'ar' ? 'Vazirmatn, sans-serif' : 'Inter, sans-serif'
      }
    >
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="fc text-xl tracking-wide mb-1" style={{ color: '#fbbf24' }}>
            {t.title}
          </h1>
          <p className="fi text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {t.subtitle}
          </p>
          {hasProfile && evalLocation && (
            <p className="fi text-[11px] mt-2" style={{ color: 'rgba(74,222,128,0.85)' }}>
              {formatCalculatedFor(locationLabel(evalLocation), lang)}
            </p>
          )}
        </div>

        {hasProfile && !hasCurrentLocation && (
          <div
            className="rounded-2xl p-4 mb-6 fi text-sm"
            style={{
              background: 'rgba(251,146,60,0.06)',
              border: '1px solid rgba(251,146,60,0.25)',
              color: 'rgba(255,255,255,0.75)',
            }}
          >
            {t.noCurrentLocation}{' '}
            <Link href="/profile" style={{ color: '#fbbf24' }}>
              {t.goProfile}
            </Link>
          </div>
        )}

        {!hasProfile && (
          <div
            className="rounded-2xl p-4 mb-6 fi text-sm"
            style={{
              background: 'rgba(251,191,36,0.06)',
              border: '1px solid rgba(251,191,36,0.2)',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            {t.noProfile}{' '}
            <Link href="/profile" style={{ color: '#fbbf24' }}>
              {t.goProfile}
            </Link>
          </div>
        )}

        <section
          className="rounded-2xl p-4 mb-6"
          style={{
            background: 'linear-gradient(145deg, rgba(251,191,36,0.06), rgba(59,130,246,0.06))',
            border: '1px solid rgba(251,191,36,0.18)',
          }}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div
                className="fi text-[10px] uppercase tracking-[0.28em] mb-1"
                style={{ color: 'rgba(251,191,36,0.7)' }}
              >
                {gps.text.title}
              </div>
              <p className="fi text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {gps.text.subtitle}
              </p>
            </div>
            <div
              className="fc text-3xl shrink-0"
              style={{ color: GPS_TONE_STYLES[gps.monthTone].color }}
            >
              {gps.monthScore ?? '--'}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div
              className="rounded-xl p-3"
              style={{
                background: GPS_TONE_STYLES[gps.monthTone].bg,
                border: `1px solid ${GPS_TONE_STYLES[gps.monthTone].border}`,
              }}
            >
              <div
                className="fi text-[10px] uppercase tracking-widest mb-2"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                {gps.text.macro}
              </div>
              <p className="fi text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {gps.monthBody}
              </p>
              <div className="fi text-[10px] mt-3" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {gps.goldenCount} {gps.text.goldenDays} · {gps.cautionCount} {gps.text.cautionDays}
              </div>
            </div>

            <div
              className="rounded-xl p-3"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div
                className="fi text-[10px] uppercase tracking-widest mb-2"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                {gps.text.meso}
              </div>
              <div className="space-y-1.5">
                {gps.weeks.map((week) => {
                  const style = GPS_TONE_STYLES[week.tone];
                  return (
                    <div key={week.label} className="flex items-center gap-2">
                      <span className="fi text-[10px] w-12" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        {week.label}
                      </span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${week.score ?? 8}%`,
                            background: style.color,
                            opacity: week.score == null ? 0.25 : 0.9,
                          }}
                        />
                      </div>
                      <span className="fi text-[10px] w-12 text-end" style={{ color: style.color }}>
                        {week.score ?? '--'} {week.score == null ? '' : week.action}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              className="rounded-xl p-3"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div
                className="fi text-[10px] uppercase tracking-widest mb-2"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                {gps.text.micro}
              </div>
              {loadingHourly ? (
                <div className="fi text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {t.loading}
                </div>
              ) : gps.bestHour && gps.riskHour ? (
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="fi text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      {gps.text.bestHour}
                    </span>
                    <span className="fc text-base" style={{ color: '#4ade80' }}>
                      {gps.bestHourLabel} · {gps.bestHour.score}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="fi text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      {gps.text.riskHour}
                    </span>
                    <span className="fc text-base" style={{ color: '#f87171' }}>
                      {gps.riskHourLabel} · {gps.riskHour.score}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="fi text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {gps.text.noHourly}
                </div>
              )}
            </div>
          </div>
        </section>

        <div
          className="rounded-2xl p-4 mb-6"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="fi text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white"
            >
              {t.prev}
            </button>
            <div className="fc text-sm" style={{ color: '#fbbf24' }}>
              {t.months[month - 1]} {year}
            </div>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="fi text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white"
            >
              {t.next}
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {t.weekdays.map((wd) => (
              <div
                key={wd}
                className="fi text-[10px] text-center py-1"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {wd.trim()}
              </div>
            ))}
          </div>

          {loadingMonth ? (
            <div className="py-12 text-center fi text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {t.loading}
              {progress.total > 0 && (
                <span className="block mt-2">
                  {progress.done}/{progress.total}
                </span>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, i) => {
                if (!cell.day || !cell.date) {
                  return <div key={`e-${i}`} className="aspect-square" />;
                }
                const score = scores[cell.date];
                const band = scoreToBand(score);
                const style = BAND_STYLES[band];
                const selected = selectedDate === cell.date;
                const isToday = cell.date === todayStr;
                return (
                  <button
                    key={cell.date}
                    type="button"
                    onClick={() => setSelectedDate(cell.date)}
                    className="aspect-square rounded-lg flex flex-col items-center justify-center transition-transform hover:scale-105"
                    style={{
                      background: style.bg,
                      border: `2px solid ${isToday || selected ? '#fbbf24' : style.border}`,
                      boxShadow: isToday ? '0 0 12px rgba(251,191,36,0.35)' : selected ? '0 0 0 1px #fbbf24' : undefined,
                    }}
                  >
                    <span className="fi text-[11px] font-medium text-white/90">
                      {cell.day}
                    </span>
                    {score != null && (
                      <span
                        className="fi text-[9px] mt-0.5 font-semibold"
                        style={{ color: style.text }}
                      >
                        {score}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Score legend — explains the numbers in each calendar cell */}
        <div
          className="rounded-2xl p-4 mb-6"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
            <div className="fi text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {t.legend.title}
            </div>
            <div className="fi text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {t.legend.hint}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            {t.legend.bands.map((b) => (
              <div
                key={b.range}
                className="flex items-center gap-2 rounded-lg px-2 py-2"
                style={{
                  background: `${b.color}14`,
                  border: `1px solid ${b.color}55`,
                }}
              >
                <span
                  className="fc text-[11px] font-semibold"
                  style={{ color: b.color, minWidth: 52 }}
                >
                  {b.range}
                </span>
                <span className="fi text-[11px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {b.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {selectedDate && (
          <div
            className="rounded-2xl p-4 mb-6"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <div className="fi text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {t.selected}
                </div>
                <div className="fc text-lg" style={{ color: '#fbbf24' }}>
                  {selectedDate}
                </div>
              </div>
              {selectedScore != null && (
                <div className="fi text-sm" style={{ color: BAND_STYLES[scoreToBand(selectedScore)].text }}>
                  {t.score}: {selectedScore}/100
                </div>
              )}
            </div>

            {/* Transit snapshot — astrological details for this day */}
            <div className="fi text-[10px] uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {t.transit.title}
            </div>
            <p className="fi text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {t.transit.hint}
            </p>
            {loadingTransit ? (
              <div className="py-4 text-center fi text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {t.loading}
              </div>
            ) : transit.length === 0 ? (
              <div className="py-3 text-center fi text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {t.transit.empty}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
                {PLANET_ORDER.map((name) => {
                  const body = transit.find((p) => p.name === name);
                  if (!body) return null;
                  const signName = t.signs[body.signIndex] ?? body.sign;
                  const deg = Math.floor(body.degreeInSign);
                  const min = Math.floor((body.degreeInSign - deg) * 60);
                  return (
                    <div
                      key={name}
                      className="rounded-lg px-2.5 py-2 flex items-center gap-2"
                      style={{
                        background: body.retrograde
                          ? 'rgba(248,113,113,0.08)'
                          : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${
                          body.retrograde
                            ? 'rgba(248,113,113,0.35)'
                            : 'rgba(255,255,255,0.07)'
                        }`,
                      }}
                    >
                      <span
                        className="fc text-base shrink-0"
                        style={{ color: body.retrograde ? '#f87171' : '#fbbf24', width: 18 }}
                      >
                        {PLANET_GLYPHS[name] ?? '•'}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="fc text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>
                          {t.planets[name] ?? name}
                          {body.retrograde && (
                            <span className="fi text-[9px] ml-1" style={{ color: '#f87171' }}>
                              ℞
                            </span>
                          )}
                        </span>
                        <span className="fi text-[10px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                          {deg}°{String(min).padStart(2, '0')}′ {t.transit.in} {signName}
                          {body.house ? ` · ${t.transit.house} ${body.house}` : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="fi text-[10px] uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {t.hourly}
            </div>

            {loadingHourly ? (
              <div className="py-8 text-center fi text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {t.loading}
              </div>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {hourly.map((h) => {
                  const kind = hourBarKind(h.band);
                  const barColor =
                    kind === 'golden'
                      ? '#4ade80'
                      : kind === 'danger'
                        ? '#f87171'
                        : 'rgba(255,255,255,0.15)';
                  const label =
                    kind === 'golden'
                      ? t.golden
                      : kind === 'danger'
                        ? t.danger
                        : t.neutral;
                  return (
                    <div key={h.hour} className="mb-2">
                      <div className="flex items-center gap-2">
                      <span className="fi text-[10px] w-16 shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {formatHourLabel(h.hour, lang)}
                      </span>
                      <div className="flex-1 h-6 rounded-md overflow-hidden relative" style={{ background: 'rgba(0,0,0,0.3)' }}>
                        <div
                          className="h-full rounded-md transition-all"
                          style={{
                            width: `${Math.max(8, h.score)}%`,
                            background: barColor,
                            opacity: kind === 'neutral' ? 0.5 : 0.85,
                          }}
                        />
                        <span className="absolute inset-0 flex items-center px-2 fi text-[10px] text-white/80">
                          {label} · {h.score}
                        </span>
                      </div>
                      </div>
                      {kind === 'golden' && (
                        <ActionDisclaimer lang={lang as DisclaimerLang} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div
          className="rounded-2xl p-4"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="fi text-[10px] uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {t.export}
          </div>
          <div className="space-y-2 mb-4">
            {(
              [
                ['all', t.exportAll],
                ['important', t.exportImportant],
                ['notifications', t.exportNotify],
              ] as const
            ).map(([mode, label]) => (
              <label
                key={mode}
                className="flex items-center gap-2 cursor-pointer fi text-xs"
                style={{ color: 'rgba(255,255,255,0.65)' }}
              >
                <input
                  type="radio"
                  name="export-mode"
                  checked={exportMode === mode}
                  onChange={() => handleExportMode(mode)}
                  className="accent-amber-400"
                />
                {label}
              </label>
            ))}
          </div>
          {exportMode === 'notifications' ? (
            <p className="fi text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {t.exportDisabled}
            </p>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleDownloadMonth}
                disabled={loadingMonth || Object.keys(scores).length === 0}
                className="fc flex-1 py-2.5 rounded-xl text-xs tracking-wider disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg,#d97706,#f59e0b)',
                  color: '#000',
                }}
              >
                {t.exportDownload} ({t.months[month - 1]})
              </button>
              <button
                type="button"
                onClick={handleDownloadDay}
                disabled={!selectedDate || loadingHourly}
                className="fi flex-1 py-2.5 rounded-xl text-xs border border-white/15 text-white/70 hover:border-amber-500/40 disabled:opacity-40"
              >
                {t.exportDownload} ({t.hourly})
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

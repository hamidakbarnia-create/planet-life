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
  formatDateYMD,
  scoreToBand,
  type HourScore,
  type ScoreBand,
} from '@/lib/calendar-scores';
import { HOME_LANGS } from '@/lib/home-i18n';
import type { AppLang } from '@/lib/app-settings';
import { todayYMD } from '@/lib/calendar-utils';

type LangKey = AppLang;

const LANGS: Record<
  LangKey,
  {
    dir: 'ltr' | 'rtl';
    title: string;
    subtitle: string;
    prev: string;
    next: string;
    loading: string;
    noProfile: string;
    goProfile: string;
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
  }
> = {
  en: {
    dir: 'ltr',
    title: 'Strategic Calendar',
    subtitle: 'Golden timing windows from your natal blueprint',
    prev: 'Prev',
    next: 'Next',
    loading: 'Reading the sky…',
    noProfile: 'Set your birth data on Profile first.',
    goProfile: 'Go to Profile',
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
  },
};

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
  const [exportMode, setExportMode] = useState<CalendarExportMode>('important');
  const [hasProfile, setHasProfile] = useState(false);
  const [profile, setProfile] = useState<BirthProfile>(() => getBirthProfile());

  const t = LANGS[lang];
  const cells = useMemo(() => calendarCells(year, month), [year, month]);

  const setLang = (l: LangKey) => {
    setLangState(l);
    saveAppLang(l);
  };

  useEffect(() => {
    const stored = localStorage.getItem('planet-life-lang');
    if (stored === 'en' || stored === 'ru' || stored === 'fa' || stored === 'ar') {
      setLangState(stored);
    }
    setExportMode(loadExportMode());
    const saved = loadBirthProfile();
    if (saved) {
      setProfile(saved);
      setHasProfile(true);
    } else {
      setHasProfile(false);
    }
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
    fetchHourlyScores(profile, selectedDate).then((data) => {
      if (!cancelled) {
        setHourly(data);
        setLoadingHourly(false);
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
        </div>

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
                      <span className="fi text-[10px] w-10 shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {h.time}
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

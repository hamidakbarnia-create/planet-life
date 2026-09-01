'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQueuedEffect } from '@/lib/use-queued-effect';
import Link from 'next/link';
import { localeFontFamily } from '@/lib/brand-theme';
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
  fetchHourlyScores,
  fetchMonthScores,
  type ScoreBreakdown,
  type ScoreReasoning,
  fetchTransitSnapshot,
  formatDateYMD,
  formatHourLabel,
  formatReadinessPercent,
  type HourScore,
  type PlanetTransit,
  type TransitSnapshotMeta,
  type ScoreBand,
  type CalendarDayIntelligence,
} from '@/lib/calendar-scores';
import { HOME_LANGS } from '@/lib/home-i18n';
import {
  CALENDAR_SYSTEM_CHANGED_EVENT,
  loadCalendarSystem,
  type AppLang,
  type CalendarSystem,
} from '@/lib/app-settings';
import {
  formatDisplayDate,
  formatDisplayMonthCoverage,
} from '@/lib/date-format';
import {
  hasConfirmedCurrentLocation,
  formatCalculatedFor,
  locationLabel,
  logLocationDebug,
  resolveCalendarEvaluationLocation,
} from '@/lib/user-locations';
import {
  calendarCells,
  clampIsoDateToMonth,
  parseIsoDate,
  shiftYearMonth,
  todayYMD,
} from '@/lib/calendar-utils';
import { buildStrategicGps } from '@/lib/strategic-gps';
import { CALENDAR_PAGE_LANGS } from '@/lib/calendar-page-i18n';
import { CALENDAR_UI } from '@/lib/calendar-power-presentation';
import { CalendarMonthGrid } from '@/components/calendar/CalendarMonthGrid';
import { CalendarInsightStack } from '@/components/calendar/CalendarInsightStack';
import { CalendarSelectedDayInsight } from '@/components/calendar/CalendarSelectedDayInsight';
import {
  DAY_INTELLIGENCE_CHROME,
  formatTimingStrength,
} from '@/lib/decision-intelligence/product-copy';

type LangKey = AppLang;

const LANGS = CALENDAR_PAGE_LANGS;

function hourBarKind(band: ScoreBand): 'golden' | 'danger' | 'neutral' {
  if (band === 'green') return 'golden';
  if (band === 'red') return 'danger';
  return 'neutral';
}

export default function CalendarPage() {
  const today = new Date();
  const [lang, setLangState] = useState<LangKey>('en');
  const [calendar, setCalendar] = useState<CalendarSystem>(() =>
    loadCalendarSystem()
  );
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [monthScoreData, setMonthScoreData] = useState<{
    scores: Record<string, number>;
    breakdowns: Record<string, ScoreBreakdown | null>;
    reasoning: Record<string, ScoreReasoning | null>;
    dayIntelligence: Record<string, CalendarDayIntelligence | null>;
  }>({ scores: {}, breakdowns: {}, reasoning: {}, dayIntelligence: {} });
  const scores = monthScoreData.scores;
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [selectedDate, setSelectedDate] = useState<string | null>(
    formatDateYMD(today.getFullYear(), today.getMonth() + 1, today.getDate())
  );
  const [hourly, setHourly] = useState<HourScore[]>([]);
  const [loadingHourly, setLoadingHourly] = useState(false);
  const [transit, setTransit] = useState<PlanetTransit[]>([]);
  const [transitMeta, setTransitMeta] = useState<TransitSnapshotMeta>({});
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
  // Weekly Trend points + month peak from the same canonical map + selectedDate.
  const monthGps = useMemo(
    () =>
      buildStrategicGps(scores, [], lang, {
        selectedDate,
        calendar,
      }),
    [scores, lang, selectedDate, calendar]
  );
  const dayGps = useMemo(
    () => buildStrategicGps({}, hourly, lang, { selectedDate, calendar }),
    [hourly, lang, selectedDate, calendar]
  );

  const setLang = (l: LangKey) => {
    setLangState(l);
    saveAppLang(l);
  };

  useQueuedEffect(() => {
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
    const syncCalendar = () => setCalendar(loadCalendarSystem());
    const refreshOnReturn = () => {
      refreshProfile();
      syncCalendar();
    };
    const stored = localStorage.getItem('planet-life-lang');
    if (
      stored === 'en' ||
      stored === 'ru' ||
      stored === 'fa' ||
      stored === 'ar'
    ) {
      setLangState(stored);
    }
    setExportMode(loadExportMode());
    refreshProfile();
    syncCalendar();
    window.addEventListener('focus', refreshOnReturn);
    document.addEventListener('visibilitychange', refreshOnReturn);
    window.addEventListener(CALENDAR_SYSTEM_CHANGED_EVENT, syncCalendar);
    window.addEventListener('storage', syncCalendar);
    return () => {
      window.removeEventListener('focus', refreshOnReturn);
      document.removeEventListener('visibilitychange', refreshOnReturn);
      window.removeEventListener(CALENDAR_SYSTEM_CHANGED_EVENT, syncCalendar);
      window.removeEventListener('storage', syncCalendar);
    };
  }, []);

  const loadMonth = useCallback(async () => {
    setLoadingMonth(true);
    setProgress({ done: 0, total: 0 });
    try {
      const {
        scores: monthScores,
        breakdowns,
        reasoning,
        dayIntelligence,
      } = await fetchMonthScores(profile, year, month, (done, total) =>
        setProgress({ done, total })
      );
      setMonthScoreData({
        scores: monthScores,
        breakdowns,
        reasoning,
        dayIntelligence,
      });
    } finally {
      setLoadingMonth(false);
    }
  }, [profile, year, month]);

  useQueuedEffect(() => {
    void loadMonth();
  }, [loadMonth]);

  useQueuedEffect(() => {
    if (!selectedDate) return;
    let cancelled = false;
    setLoadingHourly(true);
    setLoadingTransit(true);
    fetchHourlyScores(profile, selectedDate).then((data) => {
      if (!cancelled) {
        setHourly(data);
        setLoadingHourly(false);
      }
    });
    fetchTransitSnapshot(profile, selectedDate).then((data) => {
      if (!cancelled) {
        setTransit(data.planets);
        setTransitMeta(data.meta);
        setLoadingTransit(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedDate, profile]);

  const shiftMonth = (delta: number) => {
    const next = shiftYearMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
    setSelectedDate((prev) =>
      clampIsoDateToMonth(prev, next.year, next.month)
    );
  };

  const handleCellClick = (date: string, inCurrentMonth: boolean) => {
    if (!inCurrentMonth) {
      const parsed = parseIsoDate(date);
      if (!parsed) return;
      setYear(parsed.year);
      setMonth(parsed.month);
      setSelectedDate(date);
      return;
    }
    setSelectedDate(date);
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
    downloadIcs(ics, `metioro-${year}-${String(month).padStart(2, '0')}.ics`);
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
    downloadIcs(ics, `metioro-${selectedDate}-hourly.ics`);
  };

  const selectedScore = selectedDate ? scores[selectedDate] : undefined;
  const todayStr = todayYMD();
  const monthLabel =
    calendar === 'gregorian'
      ? `${t.months[month - 1]} ${year}`
      : formatDisplayMonthCoverage(lang, year, month, calendar);

  const insightProps = {
    scores,
    weeks: monthGps.weeks,
    selectedDate,
    selectedDateLabel: selectedDate
      ? formatDisplayDate(lang, selectedDate, calendar)
      : null,
    monthBestDate: monthGps.monthBest?.date ?? null,
    monthBestScore: monthGps.monthBest?.score ?? null,
    monthBestDateLabel: monthGps.monthBest?.dateLabel ?? null,
    weekdayLabels: t.weekdays.map((w) => w.trim()),
    lang,
    calendar,
    bestHour: dayGps.bestHour,
    riskHour: dayGps.riskHour,
    loadingHourly,
    loadingLabel: t.loading,
    onViewMonthBestWeek: (date: string) => {
      const parsed = parseIsoDate(date);
      if (!parsed) return;
      if (parsed.year !== year || parsed.month !== month) {
        setYear(parsed.year);
        setMonth(parsed.month);
      }
      setSelectedDate(date);
    },
  };

  return (
    <AppShell
      lang={lang}
      setLang={setLang}
      dir={t.dir}
      navLabels={HOME_LANGS[lang].nav}
      fontFamily={localeFontFamily(lang)}
    >
      <div
        data-calendar-workspace
        className="max-w-[1440px] mx-auto px-3 sm:px-4 py-3 lg:py-4 overflow-x-hidden"
        style={{ background: 'transparent' }}
      >
        <div className="mb-3 lg:mb-4">
          <h1
            className="fc text-xl lg:text-lg tracking-wide mb-0.5"
            style={{ color: CALENDAR_UI.gold }}
          >
            {t.title}
          </h1>
          <p
            className="fi text-sm lg:text-xs"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            {t.subtitle}
          </p>
          {hasProfile && evalLocation && (
            <p
              className="fi text-[11px] mt-1"
              style={{ color: 'rgba(68,189,50,0.9)' }}
            >
              {formatCalculatedFor(locationLabel(evalLocation), lang)}
            </p>
          )}
        </div>

        {hasProfile && !hasCurrentLocation && (
          <div
            className="rounded-xl p-3 mb-3 fi text-sm"
            style={{
              background: 'rgba(251,146,60,0.06)',
              border: `1px solid ${CALENDAR_UI.panelBorder}`,
              color: 'rgba(255,255,255,0.75)',
            }}
          >
            {t.noCurrentLocation}{' '}
            <Link href="/profile" style={{ color: CALENDAR_UI.gold }}>
              {t.goProfile}
            </Link>
          </div>
        )}

        {!hasProfile && (
          <div
            className="rounded-xl p-3 mb-3 fi text-sm"
            style={{
              background: 'rgba(197,160,89,0.06)',
              border: `1px solid ${CALENDAR_UI.panelBorder}`,
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            {t.noProfile}{' '}
            <Link href="/profile" style={{ color: CALENDAR_UI.gold }}>
              {t.goProfile}
            </Link>
          </div>
        )}

        {/* Desktop: calendar dominant + insight stack. Tablet: stack; md two-col insights */}
        <div
          data-strategic-calendar-desktop
          data-calendar-desktop-layout
          className="mb-4 grid grid-cols-1 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.9fr)] gap-3 items-start"
        >
          <CalendarMonthGrid
            lang={lang}
            dir={t.dir}
            calendar={calendar}
            year={year}
            month={month}
            monthLabel={monthLabel}
            weekdays={t.weekdays}
            cells={cells}
            scores={scores}
            selectedDate={selectedDate}
            todayStr={todayStr}
            loadingMonth={loadingMonth}
            loadingLabel={t.loading}
            progress={progress}
            prevLabel={t.prev}
            nextLabel={t.next}
            onPrevMonth={() => shiftMonth(-1)}
            onNextMonth={() => shiftMonth(1)}
            onCellClick={handleCellClick}
          />

          <div
            className="min-w-0"
            data-calendar-desktop-rail
            data-calendar-insight-column
          >
            <div className="xl:block">
              <CalendarInsightStack {...insightProps} />
            </div>
          </div>
        </div>

        <p
          className="fi text-[11px] mb-4"
          style={{ color: 'rgba(255,255,255,0.4)' }}
          data-testid="calendar-uncertainty-disclosure"
        >
          {t.uncertaintyDisclosure}
        </p>

        {selectedDate && (
          <div
            className="rounded-xl p-4 mb-4"
            style={{
              background: CALENDAR_UI.panel,
              border: `1px solid ${CALENDAR_UI.panelBorder}`,
            }}
            data-calendar-advanced-day
          >
            <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
              <div>
                <div
                  className="fi text-[10px] uppercase tracking-widest mb-1"
                  style={{ color: CALENDAR_UI.textMuted }}
                >
                  {t.selected}
                </div>
                <div className="fc text-lg" style={{ color: CALENDAR_UI.gold }}>
                  {formatDisplayDate(lang, selectedDate, calendar)}
                </div>
              </div>
              {selectedScore != null && (
                <div
                  className="fi text-sm"
                  style={{ color: 'rgba(255,255,255,0.65)' }}
                  data-testid="calendar-selected-timing-strength"
                >
                  {DAY_INTELLIGENCE_CHROME[lang].timingStrength}:{' '}
                  {formatTimingStrength(selectedScore)}
                </div>
              )}
            </div>

            <CalendarSelectedDayInsight
              lang={lang}
              labels={{
                dir: t.dir,
                loading: t.loading,
                whyTiming: t.whyTiming,
                whyTimingFallback: t.whyTimingFallback,
                supportingReasons: t.supportingReasons,
                advancedDetails: t.advancedDetails,
                transit: t.transit,
                signs: t.signs,
                planets: t.planets,
              }}
              reasoning={
                selectedDate ? monthScoreData.reasoning[selectedDate] : null
              }
              score={selectedScore}
              dayIntelligence={
                selectedDate
                  ? monthScoreData.dayIntelligence[selectedDate]
                  : null
              }
              transit={transit}
              transitMeta={transitMeta}
              loadingTransit={loadingTransit}
            />

            <div
              className="fi text-[10px] uppercase tracking-widest mb-3 mt-4"
              style={{ color: CALENDAR_UI.textMuted }}
            >
              {t.hourly}
            </div>

            {loadingHourly ? (
              <div
                className="py-6 text-center fi text-xs"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {t.loading}
              </div>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {hourly.map((h) => {
                  const kind = hourBarKind(h.band);
                  const barColor =
                    kind === 'golden'
                      ? '#44bd32'
                      : kind === 'danger'
                        ? '#ff5a5a'
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
                        <span
                          className="fi text-[10px] w-16 shrink-0"
                          style={{ color: 'rgba(255,255,255,0.4)' }}
                        >
                          {formatHourLabel(h.hour, lang)}
                        </span>
                        <div
                          className="flex-1 h-6 rounded-md overflow-hidden relative"
                          style={{ background: 'rgba(0,0,0,0.3)' }}
                        >
                          <div
                            className="h-full rounded-md transition-all"
                            style={{
                              width: `${Math.max(8, h.score)}%`,
                              background: barColor,
                              opacity: kind === 'neutral' ? 0.5 : 0.85,
                            }}
                          />
                          <span className="absolute inset-0 flex items-center px-2 fi text-[10px] text-white/80">
                            {label} · {formatReadinessPercent(h.score)}
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
          className="rounded-xl p-4"
          style={{
            background: CALENDAR_UI.panel,
            border: `1px solid ${CALENDAR_UI.panelBorder}`,
          }}
        >
          <div
            className="fi text-[10px] uppercase tracking-widest mb-3"
            style={{ color: CALENDAR_UI.textMuted }}
          >
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
            <p
              className="fi text-xs"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
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
                  background: 'linear-gradient(135deg,#c5a059,#e1b12c)',
                  color: '#0b0d17',
                }}
              >
                {t.exportDownload} ({t.months[month - 1]})
              </button>
              <button
                type="button"
                onClick={handleDownloadDay}
                disabled={!selectedDate || loadingHourly}
                className="fi flex-1 py-2.5 rounded-xl text-xs border text-white/70 disabled:opacity-40"
                style={{ borderColor: CALENDAR_UI.panelBorder }}
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

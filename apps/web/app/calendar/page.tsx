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
  BAND_STYLES,
  fetchHourlyScores,
  fetchMonthScores,
  type ScoreBreakdown,
  type ScoreReasoning,
  fetchTransitSnapshot,
  formatDateYMD,
  formatHourLabel,
  formatReadinessPercent,
  scoreToBand,
  type HourScore,
  type PlanetTransit,
  type TransitSnapshotMeta,
  type ScoreBand,
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
import { calendarCells, parseIsoDate, todayYMD } from '@/lib/calendar-utils';
import { buildStrategicGps } from '@/lib/strategic-gps';
import { CALENDAR_PAGE_LANGS } from '@/lib/calendar-page-i18n';
import { CalendarMonthPanel } from '@/components/calendar/CalendarMonthPanel';
import { StrategicInsightRail } from '@/components/calendar/StrategicInsightRail';
import { CalendarSelectedDayInsight } from '@/components/calendar/CalendarSelectedDayInsight';

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
  const [calendar, setCalendar] = useState<CalendarSystem>(() => loadCalendarSystem());
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [monthScoreData, setMonthScoreData] = useState<{
    scores: Record<string, number>;
    breakdowns: Record<string, ScoreBreakdown | null>;
    reasoning: Record<string, ScoreReasoning | null>;
  }>({ scores: {}, breakdowns: {}, reasoning: {} });
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
  // Month Outlook + Weekly Path: monthly scores only (stable when selected day changes).
  const monthGps = useMemo(
    () => buildStrategicGps(scores, [], lang),
    [scores, lang]
  );
  // Selected Day Timing: hourly extrema for the selected date only.
  const dayGps = useMemo(
    () => buildStrategicGps({}, hourly, lang),
    [hourly, lang]
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
    if (stored === 'en' || stored === 'ru' || stored === 'fa' || stored === 'ar') {
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
      const { scores: monthScores, breakdowns, reasoning } = await fetchMonthScores(
        profile,
        year,
        month,
        (done, total) => setProgress({ done, total })
      );
      setMonthScoreData({ scores: monthScores, breakdowns, reasoning });
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
    // Kick off hourly + transit in parallel so the panel populates fast.
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

  const handleCellClick = (date: string, inCurrentMonth: boolean) => {
    if (!inCurrentMonth) {
      const parsed = parseIsoDate(date);
      if (!parsed) return;
      // Navigate to adjacent month; do not select an unscored day in the current month.
      setYear(parsed.year);
      setMonth(parsed.month);
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

  return (
    <AppShell
      lang={lang}
      setLang={setLang}
      dir={t.dir}
      navLabels={HOME_LANGS[lang].nav}
      fontFamily={localeFontFamily(lang)}
    >
      <div className="max-w-2xl lg:max-w-5xl mx-auto px-4 py-4 lg:py-3">
        <div className="mb-4 lg:mb-2">
          <h1 className="fc text-xl lg:text-lg tracking-wide mb-1 lg:mb-0.5" style={{ color: '#fbbf24' }}>
            {t.title}
          </h1>
          <p className="fi text-sm lg:text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {t.subtitle}
          </p>
          {hasProfile && evalLocation && (
            <p className="fi text-[11px] mt-1 lg:mt-0.5" style={{ color: 'rgba(74,222,128,0.85)' }}>
              {formatCalculatedFor(locationLabel(evalLocation), lang)}
            </p>
          )}
        </div>

        {hasProfile && !hasCurrentLocation && (
          <div
            className="rounded-2xl p-4 mb-4 lg:mb-3 fi text-sm"
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
            className="rounded-2xl p-4 mb-4 lg:mb-3 fi text-sm"
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

        {/* Mobile / tablet: one compact timing summary (no desktop rail) */}
        <div className="lg:hidden mb-4" data-calendar-mobile-timing>
          <StrategicInsightRail
            compact
            monthOutlook={monthGps}
            selectedDay={{
              dateLabel: selectedDate
                ? formatDisplayDate(lang, selectedDate, calendar)
                : null,
              bestHour: dayGps.bestHour,
              riskHour: dayGps.riskHour,
              bestHourLabel: dayGps.bestHourLabel,
              riskHourLabel: dayGps.riskHourLabel,
            }}
            loadingHourly={loadingHourly}
            loadingLabel={t.loading}
          />
        </div>

        {/* Desktop lg+: month grid (~68%) + insight rail (~32%) */}
        <div
          data-strategic-calendar-desktop
          className="mb-4 lg:mb-3 lg:grid lg:grid-cols-[minmax(0,68fr)_minmax(0,32fr)] lg:gap-3 lg:items-start"
        >
          <CalendarMonthPanel
            lang={lang}
            dir={t.dir}
            calendar={calendar}
            year={year}
            month={month}
            monthLabel={
              calendar === 'gregorian'
                ? `${t.months[month - 1]} ${year}`
                : formatDisplayMonthCoverage(lang, year, month, calendar)
            }
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
          <div className="hidden lg:block min-w-0" data-calendar-desktop-rail>
            <StrategicInsightRail
              monthOutlook={monthGps}
              selectedDay={{
                dateLabel: selectedDate
                  ? formatDisplayDate(lang, selectedDate, calendar)
                  : null,
                bestHour: dayGps.bestHour,
                riskHour: dayGps.riskHour,
                bestHourLabel: dayGps.bestHourLabel,
                riskHourLabel: dayGps.riskHourLabel,
              }}
              loadingHourly={loadingHourly}
              loadingLabel={t.loading}
            />
          </div>
        </div>

        {/* Score legend — explains the numbers in each calendar cell */}
        <div
          className="rounded-2xl p-4 mb-6 lg:mb-4"
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
          <p
            className="fi text-[11px] mt-3"
            style={{ color: 'rgba(255,255,255,0.45)' }}
            data-testid="calendar-uncertainty-disclosure"
          >
            {t.uncertaintyDisclosure}
          </p>
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
                  {formatDisplayDate(lang, selectedDate, calendar)}
                </div>
              </div>
              {selectedScore != null && (
                <div className="fi text-sm" style={{ color: BAND_STYLES[scoreToBand(selectedScore)].text }}>
                  {t.score}: {formatReadinessPercent(selectedScore)}
                </div>
              )}
            </div>

            <CalendarSelectedDayInsight
              labels={{
                dir: t.dir,
                loading: t.loading,
                whyTiming: t.whyTiming,
                supportingReasons: t.supportingReasons,
                advancedDetails: t.advancedDetails,
                transit: t.transit,
                signs: t.signs,
                planets: t.planets,
              }}
              reasoning={selectedDate ? monthScoreData.reasoning[selectedDate] : null}
              transit={transit}
              transitMeta={transitMeta}
              loadingTransit={loadingTransit}
            />

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

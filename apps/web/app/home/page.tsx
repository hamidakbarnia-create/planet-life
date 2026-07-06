'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { DailyBriefView } from '@/components/home/DailyBriefView';
import { HomeViewOnboarding } from '@/components/home/HomeViewOnboarding';
import { MonthHeatmapGrid } from '@/components/home/MonthHeatmapGrid';
import {
  loadHomeView,
  saveHomeView,
  type AppLang,
  type HomeViewMode,
} from '@/lib/app-settings';
import { loadBirthProfile } from '@/lib/birth-profile';
import type { BirthProfile } from '@/lib/birth-profile';
import { loadAppLang, saveAppLang } from '@/lib/calendar-preferences';
import { fetchMonthScores, type ScoreBreakdown, type ScoreReasoning } from '@/lib/calendar-scores';
import { todayYMD } from '@/lib/calendar-utils';
import { HOME_LANGS } from '@/lib/home-i18n';
export default function HomePage() {
  const router = useRouter();
  const today = new Date();
  const [lang, setLangState] = useState<AppLang>('en');
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [view, setView] = useState<HomeViewMode | null>(null);
  const [profile, setProfile] = useState<BirthProfile | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
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

  const t = HOME_LANGS[lang];
  const highlight = todayYMD();

  const setLang = (l: AppLang) => {
    setLangState(l);
    saveAppLang(l);
  };

  const initView = useCallback(() => {
    const stored = loadHomeView();
    if (!stored) {
      setShowOnboarding(true);
      setView(null);
    } else {
      setShowOnboarding(false);
      setView(stored);
      if (stored === 'calendar') {
        router.replace('/calendar');
      }
    }
    setReady(true);
  }, [router]);

  useEffect(() => {
    const storedLang = loadAppLang();
    if (storedLang === 'en' || storedLang === 'ru' || storedLang === 'fa' || storedLang === 'ar') {
      setLangState(storedLang);
    }
    const saved = loadBirthProfile();
    // loadBirthProfile returns null when nothing is saved.
    // getBirthProfile() returns an empty default — never use it to set hasProfile.
    if (
      saved &&
      saved.birth_date &&
      saved.birth_time &&
      saved.location
    ) {
      setProfile(saved);
      setHasProfile(true);
    } else {
      setProfile(null);
      setHasProfile(false);
    }
    initView();
  }, [initView]);

  const handleChoose = (mode: HomeViewMode) => {
    saveHomeView(mode);
    setShowOnboarding(false);
    setView(mode);
    if (mode === 'calendar') {
      router.push('/calendar');
    }
  };

  const loadMonth = useCallback(async () => {
    if (view !== 'heatmap') return;
    if (!profile || !profile.birth_date || !profile.birth_time || !profile.location) return;
    setLoadingMonth(true);
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
  }, [profile, year, month, view]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

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

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070B14' }} />
    );
  }

  return (
    <AppShell
      lang={lang}
      setLang={setLang}
      dir={t.dir}
      navLabels={t.nav}
      fontFamily={lang === 'fa' || lang === 'ar' ? 'Vazirmatn, sans-serif' : 'Inter, sans-serif'}
    >
      {showOnboarding && <HomeViewOnboarding lang={lang} onChoose={handleChoose} />}

      <div className="metioro-page--dashboard">
        {!hasProfile && !showOnboarding && (
          <AlertBanner actionHref="/profile" actionLabel={t.goProfile}>
            {t.noProfile}
          </AlertBanner>
        )}
        {view === 'daily-brief' && (
          <DailyBriefView lang={lang} profile={profile} hasProfile={hasProfile} />
        )}

        {view === 'heatmap' && (
          <div className="mio-home-dashboard">
            <PageHeader title={t.heatmapTitle} />
            {!hasProfile && (
              <AlertBanner actionHref="/profile" actionLabel={t.goProfile}>
                {t.noProfile}
              </AlertBanner>
            )}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="fi text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/60"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="fi text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/60"
              >
                →
              </button>
            </div>
            <MonthHeatmapGrid
              year={year}
              month={month}
              scores={scores}
              loading={loadingMonth}
              progress={progress}
              highlightDate={highlight}
              weekdays={t.weekdays}
              months={t.months}
              loadingLabel={t.loading}
              fullWidth
            />
          </div>
        )}

        {view === 'calendar' && !showOnboarding && (
          <div className="py-12 text-center fi text-sm mio-caption">
            {t.loading}
          </div>
        )}

      </div>
    </AppShell>
  );
}

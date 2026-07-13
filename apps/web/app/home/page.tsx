'use client';

import { Suspense, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { DailyBriefView } from '@/components/home/DailyBriefView';
import {
  getBirthProfile,
  loadBirthProfile,
  type BirthProfile,
} from '@/lib/birth-profile';
import {
  loadAppLang,
  saveAppLang,
} from '@/lib/calendar-preferences';
import type { AppLang } from '@/lib/app-settings';
import { HOME_LANGS } from '@/lib/home-i18n';
import { useQueuedEffect } from '@/lib/use-queued-effect';

export default function HomePage() {
  const [lang, setLangState] = useState<AppLang>('en');
  const [profile, setProfile] = useState<BirthProfile | null>(() =>
    getBirthProfile()
  );
  const [hasProfile, setHasProfile] = useState(false);

  const setLang = (nextLang: AppLang) => {
    setLangState(nextLang);
    saveAppLang(nextLang);
  };

  useQueuedEffect(() => {
    const refreshProfile = () => {
      const saved = loadBirthProfile();

      if (saved) {
        setProfile(saved);
        setHasProfile(true);
      } else {
        setProfile(null);
        setHasProfile(false);
      }
    };

    const stored = loadAppLang();

    if (
      stored === 'en' ||
      stored === 'ru' ||
      stored === 'fa' ||
      stored === 'ar'
    ) {
      setLangState(stored);
    }

    refreshProfile();

    window.addEventListener('focus', refreshProfile);
    document.addEventListener('visibilitychange', refreshProfile);

    return () => {
      window.removeEventListener('focus', refreshProfile);
      document.removeEventListener('visibilitychange', refreshProfile);
    };
  }, []);

  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: '#070B14' }}
          aria-busy="true"
        />
      }
    >
      <AppShell
        lang={lang}
        setLang={setLang}
        dir={HOME_LANGS[lang].dir}
        navLabels={HOME_LANGS[lang].nav}
      >
        <div className="metioro-page--dashboard">
          <DailyBriefView
            lang={lang}
            profile={profile}
            hasProfile={hasProfile}
          />
        </div>
      </AppShell>
    </Suspense>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import type { BrandLang } from '@/lib/brand';
import { localeFcFiCss, localeFontFamily } from '@/lib/brand-theme';
import { trackFtueEvent } from '@/lib/ftue-analytics';
import { getWelcomeCopy } from '@/lib/ftue-i18n';
import { ftueTodayPath, isFtueComplete } from '@/lib/ftue-storage';
import type { AppLang } from '@/lib/app-settings';
import { useAppLang, useClientReady } from '@/lib/use-app-lang';
import { useQueuedEffect } from '@/lib/use-queued-effect';

/** FTUE-02 destination — Choose your goal (PRD-001 §5.2). */
export const FTUE_GOAL_SELECTION_PATH = '/onboarding/goal';

const LANG_KEYS: AppLang[] = ['en', 'ru', 'fa', 'ar'];
const LANG_LABEL: Record<AppLang, string> = {
  en: 'EN',
  ru: 'RU',
  fa: 'FA',
  ar: 'AR',
};

function isRtl(lang: AppLang): boolean {
  return lang === 'fa' || lang === 'ar';
}

export function WelcomeScreen() {
  const router = useRouter();
  const [lang, setLang] = useAppLang();
  const clientReady = useClientReady();
  const [ready, setReady] = useState(false);

  useQueuedEffect(() => {
    if (isFtueComplete()) {
      router.replace(ftueTodayPath());
      return;
    }
    setReady(true);
    trackFtueEvent('ftue_welcome_view');
  }, [router]);

  const handleStart = useCallback(() => {
    trackFtueEvent('ftue_welcome_start');
    router.push(FTUE_GOAL_SELECTION_PATH);
  }, [router]);

  if (!ready || !clientReady) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#070B14' }}
        aria-busy="true"
      />
    );
  }

  const c = getWelcomeCopy(lang);

  return (
    <div
      className="min-h-screen flex flex-col px-5 py-8"
      style={{
        direction: isRtl(lang) ? 'rtl' : 'ltr',
        background: 'radial-gradient(circle at top, #1a1240 0%, #070B14 55%)',
        fontFamily: localeFontFamily(lang),
      }}
    >
      <style>{`
        ${localeFcFiCss(lang)}
        .welcome-btn:focus-visible,.welcome-lang:focus-visible,.welcome-link:focus-visible{
          outline:2px solid #fbbf24;outline-offset:2px
        }
      `}</style>

      <header className="flex items-center justify-between gap-3 pt-2 pb-6">
        <BrandLogo lang={lang as BrandLang} href={null} size="md" showTagline />
        <div className="flex gap-1 shrink-0" role="group" aria-label={c.languageAria}>
          {LANG_KEYS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className="welcome-lang fi px-2.5 py-1 text-xs rounded-md border transition-all min-h-11 min-w-11 sm:min-h-0 sm:min-w-0"
              style={
                lang === l
                  ? {
                      borderColor: 'rgba(251,191,36,0.5)',
                      color: '#fbbf24',
                      background: 'rgba(251,191,36,0.06)',
                    }
                  : {
                      borderColor: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.3)',
                    }
              }
            >
              {LANG_LABEL[l]}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full gap-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white fc tracking-tight">
            {c.headline}
          </h1>
          <p className="text-sm sm:text-base text-white/65 leading-relaxed fi">{c.subline}</p>
        </div>

        <div className="w-full flex flex-col gap-3 pt-2">
          <button
            type="button"
            onClick={handleStart}
            className="welcome-btn w-full py-3.5 rounded-xl text-sm font-semibold transition-opacity fi"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
              color: '#0A0F1C',
            }}
          >
            {c.start}
          </button>

          <Link
            href="/login"
            className="welcome-link w-full py-3 text-center text-sm text-white/55 hover:text-white/80 transition-colors fi"
          >
            {c.alreadyHaveAccount}
          </Link>
        </div>
      </main>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import type { AppLang } from '@/lib/app-settings';
import type { BrandLang } from '@/lib/brand';
import { localeFcFiCss, localeFontFamily } from '@/lib/brand-theme';
import { trackFtueEvent } from '@/lib/ftue-analytics';
import { getDecisionProfileCopy } from '@/lib/ftue-i18n';
import {
  ftueTodayPath,
  isFtueComplete,
  updateFtueDraft,
} from '@/lib/ftue-storage';
import { useAppLang, useClientReady } from '@/lib/use-app-lang';
import { useQueuedEffect } from '@/lib/use-queued-effect';

/** Next FTUE step — Birth Date (PRD-001 §5.4). */
export const FTUE_BIRTH_DATE_PATH = '/onboarding/birth-date';

/** Prior FTUE step — Goal Selection (PRD-001 §5.2). */
const FTUE_GOAL_SELECTION_PATH = '/onboarding/goal';

function isRtl(lang: AppLang): boolean {
  return lang === 'fa' || lang === 'ar';
}

export function DecisionProfileScreen() {
  const router = useRouter();
  const [lang] = useAppLang();
  const clientReady = useClientReady();
  const [viewed, setViewed] = useState(false);
  const [ready, setReady] = useState(false);

  useQueuedEffect(() => {
    if (isFtueComplete()) {
      router.replace(ftueTodayPath());
      return;
    }
    setReady(true);
    if (!viewed) {
      setViewed(true);
      trackFtueEvent('ftue_intent_view');
    }
  }, [router, viewed]);

  const handleContinue = useCallback(() => {
    updateFtueDraft({ decisionProfileAcknowledged: true });
    router.push(FTUE_BIRTH_DATE_PATH);
  }, [router]);

  const handleBack = useCallback(() => {
    router.push(FTUE_GOAL_SELECTION_PATH);
  }, [router]);

  if (!clientReady || !ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#070B14' }}
        aria-busy="true"
      />
    );
  }

  const c = getDecisionProfileCopy(lang);

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
        .intent-btn:focus-visible,.intent-link:focus-visible{
          outline:2px solid #fbbf24;outline-offset:2px
        }
      `}</style>

      <header className="flex items-center justify-between gap-3 pt-2 pb-6 max-w-md mx-auto w-full">
        <BrandLogo lang={lang as BrandLang} href={null} size="md" showTagline />
        <button
          type="button"
          onClick={handleBack}
          className="intent-link fi text-sm text-white/55 hover:text-white/80 transition-colors min-h-11 px-2"
        >
          {c.back}
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full gap-8">
        <p className="fi text-sm sm:text-base text-white/70 leading-relaxed text-center">
          {c.body}
        </p>

        <div className="w-full flex flex-col gap-3 pt-2">
          <button
            type="button"
            onClick={handleContinue}
            className="intent-btn w-full py-3.5 rounded-xl text-sm font-semibold transition-opacity fi"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
              color: '#0A0F1C',
            }}
          >
            {c.continue}
          </button>
        </div>
      </main>
    </div>
  );
}

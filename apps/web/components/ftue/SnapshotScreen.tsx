'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import type { AppLang } from '@/lib/app-settings';
import type { BrandLang } from '@/lib/brand';
import { localeFcFiCss, localeFontFamily } from '@/lib/brand-theme';
import { trackFtueEvent } from '@/lib/ftue-analytics';
import { getSnapshotCopy } from '@/lib/ftue-i18n';
import { ftueTodayPath, markFtueComplete } from '@/lib/ftue-storage';
import { useAppLang, useClientReady } from '@/lib/use-app-lang';
import { useQueuedEffect } from '@/lib/use-queued-effect';

const FTUE_NOTIFICATIONS_PATH = '/onboarding/notifications';

function isRtl(lang: AppLang): boolean {
  return lang === 'fa' || lang === 'ar';
}

/**
 * Personal Intelligence Snapshot — PRD-001 §5.9.
 * Progress / acknowledgement only. No readings, scores, or collected-data review.
 */
export function SnapshotScreen() {
  const router = useRouter();
  const [lang] = useAppLang();
  const clientReady = useClientReady();
  const [viewed, setViewed] = useState(false);

  useQueuedEffect(() => {
    if (viewed) return;
    setViewed(true);
    trackFtueEvent('ftue_snapshot_view');
  }, [viewed]);

  const handleBack = useCallback(() => {
    router.push(FTUE_NOTIFICATIONS_PATH);
  }, [router]);

  const handleContinueToToday = useCallback(() => {
    trackFtueEvent('ftue_complete');
    trackFtueEvent('ftue_to_today');
    markFtueComplete();
    router.push(ftueTodayPath());
  }, [router]);

  if (!clientReady) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#070B14' }}
        aria-busy="true"
      />
    );
  }

  const c = getSnapshotCopy(lang);

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
        .ss-btn:focus-visible,.ss-link:focus-visible{
          outline:2px solid #fbbf24;outline-offset:2px
        }
      `}</style>

      <header className="flex items-center justify-between gap-3 pt-2 pb-6 max-w-md mx-auto w-full">
        <BrandLogo lang={lang as BrandLang} href={null} size="md" showTagline />
        <button
          type="button"
          onClick={handleBack}
          className="ss-link fi text-sm text-white/55 hover:text-white/80 transition-colors min-h-11 px-2"
        >
          {c.back}
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full gap-8 pb-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-white fc tracking-tight text-center">
          {c.title}
        </h1>

        <ul className="w-full space-y-3" aria-label={c.title}>
          {c.checklist.map((item) => (
            <li
              key={item}
              className="fi flex items-start gap-3 text-sm sm:text-base text-white/75"
            >
              <span className="text-amber-300/90" aria-hidden="true">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <p className="fi text-sm text-white/55 text-center">{c.done}</p>

        <div className="w-full flex flex-col gap-3 pt-2">
          <button
            type="button"
            onClick={handleContinueToToday}
            className="ss-btn w-full py-3.5 rounded-xl text-sm font-semibold transition-opacity fi"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
              color: '#0A0F1C',
            }}
          >
            {c.continueToToday}
          </button>
        </div>
      </main>
    </div>
  );
}

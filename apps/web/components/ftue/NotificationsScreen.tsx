'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import type { AppLang } from '@/lib/app-settings';
import type { BrandLang } from '@/lib/brand';
import { localeFcFiCss, localeFontFamily } from '@/lib/brand-theme';
import { trackFtueEvent } from '@/lib/ftue-analytics';
import {
  FTUE_NOTIFICATION_IDS,
  getNotificationsCopy,
  type FtueNotificationId,
} from '@/lib/ftue-i18n';
import { useAppLang, useClientReady } from '@/lib/use-app-lang';

/** Next FTUE step — Personal Intelligence Snapshot (PRD-001 §5.9). */
export const FTUE_SNAPSHOT_PATH = '/onboarding/snapshot';

const FTUE_LIVING_LOCATION_PATH = '/onboarding/living-location';

function isRtl(lang: AppLang): boolean {
  return lang === 'fa' || lang === 'ar';
}

function togglePreference(
  selected: ReadonlySet<FtueNotificationId>,
  id: FtueNotificationId
): Set<FtueNotificationId> {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/**
 * Notification Preferences (PRD-001 §5.8) — preference capture only.
 * Does not call Notification.requestPermission, service workers, or push providers.
 */
export function NotificationsScreen() {
  const router = useRouter();
  const [lang] = useAppLang();
  const clientReady = useClientReady();
  const [selected, setSelected] = useState<ReadonlySet<FtueNotificationId>>(
    () => new Set()
  );

  const handleToggle = useCallback((id: FtueNotificationId) => {
    setSelected((prev) => togglePreference(prev, id));
  }, []);

  const handleBack = useCallback(() => {
    router.push(FTUE_LIVING_LOCATION_PATH);
  }, [router]);

  const goNext = useCallback(
    (mode: 'continue' | 'skip') => {
      const choices = Array.from(selected);
      if (mode === 'skip') {
        trackFtueEvent('ftue_notifications_skip');
      } else {
        trackFtueEvent('ftue_notifications_select', { choices });
      }
      router.push(FTUE_SNAPSHOT_PATH);
    },
    [router, selected]
  );

  if (!clientReady) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#070B14' }}
        aria-busy="true"
      />
    );
  }

  const c = getNotificationsCopy(lang);
  const hasSelection = selected.size > 0;

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
        .nt-btn:focus-visible,.nt-link:focus-visible,.nt-option:focus-visible{
          outline:2px solid #fbbf24;outline-offset:2px
        }
      `}</style>

      <header className="flex items-center justify-between gap-3 pt-2 pb-6 max-w-md mx-auto w-full">
        <BrandLogo lang={lang as BrandLang} href={null} size="md" showTagline />
        <button
          type="button"
          onClick={handleBack}
          className="nt-link fi text-sm text-white/55 hover:text-white/80 transition-colors min-h-11 px-2"
        >
          {c.back}
        </button>
      </header>

      <main className="flex-1 flex flex-col max-w-md mx-auto w-full gap-6 pb-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-white fc tracking-tight text-center">
          {c.prompt}
        </h1>

        <div
          role="group"
          aria-label={c.preferencesAria}
          className="grid grid-cols-1 gap-3"
        >
          {FTUE_NOTIFICATION_IDS.map((id) => {
            const active = selected.has(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleToggle(id)}
                aria-pressed={active}
                className="nt-option fi w-full text-start rounded-xl border px-4 py-3.5 text-sm leading-snug transition-all min-h-11"
                style={
                  active
                    ? {
                        borderColor: 'rgba(251,191,36,0.55)',
                        color: '#fbbf24',
                        background: 'rgba(251,191,36,0.08)',
                      }
                    : {
                        borderColor: 'rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.78)',
                        background: 'rgba(255,255,255,0.03)',
                      }
                }
              >
                {c.options[id]}
              </button>
            );
          })}
        </div>

        <div className="w-full flex flex-col gap-3 mt-auto pt-4">
          <button
            type="button"
            onClick={() => goNext('continue')}
            disabled={!hasSelection}
            className="nt-btn w-full py-3.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-45 fi"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
              color: '#0A0F1C',
            }}
          >
            {c.continue}
          </button>

          <button
            type="button"
            onClick={() => goNext('skip')}
            className="nt-link w-full py-3 text-sm text-white/55 hover:text-white/80 transition-colors fi"
          >
            {c.skip}
          </button>
        </div>
      </main>
    </div>
  );
}

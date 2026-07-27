'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import type { AppLang } from '@/lib/app-settings';
import type { BrandLang } from '@/lib/brand';
import { localeFcFiCss, localeFontFamily } from '@/lib/brand-theme';
import { trackFtueEvent } from '@/lib/ftue-analytics';
import {
  FTUE_GOAL_IDS,
  getGoalSelectionCopy,
  type FtueGoalId,
} from '@/lib/ftue-i18n';
import {
  ftueTodayPath,
  isFtueComplete,
  loadFtueDraft,
  updateFtueDraft,
} from '@/lib/ftue-storage';
import { useAppLang, useClientReady } from '@/lib/use-app-lang';
import { useQueuedEffect } from '@/lib/use-queued-effect';

/** Next FTUE step — Decision Profile intent (PRD-001 §5.3). */
export const FTUE_DECISION_PROFILE_PATH = '/onboarding/intent';

function isRtl(lang: AppLang): boolean {
  return lang === 'fa' || lang === 'ar';
}

function toggleGoal(selected: ReadonlySet<FtueGoalId>, id: FtueGoalId): Set<FtueGoalId> {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function GoalSelectionScreen() {
  const router = useRouter();
  const [lang] = useAppLang();
  const clientReady = useClientReady();
  const [selected, setSelected] = useState<ReadonlySet<FtueGoalId>>(
    () => new Set(loadFtueDraft().goals)
  );
  const [viewed, setViewed] = useState(false);
  const [ready, setReady] = useState(false);

  useQueuedEffect(() => {
    if (isFtueComplete()) {
      router.replace(ftueTodayPath());
      return;
    }
    setSelected(new Set(loadFtueDraft().goals));
    setReady(true);
    if (!viewed) {
      setViewed(true);
      trackFtueEvent('ftue_goal_view');
    }
  }, [router, viewed]);

  const handleToggle = useCallback((id: FtueGoalId) => {
    setSelected((prev) => toggleGoal(prev, id));
  }, []);

  const goNext = useCallback(
    (mode: 'continue' | 'skip') => {
      const goals = Array.from(selected);
      if (mode === 'skip') {
        updateFtueDraft({ goals: [] });
        trackFtueEvent('ftue_goal_skip');
      } else {
        updateFtueDraft({ goals });
        trackFtueEvent('ftue_goal_select', { goals });
      }
      router.push(FTUE_DECISION_PROFILE_PATH);
    },
    [router, selected]
  );

  if (!clientReady || !ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#070B14' }}
        aria-busy="true"
      />
    );
  }

  const c = getGoalSelectionCopy(lang);
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
        .goal-card:focus-visible,.goal-btn:focus-visible,.goal-link:focus-visible{
          outline:2px solid #fbbf24;outline-offset:2px
        }
      `}</style>

      <header className="flex flex-col gap-4 pt-2 pb-6 max-w-md mx-auto w-full">
        <div className="flex items-center justify-between gap-3">
          <BrandLogo lang={lang as BrandLang} href={null} size="md" showTagline />
          <button
            type="button"
            onClick={() => router.push('/welcome')}
            className="goal-link fi text-sm text-white/55 hover:text-white/80 transition-colors min-h-11 px-2"
          >
            {c.back}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-md mx-auto w-full gap-6 pb-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-white fc tracking-tight text-center">
          {c.prompt}
        </h1>

        <div
          role="group"
          aria-label={c.goalsAria}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {FTUE_GOAL_IDS.map((id) => {
            const active = selected.has(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleToggle(id)}
                aria-pressed={active}
                className="goal-card fi w-full text-start rounded-xl border px-4 py-3.5 text-sm leading-snug transition-all min-h-11"
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
                {c.goals[id]}
              </button>
            );
          })}
        </div>

        <div className="w-full flex flex-col gap-3 mt-auto pt-4">
          <button
            type="button"
            onClick={() => goNext('continue')}
            disabled={!hasSelection}
            className="goal-btn w-full py-3.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-45 fi"
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
            className="goal-link w-full py-3 text-sm text-white/55 hover:text-white/80 transition-colors fi"
          >
            {c.skip}
          </button>
        </div>
      </main>
    </div>
  );
}

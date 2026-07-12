'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { ChartSkeleton } from '@/components/ChartSkeleton';
import { NatalChart, type NatalChartLabels } from '@/components/NatalChart';
import { GlassCard } from '@/components/ui/GlassCard';
import { useRequireAuth } from '@/hooks/use-require-auth';
import type { FtueAskQuestion } from '@/lib/ask-question-repository';
import { getAskQuestionRepository } from '@/lib/ask-question-repository';
import type { AppLang } from '@/lib/app-settings';
import { fetchValidatedResultChart } from '@/lib/chart-api';
import type { ChartData } from '@/lib/chart-types';
import { executePreparedDecision } from '@/lib/decision-engine-facade';
import { prepareDecisionExecution } from '@/lib/decision-execution';
import { resolveDecisionRequest } from '@/lib/decision-request';
import { trackResultEvent } from '@/lib/ftue-analytics';
import { buildResultShareText, getResultCopy } from '@/lib/ftue-i18n';
import { ftueTodayPath, markFtueComplete } from '@/lib/ftue-storage';
import {
  ASPECT_LABELS,
  buildSignNames,
  PLANET_LABELS,
  PROFILE_LANGS,
} from '@/lib/profile-i18n';
import {
  getProfileRepository,
  isProfileRecordComplete,
} from '@/lib/profile';
import {
  hasStoredAskQuestion,
  resolveAskQuestion,
} from '@/lib/resolve-ask-question';
import { useQueuedEffect } from '@/lib/use-queued-effect';

type ResultChartPhase = 'loading' | 'empty' | 'ready';

function resolveQuestionDisplayText(
  question: FtueAskQuestion,
  lang: AppLang
): string {
  const resolved = resolveAskQuestion(question, lang);
  const request = resolveDecisionRequest(resolved);
  return request.displayText;
}

export function ResultScreen({ lang }: { lang: AppLang }) {
  const router = useRouter();
  const authed = useRequireAuth();
  const profileRepo = getProfileRepository();
  const askRepo = getAskQuestionRepository();
  const c = getResultCopy(lang);
  const initRef = useRef(false);
  const startedRef = useRef(false);
  const [chartPhase, setChartPhase] = useState<ResultChartPhase>('loading');
  const [chartData, setChartData] = useState<ChartData | null>(null);

  const profileComplete = isProfileRecordComplete(profileRepo.loadProfile());
  const storedQuestion = askRepo.loadQuestion();
  const hasQuestion = hasStoredAskQuestion(storedQuestion);
  const questionText = storedQuestion
    ? resolveQuestionDisplayText(storedQuestion, lang)
    : '';

  const chartLabels: NatalChartLabels = useMemo(() => {
    const t = PROFILE_LANGS[lang] ?? PROFILE_LANGS.en;
    return {
      empty: c.chartEmptyLabel,
      elementsTitle: t.elementsTitle,
      strengthsTitle: t.strengthsTitle,
      elements: {
        fire: t.elFire,
        earth: t.elEarth,
        air: t.elAir,
        water: t.elWater,
      },
      planetNames: PLANET_LABELS[lang] ?? PLANET_LABELS.en,
      signNames: buildSignNames(lang),
      aspectLegend: ASPECT_LABELS[lang] ?? ASPECT_LABELS.en,
      lang,
    };
  }, [lang, c.chartEmptyLabel]);

  useQueuedEffect(() => {
    if (!authed || !profileComplete || !hasQuestion) return;

    let cancelled = false;

    async function loadChart() {
      setChartPhase('loading');
      setChartData(null);

      const currentProfile = profileRepo.loadProfile();
      if (!currentProfile || !isProfileRecordComplete(currentProfile)) {
        if (!cancelled) setChartPhase('empty');
        return;
      }

      const data = await fetchValidatedResultChart(currentProfile);
      if (cancelled) return;

      if (data && Object.keys(data.planets).length > 0) {
        setChartData(data);
        setChartPhase('ready');
        return;
      }

      setChartPhase('empty');
    }

    void loadChart();
    return () => {
      cancelled = true;
    };
  }, [authed, profileComplete, hasQuestion, profileRepo]);

  useQueuedEffect(() => {
    if (!authed || !profileComplete || !hasQuestion) return;

    const question = askRepo.loadQuestion();
    if (!question) return;

    const profile = profileRepo.loadProfile();
    if (!profile || !isProfileRecordComplete(profile)) return;

    const resolved = resolveAskQuestion(question, lang);
    const request = resolveDecisionRequest(resolved);
    const preparation = prepareDecisionExecution(request);

    // Existing discriminator: only Guided Ready preparations execute over the network.
    if (preparation.status !== 'ready') return;

    const controller = new AbortController();

    void (async () => {
      try {
        // Observe at the boundary only — intentionally unused by UI.
        await executePreparedDecision(preparation, {
          profile,
          locale: lang,
          signal: controller.signal,
        });
      } catch {
        // Transport failures are typed on the facade result; never throw to UI.
      }
    })();

    return () => {
      controller.abort();
    };
  }, [authed, profileComplete, hasQuestion, lang, askRepo, profileRepo]);

  useQueuedEffect(() => {
    if (!authed || initRef.current) return;

    if (!profileComplete) {
      trackResultEvent('ftue.result.missing_profile');
      router.replace('/profile?onboarding=1');
      return;
    }

    if (!hasQuestion) {
      trackResultEvent('ftue.result.missing_question');
      router.replace('/ask');
      return;
    }

    initRef.current = true;
    trackResultEvent('ftue.result.view');
    if (!startedRef.current) {
      startedRef.current = true;
      trackResultEvent('ftue.result.started');
    }
  }, [authed, profileComplete, hasQuestion, router]);

  const handleComplete = () => {
    trackResultEvent('ftue.result.completed');
    markFtueComplete();
    router.push(ftueTodayPath());
  };

  const handleShare = async () => {
    const text = buildResultShareText(c, questionText);
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: c.title, text });
      } catch {
        // User dismissed the share sheet.
      }
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    }
  };

  if (!authed || !profileComplete || !hasQuestion) {
    return (
      <div
        className="min-h-[50vh] flex items-center justify-center fi text-sm text-white/50"
        aria-busy="true"
        aria-live="polite"
      >
        {c.loadingLabel}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6" data-ftue-screen="result" data-lang={lang}>
      <header className="mb-6">
        <p className="fi text-xs uppercase tracking-widest text-amber-400/80 mb-2">{c.step}</p>
        <h1 className="fc text-2xl tracking-wide text-white mb-2">{c.title}</h1>
      </header>

      <section className="mb-5" aria-labelledby="result-question-label">
        <h2 id="result-question-label" className="fi text-xs uppercase tracking-widest text-white/45 mb-2">
          {c.questionLabel}
        </h2>
        <p className="fi text-sm text-white/85 leading-relaxed">{questionText}</p>
      </section>

      <section
        className="mb-5 flex flex-col items-center"
        aria-busy={chartPhase === 'loading'}
        aria-live="polite"
        data-result-chart={chartPhase}
      >
        {chartPhase === 'loading' && (
          <>
            <ChartSkeleton size={220} />
            <p className="fi text-xs text-white/40 mt-2">{c.chartLoadingLabel}</p>
          </>
        )}
        {chartPhase === 'empty' && (
          <p className="fi text-xs text-white/40 text-center py-6" role="status">
            {c.chartEmptyLabel}
          </p>
        )}
        {chartPhase === 'ready' && chartData && (
          <NatalChart chart={chartData} labels={chartLabels} showInsights={false} />
        )}
      </section>

      <GlassCard className="w-full p-5 mb-5" eyebrow={c.insightEyebrow}>
        <p className="fi text-sm text-white/80 leading-relaxed">{c.insightBody}</p>
      </GlassCard>

      <p className="fi text-xs text-white/40 text-center leading-relaxed mb-4 px-2">
        {c.previewNote}
      </p>

      <button
        type="button"
        onClick={() => void handleShare()}
        className="result-share w-full fi py-3 rounded-xl text-sm text-white/70 mb-3"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {c.shareLabel}
      </button>

      <button
        type="button"
        onClick={handleComplete}
        className="result-cta w-full fc py-3.5 rounded-xl text-sm font-medium tracking-wide"
        style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: '#0a0a0a',
        }}
      >
        {c.cta}
      </button>

      <style>{`
        .result-cta:focus-visible{outline:2px solid rgba(251,191,36,0.7);outline-offset:2px}
        .result-share:focus-visible{outline:2px solid rgba(255,255,255,0.35);outline-offset:2px}
      `}</style>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { getAskQuestionRepository } from '@/lib/ask-question-repository';
import { trackResultEvent } from '@/lib/ftue-analytics';
import type { ResultCopy } from '@/lib/ftue-i18n';
import type { AppLang } from '@/lib/app-settings';
import { ftueTodayPath, markFtueComplete } from '@/lib/ftue-storage';
import {
  getProfileRepository,
  isProfileRecordComplete,
} from '@/lib/profile';
import { useQueuedEffect } from '@/lib/use-queued-effect';

export function ResultScreen({ copy, lang }: { copy: ResultCopy; lang: AppLang }) {
  const router = useRouter();
  const authed = useRequireAuth();
  const profileRepo = getProfileRepository();
  const askRepo = getAskQuestionRepository();
  const c = copy;
  const initRef = useRef(false);
  const startedRef = useRef(false);

  const profileComplete = isProfileRecordComplete(profileRepo.loadProfile());
  const storedQuestion = askRepo.loadQuestion();
  const hasQuestion = Boolean(storedQuestion?.text.trim());
  const questionText = storedQuestion?.text.trim() ?? '';

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

  if (!authed || !profileComplete || !hasQuestion) {
    return (
      <div
        className="min-h-[50vh] flex items-center justify-center"
        aria-busy="true"
      />
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

      <GlassCard className="w-full p-5 mb-5" eyebrow={c.insightEyebrow}>
        <p className="fi text-sm text-white/80 leading-relaxed">{c.insightBody}</p>
      </GlassCard>

      <p className="fi text-xs text-white/40 text-center leading-relaxed mb-6 px-2">
        {c.previewNote}
      </p>

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
      `}</style>
    </div>
  );
}

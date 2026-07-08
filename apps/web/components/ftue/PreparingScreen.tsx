'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useId, useRef, useState } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import { GlassCard } from '@/components/ui/GlassCard';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { trackPreparingEvent } from '@/lib/ftue-analytics';
import { PREPARING_COPY } from '@/lib/ftue-i18n';
import {
  PreparingError,
  PREPARING_STEPS,
  runPreparingOrchestration,
  type PreparingStep,
} from '@/lib/ftue-preparing';
import { resolvePreparingCompletePath } from '@/lib/ftue-routing';
import { getProfileRepository, isProfileRecordComplete } from '@/lib/profile';
import { useQueuedEffect } from '@/lib/use-queued-effect';

type Phase = 'checking' | 'loading' | 'success' | 'error';

const MAX_RETRIES = 2;

function stepAriaLabel(step: PreparingStep, copy: typeof PREPARING_COPY): string {
  const status =
    step.status === 'done'
      ? copy.stepDone
      : step.status === 'active'
        ? copy.stepActive
        : copy.stepPending;
  return `${step.label}: ${status}`;
}

export function PreparingScreen() {
  const router = useRouter();
  const authed = useRequireAuth();
  const repo = getProfileRepository();
  const c = PREPARING_COPY;
  const listId = useId();

  const [phase, setPhase] = useState<Phase>('checking');
  const [steps, setSteps] = useState<PreparingStep[]>(PREPARING_STEPS);
  const [errorMessage, setErrorMessage] = useState('');
  const [showContinueAnyway, setShowContinueAnyway] = useState(false);
  const startedRef = useRef(false);
  const initRef = useRef(false);
  const retriesRef = useRef(0);
  const runIdRef = useRef(0);

  const runOrchestration = useCallback(async () => {
    const runId = ++runIdRef.current;
    setPhase('loading');
    setErrorMessage('');
    setShowContinueAnyway(false);
    setSteps(PREPARING_STEPS.map((s) => ({ ...s })));

    if (!startedRef.current) {
      startedRef.current = true;
      trackPreparingEvent('ftue.preparing.started');
    }

    try {
      await runPreparingOrchestration({
        repo,
        onStepUpdate: (next) => {
          if (runId === runIdRef.current) setSteps(next);
        },
      });

      if (runId !== runIdRef.current) return;

      trackPreparingEvent('ftue.preparing.completed');
      setPhase('success');
      window.setTimeout(() => {
        router.replace(resolvePreparingCompletePath());
      }, 450);
    } catch (err) {
      if (runId !== runIdRef.current) return;

      const message =
        err instanceof PreparingError
          ? err.message
          : 'Something went wrong while preparing your brief.';

      if (err instanceof PreparingError && err.code === 'no_profile') {
        router.replace('/profile?onboarding=1');
        return;
      }

      trackPreparingEvent('ftue.preparing.failed', {
        reason: err instanceof PreparingError ? err.code : 'unknown',
        retries: retriesRef.current,
      });
      setErrorMessage(message);
      setPhase('error');
      setShowContinueAnyway(retriesRef.current >= MAX_RETRIES);
    }
  }, [repo, router]);

  useQueuedEffect(() => {
    if (!authed || initRef.current) return;

    const profile = repo.loadProfile();
    if (!isProfileRecordComplete(profile)) {
      router.replace('/profile?onboarding=1');
      return;
    }

    initRef.current = true;
    trackPreparingEvent('ftue.preparing.view');
    void runOrchestration();
  }, [authed, repo, router, runOrchestration]);

  const handleRetry = useCallback(() => {
    retriesRef.current += 1;
    void runOrchestration();
  }, [runOrchestration]);

  const handleContinueAnyway = useCallback(() => {
    router.replace(resolvePreparingCompletePath({ scoreError: true }));
  }, [router]);

  if (!authed || phase === 'checking') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#070B14' }}
        aria-busy="true"
      />
    );
  }

  const statusText =
    phase === 'success'
      ? c.statusSuccess
      : phase === 'error'
        ? c.statusError
        : c.statusLoading;

  return (
    <div
      className="min-h-screen flex flex-col fi px-5 py-8"
      style={{
        background: 'radial-gradient(circle at top, #1a1240 0%, #070B14 55%)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Inter:wght@300;400;500;600&display=swap');
        .fc{font-family:'Cinzel',serif}.fi{font-family:'Inter',sans-serif}
        .prep-step:focus-visible{outline:2px solid rgba(251,191,36,0.7);outline-offset:2px}
        @keyframes prep-pulse{0%,100%{opacity:.35}50%{opacity:1}}
        .prep-pulse{animation:prep-pulse 1.4s ease-in-out infinite}
      `}</style>

      <header className="flex justify-center pt-4 pb-8">
        <BrandLogo href={null} size="md" showTagline />
      </header>

      <main className="flex-1 flex flex-col items-center max-w-md mx-auto w-full gap-5">
        <div className="text-center space-y-2 w-full">
          <p className="fi text-xs uppercase tracking-widest text-amber-400/80">{c.step}</p>
          <h1 className="text-2xl font-semibold text-white fc tracking-tight">{c.title}</h1>
          <p className="fi text-sm text-white/50">{c.sub}</p>
        </div>

        <GlassCard className="w-full p-5">
          <div
            role="status"
            aria-live="polite"
            aria-busy={phase === 'loading'}
            className="space-y-4"
          >
            <p className="fi text-sm text-white/70 text-center">{statusText}</p>

            <ol
              id={listId}
              aria-label="Preparation progress"
              className="space-y-3"
            >
              {steps.map((step) => {
                const done = step.status === 'done';
                const active = step.status === 'active';
                return (
                  <li
                    key={step.id}
                    aria-current={active ? 'step' : undefined}
                    aria-label={stepAriaLabel(step, c)}
                    className="prep-step flex items-center gap-3 rounded-lg px-3 py-2.5"
                    style={{
                      background: active
                        ? 'rgba(251,191,36,0.08)'
                        : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${
                        done
                          ? 'rgba(52,211,153,0.25)'
                          : active
                            ? 'rgba(251,191,36,0.25)'
                            : 'rgba(255,255,255,0.06)'
                      }`,
                    }}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        done ? 'text-emerald-300' : active ? 'text-amber-300 prep-pulse' : 'text-white/30'
                      }`}
                      style={{
                        background: done
                          ? 'rgba(52,211,153,0.15)'
                          : active
                            ? 'rgba(251,191,36,0.15)'
                            : 'rgba(255,255,255,0.05)',
                      }}
                      aria-hidden
                    >
                      {done ? '✓' : active ? '…' : '○'}
                    </span>
                    <span
                      className={`fi text-sm ${
                        done ? 'text-white/80' : active ? 'text-white' : 'text-white/45'
                      }`}
                    >
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>

            {phase === 'error' && (
              <div
                role="alert"
                className="rounded-lg px-3 py-2 text-sm space-y-3"
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: '#fca5a5',
                }}
              >
                <p>{errorMessage || c.offlineError}</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="prep-step fi flex-1 py-2.5 rounded-lg text-sm font-medium"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#0a0a0a',
                    }}
                  >
                    {c.retry}
                  </button>
                  {showContinueAnyway && (
                    <button
                      type="button"
                      onClick={handleContinueAnyway}
                      className="prep-step fi flex-1 py-2.5 rounded-lg text-sm text-white/70"
                      style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                    >
                      {c.continueAnyway}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </main>
    </div>
  );
}

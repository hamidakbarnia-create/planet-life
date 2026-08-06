'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useId, useState } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import type { AppLang } from '@/lib/app-settings';
import type { BrandLang } from '@/lib/brand';
import { localeFcFiCss, localeFontFamily } from '@/lib/brand-theme';
import { trackFtueEvent } from '@/lib/ftue-analytics';
import {
  getBirthTimeCopy,
  type BirthTimeAccuracy,
  type BirthTimeCopy,
} from '@/lib/ftue-i18n';
import {
  ftueTodayPath,
  isFtueComplete,
  loadFtueDraft,
  updateFtueDraft,
} from '@/lib/ftue-storage';
import { useAppLang, useClientReady } from '@/lib/use-app-lang';
import { useQueuedEffect } from '@/lib/use-queued-effect';

/** Next FTUE step — Birth Place (PRD-001 §5.6). */
export const FTUE_BIRTH_PLACE_PATH = '/onboarding/birth-place';

const FTUE_BIRTH_DATE_PATH = '/onboarding/birth-date';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const ACCURACY_OPTIONS: BirthTimeAccuracy[] = ['exact', 'approximate', 'unknown'];

export type BirthTimeValidationError = keyof BirthTimeCopy['errors'];

function isRtl(lang: AppLang): boolean {
  return lang === 'fa' || lang === 'ar';
}

function needsTime(accuracy: BirthTimeAccuracy | null): boolean {
  return accuracy === 'exact' || accuracy === 'approximate';
}

/** Pure §5.5 validation — time required only for Exact/Approximate. */
export function validateBirthTime(
  accuracy: BirthTimeAccuracy | null,
  time: string
): BirthTimeValidationError | null {
  if (!accuracy) return 'accuracyRequired';
  if (!needsTime(accuracy)) return null;

  const trimmed = time.trim();
  if (!trimmed) return 'timeRequired';
  if (!TIME_RE.test(trimmed)) return 'timeInvalid';
  return null;
}

function accuracyLabel(c: BirthTimeCopy, accuracy: BirthTimeAccuracy): string {
  if (accuracy === 'exact') return c.exact;
  if (accuracy === 'approximate') return c.approximate;
  return c.unknown;
}

export function BirthTimeScreen() {
  const router = useRouter();
  const [lang] = useAppLang();
  const clientReady = useClientReady();
  const formId = useId();
  const timeId = `${formId}-time`;
  const noteId = `${formId}-note`;
  const errId = `${formId}-err`;

  const initial = loadFtueDraft();
  const [accuracy, setAccuracy] = useState<BirthTimeAccuracy | null>(
    () => initial.birthTimeAccuracy
  );
  const [birthTime, setBirthTime] = useState(() => initial.birthTime ?? '');
  const [error, setError] = useState<BirthTimeValidationError | null>(null);
  const [touched, setTouched] = useState(false);
  const [ready, setReady] = useState(false);

  useQueuedEffect(() => {
    if (isFtueComplete()) {
      router.replace(ftueTodayPath());
      return;
    }
    const draft = loadFtueDraft();
    setAccuracy(draft.birthTimeAccuracy);
    setBirthTime(draft.birthTime ?? '');
    setReady(true);
  }, [router]);

  const handleBack = useCallback(() => {
    router.push(FTUE_BIRTH_DATE_PATH);
  }, [router]);

  const handleAccuracy = useCallback(
    (next: BirthTimeAccuracy) => {
      setAccuracy(next);
      if (!needsTime(next)) {
        setBirthTime('');
      }
      if (touched) {
        setError(validateBirthTime(next, needsTime(next) ? birthTime : ''));
      }
    },
    [birthTime, touched]
  );

  const handleTimeChange = useCallback(
    (value: string) => {
      setBirthTime(value);
      if (touched) {
        setError(validateBirthTime(accuracy, value));
      }
    },
    [accuracy, touched]
  );

  const handleContinue = useCallback(() => {
    const nextError = validateBirthTime(accuracy, birthTime);
    setTouched(true);
    setError(nextError);
    if (nextError || !accuracy) return;

    if (accuracy === 'unknown') {
      updateFtueDraft({ birthTimeAccuracy: 'unknown', birthTime: null });
      trackFtueEvent('ftue_birthtime_unknown');
    } else {
      updateFtueDraft({
        birthTimeAccuracy: accuracy,
        birthTime: birthTime.trim(),
      });
      trackFtueEvent('ftue_birthtime_set', { accuracy });
    }
    router.push(FTUE_BIRTH_PLACE_PATH);
  }, [accuracy, birthTime, router]);

  if (!clientReady || !ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#070B14' }}
        aria-busy="true"
      />
    );
  }

  const c = getBirthTimeCopy(lang);
  const errorMessage = error ? c.errors[error] : null;
  const showTime = needsTime(accuracy);

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
        .bt-field{background:rgba(255,255,255,0.04);color:#fff;border-radius:10px}
        .bt-field:focus{border-color:rgba(251,191,36,0.45);outline:none}
        .bt-btn:focus-visible,.bt-link:focus-visible,.bt-field:focus-visible,.bt-option:focus-visible{
          outline:2px solid #fbbf24;outline-offset:2px
        }
      `}</style>

      <header className="flex items-center justify-between gap-3 pt-2 pb-6 max-w-md mx-auto w-full">
        <BrandLogo lang={lang as BrandLang} href={null} size="md" showTagline />
        <button
          type="button"
          onClick={handleBack}
          className="bt-link fi text-sm text-white/55 hover:text-white/80 transition-colors min-h-11 px-2"
        >
          {c.back}
        </button>
      </header>

      <main className="flex-1 flex flex-col max-w-md mx-auto w-full gap-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-white fc tracking-tight text-center">
          {c.title}
        </h1>

        <div
          role="radiogroup"
          aria-label={c.accuracyAria}
          className="grid grid-cols-1 gap-3"
        >
          {ACCURACY_OPTIONS.map((option) => {
            const active = accuracy === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => handleAccuracy(option)}
                className="bt-option fi w-full text-start rounded-xl border px-4 py-3.5 text-sm leading-snug transition-all min-h-11"
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
                {accuracyLabel(c, option)}
              </button>
            );
          })}
        </div>

        {accuracy === 'unknown' && (
          <p
            id={noteId}
            className="fi text-sm text-white/65 leading-relaxed text-center"
          >
            {c.unknownReassurance}
          </p>
        )}

        {showTime && (
          <div className="w-full space-y-2">
            {accuracy === 'approximate' && (
              <p id={noteId} className="fi text-xs text-white/45 leading-relaxed">
                {c.approximateNote}
              </p>
            )}
            <label htmlFor={timeId} className="fi block text-xs text-white/50">
              {c.timeLabel}
            </label>
            <input
              id={timeId}
              type="time"
              value={birthTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={
                [
                  accuracy === 'approximate' ? noteId : null,
                  errorMessage ? errId : null,
                ]
                  .filter(Boolean)
                  .join(' ') || undefined
              }
              className="bt-field fi w-full px-3 py-3 text-sm min-h-11"
              style={{
                border: `1px solid ${
                  errorMessage ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'
                }`,
              }}
            />
          </div>
        )}

        {errorMessage && (
          <p id={errId} className="fi text-xs text-red-400" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="w-full flex flex-col gap-3 mt-auto pt-4">
          <button
            type="button"
            onClick={handleContinue}
            className="bt-btn w-full py-3.5 rounded-xl text-sm font-semibold transition-opacity fi"
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

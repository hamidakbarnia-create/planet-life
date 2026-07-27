'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useId, useMemo, useState } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import type { AppLang } from '@/lib/app-settings';
import type { BrandLang } from '@/lib/brand';
import { localeFcFiCss, localeFontFamily } from '@/lib/brand-theme';
import { trackFtueEvent } from '@/lib/ftue-analytics';
import { getBirthDateCopy, type BirthDateCopy } from '@/lib/ftue-i18n';
import { useAppLang, useClientReady } from '@/lib/use-app-lang';

/** Next FTUE step — Birth Time (PRD-001 §5.5). */
export const FTUE_BIRTH_TIME_PATH = '/onboarding/birth-time';

const FTUE_DECISION_PROFILE_PATH = '/onboarding/intent';

/** PRD §5.4 “reasonable age bounds” — numeric bound not specified; 120y matches common practice. */
export const FTUE_BIRTH_DATE_MAX_AGE_YEARS = 120;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type BirthDateValidationError = keyof BirthDateCopy['errors'];

function isRtl(lang: AppLang): boolean {
  return lang === 'fa' || lang === 'ar';
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseYmdLocal(ymd: string): Date | null {
  if (!DATE_RE.test(ymd)) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d, 12, 0, 0, 0);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== d
  ) {
    return null;
  }
  return dt;
}

export function getBirthDateInputBounds(now = new Date()): { min: string; max: string } {
  const max = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  const min = new Date(max);
  min.setFullYear(min.getFullYear() - FTUE_BIRTH_DATE_MAX_AGE_YEARS);
  return { min: toYmd(min), max: toYmd(max) };
}

/** Pure §5.4 validation against Gregorian YYYY-MM-DD local UI state. */
export function validateBirthDate(
  value: string,
  now = new Date()
): BirthDateValidationError | null {
  const trimmed = value.trim();
  if (!trimmed) return 'required';

  const parsed = parseYmdLocal(trimmed);
  if (!parsed) return 'invalid';

  const { min, max } = getBirthDateInputBounds(now);
  const ymd = toYmd(parsed);
  if (ymd > max) return 'future';
  if (ymd < min) return 'tooOld';
  return null;
}

export function BirthDateScreen() {
  const router = useRouter();
  const [lang] = useAppLang();
  const clientReady = useClientReady();
  const formId = useId();
  const dateId = `${formId}-date`;
  const descId = `${formId}-desc`;
  const errId = `${formId}-err`;

  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState<BirthDateValidationError | null>(null);
  const [touched, setTouched] = useState(false);

  const bounds = useMemo(() => getBirthDateInputBounds(), []);

  const handleBack = useCallback(() => {
    router.push(FTUE_DECISION_PROFILE_PATH);
  }, [router]);

  const handleContinue = useCallback(() => {
    const nextError = validateBirthDate(birthDate);
    setTouched(true);
    setError(nextError);
    if (nextError) return;

    trackFtueEvent('ftue_birthdate_set');
    router.push(FTUE_BIRTH_TIME_PATH);
  }, [birthDate, router]);

  const handleChange = useCallback((value: string) => {
    setBirthDate(value);
    if (touched) {
      setError(validateBirthDate(value));
    }
  }, [touched]);

  if (!clientReady) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#070B14' }}
        aria-busy="true"
      />
    );
  }

  const c = getBirthDateCopy(lang);
  const errorMessage = error ? c.errors[error] : null;

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
        .bd-field{background:rgba(255,255,255,0.04);color:#fff;border-radius:10px}
        .bd-field:focus{border-color:rgba(251,191,36,0.45);outline:none}
        .bd-btn:focus-visible,.bd-link:focus-visible,.bd-field:focus-visible{
          outline:2px solid #fbbf24;outline-offset:2px
        }
      `}</style>

      <header className="flex items-center justify-between gap-3 pt-2 pb-6 max-w-md mx-auto w-full">
        <BrandLogo lang={lang as BrandLang} href={null} size="md" showTagline />
        <button
          type="button"
          onClick={handleBack}
          className="bd-link fi text-sm text-white/55 hover:text-white/80 transition-colors min-h-11 px-2"
        >
          {c.back}
        </button>
      </header>

      <main className="flex-1 flex flex-col max-w-md mx-auto w-full gap-6">
        <div className="text-center space-y-3">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white fc tracking-tight">
            {c.title}
          </h1>
          <p id={descId} className="fi text-sm sm:text-base text-white/65 leading-relaxed">
            {c.description}
          </p>
        </div>

        <div className="w-full space-y-2">
          <label htmlFor={dateId} className="fi block text-xs text-white/50">
            {c.dateLabel}
          </label>
          <input
            id={dateId}
            type="date"
            value={birthDate}
            min={bounds.min}
            max={bounds.max}
            onChange={(e) => handleChange(e.target.value)}
            aria-invalid={Boolean(errorMessage)}
            aria-describedby={errorMessage ? `${descId} ${errId}` : descId}
            className="bd-field fi w-full px-3 py-3 text-sm min-h-11"
            style={{
              border: `1px solid ${
                errorMessage ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'
              }`,
            }}
          />
          {errorMessage && (
            <p id={errId} className="fi text-xs text-red-400" role="alert">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="w-full flex flex-col gap-3 mt-auto pt-4">
          <button
            type="button"
            onClick={handleContinue}
            className="bd-btn w-full py-3.5 rounded-xl text-sm font-semibold transition-opacity fi"
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

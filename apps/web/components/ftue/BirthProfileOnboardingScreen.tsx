'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useId, useRef, useState } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import { CityAutocomplete } from '@/components/CityAutocomplete';
import { GenderField } from '@/components/profile/GenderField';
import { GlassCard } from '@/components/ui/GlassCard';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { trackProfileEvent } from '@/lib/ftue-analytics';
import { PROFILE_ONBOARDING_COPY } from '@/lib/ftue-i18n';
import {
  draftToProfileRecord,
  EMPTY_PROFILE_DRAFT,
  getProfileRepository,
  validateProfileDraft,
  type ProfileDraft,
  type ProfileGender,
  type ProfileValidationField,
} from '@/lib/profile';
import { useQueuedEffect } from '@/lib/use-queued-effect';

export function BirthProfileOnboardingScreen() {
  const router = useRouter();
  const authed = useRequireAuth();
  const repo = getProfileRepository();
  const c = PROFILE_ONBOARDING_COPY;

  const [draft, setDraft] = useState<ProfileDraft>(EMPTY_PROFILE_DRAFT);
  const [errors, setErrors] = useState<Partial<Record<ProfileValidationField, string>>>({});
  const [showWhy, setShowWhy] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const startedRef = useRef(false);

  const formId = useId();
  const dateId = `${formId}-date`;
  const timeId = `${formId}-time`;
  const cityId = `${formId}-city`;
  const nameId = `${formId}-name`;
  const errorSummaryId = `${formId}-errors`;

  useQueuedEffect(() => {
    if (!authed) return;
    const stored = repo.loadDraft();
    if (stored) {
      setDraft(stored);
    } else {
      const profile = repo.loadProfile();
      if (profile) {
        setDraft({
          birth_date: profile.birth_date,
          birth_time: profile.birth_time,
          city_search: profile.birth_place.short,
          selected_city: profile.birth_place,
          name: profile.name ?? '',
          gender: profile.gender ?? '',
          updated_at: Date.now(),
        });
      }
    }
    trackProfileEvent('profile.view');
    setReady(true);
  }, [authed, repo]);

  const markStarted = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackProfileEvent('profile.started');
  }, []);

  const updateField = useCallback(
    (patch: Partial<ProfileDraft>) => {
      markStarted();
      setDraft((prev) => {
        const next = { ...prev, ...patch, updated_at: Date.now() };
        repo.saveDraft(next);
        return next;
      });
      setErrors((prev) => {
        const nextErrors = { ...prev };
        for (const key of Object.keys(patch) as ProfileValidationField[]) {
          if (key in nextErrors) delete nextErrors[key];
        }
        if ('city_search' in patch || 'selected_city' in patch) {
          delete nextErrors.birth_place;
        }
        if ('gender' in patch) {
          delete nextErrors.gender;
        }
        return nextErrors;
      });
    },
    [markStarted, repo]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const result = validateProfileDraft(draft);
      if (!result.valid) {
        setErrors(result.errors);
        trackProfileEvent('profile.validation_failed', {
          fields: Object.keys(result.errors),
        });
        return;
      }

      setSaving(true);
      const record = draftToProfileRecord(draft);
      repo.saveProfile(record);
      repo.clearDraft();
      trackProfileEvent('profile.saved');
      trackProfileEvent('profile.completed');
      router.replace('/onboarding/preparing');
    },
    [draft, repo, router]
  );

  const handleBack = useCallback(() => {
    const hasInput =
      draft.birth_date ||
      draft.birth_time ||
      draft.city_search ||
      draft.name?.trim() ||
      draft.gender;
    if (hasInput) {
      setShowDiscard(true);
      return;
    }
    router.push('/login');
  }, [draft, router]);

  const confirmDiscard = useCallback(() => {
    repo.clearDraft();
    setShowDiscard(false);
    router.push('/login');
  }, [repo, router]);

  if (!authed || !ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#070B14' }}
        aria-busy="true"
      />
    );
  }

  const errorFields = Object.keys(errors);
  const hasErrors = errorFields.length > 0;

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
        .bp-field:focus-visible{outline:2px solid rgba(251,191,36,0.7);outline-offset:2px}
      `}</style>

      <header className="flex items-center justify-between max-w-md mx-auto w-full pb-6">
        <button
          type="button"
          onClick={handleBack}
          className="bp-field fi text-sm text-white/60 hover:text-white/90 transition-colors rounded px-2 py-1"
        >
          ← {c.back}
        </button>
        <BrandLogo href={null} size="sm" />
        <span className="w-16" aria-hidden />
      </header>

      <main className="flex-1 flex flex-col items-center max-w-md mx-auto w-full gap-5">
        <div className="text-center space-y-2 w-full">
          <p className="fi text-xs uppercase tracking-widest text-amber-400/80">{c.step}</p>
          <h1 className="text-2xl font-semibold text-white fc tracking-tight">{c.title}</h1>
          <p className="fi text-sm text-white/50">{c.sub}</p>
        </div>

        <GlassCard className="w-full p-5 space-y-4">
          <form onSubmit={handleSubmit} aria-labelledby={`${formId}-title`} noValidate>
            <span id={`${formId}-title`} className="sr-only">
              {c.title}
            </span>

            {hasErrors && (
              <div
                id={errorSummaryId}
                role="alert"
                className="mb-4 rounded-lg px-3 py-2 text-sm"
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: '#fca5a5',
                }}
              >
                <p className="font-medium">Please fix the highlighted fields.</p>
                <ul className="mt-1 list-disc pl-4 text-xs">
                  {errorFields.map((field) => (
                    <li key={field}>{errors[field as ProfileValidationField]}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor={dateId} className="fi block text-xs text-white/50 mb-1.5">
                  {c.dateLabel} <span aria-hidden="true">*</span>
                  <span className="sr-only">({c.required})</span>
                </label>
                <input
                  id={dateId}
                  type="date"
                  required
                  value={draft.birth_date}
                  onChange={(e) => updateField({ birth_date: e.target.value })}
                  aria-invalid={Boolean(errors.birth_date)}
                  aria-describedby={errors.birth_date ? `${dateId}-err` : undefined}
                  className="bp-field fi w-full px-3 py-2.5 text-sm rounded-[10px]"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${errors.birth_date ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    color: 'white',
                  }}
                />
                {errors.birth_date && (
                  <p id={`${dateId}-err`} className="fi mt-1 text-xs text-red-400" role="alert">
                    {errors.birth_date}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor={timeId} className="fi block text-xs text-white/50 mb-1.5">
                  {c.timeLabel} <span aria-hidden="true">*</span>
                  <span className="sr-only">({c.required})</span>
                </label>
                <input
                  id={timeId}
                  type="time"
                  required
                  value={draft.birth_time}
                  onChange={(e) => updateField({ birth_time: e.target.value })}
                  aria-invalid={Boolean(errors.birth_time)}
                  aria-describedby={
                    errors.birth_time ? `${timeId}-err` : `${timeId}-hint`
                  }
                  className="bp-field fi w-full px-3 py-2.5 text-sm rounded-[10px]"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${errors.birth_time ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    color: 'white',
                  }}
                />
                <p id={`${timeId}-hint`} className="fi mt-1 text-[11px] text-white/35">
                  {c.timeHint}
                </p>
                {errors.birth_time && (
                  <p id={`${timeId}-err`} className="fi mt-1 text-xs text-red-400" role="alert">
                    {errors.birth_time}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor={cityId} className="fi block text-xs text-white/50 mb-1.5">
                  {c.cityLabel} <span aria-hidden="true">*</span>
                  <span className="sr-only">({c.required})</span>
                </label>
                <CityAutocomplete
                  inputId={cityId}
                  value={draft.city_search}
                  onChange={(v) =>
                    updateField({ city_search: v, selected_city: null })
                  }
                  onSelect={(city) =>
                    updateField({
                      city_search: city.short,
                      selected_city: {
                        name: city.name,
                        short: city.short,
                        lat: city.lat,
                        lon: city.lon,
                      },
                    })
                  }
                  placeholder={c.cityPlaceholder}
                  searchingLabel={c.citySearching}
                  noResultsLabel={c.cityNoResults}
                  ariaInvalid={Boolean(errors.birth_place)}
                  ariaDescribedBy={
                    errors.birth_place ? `${cityId}-err` : undefined
                  }
                />
                {errors.birth_place && (
                  <p id={`${cityId}-err`} className="fi mt-1 text-xs text-red-400" role="alert">
                    {errors.birth_place}
                  </p>
                )}
              </div>

              <GenderField
                name={`${formId}-gender`}
                value={draft.gender}
                onChange={(gender: ProfileGender) => updateField({ gender })}
                labels={{
                  genderLabel: c.genderLabel,
                  genderFemale: c.genderFemale,
                  genderMale: c.genderMale,
                  genderPreferNot: c.genderPreferNot,
                  required: c.required,
                }}
                error={errors.gender}
              />

              <div>
                <label htmlFor={nameId} className="fi block text-xs text-white/50 mb-1.5">
                  {c.nameLabel}
                </label>
                <input
                  id={nameId}
                  type="text"
                  autoComplete="name"
                  value={draft.name ?? ''}
                  onChange={(e) => updateField({ name: e.target.value })}
                  placeholder={c.namePlaceholder}
                  className="bp-field fi w-full px-3 py-2.5 text-sm rounded-[10px]"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'white',
                  }}
                />
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowWhy((v) => !v)}
                aria-expanded={showWhy}
                className="bp-field fi text-xs text-amber-400/80 hover:text-amber-300 transition-colors rounded px-1 py-0.5"
              >
                {showWhy ? '▾' : '▸'} {c.whyTitle}
              </button>
              {showWhy && (
                <p className="fi mt-2 text-xs text-white/45 leading-relaxed">{c.whyBody}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bp-field fi w-full mt-6 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: saving
                  ? 'rgba(251,191,36,0.3)'
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#0a0a0a',
              }}
            >
              {saving ? c.saving : c.save}
            </button>
          </form>
        </GlassCard>

        <p className="fi text-center text-[11px] text-white/30">
          <Link href="/disclaimer" className="underline hover:text-white/50">
            Educational use disclaimer
          </Link>
        </p>
      </main>

      {showDiscard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-5"
          style={{ background: 'rgba(0,0,0,0.65)' }}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${formId}-discard-title`}
            className="fi w-full max-w-sm rounded-2xl p-5 space-y-4"
            style={{
              background: '#0d1220',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <h2 id={`${formId}-discard-title`} className="text-lg font-semibold text-white">
              {c.discardTitle}
            </h2>
            <p className="text-sm text-white/50">{c.discardBody}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDiscard(false)}
                className="bp-field flex-1 py-2.5 rounded-lg text-sm text-white/70"
                style={{ border: '1px solid rgba(255,255,255,0.15)' }}
              >
                {c.discardCancel}
              </button>
              <button
                type="button"
                onClick={confirmDiscard}
                className="bp-field flex-1 py-2.5 rounded-lg text-sm font-medium text-red-300"
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.3)',
                }}
              >
                {c.discardConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

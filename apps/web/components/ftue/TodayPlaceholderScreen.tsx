'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useRef } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import { GlassCard } from '@/components/ui/GlassCard';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { trackTodayEvent } from '@/lib/ftue-analytics';
import { TODAY_COPY } from '@/lib/ftue-i18n';
import {
  getProfileRepository,
  isProfileRecordComplete,
  type ProfileRecord,
} from '@/lib/profile';
import { useQueuedEffect } from '@/lib/use-queued-effect';

function formatTodayDate(): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
}

function buildPersonalizedLine(profile: ProfileRecord): string {
  const name = profile.name?.trim();
  const city = profile.birth_place.short?.trim();
  if (name && city) return TODAY_COPY.personalizedWithNameAndCity(name, city);
  if (name) return TODAY_COPY.personalizedWithName(name);
  if (city) return TODAY_COPY.personalizedWithCity(city);
  return TODAY_COPY.personalizedDefault;
}

export function TodayPlaceholderScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authed = useRequireAuth();
  const repo = getProfileRepository();
  const c = TODAY_COPY;
  const startedRef = useRef(false);
  const initRef = useRef(false);

  const scoreError = searchParams.get('score_error') === '1';
  const profile = repo.loadProfile();
  const profileComplete = isProfileRecordComplete(profile);

  useQueuedEffect(() => {
    if (!authed || initRef.current) return;

    if (!profileComplete) {
      trackTodayEvent('ftue.today.missing_profile');
      router.replace('/profile?onboarding=1');
      return;
    }

    initRef.current = true;
    trackTodayEvent('ftue.today.view');
    if (!startedRef.current) {
      startedRef.current = true;
      trackTodayEvent('ftue.today.started');
    }
  }, [authed, profileComplete, router]);

  const handleCta = useCallback(() => {
    trackTodayEvent('ftue.today.cta_clicked');
    router.push('/ask');
  }, [router]);

  if (!authed || !profileComplete) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#070B14' }}
        aria-busy="true"
      />
    );
  }

  const personalizedLine = buildPersonalizedLine(profile!);

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
        .today-cta:focus-visible{outline:2px solid rgba(251,191,36,0.7);outline-offset:2px}
      `}</style>

      <header className="flex justify-center pt-4 pb-8">
        <BrandLogo href={null} size="md" showTagline />
      </header>

      <main className="flex-1 flex flex-col items-center max-w-md mx-auto w-full gap-5">
        <div className="text-center space-y-2 w-full">
          <p className="fi text-xs uppercase tracking-widest text-amber-400/80">{c.step}</p>
          <h1 className="text-2xl font-semibold text-white fc tracking-tight">{c.title}</h1>
          <p className="fi text-sm text-white/60">{personalizedLine}</p>
        </div>

        {scoreError && (
          <div
            role="status"
            className="w-full rounded-lg px-3 py-2.5 fi text-sm text-center"
            style={{
              background: 'rgba(251,146,60,0.1)',
              border: '1px solid rgba(251,146,60,0.25)',
              color: 'rgba(255,255,255,0.75)',
            }}
          >
            {c.scoreUnavailable}
          </div>
        )}

        <GlassCard className="w-full p-5" eyebrow={c.briefEyebrow}>
          <p className="fi text-xs text-white/45 mb-3">{formatTodayDate()}</p>
          <p className="fi text-sm text-white/80 leading-relaxed">{c.briefBody}</p>
        </GlassCard>

        <p className="fi text-xs text-white/40 text-center leading-relaxed px-2">
          {c.previewNote}
        </p>

        <button
          type="button"
          onClick={handleCta}
          className="today-cta w-full fc py-3.5 rounded-xl text-sm font-medium tracking-wide"
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#0a0a0a',
          }}
        >
          {c.cta}
        </button>
      </main>
    </div>
  );
}

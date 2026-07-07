'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import { GlassCard } from '@/components/ui/GlassCard';
import { isAuthed } from '@/lib/auth';
import { WELCOME_COPY } from '@/lib/ftue-i18n';
import { ftueTodayPath, isFtueComplete } from '@/lib/ftue-storage';
import { useQueuedEffect } from '@/lib/use-queued-effect';

export function WelcomeScreen() {
  const router = useRouter();
  const [showExplainer, setShowExplainer] = useState(false);
  const [online, setOnline] = useState(true);
  const [ready, setReady] = useState(false);

  useQueuedEffect(() => {
    setOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    if (isAuthed() && isFtueComplete()) {
      router.replace(ftueTodayPath());
      return () => {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
      };
    }
    setReady(true);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [router]);

  const handleGetStarted = useCallback(() => {
    if (!online) return;
    router.push('/login');
  }, [online, router]);

  if (!ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#070B14' }}
        aria-busy="true"
      />
    );
  }

  const c = WELCOME_COPY;

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
      `}</style>

      <header className="flex justify-center pt-4 pb-8">
        <BrandLogo href={null} size="md" showTagline />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full gap-6">
        <div className="text-center space-y-3">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white fc tracking-tight">
            {c.headline}
          </h1>
          <p className="text-sm text-white/65 leading-relaxed">{c.subline}</p>
        </div>

        {showExplainer && (
          <GlassCard variant="secondary" className="w-full space-y-3">
            <ol className="list-decimal list-inside text-sm text-white/80 space-y-2">
              {c.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </GlassCard>
        )}

        <div className="w-full flex flex-col gap-3 pt-2">
          <button
            type="button"
            onClick={handleGetStarted}
            disabled={!online}
            className="w-full py-3.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-45"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
              color: '#0A0F1C',
            }}
          >
            {online ? c.getStarted : c.offlineCta}
          </button>

          <button
            type="button"
            onClick={() => setShowExplainer((v) => !v)}
            className="w-full py-2 text-sm text-white/55 hover:text-white/80 transition-colors"
          >
            {showExplainer ? c.howItWorksHide : c.howItWorks}
          </button>
        </div>

        <p className="text-xs text-white/40 text-center pt-4">
          <Link href="/disclaimer" className="underline hover:text-white/60">
            {c.disclaimerLink}
          </Link>
        </p>
      </main>
    </div>
  );
}

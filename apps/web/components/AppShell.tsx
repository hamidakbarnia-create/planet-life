'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BottomNav, VaultPill } from './BottomNav';
import { clearSession, loadSession, type AuthSession } from '@/lib/auth';
import { loadTier, type MembershipTier } from '@/lib/membership';

type LangKey = 'en' | 'ru' | 'fa' | 'ar';

const LANG_OPTIONS: { key: LangKey; name: string }[] = [
  { key: 'en', name: 'EN' },
  { key: 'ru', name: 'RU' },
  { key: 'fa', name: 'FA' },
  { key: 'ar', name: 'AR' },
];

const TAGLINE: Record<LangKey, string> = {
  en: 'Astrological Intelligence',
  ru: 'Астрологический анализ',
  fa: 'هوش نجومی',
  ar: 'الذكاء الفلكي',
};

export function AppShell({
  children,
  lang,
  setLang,
  dir,
  navLabels,
  fontFamily,
}: {
  children: React.ReactNode;
  lang: LangKey;
  setLang: (l: LangKey) => void;
  dir: 'ltr' | 'rtl';
  navLabels?: Record<string, string>;
  fontFamily?: string;
}) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [tier, setTier] = useState<MembershipTier>('free');
  useEffect(() => {
    setSession(loadSession());
    setTier(loadTier());
    const onStorage = () => {
      setSession(loadSession());
      setTier(loadTier());
    };
    const onMembership = () => setTier(loadTier());
    window.addEventListener('storage', onStorage);
    window.addEventListener('planet-life-membership-changed', onMembership);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('planet-life-membership-changed', onMembership);
    };
  }, []);
  const sessionLabel = session?.identifier
    ? session.method === 'google' || session.method === 'apple'
      ? session.method === 'google' ? 'Google' : 'Apple'
      : session.identifier
    : null;
  const signOut = () => {
    clearSession();
    setSession(null);
  };
  const tierLabel = tier.toUpperCase();
  // Pick best font stack per language. RTL gets dedicated faces; the CSS
  // in globals.css also handles .fc/.fi class overrides and line-height.
  const stack =
    fontFamily ??
    (lang === 'ar'
      ? 'var(--font-cairo), var(--font-vazirmatn), sans-serif'
      : lang === 'fa'
        ? 'var(--font-vazirmatn), var(--font-cairo), sans-serif'
        : 'var(--font-geist-sans), sans-serif');
  const headingFont =
    lang === 'ar' || lang === 'fa' ? stack : "'Cinzel', var(--font-geist-sans), serif";
  const bodyFont = stack;

  return (
    <div
      dir={dir}
      lang={lang}
      style={{ fontFamily: bodyFont }}
      className="min-h-screen bg-[#070B14] text-white pl-20"
    >
      <style>{`
        .fc{font-family:${headingFont}}
        .fi{font-family:${bodyFont}}
      `}</style>

      <header className="flex items-center justify-between px-6 py-3 border-b border-white/5">
        <Link href="/home" className="flex items-center gap-3 no-underline">
          <svg width="36" height="36" viewBox="0 0 30 30" fill="none">
            <circle cx="15" cy="15" r="13" stroke="#fbbf24" strokeWidth="0.5" opacity="0.4" />
            <circle cx="15" cy="15" r="7" stroke="#fbbf24" strokeWidth="0.5" opacity="0.6" />
            <circle cx="15" cy="15" r="2.5" fill="#fbbf24" />
          </svg>
          <div className="flex flex-col leading-tight">
            <span className="fc text-lg tracking-widest" style={{ color: '#fbbf24' }}>
              Planet Life
            </span>
            <span className="fi text-[10px] tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {TAGLINE[lang]}
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {session ? (
            <button
              type="button"
              onClick={signOut}
              className="fi text-xs px-3 py-1.5 rounded-md border transition-colors"
              style={{
                borderColor: 'rgba(74,222,128,0.35)',
                background: 'rgba(74,222,128,0.08)',
                color: '#86efac',
              }}
              title={sessionLabel ?? ''}
            >
              {sessionLabel && sessionLabel.length > 16
                ? sessionLabel.slice(0, 14) + '…'
                : sessionLabel}
            </button>
          ) : (
            <Link
              href="/login"
              className="fi text-xs px-3 py-1.5 rounded-md border transition-colors no-underline"
              style={{
                borderColor: 'rgba(251,191,36,0.45)',
                background: 'rgba(251,191,36,0.08)',
                color: '#fbbf24',
              }}
            >
              Sign in
            </Link>
          )}
          <VaultPill label={navLabels?.['/vault'] ?? 'Vault'} />
          <Link
            href="/upgrade"
            className="fi text-[10px] tracking-[0.18em] px-2.5 py-1 rounded-md uppercase no-underline transition-all hover:opacity-100"
            title={`${tierLabel} plan — tap to manage`}
            style={{
              border:
                tier === 'free'
                  ? '1px solid rgba(251,191,36,0.18)'
                  : '1px solid rgba(74,222,128,0.32)',
              background:
                tier === 'free'
                  ? 'rgba(251,191,36,0.04)'
                  : 'rgba(74,222,128,0.08)',
              color:
                tier === 'free'
                  ? 'rgba(251,191,36,0.65)'
                  : '#86efac',
            }}
          >
            {tierLabel}
          </Link>
          <div className="flex gap-1">
          {LANG_OPTIONS.map((l) => (
            <button
              key={l.key}
              type="button"
              onClick={() => setLang(l.key)}
              className="fi px-2.5 py-1 text-xs rounded-md border transition-all"
              style={
                lang === l.key
                  ? {
                      borderColor: 'rgba(251,191,36,0.5)',
                      color: '#fbbf24',
                      background: 'rgba(251,191,36,0.06)',
                    }
                  : {
                      borderColor: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.3)',
                    }
              }
            >
              {l.name}
            </button>
          ))}
        </div>
        </div>
      </header>

      <main>{children}</main>
      <BottomNav labels={navLabels} />
    </div>
  );
}

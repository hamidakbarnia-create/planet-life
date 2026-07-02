'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BottomNav, VaultPill } from './BottomNav';
import { BrandLogo } from './BrandLogo';
import { clearSession, loadSession, type AuthSession } from '@/lib/auth';
import { type BrandLang } from '@/lib/brand';
import {
  brandBodyFont,
  brandHeadingFont,
  COLORS_RGBA,
  SURFACES,
  tierBadgeStyle,
} from '@/lib/brand-theme';
import { loadTier, type MembershipTier } from '@/lib/membership';

type LangKey = BrandLang;

const LANG_OPTIONS: { key: LangKey; name: string }[] = [
  { key: 'en', name: 'EN' },
  { key: 'ru', name: 'RU' },
  { key: 'fa', name: 'FA' },
  { key: 'ar', name: 'AR' },
];

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
  const headingFont = brandHeadingFont(lang);
  const bodyFont = brandBodyFont(lang, fontFamily);

  return (
    <div
      dir={dir}
      lang={lang}
      style={{ fontFamily: bodyFont, background: SURFACES.appBackground }}
      className="min-h-screen text-white pl-20"
    >
      <style>{`
        .fc{font-family:${headingFont}}
        .fi{font-family:${bodyFont}}
      `}</style>

      <header
        className="flex items-center justify-between px-6 py-3 border-b"
        style={{ borderColor: SURFACES.headerBorder }}
      >
        <BrandLogo lang={lang} size="md" showTagline />
        <div className="flex items-center gap-2">
          {session ? (
            <button
              type="button"
              onClick={signOut}
              className="fi text-xs px-3 py-1.5 rounded-md border transition-colors"
              style={{
                borderColor: COLORS_RGBA.royalBlue28,
                background: COLORS_RGBA.royalBlue12,
                color: '#93B4FF',
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
                borderColor: COLORS_RGBA.royalBlue45,
                background: COLORS_RGBA.royalBlue12,
                color: '#93B4FF',
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
            style={tierBadgeStyle(tier)}
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
                      borderColor: SURFACES.langActiveBorder,
                      color: SURFACES.langActiveText,
                      background: SURFACES.langActiveBg,
                    }
                  : {
                      borderColor: COLORS_RGBA.white08,
                      color: COLORS_RGBA.white45,
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

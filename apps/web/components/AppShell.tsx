'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DesktopSidebar, MobileTabBar, VaultPill } from './BottomNav';
import { BrandLogo } from './BrandLogo';
import { SiteFooter } from './SiteFooter';
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
  const [session, setSession] = useState<AuthSession | null>(() =>
    typeof window !== 'undefined' ? loadSession() : null
  );
  const [tier, setTier] = useState<MembershipTier>(() =>
    typeof window !== 'undefined' ? loadTier() : 'free'
  );

  useEffect(() => {
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
      ? session.method === 'google'
        ? 'Google'
        : 'Apple'
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
      dir="ltr"
      lang={lang}
      className="metioro-shell mio-app-bg text-white"
      style={{ fontFamily: bodyFont }}
    >
      <style>{`
        .fc{font-family:${headingFont}}
        .fi{font-family:${bodyFont}}
      `}</style>

      <DesktopSidebar labels={navLabels} />

      <header className="metioro-header">
        <div className="metioro-header__brand">
          <div className="hidden md:block">
            <BrandLogo lang={lang} size="shell" showTagline href="/home" />
          </div>
          <div className="md:hidden">
            <BrandLogo lang={lang} size="sm" showTagline={false} href="/home" />
          </div>
        </div>

        <div className="metioro-header__actions">
          {session ? (
            <button
              type="button"
              onClick={signOut}
              className="metioro-header-chip fi border transition-colors"
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
              className="metioro-header-chip fi border transition-colors no-underline"
              style={{
                borderColor: COLORS_RGBA.royalBlue45,
                background: COLORS_RGBA.royalBlue12,
                color: '#93B4FF',
              }}
            >
              {navLabels?.signIn ?? 'Sign in'}
            </Link>
          )}
          <VaultPill label={navLabels?.['/vault'] ?? 'Vault'} />
          <Link
            href="/upgrade"
            className="metioro-header-chip fi text-[10px] tracking-[0.18em] uppercase no-underline"
            title={`${tierLabel} plan`}
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
                className="metioro-header-chip fi border transition-all"
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

      <main dir={dir} lang={lang} className="metioro-main">
        {children}
        <SiteFooter />
      </main>
      <MobileTabBar labels={navLabels} />
    </div>
  );
}

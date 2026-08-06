'use client';

import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import { COLORS, primaryCtaStyle } from '@/lib/brand-theme';
import type { LandingCopy, LandingLang } from '@/lib/landing-i18n';
import { LANDING_LANG_OPTIONS } from '@/lib/landing-i18n';

type LandingNavProps = {
  lang: LandingLang;
  copy: LandingCopy;
  onLangChange: (lang: LandingLang) => void;
};

export function LandingNav({ lang, copy, onLangChange }: LandingNavProps) {
  return (
    <nav
      className="flex flex-col items-stretch justify-between gap-4 border-b px-5 py-4 md:flex-row md:items-center md:gap-6 md:px-8 md:py-5"
      style={{ borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <BrandLogo lang={lang} href="/" size="sm" showTagline={false} />
      <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-white/60 md:gap-6">
        <a href="#features" className="hover:text-white transition">
          {copy.nav.features}
        </a>
        <a href="#how" className="hover:text-white transition">
          {copy.nav.how}
        </a>
        <Link href="/profile" className="hover:text-white transition">
          {copy.nav.profile}
        </Link>
        <Link
          href="/home"
          className="px-4 py-2 rounded-lg font-medium transition hover:opacity-90"
          style={primaryCtaStyle('royal')}
        >
          {copy.nav.cta}
        </Link>
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
          {LANDING_LANG_OPTIONS.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => onLangChange(code)}
                className="min-h-11 min-w-11 rounded-full px-3 py-2 text-[11px] font-medium uppercase transition"
              style={{
                background: lang === code ? COLORS.royalBlue : 'transparent',
                  color: lang === code ? COLORS.white : 'rgba(255,255,255,0.65)',
              }}
            >
              {code}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

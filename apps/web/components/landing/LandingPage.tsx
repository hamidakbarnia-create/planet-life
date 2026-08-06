'use client';

import { useCallback, useEffect, useState } from 'react';
import { LandingCta } from '@/components/landing/CTA/LandingCta';
import { LandingFooter } from '@/components/landing/Footer/LandingFooter';
import { LandingHero } from '@/components/landing/Hero/LandingHero';
import { LandingHowItWorks } from '@/components/landing/LandingHowItWorks';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingProductPreview } from '@/components/landing/Preview/LandingProductPreview';
import { LandingTrust } from '@/components/landing/Trust/LandingTrust';
import { COLORS } from '@/lib/brand-theme';
import {
  getLandingCopy,
  getLandingFontFamily,
  resolveLandingLang,
  type LandingLang,
} from '@/lib/landing-i18n';

export function LandingPage() {
  const [lang, setLang] = useState<LandingLang>('en');

  const syncLangFromStorage = useCallback(() => {
    setLang(resolveLandingLang());
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(syncLangFromStorage);
    const onStorage = () => syncLangFromStorage();
    window.addEventListener('storage', onStorage);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('storage', onStorage);
    };
  }, [syncLangFromStorage]);

  const changeLang = (nextLang: LandingLang) => {
    localStorage.setItem('planet-life-lang', nextLang);
    setLang(nextLang);
  };

  const copy = getLandingCopy(lang);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-[#305CDE] focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <main
        id="main-content"
        dir={copy.dir}
        lang={lang}
        style={{ fontFamily: getLandingFontFamily(lang), background: COLORS.black }}
        className="min-h-screen text-white"
      >
        <LandingNav lang={lang} copy={copy} onLangChange={changeLang} />
        <LandingHero copy={copy.hero} />
        <LandingTrust copy={copy.trust} />
        <LandingHowItWorks copy={copy.how} />
        <LandingProductPreview title={copy.preview.title} modules={copy.preview.modules} />
        <LandingCta copy={copy.cta} />
        <LandingFooter />
      </main>
    </>
  );
}

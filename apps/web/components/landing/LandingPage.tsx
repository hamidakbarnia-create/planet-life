'use client';

import { useCallback, useEffect, useState } from 'react';
import { PeopleHomeRow } from '@/components/PeopleHomeRow';
import { LandingCta } from '@/components/landing/CTA/LandingCta';
import { LandingFeatures } from '@/components/landing/Features/LandingFeatures';
import { LandingFooter } from '@/components/landing/Footer/LandingFooter';
import { LandingHero } from '@/components/landing/Hero/LandingHero';
import { LandingHowItWorks } from '@/components/landing/LandingHowItWorks';
import { LandingNav } from '@/components/landing/LandingNav';
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
    <main
      dir={copy.dir}
      lang={lang}
      style={{ fontFamily: getLandingFontFamily(lang), background: COLORS.black }}
      className="min-h-screen text-white"
    >
      <LandingNav lang={lang} copy={copy} onLangChange={changeLang} />
      <LandingHero />
      <PeopleHomeRow lang={lang} />
      <LandingFeatures copy={copy} />
      <LandingHowItWorks copy={copy} />
      <LandingCta copy={copy} />
      <LandingFooter />
    </main>
  );
}

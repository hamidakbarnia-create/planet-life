'use client';

import { useState } from 'react';
import {
  acceptDisclaimer,
  DISCLAIMER_LANGS,
  isDisclaimerAccepted,
  resolveDisclaimerLang,
  type DisclaimerLang,
} from '@/lib/disclaimers';
import { BrandLogo } from '@/components/BrandLogo';
import type { BrandLang } from '@/lib/brand';

export function DisclaimerOnboarding({
  onAccepted,
}: {
  onAccepted: () => void;
}) {
  const [lang, setLang] = useState<DisclaimerLang>(() =>
    typeof window !== 'undefined' ? resolveDisclaimerLang() : 'en'
  );
  const [checked, setChecked] = useState(false);
  const [visible, setVisible] = useState(
    () => typeof window !== 'undefined' && !isDisclaimerAccepted()
  );

  if (!visible) return null;

  const t = DISCLAIMER_LANGS[lang];
  const fontFamily =
    lang === 'fa' || lang === 'ar' ? 'Vazirmatn, sans-serif' : 'Inter, sans-serif';

  const handleContinue = () => {
    if (!checked) return;
    acceptDisclaimer();
    setVisible(false);
    onAccepted();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        background: 'rgba(7,11,20,0.97)',
        direction: t.dir,
        fontFamily,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Inter:wght@300;400;500&display=swap');
        @import url('https://fonts.googleapis.com/earlyaccess/vazirmatn.css');
        .fc{font-family:'Cinzel',serif}
        .fi{font-family:'Inter',sans-serif}
      `}</style>

      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(251,191,36,0.25)',
          boxShadow: '0 0 40px rgba(251,191,36,0.08)',
        }}
      >
        <div className="flex justify-center mb-6">
          <BrandLogo lang={lang as BrandLang} href={null} size="md" showTagline={false} />
        </div>

        <h1
          className="fc text-center text-lg tracking-wide mb-4"
          style={{ color: '#fbbf24' }}
        >
          {t.onboardingTitle}
        </h1>

        <p
          className="fi text-sm leading-relaxed mb-6 text-center"
          style={{ color: 'rgba(255,255,255,0.72)' }}
        >
          {t.onboardingBody}
        </p>

        <label
          className="flex items-start gap-3 mb-6 cursor-pointer fi text-sm"
          style={{ color: 'rgba(255,255,255,0.65)' }}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1 accent-amber-400 shrink-0"
          />
          <span>{t.onboardingCheckbox}</span>
        </label>

        <div className="flex gap-2 justify-center mb-4">
          {(['en', 'ru', 'fa', 'ar'] as DisclaimerLang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => {
                setLang(l);
                localStorage.setItem('planet-life-lang', l);
              }}
              className="fi px-2 py-1 text-[10px] rounded border"
              style={
                lang === l
                  ? { borderColor: 'rgba(251,191,36,0.5)', color: '#fbbf24' }
                  : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)' }
              }
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={!checked}
          onClick={handleContinue}
          className="fc w-full py-3 rounded-xl text-sm tracking-widest disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg,#d97706,#f59e0b)',
            color: '#000',
          }}
        >
          {t.onboardingContinue}
        </button>
      </div>
    </div>
  );
}

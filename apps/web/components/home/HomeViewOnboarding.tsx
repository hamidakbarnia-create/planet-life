'use client';

import { useState } from 'react';
import type { HomeViewMode, AppLang } from '@/lib/app-settings';
import { HOME_LANGS } from '@/lib/home-i18n';

const OPTIONS: {
  mode: HomeViewMode;
  titleKey: 'optionA' | 'optionB' | 'optionC';
  descKey: 'optionADesc' | 'optionBDesc' | 'optionCDesc';
  icon: string;
}[] = [
  { mode: 'daily-brief', titleKey: 'optionA', descKey: 'optionADesc', icon: '☀' },
  { mode: 'calendar', titleKey: 'optionB', descKey: 'optionBDesc', icon: '▦' },
  { mode: 'heatmap', titleKey: 'optionC', descKey: 'optionCDesc', icon: '▤' },
];

export function HomeViewOnboarding({
  lang,
  onChoose,
}: {
  lang: AppLang;
  onChoose: (mode: HomeViewMode) => void;
}) {
  const t = HOME_LANGS[lang];
  const [selected, setSelected] = useState<HomeViewMode | null>(null);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(4,7,14,0.96)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(251,191,36,0.2)',
          direction: t.dir,
        }}
      >
        <h2 className="fc text-lg mb-2 text-center" style={{ color: '#fbbf24' }}>
          {t.onboardingTitle}
        </h2>
        <p className="fi text-sm text-center mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {t.onboardingSub}
        </p>

        <div className="space-y-3 mb-6">
          {OPTIONS.map((opt) => {
            const active = selected === opt.mode;
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => setSelected(opt.mode)}
                className="w-full text-start rounded-xl p-4 transition-all fi"
                style={{
                  background: active ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${active ? 'rgba(251,191,36,0.45)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{opt.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-white/90 mb-1">{t[opt.titleKey]}</div>
                    <div className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {t[opt.descKey]}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={!selected}
          onClick={() => selected && onChoose(selected)}
          className="w-full py-3 rounded-xl fc text-sm tracking-wide transition-opacity"
          style={{
            background: selected ? '#fbbf24' : 'rgba(251,191,36,0.2)',
            color: selected ? '#0A0E1A' : 'rgba(255,255,255,0.3)',
            cursor: selected ? 'pointer' : 'not-allowed',
          }}
        >
          {t.continueBtn}
        </button>
      </div>
    </div>
  );
}

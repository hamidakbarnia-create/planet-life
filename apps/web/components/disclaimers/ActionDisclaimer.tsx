'use client';

import { DISCLAIMER_LANGS, resolveDisclaimerLang, type DisclaimerLang } from '@/lib/disclaimers';

export function ActionDisclaimer({ lang }: { lang?: DisclaimerLang }) {
  const l = lang ?? resolveDisclaimerLang();
  const t = DISCLAIMER_LANGS[l];

  return (
    <p
      className="fi text-[10px] leading-relaxed mt-1.5 pl-1"
      style={{
        direction: t.dir,
        color: 'rgba(255,255,255,0.32)',
        borderInlineStart: '2px solid rgba(251,191,36,0.35)',
        paddingInlineStart: '8px',
      }}
    >
      {t.actionDisclaimer}
    </p>
  );
}

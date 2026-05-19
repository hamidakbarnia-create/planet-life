'use client';

import { DISCLAIMER_LANGS, resolveDisclaimerLang, type DisclaimerLang } from '@/lib/disclaimers';

export function ModuleDisclaimerBanner({
  onDismiss,
  lang,
}: {
  onDismiss: () => void;
  lang?: DisclaimerLang;
}) {
  const l = lang ?? resolveDisclaimerLang();
  const t = DISCLAIMER_LANGS[l];

  return (
    <div
      className="fade-up flex items-start gap-3 rounded-xl px-4 py-3 mb-4"
      style={{
        direction: t.dir,
        background: 'rgba(251,191,36,0.08)',
        border: '1px solid rgba(251,191,36,0.22)',
      }}
    >
      <span className="text-amber-400 text-sm shrink-0 mt-0.5" aria-hidden>
        ⓘ
      </span>
      <p
        className="fi flex-1 text-xs leading-relaxed"
        style={{ color: 'rgba(255,255,255,0.65)' }}
      >
        {t.moduleWarning}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 text-white/40 hover:text-white text-lg leading-none px-1"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

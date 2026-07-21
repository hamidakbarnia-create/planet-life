'use client';

import { useMemo } from 'react';
import { AskDecisionView } from '@/components/ask/AskDecisionView';
import { englishProviderResult } from '@/lib/ask-decision/english-provider-result.fixture';
import type { AppLang } from '@/lib/app-settings';

const FORBIDDEN = [
  'ANALYSIS',
  'RECOMMENDATION',
  'CONFIDENCE',
  'GATHER MORE INFORMATION',
  'BUSINESS',
  'Main Factors',
  'Market Premise and Readiness',
  'Opportunities',
  'Trade-offs',
  'Personal Fit',
  'Objective:',
  'Reversibility:',
  'Unknown — reversibility not stated',
];

export function LocaleDecisionProofClient({ lang }: { lang: AppLang }) {
  const scan = useMemo(() => {
    // Client-side DOM scan after paint is driven by the page script below.
    return FORBIDDEN;
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4" data-testid="locale-decision-proof">
      <p className="fi text-xs text-white/50 mb-4" data-testid="proof-lang">
        locale={lang} · provider fixture=english · checklist={scan.length}
      </p>
      <AskDecisionView result={englishProviderResult} lang={lang} />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__LOCALE_PROOF_FORBIDDEN__=${JSON.stringify(FORBIDDEN)};`,
        }}
      />
    </div>
  );
}

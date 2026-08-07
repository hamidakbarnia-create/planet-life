import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DecisionPackageView } from './DecisionPackageView';
import { bindDemoStubPackage } from '@/lib/decision-case';
import { getAskProductCopy } from '@/lib/ask-product';

afterEach(() => cleanup());

function blockedPkg() {
  const base = bindDemoStubPackage({
    caseId: '11111111-1111-4111-8111-111111111111',
    caseVersion: 2,
    intake: { target_date: '2026-08-18', role: 'Engineer' },
  });
  return {
    ...base,
    engine_id: 'decision-engine-car-interview-v1',
    recommendation: {
      stance: 'insufficient_data' as const,
      conditions: ['Add birth date, birth time, and birth location evidence'],
      summary: 'Cannot evaluate without natal evidence.',
    },
    timing: {
      material: false,
      band: 'na' as const,
      score: null,
      candidates: [
        { date: '2026-08-18', rank: 1, score: 0, band: 'low' as const },
      ],
      notes: 'Timing not evaluated',
    },
    confidence: {
      value: 0,
      precision_level: 'L3' as const,
      penalties: [
        {
          code: 'MISSING_NATAL_EVIDENCE',
          message: 'Birth date/time/location evidence is required.',
        },
      ],
    },
  };
}

describe('blocked result locales', () => {
  it.each(['en', 'fa', 'ar', 'ru'] as const)(
    'shows localized blocked chrome for %s without verdict/engine terms',
    (lang) => {
      const copy = getAskProductCopy(lang);
      render(
        <DecisionPackageView
          package={blockedPkg()}
          dqStatus="blocked"
          caseId="case-blocked-1"
          lang={lang}
        />
      );
      const root = screen.getByTestId('decision-package-blocked');
      expect(root.getAttribute('dir')).toBe(copy.dir);
      expect(screen.getByText(copy.blockedTitle)).toBeTruthy();
      expect(screen.getByText(copy.blockedNatalItem)).toBeTruthy();
      expect(screen.getByText(copy.blockedAddEvidence)).toBeTruthy();
      expect(screen.queryByTestId('evaluate-product-result')).toBeNull();
      expect(root.textContent).not.toMatch(/engine_id|dq_status/i);
      expect(root.textContent).not.toMatch(/\bUnknown\b/);
      expect(root.textContent).not.toMatch(/\/\s*100/);
      if (lang !== 'en') {
        expect(root.textContent).not.toMatch(
          /More information is needed before METIORO can evaluate/i
        );
      }
    }
  );
});

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AskDecisionView } from '@/components/ask/AskDecisionView';
import { englishProviderResult } from '@/lib/ask-decision/english-provider-result.fixture';

const FORBIDDEN_EN = [
  'ANALYSIS',
  'RECOMMENDATION',
  'CONFIDENCE',
  'GATHER MORE INFORMATION',
  'Main Factors',
  'Market Premise and Readiness',
  'Opportunities',
  'Trade-offs',
  'Personal Fit',
  'Objective:',
  'Reversibility:',
  'Unknown — reversibility not stated',
];

describe('AskDecisionView locale presentation', () => {
  afterEach(() => {
    cleanup();
  });

  it.each(['fa', 'ar', 'ru'] as const)(
    'renders no forbidden English Decision chrome for %s',
    (lang) => {
      const { container } = render(
        <AskDecisionView result={englishProviderResult} lang={lang} />
      );
      const text = container.textContent ?? '';
      for (const forbidden of FORBIDDEN_EN) {
        expect(text, forbidden).not.toContain(forbidden);
      }
      expect(
        screen.getByTestId('ask-decision-engine').getAttribute('data-lang')
      ).toBe(lang);
      expect(
        screen.getByTestId('ask-recommendation-status').textContent
      ).not.toMatch(/gather more information/i);
      expect(
        screen.getByTestId('ask-confidence-level').textContent
      ).not.toMatch(/^medium/i);
    }
  );
});

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

import { VaultConfidentialReading } from './VaultConfidentialReading';
import { VAULT_READING_PRESENTATION_COPY } from '@/lib/vault-reading-presentation';
import type { VaultReadingLayer } from '@/lib/vault-reading';

afterEach(() => {
  cleanup();
});

const READING: VaultReadingLayer = {
  executive:
    'High-voltage attraction. Mars in Aries. Action: Choose one pursuit today and drop the rest.',
  strategic:
    'Mars square Pluto: power struggles in intimacy. You can magnetize dangerous dynamics — choose consciously. What this changes today: your desire pattern is a filter — use it before you invest. Action: Choose one pursuit today and drop the rest.',
  technical: 'Mars 15.0° Aries · house 1 · dignity: rulership',
  headline: 'High-voltage attraction',
  action: 'Choose one pursuit today and drop the rest',
  confidence: 'high',
};

const labels = VAULT_READING_PRESENTATION_COPY.en;

describe('VaultConfidentialReading', () => {
  it('places the hero before the optional windows slot', () => {
    const { container } = render(
      <VaultConfidentialReading
        lang="en"
        reading={READING}
        labels={labels}
        windowsSlot={<div data-testid="windows-slot-probe">windows</div>}
      />
    );
    const root = screen.getByTestId('vault-confidential-reading');
    const hero = screen.getByTestId('vault-reading-hero');
    const windows = screen.getByTestId('vault-reading-windows');
    const children = Array.from(root.children);
    expect(children.indexOf(hero)).toBeLessThan(children.indexOf(windows));
    expect(screen.getByTestId('windows-slot-probe')).toBeTruthy();
    expect(container.textContent).not.toContain(READING.technical);
  });

  it('renders identical opportunity/action/next-step content once in the main flow', () => {
    render(
      <VaultConfidentialReading lang="en" reading={READING} labels={labels} />
    );
    const root = screen.getByTestId('vault-confidential-reading');
    const why = screen.getByTestId('vault-reading-why-bullets').textContent ?? '';
    expect(why).not.toMatch(/Choose one pursuit today and drop the rest/i);
    expect(screen.queryByTestId('vault-reading-deep-practicalNextStep')).toBeNull();
    // Hero summary + action checklist may both surface the primary action;
    // there must be no third opportunity/next-step copy of the same line.
    const matches =
      root.textContent?.match(/Choose one pursuit today and drop the rest/g) ??
      [];
    expect(matches.length).toBe(2);
  });

  it('keeps distinct content and preserves overflow in Deep Reading', () => {
    const longReading: VaultReadingLayer = {
      executive:
        'Line one for the decision. Line two explains the context. Line three adds timing. Line four covers tone. Line five is overflow. Line six stays available.',
      strategic:
        'Line one for the decision. Line two explains the context. Line three adds timing. Line four covers tone. Line five is overflow. Line six stays available. Opportunity: Unique opening that is not the action. Action: Take the unique action path. Avoid: Skip the first trap. Skip the second trap. Skip the third trap. Skip the fourth trap. Skip the fifth trap.',
      technical: 'ignored',
      headline: 'Line one for the decision',
      action: 'Take the unique action path',
      avoid:
        'Skip the first trap. Skip the second trap. Skip the third trap. Skip the fourth trap. Skip the fifth trap.',
      confidence: 'medium',
    };

    render(
      <VaultConfidentialReading lang="en" reading={longReading} labels={labels} />
    );

    const why = screen.getByTestId('vault-reading-why-bullets');
    expect(why.querySelectorAll('li').length).toBeLessThanOrEqual(4);

    const avoid = screen.getByTestId('vault-reading-avoid-items');
    expect(avoid.querySelectorAll('li').length).toBeLessThanOrEqual(4);

    const deep = screen.getByTestId('vault-reading-deep');
    expect(deep).toBeTruthy();
    expect(deep.textContent).toMatch(/Line five is overflow|Line six stays available/i);
    expect(deep.textContent).toMatch(/fifth trap/i);
    expect(screen.getByTestId('vault-confidential-reading').textContent).toMatch(
      /Unique opening that is not the action/i
    );
    expect(screen.getByTestId('vault-confidential-reading').textContent).toContain(
      'Take the unique action path'
    );
  });

  it('maps high, medium, and low confidence to existing semantic levels only', () => {
    const { rerender } = render(
      <VaultConfidentialReading
        lang="en"
        reading={{ ...READING, confidence: 'high' }}
        labels={labels}
        confidenceLabel="Advisory confidence: Higher"
      />
    );
    expect(
      screen.getByTestId('vault-reading-confidence-bar').getAttribute('data-confidence-level')
    ).toBe('high');

    rerender(
      <VaultConfidentialReading
        lang="en"
        reading={{ ...READING, confidence: 'medium' }}
        labels={labels}
      />
    );
    expect(
      screen.getByTestId('vault-reading-confidence-bar').getAttribute('data-confidence-level')
    ).toBe('medium');

    rerender(
      <VaultConfidentialReading
        lang="en"
        reading={{ ...READING, confidence: 'low' }}
        labels={labels}
      />
    );
    expect(
      screen.getByTestId('vault-reading-confidence-bar').getAttribute('data-confidence-level')
    ).toBe('low');
  });

  it('uses existing localized labels for section headings', () => {
    render(
      <VaultConfidentialReading lang="en" reading={READING} labels={labels} />
    );
    const root = screen.getByTestId('vault-confidential-reading');
    expect(root.textContent).toContain(labels.overallSituation);
    expect(root.textContent).toContain(labels.recommendedActions);
    expect(root.textContent).toContain(labels.thingsToAvoid);
    expect(root.textContent).toContain(labels.mainRisk);
    expect(
      within(screen.getByTestId('vault-reading-section-overallSituation')).getByText(
        labels.overallSituation
      )
    ).toBeTruthy();
  });

  it('hides producer / engine vocabulary from the visible reading', () => {
    render(
      <VaultConfidentialReading lang="en" reading={READING} labels={labels} />
    );
    const root = screen.getByTestId('vault-confidential-reading');
    expect(root.textContent?.toLowerCase()).not.toMatch(
      /\bmars\b|\bsquare\b|\bpluto\b|\baries\b|\bdignity\b|\bhouse\b/
    );
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

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
};

describe('VaultConfidentialReading', () => {
  it('renders six decision sections and hides technical producer text', () => {
    render(
      <VaultConfidentialReading
        lang="en"
        reading={READING}
        labels={VAULT_READING_PRESENTATION_COPY.en}
      />
    );

    expect(screen.getByTestId('vault-confidential-reading')).toBeTruthy();
    expect(screen.getByTestId('vault-reading-section-overallSituation')).toBeTruthy();
    expect(screen.getByTestId('vault-reading-section-mainOpportunity')).toBeTruthy();
    expect(screen.getByTestId('vault-reading-section-mainRisk')).toBeTruthy();
    expect(screen.getByTestId('vault-reading-section-recommendedActions')).toBeTruthy();
    expect(screen.getByTestId('vault-reading-section-thingsToAvoid')).toBeTruthy();
    expect(screen.getByTestId('vault-reading-section-practicalNextStep')).toBeTruthy();

    const root = screen.getByTestId('vault-confidential-reading');
    expect(root.textContent).toContain('Overall situation');
    expect(root.textContent).toContain('Choose one pursuit');
    expect(root.textContent?.toLowerCase()).not.toMatch(
      /\bmars\b|\bsquare\b|\bpluto\b|\baries\b|\bdignity\b|\bhouse\b/
    );
    expect(root.textContent).not.toContain(READING.technical);
  });
});

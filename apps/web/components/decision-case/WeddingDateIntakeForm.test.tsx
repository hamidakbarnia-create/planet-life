import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WeddingDateIntakeForm } from './WeddingDateIntakeForm';
import { getAskProductCopy } from '@/lib/ask-product';

afterEach(() => cleanup());

describe('WeddingDateIntakeForm', () => {
  it('renders required wedding date and ceremony type fields', () => {
    const copy = getAskProductCopy('en');
    render(
      <WeddingDateIntakeForm
        lang="en"
        submitting={false}
        onSubmitAnswers={vi.fn()}
        onComplete={vi.fn()}
      />
    );
    expect(screen.getByTestId('wedding-date-intake-form')).toBeTruthy();
    expect(screen.getByTestId('intake-target_date')).toBeTruthy();
    expect(screen.getByTestId('intake-ceremony_type')).toBeTruthy();
    const status = screen.getByTestId('intake-status').textContent ?? '';
    expect(status).toContain(copy.intakeFieldWeddingDate);
    expect(status).toContain(copy.intakeFieldCeremonyType);
    expect(status).not.toMatch(/\bceremony_type\b/);
  });

  it('prefills target_date without inventing ceremony_type', () => {
    render(
      <WeddingDateIntakeForm
        lang="en"
        initialIntake={{ target_date: '2026-10-10' }}
        submitting={false}
        onSubmitAnswers={vi.fn()}
        onComplete={vi.fn()}
      />
    );
    const date = screen.getByTestId('intake-target_date') as HTMLInputElement;
    const ceremony = screen.getByTestId(
      'intake-ceremony_type'
    ) as HTMLSelectElement;
    expect(date.value).toBe('2026-10-10');
    expect(ceremony.value).toBe('');
  });
});

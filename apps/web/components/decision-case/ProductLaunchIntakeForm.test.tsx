import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProductLaunchIntakeForm } from './ProductLaunchIntakeForm';
import { getAskProductCopy } from '@/lib/ask-product';

afterEach(() => cleanup());

describe('ProductLaunchIntakeForm', () => {
  it('shows required launch fields', () => {
    const copy = getAskProductCopy('en');
    render(
      <ProductLaunchIntakeForm
        lang="en"
        onSubmitAnswers={vi.fn()}
        onComplete={vi.fn()}
      />
    );
    expect(screen.getByTestId('product-launch-intake-form')).toBeTruthy();
    const status = screen.getByTestId('intake-status').textContent ?? '';
    expect(status).toContain(copy.intakeFieldLaunchDate);
    expect(status).toContain(copy.intakeFieldLaunchObject);
  });

  it('enables complete when required fields are present', () => {
    render(
      <ProductLaunchIntakeForm
        lang="en"
        initialIntake={{
          target_date: '2026-11-05',
          launch_object: 'mobile app v2',
        }}
        onSubmitAnswers={vi.fn()}
        onComplete={vi.fn()}
      />
    );
    expect(
      (screen.getByTestId('intake-complete') as HTMLButtonElement).disabled
    ).toBe(false);
  });

  it('hides target_date for find_dates and completes with launch_object only', () => {
    const copy = getAskProductCopy('en');
    render(
      <ProductLaunchIntakeForm
        lang="en"
        caseMode="find_dates"
        initialIntake={{ launch_object: 'mobile app v2' }}
        onSubmitAnswers={vi.fn()}
        onComplete={vi.fn()}
      />
    );
    expect(screen.queryByTestId('intake-target_date')).toBeNull();
    expect(
      (screen.getByTestId('intake-complete') as HTMLButtonElement).disabled
    ).toBe(false);
    expect(screen.getByTestId('product-launch-intake-form').getAttribute('data-mode')).toBe(
      'find_dates'
    );
    expect(screen.getByTestId('intake-complete').textContent).toBe(
      copy.intakeCompleteFind
    );
    expect(screen.getByTestId('intake-complete').textContent).not.toBe(
      copy.intakeComplete
    );
    expect(screen.getByTestId('intake-complete').textContent).not.toMatch(
      /evaluation/i
    );
  });

  it('evaluate mode keeps Continue to evaluation CTA', () => {
    const copy = getAskProductCopy('en');
    render(
      <ProductLaunchIntakeForm
        lang="en"
        caseMode="evaluate_date"
        initialIntake={{
          target_date: '2026-11-05',
          launch_object: 'mobile app v2',
        }}
        onSubmitAnswers={vi.fn()}
        onComplete={vi.fn()}
      />
    );
    expect(screen.getByTestId('intake-complete').textContent).toBe(
      copy.intakeComplete
    );
  });
});

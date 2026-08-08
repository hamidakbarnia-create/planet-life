import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CarInterviewIntakeForm } from './CarInterviewIntakeForm';
import { getAskProductCopy } from '@/lib/ask-product';

afterEach(() => cleanup());

describe('CarInterviewIntakeForm field labels', () => {
  it.each(['en', 'fa', 'ar', 'ru'] as const)(
    'never shows raw target_date / role ids in %s status',
    (lang) => {
      const copy = getAskProductCopy(lang);
      render(
        <CarInterviewIntakeForm
          lang={lang}
          submitting={false}
          onSubmitAnswers={vi.fn()}
          onComplete={vi.fn()}
        />
      );
      const status = screen.getByTestId('intake-status').textContent ?? '';
      expect(status).not.toMatch(/\btarget_date\b/);
      expect(status).not.toMatch(/\brole\b/);
      expect(status).toContain(copy.intakeFieldTargetDate);
      expect(status).toContain(copy.intakeFieldRole);
    }
  );
});

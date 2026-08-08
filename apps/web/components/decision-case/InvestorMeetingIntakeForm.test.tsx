import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InvestorMeetingIntakeForm } from './InvestorMeetingIntakeForm';
import { getAskProductCopy } from '@/lib/ask-product';

afterEach(() => cleanup());

describe('InvestorMeetingIntakeForm', () => {
  it('renders required meeting date and meeting goal fields', () => {
    const copy = getAskProductCopy('en');
    render(
      <InvestorMeetingIntakeForm
        lang="en"
        submitting={false}
        onSubmitAnswers={vi.fn()}
        onComplete={vi.fn()}
      />
    );
    expect(screen.getByTestId('investor-meeting-intake-form')).toBeTruthy();
    expect(screen.getByTestId('intake-target_date')).toBeTruthy();
    expect(screen.getByTestId('intake-meeting_goal')).toBeTruthy();
    expect(screen.getByTestId('intake-investor_name')).toBeTruthy();
    expect(screen.getByTestId('intake-meeting_type')).toBeTruthy();
    const status = screen.getByTestId('intake-status').textContent ?? '';
    expect(status).toContain(copy.intakeFieldMeetingDate);
    expect(status).toContain(copy.intakeFieldMeetingGoal);
    expect(status).not.toMatch(/\bmeeting_goal\b/);
    expect(status).not.toContain(copy.intakeFieldRole);
  });

  it('prefills target_date from initialIntake without inventing meeting_goal', () => {
    render(
      <InvestorMeetingIntakeForm
        lang="en"
        initialIntake={{ target_date: '2026-08-18' }}
        submitting={false}
        onSubmitAnswers={vi.fn()}
        onComplete={vi.fn()}
      />
    );
    const date = screen.getByTestId('intake-target_date') as HTMLInputElement;
    const goal = screen.getByTestId('intake-meeting_goal') as HTMLInputElement;
    expect(date.value).toBe('2026-08-18');
    expect(goal.value).toBe('');
  });
});

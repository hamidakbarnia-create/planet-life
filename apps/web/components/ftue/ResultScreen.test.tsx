import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ResultScreen } from '@/components/ftue/ResultScreen';
import {
  getAskQuestionRepository,
  resetAskQuestionRepositoryForTests,
} from '@/lib/ask-question-repository';
import { saveSession } from '@/lib/auth';
import { getResultCopy } from '@/lib/ftue-i18n';
import type { AppLang } from '@/lib/app-settings';
import { isFtueComplete } from '@/lib/ftue-storage';
import { getProfileRepository, resetProfileRepositoryForTests } from '@/lib/profile';

const replace = vi.fn();
const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push }),
}));

function renderResult(lang: AppLang = 'en') {
  return render(<ResultScreen copy={getResultCopy(lang)} lang={lang} />);
}

describe('ResultScreen', () => {
  const sampleProfile = {
    birth_date: '1990-06-15',
    birth_time: '14:30',
    birth_place: {
      name: 'New York, New York, United States',
      short: 'New York',
      lat: 40.7128,
      lon: -74.006,
    },
    name: 'Alex',
    action_type: 'business_launch',
  };

  const sampleQuestion = {
    text: 'What should I focus on in my career this week?',
    submitted_at: Date.now(),
    source: 'typed' as const,
  };

  beforeEach(() => {
    localStorage.clear();
    resetProfileRepositoryForTests();
    resetAskQuestionRepositoryForTests();
    replace.mockClear();
    push.mockClear();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    saveSession({ method: 'email', identifier: 'user@test.com', verifiedAt: Date.now() });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    resetProfileRepositoryForTests();
    resetAskQuestionRepositoryForTests();
  });

  it('renders Result screen when profile and question exist', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(sampleQuestion);
    renderResult('en');

    expect(
      await screen.findByRole('heading', { name: /your first metioro insight/i })
    ).toBeTruthy();
    expect(screen.getByText(sampleQuestion.text)).toBeTruthy();
    expect(screen.getByText(/early preview/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /complete onboarding/i })).toBeTruthy();
  });

  it('redirects to profile onboarding when birth profile is missing', async () => {
    getAskQuestionRepository().saveQuestion(sampleQuestion);
    renderResult('en');

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/profile?onboarding=1');
    });

    const queue = localStorage.getItem('planet-life-ftue-events');
    expect(queue).toContain('ftue.result.missing_profile');
  });

  it('redirects to ask when question is missing', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    renderResult('en');

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/ask');
    });

    const queue = localStorage.getItem('planet-life-ftue-events');
    expect(queue).toContain('ftue.result.missing_question');
  });

  it('displays the static insight text', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(sampleQuestion);
    renderResult('en');

    expect(
      await screen.findByText(
        /today is best used for clarity, prioritization, and one deliberate action/i
      )
    ).toBeTruthy();
  });

  it('marks FTUE complete and navigates to /home on completion', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(sampleQuestion);
    renderResult('en');

    fireEvent.click(await screen.findByRole('button', { name: /complete onboarding/i }));

    expect(isFtueComplete()).toBe(true);
    expect(push).toHaveBeenCalledWith('/home');
  });

  it('fires analytics events on view and completion', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(sampleQuestion);
    renderResult('en');

    await screen.findByRole('heading', { name: /your first metioro insight/i });

    let queue = localStorage.getItem('planet-life-ftue-events');
    expect(queue).toContain('ftue.result.view');
    expect(queue).toContain('ftue.result.started');

    fireEvent.click(screen.getByRole('button', { name: /complete onboarding/i }));
    queue = localStorage.getItem('planet-life-ftue-events');
    expect(queue).toContain('ftue.result.completed');
  });

  it('updates copy when parent passes a new locale', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(sampleQuestion);
    const { rerender } = renderResult('en');
    await screen.findByRole('heading', { name: /your first metioro insight/i });

    rerender(<ResultScreen copy={getResultCopy('fa')} lang="fa" />);

    expect(screen.getByRole('heading', { name: /اولین بینش METIORO شما/i })).toBeTruthy();
    expect(screen.getByText(/پیش‌نمایش اولیه/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /تکمیل فرآیند شروع/i })).toBeTruthy();
  });
});

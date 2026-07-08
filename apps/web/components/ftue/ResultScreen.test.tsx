import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ResultScreen } from '@/components/ftue/ResultScreen';
import {
  getAskQuestionRepository,
  resetAskQuestionRepositoryForTests,
} from '@/lib/ask-question-repository';
import { saveSession } from '@/lib/auth';
import type { AppLang } from '@/lib/app-settings';
import { isFtueComplete } from '@/lib/ftue-storage';
import { getProfileRepository, resetProfileRepositoryForTests } from '@/lib/profile';
import { buildResultShareText, getResultCopy } from '@/lib/ftue-i18n';
import { fetchValidatedResultChart } from '@/lib/chart-api';
import { RAFSANJAN_CHART } from '@/lib/chart-fixtures';

const replace = vi.fn();
const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push }),
}));

vi.mock('@/lib/chart-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/chart-api')>();
  return {
    ...actual,
    fetchValidatedResultChart: vi.fn(),
  };
});

const mockFetchValidatedResultChart = vi.mocked(fetchValidatedResultChart);

function renderResult(lang: AppLang = 'en') {
  return render(<ResultScreen lang={lang} />);
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
    mockFetchValidatedResultChart.mockResolvedValue(null);
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
      await screen.findByRole('heading', { name: /your journey begins/i })
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

    await screen.findByRole('heading', { name: /your journey begins/i });

    await waitFor(() => {
      const queue = localStorage.getItem('planet-life-ftue-events');
      expect(queue).toContain('ftue.result.view');
      expect(queue).toContain('ftue.result.started');
    });

    fireEvent.click(screen.getByRole('button', { name: /complete onboarding/i }));
    await waitFor(() => {
      const queue = localStorage.getItem('planet-life-ftue-events');
      expect(queue).toContain('ftue.result.completed');
    });
  });

  it('localizes a stored suggestion when the active locale changes', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion({
      submitted_at: Date.now(),
      source: 'suggestion',
      suggestion_id: 'career',
    });
    const { rerender } = renderResult('en');
    await screen.findByRole('heading', { name: /your journey begins/i });
    expect(
      screen.getByText('What should I focus on in my career this week?')
    ).toBeTruthy();

    rerender(<ResultScreen lang="fa" />);

    expect(
      screen.getByText('این هفته روی چه چیزی در مسیر شغلی‌ام تمرکز کنم؟')
    ).toBeTruthy();
  });

  it('keeps typed question text when the active locale changes', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion({
      submitted_at: Date.now(),
      source: 'typed',
      text: 'My own question in English',
    });
    const { rerender } = renderResult('en');
    await screen.findByRole('heading', { name: /your journey begins/i });
    expect(screen.getByText('My own question in English')).toBeTruthy();

    rerender(<ResultScreen lang="fa" />);

    expect(screen.getByText('My own question in English')).toBeTruthy();
  });

  it('updates copy when the active locale changes', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(sampleQuestion);
    const { rerender } = renderResult('en');
    await screen.findByRole('heading', { name: /your journey begins/i });

    rerender(<ResultScreen lang="fa" />);

    expect(screen.getByRole('heading', { name: /آغاز مسیر شما/i })).toBeTruthy();
    expect(screen.getByText(/پیش‌نمایش اولیه/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /تکمیل فرآیند شروع/i })).toBeTruthy();
  });

  it('localizes the loading label when the active locale changes', () => {
    const { rerender } = renderResult('en');
    expect(screen.getByText('Loading…')).toBeTruthy();

    rerender(<ResultScreen lang="fa" />);
    expect(screen.getByText('در حال بارگذاری…')).toBeTruthy();
  });

  it('shows a localized empty chart state when chart data is unavailable', async () => {
    mockFetchValidatedResultChart.mockResolvedValue(null);
    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(sampleQuestion);
    renderResult('en');

    expect(await screen.findByText(/chart preview unavailable/i)).toBeTruthy();
    expect(document.querySelector('[data-result-chart="empty"]')).toBeTruthy();
  });

  it('shows a localized loading chart state before chart data resolves', async () => {
    mockFetchValidatedResultChart.mockImplementation(
      () => new Promise(() => {})
    );
    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(sampleQuestion);
    renderResult('en');

    await screen.findByRole('heading', { name: /your journey begins/i });
    expect(screen.getByText(/loading your chart/i)).toBeTruthy();
    expect(document.querySelector('[data-result-chart="loading"]')).toBeTruthy();
  });

  it('renders the chart when validated chart data is available', async () => {
    mockFetchValidatedResultChart.mockResolvedValue(RAFSANJAN_CHART);
    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(sampleQuestion);
    renderResult('en');

    await waitFor(() => {
      expect(document.querySelector('[data-result-chart="ready"]')).toBeTruthy();
    });
    expect(screen.getByRole('heading', { name: /your journey begins/i })).toBeTruthy();
  });

  it('does not crash when chart data is incomplete', async () => {
    mockFetchValidatedResultChart.mockResolvedValue({
      ...RAFSANJAN_CHART,
      planets: {},
    });
    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(sampleQuestion);
    renderResult('en');

    expect(await screen.findByText(/chart preview unavailable/i)).toBeTruthy();
  });

  it('uses the new localized title in each language', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(sampleQuestion);

    const { rerender } = renderResult('en');
    expect(await screen.findByRole('heading', { name: 'Your Journey Begins' })).toBeTruthy();

    rerender(<ResultScreen lang="fa" />);
    expect(screen.getByRole('heading', { name: 'آغاز مسیر شما' })).toBeTruthy();

    rerender(<ResultScreen lang="ar" />);
    expect(screen.getByRole('heading', { name: 'بداية رحلتك' })).toBeTruthy();

    rerender(<ResultScreen lang="ru" />);
    expect(screen.getByRole('heading', { name: 'Начало вашего пути' })).toBeTruthy();
  });

  it('shares only safe insight content without profile or location fields', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share });

    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(sampleQuestion);
    renderResult('en');

    fireEvent.click(await screen.findByRole('button', { name: /share insight/i }));

    await waitFor(() => {
      expect(share).toHaveBeenCalled();
    });

    const payload = share.mock.calls[0][0] as { title: string; text: string };
    expect(payload.title).toBe('Your Journey Begins');
    expect(payload.text).toBe(buildResultShareText(getResultCopy('en'), sampleQuestion.text));
    expect(payload.text).not.toMatch(/New York|40\.7128|1990-06-15|14:30|Alex|United States/i);

    vi.unstubAllGlobals();
  });
});

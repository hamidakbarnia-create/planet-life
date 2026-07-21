import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AskScreen } from '@/components/ftue/AskScreen';
import {
  getAskQuestionRepository,
  resetAskQuestionRepositoryForTests,
} from '@/lib/ask-question-repository';
import { saveSession } from '@/lib/auth';
import { getAskCopy } from '@/lib/ftue-i18n';
import type { AppLang } from '@/lib/app-settings';
import { getProfileRepository, resetProfileRepositoryForTests } from '@/lib/profile';
import { questionsByCategory } from '@/lib/question-library';

const replace = vi.fn();
const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push }),
}));

function renderAsk(lang: AppLang = 'en') {
  return render(<AskScreen copy={getAskCopy(lang)} lang={lang} />);
}

function clickCareerFocusQuestion() {
  fireEvent.click(
    screen.getByRole('button', {
      name: /what should i focus on in my career this week/i,
    })
  );
}

function getCategoryTab(name: RegExp) {
  return screen.getByRole('tab', { name });
}

describe('AskScreen', () => {
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

  it('renders the Ask screen', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    renderAsk('en');

    expect(await screen.findByRole('heading', { name: /ask metioro/i })).toBeTruthy();
    expect(screen.getByLabelText(/your question/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /get guidance/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /career & work/i })).toBeTruthy();
  });

  it('redirects to profile onboarding when birth profile is missing', async () => {
    renderAsk('en');

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/profile?onboarding=1');
    });
  });

  it('disables submit when the question is empty', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    renderAsk('en');

    const submit = await screen.findByRole('button', { name: /get guidance/i });
    expect(submit).toHaveProperty('disabled', true);
  });

  it('enables submit after typing a question', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    renderAsk('en');

    const input = await screen.findByLabelText(/your question/i);
    fireEvent.change(input, { target: { value: 'What should I do today?' } });

    const submit = screen.getByRole('button', { name: /get guidance/i });
    expect(submit).toHaveProperty('disabled', false);
  });

  it('shows eight questions for the selected category', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    renderAsk('en');
    await screen.findByRole('tab', { name: /career & work/i });

    const careerQuestions = questionsByCategory('career-work');
    for (const guided of careerQuestions) {
      expect(
        screen.getByRole('button', { name: new RegExp(guided.labels.en, 'i') })
      ).toBeTruthy();
    }

    fireEvent.click(getCategoryTab(/love & people/i));
    const relationshipQuestions = questionsByCategory('relationships');
    for (const guided of relationshipQuestions) {
      expect(
        screen.getByRole('button', { name: new RegExp(guided.labels.en, 'i') })
      ).toBeTruthy();
    }
    expect(
      screen.queryByRole('button', { name: /what should i focus on in my career this week/i })
    ).toBeNull();
  });

  it('fills the textbox when a guided question is clicked', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    renderAsk('en');
    await screen.findByRole('tab', { name: /career & work/i });

    clickCareerFocusQuestion();

    const input = screen.getByLabelText(/your question/i) as HTMLTextAreaElement;
    expect(input.value).toBe('What should I focus on in my career this week?');
  });

  it('stores a suggestion by id without locale-specific text', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    renderAsk('en');
    await screen.findByRole('tab', { name: /career & work/i });

    clickCareerFocusQuestion();
    fireEvent.click(screen.getByRole('button', { name: /get guidance/i }));

    const stored = getAskQuestionRepository().loadQuestion();
    expect(stored?.source).toBe('suggestion');
    expect(stored?.suggestion_id).toBe('career-focus-week');
    expect(stored?.text).toBeUndefined();
    expect(push).toHaveBeenCalledWith('/result');
  });

  it('stores edited suggestion text as typed', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    renderAsk('en');
    await screen.findByRole('tab', { name: /career & work/i });

    clickCareerFocusQuestion();
    const input = screen.getByLabelText(/your question/i);
    fireEvent.change(input, { target: { value: 'Custom career question' } });
    fireEvent.click(screen.getByRole('button', { name: /get guidance/i }));

    const stored = getAskQuestionRepository().loadQuestion();
    expect(stored?.source).toBe('typed');
    expect(stored?.text).toBe('Custom career question');
    expect(stored?.suggestion_id).toBeUndefined();
  });

  it('stores the question and navigates to /result on submit', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    renderAsk('en');

    const input = await screen.findByLabelText(/your question/i);
    fireEvent.change(input, { target: { value: 'What should I do today?' } });
    fireEvent.click(screen.getByRole('button', { name: /get guidance/i }));

    const stored = getAskQuestionRepository().loadQuestion();
    expect(stored?.text).toBe('What should I do today?');
    expect(stored?.source).toBe('typed');
    expect(push).toHaveBeenCalledWith('/result');
  });

  it('fires analytics events on view, interaction, and submit', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    renderAsk('en');

    await screen.findByRole('heading', { name: /ask metioro/i });

    await waitFor(() => {
      const queue = localStorage.getItem('planet-life-ftue-events');
      expect(queue).toContain('ftue.ask.view');
    });

    const input = screen.getByLabelText(/your question/i);
    fireEvent.change(input, { target: { value: 'Test question' } });

    await waitFor(() => {
      const queue = localStorage.getItem('planet-life-ftue-events');
      expect(queue).toContain('ftue.ask.started');
    });

    fireEvent.click(getCategoryTab(/love & people/i));
    fireEvent.click(
      screen.getByRole('button', {
        name: /how can i strengthen an important relationship right now/i,
      })
    );
    await waitFor(() => {
      const queue = localStorage.getItem('planet-life-ftue-events');
      expect(queue).toContain('ftue.ask.question_selected');
    });

    fireEvent.click(screen.getByRole('button', { name: /get guidance/i }));
    await waitFor(() => {
      const queue = localStorage.getItem('planet-life-ftue-events');
      expect(queue).toContain('ftue.ask.submitted');
    });
  });

  it('updates category labels when parent passes a new locale', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    const { rerender } = renderAsk('en');
    await screen.findByRole('tab', { name: /career & work/i });

    rerender(<AskScreen copy={getAskCopy('fa')} lang="fa" />);

    expect(screen.getByRole('heading', { name: /از METIORO بپرسید/i })).toBeTruthy();
    expect(screen.getByLabelText(/پرسش شما/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /دریافت راهنمایی/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /مسیر شغلی و کار/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /عشق و افراد/i })).toBeTruthy();
  });

  it('localizes Ask intro, example chips, and keeps English decision-style tags for fa', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    renderAsk('fa');

    expect(
      await screen.findByText(
        /Ask سؤال شما را به هوش تصمیم ساخت‌یافته تبدیل می‌کند/
      )
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /آیا باید این پیشنهاد شغلی را بپذیرم؟/ })
    ).toBeTruthy();
    expect(
      screen.queryByText(/Ask turns your question into structured decision intelligence/i)
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: /Should I accept this job offer/i })
    ).toBeNull();
  });

  it('updates question labels when parent passes a new locale', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    const { rerender } = renderAsk('en');
    await screen.findByRole('tab', { name: /career & work/i });
    clickCareerFocusQuestion();

    rerender(<AskScreen copy={getAskCopy('fa')} lang="fa" />);

    const input = screen.getByLabelText(/پرسش شما/i) as HTMLTextAreaElement;
    expect(input.value).toBe('این هفته روی چه چیزی در مسیر شغلی‌ام تمرکز کنم؟');
    expect(
      screen.getByRole('button', {
        name: /این هفته روی چه چیزی در مسیر شغلی‌ام تمرکز کنم/i,
      })
    ).toBeTruthy();
  });
});

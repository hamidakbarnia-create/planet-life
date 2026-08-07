import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { AskScreen } from '@/components/ftue/AskScreen';
import {
  getAskQuestionRepository,
  resetAskQuestionRepositoryForTests,
} from '@/lib/ask-question-repository';
import { saveSession } from '@/lib/auth';
import { getAskCopy } from '@/lib/ftue-i18n';
import type { AppLang } from '@/lib/app-settings';
import { getAskHomeCopy } from '@/lib/ask-home';
import { getProfileRepository, resetProfileRepositoryForTests } from '@/lib/profile';
import { questionsByCategory } from '@/lib/question-library';

const replace = vi.fn();
const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push }),
}));

vi.mock('@/lib/today-timing', () => ({
  loadTodayTiming: vi.fn(async () => ({
    score: null,
    reasoning: null,
    hourly: [],
    bestHour: null,
    riskHour: null,
  })),
}));

function renderAsk(lang: AppLang = 'en') {
  return render(<AskScreen copy={getAskCopy(lang)} lang={lang} />);
}

function openHelpMeDecide(lang: AppLang = 'en') {
  const home = getAskHomeCopy(lang);
  fireEvent.click(screen.getByRole('button', { name: home.entryModes[0].title }));
}

function guidedPanel() {
  return within(screen.getByTestId('ask-guided-panel'));
}

function clickCareerFocusQuestion() {
  fireEvent.click(
    guidedPanel().getByRole('button', {
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
    gender: 'female' as const,
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

  it('renders the Ask Home decision-start surface', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    renderAsk('en');
    const home = getAskHomeCopy('en');

    expect(
      await screen.findByRole('heading', { name: home.heroTitle })
    ).toBeTruthy();
    expect(screen.getByLabelText(home.searchAriaLabel)).toBeTruthy();
    expect(
      screen.getByRole('button', { name: home.searchSubmitAria })
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: home.popularTitle })
    ).toBeTruthy();
    expect(screen.getByRole('heading', { name: home.entryTitle })).toBeTruthy();
    expect(screen.getByText(home.agencyLine1)).toBeTruthy();
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
    const home = getAskHomeCopy('en');

    const submit = await screen.findByRole('button', {
      name: home.searchSubmitAria,
    });
    expect(submit).toHaveProperty('disabled', true);
  });

  it('enables submit after typing a question', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    renderAsk('en');
    const home = getAskHomeCopy('en');

    const input = await screen.findByLabelText(home.searchAriaLabel);
    fireEvent.change(input, { target: { value: 'What should I do today?' } });

    const submit = screen.getByRole('button', { name: home.searchSubmitAria });
    expect(submit).toHaveProperty('disabled', false);
  });

  it('shows guided topics after Help me Decide', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    renderAsk('en');
    await screen.findByRole('heading', {
      name: getAskHomeCopy('en').heroTitle,
    });

    openHelpMeDecide('en');
    const panel = guidedPanel();

    expect(panel.getByRole('tab', { name: /career & work/i })).toBeTruthy();

    const careerQuestions = questionsByCategory('career-work');
    for (const guided of careerQuestions) {
      expect(
        panel.getByRole('button', { name: new RegExp(guided.labels.en, 'i') })
      ).toBeTruthy();
    }

    fireEvent.click(getCategoryTab(/love & people/i));
    const relationshipQuestions = questionsByCategory('relationships');
    for (const guided of relationshipQuestions) {
      expect(
        panel.getByRole('button', { name: new RegExp(guided.labels.en, 'i') })
      ).toBeTruthy();
    }
    expect(
      panel.queryByRole('button', {
        name: /what should i focus on in my career this week/i,
      })
    ).toBeNull();
  });

  it('fills the search field when a guided question is clicked', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    renderAsk('en');
    const home = getAskHomeCopy('en');
    await screen.findByRole('heading', { name: home.heroTitle });

    openHelpMeDecide('en');
    clickCareerFocusQuestion();

    const input = screen.getByLabelText(home.searchAriaLabel) as HTMLInputElement;
    expect(input.value).toBe(
      'What should I focus on in my career this week?'
    );
  });

  it('stores a suggestion by id without locale-specific text', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    renderAsk('en');
    const home = getAskHomeCopy('en');
    await screen.findByRole('heading', { name: home.heroTitle });

    openHelpMeDecide('en');
    clickCareerFocusQuestion();
    fireEvent.click(
      screen.getByRole('button', { name: home.searchSubmitAria })
    );

    const stored = getAskQuestionRepository().loadQuestion();
    expect(stored?.source).toBe('suggestion');
    expect(stored?.suggestion_id).toBe('career-focus-week');
    expect(stored?.text).toBeUndefined();
    expect(push).toHaveBeenCalledWith('/ask/frame');
  });

  it('stores edited suggestion text as typed', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    renderAsk('en');
    const home = getAskHomeCopy('en');
    await screen.findByRole('heading', { name: home.heroTitle });

    openHelpMeDecide('en');
    clickCareerFocusQuestion();
    const input = screen.getByLabelText(home.searchAriaLabel);
    fireEvent.change(input, { target: { value: 'Custom career question' } });
    fireEvent.click(
      screen.getByRole('button', { name: home.searchSubmitAria })
    );

    const stored = getAskQuestionRepository().loadQuestion();
    expect(stored?.source).toBe('typed');
    expect(stored?.text).toBe('Custom career question');
    expect(stored?.suggestion_id).toBeUndefined();
  });

  it('stores the question and navigates to /ask/frame on submit', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    renderAsk('en');
    const home = getAskHomeCopy('en');

    const input = await screen.findByLabelText(home.searchAriaLabel);
    fireEvent.change(input, { target: { value: 'What should I do today?' } });
    fireEvent.click(
      screen.getByRole('button', { name: home.searchSubmitAria })
    );

    const stored = getAskQuestionRepository().loadQuestion();
    expect(stored?.text).toBe('What should I do today?');
    expect(stored?.source).toBe('typed');
    expect(push).toHaveBeenCalledWith('/ask/frame');
  });

  it('fires analytics events on view, interaction, and submit', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    renderAsk('en');
    const home = getAskHomeCopy('en');

    await screen.findByRole('heading', { name: home.heroTitle });

    await waitFor(() => {
      const queue = localStorage.getItem('planet-life-ftue-events');
      expect(queue).toContain('ftue.ask.view');
    });

    const input = screen.getByLabelText(home.searchAriaLabel);
    fireEvent.change(input, { target: { value: 'Test question' } });

    await waitFor(() => {
      const queue = localStorage.getItem('planet-life-ftue-events');
      expect(queue).toContain('ftue.ask.started');
    });

    openHelpMeDecide('en');
    fireEvent.click(getCategoryTab(/love & people/i));
    fireEvent.click(
      guidedPanel().getByRole('button', {
        name: /how can i strengthen an important relationship right now/i,
      })
    );
    await waitFor(() => {
      const queue = localStorage.getItem('planet-life-ftue-events');
      expect(queue).toContain('ftue.ask.question_selected');
    });

    fireEvent.click(
      screen.getByRole('button', { name: home.searchSubmitAria })
    );
    await waitFor(() => {
      const queue = localStorage.getItem('planet-life-ftue-events');
      expect(queue).toContain('ftue.ask.submitted');
    });
  });

  it('updates Ask Home copy when parent passes a new locale', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    const { rerender } = renderAsk('en');
    const en = getAskHomeCopy('en');
    await screen.findByRole('heading', { name: en.heroTitle });

    rerender(<AskScreen copy={getAskCopy('fa')} lang="fa" />);
    const fa = getAskHomeCopy('fa');

    expect(screen.getByRole('heading', { name: fa.heroTitle })).toBeTruthy();
    expect(screen.getByLabelText(fa.searchAriaLabel)).toBeTruthy();
    expect(
      screen.getByRole('button', { name: fa.searchSubmitAria })
    ).toBeTruthy();
    expect(screen.getByText(fa.agencyLine1)).toBeTruthy();
  });

  it('localizes guided topics when Help me Decide is opened in fa', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    renderAsk('fa');
    const fa = getAskHomeCopy('fa');

    await screen.findByRole('heading', { name: fa.heroTitle });
    openHelpMeDecide('fa');

    expect(screen.getByRole('tab', { name: /مسیر شغلی و کار/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /عشق و افراد/i })).toBeTruthy();
  });

  it('updates guided question labels when parent passes a new locale', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    const { rerender } = renderAsk('en');
    const en = getAskHomeCopy('en');
    await screen.findByRole('heading', { name: en.heroTitle });

    openHelpMeDecide('en');
    clickCareerFocusQuestion();

    rerender(<AskScreen copy={getAskCopy('fa')} lang="fa" />);
    const fa = getAskHomeCopy('fa');

    const input = screen.getByLabelText(fa.searchAriaLabel) as HTMLInputElement;
    expect(input.value).toBe(
      'این هفته روی چه چیزی در مسیر شغلی‌ام تمرکز کنم؟'
    );
    expect(
      guidedPanel().getByRole('button', {
        name: /این هفته روی چه چیزی در مسیر شغلی‌ام تمرکز کنم/i,
      })
    ).toBeTruthy();
  });

  it('renders popular decisions from the data provider', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    renderAsk('en');
    await screen.findByRole('heading', {
      name: getAskHomeCopy('en').popularTitle,
    });

    expect(
      screen.getByRole('button', { name: 'Job interview' })
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Choose wedding date' })
    ).toBeTruthy();
  });

  it('routes car-interview popular cards into Decision Case intake', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    renderAsk('en');
    await screen.findByRole('button', { name: 'Job interview' });

    fireEvent.click(screen.getByRole('button', { name: 'Job interview' }));

    expect(push).toHaveBeenCalledWith('/decision-cases/car-interview');
    expect(push).not.toHaveBeenCalledWith('/result');
    expect(push).not.toHaveBeenCalledWith('/ask/frame');
  });

  it('routes job-interview guided chips into Decision Case intake', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    renderAsk('en');
    await screen.findByRole('heading', {
      name: getAskHomeCopy('en').heroTitle,
    });
    openHelpMeDecide();
    await waitFor(() => expect(screen.getByTestId('ask-guided-panel')).toBeTruthy());

    fireEvent.click(
      guidedPanel().getByRole('button', { name: /^job interview$/i })
    );

    expect(push).toHaveBeenCalledWith('/decision-cases/car-interview');
    expect(push).not.toHaveBeenCalledWith('/result');
    expect(push).not.toHaveBeenCalledWith('/ask/frame');
  });

  it('routes unrelated guided questions into Decision Frame path', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    renderAsk('en');
    await screen.findByRole('heading', {
      name: getAskHomeCopy('en').heroTitle,
    });
    openHelpMeDecide();
    await waitFor(() => expect(screen.getByTestId('ask-guided-panel')).toBeTruthy());

    fireEvent.click(
      guidedPanel().getByRole('button', {
        name: /send a resume or job application/i,
      })
    );
    expect(push).not.toHaveBeenCalledWith('/decision-cases/car-interview');

    fireEvent.click(
      screen.getByRole('button', { name: getAskHomeCopy('en').searchSubmitAria })
    );
    expect(push).toHaveBeenCalledWith('/ask/frame');
  });
});

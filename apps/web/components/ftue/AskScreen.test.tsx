import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AskScreen } from '@/components/ftue/AskScreen';
import {
  getAskQuestionRepository,
  resetAskQuestionRepositoryForTests,
} from '@/lib/ask-question-repository';
import { saveSession } from '@/lib/auth';
import { getProfileRepository, resetProfileRepositoryForTests } from '@/lib/profile';

const replace = vi.fn();
const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push }),
}));

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
    render(<AskScreen lang="en" />);

    expect(await screen.findByRole('heading', { name: /ask metioro/i })).toBeTruthy();
    expect(screen.getByLabelText(/your question/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /get guidance/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /career/i })).toBeTruthy();
  });

  it('redirects to profile onboarding when birth profile is missing', async () => {
    render(<AskScreen lang="en" />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/profile?onboarding=1');
    });
  });

  it('disables submit when the question is empty', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    render(<AskScreen lang="en" />);

    const submit = await screen.findByRole('button', { name: /get guidance/i });
    expect(submit).toHaveProperty('disabled', true);
  });

  it('enables submit after typing a question', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    render(<AskScreen lang="en" />);

    const input = await screen.findByLabelText(/your question/i);
    fireEvent.change(input, { target: { value: 'What should I do today?' } });

    const submit = screen.getByRole('button', { name: /get guidance/i });
    expect(submit).toHaveProperty('disabled', false);
  });

  it('fills the textbox when a suggestion is clicked', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    render(<AskScreen lang="en" />);

    fireEvent.click(await screen.findByRole('button', { name: /career/i }));

    const input = screen.getByLabelText(/your question/i) as HTMLTextAreaElement;
    expect(input.value).toBe('What should I focus on in my career this week?');
  });

  it('stores the question and navigates to /result on submit', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    render(<AskScreen lang="en" />);

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
    render(<AskScreen lang="en" />);

    await screen.findByRole('heading', { name: /ask metioro/i });

    let queue = localStorage.getItem('planet-life-ftue-events');
    expect(queue).toContain('ftue.ask.view');

    const input = screen.getByLabelText(/your question/i);
    fireEvent.change(input, { target: { value: 'Test question' } });

    queue = localStorage.getItem('planet-life-ftue-events');
    expect(queue).toContain('ftue.ask.started');

    fireEvent.click(screen.getByRole('button', { name: /relationships/i }));
    queue = localStorage.getItem('planet-life-ftue-events');
    expect(queue).toContain('ftue.ask.question_selected');

    fireEvent.click(screen.getByRole('button', { name: /get guidance/i }));
    queue = localStorage.getItem('planet-life-ftue-events');
    expect(queue).toContain('ftue.ask.submitted');
  });

  it('updates copy when lang changes without remounting', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    const { rerender } = render(<AskScreen lang="en" />);
    await screen.findByRole('heading', { name: /ask metioro/i });

    rerender(<AskScreen lang="fa" />);

    expect(screen.getByRole('heading', { name: /از METIORO بپرسید/i })).toBeTruthy();
    expect(screen.getByLabelText(/پرسش شما/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /دریافت راهنمایی/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /شغل/i })).toBeTruthy();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  FTUE_DECISION_PROFILE_PATH,
  GoalSelectionScreen,
} from '@/components/ftue/GoalSelectionScreen';
import { GOAL_SELECTION_COPY, GOAL_SELECTION_LANGS } from '@/lib/ftue-i18n';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

describe('GoalSelectionScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    push.mockClear();
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders the PRD prompt and all eight goal cards', async () => {
    render(<GoalSelectionScreen />);
    expect(
      await screen.findByRole('heading', { name: GOAL_SELECTION_COPY.prompt })
    ).toBeTruthy();
    const group = screen.getByRole('group', { name: GOAL_SELECTION_COPY.goalsAria });
    expect(group).toBeTruthy();
    for (const label of Object.values(GOAL_SELECTION_COPY.goals)) {
      expect(screen.getByRole('button', { name: label })).toBeTruthy();
    }
  });

  it('keeps Continue disabled until a goal is selected', async () => {
    render(<GoalSelectionScreen />);
    const continueBtn = await screen.findByRole('button', {
      name: GOAL_SELECTION_COPY.continue,
    });
    expect(continueBtn).toHaveProperty('disabled', true);

    fireEvent.click(
      screen.getByRole('button', { name: GOAL_SELECTION_COPY.goals.career })
    );
    expect(continueBtn).toHaveProperty('disabled', false);
  });

  it('supports multi-select and continues to Decision Profile', async () => {
    render(<GoalSelectionScreen />);
    await screen.findByRole('heading', { name: GOAL_SELECTION_COPY.prompt });

    const career = screen.getByRole('button', {
      name: GOAL_SELECTION_COPY.goals.career,
    });
    const timing = screen.getByRole('button', {
      name: GOAL_SELECTION_COPY.goals.timing,
    });
    fireEvent.click(career);
    fireEvent.click(timing);
    expect(career.getAttribute('aria-pressed')).toBe('true');
    expect(timing.getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(
      screen.getByRole('button', { name: GOAL_SELECTION_COPY.continue })
    );
    expect(push).toHaveBeenCalledWith(FTUE_DECISION_PROFILE_PATH);

    await waitFor(() => {
      const queue = localStorage.getItem('planet-life-ftue-events') ?? '';
      expect(queue).toContain('ftue_goal_select');
      expect(queue).toContain('career');
      expect(queue).toContain('timing');
    });
  });

  it('allows Skip with zero selections', async () => {
    render(<GoalSelectionScreen />);
    fireEvent.click(
      await screen.findByRole('button', { name: GOAL_SELECTION_COPY.skip })
    );
    expect(push).toHaveBeenCalledWith(FTUE_DECISION_PROFILE_PATH);

    await waitFor(() => {
      const queue = localStorage.getItem('planet-life-ftue-events') ?? '';
      expect(queue).toContain('ftue_goal_skip');
    });
  });

  it('renders Persian copy and RTL direction when fa is selected', async () => {
    localStorage.setItem('planet-life-lang', 'fa');
    const { container } = render(<GoalSelectionScreen />);
    const fa = GOAL_SELECTION_LANGS.fa;
    expect(await screen.findByRole('heading', { name: fa.prompt })).toBeTruthy();
    expect(screen.getByRole('button', { name: fa.goals.career })).toBeTruthy();
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.direction).toBe('rtl');
  });
});

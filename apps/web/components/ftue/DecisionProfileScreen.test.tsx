import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  DecisionProfileScreen,
  FTUE_BIRTH_DATE_PATH,
} from '@/components/ftue/DecisionProfileScreen';
import { DECISION_PROFILE_COPY, DECISION_PROFILE_LANGS } from '@/lib/ftue-i18n';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

describe('DecisionProfileScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    push.mockClear();
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders the PRD explain copy and Continue action', async () => {
    render(<DecisionProfileScreen />);
    expect(await screen.findByText(DECISION_PROFILE_COPY.body)).toBeTruthy();
    expect(
      screen.getByRole('button', { name: DECISION_PROFILE_COPY.continue })
    ).toBeTruthy();
  });

  it('tracks ftue_intent_view on mount', async () => {
    render(<DecisionProfileScreen />);
    await screen.findByText(DECISION_PROFILE_COPY.body);
    await waitFor(() => {
      const queue = localStorage.getItem('planet-life-ftue-events') ?? '';
      expect(queue).toContain('ftue_intent_view');
    });
  });

  it('continues to Birth Date', async () => {
    render(<DecisionProfileScreen />);
    fireEvent.click(
      await screen.findByRole('button', { name: DECISION_PROFILE_COPY.continue })
    );
    expect(push).toHaveBeenCalledWith(FTUE_BIRTH_DATE_PATH);
  });

  it('navigates back to Goal Selection', async () => {
    render(<DecisionProfileScreen />);
    fireEvent.click(
      await screen.findByRole('button', { name: DECISION_PROFILE_COPY.back })
    );
    expect(push).toHaveBeenCalledWith('/onboarding/goal');
  });

  it('renders Persian copy and RTL direction when fa is selected', async () => {
    localStorage.setItem('planet-life-lang', 'fa');
    const { container } = render(<DecisionProfileScreen />);
    const fa = DECISION_PROFILE_LANGS.fa;
    expect(await screen.findByText(fa.body)).toBeTruthy();
    expect(screen.getByRole('button', { name: fa.continue })).toBeTruthy();
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.direction).toBe('rtl');
  });
});

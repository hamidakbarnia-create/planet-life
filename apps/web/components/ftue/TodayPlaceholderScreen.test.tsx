import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TodayPlaceholderScreen } from '@/components/ftue/TodayPlaceholderScreen';
import { saveSession } from '@/lib/auth';
import { getProfileRepository, resetProfileRepositoryForTests } from '@/lib/profile';

const replace = vi.fn();
const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('TodayPlaceholderScreen', () => {
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
    gender: 'male' as const,
  };

  beforeEach(() => {
    localStorage.clear();
    resetProfileRepositoryForTests();
    replace.mockClear();
    push.mockClear();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    saveSession({ method: 'email', identifier: 'user@test.com', verifiedAt: Date.now() });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    resetProfileRepositoryForTests();
  });

  it('redirects to profile onboarding when birth profile is missing', async () => {
    render(<TodayPlaceholderScreen />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/profile?onboarding=1');
    });

    const queue = localStorage.getItem('planet-life-ftue-events');
    expect(queue).toContain('ftue.today.missing_profile');
  });

  it('renders Today screen when profile exists', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    render(<TodayPlaceholderScreen />);

    expect(
      await screen.findByRole('heading', { name: /your today is ready/i })
    ).toBeTruthy();
    expect(screen.getByText(/alex, your timing context is anchored to new york/i)).toBeTruthy();
    expect(screen.getByText(/today brief/i)).toBeTruthy();
    expect(screen.getByText(/early preview/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /ask your first question/i })).toBeTruthy();
  });

  it('tracks view and started analytics on load', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    render(<TodayPlaceholderScreen />);

    await screen.findByRole('heading', { name: /your today is ready/i });

    await waitFor(() => {
      const queue = localStorage.getItem('planet-life-ftue-events');
      expect(queue).toContain('ftue.today.view');
      expect(queue).toContain('ftue.today.started');
    });
  });

  it('routes to /ask when CTA is clicked', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    render(<TodayPlaceholderScreen />);

    const cta = await screen.findByRole('button', { name: /ask your first question/i });
    fireEvent.click(cta);

    expect(push).toHaveBeenCalledWith('/ask');

    const queue = localStorage.getItem('planet-life-ftue-events');
    expect(queue).toContain('ftue.today.cta_clicked');
  });
});

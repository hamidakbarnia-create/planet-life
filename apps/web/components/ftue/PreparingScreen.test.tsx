import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PreparingScreen } from '@/components/ftue/PreparingScreen';
import { saveSession } from '@/lib/auth';
import { getProfileRepository, resetProfileRepositoryForTests } from '@/lib/profile';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));

describe('PreparingScreen', () => {
  const sampleProfile = {
    birth_date: '1990-06-15',
    birth_time: '14:30',
    birth_place: {
      name: 'New York, New York, United States',
      short: 'New York',
      lat: 40.7128,
      lon: -74.006,
    },
    action_type: 'business_launch',
  };

  beforeEach(() => {
    localStorage.clear();
    resetProfileRepositoryForTests();
    replace.mockClear();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    saveSession({ method: 'email', identifier: 'user@test.com', verifiedAt: Date.now() });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    resetProfileRepositoryForTests();
  });

  it('redirects when profile is missing', async () => {
    render(<PreparingScreen />);
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/profile?onboarding=1');
    });
  });

  it('shows progress steps and tracks preparing analytics', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    render(<PreparingScreen />);

    expect(
      await screen.findByRole('heading', { name: /preparing your first insight/i })
    ).toBeTruthy();
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByText(/chart calculated/i)).toBeTruthy();

    const queue = localStorage.getItem('planet-life-ftue-events');
    expect(queue).toContain('ftue.preparing.view');
    expect(queue).toContain('ftue.preparing.started');
  });

  it('completes and routes to today placeholder', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    render(<PreparingScreen />);

    await waitFor(
      () => {
        expect(replace).toHaveBeenCalledWith('/home');
      },
      { timeout: 5000 }
    );

    const queue = localStorage.getItem('planet-life-ftue-events');
    expect(queue).toContain('ftue.preparing.completed');
  });

  it('shows error and retry when offline', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

    render(<PreparingScreen />);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/connect to prepare/i);

    const queue = localStorage.getItem('planet-life-ftue-events');
    expect(queue).toContain('ftue.preparing.failed');

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(queue).toContain('ftue.preparing.started');
  });
});

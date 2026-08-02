import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BirthProfileOnboardingScreen } from '@/components/ftue/BirthProfileOnboardingScreen';
import { saveSession } from '@/lib/auth';
import { getProfileRepository, resetProfileRepositoryForTests } from '@/lib/profile';

const replace = vi.fn();
const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push }),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('BirthProfileOnboardingScreen', () => {
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

  it('renders onboarding form with labeled fields', async () => {
    render(<BirthProfileOnboardingScreen />);
    expect(
      await screen.findByRole('heading', { name: /your birth context/i })
    ).toBeTruthy();
    expect(screen.getByLabelText(/birth date/i)).toBeTruthy();
    expect(screen.getByLabelText(/birth time/i)).toBeTruthy();
    expect(screen.getByLabelText(/birth city/i)).toBeTruthy();
    expect(screen.getByTestId('profile-gender-field')).toBeTruthy();
    expect(screen.getByTestId('profile-gender-female')).toBeTruthy();
    expect(screen.getByTestId('profile-gender-male')).toBeTruthy();
    expect(screen.getByTestId('profile-gender-prefer_not_to_say')).toBeTruthy();
    const queue = localStorage.getItem('planet-life-ftue-events');
    expect(queue).toContain('profile.view');
  });

  it('restores draft after refresh simulation', async () => {
    const repo = getProfileRepository();
    repo.saveDraft({
      birth_date: '1992-11-20',
      birth_time: '08:45',
      city_search: 'London',
      selected_city: {
        name: 'London, England, UK',
        short: 'London',
        lat: 51.5074,
        lon: -0.1278,
      },
      updated_at: Date.now(),
    });

    render(<BirthProfileOnboardingScreen />);
    const dateInput = (await screen.findByLabelText(/birth date/i)) as HTMLInputElement;
    expect(dateInput.value).toBe('1992-11-20');
  });

  it('tracks validation failure for missing fields', async () => {
    render(<BirthProfileOnboardingScreen />);
    await screen.findByRole('heading', { name: /your birth context/i });
    fireEvent.click(screen.getByRole('button', { name: /save and continue/i }));
    const alerts = await screen.findAllByRole('alert');
    expect(alerts.some((el) => el.textContent?.match(/fix the highlighted/i))).toBe(true);
    const queue = localStorage.getItem('planet-life-ftue-events');
    expect(queue).toContain('profile.validation_failed');
  });

  it('requires gender before save', async () => {
    const repo = getProfileRepository();
    repo.saveDraft({
      birth_date: '1990-06-15',
      birth_time: '14:30',
      city_search: 'New York',
      selected_city: {
        name: 'New York, NY, USA',
        short: 'New York',
        lat: 40.7128,
        lon: -74.006,
      },
      updated_at: Date.now(),
    });

    render(<BirthProfileOnboardingScreen />);
    await screen.findByRole('heading', { name: /your birth context/i });
    fireEvent.click(screen.getByRole('button', { name: /save and continue/i }));
    const alerts = await screen.findAllByRole('alert');
    expect(alerts.some((el) => el.textContent?.match(/gender/i))).toBe(true);
    expect(replace).not.toHaveBeenCalled();
  });

  it('saves complete profile with gender and routes to preparing', async () => {
    const repo = getProfileRepository();
    repo.saveDraft({
      birth_date: '1990-06-15',
      birth_time: '14:30',
      city_search: 'New York',
      selected_city: {
        name: 'New York, NY, USA',
        short: 'New York',
        lat: 40.7128,
        lon: -74.006,
      },
      gender: 'male',
      updated_at: Date.now(),
    });

    render(<BirthProfileOnboardingScreen />);
    await screen.findByRole('heading', { name: /your birth context/i });
    fireEvent.click(screen.getByRole('button', { name: /save and continue/i }));

    expect(replace).toHaveBeenCalledWith('/onboarding/preparing');
    expect(repo.loadProfile()?.birth_place.short).toBe('New York');
    expect(repo.loadProfile()?.gender).toBe('male');
    expect(repo.loadDraft()).toBeNull();
    const queue = localStorage.getItem('planet-life-ftue-events');
    expect(queue).toContain('profile.saved');
    expect(queue).toContain('profile.completed');
  });

  it('persists prefer_not_to_say', async () => {
    const repo = getProfileRepository();
    repo.saveDraft({
      birth_date: '1990-06-15',
      birth_time: '14:30',
      city_search: 'New York',
      selected_city: {
        name: 'New York, NY, USA',
        short: 'New York',
        lat: 40.7128,
        lon: -74.006,
      },
      gender: 'prefer_not_to_say',
      updated_at: Date.now(),
    });

    render(<BirthProfileOnboardingScreen />);
    await screen.findByRole('heading', { name: /your birth context/i });
    fireEvent.click(screen.getByRole('button', { name: /save and continue/i }));
    expect(repo.loadProfile()?.gender).toBe('prefer_not_to_say');
  });
});

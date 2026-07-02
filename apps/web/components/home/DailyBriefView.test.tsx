import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { DailyBriefView } from '@/components/home/DailyBriefView';
import type { BirthProfile } from '@/lib/birth-profile';

vi.mock('@/lib/calendar-scores', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/calendar-scores')>();
  return {
    ...actual,
    fetchDayScore: vi.fn(() => new Promise<number | null>(() => {})),
    fetchHourlyScores: vi.fn(() => Promise.resolve([])),
  };
});

vi.mock('@/lib/people-storage', () => ({
  loadPeople: vi.fn(() => []),
}));

vi.mock('@/components/home/CosmosCard', () => ({
  CosmosCard: () => <div data-testid="cosmos-card" />,
}));

vi.mock('@/components/PeopleHomeRow', () => ({
  PeopleHomeRow: () => null,
}));

const profile: BirthProfile = {
  birth_date: '1990-06-15',
  birth_time: '14:30',
  location: 'Tehran',
  action_type: 'business_launch',
  current_location: {
    city: 'Tehran',
    latitude: 35.6892,
    longitude: 51.389,
    timezone: 'Asia/Tehran',
    coordinate_source: 'selected_city_coordinates',
    confirmed: true,
  },
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('DailyBriefView score loading', () => {
  it('shows Calculating... while the daily score is pending in EN', () => {
    render(<DailyBriefView lang="en" profile={profile} hasProfile />);

    expect(screen.getByTestId('daily-score-loading').textContent).toBe('Calculating…');
    expect(screen.queryByText('/100')).toBeNull();
  });

  it('shows Persian calculating text while the daily score is pending in FA', () => {
    render(<DailyBriefView lang="fa" profile={profile} hasProfile />);

    expect(screen.getByTestId('daily-score-loading').textContent).toBe('در حال محاسبه...');
    expect(screen.queryByText('/100')).toBeNull();
  });

  it('renders numeric score once fetch completes', async () => {
    const { fetchDayScore } = await import('@/lib/calendar-scores');
    vi.mocked(fetchDayScore).mockResolvedValueOnce(72);

    render(<DailyBriefView lang="en" profile={profile} hasProfile />);

    await waitFor(() => {
      expect(screen.getByText('72')).toBeTruthy();
    });
    expect(screen.getByText('/100')).toBeTruthy();
    expect(screen.queryByTestId('daily-score-loading')).toBeNull();
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { DailyBriefView } from '@/components/home/DailyBriefView';
import type { BirthProfile } from '@/lib/birth-profile';

vi.mock('@/lib/today-timing', () => ({
  loadTodayTiming: vi.fn(() => new Promise(() => {})),
}));

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
    const { loadTodayTiming } = await import('@/lib/today-timing');
    vi.mocked(loadTodayTiming).mockResolvedValueOnce({
      score: 72,
      reasoning: null,
      hourly: [],
      bestHour: null,
      riskHour: null,
    });

    render(<DailyBriefView lang="en" profile={profile} hasProfile />);

    await waitFor(() => {
      expect(screen.getByText('72')).toBeTruthy();
    });
    expect(screen.getByText('/100')).toBeTruthy();
    expect(screen.queryByTestId('daily-score-loading')).toBeNull();
  });
});

describe('DailyBriefView Calendar timing consumer', () => {
  it('renders ScoreReasoning.summary when producer provides it', async () => {
    const { loadTodayTiming } = await import('@/lib/today-timing');
    vi.mocked(loadTodayTiming).mockResolvedValueOnce({
      score: 80,
      reasoning: {
        summary: 'Producer summary for today.',
        confidence: 0.7,
        reasons: [],
      },
      hourly: [{ hour: 10, time: '10:00', score: 90, band: 'green' }],
      bestHour: { hour: 10, time: '10:00', score: 90, band: 'green' },
      riskHour: { hour: 18, time: '18:00', score: 25, band: 'red' },
    });

    render(<DailyBriefView lang="en" profile={profile} hasProfile />);

    await waitFor(() => {
      expect(screen.getByTestId('calendar-why-timing-summary').textContent).toBe(
        'Producer summary for today.'
      );
    });
    expect(screen.queryByText(/0\.7/)).toBeNull();
  });

  it('does not render Why this timing when summary is absent', async () => {
    const { loadTodayTiming } = await import('@/lib/today-timing');
    vi.mocked(loadTodayTiming).mockResolvedValueOnce({
      score: 55,
      reasoning: null,
      hourly: [],
      bestHour: null,
      riskHour: null,
    });

    render(<DailyBriefView lang="en" profile={profile} hasProfile />);

    await waitFor(() => {
      expect(screen.getByText('55')).toBeTruthy();
    });
    expect(screen.queryByTestId('calendar-why-timing')).toBeNull();
  });

  it('surfaces Best window and Lower-readiness window from timing data', async () => {
    const { loadTodayTiming } = await import('@/lib/today-timing');
    vi.mocked(loadTodayTiming).mockResolvedValueOnce({
      score: 70,
      reasoning: null,
      hourly: [
        { hour: 9, time: '9:00', score: 91, band: 'green' },
        { hour: 21, time: '21:00', score: 18, band: 'red' },
      ],
      bestHour: { hour: 9, time: '9:00', score: 91, band: 'green' },
      riskHour: { hour: 21, time: '21:00', score: 18, band: 'red' },
    });

    render(<DailyBriefView lang="en" profile={profile} hasProfile />);

    await waitFor(() => {
      expect(screen.getByText('Best window')).toBeTruthy();
    });
    expect(screen.getByText('Lower-readiness window')).toBeTruthy();
    expect(screen.getByText('9:00 AM')).toBeTruthy();
    expect(screen.getByText('9:00 PM')).toBeTruthy();
  });

  it('links to Calendar for more detail', async () => {
    const { loadTodayTiming } = await import('@/lib/today-timing');
    vi.mocked(loadTodayTiming).mockResolvedValueOnce({
      score: 60,
      reasoning: null,
      hourly: [],
      bestHour: null,
      riskHour: null,
    });

    render(<DailyBriefView lang="en" profile={profile} hasProfile />);

    await waitFor(() => {
      expect(screen.getByTestId('today-calendar-cta')).toBeTruthy();
    });
    const cta = screen.getByTestId('today-calendar-cta');
    expect(cta.getAttribute('href')).toBe('/calendar');
    expect(cta.textContent).toBe('Open Calendar for more detail');
  });

  it('avoids user-facing Golden wording on the Today brief', async () => {
    const { loadTodayTiming } = await import('@/lib/today-timing');
    vi.mocked(loadTodayTiming).mockResolvedValueOnce({
      score: 88,
      reasoning: null,
      hourly: [{ hour: 11, time: '11:00', score: 88, band: 'green' }],
      bestHour: { hour: 11, time: '11:00', score: 88, band: 'green' },
      riskHour: { hour: 11, time: '11:00', score: 88, band: 'green' },
    });

    render(<DailyBriefView lang="en" profile={profile} hasProfile />);

    await waitFor(() => {
      expect(screen.getByText('88')).toBeTruthy();
    });
    expect(screen.queryByText(/golden/i)).toBeNull();
  });
});

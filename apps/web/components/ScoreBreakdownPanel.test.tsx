import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import {
  formatLocationModeLabel,
  ScoreBreakdownPanel,
} from '@/components/ScoreBreakdownPanel';
import type { ScoreBreakdown } from '@/lib/score-breakdown';

const SAMPLE_BREAKDOWN: ScoreBreakdown = {
  aspectScore: 7.61,
  natalHouseBonus: 0,
  transitHouseScore: 6.05,
  transitAngularScore: -0.21,
  locationComponentScore: 5.84,
  retrogradePenalty: 0,
  finalScore: 63,
  locationMode: 'currentLiving',
  calculatedFor: 'London, United Kingdom',
  resolvedLocalDatetime: '2026-06-15T12:00:00+01:00',
  resolvedUtcDatetime: '2026-06-15T11:00:00Z',
  timezone: 'Europe/London',
  targetTime: '12:00',
};

afterEach(() => {
  cleanup();
});

describe('formatLocationModeLabel', () => {
  it('maps locationMode labels correctly', () => {
    expect(formatLocationModeLabel('currentLiving')).toBe('Current living location');
    expect(formatLocationModeLabel('eventLocation')).toBe('Event location');
    expect(formatLocationModeLabel('targetSubject')).toBe('Target location');
    expect(formatLocationModeLabel('birthOnly')).toBe('Birth location');
    expect(formatLocationModeLabel('birthAndTarget')).toBe('Birth + target location');
    expect(formatLocationModeLabel('customMode')).toBe('customMode');
  });
});

describe('ScoreBreakdownPanel', () => {
  it('renders nothing when breakdown is missing', () => {
    const { container: nullContainer } = render(
      <ScoreBreakdownPanel breakdown={null} />
    );
    expect(nullContainer.firstChild).toBeNull();
    expect(screen.queryByTestId('score-breakdown-panel')).toBeNull();

    cleanup();

    const { container: undefinedContainer } = render(
      <ScoreBreakdownPanel breakdown={undefined} />
    );
    expect(undefinedContainer.firstChild).toBeNull();
  });

  it('renders calculatedFor and finalScore', () => {
    render(<ScoreBreakdownPanel breakdown={SAMPLE_BREAKDOWN} />);
    expect(screen.getByTestId('score-breakdown-calculated-for').textContent).toContain(
      'London, United Kingdom'
    );
    expect(screen.getByTestId('score-breakdown-final-score').textContent).toContain('63');
  });

  it('hides debug fields by default', () => {
    render(<ScoreBreakdownPanel breakdown={SAMPLE_BREAKDOWN} />);
    expect(screen.queryByTestId('score-breakdown-debug')).toBeNull();
    expect(screen.queryByTestId('score-breakdown-local-datetime')).toBeNull();
    expect(screen.queryByTestId('score-breakdown-natal-house')).toBeNull();
    expect(screen.getByTestId('score-breakdown-aspect').textContent).toContain('+7.61');
  });

  it('shows debug fields when showDebug=true', () => {
    render(<ScoreBreakdownPanel breakdown={SAMPLE_BREAKDOWN} showDebug />);
    expect(screen.getByTestId('score-breakdown-debug')).toBeTruthy();
    expect(screen.getByTestId('score-breakdown-local-datetime').textContent).toContain(
      '2026-06-15T12:00:00+01:00'
    );
    expect(screen.getByTestId('score-breakdown-utc-datetime').textContent).toContain(
      '2026-06-15T11:00:00Z'
    );
    expect(screen.getByTestId('score-breakdown-timezone').textContent).toContain('Europe/London');
    expect(screen.getByTestId('score-breakdown-target-time').textContent).toContain('12:00');
    expect(screen.getByTestId('score-breakdown-natal-house').textContent).toContain('0');
  });

  it('maps locationMode label in the panel', () => {
    render(
      <ScoreBreakdownPanel
        breakdown={{ ...SAMPLE_BREAKDOWN, locationMode: 'eventLocation' }}
      />
    );
    expect(screen.getByTestId('score-breakdown-location-mode').textContent).toContain(
      'Event location'
    );
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AnalysisResultBreakdown } from '@/components/AnalysisResultBreakdown';
import type { ScoreBreakdown } from '@/lib/score-breakdown';

const SAMPLE_BREAKDOWN: ScoreBreakdown = {
  aspectScore: 7.61,
  natalHouseBonus: 0,
  transitHouseScore: 6.05,
  transitAngularScore: -0.21,
  locationComponentScore: 5.84,
  retrogradePenalty: 0,
  finalScore: 63,
  locationMode: 'eventLocation',
  calculatedFor: 'London, United Kingdom',
  resolvedLocalDatetime: '2026-06-15T12:00:00+01:00',
  resolvedUtcDatetime: '2026-06-15T11:00:00Z',
  timezone: 'Europe/London',
  targetTime: '12:00',
};

afterEach(() => {
  cleanup();
});

describe('AnalysisResultBreakdown', () => {
  it('renders ScoreBreakdownPanel when breakdown exists', () => {
    render(<AnalysisResultBreakdown breakdown={SAMPLE_BREAKDOWN} />);
    expect(screen.getByTestId('analysis-result-breakdown')).toBeTruthy();
    expect(screen.getByTestId('score-breakdown-panel')).toBeTruthy();
    expect(screen.getByTestId('score-breakdown-final-score').textContent).toContain('63');
  });

  it('does not crash when breakdown is missing', () => {
    const { container } = render(<AnalysisResultBreakdown breakdown={null} />);
    expect(screen.getByTestId('analysis-result-breakdown')).toBeTruthy();
    expect(screen.queryByTestId('score-breakdown-panel')).toBeNull();
    expect(container.querySelector('[data-testid="score-breakdown-panel"]')).toBeNull();
  });

describe('Ask result wiring', () => {
  it('renders ScoreBreakdownPanel when scoreBreakdown exists', () => {
    render(<AnalysisResultBreakdown breakdown={SAMPLE_BREAKDOWN} />);
    expect(screen.getByTestId('score-breakdown-panel')).toBeTruthy();
  });

  it('does not crash when scoreBreakdown is missing', () => {
    expect(() =>
      render(<AnalysisResultBreakdown breakdown={undefined} />)
    ).not.toThrow();
    expect(screen.queryByTestId('score-breakdown-panel')).toBeNull();
  });
});

describe('Dashboard / Property result wiring', () => {
  it('renders ScoreBreakdownPanel for AnalysisPayload scoreBreakdown', () => {
    render(
      <AnalysisResultBreakdown
        breakdown={{
          ...SAMPLE_BREAKDOWN,
          locationMode: 'targetSubject',
          calculatedFor: 'New York, United States',
        }}
      />
    );
    expect(screen.getByTestId('score-breakdown-panel')).toBeTruthy();
    expect(screen.getByTestId('score-breakdown-location-mode').textContent).toContain(
      'Target location'
    );
  });
});

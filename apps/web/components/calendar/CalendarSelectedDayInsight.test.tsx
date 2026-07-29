import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { CalendarSelectedDayInsight } from './CalendarSelectedDayInsight';
import { CALENDAR_PAGE_LANGS } from '@/lib/calendar-page-i18n';
import type { ScoreReasoning } from '@/lib/score-reasoning';
import type { PlanetTransit } from '@/lib/calendar-scores';

afterEach(() => {
  cleanup();
});

const labels = {
  dir: CALENDAR_PAGE_LANGS.en.dir,
  loading: CALENDAR_PAGE_LANGS.en.loading,
  whyTiming: CALENDAR_PAGE_LANGS.en.whyTiming,
  supportingReasons: CALENDAR_PAGE_LANGS.en.supportingReasons,
  advancedDetails: CALENDAR_PAGE_LANGS.en.advancedDetails,
  transit: CALENDAR_PAGE_LANGS.en.transit,
  signs: CALENDAR_PAGE_LANGS.en.signs,
  planets: CALENDAR_PAGE_LANGS.en.planets,
};

const SAMPLE_REASONING: ScoreReasoning = {
  summary: 'Producer summary for this day.',
  confidence: 0.72,
  reasons: [
    {
      category: 'timing',
      planet: 'venus',
      importance: 'high',
      score: 12,
      title: 'Supportive window',
      explanation: 'Producer explanation text.',
      evidence: { source: 'test' },
    },
  ],
};

const SAMPLE_TRANSIT: PlanetTransit[] = [
  {
    name: 'sun',
    longitude: 132.5,
    sign: 'Leo',
    signIndex: 4,
    degreeInSign: 12.5,
    retrograde: false,
    house: 10,
  },
];

describe('CalendarSelectedDayInsight', () => {
  it('keeps transit/sky content inside collapsed Advanced details', () => {
    render(
      <CalendarSelectedDayInsight
        labels={labels}
        reasoning={null}
        transit={SAMPLE_TRANSIT}
        transitMeta={{}}
        loadingTransit={false}
      />
    );

    const advanced = screen.getByTestId('calendar-advanced-details');
    expect(advanced).toBeTruthy();
    expect(advanced.hasAttribute('open')).toBe(false);
    expect(advanced.textContent).toContain('Sky on this day');
    expect(advanced.textContent).toContain('Sun');
    expect(screen.queryByTestId('calendar-why-timing')).toBeNull();
  });

  it('renders ScoreReasoning.summary when present', () => {
    render(
      <CalendarSelectedDayInsight
        labels={labels}
        reasoning={SAMPLE_REASONING}
        transit={[]}
        transitMeta={{}}
        loadingTransit={false}
      />
    );

    expect(screen.getByTestId('calendar-why-timing-summary').textContent).toBe(
      'Producer summary for this day.'
    );
    expect(screen.getByText('Why this timing')).toBeTruthy();
    // Must not surface producer confidence as platform Confidence.
    expect(screen.queryByText(/0\.72/)).toBeNull();
    expect(screen.queryByText(/confidence/i)).toBeNull();
  });

  it('renders no reasoning section when summary is absent', () => {
    render(
      <CalendarSelectedDayInsight
        labels={labels}
        reasoning={null}
        transit={[]}
        transitMeta={{}}
        loadingTransit={false}
      />
    );

    expect(screen.queryByTestId('calendar-why-timing')).toBeNull();
    expect(screen.queryByTestId('calendar-supporting-reasons')).toBeNull();
  });

  it('places supporting reasons under progressive disclosure when present', () => {
    render(
      <CalendarSelectedDayInsight
        labels={labels}
        reasoning={SAMPLE_REASONING}
        transit={[]}
        transitMeta={{}}
        loadingTransit={false}
      />
    );

    const reasons = screen.getByTestId('calendar-supporting-reasons');
    expect(reasons.hasAttribute('open')).toBe(false);
    expect(reasons.textContent).toContain('Supportive window');
    expect(reasons.textContent).toContain('Producer explanation text.');
  });
});

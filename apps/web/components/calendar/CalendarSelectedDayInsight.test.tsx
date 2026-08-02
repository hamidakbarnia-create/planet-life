import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { CalendarSelectedDayInsight } from './CalendarSelectedDayInsight';
import { CALENDAR_PAGE_LANGS } from '@/lib/calendar-page-i18n';
import type { ScoreReasoning } from '@/lib/score-reasoning';
import type { PlanetTransit } from '@/lib/calendar-scores';

afterEach(() => {
  cleanup();
});

function labelsFor(lang: 'en' | 'fa' | 'ar' | 'ru') {
  const t = CALENDAR_PAGE_LANGS[lang];
  return {
    dir: t.dir,
    loading: t.loading,
    whyTiming: t.whyTiming,
    whyTimingFallback: t.whyTimingFallback,
    supportingReasons: t.supportingReasons,
    advancedDetails: t.advancedDetails,
    transit: t.transit,
    signs: t.signs,
    planets: t.planets,
  };
}

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

const ENGLISH_PRODUCER: ScoreReasoning = {
  summary:
    'Business Launch scores 63/100 (Favorable). Transit Sun conjunction natal Venus supports outreach.',
  confidence: 0.5,
  reasons: [
    {
      category: 'timing',
      importance: 'high',
      score: 10,
      title: 'Transit Sun conjunction natal Venus',
      explanation: 'This aspect favors partnership conversations.',
      evidence: {},
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
        lang="en"
        labels={labelsFor('en')}
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

  it('renders ScoreReasoning.summary when present in EN', () => {
    render(
      <CalendarSelectedDayInsight
        lang="en"
        labels={labelsFor('en')}
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

  it('renders FA fallback instead of English producer prose', () => {
    render(
      <CalendarSelectedDayInsight
        lang="fa"
        labels={labelsFor('fa')}
        reasoning={ENGLISH_PRODUCER}
        transit={[]}
        transitMeta={{}}
        loadingTransit={false}
      />
    );

    expect(screen.getByTestId('calendar-why-timing-summary').textContent).toBe(
      CALENDAR_PAGE_LANGS.fa.whyTimingFallback
    );
    expect(screen.queryByText(/Business Launch/i)).toBeNull();
    expect(screen.queryByText(/Transit Sun/i)).toBeNull();
  });

  it('renders no reasoning section when summary is absent', () => {
    render(
      <CalendarSelectedDayInsight
        lang="en"
        labels={labelsFor('en')}
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
        lang="en"
        labels={labelsFor('en')}
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

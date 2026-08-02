import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { WhyThisTiming } from './WhyThisTiming';
import type { ScoreReasoning } from '@/lib/score-reasoning';
import { CALENDAR_PAGE_LANGS } from '@/lib/calendar-page-i18n';

afterEach(() => {
  cleanup();
});

const enLabels = {
  dir: 'ltr' as const,
  whyTiming: CALENDAR_PAGE_LANGS.en.whyTiming,
  whyTimingFallback: CALENDAR_PAGE_LANGS.en.whyTimingFallback,
  supportingReasons: CALENDAR_PAGE_LANGS.en.supportingReasons,
};

const faLabels = {
  dir: 'rtl' as const,
  whyTiming: CALENDAR_PAGE_LANGS.fa.whyTiming,
  whyTimingFallback: CALENDAR_PAGE_LANGS.fa.whyTimingFallback,
  supportingReasons: CALENDAR_PAGE_LANGS.fa.supportingReasons,
};

const arLabels = {
  dir: 'rtl' as const,
  whyTiming: CALENDAR_PAGE_LANGS.ar.whyTiming,
  whyTimingFallback: CALENDAR_PAGE_LANGS.ar.whyTimingFallback,
  supportingReasons: CALENDAR_PAGE_LANGS.ar.supportingReasons,
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

const PERSIAN_PRODUCER: ScoreReasoning = {
  summary:
    'امتیاز راه‌اندازی کسب‌وکار در این روز در محدوده مناسب قرار دارد و حرکت رو به جلو قابل بررسی است.',
  confidence: 0.6,
  reasons: [
    {
      category: 'timing',
      importance: 'high',
      score: 10,
      title: 'پنجره حمایتی',
      explanation: 'شرایط روز برای اقدام کنترل‌شده مناسب‌تر است.',
      evidence: {},
    },
  ],
};

describe('WhyThisTiming', () => {
  it('renders producer summary in EN when present', () => {
    render(
      <WhyThisTiming lang="en" labels={enLabels} reasoning={ENGLISH_PRODUCER} />
    );
    expect(screen.getByTestId('calendar-why-timing-summary').textContent).toContain(
      'Business Launch scores'
    );
    expect(screen.queryByText(/0\.5/)).toBeNull();
  });

  it('renders nothing when summary is absent', () => {
    const { container } = render(
      <WhyThisTiming lang="en" labels={enLabels} reasoning={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('replaces English producer prose with FA fallback and hides English reasons', () => {
    render(
      <WhyThisTiming lang="fa" labels={faLabels} reasoning={ENGLISH_PRODUCER} />
    );
    const summary = screen.getByTestId('calendar-why-timing-summary');
    expect(summary.textContent).toBe(CALENDAR_PAGE_LANGS.fa.whyTimingFallback);
    expect(summary.getAttribute('data-why-timing-fallback')).toBe('true');
    expect(screen.queryByText(/Business Launch/i)).toBeNull();
    expect(screen.queryByText(/Transit Sun/i)).toBeNull();
    expect(screen.queryByTestId('calendar-supporting-reasons')).toBeNull();
  });

  it('replaces English producer prose with AR fallback', () => {
    render(
      <WhyThisTiming lang="ar" labels={arLabels} reasoning={ENGLISH_PRODUCER} />
    );
    expect(screen.getByTestId('calendar-why-timing-summary').textContent).toBe(
      CALENDAR_PAGE_LANGS.ar.whyTimingFallback
    );
    expect(screen.queryByText(/Business Launch/i)).toBeNull();
  });

  it('keeps Persian producer prose when UI language is FA', () => {
    render(
      <WhyThisTiming lang="fa" labels={faLabels} reasoning={PERSIAN_PRODUCER} />
    );
    expect(screen.getByTestId('calendar-why-timing-summary').textContent).toContain(
      'امتیاز راه‌اندازی'
    );
    expect(screen.getByTestId('calendar-supporting-reasons')).toBeTruthy();
    expect(screen.getByText('پنجره حمایتی')).toBeTruthy();
  });

  it('replaces English producer prose with RU fallback', () => {
    const ruLabels = {
      dir: 'ltr' as const,
      whyTiming: CALENDAR_PAGE_LANGS.ru.whyTiming,
      whyTimingFallback: CALENDAR_PAGE_LANGS.ru.whyTimingFallback,
      supportingReasons: CALENDAR_PAGE_LANGS.ru.supportingReasons,
    };
    render(
      <WhyThisTiming lang="ru" labels={ruLabels} reasoning={ENGLISH_PRODUCER} />
    );
    expect(screen.getByTestId('calendar-why-timing-summary').textContent).toBe(
      CALENDAR_PAGE_LANGS.ru.whyTimingFallback
    );
    expect(screen.queryByText(/Business Launch/i)).toBeNull();
  });
});

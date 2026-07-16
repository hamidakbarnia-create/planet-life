import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { WorldNewsBlock } from '@/app/world/page';
import type { WorldNewsResponse } from '@/lib/world-api';
import { formatNewsPublicationDate } from '@/lib/world-api';

const labels = {
  newsLowSignal: 'Not enough recent news is available for this topic.',
  newsUnavailable: 'News is temporarily unavailable. Please try again later.',
};

const published = 'Wed, 15 Jul 2026 10:00:00 GMT';
const expectedEnDate = formatNewsPublicationDate(published, 'en')!;

afterEach(() => {
  cleanup();
});

describe('WorldNewsBlock', () => {
  it('ok: renders headline, source, publication date; omits state messages', () => {
    const response: WorldNewsResponse = {
      topic: 'geopolitics',
      state: 'ok',
      items: [
        {
          title: 'Ceasefire talks advance',
          source: 'Reuters',
          link: 'https://example.com/ceasefire',
          published,
        },
      ],
    };

    render(<WorldNewsBlock response={response} lang="en" labels={labels} />);

    expect(screen.getByText(/Ceasefire talks advance/)).toBeTruthy();
    expect(screen.getByTestId('world-news-meta').textContent).toContain('Reuters');
    expect(screen.getByTestId('world-news-meta').textContent).toContain(expectedEnDate);
    expect(screen.queryByTestId('world-news-low-signal')).toBeNull();
    expect(screen.queryByTestId('world-news-unavailable')).toBeNull();
    expect(screen.queryByText(labels.newsLowSignal)).toBeNull();
    expect(screen.queryByText(labels.newsUnavailable)).toBeNull();
  });

  it('low_signal: renders low-signal message and keeps partial items', () => {
    const response: WorldNewsResponse = {
      topic: 'markets',
      state: 'low_signal',
      items: [
        {
          title: 'Lone market note',
          source: 'Bloomberg',
          link: 'https://example.com/lone',
          published,
        },
      ],
    };

    render(<WorldNewsBlock response={response} lang="en" labels={labels} />);

    expect(screen.getByTestId('world-news-low-signal')).toBeTruthy();
    expect(screen.getByText(labels.newsLowSignal)).toBeTruthy();
    expect(screen.getByText(/Lone market note/)).toBeTruthy();
    expect(screen.queryByTestId('world-news-unavailable')).toBeNull();
    expect(screen.queryByText(labels.newsUnavailable)).toBeNull();
  });

  it('low_signal with zero items: message only, not unavailable copy', () => {
    const response: WorldNewsResponse = {
      topic: 'markets',
      state: 'low_signal',
      items: [],
    };

    render(<WorldNewsBlock response={response} lang="en" labels={labels} />);

    expect(screen.getByText(labels.newsLowSignal)).toBeTruthy();
    expect(screen.queryByTestId('world-news-list')).toBeNull();
    expect(screen.queryByText(labels.newsUnavailable)).toBeNull();
  });

  it('unavailable: renders unavailable message only', () => {
    const response: WorldNewsResponse = {
      topic: 'geopolitics',
      state: 'unavailable',
      items: [],
    };

    render(<WorldNewsBlock response={response} lang="en" labels={labels} />);

    expect(screen.getByTestId('world-news-unavailable')).toBeTruthy();
    expect(screen.getByText(labels.newsUnavailable)).toBeTruthy();
    expect(screen.queryByTestId('world-news-low-signal')).toBeNull();
    expect(screen.queryByText(labels.newsLowSignal)).toBeNull();
    expect(screen.queryByTestId('world-news-list')).toBeNull();
  });

  it('formats publication dates with the active locale (fa)', () => {
    const response: WorldNewsResponse = {
      topic: 'geopolitics',
      state: 'ok',
      items: [
        {
          title: 'خبر نمونه',
          source: 'منبع',
          link: 'https://example.com/fa',
          published,
        },
      ],
    };
    const expectedFa = formatNewsPublicationDate(published, 'fa')!;

    render(<WorldNewsBlock response={response} lang="fa" labels={labels} />);

    expect(screen.getByTestId('world-news-meta').textContent).toContain(expectedFa);
  });

  it('omits only the date label when published is invalid; does not crash or reclassify', () => {
    const response: WorldNewsResponse = {
      topic: 'geopolitics',
      state: 'ok',
      items: [
        {
          title: 'Odd stamp',
          source: 'Wire',
          link: 'https://example.com/odd',
          published: 'not-a-real-date',
        },
      ],
    };

    render(<WorldNewsBlock response={response} lang="en" labels={labels} />);

    expect(screen.getByText(/Odd stamp/)).toBeTruthy();
    expect(screen.getByTestId('world-news-meta').textContent).toBe('Wire');
    expect(screen.queryByTestId('world-news-low-signal')).toBeNull();
    expect(screen.queryByTestId('world-news-unavailable')).toBeNull();
  });
});

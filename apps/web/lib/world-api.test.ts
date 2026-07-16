import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  assertNever,
  fetchNews,
  fetchNewsQuery,
  formatNewsPublicationDate,
  type WorldNewsResponse,
  type WorldNewsState,
} from './world-api';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('formatNewsPublicationDate', () => {
  const published = 'Wed, 15 Jul 2026 10:00:00 GMT';

  it('formats with en-GB style absolute date', () => {
    const label = formatNewsPublicationDate(published, 'en');
    expect(label).toBe(new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(published)));
  });

  it('formats with fa-IR locale', () => {
    const label = formatNewsPublicationDate(published, 'fa');
    expect(label).toBe(new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(published)));
  });

  it('formats with ar-EG locale', () => {
    const label = formatNewsPublicationDate(published, 'ar');
    expect(label).toBe(new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(published)));
  });

  it('returns null for invalid timestamps without throwing', () => {
    expect(formatNewsPublicationDate('not-a-date', 'en')).toBeNull();
    expect(formatNewsPublicationDate('', 'en')).toBeNull();
  });
});

describe('fetchNews / fetchNewsQuery — typed BFF contract', () => {
  it('returns the BFF ok payload unchanged', async () => {
    const payload: WorldNewsResponse = {
      topic: 'geopolitics',
      state: 'ok',
      items: [
        {
          title: 'A',
          source: 'Wire',
          link: 'https://example.com/a',
          published: 'Wed, 15 Jul 2026 10:00:00 GMT',
        },
      ],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => payload,
      }),
    );

    await expect(fetchNews('geopolitics', 'en')).resolves.toEqual(payload);
  });

  it('returns low_signal payloads without reinterpreting items', async () => {
    const payload: WorldNewsResponse = {
      topic: 'markets',
      state: 'low_signal',
      items: [
        {
          title: 'Only one',
          source: 'Wire',
          link: 'https://example.com/one',
          published: 'Wed, 15 Jul 2026 10:00:00 GMT',
        },
      ],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => payload,
      }),
    );

    await expect(fetchNews('markets', 'en')).resolves.toEqual(payload);
  });

  it('maps non-ok HTTP to unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => ({}),
      }),
    );

    await expect(fetchNews('geopolitics', 'en')).resolves.toEqual({
      topic: 'geopolitics',
      state: 'unavailable',
      items: [],
    });
  });

  it('maps network failure to unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(fetchNewsQuery('oil prices', 'en')).resolves.toEqual({
      topic: 'oil prices',
      state: 'unavailable',
      items: [],
    });
  });

  it('maps legacy payloads without state to unavailable (does not invent ok)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ topic: 'geopolitics', items: [] }),
      }),
    );

    await expect(fetchNews('geopolitics', 'en')).resolves.toEqual({
      topic: 'geopolitics',
      state: 'unavailable',
      items: [],
    });
  });
});

describe('assertNever', () => {
  it('supports exhaustive WorldNewsState switches at compile time', () => {
    function labelFor(state: WorldNewsState): string {
      switch (state) {
        case 'ok':
          return 'ok';
        case 'low_signal':
          return 'low_signal';
        case 'unavailable':
          return 'unavailable';
        default:
          return assertNever(state);
      }
    }
    expect(labelFor('ok')).toBe('ok');
    expect(labelFor('low_signal')).toBe('low_signal');
    expect(labelFor('unavailable')).toBe('unavailable');
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/world/news/route';

/** Fixed request time for deterministic freshness classification. */
const NOW = new Date('2026-07-16T12:00:00.000Z');

function makeReq(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/world/news');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

function rssItem(opts: {
  title: string;
  source: string;
  link: string;
  published: string;
}): string {
  return `<item>
    <title><![CDATA[${opts.title}]]></title>
    <source>${opts.source}</source>
    <link>${opts.link}</link>
    <pubDate>${opts.published}</pubDate>
  </item>`;
}

function rssFeed(itemsXml: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>News</title>${itemsXml}</channel></rss>`;
}

function mockUpstreamOk(body: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => body,
    }),
  );
}

function daysAgoRfc822(days: number): string {
  const d = new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
  return d.toUTCString();
}

function validItem(n: number, daysOld: number) {
  return rssItem({
    title: `Headline ${n}`,
    source: `Source ${n}`,
    link: `https://example.com/story-${n}`,
    published: daysAgoRfc822(daysOld),
  });
}

describe('GET /api/world/news — BFF state contract', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('returns ok with publication timestamps when coverage is sufficient', async () => {
    mockUpstreamOk(rssFeed(validItem(1, 1) + validItem(2, 2) + validItem(3, 3)));

    const res = await GET(makeReq({ topic: 'geopolitics', lang: 'en' }));
    const body = await res.json();

    expect(body.state).toBe('ok');
    expect(body.topic).toBe('geopolitics');
    expect(body.items.length).toBeGreaterThanOrEqual(2);
    for (const item of body.items) {
      expect(item.published).toBeTruthy();
      const pub = Date.parse(item.published);
      expect(Number.isNaN(pub)).toBe(false);
      const ageMs = NOW.getTime() - pub;
      expect(ageMs).toBeGreaterThanOrEqual(0);
      expect(ageMs).toBeLessThanOrEqual(30 * 24 * 60 * 60 * 1000);
    }
  });

  it('returns low_signal for a healthy empty RSS feed', async () => {
    mockUpstreamOk(rssFeed(''));

    const res = await GET(makeReq({ topic: 'markets' }));
    const body = await res.json();

    expect(body.state).toBe('low_signal');
    expect(body.state).not.toBe('unavailable');
    expect(body.items).toEqual([]);
  });

  it('returns low_signal when all items fail freshness/credibility', async () => {
    mockUpstreamOk(
      rssFeed(
        rssItem({
          title: 'Ancient story',
          source: 'Wire',
          link: 'https://example.com/old',
          published: daysAgoRfc822(45),
        }) +
          rssItem({
            title: '',
            source: 'Wire',
            link: 'https://example.com/empty-title',
            published: daysAgoRfc822(1),
          }) +
          rssItem({
            title: 'No date',
            source: 'Wire',
            link: 'https://example.com/nodate',
            published: '',
          }),
      ),
    );

    const res = await GET(makeReq({ topic: 'geopolitics' }));
    const body = await res.json();

    expect(body.state).toBe('low_signal');
    expect(body.items).toEqual([]);
  });

  it('returns low_signal with the partial item when coverage is below MINIMUM_SIGNAL_ITEMS', async () => {
    mockUpstreamOk(rssFeed(validItem(1, 1)));

    const res = await GET(makeReq({ topic: 'geopolitics' }));
    const body = await res.json();

    expect(body.state).toBe('low_signal');
    expect(body.items).toHaveLength(1);
    expect(body.items[0].title).toBe('Headline 1');
    expect(body.items[0].published).toBeTruthy();
  });

  it('returns unavailable with empty items on upstream 500', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'error',
      }),
    );

    const res = await GET(makeReq({ topic: 'geopolitics' }));
    const body = await res.json();

    expect(body).toEqual({ topic: 'geopolitics', state: 'unavailable', items: [] });
  });

  it('returns unavailable on upstream timeout/abort', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError')),
    );

    const res = await GET(makeReq({ topic: 'markets' }));
    const body = await res.json();

    expect(body).toEqual({ topic: 'markets', state: 'unavailable', items: [] });
  });

  it('returns unavailable on network rejection', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const res = await GET(makeReq({ topic: 'realEstate' }));
    const body = await res.json();

    expect(body).toEqual({ topic: 'realEstate', state: 'unavailable', items: [] });
  });

  it('returns unavailable for structurally unusable provider payload', async () => {
    mockUpstreamOk('{"error":"not rss"}');

    const res = await GET(makeReq({ topic: 'geopolitics' }));
    const body = await res.json();

    expect(body.state).toBe('unavailable');
    expect(body.items).toEqual([]);
  });

  it('distinguishes empty valid RSS (low_signal) from HTML error body (unavailable)', async () => {
    mockUpstreamOk('<!DOCTYPE html><html><body>Service unavailable</body></html>');

    const res = await GET(makeReq({ topic: 'geopolitics' }));
    const body = await res.json();

    expect(body.state).toBe('unavailable');
    expect(body.items).toEqual([]);
  });

  it('enforces the response item cap', async () => {
    const many = Array.from({ length: 12 }, (_, i) => validItem(i + 1, i % 5)).join('');
    mockUpstreamOk(rssFeed(many));

    const res = await GET(makeReq({ topic: 'geopolitics' }));
    const body = await res.json();

    expect(body.state).toBe('ok');
    expect(body.items.length).toBeLessThanOrEqual(8);
  });

  it('passes AbortSignal.timeout to upstream fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => rssFeed(validItem(1, 1) + validItem(2, 2)),
    });
    vi.stubGlobal('fetch', fetchMock);

    await GET(makeReq({ topic: 'geopolitics' }));

    expect(fetchMock).toHaveBeenCalled();
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBeDefined();
  });
});

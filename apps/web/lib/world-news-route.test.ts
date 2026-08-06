import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  GET,
  PER_ATTEMPT_TIMEOUT_MS,
  RETRY_DELAY_MAX_MS,
  RETRY_DELAY_MIN_MS,
  UPSTREAM_TOTAL_BUDGET_MS,
  computeRetryDelayMs,
  worldNewsRetryControls,
} from '@/app/api/world/news/route';

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

function okResponse(body: string) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: { get: () => 'application/rss+xml' },
    text: async () => body,
  };
}

function nonOkResponse(status: number, statusText = 'Error') {
  return {
    ok: false,
    status,
    statusText,
    headers: { get: () => 'text/html' },
    text: async () => 'error',
  };
}

function mockUpstreamOk(body: string) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(body)));
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

const sufficientFeed = () => rssFeed(validItem(1, 1) + validItem(2, 2) + validItem(3, 3));

describe('GET /api/world/news — BFF state contract', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.spyOn(worldNewsRetryControls, 'delay').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns ok with publication timestamps when coverage is sufficient', async () => {
    mockUpstreamOk(sufficientFeed());

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

  it('returns low_signal for a healthy empty RSS feed with exactly one fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(rssFeed('')));
    vi.stubGlobal('fetch', fetchMock);

    const res = await GET(makeReq({ topic: 'markets' }));
    const body = await res.json();

    expect(body.state).toBe('low_signal');
    expect(body.state).not.toBe('unavailable');
    expect(body.items).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
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

  it('returns unavailable after retrying persistent upstream 500 (exactly two fetches)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(nonOkResponse(500, 'Internal Server Error'));
    vi.stubGlobal('fetch', fetchMock);

    const res = await GET(makeReq({ topic: 'geopolitics' }));
    const body = await res.json();

    expect(body).toEqual({ topic: 'geopolitics', state: 'unavailable', items: [] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns unavailable on persistent timeout/abort after exactly two fetches', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError'));
    vi.stubGlobal('fetch', fetchMock);

    const res = await GET(makeReq({ topic: 'markets' }));
    const body = await res.json();

    expect(body).toEqual({ topic: 'markets', state: 'unavailable', items: [] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns unavailable on network rejection without retry (one fetch)', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);

    const res = await GET(makeReq({ topic: 'realEstate' }));
    const body = await res.json();

    expect(body).toEqual({ topic: 'realEstate', state: 'unavailable', items: [] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns unavailable for structurally unusable provider payload with one fetch only', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse('{"error":"not rss"}'));
    vi.stubGlobal('fetch', fetchMock);

    const res = await GET(makeReq({ topic: 'geopolitics' }));
    const body = await res.json();

    expect(body.state).toBe('unavailable');
    expect(body.items).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
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

  it('passes per-attempt AbortSignal.timeout within the total budget', async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');
    const fetchMock = vi.fn().mockResolvedValue(okResponse(sufficientFeed()));
    vi.stubGlobal('fetch', fetchMock);

    await GET(makeReq({ topic: 'geopolitics' }));

    expect(timeoutSpy).toHaveBeenCalledWith(PER_ATTEMPT_TIMEOUT_MS);
    expect(fetchMock).toHaveBeenCalled();
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBeDefined();
  });
});

describe('GET /api/world/news — bounded upstream retry', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.spyOn(worldNewsRetryControls, 'delay').mockResolvedValue(undefined);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('retries once on 503 then succeeds on 200', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(nonOkResponse(503, 'Service Unavailable'))
      .mockResolvedValueOnce(okResponse(sufficientFeed()));
    vi.stubGlobal('fetch', fetchMock);

    const res = await GET(makeReq({ topic: 'geopolitics', lang: 'en' }));
    const body = await res.json();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(body.state).toBe('ok');
    expect(body.items.length).toBeGreaterThanOrEqual(2);
    expect(worldNewsRetryControls.delay).toHaveBeenCalledTimes(1);
  });

  it('retries once on TimeoutError then succeeds on 200', async () => {
    const timeoutErr = new DOMException('The operation timed out.', 'TimeoutError');
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(timeoutErr)
      .mockResolvedValueOnce(okResponse(sufficientFeed()));
    vi.stubGlobal('fetch', fetchMock);

    const res = await GET(makeReq({ topic: 'markets', lang: 'en' }));
    const body = await res.json();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(body.state).toBe('ok');
    expect(body.items.length).toBeGreaterThanOrEqual(2);
  });

  it('retries 429 once then returns unavailable after second failure', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(nonOkResponse(429, 'Too Many Requests'))
      .mockResolvedValueOnce(nonOkResponse(503, 'Service Unavailable'));
    vi.stubGlobal('fetch', fetchMock);

    const res = await GET(makeReq({ topic: 'geopolitics' }));
    const body = await res.json();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(body).toEqual({ topic: 'geopolitics', state: 'unavailable', items: [] });
  });

  it('does not retry HTTP 403 (one fetch only)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(nonOkResponse(403, 'Forbidden'));
    vi.stubGlobal('fetch', fetchMock);

    const res = await GET(makeReq({ topic: 'geopolitics' }));
    const body = await res.json();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(body).toEqual({ topic: 'geopolitics', state: 'unavailable', items: [] });
    expect(worldNewsRetryControls.delay).not.toHaveBeenCalled();
  });

  it('does not retry invalid upstream payload (one fetch only)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse('{"not":"rss"}'));
    vi.stubGlobal('fetch', fetchMock);

    const res = await GET(makeReq({ topic: 'geopolitics' }));
    const body = await res.json();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(body).toEqual({ topic: 'geopolitics', state: 'unavailable', items: [] });
    expect(worldNewsRetryControls.delay).not.toHaveBeenCalled();
  });

  it('logs attempt 1 then attempt 2 on retryable failure path', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(nonOkResponse(503, 'Service Unavailable'))
      .mockResolvedValueOnce(nonOkResponse(503, 'Service Unavailable'));
    vi.stubGlobal('fetch', fetchMock);

    await GET(makeReq({ topic: 'geopolitics', lang: 'fa' }));

    const payloads = errorSpy.mock.calls.map((c) => c[1] as Record<string, unknown>);
    expect(payloads).toHaveLength(2);
    expect(payloads[0]).toMatchObject({
      event: 'upstream_non_ok',
      topic: 'geopolitics',
      lang: 'fa',
      attempt: 1,
      status: 503,
    });
    expect(payloads[1]).toMatchObject({
      event: 'upstream_non_ok',
      topic: 'geopolitics',
      lang: 'fa',
      attempt: 2,
      status: 503,
    });
  });

  it('logs attempt on fetch failure and omits query string from url', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new DOMException('The operation timed out.', 'TimeoutError'))
      .mockRejectedValueOnce(new DOMException('The operation timed out.', 'TimeoutError'));
    vi.stubGlobal('fetch', fetchMock);

    await GET(makeReq({ topic: 'markets', lang: 'en' }));

    const payloads = errorSpy.mock.calls.map((c) => c[1] as Record<string, unknown>);
    expect(payloads).toHaveLength(2);
    for (const p of payloads) {
      expect(p.event).toBe('upstream_fetch_failed');
      expect(p.url).toBe('news.google.com/rss/search');
      expect(String(p.url)).not.toContain('?');
      expect(String(p.url)).not.toContain('q=');
    }
    expect(payloads[0].attempt).toBe(1);
    expect(payloads[1].attempt).toBe(2);
  });

  it('logs attempt on invalid_upstream_payload without retry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse('<html>nope</html>')));

    await GET(makeReq({ topic: 'geopolitics', lang: 'en' }));

    const payloads = errorSpy.mock.calls.map((c) => c[1] as Record<string, unknown>);
    expect(payloads).toHaveLength(1);
    expect(payloads[0]).toMatchObject({
      event: 'invalid_upstream_payload',
      attempt: 1,
      url: 'news.google.com/rss/search',
    });
    expect(String(payloads[0].url)).not.toContain('?');
  });

  it('keeps total upstream budget bounded across attempts and delay', () => {
    expect(PER_ATTEMPT_TIMEOUT_MS * 2 + RETRY_DELAY_MAX_MS).toBe(UPSTREAM_TOTAL_BUDGET_MS);
    expect(UPSTREAM_TOTAL_BUDGET_MS).toBe(8_000);
    expect(PER_ATTEMPT_TIMEOUT_MS).toBe(3_750);
  });

  it('computeRetryDelayMs stays within 250–500ms inclusive', () => {
    expect(computeRetryDelayMs(() => 0)).toBe(RETRY_DELAY_MIN_MS);
    expect(computeRetryDelayMs(() => 0.999999)).toBe(RETRY_DELAY_MAX_MS);
    for (let i = 0; i < 20; i++) {
      const ms = computeRetryDelayMs(() => i / 20);
      expect(ms).toBeGreaterThanOrEqual(RETRY_DELAY_MIN_MS);
      expect(ms).toBeLessThanOrEqual(RETRY_DELAY_MAX_MS);
    }
  });
});

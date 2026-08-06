import { NextRequest, NextResponse } from 'next/server';
import { applyFreshnessPolicy } from '@/lib/world-news-freshness';
import type { WorldNewsResponse, WorldNewsState } from '@/lib/world-api';

// Free live headlines via Google News RSS (no API key). Returns the top items
// for a topic. Language follows the app language so RU/FA/AR users get native
// headlines. Upgrade path: swap to NewsAPI/GNews with a key later.
// Freshness: ADR-0008 enforced via applyFreshnessPolicy (publication timestamp).
// Coverage state: classified here in the BFF (ok | low_signal | unavailable).
// Upstream retry: implementation-owned under ADR-0008 Non-Decisions.

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TOPIC_QUERIES: Record<string, string> = {
  geopolitics: '(Iran OR Israel OR Russia OR Ukraine OR China) (war OR attack OR conflict OR sanctions)',
  markets: '(Brent OR crude oil OR gold OR Bitcoin OR stock market) price',
  realEstate: '(real estate OR housing market OR property prices) (Dubai OR London OR global)',
};

// app lang -> Google News hl / gl / ceid
const LANG_LOCALE: Record<string, { hl: string; gl: string; ceid: string }> = {
  en: { hl: 'en-US', gl: 'US', ceid: 'US:en' },
  ru: { hl: 'ru', gl: 'RU', ceid: 'RU:ru' },
  fa: { hl: 'fa', gl: 'IR', ceid: 'IR:fa' },
  ar: { hl: 'ar', gl: 'EG', ceid: 'EG:ar' },
};

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const RESPONSE_ITEM_CAP = 8;

/** Sufficient usable coverage after freshness/credibility; below this is low_signal. */
const MINIMUM_SIGNAL_ITEMS = 2;

/**
 * Existing contractual total upstream latency budget (formerly a single
 * AbortSignal.timeout of this duration).
 */
export const UPSTREAM_TOTAL_BUDGET_MS = 8_000;

/** Randomized delay between attempts (inclusive). */
export const RETRY_DELAY_MIN_MS = 250;
export const RETRY_DELAY_MAX_MS = 500;

/**
 * Per-attempt timeout. Worst case:
 * PER_ATTEMPT_TIMEOUT_MS + RETRY_DELAY_MAX_MS + PER_ATTEMPT_TIMEOUT_MS
 * === UPSTREAM_TOTAL_BUDGET_MS
 */
export const PER_ATTEMPT_TIMEOUT_MS = Math.floor(
  (UPSTREAM_TOTAL_BUDGET_MS - RETRY_DELAY_MAX_MS) / 2,
);

const MAX_ATTEMPTS = 2;

const RETRYABLE_HTTP_STATUSES = new Set([429, 500, 502, 503, 504]);

/** Test seam: delay / jitter without sleeping in unit tests. */
export const worldNewsRetryControls = {
  delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
  random(): number {
    return Math.random();
  },
};

export function computeRetryDelayMs(random: () => number = worldNewsRetryControls.random): number {
  const span = RETRY_DELAY_MAX_MS - RETRY_DELAY_MIN_MS;
  return RETRY_DELAY_MIN_MS + Math.floor(random() * (span + 1));
}

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function pick(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? decode(m[1]) : '';
}

type Item = { title: string; source: string; link: string; published: string };

/** True when the body is a processable RSS/Atom feed (may still contain zero items). */
function isProcessableFeed(xml: string): boolean {
  const trimmed = xml.trim();
  if (!trimmed) return false;
  return /<(?:rss|rdf:RDF|feed)\b/i.test(trimmed) || /<channel\b/i.test(trimmed);
}

function unavailable(topic: string): WorldNewsResponse {
  return { topic, state: 'unavailable', items: [] };
}

function classifyCoverage(acceptedCount: number): Exclude<WorldNewsState, 'unavailable'> {
  return acceptedCount >= MINIMUM_SIGNAL_ITEMS ? 'ok' : 'low_signal';
}

/** Hostname + pathname only — never the query string. */
function safeUpstreamPath(requestUrl: string): string {
  try {
    const parsed = new URL(requestUrl);
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return 'invalid-upstream-url';
  }
}

function upstreamContentType(res: Response): string | null {
  try {
    return res.headers?.get?.('content-type') ?? null;
  } catch {
    return null;
  }
}

function isRetryableHttpStatus(status: number): boolean {
  return RETRYABLE_HTTP_STATUSES.has(status);
}

function errorName(error: unknown): string {
  if (error instanceof Error) return error.name;
  if (error && typeof error === 'object' && 'name' in error) {
    const name = (error as { name: unknown }).name;
    if (typeof name === 'string' && name) return name;
  }
  return 'UnknownError';
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/** TimeoutError / timeout-triggered AbortError only — not arbitrary network errors. */
function isRetryableFetchError(error: unknown): boolean {
  const name = errorName(error);
  if (name === 'TimeoutError' || name === 'AbortError') return true;
  const raw = String(error);
  return /TimeoutError/i.test(raw) || /AbortError/i.test(raw);
}

function logUpstreamNonOk(
  topic: string,
  lang: string,
  requestUrl: string,
  res: Response,
  attempt: number,
): void {
  console.error('[world-news]', {
    event: 'upstream_non_ok',
    topic,
    lang,
    url: safeUpstreamPath(requestUrl),
    status: res.status,
    statusText: res.statusText,
    contentType: upstreamContentType(res),
    attempt,
  });
}

function logInvalidPayload(
  topic: string,
  lang: string,
  requestUrl: string,
  res: Response,
  xml: string,
  attempt: number,
): void {
  const prefix = xml.slice(0, 120).replace(/\s+/g, ' ').trim();
  console.error('[world-news]', {
    event: 'invalid_upstream_payload',
    topic,
    lang,
    url: safeUpstreamPath(requestUrl),
    contentType: upstreamContentType(res),
    prefix,
    attempt,
  });
}

function logFetchFailed(
  topic: string,
  lang: string,
  requestUrl: string,
  error: unknown,
  attempt: number,
): void {
  console.error('[world-news]', {
    event: 'upstream_fetch_failed',
    topic,
    lang,
    url: safeUpstreamPath(requestUrl),
    name: error instanceof Error ? error.name : 'UnknownError',
    message: error instanceof Error ? error.message : String(error),
    attempt,
  });
}

export async function GET(req: NextRequest) {
  const topic = req.nextUrl.searchParams.get('topic') || 'geopolitics';
  const lang = req.nextUrl.searchParams.get('lang') || 'en';
  const query = req.nextUrl.searchParams.get('q') || TOPIC_QUERIES[topic] || TOPIC_QUERIES.geopolitics;
  const loc = LANG_LOCALE[lang] || LANG_LOCALE.en;
  const requestUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${loc.hl}&gl=${loc.gl}&ceid=${loc.ceid}`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(requestUrl, {
        headers: { 'User-Agent': UA },
        cache: 'no-store',
        signal: AbortSignal.timeout(PER_ATTEMPT_TIMEOUT_MS),
      });

      if (!res.ok) {
        logUpstreamNonOk(topic, lang, requestUrl, res, attempt);
        if (attempt < MAX_ATTEMPTS && isRetryableHttpStatus(res.status)) {
          await worldNewsRetryControls.delay(computeRetryDelayMs());
          continue;
        }
        return NextResponse.json(unavailable(topic));
      }

      const xml = await res.text();
      if (!isProcessableFeed(xml)) {
        logInvalidPayload(topic, lang, requestUrl, res, xml, attempt);
        // Invalid payload is never retried.
        return NextResponse.json(unavailable(topic));
      }

      const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      const parsed: Item[] = blocks.map((b) => {
        let title = pick(b, 'title');
        let source = pick(b, 'source');
        // Google appends " - Source" to titles; split it out when source is empty.
        if (!source && title.includes(' - ')) {
          const idx = title.lastIndexOf(' - ');
          source = title.slice(idx + 3).trim();
          title = title.slice(0, idx).trim();
        }
        return {
          title,
          source,
          link: pick(b, 'link'),
          published: pick(b, 'pubDate'),
        };
      });

      // Request time injected at the BFF boundary; policy module stays pure.
      // minimumPrimaryItems shares MINIMUM_SIGNAL_ITEMS so ADR-0008 fallback
      // gating and low_signal classification use one named threshold.
      const now = new Date();
      const items = applyFreshnessPolicy(parsed, now, {
        minimumPrimaryItems: MINIMUM_SIGNAL_ITEMS,
      }).slice(0, RESPONSE_ITEM_CAP);

      const state = classifyCoverage(items.length);
      const body: WorldNewsResponse = { topic, state, items };

      return NextResponse.json(body, {
        headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=1200' },
      });
    } catch (error) {
      logFetchFailed(topic, lang, requestUrl, error, attempt);
      if (attempt < MAX_ATTEMPTS && isRetryableFetchError(error)) {
        await worldNewsRetryControls.delay(computeRetryDelayMs());
        continue;
      }
      return NextResponse.json(unavailable(topic));
    }
  }

  // Unreachable: loop always returns, but keeps TypeScript exhaustive.
  return NextResponse.json(unavailable(topic));
}

import { NextRequest, NextResponse } from 'next/server';
import { applyFreshnessPolicy } from '@/lib/world-news-freshness';
import type { WorldNewsResponse, WorldNewsState } from '@/lib/world-api';

// Free live headlines via Google News RSS (no API key). Returns the top items
// for a topic. Language follows the app language so RU/FA/AR users get native
// headlines. Upgrade path: swap to NewsAPI/GNews with a key later.
// Freshness: ADR-0008 enforced via applyFreshnessPolicy (publication timestamp).
// Coverage state: classified here in the BFF (ok | low_signal | unavailable).

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

/** Upstream RSS fetch budget (Node 20 AbortSignal.timeout). */
const UPSTREAM_TIMEOUT_MS = 8_000;

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

export async function GET(req: NextRequest) {
  const topic = req.nextUrl.searchParams.get('topic') || 'geopolitics';
  const lang = req.nextUrl.searchParams.get('lang') || 'en';
  const query = req.nextUrl.searchParams.get('q') || TOPIC_QUERIES[topic] || TOPIC_QUERIES.geopolitics;
  const loc = LANG_LOCALE[lang] || LANG_LOCALE.en;

  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${loc.hl}&gl=${loc.gl}&ceid=${loc.ceid}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      cache: 'no-store',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!res.ok) {
      return NextResponse.json(unavailable(topic));
    }
    const xml = await res.text();
    if (!isProcessableFeed(xml)) {
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
  } catch {
    return NextResponse.json(unavailable(topic));
  }
}

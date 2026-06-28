import { NextRequest, NextResponse } from 'next/server';

// Free live headlines via Google News RSS (no API key). Returns the top items
// for a topic. Language follows the app language so RU/FA/AR users get native
// headlines. Upgrade path: swap to NewsAPI/GNews with a key later.

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

export async function GET(req: NextRequest) {
  const topic = req.nextUrl.searchParams.get('topic') || 'geopolitics';
  const lang = req.nextUrl.searchParams.get('lang') || 'en';
  const query = req.nextUrl.searchParams.get('q') || TOPIC_QUERIES[topic] || TOPIC_QUERIES.geopolitics;
  const loc = LANG_LOCALE[lang] || LANG_LOCALE.en;

  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${loc.hl}&gl=${loc.gl}&ceid=${loc.ceid}`;
    const res = await fetch(url, { headers: { 'User-Agent': UA }, cache: 'no-store' });
    if (!res.ok) return NextResponse.json({ topic, items: [] });
    const xml = await res.text();
    const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    const items: Item[] = blocks.slice(0, 8).map((b) => {
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
    return NextResponse.json(
      { topic, items },
      { headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=1200' } }
    );
  } catch {
    return NextResponse.json({ topic, items: [] });
  }
}

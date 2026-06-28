import { NextResponse } from 'next/server';

// Free, no-key live quotes. Yahoo Finance gives price + previous close (so we
// can show today's % change); Stooq is a backup that returns last close only.
// Nothing here needs an API key — upgrade to Finnhub/Alpha Vantage later.

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Quote = {
  symbol: string;
  key: string;
  label: string;
  price: number | null;
  changePct: number | null;
  currency: string;
};

const INSTRUMENTS: { key: string; label: string; yahoo: string; stooq: string }[] = [
  { key: 'brent', label: 'Brent Oil', yahoo: 'BZ=F', stooq: 'cb.f' },
  { key: 'wti', label: 'WTI Crude', yahoo: 'CL=F', stooq: 'cl.f' },
  { key: 'gold', label: 'Gold', yahoo: 'GC=F', stooq: 'gc.f' },
  { key: 'btc', label: 'Bitcoin', yahoo: 'BTC-USD', stooq: 'btcusd' },
  { key: 'sp500', label: 'S&P 500', yahoo: '^GSPC', stooq: '^spx' },
  { key: 'eurusd', label: 'EUR / USD', yahoo: 'EURUSD=X', stooq: 'eurusd' },
];

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

async function fromYahoo(inst: (typeof INSTRUMENTS)[number]): Promise<Quote | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(inst.yahoo)}?interval=1d&range=5d`,
      { headers: { 'User-Agent': UA, Accept: 'application/json' }, cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const price: number | null = meta.regularMarketPrice ?? null;
    const prev: number | null = meta.chartPreviousClose ?? meta.previousClose ?? null;
    const changePct =
      price != null && prev != null && prev !== 0 ? ((price - prev) / prev) * 100 : null;
    return {
      symbol: inst.yahoo,
      key: inst.key,
      label: inst.label,
      price: price != null ? Number(price.toFixed(price < 10 ? 4 : 2)) : null,
      changePct: changePct != null ? Number(changePct.toFixed(2)) : null,
      currency: meta.currency ?? 'USD',
    };
  } catch {
    return null;
  }
}

async function fromStooq(inst: (typeof INSTRUMENTS)[number]): Promise<Quote | null> {
  try {
    const res = await fetch(
      `https://stooq.com/q/l/?s=${encodeURIComponent(inst.stooq)}&f=sd2t2ohlcv&h&e=csv`,
      { headers: { 'User-Agent': UA }, cache: 'no-store' }
    );
    if (!res.ok) return null;
    const text = await res.text();
    const lines = text.trim().split('\n');
    if (lines.length < 2) return null;
    const cols = lines[1].split(',');
    const close = parseFloat(cols[6]);
    if (Number.isNaN(close)) return null;
    return {
      symbol: inst.stooq,
      key: inst.key,
      label: inst.label,
      price: Number(close.toFixed(close < 10 ? 4 : 2)),
      changePct: null,
      currency: 'USD',
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const quotes = await Promise.all(
    INSTRUMENTS.map(async (inst) => {
      const y = await fromYahoo(inst);
      if (y && y.price != null) return y;
      const s = await fromStooq(inst);
      if (s) return s;
      return {
        symbol: inst.yahoo,
        key: inst.key,
        label: inst.label,
        price: null,
        changePct: null,
        currency: 'USD',
      } as Quote;
    })
  );
  return NextResponse.json(
    { computed_at: new Date().toISOString(), quotes },
    { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } }
  );
}

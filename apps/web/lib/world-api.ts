import { API_BASE } from './calendar-scores';

export interface MarketQuote {
  symbol: string;
  key: string;
  label: string;
  price: number | null;
  changePct: number | null;
  currency: string;
}

export interface MarketsResponse {
  computed_at: string;
  quotes: MarketQuote[];
}

export interface NewsItem {
  title: string;
  source: string;
  link: string;
  published: string;
}

export interface SkySignal {
  kind: 'aspect' | 'placement' | 'angular';
  theme?: string;
  topic: string;
  tone: 'tension' | 'supportive' | 'context';
  p1?: string;
  p2?: string;
  aspect?: string;
  planet?: string;
  sign?: string;
  angle?: string;
  retrograde?: boolean;
  orb?: number;
}

export interface FigureSignalRaw {
  kind: 'transit';
  transit_planet: string;
  natal_planet: string;
  aspect: string;
  orb: number;
  tone: 'tension' | 'supportive' | 'context';
  topic: string;
}

export interface FigureResponse {
  found: boolean;
  name?: string;
  role?: string;
  time_known?: boolean;
  signals?: FigureSignalRaw[];
}

export interface CitySignalRaw {
  kind: 'angular' | 'placement';
  theme: string;
  topic: string;
  tone: 'tension' | 'supportive' | 'context';
  planet: string;
  angle?: string;
  sign?: string;
  house?: number;
  orb?: number;
}

export interface CityResponse {
  computed_at: string;
  signals: CitySignalRaw[];
}

export interface SkyResponse {
  computed_at: string;
  themes: {
    markets: SkySignal[];
    geopolitics: SkySignal[];
  };
}

export async function fetchMarkets(): Promise<MarketsResponse> {
  const res = await fetch('/api/world/markets', { cache: 'no-store' });
  if (!res.ok) throw new Error('markets unavailable');
  return (await res.json()) as MarketsResponse;
}

export async function fetchNews(topic: string, lang: string): Promise<NewsItem[]> {
  const res = await fetch(`/api/world/news?topic=${encodeURIComponent(topic)}&lang=${lang}`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.items ?? []) as NewsItem[];
}

export async function fetchNewsQuery(q: string, lang: string): Promise<NewsItem[]> {
  const res = await fetch(`/api/world/news?q=${encodeURIComponent(q)}&lang=${lang}`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.items ?? []) as NewsItem[];
}

export async function fetchSky(): Promise<SkyResponse> {
  const res = await fetch(`${API_BASE}/api/world/sky`, { cache: 'no-store' });
  if (!res.ok) throw new Error('sky unavailable');
  return (await res.json()) as SkyResponse;
}

export async function fetchFigure(name: string): Promise<FigureResponse> {
  const res = await fetch(`${API_BASE}/api/world/figure?name=${encodeURIComponent(name)}`, {
    cache: 'no-store',
  });
  if (!res.ok) return { found: false };
  return (await res.json()) as FigureResponse;
}

export async function fetchCitySky(lat: number, lon: number): Promise<CityResponse | null> {
  const res = await fetch(`${API_BASE}/api/world/city?lat=${lat}&lon=${lon}`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return (await res.json()) as CityResponse;
}

// Map the raw per-entity signals onto the shared SkySignal shape so the
// existing CosmicRead / detail renderer can display them unchanged.
export function figureSignalToSky(s: FigureSignalRaw): SkySignal {
  return {
    kind: 'aspect',
    theme: 'figures',
    topic: s.topic,
    tone: s.tone,
    p1: s.transit_planet,
    p2: s.natal_planet,
    aspect: s.aspect,
    orb: s.orb,
  };
}

export function citySignalToSky(s: CitySignalRaw): SkySignal {
  return {
    kind: s.kind,
    theme: 'realEstate',
    topic: s.topic,
    tone: s.tone,
    planet: s.planet,
    angle: s.angle,
    sign: s.sign,
    orb: s.orb,
  };
}

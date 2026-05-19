import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  if (q.length < 2) return NextResponse.json([]);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&featuretype=city&accept-language=en`,
      { headers: { 'User-Agent': 'PlanetLifeApp/1.0', 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    return NextResponse.json(data.map((item: any) => ({
      name: item.display_name,
      short: item.name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    })));
  } catch { return NextResponse.json([]); }
}
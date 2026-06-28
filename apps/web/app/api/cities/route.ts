import { NextRequest, NextResponse } from 'next/server';

// Which OSM place types we accept as a "place" the user can pick. This is
// intentionally broad: besides cities and towns it includes suburbs, districts
// and neighbourhoods (e.g. Shemiran / شمیران in Tehran province) and villages,
// so smaller localities show up instead of only major cities.
const PLACE_TYPES = new Set([
  'city',
  'town',
  'village',
  'hamlet',
  'suburb',
  'quarter',
  'neighbourhood',
  'borough',
  'municipality',
  'isolated_dwelling',
  'locality',
  'administrative', // covers boundary-defined towns/districts
]);

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  const rawLang = req.nextUrl.searchParams.get('lang') || 'en';
  const lang = ['en', 'ru', 'fa', 'ar'].includes(rawLang) ? rawLang : 'en';
  if (q.length < 2) return NextResponse.json([]);
  try {
    // Drop the narrow `featuretype=city` filter (it hid suburbs/towns) and ask
    // for address details so we can keep real localities and drop noise like
    // roads and shops. Higher limit because we filter client-side below.
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=15&addressdetails=1&accept-language=${lang}`,
      { headers: { 'User-Agent': 'PlanetLifeApp/1.0', 'Accept-Language': lang } }
    );
    const data = await res.json();
    const places = (Array.isArray(data) ? data : [])
      // Keep settlements / districts / neighbourhoods; drop highways, shops, etc.
      .filter(
        (item: any) =>
          item.class === 'place' ||
          (item.class === 'boundary' && item.type === 'administrative') ||
          PLACE_TYPES.has(item.type)
      )
      .map((item: any) => {
        const short =
          item.name ||
          item.address?.city ||
          item.address?.town ||
          item.address?.village ||
          item.address?.suburb ||
          String(item.display_name || '').split(',')[0];
        return {
          name: item.display_name,
          short,
          country:
            item.address?.country ||
            item.address?.country_code?.toUpperCase() ||
            undefined,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        };
      })
      .slice(0, 8);
    return NextResponse.json(places);
  } catch {
    return NextResponse.json([]);
  }
}

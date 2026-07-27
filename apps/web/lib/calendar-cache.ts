const MONTH_CACHE_TTL_MS = 1000 * 60 * 60 * 12;

function cacheKey(
  year: number,
  month: number,
  action: string,
  evalCity?: string
): string {
  const loc = evalCity ? evalCity.replace(/\s+/g, '_') : 'default';

  return `planet-life-cal-${year}-${String(month).padStart(2, '0')}-${action}-${loc}`;
}

export function loadMonthCache(
  year: number,
  month: number,
  action: string,
  evalCity?: string
): Record<string, number> | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(
      cacheKey(year, month, action, evalCity)
    );

    if (!raw) return null;

    const { scores, savedAt } = JSON.parse(raw) as {
      scores: Record<string, number>;
      savedAt: number;
    };

    if (Date.now() - savedAt > MONTH_CACHE_TTL_MS) return null;

    return scores;
  } catch {
    return null;
  }
}

export function saveMonthCache(
  year: number,
  month: number,
  action: string,
  scores: Record<string, number>,
  evalCity?: string
): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(
    cacheKey(year, month, action, evalCity),
    JSON.stringify({ scores, savedAt: Date.now() })
  );
}

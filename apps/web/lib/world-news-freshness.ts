/**
 * ADR-0008 — World news freshness policy (pure).
 * Current request time MUST be injected; the policy never reads the
 * system clock.
 */

export type NewsFreshnessItem = {
  title: string;
  source: string;
  link: string;
  published: string;
};

export type FreshnessClass = 'PRIMARY' | 'FALLBACK' | 'REJECT';

export type FreshnessPolicyOptions = {
  minimumPrimaryItems: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const PRIMARY_MAX_MS = 7 * DAY_MS;
const FALLBACK_MAX_MS = 30 * DAY_MS;

/** Parse an article publication timestamp. Returns null if missing or invalid. */
export function parsePublicationTimestamp(value: string): Date | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const ms = Date.parse(trimmed);
  if (Number.isNaN(ms)) return null;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/** Accept only absolute http: or https: outbound links. */
function isValidOutboundLink(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Credible = non-empty title, source, valid outbound link, and a verifiable publication timestamp. */
export function isCredible(item: NewsFreshnessItem): boolean {
  if (!item.title?.trim()) return false;
  if (!item.source?.trim()) return false;
  if (!isValidOutboundLink(item.link ?? '')) return false;
  return parsePublicationTimestamp(item.published) !== null;
}

/**
 * Classify age relative to injected `now` (request time).
 * ≤7d PRIMARY · 8–30d FALLBACK · >30d or invalid/future REJECT
 */
export function classifyFreshness(published: Date, now: Date): FreshnessClass {
  const pubMs = published.getTime();
  const nowMs = now.getTime();
  if (Number.isNaN(pubMs) || Number.isNaN(nowMs)) return 'REJECT';
  const ageMs = nowMs - pubMs;
  // Future-dated relative to request time is not a verifiable publication age.
  if (ageMs < 0) return 'REJECT';
  if (ageMs <= PRIMARY_MAX_MS) return 'PRIMARY';
  if (ageMs <= FALLBACK_MAX_MS) return 'FALLBACK';
  return 'REJECT';
}

type Ranked<T extends NewsFreshnessItem> = {
  item: T;
  cls: FreshnessClass;
  pubMs: number;
  index: number;
};

function newestThenProviderOrder<T extends NewsFreshnessItem>(a: Ranked<T>, b: Ranked<T>): number {
  if (a.pubMs !== b.pubMs) return b.pubMs - a.pubMs;
  return a.index - b.index;
}

/**
 * Apply ADR-0008 freshness filtering and freshness-boundary ranking.
 * Drops REJECT and non-credible items.
 * FALLBACK items appear only when PRIMARY coverage is below minimumPrimaryItems.
 * Within each bucket: newest first; equal timestamps keep provider order.
 */
export function applyFreshnessPolicy<T extends NewsFreshnessItem>(
  items: T[],
  now: Date,
  options: FreshnessPolicyOptions,
): T[] {
  const { minimumPrimaryItems } = options;
  if (
    !Number.isFinite(minimumPrimaryItems) ||
    !Number.isInteger(minimumPrimaryItems) ||
    minimumPrimaryItems < 1
  ) {
    throw new RangeError(
      `minimumPrimaryItems must be a finite integer >= 1 (got ${minimumPrimaryItems})`,
    );
  }

  const ranked: Ranked<T>[] = [];

  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    if (!isCredible(item)) continue;
    const published = parsePublicationTimestamp(item.published);
    if (!published) continue;
    const cls = classifyFreshness(published, now);
    if (cls === 'REJECT') continue;
    ranked.push({ item, cls, pubMs: published.getTime(), index });
  }

  const primary = ranked.filter((r) => r.cls === 'PRIMARY').sort(newestThenProviderOrder);
  const fallback = ranked.filter((r) => r.cls === 'FALLBACK').sort(newestThenProviderOrder);

  if (primary.length >= minimumPrimaryItems) {
    return primary.map((r) => r.item);
  }

  return [...primary, ...fallback].map((r) => r.item);
}

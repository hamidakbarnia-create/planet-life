import { describe, expect, it } from 'vitest';
import {
  applyFreshnessPolicy,
  classifyFreshness,
  parsePublicationTimestamp,
  type NewsFreshnessItem,
} from './world-news-freshness';

const NOW = new Date('2026-07-15T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;
const PRIMARY_MAX_MS = 7 * DAY_MS;
const FALLBACK_MAX_MS = 30 * DAY_MS;

function isoAtAge(ageMs: number): string {
  return new Date(NOW.getTime() - ageMs).toISOString();
}

function makeItem(
  overrides: Partial<NewsFreshnessItem> & { id?: string } = {},
): NewsFreshnessItem & { id?: string } {
  const { id, ...fields } = overrides;
  return {
    title: fields.title ?? (id ? `Title ${id}` : 'Sample headline'),
    source: fields.source ?? 'Example News',
    link: fields.link ?? 'https://example.com/article',
    published: fields.published ?? isoAtAge(DAY_MS),
    ...(id !== undefined ? { id } : {}),
  };
}

describe('parsePublicationTimestamp', () => {
  it('returns a Date for a valid RFC-compatible timestamp', () => {
    const parsed = parsePublicationTimestamp('Wed, 15 Jul 2026 12:00:00 GMT');
    expect(parsed).toBeInstanceOf(Date);
    expect(parsed!.toISOString()).toBe('2026-07-15T12:00:00.000Z');
  });

  it('returns null for a blank timestamp', () => {
    expect(parsePublicationTimestamp('')).toBeNull();
    expect(parsePublicationTimestamp('   ')).toBeNull();
  });

  it('returns null for an invalid timestamp', () => {
    expect(parsePublicationTimestamp('not-a-date')).toBeNull();
    expect(parsePublicationTimestamp('2026-13-99')).toBeNull();
  });
});

describe('classifyFreshness boundaries', () => {
  it('classifies an article published exactly at injected now as PRIMARY', () => {
    expect(classifyFreshness(NOW, NOW)).toBe('PRIMARY');
  });

  it('classifies an article exactly 7 days old as PRIMARY', () => {
    const published = new Date(NOW.getTime() - PRIMARY_MAX_MS);
    expect(classifyFreshness(published, NOW)).toBe('PRIMARY');
  });

  it('classifies an article 7 days plus 1 millisecond old as FALLBACK', () => {
    const published = new Date(NOW.getTime() - PRIMARY_MAX_MS - 1);
    expect(classifyFreshness(published, NOW)).toBe('FALLBACK');
  });

  it('classifies an article exactly 30 days old as FALLBACK', () => {
    const published = new Date(NOW.getTime() - FALLBACK_MAX_MS);
    expect(classifyFreshness(published, NOW)).toBe('FALLBACK');
  });

  it('classifies an article 30 days plus 1 millisecond old as REJECT', () => {
    const published = new Date(NOW.getTime() - FALLBACK_MAX_MS - 1);
    expect(classifyFreshness(published, NOW)).toBe('REJECT');
  });

  it('classifies a future timestamp as REJECT', () => {
    const published = new Date(NOW.getTime() + 1);
    expect(classifyFreshness(published, NOW)).toBe('REJECT');
  });

  it('classifies an invalid Date input as REJECT', () => {
    expect(classifyFreshness(new Date(Number.NaN), NOW)).toBe('REJECT');
  });

  it('classifies an invalid injected now as REJECT', () => {
    expect(classifyFreshness(NOW, new Date(Number.NaN))).toBe('REJECT');
  });
});

describe('credibility validation via applyFreshnessPolicy', () => {
  const opts = { minimumPrimaryItems: 1 };

  it('rejects a blank title', () => {
    expect(applyFreshnessPolicy([makeItem({ title: '   ' })], NOW, opts)).toEqual([]);
  });

  it('rejects a blank source', () => {
    expect(applyFreshnessPolicy([makeItem({ source: '' })], NOW, opts)).toEqual([]);
  });

  it('rejects a blank link', () => {
    expect(applyFreshnessPolicy([makeItem({ link: '  ' })], NOW, opts)).toEqual([]);
  });

  it('rejects a malformed URL', () => {
    expect(applyFreshnessPolicy([makeItem({ link: 'http://' })], NOW, opts)).toEqual([]);
    expect(applyFreshnessPolicy([makeItem({ link: 'not a url' })], NOW, opts)).toEqual([]);
  });

  it('rejects a relative URL', () => {
    expect(applyFreshnessPolicy([makeItem({ link: '/news/story' })], NOW, opts)).toEqual([]);
    expect(applyFreshnessPolicy([makeItem({ link: 'example.com/story' })], NOW, opts)).toEqual([]);
  });

  it('rejects a javascript: URL', () => {
    expect(
      applyFreshnessPolicy([makeItem({ link: 'javascript:alert(1)' })], NOW, opts),
    ).toEqual([]);
  });

  it('rejects a data: URL', () => {
    expect(
      applyFreshnessPolicy([makeItem({ link: 'data:text/plain,hello' })], NOW, opts),
    ).toEqual([]);
  });

  it('rejects a mailto: URL', () => {
    expect(
      applyFreshnessPolicy([makeItem({ link: 'mailto:editor@example.com' })], NOW, opts),
    ).toEqual([]);
  });

  it('accepts a valid http URL', () => {
    const item = makeItem({ id: 'http', link: 'http://example.com/a' });
    expect(applyFreshnessPolicy([item], NOW, opts)).toEqual([item]);
  });

  it('accepts a valid https URL', () => {
    const item = makeItem({ id: 'https', link: 'https://example.com/b' });
    expect(applyFreshnessPolicy([item], NOW, opts)).toEqual([item]);
  });

  it('rejects a missing publication date', () => {
    expect(applyFreshnessPolicy([makeItem({ published: '' })], NOW, opts)).toEqual([]);
  });

  it('rejects an invalid publication date', () => {
    expect(applyFreshnessPolicy([makeItem({ published: 'yesterday' })], NOW, opts)).toEqual([]);
  });
});

describe('conditional fallback', () => {
  it('returns PRIMARY only when PRIMARY count meets minimumPrimaryItems', () => {
    const p1 = makeItem({ id: 'p1', published: isoAtAge(DAY_MS) });
    const p2 = makeItem({ id: 'p2', published: isoAtAge(2 * DAY_MS) });
    const f1 = makeItem({ id: 'f1', published: isoAtAge(PRIMARY_MAX_MS + DAY_MS) });
    const f2 = makeItem({ id: 'f2', published: isoAtAge(PRIMARY_MAX_MS + 2 * DAY_MS) });

    const result = applyFreshnessPolicy([p1, f1, p2, f2], NOW, { minimumPrimaryItems: 2 });

    expect(result).toEqual([p1, p2]);
  });

  it('admits PRIMARY plus FALLBACK when PRIMARY count is below minimumPrimaryItems', () => {
    const p1 = makeItem({ id: 'p1', published: isoAtAge(DAY_MS) });
    const f1 = makeItem({ id: 'f1', published: isoAtAge(PRIMARY_MAX_MS + DAY_MS) });
    const f2 = makeItem({ id: 'f2', published: isoAtAge(PRIMARY_MAX_MS + 2 * DAY_MS) });

    const result = applyFreshnessPolicy([f2, p1, f1], NOW, { minimumPrimaryItems: 2 });

    expect(result).toEqual([p1, f1, f2]);
  });

  it('excludes FALLBACK when PRIMARY coverage is sufficient even if capacity would allow them', () => {
    // Two PRIMARY meet the threshold; many FALLBACK remain available but must stay excluded.
    const p1 = makeItem({ id: 'p1', published: isoAtAge(1) });
    const p2 = makeItem({ id: 'p2', published: isoAtAge(2) });
    const fallbacks = [
      makeItem({ id: 'f1', published: isoAtAge(PRIMARY_MAX_MS + 1) }),
      makeItem({ id: 'f2', published: isoAtAge(PRIMARY_MAX_MS + 2) }),
      makeItem({ id: 'f3', published: isoAtAge(PRIMARY_MAX_MS + 3) }),
      makeItem({ id: 'f4', published: isoAtAge(PRIMARY_MAX_MS + 4) }),
      makeItem({ id: 'f5', published: isoAtAge(PRIMARY_MAX_MS + 5) }),
      makeItem({ id: 'f6', published: isoAtAge(PRIMARY_MAX_MS + 6) }),
    ];

    const result = applyFreshnessPolicy([p1, ...fallbacks, p2], NOW, {
      minimumPrimaryItems: 2,
    });

    expect(result).toEqual([p1, p2]);
    expect(result).toHaveLength(2);
  });
});

describe('ordering', () => {
  it('sorts PRIMARY newest first', () => {
    const older = makeItem({ id: 'older', published: isoAtAge(3 * DAY_MS) });
    const newer = makeItem({ id: 'newer', published: isoAtAge(DAY_MS) });
    const mid = makeItem({ id: 'mid', published: isoAtAge(2 * DAY_MS) });

    expect(
      applyFreshnessPolicy([older, newer, mid], NOW, { minimumPrimaryItems: 1 }),
    ).toEqual([newer, mid, older]);
  });

  it('sorts FALLBACK newest first when admitted', () => {
    const primary = makeItem({ id: 'p', published: isoAtAge(DAY_MS) });
    const fOlder = makeItem({ id: 'fo', published: isoAtAge(PRIMARY_MAX_MS + 3 * DAY_MS) });
    const fNewer = makeItem({ id: 'fn', published: isoAtAge(PRIMARY_MAX_MS + DAY_MS) });
    const fMid = makeItem({ id: 'fm', published: isoAtAge(PRIMARY_MAX_MS + 2 * DAY_MS) });

    expect(
      applyFreshnessPolicy([fOlder, primary, fMid, fNewer], NOW, { minimumPrimaryItems: 2 }),
    ).toEqual([primary, fNewer, fMid, fOlder]);
  });

  it('preserves original provider order for equal publication timestamps', () => {
    const stamp = isoAtAge(2 * DAY_MS);
    const a = makeItem({ id: 'a', title: 'A', published: stamp });
    const b = makeItem({ id: 'b', title: 'B', published: stamp });
    const c = makeItem({ id: 'c', title: 'C', published: stamp });

    expect(applyFreshnessPolicy([a, b, c], NOW, { minimumPrimaryItems: 1 })).toEqual([a, b, c]);
    expect(applyFreshnessPolicy([c, a, b], NOW, { minimumPrimaryItems: 1 })).toEqual([c, a, b]);
  });

  it('places PRIMARY before FALLBACK when fallback is admitted', () => {
    const primaryOlder = makeItem({ id: 'po', published: isoAtAge(6 * DAY_MS) });
    const fallbackNewer = makeItem({
      id: 'fn',
      published: isoAtAge(PRIMARY_MAX_MS + 1),
    });

    expect(
      applyFreshnessPolicy([fallbackNewer, primaryOlder], NOW, { minimumPrimaryItems: 2 }),
    ).toEqual([primaryOlder, fallbackNewer]);
  });
});

describe('rejected content', () => {
  it('omits items older than 30 days', () => {
    const keep = makeItem({ id: 'keep', published: isoAtAge(DAY_MS) });
    const tooOld = makeItem({
      id: 'old',
      published: isoAtAge(FALLBACK_MAX_MS + 1),
    });

    expect(applyFreshnessPolicy([tooOld, keep], NOW, { minimumPrimaryItems: 1 })).toEqual([keep]);
  });

  it('omits future items', () => {
    const keep = makeItem({ id: 'keep', published: isoAtAge(DAY_MS) });
    const future = makeItem({
      id: 'future',
      published: new Date(NOW.getTime() + DAY_MS).toISOString(),
    });

    expect(applyFreshnessPolicy([future, keep], NOW, { minimumPrimaryItems: 1 })).toEqual([keep]);
  });

  it('omits non-credible items', () => {
    const keep = makeItem({ id: 'keep' });
    const bad = makeItem({ id: 'bad', title: '', link: 'javascript:void(0)' });

    expect(applyFreshnessPolicy([bad, keep], NOW, { minimumPrimaryItems: 1 })).toEqual([keep]);
  });
});

describe('minimumPrimaryItems validation', () => {
  const items = [makeItem()];

  it.each([
    { label: '0', value: 0 },
    { label: 'negative integer', value: -1 },
    { label: 'fractional number', value: 1.5 },
    { label: 'NaN', value: Number.NaN },
    { label: 'Infinity', value: Number.POSITIVE_INFINITY },
  ])('throws RangeError for $label', ({ value }) => {
    expect(() => applyFreshnessPolicy(items, NOW, { minimumPrimaryItems: value })).toThrow(
      RangeError,
    );
  });

  it('does not throw for valid integer 1', () => {
    expect(() => applyFreshnessPolicy(items, NOW, { minimumPrimaryItems: 1 })).not.toThrow();
    expect(applyFreshnessPolicy(items, NOW, { minimumPrimaryItems: 1 })).toEqual(items);
  });
});

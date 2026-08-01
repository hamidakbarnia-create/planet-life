import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  powerRatingTitle,
  toPowerTimingView,
  toRankedPowerDaysView,
  toYesPowerSlotsView,
  vaultScoreBand,
  visiblePowerRating,
} from './vault-power-windows';
import { VAULT_POWER_TIMING_COPY } from './vault-section-i18n';

describe('toRankedPowerDaysView', () => {
  it('normalizes valid hot/money/ghost windows', () => {
    for (const mod of ['hot', 'money', 'ghost'] as const) {
      const view = toRankedPowerDaysView(mod, [
        { date: '2026-07-25', score: 82, rating: 'Excellent' },
        { date: '2026-07-28', score: 71 },
      ]);
      expect(view).toEqual({
        kind: 'ranked_days',
        module: mod,
        days: [
          { date: '2026-07-25', score: 82, rating: 'Excellent' },
          { date: '2026-07-28', score: 71 },
        ],
      });
    }
  });

  it('removes malformed window entries', () => {
    const view = toRankedPowerDaysView('ghost', [
      { date: '2026-07-25', score: 82 },
      { date: 'bad', score: 90 },
      { date: '2026-07-26', score: Number.NaN },
      null,
      { score: 70 },
      { date: '2026-07-27', score: 65, rating: null },
    ]);
    expect(view?.kind).toBe('ranked_days');
    if (view?.kind !== 'ranked_days') return;
    expect(view.days).toEqual([
      { date: '2026-07-25', score: 82 },
      { date: '2026-07-27', score: 65, rating: null },
    ]);
  });

  it('returns null for invalid or empty arrays', () => {
    expect(toRankedPowerDaysView('hot', [])).toBeNull();
    expect(toRankedPowerDaysView('hot', undefined)).toBeNull();
    expect(toRankedPowerDaysView('hot', [{ date: 'nope', score: 1 }])).toBeNull();
  });
});

describe('toYesPowerSlotsView', () => {
  const base = {
    ask: {
      date: '2026-07-26',
      score: 80,
      rating: 'A',
      confidence: 'high',
      action_type: 'negotiation',
    },
    commit: {
      date: '2026-07-27',
      score: 80,
      confidence: 'high',
      action_type: 'negotiation+contract_signing',
    },
    sign: {
      date: '2026-07-27',
      score: 90,
      confidence: 'high',
      action_type: 'contract_signing',
    },
  };

  it('normalizes yes slots without converting to windows', () => {
    const view = toYesPowerSlotsView(base);
    expect(view?.kind).toBe('yes_slots');
    if (view?.kind !== 'yes_slots') return;
    expect(view.module).toBe('yes');
    expect(view.ask.date).toBe('2026-07-26');
    expect(view.commit.date).toBe('2026-07-27');
    expect(view.sign.date).toBe('2026-07-27');
    expect(view).not.toHaveProperty('days');
    expect(view).not.toHaveProperty('windows');
  });

  it('returns null when one required yes slot is missing', () => {
    expect(toYesPowerSlotsView({ ...base, sign: undefined })).toBeNull();
    expect(
      toYesPowerSlotsView({
        ...base,
        ask: { date: '2026-07-26', score: 80 },
      }),
    ).toBeNull();
  });

  it('keeps three separate slots when dates are identical', () => {
    const sameDay = {
      ask: { ...base.ask, date: '2026-07-28' },
      commit: { ...base.commit, date: '2026-07-28' },
      sign: { ...base.sign, date: '2026-07-28' },
    };
    const view = toYesPowerSlotsView(sameDay);
    expect(view?.kind).toBe('yes_slots');
    if (view?.kind !== 'yes_slots') return;
    expect(view.ask.date).toBe('2026-07-28');
    expect(view.commit.date).toBe('2026-07-28');
    expect(view.sign.date).toBe('2026-07-28');
    expect(view.ask.action_type).not.toBe(view.sign.action_type);
  });

  it('keeps ratings optional', () => {
    const view = toYesPowerSlotsView({
      ask: {
        date: '2026-07-26',
        score: 80,
        confidence: 'high',
        action_type: 'negotiation',
      },
      commit: base.commit,
      sign: base.sign,
    });
    expect(view?.kind).toBe('yes_slots');
    if (view?.kind !== 'yes_slots') return;
    expect(view.ask.rating).toBeUndefined();
    expect(view.commit.rating).toBeUndefined();
  });
});

describe('toPowerTimingView', () => {
  it('builds ranked views from hot/money/ghost responses', () => {
    const view = toPowerTimingView('hot', {
      windows: [{ date: '2026-07-26', score: 88, rating: 'Excellent' }],
      reading: { executive: 'x', strategic: 'y', technical: 'z' },
    });
    expect(view).toEqual({
      kind: 'ranked_days',
      module: 'hot',
      days: [{ date: '2026-07-26', score: 88, rating: 'Excellent' }],
    });
  });

  it('builds yes_slots from verdict without fabricating windows', () => {
    const view = toPowerTimingView('yes', {
      verdict: {
        ask: {
          date: '2026-07-26',
          score: 80,
          confidence: 'high',
          action_type: 'negotiation',
        },
        commit: {
          date: '2026-07-27',
          score: 76,
          confidence: 'high',
          action_type: 'negotiation+contract_signing',
        },
        sign: {
          date: '2026-07-29',
          score: 86,
          confidence: 'high',
          action_type: 'contract_signing',
        },
      },
      reading: { executive: 'x', strategic: 'y', technical: 'z' },
    });
    expect(view?.kind).toBe('yes_slots');
  });

  it('returns null for non-Power modules', () => {
    expect(
      toPowerTimingView('mars', {
        windows: [{ date: '2026-07-26', score: 88 }],
      }),
    ).toBeNull();
    expect(
      toPowerTimingView('radar', {
        verdict: { ask: { date: '2026-07-26', score: 1 } },
      }),
    ).toBeNull();
  });
});

describe('vaultScoreBand', () => {
  it('maps presentation bands only', () => {
    expect(vaultScoreBand(80)).toBe('strongest');
    expect(vaultScoreBand(100)).toBe('strongest');
    expect(vaultScoreBand(60)).toBe('supportive');
    expect(vaultScoreBand(79)).toBe('supportive');
    expect(vaultScoreBand(59)).toBe('lighter');
  });
});

describe('visiblePowerRating / powerRatingTitle', () => {
  it('keeps short ratings visible', () => {
    expect(visiblePowerRating('Favorable')).toBe('Favorable');
    expect(visiblePowerRating('  Challenging  ')).toBe('Challenging');
    expect(powerRatingTitle('Favorable')).toBeUndefined();
  });

  it('hides long ratings from visible chip text', () => {
    const long = 'Mixed / Proceed with Awareness';
    expect(long.length).toBeGreaterThan(18);
    expect(visiblePowerRating(long)).toBeNull();
  });

  it('keeps long ratings available for title', () => {
    const long = 'Mixed / Proceed with Awareness';
    expect(powerRatingTitle(long)).toBe(long);
    expect(powerRatingTitle(`  ${long}  `)).toBe(long);
  });

  it('ignores whitespace-only ratings', () => {
    expect(visiblePowerRating('   ')).toBeNull();
    expect(powerRatingTitle('\t  ')).toBeUndefined();
  });

  it('ignores null and undefined', () => {
    expect(visiblePowerRating(null)).toBeNull();
    expect(visiblePowerRating(undefined)).toBeNull();
    expect(powerRatingTitle(null)).toBeUndefined();
    expect(powerRatingTitle(undefined)).toBeUndefined();
  });
});

describe('Power timing localization + page wiring', () => {
  it('exposes EN/FA/AR/RU power timing labels', () => {
    for (const lang of ['en', 'fa', 'ar', 'ru'] as const) {
      const pack = VAULT_POWER_TIMING_COPY[lang];
      expect(pack.topDays.length).toBeGreaterThan(0);
      expect(pack.ask.length).toBeGreaterThan(0);
      expect(pack.commit.length).toBeGreaterThan(0);
      expect(pack.sign.length).toBeGreaterThan(0);
      expect(pack.strongest.length).toBeGreaterThan(0);
      expect(pack.supportive.length).toBeGreaterThan(0);
      expect(pack.lighter.length).toBeGreaterThan(0);
    }
    expect(VAULT_POWER_TIMING_COPY.en.topDays).toBe('Top days');
    expect(VAULT_POWER_TIMING_COPY.fa.topDays).toBe('روزهای برتر');
    expect(VAULT_POWER_TIMING_COPY.ar.topDays).toBe('أفضل الأيام');
    expect(VAULT_POWER_TIMING_COPY.ru.topDays).toBe('Лучшие дни');
  });

  it('keeps structured Power data in the page flow and scopes timing UI to Power', () => {
    const pageSource = readFileSync(
      resolve(__dirname, '../app/vault/[section]/page.tsx'),
      'utf8',
    );
    expect(pageSource).toContain('toPowerTimingView');
    expect(pageSource).toContain('setPowerTiming(toPowerTimingView(apiKey, res))');
    expect(pageSource).toContain('setLiveReading(res.reading)');
    expect(pageSource).toContain("raw === 'power' && powerTiming");
    expect(pageSource).toContain('VAULT_POWER_TIMING_COPY');
    expect(pageSource).toContain('visiblePowerRating');
    expect(pageSource).toContain('powerRatingTitle');
    // Ranked chips use the concise rating helper; Yes slots keep raw rating.
    expect(pageSource).toMatch(/visibleRating \? ` · \$\{visibleRating\}`/);
    expect(pageSource).toMatch(/slot\.rating \? ` · \$\{slot\.rating\}`/);
    // Timing UI is gated to the power section only.
    expect(pageSource).toMatch(/raw === ['"]power['"] && powerTiming/);
  });
});

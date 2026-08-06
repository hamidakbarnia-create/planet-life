import { describe, expect, it } from 'vitest';

import {
  allocatePercents,
  buildPowerDistribution,
  findWeekBest,
  scoreToDotCount,
  scoreToPowerBand,
} from './calendar-power-presentation';

describe('calendar power presentation', () => {
  it('maps score bands to reference thresholds', () => {
    expect(scoreToPowerBand(null)).toBe('empty');
    expect(scoreToPowerBand(49)).toBe('low');
    expect(scoreToPowerBand(50)).toBe('moderate');
    expect(scoreToPowerBand(69)).toBe('moderate');
    expect(scoreToPowerBand(70)).toBe('good');
    expect(scoreToPowerBand(84)).toBe('good');
    expect(scoreToPowerBand(85)).toBe('excellent');
    expect(scoreToPowerBand(100)).toBe('excellent');
  });

  it('builds Power Distribution from the canonical map only', () => {
    const scores = {
      '2026-08-01': 40,
      '2026-08-02': 55,
      '2026-08-03': 75,
      '2026-08-04': 90,
      '2026-08-05': 92,
      '2026-08-06': 60,
      '2026-08-07': 30,
      '2026-08-08': 80,
      '2026-08-09': 50,
      '2026-08-10': 86,
    };
    const dist = buildPowerDistribution(scores);
    expect(dist.total).toBe(10);
    expect(dist.average).toBe(
      Math.round(
        Object.values(scores).reduce((a, b) => a + b, 0) / 10
      )
    );
    const byBand = Object.fromEntries(
      dist.bands.map((b) => [b.band, b])
    );
    expect(byBand.excellent.count).toBe(3); // 90,92,86
    expect(byBand.good.count).toBe(2); // 75,80
    expect(byBand.moderate.count).toBe(3); // 55,60,50
    expect(byBand.low.count).toBe(2); // 40,30
    expect(byBand.excellent.percent).toBe(30);
    expect(
      dist.bands.reduce((sum, b) => sum + b.count, 0)
    ).toBe(dist.total);
  });

  it('Week best is the real maximum of the selected week', () => {
    const week = [
      { date: '2026-08-02', score: 41 },
      { date: '2026-08-03', score: 56 },
      { date: '2026-08-04', score: 72 },
      { date: '2026-08-05', score: 81 },
      { date: '2026-08-06', score: 92 },
      { date: '2026-08-07', score: 75 },
      { date: '2026-08-08', score: 63 },
    ];
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const best = findWeekBest(week, labels);
    expect(best?.date).toBe('2026-08-06');
    expect(best?.score).toBe(92);
    expect(best?.weekdayLabel).toBe('Thu');
  });

  it('null week scores are ignored by Week best', () => {
    const week = [
      { date: '2026-08-02', score: 40 },
      { date: '2026-08-03', score: null },
      { date: '2026-08-04', score: 70 },
    ];
    expect(findWeekBest(week, ['Sun', 'Mon', 'Tue'])?.score).toBe(70);
    expect(scoreToDotCount(null)).toBe(0);
    expect(scoreToDotCount(90)).toBe(5);
  });

  it('empty maps and deterministic percent allocation', () => {
    const empty = buildPowerDistribution({});
    expect(empty.average).toBeNull();
    expect(empty.total).toBe(0);
    expect(allocatePercents([1, 1, 1], 3).reduce((a, b) => a + b, 0)).toBe(
      100
    );
    const dist = buildPowerDistribution({
      a: 10,
      b: 20,
      c: 30,
    });
    expect(dist.bands.reduce((s, b) => s + b.percent, 0)).toBe(100);
  });
});

import { describe, expect, it } from 'vitest';

import {
  buildLinearPathD,
  scoreToPlotY,
  WEEKLY_PATH_HEIGHT,
  WEEKLY_PATH_PAD_BOTTOM,
  WEEKLY_PATH_PAD_TOP,
} from './calendar-week-geometry';

describe('calendar week geometry', () => {
  it('null score does not map to y for 0%', () => {
    expect(scoreToPlotY(null)).toBeNull();
    expect(scoreToPlotY(Number.NaN)).toBeNull();
    expect(scoreToPlotY(null)).not.toBe(scoreToPlotY(0));
  });

  it('uses fixed 0–100 scale', () => {
    const plotHeight =
      WEEKLY_PATH_HEIGHT - WEEKLY_PATH_PAD_TOP - WEEKLY_PATH_PAD_BOTTOM;
    expect(scoreToPlotY(100)).toBeCloseTo(WEEKLY_PATH_PAD_TOP, 5);
    expect(scoreToPlotY(0)).toBeCloseTo(WEEKLY_PATH_PAD_TOP + plotHeight, 5);
    expect(scoreToPlotY(86)!).toBeLessThan(scoreToPlotY(46)!);
  });

  it('breaks linear path across missing values without cubic overshoot', () => {
    const d = buildLinearPathD([
      { x: 0, y: 40 },
      { x: 10, y: 30 },
      { x: 20, y: null },
      { x: 30, y: 50 },
      { x: 40, y: 45 },
    ]);
    expect((d.match(/\bM\b/g) ?? []).length).toBe(2);
    expect(d).toMatch(/\bL\b/);
    expect(d).not.toMatch(/\bC\b/);
  });
});

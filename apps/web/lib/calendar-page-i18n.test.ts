import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { CALENDAR_PAGE_LANGS, formatBandDayCount } from './calendar-page-i18n';
import { buildStrategicGps } from './strategic-gps';
import { isDangerHour, isGoldenHour, scoreToBand } from './timing-presentation';

describe('Calendar PR-01 presentation copy', () => {
  const en = CALENDAR_PAGE_LANGS.en;

  it('removes astrology-first subtitle wording', () => {
    expect(en.subtitle.toLowerCase()).not.toContain('natal');
    expect(en.subtitle.toLowerCase()).not.toContain('golden');
    expect(en.subtitle).not.toContain('blueprint');
  });

  it('uses the approved decision-timing subtitle', () => {
    expect(en.subtitle).toBe('Know when to move. Plan with greater clarity.');
  });

  it('removes user-facing Golden wording from Calendar copy', () => {
    // Internal key `golden` remains for shared ICS/hourly label plumbing.
    expect(en.golden).toBe('Strong window');
    expect(en.golden.toLowerCase()).not.toContain('golden');
    expect(en.subtitle.toLowerCase()).not.toContain('golden');
    for (const band of en.legend.bands) {
      expect(band.label.toLowerCase()).not.toContain('golden');
    }
  });

  it('removes compulsory make-your-move legend wording', () => {
    const legend = en.legend.bands.map((b) => b.label).join(' | ').toLowerCase();
    expect(legend).not.toContain('make your move');
    expect(en.legend.bands[0].label).toBe('Stronger window to consider action');
    expect(en.legend.bands[3].label).toBe(
      'Lower-readiness window; delay if practical'
    );
  });

  it('exposes static uncertainty disclosure copy', () => {
    expect(en.uncertaintyDisclosure).toBe(
      'Timing scores are relative estimates, not guarantees.'
    );
  });

  it('wires uncertainty disclosure into the Calendar page legend', () => {
    const pageSource = readFileSync(
      resolve(__dirname, '../app/calendar/page.tsx'),
      'utf8'
    );
    expect(pageSource).toContain('calendar-uncertainty-disclosure');
    expect(pageSource).toContain('{t.uncertaintyDisclosure}');
    expect(pageSource).not.toContain('natal blueprint');
    expect(pageSource).not.toContain('make your move');
  });
});

describe('Decision Timing presentation labels', () => {
  it('renames Strategic GPS title without inventing a domain type', () => {
    const gps = buildStrategicGps({}, [], 'en');
    expect(gps.text.title).toBe('Decision Timing');
    expect(gps.text.title).not.toContain('GPS');
    expect(gps.text.goldenDays).toBe('high-readiness days');
    expect(gps.text.goldenDays.toLowerCase()).not.toContain('golden');
  });
});

describe('Calendar score thresholds unchanged', () => {
  it('keeps band and hour thresholds', () => {
    expect(scoreToBand(84)).toBe('yellow');
    expect(scoreToBand(85)).toBe('green');
    expect(scoreToBand(39)).toBe('red');
    expect(scoreToBand(40)).toBe('orange');
    expect(isGoldenHour(84)).toBe(false);
    expect(isGoldenHour(85)).toBe(true);
    expect(isDangerHour(39)).toBe(true);
    expect(isDangerHour(40)).toBe(false);

    const gps = buildStrategicGps(
      {
        '2026-07-01': 90,
        '2026-07-02': 30,
      },
      [],
      'en'
    );
    expect(gps.goldenCount).toBe(1);
    expect(gps.cautionCount).toBe(1);
  });
});

describe('Calendar readiness percent presentation', () => {
  it('wires percent formatting into user-visible Calendar score renders', () => {
    const pageSource = readFileSync(
      resolve(__dirname, '../app/calendar/page.tsx'),
      'utf8'
    );
    const cellSource = readFileSync(
      resolve(__dirname, '../components/calendar/CalendarDayCell.tsx'),
      'utf8'
    );
    const insightSource = readFileSync(
      resolve(
        __dirname,
        '../components/calendar/SelectedDayInsightPanel.tsx'
      ),
      'utf8'
    );

    const selectedSource = readFileSync(
      resolve(
        __dirname,
        '../components/calendar/CalendarSelectedDayInsight.tsx'
      ),
      'utf8'
    );

    // Month cells + insight Best/Risk + hourly/selected
    expect(pageSource).toContain('CalendarMonthGrid');
    expect(pageSource).toContain('CalendarInsightStack');
    expect(cellSource).toContain('formatReadinessPercent(score)');
    expect(insightSource).toContain('formatReadinessPercent(bestHour.score)');
    expect(insightSource).toContain('formatReadinessPercent(riskHour.score)');
    expect(pageSource).toContain('{label} · {formatReadinessPercent(h.score)}');
    expect(selectedSource).toContain('formatTimingStrength(score)');
    expect(pageSource).not.toContain(
      '{t.score}: {formatReadinessPercent(selectedScore)}'
    );

    // Hourly stays percent; selected-day product slice uses /100 timing strength
    expect(pageSource).not.toContain('{label} · {h.score}');
    expect(pageSource).not.toMatch(/formatReadinessPercent\([^)]+\)%/);
    expect(cellSource).not.toMatch(/formatReadinessPercent\([^)]+\)%/);

    // CSS bar widths stay as layout percentages (not double-formatted labels)
    expect(pageSource).toContain('width: `${Math.max(8, h.score)}%`');
    expect(CALENDAR_PAGE_LANGS.en.insight.powerDistribution).toBe(
      'Power distribution'
    );
    expect(CALENDAR_PAGE_LANGS.fa.insight.powerDistribution).toBe('توزیع قدرت');
    expect(CALENDAR_PAGE_LANGS.ar.insight.powerDistribution).toBe('توزيع القوة');
    expect(CALENDAR_PAGE_LANGS.ru.insight.weeklyTrend).toBe('Недельный тренд');
    expect(CALENDAR_PAGE_LANGS.fa.insight.bandCount.startsWith('{count}')).toBe(
      true
    );
    expect(formatBandDayCount('en', 8, 27)).toBe('8 days (27%)');
    expect(formatBandDayCount('en', 1, 3)).toBe('1 day (3%)');
    expect(formatBandDayCount('fa', 8, 27)).toMatch(/^۸ روز/);
    expect(formatBandDayCount('fa', 8, 27)).not.toMatch(/^days/);
  });
});

describe('formatBandDayCount Arabic CLDR plurals', () => {
  const ar = new Intl.PluralRules('ar');

  it('covers every Arabic plural category used for day counts', () => {
    expect(ar.select(0)).toBe('zero');
    expect(ar.select(1)).toBe('one');
    expect(ar.select(2)).toBe('two');
    expect(ar.select(3)).toBe('few');
    expect(ar.select(10)).toBe('few');
    expect(ar.select(11)).toBe('many');
    expect(ar.select(12)).toBe('many');
    expect(ar.select(99)).toBe('many');
    expect(ar.select(100)).toBe('other');
    expect(ar.select(101)).toBe('other');
    expect(ar.select(103)).toBe('few');
    expect(ar.select(111)).toBe('many');
  });

  it('uses يوم for zero and one', () => {
    expect(formatBandDayCount('ar', 0, 0)).toMatch(/يوم/);
    expect(formatBandDayCount('ar', 1, 3)).toMatch(/يوم/);
    expect(formatBandDayCount('ar', 0, 0)).not.toContain('أيام');
    expect(formatBandDayCount('ar', 1, 3)).not.toContain('أيام');
  });

  it('uses the dual يومان for two', () => {
    expect(formatBandDayCount('ar', 2, 7)).toContain('يومان');
    expect(formatBandDayCount('ar', 2, 7)).not.toContain('أيام');
  });

  it('uses أيام for few (3–10 and 103–110)', () => {
    expect(formatBandDayCount('ar', 3, 10)).toContain('أيام');
    expect(formatBandDayCount('ar', 8, 27)).toContain('أيام');
    expect(formatBandDayCount('ar', 10, 33)).toContain('أيام');
    expect(formatBandDayCount('ar', 103, 40)).toContain('أيام');
  });

  it('uses يوماً for many (11–99), not أيام', () => {
    expect(formatBandDayCount('ar', 11, 37)).toContain('يوماً');
    expect(formatBandDayCount('ar', 12, 40)).toContain('يوماً');
    expect(formatBandDayCount('ar', 12, 40)).not.toContain('أيام');
    expect(formatBandDayCount('ar', 99, 99)).toContain('يوماً');
    expect(formatBandDayCount('ar', 111, 50)).toContain('يوماً');
    expect(formatBandDayCount('ar', 111, 50)).not.toContain('أيام');
  });

  it('uses يوم for other (100, 101, 102, 200)', () => {
    expect(formatBandDayCount('ar', 100, 100)).toMatch(/يوم/);
    expect(formatBandDayCount('ar', 100, 100)).not.toContain('أيام');
    expect(formatBandDayCount('ar', 101, 100)).not.toContain('أيام');
    expect(formatBandDayCount('ar', 102, 100)).not.toContain('أيام');
    expect(formatBandDayCount('ar', 200, 100)).not.toContain('أيام');
  });

  it('keeps plural selection in the formatter, not chart components', () => {
    const chart = readFileSync(
      resolve(__dirname, '../components/calendar/PowerDistributionChart.tsx'),
      'utf8'
    );
    expect(chart).toContain('formatBandDayCount');
    expect(chart).not.toMatch(/PluralRules|أيام|يوما/);
    expect(chart).not.toMatch(/lang\s*===\s*['"]ar['"]/);
  });
});

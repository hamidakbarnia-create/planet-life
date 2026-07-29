import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { CALENDAR_PAGE_LANGS } from './calendar-page-i18n';
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

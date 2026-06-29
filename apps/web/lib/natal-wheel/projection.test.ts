import { describe, expect, it } from 'vitest';
import { RAFSANJAN_CHART } from '@/lib/chart-fixtures';
import {
  computeProjectedScreenAngles,
  computeQuadrantScreenCusps,
  projectEclipticLongitude,
  projectUniformLongitude,
} from './projection';

describe('quadrant projection — Rafsanjan reference', () => {
  const chart = RAFSANJAN_CHART;

  it('fixes ASC at 270° (left)', () => {
    expect(projectEclipticLongitude(chart.ascendant, chart)).toBeCloseTo(270, 5);
  });

  it('fixes MC at 0° (top)', () => {
    expect(projectEclipticLongitude(chart.midheaven, chart)).toBeCloseTo(0, 5);
  });

  it('fixes DSC at 90° (right)', () => {
    expect(projectEclipticLongitude(chart.ascendant + 180, chart)).toBeCloseTo(90, 5);
  });

  it('fixes IC at 180° (bottom)', () => {
    expect(projectEclipticLongitude(chart.midheaven + 180, chart)).toBeCloseTo(180, 5);
  });

  it('projects Sun and Moon through quadrant model', () => {
    const sun = projectEclipticLongitude(chart.planets.sun.longitude, chart);
    const moon = projectEclipticLongitude(chart.planets.moon.longitude, chart);
    expect(sun).toBeGreaterThan(240);
    expect(sun).toBeLessThan(280);
    expect(moon).toBeGreaterThan(230);
    expect(moon).toBeLessThan(260);
  });

  it('projects Mercury and Venus through quadrant model', () => {
    const mercury = projectEclipticLongitude(chart.planets.mercury.longitude, chart);
    const venus = projectEclipticLongitude(chart.planets.venus.longitude, chart);
    expect(mercury).toBeGreaterThan(270);
    expect(venus).toBeGreaterThan(290);
  });

  it('places Uranus near MC (top)', () => {
    const uranus = projectEclipticLongitude(chart.planets.uranus.longitude, chart);
    const distFromMc = Math.min(Math.abs(uranus), Math.abs(360 - uranus));
    expect(distFromMc).toBeLessThan(5);
  });

  it('assigns screen cusp H10 to MC anchor', () => {
    const sc = computeQuadrantScreenCusps(chart.houses);
    expect(sc[9]).toBeCloseTo(0, 5);
    expect(sc[0]).toBeCloseTo(270, 5);
    expect(sc[6]).toBeCloseTo(90, 5);
    expect(sc[3]).toBeCloseTo(180, 5);
  });

  it('produces finite screen angles for all bodies', () => {
    const angles = computeProjectedScreenAngles(chart);
    Object.values(angles).forEach((a) => {
      expect(Number.isFinite(a)).toBe(true);
      expect(Number.isNaN(a)).toBe(false);
    });
  });
});

describe('uniform projection (dev comparison)', () => {
  it('differs from quadrant on MC for Rafsanjan', () => {
    const chart = RAFSANJAN_CHART;
    const quad = projectEclipticLongitude(chart.midheaven, chart, 'quadrant');
    const uni = projectUniformLongitude(chart.midheaven, chart.ascendant);
    expect(quad).toBeCloseTo(0, 5);
    expect(uni).toBeGreaterThan(180);
    expect(Math.abs(quad - uni)).toBeGreaterThan(90);
  });
});

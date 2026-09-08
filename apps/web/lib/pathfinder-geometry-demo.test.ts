import { describe, expect, it } from 'vitest';
import {
  PATHFINDER_SUN_ANGLE_COLORS,
  PATHFINDER_SUN_ANGLE_HIT_WIDTH,
  isSunAngleVisible,
  nextSelectedLineAfterFilter,
  nextSelectionForFilterControl,
  isPointOnExistingSunLine,
  pathfinderPresentationCamera,
  pathfinderSunAngleLabelGeoJSON,
  visibleSunLineOpacity,
  visibleSunLineWidth,
} from './pathfinder-geometry-demo';

describe('pathfinder geometry demo interactions', () => {
  it('shows every angle when the filter is All', () => {
    expect(isSunAngleVisible('ASC', 'all')).toBe(true);
    expect(isSunAngleVisible('MC', 'all')).toBe(true);
  });

  it('hides incompatible angles when a single-angle filter is applied', () => {
    expect(isSunAngleVisible('MC', 'MC')).toBe(true);
    expect(isSunAngleVisible('ASC', 'MC')).toBe(false);
  });

  it('clears a selected line that the new filter hides', () => {
    expect(nextSelectedLineAfterFilter('ASC', 'MC')).toBeNull();
    expect(nextSelectedLineAfterFilter('ASC', 'all')).toBe('ASC');
    expect(nextSelectedLineAfterFilter('MC', 'MC')).toBe('MC');
    expect(nextSelectionForFilterControl('ASC', 'MC')).toBe('MC');
    expect(nextSelectionForFilterControl('ASC', 'all')).toBeNull();
  });

  it('keeps MC and IC visually distinct and places labels on existing line segments only', () => {
    expect(PATHFINDER_SUN_ANGLE_COLORS.MC).not.toBe(PATHFINDER_SUN_ANGLE_COLORS.IC);
    const labels = pathfinderSunAngleLabelGeoJSON();
    expect(labels.features).toHaveLength(4);
    for (const feature of labels.features) {
      expect(feature.geometry.type).toBe('Point');
      if (feature.geometry.type !== 'Point') continue;
      expect(isPointOnExistingSunLine(feature.geometry.coordinates)).toBe(true);
    }
    const mc = labels.features.find((feature) => feature.properties?.angle === 'MC');
    expect(mc?.geometry.type === 'Point' && Math.abs(mc.geometry.coordinates[1]) < 5).toBe(true);
  });

  it('frames marker and selected line together without inventing coordinates', () => {
    const camera = pathfinderPresentationCamera({
      filter: 'ASC',
      selectedLine: 'ASC',
      marker: { longitude: 25.1632, latitude: -32.7485 },
      desktop: true,
    });
    expect(camera.zoom).toBeLessThan(1.8);
    expect(camera.zoom).toBeGreaterThan(1.2);
    expect(Math.abs(camera.center[1])).toBeLessThan(40);
  });

  it('keeps visible line widths controlled and only thickens the selected line', () => {
    expect(visibleSunLineWidth('ASC', null)).toBe(2.8);
    expect(visibleSunLineWidth('ASC', 'ASC')).toBe(4);
    expect(visibleSunLineWidth('MC', 'ASC')).toBe(2.4);
    expect(PATHFINDER_SUN_ANGLE_HIT_WIDTH).toBeGreaterThan(visibleSunLineWidth('DSC', 'DSC'));
  });

  it('dims unselected visible lines without hiding them', () => {
    expect(visibleSunLineOpacity('DSC', 'ASC')).toBe(0.28);
    expect(visibleSunLineOpacity('ASC', 'ASC')).toBe(1);
    expect(visibleSunLineOpacity('ASC', null)).toBe(0.92);
  });
});

import { describe, expect, it, vi } from 'vitest';
import {
  cancelLatestFrame,
  createLatestFrameScheduler,
  collidingChromeClearance,
  discFitsStage,
  GLOBE_HEADER_CLEARANCE_PX,
  discFromProjectedLimb,
  frontHemisphereDot,
  globeCanvasMaskStyle,
  globeStageLayout,
  globeVisualWork,
  isGlobeDiscOverlayNonPainting,
  isOnFrontHemisphere,
  PATHFINDER_GLOBE_DISC_OVERLAY_STYLE,
  nextGlobeOverviewZoom,
  shouldApplyAutomaticCameraWrite,
  scheduleLatestFrame,
  scrollDeltaToRevealChip,
  searchQueryAfterCommit,
  searchQueryAfterLocaleChange,
  searchQueryMatchesSelection,
  shouldMeasureGlobeDiscForMask,
  shouldRecomputeGlobeDisc,
  visibleSelectionLabel,
} from './pathfinder-globe-projection';

describe('globe front-hemisphere occlusion', () => {
  const africa = { longitude: 18, latitude: 10 };

  it('keeps a marker on the camera-facing hemisphere visible', () => {
    expect(isOnFrontHemisphere(africa, { longitude: 20, latitude: 8 })).toBe(true);
    expect(frontHemisphereDot(africa, { longitude: 20, latitude: 8 })).toBeGreaterThan(0.5);
  });

  it('hides a marker on the rear hemisphere without changing coordinates', () => {
    expect(isOnFrontHemisphere(africa, { longitude: -162, latitude: -8 })).toBe(false);
    expect(isOnFrontHemisphere(africa, { longitude: 18, latitude: 10 })).toBe(true);
  });

  it('treats the far limb as hidden so HTML markers do not float off-disc', () => {
    expect(isOnFrontHemisphere(africa, { longitude: 18 + 100, latitude: 10 })).toBe(false);
  });
});

describe('projected globe-disc measurement', () => {
  it('computes a diameter from limb samples', () => {
    const disc = discFromProjectedLimb([
      { x: 100, y: 200 },
      { x: 760, y: 200 },
      { x: 430, y: -130 },
      { x: 430, y: 530 },
    ]);
    expect(disc?.diameter).toBe(660);
    expect(disc?.cx).toBe(430);
  });
});

describe('search query versus selected location', () => {
  it('clears typed search after an arbitrary globe pick', () => {
    expect(searchQueryAfterCommit('globe_point', 'Dubai')).toBe('');
  });

  it('writes the city label only after a city result is committed', () => {
    expect(searchQueryAfterCommit('city_search', 'Dubai')).toBe('Dubai');
  });

  it('does not treat a leftover query as the selected globe point', () => {
    expect(
      searchQueryMatchesSelection('Dubai', {
        source: 'globe_point',
        displayName: 'Selected location',
      })
    ).toBe(false);
  });

  it('keeps a city query matched only to that city selection', () => {
    expect(searchQueryMatchesSelection('Dubai', { source: 'city_search', displayName: 'Dubai' })).toBe(
      true
    );
    expect(searchQueryMatchesSelection('Dubai', { source: 'city_search', displayName: 'Tehran' })).toBe(
      false
    );
  });

  it('uses the current catalog label for globe picks so locale switches stay consistent', () => {
    expect(
      visibleSelectionLabel({ source: 'globe_point', displayName: 'Selected location' }, 'الموقع المحدد')
    ).toBe('الموقع المحدد');
    expect(visibleSelectionLabel({ source: 'city_search', displayName: 'Dubai' }, 'الموقع المحدد')).toBe(
      'Dubai'
    );
  });

  it('clears a leftover query on locale change unless it still matches the city selection', () => {
    expect(
      searchQueryAfterLocaleChange('Dubai', {
        source: 'globe_point',
        displayName: 'Selected location',
      })
    ).toBe('');
    expect(
      searchQueryAfterLocaleChange('Dubai', { source: 'city_search', displayName: 'Dubai' })
    ).toBe('Dubai');
  });
});

describe('globe motion visual sync', () => {
  it('updates the visible mask during move, not only moveend', () => {
    expect(globeVisualWork('move')).toEqual({
      applyMask: true,
      applyMarker: true,
      writeMetadata: false,
    });
    expect(globeVisualWork('moveend')).toEqual({
      applyMask: false,
      applyMarker: false,
      writeMetadata: true,
    });
    expect(globeVisualWork('idle').applyMask).toBe(false);
  });

  it('recomputes the disc for zoom or container resize, not bearing-only rotation', () => {
    const previous = { zoom: 2.44, width: 1347, height: 785 };
    expect(shouldRecomputeGlobeDisc(null, previous)).toBe(true);
    expect(shouldRecomputeGlobeDisc(previous, { ...previous })).toBe(false);
    expect(shouldRecomputeGlobeDisc(previous, { ...previous, zoom: 1.52 })).toBe(true);
    expect(shouldRecomputeGlobeDisc(previous, { ...previous, width: 390 })).toBe(true);
    expect(
      shouldMeasureGlobeDiscForMask({
        moving: true,
        event: 'move',
        previous,
        next: previous,
      })
    ).toBe(false);
    expect(
      shouldMeasureGlobeDiscForMask({
        moving: true,
        event: 'move',
        previous,
        next: { ...previous, zoom: 1.52 },
      })
    ).toBe(true);
    expect(
      shouldMeasureGlobeDiscForMask({
        moving: false,
        event: 'move',
        previous,
        next: previous,
      })
    ).toBe(false);
  });

  it('cannot let an older scheduled frame overwrite a newer camera frame', () => {
    const state = createLatestFrameScheduler();
    const order: number[] = [];
    const frames: FrameRequestCallback[] = [];
    const api = {
      requestAnimationFrame: (cb: FrameRequestCallback) => {
        frames.push(cb);
        return frames.length;
      },
      cancelAnimationFrame: (id: number) => {
        frames[id - 1] = () => undefined;
      },
    };
    scheduleLatestFrame(state, () => order.push(1), api);
    scheduleLatestFrame(state, () => order.push(2), api);
    frames[0](0);
    frames[1](0);
    expect(order).toEqual([2]);
    expect(state.generation).toBe(2);
  });

  it('cancels a pending RAF on unmount so it cannot paint after teardown', () => {
    const state = createLatestFrameScheduler();
    const ran = vi.fn();
    let pending: FrameRequestCallback | null = null;
    const api = {
      requestAnimationFrame: (cb: FrameRequestCallback) => {
        pending = cb;
        return 7;
      },
      cancelAnimationFrame: vi.fn(() => {
        pending = null;
      }),
    };
    scheduleLatestFrame(state, ran, api);
    expect(state.frame).toBe(7);
    cancelLatestFrame(state, api);
    expect(api.cancelAnimationFrame).toHaveBeenCalledWith(7);
    expect(state.frame).toBe(0);
    expect(pending).toBeNull();
    expect(ran).not.toHaveBeenCalled();
  });

  it('keeps the debug measurement node visually non-painting', () => {
    expect(PATHFINDER_GLOBE_DISC_OVERLAY_STYLE).toContain('opacity:0');
    expect(PATHFINDER_GLOBE_DISC_OVERLAY_STYLE).toContain('visibility:hidden');
    expect(PATHFINDER_GLOBE_DISC_OVERLAY_STYLE).toContain('border:0');
    expect(
      isGlobeDiscOverlayNonPainting({
        opacity: '0',
        visibility: 'hidden',
        borderStyle: 'none',
        borderWidth: '0px',
      })
    ).toBe(true);
    expect(
      isGlobeDiscOverlayNonPainting({
        opacity: '1',
        visibility: 'visible',
        borderStyle: 'dashed',
        borderWidth: '1px',
      })
    ).toBe(false);
  });

  it('updates marker visibility from the live camera, including during movement', () => {
    expect(globeVisualWork('move').applyMarker).toBe(true);
    expect(globeVisualWork('moveend').applyMarker).toBe(false);
    expect(isOnFrontHemisphere({ longitude: 18, latitude: 10 }, { longitude: 20, latitude: 8 })).toBe(
      true
    );
    expect(isOnFrontHemisphere({ longitude: -168, latitude: 8 }, { longitude: 18, latitude: 10 })).toBe(
      false
    );
  });

  it('changes clip geometry when the disc size changes so an old circle cannot linger', () => {
    const overview = globeCanvasMaskStyle(
      { left: 177, top: 48, width: 653, height: 653, diameter: 653, cx: 503.5, cy: 374.5 },
      2.44
    );
    const focused = globeCanvasMaskStyle(
      { left: 308, top: 179, width: 391, height: 391, diameter: 391, cx: 503.5, cy: 374.5 },
      1.52
    );
    expect(overview.clipPath).toContain('326.5px');
    expect(focused.clipPath).toContain('195.5px');
    expect(overview.clipPath).not.toBe(focused.clipPath);
    expect(
      globeCanvasMaskStyle(
        { left: 177, top: 48, width: 653, height: 653, diameter: 653, cx: 503.5, cy: 374.5 },
        4.55
      ).clipPath
    ).toBe('');
  });
});

describe('globe stage alignment and mobile containment', () => {
  it('keeps a 620–700px desktop disc when the usable stage permits it', () => {
    const layout = globeStageLayout({
      stageWidth: 1348,
      stageHeight: 787,
      desktop: true,
      compact: false,
    });
    expect(layout.padding.top).toBeLessThanOrEqual(28);
    expect(layout.disc.target).toBeGreaterThanOrEqual(620);
    expect(layout.disc.target).toBeLessThanOrEqual(700);
    expect(layout.disc.max).toBeGreaterThanOrEqual(layout.disc.target);
  });

  it('uses a 500–540px disc at 1280×720 when that is the largest complete fit', () => {
    const layout = globeStageLayout({
      stageWidth: 1188,
      stageHeight: 607,
      desktop: true,
      compact: false,
    });
    expect(layout.disc.max).toBeGreaterThanOrEqual(500);
    expect(layout.disc.max).toBeLessThanOrEqual(540);
    expect(layout.disc.max).toBeLessThanOrEqual(layout.usableHeight);
  });

  it('fits the complete mobile sphere inside a 390px stage with a side margin', () => {
    const layout = globeStageLayout({
      stageWidth: 390,
      stageHeight: 684,
      desktop: false,
      compact: true,
    });
    expect(layout.disc.target).toBeGreaterThanOrEqual(340);
    expect(layout.disc.target).toBeLessThanOrEqual(358);
    expect(layout.disc.max).toBeLessThanOrEqual(358);
    expect(
      discFitsStage(
        { top: layout.padding.top, left: 36, diameter: layout.disc.target },
        layout,
        390
      )
    ).toBe(true);
    expect(collidingChromeClearance(188.1, 176)).toBeGreaterThanOrEqual(GLOBE_HEADER_CLEARANCE_PX);
    expect(GLOBE_HEADER_CLEARANCE_PX).toBe(12);
  });

  it('scrolls a clipped active chip fully into the viewport', () => {
    expect(
      scrollDeltaToRevealChip(
        { left: 8, right: 382 },
        { left: -12, right: 52 },
        { left: 0, right: 390 }
      )
    ).toBeLessThan(0);
    expect(
      scrollDeltaToRevealChip(
        { left: 8, right: 382 },
        { left: 20, right: 90 },
        { left: 0, right: 390 }
      )
    ).toBe(0);
  });

  it('does not let a late idle or moveend writer overwrite a user zoom', () => {
    expect(
      shouldApplyAutomaticCameraWrite({ source: 'idle-settle', userHasMovedCamera: true })
    ).toBe(false);
    expect(
      shouldApplyAutomaticCameraWrite({ source: 'moveend-constrain', userHasMovedCamera: false })
    ).toBe(false);
    expect(
      shouldApplyAutomaticCameraWrite({
        source: 'resize',
        userHasMovedCamera: true,
        containerSizeChanged: true,
      })
    ).toBe(false);
    expect(
      shouldApplyAutomaticCameraWrite({
        source: 'resize',
        userHasMovedCamera: false,
        containerSizeChanged: true,
        viewportSizeChanged: true,
      })
    ).toBe(true);
    expect(
      shouldApplyAutomaticCameraWrite({
        source: 'resize',
        userHasMovedCamera: false,
        containerSizeChanged: true,
        viewportSizeChanged: false,
      })
    ).toBe(false);
    expect(shouldApplyAutomaticCameraWrite({ source: 'load', userHasMovedCamera: false })).toBe(true);
  });

  it('keeps iterating overview zoom when the first jump is too large for the stage', () => {
    const first = nextGlobeOverviewZoom(2.44, 604, 527, 2.52);
    expect(first).toBeLessThan(2.44);
    expect(first).toBeGreaterThan(2.1);
    expect(Math.abs(first - 2.44)).toBeGreaterThan(0.001);
  });
});

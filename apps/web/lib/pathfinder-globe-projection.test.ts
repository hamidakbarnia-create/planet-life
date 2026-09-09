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
  BASEMAP_LABEL_RUNTIME_REJECTS_MALFORMED,
  PATHFINDER_RTL_TEXT_PLUGIN_URL,
  PATHFINDER_RTL_FALLBACK_WARNING,
  basemapLanguageAfterRtlPlugin,
  basemapLabelFieldOrder,
  basemapLabelTextField,
  isUsableBasemapName,
  resolveBasemapLabel,
  resultCardColumnCount,
  symbolLayerUsesNameField,
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

  it('refits the globe for a results-layout change only when the user has not moved the camera', () => {
    expect(
      shouldApplyAutomaticCameraWrite({ source: 'results-layout', userHasMovedCamera: false })
    ).toBe(true);
    expect(
      shouldApplyAutomaticCameraWrite({ source: 'results-layout', userHasMovedCamera: true })
    ).toBe(false);
  });
});

describe('basemap label field expression', () => {
  const london = {
    name: 'London',
    'name:en': 'London',
    name_en: 'London',
    'name:latin': 'London',
    'name:ru': 'Лондон',
    'name:fa': 'لندن',
    'name:ar': 'لندن',
  };
  const riyadh = {
    name: 'الرياض',
    'name:en': 'Riyadh',
    name_en: 'Riyadh',
    'name:latin': 'Riyadh',
    'name:ru': 'Эр-Рияд',
    'name:fa': 'ریاض',
    'name:ar': 'الرياض',
  };
  const ethiopia = {
    name: 'ኢትዮጵያ / Ethiopia',
    'name:en': 'Ethiopia',
    name_en: 'Ethiopia',
    'name:latin': 'Ethiopia',
    'name:ru': 'Эфиопия',
    'name:fa': 'اتیوپی',
    'name:ar': 'إثيوبيا',
  };
  const atlantic = {
    name: 'North Atlantic Ocean',
    'name:en': 'North Atlantic Ocean',
    name_en: 'North Atlantic Ocean',
    'name:ru': 'Северный Атлантический океан',
    'name:fa': 'اقیانوس اطلس شمالی',
    'name:ar': 'شمال المحيط الأطلسي',
  };

  it('uses confirmed OpenFreeMap fields in locale → English → source name order', () => {
    expect(basemapLabelFieldOrder('ru')).toEqual(['name:ru', 'name:en', 'name_en', 'name']);
    expect(basemapLabelFieldOrder('fa')).toEqual(['name:fa', 'name:en', 'name_en', 'name']);
    expect(basemapLabelFieldOrder('ar')).toEqual(['name:ar', 'name:en', 'name_en', 'name']);
    expect(basemapLabelFieldOrder('en')).toEqual(['name:en', 'name_en', 'name:latin', 'name']);
    expect(basemapLabelTextField('fa')).toEqual([
      'coalesce',
      ['get', 'name:fa'],
      ['get', 'name:en'],
      ['get', 'name_en'],
      ['get', 'name'],
    ]);
  });

  it('resolves native labels for country, capital, city and ocean samples', () => {
    expect(resolveBasemapLabel(london, 'en')).toBe('London');
    expect(resolveBasemapLabel(london, 'ru')).toBe('Лондон');
    expect(resolveBasemapLabel(london, 'fa')).toBe('لندن');
    expect(resolveBasemapLabel(london, 'ar')).toBe('لندن');
    expect(resolveBasemapLabel(riyadh, 'ar')).toBe('الرياض');
    expect(resolveBasemapLabel(ethiopia, 'fa')).toBe('اتیوپی');
    expect(resolveBasemapLabel(atlantic, 'ru')).toBe('Северный Атлантический океан');
  });

  it('falls back to English then source name when a localized field is missing or corrupted', () => {
    expect(resolveBasemapLabel({ name: 'Nigeria', 'name:en': 'Nigeria' }, 'fa')).toBe('Nigeria');
    expect(resolveBasemapLabel({ name: 'الرياض', 'name:fa': 'Ã±Ã­' }, 'fa')).toBe('الرياض');
    expect(isUsableBasemapName('Ã³Â¨', 'fa')).toBe(false);
    expect(isUsableBasemapName('ریاض', 'fa')).toBe(true);
    expect(isUsableBasemapName('Riyadh', 'fa')).toBe(false);
    expect(symbolLayerUsesNameField(['coalesce', ['get', 'name:en'], ['get', 'name']])).toBe(true);
    expect(symbolLayerUsesNameField(['to-string', ['get', 'ref']])).toBe(false);
  });

  const fixtures = {
    validPersian: { name: 'ایران', 'name:en': 'Iran', name_en: 'Iran', 'name:fa': 'ایران' },
    validArabic: { name: 'السعودية', 'name:en': 'Saudi Arabia', name_en: 'Saudi Arabia', 'name:ar': 'السعودية' },
    validRussian: { name: 'Иран', 'name:en': 'Iran', name_en: 'Iran', 'name:ru': 'Иран' },
    mojibakeFa: { name: 'ایران', 'name:en': 'Iran', 'name:fa': 'Ã­Ã±Ã§' },
    latinInsideFa: { name: 'ایران', 'name:en': 'Iran', 'name:fa': 'Iran' },
    latinInsideAr: { name: 'السعودية', 'name:en': 'Saudi Arabia', 'name:ar': 'Saudi Arabia' },
    latinInsideRu: { name: 'Иран', 'name:en': 'Iran', 'name:ru': 'Iran' },
    missingLocalized: { name: 'Nigeria', 'name:en': 'Nigeria', name_en: 'Nigeria' },
    englishThenSource: { name: 'الرياض', 'name:en': 'Riyadh' },
    sourceOnly: { name: 'الرياض' },
  } as const;

  it('accepts valid Persian, Arabic and Russian localized names in the JS helper', () => {
    expect(isUsableBasemapName(fixtures.validPersian['name:fa'], 'fa')).toBe(true);
    expect(isUsableBasemapName(fixtures.validArabic['name:ar'], 'ar')).toBe(true);
    expect(isUsableBasemapName(fixtures.validRussian['name:ru'], 'ru')).toBe(true);
    expect(resolveBasemapLabel(fixtures.validPersian, 'fa')).toBe('ایران');
    expect(resolveBasemapLabel(fixtures.validArabic, 'ar')).toBe('السعودية');
    expect(resolveBasemapLabel(fixtures.validRussian, 'ru')).toBe('Иран');
  });

  it('JS helper rejects mojibake and Latin text inside localized fields', () => {
    expect(isUsableBasemapName(fixtures.mojibakeFa['name:fa'], 'fa')).toBe(false);
    expect(isUsableBasemapName(fixtures.latinInsideFa['name:fa'], 'fa')).toBe(false);
    expect(isUsableBasemapName(fixtures.latinInsideAr['name:ar'], 'ar')).toBe(false);
    expect(isUsableBasemapName(fixtures.latinInsideRu['name:ru'], 'ru')).toBe(false);
    expect(resolveBasemapLabel(fixtures.mojibakeFa, 'fa')).toBe('Iran');
    expect(resolveBasemapLabel(fixtures.latinInsideFa, 'fa')).toBe('Iran');
    expect(resolveBasemapLabel(fixtures.latinInsideAr, 'ar')).toBe('Saudi Arabia');
    expect(resolveBasemapLabel(fixtures.latinInsideRu, 'ru')).toBe('Iran');
  });

  it('JS helper falls back to English then source name when localized is missing', () => {
    expect(resolveBasemapLabel(fixtures.missingLocalized, 'fa')).toBe('Nigeria');
    expect(resolveBasemapLabel(fixtures.englishThenSource, 'fa')).toBe('Riyadh');
    expect(resolveBasemapLabel(fixtures.sourceOnly, 'fa')).toBe('الرياض');
  });

  it('does not encode malformed-value rejection into the live MapLibre expression', () => {
    expect(BASEMAP_LABEL_RUNTIME_REJECTS_MALFORMED).toBe(false);
    expect(JSON.stringify(basemapLabelTextField('fa'))).not.toContain('Ã');
    expect(basemapLabelTextField('fa')[0]).toBe('coalesce');
    expect(PATHFINDER_RTL_TEXT_PLUGIN_URL).toBe('/vendor/mapbox-gl-rtl-text-0.3.0.js');
    expect(PATHFINDER_RTL_TEXT_PLUGIN_URL).not.toContain('unpkg');
  });

  it('falls back to English basemap labels when the RTL plugin is not ready', () => {
    expect(basemapLanguageAfterRtlPlugin('fa', false)).toBe('en');
    expect(basemapLanguageAfterRtlPlugin('ar', false)).toBe('en');
    expect(basemapLanguageAfterRtlPlugin('fa', true)).toBe('fa');
    expect(basemapLanguageAfterRtlPlugin('ar', true)).toBe('ar');
    expect(basemapLanguageAfterRtlPlugin('en', false)).toBe('en');
    expect(basemapLanguageAfterRtlPlugin('ru', false)).toBe('ru');
    expect(PATHFINDER_RTL_FALLBACK_WARNING).toMatch(/English/);
    expect(PATHFINDER_RTL_FALLBACK_WARNING).not.toMatch(/unshaped|readable Arabic/i);
  });
});

describe('results panel card columns', () => {
  it('keeps one column until each card can stay at least 180px', () => {
    expect(resultCardColumnCount(348)).toBe(1);
    expect(resultCardColumnCount(372)).toBe(2);
    expect(globeStageLayout({
      stageWidth: 900,
      stageHeight: 787,
      desktop: true,
      compact: false,
      sidePanelReserve: 0,
    }).padding.right).toBe(16);
  });
});

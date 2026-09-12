export type LngLatLike = { longitude: number; latitude: number };

export type ProjectedGlobeDisc = {
  left: number;
  top: number;
  width: number;
  height: number;
  diameter: number;
  cx: number;
  cy: number;
};

const FRONT_DOT_EPSILON = 0.04;

export function lngLatToUnit(longitude: number, latitude: number): [number, number, number] {
  const lambda = (longitude * Math.PI) / 180;
  const phi = (latitude * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  return [cosPhi * Math.cos(lambda), cosPhi * Math.sin(lambda), Math.sin(phi)];
}

export function frontHemisphereDot(
  camera: LngLatLike,
  point: LngLatLike
): number {
  const a = lngLatToUnit(camera.longitude, camera.latitude);
  const b = lngLatToUnit(point.longitude, point.latitude);
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** HTML markers are not occluded by MapLibre's globe; hide when behind the camera-facing hemisphere. */
export function isOnFrontHemisphere(camera: LngLatLike, point: LngLatLike): boolean {
  return frontHemisphereDot(camera, point) > FRONT_DOT_EPSILON;
}

export function destinationPoint(
  longitude: number,
  latitude: number,
  distanceDeg: number,
  bearingRad: number
): LngLatLike {
  const phi1 = (latitude * Math.PI) / 180;
  const lambda1 = (longitude * Math.PI) / 180;
  const delta = (distanceDeg * Math.PI) / 180;
  const sinPhi1 = Math.sin(phi1);
  const cosPhi1 = Math.cos(phi1);
  const sinDelta = Math.sin(delta);
  const cosDelta = Math.cos(delta);
  const phi2 = Math.asin(sinPhi1 * cosDelta + cosPhi1 * sinDelta * Math.cos(bearingRad));
  const lambda2 =
    lambda1 +
    Math.atan2(Math.sin(bearingRad) * sinDelta * cosPhi1, cosDelta - sinPhi1 * Math.sin(phi2));
  const wrapped = ((((lambda2 * 180) / Math.PI + 540) % 360) - 180);
  return { longitude: wrapped, latitude: (phi2 * 180) / Math.PI };
}

export function discFromProjectedLimb(
  points: Array<{ x: number; y: number }>
): ProjectedGlobeDisc | null {
  if (points.length === 0) return null;
  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }
  const width = maxX - minX;
  const height = maxY - minY;
  return {
    left: minX,
    top: minY,
    width,
    height,
    diameter: (width + height) / 2,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
  };
}

export function searchQueryAfterCommit(
  source: 'city_search' | 'globe_point',
  cityLabel?: string
): string {
  if (source === 'globe_point') return '';
  return (cityLabel ?? '').trim();
}

export function searchQueryMatchesSelection(
  query: string,
  point: { source: 'city_search' | 'globe_point'; displayName: string } | null
): boolean {
  const trimmed = query.trim();
  if (!point) return trimmed === '';
  if (point.source === 'globe_point') return trimmed === '';
  return trimmed === point.displayName;
}

export function searchQueryAfterLocaleChange(
  query: string,
  point: { source: 'city_search' | 'globe_point'; displayName: string } | null
): string {
  return searchQueryMatchesSelection(query, point) ? query.trim() : '';
}

/** Liberty layers that painted the rejected green park/landcover network. */
export const PATHFINDER_HIDDEN_GEOMETRY_LAYER_IDS = [
  'park',
  'park_outline',
  'landcover_wood',
  'landcover_grass',
  'landcover_wetland',
] as const;

export const PATHFINDER_RESTYLED_BOUNDARY_LAYER_IDS = [
  'boundary_2',
  'boundary_3',
  'boundary_disputed',
] as const;

export const PATHFINDER_FILL_OUTLINE_CLEARED_LAYER_IDS = [
  'park',
  'landuse_residential',
  'landcover_wood',
  'landcover_grass',
  'landcover_ice',
  'landcover_wetland',
  'landuse_pitch',
  'landuse_track',
  'landuse_cemetery',
  'landuse_hospital',
  'landuse_school',
  'water',
  'landcover_sand',
  'aeroway_fill',
  'building',
] as const;

export function visibleSelectionLabel(
  point: { source: 'city_search' | 'globe_point'; displayName: string },
  globePickLabel: string
): string {
  return point.source === 'globe_point' ? globePickLabel : point.displayName;
}

export const GLOBE_CLIP_MAX_ZOOM = 2.55;
export const GLOBE_HEADER_CLEARANCE_PX = 12;
export const GLOBE_DESKTOP_PANEL_PX = 340;
export const GLOBE_DESKTOP_RESULTS_PANEL_MIN = 380;
export const GLOBE_DESKTOP_RESULTS_PANEL_PREFERRED = 440;
export const GLOBE_DESKTOP_RESULTS_PANEL_MAX = 480;
export const GLOBE_DESKTOP_DISC_MIN = 620;
export const GLOBE_DESKTOP_DISC_MAX = 700;
export const GLOBE_DESKTOP_DISC_TARGET = 660;
export const PATHFINDER_RESULT_CARD_MIN_PX = 180;

export function resultCardColumnCount(
  contentWidth: number,
  minCard = PATHFINDER_RESULT_CARD_MIN_PX,
  gap = 12
): 1 | 2 {
  return contentWidth >= minCard * 2 + gap ? 2 : 1;
}

export type BasemapLabelLang = 'en' | 'ru' | 'fa' | 'ar';

/** Confirmed on live OpenFreeMap/OpenMapTiles place + water_name features. */
export const BASEMAP_LABEL_FIELDS = {
  localized: {
    en: 'name:en',
    ru: 'name:ru',
    fa: 'name:fa',
    ar: 'name:ar',
  },
  english: ['name:en', 'name_en'] as const,
  source: 'name',
} as const;

export function basemapLabelFieldOrder(lang: BasemapLabelLang): readonly string[] {
  if (lang === 'en') {
    return ['name:en', 'name_en', 'name:latin', 'name'];
  }
  return [BASEMAP_LABEL_FIELDS.localized[lang], 'name:en', 'name_en', 'name'];
}

/**
 * Live MapLibre text-field. Coalesce skips null/empty only.
 * It cannot reject mojibake or wrong-script values on rendered features.
 */
export function basemapLabelTextField(lang: BasemapLabelLang): unknown[] {
  return ['coalesce', ...basemapLabelFieldOrder(lang).map((field) => ['get', field])];
}

/** Same-origin pinned copy of @mapbox/mapbox-gl-rtl-text@0.3.0. */
export const PATHFINDER_RTL_TEXT_PLUGIN_URL = '/vendor/mapbox-gl-rtl-text-0.3.0.js';

export const PATHFINDER_RTL_FALLBACK_WARNING =
  'Map place names are shown in English. Right-to-left map text could not be loaded.';

export function basemapLanguageAfterRtlPlugin(
  lang: BasemapLabelLang,
  pluginReady: boolean
): BasemapLabelLang {
  if ((lang === 'fa' || lang === 'ar') && !pluginReady) return 'en';
  return lang;
}

/** The live map expression does not inspect glyph quality per feature. */
export const BASEMAP_LABEL_RUNTIME_REJECTS_MALFORMED = false;

const MOJIBAKE_RE = /Ã.|Â.|Ù.|Ø.|Ú.|Ð.|Ñ.|\uFFFD/;
const SCRIPT_RE: Record<BasemapLabelLang, RegExp> = {
  en: /[A-Za-z]/,
  ru: /[\u0400-\u04FF]/,
  fa: /[\u0600-\u06FF]/,
  ar: /[\u0600-\u06FF]/,
};

export function isUsableBasemapName(value: unknown, lang: BasemapLabelLang): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (MOJIBAKE_RE.test(trimmed)) return false;
  if (lang === 'en') return SCRIPT_RE.en.test(trimmed);
  if (!SCRIPT_RE[lang].test(trimmed)) return false;
  return true;
}

export function resolveBasemapLabel(
  properties: Record<string, string | undefined | null>,
  lang: BasemapLabelLang
): string {
  for (const field of basemapLabelFieldOrder(lang)) {
    const value = properties[field];
    if (field === BASEMAP_LABEL_FIELDS.localized[lang] && lang !== 'en') {
      if (isUsableBasemapName(value, lang)) return value!.trim();
      continue;
    }
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export function symbolLayerUsesNameField(textField: unknown): boolean {
  if (textField == null) return false;
  return JSON.stringify(textField).includes('"name');
}
export type GlobeStageLayout = {
  padding: { top: number; right: number; bottom: number; left: number };
  usableWidth: number;
  usableHeight: number;
  disc: { target: number; min: number; max: number };
};

export function globeStageLayout(input: {
  stageWidth: number;
  stageHeight: number;
  desktop: boolean;
  compact: boolean;
  sidePanelReserve?: number;
}): GlobeStageLayout {
  const overlayReserve = input.sidePanelReserve ?? (input.desktop ? GLOBE_DESKTOP_PANEL_PX : 0);
  const padding = {
    top: input.desktop ? 24 : input.compact ? 16 : 20,
    left: input.desktop ? 16 : 12,
    right: input.desktop ? overlayReserve + 16 : 12,
    bottom: input.compact ? 154 : input.desktop ? 56 : 72,
  };
  const usableWidth = Math.max(160, input.stageWidth - padding.left - padding.right);
  const usableHeight = Math.max(160, input.stageHeight - padding.top - padding.bottom);
  const fit = Math.floor(Math.min(usableWidth, usableHeight));
  if (input.desktop) {
    const max = Math.max(160, Math.min(GLOBE_DESKTOP_DISC_MAX, fit));
    const target = Math.min(GLOBE_DESKTOP_DISC_TARGET, max);
    const min = Math.min(GLOBE_DESKTOP_DISC_MIN, max);
    return { padding, usableWidth, usableHeight, disc: { target, min, max } };
  }
  const max = Math.max(160, Math.min(fit - 16, input.compact ? 358 : 400));
  const target = Math.min(input.compact ? 350 : 360, max);
  return {
    padding,
    usableWidth,
    usableHeight,
    disc: { target, min: Math.min(250, target), max },
  };
}

/** Vertical gap from colliding chrome to the globe disc in viewport space. */
export function collidingChromeClearance(discViewportTop: number, chromeBottom: number): number {
  return discViewportTop - chromeBottom;
}

export function discFitsStage(
  disc: { top: number; diameter: number; left: number },
  layout: GlobeStageLayout,
  stageWidth: number
): boolean {
  const right = disc.left + disc.diameter;
  return (
    disc.top + 0.5 >= layout.padding.top &&
    disc.diameter <= layout.disc.max + 1 &&
    disc.left >= 0 &&
    right <= stageWidth + 1
  );
}

export function scrollDeltaToRevealChip(
  row: { left: number; right: number },
  chip: { left: number; right: number },
  viewport: { left: number; right: number },
  padding = 8
): number {
  const leftBound = Math.max(row.left, viewport.left) + padding;
  const rightBound = Math.min(row.right, viewport.right) - padding;
  if (chip.left < leftBound) return chip.left - leftBound;
  if (chip.right > rightBound) return chip.right - rightBound;
  return 0;
}

export type AutomaticCameraSource =
  | 'load'
  | 'idle-settle'
  | 'resize'
  | 'moveend-constrain'
  | 'results-layout';

/** Late idle/resize/moveend writers must not overwrite a newer user zoom or drag. */
export function nextGlobeOverviewZoom(
  zoom: number,
  diameter: number,
  target: number,
  zoomCap: number
): number {
  const next = zoom + Math.log2(target / Math.max(diameter, 80));
  return Math.min(zoomCap, Math.max(0.85, next));
}

export function overviewFitReached(
  disc: { diameter: number; top: number },
  layout: { disc: { min: number; max: number }; padding: { top: number } }
): boolean {
  return (
    disc.diameter >= layout.disc.min &&
    disc.diameter <= layout.disc.max &&
    disc.top + 0.5 >= layout.padding.top
  );
}

export function shouldApplyAutomaticCameraWrite(input: {
  source: AutomaticCameraSource;
  userHasMovedCamera: boolean;
  containerSizeChanged?: boolean;
  viewportSizeChanged?: boolean;
}): boolean {
  if (input.userHasMovedCamera) return false;
  if (input.source === 'moveend-constrain') return false;
  if (input.source === 'results-layout') return !input.userHasMovedCamera;
  if (input.source === 'resize') {
    // Locale/dir reflow can change the container box without a viewport change.
    return Boolean(input.containerSizeChanged) && Boolean(input.viewportSizeChanged);
  }
  return input.source === 'load' || input.source === 'idle-settle';
}

export type GlobeCameraWriteMethod =
  | 'flyTo'
  | 'easeTo'
  | 'jumpTo'
  | 'fitBounds'
  | 'setZoom'
  | 'resize'
  | 'reset'
  | 'focus';

export type GlobeCameraWriteLog = {
  timestamp: number;
  caller: string;
  method: GlobeCameraWriteMethod;
  centerBefore: string;
  zoomBefore: number;
  centerAfter: string;
  zoomAfter: number;
  locale: string;
  mapEvent: string;
  applied: boolean;
};

export function snapshotCameraLngLat(center: { lng: number; lat: number }): string {
  return `${center.lng.toFixed(4)},${center.lat.toFixed(4)}`;
}

export function recordGlobeCameraWrite(
  log: GlobeCameraWriteLog[],
  entry: GlobeCameraWriteLog,
  limit = 80
): GlobeCameraWriteLog[] {
  log.push(entry);
  if (log.length > limit) log.splice(0, log.length - limit);
  return log;
}

export type GlobeCameraSnapshot = {
  zoom: number;
  width: number;
  height: number;
};

export type GlobeVisualEvent = 'move' | 'render' | 'resize' | 'moveend' | 'idle' | 'zoomend';

export type LatestFrameScheduler = {
  generation: number;
  frame: number;
};

/** Measurement node must exist for tests but must not paint a circle in the UI. */
export const PATHFINDER_GLOBE_DISC_OVERLAY_STYLE =
  'position:absolute;left:0;top:0;width:0;height:0;margin:0;padding:0;border:0;background:transparent;opacity:0;visibility:hidden;pointer-events:none;overflow:hidden;';

export function isGlobeDiscOverlayNonPainting(style: {
  opacity: string;
  visibility: string;
  borderStyle?: string;
  borderWidth?: string;
}): boolean {
  const borderHidden =
    !style.borderStyle ||
    style.borderStyle === 'none' ||
    style.borderWidth === '0' ||
    style.borderWidth === '0px';
  return style.opacity === '0' && style.visibility === 'hidden' && borderHidden;
}

export function shouldRecomputeGlobeDisc(
  previous: GlobeCameraSnapshot | null,
  next: GlobeCameraSnapshot
): boolean {
  if (!previous) return true;
  return (
    Math.abs(previous.zoom - next.zoom) > 1e-4 ||
    previous.width !== next.width ||
    previous.height !== next.height
  );
}

/**
 * Remeasure the disc when zoom or container size changes. Bearing-only
 * rotation keeps the same canvas-relative circle, so do not recompute it.
 * `moving` is accepted for callers but must not force a remasure — that
 * caused per-frame limb sampling and a shimmering/stale-looking edge.
 */
export function shouldMeasureGlobeDiscForMask(input: {
  moving: boolean;
  event: 'move' | 'render' | 'resize';
  previous: GlobeCameraSnapshot | null;
  next: GlobeCameraSnapshot;
}): boolean {
  if (input.event === 'resize') return true;
  void input.moving;
  return shouldRecomputeGlobeDisc(input.previous, input.next);
}

/** Visible mask/clip follows live camera events. moveend/idle are metadata only. */
export function globeVisualWork(event: GlobeVisualEvent): {
  applyMask: boolean;
  applyMarker: boolean;
  writeMetadata: boolean;
} {
  if (event === 'move' || event === 'render' || event === 'resize') {
    return { applyMask: true, applyMarker: true, writeMetadata: false };
  }
  return { applyMask: false, applyMarker: false, writeMetadata: true };
}

export function globeCanvasMaskStyle(
  disc: ProjectedGlobeDisc | null,
  zoom: number
): { clipPath: string; maskImage: string } {
  if (!disc || zoom >= GLOBE_CLIP_MAX_ZOOM) {
    return { clipPath: '', maskImage: '' };
  }
  const radius = disc.diameter / 2;
  const position = `${disc.cx.toFixed(1)}px ${disc.cy.toFixed(1)}px`;
  return {
    clipPath: `circle(${radius.toFixed(1)}px at ${position})`,
    maskImage: `radial-gradient(circle ${radius.toFixed(1)}px at ${position}, #000 99%, transparent 100%)`,
  };
}

export function createLatestFrameScheduler(): LatestFrameScheduler {
  return { generation: 0, frame: 0 };
}

export function scheduleLatestFrame(
  state: LatestFrameScheduler,
  callback: () => void,
  api: {
    requestAnimationFrame: (cb: FrameRequestCallback) => number;
    cancelAnimationFrame: (id: number) => void;
  }
): number {
  state.generation += 1;
  const generation = state.generation;
  if (state.frame) api.cancelAnimationFrame(state.frame);
  state.frame = api.requestAnimationFrame(() => {
    state.frame = 0;
    if (generation !== state.generation) return;
    callback();
  });
  return generation;
}

export function cancelLatestFrame(
  state: LatestFrameScheduler,
  api: { cancelAnimationFrame: (id: number) => void }
): void {
  state.generation += 1;
  if (state.frame) {
    api.cancelAnimationFrame(state.frame);
    state.frame = 0;
  }
}

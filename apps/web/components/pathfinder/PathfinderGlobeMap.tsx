'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl, { getRTLTextPluginStatus, setRTLTextPlugin } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { AppLang } from '@/lib/app-settings';
import type { PathfinderSelectedPoint } from '@/lib/pathfinder-selection';
import {
  PATHFINDER_SUN_ANGLE_COLORS,
  PATHFINDER_SUN_ANGLE_DASH,
  PATHFINDER_SUN_ANGLE_HIT_WIDTH,
  PATHFINDER_SUN_ANGLE_LEGEND,
  PATHFINDER_SUN_ANGLE_LABEL_SOURCE_ID,
  PATHFINDER_SUN_ANGLE_SOURCE_ID,
  type PathfinderSunAngle,
  type PathfinderSunAngleFilter,
  isSunAngleVisible,
  pathfinderCityCamera,
  pathfinderLineFocusCamera,
  pathfinderOverviewCamera,
  pathfinderSunAngleGeoJSON,
  pathfinderSunAngleLabelGeoJSON,
  sunAngleDisplayLabel,
  sunAngleHaloLayerId,
  sunAngleHitLayerId,
  sunAngleLabelLayerId,
  sunAngleVisibleLayerId,
  visibleSunLineOpacity,
  visibleSunLineWidth,
} from '@/lib/pathfinder-geometry-demo';
import type { GlobeCameraSnapshot, GlobeCameraWriteMethod, ProjectedGlobeDisc } from '@/lib/pathfinder-globe-projection';
import {
  basemapLabelTextField,
  basemapLanguageAfterRtlPlugin,
  PATHFINDER_RTL_FALLBACK_WARNING,
  PATHFINDER_RTL_TEXT_PLUGIN_URL,
  cancelLatestFrame,
  createLatestFrameScheduler,
  destinationPoint,
  discFromProjectedLimb,
  GLOBE_DESKTOP_PANEL_PX,
  globeCanvasMaskStyle,
  globeStageLayout,
  globeVisualWork,
  isOnFrontHemisphere,
  PATHFINDER_FILL_OUTLINE_CLEARED_LAYER_IDS,
  PATHFINDER_GLOBE_DISC_OVERLAY_STYLE,
  PATHFINDER_HIDDEN_GEOMETRY_LAYER_IDS,
  PATHFINDER_RESTYLED_BOUNDARY_LAYER_IDS,
  recordGlobeCameraWrite,
  scheduleLatestFrame,
  nextGlobeOverviewZoom,
  overviewFitReached,
  shouldApplyAutomaticCameraWrite,
  shouldMeasureGlobeDiscForMask,
  shouldRecomputeGlobeDisc,
  snapshotCameraLngLat,
  symbolLayerUsesNameField,
} from '@/lib/pathfinder-globe-projection';

export type PathfinderGlobeMapProps = {
  mode: 'globe' | 'mercator';
  selected: PathfinderSelectedPoint | null;
  resetToken?: number;
  focusToken?: number;
  focusAngle?: PathfinderSunAngle | null;
  angleFilter?: PathfinderSunAngleFilter;
  selectedLine?: PathfinderSunAngle | null;
  labelLanguage?: AppLang;
  resultsOpen?: boolean;
  rtlFallbackWarning?: string;
  onPick: (latitude: number, longitude: number) => void;
  onSelectLine?: (angle: PathfinderSunAngle) => void;
  onReady: () => void;
  onContextLost: () => void;
  onInitFailure: (error: Error) => void;
};

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const PIXEL_RATIO_CAP = 2;
const RTL_TEXT_PLUGIN_URL = PATHFINDER_RTL_TEXT_PLUGIN_URL;

function rtlPluginStatus(): string {
  if (typeof getRTLTextPluginStatus === 'function') return getRTLTextPluginStatus();
  if (typeof maplibregl.getRTLTextPluginStatus === 'function') return maplibregl.getRTLTextPluginStatus();
  return 'unavailable';
}

function ensureRtlTextPlugin(): Promise<boolean> {
  try {
    const status = rtlPluginStatus();
    if (status === 'loaded') return Promise.resolve(true);
    if (status === 'error') return Promise.resolve(false);
    if (status === 'loading') {
      return new Promise((resolve) => {
        const started = Date.now();
        const timer = window.setInterval(() => {
          const next = rtlPluginStatus();
          if (next === 'loaded') {
            window.clearInterval(timer);
            resolve(true);
            return;
          }
          if (next === 'error' || Date.now() - started > 8000) {
            window.clearInterval(timer);
            resolve(false);
          }
        }, 50);
      });
    }
    const register =
      typeof setRTLTextPlugin === 'function'
        ? setRTLTextPlugin
        : maplibregl.setRTLTextPlugin;
    if (typeof register !== 'function') return Promise.resolve(false);
    return Promise.resolve(register(RTL_TEXT_PLUGIN_URL, false)).then(
      () => rtlPluginStatus() !== 'error',
      () => false
    );
  } catch {
    return Promise.resolve(false);
  }
}
const MARKER_COLOR = '#fbbf24';
const MAPLIBRE_ATTRIBUTION =
  '<a href="https://maplibre.org/" target="_blank" rel="noreferrer">© MapLibre</a>';

const HIDDEN_LABEL_LAYERS = [
  'poi_r20',
  'poi_r7',
  'poi_r1',
  'poi_transit',
  'highway-name-path',
  'highway-name-minor',
  'highway-name-major',
  'highway-shield-non-us',
  'highway-shield-us-interstate',
  'road_shield_us',
  'road_one_way_arrow',
  'road_one_way_arrow_opposite',
  'label_village',
  'label_town',
  'label_other',
  'label_state',
  'label_county',
  'waterway_line_label',
  'airport',
];

const GLOBE_ONLY_ROAD_PREFIXES = ['road_', 'tunnel_', 'bridge_', 'aeroway_'];

type CameraTarget = {
  center: [number, number];
  zoom: number;
  pitch?: number;
  bearing?: number;
};

function capPixelRatio(devicePixelRatio: number): number {
  if (!Number.isFinite(devicePixelRatio) || devicePixelRatio <= 0) return 1;
  return Math.min(devicePixelRatio, PIXEL_RATIO_CAP);
}

function hitLayerIds(): string[] {
  return PATHFINDER_SUN_ANGLE_LEGEND.map((item) => sunAngleHitLayerId(item.angle));
}

function applyBasemapLanguage(map: maplibregl.Map, lang: AppLang) {
  const style = map.getStyle();
  if (!style?.layers) return;
  const field = basemapLabelTextField(lang) as maplibregl.ExpressionSpecification;
  for (const layer of style.layers) {
    if (layer.type !== 'symbol') continue;
    if (layer.id.startsWith(PATHFINDER_SUN_ANGLE_SOURCE_ID)) continue;
    if (layer.id.startsWith(PATHFINDER_SUN_ANGLE_LABEL_SOURCE_ID)) continue;
    if (HIDDEN_LABEL_LAYERS.includes(layer.id)) continue;
    const current = map.getLayoutProperty(layer.id, 'text-field');
    if (!symbolLayerUsesNameField(current)) continue;
    map.setLayoutProperty(layer.id, 'text-field', field);
  }
}

function applyLineDash(map: maplibregl.Map, layerId: string, angle: PathfinderSunAngle) {
  const dash = PATHFINDER_SUN_ANGLE_DASH[angle];
  if (dash) {
    map.setPaintProperty(layerId, 'line-dasharray', dash);
    return;
  }
  try {
    map.setPaintProperty(layerId, 'line-dasharray', undefined);
  } catch {
    /* solid remains the style default */
  }
}

function lineWidthExpression(
  angle: PathfinderSunAngle,
  selectedLine: PathfinderSunAngle | null
): maplibregl.ExpressionSpecification {
  const mid = visibleSunLineWidth(angle, selectedLine);
  return ['interpolate', ['linear'], ['zoom'], 0.8, mid * 0.72, 1.6, mid, 3.8, mid * 1.2];
}

function addSunAngleLayers(map: maplibregl.Map) {
  if (!map.getSource(PATHFINDER_SUN_ANGLE_SOURCE_ID)) {
    map.addSource(PATHFINDER_SUN_ANGLE_SOURCE_ID, {
      type: 'geojson',
      data: pathfinderSunAngleGeoJSON(),
    });
  }

  for (const item of PATHFINDER_SUN_ANGLE_LEGEND) {
    const visibleId = sunAngleVisibleLayerId(item.angle);
    const haloId = sunAngleHaloLayerId(item.angle);
    if (!map.getLayer(haloId)) {
      map.addLayer({
        id: haloId,
        type: 'line',
        source: PATHFINDER_SUN_ANGLE_SOURCE_ID,
        filter: ['==', ['get', 'angle'], item.angle],
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#071018',
          'line-width': lineWidthExpression(item.angle, null),
          'line-opacity': 0.42,
        },
      });
    }
    if (!map.getLayer(visibleId)) {
      map.addLayer({
        id: visibleId,
        type: 'line',
        source: PATHFINDER_SUN_ANGLE_SOURCE_ID,
        filter: ['==', ['get', 'angle'], item.angle],
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': PATHFINDER_SUN_ANGLE_COLORS[item.angle],
          'line-width': lineWidthExpression(item.angle, null),
          'line-opacity': visibleSunLineOpacity(item.angle, null),
          ...(PATHFINDER_SUN_ANGLE_DASH[item.angle]
            ? { 'line-dasharray': PATHFINDER_SUN_ANGLE_DASH[item.angle] as number[] }
            : {}),
        },
      });
    }

    const hitId = sunAngleHitLayerId(item.angle);
    if (!map.getLayer(hitId)) {
      map.addLayer({
        id: hitId,
        type: 'line',
        source: PATHFINDER_SUN_ANGLE_SOURCE_ID,
        filter: ['==', ['get', 'angle'], item.angle],
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': PATHFINDER_SUN_ANGLE_COLORS[item.angle],
          'line-width': PATHFINDER_SUN_ANGLE_HIT_WIDTH,
          'line-opacity': 0,
        },
      });
    }

    const labelId = sunAngleLabelLayerId(item.angle);
    if (!map.getLayer(labelId)) {
      map.addLayer({
        id: labelId,
        type: 'symbol',
        source: PATHFINDER_SUN_ANGLE_SOURCE_ID,
        filter: ['==', ['get', 'angle'], item.angle],
        layout: {
          'symbol-placement': 'line',
          'symbol-spacing': 420,
          'symbol-avoid-edges': true,
          'text-field': sunAngleDisplayLabel(item.angle),
          'text-size': ['interpolate', ['linear'], ['zoom'], 1, 10, 2.4, 11.5, 4, 13],
          'text-font': ['Noto Sans Regular'],
          'text-allow-overlap': false,
          'text-ignore-placement': false,
          'text-optional': true,
          'text-keep-upright': true,
          'text-max-angle': 22,
          'text-padding': 8,
          'text-letter-spacing': 0.04,
        },
        paint: {
          'text-color': PATHFINDER_SUN_ANGLE_COLORS[item.angle],
          'text-halo-color': '#071018',
          'text-halo-width': 2.1,
          'text-halo-blur': 0.15,
          'text-opacity': 0.94,
        },
      });
    }
  }
}

function syncFocusedLineLabel(map: maplibregl.Map, angle: PathfinderSunAngle | null) {
  const sourceId = PATHFINDER_SUN_ANGLE_LABEL_SOURCE_ID;
  const layerId = `${sourceId}-point`;
  const collection = pathfinderSunAngleLabelGeoJSON();
  const features = angle
    ? collection.features.filter((feature) => feature.properties?.angle === angle)
    : [];
  const data: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features };
  const existing = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
  if (!existing) {
    map.addSource(sourceId, { type: 'geojson', data });
    map.addLayer({
      id: layerId,
      type: 'symbol',
      source: sourceId,
      layout: {
        'text-field': ['get', 'label'],
        'text-size': 13,
        'text-font': ['Noto Sans Regular'],
        'text-allow-overlap': true,
        'text-ignore-placement': true,
        'text-optional': false,
        'text-keep-upright': true,
        'text-anchor': 'center',
        'text-offset': [0, -1.05],
        'text-padding': 4,
      },
      paint: {
        'text-color': '#f4f1e8',
        'text-halo-color': '#071018',
        'text-halo-width': 2.4,
        'text-opacity': 1,
      },
    });
    return;
  }
  existing.setData(data);
}

function applySunAnglePresentation(
  map: maplibregl.Map,
  filter: PathfinderSunAngleFilter,
  selectedLine: PathfinderSunAngle | null
) {
  for (const item of PATHFINDER_SUN_ANGLE_LEGEND) {
    const visible = isSunAngleVisible(item.angle, filter);
    const visibility = visible ? 'visible' : 'none';
    const visibleId = sunAngleVisibleLayerId(item.angle);
    const haloId = sunAngleHaloLayerId(item.angle);
    const hitId = sunAngleHitLayerId(item.angle);
    const labelId = sunAngleLabelLayerId(item.angle);
    const width = lineWidthExpression(item.angle, selectedLine);
    if (map.getLayer(haloId)) {
      map.setLayoutProperty(haloId, 'visibility', visibility);
      map.setPaintProperty(haloId, 'line-width', width);
      map.setPaintProperty(haloId, 'line-opacity', selectedLine == null || selectedLine === item.angle ? 0.5 : 0.22);
    }
    if (map.getLayer(visibleId)) {
      map.setLayoutProperty(visibleId, 'visibility', visibility);
      map.setPaintProperty(visibleId, 'line-width', width);
      map.setPaintProperty(visibleId, 'line-opacity', visibleSunLineOpacity(item.angle, selectedLine));
      applyLineDash(map, visibleId, item.angle);
    }
    if (map.getLayer(hitId)) {
      map.setLayoutProperty(hitId, 'visibility', visibility);
      map.setPaintProperty(hitId, 'line-width', PATHFINDER_SUN_ANGLE_HIT_WIDTH);
      map.setPaintProperty(hitId, 'line-opacity', 0);
    }
    if (map.getLayer(labelId)) {
      const focused = selectedLine === item.angle;
      map.setLayoutProperty(labelId, 'visibility', visibility);
      map.setLayoutProperty(labelId, 'symbol-sort-key', focused ? 10 : 2);
      map.setLayoutProperty(labelId, 'text-allow-overlap', focused);
      map.setLayoutProperty(labelId, 'text-optional', !focused);
      map.setPaintProperty(labelId, 'text-opacity', focused ? 1 : visible ? 0.88 : 0);
    }
  }
}

function currentStageLayout(container?: HTMLElement | null) {
  const desktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const compact = typeof window !== 'undefined' && window.innerWidth < 768;
  const host = container ?? undefined;
  const resultsOpen = host?.dataset.resultsOpen === '1';
  return globeStageLayout({
    stageWidth: host?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1348),
    stageHeight: host?.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 787),
    desktop,
    compact,
    sidePanelReserve: desktop && !resultsOpen ? GLOBE_DESKTOP_PANEL_PX : 0,
  });
}

function applyStagePadding(map: maplibregl.Map, container?: HTMLElement | null) {
  map.setPadding(currentStageLayout(container).padding);
}

function applyMetioroBasemap(map: maplibregl.Map, lang: AppLang): boolean {
  const style = map.getStyle();
  if (!style?.layers) return false;

  try {
    for (const layer of style.layers) {
      const id = layer.id;
      if (layer.type === 'background') {
        map.setPaintProperty(id, 'background-color', '#071018');
        continue;
      }
      if (layer.type === 'raster') {
        map.setPaintProperty(id, 'raster-opacity', 0.04);
        continue;
      }
      if (layer.type === 'fill') {
        if ((PATHFINDER_HIDDEN_GEOMETRY_LAYER_IDS as readonly string[]).includes(id)) {
          map.setLayoutProperty(id, 'visibility', 'none');
        } else if (/water/.test(id)) {
          map.setPaintProperty(id, 'fill-color', '#0a121c');
        } else if (/land|sand|ice|residential|cemetery|hospital|school|pitch|track|aeroway|building/.test(id)) {
          map.setPaintProperty(id, 'fill-color', '#171f2a');
        }
        if ((PATHFINDER_FILL_OUTLINE_CLEARED_LAYER_IDS as readonly string[]).includes(id)) {
          try {
            map.setPaintProperty(id, 'fill-outline-color', 'rgba(0,0,0,0)');
          } catch {
            /* outline may be unsupported */
          }
        }
        continue;
      }
      if (layer.type === 'fill-extrusion') {
        map.setPaintProperty(id, 'fill-extrusion-opacity', 0);
        continue;
      }
      if (layer.type === 'circle') {
        if (/city|town|place|capital|poi|airport|dot/.test(id)) {
          map.setLayoutProperty(id, 'visibility', 'none');
        }
        continue;
      }
      if (layer.type === 'line') {
        if ((PATHFINDER_HIDDEN_GEOMETRY_LAYER_IDS as readonly string[]).includes(id) || /park/.test(id)) {
          map.setLayoutProperty(id, 'visibility', 'none');
        } else if ((PATHFINDER_RESTYLED_BOUNDARY_LAYER_IDS as readonly string[]).includes(id) || /boundar|admin|disputed/.test(id)) {
          const adminOne = /state|province|region|admin.?1|county|boundary_3/.test(id);
          map.setPaintProperty(id, 'line-color', '#6d737c');
          map.setPaintProperty(id, 'line-opacity', adminOne ? 0.16 : 0.3);
          map.setPaintProperty(id, 'line-width', adminOne ? 0.35 : 0.6);
          try {
            map.setPaintProperty(id, 'line-dasharray', undefined);
          } catch {
            /* solid country borders */
          }
          if (adminOne) {
            map.setLayerZoomRange(id, 5.6, 24);
          }
        } else if (/water/.test(id)) {
          map.setPaintProperty(id, 'line-color', '#101820');
        } else if (/road|tunnel|bridge|rail/.test(id)) {
          map.setPaintProperty(id, 'line-color', '#2a333d');
          map.setPaintProperty(id, 'line-opacity', 0.28);
        }
        if (GLOBE_ONLY_ROAD_PREFIXES.some((prefix) => id.startsWith(prefix))) {
          map.setLayerZoomRange(id, 4.2, 24);
        }
        continue;
      }
      if (layer.type === 'symbol') {
        if (HIDDEN_LABEL_LAYERS.includes(id)) {
          map.setLayoutProperty(id, 'visibility', 'none');
          continue;
        }
        if (id === 'label_city') {
          map.setLayerZoomRange(id, 4.0, 24);
        } else if (id === 'label_city_capital') {
          map.setLayerZoomRange(id, 1.2, 24);
        } else if (/label_country/.test(id)) {
          map.setLayerZoomRange(id, 0.8, 8.5);
        }
        map.setLayoutProperty(id, 'text-allow-overlap', false);
        map.setLayoutProperty(id, 'text-ignore-placement', false);
        map.setLayoutProperty(id, 'text-optional', true);
        map.setLayoutProperty(id, 'text-padding', /label_country/.test(id) ? 6 : 10);
        if (/label_|water_name/.test(id)) {
          const country = /label_country/.test(id);
          const water = /water/.test(id);
          map.setPaintProperty(id, 'text-color', water ? '#8b9aab' : country ? '#e8eef5' : '#c5ced8');
          map.setPaintProperty(id, 'text-halo-color', '#071018');
          map.setPaintProperty(id, 'text-halo-width', country ? 2 : 1.6);
          map.setPaintProperty(id, 'text-halo-blur', 0.2);
          map.setPaintProperty(id, 'text-opacity', country || water ? 0.92 : 0.72);
          if (country) {
            map.setLayoutProperty(id, 'text-size', ['interpolate', ['linear'], ['zoom'], 1, 12, 3, 15, 6, 17]);
          }
        }
      }
    }
    applyBasemapLanguage(map, lang);
    return true;
  } catch {
    return false;
  }
}

function currentDocumentLocale(): string {
  return typeof document !== 'undefined' ? document.documentElement.lang || 'en' : 'en';
}

function logCameraWrite(
  map: maplibregl.Map,
  input: {
    caller: string;
    method: GlobeCameraWriteMethod;
    mapEvent: string;
    applied: boolean;
    mutate?: () => void;
  }
) {
  const before = {
    center: snapshotCameraLngLat(map.getCenter()),
    zoom: map.getZoom(),
  };
  input.mutate?.();
  const after = {
    center: snapshotCameraLngLat(map.getCenter()),
    zoom: map.getZoom(),
  };
  const entry = {
    timestamp: Date.now(),
    caller: input.caller,
    method: input.method,
    centerBefore: before.center,
    zoomBefore: before.zoom,
    centerAfter: after.center,
    zoomAfter: after.zoom,
    locale: currentDocumentLocale(),
    mapEvent: input.mapEvent,
    applied: input.applied,
  };
  if (typeof window !== 'undefined') {
    const bag = window as Window & { __pathfinderCameraWrites?: typeof entry[] };
    bag.__pathfinderCameraWrites = recordGlobeCameraWrite(bag.__pathfinderCameraWrites ?? [], entry);
  }
  console.info('[pathfinder-camera]', entry);
}

function moveCamera(
  map: maplibregl.Map,
  camera: CameraTarget,
  animated: boolean,
  caller = 'moveCamera'
) {
  if (animated) {
    logCameraWrite(map, {
      caller,
      method: 'flyTo',
      mapEvent: 'programmatic',
      applied: true,
      mutate: () => {
        map.flyTo({ ...camera, essential: true, duration: camera.pitch == null ? 900 : 700 });
      },
    });
    return;
  }
  logCameraWrite(map, {
    caller,
    method: 'jumpTo',
    mapEvent: 'programmatic',
    applied: true,
    mutate: () => {
      map.jumpTo(camera);
    },
  });
}

function measureProjectedGlobeDisc(map: maplibregl.Map): ProjectedGlobeDisc | null {
  const center = map.getCenter();
  const origin = map.project([center.lng, center.lat]);
  const samples: Array<{ x: number; y: number }> = [];
  const radii: number[] = [];
  for (let i = 0; i < 36; i += 1) {
    const limb = destinationPoint(center.lng, center.lat, 89, (i / 36) * Math.PI * 2);
    const projected = map.project([limb.longitude, limb.latitude]);
    samples.push(projected);
    radii.push(Math.hypot(projected.x - origin.x, projected.y - origin.y));
  }
  const ordered = [...radii].sort((a, b) => a - b);
  const median = ordered[Math.floor(ordered.length / 2)] ?? 0;
  const kept = samples.filter((_, index) => radii[index] >= median * 0.72);
  return discFromProjectedLimb(kept.length >= 8 ? kept : samples);
}

function cameraSnapshot(map: maplibregl.Map, container: HTMLElement): GlobeCameraSnapshot {
  return {
    zoom: map.getZoom(),
    width: Math.round(container.clientWidth),
    height: Math.round(container.clientHeight),
  };
}

function ensureGlobeDiscProbe(container: HTMLElement): HTMLElement {
  let overlay = container.querySelector('[data-testid="pathfinder-globe-disc"]') as HTMLElement | null;
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.dataset.testid = 'pathfinder-globe-disc';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.cssText = PATHFINDER_GLOBE_DISC_OVERLAY_STYLE;
    container.appendChild(overlay);
  } else {
    overlay.style.cssText = PATHFINDER_GLOBE_DISC_OVERLAY_STYLE;
  }
  return overlay;
}

function applyGlobeCanvasClip(container: HTMLElement, disc: ProjectedGlobeDisc | null, zoom: number) {
  const canvas = container.querySelector('canvas');
  if (!canvas) return;
  canvas.style.transition = 'none';
  canvas.style.webkitTransition = 'none';
  const mask = globeCanvasMaskStyle(disc, zoom);
  canvas.style.clipPath = mask.clipPath;
  canvas.style.webkitMaskImage = mask.maskImage;
  canvas.style.maskImage = mask.maskImage;
  canvas.style.webkitMaskSize = '';
  canvas.style.maskSize = '';
  canvas.style.webkitMaskPosition = '';
  canvas.style.maskPosition = '';
}

function writeGlobeDiscMetadata(container: HTMLElement, disc: ProjectedGlobeDisc | null, map: maplibregl.Map) {
  const overlay = ensureGlobeDiscProbe(container);
  const center = map.getCenter();
  container.dataset.cameraCenter = `${center.lng.toFixed(3)},${center.lat.toFixed(3)}`;
  container.dataset.cameraZoom = map.getZoom().toFixed(2);
  if (!disc) {
    delete container.dataset.globeDisc;
    delete container.dataset.globeDiameter;
    delete overlay.dataset.diameter;
    return;
  }
  container.dataset.globeDisc = `${disc.left.toFixed(1)},${disc.top.toFixed(1)},${disc.width.toFixed(1)},${disc.height.toFixed(1)}`;
  container.dataset.globeDiameter = disc.diameter.toFixed(1);
  overlay.dataset.diameter = disc.diameter.toFixed(1);
}

function fitOverviewGlobeDisc(map: maplibregl.Map, desktop: boolean, container?: HTMLElement | null) {
  const overview = pathfinderOverviewCamera(desktop);
  const layout = currentStageLayout(container ?? map.getContainer?.() ?? null);
  const { target } = layout.disc;
  const zoomCap = desktop ? 2.52 : 2.2;
  let zoom = overview.zoom;
  for (let i = 0; i < 10; i += 1) {
    logCameraWrite(map, {
      caller: 'fitOverviewGlobeDisc',
      method: 'jumpTo',
      mapEvent: 'automatic-fit',
      applied: true,
      mutate: () => {
        map.jumpTo({ center: overview.center, zoom, pitch: 0, bearing: 0 });
        if (typeof map.setZoom === 'function') map.setZoom(zoom);
      },
    });
    const disc = measureProjectedGlobeDisc(map);
    if (!disc) break;
    if (overviewFitReached(disc, layout)) break;
    const next = nextGlobeOverviewZoom(zoom, disc.diameter, target, zoomCap);
    if (Math.abs(next - zoom) < 0.001) break;
    zoom = next;
  }
}

function applyMarkerHemisphere(
  container: HTMLElement,
  map: maplibregl.Map,
  marker: maplibregl.Marker | null,
  point: PathfinderSelectedPoint | null,
  globeMode: boolean
) {
  if (!marker || !point) {
    delete container.dataset.markerHemisphere;
    return;
  }
  const center = map.getCenter();
  const front =
    !globeMode ||
    isOnFrontHemisphere(
      { longitude: center.lng, latitude: center.lat },
      { longitude: point.longitude, latitude: point.latitude }
    );
  const el = marker.getElement();
  el.style.visibility = front ? 'visible' : 'hidden';
  el.dataset.hemisphere = front ? 'front' : 'rear';
  container.dataset.markerHemisphere = front ? 'front' : 'rear';
}

function isMapReady(map: maplibregl.Map): boolean {
  try {
    if (typeof map.isStyleLoaded === 'function' && map.isStyleLoaded()) return true;
  } catch {
    /* style may still be swapping */
  }
  return map.loaded();
}

function runWhenMapReady(map: maplibregl.Map, fn: () => void) {
  if (isMapReady(map)) {
    fn();
    return;
  }
  const run = () => {
    if (isMapReady(map)) fn();
  };
  if (typeof map.once === 'function') {
    map.once('load', run);
    map.once('idle', run);
    return;
  }
  if (typeof map.on === 'function') {
    map.on('load', run);
  }
}

export function PathfinderGlobeMap({
  mode,
  selected,
  resetToken = 0,
  focusToken = 0,
  focusAngle = null,
  angleFilter = 'all',
  selectedLine = null,
  labelLanguage = 'en',
  resultsOpen = false,
  rtlFallbackWarning = PATHFINDER_RTL_FALLBACK_WARNING,
  onPick,
  onSelectLine,
  onReady,
  onContextLost,
  onInitFailure,
}: PathfinderGlobeMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const selectedRef = useRef(selected);
  const onPickRef = useRef(onPick);
  const onSelectLineRef = useRef(onSelectLine);
  const angleFilterRef = useRef(angleFilter);
  const selectedLineRef = useRef(selectedLine);
  const animatedRef = useRef(mode === 'globe');
  const cameraIntentRef = useRef<CameraTarget | null>(null);
  const overviewZoomRef = useRef<number | null>(null);
  const cancelAutomaticCameraRef = useRef<() => void>(() => undefined);
  const applyResultsLayoutRef = useRef<(open: boolean) => void>(() => undefined);
  const labelLanguageRef = useRef(labelLanguage);
  const resultsOpenRef = useRef(resultsOpen);
  const [rtlFallback, setRtlFallback] = useState(false);
  const animated = mode === 'globe';
  animatedRef.current = animated;
  labelLanguageRef.current = labelLanguage;
  resultsOpenRef.current = resultsOpen;

  const applyCameraIntent = (map: maplibregl.Map, camera: CameraTarget, caller = 'applyCameraIntent') => {
    cameraIntentRef.current = camera;
    cancelAutomaticCameraRef.current();
    runWhenMapReady(map, () => {
      if (cameraIntentRef.current !== camera) return;
      applyStagePadding(map, containerRef.current);
      moveCamera(map, camera, animatedRef.current, caller);
    });
  };

  useEffect(() => {
    selectedRef.current = selected;
    onPickRef.current = onPick;
    onSelectLineRef.current = onSelectLine;
    angleFilterRef.current = angleFilter;
    selectedLineRef.current = selectedLine;
  }, [selected, onPick, onSelectLine, angleFilter, selectedLine]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let cancelled = false;
    let map: maplibregl.Map;
    const visualScheduler = createLatestFrameScheduler();
    let lastCameraSnapshot: GlobeCameraSnapshot | null = null;
    const overview = pathfinderOverviewCamera(typeof window !== 'undefined' && window.innerWidth >= 1024);
    try {
      ensureRtlTextPlugin();
      map = new maplibregl.Map({
        container,
        style: STYLE_URL,
        center: overview.center,
        zoom: overview.zoom,
        attributionControl: false,
        canvasContextAttributes: { antialias: true },
        pixelRatio: capPixelRatio(typeof window !== 'undefined' ? window.devicePixelRatio : 1),
        cooperativeGestures: false,
      });
    } catch (error) {
      onInitFailure(error instanceof Error ? error : new Error('MapLibre failed to start'));
      return undefined;
    }

    mapRef.current = map;
    map.addControl(
      new maplibregl.AttributionControl({
        compact: false,
        customAttribution: MAPLIBRE_ATTRIBUTION,
      }),
      'bottom-left'
    );
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true, showCompass: true }), 'top-left');

    const applyProjection = () => {
      if (mode === 'globe' && typeof map.setProjection === 'function') {
        map.setProjection({ type: 'globe' });
      }
    };

    const syncMarker = (point: PathfinderSelectedPoint | null) => {
      if (!point) {
        markerRef.current?.remove();
        markerRef.current = null;
        return;
      }
      if (!markerRef.current) {
        markerRef.current = new maplibregl.Marker({
          color: MARKER_COLOR,
          draggable: false,
          className: 'pathfinder-calc-point',
        })
          .setLngLat([point.longitude, point.latitude])
          .addTo(map);
        applyMarkerHemisphere(container, map, markerRef.current, point, mode === 'globe');
        return;
      }
      markerRef.current.setLngLat([point.longitude, point.latitude]);
      applyMarkerHemisphere(container, map, markerRef.current, point, mode === 'globe');
    };

    const queryHit = (point: maplibregl.PointLike) => {
      const layers = hitLayerIds().filter((id) => Boolean(map.getLayer(id)));
      if (layers.length === 0) return [];
      return map.queryRenderedFeatures(point, { layers });
    };

    const onClick = (event: maplibregl.MapMouseEvent) => {
      const hits = queryHit(event.point);
      const angle = hits[0]?.properties?.angle;
      if (angle === 'MC' || angle === 'IC' || angle === 'ASC' || angle === 'DSC') {
        onSelectLineRef.current?.(angle);
        return;
      }
      onPickRef.current(event.lngLat.lat, event.lngLat.lng);
    };

    const onMouseMove = (event: maplibregl.MapMouseEvent) => {
      const hovering = queryHit(event.point).length > 0;
      map.getCanvas().style.cursor = hovering ? 'pointer' : '';
    };

    const onLost = (event: Event) => {
      event.preventDefault();
      onContextLost();
    };

    const applyLiveGlobeVisual = (event: 'move' | 'render' | 'resize') => {
      if (cancelled || !containerRef.current) return;
      const work = globeVisualWork(event);
      if (work.applyMarker) {
        applyMarkerHemisphere(container, map, markerRef.current, selectedRef.current, mode === 'globe');
      }
      if (!work.applyMask) return;
      const snapshot = cameraSnapshot(map, container);
      const moving = typeof map.isMoving === 'function' && map.isMoving();
      const mustMeasure = shouldMeasureGlobeDiscForMask({
        moving,
        event,
        previous: lastCameraSnapshot,
        next: snapshot,
      });
      if (!mustMeasure) {
        lastCameraSnapshot = snapshot;
        return;
      }
      const disc = measureProjectedGlobeDisc(map);
      const nextMask = globeCanvasMaskStyle(disc, snapshot.zoom);
      const canvas = container.querySelector('canvas');
      if (!canvas || canvas.style.clipPath !== nextMask.clipPath) {
        applyGlobeCanvasClip(container, disc, snapshot.zoom);
      }
      lastCameraSnapshot = snapshot;
    };

    const scheduleLiveGlobeVisual = (event: 'move' | 'render' | 'resize') => {
      if (cancelled) return;
      if (event === 'move') {
        applyMarkerHemisphere(container, map, markerRef.current, selectedRef.current, mode === 'globe');
        const snapshot = cameraSnapshot(map, container);
        if (!shouldRecomputeGlobeDisc(lastCameraSnapshot, snapshot)) return;
      }
      scheduleLatestFrame(
        visualScheduler,
        () => {
          if (cancelled || !containerRef.current) return;
          applyLiveGlobeVisual(event);
        },
        window
      );
    };

    const writeNonvisualCameraMetadata = () => {
      if (cancelled || !containerRef.current) return;
      writeGlobeDiscMetadata(container, measureProjectedGlobeDisc(map), map);
    };

    let applyingResize = false;
    let userHasMovedCamera = false;
    let lastContainerWidth = container.clientWidth;
    let lastContainerHeight = container.clientHeight;
    let lastViewportWidth = typeof window !== 'undefined' ? window.innerWidth : lastContainerWidth;
    let lastViewportHeight = typeof window !== 'undefined' ? window.innerHeight : lastContainerHeight;
    let ignoreAutomaticGesture = false;
    let idleSettleOverview: (() => void) | null = null;
    const noteUserCamera = () => {
      if (ignoreAutomaticGesture) return;
      userHasMovedCamera = true;
      if (idleSettleOverview) {
        map.off('idle', idleSettleOverview);
        idleSettleOverview = null;
      }
    };
    cancelAutomaticCameraRef.current = () => {
      ignoreAutomaticGesture = false;
      userHasMovedCamera = true;
      if (idleSettleOverview) {
        map.off('idle', idleSettleOverview);
        idleSettleOverview = null;
      }
    };
    applyResultsLayoutRef.current = (open) => {
      if (cancelled || !map.loaded()) return;
      container.dataset.resultsOpen = open ? '1' : '0';
      if (typeof map.resize === 'function') map.resize();
      applyStagePadding(map, container);
      const applyFit = shouldApplyAutomaticCameraWrite({
        source: 'results-layout',
        userHasMovedCamera,
      });
      logCameraWrite(map, {
        caller: 'applyResultsLayout',
        method: 'resize',
        mapEvent: 'results-layout',
        applied: applyFit,
      });
      if (applyFit) {
        withAutomaticCamera(() => {
          fitOverviewGlobeDisc(map, typeof window !== 'undefined' && window.innerWidth >= 1024, container);
          overviewZoomRef.current = map.getZoom();
        });
      }
      lastCameraSnapshot = null;
      scheduleLiveGlobeVisual('resize');
    };
    const withAutomaticCamera = (fn: () => void) => {
      ignoreAutomaticGesture = true;
      try {
        fn();
      } finally {
        ignoreAutomaticGesture = false;
      }
    };
    const onResize = () => {
      if (cancelled || !map.loaded() || applyingResize) return;
      applyingResize = true;
      try {
        const width = container.clientWidth;
        const height = container.clientHeight;
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : width;
        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : height;
        const containerSizeChanged = width !== lastContainerWidth || height !== lastContainerHeight;
        const viewportSizeChanged =
          viewportWidth !== lastViewportWidth || viewportHeight !== lastViewportHeight;
        lastContainerWidth = width;
        lastContainerHeight = height;
        lastViewportWidth = viewportWidth;
        lastViewportHeight = viewportHeight;
        if (typeof map.resize === 'function') map.resize();
        applyStagePadding(map, container);
        const applyResizeFit = shouldApplyAutomaticCameraWrite({
          source: 'resize',
          userHasMovedCamera,
          containerSizeChanged,
          viewportSizeChanged,
        });
        logCameraWrite(map, {
          caller: 'onResize',
          method: 'resize',
          mapEvent: 'resize',
          applied: applyResizeFit,
        });
        if (applyResizeFit) {
          withAutomaticCamera(() => {
            fitOverviewGlobeDisc(map, typeof window !== 'undefined' && window.innerWidth >= 1024, container);
            overviewZoomRef.current = map.getZoom();
          });
        }
        lastCameraSnapshot = null;
        scheduleLiveGlobeVisual('resize');
      } finally {
        applyingResize = false;
      }
    };

    map.on('load', () => {
      if (cancelled) return;
      applyProjection();
      applyStagePadding(map, container);
      const requestedLang = labelLanguageRef.current;
      const pendingRtl = requestedLang === 'fa' || requestedLang === 'ar';
      const conservativeLang = pendingRtl ? 'en' : requestedLang;
      const basemapApplied = applyMetioroBasemap(map, conservativeLang);
      container.dataset.basemap = basemapApplied ? 'metioro-dark' : 'liberty-unmodified';
      container.dataset.basemapLabelLanguage = conservativeLang;
      void ensureRtlTextPlugin().then((pluginReady) => {
        if (cancelled || mapRef.current !== map) return;
        const paintLang = basemapLanguageAfterRtlPlugin(requestedLang, pluginReady);
        applyBasemapLanguage(map, paintLang);
        container.dataset.basemapLabelLanguage = paintLang;
        container.dataset.rtlPlugin = pluginReady ? 'ready' : 'failed';
        setRtlFallback(pendingRtl && !pluginReady);
      });
      container.dataset.resultsOpen = resultsOpenRef.current ? '1' : '0';
      addSunAngleLayers(map);
      applySunAnglePresentation(map, angleFilterRef.current, selectedLineRef.current);
      syncFocusedLineLabel(map, selectedLineRef.current);
      syncMarker(selectedRef.current);
      const pendingCamera = cameraIntentRef.current;
      if (pendingCamera) {
        applyStagePadding(map, container);
        moveCamera(map, pendingCamera, animatedRef.current);
      } else {
        const settleOverview = () => {
          if (
            cancelled ||
            cameraIntentRef.current ||
            !shouldApplyAutomaticCameraWrite({ source: 'idle-settle', userHasMovedCamera })
          ) {
            return;
          }
          withAutomaticCamera(() => {
            applyProjection();
            applyStagePadding(map, container);
            fitOverviewGlobeDisc(map, typeof window !== 'undefined' && window.innerWidth >= 1024, container);
            overviewZoomRef.current = map.getZoom();
          });
          lastCameraSnapshot = null;
          applyLiveGlobeVisual('resize');
          writeNonvisualCameraMetadata();
        };
        if (shouldApplyAutomaticCameraWrite({ source: 'load', userHasMovedCamera })) {
          withAutomaticCamera(() => {
            applyProjection();
            applyStagePadding(map, container);
            fitOverviewGlobeDisc(map, typeof window !== 'undefined' && window.innerWidth >= 1024, container);
            overviewZoomRef.current = map.getZoom();
          });
        }
        idleSettleOverview = settleOverview;
        map.once('idle', settleOverview);
      }
      lastCameraSnapshot = null;
      applyLiveGlobeVisual('resize');
      writeNonvisualCameraMetadata();
      applyMarkerHemisphere(container, map, markerRef.current, selectedRef.current, mode === 'globe');
      const canvas = map.getCanvas();
      canvas.style.transition = 'none';
      canvas.addEventListener('webglcontextlost', onLost, false);
      window.addEventListener('resize', onResize);
      onReady();
    });
    map.on('zoomstart', noteUserCamera);
    map.on('dragstart', noteUserCamera);
    map.on('rotatestart', noteUserCamera);
    map.on('pitchstart', noteUserCamera);
    map.on('move', () => {
      applyLiveGlobeVisual('move');
    });
    map.on('resize', () => {
      lastCameraSnapshot = null;
      onResize();
    });
    map.on('moveend', () => {
      if (cancelled || !containerRef.current) return;
      if (globeVisualWork('moveend').writeMetadata) {
        writeNonvisualCameraMetadata();
      }
    });
    map.on('error', (event) => {
      if (cancelled) return;
      const error = event.error instanceof Error ? event.error : new Error('MapLibre error');
      if (!map.loaded()) onInitFailure(error);
    });
    map.on('click', onClick);
    map.on('mousemove', onMouseMove);

    return () => {
      cancelled = true;
      cancelLatestFrame(visualScheduler, window);
      window.removeEventListener('resize', onResize);
      try {
        map.getCanvas().removeEventListener('webglcontextlost', onLost, false);
      } catch {
        /* map may already be gone */
      }
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [mode, onContextLost, onInitFailure, onReady]);

  const selectedLat = selected?.latitude;
  const selectedLon = selected?.longitude;

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) return;

    if (selectedLat == null || selectedLon == null) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({
        color: MARKER_COLOR,
        draggable: false,
        className: 'pathfinder-calc-point',
      })
        .setLngLat([selectedLon, selectedLat])
        .addTo(map);
    } else {
      markerRef.current.setLngLat([selectedLon, selectedLat]);
    }
    const container = containerRef.current;
    if (container) {
      applyMarkerHemisphere(container, map, markerRef.current, selected, mode === 'globe');
    }
  }, [selectedLat, selectedLon, selected, mode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || resetToken <= 0) return;
    const desktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
    const overview = pathfinderOverviewCamera(desktop);
    fitOverviewGlobeDisc(map, desktop, containerRef.current);
    overviewZoomRef.current = map.getZoom();
    applyCameraIntent(map, {
      center: overview.center,
      zoom: overviewZoomRef.current ?? overview.zoom,
      pitch: 0,
      bearing: 0,
    }, 'reset-handler');
  }, [resetToken]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    runWhenMapReady(map, () => {
      applySunAnglePresentation(map, angleFilter, selectedLine);
      syncFocusedLineLabel(map, selectedLine);
    });
  }, [angleFilter, selectedLine]);

  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!container) return;
    void ensureRtlTextPlugin().then((pluginReady) => {
      const paintLang = basemapLanguageAfterRtlPlugin(labelLanguage, pluginReady);
      container.dataset.basemapLabelLanguage = paintLang;
      container.dataset.rtlPlugin = pluginReady ? 'ready' : 'failed';
      setRtlFallback((labelLanguage === 'fa' || labelLanguage === 'ar') && !pluginReady);
      if (!map || mapRef.current !== map) return;
      runWhenMapReady(map, () => applyBasemapLanguage(map, paintLang));
    });
  }, [labelLanguage]);

  useEffect(() => {
    applyResultsLayoutRef.current(resultsOpen);
  }, [resultsOpen]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || focusToken <= 0 || !focusAngle) return;
    applyCameraIntent(map, {
      ...pathfinderLineFocusCamera(focusAngle, typeof window !== 'undefined' && window.innerWidth >= 1024),
      pitch: 0,
    }, 'focus-handler');
  }, [focusToken, focusAngle]);

  const selectedSource = selected?.source;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || selectedSource !== 'city_search' || selectedLat == null || selectedLon == null) return;
    applyCameraIntent(
      map,
      pathfinderCityCamera(
        selectedLon,
        selectedLat,
        typeof window !== 'undefined' && window.innerWidth >= 1024
      ),
      'city-search'
    );
  }, [selectedSource, selectedLat, selectedLon]);

  return (
    <div className="absolute inset-0">
      {rtlFallback ? (
        <p
          data-testid="pathfinder-rtl-fallback-warning"
          className="pathfinder-rtl-fallback-warning fi pointer-events-none absolute bottom-14 left-2 z-20 max-w-[18rem] rounded-md bg-black/70 px-2 py-1 text-[10px] leading-snug text-amber-100/90"
        >
          {rtlFallbackWarning}
        </p>
      ) : null}
      <div
        ref={containerRef}
        data-testid="pathfinder-globe-map"
        data-globe-mode={mode}
        data-label-language={labelLanguage}
        data-results-open={resultsOpen ? '1' : '0'}
        className="h-full w-full"
      />
    </div>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { PathfinderSelectedPoint } from '@/lib/pathfinder-selection';
import {
  PATHFINDER_SUN_ANGLE_COLORS,
  PATHFINDER_SUN_ANGLE_DASH,
  PATHFINDER_SUN_ANGLE_HIT_WIDTH,
  PATHFINDER_SUN_ANGLE_LABEL_SOURCE_ID,
  PATHFINDER_SUN_ANGLE_LEGEND,
  PATHFINDER_SUN_ANGLE_SOURCE_ID,
  type PathfinderSunAngle,
  type PathfinderSunAngleFilter,
  isSunAngleVisible,
  pathfinderPresentationCamera,
  pathfinderSunAngleGeoJSON,
  pathfinderSunAngleLabelGeoJSON,
  sunAngleHaloLayerId,
  sunAngleHitLayerId,
  sunAngleLabelLayerId,
  sunAngleVisibleLayerId,
  visibleSunLineOpacity,
  visibleSunLineWidth,
} from '@/lib/pathfinder-geometry-demo';

export type PathfinderGlobeMapProps = {
  mode: 'globe' | 'mercator';
  selected: PathfinderSelectedPoint | null;
  resetToken?: number;
  angleFilter?: PathfinderSunAngleFilter;
  selectedLine?: PathfinderSunAngle | null;
  onPick: (latitude: number, longitude: number) => void;
  onSelectLine?: (angle: PathfinderSunAngle) => void;
  onReady: () => void;
  onContextLost: () => void;
  onInitFailure: (error: Error) => void;
};

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const DEFAULT_CENTER = { longitude: 10, latitude: 18, zoom: 1.5 } as const;
const DESKTOP_OVERVIEW_ZOOM = 2.05;
const PIXEL_RATIO_CAP = 2;
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
  'waterway_line_label',
  'airport',
];

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

function addSunAngleLayers(map: maplibregl.Map) {
  if (!map.getSource(PATHFINDER_SUN_ANGLE_SOURCE_ID)) {
    map.addSource(PATHFINDER_SUN_ANGLE_SOURCE_ID, {
      type: 'geojson',
      data: pathfinderSunAngleGeoJSON(),
    });
  }

  if (!map.getSource(PATHFINDER_SUN_ANGLE_LABEL_SOURCE_ID)) {
    map.addSource(PATHFINDER_SUN_ANGLE_LABEL_SOURCE_ID, {
      type: 'geojson',
      data: pathfinderSunAngleLabelGeoJSON(),
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
          'line-width': visibleSunLineWidth(item.angle, null) + 2.4,
          'line-opacity': 0.55,
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
          'line-width': visibleSunLineWidth(item.angle, null),
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
        source: PATHFINDER_SUN_ANGLE_LABEL_SOURCE_ID,
        filter: ['==', ['get', 'angle'], item.angle],
        layout: {
          'text-field': ['get', 'label'],
          'text-size': 12,
          'text-font': ['Noto Sans Regular'],
          'text-allow-overlap': true,
          'text-ignore-placement': true,
          'text-optional': true,
          'text-padding': 2,
          'text-anchor': 'left',
          'text-offset': [0.75, 0],
        },
        paint: {
          'text-color': PATHFINDER_SUN_ANGLE_COLORS[item.angle],
          'text-halo-color': '#071018',
          'text-halo-width': 1.6,
          'text-halo-blur': 0.3,
          'text-opacity': 0.96,
        },
      });
    }
  }
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
    if (map.getLayer(haloId)) {
      map.setLayoutProperty(haloId, 'visibility', visibility);
      map.setPaintProperty(haloId, 'line-width', visibleSunLineWidth(item.angle, selectedLine) + 2.4);
      map.setPaintProperty(haloId, 'line-opacity', selectedLine == null || selectedLine === item.angle ? 0.6 : 0.22);
    }
    if (map.getLayer(visibleId)) {
      map.setLayoutProperty(visibleId, 'visibility', visibility);
      map.setPaintProperty(visibleId, 'line-width', visibleSunLineWidth(item.angle, selectedLine));
      map.setPaintProperty(visibleId, 'line-opacity', visibleSunLineOpacity(item.angle, selectedLine));
      applyLineDash(map, visibleId, item.angle);
    }
    if (map.getLayer(hitId)) {
      map.setLayoutProperty(hitId, 'visibility', visibility);
      map.setPaintProperty(hitId, 'line-width', PATHFINDER_SUN_ANGLE_HIT_WIDTH);
      map.setPaintProperty(hitId, 'line-opacity', 0);
    }
    if (map.getLayer(labelId)) {
      map.setLayoutProperty(labelId, 'visibility', visibility);
      map.setPaintProperty(labelId, 'text-opacity', visibleSunLineOpacity(item.angle, selectedLine) > 0.5 ? 0.96 : 0.55);
    }
  }
}

function applyMetioroBasemap(map: maplibregl.Map): boolean {
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
        map.setPaintProperty(id, 'raster-opacity', 0.05);
        continue;
      }
      if (layer.type === 'fill') {
        if (/water/.test(id)) {
          map.setPaintProperty(id, 'fill-color', '#0a1622');
        } else if (/park|land|sand|ice|grass|wood|residential|cemetery|hospital|school|pitch|track|aeroway|building/.test(id)) {
          map.setPaintProperty(id, 'fill-color', '#1b2430');
        }
        continue;
      }
      if (layer.type === 'fill-extrusion') {
        map.setPaintProperty(id, 'fill-extrusion-opacity', 0);
        continue;
      }
      if (layer.type === 'line') {
        if (/boundar/.test(id)) {
          map.setPaintProperty(id, 'line-color', '#9aa8b8');
        } else if (/water/.test(id)) {
          map.setPaintProperty(id, 'line-color', '#122030');
        } else if (/road|tunnel|bridge|rail/.test(id)) {
          map.setPaintProperty(id, 'line-color', '#243040');
        }
        continue;
      }
      if (layer.type === 'symbol') {
        if (HIDDEN_LABEL_LAYERS.includes(id)) {
          map.setLayoutProperty(id, 'visibility', 'none');
        } else if (/label_|water_name/.test(id)) {
          map.setPaintProperty(id, 'text-color', '#d5deea');
          map.setPaintProperty(id, 'text-halo-color', '#071018');
        }
      }
    }
    return true;
  } catch {
    return false;
  }
}

function moveCamera(map: maplibregl.Map, camera: CameraTarget, animated: boolean) {
  if (animated) {
    map.flyTo({ ...camera, essential: true, duration: camera.pitch == null ? 900 : 700 });
    return;
  }
  map.jumpTo(camera);
}

export function PathfinderGlobeMap({
  mode,
  selected,
  resetToken = 0,
  angleFilter = 'all',
  selectedLine = null,
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
  const animated = mode === 'globe';

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
    try {
      map = new maplibregl.Map({
        container,
        style: STYLE_URL,
        center: [
          selectedRef.current?.longitude ?? DEFAULT_CENTER.longitude,
          selectedRef.current?.latitude ?? DEFAULT_CENTER.latitude,
        ],
        zoom: selectedRef.current
          ? 2.1
          : typeof window !== 'undefined' && window.innerWidth >= 1024
            ? DESKTOP_OVERVIEW_ZOOM
            : DEFAULT_CENTER.zoom,
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
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true, showCompass: true }), 'top-right');

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
        markerRef.current = new maplibregl.Marker({ color: MARKER_COLOR, draggable: false })
          .setLngLat([point.longitude, point.latitude])
          .addTo(map);
        return;
      }
      markerRef.current.setLngLat([point.longitude, point.latitude]);
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

    map.on('load', () => {
      if (cancelled) return;
      applyProjection();
      const basemapApplied = applyMetioroBasemap(map);
      container.dataset.basemap = basemapApplied ? 'metioro-dark' : 'liberty-unmodified';
      addSunAngleLayers(map);
      applySunAnglePresentation(map, angleFilterRef.current, selectedLineRef.current);
      syncMarker(selectedRef.current);
      const canvas = map.getCanvas();
      canvas.addEventListener('webglcontextlost', onLost, false);
      onReady();
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
      markerRef.current = new maplibregl.Marker({ color: MARKER_COLOR, draggable: false })
        .setLngLat([selectedLon, selectedLat])
        .addTo(map);
    } else {
      markerRef.current.setLngLat([selectedLon, selectedLat]);
    }
  }, [selectedLat, selectedLon]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded() || resetToken <= 0) return;
    const desktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
    const overview = pathfinderPresentationCamera({
      filter: 'all',
      selectedLine: null,
      marker: null,
      desktop,
    });
    moveCamera(
      map,
      {
        center: overview.center,
        zoom: overview.zoom,
        pitch: 0,
        bearing: 0,
      },
      animated
    );
  }, [resetToken, animated]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) return;
    applySunAnglePresentation(map, angleFilter, selectedLine);
    const desktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
    const camera = pathfinderPresentationCamera({
      filter: angleFilter,
      selectedLine,
      marker:
        selectedLat != null && selectedLon != null
          ? { latitude: selectedLat, longitude: selectedLon }
          : null,
      desktop,
    });
    moveCamera(map, camera, animated);
  }, [angleFilter, selectedLine, selectedLat, selectedLon, animated]);

  return (
    <div className="absolute inset-0">
      <div
        ref={containerRef}
        data-testid="pathfinder-globe-map"
        data-globe-mode={mode}
        className="h-full w-full"
      />
    </div>
  );
}

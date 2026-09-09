import demoCollection from './pathfinder-geometry-demo.json';

export const PATHFINDER_GEOMETRY_DEMO_NOTICE =
  'Public demo lines — not calculated from your chart.';
export const PATHFINDER_GEOMETRY_DEMO_BADGE = 'Public demo lines · 21 Jun 2020';
export const PATHFINDER_GEOMETRY_DEMO_COMPACT = 'Public demo lines';
export const PATHFINDER_GEOMETRY_DEMO_INSTANT_UTC = '2020-06-21T12:00:00Z';

export type PathfinderSunAngle = 'MC' | 'IC' | 'ASC' | 'DSC';

/** Distinct angle styles: MC gold, IC indigo (not gold), ASC cyan, DSC rose. */
export const PATHFINDER_SUN_ANGLE_COLORS: Record<PathfinderSunAngle, string> = {
  MC: '#f5c451',
  IC: '#7b8cff',
  ASC: '#3ee0d0',
  DSC: '#ff6b9a',
};

export const PATHFINDER_SUN_ANGLE_DASH: Record<PathfinderSunAngle, number[] | null> = {
  MC: null,
  IC: [1.8, 1.55],
  ASC: null,
  DSC: [3.1, 1.9],
};

export const PATHFINDER_SUN_ANGLE_DISPLAY: Record<PathfinderSunAngle, 'MC' | 'IC' | 'AC' | 'DC'> = {
  MC: 'MC',
  IC: 'IC',
  ASC: 'AC',
  DSC: 'DC',
};

export const PATHFINDER_SUN_ANGLE_LEGEND: ReadonlyArray<{
  angle: PathfinderSunAngle;
  color: string;
  label: string;
  shortLabel: string;
}> = [
  { angle: 'MC', color: PATHFINDER_SUN_ANGLE_COLORS.MC, label: '☉ MC', shortLabel: '☉ MC' },
  { angle: 'IC', color: PATHFINDER_SUN_ANGLE_COLORS.IC, label: '☉ IC', shortLabel: '☉ IC' },
  { angle: 'ASC', color: PATHFINDER_SUN_ANGLE_COLORS.ASC, label: '☉ AC', shortLabel: '☉ AC' },
  { angle: 'DSC', color: PATHFINDER_SUN_ANGLE_COLORS.DSC, label: '☉ DC', shortLabel: '☉ DC' },
];

export const PATHFINDER_SUN_ANGLE_SOURCE_ID = 'pathfinder-sun-angles';
export const PATHFINDER_SUN_ANGLE_LABEL_SOURCE_ID = 'pathfinder-sun-angle-labels';
export const PATHFINDER_SUN_ANGLE_HIT_WIDTH = 22;
export const PATHFINDER_SUN_ANGLE_FILTERS = ['all', 'MC', 'IC', 'ASC', 'DSC'] as const;

export type PathfinderSunAngleFilter = (typeof PATHFINDER_SUN_ANGLE_FILTERS)[number];

export const PATHFINDER_SUN_LINE_TITLES: Record<PathfinderSunAngle, string> = {
  MC: '☉ MC',
  IC: '☉ IC',
  ASC: '☉ AC',
  DSC: '☉ DC',
};

export const PATHFINDER_SUN_LINE_COPY: Record<
  PathfinderSunAngle,
  { angle: PathfinderSunAngle; body: 'Sun'; title: string; meaning: string }
> = {
  MC: {
    angle: 'MC',
    body: 'Sun',
    title: PATHFINDER_SUN_LINE_TITLES.MC,
    meaning: 'Where the Sun stands overhead — public role, vocation, and visibility.',
  },
  IC: {
    angle: 'IC',
    body: 'Sun',
    title: PATHFINDER_SUN_LINE_TITLES.IC,
    meaning: 'Opposite the Midheaven — home, roots, and the private foundation.',
  },
  ASC: {
    angle: 'ASC',
    body: 'Sun',
    title: PATHFINDER_SUN_LINE_TITLES.ASC,
    meaning: 'Where the Sun is rising — identity, presence, and first impression.',
  },
  DSC: {
    angle: 'DSC',
    body: 'Sun',
    title: PATHFINDER_SUN_LINE_TITLES.DSC,
    meaning: 'Where the Sun is setting — relationships, counterparts, and the other.',
  },
};

export const PATHFINDER_SUN_LINE_STATUS = 'Experimental — not production validated';
export const PATHFINDER_GEOMETRY_DEMO_STATUS = PATHFINDER_SUN_LINE_STATUS;
export const PATHFINDER_SUN_LINE_PROVENANCE =
  'Requested SWIEPH. This local snapshot may actually be MOSEPH. Do not treat this as production ephemeris provenance.';

export function sunAngleDisplayCode(angle: PathfinderSunAngle): 'MC' | 'IC' | 'AC' | 'DC' {
  return PATHFINDER_SUN_ANGLE_DISPLAY[angle];
}

export function sunAngleDisplayLabel(angle: PathfinderSunAngle): string {
  return `☉ ${sunAngleDisplayCode(angle)}`;
}

export function sunAngleFilterLabel(filter: PathfinderSunAngleFilter): string {
  return filter === 'all' ? 'All' : sunAngleDisplayLabel(filter);
}

export function sunAngleVisibleLayerId(angle: PathfinderSunAngle): string {
  return `${PATHFINDER_SUN_ANGLE_SOURCE_ID}-${angle}`;
}

export function sunAngleHitLayerId(angle: PathfinderSunAngle): string {
  return `${PATHFINDER_SUN_ANGLE_SOURCE_ID}-hit-${angle}`;
}

export function sunAngleLabelLayerId(angle: PathfinderSunAngle): string {
  return `${PATHFINDER_SUN_ANGLE_SOURCE_ID}-label-${angle}`;
}

export function sunAngleHaloLayerId(angle: PathfinderSunAngle): string {
  return `${PATHFINDER_SUN_ANGLE_SOURCE_ID}-halo-${angle}`;
}

export function isSunAngleVisible(angle: PathfinderSunAngle, filter: PathfinderSunAngleFilter): boolean {
  return filter === 'all' || filter === angle;
}

export function nextSelectedLineAfterFilter(
  selected: PathfinderSunAngle | null,
  filter: PathfinderSunAngleFilter
): PathfinderSunAngle | null {
  if (!selected) return null;
  if (filter !== 'all' && filter !== selected) return null;
  return selected;
}

export function nextSelectionForFilterControl(
  selected: PathfinderSunAngle | null,
  filter: PathfinderSunAngleFilter
): PathfinderSunAngle | null {
  if (filter === 'all') return null;
  return filter;
}

/** Single user-facing angle row: filter + focus. Never starts Analyze or Best Times. */
export function pathfinderAngleChipAction(
  next: PathfinderSunAngleFilter,
  currentSelected: PathfinderSunAngle | null
): {
  filter: PathfinderSunAngleFilter;
  selectedLine: PathfinderSunAngle | null;
  focusAngle: PathfinderSunAngle | null;
  startsAnalyze: false;
  startsBestTimes: false;
} {
  const selectedLine = nextSelectionForFilterControl(currentSelected, next);
  return {
    filter: next,
    selectedLine,
    focusAngle: next === 'all' ? null : next,
    startsAnalyze: false,
    startsBestTimes: false,
  };
}

export function visibleSunLineWidth(angle: PathfinderSunAngle, selected: PathfinderSunAngle | null): number {
  const base = angle === 'MC' || angle === 'IC' ? 2.85 : 3.1;
  if (selected === angle) return angle === 'MC' || angle === 'IC' ? 3.7 : 3.95;
  return base;
}

export function visibleSunLineOpacity(angle: PathfinderSunAngle, selected: PathfinderSunAngle | null): number {
  if (selected == null) return 0.96;
  return selected === angle ? 1 : 0.64;
}

export function pathfinderSunAngleGeoJSON(): GeoJSON.FeatureCollection {
  return demoCollection as GeoJSON.FeatureCollection;
}

function lineCoordinates(geometry: GeoJSON.Geometry | null | undefined): number[][] {
  if (!geometry) return [];
  if (geometry.type === 'LineString') return geometry.coordinates;
  if (geometry.type === 'MultiLineString') return geometry.coordinates.flat();
  return [];
}

function interpolateOnSegment(a: number[], b: number[], t: number): number[] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function labelPointOnExistingLine(coords: number[][]): number[] | null {
  if (coords.length === 0) return null;
  if (coords.length === 2 && coords[0] && coords[1]) {
    return interpolateOnSegment(coords[0], coords[1], 0.5);
  }
  let best = coords[0];
  let bestAbsLat = Math.abs(best?.[1] ?? 90);
  for (const pair of coords) {
    const absLat = Math.abs(pair[1]);
    if (absLat < bestAbsLat) {
      best = pair;
      bestAbsLat = absLat;
    }
  }
  return best ?? null;
}

export function isPointOnExistingSunLine(point: number[]): boolean {
  const collection = pathfinderSunAngleGeoJSON();
  for (const feature of collection.features) {
    const coords = lineCoordinates(feature.geometry);
    for (let i = 1; i < coords.length; i += 1) {
      const a = coords[i - 1];
      const b = coords[i];
      if (!a || !b) continue;
      const cross = (point[0] - a[0]) * (b[1] - a[1]) - (point[1] - a[1]) * (b[0] - a[0]);
      if (Math.abs(cross) > 1e-4) continue;
      const dot = (point[0] - a[0]) * (b[0] - a[0]) + (point[1] - a[1]) * (b[1] - a[1]);
      const len = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2;
      if (dot >= -1e-6 && dot <= len + 1e-6) return true;
    }
  }
  return false;
}

/** One sparse label per angle, sitting on an existing line segment. Does not invent geometry. */
export function pathfinderSunAngleLabelGeoJSON(): GeoJSON.FeatureCollection {
  const collection = pathfinderSunAngleGeoJSON();
  const bestByAngle = new Map<PathfinderSunAngle, { coords: number[][]; feature: GeoJSON.Feature }>();

  for (const feature of collection.features) {
    const angle = feature.properties?.angle;
    if (angle !== 'MC' && angle !== 'IC' && angle !== 'ASC' && angle !== 'DSC') continue;
    const coords = lineCoordinates(feature.geometry);
    if (coords.length === 0) continue;
    const current = bestByAngle.get(angle);
    if (!current || coords.length > current.coords.length) {
      bestByAngle.set(angle, { coords, feature });
    }
  }

  const features: GeoJSON.Feature[] = [];
  for (const [angle, entry] of bestByAngle) {
    const coordinates = labelPointOnExistingLine(entry.coords);
    if (!coordinates) continue;
    features.push({
      type: 'Feature',
      properties: {
        ...entry.feature.properties,
        angle,
        label: sunAngleDisplayLabel(angle),
      },
      geometry: {
        type: 'Point',
        coordinates,
      },
    });
  }

  return { type: 'FeatureCollection', features };
}

export function sunAngleLabelPoint(angle: PathfinderSunAngle): [number, number] | null {
  const feature = pathfinderSunAngleLabelGeoJSON().features.find((item) => item.properties?.angle === angle);
  if (!feature || feature.geometry.type !== 'Point') return null;
  const [longitude, latitude] = feature.geometry.coordinates;
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
  return [longitude, latitude];
}

export function pathfinderOverviewCamera(desktop: boolean): { center: [number, number]; zoom: number } {
  return {
    center: [18, 10],
    zoom: desktop ? 2.44 : 1.28,
  };
}

export function pathfinderCityCamera(
  longitude: number,
  latitude: number,
  desktop: boolean
): { center: [number, number]; zoom: number } {
  return {
    center: [longitude, latitude],
    zoom: desktop ? 4.55 : 4.25,
  };
}

export function pathfinderLineFocusCamera(
  angle: PathfinderSunAngle,
  desktop: boolean
): { center: [number, number]; zoom: number } {
  const linePoint = sunAngleLabelPoint(angle);
  if (angle === 'MC') {
    return { center: [14, 12], zoom: desktop ? 1.5 : 1.3 };
  }
  if (angle === 'IC') {
    return { center: [-168, 8], zoom: desktop ? 1.5 : 1.3 };
  }
  if (linePoint) {
    return { center: linePoint, zoom: desktop ? 1.52 : 1.32 };
  }
  return pathfinderOverviewCamera(desktop);
}

export function pathfinderPresentationCamera(input: {
  filter: PathfinderSunAngleFilter;
  selectedLine: PathfinderSunAngle | null;
  marker: { longitude: number; latitude: number } | null;
  desktop: boolean;
}): { center: [number, number]; zoom: number } {
  const focusAngle = input.selectedLine ?? (input.filter === 'all' ? null : input.filter);
  if (focusAngle) {
    return pathfinderLineFocusCamera(focusAngle, input.desktop);
  }
  if (input.marker) {
    return pathfinderCityCamera(input.marker.longitude, input.marker.latitude, input.desktop);
  }
  return pathfinderOverviewCamera(input.desktop);
}

export const PATHFINDER_ALL_LINES_EXPLORE = '4 lines active';

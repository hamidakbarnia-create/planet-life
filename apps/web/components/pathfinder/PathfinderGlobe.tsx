'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { PathfinderSelectedPoint } from '@/lib/pathfinder-selection';
import type { AppLang } from '@/lib/app-settings';
import {
  PATHFINDER_GEOMETRY_DEMO_BADGE,
  PATHFINDER_GEOMETRY_DEMO_NOTICE,
  PATHFINDER_GEOMETRY_DEMO_STATUS,
  PATHFINDER_SUN_ANGLE_COLORS,
  PATHFINDER_SUN_ANGLE_FILTERS,
  type PathfinderSunAngle,
  type PathfinderSunAngleFilter,
  pathfinderAngleChipAction,
  sunAngleDisplayLabel,
} from '@/lib/pathfinder-geometry-demo';
import { PathfinderSelectedLineCard } from './PathfinderSelectedLineCard';
import { scrollDeltaToRevealChip } from '@/lib/pathfinder-globe-projection';

const PathfinderGlobeMap = dynamic(
  () => import('./PathfinderGlobeMap').then((mod) => mod.PathfinderGlobeMap),
  {
    ssr: false,
    loading: () => null,
  }
);

export type GlobeVisualMode = 'globe' | 'mercator' | 'unavailable';

export type PathfinderGlobeLabels = {
  globeLoading: string;
  globeUnavailable: string;
  reset: string;
  fullscreen: string;
  attribution: string;
  filterAll: string;
  linesActive: string;
  focusLine: string;
  experimental: string;
  technicalProvenance: string;
  sunLineMeaning?: Partial<Record<PathfinderSunAngle, string>>;
  demoBadge?: string;
  demoNotice?: string;
  demoStatus?: string;
  demoCompact?: string;
};

export type PathfinderGlobeProps = {
  selected: PathfinderSelectedPoint | null;
  labels: PathfinderGlobeLabels;
  onPick: (latitude: number, longitude: number) => void;
  onResetView?: () => void;
  forceVisualMode?: GlobeVisualMode;
  labelLanguage?: AppLang;
  angleFilter?: PathfinderSunAngleFilter;
  selectedLine?: PathfinderSunAngle | null;
  onAngleFilterChange?: (filter: PathfinderSunAngleFilter) => void;
  onSelectLine?: (angle: PathfinderSunAngle | null) => void;
};

function detectWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ||
        canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false })
    );
  } catch {
    return false;
  }
}

function resolveGlobeVisualMode(input: {
  webglAvailable: boolean;
  reducedMotion: boolean;
  contextLost?: boolean;
}): GlobeVisualMode {
  if (!input.webglAvailable || input.contextLost) return 'unavailable';
  return input.reducedMotion ? 'mercator' : 'globe';
}

function subscribeReducedMotion(onChange: () => void) {
  if (typeof window === 'undefined') return () => undefined;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

export function PathfinderGlobe({
  selected,
  labels,
  onPick,
  onResetView,
  forceVisualMode,
  labelLanguage: _labelLanguage = 'en',
  angleFilter: angleFilterProp,
  selectedLine: selectedLineProp,
  onAngleFilterChange,
  onSelectLine,
}: PathfinderGlobeProps) {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false
  );
  const [webglAvailable] = useState(() => detectWebGL());
  const [contextLost, setContextLost] = useState(false);
  const [ready, setReady] = useState(false);
  const [initFailed, setInitFailed] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [focusToken, setFocusToken] = useState(0);
  const [focusAngle, setFocusAngle] = useState<PathfinderSunAngle | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const [internalFilter, setInternalFilter] = useState<PathfinderSunAngleFilter>('all');
  const [internalSelectedLine, setInternalSelectedLine] = useState<PathfinderSunAngle | null>(null);
  const filterRowRef = useRef<HTMLDivElement | null>(null);

  const angleFilter = angleFilterProp ?? internalFilter;
  const selectedLine = selectedLineProp !== undefined ? selectedLineProp : internalSelectedLine;

  const detectedMode = resolveGlobeVisualMode({
    webglAvailable: webglAvailable && !initFailed,
    reducedMotion,
    contextLost,
  });
  const mode = forceVisualMode ?? detectedMode;

  const handleReady = useCallback(() => setReady(true), []);
  const handleContextLost = useCallback(() => {
    setReady(false);
    setContextLost(true);
  }, []);
  const handleInitFailure = useCallback(() => {
    setInitFailed(true);
    setReady(false);
  }, []);
  const commitSelectedLine = useCallback(
    (next: PathfinderSunAngle | null) => {
      if (selectedLineProp === undefined) setInternalSelectedLine(next);
      onSelectLine?.(next);
    },
    [onSelectLine, selectedLineProp]
  );
  const handleSelectLine = useCallback(
    (angle: PathfinderSunAngle) => {
      commitSelectedLine(selectedLine === angle ? null : angle);
    },
    [commitSelectedLine, selectedLine]
  );
  const handleFilter = useCallback(
    (next: PathfinderSunAngleFilter) => {
      const action = pathfinderAngleChipAction(next, selectedLine);
      if (angleFilterProp === undefined) setInternalFilter(action.filter);
      onAngleFilterChange?.(action.filter);
      commitSelectedLine(action.selectedLine);
      if (action.focusAngle) {
        setFocusAngle(action.focusAngle);
        setFocusToken((value) => value + 1);
      }
    },
    [angleFilterProp, commitSelectedLine, onAngleFilterChange, selectedLine]
  );

  useEffect(() => {
    const row = filterRowRef.current;
    if (!row) return;
    const id = selectedLine ?? angleFilter;
    const active = row.querySelector<HTMLElement>(`[data-testid="pathfinder-geometry-demo-filter-${id}"]`);
    if (!active) return;
    const rowRect = row.getBoundingClientRect();
    const chipRect = active.getBoundingClientRect();
    const delta = scrollDeltaToRevealChip(
      rowRect,
      chipRect,
      { left: 0, right: typeof window !== 'undefined' ? window.innerWidth : rowRect.right }
    );
    if (delta !== 0) {
      row.scrollLeft += delta;
    }
    const nextRect = active.getBoundingClientRect();
    const stillClipped = scrollDeltaToRevealChip(
      row.getBoundingClientRect(),
      nextRect,
      { left: 0, right: typeof window !== 'undefined' ? window.innerWidth : rowRect.right }
    );
    if (stillClipped !== 0) {
      row.scrollLeft += stillClipped;
    }
  }, [angleFilter, selectedLine]);

  const enterFullscreen = useCallback(() => {
    const node = document.getElementById('pathfinder-globe-shell');
    if (!node) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    void node.requestFullscreen?.();
  }, []);

  const showMap = (mode === 'globe' || mode === 'mercator') && !initFailed;
  const showFallback = mode === 'unavailable' || initFailed;

  return (
    <div
      id="pathfinder-globe-shell"
      data-testid="pathfinder-globe"
      data-visual-mode={mode}
      data-selected-marker={selected ? '1' : '0'}
      data-angle-filter={angleFilter}
      data-selected-line={selectedLine ?? ''}
      className="pathfinder-globe-shell relative overflow-hidden"
      style={{
        background: 'rgba(4,8,18,0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
      }}
    >
      {showMap ? (
        <PathfinderGlobeMap
          mode={mode}
          selected={selected}
          resetToken={resetToken}
          focusToken={focusToken}
          focusAngle={focusAngle}
          angleFilter={angleFilter}
          selectedLine={selectedLine}
          labelLanguage="en"
          onPick={onPick}
          onSelectLine={handleSelectLine}
          onReady={handleReady}
          onContextLost={handleContextLost}
          onInitFailure={handleInitFailure}
        />
      ) : null}

      {showFallback ? (
        <div
          data-testid="pathfinder-globe-fallback"
          className="absolute inset-0 flex items-center justify-center px-6 text-center"
        >
          <p className="fi text-sm text-white/70">{labels.globeUnavailable}</p>
        </div>
      ) : null}

      {showMap && !ready ? (
        <div
          data-testid="pathfinder-globe-loading"
          className="absolute inset-0 flex items-center justify-center bg-black/25"
        >
          <p className="fi text-sm text-white/70">{labels.globeLoading}</p>
        </div>
      ) : null}

      <div className="pathfinder-globe-chrome-top z-10 flex gap-1.5">
        <button
          type="button"
          data-testid="pathfinder-globe-reset"
          onClick={() => {
            setResetToken((value) => value + 1);
            onResetView?.();
          }}
          className="fi min-h-10 rounded-full border border-white/12 bg-black/40 px-3 text-[11px] text-white/90"
        >
          {labels.reset}
        </button>
        <button
          type="button"
          data-testid="pathfinder-globe-fullscreen"
          onClick={enterFullscreen}
          className="fi min-h-10 rounded-full border border-white/12 bg-black/40 px-3 text-[11px] text-white/90"
        >
          {labels.fullscreen}
        </button>
      </div>

      <div
        data-testid="pathfinder-geometry-demo-notice"
        data-demo-open={demoOpen ? '1' : '0'}
        className="pathfinder-demo-notice absolute z-10"
        title={labels.demoNotice ?? PATHFINDER_GEOMETRY_DEMO_NOTICE}
      >
        <button
          type="button"
          data-testid="pathfinder-demo-compact"
          className="pathfinder-demo-compact fi"
          onClick={() => setDemoOpen((value) => !value)}
          aria-expanded={demoOpen}
        >
          {labels.demoCompact ?? 'Demo · not personal'}
        </button>
        <div className={`pathfinder-demo-full rounded-md px-1.5 py-1 ${demoOpen ? 'is-open' : ''}`}>
          <p className="fi text-[11px] font-medium leading-snug text-white/88">
            {labels.demoBadge ?? PATHFINDER_GEOMETRY_DEMO_BADGE}
          </p>
          <p className="fi mt-1 text-[10px] leading-snug text-white/72">
            {labels.demoNotice ?? PATHFINDER_GEOMETRY_DEMO_NOTICE}
          </p>
          <p className="fi mt-1 text-[10px] leading-snug text-white/64">
            {labels.demoStatus ?? PATHFINDER_GEOMETRY_DEMO_STATUS}
          </p>
        </div>
      </div>

      {selectedLine ? (
        <div className="pathfinder-selected-line-mobile pointer-events-auto absolute inset-x-2 z-20 lg:hidden">
          <PathfinderSelectedLineCard
            angle={selectedLine}
            variant="mobile-sheet"
            experimental={labels.experimental}
            technicalProvenance={labels.technicalProvenance}
            meaning={labels.sunLineMeaning?.[selectedLine]}
            status={labels.demoStatus}
          />
        </div>
      ) : null}

      <div
        data-testid="pathfinder-geometry-demo-legend"
        className="pathfinder-filter-row absolute left-2 right-2 z-10"
      >
        <div
          ref={filterRowRef}
          data-testid="pathfinder-geometry-demo-filter"
          className="flex max-w-full gap-1.5 overflow-x-auto scroll-px-2 pb-0.5"
          role="group"
          aria-label="Sun angle filter"
        >
          {PATHFINDER_SUN_ANGLE_FILTERS.map((filter) => {
            const active = angleFilter === filter;
            const selected = filter !== 'all' && selectedLine === filter;
            const color = filter === 'all' ? '#e8d39a' : PATHFINDER_SUN_ANGLE_COLORS[filter];
            return (
              <button
                key={filter}
                type="button"
                data-testid={`pathfinder-geometry-demo-filter-${filter}`}
                data-filter-active={active ? '1' : '0'}
                data-line-selected={selected ? '1' : '0'}
                aria-pressed={active}
                onClick={() => handleFilter(filter)}
                className="pathfinder-filter-chip fi inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[11px]"
                style={{
                  borderColor: selected ? `${color}` : active ? `${color}88` : 'rgba(255,255,255,0.1)',
                  color: active || selected ? '#fff' : 'rgba(255,255,255,0.68)',
                  background: selected ? `${color}30` : active ? `${color}1c` : 'rgba(8,12,22,0.72)',
                  boxShadow: selected ? `0 0 0 1px ${color}66` : 'none',
                }}
              >
                {filter === 'all' ? (
                  <span aria-hidden className="fi text-[12px] leading-none">☉</span>
                ) : (
                  <span aria-hidden className="inline-block h-1.5 w-3.5 rounded-full" style={{ background: color }} />
                )}
                {filter === 'all' ? labels.filterAll ?? 'All' : sunAngleDisplayLabel(filter)}
              </button>
            );
          })}
        </div>
      </div>

      {showFallback ? (
        <div
          data-testid="pathfinder-globe-attribution"
          className="absolute bottom-2 left-3 right-3 z-10 fi text-[10px] text-white/70"
        >
          {labels.attribution}
        </div>
      ) : null}
    </div>
  );
}

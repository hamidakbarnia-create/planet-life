'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { PathfinderSelectedPoint } from '@/lib/pathfinder-selection';
import {
  PATHFINDER_ALL_LINES_EXPLORE,
  PATHFINDER_GEOMETRY_DEMO_BADGE,
  PATHFINDER_GEOMETRY_DEMO_NOTICE,
  PATHFINDER_SUN_ANGLE_COLORS,
  PATHFINDER_SUN_ANGLE_FILTERS,
  type PathfinderSunAngle,
  type PathfinderSunAngleFilter,
  nextSelectionForFilterControl,
  sunAngleFilterLabel,
} from '@/lib/pathfinder-geometry-demo';
import { PathfinderSelectedLineCard } from './PathfinderSelectedLineCard';

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
};

export type PathfinderGlobeProps = {
  selected: PathfinderSelectedPoint | null;
  labels: PathfinderGlobeLabels;
  onPick: (latitude: number, longitude: number) => void;
  onResetView?: () => void;
  forceVisualMode?: GlobeVisualMode;
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
      if (angleFilterProp === undefined) setInternalFilter(next);
      onAngleFilterChange?.(next);
      commitSelectedLine(nextSelectionForFilterControl(selectedLine, next));
    },
    [angleFilterProp, commitSelectedLine, onAngleFilterChange, selectedLine]
  );

  useEffect(() => {
    const row = filterRowRef.current;
    if (!row) return;
    const active = row.querySelector<HTMLElement>(`[data-testid="pathfinder-geometry-demo-filter-${angleFilter}"]`);
    if (typeof active?.scrollIntoView === 'function') {
      active.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }
  }, [angleFilter]);

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
          angleFilter={angleFilter}
          selectedLine={selectedLine}
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

      <div className="absolute left-2 top-2 z-10 flex gap-1.5">
        <button
          type="button"
          data-testid="pathfinder-globe-reset"
          onClick={() => {
            setResetToken((value) => value + 1);
            onResetView?.();
          }}
          className="fi min-h-9 rounded-lg border border-white/15 bg-black/45 px-2.5 text-[10px] text-white"
        >
          {labels.reset}
        </button>
        <button
          type="button"
          data-testid="pathfinder-globe-fullscreen"
          onClick={enterFullscreen}
          className="fi min-h-9 rounded-lg border border-white/15 bg-black/45 px-2.5 text-[10px] text-white"
        >
          {labels.fullscreen}
        </button>
      </div>

      <div
        data-testid="pathfinder-geometry-demo-notice"
        className="pointer-events-none absolute left-2 top-12 z-10"
        title={PATHFINDER_GEOMETRY_DEMO_NOTICE}
      >
        <div
          className="rounded-lg px-2 py-1"
          style={{
            background: 'rgba(8,12,22,0.72)',
            border: '1px solid rgba(251,191,36,0.28)',
          }}
        >
          <p className="fi text-[10px] font-medium leading-none text-amber-100">{PATHFINDER_GEOMETRY_DEMO_BADGE}</p>
          <p className="fi mt-0.5 text-[9px] leading-none text-white/50">{PATHFINDER_GEOMETRY_DEMO_NOTICE}</p>
        </div>
      </div>

      {selectedLine ? (
        <div className="pathfinder-selected-line-mobile pointer-events-auto absolute inset-x-2 bottom-[7.25rem] z-20 lg:hidden">
          <PathfinderSelectedLineCard angle={selectedLine} variant="mobile-sheet" />
        </div>
      ) : null}

      {angleFilter === 'all' && !selectedLine ? (
        <p
          data-testid="pathfinder-geometry-demo-explore"
          className="pointer-events-none absolute bottom-[6.85rem] left-2 z-10 max-w-[16rem] fi text-[10px] leading-snug text-white/55 lg:bottom-[4.85rem]"
        >
          {PATHFINDER_ALL_LINES_EXPLORE}
        </p>
      ) : null}

      <div
        data-testid="pathfinder-geometry-demo-legend"
        className="pathfinder-filter-row absolute bottom-10 left-2 right-2 z-10 lg:bottom-8 lg:max-w-[28rem]"
      >
        <div
          ref={filterRowRef}
          data-testid="pathfinder-geometry-demo-filter"
          className="flex max-w-full gap-1 overflow-x-auto scroll-px-2"
          role="group"
          aria-label="Sun angle filter"
        >
          {PATHFINDER_SUN_ANGLE_FILTERS.map((filter) => {
            const active = angleFilter === filter;
            const color = filter === 'all' ? '#fbbf24' : PATHFINDER_SUN_ANGLE_COLORS[filter];
            return (
              <button
                key={filter}
                type="button"
                data-testid={`pathfinder-geometry-demo-filter-${filter}`}
                aria-pressed={active}
                onClick={() => handleFilter(filter)}
                className="fi inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border px-2 text-[10px]"
                style={{
                  borderColor: active ? `${color}99` : 'rgba(255,255,255,0.12)',
                  color: active ? '#fff' : 'rgba(255,255,255,0.72)',
                  background: active ? `${color}22` : 'rgba(8,12,22,0.72)',
                }}
              >
                {filter !== 'all' ? (
                  <span aria-hidden className="inline-block h-1.5 w-3.5 rounded-full" style={{ background: color }} />
                ) : null}
                {sunAngleFilterLabel(filter)}
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

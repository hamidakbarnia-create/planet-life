import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PATHFINDER_PAGE_COPY } from '@/app/pathfinder/page';
import { selectedPointFromGlobePick } from '@/lib/pathfinder-selection';
import { PathfinderGlobe } from './PathfinderGlobe';
import { PathfinderGlobeMap } from './PathfinderGlobeMap';

const labels = {
  globeLoading: PATHFINDER_PAGE_COPY.en.globeLoading,
  globeUnavailable: PATHFINDER_PAGE_COPY.en.globeUnavailable,
  reset: PATHFINDER_PAGE_COPY.en.reset,
  fullscreen: PATHFINDER_PAGE_COPY.en.fullscreen,
  attribution: PATHFINDER_PAGE_COPY.en.attribution,
};

vi.mock('next/dynamic', () => ({
  default: () =>
    function MockMap() {
      return <div data-testid="pathfinder-globe-map-dynamic" />;
    },
}));

vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

vi.mock('maplibre-gl', () => {
  class Map {
    constructor(options: { container: HTMLElement }) {
      options.container.classList.add('maplibregl-map');
    }
    addControl() {}
    on() {}
    remove() {}
    loaded() {
      return false;
    }
    getCanvas() {
      return document.createElement('canvas');
    }
  }
  class Marker {
    setLngLat() {
      return this;
    }
    addTo() {
      return this;
    }
    remove() {}
  }
  return {
    default: {
      Map,
      AttributionControl: class {},
      NavigationControl: class {},
      Marker,
    },
  };
});

function stubMatchMedia(reducedMotion: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: reducedMotion && query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

function stubWebGL(available: boolean) {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((type: string) => {
    if (!available) return null;
    if (type === 'webgl' || type === 'webgl2') {
      return {} as CanvasRenderingContext2D;
    }
    return null;
  });
}

beforeEach(() => {
  stubMatchMedia(false);
  stubWebGL(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('PathfinderGlobe', () => {
  it('renders a usable fallback when WebGL is unavailable', () => {
    stubWebGL(false);
    const onPick = vi.fn();
    render(<PathfinderGlobe selected={null} labels={labels} onPick={onPick} />);
    expect(screen.getByTestId('pathfinder-globe-fallback')).toBeTruthy();
    expect(screen.getByTestId('pathfinder-globe-fallback').textContent).toBe(labels.globeUnavailable);
    expect(screen.getByTestId('pathfinder-globe-attribution').textContent).toBe(labels.attribution);
    expect(screen.queryByTestId('pathfinder-globe-map-dynamic')).toBeNull();
    expect(onPick).not.toHaveBeenCalled();
  });

  it('shows loading before MapLibre reports ready', () => {
    render(<PathfinderGlobe selected={null} labels={labels} onPick={() => undefined} />);
    expect(screen.getByTestId('pathfinder-globe-loading').textContent).toBe(labels.globeLoading);
    expect(screen.getByTestId('pathfinder-globe-map-dynamic')).toBeTruthy();
  });

  it('uses non-animated mercator mode for reduced motion without hiding the map', () => {
    stubMatchMedia(true);
    render(<PathfinderGlobe selected={null} labels={labels} onPick={() => undefined} />);
    expect(screen.queryByTestId('pathfinder-globe-fallback')).toBeNull();
    expect(screen.getByTestId('pathfinder-globe').getAttribute('data-visual-mode')).toBe('mercator');
    expect(screen.getByTestId('pathfinder-globe-map-dynamic')).toBeTruthy();
  });

  it('labels the experimental Sun-angle demo without a second custom attribution', () => {
    render(<PathfinderGlobe selected={null} labels={labels} onPick={() => undefined} />);
    expect(screen.getByTestId('pathfinder-geometry-demo-notice').textContent).toContain(
      'Demo chart · 21 Jun 2020'
    );
    expect(screen.getByTestId('pathfinder-geometry-demo-notice').textContent).toContain(
      'Not your personal chart'
    );
    expect(screen.getByTestId('pathfinder-geometry-demo-legend').textContent).toContain('☉ MC');
    expect(screen.getByTestId('pathfinder-geometry-demo-legend').textContent).toContain('☉ IC');
    expect(screen.getByTestId('pathfinder-geometry-demo-legend').textContent).toContain('☉ ASC');
    expect(screen.getByTestId('pathfinder-geometry-demo-legend').textContent).toContain('☉ DSC');
    expect(screen.getByTestId('pathfinder-geometry-demo-legend').textContent).not.toContain('Sun MC');
    expect(screen.getByTestId('pathfinder-geometry-demo-explore').textContent).toContain(
      '4 lines active · rotate globe to explore'
    );
    expect(screen.queryByTestId('pathfinder-globe-attribution')).toBeNull();
  });

  it('filters angles without moving the Calculation Point contract or calling onPick', () => {
    const onPick = vi.fn();
    render(<PathfinderGlobe selected={null} labels={labels} onPick={onPick} />);
    expect(screen.getByTestId('pathfinder-globe').getAttribute('data-angle-filter')).toBe('all');
    fireEvent.click(screen.getByTestId('pathfinder-geometry-demo-filter-MC'));
    expect(screen.getByTestId('pathfinder-globe').getAttribute('data-angle-filter')).toBe('MC');
    expect(onPick).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('pathfinder-geometry-demo-filter-all'));
    expect(screen.getByTestId('pathfinder-globe').getAttribute('data-angle-filter')).toBe('all');
  });

  it('selects a Sun line, shows the experimental info panel, and clears it when filtered away', () => {
    const onPick = vi.fn();
    render(
      <PathfinderGlobe
        selected={selectedPointFromGlobePick(30.0444, 31.2357, PATHFINDER_PAGE_COPY.en.selectedLocation)}
        labels={labels}
        onPick={onPick}
      />
    );
    expect(screen.getByTestId('pathfinder-globe').getAttribute('data-selected-marker')).toBe('1');
    fireEvent.click(screen.getByTestId('pathfinder-geometry-demo-filter-ASC'));
    expect(screen.getByTestId('pathfinder-globe').getAttribute('data-selected-line')).toBe('ASC');
    expect(screen.getByTestId('pathfinder-geometry-demo-info').textContent).toContain('Sun — Ascendant');
    expect(screen.getByTestId('pathfinder-geometry-demo-info').textContent).toContain('Experimental');
    expect(screen.getByTestId('pathfinder-geometry-demo-provenance').textContent).toContain(
      'Experimental — not production-validated.'
    );
    expect(screen.getByTestId('pathfinder-geometry-demo-provenance').textContent).toContain('MOSEPH');
    expect(screen.getByTestId('pathfinder-globe').getAttribute('data-selected-marker')).toBe('1');
    expect(onPick).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('pathfinder-geometry-demo-filter-MC'));
    expect(screen.getByTestId('pathfinder-globe').getAttribute('data-selected-line')).toBe('MC');
    expect(screen.getByTestId('pathfinder-geometry-demo-info').textContent).toContain('Sun — Midheaven');
    expect(screen.getByTestId('pathfinder-globe').getAttribute('data-selected-marker')).toBe('1');
  });

  it('keeps a single selected-marker contract', () => {
    const { rerender } = render(
      <PathfinderGlobe selected={null} labels={labels} onPick={() => undefined} />
    );
    expect(screen.getByTestId('pathfinder-globe').getAttribute('data-selected-marker')).toBe('0');
    rerender(
      <PathfinderGlobe
        selected={selectedPointFromGlobePick(0, 0, PATHFINDER_PAGE_COPY.en.selectedLocation)}
        labels={labels}
        onPick={() => undefined}
      />
    );
    expect(screen.getByTestId('pathfinder-globe').getAttribute('data-selected-marker')).toBe('1');
  });

  it('unmounts reset and fullscreen controls without leftover handlers', () => {
    const onResetView = vi.fn();
    const { unmount } = render(
      <PathfinderGlobe selected={null} labels={labels} onPick={() => undefined} onResetView={onResetView} />
    );
    fireEvent.click(screen.getByTestId('pathfinder-globe-reset'));
    expect(onResetView).toHaveBeenCalledTimes(1);
    unmount();
    expect(screen.queryByTestId('pathfinder-globe')).toBeNull();
  });
});

describe('PathfinderGlobeMap host layout', () => {
  it('sizes the MapLibre host via a wrapper instead of absolute on the mutated element', () => {
    render(
      <PathfinderGlobeMap
        mode="globe"
        selected={null}
        onPick={() => undefined}
        onReady={() => undefined}
        onContextLost={() => undefined}
        onInitFailure={() => undefined}
      />
    );

    const host = screen.getByTestId('pathfinder-globe-map');
    const frame = host.parentElement;
    expect(frame).toBeTruthy();
    expect(frame?.classList.contains('absolute')).toBe(true);
    expect(frame?.classList.contains('inset-0')).toBe(true);
    expect(host.classList.contains('h-full')).toBe(true);
    expect(host.classList.contains('w-full')).toBe(true);
    expect(host.classList.contains('absolute')).toBe(false);
    expect(host.classList.contains('relative')).toBe(false);
    expect(host.classList.contains('inset-0')).toBe(false);
  });
});

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PATHFINDER_PAGE_COPY } from '@/app/pathfinder/page';
import { selectedPointFromGlobePick, withAuthoritativeTimezone } from '@/lib/pathfinder-selection';
import { PathfinderGlobe } from './PathfinderGlobe';
import { PathfinderGlobeMap } from './PathfinderGlobeMap';

const labels = {
  globeLoading: PATHFINDER_PAGE_COPY.en.globeLoading,
  globeUnavailable: PATHFINDER_PAGE_COPY.en.globeUnavailable,
  reset: PATHFINDER_PAGE_COPY.en.reset,
  fullscreen: PATHFINDER_PAGE_COPY.en.fullscreen,
  attribution: PATHFINDER_PAGE_COPY.en.attribution,
  filterAll: PATHFINDER_PAGE_COPY.en.filterAll,
  linesActive: PATHFINDER_PAGE_COPY.en.linesActive,
  focusLine: PATHFINDER_PAGE_COPY.en.focusLine,
  experimental: PATHFINDER_PAGE_COPY.en.experimental,
  technicalProvenance: PATHFINDER_PAGE_COPY.en.technicalProvenance,
  sunLineMeaning: PATHFINDER_PAGE_COPY.en.sunLineMeaning,
  demoBadge: PATHFINDER_PAGE_COPY.en.demoBadge,
  demoNotice: PATHFINDER_PAGE_COPY.en.demoNotice,
  demoStatus: PATHFINDER_PAGE_COPY.en.demoStatus,
  demoCompact: PATHFINDER_PAGE_COPY.en.demoCompact,
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
    once() {}
    remove() {}
    loaded() {
      return false;
    }
    isStyleLoaded() {
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
    getRTLTextPluginStatus: () => 'unavailable',
    setRTLTextPlugin: () => Promise.reject(new Error('rtl-plugin-blocked')),
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

describe('Pathfinder catalog', () => {
  it('keeps the product name Pathfinder and English-only basemap contract', () => {
    expect(PATHFINDER_PAGE_COPY.en.title).toBe('Pathfinder');
    expect(PATHFINDER_PAGE_COPY.ru.title).toBe('Pathfinder');
    expect(PATHFINDER_PAGE_COPY.fa.title).toBe('Pathfinder');
    expect(PATHFINDER_PAGE_COPY.ar.title).toBe('Pathfinder');
    expect(PATHFINDER_PAGE_COPY.ru.bestTimesNeedsTimezone).not.toMatch(/Best Times/);
    expect(PATHFINDER_PAGE_COPY.fa.noProfile).toContain('Pathfinder');
    expect(PATHFINDER_PAGE_COPY.ar.noProfile).toContain('Pathfinder');
    expect(PATHFINDER_PAGE_COPY.fa.selectedLocation).not.toBe(PATHFINDER_PAGE_COPY.en.selectedLocation);
    expect(PATHFINDER_PAGE_COPY.ar.demoCompact).not.toMatch(/Demo chart/);
    expect(PATHFINDER_PAGE_COPY.en.demoNotice).toBe(
      'Public demo lines — not calculated from your chart.'
    );
    expect(PATHFINDER_PAGE_COPY.en.demoSeparationWarning).toBe(
      'Experimental Sun lines are a public demonstration and are not part of this personal analysis.'
    );
    expect(PATHFINDER_PAGE_COPY.en.analysisSourceSynthetic).toMatch(/synthetic test data/i);
    expect(PATHFINDER_PAGE_COPY.ru.title).toBe('Pathfinder');
    expect(PATHFINDER_PAGE_COPY.fa.reset).not.toBe(PATHFINDER_PAGE_COPY.en.reset);
    expect(PATHFINDER_PAGE_COPY.ar.analyze).not.toBe(PATHFINDER_PAGE_COPY.en.analyze);
    expect(PATHFINDER_PAGE_COPY.ru.searchPlaceholder).not.toBe(PATHFINDER_PAGE_COPY.en.searchPlaceholder);
    expect(PATHFINDER_PAGE_COPY.fa.selectedLocation).not.toBe(PATHFINDER_PAGE_COPY.en.selectedLocation);
    expect(PATHFINDER_PAGE_COPY.ar.filterAll).not.toBe(PATHFINDER_PAGE_COPY.en.filterAll);
  });
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
      'Public demo lines · 21 Jun 2020'
    );
    expect(screen.getByTestId('pathfinder-geometry-demo-notice').textContent).toContain(
      'Public demo lines — not calculated from your chart.'
    );
    expect(screen.getByTestId('pathfinder-geometry-demo-notice').textContent).toContain(
      'Experimental — not production validated'
    );
    expect(screen.getByTestId('pathfinder-demo-compact').textContent).toBe('Public demo lines');
    expect(screen.getByTestId('pathfinder-geometry-demo-legend').textContent).toContain('☉ MC');
    expect(screen.getByTestId('pathfinder-geometry-demo-legend').textContent).toContain('☉ IC');
    expect(screen.getByTestId('pathfinder-geometry-demo-legend').textContent).toContain('☉ AC');
    expect(screen.getByTestId('pathfinder-geometry-demo-legend').textContent).toContain('☉ DC');
    expect(screen.getByTestId('pathfinder-geometry-demo-legend').textContent).not.toContain('☉ ASC');
    expect(screen.getByTestId('pathfinder-geometry-demo-legend').textContent).not.toContain('Sun MC');
    expect(screen.queryByTestId('pathfinder-geometry-demo-explore')).toBeNull();
    expect(screen.queryByTestId('pathfinder-geometry-demo-focus-MC')).toBeNull();
    expect(screen.getByTestId('pathfinder-geometry-demo-legend').className).toContain('pathfinder-filter-row');
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
    fireEvent.click(screen.getByTestId('pathfinder-geometry-demo-filter-MC'));
    expect(screen.getByTestId('pathfinder-globe').getAttribute('data-angle-filter')).toBe('MC');
    expect(screen.getByTestId('pathfinder-globe').getAttribute('data-selected-line')).toBe('MC');
    expect(onPick).not.toHaveBeenCalled();
  });

  it('selects a Sun line, shows the experimental info panel, and clears it when filtered away', () => {
    const onPick = vi.fn();
    const selected = withAuthoritativeTimezone(
      selectedPointFromGlobePick(30.0444, 31.2357, PATHFINDER_PAGE_COPY.en.selectedLocation),
      'Africa/Cairo'
    );
    render(
      <PathfinderGlobe
        selected={selected}
        labels={labels}
        onPick={onPick}
      />
    );
    expect(screen.getByTestId('pathfinder-globe').getAttribute('data-selected-marker')).toBe('1');
    fireEvent.click(screen.getByTestId('pathfinder-geometry-demo-filter-ASC'));
    expect(screen.getByTestId('pathfinder-globe').getAttribute('data-selected-line')).toBe('ASC');
    expect(screen.getByTestId('pathfinder-geometry-demo-info').textContent).toContain('☉ AC');
    expect(screen.getByTestId('pathfinder-geometry-demo-info').textContent).toContain('Experimental');
    expect(screen.getByTestId('pathfinder-geometry-demo-provenance').textContent).toContain(
      'Experimental — not production validated'
    );
    expect(screen.getByTestId('pathfinder-geometry-demo-provenance').textContent).toContain('MOSEPH');
    expect(screen.getByTestId('pathfinder-globe').getAttribute('data-selected-marker')).toBe('1');
    expect(selected.timezone).toBe('Africa/Cairo');
    expect(onPick).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('pathfinder-geometry-demo-filter-MC'));
    expect(screen.getByTestId('pathfinder-globe').getAttribute('data-selected-line')).toBe('MC');
    expect(screen.getByTestId('pathfinder-geometry-demo-info').textContent).toContain('☉ MC');
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

  it('keeps selected coordinates when Reset View or line focus is used', () => {
    const onPick = vi.fn();
    const selected = withAuthoritativeTimezone(
      selectedPointFromGlobePick(10.0638, 17.9784, PATHFINDER_PAGE_COPY.en.selectedLocation),
      'Africa/Ndjamena'
    );
    render(<PathfinderGlobe selected={selected} labels={labels} onPick={onPick} />);
    fireEvent.click(screen.getByTestId('pathfinder-geometry-demo-filter-ASC'));
    fireEvent.click(screen.getByTestId('pathfinder-globe-reset'));
    expect(screen.getByTestId('pathfinder-globe').getAttribute('data-selected-marker')).toBe('1');
    expect(selected.latitude).toBe(10.0638);
    expect(selected.longitude).toBe(17.9784);
    expect(selected.timezone).toBe('Africa/Ndjamena');
    expect(onPick).not.toHaveBeenCalled();
  });

  it('does not start Analyze or Best Times from globe chrome', () => {
    render(<PathfinderGlobe selected={null} labels={labels} onPick={() => undefined} />);
    expect(screen.queryByRole('button', { name: /analyze location|best times/i })).toBeNull();
    fireEvent.click(screen.getByTestId('pathfinder-geometry-demo-filter-DSC'));
    fireEvent.click(screen.getByTestId('pathfinder-globe-reset'));
    expect(screen.queryByRole('button', { name: /analyze location|best times/i })).toBeNull();
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
    expect(host.getAttribute('data-label-language')).toBe('en');
  });

  it('falls back to English basemap labels when the RTL plugin fails', async () => {
    const { rerender } = render(
      <PathfinderGlobeMap
        mode="globe"
        selected={null}
        labelLanguage="fa"
        onPick={() => undefined}
        onReady={() => undefined}
        onContextLost={() => undefined}
        onInitFailure={() => undefined}
      />
    );
    const host = screen.getByTestId('pathfinder-globe-map');
    expect(host.getAttribute('data-label-language')).toBe('fa');
    await waitFor(() => {
      expect(host.getAttribute('data-basemap-label-language')).toBe('en');
      expect(host.getAttribute('data-rtl-plugin')).toBe('failed');
      expect(screen.getByTestId('pathfinder-rtl-fallback-warning').textContent).toMatch(/English/);
    });
    rerender(
      <PathfinderGlobeMap
        mode="globe"
        selected={null}
        labelLanguage="ar"
        onPick={() => undefined}
        onReady={() => undefined}
        onContextLost={() => undefined}
        onInitFailure={() => undefined}
      />
    );
    const sameHost = screen.getByTestId('pathfinder-globe-map');
    expect(sameHost).toBe(host);
    expect(sameHost.getAttribute('data-label-language')).toBe('ar');
    await waitFor(() => {
      expect(sameHost.getAttribute('data-basemap-label-language')).toBe('en');
    });
  });
});

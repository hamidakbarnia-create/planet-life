import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  buildPreConfirmSummary,
  buildTrustCardRows,
  formatConfirmCoordinates,
  isPlaceholderCardContent,
  resolveConfirmDisplayValue,
  resolveGenerateChartAction,
  shouldRenderChartDevPanel,
  shouldShowPreChartConfirm,
  shouldWarnGeocodeFallback,
} from './chart-profile-ux';
import { getCalculationDetailsLabels, getDevPanelLabels, isRtlLang } from './chart-profile-i18n';
import type { ChartData } from './chart-types';

const sampleChart: ChartData = {
  planets: {
    sun: { longitude: 336, sign: 12, degree: 6, house: 1, retrograde: false },
  },
  ascendant: 324.6,
  midheaven: 246.72,
  houses: [324.6, 350, 20, 50, 80, 110, 144.6, 170, 200, 230, 260, 290],
  latitude: 30.402184,
  longitude: 55.994178,
  timezone: 'Asia/Tehran',
  local_datetime: '1982-02-25T05:47:00+03:30',
  utc_datetime: '1982-02-25 02:17:00',
  julian_day: 2445025.59,
  house_system: 'placidus',
  zodiac: 'tropical',
  node_type: 'mean',
  location: 'Rafsanjan',
  ephemeris_engine: 'Swiss Ephemeris',
  coordinate_source: 'selected_city_coordinates',
};

const tehranResolved = {
  latitude: 35.689252,
  longitude: 51.3896,
  timezone: 'Asia/Tehran',
  coordinate_source: 'geocoded_fallback' as const,
  timezone_source: 'IANA',
};

describe('shouldShowPreChartConfirm', () => {
  it('returns true only for Persian', () => {
    expect(shouldShowPreChartConfirm('fa')).toBe(true);
    expect(shouldShowPreChartConfirm('en')).toBe(false);
  });
});

describe('resolveGenerateChartAction', () => {
  it('shows modal for FA before API', () => {
    expect(resolveGenerateChartAction('fa')).toBe('show-confirm-modal');
    expect(resolveGenerateChartAction('en')).toBe('call-api');
  });
});

describe('shouldWarnGeocodeFallback', () => {
  it('warns only for geocoded_fallback source', () => {
    expect(shouldWarnGeocodeFallback('geocoded_fallback')).toBe(true);
    expect(shouldWarnGeocodeFallback('selected_city_coordinates')).toBe(false);
  });
});

describe('formatConfirmCoordinates', () => {
  it('formats lat/lon on separate lines with degree symbol', () => {
    expect(formatConfirmCoordinates(35.689252, 51.3896)).toBe(
      '35.689252°\n51.389600°'
    );
  });
});

describe('resolveConfirmDisplayValue', () => {
  it('shows loading text while resolving', () => {
    expect(resolveConfirmDisplayValue(null, true)).toContain('در حال دریافت');
  });

  it('shows timezone when resolved', () => {
    expect(resolveConfirmDisplayValue('Asia/Tehran', false)).toBe('Asia/Tehran');
  });
});

describe('buildPreConfirmSummary', () => {
  it('includes timezone and coordinates from resolved preview', () => {
    const summary = buildPreConfirmSummary({
      name: 'Ali',
      birthDate: '1990-06-15',
      birthTime: '14:30',
      location: 'Tehran',
      resolved: tehranResolved,
      resolving: false,
    });
    expect(summary.timezone).toBe('Asia/Tehran');
    expect(summary.coordinates).toBe('35.689252°\n51.389600°');
    expect(summary.showGeocodeWarning).toBe(true);
    expect(summary.resolving).toBe(false);
  });

  it('shows resolving state while location preview loads', () => {
    const summary = buildPreConfirmSummary({
      name: 'Ali',
      birthDate: '1990-06-15',
      birthTime: '14:30',
      location: 'Tehran',
      resolved: null,
      resolving: true,
    });
    expect(summary.resolving).toBe(true);
    expect(resolveConfirmDisplayValue(summary.timezone, summary.resolving)).toContain(
      'در حال دریافت'
    );
  });
});

describe('shouldRenderChartDevPanel', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not render in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(shouldRenderChartDevPanel()).toBe(false);
  });
});

describe('isPlaceholderCardContent', () => {
  it('detects empty and coming-soon placeholders', () => {
    expect(isPlaceholderCardContent('—')).toBe(true);
    expect(isPlaceholderCardContent('Fire')).toBe(false);
  });
});

describe('buildTrustCardRows', () => {
  it('returns three concise verified rows', () => {
    const rows = buildTrustCardRows(sampleChart, 'fa');
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.verified)).toBe(true);
  });
});

describe('Calculation Details Persian labels', () => {
  it('uses Persian labels and RTL lang flag', () => {
    const labels = getCalculationDetailsLabels('fa');
    expect(labels.timezone).toBe('منطقه زمانی');
    expect(isRtlLang('fa')).toBe(true);
  });
});

describe('Dev panel Persian labels', () => {
  it('translates developer verification labels', () => {
    const labels = getDevPanelLabels('fa');
    expect(labels.title).toBe('اطلاعات توسعه‌دهنده');
    expect(labels.city).toBe('شهر');
    expect(labels.timezone).toBe('منطقه زمانی');
    expect(labels.latitude).toBe('عرض جغرافیایی');
  });
});

import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { FaChartConfirmModal } from '@/components/FaChartConfirmModal';
import { ChartDevPanel } from '@/components/ChartDevPanel';
import type { PreConfirmSummary } from '@/lib/chart-profile-ux';
import type { ChartData } from '@/lib/chart-types';

const baseSummary: PreConfirmSummary = {
  name: 'علی',
  birthDate: '1990-06-15',
  birthTime: '14:30',
  city: 'تهران',
  timezone: 'Asia/Tehran',
  coordinates: '35.689252°\n51.389600°',
  latitude: 35.689252,
  longitude: 51.3896,
  zodiac: 'Tropical',
  houseSystem: 'Placidus',
  nodeType: 'Mean Node (☊)',
  showGeocodeWarning: false,
  resolving: false,
};

const sampleChart: ChartData = {
  planets: {
    sun: { longitude: 336, sign: 12, degree: 6, house: 1, retrograde: false },
  },
  ascendant: 324.6,
  midheaven: 246.72,
  houses: [324.6, 350, 20, 50, 80, 110, 144.6, 170, 200, 230, 260, 290],
  latitude: 35.689252,
  longitude: 51.3896,
  timezone: 'Asia/Tehran',
  local_datetime: '1990-06-15T14:30:00+03:30',
  utc_datetime: '1990-06-15 11:00:00',
  julian_day: 2448058.95833333,
  house_system: 'placidus',
  zodiac: 'tropical',
  node_type: 'mean',
  location: 'Tehran',
  ephemeris_engine: 'Swiss Ephemeris',
  coordinate_source: 'selected_city_coordinates',
};

afterEach(() => {
  cleanup();
});

describe('FaChartConfirmModal', () => {
  it('renders Persian confirmation with timezone and coordinates', () => {
    render(
      <FaChartConfirmModal summary={baseSummary} onConfirm={vi.fn()} onEdit={vi.fn()} />
    );
    expect(screen.getByTestId('fa-confirm-timezone').textContent).toBe('Asia/Tehran');
    expect(screen.getByTestId('fa-confirm-coordinates').textContent).toContain('35.689252°');
    expect(screen.getByTestId('fa-confirm-coordinates').textContent).toContain('51.389600°');
  });

  it('shows resolving text while geocoding', () => {
    render(
      <FaChartConfirmModal
        summary={{ ...baseSummary, timezone: null, coordinates: null, resolving: true }}
        onConfirm={vi.fn()}
        onEdit={vi.fn()}
      />
    );
    expect(screen.getByTestId('fa-confirm-timezone').textContent).toContain('در حال دریافت');
    expect(screen.getByTestId('fa-confirm-coordinates').textContent).toContain('در حال دریافت');
  });

  it('confirm button triggers onConfirm', () => {
    const onConfirm = vi.fn();
    render(
      <FaChartConfirmModal summary={baseSummary} onConfirm={onConfirm} onEdit={vi.fn()} />
    );
    fireEvent.click(screen.getByTestId('fa-chart-confirm-submit'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('edit button triggers onEdit without confirm', () => {
    const onConfirm = vi.fn();
    const onEdit = vi.fn();
    render(
      <FaChartConfirmModal summary={baseSummary} onConfirm={onConfirm} onEdit={onEdit} />
    );
    fireEvent.click(screen.getByTestId('fa-chart-confirm-edit'));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('shows updated geocode fallback warning in Persian', () => {
    render(
      <FaChartConfirmModal
        summary={{ ...baseSummary, showGeocodeWarning: true }}
        onConfirm={vi.fn()}
        onEdit={vi.fn()}
      />
    );
    expect(screen.getByTestId('fa-geocode-warning')).toBeTruthy();
    expect(screen.getByText(/مختصات و منطقه زمانی شهر از پایگاه داده جغرافیایی/)).toBeTruthy();
  });
});

describe('ChartDevPanel', () => {
  it('renders translated Persian labels', () => {
    render(<ChartDevPanel chart={sampleChart} lang="fa" />);
    expect(screen.getByTestId('dev-panel-title').textContent).toBe('اطلاعات توسعه‌دهنده');
    expect(screen.getByText('شهر')).toBeTruthy();
    expect(screen.getByText('منطقه زمانی')).toBeTruthy();
    expect(screen.getByText('عرض جغرافیایی')).toBeTruthy();
  });

  it('renders each field on its own row without inline overlap', () => {
    render(<ChartDevPanel chart={sampleChart} lang="en" />);
    const rows = screen.getAllByTestId('dev-panel-row');
    expect(rows.length).toBeGreaterThan(10);
    rows.forEach((row) => {
      const label = row.querySelector('div:first-child');
      const value = row.querySelector('div:last-child');
      expect(label).toBeTruthy();
      expect(value).toBeTruthy();
      expect(label!.textContent).not.toContain(value!.textContent!.slice(0, 8));
    });
  });
});

describe('ChartDevPanelGate', () => {
  it('does not render in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { ChartDevPanelGate } = await import('@/components/ChartDevPanelGate');
    const { container } = render(<ChartDevPanelGate chart={sampleChart} lang="fa" />);
    expect(container.firstChild).toBeNull();
    vi.unstubAllEnvs();
  });
});

describe('CalculationDetails', () => {
  it('renders basic and advanced sections for Persian RTL', async () => {
    const { CalculationDetails } = await import('@/components/CalculationDetails');
    render(<CalculationDetails chart={sampleChart} lang="fa" />);
    const root = screen.getByTestId('calculation-details');
    expect(root.getAttribute('dir')).toBe('rtl');

    fireEvent.click(screen.getByRole('button', { name: /جزئیات محاسبه/i }));
    const basic = screen.getByTestId('calculation-details-basic');
    expect(basic.textContent).toContain('منطقه زمانی');

    fireEvent.click(screen.getByRole('button', { name: /نمایش جزئیات فنی/i }));
    const advanced = screen.getByTestId('calculation-details-advanced');
    expect(advanced.textContent).toContain('تبدیل به UTC');
  });
});

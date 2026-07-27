import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  FTUE_MOCK_LIVING_PLACES,
  FTUE_NOTIFICATIONS_PATH,
  LivingLocationScreen,
  filterMockLivingPlaces,
  formatMockLivingPlace,
  validateLivingLocation,
} from '@/components/ftue/LivingLocationScreen';
import { FTUE_MOCK_BIRTH_PLACES } from '@/components/ftue/BirthPlaceScreen';
import { LIVING_LOCATION_COPY, LIVING_LOCATION_LANGS } from '@/lib/ftue-i18n';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

describe('filterMockLivingPlaces / validateLivingLocation', () => {
  it('filters by city or country without network', () => {
    const hits = filterMockLivingPlaces('lond');
    expect(hits.some((p) => p.id === 'london-gb')).toBe(true);
    expect(filterMockLivingPlaces('')).toEqual([]);
  });

  it('requires a selected mock place', () => {
    expect(validateLivingLocation(null)).toBe('required');
    expect(validateLivingLocation(FTUE_MOCK_LIVING_PLACES[0]!)).toBeNull();
  });

  it('includes valid latitude and longitude on every living mock place', () => {
    expect(FTUE_MOCK_LIVING_PLACES.length).toBeGreaterThan(0);
    for (const place of FTUE_MOCK_LIVING_PLACES) {
      expect(Number.isFinite(place.latitude)).toBe(true);
      expect(Number.isFinite(place.longitude)).toBe(true);
      expect(place.latitude).toBeGreaterThanOrEqual(-90);
      expect(place.latitude).toBeLessThanOrEqual(90);
      expect(place.longitude).toBeGreaterThanOrEqual(-180);
      expect(place.longitude).toBeLessThanOrEqual(180);
    }
  });
});

describe('LivingLocationScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    push.mockClear();
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders PRD title, description, and search field', async () => {
    render(<LivingLocationScreen />);
    expect(
      await screen.findByRole('heading', { name: LIVING_LOCATION_COPY.title })
    ).toBeTruthy();
    expect(screen.getByText(LIVING_LOCATION_COPY.description)).toBeTruthy();
    expect(screen.getByLabelText(LIVING_LOCATION_COPY.searchLabel)).toBeTruthy();
  });

  it('shows city and country in mock suggestions', async () => {
    render(<LivingLocationScreen />);
    const input = await screen.findByLabelText(LIVING_LOCATION_COPY.searchLabel);
    fireEvent.change(input, { target: { value: 'Dubai' } });
    expect(await screen.findByText('Dubai')).toBeTruthy();
    expect(screen.getByText('United Arab Emirates')).toBeTruthy();
  });

  it('blocks continue until a list city is selected', async () => {
    render(<LivingLocationScreen />);
    const input = await screen.findByLabelText(LIVING_LOCATION_COPY.searchLabel);
    fireEvent.change(input, { target: { value: 'Dubai' } });
    fireEvent.click(
      screen.getByRole('button', { name: LIVING_LOCATION_COPY.continue })
    );
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      LIVING_LOCATION_COPY.errors.required
    );
    expect(push).not.toHaveBeenCalled();
  });

  it('selects a mock city and navigates to Notifications', async () => {
    render(<LivingLocationScreen />);
    const input = await screen.findByLabelText(LIVING_LOCATION_COPY.searchLabel);
    fireEvent.change(input, { target: { value: 'London' } });
    fireEvent.click(await screen.findByRole('button', { name: /London/i }));
    expect(input).toHaveProperty(
      'value',
      formatMockLivingPlace(
        FTUE_MOCK_LIVING_PLACES.find((p) => p.id === 'london-gb')!
      )
    );
    fireEvent.click(
      screen.getByRole('button', { name: LIVING_LOCATION_COPY.continue })
    );
    expect(push).toHaveBeenCalledWith(FTUE_NOTIFICATIONS_PATH);
  });

  it('clears a stale selection when the query is edited after select', async () => {
    render(<LivingLocationScreen />);
    const input = await screen.findByLabelText(LIVING_LOCATION_COPY.searchLabel);
    fireEvent.change(input, { target: { value: 'London' } });
    fireEvent.click(await screen.findByRole('button', { name: /London/i }));
    expect(
      screen.getByText(`${LIVING_LOCATION_COPY.selectedLabel}: London, United Kingdom`)
    ).toBeTruthy();

    fireEvent.change(input, { target: { value: 'London, United Kingdo' } });
    expect(
      screen.queryByText(
        `${LIVING_LOCATION_COPY.selectedLabel}: London, United Kingdom`
      )
    ).toBeNull();

    fireEvent.click(
      screen.getByRole('button', { name: LIVING_LOCATION_COPY.continue })
    );
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      LIVING_LOCATION_COPY.errors.required
    );
    expect(push).not.toHaveBeenCalled();
  });

  it('fires ftue_livinglocation_set without location-identifying payload', async () => {
    render(<LivingLocationScreen />);
    const input = await screen.findByLabelText(LIVING_LOCATION_COPY.searchLabel);
    fireEvent.change(input, { target: { value: 'London' } });
    fireEvent.click(await screen.findByRole('button', { name: /London/i }));
    fireEvent.click(
      screen.getByRole('button', { name: LIVING_LOCATION_COPY.continue })
    );

    await waitFor(() => {
      const raw = localStorage.getItem('planet-life-ftue-events');
      expect(raw).toBeTruthy();
      const queue = JSON.parse(raw!) as Array<{
        event: string;
        properties: Record<string, unknown>;
      }>;
      const hit = queue.find((e) => e.event === 'ftue_livinglocation_set');
      expect(hit).toBeTruthy();
      expect(hit?.properties).not.toHaveProperty('placeId');
      expect(hit?.properties).not.toHaveProperty('city');
      expect(hit?.properties).not.toHaveProperty('country');
      expect(hit?.properties).not.toHaveProperty('latitude');
      expect(hit?.properties).not.toHaveProperty('longitude');
      expect(hit?.properties).not.toHaveProperty('query');
      expect(JSON.stringify(hit?.properties)).not.toContain('london-gb');
      expect(JSON.stringify(hit?.properties)).not.toContain('51.5074');
    });
  });

  it('does not render coordinates in the UI', async () => {
    render(<LivingLocationScreen />);
    const input = await screen.findByLabelText(LIVING_LOCATION_COPY.searchLabel);
    fireEvent.change(input, { target: { value: 'London' } });
    fireEvent.click(await screen.findByRole('button', { name: /London/i }));
    expect(screen.queryByText(/51\.5074/)).toBeNull();
    expect(screen.queryByText(/-0\.1278/)).toBeNull();
  });

  it('navigates back to Birth Place', async () => {
    render(<LivingLocationScreen />);
    fireEvent.click(
      await screen.findByRole('button', { name: LIVING_LOCATION_COPY.back })
    );
    expect(push).toHaveBeenCalledWith('/onboarding/birth-place');
  });

  it('applies RTL for Persian', async () => {
    localStorage.setItem('planet-life-lang', 'fa');
    const { container } = render(<LivingLocationScreen />);
    await screen.findByRole('heading', { name: LIVING_LOCATION_LANGS.fa.title });
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.direction).toBe('rtl');
  });

  it('keeps living-location mocks independent from birth-place mocks', () => {
    expect(FTUE_MOCK_LIVING_PLACES).not.toBe(FTUE_MOCK_BIRTH_PLACES);
  });
});

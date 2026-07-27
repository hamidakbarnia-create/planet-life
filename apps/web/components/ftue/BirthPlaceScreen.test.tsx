import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  BirthPlaceScreen,
  FTUE_LIVING_LOCATION_PATH,
  FTUE_MOCK_BIRTH_PLACES,
  filterMockBirthPlaces,
  formatMockBirthPlace,
  validateBirthPlace,
} from '@/components/ftue/BirthPlaceScreen';
import { BIRTH_PLACE_COPY, BIRTH_PLACE_LANGS } from '@/lib/ftue-i18n';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

describe('filterMockBirthPlaces / validateBirthPlace', () => {
  it('filters by city or country without network', () => {
    const hits = filterMockBirthPlaces('tehr');
    expect(hits.some((p) => p.id === 'tehran-ir')).toBe(true);
    expect(filterMockBirthPlaces('united arab').length).toBeGreaterThan(0);
    expect(filterMockBirthPlaces('')).toEqual([]);
  });

  it('requires a selected mock place', () => {
    expect(validateBirthPlace(null)).toBe('required');
    expect(validateBirthPlace(FTUE_MOCK_BIRTH_PLACES[0]!)).toBeNull();
  });

  it('includes valid latitude and longitude on every mock place', () => {
    expect(FTUE_MOCK_BIRTH_PLACES.length).toBeGreaterThan(0);
    for (const place of FTUE_MOCK_BIRTH_PLACES) {
      expect(Number.isFinite(place.latitude)).toBe(true);
      expect(Number.isFinite(place.longitude)).toBe(true);
      expect(place.latitude).toBeGreaterThanOrEqual(-90);
      expect(place.latitude).toBeLessThanOrEqual(90);
      expect(place.longitude).toBeGreaterThanOrEqual(-180);
      expect(place.longitude).toBeLessThanOrEqual(180);
    }
  });
});

describe('BirthPlaceScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    push.mockClear();
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders title, description, and search field', async () => {
    render(<BirthPlaceScreen />);
    expect(
      await screen.findByRole('heading', { name: BIRTH_PLACE_COPY.title })
    ).toBeTruthy();
    expect(screen.getByText(BIRTH_PLACE_COPY.description)).toBeTruthy();
    expect(screen.getByLabelText(BIRTH_PLACE_COPY.searchLabel)).toBeTruthy();
  });

  it('shows city and country in mock suggestions', async () => {
    render(<BirthPlaceScreen />);
    const input = await screen.findByLabelText(BIRTH_PLACE_COPY.searchLabel);
    fireEvent.change(input, { target: { value: 'Dubai' } });
    expect(await screen.findByText('Dubai')).toBeTruthy();
    expect(screen.getByText('United Arab Emirates')).toBeTruthy();
  });

  it('blocks continue until a list city is selected', async () => {
    render(<BirthPlaceScreen />);
    const input = await screen.findByLabelText(BIRTH_PLACE_COPY.searchLabel);
    fireEvent.change(input, { target: { value: 'Dubai' } });
    fireEvent.click(screen.getByRole('button', { name: BIRTH_PLACE_COPY.continue }));
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      BIRTH_PLACE_COPY.errors.required
    );
    expect(push).not.toHaveBeenCalled();
  });

  it('selects a mock city and navigates to Living Location', async () => {
    render(<BirthPlaceScreen />);
    const input = await screen.findByLabelText(BIRTH_PLACE_COPY.searchLabel);
    fireEvent.change(input, { target: { value: 'Tehran' } });
    fireEvent.click(await screen.findByRole('button', { name: /Tehran/i }));
    expect(input).toHaveProperty('value', formatMockBirthPlace(FTUE_MOCK_BIRTH_PLACES[0]!));
    fireEvent.click(screen.getByRole('button', { name: BIRTH_PLACE_COPY.continue }));
    expect(push).toHaveBeenCalledWith(FTUE_LIVING_LOCATION_PATH);
  });

  it('clears a stale selection when the query is edited after select', async () => {
    render(<BirthPlaceScreen />);
    const input = await screen.findByLabelText(BIRTH_PLACE_COPY.searchLabel);
    fireEvent.change(input, { target: { value: 'Tehran' } });
    fireEvent.click(await screen.findByRole('button', { name: /Tehran/i }));
    expect(
      screen.getByText(`${BIRTH_PLACE_COPY.selectedLabel}: Tehran, Iran`)
    ).toBeTruthy();

    fireEvent.change(input, { target: { value: 'Tehran, Ira' } });
    expect(
      screen.queryByText(`${BIRTH_PLACE_COPY.selectedLabel}: Tehran, Iran`)
    ).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: BIRTH_PLACE_COPY.continue }));
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      BIRTH_PLACE_COPY.errors.required
    );
    expect(push).not.toHaveBeenCalled();
  });

  it('fires ftue_birthplace_set without placeId or location payload', async () => {
    render(<BirthPlaceScreen />);
    const input = await screen.findByLabelText(BIRTH_PLACE_COPY.searchLabel);
    fireEvent.change(input, { target: { value: 'Tehran' } });
    fireEvent.click(await screen.findByRole('button', { name: /Tehran/i }));
    fireEvent.click(screen.getByRole('button', { name: BIRTH_PLACE_COPY.continue }));

    await waitFor(() => {
      const raw = localStorage.getItem('planet-life-ftue-events');
      expect(raw).toBeTruthy();
      const queue = JSON.parse(raw!) as Array<{
        event: string;
        properties: Record<string, unknown>;
      }>;
      const hit = queue.find((e) => e.event === 'ftue_birthplace_set');
      expect(hit).toBeTruthy();
      expect(hit?.properties).not.toHaveProperty('placeId');
      expect(hit?.properties).not.toHaveProperty('city');
      expect(hit?.properties).not.toHaveProperty('country');
      expect(hit?.properties).not.toHaveProperty('latitude');
      expect(hit?.properties).not.toHaveProperty('longitude');
      expect(hit?.properties).not.toHaveProperty('lat');
      expect(hit?.properties).not.toHaveProperty('lng');
      expect(JSON.stringify(hit?.properties)).not.toContain('tehran-ir');
      expect(JSON.stringify(hit?.properties)).not.toContain('35.6892');
    });
  });

  it('does not render coordinates in the UI', async () => {
    render(<BirthPlaceScreen />);
    const input = await screen.findByLabelText(BIRTH_PLACE_COPY.searchLabel);
    fireEvent.change(input, { target: { value: 'Tehran' } });
    fireEvent.click(await screen.findByRole('button', { name: /Tehran/i }));
    expect(screen.queryByText(/35\.6892/)).toBeNull();
    expect(screen.queryByText(/51\.389/)).toBeNull();
  });

  it('navigates back to Birth Time', async () => {
    render(<BirthPlaceScreen />);
    fireEvent.click(
      await screen.findByRole('button', { name: BIRTH_PLACE_COPY.back })
    );
    expect(push).toHaveBeenCalledWith('/onboarding/birth-time');
  });

  it('renders Russian copy when ru is selected', async () => {
    localStorage.setItem('planet-life-lang', 'ru');
    render(<BirthPlaceScreen />);
    const ru = BIRTH_PLACE_LANGS.ru;
    expect(await screen.findByRole('heading', { name: ru.title })).toBeTruthy();
  });

  it('applies RTL for Arabic', async () => {
    localStorage.setItem('planet-life-lang', 'ar');
    const { container } = render(<BirthPlaceScreen />);
    await screen.findByRole('heading', { name: BIRTH_PLACE_LANGS.ar.title });
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.direction).toBe('rtl');
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  BirthDateScreen,
  FTUE_BIRTH_TIME_PATH,
  getBirthDateInputBounds,
  validateBirthDate,
} from '@/components/ftue/BirthDateScreen';
import { BIRTH_DATE_COPY, BIRTH_DATE_LANGS } from '@/lib/ftue-i18n';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

describe('validateBirthDate', () => {
  const now = new Date(2026, 6, 27, 12, 0, 0, 0);

  it('requires a value', () => {
    expect(validateBirthDate('', now)).toBe('required');
  });

  it('rejects non-calendar dates', () => {
    expect(validateBirthDate('2024-02-31', now)).toBe('invalid');
    expect(validateBirthDate('06/15/1990', now)).toBe('invalid');
  });

  it('rejects future dates', () => {
    expect(validateBirthDate('2099-01-01', now)).toBe('future');
  });

  it('rejects dates older than the reasonable max age', () => {
    expect(validateBirthDate('1800-01-01', now)).toBe('tooOld');
  });

  it('accepts a valid past date within bounds', () => {
    expect(validateBirthDate('1990-06-15', now)).toBeNull();
  });
});

describe('BirthDateScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    push.mockClear();
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders PRD title, description, and date input', async () => {
    render(<BirthDateScreen />);
    expect(
      await screen.findByRole('heading', { name: BIRTH_DATE_COPY.title })
    ).toBeTruthy();
    expect(screen.getByText(BIRTH_DATE_COPY.description)).toBeTruthy();
    const input = screen.getByLabelText(BIRTH_DATE_COPY.dateLabel);
    expect(input.getAttribute('type')).toBe('date');
    const bounds = getBirthDateInputBounds();
    expect(input.getAttribute('min')).toBe(bounds.min);
    expect(input.getAttribute('max')).toBe(bounds.max);
  });

  it('shows validation error when Continue is pressed empty', async () => {
    render(<BirthDateScreen />);
    fireEvent.click(
      await screen.findByRole('button', { name: BIRTH_DATE_COPY.continue })
    );
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      BIRTH_DATE_COPY.errors.required
    );
    expect(push).not.toHaveBeenCalled();
  });

  it('sets birth date analytics and navigates to Birth Time on valid continue', async () => {
    render(<BirthDateScreen />);
    const input = await screen.findByLabelText(BIRTH_DATE_COPY.dateLabel);
    fireEvent.change(input, { target: { value: '1990-06-15' } });
    fireEvent.click(screen.getByRole('button', { name: BIRTH_DATE_COPY.continue }));
    expect(push).toHaveBeenCalledWith(FTUE_BIRTH_TIME_PATH);
    await waitFor(() => {
      const queue = localStorage.getItem('planet-life-ftue-events') ?? '';
      expect(queue).toContain('ftue_birthdate_set');
    });
  });

  it('navigates back to Decision Profile', async () => {
    render(<BirthDateScreen />);
    fireEvent.click(
      await screen.findByRole('button', { name: BIRTH_DATE_COPY.back })
    );
    expect(push).toHaveBeenCalledWith('/onboarding/intent');
  });

  it('renders Arabic copy and RTL direction when ar is selected', async () => {
    localStorage.setItem('planet-life-lang', 'ar');
    const { container } = render(<BirthDateScreen />);
    const ar = BIRTH_DATE_LANGS.ar;
    expect(await screen.findByRole('heading', { name: ar.title })).toBeTruthy();
    expect(screen.getByText(ar.description)).toBeTruthy();
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.direction).toBe('rtl');
  });
});

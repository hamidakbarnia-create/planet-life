import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  BirthTimeScreen,
  FTUE_BIRTH_PLACE_PATH,
  validateBirthTime,
} from '@/components/ftue/BirthTimeScreen';
import { BIRTH_TIME_COPY, BIRTH_TIME_LANGS } from '@/lib/ftue-i18n';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

describe('validateBirthTime', () => {
  it('requires an accuracy choice', () => {
    expect(validateBirthTime(null, '')).toBe('accuracyRequired');
  });

  it('requires a valid time for exact and approximate', () => {
    expect(validateBirthTime('exact', '')).toBe('timeRequired');
    expect(validateBirthTime('approximate', '25:99')).toBe('timeInvalid');
    expect(validateBirthTime('exact', '14:30')).toBeNull();
  });

  it('allows unknown without a time', () => {
    expect(validateBirthTime('unknown', '')).toBeNull();
  });
});

describe('BirthTimeScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    push.mockClear();
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders the PRD title and accuracy options', async () => {
    render(<BirthTimeScreen />);
    expect(
      await screen.findByRole('heading', { name: BIRTH_TIME_COPY.title })
    ).toBeTruthy();
    expect(screen.getByRole('radio', { name: BIRTH_TIME_COPY.exact })).toBeTruthy();
    expect(
      screen.getByRole('radio', { name: BIRTH_TIME_COPY.approximate })
    ).toBeTruthy();
    expect(screen.getByRole('radio', { name: BIRTH_TIME_COPY.unknown })).toBeTruthy();
  });

  it('shows time entry and tolerance note for Approximate', async () => {
    render(<BirthTimeScreen />);
    fireEvent.click(
      await screen.findByRole('radio', { name: BIRTH_TIME_COPY.approximate })
    );
    expect(screen.getByText(BIRTH_TIME_COPY.approximateNote)).toBeTruthy();
    expect(screen.getByLabelText(BIRTH_TIME_COPY.timeLabel)).toBeTruthy();
  });

  it('shows reassurance and no time field for I do not know', async () => {
    render(<BirthTimeScreen />);
    fireEvent.click(
      await screen.findByRole('radio', { name: BIRTH_TIME_COPY.unknown })
    );
    expect(screen.getByText(BIRTH_TIME_COPY.unknownReassurance)).toBeTruthy();
    expect(screen.queryByLabelText(BIRTH_TIME_COPY.timeLabel)).toBeNull();
  });

  it('tracks ftue_birthtime_set with accuracy and navigates on Exact continue', async () => {
    render(<BirthTimeScreen />);
    fireEvent.click(
      await screen.findByRole('radio', { name: BIRTH_TIME_COPY.exact })
    );
    fireEvent.change(screen.getByLabelText(BIRTH_TIME_COPY.timeLabel), {
      target: { value: '08:15' },
    });
    fireEvent.click(screen.getByRole('button', { name: BIRTH_TIME_COPY.continue }));
    expect(push).toHaveBeenCalledWith(FTUE_BIRTH_PLACE_PATH);
    await waitFor(() => {
      const queue = localStorage.getItem('planet-life-ftue-events') ?? '';
      expect(queue).toContain('ftue_birthtime_set');
      expect(queue).toContain('"accuracy":"exact"');
    });
  });

  it('tracks ftue_birthtime_unknown and navigates without time', async () => {
    render(<BirthTimeScreen />);
    fireEvent.click(
      await screen.findByRole('radio', { name: BIRTH_TIME_COPY.unknown })
    );
    fireEvent.click(screen.getByRole('button', { name: BIRTH_TIME_COPY.continue }));
    expect(push).toHaveBeenCalledWith(FTUE_BIRTH_PLACE_PATH);
    await waitFor(() => {
      const queue = localStorage.getItem('planet-life-ftue-events') ?? '';
      expect(queue).toContain('ftue_birthtime_unknown');
    });
  });

  it('shows an error when Exact is chosen without a time', async () => {
    render(<BirthTimeScreen />);
    fireEvent.click(
      await screen.findByRole('radio', { name: BIRTH_TIME_COPY.exact })
    );
    fireEvent.click(screen.getByRole('button', { name: BIRTH_TIME_COPY.continue }));
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      BIRTH_TIME_COPY.errors.timeRequired
    );
    expect(push).not.toHaveBeenCalled();
  });

  it('renders Persian copy and RTL when fa is selected', async () => {
    localStorage.setItem('planet-life-lang', 'fa');
    const { container } = render(<BirthTimeScreen />);
    const fa = BIRTH_TIME_LANGS.fa;
    expect(await screen.findByRole('heading', { name: fa.title })).toBeTruthy();
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.direction).toBe('rtl');
  });
});

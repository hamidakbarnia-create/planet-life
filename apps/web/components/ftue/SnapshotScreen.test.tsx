import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SnapshotScreen } from '@/components/ftue/SnapshotScreen';
import { SNAPSHOT_COPY, SNAPSHOT_LANGS } from '@/lib/ftue-i18n';
import { isFtueComplete } from '@/lib/ftue-storage';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

describe('SnapshotScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    push.mockClear();
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders PRD progress acknowledgement only', async () => {
    render(<SnapshotScreen />);
    expect(
      await screen.findByRole('heading', { name: SNAPSHOT_COPY.title })
    ).toBeTruthy();
    for (const item of SNAPSHOT_COPY.checklist) {
      expect(screen.getByText(item)).toBeTruthy();
    }
    expect(screen.getByText(SNAPSHOT_COPY.done)).toBeTruthy();
    expect(
      screen.getByRole('button', { name: SNAPSHOT_COPY.continueToToday })
    ).toBeTruthy();
    expect(screen.queryByText(/edit/i)).toBeNull();
    expect(screen.queryByText(/not set/i)).toBeNull();
    expect(isFtueComplete()).toBe(false);
  });

  it('fires ftue_snapshot_view on render without completing FTUE', async () => {
    render(<SnapshotScreen />);
    await screen.findByRole('heading', { name: SNAPSHOT_COPY.title });
    await waitFor(() => {
      const raw = localStorage.getItem('planet-life-ftue-events');
      expect(raw).toBeTruthy();
      const queue = JSON.parse(raw!) as Array<{
        event: string;
        properties: Record<string, unknown>;
      }>;
      expect(queue.some((e) => e.event === 'ftue_snapshot_view')).toBe(true);
      expect(queue.some((e) => e.event === 'ftue_complete')).toBe(false);
      expect(queue.some((e) => e.event === 'ftue_to_today')).toBe(false);
    });
    expect(isFtueComplete()).toBe(false);
  });

  it('completes only on Continue to Today with no personal analytics payload', async () => {
    render(<SnapshotScreen />);
    fireEvent.click(
      await screen.findByRole('button', { name: SNAPSHOT_COPY.continueToToday })
    );

    expect(isFtueComplete()).toBe(true);
    expect(push).toHaveBeenCalledWith('/home');

    await waitFor(() => {
      const raw = localStorage.getItem('planet-life-ftue-events');
      const queue = JSON.parse(raw!) as Array<{
        event: string;
        properties: Record<string, unknown>;
      }>;
      const complete = queue.find((e) => e.event === 'ftue_complete');
      const toToday = queue.find((e) => e.event === 'ftue_to_today');
      expect(complete).toBeTruthy();
      expect(toToday).toBeTruthy();
      expect(complete?.properties).not.toHaveProperty('goals');
      expect(complete?.properties).not.toHaveProperty('birthDate');
      expect(complete?.properties).not.toHaveProperty('birthPlace');
      expect(toToday?.properties).not.toHaveProperty('goals');
    });
  });

  it('navigates back to Notifications', async () => {
    render(<SnapshotScreen />);
    fireEvent.click(
      await screen.findByRole('button', { name: SNAPSHOT_COPY.back })
    );
    expect(push).toHaveBeenCalledWith('/onboarding/notifications');
  });

  it('applies RTL for Arabic', async () => {
    localStorage.setItem('planet-life-lang', 'ar');
    const { container } = render(<SnapshotScreen />);
    await screen.findByRole('heading', { name: SNAPSHOT_LANGS.ar.title });
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.direction).toBe('rtl');
  });
});

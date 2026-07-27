import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  FTUE_SNAPSHOT_PATH,
  NotificationsScreen,
} from '@/components/ftue/NotificationsScreen';
import {
  FTUE_NOTIFICATION_IDS,
  NOTIFICATIONS_COPY,
  NOTIFICATIONS_LANGS,
} from '@/lib/ftue-i18n';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

describe('NotificationsScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    push.mockClear();
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders the PRD prompt and all five preference options unselected by default', async () => {
    render(<NotificationsScreen />);
    expect(
      await screen.findByRole('heading', { name: NOTIFICATIONS_COPY.prompt })
    ).toBeTruthy();
    for (const id of FTUE_NOTIFICATION_IDS) {
      const btn = screen.getByRole('button', {
        name: NOTIFICATIONS_COPY.options[id],
      });
      expect(btn.getAttribute('aria-pressed')).toBe('false');
    }
    expect(
      screen.getByRole('button', { name: NOTIFICATIONS_COPY.continue })
    ).toHaveProperty('disabled', true);
  });

  it('toggles selected and unselected states', async () => {
    render(<NotificationsScreen />);
    const windows = await screen.findByRole('button', {
      name: NOTIFICATIONS_COPY.options.decision_windows,
    });
    fireEvent.click(windows);
    expect(windows.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(windows);
    expect(windows.getAttribute('aria-pressed')).toBe('false');
  });

  it('continues with stable choice keys and navigates to Snapshot', async () => {
    render(<NotificationsScreen />);
    fireEvent.click(
      await screen.findByRole('button', {
        name: NOTIFICATIONS_COPY.options.decision_windows,
      })
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: NOTIFICATIONS_COPY.options.weekly_summary,
      })
    );
    fireEvent.click(
      screen.getByRole('button', { name: NOTIFICATIONS_COPY.continue })
    );
    expect(push).toHaveBeenCalledWith(FTUE_SNAPSHOT_PATH);

    await waitFor(() => {
      const raw = localStorage.getItem('planet-life-ftue-events');
      expect(raw).toBeTruthy();
      const queue = JSON.parse(raw!) as Array<{
        event: string;
        properties: Record<string, unknown>;
      }>;
      const hit = queue.find((e) => e.event === 'ftue_notifications_select');
      expect(hit).toBeTruthy();
      expect(hit?.properties.choices).toEqual(
        expect.arrayContaining(['decision_windows', 'weekly_summary'])
      );
      expect(JSON.stringify(hit?.properties)).not.toContain(
        'Best decision windows'
      );
      expect(JSON.stringify(hit?.properties)).not.toContain('Weekly summary');
    });
  });

  it('allows Skip with zero selections', async () => {
    render(<NotificationsScreen />);
    fireEvent.click(
      await screen.findByRole('button', { name: NOTIFICATIONS_COPY.skip })
    );
    expect(push).toHaveBeenCalledWith(FTUE_SNAPSHOT_PATH);
    await waitFor(() => {
      const queue = localStorage.getItem('planet-life-ftue-events') ?? '';
      expect(queue).toContain('ftue_notifications_skip');
    });
  });

  it('navigates back to Living Location', async () => {
    render(<NotificationsScreen />);
    fireEvent.click(
      await screen.findByRole('button', { name: NOTIFICATIONS_COPY.back })
    );
    expect(push).toHaveBeenCalledWith('/onboarding/living-location');
  });

  it('applies RTL for Arabic', async () => {
    localStorage.setItem('planet-life-lang', 'ar');
    const { container } = render(<NotificationsScreen />);
    await screen.findByRole('heading', {
      name: NOTIFICATIONS_LANGS.ar.prompt,
    });
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.direction).toBe('rtl');
  });

  it('does not call browser notification permission APIs', async () => {
    const requestPermission = vi.fn();
    Object.defineProperty(globalThis, 'Notification', {
      configurable: true,
      value: { requestPermission },
    });

    render(<NotificationsScreen />);
    fireEvent.click(
      await screen.findByRole('button', {
        name: NOTIFICATIONS_COPY.options.calendar_reminders,
      })
    );
    fireEvent.click(
      screen.getByRole('button', { name: NOTIFICATIONS_COPY.continue })
    );

    expect(requestPermission).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith(FTUE_SNAPSHOT_PATH);
  });
});

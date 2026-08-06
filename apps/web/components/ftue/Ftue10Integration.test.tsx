import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentType } from 'react';
import { BirthDateScreen } from '@/components/ftue/BirthDateScreen';
import {
  BirthPlaceScreen,
  FTUE_MOCK_BIRTH_PLACES,
} from '@/components/ftue/BirthPlaceScreen';
import { BirthTimeScreen } from '@/components/ftue/BirthTimeScreen';
import { DecisionProfileScreen } from '@/components/ftue/DecisionProfileScreen';
import { GoalSelectionScreen } from '@/components/ftue/GoalSelectionScreen';
import {
  FTUE_MOCK_LIVING_PLACES,
  LivingLocationScreen,
} from '@/components/ftue/LivingLocationScreen';
import { NotificationsScreen } from '@/components/ftue/NotificationsScreen';
import { SnapshotScreen } from '@/components/ftue/SnapshotScreen';
import { WelcomeScreen } from '@/components/ftue/WelcomeScreen';
import { readFtueEventQueue } from '@/lib/ftue-analytics';
import {
  BIRTH_DATE_COPY,
  BIRTH_PLACE_COPY,
  BIRTH_TIME_COPY,
  DECISION_PROFILE_COPY,
  GOAL_SELECTION_COPY,
  LIVING_LOCATION_COPY,
  NOTIFICATIONS_COPY,
  SNAPSHOT_COPY,
  WELCOME_COPY,
} from '@/lib/ftue-i18n';
import {
  clearFtueComplete,
  clearFtueDraft,
  ftueTodayPath,
  isFtueComplete,
  loadFtueDraft,
  markFtueComplete,
  updateFtueDraft,
} from '@/lib/ftue-storage';

const push = vi.fn();
const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
}));

/** Accepted FTUE v2 forward route graph (PRD-001 §8 / FTUE-10). */
const FTUE_FORWARD_ROUTES = [
  '/welcome',
  '/onboarding/goal',
  '/onboarding/intent',
  '/onboarding/birth-date',
  '/onboarding/birth-time',
  '/onboarding/birth-place',
  '/onboarding/living-location',
  '/onboarding/notifications',
  '/onboarding/snapshot',
  '/home',
] as const;

const FTUE_BACK_ROUTES: Record<string, string> = {
  '/onboarding/goal': '/welcome',
  '/onboarding/intent': '/onboarding/goal',
  '/onboarding/birth-date': '/onboarding/intent',
  '/onboarding/birth-time': '/onboarding/birth-date',
  '/onboarding/birth-place': '/onboarding/birth-time',
  '/onboarding/living-location': '/onboarding/birth-place',
  '/onboarding/notifications': '/onboarding/living-location',
  '/onboarding/snapshot': '/onboarding/notifications',
};

describe('FTUE-10 integration hardening', () => {
  beforeEach(() => {
    localStorage.clear();
    push.mockClear();
    replace.mockClear();
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    clearFtueDraft();
    clearFtueComplete();
  });

  it('defines the accepted forward route sequence', () => {
    expect(FTUE_FORWARD_ROUTES).toEqual([
      '/welcome',
      '/onboarding/goal',
      '/onboarding/intent',
      '/onboarding/birth-date',
      '/onboarding/birth-time',
      '/onboarding/birth-place',
      '/onboarding/living-location',
      '/onboarding/notifications',
      '/onboarding/snapshot',
      '/home',
    ]);
    expect(ftueTodayPath()).toBe('/home');
  });

  it('wires Continue destinations through the full forward chain', async () => {
    render(<WelcomeScreen />);
    fireEvent.click(await screen.findByRole('button', { name: WELCOME_COPY.start }));
    expect(push).toHaveBeenCalledWith('/onboarding/goal');
    cleanup();
    push.mockClear();

    render(<GoalSelectionScreen />);
    fireEvent.click(
      await screen.findByRole('button', { name: GOAL_SELECTION_COPY.goals.career })
    );
    fireEvent.click(
      screen.getByRole('button', { name: GOAL_SELECTION_COPY.continue })
    );
    expect(push).toHaveBeenCalledWith('/onboarding/intent');
    cleanup();
    push.mockClear();

    render(<DecisionProfileScreen />);
    fireEvent.click(
      await screen.findByRole('button', { name: DECISION_PROFILE_COPY.continue })
    );
    expect(push).toHaveBeenCalledWith('/onboarding/birth-date');
    cleanup();
    push.mockClear();

    render(<BirthDateScreen />);
    fireEvent.change(await screen.findByLabelText(BIRTH_DATE_COPY.dateLabel), {
      target: { value: '1990-06-15' },
    });
    fireEvent.click(screen.getByRole('button', { name: BIRTH_DATE_COPY.continue }));
    expect(push).toHaveBeenCalledWith('/onboarding/birth-time');
    cleanup();
    push.mockClear();

    render(<BirthTimeScreen />);
    fireEvent.click(
      await screen.findByRole('radio', { name: BIRTH_TIME_COPY.unknown })
    );
    fireEvent.click(screen.getByRole('button', { name: BIRTH_TIME_COPY.continue }));
    expect(push).toHaveBeenCalledWith('/onboarding/birth-place');
    cleanup();
    push.mockClear();

    render(<BirthPlaceScreen />);
    const bpInput = await screen.findByLabelText(BIRTH_PLACE_COPY.searchLabel);
    fireEvent.change(bpInput, { target: { value: 'Tehran' } });
    fireEvent.click(await screen.findByText('Tehran'));
    fireEvent.click(screen.getByRole('button', { name: BIRTH_PLACE_COPY.continue }));
    expect(push).toHaveBeenCalledWith('/onboarding/living-location');
    cleanup();
    push.mockClear();

    render(<LivingLocationScreen />);
    const llInput = await screen.findByLabelText(LIVING_LOCATION_COPY.searchLabel);
    fireEvent.change(llInput, { target: { value: 'Dubai' } });
    fireEvent.click(await screen.findByText('Dubai'));
    fireEvent.click(
      screen.getByRole('button', { name: LIVING_LOCATION_COPY.continue })
    );
    expect(push).toHaveBeenCalledWith('/onboarding/notifications');
    cleanup();
    push.mockClear();

    render(<NotificationsScreen />);
    fireEvent.click(
      await screen.findByRole('button', { name: NOTIFICATIONS_COPY.skip })
    );
    expect(push).toHaveBeenCalledWith('/onboarding/snapshot');
    cleanup();
    push.mockClear();

    render(<SnapshotScreen />);
    fireEvent.click(
      await screen.findByRole('button', { name: SNAPSHOT_COPY.continueToToday })
    );
    expect(push).toHaveBeenCalledWith('/home');
    expect(isFtueComplete()).toBe(true);
  });

  it('wires Back destinations correctly', async () => {
    const cases: Array<{
      Screen: ComponentType;
      backLabel: string;
      from: string;
    }> = [
      {
        Screen: GoalSelectionScreen,
        backLabel: GOAL_SELECTION_COPY.back,
        from: '/onboarding/goal',
      },
      {
        Screen: DecisionProfileScreen,
        backLabel: DECISION_PROFILE_COPY.back,
        from: '/onboarding/intent',
      },
      {
        Screen: BirthDateScreen,
        backLabel: BIRTH_DATE_COPY.back,
        from: '/onboarding/birth-date',
      },
      {
        Screen: BirthTimeScreen,
        backLabel: BIRTH_TIME_COPY.back,
        from: '/onboarding/birth-time',
      },
      {
        Screen: BirthPlaceScreen,
        backLabel: BIRTH_PLACE_COPY.back,
        from: '/onboarding/birth-place',
      },
      {
        Screen: LivingLocationScreen,
        backLabel: LIVING_LOCATION_COPY.back,
        from: '/onboarding/living-location',
      },
      {
        Screen: NotificationsScreen,
        backLabel: NOTIFICATIONS_COPY.back,
        from: '/onboarding/notifications',
      },
      {
        Screen: SnapshotScreen,
        backLabel: SNAPSHOT_COPY.back,
        from: '/onboarding/snapshot',
      },
    ];

    for (const { Screen, backLabel, from } of cases) {
      push.mockClear();
      render(<Screen />);
      fireEvent.click(await screen.findByRole('button', { name: backLabel }));
      expect(push).toHaveBeenCalledWith(FTUE_BACK_ROUTES[from]);
      cleanup();
    }
  });

  it('persists draft values across remount', async () => {
    updateFtueDraft({
      goals: ['career', 'timing'],
      birthDate: '1990-06-15',
      birthTimeAccuracy: 'exact',
      birthTime: '14:30',
      notifications: ['weekly_summary'],
      notificationsSkipped: false,
    });

    render(<GoalSelectionScreen />);
    expect(
      (await screen.findByRole('button', { name: GOAL_SELECTION_COPY.goals.career }))
        .getAttribute('aria-pressed')
    ).toBe('true');
    cleanup();

    render(<BirthDateScreen />);
    expect(
      ((await screen.findByLabelText(BIRTH_DATE_COPY.dateLabel)) as HTMLInputElement).value
    ).toBe('1990-06-15');
    cleanup();

    render(<BirthTimeScreen />);
    expect(
      (
        await screen.findByRole('radio', {
          name: BIRTH_TIME_COPY.exact,
        })
      ).getAttribute('aria-checked')
    ).toBe('true');
    expect(
      ((await screen.findByLabelText(BIRTH_TIME_COPY.timeLabel)) as HTMLInputElement)
        .value
    ).toBe('14:30');
  });

  it('keeps birth place and living location independent', () => {
    const birth = FTUE_MOCK_BIRTH_PLACES[0]!;
    const living = FTUE_MOCK_LIVING_PLACES.find((p) => p.id !== birth.id)!;

    updateFtueDraft({
      birthPlace: {
        id: birth.id,
        city: birth.city,
        country: birth.country,
        latitude: birth.latitude,
        longitude: birth.longitude,
      },
    });
    updateFtueDraft({
      livingLocation: {
        id: living.id,
        city: living.city,
        country: living.country,
        latitude: living.latitude,
        longitude: living.longitude,
      },
    });

    const draft = loadFtueDraft();
    expect(draft.birthPlace?.id).toBe(birth.id);
    expect(draft.livingLocation?.id).toBe(living.id);
    expect(draft.birthPlace?.id).not.toBe(draft.livingLocation?.id);

    updateFtueDraft({
      birthPlace: {
        id: 'other-birth',
        city: 'Other',
        country: 'X',
        latitude: 1,
        longitude: 2,
      },
    });
    expect(loadFtueDraft().livingLocation?.id).toBe(living.id);
  });

  it('preserves unknown birth time across navigation remount', async () => {
    render(<BirthTimeScreen />);
    fireEvent.click(
      await screen.findByRole('radio', { name: BIRTH_TIME_COPY.unknown })
    );
    fireEvent.click(screen.getByRole('button', { name: BIRTH_TIME_COPY.continue }));
    expect(loadFtueDraft().birthTimeAccuracy).toBe('unknown');
    expect(loadFtueDraft().birthTime).toBeNull();
    cleanup();

    render(<BirthTimeScreen />);
    expect(
      (
        await screen.findByRole('radio', {
          name: BIRTH_TIME_COPY.unknown,
        })
      ).getAttribute('aria-checked')
    ).toBe('true');
  });

  it('treats skipped notifications as a valid draft state', async () => {
    render(<NotificationsScreen />);
    fireEvent.click(
      await screen.findByRole('button', { name: NOTIFICATIONS_COPY.skip })
    );
    const draft = loadFtueDraft();
    expect(draft.notificationsSkipped).toBe(true);
    expect(draft.notifications).toEqual([]);
    expect(push).toHaveBeenCalledWith('/onboarding/snapshot');
  });

  it('editing one field preserves unrelated draft fields', () => {
    updateFtueDraft({
      goals: ['career'],
      birthDate: '1990-06-15',
      birthTimeAccuracy: 'unknown',
      birthTime: null,
      notifications: ['weekly_summary'],
      notificationsSkipped: false,
      birthPlace: {
        id: 'tehran-ir',
        city: 'Tehran',
        country: 'Iran',
        latitude: 35.6892,
        longitude: 51.389,
      },
    });

    updateFtueDraft({ birthDate: '1991-01-01' });
    const draft = loadFtueDraft();
    expect(draft.birthDate).toBe('1991-01-01');
    expect(draft.goals).toEqual(['career']);
    expect(draft.birthTimeAccuracy).toBe('unknown');
    expect(draft.birthPlace?.id).toBe('tehran-ir');
    expect(draft.notifications).toEqual(['weekly_summary']);
  });

  it('blocks invalid required steps from advancing', async () => {
    render(<BirthDateScreen />);
    fireEvent.click(
      await screen.findByRole('button', { name: BIRTH_DATE_COPY.continue })
    );
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
    cleanup();
    push.mockClear();

    render(<BirthPlaceScreen />);
    const input = await screen.findByLabelText(BIRTH_PLACE_COPY.searchLabel);
    fireEvent.change(input, { target: { value: 'not-a-resolved-city-xyz' } });
    fireEvent.click(screen.getByRole('button', { name: BIRTH_PLACE_COPY.continue }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });

  it('clears stale selected place when the query is edited', async () => {
    render(<BirthPlaceScreen />);
    const input = await screen.findByLabelText(BIRTH_PLACE_COPY.searchLabel);
    fireEvent.change(input, { target: { value: 'Tehran' } });
    fireEvent.click(await screen.findByText('Tehran'));
    fireEvent.change(input, { target: { value: 'Tehr' } });
    fireEvent.click(screen.getByRole('button', { name: BIRTH_PLACE_COPY.continue }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });

  it('does not complete FTUE when Snapshot renders', async () => {
    render(<SnapshotScreen />);
    await screen.findByRole('heading', { name: SNAPSHOT_COPY.title });
    await waitFor(() => {
      expect(readFtueEventQueue().some((e) => e.event === 'ftue_snapshot_view')).toBe(
        true
      );
    });
    expect(isFtueComplete()).toBe(false);
    expect(readFtueEventQueue().some((e) => e.event === 'ftue_complete')).toBe(false);
  });

  it('completes FTUE idempotently with non-personal analytics', async () => {
    render(<SnapshotScreen />);
    const cta = await screen.findByRole('button', {
      name: SNAPSHOT_COPY.continueToToday,
    });
    fireEvent.click(cta);
    fireEvent.click(cta);

    expect(isFtueComplete()).toBe(true);
    expect(push).toHaveBeenCalledWith('/home');

    const completeEvents = readFtueEventQueue().filter((e) => e.event === 'ftue_complete');
    const toTodayEvents = readFtueEventQueue().filter((e) => e.event === 'ftue_to_today');
    expect(completeEvents).toHaveLength(1);
    expect(toTodayEvents).toHaveLength(1);

    const props = JSON.stringify(completeEvents[0]?.properties ?? {});
    expect(props).not.toMatch(/birth|place|city|lat|lon|goal|notif/i);
    expect(completeEvents[0]?.properties).not.toHaveProperty('duration_ms');
    expect(completeEvents[0]?.properties).not.toHaveProperty('duration');
  });

  it('redirects completed users away from FTUE entry and Snapshot', async () => {
    markFtueComplete();

    render(<WelcomeScreen />);
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/home');
    });
    cleanup();
    replace.mockClear();

    render(<SnapshotScreen />);
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/home');
    });
  });

  it('does not request browser notification permission and does not call backend APIs', async () => {
    const requestPermission = vi.fn();
    Object.defineProperty(globalThis, 'Notification', {
      configurable: true,
      value: { requestPermission },
    });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    render(<NotificationsScreen />);
    fireEvent.click(
      await screen.findByRole('button', {
        name: NOTIFICATIONS_COPY.options.decision_windows,
      })
    );
    fireEvent.click(
      screen.getByRole('button', { name: NOTIFICATIONS_COPY.continue })
    );

    expect(requestPermission).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();

    cleanup();
    render(<SnapshotScreen />);
    fireEvent.click(
      await screen.findByRole('button', { name: SNAPSHOT_COPY.continueToToday })
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(
      JSON.stringify(readFtueEventQueue()).includes('ftue_os_permission_result')
    ).toBe(false);
  });

  it('fires ftue_goal_skip without goal payload', async () => {
    render(<GoalSelectionScreen />);
    fireEvent.click(
      await screen.findByRole('button', { name: GOAL_SELECTION_COPY.skip })
    );
    await waitFor(() => {
      const skip = readFtueEventQueue().find((e) => e.event === 'ftue_goal_skip');
      expect(skip).toBeTruthy();
      expect(skip?.properties).not.toHaveProperty('goals');
    });
  });

  it('place and living analytics omit identifying location fields', async () => {
    render(<BirthPlaceScreen />);
    const bpInput = await screen.findByLabelText(BIRTH_PLACE_COPY.searchLabel);
    fireEvent.change(bpInput, { target: { value: 'Tehran' } });
    fireEvent.click(await screen.findByText('Tehran'));
    fireEvent.click(screen.getByRole('button', { name: BIRTH_PLACE_COPY.continue }));

    const birthEvt = readFtueEventQueue().find((e) => e.event === 'ftue_birthplace_set');
    expect(birthEvt).toBeTruthy();
    expect(JSON.stringify(birthEvt?.properties)).not.toMatch(
      /Tehran|Iran|latitude|longitude|placeId|tehran/i
    );
    cleanup();

    render(<LivingLocationScreen />);
    const llInput = await screen.findByLabelText(LIVING_LOCATION_COPY.searchLabel);
    fireEvent.change(llInput, { target: { value: 'Dubai' } });
    fireEvent.click(await screen.findByText('Dubai'));
    fireEvent.click(
      screen.getByRole('button', { name: LIVING_LOCATION_COPY.continue })
    );
    const livingEvt = readFtueEventQueue().find(
      (e) => e.event === 'ftue_livinglocation_set'
    );
    expect(livingEvt).toBeTruthy();
    expect(JSON.stringify(livingEvt?.properties)).not.toMatch(
      /Dubai|Emirates|latitude|longitude|placeId/i
    );
  });
});

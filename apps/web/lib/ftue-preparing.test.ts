import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PreparingError,
  PREPARING_STEPS,
  runPreparingOrchestration,
} from '@/lib/ftue-preparing';
import { getProfileRepository, resetProfileRepositoryForTests } from '@/lib/profile';

const sampleProfile = {
  birth_date: '1990-06-15',
  birth_time: '14:30',
  birth_place: {
    name: 'New York, New York, United States',
    short: 'New York',
    lat: 40.7128,
    lon: -74.006,
  },
  action_type: 'business_launch',
};

describe('ftue-preparing orchestration', () => {
  beforeEach(() => {
    localStorage.clear();
    resetProfileRepositoryForTests();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    resetProfileRepositoryForTests();
  });

  it('throws when profile is missing', async () => {
    await expect(runPreparingOrchestration()).rejects.toMatchObject({
      code: 'no_profile',
    });
  });

  it('throws when offline', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    await expect(
      runPreparingOrchestration({ isOnline: () => false })
    ).rejects.toMatchObject({
      code: 'offline',
    });
  });

  it('runs all steps using local profile only', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    const updates: string[][] = [];

    const promise = runPreparingOrchestration({
      chartDelayMs: 10,
      windowDelayMs: 10,
      briefDelayMs: 10,
      onStepUpdate: (steps) => {
        updates.push(steps.map((s) => `${s.id}:${s.status}`));
      },
    });

    await vi.runAllTimersAsync();
    await promise;

    const final = updates[updates.length - 1];
    expect(final).toContain('chart:done');
    expect(final).toContain('window:done');
    expect(final).toContain('brief:done');
    expect(PREPARING_STEPS).toHaveLength(3);
  });

  it('fails mid-run when connection drops', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    let online = true;

    const promise = runPreparingOrchestration({
      chartDelayMs: 5,
      windowDelayMs: 5,
      briefDelayMs: 5,
      isOnline: () => online,
      delay: async (ms) => {
        await new Promise((r) => setTimeout(r, ms));
        online = false;
      },
    });

    const run = vi.runAllTimersAsync();
    await expect(promise).rejects.toBeInstanceOf(PreparingError);
    await run;
  });
});

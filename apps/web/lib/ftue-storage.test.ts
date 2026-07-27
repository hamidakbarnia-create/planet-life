import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearFtueComplete,
  clearFtueDraft,
  EMPTY_FTUE_DRAFT,
  ftueTodayPath,
  isFtueComplete,
  loadFtueDraft,
  markFtueComplete,
  saveFtueDraft,
  updateFtueDraft,
} from './ftue-storage';

describe('ftue-storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('starts incomplete', () => {
    expect(isFtueComplete()).toBe(false);
  });

  it('marks FTUE complete', () => {
    markFtueComplete();
    expect(isFtueComplete()).toBe(true);
    expect(localStorage.getItem('planet-life-ftue-complete')).toBe('1');
  });

  it('clears FTUE complete without clearing draft', () => {
    updateFtueDraft({ birthDate: '1990-06-15' });
    markFtueComplete();
    clearFtueComplete();
    expect(isFtueComplete()).toBe(false);
    expect(loadFtueDraft().birthDate).toBe('1990-06-15');
  });

  it('ftueTodayPath points at interim home route', () => {
    expect(ftueTodayPath()).toBe('/home');
  });

  it('loads empty draft by default', () => {
    expect(loadFtueDraft()).toEqual(EMPTY_FTUE_DRAFT);
  });

  it('rejects an unknown draft version', () => {
    localStorage.setItem(
      'planet-life-ftue-draft',
      JSON.stringify({
        version: 2,
        birthDate: '1991-01-01',
      })
    );
    expect(loadFtueDraft()).toEqual(EMPTY_FTUE_DRAFT);
  });

  it('persists and patches draft fields independently', () => {
    updateFtueDraft({ goals: ['career'] });
    updateFtueDraft({
      birthPlace: {
        id: 'tehran-ir',
        city: 'Tehran',
        country: 'Iran',
        latitude: 35.6,
        longitude: 51.4,
      },
    });
    updateFtueDraft({
      livingLocation: {
        id: 'dubai-ae',
        city: 'Dubai',
        country: 'UAE',
        latitude: 25.2,
        longitude: 55.3,
      },
    });
    updateFtueDraft({ birthTimeAccuracy: 'unknown', birthTime: '12:00' });

    const draft = loadFtueDraft();
    expect(draft.goals).toEqual(['career']);
    expect(draft.birthPlace?.id).toBe('tehran-ir');
    expect(draft.livingLocation?.id).toBe('dubai-ae');
    expect(draft.birthTimeAccuracy).toBe('unknown');
    expect(draft.birthTime).toBeNull();
  });

  it('sanitizes invalid goal and notification keys', () => {
    saveFtueDraft({
      ...EMPTY_FTUE_DRAFT,
      goals: ['career', 'not-a-goal' as never],
      notifications: ['weekly_summary', 'bogus' as never],
    });
    const draft = loadFtueDraft();
    expect(draft.goals).toEqual(['career']);
    expect(draft.notifications).toEqual(['weekly_summary']);
  });

  it('clearFtueDraft does not clear completion flag', () => {
    markFtueComplete();
    updateFtueDraft({ goals: ['career'] });
    clearFtueDraft();
    expect(isFtueComplete()).toBe(true);
    expect(loadFtueDraft()).toEqual(EMPTY_FTUE_DRAFT);
  });
});

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getProfileRepository,
  resetProfileRepositoryForTests,
  type ProfileRecord,
} from '@/lib/profile';

const sampleProfile: ProfileRecord = {
  birth_date: '1990-06-15',
  birth_time: '14:30',
  birth_place: {
    name: 'Paris, Île-de-France, France',
    short: 'Paris',
    lat: 48.8566,
    lon: 2.3522,
  },
  name: 'Sam',
  action_type: 'business_launch',
};

describe('profile repository (local)', () => {
  beforeEach(() => {
    localStorage.clear();
    resetProfileRepositoryForTests();
  });

  afterEach(() => {
    localStorage.clear();
    resetProfileRepositoryForTests();
  });

  it('persists and reloads draft', () => {
    const repo = getProfileRepository();
    repo.saveDraft({
      birth_date: '1985-03-10',
      birth_time: '09:15',
      city_search: 'Berlin',
      selected_city: null,
      updated_at: Date.now(),
    });
    const loaded = repo.loadDraft();
    expect(loaded?.birth_date).toBe('1985-03-10');
    expect(loaded?.city_search).toBe('Berlin');
  });

  it('clears draft without touching saved profile', () => {
    const repo = getProfileRepository();
    repo.saveProfile(sampleProfile);
    repo.saveDraft({
      birth_date: '2000-01-01',
      birth_time: '00:00',
      city_search: 'Draft',
      selected_city: null,
      updated_at: Date.now(),
    });
    repo.clearDraft();
    expect(repo.loadDraft()).toBeNull();
    expect(repo.loadProfile()?.birth_place.short).toBe('Paris');
  });

  it('saves profile with coordinates for Sprint 2 swap', () => {
    const repo = getProfileRepository();
    repo.saveProfile(sampleProfile);
    const loaded = repo.loadProfile();
    expect(loaded?.birth_date).toBe('1990-06-15');
    expect(loaded?.birth_place.lat).toBe(48.8566);
    expect(loaded?.name).toBe('Sam');
    expect(localStorage.getItem('planet-life-birth-profile')).toContain('Paris');
    expect(localStorage.getItem('planet-life-birth-place')).toContain('48.8566');
  });
});

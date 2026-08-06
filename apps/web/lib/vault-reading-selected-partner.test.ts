import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { BirthProfile } from './birth-profile';
import type { Person } from './people-storage';
import {
  fetchVaultCheatingRadarReading,
  fetchVaultCompatibilityReading,
  fetchVaultPartnerProfileReading,
} from './vault-reading';

const profile: BirthProfile = {
  birth_date: '1990-06-15',
  birth_time: '14:30',
  location: 'New York',
  action_type: 'business_launch',
};

function person(overrides: Partial<Person> = {}): Person {
  return {
    id: 'sel-1',
    name: 'Selected',
    birth_date: '1991-02-02',
    birth_time: '',
    location: 'Paris',
    relationship: 'friend',
    createdAt: 1,
    ...overrides,
  };
}

describe('Vault fetchers use explicit selected Person', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          reading: { executive: 'e', strategic: 's', technical: 't' },
          missing_inputs: [],
          verdict: {},
        }),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('Partner Profile sends aligned goal and partner_relationship together', async () => {
    await fetchVaultPartnerProfileReading(
      profile,
      'en',
      person({ relationship: 'business_partner' }),
      'business',
    );
    const body = JSON.parse(
      (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    expect(body.goal).toBe('business');
    expect(body.partner_relationship).toBe('business_partner');
    expect(body.partner_birth_date).toBe('1991-02-02');
  });

  it('Partner Profile spouse uses marriage goal (not romantic)', async () => {
    await fetchVaultPartnerProfileReading(
      profile,
      'en',
      person({ relationship: 'spouse' }),
      'marriage',
    );
    const body = JSON.parse(
      (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    expect(body.goal).toBe('marriage');
    expect(body.partner_relationship).toBe('spouse');
  });

  it('Compatibility uses the selected id person and mapped relationship_type', async () => {
    const other = person({
      id: 'other',
      name: 'Other',
      birth_date: '1980-01-01',
      location: 'Berlin',
      relationship: 'spouse',
    });
    await fetchVaultCompatibilityReading(profile, 'en', other, 'marriage');
    const body = JSON.parse(
      (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    expect(body.partner_birth_date).toBe('1980-01-01');
    expect(body.relationship_type).toBe('marriage');
  });

  it('Shadow uses the same selected person fields', async () => {
    const selected = person({
      id: 'same',
      relationship: 'business_partner',
      birth_date: '1992-03-03',
      location: 'Tokyo',
    });
    await fetchVaultCheatingRadarReading(profile, 'en', selected, 'business');
    const body = JSON.parse(
      (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    expect(body.partner_birth_date).toBe('1992-03-03');
    expect(body.relationship_type).toBe('business');
  });

  it('incomplete selected person is still sent (no cross-person fallback)', async () => {
    const incomplete = person({
      id: 'incomplete',
      birth_date: '1995-05-05',
      birth_time: '',
      location: 'Rome',
      relationship: 'romantic_partner',
    });
    await fetchVaultPartnerProfileReading(
      profile,
      'en',
      incomplete,
      'romantic',
    );
    const body = JSON.parse(
      (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    expect(body.goal).toBe('romantic');
    expect(body.partner_birth_date).toBe('1995-05-05');
    expect(body.partner_birth_time).toBe('');
    expect(body.partner_relationship).toBe('romantic_partner');
  });
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Person } from './people-storage';
import {
  VAULT_SELECTED_PARTNER_STORAGE_KEY,
  clearSelectedVaultPartnerId,
  findPersonById,
  loadSelectedVaultPartnerId,
  partnerRelationshipForVaultApi,
  reconcileVaultPartnerSelection,
  saveSelectedVaultPartnerId,
  toVaultPartnerProfileGoal,
  toVaultRelationshipType,
} from './vault-selected-partner';

function person(
  id: string,
  overrides: Partial<Person> = {},
): Person {
  return {
    id,
    name: `Person ${id}`,
    birth_date: '1990-01-15',
    birth_time: '12:00',
    location: 'London',
    relationship: 'friend',
    createdAt: 1,
    ...overrides,
  };
}

describe('selected Vault partner persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('reads, writes, and clears selected id', () => {
    expect(loadSelectedVaultPartnerId()).toBeNull();
    saveSelectedVaultPartnerId('abc');
    expect(localStorage.getItem(VAULT_SELECTED_PARTNER_STORAGE_KEY)).toBe('abc');
    expect(loadSelectedVaultPartnerId()).toBe('abc');
    clearSelectedVaultPartnerId();
    expect(loadSelectedVaultPartnerId()).toBeNull();
  });

  it('is SSR-safe: guards browser APIs and survives storage failures', () => {
    const source = readFileSync(
      resolve(__dirname, './vault-selected-partner.ts'),
      'utf8',
    );
    expect(source).toMatch(
      /export function loadSelectedVaultPartnerId[\s\S]*?typeof window === 'undefined'/,
    );
    expect(source).toMatch(
      /export function saveSelectedVaultPartnerId[\s\S]*?typeof window === 'undefined'/,
    );
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(loadSelectedVaultPartnerId()).toBeNull();
  });
});

describe('reconcileVaultPartnerSelection', () => {
  it('returns null for 0 People', () => {
    expect(
      reconcileVaultPartnerSelection({ people: [], candidateId: 'a' }),
    ).toBeNull();
  });

  it('auto-selects the only Person', () => {
    expect(
      reconcileVaultPartnerSelection({
        people: [person('only')],
        candidateId: null,
      }),
    ).toBe('only');
  });

  it('retains a valid selection among multiple People', () => {
    expect(
      reconcileVaultPartnerSelection({
        people: [person('a'), person('b')],
        candidateId: 'b',
      }),
    ).toBe('b');
  });

  it('returns null when multiple People and no valid selection', () => {
    expect(
      reconcileVaultPartnerSelection({
        people: [person('a'), person('b')],
        candidateId: null,
      }),
    ).toBeNull();
    expect(
      reconcileVaultPartnerSelection({
        people: [person('a'), person('b')],
        candidateId: 'gone',
      }),
    ).toBeNull();
  });

  it('auto-selects when deleted selection leaves exactly one Person', () => {
    expect(
      reconcileVaultPartnerSelection({
        people: [person('survives')],
        candidateId: 'deleted',
      }),
    ).toBe('survives');
  });

  it('clears selection when deleted and multiple remain', () => {
    expect(
      reconcileVaultPartnerSelection({
        people: [person('a'), person('b')],
        candidateId: 'deleted',
      }),
    ).toBeNull();
  });

  it('never picks first-of-many when ambiguous', () => {
    const people = [person('first'), person('second'), person('third')];
    expect(
      reconcileVaultPartnerSelection({ people, candidateId: undefined }),
    ).toBeNull();
  });
});

describe('toVaultRelationshipType', () => {
  it('maps the four authorized relationships', () => {
    expect(toVaultRelationshipType('romantic_partner')).toBe('romantic');
    expect(toVaultRelationshipType('spouse')).toBe('marriage');
    expect(toVaultRelationshipType('friend')).toBe('friendship');
    expect(toVaultRelationshipType('business_partner')).toBe('business');
  });

  it('returns null for every unsupported relationship without romantic fallback', () => {
    for (const value of [
      'family',
      'mother',
      'father',
      'colleague',
      'professional',
      'competitor',
      'mentor',
      'investor',
      'client',
      'cofounder',
      'employee',
      'employer',
      'parent_child',
      'brother',
      'sister',
      'son',
      'daughter',
      'rival',
      'romantic',
      undefined,
      null,
      '',
    ] as const) {
      expect(toVaultRelationshipType(value as never)).toBeNull();
    }
  });
});

describe('toVaultPartnerProfileGoal', () => {
  it('maps only relationships with an aligned non-silent Partner Profile goal', () => {
    expect(toVaultPartnerProfileGoal('romantic_partner')).toBe('romantic');
    expect(toVaultPartnerProfileGoal('spouse')).toBe('marriage');
    expect(toVaultPartnerProfileGoal('business_partner')).toBe('business');
  });

  it('fail-closes friend and every other type (no romantic goal fallback)', () => {
    for (const value of [
      'friend',
      'family',
      'mother',
      'colleague',
      'professional',
      'mentor',
      'investor',
      'client',
      'cofounder',
      undefined,
      null,
      '',
    ] as const) {
      expect(toVaultPartnerProfileGoal(value as never)).toBeNull();
    }
  });
});

describe('partnerRelationshipForVaultApi', () => {
  it('sends relationship only when Partner Profile goal mapping exists', () => {
    expect(partnerRelationshipForVaultApi('romantic_partner')).toBe(
      'romantic_partner',
    );
    expect(partnerRelationshipForVaultApi('spouse')).toBe('spouse');
    expect(partnerRelationshipForVaultApi('business_partner')).toBe(
      'business_partner',
    );
  });

  it('omits friend and unsafe aliases (never remaps to romantic)', () => {
    for (const alias of [
      'friend',
      'family',
      'mother',
      'colleague',
      'professional',
      'competitor',
    ] as const) {
      expect(partnerRelationshipForVaultApi(alias)).toBeUndefined();
    }
  });
});

describe('findPersonById', () => {
  it('resolves exact id and does not fall back', () => {
    const people = [
      person('a', { birth_time: '' }),
      person('b', { birth_date: '1991-01-01', birth_time: '10:00' }),
    ];
    expect(findPersonById(people, 'a')?.id).toBe('a');
    expect(findPersonById(people, 'missing')).toBeNull();
    expect(findPersonById(people, null)).toBeNull();
  });
});

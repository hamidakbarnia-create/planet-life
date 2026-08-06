import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  PARTNER_DEPENDENT_VAULT_KEYS,
  isPartnerDependentVaultKey,
  shouldBumpPeopleRevisionForOpenVault,
} from './vault-partner-dependent';
import { PEOPLE_CHANGED_EVENT, PEOPLE_STORAGE_KEY } from './people-storage';

describe('isPartnerDependentVaultKey', () => {
  it('lists the five partner-dependent keys', () => {
    expect([...PARTNER_DEPENDENT_VAULT_KEYS]).toEqual([
      'partner',
      'compatibility',
      'radar',
      'trust',
      'communication',
    ]);
  });
});

describe('shouldBumpPeopleRevisionForOpenVault', () => {
  const peopleChanged = { type: 'people-changed' as const };

  it('accepts People change when open module is partner', () => {
    expect(
      shouldBumpPeopleRevisionForOpenVault({
        openApiKey: 'partner',
        signal: peopleChanged,
      }),
    ).toBe(true);
  });

  it('accepts People change when open module is compatibility', () => {
    expect(
      shouldBumpPeopleRevisionForOpenVault({
        openApiKey: 'compatibility',
        signal: peopleChanged,
      }),
    ).toBe(true);
  });

  it('accepts People change for Shadow partner-dependent modules', () => {
    for (const openApiKey of ['radar', 'trust', 'communication'] as const) {
      expect(
        shouldBumpPeopleRevisionForOpenVault({
          openApiKey,
          signal: peopleChanged,
        }),
      ).toBe(true);
    }
  });

  it('ignores People change for Mars and Power modules', () => {
    for (const openApiKey of ['mars', 'hot', 'money', 'ghost', 'yes'] as const) {
      expect(
        shouldBumpPeopleRevisionForOpenVault({
          openApiKey,
          signal: peopleChanged,
        }),
      ).toBe(false);
    }
  });

  it('accepts native storage for PEOPLE_STORAGE_KEY when partner-dependent is open', () => {
    expect(
      shouldBumpPeopleRevisionForOpenVault({
        openApiKey: 'partner',
        signal: { type: 'storage', key: PEOPLE_STORAGE_KEY },
      }),
    ).toBe(true);
    expect(
      shouldBumpPeopleRevisionForOpenVault({
        openApiKey: 'radar',
        signal: { type: 'storage', key: PEOPLE_STORAGE_KEY },
      }),
    ).toBe(true);
  });

  it('ignores storage events for unrelated keys', () => {
    expect(
      shouldBumpPeopleRevisionForOpenVault({
        openApiKey: 'partner',
        signal: { type: 'storage', key: 'planet-life-membership' },
      }),
    ).toBe(false);
    expect(
      shouldBumpPeopleRevisionForOpenVault({
        openApiKey: 'compatibility',
        signal: { type: 'storage', key: 'planet-life-birth-profile' },
      }),
    ).toBe(false);
  });

  it('accepts storage clear/update when key === null for partner-dependent open module', () => {
    expect(
      shouldBumpPeopleRevisionForOpenVault({
        openApiKey: 'trust',
        signal: { type: 'storage', key: null },
      }),
    ).toBe(true);
  });

  it('ignores any signal when no open module / non-partner key', () => {
    expect(
      shouldBumpPeopleRevisionForOpenVault({
        openApiKey: undefined,
        signal: peopleChanged,
      }),
    ).toBe(false);
    expect(
      shouldBumpPeopleRevisionForOpenVault({
        openApiKey: null,
        signal: { type: 'storage', key: PEOPLE_STORAGE_KEY },
      }),
    ).toBe(false);
    expect(
      shouldBumpPeopleRevisionForOpenVault({
        openApiKey: undefined,
        signal: { type: 'storage', key: null },
      }),
    ).toBe(false);
    expect(isPartnerDependentVaultKey(undefined)).toBe(false);
  });
});

describe('Vault page People refresh wiring', () => {
  const pageSource = readFileSync(
    resolve(__dirname, '../app/vault/[section]/page.tsx'),
    'utf8',
  );

  it('uses the pure refresh decision helper and peopleRevision effect dep', () => {
    expect(pageSource).toContain('shouldBumpPeopleRevisionForOpenVault');
    expect(pageSource).toContain('PEOPLE_CHANGED_EVENT');
    expect(pageSource).toContain('setPeopleRevision');
    expect(pageSource).toContain('peopleRevision');
    expect(pageSource).toContain('selectedVaultPartnerId');
    expect(pageSource).toMatch(/addEventListener\(\s*PEOPLE_CHANGED_EVENT/);
    expect(pageSource).toMatch(/removeEventListener\(\s*PEOPLE_CHANGED_EVENT/);
    expect(pageSource).toMatch(/addEventListener\(\s*['"]storage['"]/);
    expect(pageSource).toMatch(/removeEventListener\(\s*['"]storage['"]/);
  });

  it('does not call Vault fetchers from the People listener', () => {
    expect(pageSource).not.toMatch(
      /PEOPLE_CHANGED_EVENT[\s\S]{0,900}fetchVault/,
    );
    expect(pageSource).not.toMatch(
      /shouldBumpPeopleRevisionForOpenVault[\s\S]{0,400}fetchVault/,
    );
  });

  it('existing fetch effect clears stale reading and starts loading before refetch', () => {
    // peopleRevision + selectedVaultPartnerId are in the live-reading effect deps.
    expect(pageSource).toMatch(
      /setLiveLoading\(true\);[\s\S]{0,120}setLiveError\(null\);[\s\S]{0,120}setLiveReading\(null\);[\s\S]{0,120}setMissingNotice\(null\);/,
    );
    expect(pageSource).toContain('peopleRevision');
    expect(pageSource).toContain('selectedVaultPartnerId');
    expect(pageSource).toContain('partnerSelectionReady');
  });
});

describe('People event constants', () => {
  it('uses stable event and storage key names', () => {
    expect(PEOPLE_CHANGED_EVENT).toBe('planet-life-people-changed');
    expect(PEOPLE_STORAGE_KEY).toBe('planet-life-people');
  });
});

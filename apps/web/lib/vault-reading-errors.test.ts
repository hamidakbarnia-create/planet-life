import { afterEach, describe, expect, it, vi } from 'vitest';

import type { BirthProfile } from './birth-profile';
import {
  classifyVaultRequestStatus,
  fetchVaultMarsReading,
  optionalVaultBirthField,
  VaultRequestError,
  vaultLiveErrorKind,
} from './vault-reading';

const profile: BirthProfile = {
  birth_date: '1990-06-15',
  birth_time: '14:30',
  location: '51.5074,-0.1278',
  action_type: 'business_launch',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Vault request error classification', () => {
  it('treats blank optional birth fields as omitted', () => {
    expect(optionalVaultBirthField('')).toBeNull();
    expect(optionalVaultBirthField('   ')).toBeNull();
    expect(optionalVaultBirthField(undefined)).toBeNull();
    expect(optionalVaultBirthField('14:30')).toBe('14:30');
    expect(optionalVaultBirthField('1990-01-15')).toBe('1990-01-15');
  });

  it('maps HTTP statuses from the Vault API contract', () => {
    expect(classifyVaultRequestStatus(401)).toBe('auth');
    expect(classifyVaultRequestStatus(403)).toBe('forbidden');
    expect(classifyVaultRequestStatus(429)).toBe('rateLimit');
    expect(classifyVaultRequestStatus(422)).toBe('validation');
    expect(classifyVaultRequestStatus(400)).toBe('rejected');
    expect(classifyVaultRequestStatus(500)).toBe('service');
    expect(classifyVaultRequestStatus(503)).toBe('service');
    expect(classifyVaultRequestStatus(0)).toBe('network');
    expect(classifyVaultRequestStatus(418)).toBe('service');
  });

  it('does not treat 400 as the same class as 422', () => {
    expect(classifyVaultRequestStatus(400)).not.toBe(
      classifyVaultRequestStatus(422),
    );
    expect(classifyVaultRequestStatus(400)).not.toBe('validation');
  });

  it('maps thrown errors to live module states', () => {
    expect(vaultLiveErrorKind(new VaultRequestError(422))).toBe('validation');
    expect(vaultLiveErrorKind(new VaultRequestError(400))).toBe('rejected');
    expect(vaultLiveErrorKind(new VaultRequestError(401))).toBe('auth');
    expect(vaultLiveErrorKind(new VaultRequestError(403))).toBe('forbidden');
    expect(vaultLiveErrorKind(new VaultRequestError(429))).toBe('rateLimit');
    expect(vaultLiveErrorKind(new VaultRequestError(503))).toBe('service');
    expect(vaultLiveErrorKind(new TypeError('Failed to fetch'))).toBe('network');
    expect(vaultLiveErrorKind(new TypeError('NetworkError when attempting to fetch resource'))).toBe(
      'network',
    );
    expect(vaultLiveErrorKind(new TypeError('Load failed'))).toBe('network');
    expect(vaultLiveErrorKind(new TypeError('Cannot read properties of undefined'))).toBe(
      'service',
    );
    expect(vaultLiveErrorKind(new TypeError('x is not a function'))).toBe('service');
    expect(vaultLiveErrorKind(new TypeError())).toBe('service');
    expect(vaultLiveErrorKind(new Error('unexpected'))).toBe('service');
  });
});

describe('shared-page fetchers use structured errors', () => {
  it('classifies a 403 from Mars the same way as partner fetchers', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 403,
        json: async () => ({ detail: 'denied' }),
      })),
    );
    await expect(fetchVaultMarsReading(profile, 'en')).rejects.toMatchObject({
      name: 'VaultRequestError',
      status: 403,
      kind: 'forbidden',
    });
  });

  it('classifies a generic TypeError from Mars as service, not network', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Cannot read properties of undefined');
      }),
    );
    await expect(fetchVaultMarsReading(profile, 'en')).rejects.toMatchObject({
      name: 'VaultRequestError',
      status: 500,
      kind: 'service',
    });
  });

  it('classifies a thrown TypeError from Yes Day as network', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    const { fetchVaultYesDayReading } = await import('./vault-reading');
    await expect(fetchVaultYesDayReading(profile, 'en')).rejects.toMatchObject({
      name: 'VaultRequestError',
      status: 0,
      kind: 'network',
    });
  });
});

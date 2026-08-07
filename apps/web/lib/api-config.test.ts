import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  LOCAL_API_BASE,
  PRODUCTION_API_BASE,
  apiUrl,
  normalizeApiBase,
  resolveApiBase,
} from './api-config';

describe('resolveApiBase', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses NEXT_PUBLIC_API_BASE in production when present', () => {
    expect(
      resolveApiBase({
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_BASE: 'https://api.metioro.com',
      })
    ).toBe('https://api.metioro.com');
  });

  it('strips trailing slashes from the env value', () => {
    expect(
      resolveApiBase({
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_BASE: 'https://api.metioro.com/',
      })
    ).toBe('https://api.metioro.com');
    expect(normalizeApiBase('https://api.metioro.com///')).toBe(
      'https://api.metioro.com'
    );
  });

  it('falls back to localhost in development when env is unset', () => {
    expect(resolveApiBase({ NODE_ENV: 'development' })).toBe(LOCAL_API_BASE);
  });

  it('falls back to localhost in test when env is unset', () => {
    expect(resolveApiBase({ NODE_ENV: 'test' })).toBe(LOCAL_API_BASE);
  });

  it('never falls back to localhost in production', () => {
    const base = resolveApiBase({ NODE_ENV: 'production' });
    expect(base).toBe(PRODUCTION_API_BASE);
    expect(base).not.toContain('localhost');
    expect(base).not.toContain('127.0.0.1');
  });

  it('rejects an explicit localhost env in production', () => {
    expect(() =>
      resolveApiBase({
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_BASE: 'http://localhost:8000',
      })
    ).toThrow(/must not be localhost in production/i);
  });

  it('allows localhost override in development', () => {
    expect(
      resolveApiBase({
        NODE_ENV: 'development',
        NEXT_PUBLIC_API_BASE: 'http://localhost:8000',
      })
    ).toBe('http://localhost:8000');
  });
});

describe('apiUrl', () => {
  it('does not produce double slashes for analyze/chart paths', () => {
    const base = 'https://api.metioro.com/';
    expect(apiUrl('/api/business/analyze', base)).toBe(
      'https://api.metioro.com/api/business/analyze'
    );
    expect(apiUrl('/api/business/chart', base)).toBe(
      'https://api.metioro.com/api/business/chart'
    );
    expect(apiUrl('api/business/analyze', 'https://api.metioro.com')).toBe(
      'https://api.metioro.com/api/business/analyze'
    );
  });

  it('keeps local development URLs intact', () => {
    expect(apiUrl('/api/business/analyze', LOCAL_API_BASE)).toBe(
      'http://localhost:8000/api/business/analyze'
    );
  });
});

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertStagingApiBase,
  assertStagingAppEnv,
  assertStagingWorkerName,
  parseStagingWrangler,
  runStagingDeployGuard,
} from '../scripts/assert-staging-deploy.mjs';

describe('staging deploy guard', () => {
  it('accepts the committed staging wrangler worker name', () => {
    const config = parseStagingWrangler(
      readFileSync(join(process.cwd(), 'wrangler.staging.jsonc'), 'utf8')
    );
    expect(() => assertStagingWorkerName(config.name)).not.toThrow();
    expect(config.name).toBe('planet-life-web-staging');
    expect(config.name).not.toBe('planet-life-web');
  });

  it('rejects the production worker name', () => {
    expect(() => assertStagingWorkerName('planet-life-web')).toThrow(
      /production Worker/
    );
  });

  it('requires staging app env', () => {
    expect(() => assertStagingAppEnv('staging')).not.toThrow();
    expect(() => assertStagingAppEnv('production')).toThrow(/staging/);
  });

  it('rejects localhost and production API hosts for staging', () => {
    expect(() =>
      assertStagingApiBase('https://api-staging.metioro.com')
    ).not.toThrow();
    expect(() => assertStagingApiBase('http://localhost:8000')).toThrow(
      /localhost|HTTPS/
    );
    expect(() => assertStagingApiBase('https://api.metioro.com')).toThrow(
      /production API/
    );
    expect(() =>
      assertStagingApiBase('https://api.metioro.com', {
        allowProductionApi: true,
      })
    ).not.toThrow();
  });

  it('runStagingDeployGuard passes with staging env', () => {
    const result = runStagingDeployGuard({
      env: {
        NEXT_PUBLIC_APP_ENV: 'staging',
        NEXT_PUBLIC_API_BASE: 'https://api-staging.metioro.com',
      },
    });
    expect(result.worker).toBe('planet-life-web-staging');
  });
});

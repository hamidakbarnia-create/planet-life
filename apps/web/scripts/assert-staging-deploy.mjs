/**
 * Staging deploy safety guard.
 * Ensures staging scripts cannot target the production Worker or production API.
 * Does not deploy. Does not print secret values.
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WEB_ROOT = join(__dirname, '..');
const STAGING_CONFIG = join(WEB_ROOT, 'wrangler.staging.jsonc');

export const PRODUCTION_WORKER = 'planet-life-web';
export const EXPECTED_STAGING_WORKER = 'planet-life-web-staging';

const PRODUCTION_API_HOSTS = new Set([
  'api.metioro.com',
  'www.api.metioro.com',
]);

function fail(message) {
  console.error(`[staging-guard] ${message}`);
  process.exit(1);
}

export function stripJsonc(raw) {
  return raw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

export function parseStagingWrangler(raw) {
  return JSON.parse(stripJsonc(raw));
}

export function assertStagingWorkerName(name) {
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Staging Worker name is missing');
  }
  if (name === PRODUCTION_WORKER) {
    throw new Error(
      `Staging config must not use production Worker name "${PRODUCTION_WORKER}"`
    );
  }
  if (!name.endsWith('-staging')) {
    throw new Error(
      `Staging Worker name must end with "-staging" (received "${name}")`
    );
  }
  if (name !== EXPECTED_STAGING_WORKER) {
    throw new Error(
      `Expected staging Worker "${EXPECTED_STAGING_WORKER}", received "${name}"`
    );
  }
}

export function assertStagingApiBase(apiBase, { allowProductionApi = false } = {}) {
  if (apiBase == null || String(apiBase).trim() === '') {
    throw new Error('NEXT_PUBLIC_API_BASE is required for staging deploy/build');
  }
  let url;
  try {
    url = new URL(String(apiBase).trim());
  } catch {
    throw new Error('NEXT_PUBLIC_API_BASE must be a valid absolute URL');
  }
  if (url.protocol !== 'https:') {
    throw new Error('NEXT_PUBLIC_API_BASE must use HTTPS for shared staging');
  }
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    throw new Error('NEXT_PUBLIC_API_BASE must not be localhost for shared staging');
  }
  if (!allowProductionApi && PRODUCTION_API_HOSTS.has(url.hostname)) {
    throw new Error(
      'NEXT_PUBLIC_API_BASE must not point at production API unless ALLOW_STAGING_TO_PRODUCTION_API=1'
    );
  }
}

export function assertStagingAppEnv(appEnv) {
  if (appEnv == null || String(appEnv).trim() === '') {
    throw new Error(
      'NEXT_PUBLIC_APP_ENV is required for staging and must be "staging"'
    );
  }
  if (String(appEnv).trim() !== 'staging') {
    throw new Error(
      'NEXT_PUBLIC_APP_ENV must equal "staging" for staging deploy/build'
    );
  }
}

export function runStagingDeployGuard({
  configPath = STAGING_CONFIG,
  env = process.env,
} = {}) {
  if (!existsSync(configPath)) {
    throw new Error(`Missing staging Wrangler config: ${configPath}`);
  }
  const config = parseStagingWrangler(readFileSync(configPath, 'utf8'));
  assertStagingWorkerName(config.name);
  if (config.services?.[0]?.service) {
    assertStagingWorkerName(config.services[0].service);
  }
  const allowProductionApi = env.ALLOW_STAGING_TO_PRODUCTION_API === '1';
  const apiBase = env.NEXT_PUBLIC_API_BASE;
  const appEnv = env.NEXT_PUBLIC_APP_ENV ?? config.vars?.NEXT_PUBLIC_APP_ENV;
  assertStagingAppEnv(appEnv);
  assertStagingApiBase(apiBase, { allowProductionApi });
  return { worker: config.name };
}

function main() {
  try {
    const result = runStagingDeployGuard();
    console.log(
      `[staging-guard] OK — worker=${result.worker} app_env=staging api_host_ok=true`
    );
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
  }
}

const isDirectRun =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main();
}

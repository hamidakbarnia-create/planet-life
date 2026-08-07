/**
 * Central API base URL for all browser → backend requests.
 *
 * Prefer NEXT_PUBLIC_API_BASE (Cloudflare / staging / local override).
 * Development and test may fall back to the local FastAPI server.
 * Production never falls back to localhost — uses the production API host.
 *
 * IMPORTANT: Read NEXT_PUBLIC_* and NODE_ENV via static `process.env.X`
 * property access so Next.js / OpenNext can inline them at build time.
 * Dynamic `env[name]` access is not replaced and can revive localhost in prod.
 */

export const PRODUCTION_API_BASE = 'https://api.metioro.com';
export const LOCAL_API_BASE = 'http://localhost:8000';

export type ApiEnv = {
  NEXT_PUBLIC_API_BASE?: string;
  NODE_ENV?: string;
};

function isLocalhostBase(base: string): boolean {
  try {
    const host = new URL(base).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  } catch {
    return /localhost|127\.0\.0\.1/i.test(base);
  }
}

/** Strip trailing slashes so `${API_BASE}/api/...` never becomes `//api`. */
export function normalizeApiBase(raw: string): string {
  return raw.trim().replace(/\/+$/, '');
}

/**
 * Resolve the API origin for the given environment.
 *
 * Choice: production missing-env fail-safe → https://api.metioro.com (not throw).
 * Compatible with the existing `API_BASE` constant consumed across the web app,
 * while staging already fails loudly via `assert-staging-deploy.mjs`. Explicit
 * localhost in production throws so misconfiguration cannot ship silently.
 */
export function resolveApiBase(env: ApiEnv): string {
  const raw = env.NEXT_PUBLIC_API_BASE?.trim();
  const isProduction = env.NODE_ENV === 'production';

  if (raw) {
    const base = normalizeApiBase(raw);
    if (isProduction && isLocalhostBase(base)) {
      throw new Error(
        'NEXT_PUBLIC_API_BASE must not be localhost in production'
      );
    }
    return base;
  }

  if (isProduction) {
    return PRODUCTION_API_BASE;
  }

  return LOCAL_API_BASE;
}

/** Join API origin + path without double slashes. */
export function apiUrl(path: string, base: string = API_BASE): string {
  const origin = normalizeApiBase(base);
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${suffix}`;
}

/**
 * Runtime API origin. Static process.env.* reads are required for Next inlining.
 */
export const API_BASE = resolveApiBase({
  NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE,
  NODE_ENV: process.env.NODE_ENV,
});

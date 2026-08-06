# METIORO Performance Baseline — Phase 0

> Established benchmark for landing page (`/`) before Phase 1 architecture refactor.
> Do not modify metrics retroactively; append new runs as dated sections.

**Captured:** 2026-07-06  
**Environment:** Local production build (`npm run build` + `npm run start -p 3000`)  
**Framework:** Next.js 16.2.6 (Turbopack)

---

## Decision Gate

| Gate | Target | Result |
|------|--------|--------|
| Keep Three.js | Remove only if performance justifies | **KEEP** — lazy-loaded; desktop excellent; mobile LCP is risk surface |
| FPS profiling | ≥ 50 median on hero scroll | **Deferred** — Playwright Chromium installed in Phase 1 |

---

## Lighthouse — Desktop

**Artifact:** `apps/web/lighthouse-baseline.json`  
**Preset:** desktop  
**Chrome flags:** `--headless=new --no-sandbox --disable-gpu`

| Category | Score |
|----------|-------|
| Performance | 99 |
| Accessibility | 96 |
| Best Practices | 100 |
| SEO | 100 |

| Vital | Value | Gate (≤) | Status |
|-------|-------|----------|--------|
| LCP | 0.9s (918ms) | 2.5s | PASS |
| CLS | 0.001 | 0.1 | PASS |
| FCP | 0.4s | — | — |
| TBT | 30ms | — | — |
| Speed Index | 0.4s | — | — |
| TTI | 1.0s | — | — |
| Total payload | 493 KiB | — | — |

---

## Lighthouse — Mobile

**Artifact:** `apps/web/.lighthouse-mobile.json`  
**Mode:** mobile (simulated throttling)

| Category | Score |
|----------|-------|
| Performance | 74 |

| Vital | Value | Gate (≤) | Status |
|-------|-------|----------|--------|
| LCP | 4.8s (4816ms) | 2.5s | FAIL |
| CLS | 0.006 | 0.1 | PASS |
| FCP | 2.6s | — | — |
| TBT | 180ms | — | — |
| Main-thread work | 1056ms | — | — |
| Render-blocking resources | 0 | — | — |

See `docs/performance/mobile-lcp-analysis.md` for LCP element extraction.

---

## Bundle — Landing Route (`/`)

**Artifact:** `apps/web/.next/diagnostics/route-bundle-stats.json`

| Metric | Value |
|--------|-------|
| First-load uncompressed JS | 589,471 bytes (575.7 KB) |
| Initial script chunks | 9 |
| Network transfer (scripts, desktop LH) | 173.8 KB |

### Lazy-loaded cinematic stack (not first paint)

| Chunk role | Uncompressed size |
|------------|-------------------|
| Three.js (`WebGLRenderer`) | 476.1 KB |
| Cinematic WebGL engine | 8.5 KB |
| Cinematic hero shell | 16 KB |

### Repository chunks

| Metric | Value |
|--------|-------|
| Total chunk files | 33 |
| Total uncompressed JS | 2,060.8 KB |

### Unused JavaScript (desktop Lighthouse)

Estimated savings: **49 KiB** — primarily shared framework chunks.

---

## Build

| Item | Result |
|------|--------|
| `npm run build` | PASS — compiled in 21.0s, TypeScript in 55s |
| `npm run analyze` | Not available |
| Landing route | Static prerender (○) |

---

## Manual Observations

| Test | Result |
|------|--------|
| Server HEAD | HTTP 200, `Content-Length: 12310`, `x-nextjs-cache: HIT` |
| Full HTML fetch (local) | ~141ms |
| FPS (hero scroll) | Not measured in Phase 0 |

---

## Phase 0 Recommendation

1. **Keep Three.js** — deferred from first load; desktop metrics strong.
2. **Re-benchmark mobile LCP** after Phase 2 hero evolution.
3. **Profile FPS** with Playwright Chromium before any WebGL removal decision.

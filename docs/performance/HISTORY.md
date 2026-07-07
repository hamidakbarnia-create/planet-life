# METIORO Performance History

Append-only log of landing page performance runs.

---

## 2026-07-07 — Landing Experience v1

**Commit:** `feat(landing): implement landing experience v1` (pending)  
**Change:** Editorial hero, trust section, how-it-works pipeline, product previews. WebGL demystified (compass/radar removed). Shorter hero viewport.

### Desktop Lighthouse

| Metric | Baseline | v1 | Delta |
|--------|----------|-----|-------|
| Performance | 99 | 99 | 0 |
| Accessibility | 96 | 96 | 0 |
| LCP | 918ms | 859ms | **−59ms** |
| CLS | 0.001 | 0.001 | 0 |
| TBT | 30ms | 7ms | **−23ms** |

**Artifact:** `apps/web/lighthouse-v1-desktop.json`

### Mobile Lighthouse

| Metric | Baseline | v1 | Delta |
|--------|----------|-----|-------|
| Performance | 74 | 76 | **+2** |
| Accessibility | — | 96 | — |
| LCP | 4816ms | 4628ms | **−188ms** |
| CLS | 0.006 | 0.006 | 0 |
| TBT | 180ms | 179ms | −1ms |

**Artifact:** `apps/web/lighthouse-v1-mobile.json`

> Mobile LCP remains above the 2.5s gate (pre-existing). v1 improved vs baseline; no regression.

### Bundle — Landing Route (`/`)

| Metric | Baseline | v1 | Delta |
|--------|----------|-----|-------|
| First-load uncompressed JS | 589,471 B (575.7 KB) | 557,757 B (544.7 KB) | **−31.7 KB** |

Three.js remains lazy-loaded. Cinematic WebGL engine retained.

### Notes

- Hero changed from 460vh scroll cinematic to editorial layout with ambient WebGL background.
- Removed compass arc and radar sweep from `cinematic-hero-webgl.ts`.
- All hero copy sourced from `landing-i18n.ts`.
- Screenshots: `docs/performance/landing-v1-desktop.png`, `landing-v1-mobile.png`.

### Verdict

**No regression vs `BASELINE.md`.** Desktop and mobile core vitals improved or held. Mobile LCP gate still open (tracked for Phase 2+).

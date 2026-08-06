# METIORO Visual Regression (Sprint A — Phase 0)

Phase 0 freezes the current UI as committed PNG baselines before any design-system refactor.

## Location

| Path | Purpose |
|------|---------|
| `apps/web/tests/visual/baseline/` | Committed baseline screenshots (ground truth) |
| `apps/web/tests/visual/.current/` | Ephemeral re-capture for pixel diff reports (gitignored) |
| `apps/web/tests/visual/capture.spec.ts` | Playwright snapshot capture/compare |
| `apps/web/tests/visual/config.ts` | Route × viewport × language matrix |

## Capture matrix

**Routes (12):** `/`, `/home`, `/ask`, `/profile`, `/calendar`, `/people`, `/pathfinder`, `/world`, `/settings`, `/upgrade`, `/vault`, `/login`

**Languages:** English (`en`, LTR) and Persian (`fa`, RTL)

**Viewports:**

| ID | Size |
|----|------|
| `desktop` | 1440×900 |
| `tablet` | 834×1112 |
| `mobile` | 390×844 |
| `mobile-landscape` | 844×390 (only `/`, `/profile`, `/calendar`) |

**Total baseline images:** 78

Naming: `{routeSlug}__{lang}__{viewport}.png` (e.g. `root__fa__desktop.png`)

## How to run

From `apps/web`:

```bash
npm install
npm run build
npm run visual:baseline
npm run visual:diff
```

### `visual:baseline`

1. Starts Next.js dev server (Playwright `webServer`)
2. Captures all matrix cases
3. Writes/updates PNGs under `tests/visual/baseline/` via `--update-snapshots`

Commit the baseline folder after review.

### `visual:diff`

1. Runs Playwright snapshot compare (`capture.spec.ts`) against committed baselines
2. Re-captures to `tests/visual/.current/`
3. Runs `diff-report.mjs` with per-file pixel diff percentages

On an unchanged app, both steps should report ~0% diff everywhere.

## Tolerance policy

| Level | Threshold | Action |
|-------|-----------|--------|
| **Pass** | ≤ 0.1% pixel diff (`DIFF_WARN_RATIO`) | OK |
| **Warn** | > 0.1% and ≤ 0.5% | Investigate; may accept in logged exceptions (Phase 5+) |
| **Fail** | > 0.5% pixel diff (`DIFF_FAIL_RATIO`) | Block phase completion |

Playwright `toHaveScreenshot` uses the same 0.5% fail threshold.

## Deterministic execution

Phase 0 does **not** modify application code. Determinism is enforced in test tooling:

1. **`addInitScript` before navigation** sets:
   - `planet-life-disclaimer-accepted=true`
   - `planet-life-lang` (`en` or `fa`)
   - `planet-life-home-view=daily-brief` (skips home onboarding modal)
2. **`reducedMotion: 'reduce'`** in Playwright context (static cinematic hero fallback)
3. **CSS injection** disables animations/transitions before paint
4. **`animations: 'disabled'`** on screenshots
5. **Wait:** `domcontentloaded` → `networkidle` (15s cap) → `document.fonts.ready` → 350ms settle

## Animation handling

- Cinematic hero WebGL is not captured in animated mode; reduced-motion static hero is the deterministic baseline for `/`.
- Canvas/chart pixels may vary slightly by font/subpixel rendering across OS/GPU; thresholds account for minor noise.

## Expected workflow (Sprint A)

1. **Phase 0:** commit baselines + this doc
2. **Each later phase:** run `npm run visual:diff` before marking DoD complete
3. **Intentional visual changes:** only in Phase 5 (logged) or approved chart/hero phases — update baselines with explicit review

## Troubleshooting

| Issue | Check |
|-------|-------|
| Disclaimer onboarding in shots | `addInitScript` not running — must be before `goto` |
| FA screenshots look English | `planet-life-lang` must be set in init script, not after navigation |
| `/home` shows view picker | `planet-life-home-view` missing from init script |
| Large diffs on `/` | Hero animation — confirm `reducedMotion: 'reduce'` |
| Dev server port | Default `http://localhost:3000` (Playwright `baseURL`) |

## Verification commands

```bash
cd apps/web
npm run visual:baseline
npm run visual:diff
ls tests/visual/baseline | wc -l   # expect 78 on Unix
```

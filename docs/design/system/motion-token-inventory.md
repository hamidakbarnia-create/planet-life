# Motion Token Inventory

Every duration, easing, transition, and animation currently in use. Documented as-is.

---

## CSS transition durations

| Duration | Easing | Properties | Source |
|----------|--------|------------|--------|
| `0.15s` | `ease` | `background`, `color`, `box-shadow` | `metioro-shell.css` sidebar nav |
| `0.15s` | `ease` | `border-color`, `color`, `background` | `metioro-ui-v2.css` `.mio-segment__option` |
| `0.15s` | `ease` | `opacity`, `background` | `metioro-shell.css` mobile overlay |
| `0.2s` | `ease` | `border-color`, `background` | `metioro-ui-v2.css` `.mio-glass--metric:hover` |
| `0.4s` | default | `opacity` | `vault/page.tsx` lock overlay inline |
| `600ms` | `ease-out` | `width` | `metioro-ui-v2.css` progress bar fill |

---

## Tailwind transition classes (observed)

| Class | Typical use |
|-------|-------------|
| `transition` | Landing CTAs, vault cards |
| `transition-all` | Settings chips, login, calendar hour bars, vault CTA |
| `transition-colors` | People rows, login OAuth, autocomplete, `CalculationDetails` |
| `transition-transform` | Month heatmap cells, calendar day cells |
| `transition-opacity` | `HomeViewOnboarding`, bottom nav vault link |
| `hover:opacity-90` | Landing hero primary CTA |
| `hover:scale-105` | Calendar day cells |
| `hover:scale-[1.02]` | Vault CTA |
| `hover:scale-[1.01]` | World preview cards |
| `disabled:opacity-40` / `disabled:opacity-50` | Buttons (instant, no duration) |

---

## Easing functions

| Easing | Where |
|--------|-------|
| `ease` | Shell nav, segments, glass metric |
| `ease-out` | Progress bar width |
| `cubic-bezier(0.4, 0, 0.2, 1)` | Dashboard score ring (`/dashboard`) |
| Tailwind default | `transition-all` / `transition-colors` (implicit) |

No custom easing tokens defined in `:root`.

---

## Keyframe animations

### `metioro-ui-v2.css`

None defined.

### `/dashboard` legacy (`page.tsx` inline)

| Name | Definition | Usage |
|------|------------|-------|
| `@keyframes fu` | `to { opacity: 1; transform: translateY(0) }` from `opacity:0; translateY(12px)` | `.fade-up` result cards |
| `@keyframes sh` | Background position sweep | `.shimmer` loading skeleton |

| Class | Duration | Other |
|-------|----------|-------|
| `.fade-up` | `0.5s ease forwards` | Staggered `animationDelay` 0–320ms |
| `.shimmer` | `1.5s infinite` | Gradient background animation |
| `.score-ring` | `1.4s cubic-bezier(0.4,0,0.2,1)` | SVG `stroke-dashoffset` |

### Landing WebGL — `CinematicHero`

| Type | Behavior |
|------|----------|
| Canvas render loop | Continuous animation (implementation in `cinematic-hero-webgl.ts`) |
| Not CSS-tokenized | — |

### `ModuleDisclaimerBanner`

Uses class `fade-up` (depends on dashboard keyframes if same class name — shares animation name pattern).

---

## Loading states (non-CSS-token)

| Pattern | Mechanism | Pages |
|---------|-----------|-------|
| Text swap | `"Analyzing…"` / `"Loading…"` label change | Ask, Calendar, Pathfinder, World |
| Progress counter | `done` / `total` numeric | Home month scores |
| Shimmer | `@keyframes sh` | Dashboard |
| WebGL ambient | Canvas loop | Landing hero |
| Vault lock | `opacity` 0 → 0.4 over `0.4s` | Vault gate |
| Disabled button | Instant opacity reduction | Forms app-wide |

---

## Hover motion summary

| Target | Motion type |
|--------|-------------|
| `mio-glass--metric` | Border/background 0.2s |
| `mio-segment__option` | Border/color/bg 0.15s |
| Sidebar nav | Background/color/shadow 0.15s |
| Alert action link | Color → `#f2cf75` (no duration token) |
| Calendar cells | `scale-105` transform |
| People rows | Background color |
| City autocomplete | `hover:bg-white/5` |

---

## Focus motion

| Element | Treatment |
|---------|-------------|
| Landing CTAs | `focus-visible:outline` 2px `#305CDE` offset 2px — no transition |
| `focusRingStyle()` | Instant `box-shadow` ring (TS) |
| App chips/segments | Border change on active; focus ring not globally defined |

---

## Scroll behavior

| Property | Value |
|----------|-------|
| `scroll-padding-top` | `calc(var(--metioro-header-h) + var(--metioro-safe-top))` |
| Header actions | `overflow-x: auto`; `-webkit-overflow-scrolling: touch` |
| Landing | Vertical scroll; anchor jumps (no smooth-scroll token) |
| Parallax | None in landing v1 |

---

## Reduced motion

| Status | Detail |
|--------|--------|
| `prefers-reduced-motion` | **Not defined** in `globals.css`, `metioro-ui-v2.css`, or `metioro-shell.css` |
| WebGL hero | Runs regardless of OS preference |
| Dashboard keyframes | Always active when page loaded |

---

## Page / route transitions

| Behavior | Detail |
|----------|--------|
| Next.js navigation | No route transition animation |
| Client step flows | Ask, Login — content swap without enter/exit animation |
| Redirects | Instant (`/setting`, home calendar pref) |

---

## Modal / overlay motion

| Component | Enter/exit |
|-----------|------------|
| `DisclaimerGate` | Appears without documented CSS enter animation |
| World search modal | Instant display |
| `GeocodeConfirmDialog` | Instant |
| Vault reserve modal | Instant |

---

## Inline style transitions (examples)

| Location | Style |
|----------|-------|
| `vault/page.tsx` lock overlay | `transition: 'opacity 0.4s'` |
| `dashboard/page.tsx` score ring | `transition: stroke-dashoffset 1.4s cubic-bezier(...)` |

---

## Sources

| File | Motion content |
|------|----------------|
| `apps/web/app/metioro-ui-v2.css` | Segment, metric, progress transitions |
| `apps/web/app/metioro-shell.css` | Nav, overlay transitions |
| `apps/web/app/dashboard/page.tsx` | Keyframes `fu`, `sh` |
| `apps/web/app/vault/page.tsx` | Lock opacity transition |
| `apps/web/components/CinematicHero.tsx` | WebGL + button transitions |
| Component Tailwind | `transition-*`, `hover:scale-*` |

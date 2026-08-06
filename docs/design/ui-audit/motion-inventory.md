# Motion Inventory

Transitions, animations, loading states, hover, and scroll. Observations only.

---

## Page Transitions

- **No route-level transition animation** between Next.js pages
- Content swaps via client state (Ask steps, Login steps) without animated transitions
- Redirects (`/setting` → `/settings`, home calendar pref → `/calendar`) are instantaneous

---

## Loading Animations

| Pattern | Location | Behavior |
|---------|----------|----------|
| Text swap | Ask, Calendar, Pathfinder, World | "Analyzing…" / "Loading…" replaces button or status label |
| Progress counter | Home month scores | `done`/`total` progress display |
| Shimmer skeleton | `/dashboard` (legacy) | `@keyframes sh` gradient sweep 1.5s infinite |
| Fade-up stagger | `/dashboard` (legacy) | `@keyframes fu` opacity + translateY 0.5s per card with delay |
| Score ring stroke | `/dashboard` (legacy) | `stroke-dashoffset` transition 1.4s cubic-bezier |
| WebGL render loop | Landing `CinematicHero` | Continuous canvas animation |
| Vault lock overlay | `/vault` | Opacity transition 0.4s on enter |

---

## Hover States

| Element | Motion |
|---------|--------|
| `mio-glass--metric` | Border + background 0.2s ease |
| `mio-segment__option` | Border, color, background 0.15s ease |
| Sidebar nav items | Background, color, box-shadow 0.15s ease |
| Calendar day cells | `hover:scale-105` transform |
| Vault CTA | `hover:scale-[1.02]` |
| People list rows | `transition-colors` background |
| People icon buttons | Color + background on hover |
| Landing hero CTAs | `hover:opacity-90` or border brighten |
| Alert action links | Color shift to `#f2cf75` |
| Bottom nav Vault link | `hover:opacity-90` |
| City autocomplete rows | `hover:bg-white/5` |
| Login / Settings chips | `transition-all` border/color |

---

## Focus States

| Element | Motion |
|---------|--------|
| Landing CTAs | `focus-visible:outline` 2px `#305CDE` offset 2px |
| Landing skip link | `focus:not-sr-only` reveals positioned link |
| Segment / chips | No dedicated motion; border change on active state |

---

## Scroll Behavior

| Context | Behavior |
|---------|----------|
| `html` | `scroll-padding-top` accounts for sticky header + safe area |
| `metioro-shell` | Same scroll-padding-top |
| Header actions | Horizontal `overflow-x: auto` with hidden scrollbar |
| Landing | Vertical document scroll; in-page anchor navigation to sections |
| Main content | Standard vertical scroll within shell |
| Reduced scroll-driven hero | Landing v1 removed 460vh cinematic scroll; hero is static editorial |

---

## CSS Transition Summary

| Duration | Easing | Common properties |
|----------|--------|-------------------|
| 0.15s | ease | Nav, segments, shell elements |
| 0.2s | ease | Glass metric hover |
| 0.4s | (default) | Vault lock opacity |
| 600ms | ease-out | Progress bar width (`metioro-ui-v2.css`) |
| 1.4s | cubic-bezier(0.4,0,0.2,1) | Dashboard score ring |

---

## Transform Usage

- `hover:scale-105` — calendar day cells
- `hover:scale-[1.02]` — vault CTA
- `translateY(12px)` → `0` — dashboard fade-up entrance
- No global page slide or fade on navigation

---

## Reduced Motion

- **No `prefers-reduced-motion` media queries** found in `metioro-ui-v2.css`, `metioro-shell.css`, or `globals.css`
- WebGL hero runs regardless of user motion preference (observed from source)
- Dashboard shimmer/keyframes always active when that page is viewed

---

## Interactive Feedback (Non-animation)

- Button `disabled:opacity-40` / `disabled:opacity-50` — no animation, instant
- Active nav state — instant background/border change
- Modal open — content appears without documented enter animation

---

## Scroll-linked / Parallax

- Landing v1: no scroll-linked hero phases (removed in landing experience v1)
- `mio-app-bg` star field is fixed decorative layer, not scroll-parallax

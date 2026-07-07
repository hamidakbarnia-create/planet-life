# Spacing Inventory

Every existing spacing value, gap, and padding pattern. Documented as-is.

---

## CSS Spacing Scale — `--mio-space-*` (`metioro-ui-v2.css`)

| Token | Value |
|-------|-------|
| `--mio-space-1` | `4px` |
| `--mio-space-2` | `8px` |
| `--mio-space-3` | `12px` |
| `--mio-space-4` | `16px` |
| `--mio-space-5` | `20px` |
| `--mio-space-6` | `24px` |

No `--mio-space-7+` tokens defined.

---

## Shell Geometry — `--metioro-*` (`metioro-shell.css`)

| Token | Value | Role |
|-------|-------|------|
| `--metioro-sidebar-w` | `92px` | Desktop sidebar width |
| `--metioro-header-h` | `84px` | Sticky header height base |
| `--metioro-mobile-nav-h` | `76px` | Bottom nav height base |
| `--metioro-safe-top` | `env(safe-area-inset-top, 0px)` | Notch offset |
| `--metioro-safe-bottom` | `env(safe-area-inset-bottom, 0px)` | Home indicator offset |
| `--metioro-safe-left` | `env(safe-area-inset-left, 0px)` | — |
| `--metioro-safe-right` | `env(safe-area-inset-right, 0px)` | — |

### Shell padding (hardcoded + token)

| Location | Value |
|----------|-------|
| `.metioro-shell` mobile `padding-bottom` | `calc(var(--metioro-mobile-nav-h) + var(--metioro-safe-bottom))` |
| `.metioro-shell` desktop `margin-left` | `var(--metioro-sidebar-w)` |
| `.metioro-header` padding | `calc(safe-top + 10px) max(20px, safe-right) 10px max(20px, safe-left)` |
| `.metioro-header` gap | `16px` |
| `.metioro-header__actions` gap | `8px` |
| `.metioro-header__actions` padding-inline | `4px` |
| `.metioro-main` padding | `var(--mio-space-3)` mobile; `var(--mio-space-3) 16px` tablet+ |
| Sidebar `padding-top` | `calc(var(--metioro-header-h) + var(--metioro-safe-top) + 16px)` |
| Sidebar nav item gap | `6px` (between icon and label) |

---

## Glass card padding (by variant)

| Class | Padding |
|-------|---------|
| `.mio-glass--primary` | `var(--mio-space-3) var(--mio-space-4)` |
| `.mio-glass--secondary` | `var(--mio-space-3) var(--mio-space-4)` |
| `.mio-glass--metric` | `var(--mio-space-3)` |
| `.mio-glass--action` | `var(--mio-space-4)` |
| `.mio-glass--signature` | `var(--mio-space-3) var(--mio-space-4)` |
| FA override (primary/secondary/signature) | `var(--mio-space-2) var(--mio-space-3)` |
| FA override (metric) | `var(--mio-space-2)` |

---

## Section spacing (CSS classes)

| Class / block | Spacing |
|-------------|---------|
| `.mio-page-header` | `margin-bottom: var(--mio-space-4)`; gap `var(--mio-space-4)` |
| `.mio-page-header__eyebrow` | `margin-bottom: var(--mio-space-1)` |
| `.mio-page-header__subtitle` | `margin-top: var(--mio-space-1)` |
| `.mio-eyebrow` | `margin-bottom: var(--mio-space-3)` |
| `.mio-alert` | `padding: var(--mio-space-3) var(--mio-space-4)`; `margin-bottom: var(--mio-space-4)`; gap `var(--mio-space-2) var(--mio-space-3)` |
| `.mio-segment` | `gap: var(--mio-space-2)` |
| `.mio-segment__option` | `padding: 8px 14px`; `min-height: 44px` |
| `.mio-insight-card` | `padding: var(--mio-space-3) var(--mio-space-4)`; `margin-bottom: var(--mio-space-3)` |
| `.mio-obs-grid`, `.mio-analysis-grid`, `.mio-sig-grid` | `gap: var(--mio-space-3)` (FA: `--mio-space-2`) |
| `.mio-obs-below` | `gap: var(--mio-space-2)` (FA: `--mio-space-1` column) |
| `.mio-empty-state` | `padding: var(--mio-space-5)`; modal `padding: var(--mio-space-4)` |

---

## Layout gaps (component-level Tailwind)

| Pattern | Value | Where |
|---------|-------|-------|
| `gap-2` | 8px | Settings chips, people form, world lists |
| `gap-3` | 12px | Common card internals, pathfinder |
| `gap-4` | 16px | Page sections |
| `gap-1.5` | 6px | `CosmosCard` chip |
| `gap-1` | 4px | Micro layouts |
| `space-y-*` | Tailwind scale | Form stacks |

---

## Scroll / offset spacing

| Property | Value |
|----------|-------|
| `html` `scroll-padding-top` | `calc(var(--metioro-header-h) + var(--metioro-safe-top))` |
| `.metioro-shell` `scroll-padding-top` | Same |
| `.mio-insight-card` `scroll-margin-top` | `calc(var(--metioro-header-h, 84px) + var(--metioro-safe-top, 0px) + 12px)` |

---

## Header chip spacing (`metioro-shell.css`)

| Element | Padding |
|---------|---------|
| `.metioro-header-chip` | `7px 12px` |
| Sidebar nav link | `12px 8px` |
| Bottom nav item | `8px 4px 10px` |
| Vault pill | `8px 14px` |

---

## Page-local padding (non-token, observed)

| Value | Where |
|-------|-------|
| `p-4`, `p-5`, `p-6` | People rows, vault cards, upgrade, world modals |
| `px-3 py-2`, `px-4 py-2.5` | Form controls, chips |
| `px-8 py-3.5` | Vault CTA |
| `py-3` | Primary buttons (login, ask) |
| `max-w-md` / `max-w-2xl` | Onboarding modal, world search modal |

---

## Touch target minimums

| Element | Min size |
|---------|----------|
| `.mio-segment__option` | `min-height: 44px` |
| People icon buttons | `32×32` (`w-8 h-8`) |
| Bottom nav items | Full tab width × nav height |

---

## FA spacing overrides summary

When `lang='fa'`:

- Glass card padding reduced one step on scale
- Grid gaps: `--mio-space-3` → `--mio-space-2`
- Column gaps in obs-below: `--mio-space-2` → `--mio-space-1`
- Hero/below margins: `--mio-space-4` → `--mio-space-2`

---

## Sources

| File | Content |
|------|---------|
| `apps/web/app/metioro-ui-v2.css` | `--mio-space-*`, component padding/gaps |
| `apps/web/app/metioro-shell.css` | Shell geometry, nav padding |
| `apps/web/app/globals.css` | `scroll-padding-top` reference |

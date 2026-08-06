# Responsive Audit

Layout differences across desktop, tablet, and mobile. Observations only.

---

## Breakpoints

| Breakpoint | Source | Effect |
|------------|--------|--------|
| `768px` (`md`) | `metioro-shell.css` | Sidebar appears; bottom padding removed; left margin for sidebar |
| Tailwind defaults | Various pages | `sm:`, `md:`, `lg:` grid columns on landing, upgrade, world |
| `100dvh` | Shell | Min-height uses dynamic viewport |

---

## Shell Geometry

| Viewport | Layout |
|----------|--------|
| Mobile (<768px) | Full-width content; fixed bottom nav 76px + safe area; sticky header 84px + safe top |
| Desktop (≥768px) | 92px left sidebar; no bottom nav; content offset `margin-left: 92px` |

**Chrome direction:** Shell always `direction: ltr` regardless of content language.

---

## Navigation Exposure

| Item | Mobile | Desktop |
|------|--------|---------|
| Today | Bottom nav | Sidebar |
| Map/Calendar | Not in bottom nav | Sidebar |
| Ask | Bottom nav | Sidebar |
| People | Bottom nav | Sidebar |
| Pathfinder | Bottom nav | Sidebar |
| World | Hidden | Sidebar |
| Profile | Bottom nav | Sidebar |
| Settings | Hidden | Sidebar |
| Vault | Header pill | Header pill |
| Upgrade | Header tier badge | Header tier badge |

---

## Landing (`/`)

| Viewport | Behavior |
|----------|----------|
| Mobile | Stacked sections; nav adapts per `LandingNav`; hero CTAs stack |
| Tablet/Desktop | Wider prose; multi-column grids in How It Works and Product Preview where defined |
| Hero | Editorial layout; WebGL background fills viewport width |

---

## Today (`/home`)

| Viewport | Behavior |
|----------|----------|
| Mobile | Single column; heatmap/brief full width |
| Desktop | Same column within main; more horizontal space for heatmap grid |

---

## Calendar (`/calendar`)

| Viewport | Behavior |
|----------|----------|
| Mobile | Month grid in main column; day cells `aspect-square`; horizontal scroll on header actions |
| Desktop | Wider grid; hourly timeline expands |

---

## Ask (`/ask`)

| Viewport | Behavior |
|----------|----------|
| Mobile | Single column module/question flow |
| Desktop | Same flow; wider cards |

---

## People (`/people`)

| Viewport | Behavior |
|----------|----------|
| Mobile | Full-width list rows; form stacks |
| Desktop | Identical structure with more horizontal padding |

---

## Profile (`/profile`)

| Viewport | Behavior |
|----------|----------|
| Mobile | Natal chart scales to container width; form fields stack |
| Desktop | Metric grids may use multi-column (`mio-obs-grid`, etc.) |

---

## Vault (`/vault`)

| Viewport | Behavior |
|----------|----------|
| Mobile | Section cards wrap single or dual column |
| Desktop | Multi-column grid for 7 section cards |

---

## Upgrade (`/upgrade`)

| Viewport | Behavior |
|----------|----------|
| Mobile | Tier cards stack vertically |
| Desktop | Tier comparison grid side-by-side |

---

## World (`/world`)

| Viewport | Behavior |
|----------|----------|
| Mobile | Not in bottom nav — reachable via direct URL or desktop only in normal flow |
| Desktop | Primary intended viewport; preview card grid |

**Note:** Mobile users without sidebar cannot reach World through primary navigation.

---

## Settings (`/settings`)

| Viewport | Behavior |
|----------|----------|
| Mobile | Page exists but no bottom nav entry — requires direct URL or desktop sidebar |
| Desktop | Sidebar access |

---

## Pathfinder (`/pathfinder`)

| Viewport | Behavior |
|----------|----------|
| Mobile | Bottom nav access; single column results |
| Desktop | Sidebar + wider content |

---

## Login (`/login`)

| Viewport | Behavior |
|----------|----------|
| Mobile | Centered card with horizontal padding |
| Desktop | Same card, max-width constrained |

---

## Header Actions

| Viewport | Behavior |
|----------|----------|
| Narrow | `metioro-header__actions` horizontal scroll, scrollbar hidden |
| Wide | Actions fit in header row |

---

## Safe Areas

- `env(safe-area-inset-*)` applied to shell padding (notch devices)
- Bottom nav accounts for `safe-area-inset-bottom`

---

## RTL Responsiveness

- Content `dir` mirrors for `fa` / `ar`
- Sidebar remains left-fixed in LTR geometry
- FA reduces font sizes and padding (see typography inventory)

---

## Touch Targets

- `mio-segment__option` documents `min-height: 44px`
- Bottom nav items sized for touch
- People icon buttons 32×32 (below 44px)

---

## Legacy Dashboard

| Viewport | Behavior |
|----------|----------|
| All | Standalone layout; `grid-cols-2` on some result sections at wider widths |

---

## Dev Chart Test

- Not responsive-tested; dev-only route

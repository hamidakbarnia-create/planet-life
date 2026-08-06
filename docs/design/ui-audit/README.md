# METIORO UI Audit — Step 0 Inspection

> **Status:** Complete (inspection only)  
> **Authority:** Open Registry — UI Audit Sprint  
> **Date:** 2026-07-07  
> **Scope:** Evidence-based inventory of current application UI. No code modified.

---

## Purpose

Establish a factual baseline of every user-facing screen, reusable component pattern, and observable UI characteristic before any future refinement work.

This sprint produced documentation only. No design proposals, no implementation, no governance changes.

---

## Method

- Repository route inventory (`apps/web/app/**/page.tsx`)
- Component and stylesheet inspection (`apps/web/components/`, `metioro-ui-v2.css`, `metioro-shell.css`, `brand-theme.ts`)
- Cross-reference with navigation model (`AppShell`, `BottomNav`, landing `LandingNav`)
- Lighthouse accessibility notes from Landing Experience v1 run (observational context only)

No live browser session was required for this documentation sprint; findings are derived from source structure and established UI patterns in code.

---

## Document Index

| File | Contents |
|------|----------|
| [screen-inventory.md](./screen-inventory.md) | Per-route identity, layout, navigation, components |
| [component-inventory.md](./component-inventory.md) | Reusable UI components and patterns |
| [navigation-map.md](./navigation-map.md) | Entry/exit points and nav models |
| [typography-inventory.md](./typography-inventory.md) | Type scale and utility classes |
| [color-inventory.md](./color-inventory.md) | Palette, surfaces, status colors |
| [motion-inventory.md](./motion-inventory.md) | Transitions, loading, scroll |
| [accessibility-audit.md](./accessibility-audit.md) | Landmarks, focus, hierarchy, contrast |
| [responsive-audit.md](./responsive-audit.md) | Desktop / tablet / mobile behavior |
| [known-inconsistencies.md](./known-inconsistencies.md) | Observable inconsistencies + strengths |

---

## Strengths (Observable)

- **Dual chrome models are distinct:** Marketing landing (`/`) uses its own nav and section rhythm; authenticated app routes use `AppShell` with consistent header + sidebar/bottom nav.
- **Glass card system (`mio-glass`)** is defined centrally in `metioro-ui-v2.css` with variant classes (`primary`, `secondary`, `metric`, `action`, `technical`, `signature`).
- **Brand tokens** are centralized in `lib/brand-theme.ts` (royal blue, navy, gold, tier themes).
- **i18n coverage:** App routes support en / ru / fa / ar with RTL on fa and ar; landing and app both read `planet-life-lang` from localStorage.
- **Score/explainability UI** reuses `ScoreBreakdownPanel`, `AnalysisResultBreakdown`, `ChartTrustCard` across Ask, Calendar, Profile-adjacent flows.
- **Landing v1** uses semantic landmarks (`main`, section headings), skip link, and editorial hierarchy separate from app cosmic chrome.

---

## Inconsistencies (Observable)

See [known-inconsistencies.md](./known-inconsistencies.md) for the full inventory. Summary:

- Two visual languages: editorial landing vs cosmic `mio-app-bg` app interior
- Navigation label mismatch: bottom nav key `map` routes to `/calendar`; product copy often says "Calendar"
- Gold accent used for both premium/Vault and active nav state
- Inline styles coexist with CSS token classes across pages
- Legacy `/dashboard` retains separate UI patterns not used by primary nav
- Provider, Julia, Notifications are product concepts without dedicated top-level routes

---

## Routes Not in Expected List

| Expected | Actual route | Notes |
|----------|--------------|-------|
| Provider | `/vault/provider` | Vault section, not top-level |
| Julia | — | VIP tier on `/upgrade`; advisor card on `/ask`; vault content references |
| Notifications | — | Calendar export mode option only |
| — | `/pathfinder` | In primary nav (mobile + desktop) |
| — | `/world` | In desktop nav only |
| — | `/dashboard` | Legacy; not in bottom nav |

---

## Definition of Done

- [x] Every user-facing screen inspected and documented
- [x] Reusable components inventoried
- [x] Inconsistencies documented (no solutions)
- [x] No source code modified
- [x] No locked governance decisions reopened

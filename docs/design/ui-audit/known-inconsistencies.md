# Known Inconsistencies

Observable UI inconsistencies and established strengths. No solutions, redesign ideas, or prioritization.

---

## Strengths (Consistency)

### Shell & Navigation
- Authenticated routes consistently wrap `AppShell` with sticky header, tier badge, vault pill, and language chips
- Mobile bottom nav and desktop sidebar share the same route keys (`today`, `ask`, `people`, `pathfinder`, `profile`)
- Shell chrome geometry locked LTR across all languages

### Design System
- `mio-glass` variant system provides repeatable card surfaces across Profile, Vault, World, Pathfinder
- `PageHeader` + `AlertBanner` pattern reused on Home and similar entry screens
- Brand colors centralized in `brand-theme.ts` with rgba helpers and tier themes
- Score band semantics (`BAND_STYLES`, golden/danger/neutral) shared across Calendar, Ask, and Home

### Internationalization
- Four languages (en, ru, fa, ar) on app routes and landing
- RTL handling for fa/ar with dedicated font stacks
- FA-specific typography scale reduction applied systematically in `metioro-ui-v2.css`

### Explainability
- `AnalysisResultBreakdown` / score reasoning panels appear in Ask and related scored flows
- `ActionDisclaimer` on Calendar for action context

### Landing (v1)
- Editorial hero separate from app cosmic interior — clear marketing vs product boundary
- Skip link and `main` landmark on landing

---

## Inconsistencies (Observable)

### Dual Visual Languages
- **Landing** uses black editorial layout, royal blue CTAs, `LandingNav`, section anchors
- **App** uses cosmic `mio-app-bg`, gold eyebrows, glass cards, sidebar/bottom nav
- **Login** uses centered card without either full landing or full app chrome
- **Dashboard (legacy)** uses inline styles, fade-up animations, and custom cards — not `mio-glass`

### Navigation Label vs Product Naming
- Bottom/desktop nav labels Calendar as **"Map"** (`map` key → `/calendar`)
- Page title and copy use **"Strategic Calendar"** / calendar terminology
- Sprint expected route name "Calendar" does not match nav label "Map"

### Route Availability vs Product Concepts
- **Provider** exists only as `/vault/provider`, not top-level nav
- **Julia** has no dedicated route — appears on Upgrade VIP, Ask advisor card, vault copy
- **Notifications** has no screen — only Calendar export mode label "App notifications only"

### Mobile vs Desktop Feature Parity
- **World** and **Settings** appear in desktop sidebar only — no mobile bottom nav entry
- Mobile users cannot reach World or Settings through primary navigation without direct URL

### Gold Accent Overload
- Gold used simultaneously for: nav active state, premium/Vault positioning, eyebrows, metric hover, warning alerts, and tier emphasis
- Settings active chips use Tailwind **amber `#fbbf24`** instead of `--mio-gold` / `--brand-gold`

### Navy / Background Token Drift
- `brand-theme` navy `#0B1736` vs shell/ui `--metioro-navy` / `--mio-navy` `#060a14`
- `globals.css` `--background` `#0A0F1C` vs shell `background: #0a0f1c` (same value, different variable paths)

### Component vs Ad-hoc Controls
- `SegmentControl` exists in `components/ui/` but Settings and Login use custom chip buttons with parallel styling
- Option rows in Settings duplicate chip pattern inline rather than shared primitive

### Typography System Split
- App uses `mio-*` CSS tokens for headers and labels
- Many pages also use Tailwind arbitrary sizes (`text-[10px]`, `tracking-widest`) outside token scale
- `.fc` / `.fi` injected in AppShell vs landing `getLandingFontFamily` — different heading pipelines

### Page Header Adoption
- `PageHeader` used on Home
- Calendar, Ask, People, Vault, Upgrade implement their own title blocks with similar but not identical markup/classes

### Empty States
- Profile uses `mio-empty-state` with decorative ring
- Other screens use plain text empty messages without shared component

### Motion & Accessibility
- No `prefers-reduced-motion` rules in primary stylesheets
- Landing WebGL runs continuously
- Calendar day selection uses transform hover on cells without consistent keyboard alternative
- Skip link on landing only — not on app routes

### Legacy Orphan
- `/dashboard` retains separate UI patterns and animations not linked from current navigation
- `/setting` (singular) redirect exists — duplicate URL pattern

### Header Chip Overflow
- Header actions scroll horizontally on narrow viewports — functional but can hide tier/vault/lang chips off-screen

### Vault vs App Tone
- Vault copy and pink/gold accents introduce a distinct "members-only" visual tone within the same AppShell

### Export / Notifications UX
- "App notifications only" export option implies notification delivery — no in-app notification UI exists to correspond

### Dev Surfaces in Production Tree
- `ChartDevPanelGate` on Profile
- `/dev/chart-test` route exists in app directory

### Form Label Association
- Settings option labels are visual `div` labels without `htmlFor` / `fieldset`/`legend` semantics
- Chip groups function as toggles but use independent buttons without `aria-pressed` pattern observed

### Score Color Dependency
- Calendar, Ask, and Home communicate score quality primarily through background color bands

### Breadcrumbs
- No shared breadcrumb component — back links vary in copy and placement (Vault, Upgrade, Ask, People detail)

---

## Cross-Reference

| Topic | Document |
|-------|----------|
| Per-screen detail | [screen-inventory.md](./screen-inventory.md) |
| Components | [component-inventory.md](./component-inventory.md) |
| Navigation | [navigation-map.md](./navigation-map.md) |
| Typography | [typography-inventory.md](./typography-inventory.md) |
| Color | [color-inventory.md](./color-inventory.md) |
| Motion | [motion-inventory.md](./motion-inventory.md) |
| Accessibility | [accessibility-audit.md](./accessibility-audit.md) |
| Responsive | [responsive-audit.md](./responsive-audit.md) |

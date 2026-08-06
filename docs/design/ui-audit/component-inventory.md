# Component Inventory

Reusable UI components and observable patterns. No redesign notes.

---

## Shell & Navigation

| Component | Location | Role |
|-----------|----------|------|
| `AppShell` | `components/AppShell.tsx` | Wraps authenticated routes: header, main, sidebar, bottom nav, disclaimer gate |
| `BottomNav` | `components/BottomNav.tsx` | Mobile 5-tab bar: Today, Ask, People, Pathfinder, Profile |
| Desktop sidebar | `metioro-shell.css` + `AppShell` | 8 items: Today, Map, Ask, People, Pathfinder, World, Profile, Settings |
| `LandingNav` | `components/landing/LandingNav.tsx` | Marketing top nav with lang + section links |
| `DisclaimerGate` | `components/DisclaimerGate.tsx` | First-visit disclaimer modal gate |
| `BrandLogo` | `components/BrandLogo.tsx` | Logo B mark + wordmark |

---

## UI Primitives (`components/ui/`)

| Component | Variants / notes |
|-----------|------------------|
| `GlassCard` | Wraps `mio-glass` classes; props for variant (`primary`, `secondary`, `metric`, `action`, `technical`, `signature`) |
| `MetricCard` | Label + value metric display on glass surface |
| `PageHeader` | Eyebrow + title + optional actions slot |
| `AlertBanner` | `warning` \| `info` \| `success`; optional action link; `role="status"` |
| `SegmentControl` | Tab-like segmented control (defined; usage varies by page) |

---

## Cards

| Pattern | Where used |
|---------|------------|
| `mio-glass` base | Profile, Pathfinder, World, Vault |
| `mio-glass--primary` | Highlight panels |
| `mio-glass--secondary` | Subordinate panels |
| `mio-glass--metric` | KPI tiles with hover border brighten |
| `mio-glass--signature` | Profile personal signature highlight |
| Vault section preview cards | `/vault` grid links |
| Tier cards | `/upgrade` pricing grid |
| World preview cards | `/world` section grid |
| Oracle module cards | `/ask` module picker |
| People list rows | `/people` rounded-2xl rows |
| Landing trust/how/preview cards | Landing sections |

---

## Buttons

| Pattern | Characteristics |
|---------|-----------------|
| Primary CTA (landing) | `bg-[#305CDE]`, rounded-lg, white text |
| Primary CTA (app) | Gold or blue depending on page; `fc` class (Cormorant / display) on some |
| Secondary / ghost | Border `white/10–25`, hover brighten |
| Chip toggles | Settings, Login lang, Upgrade cycle — bordered pills, active gold/amber |
| Icon buttons | People edit/delete 32×32 rounded-lg |
| OAuth buttons | Login full-width bordered rows |
| Vault CTA | `hover:scale-[1.02]` rounded-xl |
| Analyze / submit | `tracking-widest`, disabled opacity 40–50% |

---

## Inputs

| Component | Usage |
|-----------|-------|
| Native `input[type=date]`, `time`, `text` | Ask, Profile, People forms |
| `CityAutocomplete` | Profile, People, ActionLocationPicker |
| `ActionLocationPicker` | Ask — location role + search |
| OTP / code input | Login verification step |
| File input (photo) | People avatar upload |
| Search inputs | Pathfinder city, World figure/city modals |
| Contact form fields | `/contact` |

---

## Chips & Pills

| Pattern | Usage |
|---------|-------|
| `metioro-header-chip` | Header actions (lang, tier, vault) |
| `SynergyBadgePill` | People synergy tier badge |
| Relationship type chips | People form picker |
| Score band legend chips | Calendar legend |
| LIVE badge | World sections |
| Tier badges (Popular, Current) | Upgrade page |
| Export mode options | Calendar export panel |
| Area filter chips | Pathfinder |

---

## Tabs

| Pattern | Usage |
|---------|-------|
| Login email/phone tabs | Custom button tabs, not `SegmentControl` |
| Oracle flow steps | Implicit tabs via step state (module → question → date → result) |
| Home view modes | Settings option chips (daily-brief / calendar / heatmap) — not tab UI on home after selection |

---

## Lists

| Pattern | Usage |
|---------|-------|
| People list | Avatar + metadata rows |
| Ask history | Recent questions list with timestamps |
| Calendar transit list | Planet positions |
| World news list | Headlines with sources |
| Pathfinder lines/effects | Stacked result lists |
| Vault section grid | Link cards |

---

## Dialogs & Modals

| Component | Trigger |
|-----------|---------|
| `DisclaimerGate` | First app visit |
| `GeocodeConfirmDialog` | Profile city geocode confirm |
| `FaChartConfirmModal` | Persian calendar chart confirm |
| World search modals | Figure/city search overlay |
| Upgrade reserve modal | VIP founder reserve form |
| Login steps | Inline card steps (not modal) |

---

## Charts & Visualizations

| Component | Usage |
|-----------|-------|
| `NatalChart` | Profile SVG natal wheel |
| `MonthHeatmapGrid` | Home heatmap view |
| Calendar month grid | Score-colored day cells |
| Calendar hourly bars | Horizontal score bars |
| `AnalysisResultBreakdown` | Ask result breakdown |
| `ScoreBreakdownPanel` | Shared score reasoning |
| `ChartTrustCard` | Trust/explainability card |
| Dashboard score ring | Legacy SVG ring animation |
| `CinematicHero` WebGL | Landing ambient canvas |
| Pathfinder | Line/effect data (no globe WebGL in current stub) |

---

## Empty States

| Pattern | Usage |
|---------|-------|
| `mio-empty-state` + ring | Profile chart locked (`ProfileUnlockEmpty`) |
| Ask history empty | Text message |
| People empty | Prompt to add first person |
| World `noRead` | No signals message |
| Pathfinder `noLines` | Empty search result |

---

## Banners & Disclaimers

| Component | Usage |
|-----------|-------|
| `AlertBanner` | Home no-profile warning |
| `ActionDisclaimer` | Calendar action context |
| `disclaimers/*` | Legal inline disclaimers |

---

## Footer

| Component | Usage |
|-----------|-------|
| `LandingFooter` | Landing page |
| `SiteFooter` | Legal pages, some app-adjacent pages |

---

## Reusable Patterns (Cross-cutting)

1. **Glass morphism stack** — `mio-glass` + backdrop blur + gold border highlight on primary/signature variants
2. **Page header block** — eyebrow (gold uppercase) + title + optional right actions
3. **i18n lang chip row** — EN/RU/FA/AR in header or page corner; persists `planet-life-lang`
4. **No-profile gate** — Alert or inline message + link to `/profile`
5. **Score band coloring** — Shared `BAND_STYLES` / `scoreToBand` across Calendar, Ask, Home
6. **Explainability panel** — Breakdown + reasoning text after scored API response
7. **Upgrade funnel** — Links to `/upgrade` from Vault, Pathfinder teaser, tier badge
8. **Fi / Fc font utilities** — `fi` = Inter body; `fc` = Cormorant/display for CTAs and emphasis

---

## Components by Page Frequency

| High reuse | Medium | Page-specific |
|------------|--------|---------------|
| `AppShell`, `AlertBanner`, `GlassCard`, score panels | `PersonAvatar`, `CityAutocomplete`, `BrandLogo` | `LandingHero`, `NatalChart`, `DisclaimerGate`, `CinematicHero` |

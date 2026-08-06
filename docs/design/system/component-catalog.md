# Component Catalog

Every reusable component in `apps/web/components/`. Test files (`.test.tsx`) excluded. Documented as-is.

---

## Shell & Navigation

### `AppShell`

| Field | Value |
|-------|-------|
| **Location** | `components/AppShell.tsx` |
| **Purpose** | Authenticated app chrome: header, main, sidebar, bottom nav, tier/lang/session actions |
| **Variants** | None (single component; `fontFamily` optional override) |
| **Current usage** | All primary app routes (`/home`, `/calendar`, `/ask`, `/people`, `/profile`, `/vault`, `/settings`, `/upgrade`, `/pathfinder`, `/world`, etc.) |
| **CSS dependencies** | `metioro-shell`, `mio-app-bg`, `.fc`/`.fi` injection, `brand-theme` tier/lang styles |

### `BottomNav` (exports `MobileTabBar`, `DesktopSidebar`, `VaultPill`)

| Field | Value |
|-------|-------|
| **Location** | `components/BottomNav.tsx` |
| **Purpose** | Primary navigation — mobile 5-tab bar, desktop 8-item sidebar, vault header pill |
| **Variants** | `MobileTabBar`, `DesktopSidebar`, `VaultPill` (named exports) |
| **Current usage** | Composed inside `AppShell` |
| **Nav keys** | Mobile: `today`, `ask`, `people`, `pathfinder`, `profile`. Desktop adds: `map`, `world`, `settings` |

### `DisclaimerGate`

| Field | Value |
|-------|-------|
| **Location** | `components/DisclaimerGate.tsx` |
| **Purpose** | Blocks app until educational disclaimer accepted; bypasses legal paths |
| **Variants** | Legal path bypass vs gated flow |
| **Current usage** | Wrapped around app content in layout/shell |
| **Child** | `DisclaimerOnboarding` |

### `BrandLogo`

| Field | Value |
|-------|-------|
| **Location** | `components/BrandLogo.tsx` |
| **Purpose** | Logo B wordmark + optional tagline (DEC-0003) |
| **Variants** | `size`: `sm` \| `md` \| `lg` \| `shell`; `showTagline`; `onDark`; `href` optional |
| **Current usage** | `AppShell` header, login, upgrade, landing |
| **Assets** | `/metioro-logo.svg`, `/metioro-logo-dark.svg` |

---

## UI Primitives (`components/ui/`)

### `GlassCard`

| Field | Value |
|-------|-------|
| **Location** | `components/ui/GlassCard.tsx` |
| **Purpose** | Glass morphism container with optional eyebrow/title |
| **Variants** | `primary`, `secondary`, `metric`, `action`, `technical`, `signature` |
| **Current usage** | Profile, Pathfinder, World, Vault-adjacent flows |
| **CSS** | `mio-glass`, `mio-glass--{variant}` |

### `MetricCard`

| Field | Value |
|-------|-------|
| **Location** | `components/ui/MetricCard.tsx` |
| **Purpose** | KPI tile: label + value on metric glass |
| **Variants** | Optional `icon` |
| **Current usage** | Profile personal signature grid |
| **CSS** | `mio-glass--metric`, `mio-sig-metric`, `mio-label`, `mio-value` |

### `PageHeader`

| Field | Value |
|-------|-------|
| **Location** | `components/ui/PageHeader.tsx` |
| **Purpose** | Standard page title block: eyebrow, title, subtitle, trailing slot |
| **Variants** | Optional `eyebrow`, `subtitle`, `trailing` |
| **Current usage** | `/home` (primary adopter); other pages often use custom headers |
| **CSS** | `mio-page-header`, `mio-page-header__*` |

### `AlertBanner`

| Field | Value |
|-------|-------|
| **Location** | `components/ui/AlertBanner.tsx` |
| **Purpose** | Inline status banner with optional action link |
| **Variants** | `warning` \| `info` \| `success` |
| **Current usage** | `/home` no-profile warning |
| **CSS** | `mio-alert`, `mio-alert--{variant}`; `role="status"` |

### `SegmentControl`

| Field | Value |
|-------|-------|
| **Location** | `components/ui/SegmentControl.tsx` |
| **Purpose** | Accessible segmented button group |
| **Variants** | Generic `T extends string` options + labels |
| **Current usage** | Defined; Settings/Login use parallel ad-hoc chip pattern instead |
| **CSS** | `mio-segment`, `mio-segment__option`, `mio-segment__option--active`; `aria-pressed` |

---

## Landing (`components/landing/`)

### `LandingPage`

| Field | Value |
|-------|-------|
| **Location** | `components/landing/LandingPage.tsx` |
| **Purpose** | Composes full marketing landing |
| **Variants** | Per `LandingLang` (en, ru, fa, ar) |
| **Current usage** | `/` via `app/page.tsx` |

### `LandingNav`

| Field | Value |
|-------|-------|
| **Location** | `components/landing/LandingNav.tsx` |
| **Purpose** | Marketing top nav: section anchors, lang, CTA |
| **Current usage** | Landing only |

### `LandingHero`

| Field | Value |
|-------|-------|
| **Location** | `components/landing/Hero/LandingHero.tsx` |
| **Purpose** | Editorial hero section wrapper |
| **Current usage** | Landing; wraps `CinematicHero` |

### `CinematicHero`

| Field | Value |
|-------|-------|
| **Location** | `components/CinematicHero.tsx` |
| **Purpose** | Hero layout + ambient WebGL background |
| **Variants** | Editorial mode (landing v1) |
| **Current usage** | Landing hero |

### `LandingTrust`

| Field | Value |
|-------|-------|
| **Location** | `components/landing/Trust/LandingTrust.tsx` |
| **Purpose** | Trust pillars section (`#trust`) |
| **Current usage** | Landing |

### `LandingHowItWorks`

| Field | Value |
|-------|-------|
| **Location** | `components/landing/LandingHowItWorks.tsx` |
| **Purpose** | How-it-works steps + philosophy (`#how`) |
| **Current usage** | Landing |

### `LandingProductPreview`

| Field | Value |
|-------|-------|
| **Location** | `components/landing/Preview/LandingProductPreview.tsx` |
| **Purpose** | Product module preview cards (`#features`) |
| **Current usage** | Landing |

### `LandingCta`

| Field | Value |
|-------|-------|
| **Location** | `components/landing/CTA/LandingCta.tsx` |
| **Purpose** | Final CTA section |
| **Current usage** | Landing |

### `LandingFooter`

| Field | Value |
|-------|-------|
| **Location** | `components/landing/Footer/LandingFooter.tsx` |
| **Purpose** | Landing footer links |
| **Current usage** | Landing |

---

## Home (`components/home/`)

### `DailyBriefView`

| Field | Value |
|-------|-------|
| **Location** | `components/home/DailyBriefView.tsx` |
| **Purpose** | Today score, hourly windows, golden/danger hours |
| **Current usage** | `/home` when view = `daily-brief` |

### `MonthHeatmapGrid`

| Field | Value |
|-------|-------|
| **Location** | `components/home/MonthHeatmapGrid.tsx` |
| **Purpose** | Month score heatmap alternative home view |
| **Current usage** | `/home` when view = `heatmap` |

### `HomeViewOnboarding`

| Field | Value |
|-------|-------|
| **Location** | `components/home/HomeViewOnboarding.tsx` |
| **Purpose** | First-visit modal to pick home view mode |
| **Variants** | Options: `daily-brief`, `calendar`, `heatmap` |
| **Current usage** | `/home` first visit |

### `CosmosCard`

| Field | Value |
|-------|-------|
| **Location** | `components/home/CosmosCard.tsx` |
| **Purpose** | Cosmic/transit summary card for daily brief |
| **Current usage** | Inside `DailyBriefView` |

### `PeopleHomeRow`

| Field | Value |
|-------|-------|
| **Location** | `components/PeopleHomeRow.tsx` |
| **Purpose** | Horizontal people preview row |
| **Current usage** | Available; not on landing v1 |

---

## Charts & Scores

### `NatalChart`

| Field | Value |
|-------|-------|
| **Location** | `components/NatalChart.tsx` |
| **Purpose** | SVG natal wheel visualization + analysis export |
| **Variants** | `NatalChart`, `NatalChartAnalysis` exports |
| **Current usage** | `/profile` |

### `ChartSkeleton`

| Field | Value |
|-------|-------|
| **Location** | `components/ChartSkeleton.tsx` |
| **Purpose** | Loading placeholder for chart |
| **Current usage** | Profile chart load |

### `ScoreBreakdownPanel`

| Field | Value |
|-------|-------|
| **Location** | `components/ScoreBreakdownPanel.tsx` |
| **Purpose** | Expandable score factor breakdown |
| **Current usage** | Calendar, Ask, shared score flows |

### `AnalysisResultBreakdown`

| Field | Value |
|-------|-------|
| **Location** | `components/AnalysisResultBreakdown.tsx` |
| **Purpose** | Ask result score + reasoning display |
| **Current usage** | `/ask` result step |

### `ChartTrustCard`

| Field | Value |
|-------|-------|
| **Location** | `components/ChartTrustCard.tsx` |
| **Purpose** | Trust/explainability checklist card |
| **Current usage** | Profile-adjacent trust surfaces |

### `CalculationDetails`

| Field | Value |
|-------|-------|
| **Location** | `components/CalculationDetails.tsx` |
| **Purpose** | Collapsible technical calculation breakdown |
| **Current usage** | `/profile` |

---

## People & Synergy

### `PersonAvatar`

| Field | Value |
|-------|-------|
| **Location** | `components/PersonAvatar.tsx` |
| **Purpose** | Photo or initials avatar with border |
| **Variants** | Image vs initials fallback |
| **Current usage** | `/people`, `/people/[id]`, `PeopleHomeRow` |

### `SynergyBadgePill`

| Field | Value |
|-------|-------|
| **Location** | `components/SynergyBadge.tsx` |
| **Purpose** | Synergy tier pill (aligned / caution / tension) |
| **Variants** | `badge` key → `BADGE_STYLES` |
| **Current usage** | People list, person detail |

### `SynergyIntelligenceDashboard`

| Field | Value |
|-------|-------|
| **Location** | `components/SynergyIntelligenceDashboard.tsx` |
| **Purpose** | Full synergy dashboard for a person |
| **Current usage** | `/people/[id]` |

---

## Forms & Inputs

### `CityAutocomplete`

| Field | Value |
|-------|-------|
| **Location** | `components/CityAutocomplete.tsx` |
| **Purpose** | City search with geocode selection |
| **Current usage** | Profile, People, ActionLocationPicker |

### `ActionLocationPicker`

| Field | Value |
|-------|-------|
| **Location** | `components/ActionLocationPicker.tsx` |
| **Purpose** | Location role picker for scored actions |
| **Current usage** | `/ask` when location required |

---

## Dialogs & Modals

### `GeocodeConfirmDialog`

| Field | Value |
|-------|-------|
| **Location** | `components/GeocodeConfirmDialog.tsx` |
| **Purpose** | Confirm geocoded city before chart generation |
| **Current usage** | `/profile` |

### `FaChartConfirmModal`

| Field | Value |
|-------|-------|
| **Location** | `components/FaChartConfirmModal.tsx` |
| **Purpose** | Confirm Persian calendar chart interpretation |
| **Current usage** | `/profile` (fa lang) |

### `DisclaimerOnboarding`

| Field | Value |
|-------|-------|
| **Location** | `components/disclaimers/DisclaimerOnboarding.tsx` |
| **Purpose** | First-visit disclaimer acceptance UI |
| **Current usage** | Via `DisclaimerGate` |

---

## Disclaimers & Legal

### `ActionDisclaimer`

| Field | Value |
|-------|-------|
| **Location** | `components/disclaimers/ActionDisclaimer.tsx` |
| **Purpose** | Inline action-context disclaimer (calendar) |
| **Current usage** | `/calendar` |

### `ModuleDisclaimerBanner`

| Field | Value |
|-------|-------|
| **Location** | `components/disclaimers/ModuleDisclaimerBanner.tsx` |
| **Purpose** | Module-level disclaimer with fade-up class |
| **Current usage** | Module surfaces using disclaimer pattern |

### `LegalPageShell`

| Field | Value |
|-------|-------|
| **Location** | `components/LegalPageShell.tsx` |
| **Purpose** | Wrapper for legal prose pages |
| **Current usage** | `/privacy`, `/terms`, `/cookies`, `/disclaimer`, `/contact` |

### `SiteFooter`

| Field | Value |
|-------|-------|
| **Location** | `components/SiteFooter.tsx` |
| **Purpose** | Site-wide footer links |
| **Current usage** | Legal pages, some marketing-adjacent pages |

---

## Dev / Internal

### `ChartDevPanel`

| Field | Value |
|-------|-------|
| **Location** | `components/ChartDevPanel.tsx` |
| **Purpose** | Developer chart debug panel |
| **Current usage** | Gated via `ChartDevPanelGate` |

### `ChartDevPanelGate`

| Field | Value |
|-------|-------|
| **Location** | `components/ChartDevPanelGate.tsx` |
| **Purpose** | Conditional render gate for dev panel |
| **Current usage** | `/profile` |

---

## CSS-only component patterns (no React file)

| Pattern | CSS classes | Usage |
|---------|-------------|-------|
| Glass card system | `mio-glass`, `mio-glass--*` | Vault, World, Upgrade inline cards |
| Page header | `mio-page-header__*` | Pages with custom headers |
| Empty state | `mio-empty-state`, `mio-empty-state__ring` | Profile unlock |
| Insight card | `mio-insight-card` | Daily brief hero card |
| Segment (CSS only usage) | `mio-segment__*` | Available via `SegmentControl` |
| Header chip | `metioro-header-chip` | Lang, tier, session |
| Nav active | `metioro-sidebar__link--active` | Desktop sidebar |

---

## Ad-hoc patterns (page-local, not components)

| Pattern | Location | Notes |
|---------|----------|-------|
| Settings chip buttons | `app/settings/page.tsx` | Mirrors segment styling inline |
| Login tab chips | `app/login/page.tsx` | Custom grid tabs |
| Upgrade tier cards | `app/upgrade/page.tsx` | `TIER_THEME` inline styles |
| Vault section cards | `app/vault/page.tsx` | Link cards with lock overlay |
| World preview / modals | `app/world/page.tsx` | Inline surface styles |
| Calendar month grid | `app/calendar/page.tsx` | Score-colored cells |
| Dashboard fade-up cards | `app/dashboard/page.tsx` | Legacy; separate design language |

---

## Component count summary

| Category | Count (excl. tests) |
|----------|---------------------|
| Shell & nav | 4 |
| UI primitives | 5 |
| Landing | 9 |
| Home | 4 |
| Charts & scores | 6 |
| People | 3 |
| Forms | 2 |
| Dialogs | 3 |
| Disclaimers & legal | 4 |
| Dev | 2 |
| **Total React components** | **~42** |

---

## Cross-references

| Topic | File |
|-------|------|
| UI audit component notes | [../ui-audit/component-inventory.md](../ui-audit/component-inventory.md) |
| Design tokens | [design-token-inventory.md](./design-token-inventory.md) |
| Known inconsistencies | [../ui-audit/known-inconsistencies.md](../ui-audit/known-inconsistencies.md) |

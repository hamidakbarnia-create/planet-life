# Screen Inventory

Per-screen inspection records. Observations only — no recommendations.

---

## `/` — Landing

### Identity
- **Route:** `/`
- **Purpose:** Marketing entry; explain product value and drive sign-up
- **Primary user task:** Understand METIORO and start free or explore how it works

### Layout
- Full-viewport vertical stack: `LandingNav` → `LandingHero` → `LandingTrust` → `LandingHowItWorks` → `LandingProductPreview` → `LandingCta` → `LandingFooter`
- Black background (`COLORS.black`); editorial spacing between sections
- Hero: eyebrow, H1 headline, supporting copy, two CTAs (Start Free, See How It Works)
- No `AppShell`; no cosmic `mio-app-bg`
- Section anchors: `#trust`, `#how`, `#features` (via nav links)

### Navigation
- **Entry:** Direct URL, external links, post-login redirect from marketing CTAs
- **Exit:** `/login`, `/home` (Start Free), in-page anchor scroll
- **Active nav:** Landing nav highlights section on scroll (LandingNav)
- **Breadcrumbs:** None

### Components
- `LandingNav`, `LandingHero` (wraps `CinematicHero` ambient WebGL), `LandingTrust`, `LandingHowItWorks`, `LandingProductPreview`, `LandingCta`, `LandingFooter`, `BrandLogo`
- Buttons: primary blue CTA, secondary bordered CTA
- Cards: trust pillars, how-it-works steps, product preview module cards
- No tabs, dialogs, or charts on landing

### Typography
- Font family per language via `getLandingFontFamily(lang)`
- Hero H1 large editorial scale; eyebrow uppercase tracking
- Body copy white at reduced opacity

### Color Usage
- Black base; royal blue (`#305CDE`) primary CTA; white text hierarchy
- WebGL ambient background in hero (subtle, non-interactive)

### Motion
- WebGL canvas animation in hero background
- Button `hover:opacity-90` and border transitions on secondary CTA
- No page transition animation between routes

### Accessibility
- Skip link to `#main-content`
- `main` landmark with `id="main-content"`
- `dir` and `lang` on main element
- Focus-visible outlines on hero CTAs

### Responsiveness
- Mobile-first section stacking; nav collapses to mobile pattern in `LandingNav`
- Hero CTAs stack on narrow viewports

---

## `/home` — Today

### Identity
- **Route:** `/home`
- **Purpose:** Daily decision brief — today's scored window and month context
- **Primary user task:** See today's timing score and navigate to calendar or ask

### Layout
- `AppShell` wrapper with `mio-app-bg`
- `PageHeader` with title from `HOME_LANGS`
- Conditional: `HomeViewOnboarding` (first visit), `AlertBanner` (no profile), `DailyBriefView`, or `MonthHeatmapGrid`
- If stored home view is `calendar`, redirects to `/calendar`

### Navigation
- **Entry:** Bottom nav "Today", desktop sidebar "Today", post-login default
- **Exit:** Calendar (via view or nav), Profile (alert CTA), Ask, other tabs
- **Active nav:** `today` tab highlighted
- **Breadcrumbs:** None

### Components
- `PageHeader`, `AlertBanner`, `DailyBriefView`, `MonthHeatmapGrid`, `HomeViewOnboarding`
- Score displays, progress indicators during month load
- Language selector in header actions

### Typography
- Page title via `mio-page-header__title`
- Brief content uses `fi` (Inter) body classes

### Color Usage
- Cosmic navy gradient background
- Score bands use calendar score colors (green/amber/red semantics)
- Gold accents in headers and active chips

### Motion
- Month score loading shows progress (`done`/`total`)
- Heatmap cells use hover scale on calendar-adjacent patterns

### Accessibility
- Alert banner uses `role="status"`
- Heading hierarchy via `PageHeader`

### Responsiveness
- Single-column main content; header chips scroll horizontally on narrow screens
- Bottom nav fixed on mobile; sidebar offset on desktop (768px+)

---

## `/calendar` — Strategic Calendar (nav label: Map)

### Identity
- **Route:** `/calendar`
- **Purpose:** Month/day strategic timing calendar with hourly breakdown
- **Primary user task:** Find golden and danger windows; export events

### Layout
- `AppShell` + month grid + selected day panel + hourly timeline
- `ActionDisclaimer` inline
- Legend band for score ranges
- Transit snapshot section
- Strategic GPS tone panel
- Export panel with three modes (all, important, notifications-only)

### Navigation
- **Entry:** Desktop sidebar "Map", home redirect if calendar view preference, deep links
- **Exit:** Profile (no profile banner), Ask, other tabs
- **Active nav:** `map` key active in nav (label shows localized "Map" / calendar equivalent)
- **Breadcrumbs:** None

### Components
- Month grid cells (`aspect-square`, score-colored)
- Hourly timeline bars
- Export option chips / checkboxes
- `ActionDisclaimer`
- Transit list items
- Loading state: "Analyzing…"

### Typography
- Title: "Strategic Calendar" (localized)
- Weekday abbreviations, month names per lang pack
- Small legend labels

### Color Usage
- `BAND_STYLES` and `GPS_TONE_STYLES` for score bands
- Golden / danger / neutral semantic colors on day and hour cells
- Navy header consistent with shell

### Motion
- Day cells: `hover:scale-105`
- Hour bars: `transition-all` width animation
- Progress bar width `600ms ease-out` (ui-v2)

### Accessibility
- Grid is visual; day selection is click-based
- Disclaimer text present for action context

### Responsiveness
- Grid scales in main column; horizontal scroll on header actions
- Month navigation prev/next controls

---

## `/ask` — Ask (Oracle)

### Identity
- **Route:** `/ask`
- **Purpose:** Module → question → date → scored answer flow
- **Primary user task:** Ask one question and receive one scored answer

### Layout
- Multi-step flow: module picker → question picker → date/time → result
- History section (last 20 questions, localStorage)
- Advisor upsell card referencing Julia (30-minute session)
- `ActionLocationPicker` when location required
- `AnalysisResultBreakdown` on result

### Navigation
- **Entry:** Bottom nav "Ask", links from other screens
- **Exit:** Profile (no profile), back steps within flow, other tabs
- **Active nav:** `ask`
- **Breadcrumbs:** Back button between steps (in-flow, not breadcrumb trail)

### Components
- Module cards / list
- Question list
- Date and optional time inputs
- Analyze button with loading state
- History list with clear action
- `AnalysisResultBreakdown`, `ActionLocationPicker`
- Advisor card (Julia reference)

### Typography
- Title: "Ask a question"
- Step labels uppercase tracking in places
- Result score large display

### Color Usage
- Module selection uses bordered cards
- Score result uses band colors
- Advisor card distinct secondary surface

### Motion
- Button state: "Analyzing…" text swap
- Standard `transition-all` on interactive elements

### Accessibility
- Form inputs for date/time
- Link to Profile when profile missing

### Responsiveness
- Single column flow; module grid wraps

---

## `/people` — People

### Identity
- **Route:** `/people`
- **Purpose:** Manage relationship profiles for synergy analysis
- **Primary user task:** Add, edit, or open a person's synergy dashboard

### Layout
- List of people cards with avatar, name, relationship, synergy badge
- Inline add/edit form (toggle `showForm`)
- `CityAutocomplete` in form
- Empty state when no people

### Navigation
- **Entry:** Bottom nav "People"
- **Exit:** `/people/[id]` on row tap, Profile, other tabs
- **Active nav:** `people`
- **Breadcrumbs:** None

### Components
- `PersonAvatar`, `SynergyBadgePill`, `CityAutocomplete`
- List rows with edit/delete icon buttons
- Form: text inputs, date/time, relationship select, photo upload
- Relationship type chips

### Typography
- Page title from `PEOPLE_LANGS`
- List name `text-sm` / medium weight

### Color Usage
- `BADGE_STYLES` per synergy tier
- Row hover `hover:bg-white/[0.03]`
- Delete hover `hover:text-red-400`

### Motion
- Row `transition-colors`
- Icon button hover backgrounds

### Accessibility
- Photo upload via file input
- Delete is icon-only button

### Responsiveness
- Form and list single column

---

## `/people/[id]` — Person Synergy

### Identity
- **Route:** `/people/[id]`
- **Purpose:** Per-person synergy dashboard and relationship timing
- **Primary user task:** View synergy score and relationship-specific insights

### Layout
- `AppShell` with person header (avatar, name)
- Synergy metrics and relationship profile content
- Back link to people list

### Navigation
- **Entry:** Tap person on `/people`
- **Exit:** `/people` back, other app routes via shell
- **Active nav:** `people` remains conceptually active
- **Breadcrumbs:** Back link text (not formal breadcrumb component)

### Components
- `PersonAvatar`, `SynergyBadgePill`, `GlassCard`, score displays
- Charts / breakdown panels as data loads

### Typography
- Person name as primary heading
- Metric labels small caps pattern

### Color Usage
- Synergy badge colors
- Glass cards on cosmic background

### Motion
- Standard card hover where `mio-glass--metric` applies

### Accessibility
- Dynamic route; heading includes person name

### Responsiveness
- Stacked metric cards on mobile

---

## `/vault` — Vault Gate

### Identity
- **Route:** `/vault`
- **Purpose:** Members-only preview gate for premium inner content
- **Primary user task:** Enter vault preview or navigate to upgrade

### Layout
- Eyebrow "Members only"
- Title, subtitle, promise copy
- CTA "Step inside" unlocks preview state (localStorage flag)
- Grid of section preview cards (7 sections)
- Back to Today link

### Navigation
- **Entry:** Header Vault pill chip in `AppShell`
- **Exit:** `/home`, `/upgrade`, `/vault/[section]` on card tap
- **Active nav:** Vault pill highlighted in header (not bottom nav)
- **Breadcrumbs:** "← Back to Today"

### Components
- Section preview cards (link to `/vault/[section]`)
- Lock icon overlay when not entered
- CTA button with hover scale
- Tier/membership state from `loadTier`

### Typography
- Eyebrow dot-prefixed tracking
- Section titles medium; preview text muted

### Color Usage
- Vault-specific pink/gold accent undertones on cards
- Locked state reduced opacity (0.4)

### Motion
- Lock overlay `transition: opacity 0.4s`
- CTA `hover:scale-[1.02]`

### Accessibility
- Cards are links with descriptive text

### Responsiveness
- Section grid wraps (multi-column on wider screens)

---

## `/vault/[section]` — Vault Sections (incl. Provider)

### Identity
- **Route:** `/vault/sensuality`, `/vault/cycle`, `/vault/provider`, `/vault/shadow`, `/vault/look`, `/vault/power`, `/vault/lounge`
- **Purpose:** Section-specific preview content behind vault gate
- **Primary user task:** Explore locked premium feature preview

### Layout
- Section title and preview copy
- Paywall / upgrade CTA patterns
- Provider section: Jupiter / astrocartography wealth-line preview

### Navigation
- **Entry:** Vault grid card tap
- **Exit:** `/vault`, `/upgrade`, `/home`
- **Active nav:** Vault header pill
- **Breadcrumbs:** Implicit back via vault index

### Components
- Preview cards, upgrade links, locked feature placeholders

### Typography
- Section-specific titles from `VAULT_LANGS`

### Color Usage
- Consistent vault card styling

### Motion
- Card link `transition-all`

### Accessibility
- Heading per section name

### Responsiveness
- Single column content

---

## `/profile` — Profile

### Identity
- **Route:** `/profile`
- **Purpose:** Birth data, natal chart, personal signature, location management
- **Primary user task:** Save birth profile and view natal chart

### Layout
- Form section: name, date, time, location, calendar type
- `NatalChart` SVG visualization
- `NatalChartAnalysis`, `MetricCard` grid, `GlassCard` sections
- `CalculationDetails` collapsible
- `ProfileUnlockEmpty` when chart locked
- Modals: `GeocodeConfirmDialog`, `FaChartConfirmModal`

### Navigation
- **Entry:** Bottom nav "Profile", alert CTAs from other screens
- **Exit:** Settings (desktop nav), other tabs
- **Active nav:** `profile`
- **Breadcrumbs:** None

### Components
- `NatalChart`, `MetricCard`, `GlassCard`, `PageHeader` (implicit via layout)
- `CityAutocomplete` pattern via city search dropdown
- `ChartDevPanelGate` (dev-gated)
- Empty state ring component

### Typography
- Planet/aspect labels from `PROFILE_LANGS`
- Personal signature heading

### Color Usage
- Chart uses sign/planet color conventions
- `mio-glass--signature` for highlight card

### Motion
- Chart load loading state
- Collapsible `CalculationDetails` transition-colors

### Accessibility
- Form labels for birth fields
- Empty state text in `mio-empty-state`

### Responsiveness
- Chart scales within container; form stacks on mobile

---

## `/settings` — Settings

### Identity
- **Route:** `/settings` ( `/setting` redirects here )
- **Purpose:** App preferences — home view, house system, zodiac, calendar system, language
- **Primary user task:** Configure calculation and display preferences

### Layout
- Option rows with label + chip button groups (`OptionRow`)
- Language selector
- Reset / clear cache actions at bottom

### Navigation
- **Entry:** Desktop sidebar "Settings" only (not in mobile bottom nav)
- **Exit:** Other routes via sidebar/header
- **Active nav:** `settings` on desktop sidebar
- **Breadcrumbs:** None

### Components
- Custom chip buttons (not `SegmentControl` component)
- Option groups for enum preferences

### Typography
- Labels: `text-[10px] uppercase tracking-widest`
- Chip text `text-xs`

### Color Usage
- Active chip: amber/gold border `#fbbf24` (Tailwind amber, not `--mio-gold`)
- Inactive: white/10 border, white/50 text

### Motion
- Chip `transition-all`

### Accessibility
- Buttons for options (not native radio group semantics)

### Responsiveness
- Chips wrap with `flex-wrap gap-2`

---

## `/upgrade` — Upgrade

### Identity
- **Route:** `/upgrade`
- **Purpose:** Tier comparison and pricing (Free, Pro, Premium, VIP/Julia)
- **Primary user task:** Compare tiers and initiate upgrade (checkout stub)

### Layout
- Eyebrow, title, subtitle
- Monthly/yearly cycle toggle
- Tier cards in grid (4 tiers)
- Expandable detail sections per tier
- VIP reserve / founder modal flow
- `BrandLogo` in header area

### Navigation
- **Entry:** Vault CTAs, paywall links, header tier badge
- **Exit:** Back link, `/contact`, other routes
- **Active nav:** None dedicated; reached via CTAs
- **Breadcrumbs:** Back text link

### Components
- Tier cards with feature lists
- Cycle toggle chips
- Popular/current badges
- Reserve modal (form inputs)
- Uses `TIER_THEME`, `GRADIENTS` from brand-theme

### Typography
- Tier names large; feature lists body size
- Eyebrow dot-prefixed

### Color Usage
- Per-tier theme colors from `TIER_THEME`
- Gold gradients on premium tiers

### Motion
- Expand/collapse details
- Submit loading states

### Accessibility
- Form in reserve modal with labels

### Responsiveness
- Tier grid stacks on mobile

---

## `/pathfinder` — Pathfinder

### Identity
- **Route:** `/pathfinder`
- **Purpose:** Relocation astrology — city lines and best times
- **Primary user task:** Search a city and see astrocartography effects

### Layout
- Search input + analyze button
- Free teaser vs paid content gating (`isPaid`)
- Active lines list, effects, best times sections
- Globe/note explanatory copy

### Navigation
- **Entry:** Bottom nav "Pathfinder", desktop sidebar
- **Exit:** `/upgrade` (free teaser), `/profile` (no profile), other tabs
- **Active nav:** `pathfinder`
- **Breadcrumbs:** None

### Components
- Search input, area filter chips
- Line/effect cards
- Loading and error states

### Typography
- Title "Pathfinder"; subtitle explanatory

### Color Usage
- Verdict colors per effect tone
- Upgrade CTA gold/blue

### Motion
- Loading text "Analyzing…"

### Accessibility
- Search input with placeholder

### Responsiveness
- Single column results

---

## `/world` — World

### Identity
- **Route:** `/world`
- **Purpose:** Macro decision intelligence — markets, geopolitics, figures, cities
- **Primary user task:** Browse world sections and open live readings

### Layout
- Section preview cards (Markets, Geopolitics, Real Estate, Figures, Daily Brief)
- Expandable live panels with news + sky signals
- Search modals for figure and city
- LIVE badge on active sections

### Navigation
- **Entry:** Desktop sidebar "World" only (not mobile bottom nav)
- **Exit:** Full reading panels, close actions, other routes
- **Active nav:** `world` on desktop
- **Breadcrumbs:** None

### Components
- Preview cards with tags
- News list items
- Sky signal chips with `toneColor`
- Search modal overlays
- Loading shimmer patterns

### Typography
- Section titles; LIVE label uppercase
- News headlines body size

### Color Usage
- Signal tone colors from `world-i18n`
- Card glass surfaces

### Motion
- Modal open/close
- Loading "Analyzing…"

### Accessibility
- Search modals with close button
- LIVE announced visually only

### Responsiveness
- Card grid wraps; modals full-width on mobile

---

## `/login` — Login

### Identity
- **Route:** `/login`
- **Purpose:** Authentication entry (email/phone OTP stub, Google/Apple buttons)
- **Primary user task:** Sign in and sync data

### Layout
- Centered card on dark background
- No `AppShell`
- Steps: identifier → code → success
- Tab switch: email / phone
- OAuth buttons below divider
- Language chips top-right

### Navigation
- **Entry:** Landing CTAs, direct URL
- **Exit:** Redirect to `/home` on success
- **Active nav:** None
- **Breadcrumbs:** None

### Components
- Tab chips, form inputs, OTP input
- OAuth-styled buttons (Google, Apple)
- `BrandLogo`

### Typography
- Welcome title; tagline from `BRAND_I18N`
- Form labels `text-xs`

### Color Usage
- Card on navy; blue primary actions
- Language chip active/inactive borders

### Motion
- Step transitions (content swap, no route animation)
- Button `transition-all` / `transition-colors`

### Accessibility
- Form labels present
- Invalid state messages

### Responsiveness
- Centered card max-width; padding on mobile

---

## `/dashboard` — Legacy Analyze

### Identity
- **Route:** `/dashboard`
- **Purpose:** Legacy business analyze UI (pre-primary-nav era)
- **Primary user task:** Run location-based business score analysis

### Layout
- Standalone page without `AppShell`
- Custom inline styles and animations (`fade-up`, `shimmer`, `score-ring`)
- City search, analyze button, result cards

### Navigation
- **Entry:** Direct URL / bookmarks only
- **Exit:** None in primary nav
- **Active nav:** None
- **Breadcrumbs:** None

### Components
- Custom score ring SVG
- Fade-up result cards
- Shimmer loading skeleton
- City autocomplete inline

### Typography
- Custom `fi` / `fc` classes; tracking-widest on CTA

### Color Usage
- Inline rgba backgrounds per score band
- Differs from `mio-glass` system

### Motion
- `@keyframes fu` fade-up stagger
- `@keyframes sh` shimmer
- Score ring stroke animation 1.4s

### Accessibility
- No shell landmarks; standalone document structure

### Responsiveness
- Grid cols-2 on some result sections

---

## Legal & Contact Screens

### `/privacy`, `/terms`, `/cookies`, `/disclaimer`, `/contact`

### Identity
- **Purpose:** Legal compliance and contact form
- **Primary user task:** Read policies or send contact message

### Layout
- `LegalPageShell` wrapper (disclaimer uses variant)
- `SiteFooter` on marketing-adjacent pages
- Prose-style long-form text sections
- Contact: form fields + submit

### Navigation
- **Entry:** Footer links from landing and app
- **Exit:** Footer links, back to home/landing
- **Active nav:** None
- **Breadcrumbs:** None

### Components
- `LegalPageShell`, `SiteFooter`
- Form inputs on contact

### Typography
- Prose headings and body in legal shell

### Color Usage
- Dark background consistent with brand; muted body text

### Motion
- Minimal transitions

### Accessibility
- Document structure with headings in legal content

### Responsiveness
- Narrow prose column centered

---

## `/dev/chart-test` — Dev Chart Test

### Identity
- **Route:** `/dev/chart-test`
- **Purpose:** Development chart rendering test
- **Primary user task:** Validate chart component output

### Layout
- Minimal dev layout; `ChartTestClient`
- Not linked from production navigation

### Navigation
- **Entry:** Direct URL only
- **Exit:** Browser back
- **Active nav:** None

*Documented for completeness; not a user-facing production screen.*

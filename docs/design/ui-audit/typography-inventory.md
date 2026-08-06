# Typography Inventory

Documented type scale, font stacks, and usage patterns. Observations only.

---

## Font Families

| Token / class | Stack | Usage |
|---------------|-------|-------|
| `--font-sora` / `TYPOGRAPHY.brand` | Sora → Geist Sans | Brand headings LTR; `globals.css` body default |
| `--font-geist-sans` / `TYPOGRAPHY.body` | Geist Sans | App body via `.fi` |
| `--font-vazirmatn` | Vazirmatn | Persian (`fa`) body and display |
| `--font-cairo` | Cairo | Arabic (`ar`) body and display |
| `--font-geist-mono` | Geist Mono | Mono / technical labels |
| `.fc` (Cormorant/display) | Injected per-lang in `AppShell` via `headingFont` | CTAs, emphasis headings in app |
| `.fi` (Inter/body) | Injected per-lang in `AppShell` via `bodyFont` | Body copy in app |
| Landing | `getLandingFontFamily(lang)` | Per-language landing stack |

**RTL behavior:** `[dir="rtl"]` sets `line-height: 1.65`, `letter-spacing: 0`. FA/AR override `.fc` and `.fi` stacks in `globals.css`.

---

## CSS Token Scale (`metioro-ui-v2.css` :root)

| Token | Default (LTR) | FA override |
|-------|---------------|-------------|
| `--mio-label` | 9px | 8px |
| `--mio-caption` | 11px | 10px |
| `--mio-body` | 13px | 12px |
| `--mio-value` | 15px | 13px |
| `--mio-heading-sm` | 0.7rem | 0.65rem |
| `--mio-heading-md` | 1.125rem | 1rem |
| `--mio-heading-lg` | 1.35rem | 1.18rem |

FA also reduces glass card padding and grid gaps; disables uppercase/letter-spacing on eyebrows and labels.

---

## Semantic Classes

| Class | Size source | Weight | Transform / tracking |
|-------|-------------|--------|-------------------|
| `.mio-page-header__eyebrow` | `--mio-heading-sm` | 600 | uppercase, 0.18em |
| `.mio-page-header__title` | `--mio-heading-lg` | 700 | 0.01em, white |
| `.mio-page-header__subtitle` | `--mio-caption` | normal | muted 48% white |
| `.mio-eyebrow` | `--mio-heading-sm` | 600 | uppercase, gold |
| `.mio-label` | `--mio-label` | normal | uppercase, 0.12em, muted |
| `.mio-value` | `--mio-value` | 600 | body color |
| `.mio-value--lg` | 1.05rem | 700 | — |

---

## Tailwind / Inline Usage (outside token system)

| Pattern | Where observed |
|---------|----------------|
| `text-[10px] uppercase tracking-widest` | Settings option labels |
| `text-xs` | Chips, secondary labels, login form |
| `text-sm` | Buttons, list items, body shortcuts |
| `tracking-widest` | Vault CTA, dashboard analyze button |
| `tracking-wide` | Login submit |

---

## Heading Hierarchy by Context

### Landing
- Single H1 in hero (locked headline: *Every decision has a better time.*)
- Section H2s in Trust, How It Works, Product Preview, CTA
- No shared `mio-page-header` component

### App (AppShell routes)
- `PageHeader` → semantic title block (typically one primary title per page)
- Section headings within pages vary: some `h2`, some styled `div` with heading classes
- Profile: chart section headings + `MetricCard` labels

### Legal
- `LegalPageShell` prose headings (document structure)

### Login
- `welcomeTitle` as primary heading
- Step titles swap per flow state

---

## Caption Usage

- Page subtitles via `mio-page-header__subtitle` (11px muted)
- Alert action links: `--mio-caption`, weight 600
- Segment options: `--mio-caption`
- Calendar legend band labels: small text inline
- Tier feature lists on upgrade: body-adjacent size

---

## Body Styles

- Default foreground: `#F6F8FC` (`--foreground`)
- Muted body: `--mio-text-muted` = `rgba(255,255,255,0.42)`
- Primary body: `--mio-text-body` = `rgba(255,255,255,0.88)`
- Inline white opacity steps: `/75`, `/50`, `/35` via Tailwind on various pages

---

## Display / Brand Copy

| Location | Treatment |
|----------|-----------|
| Landing hero | Large editorial H1, language-specific font |
| App shell tagline | Header area (brand) |
| Constitutional line | Brand copy in i18n (not always visible on every screen) |
| Upgrade eyebrow | Dot-prefixed uppercase (`· Choose your altitude ·`) |
| Vault eyebrow | Dot-prefixed (`· Members only ·`) |

---

## Monospace

- `TYPOGRAPHY.mono` / `--font-geist-mono` available
- Used sparingly; technical calculation details may use smaller fixed-width feel

---

## Cross-language Observations

- EN/RU: uppercase eyebrows and labels with wide tracking
- FA: scoped smaller scale; eyebrows not uppercase; reduced padding
- AR: Cairo stack; RTL line-height 1.5 on h1–h3
- App shell chrome stays `direction: ltr` regardless of content language (DEC shell geometry)

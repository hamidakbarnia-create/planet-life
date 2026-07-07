# Typography Token Inventory

Every existing typography token and type-related pattern. Documented as-is.

---

## Font Family Tokens

### CSS / Next.js variables

| Token | Stack | Default usage |
|-------|-------|---------------|
| `--font-sora` | Sora | `globals.css` body default; `TYPOGRAPHY.brand` |
| `--font-geist-sans` | Geist Sans | `TYPOGRAPHY.body`; Tailwind `--font-sans` |
| `--font-geist-mono` | Geist Mono | `TYPOGRAPHY.mono` |
| `--font-vazirmatn` | Vazirmatn | Persian (`fa`) |
| `--font-cairo` | Cairo | Arabic (`ar`) |

### TypeScript — `TYPOGRAPHY` (`brand-theme.ts`)

| Key | Value |
|-----|-------|
| `brand` | `var(--font-sora), var(--font-geist-sans), sans-serif` |
| `body` | `var(--font-geist-sans), sans-serif` |
| `bodyRtl` | `var(--font-vazirmatn), var(--font-cairo), var(--font-geist-sans), sans-serif` |
| `bodyAr` | `var(--font-cairo), var(--font-vazirmatn), sans-serif` |
| `mono` | `var(--font-geist-mono), monospace` |

### Runtime injection — `AppShell`

| Class | Injected from | Purpose |
|-------|---------------|---------|
| `.fc` | `brandHeadingFont(lang)` | Headings, CTAs, eyebrows in app |
| `.fi` | `brandBodyFont(lang, fontFamily?)` | Body copy in app |

`brandHeadingFont`: `ar` → `bodyAr`; `fa` → `bodyRtl`; else → `brand`.

### Landing — `getLandingFontFamily(lang)`

| Lang | Family |
|------|--------|
| `fa` | `'Vazirmatn', sans-serif` |
| `ar` | `'Cairo', 'Vazirmatn', sans-serif` |
| `en`, `ru` | `'Inter, sans-serif'` |

**Note:** Landing uses Inter; app default body uses Geist Sans / Sora — separate pipelines.

### Login page

| Element | Font |
|---------|------|
| OTP input | `'Cinzel', serif` (inline style block) |

---

## Heading Scale (`--mio-heading-*`)

| Token | LTR default | FA override |
|-------|-------------|-------------|
| `--mio-heading-sm` | `0.7rem` | `0.65rem` |
| `--mio-heading-md` | `1.125rem` | `1rem` |
| `--mio-heading-lg` | `1.35rem` | `1.18rem` |

### Semantic heading classes

| Class | Size token | Weight | Other |
|-------|------------|--------|-------|
| `.mio-page-header__eyebrow` | `--mio-heading-sm` | 600 | uppercase, `letter-spacing: 0.18em`, gold |
| `.mio-page-header__title` | `--mio-heading-lg` | 700 | `#fff`, `line-height: 1.2` |
| `.mio-eyebrow` | `--mio-heading-sm` | 600 | uppercase, gold; FA: no uppercase |
| `.mio-insight-card__title` | `--mio-heading-md` | — | FA: no uppercase on related labels |

### Ad-hoc heading sizes (non-token)

| Value | Where |
|-------|-------|
| `1.05rem` | `.mio-value--lg` |
| `text-lg` (Tailwind) | `CosmosCard` dismiss button |
| Editorial hero H1 | Landing — Tailwind scale in `LandingHero` / `CinematicHero` (not `--mio-*`) |

---

## Body Scale (`--mio-body`, `--mio-value`, captions)

| Token | LTR default | FA override | Typical use |
|-------|-------------|-------------|-------------|
| `--mio-label` | `9px` | `8px` | `.mio-label`, metric labels |
| `--mio-caption` | `11px` | `10px` | Subtitles, segment options, alert actions |
| `--mio-body` | `13px` | `12px` | Alert text, general body in `mio-*` |
| `--mio-value` | `15px` | `13px` | `.mio-value` metric values |
| `--mio-body-sm` | *undefined* | — | Referenced in empty-state CSS |

### Semantic body classes

| Class | Size | Color |
|-------|------|-------|
| `.mio-page-header__subtitle` | `--mio-caption` | `rgba(255,255,255,0.48)` |
| `.mio-label` | `--mio-label` | `--mio-text-muted` |
| `.mio-value` | `--mio-value` | `--mio-text-body` |
| `.mio-value--lg` | `1.05rem` | `--mio-text-body`, weight 700 |

### Text color tokens

| Token | Value |
|-------|-------|
| `--foreground` | `#F6F8FC` |
| `--mio-text-muted` | `rgba(255, 255, 255, 0.42)` |
| `--mio-text-body` | `rgba(255, 255, 255, 0.88)` |

---

## Captions

| Source | Size | Context |
|--------|------|---------|
| `--mio-caption` | 11px / 10px FA | Page subtitles, segments, progress labels |
| `text-xs` (12px Tailwind) | — | Chips, login, legal back link, home lang buttons |
| `text-[10px]` | — | Settings labels, `ChartTrustCard` badges |
| `text-[8px]` | — | `PeopleHomeRow` synergy micro-badge |

---

## Letter-spacing & line-height

| Rule | Value | Scope |
|------|-------|-------|
| `[dir="rtl"]` line-height | `1.65` | RTL content |
| `[dir="rtl"]` letter-spacing | `0` | RTL content |
| `.mio-page-header__eyebrow` | `0.18em` | LTR eyebrows |
| `.mio-label` | `0.12em` | LTR labels; FA override: `0` |
| `tracking-widest` | Tailwind | Vault CTA, login submit, dashboard |
| `tracking-wide` | Tailwind | HomeViewOnboarding, login tabs |
| `[dir="rtl"] h1–h3` line-height | `1.5` | RTL headings |

---

## Language-specific overrides (FA)

Applied under `html[lang='fa']`, `.metioro-main[lang='fa']`, `main[lang='fa']`:

| Override | Effect |
|----------|--------|
| Smaller `--mio-label` through `--mio-heading-lg` | See heading/body tables |
| Reduced glass padding | `--mio-space-2` / `--mio-space-3` instead of `--mio-space-3` / `--mio-space-4` |
| `.mio-eyebrow`, `.mio-label`, `.mio-insight-card__title` | `letter-spacing: 0`; `text-transform: none` |
| Grid gaps | `--mio-space-2` on obs/analysis/signature grids |

### Arabic (`ar`)

| Rule | Effect |
|------|--------|
| `[dir="rtl"][lang="ar"] .fc`, `.fi` | Cairo stack |
| `brandHeadingFont('ar')` | `TYPOGRAPHY.bodyAr` |

### Persian (`fa`)

| Rule | Effect |
|------|--------|
| `html[lang="fa"] body` | Vazirmatn stack |
| `[dir="rtl"][lang="fa"] .fc`, `.fi` | Vazirmatn stack |

### Shell chrome

`metioro-shell` and `metioro-header` remain `direction: ltr` regardless of content language.

---

## Monospace

| Token | Usage |
|-------|-------|
| `--font-geist-mono` / `TYPOGRAPHY.mono` | Available; sparse use in technical UI |

---

## Transform utilities

| Pattern | Usage |
|---------|-------|
| `uppercase` | Eyebrows, labels (LTR); disabled for FA scoped rules |
| `text-transform: none` | FA override on eyebrows/labels |
| `font-semibold` / `font-medium` | Tailwind on buttons, avatars, world modals |
| `fc` / `fi` on components | Widespread in app components |

---

## Sources

| File | Typography content |
|------|-------------------|
| `apps/web/app/globals.css` | Body default, RTL rules, input fonts |
| `apps/web/app/metioro-ui-v2.css` | `--mio-*` scale, semantic classes, FA block |
| `apps/web/lib/brand-theme.ts` | `TYPOGRAPHY`, font helper functions |
| `apps/web/lib/landing-i18n.ts` | `getLandingFontFamily` |
| `apps/web/components/AppShell.tsx` | `.fc` / `.fi` injection |

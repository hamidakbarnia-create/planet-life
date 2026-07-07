# Design Token Inventory

Master index of every design token currently defined in the application. Duplicates are listed separately — not merged.

---

## CSS Custom Properties — `globals.css` (`:root`)

| Token | Value |
|-------|-------|
| `--background` | `#0A0F1C` |
| `--foreground` | `#F6F8FC` |
| `--input-bg` | `#1A2333` |
| `--input-border` | `rgba(230, 234, 241, 0.12)` |
| `--input-text` | `#F6F8FC` |
| `--input-placeholder` | `rgba(246, 248, 252, 0.35)` |
| `--accent` | `#305CDE` |
| `--brand-royal-blue` | `#305CDE` |
| `--brand-navy` | `#0B1736` |
| `--brand-gold` | `#D4AF37` |
| `--brand-gold-highlight` | `#F2CF75` |
| `--brand-charcoal` | `#1A2333` |
| `--brand-black` | `#0A0F1C` |

### Tailwind `@theme inline`

| Token | Maps to |
|-------|---------|
| `--color-background` | `var(--background)` |
| `--color-foreground` | `var(--foreground)` |
| `--font-sans` | `var(--font-sora), var(--font-geist-sans)` |
| `--font-mono` | `var(--font-geist-mono)` |

### Next.js font variables (loaded in layout)

| Variable | Font |
|----------|------|
| `--font-sora` | Sora |
| `--font-geist-sans` | Geist Sans |
| `--font-geist-mono` | Geist Mono |
| `--font-vazirmatn` | Vazirmatn |
| `--font-cairo` | Cairo |

---

## CSS Custom Properties — `metioro-ui-v2.css` (`:root`)

### Spacing

| Token | Value |
|-------|-------|
| `--mio-space-1` | `4px` |
| `--mio-space-2` | `8px` |
| `--mio-space-3` | `12px` |
| `--mio-space-4` | `16px` |
| `--mio-space-5` | `20px` |
| `--mio-space-6` | `24px` |

### Radius

| Token | Value |
|-------|-------|
| `--mio-radius-sm` | `10px` |
| `--mio-radius-md` | `14px` |
| `--mio-radius-lg` | `18px` |
| `--mio-radius-xl` | `22px` |

### Glass / surface

| Token | Value |
|-------|-------|
| `--mio-glass-bg` | `rgba(8, 14, 28, 0.72)` |
| `--mio-glass-border` | `rgba(255, 255, 255, 0.09)` |
| `--mio-glass-highlight` | `inset 0 1px 0 rgba(255, 255, 255, 0.07)` |
| `--mio-glass-shadow` | `0 8px 32px rgba(0, 0, 0, 0.38)` |

### Color

| Token | Value |
|-------|-------|
| `--mio-gold` | `#d4af37` |
| `--mio-gold-soft` | `rgba(212, 175, 55, 0.22)` |
| `--mio-blue-glow` | `rgba(48, 92, 222, 0.35)` |
| `--mio-navy-deep` | `#030508` |
| `--mio-navy` | `#060a14` |
| `--mio-text-muted` | `rgba(255, 255, 255, 0.42)` |
| `--mio-text-body` | `rgba(255, 255, 255, 0.88)` |

### Typography size

| Token | Default | FA override (`html[lang='fa']`) |
|-------|---------|--------------------------------|
| `--mio-label` | `9px` | `8px` |
| `--mio-caption` | `11px` | `10px` |
| `--mio-body` | `13px` | `12px` |
| `--mio-value` | `15px` | `13px` |
| `--mio-heading-sm` | `0.7rem` | `0.65rem` |
| `--mio-heading-md` | `1.125rem` | `1rem` |
| `--mio-heading-lg` | `1.35rem` | `1.18rem` |

### Referenced but undefined

| Token | Usage |
|-------|-------|
| `--mio-body-sm` | Referenced in `metioro-ui-v2.css` (empty-state text) — **no `:root` definition found** |

---

## CSS Custom Properties — `metioro-shell.css` (`:root`)

| Token | Value |
|-------|-------|
| `--metioro-sidebar-w` | `92px` |
| `--metioro-header-h` | `84px` |
| `--metioro-mobile-nav-h` | `76px` |
| `--metioro-safe-top` | `env(safe-area-inset-top, 0px)` |
| `--metioro-safe-bottom` | `env(safe-area-inset-bottom, 0px)` |
| `--metioro-safe-left` | `env(safe-area-inset-left, 0px)` |
| `--metioro-safe-right` | `env(safe-area-inset-right, 0px)` |
| `--metioro-navy` | `#060a14` |
| `--metioro-navy-mid` | `#0b1736` |
| `--metioro-gold` | `#d4af37` |
| `--metioro-gold-soft` | `rgba(212, 175, 55, 0.22)` |

---

## TypeScript — `lib/brand-theme.ts`

### `COLORS`

| Key | Value |
|-----|-------|
| `royalBlue` | `#305CDE` |
| `navy` | `#0B1736` |
| `white` | `#FFFFFF` |
| `lightGray` | `#F6F8FC` |
| `gray` | `#E6EAF1` |
| `charcoal` | `#1A2333` |
| `black` | `#0A0F1C` |
| `goldHighlight` | `#F2CF75` |
| `goldMain` | `#D4AF37` |
| `goldShadow` | `#B59410` |

### `COLORS_RGBA`

| Key | Value |
|-----|-------|
| `royalBlue12` | `rgba(48,92,222,0.12)` |
| `royalBlue18` | `rgba(48,92,222,0.18)` |
| `royalBlue28` | `rgba(48,92,222,0.28)` |
| `royalBlue45` | `rgba(48,92,222,0.45)` |
| `navy80` | `rgba(11,23,54,0.80)` |
| `goldHighlight15` | `rgba(242,207,117,0.15)` |
| `goldHighlight22` | `rgba(242,207,117,0.22)` |
| `goldMain12` | `rgba(212,175,55,0.12)` |
| `goldMain18` | `rgba(212,175,55,0.18)` |
| `goldMain28` | `rgba(212,175,55,0.28)` |
| `goldMain45` | `rgba(212,175,55,0.45)` |
| `goldShadow10` | `rgba(181,148,16,0.10)` |
| `white04` | `rgba(255,255,255,0.04)` |
| `white06` | `rgba(255,255,255,0.06)` |
| `white08` | `rgba(255,255,255,0.08)` |
| `white10` | `rgba(255,255,255,0.10)` |
| `white45` | `rgba(255,255,255,0.45)` |
| `white60` | `rgba(255,255,255,0.60)` |
| `white70` | `rgba(255,255,255,0.70)` |
| `charcoal70` | `rgba(26,35,51,0.70)` |

### `GRADIENTS`

| Key | Definition |
|-----|------------|
| `gold` | `linear-gradient(135deg, #F2CF75, #D4AF37, #B59410)` |
| `goldHorizontal` | `linear-gradient(90deg, #F2CF75, #D4AF37, #B59410)` |
| `goldSubtle` | `linear-gradient(135deg, goldHighlight15, goldMain12)` |
| `goldGlow` | `linear-gradient(135deg, rgba(242,207,117,0.28), rgba(212,175,55,0.22))` |
| `royalBlue` | `linear-gradient(135deg, #305CDE, #2548B0)` |
| `royalBlueSubtle` | `linear-gradient(135deg, royalBlue18, rgba(48,92,222,0.08))` |
| `navySurface` | `linear-gradient(135deg, rgba(11,23,54,0.92), rgba(10,15,28,0.92))` |
| `cardSurface` | `linear-gradient(135deg, rgba(26,35,51,0.72), rgba(11,23,54,0.72))` |
| `vipSurface` | `linear-gradient(135deg, #0B1736, #0A0F1C)` |
| `pageAmbient` | Multi radial (royalBlue12, goldMain12, navy80) |
| `vaultAmbient` | Multi radial (goldMain18, goldShadow10) |

### `TYPOGRAPHY`

| Key | Stack |
|-----|-------|
| `brand` | `var(--font-sora), var(--font-geist-sans), sans-serif` |
| `body` | `var(--font-geist-sans), sans-serif` |
| `bodyRtl` | `var(--font-vazirmatn), var(--font-cairo), var(--font-geist-sans), sans-serif` |
| `bodyAr` | `var(--font-cairo), var(--font-vazirmatn), sans-serif` |
| `mono` | `var(--font-geist-mono), monospace` |

### `SURFACES`

| Key | Value |
|-----|-------|
| `appBackground` | `COLORS.black` (`#0A0F1C`) |
| `headerBorder` | `COLORS_RGBA.white08` |
| `navActive` | `COLORS.goldMain` |
| `navInactive` | `COLORS_RGBA.white45` |
| `signInBorder` | `COLORS_RGBA.royalBlue45` |
| `signInBg` | `COLORS_RGBA.royalBlue12` |
| `signInText` | `#93B4FF` |
| `langActiveBorder` | `COLORS_RGBA.royalBlue45` |
| `langActiveBg` | `COLORS_RGBA.royalBlue12` |
| `langActiveText` | `#93B4FF` |

### `TIER_THEME` (per tier: free, pro, premium, vip)

Each tier defines: `tint`, `ring`, `glow`, `badgeBg`, `badgeText`, `ctaBg`, `ctaBorder`, `ctaText`; `pro` and `premium` include `popular?: true`.

### Style helpers (runtime objects)

| Export | Purpose |
|--------|---------|
| `tierBadgeStyle(tier)` | Header tier pill inline styles |
| `focusRingStyle(accent?)` | Focus ring box-shadow |
| `VAULT_PILL_STYLE` | Vault header pill |
| `VAULT_PILL_GLOW` | Vault pill radial glow |
| `primaryCtaStyle('royal' \| 'gold')` | CTA button base styles |

---

## TypeScript — `lib/calendar-scores.ts` (`BAND_STYLES`)

| Band | `bg` | `border` | `text` |
|------|------|----------|--------|
| `green` | `rgba(74,222,128,0.32)` | `#4ade80` | `#4ade80` |
| `yellow` | `rgba(251,191,36,0.28)` | `#fbbf24` | `#fbbf24` |
| `orange` | `rgba(251,146,60,0.28)` | `#fb923c` | `#fb923c` |
| `red` | `rgba(248,113,113,0.28)` | `#f87171` | `#f87171` |
| `empty` | `rgba(255,255,255,0.04)` | `rgba(255,255,255,0.1)` | `rgba(255,255,255,0.25)` |

---

## TypeScript — `lib/strategic-gps.ts` (`GPS_TONE_STYLES`)

| Tone | `color` | `bg` | `border` |
|------|---------|------|----------|
| `green` | `#4ade80` | `rgba(74,222,128,0.08)` | `rgba(74,222,128,0.35)` |
| `yellow` | `#fbbf24` | `rgba(251,191,36,0.08)` | `rgba(251,191,36,0.35)` |
| `orange` | `#fb923c` | `rgba(251,146,60,0.08)` | `rgba(251,146,60,0.35)` |
| `red` | `#f87171` | `rgba(248,113,113,0.08)` | `rgba(248,113,113,0.35)` |
| `empty` | `rgba(255,255,255,0.45)` | `rgba(255,255,255,0.03)` | `rgba(255,255,255,0.08)` |

---

## TypeScript — `lib/synergy.ts` (`BADGE_STYLES`)

| Badge | `bg` | `border` | `text` |
|-------|------|----------|--------|
| `aligned` | `rgba(74,222,128,0.15)` | `#4ade80` | `#4ade80` |
| `caution` | `rgba(251,191,36,0.12)` | `#fbbf24` | `#fbbf24` |
| `tension` | `rgba(248,113,113,0.12)` | `#f87171` | `#f87171` |

---

## Utility Classes (typography injection)

| Class | Source | Role |
|-------|--------|------|
| `.fc` | `AppShell` injected `headingFont` | Display / heading font per language |
| `.fi` | `AppShell` injected `bodyFont` | Body font per language |

---

## Landing font function — `lib/landing-i18n.ts`

| Language | `getLandingFontFamily` return |
|----------|-------------------------------|
| `en`, `ru` | `'Inter, sans-serif'` |
| `fa` | `'Vazirmatn', sans-serif` |
| `ar` | `'Cairo', 'Vazirmatn', sans-serif` |

---

## Known duplicate tokens (not merged)

| Concept | Duplicate values |
|---------|------------------|
| Gold | `--brand-gold`, `--mio-gold`, `--metioro-gold`, `COLORS.goldMain` (all `#D4AF37` / `#d4af37`) |
| Navy | `--brand-navy` `#0B1736`, `--mio-navy` / `--metioro-navy` `#060a14`, `--metioro-navy-mid` `#0b1736` |
| Black background | `--background`, `--brand-black`, `COLORS.black`, shell `#0a0f1c` |
| Royal blue | `--accent`, `--brand-royal-blue`, `COLORS.royalBlue` |
| Gold soft border | `--mio-gold-soft`, `--metioro-gold-soft` (same rgba) |
| Green status | `#4ade80` in BAND_STYLES, GPS_TONE_STYLES, BADGE_STYLES |
| Amber active chip | `#fbbf24` in Settings inline styles; also `BAND_STYLES.yellow` |

---

## Cross-references

| Topic | Detail file |
|-------|-------------|
| Typography tokens | [typography-token-inventory.md](./typography-token-inventory.md) |
| Spacing tokens | [spacing-inventory.md](./spacing-inventory.md) |
| Color tokens | [color-token-inventory.md](./color-token-inventory.md) |
| Radius & shadow | [radius-shadow-inventory.md](./radius-shadow-inventory.md) |
| Motion | [motion-token-inventory.md](./motion-token-inventory.md) |
| Components | [component-catalog.md](./component-catalog.md) |

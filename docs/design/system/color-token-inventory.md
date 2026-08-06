# Color Token Inventory

Every existing color token, grouped by role. Duplicates listed separately — not merged.

---

## Surfaces

### Page / app backgrounds

| Token / source | Value |
|----------------|-------|
| `--background` | `#0A0F1C` |
| `--brand-black` | `#0A0F1C` |
| `COLORS.black` | `#0A0F1C` |
| `.metioro-shell` background | `#0a0f1c` |
| `--mio-navy` | `#060a14` |
| `--mio-navy-deep` | `#030508` |
| `--metioro-navy` | `#060a14` |
| `--metioro-navy-mid` | `#0b1736` |
| `COLORS.navy` | `#0B1736` |
| `SURFACES.appBackground` | `COLORS.black` |
| Landing `COLORS.black` | `#0A0F1C` |
| Login page | Dark on `--background` |
| `option` background | `#131929` |

### Gradient surfaces

| Name | Definition |
|------|------------|
| `.mio-app-bg` | Multi radial blue/gold + linear `#04070f` → navy → navy-deep |
| `.mio-app-bg::before` | Star field (white/gold/blue 1px radials) |
| Sidebar | `linear-gradient(180deg, navy-mid 0%, navy 45%, #04070f 100%)` |
| Bottom nav | `linear-gradient(0deg, #04070f 0%, navy 50%, navy-mid 100%)` |
| `GRADIENTS.navySurface` | `rgba(11,23,54,0.92)` → `rgba(10,15,28,0.92)` |
| `GRADIENTS.cardSurface` | `rgba(26,35,51,0.72)` → `rgba(11,23,54,0.72)` |
| `GRADIENTS.pageAmbient` | Royal blue + gold + navy radials |
| `GRADIENTS.vaultAmbient` | Gold radials |
| `GRADIENTS.vipSurface` | `#0B1736` → `#0A0F1C` |

### Glass surfaces

| Token / class | Value |
|---------------|-------|
| `--mio-glass-bg` | `rgba(8, 14, 28, 0.72)` |
| `.mio-glass--primary` | `linear-gradient(145deg, rgba(12,22,44,0.88), rgba(6,10,20,0.92))` |
| `.mio-glass--secondary` | `rgba(255, 255, 255, 0.025)` |
| `.mio-glass--metric` | `linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))` |
| `.mio-glass--signature` | Gradient + gold radial overlay |
| World cards (inline) | `rgba(255,255,255,0.035)` |
| Dashboard cards (inline) | `rgba(255,255,255,0.02)` |

### Header / nav surfaces

| Element | Value |
|---------|-------|
| `.metioro-header` | `var(--metioro-navy)` |
| Active sidebar item | `rgba(212, 175, 55, 0.08)` inset patterns |
| Bottom nav active tab | Gold gradient indicator bar |

---

## Text

| Token / pattern | Value |
|-----------------|-------|
| `--foreground` | `#F6F8FC` |
| `COLORS.lightGray` | `#F6F8FC` |
| `--mio-text-body` | `rgba(255, 255, 255, 0.88)` |
| `--mio-text-muted` | `rgba(255, 255, 255, 0.42)` |
| `COLORS_RGBA.white45` | `rgba(255,255,255,0.45)` |
| `COLORS_RGBA.white60` | `rgba(255,255,255,0.60)` |
| `COLORS_RGBA.white70` | `rgba(255,255,255,0.70)` |
| Page titles | `#fff` |
| `SURFACES.navInactive` | `COLORS_RGBA.white45` |
| Muted subtitles | `rgba(255,255,255,0.48)` |
| Tailwind `text-white/75` | Landing secondary CTA |
| Tailwind `text-white/60` | Home lang chips |
| `option` text | `#ededed` |

---

## Borders

| Token / pattern | Value |
|-----------------|-------|
| `--mio-glass-border` | `rgba(255, 255, 255, 0.09)` |
| `--input-border` | `rgba(230, 234, 241, 0.12)` |
| `--metioro-gold-soft` | `rgba(212, 175, 55, 0.22)` |
| `--mio-gold-soft` | `rgba(212, 175, 55, 0.22)` |
| `SURFACES.headerBorder` | `COLORS_RGBA.white08` |
| Inactive chips | `rgba(255,255,255,0.1)` |
| `.mio-glass--primary` border | `rgba(212, 175, 55, 0.18)` |
| `.mio-glass--secondary` border | `rgba(255, 255, 255, 0.07)` |
| `.mio-segment__option` border | `rgba(255, 255, 255, 0.1)` |
| `.mio-segment__option--active` border | `rgba(212, 175, 55, 0.45)` |
| World card border (inline) | `rgba(255,255,255,0.07)` |

---

## Accent

### Royal blue

| Token | Value |
|-------|-------|
| `--accent` | `#305CDE` |
| `--brand-royal-blue` | `#305CDE` |
| `COLORS.royalBlue` | `#305CDE` |
| `GRADIENTS.royalBlue` | `#305CDE` → `#2548B0` |
| `--mio-blue-glow` | `rgba(48, 92, 222, 0.35)` |
| `COLORS_RGBA.royalBlue12` | `rgba(48,92,222,0.12)` |
| `COLORS_RGBA.royalBlue18` | `rgba(48,92,222,0.18)` |
| `COLORS_RGBA.royalBlue28` | `rgba(48,92,222,0.28)` |
| `COLORS_RGBA.royalBlue45` | `rgba(48,92,222,0.45)` |
| `SURFACES.signInText` / `langActiveText` | `#93B4FF` |
| Landing CTA / focus | `#305CDE` |
| `TIER_THEME.pro.tint` | `COLORS.royalBlue` |

### Gold

| Token | Value |
|-------|-------|
| `--brand-gold` | `#D4AF37` |
| `--mio-gold` | `#d4af37` |
| `--metioro-gold` | `#d4af37` |
| `COLORS.goldMain` | `#D4AF37` |
| `COLORS.goldHighlight` | `#F2CF75` |
| `COLORS.goldShadow` | `#B59410` |
| `COLORS_RGBA.goldMain12` | `rgba(212,175,55,0.12)` |
| `COLORS_RGBA.goldMain18` | `rgba(212,175,55,0.18)` |
| `COLORS_RGBA.goldMain28` | `rgba(212,175,55,0.28)` |
| `COLORS_RGBA.goldMain45` | `rgba(212,175,55,0.45)` |
| `COLORS_RGBA.goldHighlight15` | `rgba(242,207,117,0.15)` |
| `COLORS_RGBA.goldHighlight22` | `rgba(242,207,117,0.22)` |
| `SURFACES.navActive` | `COLORS.goldMain` |
| Eyebrow text | `rgba(212, 175, 55, 0.82–0.85)` |
| Alert action hover | `#f2cf75` |
| `VAULT_PILL_STYLE` | Gold subtle gradient + goldHighlight text |

### Amber (non-brand-token)

| Source | Value | Where |
|--------|-------|-------|
| Settings active chip (inline) | `#fbbf24` border/text | `/settings` |
| `BAND_STYLES.yellow` | `#fbbf24` | Score bands |

---

## Status

### Score bands — `BAND_STYLES`

| Band | bg | border | text |
|------|-----|--------|------|
| green | `rgba(74,222,128,0.32)` | `#4ade80` | `#4ade80` |
| yellow | `rgba(251,191,36,0.28)` | `#fbbf24` | `#fbbf24` |
| orange | `rgba(251,146,60,0.28)` | `#fb923c` | `#fb923c` |
| red | `rgba(248,113,113,0.28)` | `#f87171` | `#f87171` |
| empty | `rgba(255,255,255,0.04)` | `rgba(255,255,255,0.1)` | `rgba(255,255,255,0.25)` |

### GPS tones — `GPS_TONE_STYLES`

| Tone | color | bg | border |
|------|-------|-----|--------|
| green | `#4ade80` | `rgba(74,222,128,0.08)` | `rgba(74,222,128,0.35)` |
| yellow | `#fbbf24` | `rgba(251,191,36,0.08)` | `rgba(251,191,36,0.35)` |
| orange | `#fb923c` | `rgba(251,146,60,0.08)` | `rgba(251,146,60,0.35)` |
| red | `#f87171` | `rgba(248,113,113,0.08)` | `rgba(248,113,113,0.35)` |
| empty | `rgba(255,255,255,0.45)` | `rgba(255,255,255,0.03)` | `rgba(255,255,255,0.08)` |

### Synergy badges — `BADGE_STYLES`

| Badge | bg | border | text |
|-------|-----|--------|------|
| aligned | `rgba(74,222,128,0.15)` | `#4ade80` | `#4ade80` |
| caution | `rgba(251,191,36,0.12)` | `#fbbf24` | `#fbbf24` |
| tension | `rgba(248,113,113,0.12)` | `#f87171` | `#f87171` |

### Alert variants — `mio-alert--*`

| Variant | Background | Border |
|---------|------------|--------|
| warning | `rgba(212, 175, 55, 0.08)` | `rgba(212, 175, 55, 0.24)` |
| info | `rgba(48, 92, 222, 0.1)` | `rgba(48, 92, 222, 0.28)` |
| success | `rgba(74, 222, 128, 0.08)` | `rgba(74, 222, 128, 0.24)` |

### Dashboard legacy (inline)

| Semantic | Example |
|----------|---------|
| Positive card | `rgba(74,222,128,0.03)` bg, `rgba(74,222,128,0.1)` border |
| Negative card | `rgba(248,113,113,0.03)` bg, `rgba(248,113,113,0.1)` border |

---

## Premium / tier

### `TIER_THEME` — free

| Key | Value |
|-----|-------|
| tint | `COLORS.gray` (`#E6EAF1`) |
| ring | `COLORS_RGBA.white10` |
| glow | `COLORS_RGBA.white06` |
| badgeBg | `COLORS_RGBA.white06` |
| badgeText | `COLORS_RGBA.white60` |
| ctaBg | `COLORS_RGBA.white04` |
| ctaBorder | `COLORS_RGBA.white08` |
| ctaText | `COLORS_RGBA.white70` |

### `TIER_THEME` — pro

| Key | Value |
|-----|-------|
| tint | `#305CDE` |
| badgeText / ctaText | `#93B4FF` |
| ctaBg | `GRADIENTS.royalBlueSubtle` |
| popular | `true` |

### `TIER_THEME` — premium

| Key | Value |
|-----|-------|
| tint | `#D4AF37` |
| badgeBg | `GRADIENTS.gold` |
| badgeText | `COLORS.navy` |
| ctaBg | `GRADIENTS.goldGlow` |
| ctaText | `#F2CF75` |

### `TIER_THEME` — vip

| Key | Value |
|-----|-------|
| tint | `#F2CF75` |
| badgeBg | `COLORS.navy` |
| badgeText | `#F2CF75` |
| ctaBg | `GRADIENTS.vipSurface` |

### Vault / premium accents

| Source | Notes |
|--------|-------|
| `VAULT_PILL_STYLE` | Gold subtle bg, goldHighlight text, gold glow shadow |
| Vault section cards | Pink/gold undertones (page-local inline styles) |
| `GRADIENTS.vaultAmbient` | Gold radial atmosphere |

---

## Input colors

| Token | Value |
|-------|-------|
| `--input-bg` | `#1A2333` |
| `COLORS.charcoal` | `#1A2333` |
| `--input-text` | `#F6F8FC` |
| `--input-placeholder` | `rgba(246, 248, 252, 0.35)` |
| Login `.login-input` bg | `rgba(255,255,255,0.04)` |
| Login `.login-input` border | `rgba(255,255,255,0.1)` |

---

## Duplicate map (preserved)

| Role | Parallel definitions |
|------|---------------------|
| Gold | 4 CSS/TS tokens + inline (same hex) |
| Navy | 3 hex variants across brand/shell/ui |
| Green status | Shared `#4ade80` across 3 runtime palettes |
| White alpha steps | `COLORS_RGBA.white*` + Tailwind `white/NN` + inline rgba |

---

## Sources

| File | Colors |
|------|--------|
| `apps/web/app/globals.css` | Root brand + input |
| `apps/web/app/metioro-ui-v2.css` | `--mio-*` text, glass, alerts |
| `apps/web/app/metioro-shell.css` | Shell navy, gold-soft |
| `apps/web/lib/brand-theme.ts` | Full brand palette + tiers |
| `apps/web/lib/calendar-scores.ts` | `BAND_STYLES` |
| `apps/web/lib/strategic-gps.ts` | `GPS_TONE_STYLES` |
| `apps/web/lib/synergy.ts` | `BADGE_STYLES` |

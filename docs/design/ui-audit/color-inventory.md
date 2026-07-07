# Color Inventory

Palette, surfaces, accents, and status colors. Observations only.

---

## Brand Palette (`lib/brand-theme.ts`)

| Token | Hex / value | Role |
|-------|-------------|------|
| `royalBlue` | `#305CDE` | Primary accent, CTAs, info alerts |
| `navy` | `#0B1736` | Brand navy, surfaces |
| `black` | `#0A0F1C` | Page background base |
| `charcoal` | `#1A2333` | Input backgrounds |
| `lightGray` | `#F6F8FC` | Foreground default |
| `gray` | `#E6EAF1` | Borders (inputs) |
| `goldMain` | `#D4AF37` | Premium accent, nav active |
| `goldHighlight` | `#F2CF75` | Hover gold, alert actions |
| `goldShadow` | `#B59410` | Gradient shadow stop |
| `white` | `#FFFFFF` | Pure white text highlights |

---

## CSS Variable Overlap

| Variable | Value | File |
|----------|-------|------|
| `--background` | `#0A0F1C` | `globals.css` |
| `--foreground` | `#F6F8FC` | `globals.css` |
| `--accent` / `--brand-royal-blue` | `#305CDE` | `globals.css` |
| `--brand-gold` | `#D4AF37` | `globals.css` |
| `--mio-gold` | `#d4af37` | `metioro-ui-v2.css` |
| `--mio-navy` | `#060a14` | `metioro-ui-v2.css` |
| `--mio-navy-deep` | `#030508` | `metioro-ui-v2.css` |
| `--metioro-navy` | `#060a14` | `metioro-shell.css` |
| `--metioro-gold` | `#d4af37` | `metioro-shell.css` |

Navy values differ slightly between files (`#0B1736` brand vs `#060a14` shell/ui).

---

## Primary Surfaces

| Surface | Composition |
|---------|-------------|
| Landing | Solid `COLORS.black` (`#0A0F1C`) |
| App shell background | `#0a0f1c` (`metioro-shell`) + `mio-app-bg` layered gradients |
| `mio-app-bg` | Radial blue/gold/blue gradients + star field pseudo-element |
| Header | `--metioro-navy` solid + gold-soft bottom border |
| Sidebar | Navy panel with gold active indicator |
| Glass cards | `rgba(8,14,28,0.72)` + blur + white border 9% |

---

## Secondary Surfaces

| Surface | Composition |
|---------|-------------|
| `mio-glass--secondary` | `rgba(255,255,255,0.025)` |
| `mio-glass--metric` | White gradient 4%→1.5% |
| Login card | Dark card on page background |
| Legal prose | Dark shell consistent with brand |
| Dashboard (legacy) | Inline `rgba(255,255,255,0.02)` cards |

---

## Accent Usage

| Accent | Where |
|--------|-------|
| Royal blue `#305CDE` | Landing primary CTA, focus outlines, info alerts, brand links |
| Gold `#D4AF37` | Nav active, eyebrows, vault, tier premium, metric hover borders |
| Gold highlight `#F2CF75` | Alert action hover, segment active text |
| Amber `#fbbf24` | Settings active chips (Tailwind, not brand token) |
| Pink undertones | Vault section card styling (members-only positioning) |

---

## Status / Semantic Colors

| Semantic | Colors observed | Usage |
|----------|-----------------|-------|
| Success / golden window | Green tones (`rgba(74,222,128,…)`, band green) | Calendar golden hours, success alerts, positive scores |
| Warning | Gold-tinted backgrounds | `mio-alert--warning`, caution copy |
| Danger / danger zone | Red tones (`rgba(248,113,113,…)`, band red) | Calendar danger hours, negative scores |
| Neutral | Amber/mid band colors | Mid-range scores |
| Info | Royal blue tinted | `mio-alert--info` |
| LIVE | High-contrast badge | World section headers |
| Synergy badges | `BADGE_STYLES` per tier | People list |

Score bands sourced from `BAND_STYLES` in `calendar-scores.ts` and reused in Ask/Home flows.

---

## Tier Colors (`TIER_THEME`)

| Tier | Theming |
|------|---------|
| Free | Subdued neutral |
| Pro | Blue accent |
| Premium | Gold gradient emphasis |
| VIP (Julia) | Navy/black `vipSurface` gradient |

Used on `/upgrade` tier cards and header tier badge.

---

## Gradients

| Name | Usage |
|------|-------|
| `GRADIENTS.gold` | Premium highlights |
| `GRADIENTS.royalBlue` | Blue CTAs |
| `GRADIENTS.navySurface` | Card backgrounds |
| `GRADIENTS.pageAmbient` | Page-level ambient (brand-theme) |
| `GRADIENTS.vaultAmbient` | Vault-specific ambient |
| `mio-app-bg` gradients | App cosmic background (css) |
| `mio-glass--signature` | Gold radial overlay on signature cards |

---

## Border & Divider Colors

| Pattern | Value |
|---------|-------|
| Glass default | `rgba(255,255,255,0.09)` |
| Header bottom | `--metioro-gold-soft` = `rgba(212,175,55,0.22)` |
| Inactive chips | `rgba(255,255,255,0.1)` |
| Active chips | Gold 45–50% opacity |
| Input borders | `rgba(230,234,241,0.12)` |

---

## Text Color Hierarchy

| Level | Typical value |
|-------|---------------|
| Primary headings | `#fff` |
| Body | `rgba(255,255,255,0.88)` or `--foreground` |
| Muted / secondary | `rgba(255,255,255,0.42–0.52)` |
| Disabled | `opacity-40`–`50` on buttons |
| Links / actions | Gold or royal blue depending on context |

---

## WebGL / Canvas

- Landing hero: ambient blue/gold particle field (non-semantic, decorative)
- Does not use score/status colors

---

## Input Colors

| Element | Colors |
|---------|--------|
| `--input-bg` | `#1A2333` |
| `--input-text` | `#F6F8FC` |
| `--input-placeholder` | `rgba(246,248,252,0.35)` |

# Radius & Shadow Inventory

Every border-radius and box-shadow currently defined or used. Documented as-is.

---

## CSS Token Radii — `--mio-radius-*`

| Token | Value |
|-------|-------|
| `--mio-radius-sm` | `10px` |
| `--mio-radius-md` | `14px` |
| `--mio-radius-lg` | `18px` |
| `--mio-radius-xl` | `22px` |

---

## Token usage by class

| Class / element | Radius source |
|-----------------|---------------|
| `.mio-glass` (base) | `var(--mio-radius-lg)` |
| `.mio-glass--metric` | `var(--mio-radius-md)` |
| `.mio-glass--technical` | `var(--mio-radius-md)` |
| `.mio-page-header` | — (no radius) |
| `.mio-alert` | `var(--mio-radius-md)` |
| `.mio-segment__option` | `var(--mio-radius-sm)` |
| `.mio-insight-card` | `var(--mio-radius-xl)` |
| `.mio-empty-state` modal | `var(--mio-radius-xl)` |
| Progress bar track/fill | `9999px` (pill) |
| Avatar rings / orbs | `50%` |
| Disclaimer modal panel | `var(--mio-radius-md)` |

---

## Shell radii — `metioro-shell.css` (hardcoded)

| Element | Value |
|---------|-------|
| `.metioro-header-chip` | `8px` |
| Sidebar nav link | `14px` |
| Bottom nav active indicator | `0 0 4px 4px` |
| Bottom nav FAB / center accent | `16px` |
| Sidebar tooltip / popover | `16px` |
| Mobile menu sheet | `16px` |
| Lang/tier compact buttons | `10px` |
| Header dropdown items | `12px` |
| Session avatar | `50%` |
| Various nav icon containers | `12px` |

---

## Tailwind radii (observed in components)

| Class | Approx. value | Where |
|-------|---------------|-------|
| `rounded-md` | 6px (Tailwind default) | Chips, trust badges, heatmap cells |
| `rounded-lg` | 8px | Buttons, calendar days, legal links |
| `rounded-xl` | 12px | Cards, modals, forms, score panels |
| `rounded-2xl` | 16px | People rows, world cards, onboarding |
| `rounded-full` | 50% | Avatars, pills, dots |
| `rounded-none` / `0` | 0 | Table edges, shell edge flush |

---

## Inline / page-local radii

| Value | Where |
|-------|-------|
| `12px` | Login `.login-input`; `metioro-ui-v2.css` one-off |
| `10px` | Login `.otp-input` |
| `border-radius: 0` | `.mio-glass--technical` table flush, shell edge elements |

---

## Box-shadow tokens

### CSS variables

| Token | Value |
|-------|-------|
| `--mio-glass-shadow` | `0 8px 32px rgba(0, 0, 0, 0.38)` |
| `--mio-glass-highlight` | `inset 0 1px 0 rgba(255, 255, 255, 0.07)` |

### Composed glass shadow

`.mio-glass`:

```
box-shadow: var(--mio-glass-shadow), var(--mio-glass-highlight);
```

`.mio-glass--signature` adds:

```
inset 0 0 0 1px rgba(212, 175, 55, 0.08)
```

---

## Named shadows — `metioro-ui-v2.css`

| Context | Value |
|---------|-------|
| `.mio-insight-card` | `0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)` |
| Empty state ring (gold) | `0 0 24px rgba(212, 175, 55, 0.12)` |
| Empty state ring (blue) | `0 0 32px rgba(147, 180, 255, 0.15)` |
| Chart trust dot | `0 0 0 1px rgba(255, 255, 255, 0.25)` |
| Disclaimer / modal panel | `0 16px 48px rgba(0, 0, 0, 0.5)` |

---

## Named shadows — `metioro-shell.css`

| Context | Value |
|---------|-------|
| `.metioro-header` | `0 1px 0 rgba(255, 255, 255, 0.05), 0 12px 40px rgba(0, 0, 0, 0.65)` |
| Desktop sidebar | `4px 0 40px rgba(0, 0, 0, 0.55)` |
| Bottom nav | `0 -12px 40px rgba(0, 0, 0, 0.65)` |
| Bottom nav elevated tab | `0 4px 20px rgba(0, 0, 0, 0.28)` |
| Active sidebar item | `inset 0 0 0 1px rgba(212, 175, 55, 0.45), inset 4px 0 0 var(--metioro-gold), 0 4px 20px rgba(212, 175, 55, 0.14)` |
| Mobile sheet | `inset 0 1px 0 rgba(255, 255, 255, 0.04)` |
| Session avatar ring | `0 0 0 1px rgba(255, 255, 255, 0.2)` |

---

## TypeScript shadows — `brand-theme.ts`

| Export | Shadow |
|--------|--------|
| `tierBadgeStyle('vip')` | `0 0 12px ${theme.glow}` |
| `VAULT_PILL_STYLE` | `0 0 18px goldMain18, inset 0 0 0 1px rgba(255,255,255,0.05)` |
| `focusRingStyle(accent)` | `0 0 0 2px black, 0 0 0 4px accent` |

---

## Tailwind shadows (observed)

| Class | Where |
|-------|-------|
| `shadow-2xl` | Profile city dropdown |
| No global `shadow-*` token file | Ad hoc per component |

---

## Inset highlights (recurring pattern)

| Pattern | Value |
|---------|-------|
| Glass top edge | `inset 0 1px 0 rgba(255, 255, 255, 0.05–0.07)` |
| Gold signature inset | `inset 0 0 0 1px rgba(212, 175, 55, 0.08)` |
| Active nav inset bar | `inset 4px 0 0 gold` (sidebar) |

---

## Sources

| File | Content |
|------|---------|
| `apps/web/app/metioro-ui-v2.css` | `--mio-radius-*`, glass shadows |
| `apps/web/app/metioro-shell.css` | Shell/nav radii and shadows |
| `apps/web/lib/brand-theme.ts` | Focus ring, vault pill, VIP glow |
| Component Tailwind classes | See component-catalog |

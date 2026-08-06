# Accessibility Audit

Inspection findings for heading hierarchy, keyboard, focus, landmarks, and visible contrast. Observations only.

---

## Semantic Landmarks

| Area | Landmarks observed |
|------|-------------------|
| Landing | `main#main-content`, skip link, section elements with headings |
| AppShell | `header.metioro-header`, `main.metioro-main`, nav regions for sidebar and bottom nav |
| Login | Centered card layout; no AppShell landmarks |
| Legal | `LegalPageShell` document structure |
| Dashboard | Standalone; no shared shell landmarks |

---

## Skip Navigation

- **Landing:** Skip link present — `href="#main-content"`, visible on focus with blue background
- **App routes:** No skip link observed in `AppShell`

---

## Heading Hierarchy

| Screen | Observation |
|--------|-------------|
| Landing | Logical H1 → section H2 flow in landing components |
| App pages | `PageHeader` provides primary title; inner sections use mixed `h2`/`h3` and styled divs |
| Settings | Option group labels are `div` with uppercase styling, not headings |
| Ask flow | Step titles vary; module/question steps may not increment heading level consistently |
| Profile | Chart section uses headings; metric labels are not always heading elements |
| Calendar | Month title and section labels mix visual hierarchy with non-heading elements |

---

## Keyboard Navigation

| Pattern | Status |
|---------|--------|
| Bottom nav links | Native `<a>` / Link — keyboard reachable |
| Desktop sidebar | Link-based navigation |
| Header chips | Button/link elements |
| Settings option chips | `<button type="button">` — keyboard activatable |
| Calendar day grid | Click handlers on divs/cells — may not be keyboard-operable |
| People list actions | Icon buttons present |
| Modals (Disclaimer, Geocode, World search) | Close buttons observed; focus trap not verified in source |
| Ask date inputs | Native date/time inputs — keyboard accessible |

---

## Focus Visibility

| Element | Focus treatment |
|---------|-----------------|
| Landing CTAs | `focus-visible:outline` with royal blue |
| Landing skip link | High-contrast focus reveal |
| App buttons/chips | Relies on browser default or border change on active; no global `focus-visible` rule in shell CSS |
| Segment control | Border change on `--active` state (click), not documented focus ring |

---

## ARIA Usage

| Pattern | Usage |
|---------|-------|
| `aria-current="page"` | Bottom nav active tab |
| `role="status"` | `AlertBanner` |
| `aria-hidden` | Decorative elements (empty state ring, icons) |
| Live regions | Not observed for async score loading |

---

## Form Labels

| Screen | Observation |
|--------|-------------|
| Profile | Labels on birth date, time, location fields |
| Login | `emailLabel`, `phoneLabel`, `codeLabel` present |
| People form | Field labels in people i18n |
| Contact | Form labels on contact page |
| Settings | Option group text labels above chips (not associated via `htmlFor`) |

---

## Language & Direction

- `dir` and `lang` set on `AppShell` main content per active language
- RTL: `fa`, `ar` — layout mirrors content; shell chrome remains LTR
- FA typography scale reduced for fit (documented in typography inventory)

---

## Contrast (Visible / Code-level)

| Pairing | Observation |
|---------|-------------|
| White headings on navy/black | Generally high contrast |
| Muted text `rgba(255,255,255,0.35–0.48)` on dark bg | Used for subtitles, labels — may approach boundary on small text |
| Gold eyebrows `rgba(212,175,55,0.82)` on dark | Decorative labels; moderate contrast |
| Calendar score cells | Color-coded backgrounds with score numbers — band-dependent |
| Disabled buttons `opacity-40–50` | Reduced contrast intentional |
| Landing secondary CTA `text-white/75` | Slightly reduced vs primary |

*No automated contrast audit run in this sprint; observations from token values and class names.*

---

## Images & Icons

- `PersonAvatar` — may use photo or initials
- Nav icons — likely decorative with text labels on mobile
- `BrandLogo` — includes text wordmark
- Chart SVG — structural graphics; labels depend on chart implementation

---

## Motion Sensitivity

- No `prefers-reduced-motion` handling documented in stylesheets
- WebGL ambient animation on landing runs continuously

---

## Disclaimer Gate

- `DisclaimerGate` blocks first visit — modal pattern
- User must accept before full app interaction
- Keyboard/accessibility of gate not fully traced in this inspection

---

## Score / Data Explainability

- Breakdown panels provide text explanations (positive for cognitive accessibility)
- Heavy reliance on color for score bands (calendar, ask results)

---

## Notifications Concept

- No notification center UI exists
- Calendar export offers "App notifications only" as export mode label only

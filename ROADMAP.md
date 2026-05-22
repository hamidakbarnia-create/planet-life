# Planet Life — Strategic Roadmap

**Last updated:** May 2026
**Status:** Phase 0 complete, entering Sprint 1 (The Oracle)

---

## 1. Vision

Planet Life is a **Strategic Timing Intelligence platform** — not a horoscope app.

It combines:
- **Astrological scoring** (Swiss Ephemeris computed daily/hourly transits against the user's natal chart)
- **An Oracle** that answers concrete life questions ("when should I sign the contract?", "is Dubai good for me?")
- **A Strategic GPS calendar** that shows the user's year, month, hour as a map of cosmic windows
- **An optional Numerology layer** (personal day numbers, brand/phone vibration)
- **A human expert (Julia)** who turns scores into personal readings in Russian, English, Arabic, Persian
- **A content engine** (politics, celebrities, war/tension, oil & markets) for organic growth

Positioning tagline (EN): *"Align your execution with the universe."*
Positioning tagline (RU): *"Синхронизируйте действия со звёздами."*
Positioning tagline (FA): *«اجرای روزانه را با کیهان همگام کن.»*
Positioning tagline (AR): *«وائم تنفيذك مع الكون.»*

---

## 2. Target Market

Primary (mass): **Decision-making adults in Iran / GCC / Russia / CIS** (25–55).
Secondary (premium): **Family offices, executives, HNW individuals** in Dubai, Moscow, Tehran, Riyadh, Istanbul.

Why these markets:
- Real belief in astrology as a strategic tool (not entertainment).
- Native-language coverage already built: 🇬🇧 EN, 🇷🇺 RU, 🇮🇷 FA, 🇸🇦 AR (with RTL).
- High willingness to pay for personal consultations.
- Western competitors (Co-Star, TimePassages) do not serve these languages or markets.

---

## 3. Product Architecture — Two Columns

### Column A: The Oracle (question-driven, on-demand)
User has a concrete dilemma → app gives a reasoned, scored answer in seconds.

- "Is tomorrow at 10 AM good to sign?"
- "Which city for relocation: Dubai or London?"
- "Best hour to post this announcement?"

### Column B: The Strategic GPS (calendar, ambient)
User opens the app and sees their life as a road map.

- **Macro (year):** Saturn / Jupiter bands across the 12 months.
- **Meso (month):** Each week labeled with a theme ("comms week", "review week").
- **Micro (hour):** Today's 24h strip — golden windows, friction zones.

---

## 4. Three Data Levels

Same data, three depths so beginners are not crushed:

1. **Executive** — One line. *"Today, sign at 3 PM."*
2. **Strategic** — One paragraph with the *why*. *"Jupiter trines your natal Sun at 14:00–15:30, opening contract energy."*
3. **Technical** — Full chart, degrees, Swiss Ephemeris numbers for pro astrologers.

User picks their default level in Settings.

---

## 5. Six Core Modules

| # | Module | Examples |
|---|---|---|
| 1 | **Business & Wealth** | Launch, contract, loan, sell/buy stocks, meet investor |
| 2 | **Love & People** | Reconcile, hard conversation, first date, propose, end relationship |
| 3 | **Travel & Place** | Start trip, business travel, relocation, buy/sell property, sign lease |
| 4 | **Health & Body** | Surgery, fast/diet, dentist, fertility, start workout |
| 5 | **Work & Voice** | Post on social, interview, pitch/presentation, send resume, creative launch |
| 6 | **Luck & Crisis** | Take a risk, start something new, cut something, big decision, chance event |

Each module powers **both columns**: the Oracle's question set and the calendar's per-day score breakdown.

---

## 6. Scoring System

Per hour, per day, per module — a **0–100 score**.

| Score | Band | Interpretation |
|---|---|---|
| 85–100 | A+ Golden | Cosmic green light. Move with confidence. |
| 60–84  | B Favorable | Conditions supportive. Normal care. |
| 40–59  | C Neutral | No tailwind. Postponing 1–3 days may find better. |
| 0–39   | F Friction | Hard aspects active. Wait unless forced. |

Formula sketch:
```
score = base + Σ(planet_weight × aspect_multiplier)
```
- Planet weights: Jupiter +25, Venus +15, Saturn −20, Mars −15, etc.
- Aspect multipliers: Trine/Sextile ×1.5, Square/Opposition ×−1.5, Conjunction depends on planet.

Already implemented in `apps/api/src/packages/astro_engine/scoring.py`.

---

## 7. Numerology Layer (Optional)

Each digit 1–9 maps to a planet (1=Sun, 2=Moon, 3=Jupiter, 5=Mercury, 6=Venus, 8=Saturn, 9=Mars).

User can enable:
- **Personal Day Number** under each day's score.
- **Address / phone / brand vibration calculator**.
- **Combined Astro-Numerology daily insight**.

Disabled by default to keep first-time UX simple.

---

## 8. Content Engine (Growth Pillars)

Four content pillars run by Julia + AI assist. Each pillar is a public page that brings SEO/social traffic, then converts to signups.

| Pillar | Audience hook | Page |
|---|---|---|
| **Sky & Power** | World leaders' transits | `/figures/[leader]` |
| **Celebrity Sky** | Stars, athletes, musicians | `/figures/[celebrity]` |
| **War & Tension Map** | Geopolitical hot zones | `/world` |
| **Cosmic Markets** | Oil, gold, BTC, equities | `/markets` |

Daily cadence: 2 short posts (Julia, 200 words each) + 1 weekly 5-minute video.

---

## 9. Business Model

**Julia + Dubai office = the revenue engine.**
App = the marketing funnel that feeds her booking calendar.

### Pricing tiers

| Tier | Price | Audience |
|---|---|---|
| Free | $0 | Mass acquisition; daily score, basic calendar |
| Pro | $7/mo or $60/yr | Decision Mode, full calendar, notifications, Oracle |
| Online Reading | $200 (30m) / $400 (60m) | Anyone, anywhere |
| In-person Dubai | $750 (60m) / $1,200 (90m) | GCC, ME, Russian visitors |
| Business Chart | $2,500 one-off | Founders, family businesses |
| Family Package | $5,000/yr | 4 sessions + app for whole family |
| VIP Retainer | $25,000/yr | 12 sessions + 24/7 access + concierge |

Revenue target (single-Julia baseline, month 6): **$30k–$50k/month**.

---

## 10. Sprint Plan (6 sprints, ~6 months)

### Phase 0 — Foundation (DONE)
- Birth profile + Swiss Ephemeris backend.
- Daily Brief with cosmic score, hourly strip, best/avoid hours.
- Calendar with 0–100 grid + per-day transit panel.
- Multi-language (EN/RU/FA/AR) with RTL.
- Login (mocked).

### Sprint 1 — The Oracle (Weeks 1–2) — **CURRENT**
- `/ask` page with 6 module cards.
- Each module: 5 concrete questions.
- User picks question + date (+ optional time).
- Backend score → template explanation in user's language.
- Q&A history saved per user.
- Julia profile card (static, trust signal) on Home.

### Sprint 2 — GPS Three Layers (Weeks 3–4)
- Macro: yearly view with Saturn/Jupiter bands.
- Meso: month view with weekly theme labels.
- Micro: hourly strip with named windows (Golden Window / Friction Zone).
- Score breakdown by module per day.

### Sprint 3 — LLM Hybrid (Month 2)
- OpenAI / Claude API integration.
- Structured astro data → natural language in user's language.
- Cache layer for repeated questions.
- Quality bar: factually accurate astrology + Julia's voice.

### Sprint 4 — Notifications + Sharing (Month 3)
- PWA push: daily 7 AM brief, real-time transit alerts.
- Shareable daily card (PNG): score, moon, golden hour, Planet Life branding.
- Referral: invite 1 friend → both get 7 days Pro.

### Sprint 5 — Numerology + Module Detail (Month 4)
- Personal Day Number under each day.
- Brand / phone / address vibration tools.
- Combined Astro-Numerology daily insight.

### Sprint 6 — Booking + Julia + Content CMS (Months 5–6)
- `/book` page with Julia's calendar, payment (Stripe).
- Julia's content CMS (politics, celeb, market posts).
- Public content pages (`/figures`, `/markets`, `/world`).
- First 5 paying clients onboarded.

---

## 11. Tech Stack (current)

- **Frontend:** Next.js 16 (App Router) + React 19 + Tailwind 4 + TypeScript.
- **Backend:** FastAPI + Swiss Ephemeris (pyswisseph) + asyncio threadpool.
- **Data:** localStorage for profile/settings/people; calendar cache per-month.
- **Future:** SQLite/Postgres for Q&A history, user accounts, booking, content.
- **Deploy:** PWA-first (no app store hassle, no sanctions issue, multilingual reach).

---

## 12. Anti-Goals (what we will NOT build)

- ❌ Social feed (Co-Star style). This audience values privacy.
- ❌ Public horoscope-of-the-day for sign. Generic, devalues the brand.
- ❌ Native mobile apps before PWA proves traction.
- ❌ Astrology games / gimmicks. We are decision-making infrastructure, not entertainment.

---

## 13. First-Customer Plan

1. Identify 5 customers from personal network (week 1–2).
2. Give them free Pro access + one free Julia reading.
3. Collect testimonials in their native language.
4. Use testimonials in Sprint 6 content launch.
5. Each Julia reading produces 1 short post (with consent) → SEO + social.

---

*This roadmap is alive. Update it when scope changes.*

# Decision Brief DB-002 — Auth Provider Selection

**Status:** Proposed (Architecture Decision Brief)  
**Date:** 2026-08-02  
**Author role:** Principal Software Architect  
**Product:** METIORO — AI-powered Decision Intelligence  
**Scope:** Authentication Provider selection only  
**Non-goals:** Redesign of FastAPI Domain Authority, PostgreSQL canonical store, guest hybrid strategy, or identity model  

---

## Locked constraints (do not reopen)

| Constraint | Implication for auth selection |
|---|---|
| FastAPI is the only Domain Authority | Auth provider is an IdP / credential verifier — not the owner of domain users or guest migration |
| PostgreSQL is the canonical data store | No migration of domain data to the auth vendor’s database |
| Internal UUID is the only user identifier in domain tables | Provider subject IDs live only in an identity-mapping boundary |
| Provider IDs must never leak into business tables | Integration pattern: `provider_user_id → internal_uuid` |
| Auth Provider is replaceable | Prefer clean JWT + webhook + export boundaries |
| Guest → Account migration is a transactional domain operation | Guest identity must remain domain-owned (Hybrid); do not outsource guest lifecycle to IdP anonymous users |
| Product supports Guest mode before login (Hybrid) | Auth provider must not force anonymous IdP accounts as the guest model |
| Stack: Next.js 16, Cloudflare Workers, FastAPI, Railway, PostgreSQL, Expo readiness, locales EN/FA/AR/RU | Provider must support Google, Apple, international phone OTP, web + mobile, and FastAPI token verification |

**Supabase evaluation rule:** Auth-only. No Supabase Database advantages. No assumed migration to Supabase Postgres.

---

## 1. Executive Summary

METIORO needs a **replaceable Auth Provider** that authenticates users (Google, Apple, international phone OTP) while leaving **domain identity, guest mode, and guest→account migration** under FastAPI + PostgreSQL.

**Recommendation: Clerk (Pro) as Auth Provider / IdP only.**  
**Runner-up: Better Auth (self-hosted).**

Clerk best matches the locked architecture because FastAPI can verify Clerk session JWTs locally (PEM / JWKS), sync lifecycle events via signed webhooks, and keep `provider_user_id` out of business tables. Guests are **not** `users` rows — guest principals are domain-owned (later `guest_installations`); Clerk is introduced only at account conversion time. Better Auth is the strongest alternative when minimizing vendor lock-in outweighs operating auth yourself.

Auth0 is rejected primarily on B2C cost-at-scale. Supabase Auth and Firebase Auth are rejected for guest/anonymous lifecycle gravity that pulls identity ownership away from FastAPI, plus (for Firebase) international SMS economics. Custom Build is rejected as high ongoing security/ops cost for non-differentiating infrastructure.

---

## 2. Evaluation Matrix

Legend: **S** Strong · **A** Adequate · **W** Weak · **P** Poor / High risk  
Pricing figures are from official sources as of **2026-08-02** and must be re-validated before contract.

| Criterion | Clerk | Better Auth | Auth0 | Supabase Auth (auth only) | Firebase Auth | Custom Build |
|---|---|---|---|---|---|---|
| Google Login | S | S | S | S | S | A (build) |
| Apple Sign-In | S | S | S | S | S | A (build) |
| International Phone OTP | A | S | A | S | W | S |
| Guest → Account migration compatibility | S | A | A | W | W | S |
| Internal UUID compatibility | S | S | S | S | S | S |
| FastAPI integration | S | A | S | A | S | S |
| Cloudflare compatibility | S | A | S | S | A | A |
| React Native / Expo readiness | S | S | S | S | S | A |
| Web support | S | S | S | S | S | S |
| Session management | S | S | S | S | S | A |
| Account linking | S | S | S | S | S | A |
| Token verification | S | A | S | S | S | S |
| Webhooks | S | A | S | A | A | Custom |
| User export | S | S | S | S | S | S |
| Vendor lock-in (lower is better) | Medium | Low | High | Medium–High | High | None |
| Pricing (early stage) | S | S | S (Free 25k MAU) | S | S | S (labor) |
| Cost at scale | A | S | P | S | A | W (labor) |
| Operational complexity (lower is better) | Low | High | Low | Medium | Medium | Very High |
| Security | S | A | S | S | S | Variable |
| Compliance | A→S | DIY | S | A→S | S | DIY |
| Multi-device support | S | S | S | S | S | A |
| Future migration difficulty (lower is better) | A | S | W | W | W | S |

### Weighted fit for METIORO (architecture-critical criteria emphasized)

| Option | Fit score (0–100) | One-line verdict |
|---|---:|---|
| **Clerk** | **86** | Best IdP fit with Domain Authority boundary; production SDK coverage |
| **Better Auth** | **78** | Best open-source / low-lock-in alternative; higher ops burden |
| Supabase Auth | 62 | Capable auth, but anonymous/hooks gravity fights Domain Authority |
| Auth0 | 58 | Enterprise-grade; B2C cost curve incompatible |
| Firebase Auth | 55 | Mature; intl SMS + Google gravity + anonymous model misaligned |
| Custom Build | 48 | Maximum control; unacceptable ops/security ownership for auth |

### Evidence notes (capability)

| Option | Key official evidence (2026) |
|---|---|
| **Clerk** | Google/Apple social connections; phone OTP on Pro (`SMS Authentication available`; US/Canada $0.01/SMS, international market rate); Hobby has no SMS; SMS country allowlist defaults to US/Canada only; Expo SDK (`@clerk/expo`); Python backend JWT verify with `jwt_key` PEM / JWKS; Svix-signed webhooks; dashboard full data export; GDPR/DPA on plans; SOC2 on Business; Pro $25/mo ($20 annual) with 50k MRUs then ~$0.02/MRU. Sources: [clerk.com/pricing](https://clerk.com/pricing), Clerk docs (social, SMS allowlist, Expo, webhooks, Python JWT guides). |
| **Better Auth** | Google/Apple via social providers; phone-number plugin with BYO SMS `sendOTP`; anonymous plugin with `onLinkAccount`; Expo plugin; Cloudflare community/adapter patterns exist but historically edge-friction; FastAPI via third-party JWKS verifier (`fastapi-betterauth`), not first-party Domain Authority SDK. Sources: [better-auth.com docs](https://www.better-auth.com/docs/plugins/anonymous), phone-number plugin docs, Expo docs. |
| **Auth0** | Google/Apple/passwordless SMS; account linking / Connected Accounts; `auth0-fastapi` SDK; Free up to 25k MAU; B2C Essentials from $35/mo @ 500 MAU; 50k MAU Essentials **$3,500/mo**. Source: [auth0.com/pricing.md](https://auth0.com/pricing.md). |
| **Supabase Auth** | Google/Apple; phone login via SMS providers; anonymous sign-ins + identity linking; JWTs / JWKS for external verification; Auth Hooks (often Postgres/HTTP); Free 50k MAU; Pro 100k MAU then $0.00325/MAU; Advanced MFA Phone add-on $75/mo first project. Auth-only evaluation ignores DB. Sources: Supabase Auth docs, [supabase.com/pricing](https://supabase.com/pricing). |
| **Firebase Auth** | Google/Apple/phone/anonymous; Identity Platform MAU tiers (50k free then $0.0055→$0.0025); SMS never free (Blaze; first 10 SMS/day free; per-destination rates). Sources: [Firebase Auth](https://firebase.google.com/docs/auth), [Identity Platform pricing](https://cloud.google.com/identity-platform/pricing), [Firebase pricing](https://firebase.google.com/pricing/). |
| **Custom** | Full protocol ownership (OAuth, Apple, OTP, sessions, linking, export, compliance). Cost is engineering + ongoing security, not license fees. |

### Cost sketch at ~50k retained / active users (auth platform fees only; SMS extra)

| Option | Approximate platform fee | Notes |
|---|---|---|
| Clerk Pro | ~$25 + $0 overage inside 50k MRU | MRU ≠ MAU; first-day-free reduces bill vs raw MAU |
| Better Auth | Infra only | SMS + hosting + eng time |
| Auth0 Essentials | **~$3,500/mo** at 50k MAU | Official B2C table |
| Supabase Auth Pro | ~$25 + MAU within 100k included | Auth usage; compute still exists if a Supabase project is required to host Auth |
| Firebase / Identity Platform | ~$0 MAU tier-1 inside 50k | SMS dominates for phone-heavy intl usage |
| Custom | $0 license | 1–2+ eng FTE equivalent ongoing |

**Pricing may change.** Re-check official pricing pages before procurement.

---

## 3. Risks

### Architecture / domain risks

1. **Anonymous-guest gravity (Supabase, Firebase, Better Auth anonymous):** IdP-owned anonymous users encourage migration logic outside FastAPI, violating “guest migration is a transactional domain operation.”
2. **Provider ID leakage:** Any ORM shortcut that stores `clerk_user_id` / `sub` on business rows breaks the locked identity model.
3. **Dual identity stores:** Syncing full user profiles into PostgreSQL duplicates PII and creates consistency bugs; prefer minimal identity map + claims as needed.

### Provider-specific risks

| Option | Primary risks |
|---|---|
| Clerk | SMS requires Pro; intl delivery/cost for FA/AR/RU corridors must be proven; Business plan needed for SOC2 report; Medium lock-in to Clerk user store |
| Better Auth | You operate auth (patches, abuse, OTP fraud, session hardening); FastAPI path is community JWKS; Cloudflare edge quirks historically reported |
| Auth0 | Cost cliff after Free; feature/plan packaging complexity; overkill for current METIORO stage |
| Supabase Auth | Soft coupling via Auth Hooks / project model; anonymous conversion; team temptation to expand into Supabase DB despite constraint |
| Firebase | Google ecosystem lock-in; intl SMS cost/availability; Admin/token patterns less natural on Cloudflare Workers |
| Custom | Auth is a high-severity product surface (account takeover, OTP fraud, OAuth misconfig, Apple review); opportunity cost vs Decision Intelligence |

### Cross-cutting

- International phone OTP deliverability (Iran/sanctioned routes, MENA, RU) is a product risk for **every** SMS-backed option.
- Apple Sign-In requires Apple Developer Program and correct Services ID / native audience configuration on web + Expo.
- Webhook reliability: guest/account mapping must be idempotent; FastAPI remains source of truth for domain effects.

---

## 4. Long-term Maintenance Cost

| Option | 3-year maintenance profile |
|---|---|
| **Clerk** | Low eng maintenance; predictable MRU + SMS fees; occasional SDK upgrades (Next.js/Expo); identity-map + webhook handlers owned by METIORO |
| **Better Auth** | Highest eng ownership among shortlisted options: upgrades, SMS provider ops, abuse controls, key rotation, incident response |
| Auth0 | Low eng, high vendor invoice growth with MAU |
| Supabase Auth | Medium: Auth config + hooks + JWT verification; risk of accidental platform sprawl |
| Firebase | Medium: Google Cloud billing complexity; SMS monitoring; Admin SDK ops |
| Custom | Highest total cost of ownership (security reviews, compliance evidence, on-call for auth) |

**METIORO principle:** Auth is necessary infrastructure, not the product differentiator. Prefer lower eng TCO unless lock-in becomes existential.

---

## 5. Recommendation

### Adopt: **Clerk (Pro) as Auth Provider / IdP only**

**Why Clerk wins under locked constraints**

1. **Domain Authority preserved:** FastAPI verifies Clerk JWTs locally; domain tables keep internal UUIDs only.
2. **Hybrid guest preserved:** Guest stays a domain-owned principal (not a `users` row); Clerk enters at account creation / login; migration stays a FastAPI transaction.
3. **Method coverage:** Google, Apple, phone OTP (Pro), sessions, account linking, multi-device, Expo + Next.js.
4. **Integration surface:** Official Python verification path + Svix webhooks + export supports replaceability.
5. **Ops / time-to-secure:** Lower than self-hosting Better Auth or Custom for Google+Apple+OTP+fraud controls.
6. **Cost:** Transparent Pro + 50k MRU inclusion is viable through early/mid growth vs Auth0’s B2C curve.

**Required integration rules if accepted**

- Clerk `user_id` / `sub` may exist only in an identity-mapping table (or equivalent boundary), never in business domain FKs.
- Do **not** use IdP anonymous users as METIORO Guest mode.
- Guest → Account migration remains a single FastAPI/PostgreSQL transaction after successful authentication.
- Cloudflare Workers continue as edge/runtime; auth truth for domain mutations remains FastAPI.

---

## 6. Runner-up

### **Better Auth (self-hosted)**

Choose Better Auth instead of Clerk if Product/Security explicitly prioritizes:

- MIT-licensed self-host control and minimal vendor lock-in, **and**
- Willingness to staff ongoing auth operations (SMS, abuse, upgrades, compliance evidence), **and**
- Commitment that `onLinkAccount` / anonymous linking **only triggers** FastAPI migration APIs (never migrates domain data inside the TS auth process).

Better Auth scores higher on lock-in and raw intl OTP flexibility (BYO SMS), but lower on FastAPI first-class support and operational simplicity.

---

## 7. Reasons for rejecting other options

### Auth0
- Official B2C Essentials pricing reaches **$3,500/mo at 50k MAU** — incompatible with METIORO’s consumer/hybrid growth economics.
- Excellent enterprise CIAM, but capability surplus does not justify cost for current stage.

### Supabase Auth (auth only)
- Strong Google/Apple/phone/anonymous feature set and attractive MAU pricing.
- Rejected because anonymous sign-in + identity linking + Auth Hooks create a **gravitational pull** of identity lifecycle into Supabase, conflicting with FastAPI Domain Authority and domain-owned guest migration.
- Even used “auth only,” the project model and hooks encourage coupling beyond a replaceable IdP.

### Firebase Authentication
- Mature SDKs and anonymous→permanent account linking.
- Rejected because: (1) anonymous model fights Hybrid domain guest ownership; (2) international SMS is metered and region-sensitive for FA/AR/RU corridors; (3) Google Identity Platform lock-in raises future migration difficulty; (4) Cloudflare Workers fit is weaker than JWT-centric Clerk/Auth0 patterns.

### Custom Build
- Maximum control and zero license lock-in.
- Rejected as Principal Architect judgment: building production-grade Google + Apple + international OTP + session hardening + account linking + compliance export is a multi-quarter security product, not a sprint. Opportunity cost against Decision Intelligence is too high.

---

## 8. Unknowns that require validation

Before implementation authorization, validate:

1. **Clerk SMS allowlist + deliverability** for target countries serving FA/AR/RU users (and any sanctioned-route constraints). Official default is US/Canada only until enablement.
2. **Clerk international SMS market rates** vs BYO SMS under Better Auth for the same corridors (unit economics).
3. **Expo native Google/Apple** production path with Clerk (`@clerk/expo`) on METIORO’s target Expo SDK.
4. **Cloudflare Workers role:** confirm whether Workers only proxy to FastAPI or must verify JWTs at the edge; prove PEM/JWKS verify latency/caching.
5. **Webhook endpoint placement:** Railway FastAPI vs Worker ingress; Svix signature verification and idempotency design.
6. **Compliance tier:** whether SOC2 report is required at launch (Clerk Business $300/mo) or later.
7. **MRU vs product analytics:** confirm Clerk MRU definition aligns with METIORO’s expected retained-user economics (“First Day Free”).
8. **Account linking policy:** same email/phone across Google/Apple/OTP — confirm Clerk automatic linking settings match product/security policy.
9. **User export / deletion SLA:** exercise Clerk export + deletion webhooks against GDPR/legal requirements in [LEGAL_COMPLIANCE_POLICIES.md](../governance/LEGAL_COMPLIANCE_POLICIES.md).
10. **Runner-up spike (optional):** 2–3 day Better Auth + FastAPI JWKS + Expo phone OTP spike if lock-in risk is escalated by Security.

---

## 9. Final Architecture Decision

**Decision (proposed):** Select **Clerk** as the METIORO Auth Provider (IdP).

**Architecture posture (unchanged platform, auth boundary clarified):**

```
┌─────────────────────────────────────────────────────────────┐
│ Clients: Next.js 16 (Web) · Expo / React Native             │
│  - Guest mode: domain guest principal (not a user row)      │
│  - Account mode: Clerk session → Bearer JWT to API          │
└───────────────────────────┬─────────────────────────────────┘
                            │
            ┌───────────────▼────────────────┐
            │ Cloudflare Workers (edge)      │
            │ pass-through / optional JWT    │
            │ checks — no Domain Authority   │
            └───────────────┬────────────────┘
                            │
            ┌───────────────▼────────────────┐
            │ FastAPI (Domain Authority)     │
            │ 1) Verify Clerk JWT (PEM/JWKS) │
            │ 2) Map sub → users.id UUID     │
            │ 3) Guest→Account TX in Postgres│
            │ 4) All business writes         │
            └───────────────┬────────────────┘
                            │
            ┌───────────────▼────────────────┐
            │ PostgreSQL (canonical)         │
            │ domain tables: users.id UUID   │
            │ auth map: provider refs only   │
            └────────────────────────────────┘

Clerk = credentials, sessions, social/OTP, webhooks, export
Clerk ≠ domain user store, guest store, or business FK identity
```

**Normative rules**

1. Auth Provider **MAY** authenticate and issue tokens.  
2. Auth Provider **MUST NOT** own guest identity.  
3. FastAPI **MUST** own guest→account migration transactionally.  
4. Business tables **MUST** reference internal UUID only.  
5. Provider replacement **MUST** be achievable by re-linking identity map + re-issuing sessions without domain schema rewrite.

**Status:** Proposed — requires Product Owner / Security ratification before implementation authorization.

---

## 10. Implementation roadmap (if recommendation is accepted)

Phased; **no code in this brief**. Coding remains gated on ratification.

### Phase 0 — Ratification & validation (3–7 days)
- Ratify DB-002 (Clerk) or escalate runner-up.
- Complete Unknowns #1–#4 (SMS corridors, Expo, Workers JWT role).
- Confirm compliance tier (Pro vs Business).

### Phase 1 — Identity boundary specification (docs gate)
- Specify `identity_links` (or equivalent) contract: provider, provider_subject, internal_uuid, linked_at, status.
- Specify guest session model (domain-issued) and migration invariants.
- Specify webhook event allowlist (`user.created`, `user.updated`, `user.deleted`, session events as needed) and idempotency keys.
- Explicit ban list: provider IDs in business tables; IdP anonymous as guest.

### Phase 2 — Auth Provider enablement
- Clerk production instance; custom domain; Google + Apple credentials; phone OTP on Pro; SMS country allowlist for launch locales.
- Next.js Clerk integration for web sign-in/up.
- Expo Clerk integration for mobile.

### Phase 3 — FastAPI Domain Authority integration
- JWT verification middleware (networkless PEM preferred).
- Resolve/create internal UUID from verified `sub`.
- Implement transactional guest→account migration endpoint/use-case (domain).
- Webhook receiver with Svix verification on Railway.

### Phase 4 — Hardening
- Multi-device session UX; account linking policy tests.
- Deletion/export path for compliance.
- Abuse controls for OTP (rate limits, allowlist monitoring).
- Observability: auth failure rates, webhook lag, migration success/conflict metrics.

### Phase 5 — Replaceability proof
- Document export + re-link procedure.
- Tabletop exercise: “replace Clerk with Better Auth” using identity map only.
- Record residual lock-in and exit cost in Decision Log.

---

## Sources consulted (official / primary, 2026-08-02)

- Clerk Pricing — https://clerk.com/pricing  
- Clerk SMS / sign-in options & SMS allowlist — Clerk docs  
- Clerk Expo — https://clerk.com/docs/expo/getting-started/quickstart · Expo guide https://docs.expo.dev/guides/using-clerk  
- Clerk Python JWT verification / webhooks — Clerk articles & docs (authenticateRequest, Svix)  
- Better Auth Anonymous — https://www.better-auth.com/docs/plugins/anonymous  
- Better Auth Phone Number plugin — Better Auth docs  
- Better Auth Expo — Better Auth Expo integration docs  
- Auth0 Pricing — https://auth0.com/pricing.md  
- Auth0 Passwordless / account linking — Auth0 docs  
- auth0-fastapi — https://github.com/auth0/auth0-fastapi  
- Supabase Auth / Anonymous / Identity linking / JWTs — https://supabase.com/docs/guides/auth  
- Supabase Pricing — https://supabase.com/pricing  
- Firebase Authentication — https://firebase.google.com/docs/auth  
- Firebase Pricing — https://firebase.google.com/pricing/  
- Google Cloud Identity Platform pricing — https://cloud.google.com/identity-platform/pricing  

*If any pricing or capability above has changed after this date, prefer the live official page and amend this brief.*

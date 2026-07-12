# METIORO Frontend Deployment Record — Sprint 6B

**Status:** PROPOSED  
**Authority:** Operational Record  
**Deployment date:** 12 July 2026  
**Environment:** Production  
**Service:** METIORO Web  
**Platform:** Cloudflare Workers / OpenNext  

This document records an executed production deployment. It does not create or modify architecture, product, brand, or governance decisions. LOCKED instruments take precedence if a conflict exists.

---

## 1 Deployment Baseline

| Item | Value |
|------|-------|
| Production branch | `governance-foundation` |
| Deployed commit | `c8bfa34c` |
| Production web URL | `https://metioro.com` |
| Production API base | `https://api.metioro.com` |
| Cloudflare Worker name | `planet-life-web` |

Worker name confirmed in `apps/web/wrangler.jsonc`. Deployed commit is recorded as a fixed SHA; it is not asserted to equal current `HEAD`.

---

## 2 Pre-deployment Blocker

- The production frontend initially contained a `localhost:8000` API reference.
- The source was identified in `apps/web/app/dashboard/page.tsx`.
- Commit `c8bfa34c` corrected the source to:

  `process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000'`

  Production is expected to supply `NEXT_PUBLIC_API_BASE` as `https://api.metioro.com` (or equivalent production value).
- Rebuilt production artifacts were inspected.
- Production artifacts contained `api.metioro.com`.
- No production `localhost:8000` reference remained in the inspected bundle evidence.

This does not claim that no `localhost` string exists anywhere outside that inspected production-bundle evidence.

---

## 3 Deployment Procedure

1. Corrected the production API reference
2. Built the OpenNext / Cloudflare production bundle
3. Inspected generated artifacts for the API hostname
4. Ran required CI / release checks
5. Deployed the Cloudflare Worker
6. Verified production legal routes
7. Verified locale switching and single decision execution

Exact workflow names, run IDs, and timestamps: **UNVERIFIED** in repository documentation.

---

## 4 Production Verification

| Check | Result |
|-------|--------|
| Production web URL | PASS — `https://metioro.com` |
| Production API reference in frontend artifacts | PASS — `api.metioro.com` |
| `/terms` | PASS — HTTP 200 |
| `/privacy` | PASS — HTTP 200 |
| `/cookies` | PASS — HTTP 200 |
| `/disclaimer` | PASS — HTTP 200 |
| `/contact` | PASS — HTTP 200 |
| Locale switch — EN | PASS |
| Locale switch — FA | PASS |
| Locale switch — RU | PASS |
| Locale switch — AR | UNVERIFIED in production |
| Localized Result rendering | PASS for verified production locales |
| Decision execution count | PASS — exactly one filtered `execute` request in clean Network log |
| Decision response | PASS — HTTP 200 |
| User-visible semantic change | NONE EXPECTED — Sprint 6A/6B use the boundary-only executor |

Decision API contract locales remain `en | ru | fa | ar` (ADR-0006). Production verification covered EN, FA, and RU. AR is production-UNVERIFIED.

---

## 5 Deployment Result

- Frontend deployment completed successfully.
- Production frontend calls the METIORO production API.
- Legal pages are reachable on the production domain.
- Locale switching remained functional for the verified locales (EN, FA, RU).
- A clean Network-log verification showed one execute request for one decision submission.
- Sprint 6B final production verification passed.

The frontend submits decisions through the production Decision API boundary. The deployed backend implementation remains the deterministic boundary executor documented by Sprint 6A.

No new semantic decision output was expected from this deployment. The verified change was transport ownership: the frontend submitted through the production Decision API boundary, while the backend remained the deterministic boundary executor.

---

## 6 Rollback

Cloudflare deployment rollback procedure: UNVERIFIED in repository documentation.

Repository deploy entry point exists as `npm run deploy:cf` in `apps/web/package.json` (`opennextjs-cloudflare build && opennextjs-cloudflare deploy`). No documented rollback command was found.

---

## 7 References

- `apps/web/wrangler.jsonc`
- `apps/web/open-next.config.ts`
- `apps/web/app/dashboard/page.tsx`
- `apps/web/lib/decision-engine-facade/`
- `apps/web/components/ftue/ResultScreen.tsx`
- `apps/web/lib/ftue-i18n.ts`
- `apps/web/app/terms/page.tsx`
- `apps/web/app/privacy/page.tsx`
- `apps/web/app/cookies/page.tsx`
- `apps/web/app/disclaimer/page.tsx`
- `apps/web/app/contact/page.tsx`
- `docs/governance/DEVELOPMENT.md`
- `docs/MASTER_STATUS.md`
- `docs/adr/ADR-0006-Decision-API-Contract-v1.md`
- `docs/deployments/2026-07-12-backend-sprint-6a.md`

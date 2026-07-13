# METIORO Project Status

**Status:** PROPOSED  
**Authority:** Operational  
**Owner:** METIORO  
**Date:** 12 July 2026  

## Purpose

This document is a descriptive operational snapshot.

It records current project state and does not create decisions.

`docs/MASTER_STATUS.md` remains the authoritative Sprint and workstream registry. This document is an operational snapshot only.

If this document conflicts with a LOCKED governance artifact or authoritative registry, the higher-authority instrument takes precedence.

---

## 1. Production Baseline

| Item | Value | Evidence |
|------|-------|----------|
| Backend production commit | `9196e890` | `docs/deployments/2026-07-12-backend-sprint-6a.md` |
| Frontend production commit | `c8bfa34c` | `docs/deployments/2026-07-12-frontend-sprint-6b.md` |
| Production web | `https://metioro.com` | `docs/deployments/2026-07-12-frontend-sprint-6b.md` |
| Production API | `https://api.metioro.com` | `docs/deployments/2026-07-12-backend-sprint-6a.md` |

Production commits are fixed SHAs in deployment records. They are not asserted to equal current `HEAD`.

---

## 2. Sprint Status

| Sprint | Status | Evidence |
|--------|--------|----------|
| Sprint 6A | CLOSED | `docs/MASTER_STATUS.md` (PHASE-6A); `docs/deployments/2026-07-12-backend-sprint-6a.md`; commit `bf71d376` |
| Sprint 6B | CLOSED | `docs/MASTER_STATUS.md` (PHASE-6B); `docs/deployments/2026-07-12-frontend-sprint-6b.md`; commit `bf71d376` |

### Sprint 6B production verification

Evidence: `docs/deployments/2026-07-12-frontend-sprint-6b.md`

- `/terms`, `/privacy`, `/cookies`, `/disclaimer`, `/contact` — HTTP 200
- EN / FA / RU locale switching verified
- One filtered `execute` request observed in a clean Network log
- Decision response HTTP 200
- No user-visible semantic UI change was expected under the boundary-only contract.

---

## 3. Production Status

| Area | Verified state | Evidence |
|------|----------------|----------|
| Frontend | Cloudflare Workers / OpenNext | `docs/deployments/2026-07-12-frontend-sprint-6b.md`; `apps/web/wrangler.jsonc` |
| Backend | Railway / FastAPI | `docs/deployments/2026-07-12-backend-sprint-6a.md`; `railway.toml` |
| Decision endpoint | `POST /api/v1/decision/execute` | ADR-0006; deployment records; `apps/api/src/routes/decision.py` |
| HTTPS | Verified for production routes through successful HTTPS requests | Deployment records (§4 verification) |
| DNS | Production hostnames responded successfully during verified HTTPS testing | Deployment records |
| CORS | Configured in `apps/api/src/main.py` (includes `https://metioro.com`, `https://www.metioro.com`) | `apps/api/src/main.py` |
| Availability | Smoke-test availability verified in deployment records | Deployment records |

Full production uptime monitoring: **UNVERIFIED**

---

## 4. Architecture Status

Current architecture only:

- Frontend: Next.js app under `apps/web`
- Backend: FastAPI app under `apps/api`
- Decision API: versioned HTTP boundary `POST /api/v1/decision/execute`
- Backend owns transport execution; frontend owns presentation and localized UI copy
- Current executor is the deterministic Decision API boundary executor
- Current executor does not establish semantic compatibility with the legacy scoring engine

References: `docs/adr/ADR-0006-Decision-API-Contract-v1.md`; `apps/api/src/routes/decision.py`; `apps/api/src/services/decision_execute_boundary.py`; `apps/web/lib/decision-engine-facade/`; `apps/web/lib/ftue-i18n.ts`

The production backend is the Decision API boundary, not a completed semantic decision engine.

---

## 5. ADR Status

**ADR-0006:** LOCKED  
References: `docs/adr/ADR-0006-Decision-API-Contract-v1.md`; `docs/governance/ADR_INDEX.md`

Deferred obligations (documented; not re-interpreted here):

- Legacy `DecisionRequest` / scoring-engine integration deferred
- Canonical location obligation remains deferred
- Server-side cancellation implementation remains deferred beyond Sprint 6A
- Authentication / authorization not decided by ADR-0006
- Retry / `Idempotency-Key` client behaviour not implemented in Sprint 6A

Evidence: ADR-0006; `docs/governance/SPRINT-6A-TASK-DECOMPOSITION.md`

---

## 6. Infrastructure Status

- Cloudflare Workers / OpenNext frontend deployment — `docs/deployments/2026-07-12-frontend-sprint-6b.md`
- Railway API deployment — `docs/deployments/2026-07-12-backend-sprint-6a.md`
- Production domains — `https://metioro.com`, `https://api.metioro.com`
- HTTPS observed in production verification — deployment records
- Production commits recorded in deployment records — `9196e890`, `c8bfa34c`

TLS observed in use.  
Certificate inventory and expiry monitoring: **UNVERIFIED**

---

## 7. Localization Status

### Contract

Decision API locale contract: `en | ru | fa | ar`  
References: ADR-0006; `apps/web/lib/app-settings.ts`; `apps/web/lib/question-library/resolver.ts`

### Production verification

| Locale | Production verification |
|--------|--------------------------|
| EN | VERIFIED |
| FA | VERIFIED |
| RU | VERIFIED |
| AR | UNVERIFIED |

Evidence: `docs/deployments/2026-07-12-frontend-sprint-6b.md`

The four-locale contract remains unchanged by the narrower production verification set.

---

## 8. Technical Debt

Repository-supported items only:

- Deterministic boundary executor; legacy semantic engine integration deferred — ADR-0006; `apps/api/src/services/decision_execute_boundary.py`
- Authentication incomplete — ADR-0006; `docs/ARCHITECTURE_VALIDATION.md`
- Server-side persistence incomplete — `docs/ARCHITECTURE_VALIDATION.md` (AR-2)
- Billing not implemented — `docs/ARCHITECTURE_VALIDATION.md`
- Retry / `Idempotency-Key` client behaviour not implemented — `docs/governance/SPRINT-6A-TASK-DECOMPOSITION.md`
- Mobile LCP remains above target — `docs/performance/BASELINE.md`; `docs/MASTER_STATUS.md`
- Additional backlog — `docs/MASTER_STATUS.md` Current Backlog only

---

## 9. Known Risks

- Semantic invention risk if legacy scoring is forced behind the Decision API before authoritative mapping exists — ADR-0006 Implementation Boundary Clarification
- Client-side persistence / incomplete authentication limits server enforcement and multi-device continuity — `docs/ARCHITECTURE_VALIDATION.md`
- Mobile performance gap — `docs/performance/BASELINE.md`
- Engineering hygiene / CI strengthening backlog — `docs/MASTER_STATUS.md` (`ENG-HYGIENE` OPEN); `docs/ENGINEERING_READINESS.md`

Brand note: `docs/MASTER_STATUS.md` records that reconciliation between the wedge wording and Constitutional Sentence wording is not completed. No selection is made here.

---

## 10. Immediate Next Actions

Not a roadmap. Remaining agreed work only (deployment records and PHASE-6A/6B registry updates completed in commit `bf71d376`):

1. Complete the accumulated update and final acceptance of `docs/governance/DEVELOPMENT.md` (status PROPOSED). Preserve the known four-item update scope already recorded in project documentation; do not redefine those items here.
2. Complete legal counsel review gate for legal-page content — `docs/governance/LEGAL_COMPLIANCE_POLICIES.md` (Draft).
3. Complete the UKIPO consultation gate — `docs/MASTER_STATUS.md` Brand Assets records the status as `Pending`; no consultation record is present in repository documentation at authoring time.
4. Resolve the recorded brand wording reconciliation noted in `docs/MASTER_STATUS.md` — **owner decision** (not decided by this document).
5. Verify AR locale in production — `docs/deployments/2026-07-12-frontend-sprint-6b.md`.
6. Continue the already documented technical backlog in `docs/MASTER_STATUS.md` Current Backlog (repository-listed items only).
7. Review and approve this `docs/STATUS.md` draft.
8. Product roadmap prioritization: **Decision pending.**

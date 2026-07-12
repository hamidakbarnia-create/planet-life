# METIORO Backend Deployment Record — Sprint 6A

**Status:** PROPOSED  
**Authority:** Operational Record  
**Deployment date:** 12 July 2026  
**Environment:** Production  
**Service:** METIORO API  
**Platform:** Railway  

This document records an executed production deployment. It does not create or modify architecture, product, or governance decisions. LOCKED instruments take precedence if a conflict exists.

---

## 1 Deployment Baseline

| Item | Value |
|------|-------|
| Production branch | `governance-foundation` |
| Deployed commit | `9196e890` |
| Previous Railway branch | `feature/reasoning-engine` |
| Production API | `https://api.metioro.com` |

Repository confirmation: `9196e890` is an ancestor of `governance-foundation`. Remote branch `origin/feature/reasoning-engine` exists.

---

## 2 Pre-deployment State

- Railway production was previously configured to deploy `feature/reasoning-engine`.
- Comparison of `9196e890` (`governance-foundation` deploy point) against `origin/feature/reasoning-engine`:
  - commits unique to previous branch: `0`
  - commits added by target branch: `52`

Verification command:

```bash
git rev-list --left-right --count \
  origin/feature/reasoning-engine...9196e890
```

- Switch was therefore forward-only with no production commit removal.

---

## 3 Deployment Procedure

1. Verified target branch and production baseline
2. Waited for required CI / release checks
3. Switched Railway production branch to `governance-foundation`
4. Waited for Railway deployment completion
5. Verified production endpoints
6. Compared OpenAPI paths before and after deployment
7. Confirmed rollback path

Exact Railway deployment IDs and timestamps: **UNVERIFIED** in repository documentation.

---

## 4 Production Verification

| Check | Result |
|-------|--------|
| Health endpoint | PASS — HTTP 200 |
| OpenAPI document | PASS — HTTP 200 |
| Decision endpoint available | PASS — `POST /api/v1/decision/execute` present |
| OpenAPI path regression | PASS — added: 1; removed: 0 |
| CORS for production frontend | PASS |
| Production API hostname | PASS — `https://api.metioro.com` |

---

## 5 Deployment Result

- Deployment completed successfully.
- Existing API paths were not removed.
- `/api/v1/decision/execute` was added to production.
- Sprint 6A production deployment verification passed.

The deployed decision route establishes the Decision API boundary. It does not establish semantic compatibility with the legacy scoring engine.

---

## 6 Rollback

Restore the previous Railway production branch selection in the Railway service configuration.

---

## 7 References

- `docs/adr/ADR-0006-Decision-API-Contract-v1.md`
- `docs/governance/SPRINT-6A-TASK-DECOMPOSITION.md`
- `apps/api/src/routes/decision.py`
- `apps/api/src/services/decision_execute_boundary.py`
- `apps/api/tests/test_decision_execute_route.py`
- `apps/api/src/main.py` (CORS origins; decision router mount)
- `railway.toml`
- `apps/api/DEPLOY.md`

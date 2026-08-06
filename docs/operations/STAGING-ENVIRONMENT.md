# METIORO Staging Environment Foundation

**Document type:** Operational design / setup checklist (not an ADR)
**Status:** FOUNDATION IN REPOSITORY — EXTERNAL PLATFORM SETUP REQUIRED
**Branch:** `governance-foundation`
**Related application HEAD (at foundation introduction):** see git history for `chore(deploy): add staging environment foundation`

This document does **not** claim staging verification or production verification.

---

## 1. Topology

| Tier | Production | Staging |
| ---- | ---------- | ------- |
| Frontend Worker | `planet-life-web` | `planet-life-web-staging` |
| Frontend origin (preferred) | `https://metioro.com` | `https://staging.metioro.com` |
| Frontend origin (interim) | `https://planet-life-web.planet-life.workers.dev` | Cloudflare `workers.dev` URL for staging Worker |
| API | Railway production service → `https://api.metioro.com` | **Separate** Railway staging service → `https://api-staging.metioro.com` (preferred) or Railway domain |
| Coupling | Production FE → production API only | Staging FE → staging API only |

Do **not** point staging frontend at production API unless an explicit temporary exception is approved (`ALLOW_STAGING_TO_PRODUCTION_API=1`) and recorded.

---

## 2. Repository strategy

### Cloudflare

**Chosen option:** separate Wrangler config file (Option B).

| File | Role |
| ---- | ---- |
| `apps/web/wrangler.jsonc` | Production Worker `planet-life-web` — **unchanged** |
| `apps/web/wrangler.staging.jsonc` | Staging Worker `planet-life-web-staging` |
| `npm run deploy:cf` | Production deploy path — **unchanged** |
| `npm run deploy:cf:staging` | Staging-only deploy (guarded) |

Why not Wrangler `env.staging` inside the production file: a missing `--env` flag can silently deploy production. A separate config makes the staging command fail closed when the staging file is absent and keeps production scripts untouched.

### Railway

**Recommended option:** separate Railway **service** in the same project (Option A), bound to the same repo, with staging-only variables and a distinct public domain.

Reasons:
- Clear isolation of `APP_ENV`, CORS, and OpenAI secrets
- Same `railway.toml` / Nixpacks build path
- No production variable mutation required

Alternatives B/C (separate environment/project) are acceptable if the owner prefers stronger blast-radius isolation.

---

## 3. Frontend commands (do not run deploy in foundation tasks)

```bash
cd apps/web

# Requires staging env vars in the shell / CI:
# NEXT_PUBLIC_APP_ENV=staging
# NEXT_PUBLIC_API_BASE=https://api-staging.metioro.com

npm run build:cf:staging
npm run preview:cf:staging   # local preview against staging Wrangler config
npm run deploy:cf:staging    # deploys Worker planet-life-web-staging only
```

Production remains:

```bash
npm run deploy:cf
```

Staging scripts invoke `scripts/assert-staging-deploy.mjs`, which fails when:
- `wrangler.staging.jsonc` is missing
- Worker name is not `planet-life-web-staging`
- `NEXT_PUBLIC_APP_ENV` is not `staging`
- `NEXT_PUBLIC_API_BASE` is missing, non-HTTPS, localhost, or production API host

---

## 4. Environment contract

### Frontend (build-time / Cloudflare)

| Variable | Location | Notes |
| -------- | -------- | ----- |
| `NEXT_PUBLIC_APP_ENV=staging` | Cloudflare vars + CI | Required |
| `NEXT_PUBLIC_DEPLOYMENT_ENV=staging` | Cloudflare vars + CI | Optional display/metadata |
| `NEXT_PUBLIC_API_BASE` | Cloudflare / GitHub Environment `vars` | Staging API HTTPS origin |
| `NEXT_PUBLIC_RELEASE_SHA` | CI | Optional commit identity |
| `CLOUDFLARE_API_TOKEN` | GitHub Environment **secret** | Staging deploy only |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Environment **secret** | Staging deploy only |

Never place OpenAI or Railway tokens in `NEXT_PUBLIC_*`.

### Backend (Railway staging service)

| Variable | Location | Notes |
| -------- | -------- | ----- |
| `APP_ENV=staging` | Railway variable | Enables staging CORS fail-fast |
| `CORS_ALLOWED_ORIGINS` | Railway variable | Comma-separated staging FE origins only |
| `CONVERSATION_GENERATION_PROVIDER=openai` | Railway variable | Prefer openai for Ask smoke |
| `OPENAI_API_KEY` | Railway **secret** | Never commit |
| `OPENAI_MODEL` | Railway variable | Default `gpt-4o-mini` accepted |
| `OPENAI_TIMEOUT_SECONDS` | Railway variable | Finite `> 0` (default `25.0`) |

Examples (placeholders only):
- `apps/web/staging.env.example`
- `apps/api/.env.staging.example`

---

## 5. CORS behaviour

Implementation: `apps/api/src/cors_origins.py`

| Mode | Behaviour |
| ---- | --------- |
| `CORS_ALLOWED_ORIGINS` unset | Historical production allowlist (unchanged) |
| `CORS_ALLOWED_ORIGINS` set | Exact override list; `*` rejected |
| `APP_ENV=staging` | Requires explicit `CORS_ALLOWED_ORIGINS` at startup |

Production Railway should leave `CORS_ALLOWED_ORIGINS` unset (or set explicitly to production origins). Do **not** add staging origins to production.

---

## 6. Auth and data isolation

| Concern | Assessment |
| ------- | ---------- |
| Auth session storage | `localStorage` key `planet-life-auth` — host-scoped; staging host does not share production sessions |
| Cookie domain | No shared production cookie auth path for FTUE session |
| Profile / birth data | Primarily browser localStorage — staging browsers start empty unless test data is seeded |
| Vault Ask adapter | Local key `planet-life-ask-decision-saves` — host-scoped; not auto-wired in UI |
| Analytics | Local queue `planet-life-ftue-events` — host-scoped |
| Backend DB | No dedicated production DB coupling is required for Conversation execute; staging must **not** attach production user databases without explicit owner approval |
| Test accounts | Use staging-only test identities; sanitised questions only |

**Classification:** safe as-is for host-separated staging FE + separate staging API, provided staging does not reuse production databases or production API.

---

## 7. DNS plan (owner action — not performed by foundation commit)

| Hostname | Platform | Record / route | TLS | CORS |
| -------- | -------- | -------------- | --- | ---- |
| `staging.metioro.com` | Cloudflare Worker `planet-life-web-staging` | Worker route / CNAME per CF docs | Cloudflare | Listed on staging API `CORS_ALLOWED_ORIGINS` |
| `api-staging.metioro.com` | Railway staging service | CNAME to Railway domain | Railway/CF as configured | Staging FE origins only |

Until DNS exists, use the staging Worker `workers.dev` URL and Railway-provided domain, and put those exact origins in `CORS_ALLOWED_ORIGINS`.

---

## 8. CI

| Workflow | Role |
| -------- | ---- |
| `.github/workflows/ci.yml` | CI only — unchanged |
| `.github/workflows/deploy-staging.yml` | Manual `workflow_dispatch` with full commit SHA; GitHub Environment `staging`; deploys only via `npm run deploy:cf:staging` |

Preferred governance model: manual workflow with required reviewer on Environment `staging`. No automatic production deploy.

---

## 9. External setup checklist (owner / platform)

### Cloudflare
1. Authenticate Wrangler (`wrangler login`) or configure CI token.
2. Ensure account can create Worker `planet-life-web-staging`.
3. Set staging vars: `NEXT_PUBLIC_APP_ENV`, `NEXT_PUBLIC_API_BASE`, optional release SHA.
4. Configure route `staging.metioro.com` when DNS ready.
5. Deploy once with `npm run deploy:cf:staging` from a clean checkout of the approved SHA.
6. Record deployment ID and URL.

### Railway
1. Create **staging** API service (separate from production).
2. Bind repository; deploy approved SHA / branch policy.
3. Set staging variables from `apps/api/.env.staging.example` (real secrets via Railway UI).
4. Attach `api-staging.metioro.com` (or note Railway domain).
5. Verify `GET /` health and `POST /api/v1/conversation/execute`.
6. Confirm production service variables were **not** edited.

### DNS
1. Create `staging.metioro.com` → staging Worker.
2. Create `api-staging.metioro.com` → staging API.

### GitHub
1. Create Environment `staging` with required reviewers.
2. Add secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
3. Add variable: `NEXT_PUBLIC_API_BASE` (staging API HTTPS origin).
4. Enable `Deploy staging` workflow_dispatch.

---

## 10. Rollback (staging)

1. Platform rollback to previous successful staging deployment, or
2. Redeploy prior known-good SHA to `planet-life-web-staging` only.

Do not use staging rollback procedures against production Worker `planet-life-web`.

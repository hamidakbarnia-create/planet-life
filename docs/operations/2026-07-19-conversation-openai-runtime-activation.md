# Conversation OpenAI — Runtime Activation Record

**Document type:** Operational deployment / smoke record (not an ADR)
**Date (UTC):** 2026-07-19
**Branch:** governance-foundation
**HEAD at authoring:** `ba1e7598`
**Public API:** unchanged (`POST /api/v1/conversation/execute`)

---

## Status

| Field | Value |
| ----- | ----- |
| Status | **PARTIALLY COMPLETE** |
| Production provider | **static** |
| Production OpenAI activation | **NOT PERFORMED** |
| Blocking condition | Railway variables were not applied because Railway CLI authentication was unavailable |
| Production OpenAI smoke test | **NOT EXECUTED** |

This record does **not** claim that production OpenAI activation is complete.

---

## 1. Runtime environment contract

| Variable | Role |
| -------- | ---- |
| `CONVERSATION_GENERATION_PROVIDER` | `static` (default) or `openai` |
| `OPENAI_API_KEY` | Required when provider is `openai` |
| `OPENAI_MODEL` | Optional; default `gpt-4o-mini` |
| `OPENAI_TIMEOUT_SECONDS` | Optional; default `25.0` |

No additional required variables. Secrets must not be committed or logged.

Canonical deploy notes: `apps/api/DEPLOY.md` (operator procedure only; does not assert production activation).

---

## 2. Startup validation (local / code path)

Application lifespan calls `validate_generation_provider_configuration()`, which resolves the configured provider locally (OpenAI client construction only when `openai` is selected; no chat completion call at startup).

---

## 3. Smoke payload (minimal valid)

```json
{"messages":[{"role":"user","content":"Hello"}],"locale":"en"}
```

Success criteria (when OpenAI production smoke is eventually executed): HTTP 200; `type` = `conversational`; `message` non-empty and **not** solely the static surface copy; `sources` present (array); `request_id` non-empty; no stack traces; no secret leakage.

---

## 4. Verified facts

| Fact | Evidence |
| ---- | -------- |
| Deployment environment contract documented | `apps/api/DEPLOY.md`; this record §1 |
| Local startup validation passes | `provider=openai` with non-empty key → validation OK (client construction only) |
| Local mocked OpenAI HTTP path returns 200 | TestClient / mocked completion → schema-conformant 200 |
| Invalid live OpenAI credentials map to unchanged public 500 envelope | Invalid key → `500` / `INTERNAL_ERROR` / `Internal conversation execution failure`; no key / stack / provider leakage |
| Production static endpoint returns 200 | `POST https://api.metioro.com/api/v1/conversation/execute` → 200 with static surface message |

---

## 5. Not verified

| Fact | Status |
| ---- | ------ |
| Railway OpenAI variables applied | **Not verified** |
| Production startup with `provider=openai` | **Not verified** |
| Production OpenAI completion | **Not verified** |
| Production rollback after OpenAI activation | **Not verified** |

---

## 6. Production observation (static only)

| Check | Result |
| ----- | ------ |
| `GET https://api.metioro.com/` | HTTP 200 — `{"status":"healthy","platform":"METIORO"}` |
| `POST /api/v1/conversation/execute` (minimal payload) | HTTP 200 |
| Response shape | `type`, `message`, `sources`, `request_id` present |
| Provider in use | **static** — message is the static conversational surface copy |

Production OpenAI smoke was **not** executed.

---

## 7. Operator completion checklist

Complete all items before marking production OpenAI activation done:

- [ ] Authenticate Railway CLI or use Railway dashboard
- [ ] Set `CONVERSATION_GENERATION_PROVIDER=openai`
- [ ] Set `OPENAI_API_KEY` (secret — never commit or paste into git)
- [ ] Set `OPENAI_MODEL`
- [ ] Set `OPENAI_TIMEOUT_SECONDS`
- [ ] Redeploy
- [ ] Verify health/startup (`GET /` healthy; process starts with openai validation)
- [ ] Execute production smoke request (minimal payload in §3)
- [ ] Confirm non-static response (`message` is not solely the static surface copy)
- [ ] Inspect logs for leakage/errors (no API key, stack traces, or provider internals in client-visible output)
- [ ] Record deployment identifier and timestamp
- [ ] Retain rollback procedure to `CONVERSATION_GENERATION_PROVIDER=static` (redeploy/restart after variable change)

Until this checklist is complete, status remains **PARTIALLY COMPLETE** and production provider remains **static**.

---

**End of operational record**

# Ask Decision Intelligence V3 — Governance Reconciliation

## 1. Status

**IMPLEMENTED — UNCOMMITTED — TECHNICALLY VERIFIED — ADR-0009 ACCEPTED — P1-T14 / P1-T15 RATIFIED — DEPENDENCY IMPLEMENTATION NOT YET IN HEAD — P1-T13 STILL BLOCKED**

Not deployed. Not production-verified.

| Field | Status |
|-------|--------|
| Architecture decision | **RESOLVED BY ADR-0009** (Accepted, Product Owner ratification 2026-07-21) — D1/D2/D3 |
| Governance authority | **P1-T14 / P1-T15 RATIFIED** — APPROVED FOR SCOPED COMMIT REVIEW |
| Implementation dependency status | **NOT YET IN HEAD** |
| P1-T13 | **STILL BLOCKED** until P1-T14 and P1-T15 are committed into HEAD and P1-T13 is re-tested |

**Canonical task:** `P1-T13` — Ask Decision Intelligence V3 Product Surface
**Dependency tasks:** `P1-T14` (Personal Intelligence Core and Ask-safe Context); `P1-T15` (Shared Conversation Client and Timing Adapter)
**Registry location:** `docs/governance/SPRINT-P1-TASK-DECOMPOSITION.md` (document lifecycle remains **DRAFTED**; P1.4 APPROVED still pending)
**Task status (P1-T13):** REGISTERED — IMPLEMENTATION VERIFIED — BLOCKED ON UNAUTHORISED DEPENDENCIES
**Architecture:** ADR-0009 (Accepted) — decision-history injection; neutral `@/lib/conversation-client`; Ask direct timing imports.
**Block condition:** P1-T14 and P1-T15 must receive **APPROVED TO COMMIT**, be committed to HEAD, and P1-T13 must be re-tested from that clean dependency base before unblock.
**Ratified commit sequence:** Governance / ADR → P1-T14 → P1-T15 → P1-T13 re-verification → P1-T13 commit review.

**Informal TASK-10 has no canonical standing and must not be used in repository governance, commit messages, evidence records, or status reports.** The only canonical `T10` identifier is **P1-T10** (Prompt Assembly, Context Injection, and Output Validation Binding), a server-side prompt-binding task with a different scope (see §6).

## 2. Purpose

Ask Decision Intelligence V3 converts a generic Conversation API success `message` (plus local intent framing, optional clarification, token-efficient personal intelligence context, and local timing signals) into a validated **decision-intelligence presentation model** (`AskDecisionResult` schema `3.0.0`) for the Ask → Result FTUE path.

It does not redefine the public Conversation API. It is a client-side product layer that parses, repairs, validates, and falls back when model JSON is incomplete.

## 3. Contract boundary

### Public contract

- **Method / path:** `POST /api/v1/conversation/execute`
- **Authority:** ADR-0007 (LOCKED) and ADR-0007 Amendment A1 (public HTTP route clarification)
- **Request (transport):** `ConversationRequest`
  - `messages`: `[{ role: "user" | "assistant", content: string, ...optional reserved fields }]`
  - `locale`: `"en" | "ru" | "fa" | "ar"`
  - `conversation_id`: optional; not required in P1
- **Success response (transport):** `ConversationResponse`
  - `type`: `"decision" | "conversational"`
  - `message`: string
  - `sources`: array
  - `request_id`: string
  - `reasoning`: string | null (required non-null when `type === "decision"`)
  - `uncertainty`: string | null (required non-null when `type === "decision"`)
- **Errors:** standard Conversation API error envelope (`error.code`, `error.message`, `error.requestId` / product-owned mapping)
- **Ceilings (server):** ≤ 20 messages; ≤ 32 KiB payload; ≤ 30s end-to-end server timeout; stateless processing; no client-supplied `request_id` on the request body

### Internal domain contract

- **Name:** `AskDecisionResult`
- **Schema version:** `3.0.0`
- **Owned by:** `apps/web/lib/ask-decision/types.ts`
- **Role:** frontend decision-intelligence **presentation / domain** contract for parsing, validation, fallback, and UI rendering
- **Not** a replacement public HTTP response schema
- **Not** published in OpenAPI as the Conversation execute response
- Populated from the ADR-0007 response `message` (JSON inside the string), local timing, and local intelligence context; `request_id` may be retained only as internal `meta.requestId`

## 4. Data flow

1. User question (Ask FTUE)
2. Deterministic intent detection (`detectIntent`)
3. Decision framing (`frameDecision`)
4. Optional single clarification gate (`evaluateClarification`)
5. Token-efficient personal intelligence context (Intelligence Core selectors/serializers; no raw birth date/time/location in serialized prompt context)
6. Existing Conversation API via `postConversationExecute` → `POST /api/v1/conversation/execute` with `{ messages, locale }`
7. Parallel local timing engine (`loadPathfinderTiming`) when relevant
8. Parse / repair of `ConversationResponse.message`
9. Validation against `AskDecisionResult` 3.0.0
10. Structured fallback on network/contract/parse failure
11. `AskDecisionView` presentation
12. Safe analytics (`trackAskDecisionEvent` / property denylist)
13. Optional local Ask save adapter (`saveAskDecisionToVault` → `localStorage` only; stores question + structured summary; not canonical backend Vault)

## 5. Public API compatibility

**Evidence from code:** Ask V3 does **not** change the public Conversation API surface.

| Constraint | Ask V3 behaviour |
|---|---|
| Route | Unchanged: uses `CONVERSATION_EXECUTE_PATH` = `/api/v1/conversation/execute` |
| Request envelope | Unchanged: `{ messages, locale }` (+ optional `conversation_id` only if supplied; Ask does not require it) |
| Response envelope | Unchanged: client accepts ADR-0007 success fields; presentation model is built client-side |
| Locale rules | Unchanged: four-value locale (`en` \| `ru` \| `fa` \| `ar`) |
| Timeout | Does not raise server ceiling; client may abort via `AbortSignal` |
| Message limits | Client sends a single user message for the Ask pipeline (within ceilings) |
| Statelessness | No server conversation memory assumed; each Ask run supplies its own `messages` |
| `request_id` | Not sent on request; retained from response as internal `meta.requestId` when available |
| Error envelope | Public errors remain the Conversation client failure kinds; Ask maps them to structured fallback without inventing a new HTTP error schema |

Preserved: no new public endpoint, no OpenAPI promotion of `AskDecisionResult`, no change to Conversation roles, and no requirement for clients to send `conversation_id`.

## 6. Canonical task mapping

Source: `docs/governance/SPRINT-P1-TASK-DECOMPOSITION.md` (lifecycle **DRAFTED**; Implementation Start requires ADR-0007 LOCKED and **P1.4 APPROVED**).

Mappings below use only existing task IDs. No invented “TASK-10”.

### P1-T01 — Conversation Contract Surface

- **Why it applies:** Ask consumes the locked request/response/error surface through the existing web Conversation client.
- **What Ask V3 covers:** Client call shape and success-body acceptance.
- **Relation:** **Consumes** (does not complete backend contract-surface delivery).
- **Authorisation gap:** None for *using* the contract; does not authorise a new frontend DI product schema.

### P1-T02 — Stateless Conversation Processing

- **Why it applies:** Ask supplies the message content required for each run and does not assume server-side conversational memory.
- **What Ask V3 covers:** Stateless client usage pattern for the Ask pipeline.
- **Relation:** **Consumes**.
- **Authorisation gap:** None for stateless usage.

### P1-T05 — Derived Astrological Context Assembly

- **Why it applies:** Ask injects token-efficient derived intelligence context into the user message content and excludes raw birth fields from that serialization path.
- **What Ask V3 covers:** Client-side derived-context line for prompt content (not the server-side P1 provider-bound assembly task).
- **Relation:** **Partially overlaps / consumes patterns**; does **not** complete P1-T05.
- **Authorisation gap:** P1-T05 is a server generation-context task. Client-side context in `messages[].content` is an existing web pattern and does not by itself authorise AskDecisionResult as a public product contract.

### P1-T08 — Provider Error Mapping and Containment

- **Why it applies:** Ask must not surface provider internals; contract/network failures become structured fallback briefings.
- **What Ask V3 covers:** Client-side containment of failed Conversation client results into `AskDecisionResult` fallback.
- **Relation:** **Consumes** client-visible failure kinds; does not implement server error mapping.
- **Authorisation gap:** None for client fallback behaviour.

### P1-T10 — Prompt Assembly, Context Injection, and Output Validation Binding

- **Why it applies:** Ask performs client-side prompt assembly, context injection into the user message, and output parse/validate/repair.
- **What Ask V3 covers:** Frontend binding of Ask DI JSON schema instructions and validation — **not** the governed System Prompt v1 server artifact binding described by P1-T10.
- **Relation:** **Related overlap only**. Must **not** be treated as completed P1-T10, and must **not** be confused with informal “TASK-10”.
- **Authorisation gap:** **P1-T10 does not authorise a new Ask Decision Intelligence product surface or UI programme.** Completing or claiming P1-T10 via this frontend work would change the canonical meaning of that task.

### P1-T12 — Live Conversation MVP User Path

- **Why it applies:** Closest authorised user-facing path under Product Scope §3.1 / Decision D1.
- **What Ask V3 covers:** Ask → Result remains a user-facing path that calls the live Conversation API.
- **Relation:** **Extends** the FTUE Ask/Result path with a structured decision-intelligence presentation model.
- **Authorisation gap:** **Material.** P1-T12 authorises a bounded multi-turn live conversation path under the locked contract and explicitly excludes UI redesign programmes / Non-Deliverables. It does **not** name AskDecisionResult 3.0.0, structured DI modules, or local Ask “Vault” save semantics as in-scope deliverables.

### Explicit non-authority of prior tasks

Prior P1 tasks do **not** independently authorise the complete Ask V3 product surface:

- `AskDecisionResult` schema `3.0.0` as a product domain contract
- The Ask Decision Intelligence V3 card/module presentation surface
- Treating informal “TASK-10” as a commit authorisation label

**Registration completed:** canonical task **P1-T13** authorises the Ask product surface; **P1-T14** and **P1-T15** authorise its minimum dependency packages. P1-T13 commit remains blocked until those dependency tasks are verified in HEAD (see §13–§16).

## 7. Technical evidence

Recorded for the Ask V3 implementation and this reconciliation (web app scope). Exact re-verification commands are in the task verification phase.

| Gate | Evidence |
|---|---|
| Focused Ask tests | From `apps/web`: `npx vitest run lib/ask-decision/ask-decision.test.ts lib/ask-decision/conversation-contract.test.ts components/ask/AskDecisionView.test.tsx components/ftue/ResultScreen.test.tsx` → **4 files / 52 tests passed** |
| Full web suite | From `apps/web`: `npm test` → **51 files / 447 tests passed** |
| Scoped ESLint | From `apps/web`: `npx eslint components/ftue/AskScreen.tsx components/ftue/ResultScreen.tsx components/ftue/ResultScreen.test.tsx components/ask lib/ask-decision -f stylish` → **0 errors, 0 warnings** |
| Production web build | From `apps/web`: `npm run build` → passed (TypeScript finished via Next.js build) |
| TypeScript | Passed through Next.js production build (no standalone `typecheck` script in `apps/web/package.json`) |
| Full-repository lint | **Outside acceptance** — known pre-existing repository-wide failures |

Do not claim “lint clean” for the repository. Scoped Ask paths are **0 errors and 0 warnings**.

## 8. Privacy boundary

- Raw birth date / time / location are excluded from the serialized Ask intelligence context used in prompt content.
- Analytics property denylist includes (case-insensitive): `question`, `text`, `response`, `message`, `prompt`, `birth`, `profile`, `payload`.
- Analytics helpers do not accept question / prompt / profile payload fields as trackable properties.
- **Ask Vault local adapter** (`apps/web/lib/ask-decision/vault-adapter.ts`) **does store the user question** (truncated) plus a structured result summary in `localStorage`.
- Local Ask persistence is **distinct** from analytics privacy and is **not** the canonical backend Vault.
- Adapter key: `planet-life-ask-decision-saves`; max **40** records; does not persist raw birth data or provider prompt text; not integrated with backend Vault APIs.
- Limitation: if product copy labels this as “Vault” without disclosing local-only semantics, that is a disclosure gap (not redesigned in this reconciliation). The adapter is currently exported for use; wiring/labelling remains subject to that limitation.

## 9. Safety boundary

Ask prompt/governance behaviour for this surface includes:

- No medical diagnosis
- No legal conclusions
- No investment instructions
- No deterministic predictions / certainty claims
- High-stakes intents (e.g. health / legal / investment) request a safety notice
- Lower confidence / `gather-more-information` / wait postures where clarification or missing inputs apply
- Mystical / motivational filler discouraged in the Ask prompt instructions

## 10. Known limitations

- Deterministic English-heavy regex intent classifier
- Locale support may be incomplete outside English for intent/framing copy paths
- Model JSON is repaired/validated client-side rather than enforced by a provider-side JSON schema
- Internal domain schema is not present in OpenAPI (by design under current ADR boundary)
- Frontend tests mock the Conversation API for core Ask pipeline tests
- Production end-to-end verification is not established
- `localStorage` Ask save adapter is not the canonical backend Vault
- Full repository lint is not green (pre-existing)
- Sprint P1 Task Decomposition remains DRAFTED; P1.4 APPROVED is still pending in that document’s Approval table
- P1-T13 remains **STILL BLOCKED** until P1-T14 and P1-T15 are committed into HEAD and P1-T13 is re-tested (see §13–§16)

## 11. Acceptance status

| Gate | Status |
|---|---|
| Technical acceptance (Ask V3) | Previously verified on dirty tree (supporting only). Not production-verified |
| Governance acceptance | **ADR-0009 Accepted**; **P1-T14 / P1-T15 RATIFIED**; document still DRAFTED; P1.4 APPROVED still pending |
| Production acceptance | **Not complete** |
| Architecture decision | **RESOLVED BY ADR-0009** |
| Implementation dependency status | **NOT YET IN HEAD** |
| P1-T13 commit readiness | **STILL BLOCKED** until T14/T15 in HEAD and clean-tree re-test |
| P1-T14 / P1-T15 commit readiness | **RATIFIED — APPROVED FOR SCOPED COMMIT REVIEW**; each still requires **APPROVED TO COMMIT** after final staged-diff review |

## 12. Allowed next action

1. ~~Owner ratification of P1-T14 and P1-T15 boundaries~~ — **done 2026-07-21** (ADR-0009 Accepted).
2. ~~Architecture decisions D1/D2/D3~~ — **resolved by ADR-0009**.
3. Final scoped staged-diff review + verification for **P1-T14**, then **APPROVED TO COMMIT**, then commit P1-T14.
4. Final scoped staged-diff review + verification for **P1-T15** (after T14 in HEAD), then **APPROVED TO COMMIT**, then commit P1-T15.
5. Clean-head re-verification of P1-T13; only then seek **APPROVED TO COMMIT** for P1-T13.

Do not invent TASK-10. Do not misuse P1-T10 as informal “TASK-10”.
**Informal TASK-10 has no canonical standing and must not be used in repository governance, commit messages, evidence records, or status reports.**

## 13. Canonical task registration record

### P1-T13 — Ask Decision Intelligence V3 Product Surface

| Field | Value |
|---|---|
| Status | REGISTERED — IMPLEMENTATION VERIFIED — BLOCKED ON UNAUTHORISED DEPENDENCIES |
| Depends on | **P1-T14**, **P1-T15** |
| Unblock requires | Dependency tasks committed into HEAD; P1-T13 clean-tree re-test; P1-T13 **APPROVED TO COMMIT** |

### P1-T14 — Personal Intelligence Core and Ask-safe Context

| Field | Value |
|---|---|
| Status | RATIFIED — APPROVED FOR SCOPED COMMIT REVIEW |
| Owner | Frontend / Intelligence Platform (Product Owner ratified 2026-07-21) |
| Manifest | Exact 30-file list in `SPRINT-P1-TASK-DECOMPOSITION.md` Task P1-T14 |
| Relation to P1-T13 | Hard dependency; commit before P1-T15 and P1-T13 |
| Implementation in HEAD | **NOT YET IN HEAD** |

### P1-T15 — Shared Conversation Client and Timing Adapter

| Field | Value |
|---|---|
| Status | RATIFIED — APPROVED FOR SCOPED COMMIT REVIEW |
| Owner | Frontend / Conversation Platform (Product Owner ratified 2026-07-21) |
| Manifest | Exact 9-file list in `SPRINT-P1-TASK-DECOMPOSITION.md` Task P1-T15 |
| Relation to P1-T13 | Hard dependency; commit after P1-T14 and before P1-T13 |
| Implementation in HEAD | **NOT YET IN HEAD** |
| Ownership note | Canonical client under `apps/web/lib/conversation-client/` (ADR-0009 D2); Pathfinder may keep compatibility re-export |

## 14. Import graph and dependency classification

Classification key:

- **Ask logical minimum** — symbol-def BFS without barrel fan-out
- **Barrel-only leakage** — pulled only because Ask (or a dependency) imports a package `index.ts`
- **Test-only** — Ask tests only
- **Unrelated package content** — outside Ask and outside authorised T14/T15 boundaries
- **D** — already in HEAD

### 14.1 Direct Ask runtime imports

| Source | Symbol | Defining file | Import path today | Task |
|---|---|---|---|---|
| `ask-decision/context.ts` | `serializeAskIntelligenceContext`, `formatAskIntelligencePromptLine`, `getDecisionContext`, `getPathfinderRiskContext`, `getTodayEnergyContext`, `getPersonalIntelligenceProfile` | `intelligence/ask-serialize.ts`, `selectors.ts`, `profile-storage.ts` | `@/lib/intelligence` (barrel) | P1-T14 |
| `ResultScreen.tsx` | `getPersonalIntelligenceProfile` | `intelligence/profile-storage.ts` | `@/lib/intelligence` (barrel) | P1-T14 |
| `AskScreen.tsx` | `getAskProfileContext` | `intelligence-profile/consumers.ts` | `@/lib/intelligence-profile` (barrel) | P1-T14 (Ask symbol only) |
| `ask-decision/run.ts` | `postConversationExecute`, `loadPathfinderTiming` | `conversation-client.ts`, `timing.ts` | `@/lib/pathfinder-decision` (barrel) | P1-T15 |
| `ask-decision/prompt-builder.ts` | `ConversationMessage` | `conversation-client.ts` | direct `.../conversation-client` | P1-T15 |
| `ask-decision/run.ts` | `ConversationLocale` | `conversation-client.ts` | direct `.../conversation-client` | P1-T15 |

### 14.2 Ask logical minimum (transitive)

Intelligence Core insight/builder modules listed under P1-T14; Pathfinder Ask-min: `conversation-client.ts`, `timing.ts`, `scores.ts` (`TimingSignals`), `types.ts`.

### 14.3 Barrel-only leakage (must not be absorbed into Ask or silently into T14/T15 workflow)

| File | Why pulled today | Authority |
|---|---|---|
| `pathfinder-decision/adaptive-questions.ts` | `pathfinder-decision/index.ts` barrel | **Excluded** |
| `pathfinder-decision/analysis.ts` | barrel | **Excluded** |
| `pathfinder-decision/storage.ts` | barrel / Pathfinder workflow | **Excluded** from T15 |
| `pathfinder-decision/decision-history-bridge.ts` | product bridge to storage | **Excluded** from T14/T15 |
| Non-Ask *authority* for functions in `consumers.ts` | co-located multi-product adapters | Staging whole file under T14 is required for `getAskProfileContext`; does **not** authorise calendar/home/people/profile/vault/world commits |

### 14.4 Test-only

| Symbol | Required by | Task coverage |
|---|---|---|
| `buildPersonalIntelligenceProfile`, `regeneratePersonalIntelligenceProfile`, `clearIntelligenceProfileStorage` | Ask unit tests | P1-T14 (same core; test helpers) |
| Mocked conversation/timing | Ask tests | Does not replace P1-T15 runtime modules |

### 14.5 Outside-Ask usage (platform reuse — not P1-T13 scope)

- `intelligence-profile` consumers used by calendar, home, people, profile, vault, world, Pathfinder scores — **separate future authority** (staging `consumers.ts` under T14 does not grant it)
- `pathfinder-decision` workflow used by `PathfinderDecisionApp` — **not** P1-T15
- Decision-history product bridge — outside Core (ADR-0009 D1)

### 14.6 Ownership findings

| Module | Finding |
|---|---|
| `apps/web/lib/conversation-client/` | **Canonical** shared ADR-0007 frontend client (ADR-0009 D2 Accepted) |
| Pathfinder `conversation-client.ts` | Compatibility re-export + `buildSynthesisMessages` only |
| `timing.ts` / `TimingSignals` | Reusable timing adapter; Ask uses direct imports (ADR-0009 D3) |
| `buildSynthesisMessages` | Pathfinder-owned; not required by Ask runtime |

## 15. Allowed commit boundaries and required order

### Governance records (this ratification step)

```bash
git add \
  docs/adr/ADR-0009-Shared-Frontend-Conversation-and-Decision-Context-Boundaries.md \
  docs/governance/ADR_INDEX.md \
  docs/governance/SPRINT-P1-TASK-DECOMPOSITION.md \
  docs/governance/ASK-DECISION-INTELLIGENCE-V3-RECONCILIATION.md
```

### P1-T14 (exact ratified manifest — see task section)

Canonical authority: `SPRINT-P1-TASK-DECOMPOSITION.md` Task P1-T14 (30 files). Do not stage Intelligence UI or `profile-context.ts`. Staging `consumers.ts` does **not** authorise non-Ask product commits.

### P1-T15 (exact ratified manifest — see task section)

Canonical authority: `SPRINT-P1-TASK-DECOMPOSITION.md` Task P1-T15 (9 files). Do **not** stage `adaptive-questions.ts`, `analysis.ts`, `storage.ts`, `decision-history-bridge.ts`, Pathfinder UI, or `index.ts` workflow barrel.

### P1-T13 (only after T14+T15 in HEAD and clean re-test)

```bash
git add \
  apps/web/lib/ask-decision \
  apps/web/components/ask \
  apps/web/components/ftue/AskScreen.tsx \
  apps/web/components/ftue/ResultScreen.tsx \
  apps/web/components/ftue/ResultScreen.test.tsx
```

(Update this reconciliation document only if further P1-T13-specific status changes are authorised.)

### Required commit sequence (ratified)

1. Governance / ADR records
2. **P1-T14** commit (after **APPROVED TO COMMIT**)
3. **P1-T15** commit (after **APPROVED TO COMMIT**; after T14 in HEAD)
4. Clean-tree re-verification of P1-T13
5. **P1-T13** commit review / commit after **APPROVED TO COMMIT**

## 16. Unresolved blockers

- P1-T14 final staged-diff review + **APPROVED TO COMMIT** (implementation **NOT YET IN HEAD**)
- P1-T15 final staged-diff review + **APPROVED TO COMMIT** after P1-T14
- P1-T13 clean-head re-verification (P1-T13 **STILL BLOCKED**)
- P1.4 APPROVED still pending for document-level Implementation Start
- Production verification not established
- Unrelated dirty tree must remain excluded
- Full-repository lint outside acceptance
- **P1-T13 must not be changed to READY/APPROVED until T14/T15 are in HEAD and re-tested**

## 17. Deferred optional follow-ups (not blockers for T14/T15 scoped commits)

1. Further prefer narrow Ask-only export for `getAskProfileContext` (extract from multi-product `consumers.ts`) in a later task.
2. Optional later: migrate remaining Pathfinder callers fully away from the compatibility re-export.

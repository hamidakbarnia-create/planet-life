# Sprint P1 — Task Decomposition

**Document ID:** SPRINT-P1-TASK-DECOMPOSITION
**Status:** DRAFTED
**Sprint:** P1 — Live Conversation MVP
**Architecture reference:** ADR-0007 — Conversation API Contract v1.0 (LOCKED)
**Parent Product Scope:** docs/governance/SPRINT-P1-PRODUCT-SCOPE.md
**Normative language:** `SHALL`, `MUST`, `MUST NOT`, `MAY`
**Date:** 13 July 2026

---

## Status

This Task Decomposition is in lifecycle state **DRAFTED**.

Under ADR-0007 §6, governance artifacts SHALL progress only through `DRAFTED → IN REVIEW → RATIFIED → LOCKED`. This document MUST NOT be represented as `RATIFIED` or `LOCKED` before the corresponding governance steps have been completed.

Architecture is frozen. ADR-0007 is the only architectural authority for Sprint P1. This document MUST NOT write code, modify architecture, redesign APIs, redesign prompts, redefine Product Scope, or introduce hidden decisions.

Every Task MUST trace to either one Deliverable from `SPRINT-P1-PRODUCT-SCOPE.md` or one ADR-0007 Decision. Any proposed work that cannot be so traced is out of scope and, if architectural, **Requires ADR Amendment**.

---

## Purpose

This document decomposes the approved Sprint P1 Product Scope into governed implementation tasks.

It exists to:

1. Translate Product Scope deliverables into discrete, reviewable tasks without expanding architecture.
2. Bind every task to ADR-0007 and to a parent Product Scope deliverable.
3. Establish Commit Boundaries under `DEVELOPMENT.md` §8 only.
4. Define the independent governed task for System Prompt v1.
5. Define Implementation Start as the conjunction of ADR-0007 LOCKED and P1.4 APPROVED.
6. Keep Legal Brief completion outside Implementation Start and inside the Production Release Gate only.

This document is operational governance. It is not an ADR, not a Product Scope rewrite, and not an implementation specification.

---

## Scope

### In scope

Task packages required to realise Product Scope deliverables §3.1 through §3.8 under locked ADR-0007 Decisions D1 through D13 and related contractual ceilings.

### Out of scope

All Product Scope Non-Deliverables, including architecture redesign, provider selection as a product capability, UI redesign programmes, open-ended prompt engineering, long-term memory, vector search, agent frameworks, production-optimisation programmes, and future roadmap activation.

### Authority rule

Task language MAY describe outcomes, inputs, outputs, acceptance criteria, gates, and deferred obligations. Task language MUST NOT prescribe provider vendors, prompt marketing copy, database schemas, API redesigns, or hidden architectural choices.

---

## Implementation Start

Implementation Start SHALL be defined as:

**ADR-0007 LOCKED**
**AND**
**P1.4 APPROVED**

Where **P1.4 APPROVED** means this Task Decomposition has received recorded governance approval under the Approval section sufficient to authorise task execution.

Implementation Start MUST NOT depend on Legal Brief completion.

Legal Brief remains part of the Production Release Gate only, as established by ADR-0007 §3 Legal gates:

- Engineering MAY begin after ADR-0007 is LOCKED and Task Decomposition has been approved. Completion of the Legal Brief is not a prerequisite for implementation.
- A production deployment that transmits user birth data, whether raw or derived, to a third-party processor SHALL NOT proceed until the Legal Brief has been completed and related privacy and DPA requirements have been resolved.

If legal review identifies an impact on the locked architectural contract, implementation SHALL pause under the Architecture Amendment Gate until the required ADR amendment has been approved (ADR-0007 §3).

---

## Global Commit Boundary

For every task in this document, Commit Boundary MUST reference `docs/governance/DEVELOPMENT.md` §8 only.

This Task Decomposition MUST NOT redefine commit policy.

Per `DEVELOPMENT.md` §8, the required cycle is:

Inspect → Implement → Self Review → External Review → **APPROVED TO COMMIT** → Commit → Push → Observe CI

No task MAY commit without explicit **APPROVED TO COMMIT** on the full diff.

---

## Task P1-T01 — Conversation Contract Surface

**Task ID:** P1-T01
**Purpose:** Realise the public Conversation API v1.0 contract surface for request, message, response, and standard error-envelope behaviour exactly as locked by ADR-0007, without redesigning the API.
**Inputs:** ADR-0007 Decisions D3, D4, D5, D6, D7, and D11; Product Scope deliverable §3.3; ADR-0006 locale and error-envelope conventions as adopted by ADR-0007.
**Outputs:** Contract-conformant conversation request/response behaviour; validation rejection of unsupported roles and invalid messages; optional `conversation_id` treated as reserved and non-required; locale handled under the adopted four-value model without creating server-side conversation state.
**Parent Deliverable:** Product Scope §3.3 Contract-conformant conversation outcome
**ADR Reference:** ADR-0007 Decisions D3, D4, D5, D6, D7, D11
**Acceptance Criteria:**
1. `ConversationMessage` requires `role` and `content`.
2. Accepted public roles are only `user` and `assistant`; unsupported roles are rejected through the standard validation error envelope.
3. `conversation_id` is optional; P1 server behaviour does not depend on it; clients are not required to send it.
4. Locale uses the ADR-0006 four-value definition adopted by ADR-0007 and does not create server-side conversation state.
5. Public error behaviour preserves the product-wide standard error-envelope convention.
**Review Gate:** Governance review confirming no API redesign and full mapping to ADR-0007 Decisions D3–D7 and D11.
**Commit Boundary:** `DEVELOPMENT.md` §8 only.
**Dependencies:** ADR-0007 LOCKED; P1.4 APPROVED; Product Scope Review Gate outcome supporting Task Decomposition.
**Non-Decisions:** This task does not select providers, does not design prompts, does not add roles, and does not invent new public schemas beyond ADR-0007.
**Deferred Obligations:** Streaming transport, extended roles, and persistence remain deferred under ADR-0007 §4 and §5.
**Risks:** Accidental introduction of new public fields or roles would redefine the contract and **Requires ADR Amendment**.

---

## Task P1-T02 — Stateless Conversation Processing

**Task ID:** P1-T02
**Purpose:** Ensure conversation processing remains stateless and that absence of server-side persistence is not represented as temporary memory or implied continuity.
**Inputs:** ADR-0007 Decision D2; Product Scope deliverable §3.2.
**Outputs:** Stateless request handling in which the client supplies conversation history required for each request; no server persistence of conversation history, conversation state, or conversational memory for P1.
**Parent Deliverable:** Product Scope §3.2 Stateless conversation outcome
**ADR Reference:** ADR-0007 Decision D2
**Acceptance Criteria:**
1. Server does not persist conversation history, conversation state, or conversational memory for P1 processing.
2. Client-supplied history is the request basis for each invocation.
3. Product behaviour and user-facing representation do not describe absent persistence as temporary memory or implied continuity.
**Review Gate:** Governance review confirming no persistence or memory capability is introduced.
**Commit Boundary:** `DEVELOPMENT.md` §8 only.
**Dependencies:** P1-T01 contract surface definitions.
**Non-Decisions:** This task does not design storage systems, Vault integration, or summary memory.
**Deferred Obligations:** Conversation persistence and persistent memory remain deferred (ADR-0007 §4 and §5).
**Risks:** Logging or operational retention accidentally creating conversational memory semantics; such design **Requires ADR Amendment** if it establishes server-side conversational memory.

---

## Task P1-T03 — History Ownership and Validation Ceilings

**Task ID:** P1-T03
**Purpose:** Enforce client ownership of history truncation and server-side validation ceilings without silent mutation of messages.
**Inputs:** ADR-0007 Decisions D5 and D12; Product Scope deliverables §3.3 and §3.8.
**Outputs:** Validation rejection of over-limit requests; preservation of message order and content for accepted requests; hard ceilings observed.
**Parent Deliverable:** Product Scope §3.3 Contract-conformant conversation outcome; §3.8 Bounded operational outcome
**ADR Reference:** ADR-0007 Decisions D5 and D12
**Acceptance Criteria:**
1. Client owns conversation-history truncation.
2. Server independently validates total message count, total request payload size, individual message validity, accepted role values, and required content constraints.
3. Server does not silently truncate, summarize, reorder, or discard conversation messages.
4. Requests exceeding 20 messages or 32 KiB are rejected with HTTP `400`, error code `VALIDATION_ERROR`, a request identifier, and no provider-specific details.
**Review Gate:** Contract-conformance review against Decisions D5 and D12.
**Commit Boundary:** `DEVELOPMENT.md` §8 only.
**Dependencies:** P1-T01.
**Non-Decisions:** This task does not raise hard ceilings and does not redefine error codes. Raising a hard ceiling **Requires ADR Amendment**.
**Deferred Obligations:** Operational profile tightening within hard ceilings may be documented later as an operational change and is not required to redefine this task.
**Risks:** Silent truncation for convenience would violate Decision D5.

---

## Task P1-T04 — Provider-Agnostic Live Generation Boundary

**Task ID:** P1-T04
**Purpose:** Deliver the Live Conversation MVP generation path through an internal provider-agnostic generation interface backed by a production generation engine, without making provider selection a public product capability.
**Inputs:** ADR-0007 Decision D1; Product Scope deliverable §3.1.
**Outputs:** Live generation invoked only through the internal provider-agnostic interface; provider-specific SDKs, request formats, model identifiers, and implementation details remain behind that interface and do not appear in the public Conversation API contract.
**Parent Deliverable:** Product Scope §3.1 Live Conversation MVP outcome
**ADR Reference:** ADR-0007 Decision D1
**Acceptance Criteria:**
1. A live conversational experience backed by a production generation engine is available through the authorised P1 path.
2. Public Conversation API contract contains no provider-specific SDKs, request formats, or model identifiers.
3. Provider selection UI, runtime user choice of provider, and multi-provider routing as a public capability are absent.
**Review Gate:** Architecture-conformance review confirming provider-agnostic boundary and no public provider leakage.
**Commit Boundary:** `DEVELOPMENT.md` §8 only.
**Dependencies:** P1-T01; P1-T02; Implementation Start conditions satisfied.
**Non-Decisions:** Initial launch with one provider is an operational fact and is not a normative architectural requirement of ADR-0007. This task does not create a public provider-selection product.
**Deferred Obligations:** Multi-provider routing strategies remain forward-compatible only (ADR-0007 §5).
**Risks:** Embedding provider identifiers in public contract or errors would violate Decisions D1 and D11.

---

## Task P1-T05 — Derived Astrological Context Assembly

**Task ID:** P1-T05
**Purpose:** Assemble approved derived astrological context before provider invocation and keep raw birth identifiers out of provider-bound context when equivalent derived context can satisfy the approved P1 capability.
**Inputs:** ADR-0007 Decision D8 and §3 Option B; Product Scope deliverable §3.4.
**Outputs:** Provider-bound P1 generation context limited to validated conversation history, locale, and approved derived astrological context.
**Parent Deliverable:** Product Scope §3.4 Derived-context personalisation outcome
**ADR Reference:** ADR-0007 Decision D8; ADR-0007 §3 Selected option Option B
**Acceptance Criteria:**
1. Backend calculates or assembles approved derived context before provider invocation.
2. Provider-bound context does not include raw birth date, raw birth time, raw birthplace text, or raw geographic coordinates when equivalent derived context can satisfy the approved P1 capability.
3. Excluded contexts are absent: persistent memory, Vault content, previous conversation retrieval, previous decision retrieval, live transit context, expanded decision context, external connector data, and vector-retrieved context.
**Review Gate:** Governance review confirming Option B adherence and excluded-context absence.
**Commit Boundary:** `DEVELOPMENT.md` §8 only.
**Dependencies:** P1-T04.
**Non-Decisions:** This task does not authorise raw-data disclosure to the provider. A change to raw-data disclosure **Requires ADR Amendment**.
**Deferred Obligations:** Legal wording and personal-data classification of derived features remain Legal Brief / Production Release Gate obligations and do not block Implementation Start.
**Risks:** Convenience injection of raw birth data would violate Decision D8.

---

## Task P1-T06 — Decision Classification and Explainability

**Task ID:** P1-T06
**Purpose:** Enforce response discriminator rules and Constraint 4a explainability requirements for decision-bearing outputs.
**Inputs:** ADR-0007 Decision D9; Constraint 4a as referenced by ADR-0007; Product Scope deliverable §3.5; Prompt Governance Specification v1 Governance Core classification and explainability rules.
**Outputs:** Successful responses with non-null `type` discriminator; decision responses containing required explainability fields; prohibition on conversational misclassification to avoid Constraint 4a.
**Parent Deliverable:** Product Scope §3.5 Explainability-compliant decision outcome
**ADR Reference:** ADR-0007 Decision D9
**Acceptance Criteria:**
1. Every successful response contains non-null `type` of `decision` or `conversational`.
2. Any response containing recommendation, act/not-act advice, comparative preference, score or ranked assessment, timing guidance, favourable/unfavourable period claim, or decision-relevant interpretation intended to influence user action is classified as `decision`.
3. Every `decision` response contains `message`, non-null `reasoning`, non-null `uncertainty`, `sources`, and `request_id`.
4. Decision-bearing responses are not accepted as merely `conversational`.
5. Probabilistic and non-deterministic language is used where certainty is not supported.
**Review Gate:** Constraint 4a prompt/contract review against Decision D9.
**Commit Boundary:** `DEVELOPMENT.md` §8 only.
**Dependencies:** P1-T01; P1-T09 System Prompt v1 Governance Core binding.
**Non-Decisions:** This task does not redefine the classification rule. Classification-rule change requires ADR amendment plus Constraint 4a review.
**Deferred Obligations:** Brand Voice Layer final tone remains PENDING and is not required for explainability acceptance.
**Risks:** Mislabeling decisions as conversational to omit `reasoning` or `uncertainty`.

---

## Task P1-T07 — Evidence Sources Governance

**Task ID:** P1-T07
**Purpose:** Ensure every successful response includes a `sources` array and that no fabricated user-facing evidence sources are emitted before EVIDENCE_REGISTRY E2 activation.
**Inputs:** ADR-0007 Decision D10; EVIDENCE_REGISTRY; Product Scope deliverable §3.6.
**Outputs:** Compliant `sources` behaviour, including empty-array pre-activation state.
**Parent Deliverable:** Product Scope §3.6 Evidence-governed sources outcome
**ADR Reference:** ADR-0007 Decision D10
**Acceptance Criteria:**
1. Every successful response contains a `sources` array.
2. Until at least one eligible registered evidence source exists at approved E2 activation level, `sources` is exactly `[]`.
3. No fabricated, inferred, or unregistered user-facing evidence sources are displayed.
**Review Gate:** Evidence-governance review against Decision D10 and EVIDENCE_REGISTRY activation policy.
**Commit Boundary:** `DEVELOPMENT.md` §8 only.
**Dependencies:** P1-T01; P1-T06.
**Non-Decisions:** This task does not activate evidence sources. Activation requires EVIDENCE_REGISTRY process plus applicable governance review.
**Deferred Obligations:** Non-empty sources activation remains deferred until registry policy is satisfied.
**Risks:** Product pressure to invent citations would violate Decision D10.

---

## Task P1-T08 — Provider Error Mapping and Containment

**Task ID:** P1-T08
**Purpose:** Translate provider failure conditions into the standard Conversation API error envelope without leaking provider internals.
**Inputs:** ADR-0007 Decision D11; Product Scope deliverable §3.3.
**Outputs:** Stable product-owned error mapping; client-visible outputs free of prohibited provider internals.
**Parent Deliverable:** Product Scope §3.3 Contract-conformant conversation outcome
**ADR Reference:** ADR-0007 Decision D11
**Acceptance Criteria:**
1. Provider failure, timeout, rate limiting, malformed output, and unavailable-service conditions are translated into the standard Conversation API error envelope.
2. Clients do not receive provider names, provider model identifiers, raw SDK exceptions, raw provider messages, stack traces, secret values, internal prompt content, or provider request or response bodies.
3. Retry behaviour, if present, remains bounded by the contractual timeout and does not extend execution beyond the hard ceiling.
**Review Gate:** Containment review against Decision D11.
**Commit Boundary:** `DEVELOPMENT.md` §8 only.
**Dependencies:** P1-T04.
**Non-Decisions:** This task does not establish client-visible idempotency or an unrestricted retry contract.
**Deferred Obligations:** Broader resilience product features remain outside P1.
**Risks:** Leakage of prompt or provider bodies through error paths.

---

## Task P1-T09 — System Prompt v1

**Task ID:** P1-T09
**Purpose:** Establish System Prompt v1 as an independent governed artifact implementing Prompt Governance Specification v1 Governance Core obligations required by ADR-0007 Decision D13, without writing final Brand Voice Layer marketing language.
**Inputs:** ADR-0007 Decision D13; Prompt Governance Specification v1 Governance Core; Constraint 4a; locked METIORO brand constraints for mystical-language prohibition; Product Scope deliverable §3.7.
**Outputs:** System Prompt v1 governed artifact; recorded Diff; recorded Review; recorded Approval; controlled Commit.
**Parent Deliverable:** Product Scope §3.7 Governed prompt-behaviour outcome
**ADR Reference:** ADR-0007 Decision D13
**Acceptance Criteria:**
1. System Prompt v1 exists as a governed artifact, not as ordinary local copy.
2. Every modification includes Diff, Review, Approval, and Commit.
3. Governance Core obligations are represented: Constraint 4a implementation requirements; decision/conversational classification instructions; explainability; uncertainty disclosure; prohibited deterministic claims; prohibition of guaranteed future outcomes; safety boundaries; response structure; prompt assembly rules; approved context injection rules; unsupported-request handling; provider-output validation requirements; mystical-language prohibition.
4. Brand Voice Layer remains Status PENDING; no final marketing language is introduced.
5. Provisional neutral-professional tone, if used, is identified as provisional and does not override Governance Core.
6. Prompt assembly and context injection instructions reference ADR-0007 derived-context decision and do not authorise raw birth data injection unless explicitly allowed by ADR.
**Review Gate:** Prompt-governance review plus Constraint 4a prompt audit against Decision D13 and Prompt Governance Specification v1.
**Commit Boundary:** `DEVELOPMENT.md` §8 only, and additionally the governed-artifact rule Diff → Review → Approval → Commit required by ADR-0007 Decision D13 and Prompt Governance Specification v1.
**Dependencies:** ADR-0007 LOCKED; P1.4 APPROVED; Prompt Governance Specification v1 Governance Core available for binding.
**Non-Decisions:** This task does not complete Brand Voice Layer, does not select providers, and does not change classification architecture.
**Deferred Obligations:** Brand Voice Layer completion remains blocked on brand reconciliation and requires registered amendment when closed.
**Risks:** Treating System Prompt edits as ordinary implementation details would violate Decision D13.

---

## Task P1-T10 — Prompt Assembly, Context Injection, and Output Validation Binding

**Task ID:** P1-T10
**Purpose:** Bind runtime prompt assembly, approved context injection, and provider-output validation to ADR-0007 Decision D8 and Decision D13 Governance Core rules, using System Prompt v1 as the governed instruction artifact.
**Inputs:** ADR-0007 Decisions D8 and D13; System Prompt v1 from P1-T09; Product Scope deliverables §3.4 and §3.7.
**Outputs:** Assembly and injection behaviour limited to validated conversation history, locale, and approved derived astrological context; output validation enforcing discriminator, explainability, sources, containment, and prohibited-claim rules.
**Parent Deliverable:** Product Scope §3.7 Governed prompt-behaviour outcome; supports §3.4
**ADR Reference:** ADR-0007 Decisions D8 and D13
**Acceptance Criteria:**
1. Assembly inputs are limited to authorised P1 context classes.
2. Raw birth data is not injected into provider-bound context when derived context can satisfy the approved capability.
3. Excluded context classes from Decision D8 are not injected.
4. Output validation rejects decision-bearing responses lacking required explainability fields and rejects fabricated sources.
5. Internal prompt content is not returned to clients.
**Review Gate:** Joint architecture-conformance and prompt-governance review.
**Commit Boundary:** `DEVELOPMENT.md` §8 only.
**Dependencies:** P1-T05; P1-T06; P1-T07; P1-T09.
**Non-Decisions:** This task does not redesign prompts beyond applying the approved System Prompt v1 artifact and Governance Core rules.
**Deferred Obligations:** Voice Layer finalisation remains deferred.
**Risks:** Local prompt shortcuts bypassing System Prompt governance.

---

## Task P1-T11 — Operational Timeout Ceiling

**Task ID:** P1-T11
**Purpose:** Enforce the end-to-end server timeout hard ceiling as a contractual protection limit, not as a latency target or service-level claim.
**Inputs:** ADR-0007 Decision D12; Product Scope deliverable §3.8.
**Outputs:** Hard termination behaviour at or below 30 seconds end-to-end server timeout; no presentation of the ceiling as an SLA claim.
**Parent Deliverable:** Product Scope §3.8 Bounded operational outcome
**ADR Reference:** ADR-0007 Decision D12
**Acceptance Criteria:**
1. End-to-end server timeout does not exceed 30 seconds.
2. Operational profile, if stricter, remains within hard ceilings.
3. The 30-second timeout is not presented as a latency target or service-level claim.
4. Increasing a hard ceiling is absent from this task and would **Require ADR Amendment**.
**Review Gate:** Operational-conformance review against Decision D12.
**Commit Boundary:** `DEVELOPMENT.md` §8 only.
**Dependencies:** P1-T04; P1-T08.
**Non-Decisions:** This task does not establish production-optimisation programmes or performance SLAs.
**Deferred Obligations:** Measured P95/P99 evaluation may inform later stricter operational settings and is not a P1 product redesign.
**Risks:** Silent relaxation of ceilings or marketing the timeout as an SLA.

---

## Task P1-T12 — Live Conversation MVP User Path

**Task ID:** P1-T12
**Purpose:** Deliver the authorised user-facing Live Conversation MVP path sufficient for bounded multi-turn live exchange under the locked contract, without UI redesign programme scope.
**Inputs:** ADR-0007 Decision D1; Product Scope deliverable §3.1; completed contract and generation tasks P1-T01 through P1-T11 as required for a usable path.
**Outputs:** An authorised user-facing conversation path through which a user can complete at least one multi-turn exchange of two or more user turns and receive live generated assistant responses under the Conversation API contract.
**Parent Deliverable:** Product Scope §3.1 Live Conversation MVP outcome
**ADR Reference:** ADR-0007 Decision D1
**Acceptance Criteria:**
1. Product Scope AC-01 is satisfied.
2. The path uses the locked Conversation API behaviour and does not introduce excluded capabilities from Product Scope §4.
3. No UI redesign programme, provider-selection UI, memory, retrieval, or agent framework is included.
**Review Gate:** Product-scope conformance review against §3.1 and Non-Deliverables §4.
**Commit Boundary:** `DEVELOPMENT.md` §8 only.
**Dependencies:** P1-T01 through P1-T11 for the behaviours exercised by the path.
**Non-Decisions:** This task does not redesign the visual system or brand experience.
**Deferred Obligations:** Final Brand Voice Layer copy remains PENDING. Production release of third-party personalisation remains subject to Legal Brief / Production Release Gate.
**Risks:** Expanding client work into redesign or roadmap features outside Product Scope.

---

## Task P1-T13 — Ask Decision Intelligence V3 Product Surface

**Task ID:** P1-T13
**Title:** Ask Decision Intelligence V3 Product Surface
**Programme / Sprint:** P1 — Live Conversation MVP
**Status:** REGISTERED — IMPLEMENTATION VERIFIED — BLOCKED ON UNAUTHORISED DEPENDENCIES
**Owner:** Frontend / Product Surface (Product Owner ratification pending)
**Purpose:** Authorise the frontend product flow that transforms the existing Conversation API response into a validated, actionable decision-intelligence result (`AskDecisionResult` schema 3.0.0) for the Ask → Result path, without changing the public Conversation API contract.
**Inputs:** ADR-0007 (LOCKED) and Amendment A1; Product Scope §3.1; existing Conversation client behaviour; prior reconciliation evidence in `docs/governance/ASK-DECISION-INTELLIGENCE-V3-RECONCILIATION.md`.
**Outputs:** Governed frontend Ask Decision Intelligence V3 surface using internal domain schema 3.0.0; contract-preserving Conversation API consumption; structured fallback; privacy-safe analytics; optional local Ask save adapter; regression tests; reconciliation record.
**Parent Deliverable:** Product Scope §3.1 Live Conversation MVP outcome (client presentation of live conversation results; not a UI redesign programme)
**ADR Reference:** ADR-0007 Decisions D1, D2, D3, D7, D8 (client derived-context privacy posture), D9/D11 (consume/contain public response and errors); Amendment A1 public route binding
**Governing ADRs:** ADR-0007 — Conversation API Contract v1.0 (LOCKED); ADR-0007 Amendment A1 — Public HTTP Route Clarification
**Implementation paths (in scope for this task’s eventual commit boundary):**
- `apps/web/lib/ask-decision/`
- `apps/web/components/ask/`
- `apps/web/components/ftue/AskScreen.tsx`
- `apps/web/components/ftue/ResultScreen.tsx`
- `apps/web/components/ftue/ResultScreen.test.tsx`
- `docs/governance/ASK-DECISION-INTELLIGENCE-V3-RECONCILIATION.md`

**Scope includes:**
- FTUE Ask input integration
- Result screen integration
- Deterministic intent detection
- Decision framing
- One optional clarification
- Personal intelligence context selection (consumer only)
- Existing Conversation API invocation (`POST /api/v1/conversation/execute`)
- Timing-context integration (consumer only)
- Internal `AskDecisionResult` 3.0.0
- Parse and repair
- Result validation
- Structured fallback
- `AskDecisionView` rendering
- Privacy-safe analytics
- Optional local Ask save adapter (`localStorage` only)
- Regression / contract tests
- Governance reconciliation document

**Public-contract boundary:**
- No new endpoint.
- No change to `POST /api/v1/conversation/execute`.
- No change to ADR-0007 request or response envelope.
- `AskDecisionResult` is not an OpenAPI response and MUST NOT be published as the public HTTP success schema.
- `AskDecisionResult` is an internal frontend domain/presentation contract owned by `apps/web/lib/ask-decision/types.ts`.
- Public HTTP compatibility remains governed by ADR-0007 and accepted amendments only.

**Explicit exclusions:**
- Backend Vault integration
- New persistence API
- Conversation memory / server-side history
- New public Ask endpoint
- Provider-side JSON schema enforcement
- Full multilingual classifier
- Production deployment
- Analytics vendor changes
- Redesign of Intelligence Core
- Redesign of Pathfinder product workflow
- Unrelated UI work (calendar, home, people, profile, world, vault page, brand assets)
- Absorbing unauthorised Intelligence Core or Pathfinder packages under this task ID without separate dependency authority

**Dependencies:**
1. ADR-0007 LOCKED; P1.4 APPROVED (document-level Implementation Start).
2. P1-T01 / P1-T02 behaviours as consumed public contract (does not complete those tasks).
3. **P1-T14** — Personal Intelligence Core and Ask-safe Context (must be verified and present in HEAD).
4. **P1-T15** — Shared Conversation Client and Timing Adapter (must be verified and present in HEAD).
5. HEAD packages already present and not part of the dirty dependency problem: `apps/web/lib/birth-profile`, `apps/web/lib/calendar-scores`, `apps/web/lib/calendar-utils`, `apps/web/lib/ask-question-repository`.

**Dependency authority resolution:**
Canonical dependency tasks **P1-T14** and **P1-T15** are **RATIFIED** (owner ratification 2026-07-21) under ADR-0009 (Accepted). P1-T13 remains **BLOCKED** until: (1) P1-T14 and P1-T15 receive **APPROVED TO COMMIT** and are committed into HEAD; (2) P1-T13 is re-tested against that clean dependency base; (3) P1-T13 receives its own **APPROVED TO COMMIT**. P1-T13 MUST NOT absorb Intelligence UI, Pathfinder workflow, or multi-product profile adapters.

**Acceptance Criteria:**
1. Existing Conversation API contract remains unchanged (`POST /api/v1/conversation/execute` request/response envelopes preserved).
2. Ask V3 builds without TypeScript failure (via `apps/web` production build).
3. Scoped Ask ESLint returns 0 errors and 0 warnings.
4. Focused Ask tests pass.
5. Full web test suite passes.
6. `AskDecisionResult` validates before rendering.
7. Provider/network/parse failure produces structured fallback.
8. Raw birth date, time, and location are not sent in the Ask intelligence context.
9. Analytics reject question, prompt, profile, payload, and nested property bags.
10. `request_id` is retained only in internal metadata.
11. Local Ask save is documented as `localStorage`, not backend Vault.
12. No unrelated files are included in the proposed task commit.
13. Dependency authority is resolved: P1-T14 and P1-T15 are verified, committed to HEAD, and P1-T13 is re-tested from that clean dependency base.

**Evidence (technical verification recorded; not production acceptance):**
- Scoped ESLint: 0 errors, 0 warnings
- Focused Ask tests: 52/52 across 4 files
- Full web suite: 447/447 across 51 files
- `npm run build`: passed
- Branch: `governance-foundation`
- Base HEAD: `32e34a825f222d5cdb2fd06b18227923ff82e3bc`
- Reconciliation: `docs/governance/ASK-DECISION-INTELLIGENCE-V3-RECONCILIATION.md`

**Review Gate:** Product-scope conformance against §3.1 and Non-Deliverables §4; public-contract review against ADR-0007 / Amendment A1; dependency-authority review before **APPROVED TO COMMIT**.
**Commit Boundary:** `DEVELOPMENT.md` §8 only. No commit without explicit **APPROVED TO COMMIT** on the full staging boundary for this task.
**Non-Decisions:** This task does not amend ADR-0007, does not authorise OpenAPI publication of `AskDecisionResult`, does not complete P1-T10 server prompt-binding work, and does not redefine P1-T12 as a structured DI card programme. Informal label “TASK-10” has no canonical standing.
**Deferred Obligations:** Production acceptance; backend Vault; provider-side JSON schema; multilingual classifier; dependency-package redesign.
**Risks:** Committing Ask with unauthorised Intelligence/Pathfinder trees; mistaking P1-T10 or informal “TASK-10” for this task; presenting local Ask saves as canonical Vault.

---


## Task P1-T14 — Personal Intelligence Core and Ask-safe Context

**Task ID:** P1-T14
**Title:** Personal Intelligence Core and Ask-safe Context
**Programme / Sprint:** P1 — Live Conversation MVP
**Status:** RATIFIED — APPROVED FOR SCOPED COMMIT REVIEW
**Owner:** Frontend / Intelligence Platform (Product Owner ratified 2026-07-21)
**Governing architecture:** ADR-0009 (Accepted) — Decision D1
**Purpose:** Authorise the minimum coherent Personal Intelligence Core required by Ask Decision Intelligence V3: profile types, construction, storage, Ask-safe serialization, Ask-used selectors, and the thin Ask profile-context adapter — without authorising Intelligence UI or unrelated product integrations.
**Inputs:** Product Scope §3.1 / §3.4 (derived personalisation posture); ADR-0007 Decision D8 privacy posture for derived context; P1-T13 consumer requirements.
**Outputs:** Committable Intelligence Core library boundary usable by Ask; Ask-safe serialization excluding raw birth fields; `getAskProfileContext` authorised as Ask adapter surface; scoped tests for authorised files.
**Parent Deliverable:** Product Scope §3.4 Derived-context personalisation outcome (client-side derived intelligence for conversation personalisation); supports §3.1 via P1-T13
**ADR Reference:** ADR-0007 Decision D8 (no raw birth disclosure in provider-bound context)
**Governing ADRs:** ADR-0007 (LOCKED) for privacy posture only; ADR-0009 (Accepted) D1; this task does not amend ADR-0007

**Owner ratification (2026-07-21):** Exact import-complete file manifest below is approved. This task is **not** COMPLETED, COMMITTED, or PRODUCTION VERIFIED. Source commit still requires **APPROVED TO COMMIT** after final staged-diff review.

**File-level implementation boundary (authorised — exact 30-file manifest):**
- `apps/web/lib/intelligence/ask-serialize.ts`
- `apps/web/lib/intelligence/blind-spots.ts`
- `apps/web/lib/intelligence/communication-style.ts`
- `apps/web/lib/intelligence/decision-environment.ts`
- `apps/web/lib/intelligence/decision-style.ts`
- `apps/web/lib/intelligence/energy-rhythm.ts`
- `apps/web/lib/intelligence/growth-areas.ts`
- `apps/web/lib/intelligence/import-boundary.test.ts`
- `apps/web/lib/intelligence/index.ts`
- `apps/web/lib/intelligence/intelligence.test.ts`
- `apps/web/lib/intelligence/leadership-style.ts`
- `apps/web/lib/intelligence/learning-style.ts`
- `apps/web/lib/intelligence/legacy-bridge.ts`
- `apps/web/lib/intelligence/opportunity-zones.ts`
- `apps/web/lib/intelligence/pressure-response.ts`
- `apps/web/lib/intelligence/profile-builder.ts`
- `apps/web/lib/intelligence/profile-storage.ts`
- `apps/web/lib/intelligence/selectors.ts`
- `apps/web/lib/intelligence/source-profile.ts`
- `apps/web/lib/intelligence/strengths.ts`
- `apps/web/lib/intelligence/summary.ts`
- `apps/web/lib/intelligence/types.ts`
- `apps/web/lib/intelligence/util.ts`
- `apps/web/lib/intelligence/validation.ts`
- `apps/web/lib/intelligence/work-style.ts`
- `apps/web/lib/intelligence-profile/accessors.ts`
- `apps/web/lib/intelligence-profile/consumers.ts`
- `apps/web/lib/intelligence-profile/generate.ts`
- `apps/web/lib/intelligence-profile/index.ts`
- `apps/web/lib/intelligence-profile/types.ts`

**`consumers.ts` authority clarification:** Staging `apps/web/lib/intelligence-profile/consumers.ts` under P1-T14 authorises only the existing file as an implementation unit required to expose `getAskProfileContext`. It does **not** independently authorise feature development or future commits for calendar, home, people, profile, vault, world, or unrelated product consumers. No unrelated product functionality may be added under P1-T14.

**Explicit exclusions:**
- `apps/web/components/intelligence/**` and any Intelligence UI
- `apps/web/lib/intelligence/profile-context.ts` (React hook; not on Ask runtime barrel path)
- `apps/web/lib/intelligence-profile/intelligence-profile.test.ts` (not required by the ratified T14 closure)
- Unrelated product pages (calendar, home, people, profile, vault, world)
- Pathfinder workflow modules
- Absorbing this package into P1-T13

**Decision-history input model (ADR-0009 D1):**
- Neutral type: `DecisionHistorySummary = { count: number }`
- Supplied optionally to `normalizeSourceProfile` / `buildPersonalIntelligenceProfile` / `ensurePersonalIntelligenceProfile`
- Omitted ⇒ count `0`; Core never reads Pathfinder storage
- Product adapters MAY map Pathfinder saves via `pathfinder-decision/decision-history-bridge.ts` (outside Core; not part of P1-T14 staging)

**Dependencies:** ADR-0007 LOCKED; ADR-0009 Accepted (D1); HEAD `birth-profile`. No Pathfinder package dependency for Core modules.
**Relation to P1-T13:** Hard dependency. Commit order: P1-T14 before P1-T15 before P1-T13.
**Acceptance Criteria:**
1. Authorised files build under `apps/web` TypeScript/production build path.
2. Scoped ESLint on authorised Intelligence Core files returns 0 errors and 0 warnings.
3. `intelligence.test.ts` and `import-boundary.test.ts` pass for authorised core behaviours.
4. Ask-safe serialization excludes raw birth date, time, and location labels from serialized Ask intelligence payloads.
5. `getAskProfileContext` remains available to AskScreen without treating unrelated product adapters as in-scope authority.
6. Import-boundary check: no authorised T14 commit staging includes Intelligence UI or `profile-context.ts`.
7. Clean-tree import check: authorised modules resolve without requiring Pathfinder `adaptive-questions` / `analysis` / `storage` / UI.
8. Evidence recorded; task is not marked complete from inherited Ask suite alone.

**Evidence requirements:** Scoped lint; focused `intelligence.test.ts` + `import-boundary.test.ts`; import-boundary inventory; git status limited to T14 staging boundary. Inherited Ask suite results are supporting context only.
**Allowed staging boundary (future; do not execute here):**
```
git add \
  apps/web/lib/intelligence/ask-serialize.ts \
  apps/web/lib/intelligence/blind-spots.ts \
  apps/web/lib/intelligence/communication-style.ts \
  apps/web/lib/intelligence/decision-environment.ts \
  apps/web/lib/intelligence/decision-style.ts \
  apps/web/lib/intelligence/energy-rhythm.ts \
  apps/web/lib/intelligence/growth-areas.ts \
  apps/web/lib/intelligence/import-boundary.test.ts \
  apps/web/lib/intelligence/index.ts \
  apps/web/lib/intelligence/intelligence.test.ts \
  apps/web/lib/intelligence/leadership-style.ts \
  apps/web/lib/intelligence/learning-style.ts \
  apps/web/lib/intelligence/legacy-bridge.ts \
  apps/web/lib/intelligence/opportunity-zones.ts \
  apps/web/lib/intelligence/pressure-response.ts \
  apps/web/lib/intelligence/profile-builder.ts \
  apps/web/lib/intelligence/profile-storage.ts \
  apps/web/lib/intelligence/selectors.ts \
  apps/web/lib/intelligence/source-profile.ts \
  apps/web/lib/intelligence/strengths.ts \
  apps/web/lib/intelligence/summary.ts \
  apps/web/lib/intelligence/types.ts \
  apps/web/lib/intelligence/util.ts \
  apps/web/lib/intelligence/validation.ts \
  apps/web/lib/intelligence/work-style.ts \
  apps/web/lib/intelligence-profile/accessors.ts \
  apps/web/lib/intelligence-profile/consumers.ts \
  apps/web/lib/intelligence-profile/generate.ts \
  apps/web/lib/intelligence-profile/index.ts \
  apps/web/lib/intelligence-profile/types.ts
```
**Commit order:** After governance/ADR ratification commit; **before P1-T15**; before P1-T13. Each source commit requires **APPROVED TO COMMIT** after final staged-diff review.
**Review Gate:** Dependency-boundary review; D8 privacy review for Ask-safe serialize; no UI redesign; staged-diff equals the 30-file manifest.
**Commit Boundary:** `DEVELOPMENT.md` §8 only.
**Non-Decisions:** Does not redesign Intelligence product UX; does not authorise multi-product profile page integrations; does not amend ADR-0007; does not mark this task COMPLETED/COMMITTED/PRODUCTION VERIFIED at ratification.
**Deferred Obligations:** Extract `getAskProfileContext` to a narrow module; multilingual/profile UX programmes.
**Risks:** Staging `consumers.ts` silently treated as authority for calendar/people/vault/world adapters.

---

## Task P1-T15 — Shared Conversation Client and Timing Adapter

**Task ID:** P1-T15
**Title:** Shared Conversation Client and Timing Adapter
**Programme / Sprint:** P1 — Live Conversation MVP
**Status:** RATIFIED — APPROVED FOR SCOPED COMMIT REVIEW
**Owner:** Frontend / Conversation Platform (Product Owner ratified 2026-07-21)
**Governing architecture:** ADR-0009 (Accepted) — Decisions D2, D3
**Purpose:** Authorise the minimum shared client infrastructure for ADR-0007 `POST /api/v1/conversation/execute` and the reusable timing adapter used by Ask (and optionally Pathfinder), without authorising Pathfinder workflow, analysis, storage, adaptive questions, or Pathfinder UI.
**Inputs:** ADR-0007 and Amendment A1; P1-T01 contract surface as consumed client; P1-T13 runtime needs (`postConversationExecute`, `loadPathfinderTiming`).
**Outputs:** Authorised shared conversation client module; authorised timing adapter modules; contract-compatible request/response handling; scoped tests for authorised files.
**Parent Deliverable:** Product Scope §3.1 / §3.3 (live conversation path + contract-conformant client consumption)
**ADR Reference:** ADR-0007 Decisions D1, D2, D3, D7, D9, D11; Amendment A1
**Governing ADRs:** ADR-0007 (LOCKED); ADR-0007 Amendment A1; ADR-0009 (Accepted) D2/D3

**Owner ratification (2026-07-21):** Exact import-complete file manifest below is approved. This task is **not** COMPLETED, COMMITTED, or PRODUCTION VERIFIED. Source commit still requires **APPROVED TO COMMIT** after final staged-diff review. Depends on P1-T14 in HEAD for TypeScript resolution of `scores.ts` type imports.

**Canonical client ownership (ADR-0009 D2):**
- Neutral module: `apps/web/lib/conversation-client/` (`types.ts`, `execute.ts`, `index.ts`, `conversation-client.test.ts`)
- Pathfinder compatibility re-export + Pathfinder-only `buildSynthesisMessages`: `apps/web/lib/pathfinder-decision/conversation-client.ts`
- Ask MUST import from `@/lib/conversation-client` (not the Pathfinder barrel)

**Timing adapter boundary (ADR-0009 D3):**
- `apps/web/lib/pathfinder-decision/timing.ts`
- `apps/web/lib/pathfinder-decision/scores.ts` (`TimingSignals` + helpers required by timing)
- `apps/web/lib/pathfinder-decision/types.ts` (types required by timing)
- Ask MUST import timing via `@/lib/pathfinder-decision/timing` directly
- Optional product bridge (not Ask runtime; **not** in T15 staging): `apps/web/lib/pathfinder-decision/decision-history-bridge.ts`

**File-level implementation boundary (authorised — exact 9-file manifest):**
- `apps/web/lib/conversation-client/conversation-client.test.ts`
- `apps/web/lib/conversation-client/execute.ts`
- `apps/web/lib/conversation-client/index.ts`
- `apps/web/lib/conversation-client/types.ts`
- `apps/web/lib/pathfinder-decision/conversation-client.ts`
- `apps/web/lib/pathfinder-decision/scores.test.ts`
- `apps/web/lib/pathfinder-decision/scores.ts`
- `apps/web/lib/pathfinder-decision/timing.ts`
- `apps/web/lib/pathfinder-decision/types.ts`

**Explicit exclusions:**
- `apps/web/lib/pathfinder-decision/adaptive-questions.ts`
- `apps/web/lib/pathfinder-decision/analysis.ts`
- `apps/web/lib/pathfinder-decision/storage.ts` (Pathfinder workflow persistence; not required by shared client)
- `apps/web/lib/pathfinder-decision/decision-history-bridge.ts` (Pathfinder product bridge; not Ask runtime)
- `apps/web/lib/pathfinder-decision/index.ts` as a staging vehicle for Pathfinder workflow
- `apps/web/components/pathfinder/**`
- Pathfinder page/workflow redesign
- New public HTTP endpoints
- Changes to ADR-0007 envelopes
- Absorbing these modules into P1-T13 as Pathfinder product scope
- Duplicate Ask-only Conversation clients

**Dependencies:** ADR-0007 LOCKED; ADR-0009 Accepted (D2/D3); HEAD `calendar-scores`, `calendar-utils`, `birth-profile`; **P1-T14 committed** (type imports from Intelligence).
**Relation to P1-T13:** Hard dependency. Commit order: P1-T14 before P1-T15 before P1-T13.
**Acceptance Criteria:**
1. `postConversationExecute` calls only `POST /api/v1/conversation/execute` with `{ messages, locale }` (+ optional `conversation_id`).
2. Client success typing accepts ADR-0007 fields: `type`, `message`, `sources`, `request_id`, `reasoning`, `uncertainty`.
3. No new endpoint and no public envelope change.
4. `loadPathfinderTiming` resolves using authorised timing modules without requiring `adaptive-questions`, `analysis`, or `storage` at runtime when imported directly.
5. Scoped ESLint on authorised T15 files returns 0 errors and 0 warnings.
6. Focused `conversation-client.test.ts` and `scores.test.ts` pass.
7. Import-boundary check: staging set excludes adaptive-questions, analysis, storage, decision-history-bridge, Pathfinder UI, and must not use the Pathfinder barrel as justification to include them.
8. Evidence recorded; not marked complete from inherited Ask suite alone.

**Evidence requirements:** Scoped lint; focused pathfinder-decision / conversation-client tests limited to authorised files; contract smoke via existing Ask conversation-contract tests as inherited support only; git status limited to T15 boundary.
**Allowed staging boundary (future; do not execute here):**
```
git add \
  apps/web/lib/conversation-client/conversation-client.test.ts \
  apps/web/lib/conversation-client/execute.ts \
  apps/web/lib/conversation-client/index.ts \
  apps/web/lib/conversation-client/types.ts \
  apps/web/lib/pathfinder-decision/conversation-client.ts \
  apps/web/lib/pathfinder-decision/scores.test.ts \
  apps/web/lib/pathfinder-decision/scores.ts \
  apps/web/lib/pathfinder-decision/timing.ts \
  apps/web/lib/pathfinder-decision/types.ts
```
**Commit order:** After governance/ADR ratification commit and **after P1-T14**; before P1-T13. Each source commit requires **APPROVED TO COMMIT** after final staged-diff review.
**Review Gate:** ADR-0007 client conformance; scope review against Pathfinder workflow exclusions; staged-diff equals the 9-file manifest.
**Commit Boundary:** `DEVELOPMENT.md` §8 only.
**Non-Decisions:** Does not complete Pathfinder product workflow; does not relocate Pathfinder compatibility re-export in this task unless a later ratified migration amends the boundary; does not amend ADR-0007; does not mark this task COMPLETED/COMMITTED/PRODUCTION VERIFIED at ratification.
**Deferred Obligations:** Further Pathfinder caller migration toward `@/lib/conversation-client`; split `TimingSignals` from Pathfinder score derivation if co-location remains confusing.
**Risks:** Treating T15 as full Pathfinder authorisation; committing `index.ts` workflow barrel under T15; Pathfinder UI sneaking into staging.

---

## Task Traceability Matrix

| Task ID | Parent Deliverable | ADR Decision | Prompt Rule | Acceptance Criteria | Commit |
|---------|--------------------|--------------|-------------|---------------------|--------|
| P1-T01 | §3.3 Contract-conformant conversation outcome | D3, D4, D5, D6, D7, D11 | N/A — contract surface | Role/schema/locale/error-envelope conformance; optional `conversation_id` non-dependency | `DEVELOPMENT.md` §8 |
| P1-T02 | §3.2 Stateless conversation outcome | D2 | Continuity/memory claim prohibition | No server persistence; no implied continuity representation | `DEVELOPMENT.md` §8 |
| P1-T03 | §3.3; §3.8 | D5, D12 | No silent history mutation in assembly | 20-message and 32 KiB rejection; no silent truncation/reorder/summary/discard | `DEVELOPMENT.md` §8 |
| P1-T04 | §3.1 Live Conversation MVP outcome | D1 | N/A — generation boundary | Live engine behind provider-agnostic interface; no public provider specifics | `DEVELOPMENT.md` §8 |
| P1-T05 | §3.4 Derived-context personalisation outcome | D8; §3 Option B | Derived-context injection only; no raw birth injection | Derived context assembled; excluded contexts absent | `DEVELOPMENT.md` §8 |
| P1-T06 | §3.5 Explainability-compliant decision outcome | D9 | Constraint 4a classification, reasoning, uncertainty | Discriminator present; decision fields non-null; no conversational bypass | `DEVELOPMENT.md` §8 |
| P1-T07 | §3.6 Evidence-governed sources outcome | D10 | Non-fabrication of sources | `sources` always present; `[]` pre-E2; no fabricated sources | `DEVELOPMENT.md` §8 |
| P1-T08 | §3.3 Contract-conformant conversation outcome | D11 | No internal prompt leakage | Standard error envelope; no provider/prompt/secret leakage; bounded retry | `DEVELOPMENT.md` §8 |
| P1-T09 | §3.7 Governed prompt-behaviour outcome | D13 | Full Governance Core; Voice Layer PENDING | Governed artifact with Diff, Review, Approval, Commit; no final marketing language | `DEVELOPMENT.md` §8 + Diff/Review/Approval/Commit |
| P1-T10 | §3.7; supports §3.4 | D8, D13 | Assembly, injection, output validation | Authorised context only; validation enforces D9/D10/D11/D13 rules | `DEVELOPMENT.md` §8 |
| P1-T11 | §3.8 Bounded operational outcome | D12 | N/A — operational ceiling | ≤30s hard ceiling; not presented as SLA | `DEVELOPMENT.md` §8 |
| P1-T12 | §3.1 Live Conversation MVP outcome | D1 | Provisional tone only if needed; no Voice Layer finalisation | AC-01 multi-turn live path; no Non-Deliverables included | `DEVELOPMENT.md` §8 |
| P1-T13 | §3.1 Live Conversation MVP outcome | D1, D2, D3, D7, D8, D9, D11; A1 | Client presentation; no OpenAPI AskDecisionResult | Ask DI V3 surface; still blocked until T14/T15 in HEAD | `DEVELOPMENT.md` §8 |
| P1-T14 | §3.4; supports §3.1 via P1-T13 | ADR-0009 D1; D8 privacy | Ask-safe serialize; no raw birth | RATIFIED — APPROVED FOR SCOPED COMMIT REVIEW | `DEVELOPMENT.md` §8 |
| P1-T15 | §3.1 / §3.3 client consumption | ADR-0009 D2/D3; D1,D2,D3,D7,D9,D11; A1 | Shared client; no new endpoint | RATIFIED — APPROVED FOR SCOPED COMMIT REVIEW | `DEVELOPMENT.md` §8 |

---

## Production Release Gate Relationship

Implementation Start is defined in this document and does not include Legal Brief completion.

Production Release Gate remains independent. A production deployment that transmits user birth data, whether raw or derived, to a third-party processor SHALL NOT proceed until:

1. Legal Brief completion requirements under ADR-0007 §3 are satisfied.
2. Required privacy disclosures are approved.
3. Applicable data-processing requirements, including DPA assessment, are resolved.

No task in this decomposition MAY treat Legal Brief completion as an Implementation Start blocker.

---

## References

1. ADR-0007 — Conversation API Contract v1.0 (LOCKED)
2. docs/governance/SPRINT-P1-PRODUCT-SCOPE.md
3. docs/governance/DEVELOPMENT.md §8 — Standard Development Workflow
4. docs/governance/PROMPT_GOVERNANCE_SPECIFICATION_V1.md — Governance Core binding for P1-T09 and P1-T10
5. Constraint 4a, as referenced by ADR-0007
6. EVIDENCE_REGISTRY, as referenced by ADR-0007 Decision D10
7. ADR-0006 — locale and error-envelope conventions as adopted by ADR-0007
8. docs/legal/SPRINT_P1_LEGAL_BRIEF.md — Production Release Gate dependency only

---

## Approval

| Role | Name | Decision | Date | Signature / record |
|------|------|----------|------|--------------------|
| Documentation Engineer | | DRAFTED prepared | 13 July 2026 | |
| Product Owner | | Partial — ADR-0009 Accepted; P1-T14/P1-T15 ratified for scoped commit review (2026-07-21); document-level P1.4 APPROVED still pending | 21 July 2026 | |
| Governance Reviewer | | Pending | | |
| Constraint 4a Reviewer | | Pending — for P1-T06 / P1-T09 | | |
| Scope Authority | | Pending — P1.4 APPROVED | | |

This document MAY move to `IN REVIEW` when submitted for approval. Implementation Start requires ADR-0007 LOCKED and P1.4 APPROVED. Legal Brief completion is not required for that approval.

---

## Open Questions

1. Which named reviewers will grant P1.4 APPROVED and task-level **APPROVED TO COMMIT** decisions?
2. What repository location will hold the canonical System Prompt v1 governed artifact for Diff / Review / Approval / Commit evidence?
3. Confirm Product Scope remains the parent scope authority and that no deliverable outside §3.1–§3.8 is later inserted into this decomposition without Product Scope revision.
4. Confirm that any operational provider choice for initial launch remains an operational fact under Decision D1 and is not added as a public product task.
5. Confirm Production Release Gate ownership for Legal Brief completion remains outside this Task Decomposition’s Implementation Start definition.
6. **Resolved (2026-07-21):** P1-T14 and P1-T15 ratified under ADR-0009 (Accepted). Canonical client lives at `apps/web/lib/conversation-client/`; Pathfinder may keep a compatibility re-export. Later full relocation of Pathfinder callers remains optional deferred work.
7. **Resolved (2026-07-21):** ADR-0009 D1 — optional injected `DecisionHistorySummary`; Core MUST NOT import Pathfinder storage. Product bridge may live outside Core.
8. **Resolved (2026-07-21):** Staging `consumers.ts` under P1-T14 authorises only the existing file unit needed for `getAskProfileContext`; it does not authorise calendar/home/people/profile/vault/world feature commits.

---

## Review Checklist

- [ ] Status is DRAFTED and architecture remains frozen under ADR-0007
- [ ] Every Task traces to one Product Scope Deliverable or one ADR-0007 Decision
- [ ] Every Task contains Task ID, Purpose, Inputs, Outputs, Parent Deliverable, ADR Reference, Acceptance Criteria, Review Gate, Commit Boundary, Dependencies, Non-Decisions, Deferred Obligations, and Risks
- [ ] Commit Boundary references `DEVELOPMENT.md` §8 only and does not redefine commit policy
- [ ] System Prompt v1 is an independent governed task requiring Diff, Review, Approval, and Commit
- [ ] Task Traceability Matrix is present with required columns
- [ ] Implementation Start is defined as ADR-0007 LOCKED AND P1.4 APPROVED
- [ ] Implementation Start does not depend on Legal Brief completion
- [ ] Legal Brief is identified as Production Release Gate only
- [ ] No API redesign, prompt redesign, Product Scope redefinition, or hidden architecture is introduced
- [ ] References, Approval, Open Questions, Review Checklist, and Change Log are present

---

## Change Log

| Version | Date | Author role | Change |
|---------|------|-------------|--------|
| 0.1.0 | 13 July 2026 | Documentation Engineer | Initial DRAFTED Sprint P1 Task Decomposition against locked ADR-0007 and Product Scope |
| 0.1.1 | 21 July 2026 | Documentation Engineer | Registered P1-T13 Ask Decision Intelligence V3 Product Surface; dependency authority Outcome C (blocked on unauthorised Intelligence / Pathfinder frontend packages); matrix and open-question updates |
| 0.1.2 | 21 July 2026 | Documentation Engineer | Registered P1-T14 Personal Intelligence Core and Ask-safe Context and P1-T15 Shared Conversation Client and Timing Adapter; updated P1-T13 dependencies; documented barrel leakage, ownership ambiguity, and required import-isolation refactors |
| 0.1.3 | 21 July 2026 | Documentation Engineer | Applied ADR-0009 boundary isolation: decision-history injection (P1-T14); neutral conversation-client + Ask direct timing imports (P1-T15); P1-T13 remains blocked |
| 0.1.4 | 21 July 2026 | Product Owner / Documentation Engineer | Owner ratification: ADR-0009 Accepted; P1-T14 and P1-T15 RATIFIED — APPROVED FOR SCOPED COMMIT REVIEW with exact file manifests; commit order Governance → T14 → T15 → T13 re-verify; P1-T13 remains blocked; consumers.ts authority clarified |

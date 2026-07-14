# Initial Generation Provider — Operational Implementation Record

**Status:** APPROVED TO COMMIT
**Date:** 2026-07-14
**Sprint:** Sprint P1
**Scope:** Pre-T04 operational documentation
**Document type:** Operational implementation record (not an ADR)
**Authority context:** ADR-0007 (LOCKED); ADR-0007 Amendment A1; SPRINT_P1_LEGAL_BRIEF.md; PROMPT_GOVERNANCE_SPECIFICATION_V1.md; SPRINT-P1-TASK-DECOMPOSITION.md

---

## 1. Purpose

This record documents the initial implementation provider for Sprint P1 live conversation generation.

**Initial implementation provider: OpenAI API — approved by Product Owner, 2026-07-14.**

- This is an operational implementation decision.
- This document does not modify ADR-0007.
- ADR-0007 Decision D1 requires a provider-agnostic architecture and treats initial launch with one provider as an operational fact, not a normative architectural requirement.
- Provider identity remains internal-only. It MUST NOT become a public product capability, client-selectable option, or public contract field.

### Provider selected vs endpoint not yet selected

**Provider selected:** OpenAI API

**Endpoint not yet selected** (open operational question):

- OpenAI direct
- Azure OpenAI
- OpenAI-compatible gateway

Endpoint selection depends on operational and legal review and does not change the provider-agnostic architecture.

---

## 2. Architectural Boundary

Provider identity SHALL NOT appear in:

- public `ConversationRequest`
- public `ConversationResponse`
- public error envelopes
- request IDs
- client-visible diagnostics
- explainability fields (`message`, `reasoning`, `uncertainty`, `sources`)

Provider-specific SDKs, model identifiers, request formats, and implementation details MUST remain behind the internal provider-agnostic generation interface (ADR-0007 Decision D1).

Client-visible outputs MUST NOT disclose provider names, model identifiers, raw SDK exceptions, raw provider messages, stack traces, secret values, internal prompt content, or provider request or response bodies (ADR-0007 Decision D11; Prompt Governance Specification v1).

Public route binding remains as authorised by ADR-0007 Amendment A1:

`POST /api/v1/conversation/execute`

No alternate public provider route is authorised by this record.

---

## 3. Technical Compatibility

Relative to Sprint P1 contract needs, the selected initial provider is recorded as supporting:

| Capability | Recorded compatibility |
|---|---|
| Stateless requests | Compatible with ADR-0007 Decision D2 client-supplied history model |
| System instructions | Compatible with governed System Prompt / prompt-assembly binding |
| Structured output validation | Compatible with mapping provider output into the public ConversationResponse contract |
| Timeout handling | Compatible with bounded server-side timeout enforcement under ADR-0007 Decision D12 |
| Provider abstraction | Compatible with concealment behind an internal provider-agnostic interface (Decision D1) |

This section records fitness for implementation planning only.

This document does not make latency guarantees.

This document does not relax ADR-0007 hard ceilings (20 messages, 32 KiB, 30-second end-to-end timeout).

Operational profile tightening within those ceilings remains separately documentable and is outside the scope of this record.

---

## 4. Legal Review

Governing reference: `docs/legal/SPRINT_P1_LEGAL_BRIEF.md`.

The following fields are direct inputs to the Sprint P1 legal review. They do not invent legal conclusions. They do not claim that a DPA is executed, that zero retention applies, or that a processing region has been selected.

| Field | Value |
|---|---|
| DPA Status | `<PENDING COUNSEL>` |
| Retention & Training Policy | `<PENDING COUNSEL>` |
| Processing Jurisdiction & Transfer Model | `<PENDING COUNSEL>` |

### 4.1 DPA

**Known facts**

- ADR-0007 and the Legal Brief require DPA status evaluation for each generation provider used in production.
- At Legal Brief DRAFTED status, no production DPA package for the P1 generation path is recorded as complete in repository governance.
- **DPA Status:** `<PENDING COUNSEL>`

**Pending verification**

- Whether OpenAI is correctly characterised as processor, sub-processor, or independent controller for the intended P1 use under applicable law.
- Whether OpenAI data-processing terms permit P1 processing of conversation content and approved derived astrological features.
- Whether a signed / accepted DPA (or equivalent) covering the intended P1 path is in place.
- Whether sub-processor disclosures and audit / assistance clauses are adequate for METIORO’s intended posture.

### 4.2 Retention & Training Policy

**Known facts**

- ADR-0007 Decision D2 requires stateless conversation processing: METIORO MUST NOT persist conversation history, conversation state, or conversational memory for P1.
- Architectural absence of METIORO-side conversational persistence does not eliminate provider-side retention, operational logging, account/profile retention, or other non-conversation stores.
- The Legal Brief requires determination of provider retention and whether provider terms prohibit, permit, or are silent on use of customer content for model training or product improvement.
- **Retention & Training Policy:** `<PENDING COUNSEL>`

**Pending verification**

- OpenAI logging, retention, abuse-monitoring, and support-access practices applicable to the selected product tier and endpoint once chosen.
- OpenAI’s currently applicable training / product-improvement terms for the account and product tier METIORO will use.
- Whether opt-out, enterprise no-training, zero-retention, or equivalent controls are available and selected.
- Whether approved privacy disclosures must state third-party retention or training exposure for conversation content or derived features.
- Whether METIORO operational logs would retain conversation content or derived context beyond what approved disclosures and minimisation commitments allow.

### 4.3 Processing Jurisdiction & Transfer Model

**Known facts**

- ADR-0007 requires evaluation of international data transfers where applicable.
- P1 generation through a third-party provider may involve cross-border processing of conversation content and derived astrological context.
- Existing general privacy language about processing in other countries is not by itself a completed transfer assessment for the P1 generation-provider path.
- **Processing Jurisdiction & Transfer Model:** `<PENDING COUNSEL>`

**Pending verification**

- Locations in which METIORO and the selected OpenAI endpoint process relevant P1 data for the intended deployment.
- Whether a restricted transfer arises under UK GDPR, EU GDPR, or other applicable regimes.
- Which transfer mechanism applies (for example adequacy, Standard Contractual Clauses, or another lawful mechanism), if required.
- Whether Privacy Policy and DPA transfer language accurately reflect the OpenAI-backed P1 path once the endpoint is selected.

---

## 5. Production Release Status

This record authorizes P1-T04 engineering against the named provider.
The Production Release Gate remains governed by the Sprint P1 Legal Brief.

This record does not authorize production processing of personal data through the third-party generation path.

Production remains blocked until Legal Brief Production Release Gate requirements are satisfied, including at minimum:

- completed Legal Brief
- approved privacy disclosures for the P1 generation path
- resolved DPA assessment for the production generation provider path
- resolved retention, training, and international-transfer determinations necessary for accurate disclosure and lawful processing

No other gate may be substituted for Production Release Gate clearance.

---

## 6. Replacement Rule

Provider replacement requires updating this operational record and re-assessing:

- DPA status
- retention and training policy
- processing jurisdiction and transfer model

No ADR amendment is required if:

- the provider-agnostic internal interface remains materially unchanged
- the public API remains unchanged
- ADR-0007 remains satisfied

**Operational replaceability does not permit undocumented processor changes.**

Replacement MUST NOT introduce public provider selection, public model identifiers, or client-visible provider leakage.

---

## 7. Testing Rule and Credential Constraints

Default T04 tests must use a fake or stub provider.

CI must not call OpenAI or any other live provider.

Real-provider tests must be:

- opt-in only
- disabled by default
- gated by an explicit environment flag
- excluded from normal CI

`OPENAI_API_KEY` must never appear in:

- repository files
- committed environment files
- Cursor prompts
- pasted terminal output
- test fixtures
- logs

The key may exist only in approved runtime environments such as:

- local WSL environment
- Railway environment variables

**Operational follow-up (do not modify the release checklist in this task):** before the first deployment containing a live adapter, the release checklist must verify that the required provider environment variable exists in Railway.

This testing and credential rule protects CI determinism, cost control, secret hygiene, and contract isolation. It does not relax ADR-0007 containment or Production Release Gate requirements.

---

## 8. Non-Goals

This record does not:

- modify ADR-0007
- define the public API
- define Prompt Governance
- define model IDs
- define Explainability
- define provider routing
- authorize production processing
- authorize real-provider calls in CI
- authorize real-provider calls in default local test runs
- authorize committing or exposing API credentials

---

## Document Control

| Field | Value |
|---|---|
| Status | APPROVED TO COMMIT |
| Authoring date | 2026-07-14 |
| Provider approval | OpenAI API — Product Owner, 2026-07-14 |
| Architectural effect | None — operational record only |
| ADR impact | None — ADR-0007 unchanged |
| Next expected use | Authoritative operational input for P1-T04 engineering against the named provider |

## Change Log

| Version | Date | Change |
|---|---|---|
| 0.1.0 | 2026-07-14 | Initial DRAFT operational record naming OpenAI API as initial implementation provider |
| 0.2.0 | 2026-07-14 | Apply approved seven-item textual delta; Product Owner approval recorded; status set to APPROVED TO COMMIT |

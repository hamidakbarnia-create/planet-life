# Sprint P1 — Product Scope

**Document ID:** SPRINT-P1-PRODUCT-SCOPE  
**Status:** DRAFTED  
**Sprint:** P1 — Live Conversation MVP  
**Architecture reference:** ADR-0007 — Conversation API Contract v1.0 (LOCKED)  
**Normative language:** `SHALL`, `MUST`, `MUST NOT`, `MAY`  
**Date:** 13 July 2026  

---

## Status

This Product Scope document is in lifecycle state **DRAFTED**.

Under ADR-0007 §6, governance artifacts SHALL progress only through `DRAFTED → IN REVIEW → RATIFIED → LOCKED`. This document MUST NOT be represented as `RATIFIED` or `LOCKED` before the corresponding governance steps have been completed.

Architecture is frozen. ADR-0007 is LOCKED. This document MUST NOT modify architecture, redefine ADR-0007, introduce implementation decisions, design APIs, design prompts, design databases, or add hidden architecture. Every architectural statement herein MUST reference ADR-0007. Any statement that cannot be mapped to ADR-0007 MUST be marked **Requires ADR Amendment**.

---

## 1. Purpose

This document defines the product scope of Sprint P1 for governance review and approval.

Sprint P1 SHALL deliver a usable Live Conversation MVP backed by a live generation engine while preventing conversation-platform scope from expanding into memory, tools, retrieval, persistence, or multi-agent orchestration (ADR-0007 §1 Context; Decision D1).

The purpose of this Product Scope is to:

1. State the authorised Sprint P1 product outcome in terms consistent with locked ADR-0007.  
2. Separate deliverables from non-deliverables so that Task Decomposition cannot silently expand scope.  
3. Record assumptions, dependencies, and risks that affect sprint execution without changing architecture.  
4. Define measurable acceptance criteria for the Live Conversation MVP.  
5. Establish the Review Gate that MUST be passed before Task Decomposition begins.  
6. Define Exit Criteria that MUST be satisfied before P1.4 starts.

This document is a product-governance boundary. It is not an architecture decision record, not a task plan, and not an implementation specification.

---

## 2. Scope

### 2.1 Product scope statement

Sprint P1 product scope is the Live Conversation MVP authorised by ADR-0007. Within that locked contract, P1 covers a live conversational experience in which:

- Conversation generation is accessed through an internal provider-agnostic generation interface (ADR-0007 Decision D1).  
- Conversation processing is stateless and the client supplies the history required for each request (ADR-0007 Decision D2).  
- Public conversation behaviour conforms to the Conversation API v1.0 contract schemas and role rules (ADR-0007 Decisions D3 and D4).  
- Generation context is limited to validated conversation history, locale, and approved derived astrological context (ADR-0007 Decision D8).  
- Successful responses use the `decision` / `conversational` discriminator and satisfy explainability, uncertainty, and sources rules where applicable (ADR-0007 Decisions D9 and D10).  
- Prompt behaviour is governed through Prompt Governance Specification v1 as required by ADR-0007 Decision D13.  
- Operational behaviour remains within the hard contractual ceilings defined by ADR-0007 Decision D12.

### 2.2 Scope boundary rule

Anything outside the locked P1 decision set is out of product scope for this sprint. ADR-0007 SHALL NOT be read as authorising decisions outside the frozen P1 decision set (ADR-0007 §1). Future-reserved capabilities listed in ADR-0007 §5 are not product deliverables for Sprint P1.

### 2.3 Authority boundary

This Product Scope MAY describe outcomes, exclusions, gates, and measurable acceptance conditions. It MUST NOT prescribe implementation methods, provider choices, UI redesigns, prompt text, data models, or operational tuning beyond restating ADR-0007 hard ceilings as acceptance bounds.

If a desired product outcome cannot be satisfied under ADR-0007, the outcome **Requires ADR Amendment** and is not authorised Sprint P1 scope.

---

## 3. Deliverables

Sprint P1 deliverables MUST describe only Sprint P1 outcomes authorised by ADR-0007. The deliverables of this sprint are the following product outcomes.

### 3.1 Live Conversation MVP outcome

Sprint P1 SHALL deliver a usable live conversational experience backed by a production generation engine (ADR-0007 Decision D1).

Measurable product meaning: an authorised user-facing conversation path exists through which a user can conduct a bounded multi-turn conversational exchange that returns live generated responses under the locked Conversation API contract.

### 3.2 Stateless conversation outcome

Sprint P1 SHALL deliver conversation processing that is stateless on the server, with the client owning supply of the history required for each request (ADR-0007 Decision D2). Absence of server-side persistence MUST NOT be represented as temporary memory or implied continuity (ADR-0007 Decision D2).

### 3.3 Contract-conformant conversation outcome

Sprint P1 SHALL deliver public conversation behaviour that conforms to Conversation API v1.0 schemas, accepted roles, validation rules, locale handling, optional `conversation_id` reservation, response discriminator rules, sources rules, and standard error-envelope containment as locked in ADR-0007 Decisions D3 through D11.

### 3.4 Derived-context personalisation outcome

Sprint P1 SHALL deliver personalisation through approved derived astrological context assembled before provider invocation, without sending raw birth date, raw birth time, raw birthplace text, or raw geographic coordinates to the generation provider when equivalent derived context can satisfy the approved P1 capability (ADR-0007 Decision D8 and §3 Option B).

### 3.5 Explainability-compliant decision outcome

Where conversation outputs contain decision signals, Sprint P1 SHALL deliver responses classified as `decision` with required explainability and uncertainty fields, and MUST NOT classify such outputs as merely `conversational` to avoid Constraint 4a requirements (ADR-0007 Decision D9).

### 3.6 Evidence-governed sources outcome

Sprint P1 SHALL deliver successful responses that include a `sources` array and MUST NOT fabricate user-facing evidence sources. Until EVIDENCE_REGISTRY contains at least one eligible registered evidence source at the approved E2 activation level, `sources` MUST be an empty array (ADR-0007 Decision D10).

### 3.7 Governed prompt-behaviour outcome

Sprint P1 SHALL deliver conversation behaviour governed by Prompt Governance Specification v1, including Governance Core obligations and a Brand Voice Layer that remains PENDING until brand reconciliation is closed (ADR-0007 Decision D13).

### 3.8 Bounded operational outcome

Sprint P1 SHALL deliver conversation processing that remains within the hard contractual ceilings of ADR-0007 Decision D12: not more than 20 conversation messages, not more than 32 KiB request payload, and not more than 30 seconds end-to-end server timeout. The 30-second timeout MUST NOT be presented as a latency target or service-level claim (ADR-0007 Decision D12).

No deliverable in this section authorises work outside ADR-0007. Additional product outcomes not listed here **Require ADR Amendment**.

---

## 4. Non-Deliverables

The following are explicitly excluded from Sprint P1 product scope. They MUST NOT appear as Task Decomposition outcomes, acceptance claims, or implied commitments under this document.

### 4.1 Architecture

Sprint P1 MUST NOT deliver new architecture, architectural redesign, or redefinition of ADR-0007. Architecture is frozen. Any architectural modification requires an ADR Amendment.

### 4.2 Provider selection

Sprint P1 MUST NOT deliver provider-selection UI, runtime user choice of provider, or multi-provider routing as a public capability (ADR-0007 §4). Initial launch with one provider is an operational fact and is not a normative architectural requirement of ADR-0007 (ADR-0007 Decision D1). Provider-selection product work is a non-deliverable.

### 4.3 UI redesign

Sprint P1 MUST NOT deliver a UI redesign programme, visual-system overhaul, or brand-experience redesign as a sprint outcome. Any client surface work authorised later by Task Decomposition MUST remain limited to what is necessary to realise the locked Live Conversation MVP outcome and MUST NOT expand into redesign scope under this Product Scope.

### 4.4 Prompt engineering

Sprint P1 MUST NOT treat prompt engineering as an open-ended product deliverable. Prompt behaviour is governed by Prompt Governance Specification v1 (ADR-0007 Decision D13). Unreviewed prompt experimentation, final Brand Voice Layer completion while Status remains PENDING, and prompt changes outside Diff / Review / Approval / Commit discipline are non-deliverables.

### 4.5 Long-term memory

Sprint P1 MUST NOT deliver long-term memory, server-side conversation persistence, persistent conversation memory, automatic conversation summarisation, Vault integration, previous-conversation retrieval, or previous-decision retrieval (ADR-0007 Decision D2; Decision D8; §4).

### 4.6 Vector search

Sprint P1 MUST NOT deliver vector search, RAG, or vector-retrieved context (ADR-0007 Decision D8; §4).

### 4.7 Agent framework

Sprint P1 MUST NOT deliver an agent framework, multi-agent orchestration, agent delegation, autonomous background actions, tool calling, MCP, or external connectors (ADR-0007 §4).

### 4.8 Production optimization

Sprint P1 MUST NOT deliver production-optimisation programmes, performance-tuning campaigns, or service-level claims based on the 30-second hard timeout. Operational budgets are contractual protection limits, not claims of measured production performance (ADR-0007 Decision D12). Measured evidence MAY later justify stricter operational settings within hard ceilings; that work is not a P1 product deliverable under this scope.

### 4.9 Future roadmap items

Sprint P1 MUST NOT deliver future-reserved capabilities, including streaming responses, WebSocket or event-stream transport, conversation title generation, extended public roles, live-transit context, expanded decision context, evidence activation beyond registry policy, or any roadmap item reserved only for forward compatibility (ADR-0007 §4 and §5). Reserved capability does not authorise P1 implementation (ADR-0007 §5).

### 4.10 Additional explicit exclusions

The following are also non-deliverables because they are outside locked P1 scope or would redefine architecture:

- Raw birth-data disclosure to the generation provider where derived context can satisfy the approved capability (ADR-0007 §3). Changing to that model **Requires ADR Amendment**.  
- Public exposure of provider names, model identifiers, internal prompt content, or provider bodies in client-visible behaviour (ADR-0007 Decision D11).  
- Legal-package completion as a substitute for product delivery; legal completion remains a Production Release Gate concern under ADR-0007 §3 and does not expand product architecture.

---

## 5. Assumptions

The following assumptions underpin Sprint P1 product scope. They do not create architecture.

1. ADR-0007 remains LOCKED for the duration of Sprint P1 unless a formal ADR amendment is approved.  
2. The P1 Architecture Decision Freeze remains in force and continues to bound the authorised decision set referenced by ADR-0007 §1.  
3. ADR-0006 conventions adopted by ADR-0007 for locale and standard error-envelope behaviour remain available and unchanged for Conversation API conformance.  
4. Amendment v1.1 Explainability Model and Constraint 4a remain governing references for decision-bearing outputs as stated by ADR-0007.  
5. EVIDENCE_REGISTRY remains the sole authority for user-facing evidence-source activation, and empty `sources` is the compliant pre-activation state (ADR-0007 Decision D10).  
6. Locked METIORO brand constraints continue to prohibit mystical product language in Governance Core (ADR-0007 Decision D13.1).  
7. Brand Voice Layer may remain PENDING throughout Sprint P1 without blocking Governance Core obligations; provisional neutral-professional tone remains acceptable under ADR-0007 Decision D13.2.  
8. Task Decomposition for Sprint P1 will not begin until this Product Scope passes the Review Gate in §9.  
9. Implementation Start under ADR-0007 §3 MAY occur only after ADR-0007 is LOCKED and Task Decomposition has been approved; this Product Scope does not itself approve Task Decomposition.  
10. Production release of the third-party personalisation path remains subject to Legal Brief completion and related legal gates under ADR-0007 §3, independently of product-scope acceptance.

If an assumption proves false in a way that requires different architecture, the affected outcome **Requires ADR Amendment**.

---

## 6. Dependencies

Dependencies MUST reference only existing locked governance artifacts. Sprint P1 product scope depends on the following locked authorities:

1. **ADR-0007 — Conversation API Contract v1.0 (LOCKED)** — primary and exclusive architectural authority for Sprint P1 conversation scope.  
2. **ADR-0006 — Decision API boundary and execution contract (LOCKED)** — to the extent ADR-0007 adopts its locale definition and standard error-envelope conventions.  
3. **Amendment v1.1 — Explainability Model** — as a governing reference named by ADR-0007.  
4. **Constraint 4a** — as a governing reference named by ADR-0007 for decision explainability and anti-bypass classification.  
5. **EVIDENCE_REGISTRY** — as the activation authority for user-facing evidence sources named by ADR-0007 Decision D10.  
6. **Locked METIORO brand constraints** — as named by ADR-0007, including mystical-language prohibition placed in Prompt Governance Core.  
7. **P1 Architecture Decision Freeze** — as named by ADR-0007 §1 as a governing bound on the frozen P1 decision set.

No dependency in this section authorises new architecture. Companion drafts that are not locked, including DRAFTED legal or prompt-governance documents, are not dependencies of this Product Scope. Their ratification, where required by ADR-0007, remains a separate governance path and MUST NOT be used to expand product scope.

---

## 7. Risks

The following risks affect Sprint P1 product delivery. They do not authorise scope expansion.

1. **Scope creep into excluded platform capabilities.** Pressure to add memory, retrieval, tools, agents, or persistence would violate ADR-0007 §4. Mitigation: Non-Deliverables in §4 and Review Gate rejection of any Task Decomposition that includes excluded items.  
2. **Misclassification of decision outputs.** Treating decision-bearing answers as conversational to avoid explainability would violate ADR-0007 Decision D9.1 and Constraint 4a. Mitigation: Acceptance Criteria in §8 require measurable discriminator and field conformance.  
3. **Raw-versus-derived drift.** Convenience pressure to send raw birth data to the generation provider would violate ADR-0007 Decision D8 and §3. Mitigation: any such change **Requires ADR Amendment**; Product Scope treats it as a non-deliverable.  
4. **Brand Voice incompleteness.** Brand Voice Layer remains PENDING. Risk is mistaking provisional tone for final voice. Mitigation: ADR-0007 Decision D13.2 provisional-tone rule; final voice is a non-deliverable while PENDING.  
5. **Evidence fabrication pressure.** Empty `sources` may be perceived as incomplete product behaviour. Fabricating sources would violate ADR-0007 Decision D10. Mitigation: empty-array acceptance criterion until E2 activation.  
6. **Legal production-gate dependency.** Product acceptance of MVP behaviour does not equal production-release clearance for third-party personalisation. Risk is conflating the two. Mitigation: keep ADR-0007 §3 Production Release Gate independent of this Product Scope’s Review Gate.  
7. **Hard-ceiling misunderstanding.** Treating the 30-second timeout as a latency target or relaxing ceilings without amendment would violate ADR-0007 Decision D12. Mitigation: Acceptance Criteria treat ceilings as hard bounds, not performance claims.

---

## 8. Acceptance Criteria

Acceptance Criteria MUST be measurable. Sprint P1 product scope is accepted only when all of the following criteria are met.

### AC-01 Live conversation outcome

A governed Live Conversation MVP path exists through which a user can complete at least one multi-turn exchange of two or more user turns and receive live generated assistant responses under the Conversation API contract (ADR-0007 Decision D1).

### AC-02 Stateless processing

Server-side conversation history, conversation state, and conversational memory are not persisted for P1 conversation processing, and product representation does not describe absence of persistence as temporary memory or implied continuity (ADR-0007 Decision D2).

### AC-03 Role and schema conformance

Public conversation messages accept only `user` and `assistant` roles; unsupported roles are rejected through the standard validation error envelope; required `role` and `content` fields are enforced (ADR-0007 Decisions D3 and D4).

### AC-04 History validation bounds

Requests exceeding 20 messages or 32 KiB are rejected through the standard validation error envelope with HTTP `400`, error code `VALIDATION_ERROR`, a request identifier, and no provider-specific details; messages are not silently truncated, summarized, reordered, or discarded (ADR-0007 Decisions D5 and D12).

### AC-05 Derived-context personalisation

Provider-bound generation context for the approved personalisation path includes approved derived astrological context and does not include raw birth date, raw birth time, raw birthplace text, or raw geographic coordinates when equivalent derived context can satisfy the approved P1 capability (ADR-0007 Decision D8 and §3 Option B).

### AC-06 Decision explainability

Every successful response includes a non-null `type` discriminator of `decision` or `conversational`. Every decision-bearing response is typed `decision` and includes non-null `reasoning` and non-null `uncertainty`. No decision-bearing response is accepted as merely `conversational` (ADR-0007 Decision D9).

### AC-07 Sources governance

Every successful response includes a `sources` array. While no eligible E2 evidence source is activated, `sources` is exactly an empty array and no fabricated user-facing sources appear (ADR-0007 Decision D10).

### AC-08 Provider containment

Client-visible success and error outputs do not include provider names, provider model identifiers, raw SDK exceptions, raw provider messages, stack traces, secret values, internal prompt content, or provider request or response bodies (ADR-0007 Decision D11).

### AC-09 Timeout ceiling

End-to-end server processing for a conversation request does not extend beyond the 30-second hard contractual ceiling, and that ceiling is not presented as a latency target or service-level claim (ADR-0007 Decision D12).

### AC-10 Prompt governance binding

Conversation prompt behaviour is bound to Prompt Governance Specification v1 Governance Core obligations required by ADR-0007 Decision D13, including Constraint 4a implementation requirements, prohibited deterministic and guaranteed-outcome claims, and mystical-language prohibition. Brand Voice Layer may remain PENDING.

### AC-11 Non-deliverable exclusion

No accepted P1 outcome includes architecture redesign, provider-selection UI, UI redesign programme, open-ended prompt engineering, long-term memory, vector search, agent framework, production-optimisation programme, or future roadmap activation listed in §4.

Failure of any Acceptance Criterion means Sprint P1 product scope is not accepted.

---

## 9. Review Gate

### 9.1 Gate definition

The Review Gate for this Product Scope is the governance approval that MUST occur before Task Decomposition begins.

No Sprint P1 Task Decomposition artifact MAY be treated as authorised for execution until this Product Scope has left DRAFTED status through governance review and has received recorded approval under §12 sufficient for Task Decomposition to start.

### 9.2 Gate inputs

Reviewers MUST evaluate this document against:

1. ADR-0007 LOCKED text.  
2. The Non-Deliverables list in §4.  
3. The Acceptance Criteria in §8.  
4. The Dependencies list in §6, confirming that only locked governance artifacts are cited as dependencies.  
5. Confirmation that no section introduces implementation detail, API design, prompt design, database design, or hidden architecture.

### 9.3 Gate outcomes

The Review Gate outcome MUST be one of:

- **APPROVED FOR TASK DECOMPOSITION** — Product Scope is accepted for the next governance step; P1.4 MAY start only when Exit Criteria in §10 are also met.  
- **REVISE** — Product Scope remains unapproved; Task Decomposition MUST NOT begin.  
- **REJECT** — Product Scope is not accepted; material rewrite is required before resubmission.

### 9.4 Hard failures

The Review Gate MUST fail if any of the following are present:

1. An architectural statement that does not map to ADR-0007 and is not marked **Requires ADR Amendment**.  
2. A deliverable that redefines ADR-0007.  
3. Inclusion of any non-deliverable from §4 as an in-scope outcome.  
4. Acceptance criteria that are not measurable.  
5. Dependencies on unlocked or non-existent governance authorities presented as locked dependencies.

---

## 10. Exit Criteria

Exit Criteria define exactly what is required before P1.4 starts.

P1.4 MUST NOT start until all of the following are true:

1. This Product Scope document has completed the Review Gate in §9 with the outcome **APPROVED FOR TASK DECOMPOSITION**.  
2. Approval records in §12 include Product Owner and Governance Reviewer decisions supporting that outcome.  
3. No open Review Gate hard failure from §9.4 remains unresolved.  
4. ADR-0007 remains LOCKED, or any intervening architectural change has been approved through an ADR amendment and this Product Scope has been revised to match.  
5. The intended P1.4 work is limited to Task Decomposition preparation and MUST NOT begin implementation execution under the pretence of product-scope drafting. Implementation Start remains governed by ADR-0007 §3 and requires approved Task Decomposition.

If any Exit Criterion is unmet, P1.4 MUST NOT start.

---

## 11. References

1. ADR-0007 — Conversation API Contract v1.0 (LOCKED)  
2. ADR-0006 — Decision API boundary and execution contract (LOCKED), as adopted by ADR-0007 for locale and error-envelope conventions  
3. Amendment v1.1 — Explainability Model, as referenced by ADR-0007  
4. Constraint 4a, as referenced by ADR-0007  
5. EVIDENCE_REGISTRY, as referenced by ADR-0007 Decision D10  
6. Locked METIORO brand constraints, as referenced by ADR-0007  
7. P1 Architecture Decision Freeze, as referenced by ADR-0007 §1  

---

## 12. Approval

| Role | Name | Decision | Date | Signature / record |
|------|------|----------|------|--------------------|
| Documentation Engineer | | DRAFTED prepared | 13 July 2026 | |
| Product Owner | | Pending | | |
| Governance Reviewer | | Pending | | |
| Release / Scope Authority | | Pending — Review Gate | | |

This document MAY move to `IN REVIEW` when submitted for the Review Gate. Task Decomposition MUST NOT begin while Status remains DRAFTED without recorded Review Gate approval.

---

## 13. Open Questions

1. Which named individuals will act as Product Owner and Governance Reviewer for the §9 Review Gate?  
2. What recorded evidence format will be used to capture the **APPROVED FOR TASK DECOMPOSITION** outcome?  
3. Will Brand Voice Layer remain PENDING for the entire Sprint P1 acceptance window, or is a separate brand-reconciliation date expected before product acceptance?  
4. Are there any Product Owner outcome expectations that cannot be mapped to ADR-0007 and therefore require explicit **Requires ADR Amendment** logging before Review Gate submission?  
5. Confirm that P1.4 is limited to Task Decomposition and does not include Implementation Start without a separately approved Task Decomposition artifact under ADR-0007 §3.

---

## 14. Review Checklist

- [ ] Status is DRAFTED and lifecycle rules are stated  
- [ ] Purpose and Scope describe Live Conversation MVP only under ADR-0007  
- [ ] Deliverables describe only Sprint P1 outcomes and map to ADR-0007  
- [ ] Non-Deliverables explicitly exclude architecture, provider selection, UI redesign, prompt engineering, long-term memory, vector search, agent framework, production optimization, and future roadmap items  
- [ ] Assumptions do not create architecture  
- [ ] Dependencies reference only existing locked governance artifacts  
- [ ] Risks do not expand scope  
- [ ] Acceptance Criteria are measurable and mapped to ADR-0007  
- [ ] Review Gate requires governance approval before Task Decomposition  
- [ ] Exit Criteria define exactly what is required before P1.4 starts  
- [ ] References, Approval, Open Questions, Review Checklist, and Change Log are present  
- [ ] No section introduces implementation detail, API design, prompt design, database design, or hidden architecture  
- [ ] Unmapped architectural desires are marked Requires ADR Amendment  

---

## 15. Change Log

| Version | Date | Author role | Change |
|---------|------|-------------|--------|
| 0.1.0 | 13 July 2026 | Documentation Engineer | Initial DRAFTED Sprint P1 Product Scope against locked ADR-0007 |

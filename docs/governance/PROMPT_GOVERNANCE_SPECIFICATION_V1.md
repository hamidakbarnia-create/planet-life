# Prompt Governance Specification v1

**Document ID:** PROMPT_GOVERNANCE_SPECIFICATION_V1  
**Status:** DRAFTED  
**Sprint:** P1  
**Architecture reference:** ADR-0007 — Conversation API Contract v1.0 (LOCKED)  
**Normative language:** `SHALL`, `MUST`, `MUST NOT`, `MAY`  
**Date:** 13 July 2026  

---

## Status

This specification is in lifecycle state **DRAFTED**.

Under ADR-0007 §6, governance artifacts SHALL progress only through `DRAFTED → IN REVIEW → RATIFIED → LOCKED`. This document MUST NOT be represented as `RATIFIED` or `LOCKED` before the corresponding governance steps have been completed.

ADR-0007 Decision D13 establishes that prompt behaviour SHALL be governed through this artifact, named **Prompt Governance Specification v1**. Changes to governed prompt behaviour MUST NOT be treated as ordinary implementation details.

This specification contains two normatively separated layers:

1. **Governance Core** — independently reviewable and lockable.  
2. **Brand Voice Layer** — **Status: PENDING — blocked on brand reconciliation**.

Architecture remains CLOSED. This specification MUST NOT introduce architectural decisions. Every architectural statement herein MUST map to ADR-0007. Any required behaviour that cannot be mapped MUST be marked **Requires ADR Amendment**.

---

## Purpose

The purpose of this specification is to define the governed rules for prompt behaviour in the Sprint P1 Live Conversation MVP so that generation remains consistent with ADR-0007 Decisions D8, D9, D10, D11, and D13; Constraint 4a as referenced by ADR-0007; EVIDENCE_REGISTRY activation rules; and locked METIORO brand constraints that ADR-0007 places in Governance Core.

This specification exists to make prompt behaviour a reviewable governance artifact rather than hidden application logic. It defines classification, explainability, uncertainty, prohibited claims, safety, assembly, context injection, validation, response structure, evidence handling, Constraint 4a ownership, system-prompt change control, and test obligations.

It does not authorise raw birth-data injection, persistence, tools, retrieval, streaming, or any other capability excluded by ADR-0007.

---

## 1. Scope

### 1.1 In scope

This specification governs Sprint P1 prompt behaviour for the Conversation API path locked by ADR-0007, including:

- Governance Core requirements enumerated in ADR-0007 Decision D13.1.  
- Brand Voice Layer status and provisional tone rules under ADR-0007 Decision D13.2.  
- Decision and conversational classification instructions aligned to ADR-0007 Decision D9.  
- Explainability, uncertainty, sources, and prohibited deterministic or guaranteed-outcome claims.  
- Prompt assembly and approved context injection aligned to ADR-0007 Decision D8.  
- Provider-output validation and response-structure requirements necessary to satisfy the public contract.  
- System Prompt governance as a governed artifact.  
- Constraint 4a ownership as assigned to this specification by ADR-0007 Decision D13.1.  
- Tests and change-control obligations for governed prompt behaviour.

### 1.2 Out of scope

The following remain out of scope because ADR-0007 excludes them from P1 or because they are not authorised architectural statements:

- Final marketing language and completed Brand Voice Layer copy while Status remains PENDING.  
- Server-side conversation persistence, memory, Vault context, previous-conversation retrieval, and previous-decision retrieval.  
- RAG, vector retrieval, tool calling, MCP, external connectors, and multi-agent orchestration.  
- Live transit context and expanded decision context.  
- Streaming transport and provider-selection UI.  
- Implementation code, provider SDK usage, and model-identifier selection. Those remain behind the provider-agnostic interface and MUST NOT appear in the public contract (ADR-0007 Decision D1).

### 1.3 Normative separation of layers

Governance Core and Brand Voice Layer SHALL remain normatively separated. The pending Voice Layer MUST NOT weaken, override, or bypass Governance Core (ADR-0007 Decision D13.2). Mystical-language prohibition belongs in Governance Core because it is a locked METIORO brand constraint (ADR-0007 Decision D13.1).

---

## 2. Governance Core

### 2.1 Role

The Governance Core SHALL be independently reviewable and lockable (ADR-0007 Decision D13.1). It is the authoritative prompt-governance layer for P1 safety, classification, explainability, uncertainty, prohibited claims, assembly, context injection, unsupported-request handling, output validation, response structure, and mystical-language prohibition.

### 2.2 Mandatory contents

The Governance Core MUST define and enforce:

1. Constraint 4a implementation requirements.  
2. Decision and conversational classification instructions.  
3. Explainability requirements.  
4. Uncertainty disclosure.  
5. Prohibited deterministic claims.  
6. Prohibition of guaranteed future outcomes.  
7. Safety boundaries.  
8. Response structure.  
9. Prompt assembly rules.  
10. Approved context injection rules.  
11. Handling of unsupported requests.  
12. Provider-output validation requirements.  
13. Prohibition of mystical product language.

### 2.3 Change control for Governance Core

Changes to Governance Core require governance review and a registered amendment (ADR-0007 Decision D13.1 and §6 change-control table). A Governance Core change MUST NOT be introduced as an unreviewed code-only edit.

### 2.4 Relationship to architecture

Governance Core governs prompt behaviour within the locked architecture. It MUST NOT alter public schemas, roles, hard ceilings, persistence rules, or the raw-versus-derived context selection. Any such alteration **Requires ADR Amendment**.

---

## 3. Decision Classification

### 3.1 Discriminator requirement

Every successful `ConversationResponse` MUST contain a non-null discriminator:

`type: "decision" | "conversational"`

This requirement is architectural under ADR-0007 Decision D9 and is binding on prompt behaviour and output validation.

### 3.2 Classification rule

A response MUST be classified as `decision` when it contains any of the following (ADR-0007 Decision D9.1):

1. A recommendation.  
2. Advice about whether to act or not act.  
3. Comparative preference between actions.  
4. A score or ranked assessment.  
5. Timing guidance.  
6. A claimed favourable or unfavourable period.  
7. A decision-relevant interpretation intended to influence user action.

A response MUST NOT be classified as merely `conversational` in order to avoid the explainability requirements of Constraint 4a (ADR-0007 Decision D9.1).

### 3.3 Conversational classification limits

Clarification requests, greetings, and neutral conversational continuations MAY be classified as `conversational` only when they carry no decision signal (ADR-0007 Decision D9.3).

### 3.4 Prompt-governance ownership

Prompt instructions, system-prompt rules, and output-validation checks that implement this classification rule are owned by this specification. Contract tests MUST reject or fail any decision-bearing response emitted without the `decision` discriminator and its required explainability fields (ADR-0007 Decision D9.1).

---

## 4. Explainability

### 4.1 Decision responses

A `decision` response MUST contain `message`, `reasoning`, `uncertainty`, `sources`, and `request_id` (ADR-0007 Decision D9.2).

`reasoning` MUST be present and non-null.  
`uncertainty` MUST be present and non-null.

Prompt behaviour MUST cause decision-bearing outputs to include reasoning that makes the basis of the guidance intelligible at the level required by Constraint 4a as referenced by ADR-0007. Reasoning MUST NOT be omitted, emptied, or replaced with mystical or non-explanatory filler.

### 4.2 Conversational responses

A `conversational` response MUST contain `message`, `sources`, and `request_id`. It MAY omit decision-only explainability fields where no recommendation, score, timing guidance, or decision signal is present (ADR-0007 Decision D9.3).

### 4.3 Anti-bypass rule

Explainability obligations attach to substantive decision content, not to label convenience. Re-labelling a decision-bearing answer as conversational to avoid `reasoning` or `uncertainty` is prohibited by ADR-0007 Decision D9.1 and by Constraint 4a ownership under this specification.

---

## 5. Uncertainty

### 5.1 Mandatory uncertainty for decisions

Where a response is classified as `decision`, `uncertainty` MUST be present and non-null (ADR-0007 Decision D9.2).

### 5.2 Language rule

The response MUST use probabilistic and non-deterministic language where certainty is not supported (ADR-0007 Decision D9.2). Prompt behaviour MUST prefer qualified, probabilistic, and bounded formulations over absolute predictions.

### 5.3 Relationship to Constraint 4a

Uncertainty disclosure is a Constraint 4a implementation requirement owned by this specification under ADR-0007 Decision D13.1. Prompt text, validation, and tests MUST treat missing or null uncertainty on decision responses as a governance failure.

---

## 6. Prohibited Claims

### 6.1 Deterministic and guaranteed-outcome claims

Governance Core MUST prohibit deterministic claims and guaranteed future outcomes (ADR-0007 Decision D13.1). Prompt behaviour MUST NOT assert that a future personal outcome is certain, guaranteed, inevitable, or fated.

### 6.2 Evidence fabrication

The system MUST NOT fabricate, infer, or display user-facing evidence sources that are not activated through EVIDENCE_REGISTRY (ADR-0007 Decision D10). Prompt behaviour MUST NOT invent citations, studies, registries, or authority claims to decorate an answer.

### 6.3 Continuity and memory claims

Because conversation processing SHALL be stateless and the server MUST NOT persist conversation history, conversation state, or conversational memory (ADR-0007 Decision D2), prompt behaviour MUST NOT represent the product as possessing server-side temporary memory or implied continuity beyond the client-supplied history in the current request.

### 6.4 Provider and internals claims

Prompt behaviour and resulting user-visible content MUST NOT disclose provider names, model identifiers, internal prompt content, or provider request or response bodies (ADR-0007 Decision D11).

### 6.5 Mystical claims

Mystical, supernatural, occult, or fate-based product language is prohibited in Governance Core (ADR-0007 Decision D13.1). This prohibition is independent of the pending Brand Voice Layer.

---

## 7. Safety Rules

### 7.1 Safety boundaries

Governance Core MUST define safety boundaries for unsupported, harmful, or out-of-scope user requests (ADR-0007 Decision D13.1). Prompt behaviour MUST refuse or safely redirect requests that would require prohibited claims, fabricated evidence, medical/legal/financial professional advice beyond product scope as governed by existing user-facing legal limitations, or architectural capabilities excluded from P1.

### 7.2 Unsupported-request handling

Handling of unsupported requests is a Governance Core obligation (ADR-0007 Decision D13.1). When a user request would require persistent memory, Vault content, live transit context, tool use, retrieval, or another excluded capability, the system MUST NOT silently invent that capability. It MUST respond within authorised P1 behaviour, typically by clarifying limits or declining the unsupported path without implying that the excluded capability exists.

Any design that satisfies such a request by activating an excluded capability **Requires ADR Amendment**.

### 7.3 No bypass through tone

Safety and prohibited-claim rules belong to Governance Core. Provisional brand-neutral tone MUST NOT be used to soften, hide, or bypass safety refusals.

---

## 8. Prompt Assembly

### 8.1 Governed assembly

Prompt assembly rules are part of Governance Core (ADR-0007 Decision D13.1). Assembly means the governed composition of instructions and approved context that are presented to the generation interface for a single stateless request.

### 8.2 Authorised assembly inputs

Prompt assembly for P1 MUST be limited to inputs consistent with ADR-0007 Decision D8:

1. Validated conversation history.  
2. Locale.  
3. Approved derived astrological context.  
4. Governed system instructions defined by this specification’s Governance Core, and provisional neutral-professional voice rules while the Brand Voice Layer remains PENDING.

### 8.3 Prohibited assembly inputs

Prompt assembly MUST NOT include persistent memory, Vault content, previous conversation retrieval, previous decision retrieval, live transit context, expanded decision context, external connector data, or vector-retrieved context (ADR-0007 Decision D8).

Prompt assembly MUST NOT include raw birth date, raw birth time, raw birthplace text, or raw geographic coordinates when equivalent derived astrological context can satisfy the approved P1 capability (ADR-0007 Decision D8).

### 8.4 No silent history mutation

The server MUST NOT silently truncate, summarize, reorder, or discard conversation messages (ADR-0007 Decision D5). Prompt assembly MUST NOT compensate for over-limit requests by silent mutation. Requests exceeding contractual ceilings MUST be rejected through the standard validation error envelope.

### 8.5 Provider containment

Assembled prompt content is internal. Clients MUST NOT receive internal prompt content (ADR-0007 Decision D11). Prompt assembly artifacts are governed materials and are subject to the System Prompt change-control rules in §15 where they form part of the governed system instruction set.

---

## 9. Context Injection

### 9.1 Derived-context decision

Context injection MUST reference and obey the ADR-0007 derived-context decision (Option B and Decision D8). The backend SHALL calculate or assemble the approved derived context before provider invocation. The generation provider MUST NOT receive raw birth identifiers when equivalent derived context can satisfy the approved P1 capability.

### 9.2 Approved injection set

Only the following context classes MAY be injected into generation for P1:

1. Validated conversation history.  
2. Locale, which MAY influence response language but MUST NOT create server-side conversation state (ADR-0007 Decision D7).  
3. Approved derived astrological context.

### 9.3 Raw birth data rule

No raw birth data injection is allowed unless explicitly allowed by ADR. Under locked ADR-0007, raw birth data injection to the generation provider is not allowed when derived context can satisfy the approved capability. Any proposal to inject raw birth data to the provider **Requires ADR Amendment** and MUST NOT occur as a prompt-engineering convenience.

### 9.4 Excluded injection set

The following MUST NOT be injected in P1: persistent memory; Vault content; previous conversation retrieval; previous decision retrieval; live transit context; expanded decision context; external connector data; vector-retrieved context (ADR-0007 Decision D8).

---

## 10. Output Validation

### 10.1 Validation obligation

Provider-output validation requirements are part of Governance Core (ADR-0007 Decision D13.1). Validation exists to ensure that provider output can be mapped into the public Conversation API contract without leaking internals or bypassing Constraint 4a.

### 10.2 Mandatory validation checks

Before a successful public response is emitted, validation MUST confirm at least the following:

1. Discriminator presence and legality (`decision` or `conversational`).  
2. For `decision` responses: presence of non-null `message`, `reasoning`, `uncertainty`, `sources`, and `request_id`.  
3. For `conversational` responses: presence of `message`, `sources`, and `request_id`, and absence of decision signal that would require reclassification.  
4. `sources` conforms to EVIDENCE_REGISTRY activation rules, including empty-array behaviour when no eligible E2 source is activated.  
5. No provider name, model identifier, raw provider message, stack trace, secret, or internal prompt content is present in client-visible fields.  
6. No mystical-language violation in governed user-visible fields under Governance Core.  
7. No guaranteed-future-outcome or unsupported deterministic claim in governed user-visible decision content.

### 10.3 Failure handling

Malformed output and related provider failures MUST be translated into the standard Conversation API error envelope (ADR-0007 Decision D11). Validation failure MUST NOT be concealed by stripping explainability fields from a decision-bearing answer in order to force a conversational label.

---

## 11. Response Structure

### 11.1 Decision structure

Decision responses MUST use the structure required by ADR-0007 Decision D9.2: `message`, `reasoning`, `uncertainty`, `sources`, and `request_id`.

### 11.2 Conversational structure

Conversational responses MUST use the structure required by ADR-0007 Decision D9.3: `message`, `sources`, and `request_id`, with decision-only fields omitted only where no decision signal is present.

### 11.3 Prompt instructions for structure

System and governance instructions MUST direct the generation process toward these structures. Final public conformance remains the responsibility of contract-facing validation. Prompt instructions alone do not relax architectural field requirements.

### 11.4 Roles boundary

Public conversation roles in P1 are only `user` and `assistant` (ADR-0007 Decision D4). The roles `system`, `tool`, `developer`, and `memory` are not valid P1 public inputs. Internal system instructions used for governance are not public `ConversationMessage` roles and MUST NOT be exposed as such in the public API.

---

## 12. Evidence

### 12.1 Sources requirement

Every successful response MUST contain a `sources` array (ADR-0007 Decision D10).

### 12.2 Pre-activation behaviour

Until EVIDENCE_REGISTRY contains at least one eligible registered evidence source at the approved E2 activation level, the API MUST return `"sources": []`.

### 12.3 Non-fabrication

The system MUST NOT fabricate, infer, or display user-facing evidence sources that are not activated through EVIDENCE_REGISTRY. Prompt behaviour MUST NOT compensate for an empty registry by inventing plausible sources.

### 12.4 Activation dependency

Activation of non-empty `sources` requires compliance with the registry’s approved activation policy and the applicable governance review (ADR-0007 Decision D10). Prompt changes MUST NOT unilaterally activate evidence sources.

---

## 13. Brand Voice Layer

### 13.1 Status

**Status: PENDING — blocked on brand reconciliation**

This status header is mandatory under ADR-0007 Decision D13.2.

### 13.2 Provisional tone

Until brand reconciliation is closed, generated and placeholder conversation copy MUST use a neutral-professional tone.

Brand-neutral placeholder copy MUST be identified as provisional in the relevant tests or fixtures and MUST NOT be represented as final product voice.

### 13.3 Prohibition on final marketing language in this draft

This specification MUST NOT write final marketing language while the Brand Voice Layer remains PENDING. No slogan, campaign voice, or final tonal style guide is authorised by this DRAFTED document.

### 13.4 Non-override rule

The pending Voice Layer MUST NOT weaken, override, or bypass Governance Core. Closing brand reconciliation is the revisit trigger for completing the Brand Voice Layer. Completion or material modification of the Voice Layer requires a registered amendment and MUST NOT occur as an unreviewed code-only change (ADR-0007 Decision D13.2).

---

## 14. Constraint 4a Prompt Audit

### 14.1 Ownership

Constraint 4a ownership belongs to this specification. ADR-0007 Decision D13.1 requires that Governance Core define Constraint 4a implementation requirements. This section is the prompt-audit locus for those requirements.

### 14.2 Audit objects

A Constraint 4a prompt audit MUST review:

1. Classification instructions and anti-bypass wording.  
2. Decision-response explainability instructions for `reasoning`.  
3. Uncertainty instructions and probabilistic-language requirements.  
4. Prohibition on avoiding explainability by misclassification.  
5. Consistency with Amendment v1.1 Explainability Model as referenced by ADR-0007.  
6. Test coverage that fails decision-bearing outputs lacking required explainability fields.

### 14.3 Audit outcomes

An audit outcome MUST be one of: Pass; Pass with required amendments to Governance Core; Fail. A Fail outcome blocks ratification of affected prompt-governance changes. Circumvention of Constraint 4a through conversational mislabelling is an automatic Fail.

### 14.4 Relationship to ADR change control

Changes to the decision-classification rule require an ADR amendment plus Constraint 4a review (ADR-0007 §6). Changes to explainability requirements require an ADR amendment plus governance review. This specification MAY refine prompt-implementation instructions within those locked rules, but MUST NOT redefine the classification rule itself.

---

## 15. System Prompt Governance

### 15.1 Governed artifact status

The System Prompt is a governed artifact. It is not ordinary application copy and MUST NOT be treated as a local implementation detail (ADR-0007 Decision D13).

### 15.2 Modification requirements

Every modification to the System Prompt requires all of the following:

1. **Diff** — a reviewable record of the exact change.  
2. **Review** — governance review appropriate to whether the change affects Governance Core or only provisional voice fixtures.  
3. **Approval** — recorded approval before production reliance.  
4. **Commit** — a controlled repository commit of the approved artifact.

Omission of any one of Diff, Review, Approval, or Commit renders the modification non-compliant with this specification.

### 15.3 Layer-specific rules

If a System Prompt change alters Governance Core obligations, it requires governance review and a registered amendment (ADR-0007 Decision D13.1).

If a System Prompt change only adjusts provisional neutral-professional examples while Brand Voice Layer remains PENDING, it MUST remain identified as provisional and MUST NOT claim final voice status. It still requires Diff, Review, Approval, and Commit.

Completion of final Brand Voice Layer language requires brand reconciliation plus registered amendment (ADR-0007 Decision D13.2).

### 15.4 Secrecy and client exposure

Internal prompt content MUST NOT be returned to clients (ADR-0007 Decision D11). Governance review access to prompt diffs does not authorise public exposure of system-prompt text in API errors or responses.

---

## 16. Tests

### 16.1 Required test classes

Governed prompt behaviour MUST be covered by tests that verify, at minimum:

1. Decision-bearing outputs cannot pass as `conversational` without required explainability fields.  
2. `decision` responses reject null or missing `reasoning` or `uncertainty`.  
3. `sources` remains `[]` until eligible E2 activation exists.  
4. Fabricated sources are rejected.  
5. Raw birth identifiers are not present in provider-bound assembled context when derived context is used under Option B.  
6. Excluded context classes are not injected.  
7. Mystical-language prohibitions are enforced for governed user-visible outputs.  
8. Provisional brand-neutral fixtures are labelled provisional and are not asserted as final voice.  
9. Provider-internal details are not leaked in public error or success payloads.

### 16.2 Relationship to contract tests

ADR-0007 Decision D9.1 requires that contract tests reject or fail any decision-bearing response emitted without the `decision` discriminator and required explainability fields. Prompt-governance tests MUST align to that contract obligation and MUST NOT weaken it.

### 16.3 No pseudo-implementation in this specification

This specification defines required test intent and pass/fail meaning. It does not prescribe code structure, frameworks, or provider mocks beyond governance necessity.

---

## 17. Change Control

### 17.1 Artifact lifecycle

This specification SHALL progress only through `DRAFTED → IN REVIEW → RATIFIED → LOCKED` (ADR-0007 §6).

### 17.2 Change-path table for prompt governance

| Change type | Required path |
|-------------|---------------|
| Governance Core rule change | Governance review + registered amendment |
| Brand Voice Layer completion or material modification | Brand reconciliation + registered amendment |
| System Prompt modification | Diff + Review + Approval + Commit |
| Decision-classification rule change | ADR amendment + Constraint 4a review |
| Explainability requirement change | ADR amendment + governance review |
| Raw-versus-derived context selection change | ADR amendment |
| Evidence-source activation | EVIDENCE_REGISTRY activation process + applicable governance review |
| Legal wording for disclosures | Legal review |

Implementation MUST NOT reinterpret a governed change as a local code detail in order to bypass this table (ADR-0007 §6).

### 17.3 Architecture boundary

If a proposed prompt change requires new context classes, public roles, persistence, tools, retrieval, or raw provider disclosure, the change **Requires ADR Amendment** and is outside the authority of this specification alone.

---

## 18. Approval

| Role | Name | Decision | Date | Signature / record |
|------|------|----------|------|--------------------|
| Documentation Engineer | | DRAFTED prepared | 13 July 2026 | |
| Governance Reviewer | | Pending | | |
| Constraint 4a Reviewer | | Pending | | |
| Brand Owner | | Pending — Voice Layer remains PENDING | | |
| Product Owner | | Pending | | |

This document MAY move to `IN REVIEW` when submitted for governance review. Governance Core content MAY be advanced toward ratification independently of Brand Voice Layer completion. Brand Voice Layer MUST remain PENDING until brand reconciliation is closed.

---

## References

1. ADR-0007 — Conversation API Contract v1.0 (LOCKED), especially Decisions D2, D4, D5, D7, D8, D9, D10, D11, D13, and §6  
2. ADR-0006 — Decision API boundary and execution contract (locale and error-envelope conventions as adopted by ADR-0007)  
3. Amendment v1.1 — Explainability Model (as referenced by ADR-0007)  
4. Constraint 4a (ownership assigned to this specification for prompt-audit implementation requirements)  
5. EVIDENCE_REGISTRY  
6. Locked METIORO brand constraints, including mystical-language prohibition as placed in Governance Core by ADR-0007 Decision D13.1  
7. docs/legal/SPRINT_P1_LEGAL_BRIEF.md — companion Sprint P1 legal governance draft  

---

## Open Questions

1. Which repository path and review workflow will hold the canonical System Prompt artifact for Diff / Review / Approval / Commit tracking?  
2. Who is the named Constraint 4a Reviewer for prompt-audit sign-off in Sprint P1?  
3. What provisional fixture-labelling convention will tests use to mark neutral-professional copy as non-final while Brand Voice Layer remains PENDING?  
4. When will brand reconciliation close sufficiently to reopen Brand Voice Layer completion?  
5. Are any additional Governance Core refusal categories required for regulated advice domains beyond existing public disclaimer posture, without creating new architecture?  
6. Does counsel review of the Legal Brief identify any disclosure constraint that must be mirrored as an explicit prompt prohibition before Production Release Gate clearance?

---

## Review Checklist

- [ ] Status is DRAFTED and lifecycle rules are stated  
- [ ] Purpose, Scope, References, and Approval are present  
- [ ] Governance Core and Brand Voice Layer are normatively separated  
- [ ] Brand Voice Layer is marked PENDING and contains no final marketing language  
- [ ] Constraint 4a ownership is explicit in this specification  
- [ ] Prompt Assembly and Context Injection reference ADR-0007 derived-context decision  
- [ ] Raw birth data injection is forbidden unless explicitly allowed by ADR  
- [ ] System Prompt is treated as a governed artifact requiring Diff, Review, Approval, and Commit  
- [ ] Decision classification, explainability, uncertainty, evidence, and prohibited claims map to ADR-0007  
- [ ] No architecture beyond ADR-0007 is introduced; unmapped items marked Requires ADR Amendment  
- [ ] No implementation code or pseudo-code is included  
- [ ] Open Questions, Review Checklist, and Change Log are present  

---

## Change Log

| Version | Date | Author role | Change |
|---------|------|-------------|--------|
| 0.1.0 | 13 July 2026 | Documentation Engineer | Initial DRAFTED Prompt Governance Specification v1 against locked ADR-0007 |

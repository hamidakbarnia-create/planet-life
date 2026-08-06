# Sprint P1 Legal Brief — Live Conversation MVP

**Document ID:** SPRINT_P1_LEGAL_BRIEF  
**Status:** DRAFTED  
**Sprint:** P1  
**Architecture reference:** ADR-0007 — Conversation API Contract v1.0 (LOCKED)  
**Normative language:** `SHALL`, `MUST`, `MUST NOT`, `MAY`  
**Date:** 13 July 2026  

---

## Status

This Legal Brief is in lifecycle state **DRAFTED**.

Under the governance lifecycle defined in ADR-0007 §6, artifacts SHALL progress only through `DRAFTED → IN REVIEW → RATIFIED → LOCKED`. This document MUST NOT be represented as `RATIFIED` or `LOCKED` until the corresponding governance and counsel review steps have been completed.

This brief does not create architecture. Architectural decisions for Sprint P1 remain exclusively those locked in ADR-0007. Where legal review identifies an impact on the locked architectural contract, the Architecture Amendment Gate in §10 SHALL apply.

---

## 1. Purpose

This Legal Brief evaluates the legal, privacy, and data-processing implications of the Sprint P1 Live Conversation MVP as defined by ADR-0007.

ADR-0007 requires that the Legal Brief evaluate third-party processing disclosure; the provider’s data-processing terms; DPA status; retention and training controls; international data transfers where applicable; the wording required for derived astrological features; and whether the chosen derived schema remains personal data under applicable law (ADR-0007 §3, Legal Brief evaluation list).

The purpose of this document is therefore to:

1. Record the P1 data flow that follows from ADR-0007 Decision D8 and the selected Option B (derived astrological context).  
2. Assess third-party processor exposure arising from live generation under ADR-0007 Decision D1.  
3. Distinguish raw birth data from derived astrological context under the locked processing model.  
4. Assess the adequacy of existing privacy disclosures, DPA readiness, retention and training controls, and international-transfer posture for production release of the approved personalisation path.  
5. Define the three-stage Release Gate exactly as approved under ADR-0007 §3 Legal gates.  
6. Package open legal matters — including existing legal pages, UKIPO, and the requirement for one unified legal package — for counsel review.

This document is governance documentation. It is not legal advice. Final determinations of lawfulness, disclosure wording, and contractual sufficiency MUST be made by qualified counsel.

---

## 2. Scope

### 2.1 In scope

This brief covers Sprint P1 Live Conversation MVP processing that is authorised by ADR-0007, including:

- Stateless conversation processing in which the client supplies conversation history on each request (ADR-0007 Decision D2).  
- Generation accessed through an internal provider-agnostic generation interface (ADR-0007 Decision D1).  
- P1 model context limited to validated conversation history, locale, and approved derived astrological context (ADR-0007 Decision D8).  
- The prohibition on transmitting raw birth date, raw birth time, raw birthplace text, or raw geographic coordinates to the generation provider when equivalent derived astrological context can satisfy the approved P1 capability (ADR-0007 Decision D8).  
- Explainability, uncertainty, sources, and decision-classification obligations as they create user-facing representations that privacy and consumer disclosures MUST remain consistent with (ADR-0007 Decisions D9 and D10; Constraint 4a as referenced by ADR-0007).  
- Production-release conditions for any deployment that transmits user birth data, whether raw or derived, to a third-party processor (ADR-0007 §3 Production release gate).

### 2.2 Out of scope

The following remain out of scope for this brief because they are explicitly out of scope for ADR-0007 P1, or because they are not architectural statements of ADR-0007:

- Server-side conversation persistence, persistent memory, Vault integration, previous-conversation retrieval, and previous-decision retrieval (ADR-0007 §4).  
- RAG, vector search, tool calling, MCP, external connectors, and multi-agent orchestration (ADR-0007 §4).  
- Live transit context, expanded decision context, and external real-time signals (ADR-0007 Decision D8 and §4).  
- Streaming transport and provider-selection UI (ADR-0007 §4).  
- Any change from derived context to raw-data disclosure to the generation provider. Such a change requires an ADR amendment and MUST NOT be introduced through a code-only commit (ADR-0007 §3 Revisit trigger).  

Matters that cannot be mapped to ADR-0007 are marked **Requires ADR Amendment** and MUST NOT be treated as authorised P1 architecture.

### 2.3 Authority boundary

Every architectural statement in this brief MUST map to ADR-0007. Legal wording and counsel recommendations MAY refine disclosure and contractual posture without altering the locked contract. If counsel concludes that lawful operation requires a different data-flow, context model, or processor disclosure pattern than ADR-0007 permits, implementation SHALL pause under the Architecture Amendment Gate until an ADR amendment is approved.

---

## 3. Data Flow

### 3.1 Authorised P1 processing path

Under ADR-0007, the authorised Sprint P1 conversation data flow is as follows.

The client sends a `ConversationRequest` containing the conversation history required to process the request, and MAY include locale under the four-value locale definition established by ADR-0006 and adopted by ADR-0007 Decision D7. The field `conversation_id` is optional and reserved for forward compatibility; Sprint P1 server behaviour MUST NOT depend on it (ADR-0007 Decision D6).

The server validates message count, payload size, role values, and content constraints. The server MUST NOT silently truncate, summarize, reorder, or discard conversation messages (ADR-0007 Decision D5). Conversation processing SHALL be stateless. The server MUST NOT persist conversation history, conversation state, or conversational memory (ADR-0007 Decision D2).

Before provider invocation, the backend SHALL calculate or assemble the approved derived astrological context (ADR-0007 Decision D8). The P1 generation context SHALL include only validated conversation history, locale, and approved derived astrological context (ADR-0007 Decision D8).

Conversation generation MUST be accessed through an internal provider-agnostic generation interface. Provider-specific SDKs, request formats, model identifiers, and implementation details MUST remain behind that interface and MUST NOT appear in the public Conversation API contract (ADR-0007 Decision D1).

Successful responses MUST contain the response discriminator (`decision` or `conversational`), required fields for the response type, and a `sources` array. Until EVIDENCE_REGISTRY contains at least one eligible registered evidence source at the approved E2 activation level, `sources` MUST be an empty array (ADR-0007 Decisions D9 and D10).

Provider failures MUST be translated into the standard Conversation API error envelope. The client MUST NOT receive provider names, model identifiers, raw SDK exceptions, raw provider messages, stack traces, secret values, internal prompt content, or provider request or response bodies (ADR-0007 Decision D11).

### 3.2 Personal-data contact points

From a privacy perspective, the P1 path creates the following material contact points with personal data or potentially identifying information:

1. **User-supplied birth and location data within the METIORO-controlled processing boundary**, used to calculate or assemble derived astrological context. Raw birth data MUST remain within the METIORO-controlled processing boundary unless a later approved amendment explicitly permits another handling model (ADR-0007 §3 Selected option).  
2. **Derived astrological context** transmitted to the generation provider as part of the approved P1 generation context (ADR-0007 Decision D8 and Option B).  
3. **Client-supplied conversation history** transmitted to the generation provider as validated conversation history (ADR-0007 Decisions D2, D5, and D8).  
4. **Locale**, which MAY influence response language but MUST NOT create server-side conversation state (ADR-0007 Decision D7).  

Conversation history and derived context may independently or jointly constitute personal data under applicable law. That classification is a counsel determination and is recorded as an open evaluation item in §5 and §12. It does not alter the locked architectural selection of Option B.

### 3.3 Explicit non-flows in P1

The following flows MUST NOT occur under ADR-0007 P1:

- Transmission of raw birth date, raw birth time, raw birthplace text, or raw geographic coordinates to the generation provider when equivalent derived context can satisfy the approved P1 capability (ADR-0007 Decision D8).  
- Injection of persistent memory, Vault content, previous conversation retrieval, previous decision retrieval, live transit context, expanded decision context, external connector data, or vector-retrieved context into generation (ADR-0007 Decision D8).  
- Representation of the absence of server-side persistence as temporary memory or implied continuity (ADR-0007 Decision D2).  

Any product behaviour that requires one of these flows **Requires ADR Amendment**.

---

## 4. Third-Party Processor Assessment

### 4.1 Role of the generation provider

ADR-0007 Decision D1 requires a live conversational experience backed by a production generation engine, accessed through a provider-agnostic internal interface. Initial launch with one provider is an operational fact and is not a normative architectural requirement of ADR-0007.

For privacy and contracting purposes, the generation provider is a third-party processor (or equivalent under applicable law) that receives request content necessary for generation. Under the locked Option B model, that content includes validated conversation history, locale, and approved derived astrological context, and MUST NOT include raw birth identifiers when derived context can satisfy the approved capability (ADR-0007 Decision D8 and §3).

### 4.2 Assessment obligations

Before Production Release Gate clearance, counsel and governance MUST assess, for each generation provider used in production:

1. Whether the provider’s role is correctly characterised as processor, sub-processor, or independent controller under applicable law.  
2. Whether the provider’s data-processing terms permit the intended P1 use, including processing of conversation content and derived astrological features.  
3. Whether the provider’s terms prohibit, permit, or are silent on use of customer content for model training or product improvement.  
4. Whether logging, retention, abuse-monitoring, and support-access practices are compatible with METIORO’s disclosure and minimisation posture.  
5. Whether international transfer mechanisms are required and documented.  
6. Whether contractual confidentiality and security obligations are sufficient for the sensitivity of conversation content and derived features.

Provider names, model identifiers, and SDK details MUST remain outside the public Conversation API contract (ADR-0007 Decisions D1 and D11). This brief therefore assesses the processor category without elevating any specific vendor into the architectural contract.

### 4.3 Containment requirements with legal relevance

ADR-0007 Decision D11 requires that provider names, raw provider messages, internal prompt content, and provider request or response bodies MUST NOT be returned to clients. From a legal-operations perspective, this containment reduces accidental public disclosure of processor internals and prompt content, but it does not by itself satisfy DPA, transfer, or privacy-notice requirements. Those requirements remain independent Production Release Gate conditions.

### 4.4 Finding posture at draft stage

At DRAFTED status, no production DPA package for the P1 generation path is recorded as complete in repository governance. Production deployment that transmits user birth data, whether raw or derived, to a third-party processor SHALL NOT proceed until the Legal Brief has been completed, the required privacy disclosures have been approved, and the applicable data-processing requirements, including the DPA assessment, have been resolved (ADR-0007 §3 Production release gate).

---

## 5. Raw vs Derived Birth Data

### 5.1 Locked selection

Sprint P1 SHALL use Option B — Derived astrological context (ADR-0007 §3 Selected option for Sprint P1).

Raw birth data MUST remain within the METIORO-controlled processing boundary unless a later approved amendment explicitly permits another handling model (ADR-0007 §3).

The generation provider MUST NOT receive raw birth date, raw birth time, raw birthplace text, or raw geographic coordinates when equivalent derived astrological context can satisfy the approved P1 capability (ADR-0007 Decision D8).

### 5.2 Meaning of derived context for legal review

Derived astrological context, as defined in ADR-0007 Appendix A, is a backend-produced representation of approved astrological features that avoids sending unnecessary raw birth data to the generation provider.

Legal review MUST evaluate:

1. The wording required for derived astrological features in privacy notices and related disclosures.  
2. Whether the chosen derived schema remains personal data under applicable law, including where features remain linkable to an identifiable user through account context, request identifiers, or reconstitution risk.  
3. Whether data-minimisation claims made to users accurately reflect Option B rather than implying that no personal data reaches third-party generation.  

ADR-0007 does not decide that derived features are non-personal data. Any product claim that derived context is anonymous, non-personal, or incapable of identifying a user **Requires ADR Amendment** only if architecture is changed to support such a claim; otherwise it is a disclosure-accuracy matter for counsel and MUST NOT be asserted without counsel approval.

### 5.3 Revisit trigger

The raw-versus-derived selection MUST be reviewed after either completion of this Legal Brief or material measured evidence showing that the selected approach cannot meet approved product or performance requirements (ADR-0007 §3 Revisit trigger). A change from derived context to raw-data disclosure requires an ADR amendment and MUST NOT be introduced through a code-only commit.

---

## 6. Privacy Policy Assessment

### 6.1 Existing legal pages

METIORO presently publishes user-facing legal pages, including Privacy Policy, Terms of Service, Cookie-related disclosures, Disclaimer, and Contact surfaces. These pages form part of the existing public legal footprint and MUST be included in the unified legal package described in §11.

At DRAFTED status, the existing Privacy Policy describes collection of birth and location data for analytical outputs and states that information may be shared with infrastructure and service providers who assist in hosting, analytics, authentication, email delivery, and payment processing. It does not, in repository-visible form, specifically and adequately describe:

1. Live conversational generation involving a third-party generation provider.  
2. Transmission of derived astrological context to such a provider.  
3. Client-supplied conversation history being processed by a generation provider.  
4. The distinction between raw birth data retained in the METIORO-controlled boundary and derived features disclosed to the provider under Option B.  
5. Stateless conversation processing and the absence of server-side conversation persistence as a user-facing continuity limitation.  

### 6.2 Normative assessment requirements

Before Production Release Gate clearance, privacy disclosures MUST be reviewed and approved so that they accurately describe the ADR-0007 P1 path. Disclosures MUST NOT:

1. Imply server-side conversational memory or continuity that ADR-0007 Decision D2 prohibits.  
2. Imply that raw birth identifiers are sent to the generation provider where Option B forbids that path.  
3. Imply that derived features are non-personal without counsel determination.  
4. Represent empty `sources` arrays as activated evidence where EVIDENCE_REGISTRY activation has not occurred (ADR-0007 Decision D10).  
5. Contradict Constraint 4a explainability and uncertainty obligations as referenced by ADR-0007 Decisions D9 and D13.

### 6.3 Placeholder and entity completeness

Existing legal pages contain unresolved placeholders for registered company name, registered address, governing jurisdiction, and certain contact identities. Those placeholders MUST be resolved as part of the unified legal package before production reliance on those pages for the P1 generation path. Incomplete controller identity is a Production Release Gate blocker for user-facing privacy compliance readiness.

---

## 7. DPA Assessment

### 7.1 Requirement

ADR-0007 expressly requires DPA status evaluation as part of the Legal Brief and makes resolution of applicable data-processing requirements, including the DPA assessment, a condition of the Production release gate (ADR-0007 §3).

### 7.2 Minimum DPA assessment contents

For each production generation provider and any material sub-processor in the P1 generation path, the DPA assessment SHALL determine:

1. Whether an executed data-processing agreement or equivalent contractual instrument exists.  
2. Whether the agreement covers conversation content and derived astrological context.  
3. Whether instructions, confidentiality, security, breach-notification, deletion, and audit provisions are adequate for P1.  
4. Whether training, retention, and secondary-use clauses are compatible with METIORO’s intended disclosures and product posture.  
5. Whether sub-processor notification and flow-down obligations are addressed.  
6. Whether transfer mechanisms are incorporated where personal data leaves the relevant jurisdiction.

### 7.3 Draft-stage status

At DRAFTED status, completion of the DPA assessment is pending counsel package review. Engineering MAY continue under the Implementation Start gate, but production deployment of the personalisation path that transmits raw or derived birth-related data to a third-party processor SHALL NOT proceed until the DPA assessment has been resolved (ADR-0007 §3).

---

## 8. Retention & Training

### 8.1 METIORO-side retention under ADR-0007

Because conversation processing SHALL be stateless and the server MUST NOT persist conversation history, conversation state, or conversational memory (ADR-0007 Decision D2), P1 MUST NOT rely on server-side conversation stores as a retention mechanism for chat transcripts.

This architectural fact does not eliminate all retention. Account data, birth profile data retained for calculation of derived context, operational logs, security logs, billing records, and support records MAY remain subject to separate retention rules. Those separate retention rules MUST be disclosed accurately and MUST NOT be used to reintroduce prohibited conversational memory under the guise of logging.

If operational logging would retain conversation content or derived context beyond what privacy disclosures and minimisation commitments allow, that practice MUST be redesigned or disclosed before Production Release Gate clearance. Any design that creates server-side conversational memory **Requires ADR Amendment**.

### 8.2 Provider-side retention and training

Counsel MUST determine, for each production generation provider:

1. Whether customer content is retained, for how long, and for what purposes.  
2. Whether customer content may be used to train or improve models.  
3. Whether opt-out, zero-retention, or enterprise no-training controls are available and selected.  
4. Whether METIORO’s public disclosures must state that conversation content or derived features may be processed by a third-party provider under that provider’s retention regime.

Until these determinations are resolved and reflected in approved disclosures and contracts, the Production Release Gate MUST remain closed for the third-party personalisation path.

### 8.3 Evidence and explainability records

ADR-0007 Decision D10 requires a `sources` array on every successful response and prohibits fabrication of user-facing evidence sources. Empty sources pending EVIDENCE_REGISTRY activation do not create a retention obligation for evidence payloads. Activation of non-empty sources requires registry compliance and applicable governance review. Retention of activated evidence artifacts, if any are later introduced, is outside locked P1 architecture unless separately authorised.

---

## 9. International Transfers

### 9.1 Assessment requirement

ADR-0007 requires evaluation of international data transfers where applicable (ADR-0007 §3 Legal Brief evaluation list). P1 generation through a third-party provider may involve cross-border processing of conversation content and derived astrological context.

### 9.2 Normative obligations before production release

Before Production Release Gate clearance, counsel MUST determine:

1. The locations in which METIORO and each generation provider process relevant data.  
2. Whether a restricted transfer arises under UK GDPR, EU GDPR, or other applicable regimes.  
3. Which transfer mechanism applies, such as adequacy, Standard Contractual Clauses, or another lawful mechanism.  
4. Whether transfer language in the Privacy Policy and DPA package accurately reflects the P1 path.  

### 9.3 Draft-stage status

Existing privacy language acknowledges that information may be processed in countries other than the user’s country of residence and refers to safeguards such as Standard Contractual Clauses. That general statement is not by itself a completed transfer assessment for the P1 generation provider path. Provider-specific transfer review remains outstanding.

---

## 10. Production Release Gate

Governance establishes three independent gates. This section records them exactly as approved under ADR-0007 §3 Legal gates, using the approved gate names for Sprint P1 legal governance.

### 10.1 Implementation Start

Engineering MAY begin after ADR-0007 is `LOCKED` and Task Decomposition has been approved. Completion of the Legal Brief is not a prerequisite for implementation.

Status implication at authoring time: ADR-0007 is LOCKED. Implementation Start is therefore available once Task Decomposition approval is confirmed. This Legal Brief being DRAFTED does not block Implementation Start.

### 10.2 Architecture Amendment Gate

If legal review identifies an impact on the locked architectural contract, including data flow, provider terms, or approved context contents, implementation SHALL pause until the required ADR amendment has been approved.

This gate is independent of Implementation Start. Work that does not disturb the locked contract MAY continue. Work that would alter raw-versus-derived handling, public contract semantics, approved context contents, or related locked decisions MUST stop pending amendment.

### 10.3 Production Release Gate

A production deployment that transmits user birth data, whether raw or derived, to a third-party processor SHALL NOT proceed until the Legal Brief has been completed, the required privacy disclosures have been approved, and the applicable data-processing requirements, including the DPA assessment, have been resolved.

Production Release Gate clearance therefore requires, at minimum:

1. This Legal Brief advanced beyond DRAFTED through required review to the lifecycle state mandated by governance for release reliance.  
2. Approved privacy disclosures covering the P1 conversation and derived-context path.  
3. Resolved DPA assessment for the production generation provider path.  
4. Resolved retention, training, and international-transfer determinations necessary for accurate disclosure and lawful processing.  
5. Confirmation that no unresolved Architecture Amendment Gate item remains open for the intended production path.

No other gate may be substituted for Production Release Gate clearance.

---

## 11. Related Open Legal Matters

### 11.1 Existing legal pages

The existing public legal pages — including Privacy Policy, Terms of Service, Cookies, Disclaimer, and Contact — MUST be treated as one inventory for P1 release readiness. They MUST be reviewed as a set so that conversation generation, derived-context disclosure, AI-output limitations, and controller identity are consistent across surfaces.

Material gaps presently include incomplete controller identity placeholders, jurisdiction placeholders, and absence of P1-specific generation-provider disclosure aligned to ADR-0007 Option B.

### 11.2 UKIPO

UKIPO consultation remains pending and is not recorded as completed in repository documentation at authoring time (`docs/MASTER_STATUS.md`, Brand Assets). UKIPO work concerns brand and intellectual-property consultation readiness. It is related to the overall legal package for public launch confidence, but it is not an ADR-0007 architectural dependency and MUST NOT be used to reopen locked conversation architecture.

UKIPO completion status MUST be tracked in the unified legal package. Whether UKIPO consultation is a hard blocker for Production Release Gate clearance is a counsel and release-management determination. It is not an architectural statement of ADR-0007.

### 11.3 One unified legal package

Sprint P1 legal readiness MUST be managed as one unified legal package, not as disconnected page edits. The unified package SHALL include:

1. This Legal Brief and its counsel responses.  
2. Privacy Policy updates for derived-context and conversation generation disclosure.  
3. Terms, Disclaimer, and related user-facing consistency updates.  
4. DPA and provider-terms assessment records.  
5. Retention, training, and international-transfer determinations.  
6. Controller identity and jurisdiction finalisation.  
7. UKIPO consultation status and any brand-IP counsel notes relevant to public launch.  
8. Production Release Gate sign-off record.

The unified package is the authoritative counsel-facing bundle. Fragmented approvals of isolated pages MUST NOT be treated as Production Release Gate clearance.

---

## 12. Findings

1. ADR-0007 is LOCKED and selects Option B derived astrological context. Raw birth data MUST remain in the METIORO-controlled boundary under the locked model.  
2. Implementation Start MAY proceed without completion of this Legal Brief, subject to Task Decomposition approval.  
3. Production deployment of the third-party personalisation path remains blocked until Legal Brief completion, approved privacy disclosures, and resolved DPA and related data-processing requirements are achieved.  
4. Existing legal pages are incomplete for P1 generation-provider disclosure and contain unresolved entity and jurisdiction placeholders.  
5. Derived astrological context reduces raw-identifier disclosure but MAY still constitute personal data; counsel determination is required before any minimisation claim is finalised in user-facing copy.  
6. Stateless conversation processing reduces METIORO-side transcript retention risk but does not eliminate provider-side retention or training risk.  
7. UKIPO consultation remains an open related legal matter and belongs in the unified legal package.  
8. No hidden architecture is authorised by this brief. Any legally required deviation from ADR-0007 data flow or context contents triggers the Architecture Amendment Gate.

---

## 13. Required Amendments

The following items require an ADR amendment if pursued. They are not authorised by ADR-0007 and MUST NOT be implemented as local design choices.

1. Transmission of raw birth date, raw birth time, raw birthplace text, or raw geographic coordinates to the generation provider where derived context can satisfy the approved P1 capability.  
2. Introduction of server-side conversation persistence, conversational memory, Vault-backed conversation context, or implied continuity contrary to Decision D2.  
3. Expansion of P1 generation context to include live transits, previous conversation retrieval, previous decision retrieval, vector-retrieved context, or external connector data.  
4. Public exposure of provider names, model identifiers, or prompt content in client-visible API behaviour contrary to Decisions D1 and D11.  
5. Any reclassification of decision-bearing outputs as merely conversational in order to avoid Constraint 4a explainability requirements.

Legal wording updates, DPA execution, privacy-policy edits, and UKIPO process actions do not themselves require an ADR amendment unless they compel a change to the locked architectural contract.

Where counsel identifies a necessary architectural change not listed above, the item MUST be logged as **Requires ADR Amendment** and routed through the Architecture Amendment Gate.

---

## 14. Counsel Package

The following package MUST be provided to counsel for review of this DRAFTED brief:

1. ADR-0007 — Conversation API Contract v1.0 (LOCKED), with emphasis on Decisions D1, D2, D8, D9, D10, D11, §3 Option B, and Legal gates.  
2. This Legal Brief in full.  
3. Current public legal page texts (Privacy, Terms, Cookies, Disclaimer, Contact).  
4. Provider data-processing terms, retention/training terms, and any draft or executed DPA materials for the intended production generation provider.  
5. Description of derived astrological context categories intended for provider input, without converting this brief into an implementation specification.  
6. Statement of stateless conversation processing and absence of server-side conversation persistence.  
7. UKIPO consultation status summary from current brand-asset governance records.  
8. List of unresolved placeholders for legal entity, address, and governing jurisdiction.  

Counsel is requested to return determinations on:

1. Lawfulness and disclosure adequacy of Option B for P1 production release.  
2. Whether derived features remain personal data in the intended operating context.  
3. Required Privacy Policy and related page amendments.  
4. DPA and transfer readiness.  
5. Retention and training controls required before Production Release Gate clearance.  
6. Whether any Architecture Amendment Gate issue is triggered.  
7. Whether UKIPO or entity-finalisation items are release blockers, advisory items, or parallel-track items.

---

## 15. Approval

| Role | Name | Decision | Date | Signature / record |
|------|------|----------|------|--------------------|
| Documentation Engineer | | DRAFTED prepared | 13 July 2026 | |
| Product Owner | | Pending | | |
| Governance Reviewer | | Pending | | |
| Qualified Counsel | | Pending | | |
| Release Authority | | Pending — Production Release Gate | | |

This document MAY move to `IN REVIEW` when submitted for governance and counsel review. It MUST NOT be relied upon as Production Release Gate clearance while Status remains DRAFTED.

---

## References

1. ADR-0007 — Conversation API Contract v1.0 (LOCKED)  
2. ADR-0006 — Decision API boundary and execution contract (as adopted by ADR-0007 for locale and error-envelope conventions)  
3. Amendment v1.1 — Explainability Model (as referenced by ADR-0007)  
4. Constraint 4a (as referenced by ADR-0007)  
5. EVIDENCE_REGISTRY (as referenced by ADR-0007 Decision D10)  
6. docs/governance/LEGAL_COMPLIANCE_POLICIES.md  
7. docs/MASTER_STATUS.md — Brand Assets / UKIPO consultation status  
8. Existing public legal pages: Privacy Policy, Terms of Service, Cookies, Disclaimer, Contact  

---

## Open Questions

1. Does counsel determine that approved derived astrological features remain personal data in all intended P1 operating contexts?  
2. What exact Privacy Policy wording is required to describe Option B without overstating anonymisation or understating provider processing?  
3. Is an executed DPA with adequate no-training or restricted-training controls available for the intended production generation provider?  
4. Which international transfer mechanism applies to the production generation path, and is existing SCC language sufficient?  
5. Are operational logs retaining conversation content or derived context in a manner that requires disclosure redesign or architectural revisit?  
6. Is UKIPO consultation a hard blocker for Production Release Gate clearance, or a parallel launch-confidence item?  
7. When will registered company name, registered address, and governing jurisdiction placeholders be finalised for the unified legal package?  
8. Has Task Decomposition approval been recorded so that Implementation Start is affirmatively open?

---

## Review Checklist

- [ ] Every architectural statement maps to ADR-0007, or is marked Requires ADR Amendment  
- [ ] Three-stage Release Gate appears exactly as approved: Implementation Start; Architecture Amendment Gate; Production Release Gate  
- [ ] Option B raw-versus-derived model is restated without redefinition  
- [ ] Existing legal pages, UKIPO, and unified legal package are covered under Related Open Legal Matters  
- [ ] DPA, retention/training, and international transfers are assessed as release dependencies  
- [ ] No implementation detail or code guidance is introduced  
- [ ] No hidden architecture is introduced  
- [ ] Status, Purpose, Scope, References, and Approval are present  
- [ ] Normative language uses SHALL / MUST / MUST NOT / MAY consistently  
- [ ] Counsel Package is complete enough for external legal review  

---

## Change Log

| Version | Date | Author role | Change |
|---------|------|-------------|--------|
| 0.1.0 | 13 July 2026 | Documentation Engineer | Initial DRAFTED Legal Brief for Sprint P1 against locked ADR-0007 |

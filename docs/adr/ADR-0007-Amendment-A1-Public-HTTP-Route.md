# ADR-0007 Amendment A1 — Public HTTP Route Clarification

### ADR-0007 Amendment A1

**File**

`docs/adr/ADR-0007-Amendment-A1-Public-HTTP-Route.md`

**Status**

APPROVED TO COMMIT

**Purpose**

Clarify the existing public HTTP binding only.

**Governance Status**

ADR-0007 remains **LOCKED**. Amendment A1 is a **non-architectural clarification** of the existing public HTTP binding. The architecture remains frozen throughout the amendment lifecycle. No architectural capability is added, removed, or modified.

**Authorised contract**

Method

POST

Path

`/api/v1/conversation/execute`

Router relationship

`/api/v1/conversation`

*

`/execute`

Version

Conversation API Contract v1.0

No other architectural decision is changed.

D1–D13 remain unchanged.

Amendment A1 clarifies an existing contract only.

It does not introduce any new capability.

Additional improvements

* Canonical ADR_INDEX row
* Separate Amendment lifecycle
* OpenAPI explicitly non-normative
* Contract verified by contract tests
* Naming rationale: `execute` supersedes the earlier draft path `chat` for parity with the Decision API

---

### OpenAPI status

OpenAPI is generated from implementation and is non-normative; conformance to this contract SHALL be verified by contract tests.

This amendment MUST NOT create a separate OpenAPI governance artifact.

Contract tests SHALL verify:

* the authorised route `POST /api/v1/conversation/execute`
* error-envelope references
* absence of unintended 422 responses
* conformance with ADR-0007 and this Amendment A1

---

## Confirmation — Decisions D1–D13 unchanged

This amendment confirms that all existing ADR-0007 Decisions **D1 through D13 inclusive** remain unchanged, including without limitation:

- D1 Live Conversation MVP / provider-agnostic generation interface  
- D2 Stateless conversation processing  
- D3 Contract schemas  
- D4 Conversation roles  
- D5 History ownership and validation  
- D6 `conversation_id` reservation  
- D7 Locale  
- D8 P1 model context / derived astrological context  
- D9 Response discriminator and explainability  
- D10 Evidence sources  
- D11 Provider error mapping and containment  
- D12 Operational budgets  
- D13 Prompt Governance Specification v1  

No schema field, validation rule, timeout, context rule, provider rule, prompt-governance rule, or error-envelope rule is amended by ADR-0007-A1.

---

## Non-Decisions

This amendment does not decide:

- request_id client-versus-server ownership beyond what ADR-0007 already requires for response and error identification  
- provider selection or provider identity  
- a separate OpenAPI governance artifact; OpenAPI remains non-normative and generated from implementation  
- authentication or authorisation  
- any capability listed in ADR-0007 §4 or §5  

---

## Consequences

### Positive

- P1-T01 and subsequent tasks have an authorised public route for contract-surface implementation.  
- Client, server, tests, and OpenAPI can bind to one locked path.  
- Versioning remains consistent with ADR-0006 `/api/v1/.../execute` convention.

### Costs and constraints

- Alternate paths are not permitted without further amendment.  
- Ratification of this amendment is required before the path may be treated as LOCKED contract text.

---

## Change control

| Change type | Required path |
|-------------|---------------|
| Public Conversation API HTTP method or path | ADR amendment (this class) |
| Any change to ADR-0007 Decisions D1–D13 | Separate ADR amendment; not authorised here |

---

## References

1. ADR-0007 — Conversation API Contract v1.0 (LOCKED)  
2. ADR-0006 — Decision API Contract v1 (`POST /api/v1/decision/execute` versioning precedent)  
3. docs/governance/ADR_INDEX.md  

---

## Approval

| Role | Name | Decision | Date | Signature / record |
|------|------|----------|------|--------------------|
| Documentation Engineer | | APPROVED TO COMMIT | 13 July 2026 | |
| Governance Reviewer | | Pending | | |
| Architecture Authority | | Pending | | |

---

## Open Questions

1. Should ratification of ADR-0007-A1 update the ADR_INDEX status line for ADR-0007 to read `LOCKED + A1` explicitly, while retaining a single canonical LOCKED row for ADR-0007?  

---

## Change Log

| Version | Date | Author role | Change |
|---------|------|-------------|--------|
| 0.1.0 | 13 July 2026 | Documentation Engineer | Initial DRAFTED Amendment A1 — public HTTP route clarification only |
| 0.1.1 | 13 July 2026 | Documentation Engineer | Corrective delta: alternate-path qualification; OpenAPI non-normative + contract-test obligations; execute-vs-chat naming rationale |
| 0.1.2 | 13 July 2026 | Documentation Engineer | Editorial governance correction: Status APPROVED TO COMMIT; non-architectural clarification wording applied exactly |

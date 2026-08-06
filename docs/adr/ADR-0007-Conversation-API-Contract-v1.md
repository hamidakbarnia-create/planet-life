# ADR-0007 — Conversation API Contract v1.0

**Status:** LOCKED
**Scope:** Sprint P1 — Live Conversation MVP
**Normative language:** `MUST`, `MUST NOT`, `SHALL`, `SHALL NOT`, `MAY`

## 1. Context

The architectural design phase for Sprint P1 has been completed. Governance review and ratification have been completed for this version, while implementation remains subject to the locked contract and approved Task Decomposition.

ADR-0006 established the versioned Decision API boundary, including validation, request identification, execution budgets, serialization, standard error envelopes, HTTP tests and OpenAPI publication.

Sprint P1 introduces METIORO’s first live conversational capability. Its objective is not merely to establish another boundary. It SHALL deliver a usable Live Conversation MVP backed by a live generation engine while preventing conversation-platform scope from expanding into memory, tools, retrieval, persistence or multi-agent orchestration.

The repository does not currently provide complete server-side conversation persistence. Persistent memory and Vault integration remain outside the approved P1 scope. Conversation processing therefore requires a stateless contract in which the client supplies the relevant history on each request.

This ADR is governed by:

* ADR-0006 and its existing API-boundary conventions
* Amendment v1.1 Explainability Model
* Constraint 4a
* EVIDENCE_REGISTRY
* locked METIORO brand constraints
* the P1 Architecture Decision Freeze

This ADR SHALL NOT establish decisions outside the frozen P1 decision set.

---

## 2. Decisions

### D1. Sprint outcome: Live Conversation MVP

Sprint P1 SHALL deliver a live conversational experience backed by a production generation engine.

Conversation generation MUST be accessed through an internal provider-agnostic generation interface.

Provider-specific SDKs, request formats, model identifiers and implementation details MUST remain behind that interface and MUST NOT appear in the public Conversation API contract.

Initial launch with one provider is an operational fact and is not a normative architectural requirement of this ADR.

---

### D2. Stateless conversation processing

Conversation processing SHALL be stateless in Sprint P1.

The server MUST NOT persist conversation history, conversation state or conversational memory.

The client MUST send the conversation history required to process each request.

Absence of server-side persistence MUST NOT be represented to clients as temporary memory or implied continuity.

---

### D3. Contract schemas

The Conversation API v1.0 contract SHALL define the following public schemas:

* `ConversationRequest`
* `ConversationMessage`
* `ConversationResponse`
* the standard Conversation API error envelope

`ConversationMessage` MUST require:

* `role`
* `content`

The following fields MAY be reserved as optional extension fields:

* `id`
* `timestamp`
* `metadata`

Reserved extension fields MUST NOT change P1 processing semantics.

---

### D4. Conversation roles

In Sprint P1, `ConversationMessage.role` MUST accept only:

* `user`
* `assistant`

The public API MUST reject unsupported roles through the standard validation error envelope.

The roles `system`, `tool`, `developer`, `memory` and any provider-specific role are not valid P1 public inputs.

Future support for additional roles requires a contract amendment.

---

### D5. Conversation history ownership and validation

The client SHALL own conversation-history truncation.

The server MUST independently validate:

* total message count
* total request payload size
* individual message validity
* accepted role values
* required content constraints

The server MUST NOT silently truncate, summarize, reorder or discard conversation messages.

A request exceeding a contractual ceiling MUST be rejected through the existing standard validation error envelope using:

* HTTP `400`
* error code `VALIDATION_ERROR`
* a request identifier
* no provider-specific details

The Conversation API SHALL preserve the established product-wide error-envelope convention rather than introducing a separate `413` response shape.

---

### D6. Conversation identifier

`conversation_id` SHALL be reserved for forward compatibility.

The field MUST be optional in `ConversationRequest`.

Sprint P1 clients MUST NOT be required to send it.

Sprint P1 server behavior MUST NOT depend on it.

Its absence MUST be the normal P1 request form. Clients MUST NOT be required to send `"conversation_id": null`.

---

### D7. Locale

`ConversationRequest.locale` MUST use the same four-value locale definition established by ADR-0006.

Conversation API locale handling MUST NOT introduce a second locale model or an incompatible locale enumeration.

Locale MAY influence response language, but MUST NOT create server-side conversation state.

---

### D8. P1 model context

The P1 generation context SHALL include only:

* validated conversation history
* locale
* approved derived astrological context

The generation provider MUST NOT receive raw birth date, raw birth time, raw birthplace text or raw geographic coordinates when equivalent derived astrological context can satisfy the approved P1 capability.

The backend SHALL calculate or assemble the approved derived context before provider invocation.

The following contexts are explicitly excluded from P1:

* persistent memory
* Vault content
* previous conversation retrieval
* previous decision retrieval
* live transit context
* expanded decision context
* external connector data
* vector-retrieved context

---

### D9. Response discriminator and explainability

Every successful `ConversationResponse` MUST contain:

```json
{
  "type": "decision | conversational"
}
```

The discriminator MUST be present and non-null.

#### D9.1. Decision classification rule

A response MUST be classified as `decision` when it contains any of the following:

* a recommendation
* advice about whether to act or not act
* comparative preference between actions
* a score or ranked assessment
* timing guidance
* a claimed favourable or unfavourable period
* a decision-relevant interpretation intended to influence user action

A response MUST NOT be classified as merely `conversational` in order to avoid the explainability requirements of Constraint 4a.

Contract tests MUST reject or fail any decision-bearing response that is emitted without the `decision` discriminator and its required explainability fields.

#### D9.2. Decision responses

A `decision` response MUST contain:

* `message`
* `reasoning`
* `uncertainty`
* `sources`
* `request_id`

`reasoning` MUST be present and non-null.

`uncertainty` MUST be present and non-null.

The response MUST use probabilistic and non-deterministic language where certainty is not supported.

#### D9.3. Conversational responses

A `conversational` response MUST contain:

* `message`
* `sources`
* `request_id`

It MAY omit decision-only explainability fields where no recommendation, score, timing guidance or decision signal is present.

Clarification requests, greetings and neutral conversational continuations MAY be classified as `conversational` only when they carry no decision signal.

---

### D10. Evidence sources

Every successful response MUST contain a `sources` array.

Until EVIDENCE_REGISTRY contains at least one eligible registered evidence source at the approved E2 activation level, the API MUST return:

```json
{
  "sources": []
}
```

The system MUST NOT fabricate, infer or display user-facing evidence sources that are not activated through EVIDENCE_REGISTRY.

Activation of non-empty `sources` requires compliance with the registry’s approved activation policy and the applicable governance review.

---

### D11. Provider error mapping and containment

Provider failure, timeout, rate limiting, malformed output and unavailable-service conditions MUST be translated into the standard Conversation API error envelope.

The client MUST NOT receive:

* provider names
* provider model identifiers
* raw SDK exceptions
* raw provider messages
* stack traces
* secret values
* internal prompt content
* provider request or response bodies

Provider-specific errors MUST be mapped to stable product-owned error codes.

The public error contract MUST remain provider-agnostic.

Retry behaviour, when implemented, MUST remain bounded by the contractual timeout and MUST NOT extend execution beyond the hard ceiling.

This ADR does not establish client-visible idempotency or an unrestricted retry contract.

---

### D12. Operational budgets

Operational budgets are contractual protection limits, not claims of measured production performance.

The initial hard ceilings are:

| Budget                    | Hard contractual ceiling | Rationale                                                                                                |
| ------------------------- | -----------------------: | -------------------------------------------------------------------------------------------------------- |
| Conversation messages     |              20 messages | Supports a useful short multi-turn session while preventing unbounded client-supplied history            |
| Request payload           |                   32 KiB | Provides bounded textual context while limiting parsing, logging and provider-input exposure             |
| End-to-end server timeout |               30 seconds | Allows bounded non-streaming live generation without treating provider execution as an unbounded request |

The operational profile MAY impose stricter limits, including fewer messages, a smaller payload or a shorter timeout.

The operational profile MUST NOT exceed any hard contractual ceiling.

Increasing a hard ceiling requires an ADR amendment.

Reducing an operational limit within the hard ceiling does not require an ADR amendment, but MUST remain documented and observable.

The 30-second timeout is a hard termination ceiling and MUST NOT be presented as a latency target or service-level claim.

Operational review SHOULD evaluate:

* measured P95 and P99 generation latency
* target model-class latency
* provider timeout behaviour
* mobile-network conditions in principal markets
* real schema payload distribution
* cost per request
* cancellation effectiveness

Measured evidence MAY justify stricter operational settings. It MUST NOT silently relax the contractual ceilings.

---

### D13. Prompt Governance Specification v1

Prompt behaviour SHALL be governed through a separate artifact named:

**Prompt Governance Specification v1**

Changes to governed prompt behaviour MUST NOT be treated as ordinary implementation details.

The specification SHALL contain two normatively separated layers.

#### D13.1. Governance Core

The Governance Core SHALL be independently reviewable and lockable.

It MUST define:

* Constraint 4a implementation requirements
* decision/conversational classification instructions
* explainability requirements
* uncertainty disclosure
* prohibited deterministic claims
* prohibition of guaranteed future outcomes
* safety boundaries
* response structure
* prompt assembly rules
* approved context injection rules
* handling of unsupported requests
* provider-output validation requirements
* prohibition of mystical product language

The prohibition of mystical language is a locked METIORO brand constraint and therefore belongs in Governance Core rather than the pending Voice Layer.

Changes to Governance Core require governance review and a registered amendment.

#### D13.2. Brand Voice Layer

The Brand Voice Layer SHALL carry the header:

**Status: PENDING — blocked on brand reconciliation**

Until brand reconciliation is closed, generated and placeholder conversation copy MUST use a neutral-professional tone.

Brand-neutral placeholder copy MUST be identified as provisional in the relevant tests or fixtures and MUST NOT be represented as final product voice.

The pending Voice Layer MUST NOT weaken, override or bypass Governance Core.

Closing brand reconciliation is the revisit trigger for completing the Brand Voice Layer.

Completion or material modification of the Voice Layer requires a registered amendment and MUST NOT occur as an unreviewed code-only change.

---

## 3. Options Considered — Birth Context Processing

### Option A — Raw birth data supplied to the generation provider

Under this option, the provider receives data such as:

* birth date
* birth time
* birthplace
* geographic coordinates

#### Advantages

* simpler initial prompt assembly
* less backend transformation
* direct access to source profile data

#### Disadvantages

* greater third-party disclosure
* broader privacy-policy implications
* increased legal and data-processing review
* greater exposure if prompt or provider logging fails
* weaker data-minimisation posture

---

### Option B — Derived astrological context supplied to the generation provider

Under this option, the backend derives the approved astrological context and sends only the features needed for generation.

Examples may include structured astronomical or astrological placements rather than raw birth identifiers.

#### Advantages

* materially reduces raw personal-data disclosure
* aligns with data-minimisation principles
* reduces unnecessary provider exposure
* preserves product-specific personalisation
* aligns with existing backend ephemeris capability
* supports stronger prompt leak containment

#### Disadvantages

* adds backend computation or context-assembly work
* requires a governed derived-context schema
* increases prompt-assembly complexity
* may require performance profiling

---

### Selected option for Sprint P1

Sprint P1 SHALL use **Option B — Derived astrological context**.

Raw birth data MUST remain within the METIORO-controlled processing boundary unless a later approved amendment explicitly permits another handling model.

The Legal Brief MUST evaluate:

* third-party processing disclosure
* the provider’s data-processing terms
* DPA status
* retention and training controls
* international data transfers where applicable
* the wording required for derived astrological features
* whether the chosen derived schema remains personal data under applicable law

### Legal gates

Governance establishes three independent gates:

#### Implementation start

Engineering MAY begin after ADR-0007 is `LOCKED` and Task Decomposition has been approved. Completion of the Legal Brief is not a prerequisite for implementation.

#### Architectural impact

If legal review identifies an impact on the locked architectural contract, including data flow, provider terms or approved context contents, implementation SHALL pause until the required ADR amendment has been approved.

#### Production release

A production deployment that transmits user birth data, whether raw or derived, to a third-party processor SHALL NOT proceed until the Legal Brief has been completed, the required privacy disclosures have been approved, and the applicable data-processing requirements, including the DPA assessment, have been resolved.

### Revisit trigger

This selection MUST be reviewed after either:

* completion of the Legal Brief, or
* material measured evidence showing that the selected approach cannot meet the approved product or performance requirements

A change from derived context to raw-data disclosure requires an ADR amendment and MUST NOT be introduced through a code-only commit.

---

## 4. Explicitly Out of Scope

### Transport and interaction

* streaming responses
* WebSocket or event-stream transport
* partial-token delivery
* conversation title generation

### Persistence and memory

* server-side conversation persistence
* persistent conversation memory
* automatic conversation summarisation
* Vault integration
* previous-conversation retrieval
* previous-decision retrieval

### Retrieval and tools

* RAG
* vector search
* tool calling
* MCP
* external connectors
* provider-exposed tools

### Orchestration

* multi-agent orchestration
* agent delegation
* autonomous background actions

### Context expansion

* live transits
* expanded decision context
* external real-time signals
* user preference memory

### Provider operations

* provider-selection UI
* runtime user choice of provider
* multi-provider routing as a public capability

---

## 5. Forward Compatibility

The v1.0 contract reserves future evolution paths for:

* `conversation_id`
* conversation persistence
* persistent memory
* `system` and `tool` roles
* extended message metadata
* evidence providers
* streaming transport
* decision context
* live-transit context
* external tools and connectors
* provider-routing strategies

Reserved capability does not authorise P1 implementation.

Future activation requires the applicable contract, governance, privacy and architecture reviews.

---

## 6. Decision ownership and change control

### Artifact lifecycle

Governance artifacts SHALL progress only through the following lifecycle states:

`DRAFTED → IN REVIEW → RATIFIED → LOCKED`

Status reports MUST use these lifecycle states consistently and MUST NOT represent an artifact as `RATIFIED` or `LOCKED` before the corresponding governance step has been completed.

| Change type                                        | Required governance path                                            |
| -------------------------------------------------- | ------------------------------------------------------------------- |
| Public Conversation API contract                   | ADR amendment                                                       |
| Public schema or role expansion                    | ADR amendment                                                       |
| Decision-classification rule                       | ADR amendment + Constraint 4a review                                |
| Explainability requirements                        | ADR amendment + governance review                                   |
| Hard operational ceiling                           | ADR amendment                                                       |
| Operational profile within hard ceilings           | Documented operational change                                       |
| Provider implementation behind unchanged interface | No ADR amendment                                                    |
| Provider-agnostic interface contract               | ADR amendment                                                       |
| Prompt Governance Core                             | Governance review + registered amendment                            |
| Brand Voice Layer completion                       | Brand reconciliation + registered amendment                         |
| Raw-versus-derived context selection               | ADR amendment                                                       |
| Legal wording                                      | Legal review                                                        |
| Evidence-source activation                         | EVIDENCE_REGISTRY activation process + applicable governance review |

Implementation MUST NOT reinterpret a governed change as a local code detail in order to bypass this table.

---

## 7. Consequences

### Positive consequences

* P1 delivers real user value rather than a placeholder-only boundary.
* Conversation processing remains stateless and bounded.
* Provider implementation can change without changing the public API.
* Raw birth data is minimised before third-party generation.
* Explainability requirements are tied to an explicit response classifier.
* Evidence-source claims cannot activate without registry approval.
* Prompt behaviour becomes a governed artifact rather than hidden application logic.
* Future capabilities have reserved extension paths without being pulled into P1.

### Costs and constraints

* The backend must maintain a provider-agnostic generation interface.
* Derived-context assembly introduces implementation and testing work.
* Prompt changes require governance discipline.
* Non-streaming generation must remain within the hard timeout.
* Client applications must manage history truncation.
* The Legal Brief remains a production-release dependency for the approved personalisation path.

---

## 8. Review criteria

Review of this ADR SHALL evaluate only:

### A. Normative correctness

* mandatory requirements use explicit normative language
* normative clauses contain no ambiguous terms such as “usually”, “preferably” or “where convenient”
* optional behaviour is explicitly marked as optional
* operational facts are not misrepresented as architectural requirements

### B. Decision mapping

Every normative clause MUST map to at least one of:

* the frozen P1 owner decisions
* ADR-0006
* Amendment v1.1
* Constraint 4a
* EVIDENCE_REGISTRY
* locked METIORO brand constraints
* an approved governance artifact

Any normative clause that cannot be mapped to an approved source MUST be rejected as an unauthorised architectural decision.

---

## 9. References

1. ADR-0006 — Decision API boundary and execution contract
2. Amendment v1.1 — Explainability Model
3. Constraint 4a
4. EVIDENCE_REGISTRY
5. P1 Architecture Decision Freeze
6. Locked METIORO brand constraints
7. ADR-0007 Amendment A1 — Public HTTP Route Clarification (APPROVED TO COMMIT): [ADR-0007-Amendment-A1-Public-HTTP-Route.md](./ADR-0007-Amendment-A1-Public-HTTP-Route.md)

---

## 10. Amendments registry

| Amendment | Title | Status | Effect on D1–D13 |
|-----------|-------|--------|------------------|
| ADR-0007-A1 | Public HTTP Route Clarification (method/path/versioning) | APPROVED TO COMMIT | None — route binding clarification only; A1 has its own lifecycle |

Amendments listed here refine contract publication details. ADR-0007 remains LOCKED. A1 MUST NOT be represented as RATIFIED or LOCKED before approval and commit. Amendments MUST NOT be read as silently modifying Decisions D1–D13 unless an amendment explicitly states such a modification.

---

## Appendix A — Terminology

**Conversation**
A stateless request containing the client-supplied message history and approved P1 context.

**ConversationMessage**
A public contract item containing a supported role and textual content, with optional reserved metadata fields.

**Decision response**
A response containing recommendation, advice, scoring, ranking, timing guidance or another decision-relevant signal.

**Conversational response**
A response without a decision signal, such as a greeting, clarification request or neutral continuation.

**Derived astrological context**
A backend-produced representation of approved astrological features that avoids sending unnecessary raw birth data to the generation provider.

**Hard contractual ceiling**
A maximum bound defined by this ADR that an operational setting MUST NOT exceed.

**Operational profile**
A deployment configuration that MAY be stricter than the hard contractual ceiling.

**Provider-agnostic interface**
The internal generation boundary through which the application invokes a provider without exposing provider-specific semantics in the public contract.

**Prompt Governance Core**
The governed safety, explainability, classification, prompt-assembly and prohibited-claim rules that apply independently of unresolved brand voice.

**Brand Voice Layer**
The governed product-language and tonal layer that remains pending until brand reconciliation is closed.

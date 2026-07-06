# METIORO Decision Intelligence Engine — Architecture Specification

> Status: Draft

**Version:** 1.0.0

**Authority:** This document derives from [METIORO Constitution](../governance/METIORO_CONSTITUTION.md), [Trust Architecture](../governance/TRUST_ARCHITECTURE.md), and [Brand Identity Standard](../governance/BRAND_IDENTITY_STANDARD.md).

**Document type:** Canonical architecture specification — conceptual only.

**Purpose:** Define the single authoritative conceptual model of the METIORO Decision Intelligence Engine. Every future engineering design, ADR, API contract, implementation, and product module must derive from this specification.

**Scope:** Concepts, responsibilities, boundaries, relationships, and invariants of the Decision Intelligence Engine. This document does not prescribe technology, interfaces, algorithms, data structures, deployment, or operational procedures.

**Date:** July 2026

---

## 1. Canonical Authority

### 1.1 Single Source of Truth

This document is the **sole authoritative conceptual specification** of the Decision Intelligence Engine.

When any downstream artifact — engineering standard, ADR, API design, module specification, scoring methodology, or UX pattern — describes how METIORO forms, evaluates, or explains decision guidance, it must be **derivable from** this specification and must not contradict it.

If conflict arises between this document and a lower-level artifact, this document prevails until this specification is formally revised through governance review.

### 1.2 Relationship to Platform Architecture

The [Phase 3 Architecture Blueprint](./PHASE3_ARCHITECTURE_BLUEPRINT.md) defines the long-term platform vision — layers, modules, frameworks, and evolution principles. That blueprint **introduces** the Decision Intelligence Engine within the broader platform.

**This document owns the engine.** Platform-level documents may summarize the engine's role but must not redefine its concepts, responsibilities, or boundaries. Detailed engine semantics live here exclusively.

### 1.3 What This Document Is Not

| This document is | This document is not |
|------------------|----------------------|
| A conceptual specification | An engineering implementation guide |
| A definition of responsibilities | An API or schema definition |
| A glossary of engine concepts | A scoring or calculation methodology |
| A boundary and invariant declaration | A product feature specification |
| A derivation authority for downstream work | An operational runbook or deployment guide |

Implementation details belong in Engineering Standards, ADRs, and module-specific designs — all of which must conform to this specification.

---

## 2. Constitutional Alignment

The Decision Intelligence Engine exists to fulfill METIORO's constitutional mission: help people make better personal decisions through structured, explainable intelligence.

The engine is bound by the following non-negotiable commitments:

| Commitment | Engine Obligation |
|------------|-------------------|
| **Personal Decision Intelligence** (DEC-0001) | All engine outputs serve decision support — not entertainment, passive content, or prophecy |
| **Recommend; user decides** (Constitution §1.4, §2.3) | The engine produces advisory guidance; it never claims decision authority |
| **Trust Before Intelligence** (Constitution §3.1) | Capabilities that cannot meet trust requirements must not enter engine behavior |
| **Explainability Before Accuracy Claims** (Constitution §3.2) | Explanation capability is mandatory for decision-bearing outputs |
| **Evidence Before Opinion** (Constitution §3.3) | Recommendations must be grounded in registered, traceable evidence |
| **Scientific Integrity** (Constitution §3.6) | Uncertainty and methodological limits must be surfaced, not concealed |
| **Human-Centered Decisions** (Constitution §3.5) | User agency is preserved at every stage of the decision pathway |
| **Never Mystical** (DEC-0004) | Engine outputs must not be framed as fate, divination, or supernatural knowledge |

The engine must never produce outputs that reposition METIORO as fortune telling, deterministic prediction, entertainment astrology, or mystical guidance.

---

## 3. Definition

### 3.1 What the Decision Intelligence Engine Is

The **Decision Intelligence Engine** is METIORO's central conceptual orchestrator for decision support.

It is the single decision pathway through which registered evidence becomes evaluated, explainable, advisory guidance for the user. It coordinates the transformation from **decision intent** and **contributed evidence** into **recommendations the user may accept, modify, or reject**.

The engine **supports** decision-making. It does **not** decide on behalf of the user.

### 3.2 What the Decision Intelligence Engine Is Not

The engine is not:

- A user interface or presentation system
- A data store or profile manager
- An evidence framework or analytical calculator
- An AI model or vendor-specific technology
- A human expert or professional advisor
- A prediction engine asserting knowledge of future outcomes
- A parallel decision system that modules may bypass

These domains belong to other architectural actors. The engine orchestrates among them; it does not absorb their responsibilities.

### 3.3 The One Engine Principle

METIORO operates through **one** Decision Intelligence Engine.

There is one decision pathway for all product modules and all evidence frameworks. Modules do not own independent recommendation logic. Frameworks do not deliver final guidance independently. Parallel or competing decision systems within METIORO are architecturally prohibited.

---

## 4. Architectural Position

### 4.1 Platform Layer

The Decision Intelligence Engine resides conceptually in the **Decision Layer** — the platform layer responsible for orchestrating the path from evidence to recommendation.

```
Experience Layer          ← presents engine outputs; does not decide
    ↓
Decision Layer            ← hosts the Decision Intelligence Engine
    ↓
Intelligence Layer        ← supports synthesis and explanation; subordinate to engine
    ↓
Evidence Layer            ← produces evidence; does not recommend
    ↓
Data Layer                ← holds context; does not interpret
    ↓
Infrastructure Layer      ← enables operation; does not define semantics
```

### 4.2 Cross-Cutting Constraints

[Trust Architecture](../governance/TRUST_ARCHITECTURE.md) constrains the engine across all operations. Trust is not a stage in the decision pathway — it is a permanent requirement on every engine responsibility.

The engine must satisfy trust principles — transparency, explainability, evidence, user agency, consistency, scientific integrity, privacy, and accountability — in all decision-bearing behavior.

### 4.3 Actor Relationships

The engine interacts conceptually with the following architectural actors:

| Actor | Relationship to Engine |
|-------|--------------------------|
| **Product Module** | Initiates a decision request with declared intent and scope; receives engine output for presentation |
| **Evidence Framework** | Contributes registered evidence artifacts; does not form recommendations |
| **Intelligence Capability** | Supports evaluation synthesis and explanation generation under engine coordination; subordinate to engine authority |
| **User Context** | Supplies decision-relevant personal and situational premises assembled by the engine |
| **Human Expert** | May augment interpretation layered on engine output; does not replace engine orchestration |
| **Experience Layer** | Presents recommendations and explanations; does not alter decision logic |
| **Feedback Channel** | Returns user response and outcome context for calibration; does not automate future decisions |

---

## 5. Core Concepts

The following terms constitute the canonical vocabulary of the Decision Intelligence Engine. Downstream documents must use these concepts consistently or explicitly map their terminology to them.

### 5.1 Decision Request

A **Decision Request** is the engine's entry point — a structured declaration that decision support is needed.

A Decision Request carries at minimum:

- **Module origin** — which product module initiated the request
- **Decision intent** — what kind of decision support is sought
- **Decision scope** — the boundaries of the question, time horizon, or domain
- **Context references** — pointers to user context required for evaluation

A Decision Request is not a user interface event. It is the conceptual contract by which modules invoke the single decision pathway.

### 5.2 Decision Context

**Decision Context** is the assembled set of premises under which the engine evaluates evidence.

Decision Context includes:

- **User context** — personal, preferential, and historical premises relevant to the request
- **Temporal scope** — the time window or moment relevant to the decision
- **Situational scope** — domain, relationship, or activity framing declared by the module
- **Module intent** — the module's declared purpose for this request, constraining evaluation emphasis

Decision Context is assembled by the engine. It does not interpret raw data — it binds context supplied by the Data Layer and declared by the module into an evaluable premise set.

### 5.3 Evidence Artifact

An **Evidence Artifact** is structured, traceable output from a registered evidence framework.

Evidence Artifacts carry:

- **Framework identity** — which registered framework produced the artifact
- **Evidential claims** — structured assertions supported by the framework's methodology
- **Traceability** — linkage to the registered evidence source
- **Declared limits** — known gaps, assumptions, or boundaries of the artifact

Only evidence registered in the [Evidence Registry](../governance/EVIDENCE_REGISTRY.md) at approved quality levels may support decision-bearing recommendations. Unregistered or provisional evidence must not substantiate user-facing guidance.

Evidence reaches the engine through the [Evidence Pipeline](./EVIDENCE_PIPELINE_SPECIFICATION.md) as **Evidence Bundles** prepared by the pipeline lifecycle. Pipeline semantics — collection, validation, normalization, context attachment, and evidence-level evaluation — are defined exclusively in that specification.

### 5.4 Evidence Intake

**Evidence Intake** is the engine's acceptance and validation of contributed Evidence Artifacts.

Intake confirms that contributed evidence is registered, scoped to the Decision Request, and eligible for evaluation. Intake does not perform framework calculations — it governs what evidence may enter evaluation.

### 5.5 Evaluation

**Evaluation** is the engine's decision-relevant assessment of contributed evidence against assembled Decision Context.

Evaluation:

- Synthesizes across multiple Evidence Artifacts when present
- Weighs evidence relative to Decision Context and module intent
- Identifies agreement, tension, and gaps among contributed evidence
- Does not suppress dissenting evidence without disclosure

Evaluation produces an **Evaluation Result** — an internal conceptual outcome describing the assessed decision landscape. Evaluation is not recommendation; it precedes recommendation formation.

### 5.6 Recommendation

A **Recommendation** is the engine's advisory guidance output.

A Recommendation:

- Expresses structured guidance the user may accept, modify, or reject
- Is advisory — not a command, prediction, or fate declaration
- Reflects the Evaluation Result without concealing uncertainty
- Is scoped to the Decision Request's intent and boundaries

Recommendations must never be presented — by the engine or by any downstream presenter — as deterministic knowledge of what will happen or as compulsory instruction.

### 5.7 Explanation

An **Explanation** is the reasoning dimension attached to a Recommendation.

Every decision-bearing Recommendation must be capable of supporting an Explanation that answers:

| Dimension | Question |
|-----------|----------|
| **Why** | What reasoning led to this guidance? |
| **Evidence basis** | What registered evidence supports it? |
| **Assumptions** | What premises or contextual conditions were applied? |
| **Uncertainty** | What limits, gaps, or confidence boundaries apply? |

Explanation is co-produced with Recommendation — not generated as an optional afterthought. Opaque recommendations are architecturally prohibited.

> **Canonical specification:** The authoritative conceptual model — explainability flow, explanation components, trust requirements, and AI boundaries — is defined exclusively in [EXPLAINABILITY_ENGINE_SPECIFICATION.md](./EXPLAINABILITY_ENGINE_SPECIFICATION.md). This section defines the engine-level obligation; detailed explainability semantics live in that document.

### 5.8 Uncertainty

**Uncertainty** is the explicit acknowledgment of limits on evidence, evaluation, or recommendation confidence.

The engine must surface uncertainty when:

- Evidence is incomplete or conflicting
- Methodological limits constrain what can be asserted
- Decision scope exceeds what contributed evidence supports
- Confidence boundaries material to the user's decision exist

Concealing uncertainty to strengthen a recommendation is a constitutional and trust violation.

### 5.9 Decision Outcome Package

A **Decision Outcome Package** is the complete conceptual output of a single engine invocation.

It comprises:

- The **Recommendation**
- The **Explanation** (or explanation capability)
- **Uncertainty disclosures** where material
- **Evidence traceability** sufficient for governance and user review
- **Provenance** linking output to Decision Request, context, and contributing frameworks

The Experience Layer presents the Decision Outcome Package. It does not re-evaluate or re-recommend.

### 5.10 Feedback Signal

A **Feedback Signal** is user or outcome context returned after a Decision Outcome Package is delivered.

Feedback may include user acceptance, override, dismissal, or post-decision outcome context. Feedback informs calibration and improvement — it does not automate future decisions for the user and must not compromise user agency or privacy.

---

## 6. The Decision Pathway

The Decision Pathway is the single conceptual flow through which all METIORO decision support passes. It describes **what happens conceptually** — not how it is implemented.

```
Decision Request
    ↓
Context Assembly
    ↓
Evidence Intake
    ↓
Evaluation
    ↓
Recommendation Formation
    ↓
Explainability Assembly
    ↓
Decision Outcome Package
    ↓
Feedback (optional, post-delivery)
```

### 6.1 Stage Responsibilities

| Stage | Engine Responsibility |
|-------|----------------------|
| **Decision Request** | Accept a valid request from a product module through the single entry pathway |
| **Context Assembly** | Bind user context, temporal scope, situational scope, and module intent into Decision Context |
| **Evidence Intake** | Accept only registered, request-scoped Evidence Artifacts |
| **Evaluation** | Assess evidence against Decision Context; identify synthesis, tension, and gaps |
| **Recommendation Formation** | Produce advisory guidance reflecting evaluation — not prediction or command |
| **Explainability Assembly** | Ensure Explanation capability exists in Decision Outcome; hand off to Explainability Engine for Explanation Package assembly |
| **Decision Outcome Package** | Deliver the complete output with uncertainty and traceability |
| **Feedback** | Accept Feedback Signals for calibration without automating user decisions |

No product module may skip, duplicate, or substitute any stage with independent logic.

### 6.2 Pathway Invariants

The following invariants hold at every stage:

1. **Advisory only** — no stage may assert decision authority over the user
2. **Evidence-governed** — no stage may rely on unregistered evidence for decision-bearing claims
3. **Explainable** — no stage may produce opaque decision-bearing output
4. **Uncertainty-honest** — no stage may conceal material limits to strengthen output
5. **Traceable** — every stage must preserve provenance for governance review

---

## 7. Engine Responsibilities

The Decision Intelligence Engine owns the following permanent responsibilities. These are conceptual obligations — not implementation tasks.

### 7.1 Orchestration

Coordinate the full Decision Pathway from request to Decision Outcome Package. Ensure all product modules and evidence frameworks participate through this single pathway.

### 7.2 Context Assembly

Combine Decision Request parameters with relevant user context into a coherent Decision Context suitable for evaluation. Context assembly must respect privacy, consent, and purpose limitation.

### 7.3 Evidence Governance

Accept only registered Evidence Artifacts. Reject or exclude evidence that is unregistered, out of scope, deprecated, or insufficient for the declared Decision Request. Enforce the Evidence Registry's quality requirements at the intake boundary.

### 7.4 Multi-Framework Evaluation

Evaluate contributed evidence from one or more frameworks against assembled Decision Context. Synthesize across frameworks without allowing any single framework to define platform identity or bypass governance.

When evidence conflicts, the engine must disclose tension — not silently suppress minority or dissenting evidence.

### 7.5 Recommendation Formation

Transform Evaluation Results into structured advisory Recommendations. Recommendations must reflect evaluation faithfully, remain within Decision Request scope, and preserve user agency.

### 7.6 Explainability Assurance

Ensure every decision-bearing Recommendation is accompanied by Explanation capability meeting all four required dimensions (Why, Evidence basis, Assumptions, Uncertainty). Explainability is an engine obligation — not an optional presentation feature.

### 7.7 Uncertainty Disclosure

Identify and surface material uncertainty at every stage where limits affect the user's decision. Uncertainty disclosure is mandatory when confidence boundaries are material — not discretionary.

### 7.8 Module Coordination

Serve all product modules through the same Decision Pathway. Module diversity affects Decision Request parameters and presentation — not independent decision logic.

### 7.9 Intelligence Coordination

When Intelligence Layer capabilities support evaluation synthesis or explanation generation, the engine coordinates their use. Intelligence capabilities remain subordinate — they do not override engine orchestration or claim decision authority.

### 7.10 Provenance Preservation

Maintain sufficient traceability from Decision Outcome Package back to Decision Request, Decision Context, contributing Evidence Artifacts, and evaluation reasoning — for user review and governance audit.

### 7.11 Feedback Integration

Accept Feedback Signals for system calibration and quality improvement. Feedback informs the engine's learning context — it does not remove user authority over subsequent decisions.

---

## 8. Non-Responsibilities

The following are **explicitly outside** the Decision Intelligence Engine. Assigning these responsibilities to the engine violates this specification.

| Domain | Owner | Engine Boundary |
|--------|-------|-----------------|
| **User interface and presentation** | Experience Layer | Engine delivers Decision Outcome Packages; it does not render or phrase them for users |
| **Raw data storage and retrieval** | Data Layer | Engine consumes context references; it does not own persistence |
| **Framework calculation and methodology** | Evidence Layer / Frameworks | Engine intake and evaluates artifacts; it does not implement framework logic |
| **AI model selection and operation** | Intelligence Layer / Engineering | Engine coordinates intelligence capabilities; it does not own model infrastructure |
| **Brand expression and tone** | Brand Identity Standard / Experience Layer | Engine produces semantically bounded outputs; expression is downstream |
| **Human expert judgment** | Provider, Julia, and governed expert channels | Experts may augment; they do not replace engine orchestration |
| **Legal compliance execution** | Legal & Compliance Policies / Engineering | Engine conforms to policy constraints; it does not define legal obligations |
| **Infrastructure and runtime** | Infrastructure Layer | Engine semantics are independent of deployment topology |
| **Evidence registration and approval** | Evidence Registry / Governance | Engine enforces registration at intake; it does not approve new frameworks |
| **User decision authority** | User | Engine recommends; the user decides — permanently |

---

## 9. Constraints and Invariants

The following constraints are permanent. No ADR, implementation, or module design may violate them without superseding this specification through formal governance review.

### 9.1 Architectural Constraints

1. **One engine** — a single Decision Intelligence Engine serves all modules
2. **One pathway** — all decision support flows through the Decision Pathway
3. **No bypass** — no module may implement independent recommendation logic
4. **No framework finality** — frameworks contribute evidence; they do not deliver final guidance
5. **Registered evidence only** — unregistered evidence must not support decision-bearing outputs
6. **Mandatory explainability** — decision-bearing outputs must be explainable
7. **Advisory outputs only** — recommendations are not predictions or commands
8. **Uncertainty must be surfaced** — material limits must not be concealed
9. **User authority preserved** — the engine never claims decision authority
10. **Trust subordination** — trust requirements constrain engine behavior at every stage

### 9.2 Semantic Constraints

The engine's conceptual outputs must never:

- Assert knowledge of predetermined future outcomes
- Imply that compliance with guidance is required
- Frame analytical timing as fate or prophecy
- Present unregistered evidence as substantiated fact
- Conceal conflicting evidence without disclosure
- Pressure, manipulate, or exploit user vulnerability
- Claim certainty beyond what evidence and evaluation support

### 9.3 Evolution Constraints

Changes to engine concepts, responsibilities, or invariants require:

1. Compatibility review against the METIORO Constitution
2. Assessment of impact on Trust Architecture and Evidence Registry
3. Registration in the Requirement Registry where new obligations arise
4. An ADR when the change affects Level 3 architecture or implementation direction
5. Revision of this specification with version increment

Engine evolution must not silently drift from constitutional commitments.

---

## 10. Relationships to Product Modules

Product modules are **entry points** into the Decision Intelligence Engine — not independent decision systems.

Each module declares Decision Requests with module-specific intent and scope. The engine evaluates and recommends through the shared pathway. Module identity affects **what question is asked** — not **how decisions are formed**.

| Module | Decision Intent (Conceptual) |
|--------|------------------------------|
| **Today** | Immediate decision context and daily guidance within the current horizon |
| **Calendar** | Temporal decision landscape across days and periods |
| **Ask** | Concrete user questions requiring evaluated, explainable guidance |
| **People** | Interpersonal and relational decision context |
| **Provider** | Human expert interpretation layered on platform evidence |
| **Julia** | Governed personal expert guidance subordinate to platform trust standards |
| **Vault** | Depth exploration of specific life domains through registered evidence |
| **Notifications** | Timely delivery of decision-relevant prompts — calm and actionable |

### 10.1 Module Rules

1. Every module routes decision support through the Decision Intelligence Engine
2. No module owns evidence production, evaluation logic, or recommendation formation
3. No module may present guidance that bypasses engine explainability and uncertainty requirements
4. New modules must declare their Decision Request patterns and receive governance compatibility review

---

## 11. Relationships to Evidence Frameworks

Evidence frameworks are **independent contributors** — registered sources of Evidence Artifacts.

Frameworks operate under their own methodological rules within constitutional boundaries. The engine evaluates their artifacts; it does not own their methodology.

### 11.1 Framework Rules

1. **Contribution, not ownership** — frameworks supply evidence; they do not define METIORO's identity
2. **Registration required** — no framework may support user-facing claims without Evidence Registry approval
3. **Explainable methodology** — framework outputs must be disclosable at the governance level
4. **Constitutional boundaries** — no framework may position METIORO as fortune telling or deterministic prediction
5. **Independent evolution** — frameworks may be added, updated, or deprecated without collapsing the engine

### 11.2 Framework Domains (Illustrative)

The following domains are recognized architectural contributors — not engine owners:

| Domain | Evidential Role |
|--------|-----------------|
| **Astrology** | Structured timing and chart-based context as decision support evidence |
| **Psychology** | Behavioral and cognitive context for decision framing |
| **Behavioral** | Pattern and preference evidence for action timing |
| **Future frameworks** | Additional domains admitted through governance review |

Specific framework definitions, methodologies, and registry entries belong in the Evidence Registry — not in this specification.

---

## 12. Relationships to Intelligence Capabilities

Intelligence capabilities — including AI-assisted reasoning, explanation generation, conversational guidance, and personalization — **support** the engine under coordination.

### 12.1 Intelligence Role

| Capability | Engine Relationship |
|------------|---------------------|
| **Reasoning synthesis** | Supports multi-framework evaluation narrative formation — subordinate to engine evaluation |
| **Explanation generation** | Supports human-readable Explanation assembly — must satisfy all four dimensions |
| **Conversation** | Supports natural-language decision exploration — advisory only |
| **Personalization** | Adapts emphasis and presentation context — without manipulation or pressure |
| **Learning** | Improves quality from Feedback Signals — with accountability and privacy constraints |

### 12.2 Intelligence Constraints

Intelligence capabilities must:

- Meet the same trust, explainability, and evidence standards as deterministic capabilities
- Remain subordinate to engine orchestration and human decision authority
- Not claim certainty, supernatural knowledge, or decision authority
- Not introduce undisclosed reasoning or hidden confidence
- Remain reviewable under Trust Architecture

No specific technology, model, or vendor is prescribed at this level.

---

## 13. Derivation Requirements

The following artifact types **must derive from** this specification. They must not redefine engine concepts or contradict engine responsibilities.

| Artifact Type | Derivation Obligation |
|---------------|----------------------|
| **Engineering Standards** | Implement engine responsibilities and invariants; must not relocate decision logic outside the engine pathway |
| **ADRs** | Record structural choices that affect engine behavior; must reference affected engine concepts |
| **API contracts** | Express Decision Requests and Decision Outcome Packages consistent with this model |
| **Scoring methodologies** | Operate as evaluation inputs within engine-governed evaluation — not as parallel recommendation systems |
| **Product module designs** | Declare Decision Request patterns; route through the single pathway |
| **UX Standards** | Present Decision Outcome Packages without re-evaluating or altering recommendations |
| **Evidence framework specifications** | Produce Evidence Artifacts conforming to intake requirements |
| **Requirement Registry entries** | Trace engine-related obligations to this specification |
| **Test and quality criteria** | Verify engine invariants — advisory outputs, explainability, evidence governance, uncertainty disclosure |

When authoring any of the above, the author must be able to answer: **Which engine concept or responsibility does this derive from?** If no answer exists, the artifact is out of scope or requires engine specification extension through governance review.

---

## 14. Governance

### 14.1 Change Authority

This specification is a Level 3 architecture document. Changes require:

1. Compatibility review against Level 0–2 governance documents
2. ADR registration when the change affects implementation direction
3. Requirement Registry update when new obligations are introduced
4. Version increment per semantic versioning:
   - **Major** — Change to core concepts, responsibilities, invariants, or the One Engine Principle
   - **Minor** — Addition of concepts or clarifications that do not alter invariants
   - **Patch** — Editorial corrections that do not change meaning

### 14.2 Review Triggers

This specification must be reviewed when:

- A new product module is proposed
- A new evidence framework seeks registry admission
- Intelligence capabilities expand in scope or authority
- A downstream ADR proposes engine behavior not covered here
- Constitutional or Trust Architecture revisions affect decision support

### 14.3 Supersession

No other document may supersede this specification as the canonical engine authority except a formally revised version of this document approved through governance review.

---

## Appendix A — Concept Model

```
                    ┌─────────────────────────────────┐
                    │     Product Module              │
                    │  (declares Decision Request)    │
                    └───────────────┬─────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────┐
│                  DECISION INTELLIGENCE ENGINE                      │
│                                                                    │
│  Context Assembly ←── User Context (Data Layer)                   │
│         │                                                          │
│         ▼                                                          │
│  Evidence Intake ←── Evidence Artifacts (Evidence Layer)         │
│         │                                                          │
│         ▼                                                          │
│  Evaluation ←── Intelligence Capabilities (coordinated)           │
│         │                                                          │
│         ▼                                                          │
│  Recommendation Formation                                          │
│         │                                                          │
│         ▼                                                          │
│  Explainability Assembly                                           │
│         │                                                          │
│         ▼                                                          │
│  Decision Outcome Package                                          │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                ▼
                    ┌─────────────────────────────────┐
                    │       Experience Layer           │
                    │   (presents; user decides)       │
                    └───────────────┬─────────────────┘
                                    │
                                    ▼
                           Feedback Signal
                                    │
                                    └──→ Engine calibration (non-automating)
```

---

## Appendix B — Engine Principles

| # | Principle |
|---|-----------|
| 1 | **One engine** — single Decision Intelligence Engine for all decision support |
| 2 | **One pathway** — all modules flow through the Decision Pathway |
| 3 | **Recommend, don't decide** — user retains final authority |
| 4 | **Evidence-governed** — registered evidence only at intake |
| 5 | **Explain everything important** — four explanation dimensions are mandatory |
| 6 | **Uncertainty is honest** — material limits are surfaced |
| 7 | **Frameworks contribute, engine orchestrates** — no framework owns the platform |
| 8 | **Intelligence supports, engine coordinates** — AI is subordinate |
| 9 | **Trust constrains all stages** — no capability ships at trust's expense |
| 10 | **Provenance preserved** — outputs are traceable for review |
| 11 | **Feedback calibrates, not automates** — learning respects user agency |
| 12 | **Concepts before code** — implementation derives from this specification |

---

## Referenced Governance Documents

| Document | Relationship |
|----------|--------------|
| [METIORO Constitution](../governance/METIORO_CONSTITUTION.md) | Supreme authority |
| [Trust Architecture](../governance/TRUST_ARCHITECTURE.md) | Cross-cutting trust requirements on engine behavior |
| [Brand Identity Standard](../governance/BRAND_IDENTITY_STANDARD.md) | Expression constraints on presented engine outputs |
| [Evidence Registry](../governance/EVIDENCE_REGISTRY.md) | Evidence admission and quality governance at intake |
| [Requirement Registry](../governance/REQUIREMENT_REGISTRY.md) | Traceable obligations derived from engine responsibilities |
| [Document Hierarchy](../governance/DOCUMENT_HIERARCHY.md) | Document placement (this specification: Level 3) |
| [Phase 3 Architecture Blueprint](./PHASE3_ARCHITECTURE_BLUEPRINT.md) | Platform context — defers engine detail to this document |
| [Evidence Pipeline Specification](./EVIDENCE_PIPELINE_SPECIFICATION.md) | Upstream evidence flow — pipeline output is engine intake input |
| [Explainability Engine Specification](./EXPLAINABILITY_ENGINE_SPECIFICATION.md) | Downstream explainability flow — Decision Outcome is explainability input |
| [Decision Log](../governance/DECISION_LOG.md) | Locked decisions (DEC-0001, DEC-0004) binding engine behavior |

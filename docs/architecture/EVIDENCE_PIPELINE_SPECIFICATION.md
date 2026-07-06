# METIORO Evidence Pipeline — Architecture Specification

> Status: Draft

**Version:** 1.0.0

**Authority:** This document derives from [METIORO Constitution](../governance/METIORO_CONSTITUTION.md), [Trust Architecture](../governance/TRUST_ARCHITECTURE.md), [Phase 3 Architecture Blueprint](./PHASE3_ARCHITECTURE_BLUEPRINT.md), [Decision Intelligence Engine Specification](./DECISION_INTELLIGENCE_ENGINE.md), and [Evidence Registry](../governance/EVIDENCE_REGISTRY.md).

**Document type:** Canonical architecture specification — conceptual only.

**Purpose:** Define the single authoritative conceptual architecture of the METIORO Evidence Pipeline — how evidence enters, evolves, is evaluated, and becomes usable by the Decision Intelligence Engine.

**Scope:** Concepts, lifecycle stages, quality dimensions, relationships, traceability, and integration rules for evidence flow. This document does not prescribe technology, interfaces, algorithms, storage, or operational procedures.

**Date:** July 2026

---

## 1. Executive Summary

The **Evidence Pipeline** is METIORO's permanent conceptual architecture for how evidence moves through the platform.

Evidence is the foundation of decision support. METIORO does not form decision-bearing guidance from opinion, unregistered assertion, or opaque inference. Evidence enters through registered **Evidence Sources**, passes through governed lifecycle stages, and emerges as **Evidence Bundles** that the [Decision Intelligence Engine](./DECISION_INTELLIGENCE_ENGINE.md) may intake for decision evaluation.

**Evidence informs decisions. Evidence does not make decisions.**

The pipeline ensures that all evidence reaching the engine is collected deliberately, validated against governance requirements, normalized into comparable form, enriched with relevant context, evaluated for quality and readiness, bundled for intake, and fully traceable from origin to use.

Product modules never access framework-specific evidence directly. Human-facing guidance always flows through the Decision Intelligence Engine, which receives evidence only through this pipeline.

This specification is the **sole authoritative conceptual model** of evidence flow. Engineering designs, ADRs, API contracts, framework integrations, and product modules that involve evidence must derive from this document and must not contradict it.

---

## 2. Pipeline Philosophy

The Evidence Pipeline is governed by seven permanent philosophical commitments. These commitments apply at every lifecycle stage and constrain all evidence-related architecture.

### 2.1 Evidence-First

Decision support begins with evidence — not with conclusions, narratives, or recommendations.

Analytical claims must be grounded in documented, traceable evidence before they may influence user-facing guidance. Evidence Before Opinion (Constitution §3.3) is a pipeline invariant: the pipeline exists to ensure evidence precedes decision formation, not to shortcut it.

### 2.2 Framework-Independent

The pipeline is agnostic to any single analytical tradition.

Astrology, psychology, behavioral analysis, historical user data, user feedback, and future frameworks all enter through the same conceptual pathway. Framework independence means the pipeline structure does not change when a new source is admitted — only registered sources and their artifacts vary.

No framework owns the pipeline. No framework bypasses it.

### 2.3 Traceable

Every evidence artifact must support tracing from origin through transformation to use.

Traceability is not optional metadata — it is a structural requirement of the pipeline. Evidence that cannot be traced must not support decision-bearing claims.

### 2.4 Explainable

Evidence must be capable of explanation at the governance level.

Users and reviewers must be able to understand what evidence contributed to guidance, through which framework, under what assumptions, and with what known limits. Explainability applies to evidence itself — not only to engine recommendations.

### 2.5 Auditable

The pipeline must support governance review at every stage.

Evidence admission, transformation, quality assessment, and engine intake must be reviewable for compliance with constitutional boundaries, trust requirements, and registry obligations. Auditability is conceptual — it describes what must be observable, not how observation is implemented.

### 2.6 Composable

Evidence from multiple independent sources may be combined into Evidence Bundles without collapsing source identity.

Composition preserves provenance, framework attribution, and individual artifact traceability. A bundle is a structured collection — not a merged opinion that conceals origin.

### 2.7 Advisory Boundary

The pipeline delivers evidence to the Decision Intelligence Engine. It does not deliver recommendations, predictions, or decisions.

Decision authority remains with the user. The engine evaluates evidence and forms advisory guidance. The pipeline stops at engine intake.

---

## 3. Core Concepts

The following terms constitute the canonical vocabulary of the Evidence Pipeline. Downstream documents must use these concepts consistently or explicitly map their terminology to them.

Governance-level definitions only — no implementation semantics.

### 3.1 Evidence Source

An **Evidence Source** is a registered origin of analytical or contextual information that may produce evidence artifacts.

Evidence Sources include analytical frameworks, reference datasets, governed rule sets, historical user data channels, and feedback channels — each admitted through the [Evidence Registry](../governance/EVIDENCE_REGISTRY.md).

An Evidence Source:

- Has a registered identity and declared methodological scope
- Operates under constitutional and trust boundaries
- Produces evidence through its own rules — the pipeline does not define those rules
- Does not form recommendations or decision guidance

Unregistered sources are not Evidence Sources within this architecture. They must not enter the pipeline for user-facing decision support.

### 3.2 Evidence Artifact

An **Evidence Artifact** is a structured, traceable unit of evidence produced by an Evidence Source.

An Evidence Artifact carries:

- **Source identity** — which registered Evidence Source produced it
- **Evidential content** — structured assertions or signals supported by the source's methodology
- **Declared scope** — the domain, time horizon, or conditions the artifact addresses
- **Declared limits** — known gaps, assumptions, or boundaries
- **Traceability metadata** — origin, framework attribution, and transformation history

The Decision Intelligence Engine Specification defines Evidence Artifacts at the engine intake boundary. This pipeline specification defines how artifacts are formed, transformed, and prepared before that boundary.

### 3.3 Evidence Collection

**Evidence Collection** is the pipeline stage at which raw or computed outputs from Evidence Sources are gathered into candidate evidence artifacts.

Collection:

- Initiates from a declared need — tied to a decision scope, module intent, or analytical request
- Gathers outputs from one or more registered Evidence Sources
- Does not validate, normalize, or evaluate — it acquires candidate material for downstream stages

Collection is source-facing. It does not interpret evidence for decision purposes.

### 3.4 Evidence Normalization

**Evidence Normalization** is the pipeline stage at which collected evidence is transformed into a consistent conceptual structure suitable for validation, composition, and engine intake.

Normalization:

- Aligns heterogeneous source outputs into comparable artifact form
- Preserves source identity and original evidential content — normalization does not alter meaning to fit a preferred conclusion
- Does not evaluate quality or form recommendations
- Does not discard dissenting or inconvenient evidence without documented governance rationale

Normalization enables composability across frameworks without erasing framework independence.

### 3.5 Evidence Validation

**Evidence Validation** is the pipeline stage at which candidate evidence is assessed against governance and registry requirements before proceeding.

Validation confirms:

- The Evidence Source is registered and approved for the declared scope
- The artifact meets minimum registry quality level for its intended use
- Constitutional and trust boundaries are respected
- Provisional or deprecated evidence is excluded from user-facing pathways

Validation is a governance gate — not a decision gate. It determines eligibility to proceed; it does not determine what the user should do.

Validation enforces [Evidence Registry](../governance/EVIDENCE_REGISTRY.md) quality levels (E0–E4). User-facing decision support requires approved evidence at **E2** or **E3** minimum.

### 3.6 Evidence Enrichment

**Evidence Enrichment** is the pipeline stage at which validated evidence is augmented with additional contextual or cross-source information that improves interpretability without altering core evidential claims.

Enrichment may include:

- Cross-referencing related artifacts from complementary sources
- Attaching contextual premises from the Data Layer
- Adding governance-approved metadata that aids explainability

Enrichment must not:

- Fabricate evidence not produced by a registered source
- Override or silently replace source evidential content
- Introduce unregistered analytical claims

Enrichment supports understanding. It does not substitute for Evidence Source methodology.

### 3.7 Evidence Context

**Evidence Context** is the set of situational, temporal, and user-relevant premises attached to evidence artifacts before bundling.

Evidence Context includes:

- **Temporal context** — the time window or moment the evidence addresses
- **Situational context** — domain, activity, or relationship framing
- **User context references** — decision-relevant personal premises supplied under privacy and consent constraints
- **Request context** — the module intent or decision scope that triggered collection

Evidence Context enables the Decision Intelligence Engine to evaluate evidence against Decision Context. Context attachment is pipeline responsibility; context interpretation for recommendation is engine responsibility.

### 3.8 Evidence Evaluation

**Evidence Evaluation** is the pipeline stage at which validated, normalized, context-attached evidence is assessed against conceptual quality dimensions before bundling.

Evidence Evaluation in the pipeline assesses **evidence readiness and quality** — not decision outcomes.

It determines:

- Whether artifacts meet quality dimensions for the declared use (see Section 6)
- Whether gaps, conflicts, or uncertainty require disclosure before engine intake
- Whether the artifact set is sufficient and coherent for bundling

Evidence Evaluation is distinct from **engine evaluation** defined in the Decision Intelligence Engine Specification. Pipeline evaluation prepares evidence; engine evaluation assesses evidence against Decision Context to form recommendations.

### 3.9 Evidence Bundle

An **Evidence Bundle** is the structured collection of validated, evaluated evidence artifacts prepared for Decision Intelligence Engine intake.

An Evidence Bundle:

- Contains one or more Evidence Artifacts with preserved individual traceability
- Includes attached Evidence Context
- Carries quality and uncertainty disclosures where material
- Represents the pipeline's complete output — the handoff to engine Evidence Intake

The engine accepts or rejects bundles at intake based on registration, scope, and eligibility — it does not reconstruct evidence from raw sources.

### 3.10 Evidence Traceability

**Evidence Traceability** is the permanent capability to follow an evidence artifact from origin through every pipeline stage to engine intake and onward to decision-bearing output.

Traceability dimensions are defined in Section 8. Traceability is a cross-cutting concept — not a single pipeline stage — enforced at every stage.

---

## 4. Evidence Lifecycle

The Evidence Lifecycle describes the permanent conceptual flow of evidence through the platform. It defines **what happens conceptually** — not how it is implemented, sequenced in code, or stored.

```
Evidence Source
    ↓
Collection
    ↓
Validation
    ↓
Normalization
    ↓
Context Attachment
    ↓
Evaluation
    ↓
Evidence Bundle
    ↓
Decision Intelligence Engine
```

### 4.1 Stage Overview

| Stage | Pipeline Responsibility |
|-------|------------------------|
| **Evidence Source** | Registered origin produces candidate analytical or contextual output |
| **Collection** | Gather candidate outputs into pipeline scope |
| **Validation** | Confirm registry eligibility, governance compliance, and scope fitness |
| **Normalization** | Transform into consistent artifact structure while preserving source identity |
| **Context Attachment** | Bind temporal, situational, user, and request context to artifacts |
| **Evaluation** | Assess quality dimensions, readiness, conflicts, and disclosure requirements |
| **Evidence Bundle** | Compose validated artifacts into engine-ready handoff |
| **Decision Intelligence Engine** | Intake bundle via Evidence Intake; proceed to decision evaluation |

Enrichment (Section 3.6) may occur during Context Attachment or between Normalization and Context Attachment — augmenting artifacts without altering the core lifecycle order.

### 4.2 Lifecycle Invariants

The following invariants hold at every stage:

1. **No decision authority** — no stage forms recommendations or claims decision authority
2. **Registered sources only** — unregistered evidence must not proceed toward user-facing intake
3. **Traceability preserved** — every transformation must be traceable
4. **Source identity preserved** — composition must not collapse framework attribution
5. **Contradiction permitted** — conflicting evidence may coexist; suppression requires disclosure
6. **Engine boundary respected** — the pipeline ends at Evidence Bundle handoff; decision evaluation belongs to the engine

### 4.3 Feedback Loop

User feedback and outcome signals may re-enter the pipeline as evidence from the **User Feedback** Evidence Source (Section 5). Feedback informs calibration and quality improvement — it does not automate decisions or bypass governance validation.

Feedback re-entry follows the same lifecycle stages as all other evidence.

---

## 5. Evidence Sources

Evidence Sources are independent contributors to the pipeline. Each source operates under its own methodological rules within constitutional boundaries. The pipeline treats all approved sources uniformly — source-specific logic remains within the source, not within the pipeline structure.

High-level source categories (illustrative, not exhaustive):

| Source Category | Evidential Role |
|-----------------|-----------------|
| **Astrology** | Structured timing, chart-based, and contextual signals derived from analytical methods — presented as decision support evidence, not prophecy |
| **Behavioral** | Pattern, preference, and habit-aware signals supporting action timing and decision framing |
| **Psychology** | Behavioral and cognitive context signals supporting self-understanding and decision framing |
| **Historical User Data** | Prior decisions, preferences, and interaction history supplying contextual premises under privacy and consent constraints |
| **User Feedback** | User response, override, and outcome signals supporting calibration — not automated decision replacement |
| **Future Frameworks** | Additional domains (e.g. numerology, environmental, relational) admitted through governance review and Evidence Registry registration |

### 5.1 Source Independence Rules

1. Each source is independently registrable, reviewable, and deprecatable
2. No source owns the pipeline or the platform
3. No source delivers final guidance — sources produce artifacts only
4. No source may bypass Validation or registry requirements
5. Adding a source does not alter pipeline structure — only registry entries and artifact content vary

Specific source definitions, methodologies, and registry entries belong in the Evidence Registry — not in this specification.

---

## 6. Evidence Quality

Evidence quality is assessed conceptually through six permanent dimensions. These dimensions guide Evidence Evaluation — they do not prescribe formulas, scoring algorithms, or numeric thresholds.

### 6.1 Completeness

The extent to which an artifact addresses its declared scope without material gaps that would mislead decision evaluation.

Incomplete evidence may proceed with disclosure — it must not proceed with concealed gaps.

### 6.2 Consistency

The extent to which an artifact's internal claims and metadata align without contradiction.

Internal inconsistency requires disclosure or exclusion from user-facing bundles — not silent correction.

### 6.3 Reliability

The extent to which the Evidence Source and its methodology are defensible, registered, and approved for the artifact's declared use.

Unregistered or deprecated sources fail reliability regardless of surface plausibility.

### 6.4 Freshness

The extent to which the artifact reflects current conditions relevant to its temporal scope.

Stale evidence may remain valid for certain scopes — freshness is assessed relative to declared use, not universally.

### 6.5 Relevance

The extent to which the artifact addresses the decision scope, module intent, and context of the current request.

Irrelevant evidence must not be included in bundles to strengthen apparent support.

### 6.6 Explainability

The extent to which the artifact's origin, methodology, content, and limits can be disclosed to satisfy trust and explainability requirements.

Evidence that cannot be explained at the governance level must not support decision-bearing claims.

### 6.7 Quality and Registry Alignment

Pipeline quality assessment operates in concert with [Evidence Registry](../governance/EVIDENCE_REGISTRY.md) quality levels (E0–E4). Registry level determines eligibility; pipeline dimensions determine readiness within eligible artifacts.

| Registry Level | Pipeline Role |
|----------------|---------------|
| **E0 — Unregistered** | Must not enter user-facing pipeline path |
| **E1 — Provisional** | Internal use only; must not reach engine intake for user-facing decisions |
| **E2 — Approved** | May proceed through full lifecycle to engine intake |
| **E3 — Locked** | Permanent approved source; change requires formal re-review |
| **E4 — Deprecated** | Must not enter active pipeline; retained for traceability only |

---

## 7. Evidence Relationships

Evidence exists in relationship — to other evidence, to context, to the engine, and to decisions. These relationships define architectural boundaries.

### 7.1 Evidence Never Owns Decisions

Evidence contributes signals. It does not command action, predict fate, or replace user judgment.

The pipeline delivers evidence. The Decision Intelligence Engine evaluates evidence and forms advisory recommendations. The user decides.

No pipeline stage, Evidence Source, or Evidence Artifact may be presented as having decision authority.

### 7.2 Evidence Contributes Signals

Each artifact contributes structured evidential signals — assertions, context, timing indicators, pattern observations — within its declared scope and limits.

Signals inform engine evaluation. They are not themselves recommendations.

### 7.3 Support and Contradiction

Multiple Evidence Sources may produce artifacts that **support**, **complement**, or **contradict** one another.

| Relationship | Pipeline Treatment |
|--------------|-------------------|
| **Support** | Artifacts may compose into a bundle with mutual reinforcement disclosed |
| **Complement** | Artifacts address different dimensions of the same decision scope |
| **Contradict** | Artifacts assert conflicting signals within overlapping scope |

**Contradiction is allowed.** The pipeline must not silently resolve contradiction by excluding dissenting artifacts.

Contradiction must be preserved through bundling and disclosed to the engine. Resolution — weighting, synthesis, uncertainty surfacing — is the responsibility of the Decision Intelligence Engine during decision evaluation, not the pipeline during evidence preparation.

### 7.4 Engine Resolution

When evidence conflicts, the Decision Intelligence Engine:

- Evaluates conflicting artifacts against Decision Context
- Surfaces tension and uncertainty in recommendations and explanations
- Does not suppress minority evidence without disclosure

The pipeline's obligation is to deliver honest, complete bundles. The engine's obligation is to evaluate honestly and explain transparently.

---

## 8. Traceability

Every evidence artifact must support tracing across five conceptual dimensions. Traceability describes **what must be knowable** — not how it is stored, logged, or indexed.

### 8.1 Origin

Which registered Evidence Source produced the artifact, under what methodological scope, and from what class of input or computation.

### 8.2 Timestamp

When the artifact was produced and when each pipeline stage transformed it — establishing temporal provenance relative to the decision scope.

### 8.3 Framework

Which analytical framework or source category the artifact belongs to — preserved through normalization and bundling without collapse into undifferentiated "evidence."

### 8.4 Confidence

What confidence boundaries, limitations, or uncertainty declarations attach to the artifact — at source declaration and through pipeline evaluation.

Confidence is disclosed honesty — not a concealed numeric authority.

### 8.5 Transformation History

What pipeline stages the artifact passed through and what conceptual transformations were applied — collection, validation, normalization, enrichment, context attachment, evaluation, bundling.

Transformations must not alter evidential meaning without documented traceability.

### 8.6 Downstream Traceability

From engine intake onward, evidence traceability connects to recommendation explainability — satisfying the dimension **Based on what evidence?** (Trust Architecture §4.2).

The pipeline establishes upstream traceability. The [Explainability Engine](./EXPLAINABILITY_ENGINE_SPECIFICATION.md) assembles evidence references into Explanation Packages. The Decision Intelligence Engine preserves provenance in Decision Outcomes.

---

## 9. Product Integration

All product modules consume evidence **only through the Decision Intelligence Engine**. No module accesses framework-specific evidence directly.

### 9.1 Integration Model

```
Product Module
    ↓
Decision Request (to Decision Intelligence Engine)
    ↓
Engine coordinates evidence need
    ↓
Evidence Pipeline produces Evidence Bundle
    ↓
Engine Evidence Intake
    ↓
Engine Evaluation → Recommendation → Explanation
    ↓
Decision Outcome Package (to Product Module / Experience Layer)
```

Modules declare **what decision support is needed** via Decision Requests. They do not declare **how evidence is collected, validated, or bundled** — that is pipeline responsibility under engine coordination.

### 9.2 Module Rules

1. **No direct evidence access** — modules must not read, interpret, or present framework-specific artifacts outside the engine pathway
2. **No independent evidence logic** — modules must not implement collection, validation, or bundling
3. **No bypass** — modules must not form guidance from raw source outputs
4. **Engine output only** — user-facing decision-bearing content comes from Decision Outcome Packages
5. **Explainability preserved** — modules must present evidence basis through engine-provided explanation capability

### 9.3 Module Scope Variation

Modules differ in Decision Request intent and scope — not in evidence access patterns.

| Module | Evidence Relationship (Conceptual) |
|--------|----------------------------------|
| **Today** | Daily-scoped bundles for immediate decision context |
| **Calendar** | Temporal-scoped bundles across days and periods |
| **Ask** | Question-scoped bundles for concrete user inquiries |
| **People** | Relational-scoped bundles for interpersonal context |
| **Provider** | Expert interpretation layered on engine output — not raw evidence |
| **Julia** | Governed expert guidance subordinate to engine evidence standards |
| **Vault** | Domain-scoped bundles for depth exploration |
| **Notifications** | Timely prompts derived from engine outputs — not direct evidence reads |

---

## 10. Future Evolution

The Evidence Pipeline structure is permanent. Its **contents** — sources, artifact types, and registry entries — evolve through governance.

### 10.1 Adding New Frameworks

1. Propose framework scope and methodological boundaries
2. Register in the Evidence Registry after governance review
3. Integrate as an Evidence Source — not as a pipeline redesign
4. Verify constitutional compatibility (no mysticism, no deterministic prediction)
5. Require explainability and traceability validation before user-facing use
6. Author ADR if framework admission affects Level 3 architecture

New frameworks enter the existing lifecycle at the Evidence Source stage. The pipeline structure does not change.

### 10.2 Adding New Evidence Types

New artifact types, signal categories, or enrichment patterns may be introduced within registered sources.

New types require:

- Evidence Registry entry or amendment
- Compatibility review against this specification
- Traceability and explainability validation
- ADR when the type affects engine intake semantics

New types do not bypass Validation, Evaluation, or bundling stages.

### 10.3 Maintaining Governance Compatibility

All pipeline evolution must remain compatible with:

- [METIORO Constitution](../governance/METIORO_CONSTITUTION.md) — especially Evidence Before Opinion (§3.3)
- [Trust Architecture](../governance/TRUST_ARCHITECTURE.md) — evidence and explainability requirements
- [Decision Intelligence Engine Specification](./DECISION_INTELLIGENCE_ENGINE.md) — engine intake and evaluation boundaries
- [Evidence Registry](../governance/EVIDENCE_REGISTRY.md) — registration and quality governance

Changes to pipeline concepts, lifecycle stages, or invariants require:

1. Compatibility review against Level 0–2 governance documents
2. ADR when the change affects implementation direction
3. Requirement Registry update when new obligations arise
4. Version increment of this specification per semantic versioning

Pipeline evolution must not silently drift from constitutional commitments.

---

## Appendix — Evidence Principles

| # | Principle |
|---|-----------|
| 1 | **Evidence informs; evidence does not decide** — decision authority remains with the user |
| 2 | **Evidence-first** — claims require traceable evidence before decision formation |
| 3 | **Framework-independent pipeline** — one lifecycle for all sources |
| 4 | **Registered sources only** — unregistered evidence must not reach user-facing intake |
| 5 | **Traceable at every stage** — origin, time, framework, confidence, and transformation history |
| 6 | **Explainable evidence** — artifacts must support disclosure of basis and limits |
| 7 | **Auditable flow** — governance review must be possible at every stage |
| 8 | **Composable without collapse** — bundles preserve individual source identity |
| 9 | **Contradiction allowed** — the pipeline does not silently resolve conflict |
| 10 | **Engine resolves** — synthesis and uncertainty surfacing belong to decision evaluation |
| 11 | **Modules consume through engine** — no direct framework evidence access |
| 12 | **Pipeline ends at intake** — decision evaluation belongs to the Decision Intelligence Engine |
| 13 | **No algorithms here** — implementation derives from this specification |
| 14 | **Governance-gated evolution** — new sources and types require registry admission |

---

## Referenced Governance Documents

| Document | Relationship |
|----------|--------------|
| [METIORO Constitution](../governance/METIORO_CONSTITUTION.md) | Supreme authority — Evidence Before Opinion (§3.3) |
| [Trust Architecture](../governance/TRUST_ARCHITECTURE.md) | Evidence governance and explainability requirements |
| [Evidence Registry](../governance/EVIDENCE_REGISTRY.md) | Source registration and quality levels at Validation stage |
| [Decision Intelligence Engine Specification](./DECISION_INTELLIGENCE_ENGINE.md) | Engine intake boundary — pipeline output, engine input |
| [Explainability Engine Specification](./EXPLAINABILITY_ENGINE_SPECIFICATION.md) | Downstream explainability — Evidence Summary traces to pipeline artifacts |
| [Phase 3 Architecture Blueprint](./PHASE3_ARCHITECTURE_BLUEPRINT.md) | Platform context — defers pipeline detail to this document |
| [Brand Identity Standard](../governance/BRAND_IDENTITY_STANDARD.md) | Expression constraints on evidence-related user communication |
| [Requirement Registry](../governance/REQUIREMENT_REGISTRY.md) | Traceable obligations derived from pipeline responsibilities |
| [Document Hierarchy](../governance/DOCUMENT_HIERARCHY.md) | Document placement (this specification: Level 3) |
| [Decision Log](../governance/DECISION_LOG.md) | Locked decisions (DEC-0001, DEC-0004) binding pipeline behavior |

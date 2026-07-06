# METIORO Explainability Engine — Architecture Specification

> Status: Draft

**Version:** 1.0.0

**Authority:** This document derives from [METIORO Constitution](../governance/METIORO_CONSTITUTION.md), [Trust Architecture](../governance/TRUST_ARCHITECTURE.md), [Decision Intelligence Engine Specification](./DECISION_INTELLIGENCE_ENGINE.md), [Evidence Pipeline Specification](./EVIDENCE_PIPELINE_SPECIFICATION.md), and [Phase 3 Architecture Blueprint](./PHASE3_ARCHITECTURE_BLUEPRINT.md).

**Document type:** Canonical architecture specification — conceptual only.

**Purpose:** Define the single authoritative conceptual architecture of the METIORO Explainability Engine — how every recommendation becomes understandable, transparent, reviewable, and auditable.

**Scope:** Concepts, explainability flow, explanation components, trust requirements, AI boundaries, and integration rules. This document does not prescribe implementation, API design, prompt engineering, LLM selection, UX patterns, or presentation technology.

**Date:** July 2026

---

## 1. Executive Summary

The **Explainability Engine** is METIORO's permanent conceptual architecture for transforming decision outcomes into user-understandable explanations.

METIORO exists to help people make better personal decisions through structured, explainable intelligence (Constitution §1.1). Explainability is not optional decoration on recommendations — it is a constitutional requirement (Constitution §3.2; Trust Architecture §4). Every decision-bearing recommendation must be **capable** of reasoned explanation.

The Explainability Engine receives **Decision Outcomes** from the [Decision Intelligence Engine](./DECISION_INTELLIGENCE_ENGINE.md) — advisory recommendations with provenance, evidence traceability, and evaluation reasoning — and assembles **Explanation Packages** for the Presentation Layer.

**The Explainability Engine never creates decisions. It explains decisions.**

The engine does not form recommendations, alter evidence, override evaluation, or claim decision authority. It makes existing decision outcomes transparent — answering why guidance exists, on what evidence, under what assumptions, with what uncertainty, and what alternatives were considered.

Product modules consume Explanation Packages. No module generates independent explanations. All explainability flows through this single conceptual pathway.

This specification is the **sole authoritative conceptual model** of METIORO explainability. Engineering designs, ADRs, AI integration patterns, and product modules that involve explanation must derive from this document and must not contradict it.

---

## 2. Explainability Philosophy

The Explainability Engine is governed by eight permanent philosophical commitments.

### 2.1 Transparency

Users must be able to understand what METIORO did and why — not merely what it said.

Concealed reasoning, hidden evidence, or opaque confidence are architecturally prohibited. Transparency means explanation capability exists for every important recommendation — whether or not the user requests it at the moment of delivery.

### 2.2 Trust

Explainability earns trust. Trust cannot exist where reasoning is inaccessible or evidence is unverifiable.

The Explainability Engine serves Trust Architecture principles — especially Transparency, Explainability, Evidence, and Accountability — by making decision support reviewable rather than authoritative.

### 2.3 Evidence-First

Explanations must trace to registered evidence — not to narrative invention or unsupported assertion.

Every explanation must be capable of answering **Based on what evidence?** with reference to artifacts that passed through the [Evidence Pipeline](./EVIDENCE_PIPELINE_SPECIFICATION.md). Evidence Before Opinion (Constitution §3.3) applies to explanation as strictly as to recommendation.

### 2.4 Human-Centered

Explanation serves the user's decision-making — not the system's self-justification.

The user retains final authority. Explanations support understanding and override capability; they do not compel compliance or diminish agency.

### 2.5 Reviewable

Explanations must support user and governance review.

A user questioning guidance must be able to examine its basis. A governance reviewer auditing outputs must be able to trace explanation content to decision outcomes and evidence provenance.

### 2.6 Auditable

Explanation assembly must preserve provenance sufficient for accountability.

What was explained, from what decision outcome, referencing what evidence, with what uncertainty disclosed — must be reconstructable for trust failure investigation and quality improvement.

### 2.7 Never Persuasive

Explanation clarifies; it does not sell.

The Explainability Engine must not frame reasoning to pressure acceptance, amplify urgency, or rhetorically strengthen weak guidance. Calm, analytical explanation aligns with brand tone (DEC-0004).

### 2.8 Never Manipulative

Explanation must not exploit emotional vulnerability, conceal alternatives, or overstate certainty to influence behavior.

Manipulative explanation is a trust violation equivalent to manipulative recommendation — prohibited at the architectural level.

---

## 3. Core Concepts

The following terms constitute the canonical vocabulary of the Explainability Engine. Downstream documents must use these concepts consistently or explicitly map their terminology to them.

Governance-level definitions only — no implementation semantics.

### 3.1 Explanation

An **Explanation** is the structured reasoning dimension that makes a Recommendation understandable, transparent, and reviewable.

An Explanation is not a recommendation. It does not advise new action, alter guidance, or claim decision authority. It illuminates an existing Recommendation.

Every Explanation must be capable of supporting the six explanation components defined in Section 5.

### 3.2 Reasoning

**Reasoning** is the logical path from evidence and decision context to the Recommendation — expressed in explainable form.

Reasoning describes how evaluation connected contributed evidence to advisory guidance. It reflects the Decision Intelligence Engine's evaluation — it does not substitute new evaluation or invent connections not present in the Decision Outcome.

### 3.3 Evidence Summary

An **Evidence Summary** is a structured condensation of the registered evidence that substantiates the Recommendation.

The Evidence Summary:

- References Evidence Artifacts from the [Evidence Pipeline](./EVIDENCE_PIPELINE_SPECIFICATION.md) via traceability links in the Decision Outcome
- Preserves source and framework attribution
- Distinguishes supporting from contradicting evidence
- Does not introduce evidence not present in the Decision Outcome

### 3.4 Decision Factors

**Decision Factors** are the decision-relevant elements identified during engine evaluation that materially influenced the Recommendation.

Decision Factors may include timing conditions, contextual premises, domain constraints, or cross-framework synthesis points — as reflected in the Decision Outcome, not as newly inferred priorities.

### 3.5 Supporting Evidence

**Supporting Evidence** is the subset of contributed evidence whose signals align with or reinforce the Recommendation within the declared decision scope.

Supporting evidence is identified from the Decision Outcome's evaluation reasoning — not selected to construct a post-hoc justification.

### 3.6 Contradicting Evidence

**Contradicting Evidence** is the subset of contributed evidence whose signals conflict with or tension against the Recommendation within overlapping scope.

Contradicting evidence must be disclosed when material — not omitted to simplify explanation. The Evidence Pipeline permits contradiction; the Explainability Engine surfaces it honestly.

### 3.7 Assumptions

**Assumptions** are the explicit premises applied during decision evaluation — contextual, temporal, methodological, or scope-bound conditions taken as given.

Assumptions must be stated, not implied. Users must be able to understand what conditions the Recommendation depends upon.

### 3.8 Alternatives

**Alternatives** are other reasonable advisory directions that evaluation considered or that evidence could support — within the decision scope — but that were not selected as the primary Recommendation.

Alternatives are explanatory context — not hidden options withheld to manipulate choice. Presenting alternatives preserves user agency and scientific integrity.

### 3.9 Uncertainty

**Uncertainty** is the explicit acknowledgment of limits on evidence, reasoning, or recommendation confidence — as declared in the Decision Outcome.

The Explainability Engine surfaces uncertainty; it does not resolve, minimize, or conceal it to strengthen apparent confidence.

### 3.10 Next Best Action

**Next Best Action** is the explained expression of the Recommendation's advisory guidance — framed as the platform's suggested direction given current evidence and context.

Next Best Action:

- Explains what the Recommendation advises — it does not create a new recommendation
- Remains advisory; the user decides
- Aligns with METIORO's orientation: *Know your best next move*
- Must not be framed as fate, certainty, or compulsory instruction

Next Best Action is an explanation concept — not a separate decision output.

---

## 4. Explainability Flow

The Explainability Flow describes the permanent conceptual path from decision outcome to user-presentable explanation. It defines **what happens conceptually** — not how it is implemented, generated, or rendered.

```
Decision Outcome
    ↓
Evidence References
    ↓
Reasoning Assembly
    ↓
Confidence Context
    ↓
Uncertainty Context
    ↓
Alternative Consideration
    ↓
Explanation Package
    ↓
Presentation Layer
```

### 4.1 Stage Overview

| Stage | Explainability Engine Responsibility |
|-------|--------------------------------------|
| **Decision Outcome** | Receive the Decision Outcome from the Decision Intelligence Engine — Recommendation with provenance, evaluation reasoning, and evidence traceability |
| **Evidence References** | Bind Explanation to registered evidence artifacts referenced in the Decision Outcome |
| **Reasoning Assembly** | Construct explainable Reasoning from evaluation logic — without altering the Recommendation |
| **Confidence Context** | Articulate confidence boundaries honestly — what the evidence and evaluation support |
| **Uncertainty Context** | Surface material uncertainty, gaps, and limits from the Decision Outcome |
| **Alternative Consideration** | Identify and disclose reasonable alternatives considered during evaluation |
| **Explanation Package** | Assemble the complete explainability output for Presentation Layer consumption |
| **Presentation Layer** | Experience Layer presents the Explanation Package — it does not re-explain or alter reasoning |

### 4.2 Flow Invariants

The following invariants hold at every stage:

1. **No decision creation** — no stage forms, modifies, or replaces Recommendations
2. **No evidence invention** — no stage introduces evidence not in the Decision Outcome
3. **No confidence inflation** — no stage overstates certainty beyond evaluation bounds
4. **No agency reduction** — no stage pressures, compels, or manipulates user choice
5. **Provenance preserved** — every explanation element traces to Decision Outcome and evidence
6. **Contradiction disclosed** — contradicting evidence is not omitted for narrative simplicity

### 4.3 Relationship to Decision Intelligence Engine

The Decision Intelligence Engine produces Decision Outcomes at the **Explainability Assembly** stage and hands them to the Explainability Engine.

| Engine | Responsibility |
|--------|----------------|
| **Decision Intelligence Engine** | Forms Recommendation; preserves evaluation reasoning, evidence traceability, and uncertainty in Decision Outcome |
| **Explainability Engine** | Transforms Decision Outcome into Explanation Package — owns explainability semantics exclusively |

The Decision Intelligence Engine ensures explanation **capability** exists. The Explainability Engine ensures explanation **content** is assembled according to this specification.

---

## 5. Explanation Components

Every Explanation must be **capable** of answering the following six questions. These are permanent explanation components — not optional sections.

| Component | Question | Requirement |
|-----------|----------|-------------|
| **Why** | Why does this recommendation exist? | Reasoning and Decision Factors that connect evidence to guidance |
| **Evidence basis** | Based on what evidence? | Evidence Summary with Supporting and Contradicting Evidence identified |
| **Assumptions** | Which assumptions were applied? | Explicit premises from Decision Context and evaluation |
| **Uncertainty** | What uncertainty exists? | Confidence boundaries, gaps, and limits honestly disclosed |
| **Alternatives** | What alternatives exist? | Reasonable alternative directions considered or supported by evidence |
| **Sensitivity** | What additional information could change the recommendation? | Conditions under which guidance might differ — preserving intellectual honesty |

Failure to support any component — when material to the user's decision — constitutes an explainability failure requiring governance review.

### 5.1 Component Relationships

```
Explanation
├── Why → Reasoning + Decision Factors
├── Evidence basis → Evidence Summary
│       ├── Supporting Evidence
│       └── Contradicting Evidence (when material)
├── Assumptions
├── Uncertainty → Confidence Context + Uncertainty Context
├── Alternatives → Alternative Consideration
└── Sensitivity → Conditions for recommendation change
```

Components are conceptual capabilities — not prescribed formats, lengths, or presentation structures.

---

## 6. Trust Requirements

Explainability is a trust mechanism. The Explainability Engine must never violate the following permanent prohibitions.

| Prohibition | Rationale |
|-------------|-----------|
| **Hide uncertainty** | Violates Transparency, Scientific Integrity, and Explainability Before Accuracy Claims |
| **Invent evidence** | Violates Evidence Before Opinion and destroys Scientific Trust |
| **Overstate confidence** | Violates Scientific Integrity and Product Trust |
| **Remove user agency** | Violates Human Decision Authority and the recommendation model |
| **Pressure decisions** | Violates User Agency and brand prohibitions on fear-based expression |
| **Pretend certainty** | Violates Constitutional boundaries on prediction and deterministic claims |

These prohibitions align with Trust Architecture §7 (Trust Boundaries) and apply regardless of explanation format, language, or delivery channel.

### 6.1 Explainability Failures

An explainability failure occurs when:

- A decision-bearing Recommendation lacks Explanation capability
- Explanation content contradicts the Decision Outcome it claims to explain
- Material uncertainty or contradicting evidence is omitted
- Evidence references cannot be traced to registered sources
- Explanation framing pressures compliance or implies fate

Explainability failures require governance review — not silent correction in product copy.

---

## 7. Relationship with AI

Intelligence capabilities — including AI-assisted components — may support the Explainability Engine under strict subordination. AI supports explanation; it does not own it.

### 7.1 AI May

| Capability | Role |
|------------|------|
| **Translate** | Render Explanation content in user's language — without altering meaning |
| **Summarize** | Condense Explanation components for clarity — without omitting material uncertainty or contradicting evidence |
| **Personalize** | Adapt emphasis to user context — without manipulating or pressuring |
| **Converse** | Support natural-language exploration of Explanation content — advisory and explanatory only |

AI-assisted explanation must meet the same trust, evidence, and explainability standards as deterministic explanation.

### 7.2 AI May Not

| Prohibition | Rationale |
|-------------|-----------|
| **Change recommendations** | Decision authority and recommendation formation belong to the Decision Intelligence Engine |
| **Invent reasoning** | Reasoning must trace to Decision Outcome evaluation — not AI-generated narrative |
| **Modify evidence** | Evidence content belongs to the Evidence Pipeline and Decision Outcome — not AI embellishment |
| **Change confidence** | Confidence boundaries are set by evaluation — AI must not inflate or deflate them |

AI that violates these boundaries must not be deployed in the explainability pathway.

### 7.3 AI Accountability

AI-assisted explanation remains reviewable and auditable. Automated components must not introduce undisclosed reasoning or hidden transformation of explanation content.

No specific model, vendor, prompt, or technology is prescribed at this level.

---

## 8. Product Integration

All product modules consume **Explanation Packages** produced by the Explainability Engine. No module generates independent explanations.

### 8.1 Integration Model

```
Product Module
    ↓
Decision Request → Decision Intelligence Engine
    ↓
Decision Outcome → Explainability Engine
    ↓
Explanation Package
    ↓
Presentation Layer (Experience Layer)
    ↓
User (reviews, accepts, modifies, or rejects)
```

Modules receive Recommendation and Explanation together through the Presentation Layer — not by assembling explanation from raw engine internals.

### 8.2 Module Rules

1. **No independent explanations** — modules must not generate, paraphrase, or substitute explanation logic outside the Explainability Engine pathway
2. **No reasoning invention** — module copy must not assert reasoning not present in the Explanation Package
3. **No uncertainty concealment** — module presentation must not omit material uncertainty disclosed in the package
4. **No bypass** — modules must not present Recommendations without available Explanation capability
5. **Brand alignment** — presentation must conform to Brand Identity Standard tone — calm, scientific, explainable, never mystical

### 8.3 Module Consumption (Conceptual)

| Module | Explainability Relationship |
|--------|----------------------------|
| **Today** | Daily-scoped Explanation Packages for immediate decision context |
| **Calendar** | Temporal-scoped explanations across timing windows and periods |
| **Ask** | Question-scoped explanations for concrete user inquiries |
| **People** | Relational-scoped explanations for interpersonal decision context |
| **Provider** | Expert interpretation layered on Explanation Packages — augments, does not replace |
| **Julia** | Governed expert explanation subordinate to platform explainability standards |
| **Vault** | Domain-scoped depth explanations for exploratory evidence context |
| **Notifications** | Condensed explanation capability for timely prompts — without pressure or urgency manipulation |

Module presentation varies. Explanation semantics do not.

---

## 9. Future Evolution

The Explainability Engine structure is permanent. Its **expression** — formats, languages, accessibility patterns, and AI assistance — evolves through governance.

### 9.1 Adding Explanation Formats

New explanation formats (structured, narrative, conversational, visual) may be introduced.

New formats require:

- Compatibility review against this specification
- Verification that all six explanation components remain capable
- Trust Architecture alignment — no new format may hide uncertainty or invent evidence
- ADR when format affects Level 3 architecture

New formats change expression — not explanation obligations.

### 9.2 Localization

Explanation content may be localized across languages.

Localization must:

- Preserve meaning, uncertainty, and evidence attribution
- Not introduce culturally manipulative framing
- Remain reviewable against source Explanation Package content

Localization is translation of explanation — not re-decision.

### 9.3 Accessibility

Explanation delivery may evolve for accessibility needs.

Accessibility adaptation must preserve full explanation capability — condensed presentation must not omit material uncertainty, contradicting evidence, or assumptions.

### 9.4 Future AI Improvements

AI capabilities supporting explanation may improve over time.

AI evolution must:

- Remain subordinate to Section 7 constraints
- Not expand into recommendation or evidence modification
- Remain auditable under Trust Architecture

### 9.5 Maintaining Governance Compatibility

All explainability evolution must remain compatible with:

- [METIORO Constitution](../governance/METIORO_CONSTITUTION.md) — especially Explainability Before Accuracy Claims (§3.2)
- [Trust Architecture](../governance/TRUST_ARCHITECTURE.md) — explainability dimensions and trust boundaries
- [Decision Intelligence Engine Specification](./DECISION_INTELLIGENCE_ENGINE.md) — Decision Outcome handoff and recommendation boundaries
- [Evidence Pipeline Specification](./EVIDENCE_PIPELINE_SPECIFICATION.md) — evidence traceability requirements

Changes to explainability concepts, flow stages, or invariants require:

1. Compatibility review against Level 0–2 governance documents
2. ADR when the change affects implementation direction
3. Requirement Registry update when new obligations arise
4. Version increment of this specification per semantic versioning

Explainability evolution must not silently drift from constitutional commitments.

---

## Appendix — Explainability Principles

| # | Principle |
|---|-----------|
| 1 | **Explain, don't decide** — the engine explains decisions; it never creates them |
| 2 | **Transparency** — reasoning must be accessible, not concealed |
| 3 | **Evidence-first** — explanations trace to registered evidence |
| 4 | **Human-centered** — explanation serves user agency |
| 5 | **Reviewable** — users and governance can examine explanation basis |
| 6 | **Auditable** — provenance from Decision Outcome to Explanation Package is preserved |
| 7 | **Never persuasive** — explanation clarifies; it does not sell |
| 8 | **Never manipulative** — no pressure, fear, or vulnerability exploitation |
| 9 | **Six components** — Why, Evidence, Assumptions, Uncertainty, Alternatives, Sensitivity |
| 10 | **Contradiction disclosed** — contradicting evidence is not omitted |
| 11 | **Uncertainty honest** — confidence is not inflated |
| 12 | **AI subordinate** — AI may translate and summarize; it may not change decisions or evidence |
| 13 | **One pathway** — all modules consume Explanation Packages; no independent explanations |
| 14 | **Presentation separate** — Experience Layer presents; it does not re-explain |
| 15 | **Governance-gated evolution** — new formats and capabilities require compatibility review |

---

## Referenced Governance Documents

| Document | Relationship |
|----------|--------------|
| [METIORO Constitution](../governance/METIORO_CONSTITUTION.md) | Supreme authority — Explainability Before Accuracy Claims (§3.2) |
| [Trust Architecture](../governance/TRUST_ARCHITECTURE.md) | Explainability dimensions and trust boundaries |
| [Decision Intelligence Engine Specification](./DECISION_INTELLIGENCE_ENGINE.md) | Decision Outcome handoff — recommendation and evaluation source |
| [Evidence Pipeline Specification](./EVIDENCE_PIPELINE_SPECIFICATION.md) | Evidence traceability for Evidence Summary and references |
| [Phase 3 Architecture Blueprint](./PHASE3_ARCHITECTURE_BLUEPRINT.md) | Platform context — defers explainability detail to this document |
| [Brand Identity Standard](../governance/BRAND_IDENTITY_STANDARD.md) | Tone constraints on explanation expression |
| [Evidence Registry](../governance/EVIDENCE_REGISTRY.md) | Registered evidence referenced in explanations |
| [Requirement Registry](../governance/REQUIREMENT_REGISTRY.md) | Traceable obligations derived from explainability responsibilities |
| [Document Hierarchy](../governance/DOCUMENT_HIERARCHY.md) | Document placement (this specification: Level 3) |
| [Decision Log](../governance/DECISION_LOG.md) | Locked decisions (DEC-0001, DEC-0004) binding explainability behavior |

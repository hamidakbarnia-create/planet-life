# METIORO Phase 3 — Architecture Blueprint

> Status: Draft

**Version:** 1.0.0

**Authority:** This document derives from [METIORO Constitution](../governance/METIORO_CONSTITUTION.md), [Trust Architecture](../governance/TRUST_ARCHITECTURE.md), and [Brand Identity Standard](../governance/BRAND_IDENTITY_STANDARD.md).

**Document type:** Strategic architecture blueprint — not an engineering specification, ADR, or implementation guide.

**Purpose:** Define the long-term architecture of METIORO as a Personal Decision Intelligence platform. This document remains framework-independent and implementation-neutral.

**Date:** July 2026

---

## 1. Executive Summary

METIORO evolves from a feature-oriented product into a **Personal Decision Intelligence platform** — a unified system that helps users evaluate timing, context, and options when facing concrete life decisions.

The Phase 3 architectural vision centers on a single **Decision Intelligence Engine** fed by **multiple independent evidence frameworks**, delivered through **one coherent user experience**, with **explainability** and **trust** embedded at every layer — not added afterward.

METIORO **recommends**; the **user decides**. The platform provides structured, explainable guidance grounded in registered evidence. It does not predict fate, replace human judgment, or operate as entertainment astrology.

The governing orientation remains:

> **Know your best next move.**

Phase 3 architecture prioritizes **modularity**, **framework independence**, and **governance-protected evolution** — enabling new analytical frameworks and product modules without compromising constitutional identity, trust boundaries, or user agency.

---

## 2. Core Philosophy

### 2.1 One Decision Engine

METIORO operates through a single conceptual **Decision Intelligence Engine** — the platform's central orchestrator for turning evidence into actionable recommendations.

The engine is responsible for coordinating inputs, applying evaluation logic, producing recommendations, and ensuring explainability — regardless of which evidence frameworks contributed. There is one decision pathway; there are not parallel, competing decision systems per module or framework.

### 2.2 Multiple Evidence Frameworks

Analytical depth comes from **multiple independent evidence frameworks** — each a registered source of structured evidence, not a platform owner.

Frameworks contribute evidence to the engine. No single framework defines METIORO's identity. Astrology, psychology, behavioral analysis, and future frameworks coexist as **evidence providers**, governed by the Evidence Registry and subordinate to constitutional boundaries.

### 2.3 One User Experience

Users interact with **one coherent experience** — consistent vocabulary, tone, navigation semantics, and explainability patterns across all modules.

Module diversity must not fragment the product into disconnected apps with incompatible mental models. The Brand Identity Standard governs expression; the Experience Layer delivers unity.

### 2.4 Explainability by Design

Explainability is architectural, not cosmetic. Every important recommendation must be capable of answering: **Why?** **Based on what evidence?** **What assumptions?** **What uncertainty exists?**

Opaque outputs are architecturally prohibited. Explanation capability is designed into the Decision Layer and Intelligence Layer from the outset.

> **Canonical specification:** The authoritative conceptual model of explainability is defined exclusively in [EXPLAINABILITY_ENGINE_SPECIFICATION.md](./EXPLAINABILITY_ENGINE_SPECIFICATION.md). This section states platform intent only; explainability semantics live in that document.

### 2.5 Trust by Design

Trust is a cross-cutting architectural requirement — not a feature, marketing attribute, or post-hoc audit.

Trust Architecture principles (transparency, evidence, user agency, scientific integrity, privacy, accountability) constrain every layer. Capabilities that cannot meet trust requirements must not enter the architecture.

---

## 3. Platform Layers

METIORO is organized in six conceptual layers. These are **architectural responsibilities**, not implementation tiers.

```
Experience Layer
    ↓
Decision Layer
    ↓
Intelligence Layer
    ↓
Evidence Layer
    ↓
Data Layer
    ↓
Infrastructure Layer
```

### 3.1 Experience Layer

**Responsibility:** Present recommendations, explanations, and context to the user in a calm, clear, and consistent manner.

Delivers the **One User Experience**. Governs interaction patterns, module presentation, and user-facing communication — subordinate to Brand Identity Standard and UX Standards. Does not own decision logic or evidence production.

### 3.2 Decision Layer

**Responsibility:** Orchestrate the path from evidence to recommendation.

Hosts the **Decision Intelligence Engine**. Coordinates evaluation, scoring, recommendation formation, and explainability assembly. Ensures all outputs remain advisory and human authority is preserved.

### 3.3 Intelligence Layer

**Responsibility:** Apply reasoning, synthesis, and optional AI-assisted capabilities within declared boundaries.

Supports analysis, explanation generation, conversational guidance, and personalization — always subordinate to explainability and trust requirements. Does not override the Decision Layer or claim decision authority.

### 3.4 Evidence Layer

**Responsibility:** Produce, register, and deliver structured evidence from independent frameworks.

Each framework operates as an evidence contributor. Evidence must be traceable, reviewable, and registered before supporting user-facing claims. Governed by the Evidence Registry.

### 3.5 Data Layer

**Responsibility:** Manage user context, profiles, historical inputs, and analytical artifacts required by upper layers.

Handles birth data, preferences, decision history, and framework outputs — subject to privacy, consent, and Legal & Compliance Policies. Does not interpret or recommend.

### 3.6 Infrastructure Layer

**Responsibility:** Provide runtime, security, observability, and operational foundations for all layers above.

Enables scalability, auditability, and maintainability without defining product semantics. Subordinate to Engineering Standards when authored.

---

## 4. Decision Intelligence Engine

The Decision Intelligence Engine is the platform's central architectural component. It orchestrates decision support — it does not decide for the user.

> **Canonical specification:** The authoritative conceptual model — concepts, responsibilities, boundaries, and invariants — is defined exclusively in [DECISION_INTELLIGENCE_ENGINE.md](./DECISION_INTELLIGENCE_ENGINE.md). This section summarizes platform context only; it must not be used to redefine engine semantics.

### 4.1 Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **Evidence intake** | Accept structured evidence from registered frameworks |
| **Context assembly** | Combine user context, module intent, and temporal scope |
| **Evaluation** | Apply decision-relevant assessment across contributed evidence |
| **Recommendation formation** | Produce advisory guidance — not commands or predictions |
| **Explainability assembly** | Ensure every important output can be explained |
| **Uncertainty handling** | Surface limits, gaps, and confidence boundaries |
| **Module coordination** | Serve all product modules through one decision pathway |

### 4.2 Architectural Constraints

- The engine **recommends**; the **user decides**
- No module may bypass the engine with independent decision logic
- No framework may skip evidence registration
- Explainability is mandatory for decision-bearing outputs
- The engine must not present outputs as deterministic prediction

### 4.3 Non-Responsibilities

The engine does not: own user interface, store raw data, select AI models, implement framework calculations, or replace human expert judgment (e.g. Provider, Julia).

---

## 5. Evidence Pipeline

Evidence flows through a governed pipeline from source to user feedback. This is an architectural flow — not an implementation sequence.

> **Canonical specification:** The authoritative conceptual model — lifecycle stages, core concepts, quality dimensions, traceability, and integration rules — is defined exclusively in [EVIDENCE_PIPELINE_SPECIFICATION.md](./EVIDENCE_PIPELINE_SPECIFICATION.md). This section summarizes platform context only; it must not be used to redefine pipeline semantics.

```
Evidence
    ↓
Evaluation
    ↓
Recommendation
    ↓
Explainability
    ↓
Feedback
```

### 5.1 Evidence

Registered frameworks produce structured, traceable evidence artifacts. Unregistered or provisional evidence must not support user-facing claims.

### 5.2 Evaluation

The Decision Intelligence Engine assesses contributed evidence against user context, module intent, and decision scope. Evaluation synthesizes — it does not suppress dissenting evidence without disclosure.

### 5.3 Recommendation

The engine forms an **advisory recommendation** — a structured guidance output with visible reasoning. Recommendations are not predictions, commands, or fate declarations.

### 5.4 Explainability

Explanation dimensions are attached: why, evidence basis, assumptions, and uncertainty. Explanation is co-produced with the recommendation — not generated as an afterthought.

> **Canonical specification:** Full explainability flow, components, and trust requirements are defined in [EXPLAINABILITY_ENGINE_SPECIFICATION.md](./EXPLAINABILITY_ENGINE_SPECIFICATION.md).

### 5.5 Feedback

User interaction, override, and outcome context flow back into the system to support learning, calibration, and accountability — without compromising user agency or privacy. Feedback informs improvement; it does not automate future decisions for the user.

---

## 6. Framework Architecture

Evidence frameworks are **independent contributors** to the platform. None owns METIORO.

### 6.1 Framework Independence

Each framework:

- Operates under its own methodological rules
- Produces evidence in a registered format
- Is evaluated and approved through governance before user-facing use
- Can be added, updated, or deprecated without collapsing the platform

### 6.2 Current Framework Domains

| Framework | Architectural Role |
|-----------|-------------------|
| **Astrology** | Structured timing, context, and chart-based evidence derived from analytical methods — presented as decision support, not prophecy |
| **Psychology** | Behavioral and cognitive context evidence supporting decision framing and self-understanding |
| **Behavioral** | Pattern and preference evidence supporting action timing and habit-aware recommendations |
| **Future Frameworks** | Additional registered evidence domains (e.g. numerology, environmental, relational) admitted through governance review |

### 6.3 Framework Rules

1. **No framework owns the platform.** METIORO identity is Personal Decision Intelligence — not any single analytical tradition.
2. **Each framework contributes evidence.** Frameworks do not deliver final recommendations independently.
3. **Framework outputs must be explainable.** Methodological basis must be disclosable.
4. **Framework boundaries are constitutional.** No framework may position METIORO as fortune telling, mysticism, or deterministic prediction.
5. **New frameworks require governance admission.** Registration in the Evidence Registry before user-facing use.

---

## 7. AI Architecture

AI capabilities support the Decision Intelligence Engine and Experience Layer — they do not replace them.

### 7.1 Architectural Capabilities

| Capability | Responsibility |
|------------|----------------|
| **Reasoning** | Synthesize multi-framework evidence into coherent analytical narratives |
| **Explanation** | Generate human-readable reasoning aligned with explainability requirements |
| **Conversation** | Support natural-language interaction for decision exploration — advisory only |
| **Personalization** | Adapt presentation and emphasis to user context — without manipulating or pressuring |
| **Learning** | Improve quality over time from feedback and outcomes — with accountability and privacy constraints |

### 7.2 AI Constraints

- AI outputs meet the same trust, explainability, and evidence standards as deterministic outputs
- AI must not claim certainty, supernatural knowledge, or decision authority
- AI must not override human judgment or pressure users
- AI capabilities remain reviewable and auditable under Trust Architecture
- No specific model, vendor, or technology is prescribed at this level

---

## 8. Trust Architecture Integration

Trust Architecture is a **cross-cutting concern** — not a platform layer. It constrains all layers simultaneously.

### 8.1 Integration Model

```
         Trust Architecture (cross-cutting)
    ┌──────────┬──────────┬──────────┬──────────┐
    ↓          ↓          ↓          ↓          ↓
Experience  Decision  Intelligence  Evidence   Data
 Layer       Layer      Layer        Layer     Layer
    └──────────┴──────────┴──────────┴──────────┘
                        ↓
                 Infrastructure Layer
```

### 8.2 Trust Enforcement Points

| Layer | Trust Requirement |
|-------|-------------------|
| **Experience** | Calm, honest presentation; no pressure or mysticism |
| **Decision** | Advisory outputs; uncertainty surfaced |
| **Intelligence** | Explainable AI; no hidden reasoning |
| **Evidence** | Registered, traceable, non-fabricated |
| **Data** | Privacy, consent, purpose limitation |
| **Infrastructure** | Security, accountability, operational transparency |

Trust failures at any layer constitute architectural violations requiring governance review — not silent patches.

---

## 9. Product Modules

Product modules are **experience entry points** into the Decision Intelligence Engine. They share one engine, one evidence pipeline, and one trust model.

Modules describe **responsibilities** — not feature specifications.

| Module | Architectural Responsibility |
|--------|------------------------------|
| **Today** | Surface daily decision context and immediate guidance — the user's current decision horizon |
| **Calendar** | Present temporal decision landscape — timing windows and strategic visibility across days and periods |
| **Ask** | Accept concrete user questions and return evaluated, explainable recommendations |
| **People** | Provide relationship and interpersonal decision context — synastry, compatibility, and relational timing evidence |
| **Provider** | Connect users with human expert interpretation layered on platform evidence — expert augments, does not replace, engine output |
| **Julia** | Deliver governed human expert guidance — personal, contextual, and multilingual — subordinate to platform trust and explainability standards |
| **Vault** | Offer depth explorations of specific life domains through registered evidence frameworks — curiosity-driven, not mystical |
| **Notifications** | Deliver timely, calm, actionable decision prompts — without pressure, fear, or engagement manipulation |

### 9.1 Module Rules

1. All modules route through the Decision Intelligence Engine
2. No module owns independent evidence or recommendation logic
3. All modules conform to Brand Identity Standard and Trust Architecture
4. Module additions require governance review and compatibility assessment

---

## 10. Scalability Principles

Phase 3 architecture scales through principles — not premature optimization.

| Principle | Meaning |
|-----------|---------|
| **Framework independence** | New evidence domains integrate without platform redesign |
| **Modularity** | Layers and modules evolve independently within governance boundaries |
| **Explainability** | Scale does not reduce explanation quality or traceability |
| **Observability** | System behavior is monitorable across layers for trust and quality |
| **Maintainability** | Architectural clarity prevents fragmentation and duplication |
| **Auditability** | Evidence, decisions, and outputs remain traceable for governance review |

---

## 11. Future Evolution

### 11.1 Adding New Frameworks

1. Propose framework scope and methodological boundaries
2. Register in Evidence Registry after governance review
3. Integrate as Evidence Layer contributor — not as platform identity
4. Verify constitutional compatibility (no mysticism, no deterministic prediction)
5. Require explainability validation before user-facing release

### 11.2 Adding New Modules

1. Define module responsibility and decision scope
2. Verify routing through Decision Intelligence Engine
3. Assess Brand Identity Standard and Trust Architecture compatibility
4. Register requirements in Requirement Registry
5. Author ADR if module affects Level 3+ architecture

### 11.3 Governance Protection

Evolution is governed, not ad hoc:

- **Constitution** — identity, principles, and boundaries remain stable
- **Trust Architecture** — trust requirements apply to all new capabilities
- **Evidence Registry** — no unregistered evidence in production
- **Requirement Registry** — new obligations are traceable
- **ADR Index** — structural changes are recorded
- **Decision Log** — permanent choices are registered

Architecture evolves. Constitutional commitments do not drift silently.

---

## Appendix — Architecture Principles

| # | Principle |
|---|-----------|
| 1 | **One engine** — single Decision Intelligence Engine for all modules |
| 2 | **Many frameworks** — independent evidence contributors, none owning the platform |
| 3 | **One experience** — coherent user-facing identity across modules |
| 4 | **Recommend, don't decide** — user retains final authority |
| 5 | **Explain everything important** — reasoning is architectural, not optional |
| 6 | **Trust before intelligence** — no capability ships at the expense of trust |
| 7 | **Evidence before opinion** — claims require registered, traceable evidence |
| 8 | **Framework independence** — frameworks integrate without coupling |
| 9 | **Governance-gated evolution** — new frameworks, modules, and layers require review |
| 10 | **Never mystical** — architecture must not enable fortune telling, prophecy, or fate-based positioning |
| 11 | **Uncertainty is honest** — limitations are surfaced, not concealed |
| 12 | **Implementation follows architecture** — this blueprint does not prescribe technology |

---

## Referenced Governance Documents

| Document | Relationship |
|----------|--------------|
| [METIORO Constitution](../governance/METIORO_CONSTITUTION.md) | Supreme authority |
| [Trust Architecture](../governance/TRUST_ARCHITECTURE.md) | Cross-cutting trust requirements |
| [Brand Identity Standard](../governance/BRAND_IDENTITY_STANDARD.md) | Experience and communication constraints |
| [Evidence Registry](../governance/EVIDENCE_REGISTRY.md) | Framework admission and evidence governance |
| [Requirement Registry](../governance/REQUIREMENT_REGISTRY.md) | Traceable architectural requirements |
| [Document Hierarchy](../governance/DOCUMENT_HIERARCHY.md) | Document placement (this blueprint: strategic architecture, Level 3 adjacent) |
| [Decision Intelligence Engine Specification](./DECISION_INTELLIGENCE_ENGINE.md) | Canonical engine authority — all engine semantics derive from this document |
| [Evidence Pipeline Specification](./EVIDENCE_PIPELINE_SPECIFICATION.md) | Canonical pipeline authority — all evidence flow semantics derive from this document |
| [Explainability Engine Specification](./EXPLAINABILITY_ENGINE_SPECIFICATION.md) | Canonical explainability authority — all explanation semantics derive from this document |

**Related document:** [PHASE2_ARCHITECTURE_BASELINE.md](../../PHASE2_ARCHITECTURE_BASELINE.md) — current-state audit and migration baseline (root).

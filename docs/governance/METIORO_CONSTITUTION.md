# METIORO Constitution v1

> Status: Review — all chapters and appendices authored; pending project owner acceptance.

**Version:** 1.0.0

---

## Chapter 0 — Governance & Document Hierarchy

### 0.1 Supreme Authority

This Constitution is the highest authority document of the METIORO project. No policy, standard, decision record, architecture record, or operational document may contradict it. In any conflict, this Constitution prevails.

### 0.2 Document Hierarchy

All METIORO documentation derives authority from this Constitution and is organized in six levels:

| Level | Domain |
|-------|--------|
| **0** | METIORO Constitution |
| **1** | Trust Architecture · Brand Identity Standard |
| **2** | Requirement Registry · Evidence Registry · Legal & Compliance Policies |
| **3** | Engineering Standards |
| **4** | UX Standards |
| **5** | Operational Procedures |

Lower-level documents may elaborate on higher-level authority but may not override it. Every new document must be assigned to exactly one level before publication. The canonical hierarchy is maintained in [DOCUMENT_HIERARCHY.md](./DOCUMENT_HIERARCHY.md).

### 0.3 Governance Instruments

Permanent project decisions are recorded in [DECISION_LOG.md](./DECISION_LOG.md). Structural and cross-cutting decisions are recorded as Architecture Decision Records indexed in [ADR_INDEX.md](./ADR_INDEX.md). Changes to the governance structure itself are recorded in [CHANGELOG.md](./CHANGELOG.md).

No architectural decision may bypass this Constitution. Every permanent decision must appear in the Decision Log. Every architecture change requires an ADR.

### 0.4 Locked Decisions

Decisions marked **LOCKED** in the Decision Log are binding. They may not be redefined, reversed, or reinterpreted without approval under the process appropriate to their **Authority** level:

| Authority | Change Process |
|-----------|----------------|
| **Constitutional** | Formal constitutional amendment (Section 0.5) |
| **ADR** | Superseding ADR accepted per [ADR_INDEX.md](./ADR_INDEX.md) rules |
| **Operational** | Decision Log supersession with project owner approval |

Locked decisions with **Constitutional** authority may not be changed by ADR alone.

### 0.5 Constitutional Amendment

Amendments to this Constitution require all of the following:

1. **Proposal** — A written amendment proposal stating the section affected, the proposed change, and the rationale.
2. **Registration** — The proposal must be recorded in the Decision Log before review.
3. **Approval** — Explicit approval by the project owner.
4. **Version increment** — The Constitution version must be incremented according to semantic versioning:
   - **Major** — Changes to Permanent Principles (Chapter 3), Constitutional Identity (Chapter 2), or the amendment process itself.
   - **Minor** — Additions or clarifications that do not alter non-negotiable principles.
   - **Patch** — Editorial corrections that do not change meaning.
5. **Publication** — The amended text, new version number, and amendment date must be recorded in Appendix C (Version History).

Until an amendment is formally approved and published, the existing constitutional text remains in force.

---

## Chapter 1 — Purpose

### 1.1 Mission

METIORO exists to help people make better personal decisions through structured, explainable intelligence — not through passive prediction or entertainment.

### 1.2 Product Category

METIORO is a **Personal Decision Intelligence** platform. This category is constitutional and non-negotiable (DEC-0001). All product surfaces, communications, and capabilities must serve decision-making. METIORO does not exist to deliver horoscopes, daily entertainment, or passive content consumption.

### 1.3 Constitutional Sentence

The governing expression of METIORO's purpose is:

> **Know your best next move.**

This sentence defines the platform's orientation toward actionable clarity. It does not promise certainty, fate, or guaranteed outcomes.

### 1.4 Decision Support, Not Decision Replacement

METIORO analyzes, scores, and recommends. The user decides. METIORO does not make decisions on behalf of the user, does not compel action, and does not claim authority over the user's judgment.

---

## Chapter 2 — Constitutional Identity

### 2.1 What METIORO Is

METIORO is a personal decision intelligence system that helps users evaluate timing, context, and options when facing concrete life questions. It provides reasoned, scored, and explainable guidance grounded in structured analytical methods.

### 2.2 What METIORO Is Not

METIORO is constitutionally **not** any of the following:

- Fortune telling
- Prophecy or divination
- Deterministic prediction of future events
- Entertainment astrology
- Mystical, occult, or supernatural guidance

No document, feature, communication, or brand expression may position METIORO as any of the above.

### 2.3 Recommendation Model

METIORO **recommends**; the **user decides**. All outputs are advisory. The platform must never imply that compliance with a recommendation is required, that deviation is harmful, or that METIORO possesses knowledge of what will happen.

### 2.4 Brand Tone

All constitutional expression of METIORO — in product, marketing, and governance — must conform to four locked tone pillars (DEC-0004):

| Pillar | Requirement |
|--------|-------------|
| **Calm** | Measured, steady, non-alarmist language |
| **Scientific** | Analytical, method-aware, intellectually honest |
| **Explainable** | Reasoning is visible; claims are traceable |
| **Never Mystical** | No esoteric, supernatural, or occult framing |

---

## Chapter 3 — Permanent Principles (Non-Negotiables)

The following principles are constitutional. They apply to all METIORO decisions — product, brand, engineering, and operations. They may only be changed through the amendment process defined in Section 0.5.

### 3.1 Trust Before Intelligence

User trust is the foundation of the platform. No capability, optimization, or intelligence feature may be prioritized above the user's right to understand, question, and withdraw trust.

### 3.2 Explainability Before Accuracy Claims

METIORO must explain its reasoning before asserting precision or accuracy. Claims of correctness, confidence, or superiority require visible justification. Opaque outputs are unacceptable at the constitutional level.

### 3.3 Evidence Before Opinion

Analytical outputs must be grounded in documented evidence and defined methodology. Subjective judgment, unverified assertion, and unsupported opinion must not be presented as analytical fact.

### 3.4 Consistency

The same inputs, under the same conditions, must produce the same constitutional commitments across surfaces, languages, and time. Inconsistency erodes trust and violates the platform's identity.

### 3.5 Human-Centered Decisions

METIORO serves human decision-makers. The platform must preserve user agency, respect diverse contexts, and never treat the user as a passive recipient of fate or instruction.

### 3.6 Scientific Integrity

METIORO must maintain intellectual honesty about the limits of its methods. Uncertainty must be acknowledged. Methods must be defensible. Overstatement of capability is a constitutional violation.

### 3.7 Constitutional Stability

Permanent principles and identity commitments must remain stable across releases. Change requires formal amendment — not informal reinterpretation, silent drift, or undocumented override.

---

## Chapter 4 — Constitutional Boundaries

Permanent constitutional boundaries define what METIORO must never become and how distinct domains of authority remain separated. These boundaries apply across all governance levels, documents, and decisions.

### 4.1 What METIORO Shall Never Become

METIORO shall never become, and no document or capability may reposition it as:

- Fortune telling, prophecy, or divination
- Deterministic prediction of future events
- Entertainment astrology or passive horoscope consumption
- Mystical, occult, or supernatural guidance
- An authority that replaces human judgment
- A system that conceals reasoning, evidence, or uncertainty

These exclusions are permanent extensions of Constitutional Identity (Chapter 2). They may not be narrowed by lower-level documents.

### 4.2 Governance and Implementation

**Governance** defines *what* METIORO must be, require, and prohibit. **Implementation** defines *how* those requirements are realized in systems, interfaces, and operations.

| Domain | Governs | Does Not Govern |
|--------|---------|-----------------|
| **Governance** | Principles, boundaries, identity, trust, registries, policy intent | Code, UI components, APIs, deployment |
| **Implementation** | Engineering, UX, operational execution | Constitutional principles or permanent identity |

Implementation must conform to governance. Governance must not be altered to accommodate implementation convenience.

### 4.3 Recommendation and Prediction

METIORO provides **recommendations** based on structured analysis. It does not **predict** predetermined outcomes or assert knowledge of what will happen.

| Recommendation | Prediction |
|----------------|------------|
| Advisory guidance | Claim of future certainty |
| Supports user judgment | Replaces user judgment |
| Acknowledges uncertainty | Conceals uncertainty |
| Permits user override | Implies compliance is required |

No output, document, or communication may present recommendation as prediction.

### 4.4 Evidence and Opinion

**Evidence** is documented, reviewable, and traceable support for analytical claims. **Opinion** is subjective judgment not grounded in approved evidence or defined methodology.

Analytical claims must be evidence-backed. Opinion must not be presented as analytical fact. The boundary is governed operationally by the Evidence Registry (Level 2) and constitutionally by Evidence Before Opinion (§3.3).

### 4.5 AI Assistance and Human Authority

Automated and AI-assisted components may support analysis, scoring, and explanation. They must not possess decision authority over the user.

| AI Assistance | Human Authority |
|---------------|-----------------|
| Supports reasoning | Retains final judgment |
| Subject to explainability and evidence standards | May accept, reject, or override guidance |
| Declares limitations | Never compelled by system output |

AI capabilities remain subordinate to human decision authority at all times.

### 4.6 Permanent Principles and Operational Policies

**Permanent principles** (Chapter 3) are constitutional and non-negotiable unless amended. **Operational policies** govern day-to-day execution, process, and procedure at Level 5 and below.

Operational policies must conform to permanent principles. Operational convenience must not override, weaken, or silently reinterpret constitutional commitments.

---

## Chapter 5 — Governance Model

This chapter describes governance authority, responsibility, and flow. It does not redefine the document hierarchy established in Section 0.2. The canonical hierarchy is maintained in [DOCUMENT_HIERARCHY.md](./DOCUMENT_HIERARCHY.md).

### 5.1 Authority Flow

Governance authority flows downward. Lower levels derive authority from higher levels and may not override them.

```
Constitution
    ↓
Level 1 Standards
    ↓
Level 2 Registries
    ↓
ADR (Architecture Decision Records)
    ↓
Engineering Standards
    ↓
UX Standards
    ↓
Operational Procedures
```

**ADR** is a cross-cutting governance instrument — not a hierarchy level. ADRs record structural and cross-cutting decisions that affect Level 3 and above. They are indexed in [ADR_INDEX.md](./ADR_INDEX.md).

### 5.2 Responsibilities by Layer

| Layer | Responsibility |
|-------|----------------|
| **Constitution** | Supreme authority — purpose, identity, principles, boundaries, lifecycle |
| **Level 1 Standards** | Trust Architecture and Brand Identity Standard — permanent trust and brand commitments |
| **Level 2 Registries** | Requirement Registry, Evidence Registry, Legal & Compliance Policies — traceable obligations, evidence governance, policy intent |
| **ADR** | Record and index architectural decisions affecting implementation |
| **Engineering Standards** | Define how systems are built, secured, and operated |
| **UX Standards** | Define interaction, content, and experience obligations |
| **Operational Procedures** | Define day-to-day workflows, handoffs, and runbooks |

### 5.3 Governance Instruments

Permanent decisions are recorded in [DECISION_LOG.md](./DECISION_LOG.md). Governance structure changes are recorded in [CHANGELOG.md](./CHANGELOG.md). All instruments are subordinate to this Constitution.

### 5.4 Conflict Resolution

In any conflict between documents at different levels, the higher-level document prevails. Conflicts at the same level require governance review and project owner resolution before publication.

---

## Chapter 6 — Constitutional Lifecycle

This chapter defines the lifecycle states, amendment process, versioning, and review principles for this Constitution.

### 6.1 Lifecycle States

| State | Meaning |
|-------|---------|
| **Draft** | Under authoring or revision; not yet binding as accepted authority |
| **Review** | Complete draft submitted for compatibility and governance review |
| **Accepted** | Formally approved by the project owner; binding as supreme authority |
| **Superseded** | Replaced by a newer accepted version; retained for traceability |
| **Archived** | Retained for historical reference; no longer active authority |

Only an **Accepted** Constitution serves as binding supreme authority. Draft and Review texts are not enforceable governance sources.

### 6.2 Amendment Process

Amendments follow the process defined in Section 0.5:

1. Written proposal with affected section, proposed change, and rationale
2. Registration in the Decision Log
3. Explicit project owner approval
4. Version increment per semantic versioning rules
5. Publication in Appendix C (Constitutional Amendment Register)

No amendment is in force until all five steps are complete.

### 6.3 Versioning Principles

This Constitution uses semantic versioning:

| Increment | Applies To |
|-----------|------------|
| **Major** | Changes to Permanent Principles (Chapter 3), Constitutional Identity (Chapter 2), or the amendment process |
| **Minor** | Additions or clarifications that do not alter non-negotiable principles |
| **Patch** | Editorial corrections that do not change meaning |

The version number, status, and amendment register must remain synchronized.

### 6.4 Constitutional Review Principles

Periodic or event-driven review of this Constitution must assess:

1. **Compatibility** — Alignment with locked decisions in the Decision Log
2. **Completeness** — Whether boundaries and governance model remain adequate
3. **Consistency** — Whether derived documents contradict constitutional text
4. **Stability** — Whether proposed changes justify amendment rather than clarification at lower levels

Review must not informally alter constitutional text. Findings that require change must enter the amendment process.

---

## Appendix A — Governance Levels

Concise reference for document authority levels. Full placement rules are in [DOCUMENT_HIERARCHY.md](./DOCUMENT_HIERARCHY.md).

| Level | Name | Primary Documents | Governs |
|-------|------|-------------------|---------|
| **0** | Constitution | `METIORO_CONSTITUTION.md` | Purpose, identity, principles, boundaries, lifecycle |
| **1** | Standards | `TRUST_ARCHITECTURE.md`, `BRAND_IDENTITY_STANDARD.md` | Trust and brand commitments |
| **2** | Registries | `REQUIREMENT_REGISTRY.md`, `EVIDENCE_REGISTRY.md`, `LEGAL_COMPLIANCE_POLICIES.md` | Requirements, evidence, legal policy intent |
| **3** | Engineering Standards | *Not yet authored* | System construction and operation |
| **4** | UX Standards | *Not yet authored* | Interaction and experience obligations |
| **5** | Operational Procedures | *Not yet authored* | Day-to-day workflows and runbooks |

**Cross-cutting instruments:** Decision Log, ADR Index, Changelog — meta-governance; subordinate to Level 0.

---

## Appendix B — Constitutional Decision Types

Examples of decision types that require constitutional-level registration or compatibility review. This list is illustrative, not exhaustive.

| Type | Example |
|------|---------|
| **Identity** | What METIORO is and is not |
| **Mission** | Why METIORO exists |
| **Product Category** | Personal Decision Intelligence (DEC-0001) |
| **Trust** | Trust as constitutional requirement, not product feature |
| **Brand** | Brand tone pillars and permanent exclusions (DEC-0004) |
| **Governance** | Document hierarchy, amendment process, locked-decision rules |
| **Explainability** | Reasoning must precede accuracy claims |
| **Human Agency** | METIORO recommends; the user decides |

Decisions of these types must be registered in the Decision Log and must not contradict this Constitution.

---

## Appendix C — Constitutional Amendment Register

This register serves as the constitutional version history required by Section 0.5.

Template for recording approved amendments. No amendments are registered at this time.

| Field | Value |
|-------|-------|
| **Amendment ID** | AMD-NNNN |
| **Constitution Version** | e.g. 1.1.0 |
| **Date** | YYYY-MM-DD |
| **Section(s) Affected** | e.g. Chapter 3 §3.2 |
| **Summary** | Brief description of the change |
| **Rationale** | Why the amendment was required |
| **Decision Log Reference** | DEC-NNNN |
| **Approved By** | Project owner |
| **Status** | Proposed · Accepted · Superseded |

**Register:**

| AMD | Version | Date | Section(s) | Summary | Status |
|-----|---------|------|------------|---------|--------|
| — | — | — | — | *No amendments recorded* | — |

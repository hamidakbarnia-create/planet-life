# METIORO Evidence Registry

> Status: Draft

**Version:** 1.0.0

**Authority:** This document derives from [METIORO_CONSTITUTION.md](./METIORO_CONSTITUTION.md), [BRAND_IDENTITY_STANDARD.md](./BRAND_IDENTITY_STANDARD.md), and [TRUST_ARCHITECTURE.md](./TRUST_ARCHITECTURE.md) (Level 2).

**Hierarchy level:** 2 — Evidence Registry

---

## 1. Purpose

### 1.1 Role of the Evidence Registry

This registry governs how evidence is categorized, qualified, traced, reviewed, and maintained within METIORO. It is the authoritative catalog for approved evidence sources and frameworks that may support user-facing analytical claims.

This document defines *evidence governance* — not evidence frameworks themselves. Approved analytical frameworks, datasets, rule sets, and source taxonomies will be registered as entries after separate governance review. They are not defined here.

### 1.2 Relationship to Trust Architecture

Evidence governance implements the **Evidence** trust principle (Trust Architecture §2) and the Evidence Framework requirements (Trust Architecture §5). No analytical output may claim evidentiary support unless its source is registered and meets the quality standards defined here.

### 1.3 Scope

This registry operates at the governance level. It does not define calculation methods, scoring algorithms, API payloads, database schemas, or UI presentation of evidence.

---

## 2. Evidence Principles

All evidence registered in METIORO must conform to the following permanent principles:

| Principle | Requirement |
|-----------|-------------|
| **Traceability** | Every evidence-backed claim must be traceable to a registered source. |
| **Defensibility** | Evidence must be reviewable and methodologically defensible at the governance level. |
| **Honesty** | Evidence limitations, gaps, and uncertainty must be documentable — not concealed. |
| **Non-fabrication** | Evidence must not be invented, misrepresented, or implied where none exists. |
| **Approval** | No evidence source may support user-facing claims until registered and approved. |
| **Deprecation** | Retired evidence sources must be marked and must not silently persist in active outputs. |

These principles align with Constitution §3.3 (Evidence Before Opinion) and Trust Architecture §7 (Trust Boundaries).

---

## 3. Evidence Categories

Evidence registered in METIORO is classified into permanent categories. Each entry must belong to exactly one category.

| Category | Description |
|----------|-------------|
| **Analytical Framework** | A structured method or rule set used to derive scores, recommendations, or interpretations. |
| **Computational Source** | An engine, library, or deterministic calculation layer that produces analytical outputs. |
| **Reference Dataset** | A documented dataset used as input to analytical processes. |
| **Rule Set** | A defined collection of conditional logic applied to analytical inputs. |
| **External Reference** | A third-party source cited for validation, comparison, or methodological alignment. |
| **Human Expert Input** | Governed expert judgment applied under documented constraints — not unreviewed opinion. |

Category assignment determines review criteria and quality thresholds. Framework definitions and source taxonomies will be added as registered entries — not in this document.

---

## 4. Evidence Quality Levels

Evidence entries are assigned a quality level reflecting their governance review status and fitness for supporting claims.

| Level | Name | Meaning |
|-------|------|---------|
| **E0** | Unregistered | Not approved. Must not support user-facing claims. |
| **E1** | Provisional | Under review. May be used internally only; not for user-facing claims. |
| **E2** | Approved | Passed governance review. May support user-facing claims within declared scope. |
| **E3** | Locked | Permanent approved source. Change requires formal re-review and may require ADR. |
| **E4** | Deprecated | No longer active. Retained for traceability. Must not support new outputs. |

### Quality Rules

1. User-facing claims require **E2** or **E3** evidence at minimum.
2. **E1** evidence must not appear in user-facing outputs without explicit governance waiver.
3. **E4** evidence must be excluded from active pipelines.
4. Quality level downgrades require documented rationale and traceability update.

---

## 5. Evidence Traceability

### 5.1 Upward Traceability

Every evidence entry must trace upward to:

- A governing requirement in [REQUIREMENT_REGISTRY.md](./REQUIREMENT_REGISTRY.md), or
- A trust or constitutional principle in [TRUST_ARCHITECTURE.md](./TRUST_ARCHITECTURE.md) or [METIORO_CONSTITUTION.md](./METIORO_CONSTITUTION.md)

Evidence without upward traceability must not be approved.

### 5.2 Downward Traceability

Approved evidence must be traceable downward to:

- Outputs, recommendations, or claims it supports
- Engineering Standards (Level 3) that implement it
- ADRs (ADR-NNNN) that govern its adoption or modification

### 5.3 Output Linkage

Every important recommendation capable of evidentiary support must be able to reference the registered evidence entry (or entries) that produced it — satisfying the explainability dimension **Based on what evidence?** (Trust Architecture §4.2).

---

## 6. Evidence Review

### 6.1 Registration Review

New evidence entries require governance review before approval. Review must assess:

- Methodological defensibility
- Compatibility with constitutional identity and trust boundaries
- Declared scope and limitations
- Traceability to requirements and governing documents

### 6.2 Periodic Review

Approved evidence (E2, E3) is subject to periodic governance review to confirm continued validity, scope accuracy, and alignment with current standards.

### 6.3 Modification and Deprecation

Changes to locked evidence (E3) require:

1. Documented rationale
2. Compatibility review against Trust Architecture and Constitution
3. ADR where the change affects analytical architecture
4. Update to all downstream traceability links

Deprecation must not leave active outputs referencing retired evidence without migration plan.

---

## 7. Governance

### 7.1 Authority

This Evidence Registry is a Level 2 document subordinate to the Constitution and Level 1 documents. It implements trust and evidence requirements but may not weaken them.

### 7.2 Relationship to Other Documents

| Document | Relationship |
|----------|--------------|
| [METIORO_CONSTITUTION.md](./METIORO_CONSTITUTION.md) | Supreme authority — Evidence Before Opinion (§3.3) |
| [TRUST_ARCHITECTURE.md](./TRUST_ARCHITECTURE.md) | Evidence Framework governance (§5) |
| [REQUIREMENT_REGISTRY.md](./REQUIREMENT_REGISTRY.md) | Requirements that evidence must satisfy |
| [LEGAL_COMPLIANCE_POLICIES.md](./LEGAL_COMPLIANCE_POLICIES.md) | Regulatory constraints on evidence use |
| [ADR_INDEX.md](./ADR_INDEX.md) | Architecture decisions affecting evidence adoption |
| Engineering Standards | Level 3 — implementation of registered evidence |
| [Explainability Engine Specification](../architecture/EXPLAINABILITY_ENGINE_SPECIFICATION.md) | Level 3 — evidence references in explanations must trace to registered entries |

### 7.3 Approved Frameworks

Approved evidence frameworks will be added to this registry as formal entries after governance review. Until registered, no framework may be cited as approved evidence for user-facing claims.

---

## 8. Future Extensions

The following may extend this registry. They are anticipated but **not defined here**:

| Future Extension | Purpose |
|------------------|---------|
| **Source Taxonomy** | Detailed classification of evidence types and subtypes |
| **Evidence entry templates** | Standardized registration forms per category |
| **Validation protocols** | Review checklists and approval criteria per category |
| **Cross-reference index** | Mapping of evidence to outputs and requirements |
| **Quality Metrics** | Measurement of evidence reliability over time |

Future extensions must remain compatible with this registry and require governance review before adoption.

---

## Appendix — Referenced Governance Documents

| Document | Relationship |
|----------|--------------|
| [METIORO_CONSTITUTION.md](./METIORO_CONSTITUTION.md) | Supreme authority (Level 0) |
| [TRUST_ARCHITECTURE.md](./TRUST_ARCHITECTURE.md) | Evidence governance source (Level 1) |
| [BRAND_IDENTITY_STANDARD.md](./BRAND_IDENTITY_STANDARD.md) | Brand constraints on evidence presentation (Level 1) |
| [REQUIREMENT_REGISTRY.md](./REQUIREMENT_REGISTRY.md) | Peer Level 2 — requirement dependencies |
| [LEGAL_COMPLIANCE_POLICIES.md](./LEGAL_COMPLIANCE_POLICIES.md) | Peer Level 2 — regulatory constraints |
| [DOCUMENT_HIERARCHY.md](./DOCUMENT_HIERARCHY.md) | Placement and authority levels |
| [Evidence Pipeline Specification](../architecture/EVIDENCE_PIPELINE_SPECIFICATION.md) | Level 3 — conceptual evidence flow; Validation stage enforces registry quality levels |

**Registered evidence entries:** *None yet — registry framework only. Approved evidence frameworks will be added later.*

---

## Eligibility States (ACR-0001)

Normative eligibility vocabulary for binding evidence to Decision Cases (see [ACR-0001 §B6](../architecture/ARCHITECTURE_CONSOLIDATION_RESOLUTION.md)):

| State | May support decision-bearing claims? |
|-------|--------------------------------------|
| `supported` | Yes |
| `partial` | Yes, with mandatory confidence penalty |
| `unknown` | No |
| `unavailable` | No — must surface in improve_accuracy / penalties |
| `provisional` | Yes only under ACR M1 provisional policy with labeled claims + confidence cap |
| `rejected` | No |

This registry remains the sole authority for **framework registration**. ACR governs how eligibility states constrain recommendations. After migration phase M2, decision-bearing claims without eligible evidence are rejected.

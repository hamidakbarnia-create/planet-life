# METIORO Requirement Registry

> Status: Draft

**Version:** 1.0.0

**Authority:** This document derives from [METIORO_CONSTITUTION.md](./METIORO_CONSTITUTION.md), [BRAND_IDENTITY_STANDARD.md](./BRAND_IDENTITY_STANDARD.md), and [TRUST_ARCHITECTURE.md](./TRUST_ARCHITECTURE.md) (Level 2).

**Hierarchy level:** 2 — Requirement Registry

---

## 1. Purpose

### 1.1 Role of the Requirement Registry

This registry is the single source of truth for permanent METIORO product requirements. It defines how requirements are categorized, identified, traced, governed, and maintained across the project lifecycle.

This document governs the *registry itself* — not individual requirements. Actual requirements are registered entries; they are not defined here.

### 1.2 Relationship to Higher Authority

All registered requirements must remain compatible with:

- The METIORO Constitution (Level 0)
- Trust Architecture and Brand Identity Standard (Level 1)
- Legal & Compliance Policies (Level 2)

A requirement that contradicts a higher-level document is invalid and must not be registered or retained.

### 1.3 Scope

The Requirement Registry covers permanent obligations — what METIORO must do, must not do, or must always support. It does not contain implementation details, UI specifications, API contracts, or roadmap items.

---

## 2. Requirement Categories

Requirements are classified into five permanent categories. Each registered requirement must belong to exactly one category.

| Category | Scope |
|----------|-------|
| **Constitutional** | Requirements derived directly from the Constitution, Decision Log, or constitutional amendment. Non-negotiable unless amended. |
| **Regulatory** | Requirements derived from legal, compliance, or jurisdictional obligations defined in Legal & Compliance Policies. |
| **Product** | Requirements governing product behavior, capabilities, and boundaries at the governance level — not feature specifications. |
| **Engineering** | Requirements governing how systems must be built, secured, tested, or operated — registered here; detailed standards belong in Engineering Standards (Level 3). |
| **UX** | Requirements governing user experience obligations — registered here; detailed standards belong in UX Standards (Level 4). |

Category assignment determines review authority and change process. Constitutional requirements may not be downgraded without constitutional amendment.

---

## 3. Requirement Lifecycle

Every registered requirement follows a defined lifecycle:

| State | Meaning |
|-------|---------|
| **Proposed** | Drafted and submitted for review; not yet binding. |
| **Accepted** | Approved and binding; must be satisfied by all applicable capabilities. |
| **Locked** | Permanent; change requires formal governance process equivalent to the requirement's authority level. |
| **Deprecated** | No longer active for new work; retained for traceability. |
| **Superseded** | Replaced by a newer requirement; must reference the successor. |

### Lifecycle Rules

1. No requirement may skip from Proposed to Locked without explicit approval.
2. Deprecated requirements must not silently persist in active systems.
3. Superseded requirements must remain traceable to their replacement.
4. Requirements affecting trust, identity, or legal compliance require elevated review before acceptance.

---

## 4. Requirement IDs

### 4.1 Identifier Format

Registered requirements use the format:

```
REQ-NNNN
```

Four-digit zero-padded numbering (e.g. `REQ-0001`, not `REQ-001`).

### 4.2 ID Rules

1. IDs are permanent and never reused.
2. Each ID maps to exactly one requirement entry.
3. New requirements receive the next available sequential ID.
4. Superseded requirements retain their original ID; the successor receives a new ID with a cross-reference.

### 4.3 Entry Format

Each registered requirement entry must include at minimum:

| Field | Description |
|-------|-------------|
| **ID** | Unique identifier (REQ-NNNN) |
| **Title** | Short descriptive name |
| **Category** | Constitutional · Regulatory · Product · Engineering · UX |
| **Status** | Proposed · Accepted · Locked · Deprecated · Superseded |
| **Source** | Governing document or decision that originated the requirement |
| **Statement** | What METIORO must do, not do, or always support |
| **Rationale** | Why the requirement exists |
| **Traceability** | Links to evidence, ADRs, or dependent requirements |

---

## 5. Requirement Traceability

### 5.1 Upward Traceability

Every requirement must trace upward to at least one governing authority:

- Constitution chapter or section
- Decision Log entry (DEC-NNNN)
- Trust Architecture or Brand Identity Standard section
- Legal & Compliance Policies section
- ADR (ADR-NNNN)

Requirements without upward traceability must not be accepted.

### 5.2 Downward Traceability

Accepted requirements must be traceable downward to:

- Engineering Standards (Level 3) — for engineering-category requirements
- UX Standards (Level 4) — for UX-category requirements
- Evidence Registry entries — where evidence supports the requirement
- Operational Procedures (Level 5) — where workflows implement the requirement

Downward traceability may be pending at acceptance but must be established before release of dependent capabilities.

### 5.3 Cross-Registry Traceability

Requirements that depend on evidence must reference Evidence Registry entries. Requirements that depend on legal obligations must reference Legal & Compliance Policies. Broken traceability links must be flagged during review.

---

## 6. Governance

### 6.1 Authority

This Requirement Registry is a Level 2 document. It is subordinate to the Constitution and Level 1 documents. It governs Product, Engineering, and UX obligations but does not override them.

### 6.2 Change Process

| Change Type | Approval Required |
|-------------|-------------------|
| New requirement (Proposed → Accepted) | Category-appropriate review + project owner for Constitutional category |
| Lock a requirement | Project owner + compatibility review |
| Deprecate or supersede | Document rationale + update traceability |
| Constitutional requirement change | Constitutional amendment process |

### 6.3 Relationship to Other Documents

| Document | Relationship |
|----------|--------------|
| [METIORO_CONSTITUTION.md](./METIORO_CONSTITUTION.md) | Supreme source of Constitutional requirements |
| [TRUST_ARCHITECTURE.md](./TRUST_ARCHITECTURE.md) | Source of trust-related requirements |
| [BRAND_IDENTITY_STANDARD.md](./BRAND_IDENTITY_STANDARD.md) | Source of brand-related requirements |
| [EVIDENCE_REGISTRY.md](./EVIDENCE_REGISTRY.md) | Evidence dependencies for requirements |
| [LEGAL_COMPLIANCE_POLICIES.md](./LEGAL_COMPLIANCE_POLICIES.md) | Source of Regulatory requirements |
| [DECISION_LOG.md](./DECISION_LOG.md) | Permanent decisions may generate requirements |
| [ADR_INDEX.md](./ADR_INDEX.md) | Architecture decisions may generate Engineering requirements |

### 6.4 Release Gate

No capability may be released unless all applicable Accepted or Locked requirements are satisfied or explicitly waived through governance review. Waivers must be recorded and time-bound.

---

## 7. Future Extensions

The following may extend this registry. They are anticipated but **not defined here**:

| Future Extension | Purpose |
|------------------|---------|
| **Requirement entry templates** | Standardized forms per category |
| **Compliance matrix** | Cross-mapping of requirements to capabilities |
| **Automated traceability tooling** | Governance support for link validation |
| **Requirement review cadence** | Scheduled audit of active requirements |

Future extensions must remain compatible with this registry and require governance review before adoption.

---

## Appendix — Referenced Governance Documents

| Document | Relationship |
|----------|--------------|
| [METIORO_CONSTITUTION.md](./METIORO_CONSTITUTION.md) | Supreme authority (Level 0) |
| [TRUST_ARCHITECTURE.md](./TRUST_ARCHITECTURE.md) | Trust requirements source (Level 1) |
| [BRAND_IDENTITY_STANDARD.md](./BRAND_IDENTITY_STANDARD.md) | Brand requirements source (Level 1) |
| [EVIDENCE_REGISTRY.md](./EVIDENCE_REGISTRY.md) | Peer Level 2 — evidence dependencies |
| [LEGAL_COMPLIANCE_POLICIES.md](./LEGAL_COMPLIANCE_POLICIES.md) | Peer Level 2 — regulatory requirements |
| [DOCUMENT_HIERARCHY.md](./DOCUMENT_HIERARCHY.md) | Placement and authority levels |

**Registered requirements:** *None yet — registry framework only.*

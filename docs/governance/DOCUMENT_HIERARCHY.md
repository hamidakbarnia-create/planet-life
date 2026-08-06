# METIORO Document Hierarchy

> Status: Review

**Version:** 1.0.0

**Authority:** This document derives from [METIORO_CONSTITUTION.md](./METIORO_CONSTITUTION.md) (governance instrument).

**Purpose:** Defines authority levels and placement rules for all METIORO project documentation.

---

## Hierarchy Overview

```
Repository
    ↓
Level 0 — METIORO Constitution
    ↓
Level 1 — Product Constitution · Trust Architecture · Brand Identity Standard
    ↓
Level 2 — Architecture Consolidation Resolution (ACR) ← OS conflict resolver
    ↓
Level 3 — Decision Operating System Blueprint (+ Requirements / Evidence / Legal registries)
    ↓
Level 4 — Engine internals (DIE, Evidence Pipeline, Explainability) · ADRs · Quality Standards
    ↓
Level 5 — UX Standards · Operational Procedures
    ↓
Implementation → Tests → Deployments
```

**Conflict rule:** On Decision Case object model, evaluation pathway, Evaluation Contract, state machine, repository, or evidence eligibility, [ACR-0001](../architecture/ARCHITECTURE_CONSOLIDATION_RESOLUTION.md) wins over all documents beneath Level 0–1 identity constraints. See ACR §B1.

---

## Level 0 — METIORO Constitution

**Document:** [METIORO_CONSTITUTION.md](./METIORO_CONSTITUTION.md)

The supreme governing document. Establishes purpose, identity, permanent principles, constitutional boundaries, governance model, and lifecycle. No other document may contradict the Constitution.

---

## Level 1 — Product Constitution, Trust Architecture & Brand Identity Standard

Documents at this level define product laws, how METIORO earns and maintains user trust, and how the brand is expressed consistently.

| Document | Status | Location |
|----------|--------|----------|
| [Product Constitution](./METIORO_PRODUCT_CONSTITUTION.md) | LOCKED | `docs/governance/METIORO_PRODUCT_CONSTITUTION.md` |
| [Trust Architecture](./TRUST_ARCHITECTURE.md) | Draft | `docs/governance/TRUST_ARCHITECTURE.md` |
| [Brand Identity Standard](./BRAND_IDENTITY_STANDARD.md) | Draft | `docs/governance/BRAND_IDENTITY_STANDARD.md` |

**Canonical hub:** Level 0–2 governance documents live under `docs/governance/` (ACR lives under `docs/architecture/` as Level 2 conflict resolver).

**Existing related assets:**

- `brand/metioro-master.svg` — master logo asset
- `apps/web/public/brand/favicon.svg` — favicon asset

---

## Level 2 — Architecture Consolidation Resolution

| Document | Status | Location |
|----------|--------|----------|
| [Architecture Consolidation Resolution (ACR-0001)](../architecture/ARCHITECTURE_CONSOLIDATION_RESOLUTION.md) | RATIFIED | `docs/architecture/ARCHITECTURE_CONSOLIDATION_RESOLUTION.md` |

ACR-0001 is the **conflict-resolution authority** for Decision Case SoR, one evaluation pathway, Decision Evaluation Contract v1, state machine, repository model, evidence eligibility, and migration. It does not invent product features.

---

## Level 3 — Decision OS Blueprint · Requirement / Evidence / Legal Registries

Documents at this level elaborate the consolidated architecture and capture what METIORO must do, what evidence supports its claims, and the legal framework under which it operates. They **must not contradict ACR-0001**.

| Document | Status | Location |
|----------|--------|----------|
| [Decision Operating System Blueprint](../architecture/METIORO_DECISION_OPERATING_SYSTEM_BLUEPRINT.md) | LOCKED | `docs/architecture/METIORO_DECISION_OPERATING_SYSTEM_BLUEPRINT.md` |
| [Requirement Registry](./REQUIREMENT_REGISTRY.md) | Draft | `docs/governance/REQUIREMENT_REGISTRY.md` |
| [Evidence Registry](./EVIDENCE_REGISTRY.md) | Draft | `docs/governance/EVIDENCE_REGISTRY.md` |
| [Legal & Compliance Policies](./LEGAL_COMPLIANCE_POLICIES.md) | Draft | `docs/governance/LEGAL_COMPLIANCE_POLICIES.md` |

**Note:** Legal policy intent is governed here. Runtime legal content also exists in application code at `apps/web/lib/legal-content.ts`. Dedicated standalone legal documents may be authored later without removing the runtime source.

---

## Level 4 — Engine Internals · ADRs · Quality Standards

Documents at this level define engine internals, API/ADR locks, and measurable quality standards. They elaborate ACR/Blueprint; they may not redefine primary object, pathway exclusivity, or Evaluation Contract module IDs.

| Document | Status | Location |
|----------|--------|----------|
| [Decision Intelligence Engine Specification](../architecture/DECISION_INTELLIGENCE_ENGINE.md) | Draft — subordinate to ACR | `docs/architecture/DECISION_INTELLIGENCE_ENGINE.md` |
| [Evidence Pipeline Specification](../architecture/EVIDENCE_PIPELINE_SPECIFICATION.md) | Draft | `docs/architecture/EVIDENCE_PIPELINE_SPECIFICATION.md` |
| [Explainability Engine Specification](../architecture/EXPLAINABILITY_ENGINE_SPECIFICATION.md) | Draft | `docs/architecture/EXPLAINABILITY_ENGINE_SPECIFICATION.md` |
| Decision Quality Standard | DRAFT (future artifact; not in repository baseline) | — |
| [ADR-0014 — Decision Case SoR & Pathway Consolidation](../adr/ADR-0014-Decision-Case-System-of-Record-and-Pathway-Consolidation.md) | RATIFIED | `docs/adr/ADR-0014-Decision-Case-System-of-Record-and-Pathway-Consolidation.md` |
| [ADR-0015 — Decision Case API Contract v1](../adr/ADR-0015-Decision-Case-API-Contract-v1.md) | ACCEPTED | `docs/adr/ADR-0015-Decision-Case-API-Contract-v1.md` |
| [ADR-0015 Wire Supplement 01 — E5 Activation](../adr/ADR-0015-WIRE-SUPPLEMENT-01-E5-Activation.md) | RATIFIED (DEC-0020 ACCEPTED) | `docs/adr/ADR-0015-WIRE-SUPPLEMENT-01-E5-Activation.md` — E5 subset + wire; no ACR amend |
| [GOV-ISSUE-003 — ADR-0015 wire gaps](./GOV-ISSUE-003-ADR0015-WIRE-CONTRACT-GAPS.md) | CLOSED | `docs/governance/GOV-ISSUE-003-ADR0015-WIRE-CONTRACT-GAPS.md` |
| [EPIC-001 Lifecycle Activation Profile (LAP-001)](./EPIC-001-LIFECYCLE-ACTIVATION-PROFILE.md) | ACCEPTED (incl. §2.9–§2.11 per DEC-0019) | `docs/governance/EPIC-001-LIFECYCLE-ACTIVATION-PROFILE.md` |
| [GOV-ISSUE-001 — EPIC-001 package module conflict](./GOV-ISSUE-001-EPIC001-PACKAGE-MODULE-CONFLICT.md) | CLOSED | `docs/governance/GOV-ISSUE-001-EPIC001-PACKAGE-MODULE-CONFLICT.md` |
| [GOV-ISSUE-002 — Side-state & activation clarification](./GOV-ISSUE-002-LIFECYCLE-SIDE-STATE-AND-ACTIVATION-CLARIFICATION.md) | CLOSED | `docs/governance/GOV-ISSUE-002-LIFECYCLE-SIDE-STATE-AND-ACTIVATION-CLARIFICATION.md` — DEC-0019; does not amend ACR |
| Phase 3 Architecture Blueprint | Draft | `docs/architecture/PHASE3_ARCHITECTURE_BLUEPRINT.md` |
| [ADR-0010 — Canonical Memory Graph L0 Boundaries](../adr/ADR-0010-Canonical-Memory-Graph-and-Personal-Intelligence-Memory-Boundaries.md) | Accepted (2026-07-23) | `docs/adr/ADR-0010-Canonical-Memory-Graph-and-Personal-Intelligence-Memory-Boundaries.md` — L0 ownership/admission only; **does not authorize implementation** |
| [CMG Final Lock Report](../architecture/CMG-FINAL-LOCK-REPORT.md) | Companion (Accepted L0) | `docs/architecture/CMG-FINAL-LOCK-REPORT.md` |
| [ADR-0011 — CMG L1 Client Runtime Authorization](../adr/ADR-0011-CMG-L1-Client-Runtime-Authorization.md) | Accepted (2026-07-24) | `docs/adr/ADR-0011-CMG-L1-Client-Runtime-Authorization.md` — L1 architectural boundary; coding blocked pending remaining operational authorities + explicit implementation approval |
| [CMG Repository Contract Specification](../architecture/CMG-REPOSITORY-CONTRACT-SPECIFICATION.md) | Accepted v0.3.1 (2026-07-24) | `docs/architecture/CMG-REPOSITORY-CONTRACT-SPECIFICATION.md` — L1 repository behavioural contract; **does not authorize coding** |
| [CMG Admission Pipeline Specification](../architecture/CMG-ADMISSION-PIPELINE-SPECIFICATION.md) | Accepted v0.1.3 (2026-07-24) | `docs/architecture/CMG-ADMISSION-PIPELINE-SPECIFICATION.md` — L1 admission behavioural contract; **does not authorize coding**; implementation not authorized |
| [CMG Memory Type/Domain Registry Specification](../architecture/CMG-MEMORY-TYPE-DOMAIN-REGISTRY.md) | Proposed | `docs/architecture/CMG-MEMORY-TYPE-DOMAIN-REGISTRY.md` |
| [CMG Relationship Edge Taxonomy Specification](../architecture/CMG-RELATIONSHIP-EDGE-TAXONOMY.md) | Proposed | `docs/architecture/CMG-RELATIONSHIP-EDGE-TAXONOMY.md` |
| [CMG Specification Dependency Map](../architecture/CMG-SPECIFICATION-DEPENDENCY-MAP.md) | Planning (descriptive; not an authorization instrument) | `docs/architecture/CMG-SPECIFICATION-DEPENDENCY-MAP.md` |
| Phase 2 Architecture Baseline | *Existing* | `PHASE2_ARCHITECTURE_BASELINE.md` (root) |
| Pathfinder Scoring Methodology | *Existing* | `PATHFINDER_SCORING.md` (root) |
| API Deployment Guide | *Existing* | `apps/api/DEPLOY.md` |
| Engineering Standards (formal) | *Not yet authored* | `docs/engineering/` (proposed) |

---

## Level 4 — UX Standards

Documents at this level define interaction patterns, navigation semantics, i18n conventions, and visual/UX rules.

| Document | Status | Location |
|----------|--------|----------|
| UX Standards (formal) | *Not yet authored* | `docs/ux/` (proposed) |
| Agent / framework notes | *Existing* | `apps/web/AGENTS.md`, `apps/web/CLAUDE.md` |

---

## Level 5 — Operational Procedures

Documents at this level define day-to-day workflows — handoffs, roadmaps, sprint plans, and runbooks.

| Document | Status | Location |
|----------|--------|----------|
| [GOVERNANCE.md](./GOVERNANCE.md) | Review | `docs/governance/GOVERNANCE.md` |
| Strategic Roadmap | *Existing* | `ROADMAP.md` (root) |
| Handoff Notes | *Existing* | `HANDOFF.md` (root) |
| [Master Status / Sprint Registry](../MASTER_STATUS.md) | *Active* | `docs/MASTER_STATUS.md` |
| Operational Procedures (formal) | *Not yet authored* | `docs/operations/` (proposed) |

---

## Placement Rules

1. Every new document must be assigned to exactly one level before publication.
2. Documents may reference higher-level documents but must not contradict them.
3. Permanent decisions at any level must be registered in [DECISION_LOG.md](./DECISION_LOG.md).
4. Architecture changes at Level 3 or above require an ADR in [ADR_INDEX.md](./ADR_INDEX.md).
5. When a root-level document matures into a governed standard, it should be migrated under `docs/` at the appropriate level without deleting the original until cross-references are updated.

## AI Agent Limitations

Cursor and other AI agents may maintain structure, links, references, and consistency, but may not author or redefine constitutional principles unless explicitly instructed by the project owner.

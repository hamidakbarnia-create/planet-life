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
Level 1 — Trust Architecture / Brand Identity Standard
    ↓
Level 2 — Requirement Registry / Evidence Registry / Legal & Compliance Policies
    ↓
Level 3 — Engineering Standards
    ↓
Level 4 — UX Standards
    ↓
Level 5 — Operational Procedures
```

---

## Level 0 — METIORO Constitution

**Document:** [METIORO_CONSTITUTION.md](./METIORO_CONSTITUTION.md)

The supreme governing document. Establishes purpose, identity, permanent principles, constitutional boundaries, governance model, and lifecycle. No other document may contradict the Constitution.

---

## Level 1 — Trust Architecture & Brand Identity Standard

Documents at this level define how METIORO earns and maintains user trust, and how the brand is expressed consistently.

| Document | Status | Location |
|----------|--------|----------|
| [Trust Architecture](./TRUST_ARCHITECTURE.md) | Draft | `docs/governance/TRUST_ARCHITECTURE.md` |
| [Brand Identity Standard](./BRAND_IDENTITY_STANDARD.md) | Draft | `docs/governance/BRAND_IDENTITY_STANDARD.md` |

**Canonical hub:** Level 0–2 governance documents live under `docs/governance/`.

**Existing related assets:**

- `brand/metioro-master.svg` — master logo asset
- `apps/web/public/brand/favicon.svg` — favicon asset

---

## Level 2 — Requirement Registry, Evidence Registry, Legal & Compliance Policies

Documents at this level capture what METIORO must do, what evidence supports its claims, and the legal framework under which it operates.

| Document | Status | Location |
|----------|--------|----------|
| [Requirement Registry](./REQUIREMENT_REGISTRY.md) | Draft | `docs/governance/REQUIREMENT_REGISTRY.md` |
| [Evidence Registry](./EVIDENCE_REGISTRY.md) | Draft | `docs/governance/EVIDENCE_REGISTRY.md` |
| [Legal & Compliance Policies](./LEGAL_COMPLIANCE_POLICIES.md) | Draft | `docs/governance/LEGAL_COMPLIANCE_POLICIES.md` |

**Note:** This document defines governance-level legal policy intent. Runtime legal content also exists in application code at `apps/web/lib/legal-content.ts`. Dedicated standalone legal documents may be authored later without removing the runtime source.

---

## Level 3 — Engineering Standards

Documents at this level define how METIORO is built — architecture patterns, API contracts, scoring methodology, deployment, and code conventions.

| Document | Status | Location |
|----------|--------|----------|
| [Decision Intelligence Engine Specification](../architecture/DECISION_INTELLIGENCE_ENGINE.md) | Draft | `docs/architecture/DECISION_INTELLIGENCE_ENGINE.md` |
| [Evidence Pipeline Specification](../architecture/EVIDENCE_PIPELINE_SPECIFICATION.md) | Draft | `docs/architecture/EVIDENCE_PIPELINE_SPECIFICATION.md` |
| [Explainability Engine Specification](../architecture/EXPLAINABILITY_ENGINE_SPECIFICATION.md) | Draft | `docs/architecture/EXPLAINABILITY_ENGINE_SPECIFICATION.md` |
| Phase 3 Architecture Blueprint | Draft | `docs/architecture/PHASE3_ARCHITECTURE_BLUEPRINT.md` |
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
| Strategic Roadmap | *Existing* | `ROADMAP.md` (root) |
| Handoff Notes | *Existing* | `HANDOFF.md` (root) |
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

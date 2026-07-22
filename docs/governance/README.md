# METIORO Governance

> Status: Review

**Version:** 1.0.0

**Authority:** This directory derives from [METIORO_CONSTITUTION.md](./METIORO_CONSTITUTION.md) (Level 0).

**Purpose:** Authoritative governance foundation for the METIORO project — how architectural, product, brand, and operational decisions are made, recorded, and enforced.

---

## Rules

1. **No architectural decision may bypass the Constitution.** The [METIORO Constitution](./METIORO_CONSTITUTION.md) is the supreme governing document. All other documents derive authority from it.

2. **Every new document must belong to the hierarchy.** Before creating or publishing any project document, identify its level in the [Document Hierarchy](./DOCUMENT_HIERARCHY.md) and place it accordingly.

3. **Every permanent decision must appear in the Decision Log.** Irreversible or long-lived product, brand, architecture, or governance choices must be registered in [DECISION_LOG.md](./DECISION_LOG.md) with full context (Owner, Date, WHERE, WHY, ACT, OUTCOME, LEARN, References).

4. **Every architecture change requires an ADR.** Structural or cross-cutting technical changes must be recorded as Architecture Decision Records and indexed in [ADR_INDEX.md](./ADR_INDEX.md).

5. **No AI agent may redefine a locked decision.** If a locked decision appears incorrect or incomplete, the agent must follow the change process for that decision's **Authority** level — constitutional amendment for **Constitutional** authority, a superseding ADR for **ADR** authority, or project owner approval for **Operational** authority.

## AI Agent Limitations

Cursor and other AI agents may maintain structure, links, references, and consistency, but may not author or redefine constitutional principles unless explicitly instructed by the project owner.

## Contents

### Level 0 — Constitution

| Document | Role |
|----------|------|
| [METIORO_CONSTITUTION.md](./METIORO_CONSTITUTION.md) | Supreme governing document — principles, boundaries, and rules |

### Level 1 — Trust & Brand

| Document | Role |
|----------|------|
| [TRUST_ARCHITECTURE.md](./TRUST_ARCHITECTURE.md) | How METIORO earns, maintains, and protects user trust |
| [BRAND_IDENTITY_STANDARD.md](./BRAND_IDENTITY_STANDARD.md) | Permanent brand identity, voice, and boundaries |

### Level 2 — Registries & Legal Policy

| Document | Role |
|----------|------|
| [REQUIREMENT_REGISTRY.md](./REQUIREMENT_REGISTRY.md) | Single source of truth for permanent product requirements |
| [EVIDENCE_REGISTRY.md](./EVIDENCE_REGISTRY.md) | Governance for approved evidence sources and frameworks |
| [LEGAL_COMPLIANCE_POLICIES.md](./LEGAL_COMPLIANCE_POLICIES.md) | High-level legal and compliance policy commitments |

### Meta — Governance Instruments

| Document | Role |
|----------|------|
| [GOVERNANCE.md](./GOVERNANCE.md) | Review Protocol and Sprint Protocol — operational execution rules |
| [DOCUMENT_HIERARCHY.md](./DOCUMENT_HIERARCHY.md) | Defines authority levels and document placement |
| [DECISION_LOG.md](./DECISION_LOG.md) | Register of permanent project decisions |
| [ADR_INDEX.md](./ADR_INDEX.md) | Index of Architecture Decision Records |
| [CHANGELOG.md](./CHANGELOG.md) | Version history of the governance structure itself |
| [P2.2-04-PRODUCTION-OBSERVABILITY.md](./P2.2-04-PRODUCTION-OBSERVABILITY.md) | Ratified P2.2-04 Production Observability acceptance package (implementation not started) |

## Relationship to Existing Documentation

Root-level and application-scoped documents (e.g. `PHASE2_ARCHITECTURE_BASELINE.md`, `ROADMAP.md`, `HANDOFF.md`) remain in place. Over time, permanent decisions extracted from those documents should be registered here. New governance-tier documents should live under `docs/` according to the hierarchy.

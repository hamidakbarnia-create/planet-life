# METIORO Governance Changelog

> Status: Review

**Version:** 1.2.0

**Authority:** This document derives from [METIORO_CONSTITUTION.md](./METIORO_CONSTITUTION.md) (governance instrument).

**Purpose:** Version history of the METIORO governance structure itself.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) for governance releases.

---

## [1.2.0] — 2026-07-05

### Added

- Constitution Chapters 4–6 — constitutional boundaries, governance model, lifecycle
- Constitution Appendices A–C — governance levels, decision types, amendment register template

### Changed

- `DECISION_LOG.md` — complete metadata for DEC-0001–0004 (Owner, Date, References); Authority classification guidance
- `ADR_INDEX.md` — ADR-0001 marked Superseded; standard governance header added
- `README.md`, `DOCUMENT_HIERARCHY.md`, `DECISION_LOG.md`, `ADR_INDEX.md`, `CHANGELOG.md` — standard governance headers (Title, Version, Status, Authority, Purpose)
- `DOCUMENT_HIERARCHY.md` — Level 0 description aligned to current Constitution chapter titles

### Documented

- Governance consistency audit (read-only review; health score baseline)
- Governance consistency synchronization (Sprint 1 meta-doc sync — see v1.1.0)
- Governance Freeze v1.0 preparation review
- Governance v1.0 acceptance preparation sprint

---

## [1.1.0] — 2026-07-05

### Added

- `BRAND_IDENTITY_STANDARD.md` — Level 1 brand identity, voice, and boundaries (Draft)
- `TRUST_ARCHITECTURE.md` — Level 1 trust model, principles, and boundaries (Draft)
- `REQUIREMENT_REGISTRY.md` — Level 2 requirement registry framework (Draft)
- `EVIDENCE_REGISTRY.md` — Level 2 evidence registry framework (Draft)
- `LEGAL_COMPLIANCE_POLICIES.md` — Level 2 legal and compliance policy framework (Draft)
- Constitution Chapters 0–3 — governance, purpose, identity, and permanent principles

### Changed

- `DOCUMENT_HIERARCHY.md` — Level 1 and Level 2 documents marked as authored at `docs/governance/`
- `README.md` — full Contents index for all 11 governance documents; Rule 5 aligned to Decision Log Authority levels
- `METIORO_CONSTITUTION.md` — Section 0.4 clarifies locked-decision change paths by Authority level
- `TRUST_ARCHITECTURE.md` — cross-references updated for Level 2 registries
- `ADR_INDEX.md` — ADR-0004 marked Superseded by `TRUST_ARCHITECTURE.md`

---

## [1.0.0] — 2026-07-05

### Added

- Initial governance structure under `docs/governance/`
- `README.md` — governance purpose and rules
- `METIORO_CONSTITUTION.md` — constitutional skeleton (headings and placeholders)
- `DOCUMENT_HIERARCHY.md` — six-level document authority model
- `DECISION_LOG.md` — decision register with four locked baseline decisions
- `ADR_INDEX.md` — ADR index with template
- `CHANGELOG.md` — this file

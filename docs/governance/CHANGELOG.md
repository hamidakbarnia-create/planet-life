# METIORO Governance Changelog

> Status: Review

**Version:** 1.3.1

**Authority:** This document derives from [METIORO_CONSTITUTION.md](./METIORO_CONSTITUTION.md) (governance instrument).

**Purpose:** Version history of the METIORO governance structure itself.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) for governance releases.

---

## [1.3.1] — 2026-07-10

### Changed

- [ADR-0006](../adr/ADR-0006-Decision-API-Contract-v1.md) — governance correction restoring approved Decision API Contract v1 draft after Sprint 6A Step 0 discovered unreviewed drift in commit `973ce88` (endpoint, timeouts, unresolved semantics, error shape, auth scope)
- [GOVERNANCE.md](./GOVERNANCE.md) — governance approval integrity rule (byte-identical commit requirement)
- [ADR_INDEX.md](./ADR_INDEX.md) — ADR-0006 endpoint note corrected to `/api/v1/decision/execute`
- [DOCUMENT_STATUS.md](../DOCUMENT_STATUS.md) — ADR-0006 endpoint note corrected

### Documented

- Invalid Lock on ADR-0006 from `973ce88` reverted to Proposed during inspection; re-LOCKED after correction review

---

## [1.3.0] — 2026-07-10

### Added

- [GOVERNANCE.md](./GOVERNANCE.md) — Review Protocol and Sprint Protocol (Rule 0, Review Question Zero, four pre-sprint questions, eight-stage execution cycle)
- [ADR-0006](../adr/ADR-0006-Decision-API-Contract-v1.md) — Decision API Contract v1 (**LOCKED**)
- Sprint & Workstream Status Registry in [MASTER_STATUS.md](../MASTER_STATUS.md)

### Changed

- [MASTER_STATUS.md](../MASTER_STATUS.md) — registered as authoritative sprint/workstream status registry; implicit status forbidden
- [DOCUMENT_STATUS.md](../DOCUMENT_STATUS.md) — MASTER_STATUS authority and ADR-0006 registration
- [DOCUMENT_HIERARCHY.md](./DOCUMENT_HIERARCHY.md) — Level 5 placement for MASTER_STATUS and GOVERNANCE
- [ADR_INDEX.md](./ADR_INDEX.md) — ADR-0006 LOCKED entry
- [README.md](./README.md) — GOVERNANCE.md in Contents

### Documented

- Phase 1 (FTUE Infrastructure) closed at tag `ftue-pipeline-complete`
- UI Audit status CLOSED with evidence commit `2384ecc`
- Phase 6 sequencing locked (6A Backend Bridge · 6B Decision Signal · 6C Evidence Pipeline)

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

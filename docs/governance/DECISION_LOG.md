# METIORO Decision Log

> Status: Review

**Version:** 1.0.0

**Authority:** This document derives from [METIORO_CONSTITUTION.md](./METIORO_CONSTITUTION.md) (governance instrument).

**Purpose:** Register of permanent METIORO project decisions with full provenance, authority classification, and cross-references.

---

## Entry Format

| Field | Description |
|-------|-------------|
| **ID** | Unique decision identifier (DEC-NNNN) |
| **Title** | Short name for the decision |
| **Status** | `PROPOSED`, `ACCEPTED`, `LOCKED`, or `SUPERSEDED` |
| **Authority** | `Constitutional`, `ADR`, or `Operational` |
| **Owner** | Decision maker(s) or accountable role |
| **Date** | Date of decision (YYYY-MM-DD) |
| **WHERE** | Location / context (meeting, document, channel) |
| **References** | Governing documents, ADRs, and related artifacts |
| **WHY** | Rationale and constraints that drove the decision |
| **ACT** | What was decided |
| **OUTCOME** | Observed result after implementation |
| **LEARN** | Lessons for future decisions |

### Authority Classification

| Authority | Use When |
|-----------|----------|
| **Constitutional** | Decision affects identity, permanent principles, or product category |
| **ADR** | Decision affects architecture, navigation, or brand implementation selection |
| **Operational** | Decision affects process, workflow, or non-permanent execution |

---

## DEC-0001 — Personal Decision Intelligence

| Field | Value |
|-------|-------|
| **Status** | LOCKED |
| **Authority** | Constitutional |
| **Owner** | METIORO project owner |
| **Date** | 2026-07-05 |
| **WHERE** | Governance foundation sprint — `docs/governance/` |
| **References** | [METIORO_CONSTITUTION.md](./METIORO_CONSTITUTION.md) §1.2, Appendix B; [BRAND_IDENTITY_STANDARD.md](./BRAND_IDENTITY_STANDARD.md) §2 |
| **WHY** | METIORO must be positioned as a personal decision intelligence platform — not a horoscope or entertainment app. Users come with concrete dilemmas and expect reasoned, scored, explainable guidance. |
| **ACT** | Adopt "Personal Decision Intelligence" as the constitutional product category. All surfaces, copy, and features must serve decision-making, not passive consumption. |
| **OUTCOME** | Product category encoded in Constitution §1.2 and Level 1 governance documents. |
| **LEARN** | Category enforcement must propagate to all governance levels before capability release. |

---

## DEC-0002 — Navigation Model

| Field | Value |
|-------|-------|
| **Status** | LOCKED |
| **Authority** | ADR |
| **Owner** | METIORO project owner |
| **Date** | 2026-05-22 |
| **WHERE** | Product architecture session — recorded in [HANDOFF.md](../../HANDOFF.md) |
| **References** | [ADR-0002](./ADR_INDEX.md) (Proposed); [HANDOFF.md](../../HANDOFF.md); `apps/web/components/BottomNav.tsx`, `AppShell.tsx` |
| **WHY** | The app requires a consistent primary navigation model that maps product pillars to discoverable surfaces without overwhelming the user. |
| **ACT** | Adopt bottom navigation as the primary navigation model with defined tab semantics (Today, Map, Ask, People, World, Me). Vault is promoted via header pill, not bottom nav. |
| **OUTCOME** | Navigation model implemented in bottom nav and Vault header pill pattern. |
| **LEARN** | Navigation semantics must remain stable across surfaces until superseded by accepted ADR. |

---

## DEC-0003 — Logo Direction (Concept B)

| Field | Value |
|-------|-------|
| **Status** | LOCKED |
| **Authority** | ADR |
| **Owner** | METIORO project owner |
| **Date** | 2026-07-05 |
| **WHERE** | Brand governance sprint — `docs/governance/` |
| **References** | [ADR-0003](./ADR_INDEX.md) (Proposed); [BRAND_IDENTITY_STANDARD.md](./BRAND_IDENTITY_STANDARD.md) §7; `brand/metioro-master.svg` |
| **WHY** | METIORO requires a distinctive visual identity that communicates precision and intelligence without mystical or occult associations. |
| **ACT** | Adopt Logo Direction Concept B as the approved logo direction. Master asset: `brand/metioro-master.svg`. |
| **OUTCOME** | Logo direction recorded in Brand Identity Standard; master asset maintained at `brand/metioro-master.svg`. |
| **LEARN** | Logo implementation details belong in Design System; direction remains governed at Level 1. |

---

## DEC-0004 — Brand Tone

| Field | Value |
|-------|-------|
| **Status** | LOCKED |
| **Authority** | Constitutional |
| **Owner** | METIORO project owner |
| **Date** | 2026-07-05 |
| **WHERE** | Governance foundation sprint — `docs/governance/` |
| **References** | [METIORO_CONSTITUTION.md](./METIORO_CONSTITUTION.md) §2.4; [BRAND_IDENTITY_STANDARD.md](./BRAND_IDENTITY_STANDARD.md) §2, §5; [TRUST_ARCHITECTURE.md](./TRUST_ARCHITECTURE.md) §2 |
| **WHY** | User trust depends on tone that feels credible, approachable, and transparent — not sensational or esoteric. |
| **ACT** | Adopt the following brand tone pillars: **Calm**, **Scientific**, **Explainable**, **Never Mystical**. All user-facing copy, readings, and marketing must conform. |
| **OUTCOME** | Tone pillars encoded in Constitution §2.4 and Brand Identity Standard. |
| **LEARN** | Tone compliance must be reviewable across product, marketing, and governance copy. |

---

## DEC-0005 — Canonical Memory Graph L0 Boundaries (ADR-0010)

| Field | Value |
|-------|-------|
| **Status** | ACCEPTED |
| **Authority** | ADR |
| **Owner** | METIORO Product Owner |
| **Date** | 2026-07-23 |
| **WHERE** | Explicit Product Owner ratification — [ADR-0010](../adr/ADR-0010-Canonical-Memory-Graph-and-Personal-Intelligence-Memory-Boundaries.md); companion [CMG-FINAL-LOCK-REPORT.md](../architecture/CMG-FINAL-LOCK-REPORT.md) |
| **References** | [ADR_INDEX.md](./ADR_INDEX.md); ADR-0007 (conversation remains LOCKED/stateless); ADR-0009 (frontend conversation/PIP boundaries remain Accepted). ADR-0010 does **not** supersede ADR-0007 or ADR-0009. |
| **WHY** | Personal Intelligence / Life Memory requires a unique-ownership canonical memory model so Vault UI, Ask exploration, reads, and Julia conversation cannot become accidental systems of record. |
| **ACT** | Accept ADR-0010 for **L0 canonical memory boundaries only** (ownership, admission, MemoryRecord field contract `schemaVersion: "1.0.0"`, projection/search boundaries, Julia non-producer under P1, L2 nonexistence). **Implementation is not authorized** by this decision. Client L1 runtime requires a separate accepted decision ([ADR-0011](../adr/ADR-0011-CMG-L1-Client-Runtime-Authorization.md), Proposed). L2 backend remains unapproved. |
| **OUTCOME** | L0 architecture locked in ADR-0010 / Lock Report. No CMG runtime, APIs, Search engine, or admission pipeline authorized or present in repository as of registration. |
| **LEARN** | Ratifying ownership boundaries must not be treated as authorizing L1/L2 implementation; keep status docs explicit that coding remains blocked until a dedicated authorization ADR is Accepted.

---

## DEC-0006 — CMG L1 Client Runtime Authorization Boundary (ADR-0011)

| Field | Value |
|-------|-------|
| **Status** | ACCEPTED |
| **Authority** | ADR |
| **Owner** | METIORO Product Owner |
| **Date** | 2026-07-24 |
| **WHERE** | Explicit Product Owner ratification — [ADR-0011](../adr/ADR-0011-CMG-L1-Client-Runtime-Authorization.md) |
| **References** | [ADR-0010](../adr/ADR-0010-Canonical-Memory-Graph-and-Personal-Intelligence-Memory-Boundaries.md) (L0 authority, Accepted); [ADR_INDEX.md](./ADR_INDEX.md); [CMG-SPECIFICATION-DEPENDENCY-MAP.md](../architecture/CMG-SPECIFICATION-DEPENDENCY-MAP.md). ADR-0007 remains LOCKED/stateless; ADR-0009 remains Accepted. ADR-0011 does **not** supersede ADR-0007 or ADR-0009. |
| **WHY** | ADR-0010 Accepted L0 boundaries without authorizing L1 coding. A separate L1 architectural boundary is required so “Accepted L0” is not misread as permission to ship client memory persistence. |
| **ACT** | Accept ADR-0011 for the **CMG L1 client-runtime implementation boundary** only. Coding authorization is **conditional and not yet active**. Implementation remains **blocked** until, at minimum, the CMG L1 repository/persistence contract and CMG admission pipeline specification are separately completed and approved. Producer integrations remain blocked until applicable producer contracts are approved. L2 remains nonexistent and unapproved. |
| **OUTCOME** | L1 architectural boundary ratified. No CMG L1 runtime, API, UI, migration, Search engine, or producer integration is started, implemented, or unblocked by this decision alone. |
| **LEARN** | Architectural Acceptance of an L1 boundary must keep an explicit executable-spec coding gate; do not place coding immediately after ADR acceptance. |

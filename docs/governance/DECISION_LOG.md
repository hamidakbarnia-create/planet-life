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

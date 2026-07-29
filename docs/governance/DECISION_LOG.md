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

## DEC-0007 — CMG L1 Repository Contract Specification Acceptance

| Field | Value |
|-------|-------|
| **Status** | ACCEPTED |
| **Authority** | Executable Specification (P3) |
| **Owner** | METIORO Product Owner |
| **Date** | 2026-07-24 |
| **WHERE** | Explicit Product Owner ratification — [CMG-REPOSITORY-CONTRACT-SPECIFICATION.md](../architecture/CMG-REPOSITORY-CONTRACT-SPECIFICATION.md) v0.3.1 |
| **References** | [ADR-0010](../adr/ADR-0010-Canonical-Memory-Graph-and-Personal-Intelligence-Memory-Boundaries.md) (Accepted); [ADR-0011](../adr/ADR-0011-CMG-L1-Client-Runtime-Authorization.md) (Accepted); [ADR_INDEX.md](./ADR_INDEX.md); [CMG-SPECIFICATION-DEPENDENCY-MAP.md](../architecture/CMG-SPECIFICATION-DEPENDENCY-MAP.md); [MASTER_STATUS.md](../MASTER_STATUS.md). ADR-0007 remains LOCKED/stateless; ADR-0009 remains Accepted. |
| **WHY** | ADR-0011 requires an approved deterministic CMG L1 repository/persistence contract before L1 coding. The Repository Contract was drafted, corrected, and reviewed to governance acceptance readiness. |
| **ACT** | Accept [CMG-REPOSITORY-CONTRACT-SPECIFICATION.md](../architecture/CMG-REPOSITORY-CONTRACT-SPECIFICATION.md) **v0.3.1** as the binding L1 repository behavioural contract. **Acceptance does not authorize coding.** Implementation remains blocked until: (1) the CMG Admission Pipeline Specification is accepted; (2) required registries/lifecycle authorities are accepted where the chosen slice needs them; (3) explicit implementation approval is issued. Admission Pipeline Specification remains Missing. Proposed registries remain non-authority. L2 remains unapproved. |
| **OUTCOME** | One ADR-0011 executable-spec gate (repository behavioural contract) is satisfied. No CMG L1 runtime, storage technology choice, API, UI, migration, Search engine, producer wiring, or soft-delete implementation is started, implemented, or unblocked by this decision alone. |
| **LEARN** | Accepting an executable repository contract must keep Admission Pipeline, registry/lifecycle, and explicit implementation-approval gates visible; do not treat specification acceptance as a coding license. |

## DEC-0008 — Accept CMG Admission Pipeline Specification v0.1.3

| Field | Value |
|-------|-------|
| **Status** | ACCEPTED |
| **Authority** | Executable Specification (P3) |
| **Owner** | METIORO Product Owner |
| **Date** | 2026-07-24 |
| **WHERE** | Explicit Product Owner ratification — [CMG-ADMISSION-PIPELINE-SPECIFICATION.md](../architecture/CMG-ADMISSION-PIPELINE-SPECIFICATION.md) v0.1.3 |
| **References** | [ADR-0011](../adr/ADR-0011-CMG-L1-Client-Runtime-Authorization.md) (Accepted); [ADR-0010](../adr/ADR-0010-Canonical-Memory-Graph-and-Personal-Intelligence-Memory-Boundaries.md) (Accepted); [CMG-REPOSITORY-CONTRACT-SPECIFICATION.md](../architecture/CMG-REPOSITORY-CONTRACT-SPECIFICATION.md) (Accepted v0.3.1); [ADR_INDEX.md](./ADR_INDEX.md); [CMG-SPECIFICATION-DEPENDENCY-MAP.md](../architecture/CMG-SPECIFICATION-DEPENDENCY-MAP.md); [MASTER_STATUS.md](../MASTER_STATUS.md); [DOCUMENT_HIERARCHY.md](./DOCUMENT_HIERARCHY.md). Final independent architecture review: READY FOR GOVERNANCE ACCEPTANCE REVIEW. Final governance acceptance review: ACCEPTABLE — READY FOR GOVERNANCE ACCEPTANCE EDIT. |
| **WHY** | ADR-0011 requires an approved deterministic CMG Admission Pipeline Specification before L1 coding. The Admission Pipeline Specification was drafted (v0.1.0–v0.1.3), corrected, and reviewed to governance acceptance readiness under ADR-0011, ADR-0010, and the Accepted Repository Contract v0.3.1. |
| **ACT** | Accept [CMG-ADMISSION-PIPELINE-SPECIFICATION.md](../architecture/CMG-ADMISSION-PIPELINE-SPECIFICATION.md) **v0.1.3** as the binding L1 Admission Pipeline behavioural contract. **Acceptance does not authorize coding.** Acceptance establishes the normative Admission S0–S12 pipeline, deterministic first-failure semantics, S5-A/B/C precedence, intent-to-`repositoryOperation` binding, `authoritySnapshot` requirements, canonicalization and AdmissionProof gates, fail-closed dependency handling, Repository handoff and verification boundary, operation contracts, concurrency and replay rules, and implementation/coding gates. **Explicit non-authorizations:** no coding authorization; no implementation authorization; no runtime activation; no deployment authorization; no migration or backfill authorization; no registry or operational authority is accepted by this decision; no proof issuance is operationally enabled; no canonical memory producer is newly authorized; no Repository Contract behaviour is changed. **Remaining gates:** Admission Authority Selection Authority; canonicalization/hash authority; AdmissionProof issuer/integrity authority; applicable type/schema/identity/lifecycle/policy authorities; process-entry resource-limit authority for untrusted input; privacy/audit authority where required; and explicit implementation approval. **Runtime effect:** non-prohibited candidates remain fail-closed with `MissingAuthority` while required authorities are absent; direct Accepted-ADR prohibitions still return `PolicyViolation`; intent/`repositoryOperation` mismatch returns `ValidationFailed`; successful proof-backed Admission remains impossible while OQ-A2 and OQ-A4 are unresolved. |
| **OUTCOME** | Specification governance gate: closed. Coding gate: open / **Not granted**. Implementation gate: blocked. Runtime success gate: blocked. The Admission Pipeline is **not** implemented by this decision. No CMG L1 runtime, producer wiring, storage technology choice, API, UI, migration, registry acceptance, proof issuance enablement, or Repository Contract behaviour change is started, implemented, or unblocked by this decision alone. |
| **LEARN** | Accepting an executable Admission Pipeline specification must keep operational-authority and explicit implementation-approval gates visible; do not treat specification acceptance as a coding license or as acceptance of Missing authorities. |

## 2026-07-28 — ADR-0012 Proposed

**Decision:** Proposed the Today and Shared Timing Architecture.

**Scope:**
- Defines ownership boundaries for Today and Calendar.
- Separates decision signals from transport, caching, mapping, and presentation.
- Requires `calendar-scores.ts` to remain a compatibility facade during migration.
- Authorizes no refactor, endpoint change, scoring change, or UI rewrite.

**Document:**
`docs/adr/ADR-0012-Today-and-Shared-Timing-Architecture.md`

**Status:** PROPOSED

## 2026-07-29 — PRG-02 Accepted (Variant A)

| Field | Value |
|-------|-------|
| **ID** | PRG-02 / DEC (Reading Contract presence gates) |
| **Title** | Reading Contract Presence & Validity Gates (Variant A) |
| **Status** | ACCEPTED |
| **Authority** | Product / Reading Contract governance |
| **Owner** | METIORO Product Owner |
| **Date** | 2026-07-29 |
| **WHERE** | Explicit Product Owner acceptance — [PRG-02-reading-contract-presence-validity-gates.md](./PRG-02-reading-contract-presence-validity-gates.md) |
| **References** | [READING-CONTRACT-SPECIFICATION.md](../architecture/READING-CONTRACT-SPECIFICATION.md) v1.1.0; [PRG-02](./PRG-02-reading-contract-presence-validity-gates.md) |
| **WHY** | The platform must separate structural presence (fail-closed) from producer semantic validity, and must prevent consumers from treating Score or completeness as Confidence. |
| **ACT** | Accept **Variant A**: Presence is enforced by the Reading Contract (fail-closed). Semantic validity, calibration, and correctness remain Producer responsibilities. Bind consumer rules: no Confidence from Score; no Confidence from Presence/completeness; Score and Confidence independent; no false precision outside approved semantics; presentation is a pure consumer. **Acceptance does not authorize coding** of Reading producers/consumers or runtime ReadingResult wiring. |
| **OUTCOME** | Presence/validity gate policy: Accepted. Full Reading Contract coding: **Not granted**. Calendar/Today timing Score surfaces remain non-Confidence presentation. |
| **LEARN** | Do not conflate timing Score with Reading Confidence; do not let presentation invent missing Reading fields to force success. |

### Post-ratification verification (2026-07-29)

Evidence recorded on [PRG-02](./PRG-02-reading-contract-presence-validity-gates.md) § Post-ratification verification evidence.

- Approved `grep` found only the canonical Reading Contract, this PRG-02 artifact, this Decision Log entry, and ADR-0012’s non-schema reference.
- **Conclusion:** no competing Reading Contract / Reading schema / Reading confidence validation contract found.
- **Non-blocking debt:** `apps/web/lib/intelligence/` `InsightConfidence` / `validatePersonalIntelligenceProfile` is not a competing Reading Contract; confidence semantics must later be reconciled with Score ≠ presence ≠ completeness ≠ Confidence. No remediation authorized here.

## 2026-07-29 — PRG-04 Accepted (Decision Value Semantics)

| Field | Value |
|-------|-------|
| **ID** | PRG-04 |
| **Title** | Decision Value Semantics (Context Fitness) |
| **Status** | ACCEPTED |
| **Authority** | Product / domain semantics |
| **Owner** | METIORO Product Owner |
| **Date** | 2026-07-29 |
| **WHERE** | Explicit Product Owner acceptance — [PRG-04-decision-value-semantics.md](./PRG-04-decision-value-semantics.md) |
| **References** | [PRG-04](./PRG-04-decision-value-semantics.md); [PRG-02](./PRG-02-reading-contract-presence-validity-gates.md) (Variant A); [READING-CONTRACT-SPECIFICATION.md](../architecture/READING-CONTRACT-SPECIFICATION.md) |
| **WHY** | Decision Value must be defined as present contextual fit of a specific decision, not as outcome prediction, probability, Confidence, or any single Context score. This preserves Constraint-aligned epistemology and Variant A ownership (Producer meaning; Reading Contract envelope; presentation as pure consumer). |
| **ACT** | Accept **Decision Value = fitness of a specific decision to the current relevant context**. Authorize v1 Value Bands only: High, Moderate, Low, Insufficient Context. Prohibit numeric/percentage/decimal/probability-like Value in v1. Bind Context inputs (timing, relationship, location, world, personal/Vault) as inputs only. Do **not** authorize Decision Advantage, Value Engine, API, schema, UI, prompts, ReadingResult wiring, or application code. Do **not** modify Reading Contract or PRG-02 Variant A. |
| **OUTCOME** | Domain meaning of Decision Value: Accepted. Implementation / integration: **Not granted**. |
| **LEARN** | Prefer Context Fitness over predictive Value definitions; keep Value, Score, and Confidence as independent concepts. |

## 2026-07-29 — PRG-05 Accepted (Decision Value Producer Model)

| Field | Value |
|-------|-------|
| **ID** | PRG-05 |
| **Title** | Decision Value Producer Model |
| **Status** | ACCEPTED |
| **Authority** | Product / Producer responsibility |
| **Owner** | METIORO Product Owner |
| **Date** | 2026-07-29 |
| **WHERE** | Explicit Product Owner acceptance — [PRG-05-decision-value-producer-model.md](./PRG-05-decision-value-producer-model.md) |
| **References** | [PRG-05](./PRG-05-decision-value-producer-model.md); [PRG-04](./PRG-04-decision-value-semantics.md); [PRG-02](./PRG-02-reading-contract-presence-validity-gates.md); [READING-CONTRACT-SPECIFICATION.md](../architecture/READING-CONTRACT-SPECIFICATION.md) |
| **WHY** | After locking Decision Value semantics (PRG-04), the platform needs a producer-responsibility model: minimum inputs, output fields, combination boundaries, insufficiency behavior, and ownership of reasoning/uncertainty — without inventing formulas, schemas, or a Value Engine. |
| **ACT** | Accept PRG-05 Producer Model. Bind logical v1 producer outputs: `value_band`, `reasoning`, `relevant_context`, `uncertainty`, `missing_context`. Bind context-input and insufficiency rules (including Insufficient Context as a governed outcome). Preserve PRG-04 semantics and Reading Contract / Variant A envelope ownership. **Do not** authorize Value Engine, weights, thresholds, APIs, schemas, UI, prompts, surface integration, or application code. |
| **OUTCOME** | Producer responsibilities for Decision Value: Accepted. Implementation: **Not granted**. |
| **LEARN** | Separate semantics (PRG-04) from producer responsibility (PRG-05); never let presentation or a single Context score invent Value. |


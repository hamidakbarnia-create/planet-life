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

## 2026-07-29 — ADR-0013 Proposed

**Decision:** Proposed the Decision Value Engine Architecture.

**Scope:**
- Defines future technical component boundaries and data flow for a Decision Value Engine.
- Preserves PRG-04 semantics, PRG-05 Producer responsibilities, and PRG-02 / Reading Contract envelope ownership.
- Authorizes no implementation, Value Engine codebase, types, APIs, schemas, prompts, UI, surface wiring, numeric scoring, or Confidence derivation.

**Document:**
`docs/adr/ADR-0013-Decision-Value-Engine-Architecture.md`

**Status:** PROPOSED — constrained by ACR-0001 / ADR-0014 to **context-fitness signal only** (not a parallel recommendation pathway).

---

## DEC-0015 — Architecture Consolidation (Decision Case SoR)

| Field | Value |
|-------|-------|
| **ID** | DEC-0015 |
| **Title** | Architecture Consolidation — Decision Case System of Record |
| **Status** | ACCEPTED |
| **Authority** | ADR |
| **Owner** | METIORO project owner |
| **Date** | 2026-08-04 |
| **WHERE** | Architecture Consolidation Board — [ARCHITECTURE_CONSOLIDATION_RESOLUTION.md](../architecture/ARCHITECTURE_CONSOLIDATION_RESOLUTION.md) |
| **References** | ACR-0001; [ADR-0014](../adr/ADR-0014-Decision-Case-System-of-Record-and-Pathway-Consolidation.md); [EPIC-001](../architecture/EPIC-001-DECISION-CASE-V1-ENGINEERING-SPEC.md); Product Constitution; DQS; DIE; ADR-0006; ADR-0007 |
| **WHY** | Implementation readiness FAIL caused by competing primary objects, dual evaluation pathways, conflicting output contracts, empty evidence authority vs locked conversation decisions, and unregistered binding drafts. Consolidation required without product redesign. |
| **ACT** | Accept ACR-0001 as conflict resolver: **Decision Case** sole SoR; one Case→Engine→`DecisionEvaluationPackage` pathway; repository model; evidence eligibility; M0–M4 migration; ADR-0006/0007 superseded **in part**. Authorize engineering execution via EPIC-001 only. |
| **OUTCOME** | ACR + ADR-0014 ratified; EPIC-001 engineering spec authorized. |
| **LEARN** | Prefer one demotion table over parallel canonical stacks. |

---

## DEC-0016 — EPIC-001 Lifecycle Activation Profile (EG-01)

| Field | Value |
|-------|-------|
| **ID** | DEC-0016 |
| **Title** | EPIC-001 is a Lifecycle Activation Profile (not a lifecycle redefinition) |
| **Status** | ACCEPTED |
| **Authority** | ADR |
| **Owner** | Governance Resolution Board / METIORO project owner |
| **Date** | 2026-08-04 |
| **WHERE** | [EPIC-001-LIFECYCLE-ACTIVATION-PROFILE.md](./EPIC-001-LIFECYCLE-ACTIVATION-PROFILE.md) (LAP-001) |
| **References** | ACR-0001 §B4; ADR-0014; EPIC-001 Engineering Spec Part 5; EG-01 |
| **WHY** | EPIC-001 docs appeared to define `evaluated→completed` and `completed→archived` as SoR edges, contradicting ACR. Need minimum resolution that preserves ACR unchanged. |
| **ACT** | Accept **LAP-001**: EPIC-001 is determination **A** (legal Activation Profile). Canonical lifecycle remains ACR-0001 §B4 only. Repository stores only ACR states. `complete_case` and `archive_case` are **composites** that execute ACR paths (`→ planned → executing → completed` with `scheduled` skipped; `→ reflected → archived`) with atomic history. `activation_phase` is derived only. Amend EPIC-001 Part 5 reading accordingly. **Do not amend ACR.** |
| **OUTCOME** | EG-01 resolved. |
| **LEARN** | Prefer activation profiles with composite commands over rewriting canonical edges. |

---

## DEC-0017 — GOV-ISSUE-001 Option A + Safety/Language mapping (EG-02)

| Field | Value |
|-------|-------|
| **ID** | DEC-0017 |
| **Title** | ACR DecisionEvaluationPackage modules remain normative; brief labels abbreviated |
| **Status** | ACCEPTED |
| **Authority** | ADR |
| **Owner** | Governance Resolution Board / METIORO project owner |
| **Date** | 2026-08-04 |
| **WHERE** | [GOV-ISSUE-001](./GOV-ISSUE-001-EPIC001-PACKAGE-MODULE-CONFLICT.md) CLOSED |
| **References** | ACR-0001 §B3; DQS Parts 5–6; EG-02; EG-04 |
| **WHY** | Workstream briefs listed a shorter module set; ACR owns the contract. Safety/Language standards exist as DQS Parts 5–6. |
| **ACT** | Accept **GOV-ISSUE-001 Option A**. Brief labels are abbreviated; normative modules are full ACR-0001 §B3 (including `evidence`, `counter_recommendation`, `next_decisions`). Option B rejected. For EPIC-001: **Decision Safety Standard ≡ DQS Part 5**; **Decision Language Standard ≡ DQS Part 6**. Close GOV-ISSUE-001. |
| **OUTCOME** | EG-02 resolved. Package schema must implement full ACR module set. |
| **LEARN** | Label tables in briefs are not contract amendments. |

---

## DEC-0018 — Decision Case API Contract v1 (EG-03)

| Field | Value |
|-------|-------|
| **ID** | DEC-0018 |
| **Title** | Ratify public contract for `/api/v1/decision-cases` |
| **Status** | ACCEPTED |
| **Authority** | ADR |
| **Owner** | Governance Resolution Board / METIORO project owner |
| **Date** | 2026-08-04 |
| **WHERE** | [ADR-0015-Decision-Case-API-Contract-v1.md](../adr/ADR-0015-Decision-Case-API-Contract-v1.md) |
| **References** | ADR-0014; ACR-0001 §B7–B8; LAP-001; EG-03 |
| **WHY** | Engineering froze the Case API path without a ratified wire contract. Pathway prose is not a public contract. |
| **ACT** | Accept **ADR-0015**. Determination **B**: a public contract was required. Freeze minimum endpoints and Case/Evaluation/History shapes for EPIC-001 only. `state` = ACR SoR; `activation_phase` derived. ADR-0006/0007 remain non-SoR projections. No extra endpoints in EPIC-001. |
| **OUTCOME** | EG-03 resolved. Case route coding authorized under ADR-0015. |
| **LEARN** | Path freezes in plans require Accepted API ADRs before implementation. |

---

## DEC-0019 — Lifecycle side-state `*` enumeration + activation total map (GOV-LC-01…04)

| Field | Value |
|-------|-------|
| **ID** | DEC-0019 |
| **Title** | Clarify ACR side-state wildcards and LAP activation derivation without amending ACR |
| **Status** | **ACCEPTED** |
| **Authority** | ADR / Lifecycle clarification (subordinate to ACR-0001 §B4) |
| **Owner** | METIORO Product Owner / Governance Ratification Authority |
| **Date** | 2026-08-04 |
| **WHERE** | [GOV-ISSUE-002](./GOV-ISSUE-002-LIFECYCLE-SIDE-STATE-AND-ACTIVATION-CLARIFICATION.md) CLOSED; [LAP-001](./EPIC-001-LIFECYCLE-ACTIVATION-PROFILE.md) §2.9–§2.11 |
| **References** | ACR-0001 §B4.2–B4.3; LAP-001; DEC-0016; EPIC-001-E3-TASK-SPEC; GOV-LC-01…GOV-LC-04 |
| **WHY** | E3 blocked: ACR `*` not enumerable; `prior active` undefined; “terminal or parking” unassigned; LAP activation map incomplete for several Case states. |
| **ACT** | Accept GOV-ISSUE-002 canonical interpretation: (1) `paused` = parking; `superseded`/`rejected`/`archived` = terminal; (2) enumerate pause/supersede/reject source sets with no wildcard; (3) require `prior_active_state` metadata for pause/resume; (4) total CaseState→activation derivation including explicit `NO_ACTIVE_PHASE` for `superseded`/`rejected` and invalid pause metadata; `reflected`→`completed`; plan/schedule/execute phases from `mode`. **Do not amend ACR-0001 text.** Clarify LAP-001 §2.9–§2.11. Correct E3 task spec to match. After Owner ratification, E3 implementation may proceed; E4 must not begin until E3 PASS. |
| **OUTCOME** | **RATIFIED.** Owner adopts **Option A**: `activation_phase` is a derived projection only — when `state=paused` and `prior_active_state` is absent/invalid, return `NO_ACTIVE_PHASE` (does not fail loudly). Resume, repository, state-machine, and persistence validation remain fail-loudly. GOV-LC-01…04 closed. **E3 implementation authorized.** E4 remains blocked until E3 PASS. |
| **LEARN** | Prefer enumerable clarification under LAP/DEC over ACR prose amendment when product intent is unchanged. Derived projections must not own lifecycle validation. |

---

## DEC-0020 — ADR-0015 E5 wire activation subset (GOV-API-01…06)

| Field | Value |
|-------|-------|
| **ID** | DEC-0020 |
| **Title** | Ratify ADR-0015 Wire Supplement 01 for honest E5 API activation |
| **Status** | **ACCEPTED** |
| **Authority** | ADR / API wire clarification (supplements ADR-0015; subordinate to ACR-0001 / ADR-0014) |
| **Owner** | Governance Resolution Board / METIORO project owner |
| **Date** | 2026-08-04 |
| **WHERE** | [GOV-ISSUE-003](./GOV-ISSUE-003-ADR0015-WIRE-CONTRACT-GAPS.md) CLOSED; [ADR-0015-WS-01](../adr/ADR-0015-WIRE-SUPPLEMENT-01-E5-Activation.md) |
| **References** | ADR-0015; ADR-0006 error shape; LAP-001; DEC-0019; E3/E4 commits; EPIC-001 Execution Plan |
| **WHY** | E5 blocked: missing request/response/error wire detail; no concurrency field on wire; owner transport undefined under paused Auth; full ADR route matrix includes E6/E8/E10+ capabilities. |
| **ACT** | Accept **ADR-0015 Wire Supplement 01**: (1) E5 activates only create/list/get, complete, archive, evaluation reads, history; intake writes → E6; NL create → E8; POST evaluations/comparisons → E10+; (2) `expected_case_version` required JSON body on material writes (create exempt); (3) freeze response envelopes + `201` create; `activation_phase` null for NO_ACTIVE_PHASE; (4) ADR-0006-shaped error envelope with Case codes; (5) owner isolation Option A — single internal owner context; `403` reserved; (6) OpenAPI lists only ACTIVE_IN_E5 routes; no stubs. **Do not amend ACR-0001 or ADR-0014.** After Owner ratification, E5 implementation may proceed. |
| **OUTCOME** | **RATIFIED.** Owner accepts ADR-0015-WS-01. GOV-API-01…06 resolved; GOV-ISSUE-003 CLOSED. **E5 implementation authorized** for the ACTIVE_IN_E5 subset. Create-time type/entry-mode/`family_id`/`mode` authority remains the Decision Type Registry (minimal E2 seam authorized). |
| **LEARN** | Prefer activation subsets + wire supplements over early stubs for later-task capabilities. |

---

## DEC-0021 — Authorize P4B Compare specification and review only

| Field | Value |
|-------|-------|
| **Status** | **ACCEPTED** |
| **Authority** | Operational |
| **Owner** | METIORO Product Owner |
| **Date** | 2026-09-05 |
| **WHERE** | Explicit Product Owner authorization; [P4B-COMPARE-SPEC authorization record](./P4B-COMPARE-SPECIFICATION-AUTHORIZATION.md) |
| **References** | [GOVERNANCE.md](./GOVERNANCE.md) Sprint Protocol; [MASTER_STATUS.md](../MASTER_STATUS.md); ACR-0001; ADR-0014; PRG-02 Reading Contract presence/validity gates; PRG-04; PRG-05 |
| **WHY** | Compare semantic-presentation work had accumulated technical design-ahead without a registered workstream. Readiness and detailed scope were at risk of being treated as authorization. A distinct record is required because historical `SPRINT-4B` is CLOSED and unrelated. |
| **ACT** | Authorize `P4B-COMPARE-SPEC` for provenance-verified inspection, specification drafting, and governance/compatibility review only. Register the workstream as **PROPOSED**. Do **not** authorize application or test code, API/schema/runtime/registry/scoring/ranking/policy/UI/renderer/localization changes, implementation, deployment, production activation, Salary Raise work, or consumer-side derivation of comparative semantics. A separate explicit Product Owner decision is required before implementation. |
| **OUTCOME** | Specification/review gate opened. Implementation and deployment gates remain closed. No existing Compare behavior, ranking, winner, payload, or product surface is changed by this decision. |
| **LEARN** | Register proposal authority before detailed design creates legitimacy by momentum; keep specification acceptance and implementation authorization as separate gates. |

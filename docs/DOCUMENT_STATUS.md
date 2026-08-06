# Documentation Status

> **Audit date:** 2026-07-07
> **Scope:** Repository-wide documentation classification (analysis only — no documents modified)
> **Status categories used:** Active · Canonical · Proposed · Historical · Legacy · Archive Candidate

This index classifies every Markdown documentation file in the repository. It does not create governance, modify authority, or remove historical material.

---

## Authority Model (Validation Summary)

| Domain | Canonical authority | Incorrect second sources of truth |
|--------|---------------------|-----------------------------------|
| **Governance** | [METIORO_CONSTITUTION.md](./governance/METIORO_CONSTITUTION.md) | None at equal rank; [DOCUMENT_HIERARCHY.md](./governance/DOCUMENT_HIERARCHY.md) is meta-canonical (defines levels, not product law) |
| **ADRs** | [ADR_INDEX.md](./governance/ADR_INDEX.md) + accepted ADR files | Index lists ADR-0002/0003 as Proposed with **no standalone files** — index-only records |
| **Brand Constitution** | [METIORO_CONSTITUTION.md](./governance/METIORO_CONSTITUTION.md) + [BRAND_IDENTITY_STANDARD.md](./governance/BRAND_IDENTITY_STANDARD.md) | [ROADMAP.md](../ROADMAP.md) (legacy positioning/taglines); [one-sentence-position.md](./brand/one-sentence-position.md) (proposal only) |
| **Design Token Registry** | [design-token-registry.md](./design/system/design-token-registry.md) | [design-token-inventory.md](./design/system/design-token-inventory.md) and tier inventories (historical); ui-audit token inventories (evidence snapshots) |
| **MASTER_STATUS** | [MASTER_STATUS.md](./MASTER_STATUS.md) | **Sprint & workstream status registry** — authoritative for sprint/workstream status rows | Must not override Constitution, Decision Log LOCKED entries, Token Registry, or LOCKED ADRs | [GOVERNANCE.md](./governance/GOVERNANCE.md) |

---

## Document Registry

### Root-level documents

| Document | Location | Purpose | Authority | Status | Superseded by | Notes |
|----------|----------|---------|-----------|--------|---------------|-------|
| Strategic Roadmap | `ROADMAP.md` | May 2026 product vision, market, sprint plan, and feature bands under **Planet Life** naming | None (pre-governance) | **Legacy** | [METIORO_CONSTITUTION.md](./governance/METIORO_CONSTITUTION.md), [DECISION_LOG.md](./governance/DECISION_LOG.md), [MASTER_STATUS.md](./MASTER_STATUS.md) | See [Special Review: ROADMAP.md](#special-review-roadmapmd). Band thresholds (85/60/40) conflict with backend `_rating()` per [PHASE2_ARCHITECTURE_BASELINE.md](../PHASE2_ARCHITECTURE_BASELINE.md) |
| Session Handoff | `HANDOFF.md` | Persian/English session close report (22 May 2026): 6-tab nav, Vault, upgrade flow, 3-layer interpretation pipeline | Session record only | **Legacy** | [MASTER_STATUS.md](./MASTER_STATUS.md), [screen-inventory.md](./design/ui-audit/screen-inventory.md), [DECISION_LOG.md](./governance/DECISION_LOG.md) | See [Special Review: HANDOFF.md](#special-review-handoffmd). Still referenced for local dev startup |
| Cursor agent bootstrap | `cursor_context.md` | Minimal agent context: MVP complete (20 May 2026), stack, server commands, completed task list | None | **Archive Candidate** | [MASTER_STATUS.md](./MASTER_STATUS.md), [HANDOFF.md](../HANDOFF.md), [apps/web/AGENTS.md](../apps/web/AGENTS.md) | See [Special Review: cursor_context.md](#special-review-cursor_contextmd) |
| Persian review worksheet | `PERSIAN_REVIEW.md` | One-pass i18n correction sheet for Persian (`fa`) copy across nav, vault, upgrade, landing | Operational worksheet | **Active** | — (apply-then-archive workflow) | See [Special Review: PERSIAN_REVIEW.md](#special-review-persian_reviewmd). Open ✅ fields imply work may be pending |
| Phase 2 architecture baseline | `PHASE2_ARCHITECTURE_BASELINE.md` | July 2026 audit: current monolith layout, fragmentation, threshold deltas, migration recommendations | Architecture audit (non-governance) | **Active** | — (superseded in *direction* by Phase 3 blueprint, not in *facts*) | See [Special Review: PHASE2_ARCHITECTURE_BASELINE.md](#special-review-phase2_architecture_baselinemd). Listed in [DOCUMENT_HIERARCHY.md](./governance/DOCUMENT_HIERARCHY.md) as existing root doc |
| Pathfinder scoring methodology | `PATHFINDER_SCORING.md` | Relocation score layered model, verification against astro-seek/geocult/astro.com | Self-declared domain source of truth (unregistered in governance hierarchy) | **Active** | — | See [Special Review: PATHFINDER_SCORING.md](#special-review-pathfinder_scoringmd). **Authority risk:** claims SoT without Decision Log / ADR registration |

### `docs/` — status & governance

| Document | Location | Purpose | Authority | Status | Superseded by | Notes |
|----------|----------|---------|-----------|--------|---------------|-------|
| Master Status | `docs/MASTER_STATUS.md` | Sprint & workstream status registry; project entry-point summary | **Sprint status authority** per [GOVERNANCE.md](./governance/GOVERNANCE.md) | **Canonical** | — | Maintained by project owner; implicit sprint status forbidden |
| Governance Protocols | `docs/governance/GOVERNANCE.md` | Review Protocol and Sprint Protocol | Derives from Constitution | **Active** | — | Complements Review Protocol; does not replace it |
| Documentation Status | `docs/DOCUMENT_STATUS.md` | This audit — classifies all documentation | Meta (this audit) | **Active** | — | Created by governance cleanup sprint |
| Governance hub | `docs/governance/README.md` | Directory index and governance foundation overview | Derives from Constitution (Level 0) | **Active** | — | Status: Review |
| METIORO Constitution | `docs/governance/METIORO_CONSTITUTION.md` | Supreme authority: product identity, hierarchy, explainability, change process | **Level 0 — supreme** | **Canonical** | — | Status: Review (pending owner acceptance); still canonical by self-declaration §0.1 |
| Document Hierarchy | `docs/governance/DOCUMENT_HIERARCHY.md` | Authority levels and placement rules for all documentation | Derives from Constitution | **Canonical** | — | Meta-canonical placement map |
| Decision Log | `docs/governance/DECISION_LOG.md` | Permanent decisions with LOCKED / PROPOSED classification and provenance | Derives from Constitution | **Canonical** | — | Authoritative for DEC-0001–0004 and future LOCKED entries |
| ADR Index | `docs/governance/ADR_INDEX.md` | Index of architecture decision records | Derives from Constitution | **Active** | — | Canonical **index**; individual ADR files hold decision authority |
| Governance Changelog | `docs/governance/CHANGELOG.md` | Append-style log of governance foundation changes | Derives from Constitution | **Historical** | — | Status: Review; records governance sprint history |
| Brand Identity Standard | `docs/governance/BRAND_IDENTITY_STANDARD.md` | Brand Constitution proxy: tone, logo, typography, color, voice | Level 1 — Brand | **Canonical** | — | Status: Draft; hierarchy treats as brand authority |
| Trust Architecture | `docs/governance/TRUST_ARCHITECTURE.md` | Trust layers, evidence posture, user-facing trust contracts | Level 1 | **Active** | — | Supersedes ADR-0004 (index only). Status: Draft |
| Evidence Registry | `docs/governance/EVIDENCE_REGISTRY.md` | Registry schema for evidence artifacts | Level 2 | **Active** | — | Status: Draft |
| Requirement Registry | `docs/governance/REQUIREMENT_REGISTRY.md` | Product requirement registration schema | Level 2 | **Active** | — | Status: Draft |
| Legal & Compliance Policies | `docs/governance/LEGAL_COMPLIANCE_POLICIES.md` | Legal/compliance policy framework | Level 2 | **Active** | — | Status: Draft |

### `docs/governance/adr/` — architecture decision records

| Document | Location | Purpose | Authority | Status | Superseded by | Notes |
|----------|----------|---------|-----------|--------|---------------|-------|
| ADR-DS-001 Design System Architecture | `docs/governance/adr/ADR-DS-001-design-system-architecture.md` | Four-tier token architecture; incremental consolidation | ADR (Proposed) | **Proposed** | — | Target architecture; DS-01 implemented registry |
| ADR-DS-002 Runtime Semantic Token Consumption | `docs/governance/adr/ADR-DS-002-runtime-semantic-token-consumption.md` | Runtime maps must consume semantic tokens | ADR (Proposed) | **Proposed** | — | Extends ADR-DS-001; DS-02 implementation deferred |
| ADR-0001 Governance Hierarchy | *(index only)* | — | Superseded ADR | **Historical** | [METIORO_CONSTITUTION.md](./governance/METIORO_CONSTITUTION.md), [DOCUMENT_HIERARCHY.md](./governance/DOCUMENT_HIERARCHY.md) | No standalone file |
| ADR-0002 Navigation Model | *(index only)* | — | Proposed ADR | **Proposed** | — | No standalone file; DEC-0002 references index |
| ADR-0003 Logo Selection | *(index only)* | — | Proposed ADR | **Proposed** | — | No standalone file; DEC-0003 LOCKED in Decision Log |
| ADR-0004 Trust Architecture | *(index only)* | — | Superseded ADR | **Historical** | [TRUST_ARCHITECTURE.md](./governance/TRUST_ARCHITECTURE.md) | No standalone file |

### `docs/adr/` — accepted runtime ADR

| Document | Location | Purpose | Authority | Status | Superseded by | Notes |
|----------|----------|---------|-----------|--------|---------------|-------|
| ADR-0005 Decision Engine Facade | `docs/adr/ADR-0005-Decision-Engine-Facade-First-Runtime-Migration.md` | First facade runtime migration pattern (finance analyze) | **Accepted ADR** | **Canonical** | — | Lives in `docs/adr/` |
| ADR-0006 Decision API Contract v1 | `docs/adr/ADR-0006-Decision-API-Contract-v1.md` | LOCKED HTTP contract for Phase 6A backend bridge | **LOCKED ADR** | **Canonical** | — | `POST /api/v1/decision/execute`; implementation boundary clarified 2026-07-10 |

### `docs/brand/`

| Document | Location | Purpose | Authority | Status | Superseded by | Notes |
|----------|----------|---------|-----------|--------|---------------|-------|
| One Sentence Position | `docs/brand/one-sentence-position.md` | Proposed canonical one-sentence product position (Open Registry #1) | Proposal only | **Proposed** | [DECISION_LOG.md](./governance/DECISION_LOG.md) (if accepted) | Does not modify locked decisions |

### `docs/architecture/`

| Document | Location | Purpose | Authority | Status | Superseded by | Notes |
|----------|----------|---------|-----------|--------|---------------|-------|
| Phase 3 Architecture Blueprint | `docs/architecture/PHASE3_ARCHITECTURE_BLUEPRINT.md` | Long-term Personal Decision Intelligence platform architecture | Strategic blueprint (Draft) | **Active** | — | Framework-independent; not implementation spec |
| Decision Intelligence Engine | `docs/architecture/DECISION_INTELLIGENCE_ENGINE.md` | DIE conceptual models, boundaries, constraints | Architecture spec (Draft) | **Active** | — | Referenced by `packages/decision_engine` |
| Explainability Engine Specification | `docs/architecture/EXPLAINABILITY_ENGINE_SPECIFICATION.md` | Explainability engine architecture | Architecture spec (Draft) | **Active** | — | Explains outcomes; does not create them |
| Evidence Pipeline Specification | `docs/architecture/EVIDENCE_PIPELINE_SPECIFICATION.md` | Evidence ingestion and pipeline architecture | Architecture spec (Draft) | **Active** | — | Links to Evidence Registry |

### `docs/design/system/`

| Document | Location | Purpose | Authority | Status | Superseded by | Notes |
|----------|----------|---------|-----------|--------|---------------|-------|
| Design System README | `docs/design/system/README.md` | Hub: points to registry (canonical) and historical inventory | Navigation | **Active** | — | Correctly defers token authority to registry |
| Design Token Registry | `docs/design/system/design-token-registry.md` | **Single design token authority** — tiers, semantics, violations | **Canonical (DS-01)** | **Canonical** | — | Governed by ADR-DS-001 (Proposed) |
| Design Token Inventory | `docs/design/system/design-token-inventory.md` | Point-in-time value index from Inventory v1 | Historical snapshot | **Historical** | [design-token-registry.md](./design/system/design-token-registry.md) | Registry still links here for Tier 0 full value list |
| Color Token Inventory | `docs/design/system/color-token-inventory.md` | Pre-DS-01 color token enumeration | Historical snapshot | **Historical** | [design-token-registry.md](./design/system/design-token-registry.md) | Duplicates ui-audit/color-inventory at higher structure |
| Typography Token Inventory | `docs/design/system/typography-token-inventory.md` | Pre-DS-01 typography enumeration | Historical snapshot | **Historical** | [design-token-registry.md](./design/system/design-token-registry.md) | — |
| Spacing Inventory | `docs/design/system/spacing-inventory.md` | Pre-DS-01 spacing enumeration | Historical snapshot | **Historical** | [design-token-registry.md](./design/system/design-token-registry.md) | — |
| Radius & Shadow Inventory | `docs/design/system/radius-shadow-inventory.md` | Pre-DS-01 radius/shadow enumeration | Historical snapshot | **Historical** | [design-token-registry.md](./design/system/design-token-registry.md) | — |
| Motion Token Inventory | `docs/design/system/motion-token-inventory.md` | Pre-DS-01 motion enumeration | Historical snapshot | **Historical** | [design-token-registry.md](./design/system/design-token-registry.md) | — |
| Component Catalog | `docs/design/system/component-catalog.md` | Structured catalog of `apps/web/components` | Inventory-era reference | **Active** | — (future component authority TBD) | Duplicates [component-inventory.md](./design/ui-audit/component-inventory.md) with more structure |

### `docs/design/ui-audit/` — Step 0 inspection (complete)

| Document | Location | Purpose | Authority | Status | Superseded by | Notes |
|----------|----------|---------|-----------|--------|---------------|-------|
| UI Audit README | `docs/design/ui-audit/README.md` | Sprint scope and index for Step 0 inspection | Open Registry sprint evidence | **Historical** | [design/system/](./design/system/README.md) (for token authority) | Complete; inspection only |
| Screen Inventory | `docs/design/ui-audit/screen-inventory.md` | Per-screen UI inspection records | Evidence snapshot | **Historical** | — | Still actively cited by MASTER_STATUS |
| Component Inventory | `docs/design/ui-audit/component-inventory.md` | Component observations (audit form) | Evidence snapshot | **Historical** | [component-catalog.md](./design/system/component-catalog.md) | — |
| Navigation Map | `docs/design/ui-audit/navigation-map.md` | Route and nav structure map | Evidence snapshot | **Historical** | [DECISION_LOG.md](./governance/DECISION_LOG.md) (nav LOCKED) | — |
| Typography Inventory | `docs/design/ui-audit/typography-inventory.md` | Observed typography | Evidence snapshot | **Historical** | [design-token-registry.md](./design/system/design-token-registry.md) | — |
| Color Inventory | `docs/design/ui-audit/color-inventory.md` | Observed colors | Evidence snapshot | **Historical** | [design-token-registry.md](./design/system/design-token-registry.md) | — |
| Motion Inventory | `docs/design/ui-audit/motion-inventory.md` | Observed motion patterns | Evidence snapshot | **Historical** | [motion-token-inventory.md](./design/system/motion-token-inventory.md) | `prefers-reduced-motion` gap documented |
| Accessibility Audit | `docs/design/ui-audit/accessibility-audit.md` | A11y observations | Evidence snapshot | **Historical** | [HISTORY.md](./performance/HISTORY.md) (Lighthouse scores) | — |
| Responsive Audit | `docs/design/ui-audit/responsive-audit.md` | Responsive layout observations | Evidence snapshot | **Historical** | — | — |
| Known Inconsistencies | `docs/design/ui-audit/known-inconsistencies.md` | Documented UI inconsistencies | Evidence snapshot | **Historical** | — | Cited for technical debt in MASTER_STATUS |

### `docs/design/` — other

| Document | Location | Purpose | Authority | Status | Superseded by | Notes |
|----------|----------|---------|-----------|--------|---------------|-------|
| Visual Regression | `docs/design/VISUAL_REGRESSION.md` | Phase 0 Playwright visual baseline process | Operational test doc | **Active** | — | Ground truth in `apps/web/tests/visual/baseline/` |

### `docs/performance/`

| Document | Location | Purpose | Authority | Status | Superseded by | Notes |
|----------|----------|---------|-----------|--------|---------------|-------|
| Performance Baseline | `docs/performance/BASELINE.md` | Phase 0 landing benchmark and decision gates | **Canonical (performance gate)** | **Canonical** | — | Do not modify metrics retroactively |
| Performance History | `docs/performance/HISTORY.md` | Append-only Lighthouse run log | Historical log | **Historical** | — | Append-only by convention |
| Mobile LCP Analysis | `docs/performance/mobile-lcp-analysis.md` | Generated analysis from `.lighthouse-mobile.json` | Derived analysis | **Active** | [BASELINE.md](./performance/BASELINE.md) | Auto-generated timestamp 2026-07-07 |

### Application & package documentation

| Document | Location | Purpose | Authority | Status | Superseded by | Notes |
|----------|----------|---------|-----------|--------|---------------|-------|
| API Deployment | `apps/api/DEPLOY.md` | Railway deploy, Python 3.11, env vars | Operational | **Active** | — | Referenced by MASTER_STATUS |
| Next.js Agent Rules | `apps/web/AGENTS.md` | Next.js 16 agent constraints for AI tooling | Tooling | **Active** | — | Framework-specific |
| Claude pointer | `apps/web/CLAUDE.md` | `@AGENTS.md` re-export | Tooling | **Active** | [AGENTS.md](../apps/web/AGENTS.md) | Single-line pointer |
| Web README | `apps/web/README.md` | Default `create-next-app` boilerplate | None | **Archive Candidate** | [MASTER_STATUS.md](./MASTER_STATUS.md), [HANDOFF.md](../HANDOFF.md) | Not METIORO-specific |
| Decision Engine README | `packages/decision_engine/README.md` | Facade package usage and architecture pointer | Package doc | **Active** | [ADR-0005](./adr/ADR-0005-Decision-Engine-Facade-First-Runtime-Migration.md) | — |

### Tooling artifacts (non-project documentation)

| Document | Location | Purpose | Authority | Status | Superseded by | Notes |
|----------|----------|---------|-----------|--------|---------------|-------|
| pytest cache README | `.pytest_cache/README.md` | pytest auto-generated cache explanation | None | **Archive Candidate** | — | Not authored project documentation |
| pytest cache README (apps) | `apps/.pytest_cache/README.md` | pytest auto-generated cache explanation | None | **Archive Candidate** | — | Not authored project documentation |

---

## Special Review

### ROADMAP.md

**Recommendation: Legacy** (not Active)

**Rationale:**
- Dated **May 2026** with status "Phase 0 complete, entering Sprint 1 (The Oracle)" — predates governance foundation, DS-01, landing v1, and `governance-foundation` branch work summarized in [MASTER_STATUS.md](./MASTER_STATUS.md).
- Uses **Planet Life** product naming and **Strategic Timing Intelligence** positioning, which conflicts with LOCKED **Personal Decision Intelligence** (DEC-0001).
- Taglines (*"Align your execution with the universe"*) conflict with constitutional/brand locked copy (*Know your best next move*, hero *Every decision has a better time.*).
- Sprint structure (Oracle, content engine, Julia readings) is historical planning context, not current execution authority.
- [PHASE2_ARCHITECTURE_BASELINE.md](../PHASE2_ARCHITECTURE_BASELINE.md) documents that ROADMAP score-band thresholds **do not match** backend `_rating()` — retaining Active status would mislead implementers.

**Preserve because:** Records original vision, market framing, and band vocabulary evolution. [DOCUMENT_HIERARCHY.md](./governance/DOCUMENT_HIERARCHY.md) lists it as existing strategic roadmap.

---

### HANDOFF.md

**Recommendation: Legacy** (not Active)

**Rationale:**
- Fixed **22 May 2026** session snapshot in Persian/English — describes Vault cards, upgrade tiers, and R8 interpretation slice as built *that day*.
- Operational details (localStorage founder codes, specific Vault sections) may have drifted; current surface truth is better evidenced by [screen-inventory.md](./design/ui-audit/screen-inventory.md) and [MASTER_STATUS.md](./MASTER_STATUS.md).
- Navigation architecture is partly superseded by LOCKED DEC-0002 in [DECISION_LOG.md](./governance/DECISION_LOG.md), though HANDOFF remains cited as provenance.
- Still useful for **historical context** (why Vault is a pill, 3-layer pipeline origin) and Persian session continuity.

**Preserve because:** DECISION_LOG references it; HANDOFF explicitly instructs future sessions to continue from it — but as **historical handoff**, not live spec.

---

### cursor_context.md

**Recommendation: Archive Candidate** (not Active)

**Rationale:**
- States **MVP COMPLETE as of 20 May 2026** — contradicted by subsequent sprints (governance, landing v1, design system, performance baselines).
- Minimal content duplicated and exceeded by [MASTER_STATUS.md](./MASTER_STATUS.md), [HANDOFF.md](../HANDOFF.md), and [apps/web/AGENTS.md](../apps/web/AGENTS.md).
- No governance linkage, version, or authority statement.
- Highest risk as a **stale second source of truth** if agents load it preferentially.

**Preserve because:** Records early MVP milestone claim and bare-metal server commands.

---

### PERSIAN_REVIEW.md

**Recommendation: Active** (until worksheet applied)

**Rationale:**
- Operational **fix sheet**, not governance or architecture — purpose is to collect corrected Persian strings before a single bulk apply.
- Many items retain blank **✅** fields and ⚠️ flags (e.g. Vault → `محرمانه` vs `گنجینه`), indicating **open work**.
- Does not conflict with locked English brand decisions; addresses localization quality.
- Once corrections are applied in code, status should transition to **Historical** (not deleted).

**Preserve because:** Concentrates Persian review in one pass; avoids scattered i18n notes.

---

### PHASE2_ARCHITECTURE_BASELINE.md

**Recommendation: Active** (not Legacy)

**Rationale:**
- **July 2026** audit aligned with current repo layout (`packages/astro_engine`, `ScoringContext`, i18n fragmentation).
- Explicitly scoped as **audit and design only** — compatible with Phase 3 direction without being superseded factually.
- [PHASE3_ARCHITECTURE_BLUEPRINT.md](./architecture/PHASE3_ARCHITECTURE_BLUEPRINT.md) links to it as "current-state audit and migration baseline."
- [DOCUMENT_HIERARCHY.md](./governance/DOCUMENT_HIERARCHY.md) registers it as a named existing document at repo root.
- Documents threshold/code divergence that remains relevant until coordinated fix.

**Not Legacy because:** It is the most detailed **as-built** architecture audit; ROADMAP does not replace it.

---

### PATHFINDER_SCORING.md

**Recommendation: Active** (not Legacy)

**Rationale:**
- Living **algorithm methodology** for relocation scoring with verification steps against external references.
- Complements code in `packages/astro_engine` — not duplicated elsewhere in `docs/`.
- [DOCUMENT_HIERARCHY.md](./governance/DOCUMENT_HIERARCHY.md) explicitly lists it as "Pathfinder Scoring Methodology."
- Required for Julia's "errors trend to zero" quality bar.

**Authority caveat:** File declares itself "source of truth" but is **not registered** in Decision Log or ADR_INDEX. It is Active domain documentation, not Canonical governance. Recommend future registration as Level 3 engineering spec without changing content now.

---

## Duplicate Documentation Areas

| Area | Documents involved | Relationship |
|------|-------------------|--------------|
| **Design tokens (values)** | `docs/design/ui-audit/color-inventory.md`, `typography-inventory.md`, `motion-inventory.md` · `docs/design/system/*-inventory.md` · `docs/design/system/design-token-inventory.md` · `docs/design/system/design-token-registry.md` | Four layers: raw audit → structured inventory → consolidated inventory → **canonical registry**. First three are historical duplicates of overlapping facts |
| **Components** | `docs/design/ui-audit/component-inventory.md` · `docs/design/system/component-catalog.md` | Audit observations vs structured catalog of same codebase |
| **Navigation / routes** | `HANDOFF.md` · `docs/design/ui-audit/navigation-map.md` · `docs/design/ui-audit/screen-inventory.md` · `DECISION_LOG.md` (DEC-0002) | Session notes vs inspection evidence vs LOCKED decision |
| **Product positioning** | `ROADMAP.md` · `docs/governance/METIORO_CONSTITUTION.md` · `docs/governance/BRAND_IDENTITY_STANDARD.md` · `docs/brand/one-sentence-position.md` · `docs/MASTER_STATUS.md` | Legacy vision vs constitutional vs brand standard vs proposal vs summary |
| **Architecture (platform)** | `PHASE2_ARCHITECTURE_BASELINE.md` · `docs/architecture/PHASE3_ARCHITECTURE_BLUEPRINT.md` · `docs/architecture/DECISION_INTELLIGENCE_ENGINE.md` · `docs/architecture/EXPLAINABILITY_ENGINE_SPECIFICATION.md` · `docs/architecture/EVIDENCE_PIPELINE_SPECIFICATION.md` | Baseline (as-built) vs target (to-be) vs engine specs — intentional layering with overlap on boundaries |
| **Score bands / thresholds** | `ROADMAP.md` · `PHASE2_ARCHITECTURE_BASELINE.md` · `docs/design/system/design-token-registry.md` (semantic bands) · runtime `calendar-scores.ts` / backend `_rating()` | Terminology and numeric thresholds duplicated with **known conflicts** |
| **Performance metrics** | `docs/performance/BASELINE.md` · `docs/performance/HISTORY.md` · `docs/performance/mobile-lcp-analysis.md` · `docs/design/ui-audit/accessibility-audit.md` | Baseline gate vs chronological log vs derived analysis vs qualitative a11y |
| **Dev / agent startup** | `cursor_context.md` · `HANDOFF.md` · `docs/MASTER_STATUS.md` · `apps/web/AGENTS.md` | Overlapping server commands and project status |
| **Trust** | `docs/governance/TRUST_ARCHITECTURE.md` · ADR-0004 (index, superseded) · `docs/architecture/EXPLAINABILITY_ENGINE_SPECIFICATION.md` | Consolidated trust doc supersedes ADR-0004 index entry |
| **Pathfinder** | `PATHFINDER_SCORING.md` · `PHASE2_ARCHITECTURE_BASELINE.md` (pathfinder section) · API route code | Methodology doc vs architectural mention |

---

## Conflicting Terminology

| Concept | Variant A | Variant B (or C) | Where | Severity |
|---------|-----------|------------------|-------|----------|
| **Product name** | METIORO | Planet Life | Governance docs vs `ROADMAP.md`, `HANDOFF.md`, `cursor_context.md`, `PERSIAN_REVIEW.md` | High — legacy docs |
| **Product category** | Personal Decision Intelligence (LOCKED) | Strategic Timing Intelligence | `DECISION_LOG.md` / Constitution vs `ROADMAP.md` | High |
| **Primary tagline** | *Know your best next move.* | *Know your next move.* | Constitution / `brand.ts` vs Open Registry copy (noted in MASTER_STATUS) | Medium — unresolved |
| **Marketing tagline** | *Every decision has a better time.* (hero) | *Align your execution with the universe.* | Landing / brand vs `ROADMAP.md` | Medium |
| **Score band labels** | Golden / Favorable / Caution / Avoid (UI) | A+ / B / C / F Friction (`ROADMAP.md`) | PHASE2 §1.3 | Medium |
| **Score thresholds** | 85 / 60 / 40 (`ROADMAP.md`, calendar UI) | 80 / 65 / 45 / 30 (backend `_rating()`) | PHASE2 §1.3, T5 table | **High — implementation risk** |
| **Phase label** | Engineering Execution / governance-foundation | Phase 0 → Sprint 1 (Oracle) | MASTER_STATUS vs ROADMAP | Low — temporal |
| **MVP status** | Complete (20 May 2026) | Late MVP / early platform (July 2026) | `cursor_context.md` vs MASTER_STATUS | Medium |
| **Vault nav label (FA)** | `محرمانه` (confidential) | `گنجینه` (treasure/vault) suggested | `PERSIAN_REVIEW.md` | Low — localization |
| **ADR numbering** | ADR-DS-001 / ADR-DS-002 | ADR-0001–0005 | Parallel numbering schemes in ADR_INDEX | Low — documented |
| **"Brand Constitution"** | `METIORO_CONSTITUTION.md` + `BRAND_IDENTITY_STANDARD.md` | Standalone Brand Constitution file (expected in sprint brief) | `one-sentence-position.md` notes absence | Low — naming |

---

## Broken, Missing, and Circular References

### Broken or missing targets

| Referenced | Referenced from | Issue |
|------------|-----------------|-------|
| `docs/governance/DECISION_REGISTRY.md` | `ADR-DS-001`, `ADR-DS-002`, `one-sentence-position.md` | **File does not exist** — decisions live in `DECISION_LOG.md` |
| Standalone Brand Constitution / Lexicon / Constraints files | `one-sentence-position.md` sprint brief | **Not present** — absorbed into Constitution + Brand Identity Standard |
| `ADR-0002`, `ADR-0003` standalone files | `ADR_INDEX.md`, `DECISION_LOG.md` | **Index-only** — links resolve to index, not full ADR text |
| `PHASE2_ARCHITECTURE_BASELINE.md` | `MASTER_STATUS.md` | **Not linked** from master index ( omission, not broken link) |
| `PATHFINDER_SCORING.md` | `MASTER_STATUS.md` | **Not linked** from master index |

### Circular reference chains (benign but dense)

1. **Constitution ↔ Document Hierarchy ↔ ADR Index** — mutual authority derivation (by design).
2. **ADR-DS-001 ↔ design-token-registry ↔ ADR-DS-002** — architecture proposes registry; registry cites ADRs; ADR-DS-002 extends DS-001.
3. **PHASE3 Blueprint ↔ DIE spec ↔ Explainability spec ↔ Evidence Pipeline** — cross-linked target architecture cluster.
4. **MASTER_STATUS → governance docs → MASTER_STATUS** — index summarizes sources it points to (acceptable if treated as navigation only).

---

## Archive Candidates (recommended)

| Document | Rationale | Action |
|----------|-----------|--------|
| `cursor_context.md` | Stale MVP claim; superseded agent/bootstrap docs | Mark Legacy/Archive; add pointer in future index update (not in this sprint) |
| `apps/web/README.md` | Generic Next.js boilerplate | Archive or replace with METIORO-specific README in future sprint |
| `.pytest_cache/README.md` | Auto-generated | Exclude from governance scope; gitignore already typical |
| `apps/.pytest_cache/README.md` | Auto-generated | Same as above |
| `ROADMAP.md` | Legacy positioning and conflicting thresholds | Keep as Legacy; do not delete; optional `docs/archive/` move in future |
| `HANDOFF.md` | Fixed May 2026 session | Keep as Legacy; optional archive folder |
| Design System Inventory v1 files (`docs/design/system/*-inventory.md` except registry) | Historical snapshots post-DS-01 | Already marked Historical; candidates for `docs/archive/design/` **only when** registry fully embeds all values |

**Not recommended for archive:** `PERSIAN_REVIEW.md` (active worksheet), `PHASE2_ARCHITECTURE_BASELINE.md`, `PATHFINDER_SCORING.md`, governance foundation docs, `MASTER_STATUS.md`, `design-token-registry.md`.

---

## Reference Improvement Recommendations

1. **MASTER_STATUS.md** — Add explicit links to `PHASE2_ARCHITECTURE_BASELINE.md`, `PATHFINDER_SCORING.md`, and `docs/governance/DOCUMENT_HIERARCHY.md`. Label ROADMAP/HANDOFF/cursor_context with Legacy/Archive status inline (status doc only; no edit this sprint).

2. **ADR_INDEX.md** — Add location column distinguishing `docs/adr/` vs `docs/governance/adr/` vs index-only records. Clarify ADR-0003 Proposed vs DEC-0003 LOCKED (decision locked, ADR narrative absent).

3. **Missing DECISION_REGISTRY.md** — Either create as alias pointer to `DECISION_LOG.md` in a future sprint, or add errata notes in ADR-DS-001/002 and `one-sentence-position.md` (not done here).

4. **PHASE2 ↔ ROADMAP** — PHASE2 recommends documenting threshold delta or deprecating ROADMAP bands; MASTER_STATUS already calls ROADMAP legacy — cross-link threshold table when implementation sprint occurs.

5. **PATHFINDER_SCORING.md** — Register in Document Hierarchy Level 3 engineering spec table and link from MASTER_STATUS scoring section; soften "source of truth" phrasing only via governance process (not this sprint).

6. **design-token-registry.md** — Inline Tier 0 full value list to reduce dependency on historical `design-token-inventory.md` (future DS sprint).

7. **PERSIAN_REVIEW.md** — After apply pass, add completion date header in future sprint and transition status to Historical in this registry.

8. **apps/web/README.md** — Replace boilerplate with pointer to `docs/MASTER_STATUS.md` and dev commands from `HANDOFF.md` / `DEPLOY.md`.

9. **Governance hub README** — Link to `docs/DOCUMENT_STATUS.md` as documentation classification index.

10. **ADR placement** — Document why ADR-0005 lives in `docs/adr/` while ADR-DS-* live in `docs/governance/adr/` to prevent search ambiguity.

---

## Summary Counts

| Status | Count |
|--------|-------|
| Canonical | 9 |
| Active | 22 |
| Proposed | 6 |
| Historical | 18 |
| Legacy | 2 |
| Archive Candidate | 5 |

*Counts include index-only ADR records and tooling artifacts. `docs/DOCUMENT_STATUS.md` counted as Active.*

---

*This document is the output of the Repository Governance Cleanup (Non-Functional) sprint. No existing documents were modified, deleted, or committed.*

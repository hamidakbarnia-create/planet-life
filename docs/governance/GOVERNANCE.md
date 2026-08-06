# METIORO Governance — Operational Protocols

> **Status:** Review
> **Version:** 1.0.0
> **Authority:** Derives from [METIORO_CONSTITUTION.md](./METIORO_CONSTITUTION.md) (Level 0) and [DOCUMENT_HIERARCHY.md](./DOCUMENT_HIERARCHY.md)
> **Purpose:** Operational protocols for review and sprint execution. This document does not override the Constitution, Decision Log LOCKED entries, or Accepted/LOCKED ADRs.

---

## Review Protocol

The **Review Protocol** is the governance review process defined in the Constitution and governance instruments:

| Stage | Instrument | Role |
|-------|------------|------|
| Compatibility review | [METIORO_CONSTITUTION.md](./METIORO_CONSTITUTION.md) §6.4 | Ensures proposals do not contradict constitutional principles |
| Permanent decision registration | [DECISION_LOG.md](./DECISION_LOG.md) | Records irreversible or long-lived decisions with provenance |
| Architecture decision recording | [ADR_INDEX.md](./ADR_INDEX.md) | Records structural and cross-cutting technical decisions |
| Document placement | [DOCUMENT_HIERARCHY.md](./DOCUMENT_HIERARCHY.md) | Assigns authority level before publication |
| Status registration | [MASTER_STATUS.md](../MASTER_STATUS.md) | Registers sprint and workstream status explicitly |

Review Protocol answers: *Is this change compatible with locked governance and correctly recorded?*

It does **not** answer: *How should engineers execute a bounded sprint safely?* That is the Sprint Protocol below.

---

## Sprint Protocol

The **Sprint Protocol** complements the Review Protocol. It governs day-to-day engineering sprints after governance authorization exists. It does not replace constitutional review, ADR acceptance, or Decision Log registration.

### Step 0 — Rule 0 and Review Question Zero (mandatory first)

Before any sprint scope is accepted, answer **Review Question Zero**:

> **Does this sprint violate Rule 0?**
> That is: does it redefine, reverse, or reinterpret any **LOCKED** entry in the Decision Log, any **LOCKED** ADR, or any constitutional principle without the formal change process defined for that authority level?

If the answer is **yes**, stop. Enter the appropriate governance process before continuing.

**Rule 0 (operational summary):** Locked decisions are immutable unless changed through the formal process appropriate to their authority level ([METIORO_CONSTITUTION.md](./METIORO_CONSTITUTION.md) §0.4).

### Four pre-sprint questions (mandatory)

Every sprint must answer these four questions in writing before implementation begins:

| # | Question | Required output |
|---|----------|-----------------|
| **Q1** | **Authorization** — What LOCKED decision, Accepted/LOCKED ADR, registered sprint row, or approved backlog item authorizes this work? | Cite ID and path |
| **Q2** | **Rule 0 clearance** — Does this sprint reopen any locked decision, brand constraint, or architectural boundary? | Yes/No with evidence |
| **Q3** | **Scope boundary** — What is explicitly in scope and explicitly out of scope? | Bullet lists |
| **Q4** | **Acceptance** — What are the acceptance criteria and exact verification commands? | Criteria + commands |

Unanswered questions block sprint start.

### Eight-stage execution cycle

| Stage | Name | Action |
|-------|------|--------|
| **1** | **Baseline verify** | Confirm branch, clean working tree, tests/build state, and registered sprint row in [MASTER_STATUS.md](../MASTER_STATUS.md) |
| **2** | **Review Question Zero** | Confirm Rule 0 clearance (Step 0 above) |
| **3** | **Pre-sprint lock** | Answer Q1–Q4; freeze scope; no scope expansion without re-entry at Stage 2 |
| **4** | **Implement** | Execute only within locked scope; no parallel architecture invention |
| **5** | **Verify** | Run acceptance commands; capture before/after evidence when behavior must be preserved |
| **6** | **Governance update** | Update [MASTER_STATUS.md](../MASTER_STATUS.md) sprint row, ADR index, or Decision Log as required |
| **7** | **Commit / tag** | Single-purpose commits; phase tags only on approved boundaries |
| **8** | **Sprint close** | Mark sprint row CLOSED with commit or tag evidence; record sprint log entry |

Stages may not be skipped. Inspection-only sprints stop after Stage 5 unless documentation updates are in scope.

### Governance approval integrity

> Any artifact subject to governance approval must be committed byte-identical to its approved draft. Any unreviewed delta discovered before or after commit invalidates the Lock and reverts the artifact to Proposed until re-reviewed.

### Relationship to Review Protocol

| Review Protocol | Sprint Protocol |
|-----------------|-----------------|
| Decides whether a change is governable | Decides how authorized work is executed |
| Registers permanent decisions and ADRs | Consumes registered authority |
| Runs at proposal and acceptance boundaries | Runs every sprint |
| May block work that violates Rule 0 | Assumes Rule 0 already cleared at Stage 2 |

Sprint Protocol **complements** Review Protocol. It does **not** replace it.

---

## Sprint status rule

No sprint or workstream may be treated as active, closed, or planned unless it has an **explicit row** in the Sprint & Workstream Status Registry in [MASTER_STATUS.md](../MASTER_STATUS.md).

**Implicit, oral, or chat-only sprint status is forbidden.**

---

## Related instruments

| Instrument | Path |
|------------|------|
| Constitution | [METIORO_CONSTITUTION.md](./METIORO_CONSTITUTION.md) |
| Decision Log | [DECISION_LOG.md](./DECISION_LOG.md) |
| ADR Index | [ADR_INDEX.md](./ADR_INDEX.md) |
| Document Hierarchy | [DOCUMENT_HIERARCHY.md](./DOCUMENT_HIERARCHY.md) |
| Master Status / Sprint Registry | [MASTER_STATUS.md](../MASTER_STATUS.md) |
| Document Registry | [DOCUMENT_STATUS.md](../DOCUMENT_STATUS.md) |

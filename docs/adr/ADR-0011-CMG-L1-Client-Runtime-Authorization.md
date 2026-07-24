# ADR-0011: CMG L1 Client Runtime Authorization

**Status:** Accepted
**Date:** 2026-07-24
**Decision makers:** METIORO Product Owner / Platform Architecture
**Normative language:** `MUST`, `MUST NOT`, `SHALL`, `MAY`
**Depends on:** [ADR-0010](./ADR-0010-Canonical-Memory-Graph-and-Personal-Intelligence-Memory-Boundaries.md) (Accepted)
**Companion planning:** [CMG-SPECIFICATION-DEPENDENCY-MAP.md](../architecture/CMG-SPECIFICATION-DEPENDENCY-MAP.md)

---

## Lifecycle

Status moved **Proposed → Accepted** on **2026-07-24** following explicit Product Owner ratification.

Acceptance of ADR-0011 establishes the L1 architectural authorization boundary but does **not** independently authorize implementation. Coding remains **blocked** until the required executable specifications are separately approved.

**Implementation authorization: CONDITIONAL, NOT YET ACTIVE.**

**Ratification record**

| Field | Value |
|-------|-------|
| Ratified by | Product Owner |
| Ratification date | 2026-07-24 |
| Decision | Accepted |
| Scope | CMG L1 client-runtime implementation boundary |
| Coding authorization | Not activated by ADR acceptance alone |
| Required coding gates | Approved repository contract and admission pipeline specification |
| L2 authorization | Not granted |

Three states (normative for planning):

| State | Work allowed |
|-------|----------------|
| **1. Drafting / reviewing this ADR** | Complete (documentation) |
| **2. Ratifying this ADR** | Complete (Product Owner, 2026-07-24) |
| **3. Implementing L1** | Still **blocked** until required executable specifications (at minimum: repository contract + admission pipeline) are separately approved. Acceptance alone does **not** authorize coding. Producer integrations remain blocked until each applicable producer contract is approved. |

---

## Context

[ADR-0010](./ADR-0010-Canonical-Memory-Graph-and-Personal-Intelligence-Memory-Boundaries.md) Accepted on 2026-07-23 locks **L0** Canonical Memory Graph (CMG) ownership, admission principles, the Canonical MemoryRecord Contract (`schemaVersion: "1.0.0"`), projection/search field boundaries, and intelligence-memory boundaries.

ADR-0010 explicitly:

- does **not** authorize implementation
- defines **L1** as the client aggregation / derived-index runtime role implementing L0 — not an independent system of record
- states that **L2** does not exist and is not approved
- does **not** supersede [ADR-0007](./ADR-0007-Conversation-API-Contract-v1.md) (stateless conversation) or [ADR-0009](./ADR-0009-Shared-Frontend-Conversation-and-Decision-Context-Boundaries.md)

As of this draft, the repository has **no** CMG L1 runtime, admitted MemoryRecord store, admission pipeline, or CMG Search index (evidence: ADR-0010 impact assessment baseline @ `27c2a833`).

A separate authorization ADR is required before any L1 coding so that “Accepted L0” is not misread as permission to ship client memory persistence.

---

## Decision

On Acceptance (2026-07-24), the following decision takes effect as the **architectural boundary**. Coding remains blocked until required executable specifications are approved:

1. Authorize a **client-side CMG L1 runtime** that implements ADR-0010 L0 for a single account on-device / in-browser client context.
2. L1 **MUST** persist only **admitted** `MemoryRecord` values conforming to ADR-0010 Canonical MemoryRecord Contract with `schemaVersion: "1.0.0"`.
3. `type` and `domain` **MUST** be governed string identifiers (`MemoryTypeId`, `MemoryDomainId`) registered per the Memory type/domain registry specification — not ad-hoc closed enums invented in application code.
4. L1 **MUST** expose a **deterministic repository contract** (operations and invariants) defined in a separate repository contract specification before coding.
5. L1 **MUST** enforce an **explicit admission pipeline** (no silent admit; no read-triggered create).
6. L1 **MUST** enforce ADR-0010 lifecycle rules (`supersedesRecordId`, `deleted`/`deletedAt` consistency).
7. L1 **MAY** maintain **rebuildable lexical/filter indexes** over admitted records only, matching ADR-0010 Search v1 field list; indexes **MUST NOT** become canonical owners.
8. Producer integrations (Ask explicit save, Calendar allowlist, etc.) **MUST** await separate producer specifications; this ADR does not by itself wire producers.
9. L1 **MUST NOT** require a public backend memory API; L2 remains nonexistent and unapproved until a future ADR.

Items 1–9 define the Accepted L1 boundary. They **MUST NOT** be implemented until coding gates below are satisfied (repository contract + admission pipeline approved; producer contracts for any producer wiring).

---

## Authorized scope (architectural; coding gated)

Architectural authorization is limited to:

| Capability | Bound |
|------------|--------|
| Client-side admitted MemoryRecord persistence | Single-client L1 store implementing ADR-0010 field contract |
| Schema | `schemaVersion: "1.0.0"` only unless a future ADR raises the contract |
| Identifiers | Governed `MemoryTypeId` / `MemoryDomainId` strings |
| Repository | Deterministic repository contract (spec required before coding) |
| Admission | Explicit admission pipeline per ADR-0010 matrices + pipeline spec |
| Lifecycle | Validation of status / supersession / deletion invariants |
| Search indexes | Rebuildable lexical/filter indexes over admitted fields only |
| Producers | Integration **after** separate producer specs; not automatic by this ADR |
| Backend API | **No** public memory API required or authorized |

Storage technology (e.g. which browser/client persistence mechanism) is **not** selected by this ADR. It remains an **implementation-specification decision** unless repository evidence later mandates a specific technology via a separate accepted decision.

---

## Dependencies

| Dependency | Status | Role |
|------------|--------|------|
| ADR-0010 | Accepted | Normative L0 ownership, admission, MemoryRecord, invariants |
| ADR-0007 | LOCKED | Conversation remains stateless; not amended by this ADR |
| ADR-0009 | Accepted | Frontend conversation/PIP boundaries; not amended by this ADR |
| Memory type/domain registry spec | Proposed | Required before coding typed admissions |
| Relationship edge taxonomy spec | Proposed | Required before coding relationship edges |
| CMG repository contract | Missing | Required before L1 persistence coding |
| Admission pipeline spec | Missing | Required before admission coding |
| Producer specs (Ask, Calendar, …) | Missing | Required before each producer integration |

---

## Repository boundaries

When coding gates are cleared, L1 code **MUST** live in client application modules under an explicit CMG / memory boundary (exact path is an implementation-spec decision).

L1 **MUST NOT**:

- import Pathfinder or other product modules in ways that invert ownership (ADR-0009 spirit)
- treat Vault routes or UI as the system of record
- place canonical admitted memory in backend services (that would be L2)

---

## Persistence boundary

- Persist **only** admitted `MemoryRecord` documents and their graph edges as defined by ADR-0010.
- **MUST NOT** copy People native relationship state, Profile entity state, or other source-module canonical entities into CMG; references (`PersonRef`, `ProfileRef`, `subjectRefs`) only.
- AI summaries have **no** canonical persistence by default; if admitted, they become ordinary `MemoryRecord` values owned by CMG.
- Intelligence Layer owns **generation** only; L1 owns persistence **only after admission**.
- Technology choice for the physical store is deferred to the repository contract / implementation spec.

---

## Admission boundary

- Every write to the admitted store **MUST** pass the explicit admission pipeline.
- Reads, views, fetches, and Vault section browsing **MUST NOT** create memory.
- Ask output is not memory by default; Ask admission requires **explicit user save** per ADR-0010 (and a future Ask explicit-save contract).
- Automatic Ask save, silent admit, and read-triggered create remain **forbidden**.

---

## Search / index boundary

If indexes are built under an Accepted L1:

- Index **only** admitted MemoryRecords.
- Index fields limited to ADR-0010 Search v1: `title`, `summary`, `tags`, `type`, `domain`, `subjectRefs`, and approved structured `references`.
- Indexes are derived, disposable, and rebuildable.
- Canonical admitted store and derived index **MUST** be separated: index rebuild, corruption, or partial index failure **MUST NOT** invalidate, mutate, or delete canonical admitted records.
- **MUST NOT** claim semantic or vector search.
- Search **MUST NOT** become canonical owner of content.
- Projections (Timeline / Knowledge / Vault Hub views) **MUST NOT** become systems of record.

---

## Producer integration boundary

Acceptance of this ADR does **not** by itself authorize wiring Ask, Calendar, People, Profile, Pathfinder, World, PIP, Vault, or Julia as live producers.

Each producer requires its own specification (and, where admission mode widens policy, any additional Product Owner decisions required by that spec). Until those specs exist and L1 is Accepted, producer integration coding remains blocked.

Julia remains **not** a producer under P1. Live conversation memory remains out of scope; ADR-0007 remains in force.

---

## Lifecycle enforcement

L1 **MUST** enforce:

- Corrections create a superseding record; history is not silently overwritten.
- Correcting records use `supersedesRecordId` on the new record.
- `status = deleted` requires `deletedAt`.
- `deletedAt` **MUST NOT** be set for non-deleted records.
- Provenance `confidence`, when present, remains inclusive range 0..1 for derived/uncertain records.

---

## Privacy and account identity constraints

- Every record **MUST** carry `accountUserId` as defined by ADR-0010.
- Offline / anonymous account identity behavior remains an **Open Question** from ADR-0010; L1 **MUST NOT** invent a conflicting identity model without a governing resolution.
- Visibility / retention field presence follows the MemoryRecord contract; duration and privacy semantics remain Open Questions until specified.
- Cross-device sync and cloud sync are **not** authorized by this ADR.

---

## Failure / degradation behavior

L1 executable specifications **MUST** define:

- Fail-closed admission (reject on validation failure; never silent admit; admission failure **MUST NOT** produce a canonical record)
- Invalid `schemaVersion` and unknown/non-active taxonomy identifiers fail safely (reject on write; non-fatal opaque handling on read/display as defined by the registry/repository specs)
- Index rebuild after corruption or schema-compatible migrations within `1.0.0`
- Partial or total derived-index failure **MUST NOT** corrupt or roll back the canonical admitted store
- No silent fallback converts rejected artifacts into memory
- Degradation that prefers empty/sparse memory UI over inventing records
- Retry, idempotency, and producer deduplication details belong in admission/repository specifications and **MUST NOT** contradict ADR-0010 matrices

Exact UX copy and recovery UI are out of scope of this ADR (IA/UI redesign not authorized here).

---

## Testing gates

Before any L1 code is merged (only after this ADR is Accepted and required specs exist):

- Contract tests for MemoryRecord `schemaVersion: "1.0.0"` validation
- Admission rejection tests (read-create, auto-save Ask, unlisted Calendar classes)
- Lifecycle tests (supersede, delete/`deletedAt`)
- Ownership tests (People state not copied; Search index not SoR)
- Regression: ADR-0007 conversation remains stateless (no conversation→CMG writes)

---

## Deployment gates

- No L1 runtime may deploy until this ADR is **Accepted**.
- No public memory HTTP API may deploy under this ADR.
- No L2 service may deploy under this ADR.
- Client L1 deployment, if ever authorized, remains gated by the repository contract, admission pipeline spec, and Product Owner release decision beyond this ADR’s architectural acceptance.

---

## Out of Scope

This ADR (even if Accepted) does **not** authorize:

- L2 backend or CMG service
- Public memory API
- Semantic / vector search
- Implicit AI memory
- Read-triggered memory creation
- Ask auto-save
- Live conversation memory
- Julia memory production
- Vault as canonical owner
- Timeline / Search / Knowledge as canonical owners
- IA / UI redesign
- Bulk migration from legacy localStorage “memory-like” keys
- Cloud sync / cross-device persistence
- Provider-specific intelligence implementation
- Freezing MemoryType / MemoryDomain closed enums in code contrary to registry governance

---

## Open Questions

Blocking for L1 coding where noted (Open Questions do not reopen ADR-0010 L0 semantics):

- Physical client persistence technology (implementation-spec decision)
- Exact module path / package layout for L1
- Offline `accountUserId` behavior (ADR-0010 Open Question)
- Retention durations and visibility semantics (ADR-0010 Open Question)
- Legal erasure procedure (ADR-0010 Open Question)
- Product Owner release / MASTER_STATUS workstream registration required before merge beyond architectural Acceptance (Acceptance alone does not authorize coding; see Testing and Deployment gates)

---

## Consequences

### Accepted (architectural boundary)

- L1 client-runtime boundary is ratified under ADR-0010 invariants
- L2, semantic search, and conversation memory remain explicitly gated
- Producer specs remain mandatory before wiring Ask/Calendar/etc.
- **No CMG L1 runtime, API, UI, migration, Search engine, or producer integration is started or unblocked by this Acceptance alone**

### Costs / remaining gates

- L1 coding remains blocked until approved repository contract and admission pipeline specification
- Storage technology still unresolved
- Vault Hub / Timeline IA still require separate decisions

---

## Alternatives Considered

| Alternative | Why not adopted in this draft |
|-------------|-------------------------------|
| Treat ADR-0010 Acceptance as L1 authorization | Contradicts ADR-0010 ratification record (“Implementation authorization: Not granted”) |
| Authorize L1 + L2 together | Premature; L2 requires a separate ADR per ADR-0010 |
| Select IndexedDB / localStorage / SQLite in this ADR | No repository mandate; technology is an implementation-spec decision |
| Authorize Ask auto-save or conversation memory | Violates ADR-0010 / ADR-0007 |

---

## References

- [ADR-0010-Canonical-Memory-Graph-and-Personal-Intelligence-Memory-Boundaries.md](./ADR-0010-Canonical-Memory-Graph-and-Personal-Intelligence-Memory-Boundaries.md)
- [CMG-FINAL-LOCK-REPORT.md](../architecture/CMG-FINAL-LOCK-REPORT.md)
- [CMG-SPECIFICATION-DEPENDENCY-MAP.md](../architecture/CMG-SPECIFICATION-DEPENDENCY-MAP.md)
- [CMG-MEMORY-TYPE-DOMAIN-REGISTRY.md](../architecture/CMG-MEMORY-TYPE-DOMAIN-REGISTRY.md)
- [CMG-RELATIONSHIP-EDGE-TAXONOMY.md](../architecture/CMG-RELATIONSHIP-EDGE-TAXONOMY.md)
- [ADR-0007-Conversation-API-Contract-v1.md](./ADR-0007-Conversation-API-Contract-v1.md)
- [ADR-0009-Shared-Frontend-Conversation-and-Decision-Context-Boundaries.md](./ADR-0009-Shared-Frontend-Conversation-and-Decision-Context-Boundaries.md)
- [ADR_INDEX.md](../governance/ADR_INDEX.md)

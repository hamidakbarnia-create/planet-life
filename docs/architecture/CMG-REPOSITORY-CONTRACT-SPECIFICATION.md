# CMG Repository Contract Specification

| Field | Value |
|-------|-------|
| **Document** | CMG L1 Repository / Persistence Contract |
| **Path** | `docs/architecture/CMG-REPOSITORY-CONTRACT-SPECIFICATION.md` |
| **Status** | Accepted |
| **Version** | 0.3.1 |
| **Date** | 2026-07-24 (Accepted) |
| **Phase** | P3 — Executable Specifications |
| **Authority** | Derives from ADR-0010 (Accepted) and ADR-0011 (Accepted) |
| **Coding authorization** | **Not granted.** Acceptance of this document does **not** authorize implementation or coding. |
| **Companion gate** | CMG Admission Pipeline Specification — **Missing** (required coding gate; not yet authored) |
| **Planning map** | [CMG-SPECIFICATION-DEPENDENCY-MAP.md](./CMG-SPECIFICATION-DEPENDENCY-MAP.md) |

---

## 1. Title and document metadata

This document is the **CMG Repository Contract Specification**. It defines the deterministic, technology-neutral behavioural contract for the Canonical Memory Graph (CMG) **L1 canonical admitted store** and its relationship to **derived indexes**.

---

## 2. Status

**Accepted** (2026-07-24) at version **0.3.1**.

Acceptance of this Repository Contract Specification satisfies one ADR-0011 executable-spec gate (repository behavioural contract). Coding remains **blocked**. Remaining gates are listed in §37.3 (Admission Pipeline Specification must be accepted; required registries/lifecycle authorities must be accepted where applicable; explicit implementation approval must be issued).

| Classification | Content in this document |
|----------------|--------------------------|
| **Accepted (binding inputs)** | ADR-0010, ADR-0011, ADR-0007, ADR-0009 |
| **Accepted (this document)** | Repository behavioural contract v0.3.1 |
| **Proposed (non-authority)** | Memory type/domain registry; relationship edge taxonomy |
| **Missing (coding gate)** | Admission Pipeline Specification |
| **Open Question** | §39 |
| **Future Work** | Non-goals; gated lifecycle/erasure; concurrency |

---

## 3. Purpose

Define externally observable repository behaviour so that:

1. Canonical admitted `MemoryRecord` persistence is deterministic and testable.
2. Derived indexes cannot become systems of record.
3. Repository writes cannot bypass Admission.
4. Lifecycle, supersession, soft deletion, validation, and failure behaviour are fail-closed and technology-neutral.
5. The ADR-0011 coding gate is reviewable without selecting storage technology or inventing APIs.
6. Specified operations are not confused with immediately implementable operations.

---

## 4. Scope

### 4.1 In scope

- Canonical store responsibilities for **admitted** `MemoryRecord` values under `schemaVersion: "1.0.0"`.
- Read, create, supersede, soft-delete (lifecycle), validation, and derived-index rebuild contracts.
- Separation of canonical store from derived lexical/filter indexes.
- Error model, logical-equivalence idempotency, consistency, fail-closed rules.
- Repository-level admission-boundary enforcement (reject writes without authorized Admission).
- Distinction between **full specified contract** and **initial implementable slice** (§37).

### 4.2 Out of scope (non-authorization)

This specification does **not** authorize or define:

- Storage technology selection (any engine, file format, or client persistence API).
- Database schemas, tables, ORMs, or classes.
- Public HTTP / Memory APIs or L2 backend services.
- Cloud sync, cross-device sync, or multi-device conflict resolution.
- Semantic search, vector search, embeddings, or RAG.
- Admission producer policy (allowlists, Ask explicit-save UX).
- Vault / Timeline / Knowledge / Search product runtimes or IA/UI.
- Conversation memory, Julia memory production, Ask auto-save.
- Bulk migration from legacy local “memory-like” keys.
- Encryption algorithms, key management, or legal erasure procedures (see soft-delete vs erasure, §21.4).
- Search/query API beyond index rebuild semantics.

---

## 5. Normative language

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are to be interpreted as described in RFC 2119.

- Normative requirements bind any future conforming L1 repository implementation **only after** coding is authorized.
- Notes and Open Questions are non-normative unless explicitly marked otherwise.
- Requirements that depend on a missing specification are marked **gated** and are **not** implementation-ready.

---

## 6. Normative references

| Reference | Status | Role |
|-----------|--------|------|
| [ADR-0010](../adr/ADR-0010-Canonical-Memory-Graph-and-Personal-Intelligence-Memory-Boundaries.md) | Accepted | L0 ownership, admission principles, Canonical MemoryRecord Contract, lifecycle invariants, Search v1 field list |
| [ADR-0011](../adr/ADR-0011-CMG-L1-Client-Runtime-Authorization.md) | Accepted | L1 architectural boundary; coding gate; index/canonical separation; fail-closed requirements |
| [ADR-0007](../adr/ADR-0007-Conversation-API-Contract-v1.md) | LOCKED | Conversation remains stateless; conversation→CMG writes unauthorized |
| [ADR-0009](../adr/ADR-0009-Shared-Frontend-Conversation-and-Decision-Context-Boundaries.md) | Accepted | Frontend ownership boundaries |
| [CMG-MEMORY-TYPE-DOMAIN-REGISTRY.md](./CMG-MEMORY-TYPE-DOMAIN-REGISTRY.md) | Proposed | Non-accepted registry process; **not** full normative taxonomy authority |
| [CMG-RELATIONSHIP-EDGE-TAXONOMY.md](./CMG-RELATIONSHIP-EDGE-TAXONOMY.md) | Proposed | Non-accepted edge taxonomy process; **not** full normative taxonomy authority |
| [CMG-SPECIFICATION-DEPENDENCY-MAP.md](./CMG-SPECIFICATION-DEPENDENCY-MAP.md) | Planning | Sequencing; not an authorization instrument |
| [CMG-FINAL-LOCK-REPORT.md](./CMG-FINAL-LOCK-REPORT.md) | Companion | L0 lock companion |

**Missing companion (required coding gate):** CMG Admission Pipeline Specification — not yet authored.

---

## 7. Definitions

| Term | Definition |
|------|------------|
| **MemoryRecord** | Canonical admitted memory document per ADR-0010 Canonical MemoryRecord Contract with `schemaVersion: "1.0.0"`. |
| **Canonical store** | Authoritative persistence of admitted MemoryRecords for a single `accountUserId` in L1 client context. |
| **Derived index** | Disposable, rebuildable lexical/filter structure over admitted records; not a system of record. |
| **Admission** | Governed process that decides whether a candidate may become a MemoryRecord. Defined by the future Admission Pipeline Specification. |
| **Admission proof** | Evidence that a write was produced by an authorized successful Admission decision for that candidate. **Presence** is required by this contract; **schema and verification algorithm** are undefined until the Admission Pipeline Specification is accepted. |
| **Logical equivalence** | Field-wise equality of committed ADR-0010 canonical values (§25); not serialization-, encoding-, or property-order-based. |
| **Repository** | Component that implements this contract: canonical store operations and optional derived-index maintenance. |
| **Caller** | Admission process or other authorized internal surface that invokes repository operations. UI/read paths are not writers. |
| **Soft deletion** | Lifecycle transition to `status = deleted` with `deletedAt` set; record may remain in store for authorized lifecycle/audit reads. |
| **Fail-closed** | On validation or missing/unauthorized Admission, reject; produce no canonical mutation; do not invent fallbacks. |
| **Initial implementable slice** | Subset of operations that may be planned for a first implementation **after** gates clear (§37). Specifying an operation does not authorize coding it. |
| **L1** | Client-side CMG runtime role per ADR-0011 — not an independent SoR and not L2. |

---

## 8. Repository responsibilities

The Repository **MUST**:

1. Persist only **admitted** MemoryRecords conforming to ADR-0010.
2. Enforce structural, schema, and lifecycle-consistency validation that is binding under accepted ADRs (§15, §16).
3. Enforce admission-boundary presence rules (§24).
4. Provide deterministic read behaviour scoped by `accountUserId`.
5. Keep derived indexes separated from the canonical store (§28–§29).
6. Fail closed on invalid writes (§32).

The Repository **MUST NOT**:

1. Admit candidates (Admission owns admit/reject decisions).
2. Create records from reads, searches, projections, or UI views.
3. Copy People native relationship state, Profile entity state, or other source-module SoR payloads into MemoryRecords (references only).
4. Become a public HTTP API or L2 service.
5. Provide semantic/vector indexing.
6. Auto-save Ask, conversation, or Julia outputs.
7. Treat Vault, Timeline, Search, or Knowledge as canonical owners.
8. Treat Proposed registries as accepted full taxonomy authority (§16.3).

**Capability vs slice:** The full contract specifies create, supersede, soft-delete, and index behaviours. Which of those belong to the **initial implementable slice** is defined in §37. Specifying soft-delete does **not** authorize implementing `MarkDeleted` before lifecycle authority exists.

---

## 9. Canonical-store rules

1. The canonical store is the **only** SoR for admitted MemoryRecords under L1.
2. Every persisted MemoryRecord **MUST** include `admission` metadata as required by ADR-0010.
3. `accountUserId`, `subjectRefs`, and `createdBy` **MUST NOT** be collapsed into a single identifier (ADR-0010).
4. Binary content **MUST NOT** be embedded; only `AttachmentRef` / `payloadRef` metadata may be stored.
5. Graph edges live in `relationships` on MemoryRecords; they **MUST NOT** encode People native relationship SoR.
6. Telemetry and recent-activity streams **MUST NOT** be stored as MemoryRecords via this repository.

---

## 10. Repository interface overview

This section defines **logical operations** and their observable effects. It does **not** define programming-language signatures, classes, packages, or transport.

| Operation | Kind | Slice (§37) |
|-----------|------|-------------|
| `GetById` | Read | Initial |
| `List` | Read | Initial |
| `Exists` | Read | Initial |
| `ValidateRecord` | Pure | Initial |
| `PersistAdmitted` | Write | Initial **after** Admission proof contract accepted |
| `Supersede` | Write | Initial **after** Admission proof contract accepted |
| `RebuildDerivedIndex` | Index | Initial |
| `MarkDeleted` | Write | **Gated** — lifecycle authority required |

### 10.1 Interface invariants

1. Every account-bound operation **MUST** be scoped by `accountUserId`.
2. Read operations and `ValidateRecord` **MUST NOT** create, update, or delete MemoryRecords.
3. `PersistAdmitted` and `Supersede` **MUST** enforce Admission proof presence per §24.
4. The Repository **MUST NOT** expose a “save arbitrary object” operation that bypasses Admission.
5. Cross-account access for `GetById`, `Exists`, `List`, `Supersede`, `MarkDeleted`, and account-bound `ValidateRecord` **MUST** behave as if the foreign record does not exist (**NotFound** / empty), without revealing existence via a distinct Forbidden signal (§11).
6. Corrections (records with `supersedesRecordId`) **MUST** use `Supersede` only; `PersistAdmitted` **MUST NOT** create them (§19, §20, §23).

---

## 11. Account isolation

1. Partition key: `accountUserId`.
2. Record key: (`accountUserId`, `id`).
3. For a caller operating as account A, any reference to a record owned by account B **MUST** yield **NotFound** (or empty list), not an existence-revealing Forbidden.
4. This isolation rule applies consistently to: `GetById`, `Exists`, `List`, `PersistAdmitted` (id uniqueness is per-account), `Supersede`, `MarkDeleted`, and account-bound `ValidateRecord`.

---

## 12. Operation: `GetById`

### 12.1 Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| `accountUserId` | Yes | Account scope |
| `id` | Yes | Record id |
| `includeDeleted` | No | Default `false`. When `true`, an in-scope soft-deleted record **MUST** be returned (subject to §12.3 schema rules). |

### 12.2 Preconditions

- None beyond valid account/id strings.

### 12.3 Observable result

1. If no record exists for (`accountUserId`, `id`), or the id belongs to another account: **NotFound**.
2. If an in-scope record exists and its committed `schemaVersion` is not `"1.0.0"`: **UnsupportedSchemaVersion** (§17). Do not invent a migration or partial decode.
3. If the record exists and `status = deleted` and `includeDeleted` is false/absent: **NotFound**.
4. If the record exists and `status = deleted` and `includeDeleted` is true: return the soft-deleted MemoryRecord.
5. If the record exists and `status = superseded`: return that superseded MemoryRecord (direct id lookup is allowed; product lists exclude superseded by default — §13).
6. If the record exists and `status` is `active`, `disputed`, or `archived`: return the MemoryRecord.
7. On success, the returned record **MUST** be **logically equivalent** (§25) to the last successfully committed canonical value for that key. No silent field synthesis.

### 12.4 Errors

`NotFound` | `UnsupportedSchemaVersion` | `InternalError`

### 12.5 Side effects / atomicity / idempotency / lifecycle / auth

| Aspect | Rule |
|--------|------|
| Side effects | None |
| Atomicity | Single read; no mutation |
| Idempotency | Trivial (no mutation) |
| Lifecycle effects | None |
| Authorization dependency | Account scope only |
| Slice | Initial |

---

## 13. Operation: `List`

### 13.1 Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| `accountUserId` | Yes | Account scope |
| `filter` | No | See §13.2 |
| `sort` | No | Default: `createdAt` descending, then `id` ascending |
| `continuation` | No | Opaque continuation token from a prior `List` on the same account+filter+sort |
| `includeDeleted` | No | Default `false` |
| `includeSuperseded` | No | Default `false` |

### 13.2 Supported filters (contract level)

MAY be empty. When present, supported dimensions are:

`status` (explicit set), `type`, `domain`, `tags` (contains-any), `source.module`, `createdAt` / `occurredAt` bounds, `subjectRefs` match (subjectType + subjectId).

Unsupported filter fields **MUST** yield `ValidationFailed` (not silent ignore).

### 13.3 Visibility rules (deterministic)

`List` answers **normal product-visible records** (contrast `Exists`, §14). Status eligibility **MUST** be computed with this precedence:

1. Restrict to `accountUserId`, then apply all **non-status** filters (`type`, `domain`, `tags`, `source.module`, time bounds, `subjectRefs`, etc.).
2. If an explicit `status` filter set is supplied, that set is the **only** candidate status set (it takes precedence over `includeDeleted` / `includeSuperseded`).
3. If no explicit `status` filter is supplied:
   - include `active`, and include `disputed` / `archived` when present;
   - include `deleted` **only** when `includeDeleted=true` (default `false` ⇒ `deleted` **MUST** be excluded);
   - include `superseded` **only** when `includeSuperseded=true` (default `false` ⇒ `superseded` **MUST** be excluded).
4. Every record that becomes eligible under steps 1–3 **MUST** be included in the result stream (subject only to pagination). No eligible record may be arbitrarily omitted.

### 13.4 Sort and continuation

1. Sort **MUST** be deterministic. Default: `createdAt` descending, tie-break `id` ascending.
2. `continuation` is an opaque token. A subsequent `List` with the same account, filter, and sort **MUST** return the next disjoint page with stable ordering; completed iteration **MUST NOT** omit or duplicate records that were unchanged during the iteration.
3. If the canonical store mutates during iteration, continuation semantics **SHOULD** remain best-effort stable; exact concurrent-mutation behaviour for `List` is an Open Question (OQ-R9) and does not authorize multi-writer implementations.

### 13.5 Observable result

- Success: ordered page of MemoryRecords + optional next `continuation`.
- Empty page is valid.
- If any otherwise-eligible in-scope record has committed `schemaVersion` ≠ `"1.0.0"`, the operation **MUST** fail with `UnsupportedSchemaVersion` rather than silently omit or partially decode that record (§17).

### 13.6 Errors

`ValidationFailed` | `UnsupportedSchemaVersion` | `InternalError`

### 13.7 Side effects / atomicity / idempotency / lifecycle / auth

| Aspect | Rule |
|--------|------|
| Side effects | None (reads only). Derived indexes **MAY** accelerate `List` but **MUST NOT** change membership of the canonical set. |
| Atomicity | No mutation |
| Idempotency | Trivial for identical inputs when store unchanged |
| Lifecycle effects | None |
| Authorization dependency | Account scope only |
| Slice | Initial |

---

## 14. Operation: `Exists`

`Exists` answers whether an **identity is occupied** within canonical storage for the account. `List` answers **normal product-visible** records (§13). Therefore `Exists` defaults to `includeSuperseded=true`: unless the caller explicitly sets `includeSuperseded=false`, a matching superseded identity **MUST** count as existing. `List` excludes superseded records by default.

### 14.1 Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| `accountUserId` | Yes | Account scope |
| `id` | Yes | Record id |
| `includeDeleted` | No | Default `false` |
| `includeSuperseded` | No | Default `true` for Exists (id occupation includes superseded priors) |

### 14.2 Preconditions

None beyond valid strings.

### 14.3 Observable result

1. Cross-account or missing id: **false** (not an existence-revealing error).
2. Soft-deleted record: **false** if `includeDeleted=false`; **true** if `includeDeleted=true`.
3. Superseded record: **true** if `includeSuperseded=true` (default); **false** if `includeSuperseded=false`.
4. Otherwise **true** when a matching non-filtered-out record occupies the id.
5. Unsupported `schemaVersion`: `Exists` **MUST** return **true** for an in-scope occupied id based on identity/account visibility alone, without requiring content decode. Content-level schema failure is reported by `GetById` / `List` (§17).

### 14.4 Errors

`ValidationFailed` (malformed inputs) | `InternalError`

### 14.5 Side effects / atomicity / idempotency / lifecycle / auth

| Aspect | Rule |
|--------|------|
| Side effects | None — side-effect-free |
| Atomicity | No mutation |
| Idempotency | Trivially satisfied (no mutation) |
| Lifecycle effects | None |
| Authorization dependency | Account scope only |
| Slice | Initial |

---

## 15. Operation: `ValidateRecord`

### 15.1 Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| `accountUserId` | Yes | Account context for identity consistency checks |
| `record` | Yes | Candidate MemoryRecord |
| `taxonomyMode` | No | `structural_only` (default) \| `full_registry` (**gated**) |

### 15.2 Validation modes

**Structural mode (`structural_only`) — normative now:**

- Enforce ADR-0010 field presence/types, `schemaVersion` policy (§17), lifecycle consistency (`deleted`/`deletedAt`), confidence range, reference-only ownership safety (§16).
- Enforce accepted ADR prohibitions relevant to persistence (no embedding People/Profile bodies; no inventing conversation/Julia memory via repository acceptance of unauthorized admits — see §16.4).
- `ValidateRecord` **MAY** structurally evaluate a candidate that contains `supersedesRecordId`. That evaluation does **not** authorize `PersistAdmitted` to create a successor (§19).

**Full registry mode (`full_registry`) — gated:**

- Membership checks against accepted/operational type, domain, and edge registries.
- **MUST NOT** be required or claimed until those registries are accepted and operationally authorized.
- Until then, requesting `full_registry` **MUST** return `PreconditionFailed` (taxonomy authority unavailable).

### 15.3 Observable result

1. If `record.schemaVersion` is not exactly `"1.0.0"`: **UnsupportedSchemaVersion** (§17). This outcome **MUST NOT** also be represented as `Invalid` / `ValidationFailed`.
2. If `record.accountUserId` ≠ supplied `accountUserId`: **Invalid** with `ValidationFailed` reason `AccountScopeMismatch`. **MUST NOT** return record-existence metadata, persist anything, or rewrite `accountUserId`.
3. Otherwise (supported schema only): `Valid`, or `Invalid` with `ValidationFailed` detail categories limited to structural, account, field, lifecycle, ownership, taxonomy-gated, or other applicable rules under `"1.0.0"`. Unsupported schemaVersion **MUST NOT** appear as a `ValidationFailed` detail.

### 15.4 Errors

`UnsupportedSchemaVersion` | `ValidationFailed` | `PreconditionFailed` (taxonomy mode unavailable) | `InternalError`

### 15.5 Side effects / atomicity / idempotency / lifecycle / auth

| Aspect | Rule |
|--------|------|
| Side effects | **MUST NOT** persist anything |
| Atomicity | Pure evaluation |
| Idempotency | Trivial |
| Lifecycle effects | None |
| Authorization dependency | Structural mode: none beyond contract; full_registry: registry acceptance |
| Slice | Initial (`structural_only`) |

---

## 16. Validation rules (shared)

Before any successful write, the Repository **MUST** apply structural validation. Taxonomy membership enforcement is gated (§15.2, §16.3).

### 16.1 Schema and structure

1. `schemaVersion` write/read policy is defined in §17 (only `"1.0.0"`; unknown fields rejected on write).
2. Required ADR-0010 fields **MUST** be present with correct logical types.
3. Arrays `subjectRefs`, `tags`, `relationships`, `references`, `attachments` **MUST** be present (MAY be empty where ADR-0010 allows).

### 16.2 Lifecycle consistency

1. If `status = deleted`, `deletedAt` **MUST** be set.
2. If `status ≠ deleted`, `deletedAt` **MUST NOT** be set.
3. Correcting candidates (those with `supersedesRecordId` present/non-null) are validated for supersession **only** in `ValidateRecord` and `Supersede` (§15, §20). Shared inspection of `supersedesRecordId` **MUST NOT** imply that `PersistAdmitted` may create a successor independently (§19).
4. For `Supersede`, `supersedesRecordId` **MUST** be set and **MUST** reference an existing prior record in the same `accountUserId` with supersedable status (§20).
5. `provenance.confidence`, if present, **MUST** be in inclusive range `0..1`.

### 16.3 Interim registry rule (Proposed registries)

While Memory Type/Domain Registry and Relationship Edge Taxonomy remain **Proposed**:

1. Repository **MUST** enforce structural constraints binding through accepted ADRs (§16.1–§16.2, §16.4).
2. Repository **MUST NOT** claim full taxonomy-membership enforcement.
3. Proposed registries **MAY** inform non-blocking diagnostics only; they **MUST NOT** be treated as accepted normative authority.
4. Repository **MUST NOT** accept values that violate **explicit accepted ADR prohibitions** (e.g. treating Conversation/AIMemory/Julia production as authorized memory capabilities — ADR-0010 / ADR-0007).
5. Typed write implementation that depends on accepted active-registry membership remains **gated** until registry acceptance and operational authorization (OQ-R3).

After a registry is accepted and operationally authorized, write-time rejection of unknown/non-active identifiers **MUST** be enforced as defined by that registry’s acceptance terms (future normative update to this contract or companion).

### 16.4 Ownership / producer safety (Repository-enforceable)

1. MemoryRecords **MUST NOT** embed People/Profile entity bodies.
2. `subjectRefs` and edge `toRef` values are references only.
3. The Repository **MUST NOT** treat `source.module = "julia"` (or conversation-derived candidates) as authorizing Julia or conversation memory production. Under ADR-0010 and ADR-0007, such production remains unauthorized. The future Admission Pipeline Specification will need to reject those admits; until it exists, Repository write paths that would persist them without authorized Admission **MUST** fail closed (§24).

---

## 17. SchemaVersion handling

1. `"1.0.0"` is the **only** accepted `schemaVersion` under this contract (ADR-0010; ADR-0011).
2. Writes with any other `schemaVersion` **MUST** fail with `UnsupportedSchemaVersion`.
3. Unknown fields under `"1.0.0"` **MUST** be rejected on write (`ValidationFailed`).
4. If a canonical record with unsupported `schemaVersion` is encountered on read or index rebuild:
   - `GetById` **MUST** return `UnsupportedSchemaVersion` for an in-scope record;
   - `List` **MUST** fail with `UnsupportedSchemaVersion` rather than silently omit or partially decode such a record;
   - `Exists` **MUST** follow §14.3 (identity occupation may be true without content decode);
   - `ValidateRecord` **MUST** return `UnsupportedSchemaVersion` (not `ValidationFailed`) for a candidate whose `schemaVersion` is not `"1.0.0"` (§15.3);
   - `RebuildDerivedIndex` **MUST** fail with `UnsupportedSchemaVersion` per §22.3.
5. Migration between schema versions is **out of scope** and **not authorized**.
6. Future schema versions require a future accepted ADR or explicit contract revision.
7. This section does **not** create a migration policy.

---

## 18. Identity and identifier rules

1. `id` **MUST** be a non-empty string.
2. `id` uniqueness **MUST** hold within `accountUserId`.
3. Who mints `id` (Admission vs Repository) and id format are **Open Question OQ-R2**, to be resolved by the Admission Pipeline Specification before create implementation.
4. Offline / anonymous `accountUserId` mapping remains an ADR-0010 Open Question; this contract **MUST NOT** invent a conflicting model (OQ-R6).

---

## 19. Operation: `PersistAdmitted`

**Implementation readiness:** Specified but **not implementation-ready** until Admission proof contract exists (§24) and this Repository Contract is accepted (gates §37.3).

### 19.1 Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| `accountUserId` | Yes | Must equal `record.accountUserId` |
| `record` | Yes | Admitted MemoryRecord candidate (**create only**) |
| `admissionProof` | Yes | Proof supplied by authorized Admission process (schema TBD; §24) |

### 19.2 Preconditions

1. Admission proof presence per §24.
2. If input `accountUserId` ≠ `record.accountUserId`: reject with `ValidationFailed` reason `AccountScopeMismatch`. **MUST NOT** persist, rewrite `accountUserId`, return existence-revealing metadata, or use Forbidden.
3. `record.supersedesRecordId` **MUST NOT** be present or non-null. A correcting candidate **MUST** be rejected with `PreconditionFailed` reason `SupersedeOperationRequired` and **MUST NOT** be persisted. Corrections are processed only through `Supersede` (§20).
4. Structural validation passes (§16) in `structural_only` mode; `full_registry` rules apply only when taxonomy authority exists. Schema policy per §17 (`schemaVersion` ≠ `"1.0.0"` ⇒ `UnsupportedSchemaVersion`, not `ValidationFailed`).
5. No existing record with same (`accountUserId`, `id`), **or** idempotent replay conditions (§25) hold.
6. `record.status` **MUST** be `active` for initial create under this contract; `deletedAt` **MUST NOT** be set. (Any future alternate initial status requires an accepted Admission Pipeline / contract revision.)

### 19.3 Observable result

- Success: canonical store contains the new MemoryRecord; acknowledgment of create (or idempotent replay).
- Failure: no canonical mutation.
- No conforming path may create a successor while leaving a referenced prior record active; `PersistAdmitted` never performs supersession effects.

### 19.4 Errors

`AdmissionRequired` | `AdmissionInvalid` (when proof contract exists and verification fails) | `PreconditionFailed` (`SupersedeOperationRequired`) | `ValidationFailed` (`AccountScopeMismatch` and other `"1.0.0"` structural failures) | `UnsupportedSchemaVersion` | `Conflict` | `InternalError`

Until the proof contract exists, implementations **MUST NOT** be built; review treats `AdmissionInvalid` verification details as gated.

### 19.5 Side effects / atomicity / idempotency / lifecycle / auth

| Aspect | Rule |
|--------|------|
| Side effects | Canonical create only; derived index update **MUST NOT** be required for success |
| Atomicity | Full record committed or no change (§26) |
| Idempotency | Same account+id + logically equivalent record ⇒ success without duplicate (§25) |
| Lifecycle effects | New `active` record |
| Authorization dependency | Admission proof (Pipeline Spec) |
| Slice | Initial **after** Admission proof contract accepted |

---

## 20. Operation: `Supersede`

**Implementation readiness:** Specified but **not implementation-ready** until Admission proof contract exists (§24). Only `Supersede` may atomically create a correction successor.

### 20.1 Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| `accountUserId` | Yes | Account scope |
| `newRecord` | Yes | Correcting MemoryRecord with `supersedesRecordId` present/non-null |
| `admissionProof` | Yes | Proof for **newRecord** only (§24) |
| `priorId` | Yes | Must equal `newRecord.supersedesRecordId` |

### 20.2 Preconditions

1. Admission proof presence for `newRecord` per §24.
2. `newRecord` structurally valid (§16); schema policy (§17); `newRecord.id` ≠ `priorId`; `supersedesRecordId` present/non-null; `newRecord.status` **MUST** be `active`.
3. Prior exists in same account; cross-account ⇒ **NotFound** (no existence leak).
4. Prior `status` ∈ {`active`, `disputed`, `archived`} (not `deleted`; not already `superseded` unless a future rule authorizes chains — currently **MUST** reject already-superseded priors with `PreconditionFailed`).
5. No existing record with `newRecord.id`, or idempotent replay applies.
6. `Supersede` **MUST** validate the correcting candidate and prior record **together** before any mutation becomes visible.

### 20.3 Linkage

1. Forward linkage: `newRecord.supersedesRecordId` **MUST** equal `priorId` (ADR-0010).
2. **No reverse link is required under this contract.** The prior record is not required to store a successor id.

### 20.4 Atomic observable effects

On success, **all** of the following become visible together, or **none** do:

1. Prior state validated as supersedable.
2. `newRecord` persisted as canonical.
3. Prior record `status` transitioned to `superseded`; prior `updatedAt` updated; prior content fields unchanged.
4. Forward supersession linkage present on the successor.
5. `GetById(newRecord.id)` returns the successor; `GetById(priorId)` returns the superseded prior (direct lookup).
6. Default `List` excludes the prior (superseded) and includes the successor if it matches filters (§13.3).

If any part fails: **no partial canonical mutation** may remain observable; prior remains in original state; replacement **MUST NOT** be visible. No conforming path may leave a successor visible while the prior remains active.

### 20.5 Errors

`AdmissionRequired` | `AdmissionInvalid` (gated detail) | `ValidationFailed` | `UnsupportedSchemaVersion` | `NotFound` | `PreconditionFailed` | `Conflict` | `InternalError`

### 20.6 Side effects / atomicity / idempotency / lifecycle / auth

| Aspect | Rule |
|--------|------|
| Side effects | Pair update on canonical store only; index lag allowed |
| Atomicity | Pair atomicity (§26) |
| Idempotency | Replay of identical successful supersede (same new id + logically equivalent newRecord + same prior outcome) ⇒ success without further mutation |
| Lifecycle effects | Prior → `superseded`; newly persisted successor **MUST** enter `status = active`. Any future alternative successor-entry state requires separately accepted lifecycle authority. This does **not** authorize disputed, archived, or other unresolved lifecycle transitions. |
| Authorization dependency | Admission proof for new record |
| Slice | Initial **after** Admission proof contract accepted |

---

## 21. Operation: `MarkDeleted` (soft delete)

**Slice:** **Gated.** Specified for future conformance; **MUST NOT** be implemented until an explicit lifecycle authorization rule exists (Admission Pipeline extension or Lifecycle Operations Specification) (OQ-R4).

### 21.1 Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| `accountUserId` | Yes | Account scope |
| `id` | Yes | Target record |
| `lifecycleAuthorization` | Yes | Proof/token that lifecycle authority approved soft-delete (schema TBD by lifecycle authority) |

### 21.2 Preconditions

1. Lifecycle authority defined and authorization present.
2. Target exists in account; else **NotFound**.
3. Allowed source states: `active`, `disputed`, `archived`, `superseded`.
4. If already `deleted`: idempotent success (see §21.5).

### 21.3 Observable result (when authorized)

1. `status = deleted`.
2. `deletedAt` set (ISO-8601 string; clock source OQ-R5).
3. `updatedAt` updated.
4. Content fields remain stored for authorized `GetById(..., includeDeleted=true)`.

### 21.4 Soft delete versus future erasure

This operation defines **only normal soft deletion**.

| Concern | Under this contract |
|---------|---------------------|
| Soft delete (`MarkDeleted`) | In scope when lifecycle-authorized |
| Legal erasure | **Outside** this contract |
| Irreversible purge | **Outside** this contract |
| Retention expiry destruction | **Outside** this contract |
| Privacy-mandated destruction | **Outside** this contract |

A future **accepted** ADR or specification **MAY** authorize erasure/purge/expiry destruction. Until such authority exists, those operations **MUST NOT** be implemented. This is **not** a permanent architectural ban on erasure; it is a scope boundary of **this** contract.

### 21.5 Repeated delete

If target is already `deleted` with `deletedAt` set: return success without changing fields other than allowing `updatedAt` to remain unchanged (**MUST NOT** clear `deletedAt` or revive the record).

### 21.6 Errors

| Condition | Error |
|-----------|-------|
| Cross-account or missing id | `NotFound` |
| In-scope target, but required lifecycle authority has not been accepted or operationally enabled | `PreconditionFailed` reason `LifecycleAuthorityUnavailable` |
| Malformed inputs / lifecycle-field inconsistency | `ValidationFailed` |
| Unexpected abort | `InternalError` |

`Forbidden` is **not** used for `MarkDeleted` under this contract. Lifecycle-authority unavailability has exactly one deterministic code: `PreconditionFailed` (`LifecycleAuthorityUnavailable`).

### 21.7 Side effects / atomicity / idempotency / lifecycle / auth

| Aspect | Rule |
|--------|------|
| Side effects | Soft-delete fields only |
| Atomicity | Single-record atomic |
| Idempotency | Repeated delete on already-deleted ⇒ success |
| Lifecycle effects | → `deleted` |
| Authorization dependency | Lifecycle authority (missing) |
| Slice | **Gated** |

---

## 22. Operation: `RebuildDerivedIndex`

### 22.1 Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| `accountUserId` | Yes | Rebuild scope is that account’s canonical store |
| `indexName` | No | Default: primary Search v1 lexical/filter index |

### 22.2 Preconditions

Canonical store reachable for account.

### 22.3 Observable result

1. Success: derived index for scope is discarded and rebuilt solely from canonical admitted MemoryRecords using ADR-0010 Search v1 fields: `title`, `summary`, `tags`, `type`, `domain`, `subjectRefs`, approved structured `references`.
2. If rebuild encounters any in-scope canonical record with unsupported `schemaVersion`: the operation **MUST** fail with `UnsupportedSchemaVersion`. It **MUST NOT** silently skip the record, **MUST NOT** partially publish a rebuilt index, and **MUST NOT** mutate, delete, rewrite, or migrate canonical records. Previously valid derived-index state remains governed by existing rebuild-failure rules (canonical store unchanged; prior index may remain usable or be marked degraded/unusable without canonical mutation).
3. Other failure: index may be marked unusable/degraded; **canonical store unchanged**.

### 22.4 Concurrent writes

If canonical writes occur during rebuild, completion **MUST** either (a) reflect a consistent snapshot then catch-up, or (b) fail and leave canonical untouched. Exact strategy is an Open Question (OQ-R9) for multi-writer; under single-writer assumption, rebuild **SHOULD** complete against post-write canonical state without mutating records.

### 22.5 Errors

`UnsupportedSchemaVersion` | `ValidationFailed` | `InternalError`

### 22.6 Side effects / atomicity / idempotency / lifecycle / auth

| Aspect | Rule |
|--------|------|
| Side effects | Derived index only; **MUST NOT** create/admit/modify MemoryRecords |
| Atomicity | Index swap/rebuild; canonical not in same unit |
| Idempotency | Multiple rebuilds ⇒ equivalent index content for unchanged canonical store |
| Lifecycle effects | None on canonical records |
| Authorization dependency | None beyond account scope |
| Slice | Initial |

Semantic/vector indexes **MUST NOT** be built.

---

## 23. Write contract summary

### 23.1 Allowed write families

| Family | Operation | Slice |
|--------|-----------|-------|
| Create | `PersistAdmitted` | After Admission proof contract |
| Correct | `Supersede` | After Admission proof contract |
| Soft-delete | `MarkDeleted` | Lifecycle-gated |

General-purpose patch/update of content fields **MUST NOT** exist. Corrections **MUST** use `Supersede` only. `PersistAdmitted` **MUST** reject candidates with `supersedesRecordId` (§19).

### 23.2 General write rules

1. Fail-closed: validation or missing Admission proof (§24) ⇒ no canonical mutation.
2. **MUST NOT** silently overwrite existing content fields.
3. Timestamps: `createdAt` immutable after create; `updatedAt` changes on supersede prior update and soft-delete.

---

## 24. Admission-boundary enforcement

This section is the **canonical** normative location for Admission proof rules. Other sections cite it rather than restating the full requirements.

1. `PersistAdmitted` and `Supersede` **MUST** require that `admissionProof` is **present** and was supplied by an **authorized Admission process**.
2. If proof is missing, the Repository **MUST** reject with `AdmissionRequired` and **MUST NOT** persist.
3. The Repository **MUST NOT** invent Admission proofs.
4. Proof schema, issuer identity, integrity mechanism, producer identity representation, provenance representation, decision status, replay semantics, verification algorithm, and any fingerprint/canonical-hash definition are **undefined** until the CMG Admission Pipeline Specification is **accepted**.
5. Therefore `PersistAdmitted` and `Supersede` are **specified but not implementation-ready** until that proof contract exists.
6. Reads, searches, projections, and index rebuilds **MUST NOT** constitute Admission and **MUST NOT** call `PersistAdmitted`.
7. The Repository **MUST NOT** provide a write path for Ask auto-save, conversation persistence, Julia production, or read-triggered creation (ADR-0010, ADR-0007, ADR-0011).

---

## 25. Logical equivalence (idempotency basis)

Logical equivalence means **field-wise equality of committed canonical values** for the same `accountUserId`. Under `schemaVersion "1.0.0"`:

1. `schemaVersion` equal;
2. `id` equal;
3. Each ADR-0010 canonical field compares equal to its counterpart **as committed** (no authorized comparison-time normalization);
4. Lifecycle state fields (`status`, `supersedesRecordId`, `deletedAt`) equal as committed;
5. `admission` and `provenance` fields equal as committed.

**MUST NOT** for equivalence under `"1.0.0"`:

- trimming;
- case folding;
- serialization / raw-byte comparison;
- property-order comparison;
- implicit array reordering;
- encoding-based comparison.

**Additional deterministic rules:**

- Absent field and explicit null are **not** equivalent unless a future accepted schema revision defines them as equivalent (ADR-0010 `"1.0.0"` does not).
- Array order for `tags`, `subjectRefs`, `relationships`, `references`, `attachments` **MUST** be significant as committed.
- Timestamp values compare according to the committed canonical string/value defined by the schema (no clock reinterpretation during comparison).
- OQ-R11 concerns only a possible **future** canonicalization policy and **MUST NOT** weaken current idempotency testing under these rules.

---

## 26. Transaction semantics (observable)

1. `PersistAdmitted` **MUST** be atomic: full MemoryRecord committed or no canonical change.
2. `Supersede` **MUST** be atomic across all observable canonical effects in §20.4. On failure, prior unchanged; replacement not visible.
3. `MarkDeleted` **MUST** be atomic for the single target (when authorized).
4. Derived index updates **MUST NOT** be required in the same atomic unit as canonical writes.
5. No storage/transaction engine is selected; only observable atomicity is required.
6. Multi-record batch APIs are not defined.

---

## 27. Idempotency summary

| Operation | Rule |
|-----------|------|
| `PersistAdmitted` | Same account+id + logically equivalent record ⇒ success, no duplicate |
| `PersistAdmitted` | Same id, not logically equivalent ⇒ `Conflict` |
| `Supersede` | Identical successful replay ⇒ success, no further mutation |
| `MarkDeleted` | Already deleted ⇒ success |
| `RebuildDerivedIndex` | Repeatable for unchanged store |
| Reads / `ValidateRecord` / `Exists` | Trivial |

Admission-level dedupe keys beyond `id` are owned by the future Admission Pipeline / producer specs (OQ-R1).

---

## 28. Index separation

1. Derived indexes are not canonical.
2. Index entries **MUST** be computable solely from admitted MemoryRecords and ADR-0010 Search v1 fields listed in §22.3.
3. Index corruption, lag, or deletion **MUST NOT** mutate, delete, or invalidate canonical records.
4. Semantic/vector indexes **MUST NOT** exist under this contract.
5. Projections (Timeline, Knowledge, Vault Hub) **MUST NOT** be implemented inside the Repository as SoR structures.
6. Search/query API beyond rebuild is out of scope (Future Work).

---

## 29. Consistency guarantees

1. Canonical store is authoritative for admitted MemoryRecords in L1.
2. After a successful write acknowledgment, a subsequent `GetById` for that account and id **MUST** observe that write (**read-your-writes** for the repository under this contract).
3. Indexes **MAY** lag the canonical store.
4. Cross-device / cross-client consistency is out of scope and not guaranteed.

---

## 30. Ordering and concurrency

1. This contract **assumes** a single logical writer per `accountUserId` repository unless a future concurrency specification says otherwise.
2. Concurrent multi-writer / multi-tab rules are Open Question OQ-R9; this document **MUST NOT** invent merge behaviour.
3. Supersede chains are ordered by successful commit; `List` tie-breaks are deterministic (§13.4).

---

## 31. Recovery and failure behaviour

1. Failed validation or missing Admission proof ⇒ abort with no canonical change.
2. Failed `Supersede` ⇒ no partial pair visible (§20.4).
3. Index failure after canonical commit ⇒ canonical intact; rebuild **MAY** be retried.
4. Repository **MUST NOT** convert rejected artifacts into MemoryRecords.
5. Empty/sparse store is valid; no placeholder memories.

---

## 32. Fail-closed requirements

The Repository **MUST** fail closed when:

1. Admission proof is missing for `PersistAdmitted` / `Supersede` (§24).
2. `schemaVersion` unsupported or unknown fields present under `"1.0.0"` (§17).
3. Structural validation fails (§16).
4. Full-registry mode requested without taxonomy authority (§15.2).
5. Supersede preconditions fail (§20).
6. Soft-delete lifecycle authority is undefined/unavailable (`PreconditionFailed` / `LifecycleAuthorityUnavailable`, §21.6).
7. `PersistAdmitted` is invoked with `supersedesRecordId` present (`PreconditionFailed` / `SupersedeOperationRequired`, §19).
8. Candidate or stored `schemaVersion` is unsupported where §17 requires `UnsupportedSchemaVersion` (including `ValidateRecord` and `RebuildDerivedIndex`).

---

## 33. Error model

| Code | When | Canonical effect |
|------|------|------------------|
| `NotFound` | Missing/foreign id | None |
| `ValidationFailed` | Supported-schema structural/filter/input/account failures (e.g. `AccountScopeMismatch`); **not** unsupported schemaVersion | None |
| `UnsupportedSchemaVersion` | Write, `ValidateRecord`, content-decoding read, or rebuild when `schemaVersion ≠ "1.0.0"` (§17) | None |
| `AdmissionRequired` | Missing proof (§24) | None |
| `AdmissionInvalid` | Proof present but fails verification (**only after** proof contract accepted) | None |
| `Conflict` | Id reuse with non-equivalent payload; supersede conflicts | None |
| `IdempotentReplay` | Optional success subtype | None (already applied) |
| `PreconditionFailed` | Prior not supersedable; taxonomy mode unavailable; `LifecycleAuthorityUnavailable`; `SupersedeOperationRequired` | None |
| `InternalError` | Unexpected failure with abort | None if commit aborted |

---

## 34. Observability and audit requirements

1. The Repository **SHOULD** emit structured audit events for successful creates, supersedes, soft-deletes, and rejected writes.
2. Audit events **MUST NOT** create MemoryRecords.
3. Audit retention/transport are outside this contract.
4. Correlation to Admission decision identifiers **SHOULD** be included when the future proof contract provides them.

---

## 35. Performance requirements

1. Correctness **MUST** take priority over performance.
2. Index lag **MUST NOT** violate canonical read-your-writes for `GetById`.
3. Quantitative SLOs are Future Work and **MUST NOT** be invented here.

---

## 36. Security and privacy considerations

1. All account-bound operations **MUST** enforce §11 isolation (**NotFound** / empty, not existence-revealing Forbidden).
2. Visibility/retention field presence follows ADR-0010; semantic enforcement is Open Question OQ-R7.
3. Encryption at rest, key custody, and export are not defined here and **MUST NOT** be claimed as guarantees of this contract alone.
4. Soft-delete versus future erasure: see §21.4 only (do not reinterpret here).
5. Cloud/cross-device sync **MUST NOT** be provided under ADR-0011.

---

## 37. Specified contract vs initial implementable slice

### 37.1 Specified contract operations (full behavioural surface)

All operations in §12–§22 are part of the **specified contract** for future conformance: `GetById`, `List`, `Exists`, `ValidateRecord`, `PersistAdmitted`, `Supersede`, `RebuildDerivedIndex`, `MarkDeleted`.

### 37.2 Initial implementable slice (planning only — not coding authorization)

When—and only when—all gates in §37.3 are cleared, an initial implementation **MAY** be planned to include:

| Included | Notes |
|----------|-------|
| `GetById`, `List`, `Exists` | Deterministic visibility rules |
| `ValidateRecord` (`structural_only`) | |
| `PersistAdmitted` | Only after Admission proof contract accepted |
| `Supersede` | Only after Admission proof contract accepted |
| `RebuildDerivedIndex` | Lexical/filter only |

| Excluded from initial slice (still specified) | Gate |
|-----------------------------------------------|------|
| `MarkDeleted` | Lifecycle authority (OQ-R4) |
| `disputed` / `archived` transitions | Lifecycle Operations Spec |
| Legal erasure / purge / retention destruction | Future ADR/spec (§21.4) |
| `ValidateRecord(full_registry)` | Registry acceptance |
| Multi-writer concurrency | OQ-R9 |
| Search/query API beyond rebuild | Future Search spec |

### 37.3 Implementation planning remains blocked until

This subsection is the **canonical** coding/planning gate list. Other sections point here.

1. This Repository Contract Specification is **accepted** — **satisfied** (Accepted 2026-07-24, v0.3.1);
2. The Admission Pipeline Specification is **accepted** — **not satisfied** (Missing);
3. Required dependent registries or lifecycle authorities are **accepted** where the chosen slice needs them — **not satisfied** while those documents remain Proposed/Missing;
4. **Explicit implementation approval** is issued — **not satisfied**.

Acceptance of this document **MUST NOT** be interpreted as authorizing coding. ADR-0011 implementation authorization remains **conditional and not yet active**.

---

## 38. Conformance requirements

A future implementation conforms only if, after coding is authorized and this specification is accepted:

1. It satisfies all **MUST** / **MUST NOT** statements applicable to the approved slice.
2. It provides tests for: schemaVersion rejection on write and unsupported-schema on read; unknown-field rejection; admission-less write rejection; `PersistAdmitted` rejection of `supersedesRecordId`; create; logical-equivalence idempotent replay (field-wise, absent≠null, array order significant); conflict on id reuse; supersede atomicity and visibility; soft-delete/`deletedAt` when lifecycle-authorized; read does not write; deleted default NotFound; deterministic List include flags; index rebuild does not mutate canonical data; cross-account NotFound isolation.
3. It does not introduce storage, API, sync, semantic search, or auto-save behaviour forbidden by ADR-0010 / ADR-0011.

---

## 39. Open questions

| ID | Question | Blocks | Resolution path |
|----|----------|--------|-----------------|
| OQ-R1 | Admission proof schema, issuer, integrity, producer/provenance/decision fields, verification, replay | Create/supersede impl | Admission Pipeline Specification |
| OQ-R2 | Who mints `id` and id format | Create impl | Admission Pipeline Specification |
| OQ-R3 | Operational acceptance of type/domain/edge registries for membership enforcement | Full typed membership checks | Registry acceptance + operational authorization |
| OQ-R4 | Lifecycle authorization for `MarkDeleted` / disputed / archived | Those transitions | Lifecycle Operations Spec or Admission Pipeline extension |
| OQ-R5 | Clock source for timestamps | Soft-delete/create timestamp determinism across devices | Small governed decision (not storage engine) |
| OQ-R6 | Offline / anonymous `accountUserId` | Offline L1 | Separate governed decision (ADR-0010 OQ) |
| OQ-R7 | Visibility/retention semantic enforcement | Product policy | Future privacy/retention spec |
| OQ-R8 | Legal erasure / purge / retention expiry destruction | Erase features | Future accepted ADR/spec (boundary §21.4) |
| OQ-R9 | Multi-tab / concurrent writer / List continuation under mutation | Multi-writer | Future concurrency spec or ADR |
| OQ-R10 | Search/query contract beyond index rebuild | Search product | Future Search v1 query spec |
| OQ-R11 | Possible future array-order canonicalization for logical equivalence | Only if producers emit unstable orders | Future contract revision; does **not** weaken §25 v1 rules |

Unresolved Open Questions **MUST NOT** be silently closed by implementers.

---

## 40. Non-goals

- Selecting IndexedDB, SQLite, localStorage, Postgres, filesystems, or any engine.
- Defining HTTP routes or public Memory APIs.
- Authorizing L2, semantic search, conversation memory, Julia production, Ask auto-save, or read-triggered creates.
- Elevating Proposed registries to accepted authority (§16.3).
- Authorizing implementation by virtue of this specification’s acceptance (gates §37.3 remain).
- Legal erasure / purge procedures (boundary §21.4).

---

## 41. Acceptance gate

### 41.1 Acceptance recorded

This specification is **Accepted** (2026-07-24) at version **0.3.1**.

1. One ADR-0011 coding gate (repository behavioural contract) is **satisfied**.
2. Coding remains **blocked** per the full gate list in §37.3.
3. Acceptance does **not** authorize coding, L2, public APIs, semantic search, sync, auto-save, Julia production, producer wiring, or soft-delete without lifecycle authority.

### 41.2 Acceptance does not mean

- A coding license; a storage-technology decision; a change to ADR-0010 L0 semantics; acceptance of the Admission Pipeline Specification; acceptance of Proposed registries; or activation of ADR-0011 implementation authorization.

### 41.3 Coding gate reminder

Per ADR-0011 and §37.3: **Implementation authorization remains inactive** until the Admission Pipeline Specification is accepted, required registries/lifecycle authorities are accepted where applicable, and explicit implementation approval is issued.

---

## Document control

| Version | Date | Notes |
|---------|------|-------|
| 0.1.0 | 2026-07-24 | Initial Proposed P3 draft |
| 0.2.0 | 2026-07-24 | Correction pass: determinism, dependency honesty, slice gating, soft-delete vs erasure |
| 0.3.0 | 2026-07-24 | Final correction: § refs, List include determinism, PersistAdmitted/Supersede boundary, MarkDeleted error, equivalence/read clarifications |
| 0.3.1 | 2026-07-24 | Surgical: ValidateRecord UnsupportedSchemaVersion sole outcome; rebuild/account/Exists/Supersede/List determinism |
| 0.3.1 | 2026-07-24 | **Accepted** by Product Owner ratification — coding still not authorized |

**End of specification.**

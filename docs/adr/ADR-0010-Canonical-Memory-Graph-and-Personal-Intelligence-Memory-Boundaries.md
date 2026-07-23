# ADR-0010: Canonical Memory Graph and Personal Intelligence Memory Boundaries

**Status:** Accepted
**Date:** 2026-07-23
**Decision makers:** METIORO Product Owner / Platform Architecture
**Normative language:** `MUST`, `MUST NOT`, `SHALL`, `MAY`
**Companion:** [CMG-FINAL-LOCK-REPORT.md](../architecture/CMG-FINAL-LOCK-REPORT.md)

---

## Lifecycle

ADR-0010 entered the repository as a Proposed architecture decision documenting Canonical Memory Graph (CMG) L0 ownership, admission, MemoryRecord contract, projection boundaries, and intelligence-memory boundaries.

Status advanced from Proposed to **Accepted** on **2026-07-23** by Product Owner ratification under the ADR_INDEX template lifecycle (`Proposed | Accepted | Deprecated | Superseded`). LOCKED is not required for this ownership ADR; LOCKED remains reserved for contract ADRs that the repository explicitly locks (for example ADR-0006 and ADR-0007).

This ADR ratifies **L0** domain boundaries only. Ratification is architectural. It does **not** authorise backend services, new public HTTP APIs, semantic search as a shipped capability, Vault IA/UI work, route changes, branding changes, CMG L1/L2 implementation, search engines, migration, or other implementation commits by itself.

**Owner ratification record**

| Field | Value |
|-------|-------|
| Ratifying authority | Product Owner |
| Ratification date | 2026-07-23 |
| Decisions accepted | L0 CMG naming, ownership, admission, Canonical MemoryRecord Contract (`schemaVersion: "1.0.0"`), projection/search boundaries, L1 role, L2 non-existence |
| Public API impact | None |
| L2 backend | Not approved; does not exist |
| Implementation | Not authorized by ratification alone |

---

## Context

Today’s Vault product surface is a **Premium Inner Chamber** (members gate + section routes such as sensuality, cycle, provider, with limited live readings). It is **not** a canonical memory system.

The longer-term product direction includes a **Personal Intelligence Database / Life Memory** experience. That experience must not be achieved by declaring Vault the system of record. Doing so would couple UI to persistence, pollute memory with reads and exploratory Ask results, and force rewrites when a real memory substrate appears.

Clear boundaries are required among:

- **Source modules** (Profile, People, Calendar, Ask, Pathfinder, World, Vault domain APIs)
- **Personal Intelligence Core (PIP)** for derived personal context
- **Projections / capabilities** (Timeline, Search, Knowledge views)
- **Future backend** memory persistence (explicitly not approved here)

**ADR-0007** remains in force: Sprint P1 live conversation is stateless with respect to Vault/memory integration. Conversation-to-memory admission is out of scope until a future ADR.

---

## Decision

On acceptance (2026-07-23), the following are locked:

1. The official name is **Canonical Memory Graph (CMG)**.
2. **L0** is the canonical domain model (ownership, admission, MemoryRecord, invariants).
3. **CMG** owns **admitted** memory records and graph edges only.
4. **Source modules** own their native entities; CMG holds references, not copied canonical state.
5. **People** owns canonical relationship entities/state; **CMG** owns only admitted relationship memory events and graph edges; CMG does not copy native relationship state.
6. **Vault** is a primary memory **UI** (and premium Inner Chamber surface), **not** the canonical database owner.
7. **PIP** owns Personal Context (derived).
8. **Julia** is not a canonical memory owner and is **not a producer under P1**. Any future Julia-to-CMG production or admission requires a separate governed decision. Julia is a **potential future producer, not authorized by this ADR**.
9. **Timeline**, **Search**, and **Knowledge** are projections/capabilities (Canonical owner = None).
10. **Ask** admits only via **explicit user save**; Ask output is not memory by default.
11. **Reads never create canonical memory.**
12. The **Canonical MemoryRecord Contract** below is normative (`accountUserId` + `subjectRefs` + `createdBy`; `schemaVersion: "1.0.0"`). This ADR does **not** freeze Memory type/domain registry taxonomy.
13. **Admission principles** and matrices below are normative.
14. **Correction/supersession** lifecycle is additive; no silent overwrite.
15. **L1** is the client aggregation / derived-index runtime implementing L0 — not an independent SoR.
16. **L2** backend CMG service does **not** exist and is **not** approved; a separate ADR is required.
17. The **Intelligence Layer** owns AI-summary **generation**. An AI summary has **no canonical persistence by default**. If admitted, **CMG** owns the resulting `MemoryRecord`.

### Architectural Principles

1. Canonical ownership is unique.
2. Projections never become canonical owners.
3. Source modules own their native entities.
4. CMG owns admitted memory only.
5. Every admission must be explainable.
6. Every derived record must preserve provenance.
7. Every correction is additive, never destructive.
8. Reads never create canonical memory.
9. Derived indexes are disposable and rebuildable.
10. No future capability may silently widen admission scope.

---

## Canonical Ownership Matrix

| Domain | Canonical owner | Nature | Producers | Consumers | Storage | Projection |
|--------|-----------------|--------|-----------|-----------|---------|------------|
| Memory | **CMG (L0)** | Admitted records + edges | Ask, Calendar, People, Profile, Vault, Pathfinder, World, PIP | Vault, Julia, Ask, Timeline, Search | CMG L1 admitted store | Vault Hub / UIs |
| Profile | **Profile module** | Native identity entity | User | Profile, PIP, Vault, APIs | Profile native store | `ProfileRef`; notable events may admit |
| People | **People module** | Native Person entity | People flows | People, Vault, Ask | People native store | `PersonRef` |
| Relationship entities | **People module** | Native relationship state | People flows | People, Ask, Vault | People native store | Relationship references |
| Relationship memory events | **CMG** | Admitted events and memory edges | People, Ask, Calendar | Vault, Ask, Timeline | MemoryRecord + edges | Timeline / Vault |
| Decision history | **CMG** | Decision records | Ask (explicit save) | Vault, Ask | Admitted Decision records | History lists |
| Personal context | **Personal Intelligence Core** | Derived | Profile ± CMG inputs | Ask, Julia, Vault | PIP store | Selectors / views |
| Timeline | **None** | Derived projection over CMG | CMG | Vault Hub | None | Timeline read model |
| Search | **None** | Derived capability over admitted CMG records | Index builders | Vault, Julia | **Derived L1 search index** | Search result / read model |
| AI summaries | **None by default; CMG only after admission** | Generated artifact; Intelligence Layer owns generation | PIP / governed intelligence processes | Vault, Ask, Julia | None before admission; admitted MemoryRecord in CMG afterward | Summary cards / contextual views |
| Documents | **CMG** | Document metadata | Explicit create | Vault | Metadata + `payloadRef` | Document views |
| Attachments | **CMG** (refs); binary OOB | Attachment metadata | Explicit upload | Vault | `AttachmentRef` only | Blob preview |
| Knowledge | **None** | Derived domain over admitted MemoryRecords | User saves, World saves, confirmed PIP insights | Vault + future governed consumers | Existing admitted MemoryRecords | Knowledge collections / views |
| Julia | **Not a memory owner** | Consumer; potential future producer, not authorized by this ADR | — (not a producer under P1) | Julia UI | None under P1 | Advisor UI |

**Relationship ownership (normative):**

```text
People owns canonical relationship entities/state.
CMG owns only admitted relationship memory events and graph edges.
CMG does not copy native relationship state.
```

**AI summary ownership (normative):**

```text
The Intelligence Layer owns AI-summary generation.
An AI summary has no canonical persistence by default.
If admitted, CMG owns the resulting MemoryRecord.
```

---

## Admission Matrix

| Source | Admission mode | Default | Allowlist / explicit action | Deduplication rule | Rejection cases |
|--------|----------------|--------:|-----------------------------|--------------------|-----------------|
| Ask | Explicit user save | **No** | User Save | `(accountUserId, ask, entityId)` | Auto-save; silent admit |
| Calendar | Auto if allowlisted | **Yes** when class matches | **allowlist → deduplication → optional throttling.** Classes: milestone, deadline, travel, health appointment, relationship event, business event, decision-related event, user-pinned event | `accountUserId + class + date(/range) + sourceEntityId\|titleHash\|personId` | Ordinary events; low-importance reminders; recurring noise; raw hourly cells |
| Profile entity | Reference only | N/A | `ProfileRef` | N/A | Copying profile into CMG |
| Profile notable change | Auto, allowlisted | **Yes** | Allowlisted milestones | `accountUserId + changeClass + date + subjectRef` | Ordinary field edits |
| People entity | Reference only | N/A | `PersonRef` | N/A | Copying Person into CMG |
| Relationship event | Auto or explicit by type | **Yes** per type map | Event-type map (impl deferred) | `accountUserId + eventType + personId(s) + date` | Ordinary Person edits |
| Manual note | Explicit create | **Yes** on create | User creates note | New id / supersede policy | Implicit from views |
| File / attachment | Explicit upload | **Yes** on upload | User upload | `accountUserId + contentHash\|uploadId` | View/fetch; binary inline |
| Vault viewing / reading / fetch | **Never** | **No** | — | — | Any write-on-read |
| Vault domain result | Explicit save or source-specific rule | **No** | User save | section + subject + readingKey | Auto on fetch |
| Julia / live conversation | Never (P1) | **No** | — | — | All conversation admits; Julia is not a producer under P1 |
| Pathfinder | Explicit user save | **No** | User save | Analogous to Ask | Auto-admit |
| World | Explicit user save | **No** | User save | `accountUserId + worldItemId` | Auto from browse |
| PIP-derived insight | Confirmation-required (v1) | **No** | User confirms | `calculationId` / fingerprint | Silent auto-admit |
| AI summary (ephemeral) | Not admitted by default | **No** | Explicit admit only | Per Summary policy | Treating compose as MemoryRecord |

Telemetry / recent activity `MUST` remain outside CMG.

---

## Canonical MemoryRecord Contract

Rejected identifiers: `ownerUserId`, `subjectUserId`, `aboutSubjectIds`.

Contract title: **Canonical MemoryRecord Contract**.
Initial schema version: **`schemaVersion: "1.0.0"`**.
No prior official CMG MemoryRecord schema exists in-repo; therefore this ADR does **not** use a “v2” contract name.

This ADR freezes the **field contract and ownership semantics**. It does **not** freeze the Memory type/domain **registry taxonomy**. Live conversation memory and implicit AI memory remain out of scope; identifiers such as conversation or AI-memory types `MUST NOT` be introduced as normative enum members by this ADR.

```ts
/** Shared module vocabulary for source.module and createdBy.module */
export type SourceModule =
  | "ask"
  | "calendar"
  | "people"
  | "profile"
  | "vault"
  | "julia"
  | "pathfinder"
  | "world"
  | "pip";

/**
 * Governed identifier. ADR-0010 does not freeze the registry taxonomy.
 */
export type MemoryTypeId = string;

/**
 * Governed classification/filter identifier.
 * ADR-0010 does not freeze the registry taxonomy.
 */
export type MemoryDomainId = string;

export type MemoryStatus =
  | "active"
  | "superseded"
  | "disputed"
  | "archived"
  | "deleted";

export type VerificationStatus =
  | "user_confirmed"
  | "source_confirmed"
  | "system_derived"
  | "unverified"
  | "disputed";

export type Visibility = "standard" | "private" | "restricted";

export type Importance = "low" | "normal" | "high" | "critical";

export type AdmissionRule = "auto" | "user" | "policy" | "never";

export type RetentionClass =
  | "session"
  | "short"
  | "standard"
  | "durable"
  | "legal_hold";

export type SubjectRef = {
  subjectType:
    | "user"
    | "person"
    | "organization"
    | "location"
    | "event"
    | "decision"
    | "document"
    | "other";
  subjectId: string;
  /** Optional role of this subject relative to the memory (e.g. "spouse", "employer") */
  relationship?: string;
};

export type CreatedBy = {
  actorType: "user" | "system" | "module";
  actorId?: string;
  module?: SourceModule;
};

export type SourceRef = {
  module: SourceModule;
  entityType: string;
  entityId?: string;
  version?: string;
};

export type Provenance = {
  verificationStatus: VerificationStatus;
  /** Inclusive range 0..1; only for derived or uncertain records */
  confidence?: number;
  evidenceRefs?: string[];
};

/**
 * Graph edge among memories / referenced entities.
 * NOT the same as subjectRefs (aboutness) or references (supporting links).
 */
export type MemoryEdge = {
  edgeId: string;
  toMemoryId?: string;
  toRef?: SubjectRef;
  relType: string; // controlled vocabulary — exact taxonomy unresolved at L0
  createdAt: string;
};

/** Supporting or external pointers — not subjects, not graph edges */
export type ExternalRef = {
  refId: string;
  refType: string;
  uri?: string;
  label?: string;
  module?: SourceModule;
  entityId?: string;
};

/** Metadata only — binary lives out of band */
export type AttachmentRef = {
  attachmentId: string;
  filename: string;
  mimeType: string;
  byteSize: number;
  blobRef: string;
  checksum?: string;
};

export type AdmissionMeta = {
  rule: AdmissionRule;
  admittedAt: string;
  actor: CreatedBy;
  reason?: string;
};

export type RetentionPolicy = {
  class: RetentionClass;
  expiresAt?: string;
};

export type PayloadRef = {
  kind: string;
  key: string;
};

export type MemoryRecord = {
  id: string;
  schemaVersion: "1.0.0";

  /** Account / tenant that owns this record in CMG */
  accountUserId: string;

  /** What/whom this memory is about — references only; no entity state copy */
  subjectRefs: SubjectRef[];

  type: MemoryTypeId;
  domain: MemoryDomainId;
  title: string;
  summary: string;
  tags: string[];

  source: SourceRef;
  createdBy: CreatedBy;
  provenance: Provenance;

  status: MemoryStatus;
  supersedesRecordId?: string;

  createdAt: string;
  updatedAt: string;
  occurredAt?: string;

  importance: Importance;

  /** Graph edges — distinct from subjectRefs and references */
  relationships: MemoryEdge[];

  /** Supporting / external references — distinct from subjectRefs and relationships */
  references: ExternalRef[];

  /** Attachment metadata/references only */
  attachments: AttachmentRef[];

  visibility: Visibility;
  admission: AdmissionMeta;
  retention: RetentionPolicy;
  payloadRef: PayloadRef;

  deletedAt?: string;
};
```

**Field boundaries:** `subjectRefs` = subjects of the memory · `relationships` = graph edges · `references` = supporting/external pointers · `attachments` = metadata + `blobRef` only · `source.module` and `createdBy.module` share `SourceModule`.

**Lifecycle:** A correcting record `MUST` reference the prior record through `supersedesRecordId`. History `MUST NOT` be silently overwritten. `status = deleted` requires `deletedAt`. `deletedAt` `MUST NOT` be set for a non-deleted record.

**Search v1:** Indexes only admitted MemoryRecords on `title`, `summary`, `tags`, `type`, `domain`, `subjectRefs`, and approved structured `references`.

---

## Invariants

1. Reads never create canonical memory.
2. Ask output is not memory by default.
3. Source entities remain owned by their native modules.
4. CMG references source entities; it does not copy their canonical state.
5. People owns canonical relationship entities/state; CMG owns only admitted relationship memory events and graph edges; CMG does not copy native relationship state.
6. Timeline is a projection, not a system of record (owner: None).
7. Search is a derived capability over CMG, not a canonical owner; storage is a derived L1 search index.
8. Knowledge is a derived domain over admitted MemoryRecords, not a canonical owner.
9. The Intelligence Layer owns AI-summary generation. An AI summary has no canonical persistence by default. If admitted, CMG owns the resulting MemoryRecord.
10. Search v1 indexes only admitted MemoryRecords on title, summary, tags, type, domain, subjectRefs, and approved structured references.
11. Corrections create a superseding record; canonical history is never silently overwritten.
12. A correcting record references the prior record through `supersedesRecordId`.
13. `status = deleted` requires `deletedAt`.
14. `deletedAt` must not be set for a non-deleted record.
15. Binary content is referenced, not stored in MemoryRecord.
16. Julia is not a canonical memory owner.
17. Julia is not a producer under P1; any future Julia-to-CMG production or admission requires a separate governed decision.
18. L1 is not an independent system of record.
19. L2 does not exist until a separate ADR approves it.
20. Telemetry / recent activity are outside CMG.
21. `accountUserId`, `subjectRefs`, and `createdBy` must not be collapsed.
22. Derived indexes are disposable and rebuildable.
23. No future capability may silently widen admission scope.
24. This ADR does not freeze Memory type/domain registry taxonomy.

(Plus Architectural Principles 1–10 above.)

---

## Consequences

### Benefits

- Prevents coupling Vault UI to persistence / SoR.
- Allows L1 → L2 evolution without breaking the domain contract.
- Prevents memory pollution from reads, exploratory Ask, and ordinary entity edits.
- Preserves provenance and additive correction history.
- Remains compatible with Ask, People, Profile, and PIP ownership.
- Enables a future Vault Hub experience without inventing a backend in this ADR.
- Keeps type/domain registries evolvable without reopening ownership.

### Costs and constraints

- v1 memory is limited and client-oriented (L1).
- Semantic search does not exist under this ADR.
- Cross-device sync does not exist under this ADR.
- Type/domain taxonomies remain unresolved (see Open Questions).
- Vault UI must be designed honestly against sparse admitted data.
- Admission actions (Save, Confirm, Upload) must be explicit in later UX work.

---

## Rejected Alternatives

| Alternative | Why rejected |
|-------------|--------------|
| **Vault as the canonical database** | Conflates UI with SoR; forces rewrite when CMG/L2 mature |
| **Ask auto-saves every result** | Contaminates CMG with exploratory/incomplete/contradictory outputs |
| **Reads create memory** | Hidden side effects corrupt Search, Timeline, and AI context |
| **People/Profile entities copied into CMG** | Dual SoR; drift and duplication |
| **Split canonical ownership of Relationships** | Violates unique ownership; native state vs memory events must be separate rows |
| **Timeline as an independent store** | Second database; projection must not become owner |
| **Building L2 backend before a separate ADR** | Premature service/API invention |
| **Treating search index as canonical ownership** | Indexes are disposable; engines must be replaceable |
| **Julia as memory owner** | Julia is guidance consumer; conflicts with explainability subordination and ADR-0007 |
| **Freezing MemoryType/MemoryDomain enums in this ADR** | Contradicts open taxonomy work; would smuggle Conversation/AIMemory into normative scope |

---

## Out of Scope

- backend CMG service
- embeddings
- semantic search
- binary indexing
- live conversation memory
- implicit Julia memory
- automatic Ask admission
- cross-device sync
- encryption implementation claims
- IA
- UI
- route changes
- API invention

---

## Open Questions

Non-blocking for L0 ratification:

- Memory type/domain taxonomy and registry
- relationship edge taxonomy
- retention durations
- visibility/privacy semantics
- Calendar mapping and dedupe keys
- PIP confirmation UX
- Timeline projection policy
- legal erasure behavior
- L1-to-L2 migration
- offline account identity behavior

---

## Compatibility

This ADR:

- does **not** change routing
- does **not** change AppShell
- does **not** change localization
- does **not** invent new APIs
- does **not** approve a backend service
- does **not** change branding
- does **not** start IA, UI, or implementation

Existing `POST /api/vault/mars` and other public contracts remain unchanged.

---

## Supersession

This ADR does **not** supersede ADR-0007.
Any conversation-to-memory admission requires a future ADR.

---

## References

- [CMG-FINAL-LOCK-REPORT.md](../architecture/CMG-FINAL-LOCK-REPORT.md)
- [ADR_INDEX.md](../governance/ADR_INDEX.md)
- [ADR-0007-Conversation-API-Contract-v1.md](./ADR-0007-Conversation-API-Contract-v1.md)
- [ADR-0009-Shared-Frontend-Conversation-and-Decision-Context-Boundaries.md](./ADR-0009-Shared-Frontend-Conversation-and-Decision-Context-Boundaries.md)
- [METIORO_CONSTITUTION.md](../governance/METIORO_CONSTITUTION.md) §1.2
- Vault surfaces: `apps/web/app/vault/`
- PIP: `apps/web/lib/intelligence/`

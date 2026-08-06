# Final Lock Report — Canonical Memory Graph (CMG)

**Date:** 2026-07-23
**Branch:** `governance-foundation`
**Status:** ADR-0010 **Accepted** — L0 canonical memory boundaries ratified
**Scope:** Ownership · Admission · MemoryRecord · Invariants — architectural ratification only
**Companion ADR:** [ADR-0010-Canonical-Memory-Graph-and-Personal-Intelligence-Memory-Boundaries.md](../adr/ADR-0010-Canonical-Memory-Graph-and-Personal-Intelligence-Memory-Boundaries.md)

### Ratification notice

- ADR-0010 was explicitly ratified by the Product Owner on 2026-07-23.
- The L0 canonical memory boundaries defined by the ADR are accepted and locked.
- This ratification does not authorize implementation, L2, semantic search, implicit memory, Julia memory production, auto-save, migration, IA, or UI work.
- **L2 does not exist and remains unapproved.**
- **Search remains lexical/filter-based v1 only** (admitted MemoryRecords; title, summary, tags, type, domain, subjectRefs, approved structured references).
- **Semantic/vector search remains out of scope.**
- **Julia remains neither a canonical owner nor an authorized P1 producer.**
- **Live conversation memory and implicit AI memory remain out of scope.**

---

## Schema identifiers (locked)

| Rejected | Replacement |
|----------|-------------|
| `ownerUserId` | `accountUserId` |
| `subjectUserId` | (removed) |
| `aboutSubjectIds` | `subjectRefs[]` |
| Contract name “MemoryRecord v2” | **Canonical MemoryRecord Contract** with `schemaVersion: "1.0.0"` |
| Frozen `MemoryType` / `MemoryDomain` enums | `MemoryTypeId` / `MemoryDomainId` (string; registry unresolved) |

**Three separated responsibilities:** `accountUserId` · `subjectRefs` · `createdBy`.

---

## Architectural Principles

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

## 1. Canonical Ownership Matrix

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

```text
People owns canonical relationship entities/state.
CMG owns only admitted relationship memory events and graph edges.
CMG does not copy native relationship state.
```

```text
The Intelligence Layer owns AI-summary generation.
An AI summary has no canonical persistence by default.
If admitted, CMG owns the resulting MemoryRecord.
```

```text
Julia is not a producer under P1.
Any future Julia-to-CMG production or admission requires a separate governed decision.
```

---

## 2. Final Admission Matrix

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
| Julia / live conversation | Never (P1) | **No** | — | — | All conversation admits; Julia not a producer under P1 |
| Pathfinder | Explicit user save | **No** | User save | Analogous to Ask | Auto-admit |
| World | Explicit user save | **No** | User save | `accountUserId + worldItemId` | Auto from browse |
| PIP-derived insight | Confirmation-required (v1) | **No** | User confirms | `calculationId` / fingerprint | Silent auto-admit |
| AI summary (ephemeral) | Not admitted by default | **No** | Explicit admit only | Per Summary policy | Treating compose as MemoryRecord |

Telemetry / recent activity remain **outside** CMG.

---

## 3. Canonical MemoryRecord Contract

Authoritative full TypeScript lives in ADR-0010 § Canonical MemoryRecord Contract.

Normative highlights:

- `schemaVersion: "1.0.0"`
- `type: MemoryTypeId` / `domain: MemoryDomainId` (string; taxonomy not frozen)
- `provenance.confidence?: number` — inclusive range **0..1**; derived/uncertain only
- Search v1 indexes: title, summary, tags, type, domain, subjectRefs, approved structured references
- Lifecycle: `status = deleted` requires `deletedAt`; `deletedAt` must not be set when not deleted; corrections use `supersedesRecordId`

---

## 4. Explicit Invariants

See ADR-0010 § Invariants (complete list). Includes unique ownership for relationship entities vs memory events, AI-summary generation vs persistence split, Julia non-producer under P1, and lifecycle consistency rules.

---

## 5. Out of Scope

backend CMG service · embeddings · semantic search · binary indexing · live conversation memory · implicit Julia memory · automatic Ask admission · cross-device sync · encryption implementation claims · IA · UI · route changes · API invention

---

## 6. Remaining Unresolved Decisions (non-blocking for L0)

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

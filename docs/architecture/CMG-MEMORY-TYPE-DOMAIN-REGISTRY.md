# CMG Memory Type / Domain Registry Specification

**Status:** Proposed  
**Date:** 2026-07-24  
**Authority:** Derives from [ADR-0010](../adr/ADR-0010-Canonical-Memory-Graph-and-Personal-Intelligence-Memory-Boundaries.md) (Accepted). Does not authorize implementation.  
**Related:** [ADR-0011 — CMG L1 Client Runtime Authorization](../adr/ADR-0011-CMG-L1-Client-Runtime-Authorization.md); [CMG-SPECIFICATION-DEPENDENCY-MAP.md](./CMG-SPECIFICATION-DEPENDENCY-MAP.md)

---

## 1. Purpose

Govern stable string identifiers for:

- `MemoryTypeId` — what kind of admitted memory a `MemoryRecord` is
- `MemoryDomainId` — classification / filter facet for an admitted memory

ADR-0010 freezes the **field contract**, not a closed TypeScript enum. This document defines registry process and minimal seeds. Identifiers do **not** by themselves authorize capabilities (e.g. an identifier string does not imply Conversation or AIMemory features).

---

## 2. Distinction: type vs domain

| Concept | Field | Role |
|---------|-------|------|
| **Type** | `type: MemoryTypeId` | Primary kind of memory record (e.g. note, decision, document metadata) |
| **Domain** | `domain: MemoryDomainId` | Cross-cutting classification / filter (e.g. health, relationship, career) |

A record has exactly one `type` and one `domain` under ADR-0010’s MemoryRecord shape. Domains **MUST NOT** be used to smuggle ownership (People/Profile remain source-module owners).

---

## 3. Identifier rules

### 3.1 Form

- Identifiers are **stable strings**.
- **MUST** match: `^[a-z][a-z0-9_]*$` (lowercase ASCII, digits, underscore; start with letter).
- **MUST** be ≤ 64 characters.
- **MUST NOT** embed version numbers in the identifier (versioning is registry-level).

### 3.2 Naming

- Prefer nouns or noun phrases: `manual_note`, `decision_record`.
- **MUST NOT** encode UI routes, brand names, or provider names.
- **MUST NOT** imply a producer capability that ADR-0010 forbids (see Reserved).

### 3.3 Aliases

- Aliases are **prohibited** in v1 of this registry.
- Renames use **deprecation** of the old id and registration of a new id, with documented migration notes (migration coding still requires separate authorization).

---

## 4. Registration process

1. Propose identifier + definition + examples + non-examples in a PR against this document (or a successor registry appendix).
2. Review authority: Product Owner or delegated Platform Architecture reviewer.
3. Status transitions: `candidate` → `active` → `deprecated` → `retired`.
4. **Active** identifiers may be written by an authorized L1 admission pipeline **only after** ADR-0011 is Accepted and admission specs exist.
5. While this specification is **Proposed**, registration edits are documentation only; no runtime enforcement is authorized.

---

## 5. Deprecation process

1. Mark identifier `deprecated` with `deprecatedAt` date and successor id (if any).
2. New admissions **MUST NOT** use deprecated identifiers once L1 is authorized and this rule is active.
3. Existing admitted records may retain historical `type`/`domain` values until a governed migration decision exists.
4. `retired` identifiers **MUST NOT** appear in new admissions; reads of historical values remain allowed for rebuildable indexes.

---

## 6. Compatibility expectations

- Consumers **MUST** treat unknown active-looking strings as **non-fatal** for read/display (show as opaque id) until registry sync.
- Producers (admission pipeline) **MUST** reject unknown or non-active identifiers when L1 is authorized.
- Removing an `active` id without deprecation is forbidden.

---

## 7. Versioning model

| Field | Meaning |
|-------|---------|
| Registry document version | This file’s version (semver in header when stabilized) |
| Identifier lifecycle | Per-id status; not semver per id |
| MemoryRecord `schemaVersion` | Remains `"1.0.0"` per ADR-0010; orthogonal to registry version |

This Proposed draft is **v0** (unstable). Stabilization to v1.0.0 requires Product Owner acknowledgment that seeds and process are sufficient for L1 coding — still distinct from ADR-0011 Acceptance.

---

## 8. Review authority

| Action | Authority |
|--------|-----------|
| Add `candidate` | Platform Architecture (draft) |
| Promote to `active` | Product Owner or explicit delegate |
| Deprecate / retire | Product Owner or explicit delegate |
| Authorize runtime use | Requires ADR-0011 Accepted + admission pipeline spec |

---

## 9. Prohibited / unavailable identifiers

The following strings are **prohibited / unavailable under current governance**. They are **not** registered `active` identifiers, **MUST NOT** be emitted or admitted by any producer or L1 pipeline, and listing them here is **not** future pre-approval.

Registration of any of these (or equivalents) as `active` **requires a separate accepted decision** that explicitly authorizes the corresponding capability. Until that decision exists, they remain unavailable.

| Prohibited id | Why unavailable |
|---------------|-----------------|
| `conversation` | Live conversation memory out of scope (ADR-0010 / ADR-0007); does not authorize conversation memory |
| `ai_memory` | Implicit AI memory out of scope; does not authorize implicit AI memory |
| `aimemory` | Alias form of `ai_memory`; same prohibition |
| `julia_memory` | Julia is not a producer under P1; does not authorize Julia production |
| `vault_read` | Reads never create memory |
| `telemetry` | Telemetry outside CMG per ADR-0010 |

Presence of a similar string in candidate discussion does **not** authorize the capability and does **not** reserve a future slot.

---

## 10. Minimal seed identifiers (ADR-0010-supported)

Seeds are minimal and tied to ADR-0010 ownership/admission rows. Status `seed` means proposed registry content only — **not** runtime authorization and **not** `active` for admission while this specification remains Proposed. Promotion to `active` for runtime use still requires the registration process and ADR-0011 Acceptance + admission pipeline.

### 10.1 MemoryTypeId seeds

| Id | Status | Definition |
|----|--------|------------|
| `manual_note` | seed | User-created note admitted on explicit create |
| `decision_record` | seed | Decision history record admitted via explicit Ask (or future governed) save |
| `document_metadata` | seed | Document metadata MemoryRecord (binary out of band) |
| `attachment_metadata` | seed | Attachment metadata / `AttachmentRef` carrier |
| `relationship_event` | seed | Admitted relationship **memory event** (not People native state) |
| `profile_notable_change` | seed | Allowlisted profile milestone event |
| `calendar_event_memory` | seed | Allowlisted calendar class admitted as memory |
| `pip_insight` | seed | PIP-derived insight admitted only after user confirmation |
| `ai_summary_record` | seed | Formerly ephemeral AI summary **after** explicit admission as MemoryRecord |

### 10.2 MemoryDomainId seeds

| Id | Status | Definition |
|----|--------|------------|
| `general` | seed | Default / unclassified domain |
| `relationship` | seed | Relationship-related admitted memory (events/edges; not People SoR) |
| `health` | seed | Health-related admitted memory |
| `career` | seed | Career / work-related admitted memory |
| `travel` | seed | Travel-related admitted memory |
| `decision` | seed | Decision-domain classification facet |
| `knowledge` | seed | Knowledge-view classification; Knowledge remains projection owner None |

---

## 11. Candidate identifiers (not active)

Clearly marked **candidates** — not authorized for admission until promoted:

| Id | Kind | Notes |
|----|------|-------|
| `world_item_save` | type | Requires World explicit-save producer spec |
| `pathfinder_save` | type | Requires Pathfinder explicit-save producer spec |
| `vault_domain_save` | type | Requires Vault domain-result save spec; not write-on-read |

---

## 12. Unresolved registry questions

- Whether domains should be hierarchical
- Multi-domain tagging (ADR-0010 has single `domain` field — change would need ADR)
- Localization of display labels (ids remain English snake_case)
- Mapping from legacy localStorage payloads (Ask vault-adapter) to seeds — migration unauthorized here

---

## 13. Non-goals

- Closed TypeScript enums as normative source of truth
- Authorizing Conversation / AIMemory capabilities via identifier names
- Implementation of L1 validation tables in code (blocked until ADR-0011 Accepted)

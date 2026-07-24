# CMG Relationship Edge Taxonomy Specification

**Status:** Proposed  
**Date:** 2026-07-24  
**Authority:** Derives from [ADR-0010](../adr/ADR-0010-Canonical-Memory-Graph-and-Personal-Intelligence-Memory-Boundaries.md) (Accepted). Does not authorize implementation.  
**Related:** [ADR-0011 — CMG L1 Client Runtime Authorization](../adr/ADR-0011-CMG-L1-Client-Runtime-Authorization.md); [CMG-MEMORY-TYPE-DOMAIN-REGISTRY.md](./CMG-MEMORY-TYPE-DOMAIN-REGISTRY.md); [CMG-SPECIFICATION-DEPENDENCY-MAP.md](./CMG-SPECIFICATION-DEPENDENCY-MAP.md)

---

## 1. Purpose

Govern stable `relType` string identifiers for ADR-0010 `MemoryEdge` values (field `relationships` on `MemoryRecord`).

This taxonomy covers **admitted memory graph edges** only.

It does **not** define or own People-module native relationship state (spouse, employer as entity fields, synastry profile state, etc.). Per ADR-0010:

```text
People owns canonical relationship entities/state.
CMG owns only admitted relationship memory events and graph edges.
CMG does not copy native relationship state.
```

---

## 2. Distinction: relationship state vs memory edge

| Concept | Owner | Stored where | Example |
|---------|-------|--------------|---------|
| Native relationship state | People module | People native store | Person entity link, relationship profile fields |
| Relationship memory event | CMG (after admission) | `MemoryRecord` (`type` e.g. `relationship_event`) | “Anniversary noted on date D” |
| Memory graph edge | CMG | `MemoryEdge.relType` on admitted records | `related_to`, `about_person` |

`SubjectRef.relationship` (optional role string on aboutness) is **not** a `MemoryEdge.relType`. Role strings on subject refs remain free-form or separately governed; they **MUST NOT** be treated as People SoR.

---

## 3. Identifier rules

- Stable strings matching `^[a-z][a-z0-9_]*$`, ≤ 64 characters.
- Prefer verb-like or relational nouns: `related_to`, `supersedes` is **not** an edge type — supersession uses `supersedesRecordId` on the record.
- Aliases prohibited in v1; use deprecation + new id.

---

## 4. Edge model fields (normative alignment)

From ADR-0010 `MemoryEdge`:

- `edgeId`, `toMemoryId?`, `toRef?`, `relType`, `createdAt`
- Exactly one of `toMemoryId` or `toRef` **SHOULD** be present for a well-formed edge (enforcement detail deferred to repository/admission specs).

---

## 5. Directionality, inverse, symmetry

Each registered `relType` declares:

| Property | Values |
|----------|--------|
| **Directionality** | `directed` \| `undirected` |
| **Inverse** | Another `relType` id, `self` (symmetric), or `none` |
| **Symmetry** | If undirected or inverse=`self`, edge may be stored once; directed edges store orientation from owning memory → target |

Cardinality (where applicable):

| Constraint | Meaning |
|------------|---------|
| `0..*` | Default |
| `0..1` | At most one outgoing edge of this relType per source memory |
| `1..1` | Required single outgoing (rare; avoid unless justified) |

---

## 6. Allowed source / target reference classes

Targets are either:

- another admitted memory (`toMemoryId`), or
- a `SubjectRef` (`toRef`) with `subjectType` from ADR-0010 (`user`, `person`, `organization`, `location`, `event`, `decision`, `document`, `other`)

Each `relType` lists allowed target classes. Edges **MUST NOT** embed copied People entity payloads.

---

## 7. Registration, deprecation, authority

Same process spirit as the Memory type/domain registry:

1. Propose → `candidate` → `active` → `deprecated` → `retired`
2. Promote/deprecate: Product Owner or explicit delegate
3. Runtime use of `active` edges: only after ADR-0011 Accepted + admission/repository specs
4. While this document is **Proposed**: documentation only

---

## 8. Minimal seed relTypes (ADR-0010-supported)

Status `seed` means proposed registry content only — **not** runtime authorization while this specification remains Proposed.

| relType | Status | Direction | Inverse | Cardinality | Allowed targets | Definition |
|---------|--------|-----------|---------|-------------|-----------------|------------|
| `related_to` | seed | undirected | self | 0..* | memory, person, event, document, other | Generic associative link among admitted memories / refs |
| `about_person` | seed | directed | none | 0..* | person | Memory primarily concerns a PersonRef (graph form; also typically mirrored in `subjectRefs`) |
| `derived_from` | seed | directed | none | 0..* | memory, document, decision | Provenance-style link to supporting memory/ref (not a substitute for `provenance.evidenceRefs`) |
| `part_of` | seed | directed | none | 0..1 | memory, event | Membership / grouping among admitted memories |
| `references_entity` | seed | directed | none | 0..* | user, person, organization, location, event, decision, document, other | Supporting pointer edge distinct from `ExternalRef` list when a graph edge is required |

---

## 9. Candidate relTypes (not active)

| relType | Notes |
|---------|-------|
| `contradicts` | Candidate for disputed/correction graphs; needs lifecycle ops spec |
| `same_as` | Candidate identity link between memories; high merge risk — keep candidate |
| `caused_by` | Candidate causal claim; may require higher verificationStatus |

Do **not** register People native predicates (e.g. `spouse_of`, `reports_to`) as CMG edge types without a future decision that still forbids copying native state — prefer People SoR + `about_person` / memory events.

---

## 10. Prevention rules (normative intent)

When L1 is authorized:

- Admission **MUST** reject edges that include inline Person/Profile entity bodies.
- Admission **MUST** reject inventing People relationship state from CMG edges.
- UI **MUST NOT** treat CMG edges as the editor for People native relationships.

---

## 11. Unresolved registry questions

- Whether `about_person` edges are redundant with `subjectRefs` and should be discouraged
- Bidirectional materialization rules for undirected edges in indexes
- Edge-level visibility separate from parent MemoryRecord visibility
- Full controlled vocabulary size limits

---

## 12. Non-goals

- Replacing People relationship SoR
- Authorizing conversation or Julia relationship memory production
- Large speculative social-graph ontology
- Implementation of edge validation code (blocked until ADR-0011 Accepted)

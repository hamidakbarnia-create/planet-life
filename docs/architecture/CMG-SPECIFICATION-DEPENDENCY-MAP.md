# CMG Specification Dependency Map

**Status:** Planning (descriptive; not an authorization instrument)  
**Date:** 2026-07-24  
**Baseline:** ADR-0010 Accepted (2026-07-23); ADR-0011 Accepted (2026-07-24); no CMG runtime  
**Purpose:** Planning instrument for post–ADR-0010 / post–ADR-0011 specification work. Does **not** authorize implementation.

---

## Legend

| Column | Meaning |
|--------|---------|
| **Current status** | As of this document’s date |
| **Required predecessor** | Must exist / be Accepted before the next gate |
| **Drafting allowed?** | Documentation work without claiming runtime authority |
| **Implementation allowed?** | Coding / runtime / API / UI |
| **Ratification authority** | Who accepts the decision/spec |
| **Blocking condition** | What keeps the next step closed |

---

## Dependency table

| Item | Current status | Required predecessor | Drafting allowed? | Implementation allowed? | Ratification authority | Blocking condition |
|------|----------------|----------------------|-------------------|-------------------------|------------------------|--------------------|
| **ADR-0010** L0 CMG boundaries | **Accepted** (2026-07-23) | — | N/A (done) | **No** (explicitly not granted) | Product Owner (done) | N/A — L0 locked; does not unlock L1 code |
| **ADR-0011** CMG L1 client runtime authorization | **Accepted** (2026-07-24) | ADR-0010 Accepted | N/A (done) | **No** — Acceptance alone does not activate coding | Product Owner (done) | Coding blocked until repository contract + admission pipeline specs are separately approved |
| **Memory type/domain registry** | **Proposed** | ADR-0010 | **Yes** | **No** | Product Owner / delegate for `active` ids | Runtime use blocked until registry operational approval + admission spec |
| **Relationship edge taxonomy** | **Proposed** | ADR-0010 | **Yes** | **No** | Product Owner / delegate for `active` relTypes | Runtime use blocked until taxonomy operational approval + admission/repository specs |
| **CMG repository contract** | **Missing** | ADR-0010; ADR-0011 Accepted | **Yes** (spec draft) | **No** until contract separately approved | Product Owner / Platform Architecture | Required coding gate for L1 store |
| **Admission pipeline spec** | **Missing** | ADR-0010 matrices; taxonomies; repository contract | **Yes** | **No** until pipeline separately approved | Product Owner / Platform Architecture | Required coding gate for admission runtime |
| **Ask explicit-save contract** | **Missing** (local `vault-adapter` ≠ CMG) | Admission pipeline approved | **Yes** | **No** until Ask contract approved | Product Owner / Platform Architecture | Ask→CMG wiring blocked; auto-save remains forbidden |
| **Calendar admission/dedupe spec** | **Missing** (ADR-0010 Open Question) | Admission pipeline; taxonomy | **Yes** | **No** until Calendar spec approved | Product Owner / Platform Architecture | Auto-admit coding blocked |
| **People relationship-event admission spec** | **Missing** | Edge taxonomy; admission pipeline; ADR-0010 People ownership | **Yes** | **No** until People event spec approved | Product Owner / Platform Architecture | Must not copy People native state |
| **Profile identity-change admission spec** | **Missing** | Admission pipeline; type registry | **Yes** | **No** until Profile spec approved | Product Owner / Platform Architecture | Notable-change allowlist undefined |
| **Lifecycle operations spec** | **Missing** (invariants in ADR-0010 only) | Repository contract | **Yes** | **No** until lifecycle spec approved | Product Owner / Platform Architecture | Supersede/delete ops coding blocked |
| **Search v1 indexing/query spec** | **Missing** (field list in ADR-0010 only) | Repository contract approved | **Yes** | **No** until Search spec approved | Product Owner / Platform Architecture | No Search engine; semantic/vector remains out of scope |
| **Timeline projection policy** | **Missing** (ADR-0010 Open Question) | Repository contract; projection principles | **Yes** | **No** until policy approved **and** L1 coding gates cleared | Product Owner | Timeline must stay owner None |
| **Vault projection / IA decision** | **Missing** | Timeline/Search projections; separate IA/UI authorization | **Yes** (IA decision docs) | **No** — ADR-0010/0011 exclude IA/UI redesign | Product Owner | Vault remains UI not SoR; IA blocked |
| **L2 ADR** | **Missing** | Stable L1 (if any); separate Product Owner initiative | **Yes** (future draft) | **No** — L2 does not exist; unapproved | Product Owner | Entire L2 track blocked until L2 ADR Accepted |
| **Conversation-to-memory ADR** | **Missing** | ADR-0007 remains LOCKED; ADR-0010 non-supersession | **Yes** (future draft) | **No** — conversation memory not authorized | Product Owner | Julia/live conversation→CMG blocked; ADR-0007 in force |

---

## Sequencing (summary)

```text
ADR-0010 Accepted
    → ADR-0011 Accepted (L1 architectural boundary; coding NOT active)
        → repository contract + admission pipeline specs drafted/reviewed
            → explicit approval of those executable specs
                → implementation authorization becomes active for the approved L1 scope
                    → coding
                        → tests
                            → deployment
Independently blocked (not unlocked by ADR-0011):
    L2 · public memory API · semantic/vector search · conversation-to-memory
    · Julia production · Vault IA/UI · bulk migration · cloud sync · cross-device persistence
```

Coding **MUST NOT** be placed immediately after ADR-0011 Acceptance. Executable-spec approval is a mandatory intermediate gate.

---

## Hard constraints (carry-forward)

- ADR-0010 does **not** authorize implementation.
- ADR-0011 Acceptance establishes the L1 architectural boundary; coding authorization is **conditional and not yet active**.
- L2 does **not** exist and remains unapproved.
- ADR-0007 stateless conversation boundaries remain in force.
- ADR-0010 does **not** supersede ADR-0007 or ADR-0009.
- No closed enum taxonomy; registries use governed strings.
- No implementation task in this map is marked unblocked.
- This map is descriptive planning only — not an authorization instrument.

---

## References

- [ADR-0010](../adr/ADR-0010-Canonical-Memory-Graph-and-Personal-Intelligence-Memory-Boundaries.md)
- [ADR-0011](../adr/ADR-0011-CMG-L1-Client-Runtime-Authorization.md)
- [CMG-FINAL-LOCK-REPORT.md](./CMG-FINAL-LOCK-REPORT.md)
- [CMG-MEMORY-TYPE-DOMAIN-REGISTRY.md](./CMG-MEMORY-TYPE-DOMAIN-REGISTRY.md)
- [CMG-RELATIONSHIP-EDGE-TAXONOMY.md](./CMG-RELATIONSHIP-EDGE-TAXONOMY.md)
- [ADR_INDEX.md](../governance/ADR_INDEX.md)
- [MASTER_STATUS.md](../MASTER_STATUS.md)

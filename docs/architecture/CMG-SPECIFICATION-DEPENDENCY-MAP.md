# CMG Specification Dependency Map

**Status:** Planning (descriptive; not an authorization instrument)
**Date:** 2026-07-24
**Baseline:** ADR-0010 Accepted (2026-07-23); ADR-0011 Accepted (2026-07-24); Repository Contract Accepted v0.3.1 (2026-07-24); Admission Pipeline Specification Accepted v0.1.3 (2026-07-24); no CMG runtime; coding Not granted
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
| **ADR-0011** CMG L1 client runtime authorization | **Accepted** (2026-07-24) | ADR-0010 Accepted | N/A (done) | **No** — Acceptance alone does not activate coding | Product Owner (done) | Coding blocked until executable specs approved + explicit implementation approval |
| **Memory type/domain registry** | **Proposed** | ADR-0010 | **Yes** | **No** | Product Owner / delegate for `active` ids | Runtime use blocked until registry operational approval + admission spec |
| **Relationship edge taxonomy** | **Proposed** | ADR-0010 | **Yes** | **No** | Product Owner / delegate for `active` relTypes | Runtime use blocked until taxonomy operational approval + admission/repository specs |
| **CMG repository contract** | **Accepted** v0.3.1 (2026-07-24) | ADR-0010; ADR-0011 Accepted | N/A (done) | **No** — Acceptance does **not** authorize coding | Product Owner (done) | Repository behavioural gate satisfied; coding still blocked on remaining operational authorities + explicit implementation approval |
| **Admission pipeline spec** | **Accepted** v0.1.3 (2026-07-24) | ADR-0010 matrices; Repository Contract Accepted | N/A (done) | **No** — Acceptance does **not** authorize coding; implementation Missing; runtime proof-backed success Blocked | Product Owner (done) | Spec gate closed; remaining blockers: Admission Authority Selection Authority Missing; canonicalization/hash (OQ-A2) Missing; AdmissionProof issuer/integrity (OQ-A4) Missing; type/schema/identity/lifecycle/policy/prior-observation authorities Missing; process-entry size authority Missing for untrusted input; explicit implementation approval Not granted |
| **Ask explicit-save contract** | **Missing** (local `vault-adapter` ≠ CMG) | Admission pipeline approved | **Yes** | **No** until Ask contract approved | Product Owner / Platform Architecture | Ask→CMG wiring blocked; auto-save remains forbidden |
| **Calendar admission/dedupe spec** | **Missing** (ADR-0010 Open Question) | Admission pipeline; taxonomy | **Yes** | **No** until Calendar spec approved | Product Owner / Platform Architecture | Auto-admit coding blocked |
| **People relationship-event admission spec** | **Missing** | Edge taxonomy; admission pipeline; ADR-0010 People ownership | **Yes** | **No** until People event spec approved | Product Owner / Platform Architecture | Must not copy People native state |
| **Profile identity-change admission spec** | **Missing** | Admission pipeline; type registry | **Yes** | **No** until Profile spec approved | Product Owner / Platform Architecture | Notable-change allowlist undefined |
| **Lifecycle operations spec** | **Missing** (invariants in ADR-0010 + Repository Contract soft-delete/supersede surface) | Repository Contract Accepted | **Yes** | **No** until lifecycle authority approved | Product Owner / Platform Architecture | `MarkDeleted` / disputed / archived remain gated; legal erasure outside Repository Contract; Supersede remains Admission-proof gated |
| **Search v1 indexing/query spec** | **Missing** (field list in ADR-0010 only) | Repository Contract Accepted | **Yes** | **No** until Search spec approved | Product Owner / Platform Architecture | No Search engine; semantic/vector remains out of scope; Repository Contract authorizes rebuild semantics only |
| **Timeline projection policy** | **Missing** (ADR-0010 Open Question) | Repository Contract Accepted; projection principles | **Yes** | **No** until policy approved **and** L1 coding gates cleared | Product Owner | Timeline must stay owner None |
| **Vault projection / IA decision** | **Missing** | Timeline/Search projections; separate IA/UI authorization | **Yes** (IA decision docs) | **No** — ADR-0010/0011 exclude IA/UI redesign | Product Owner | Vault remains UI not SoR; IA blocked |
| **L2 ADR** | **Missing** | Stable L1 (if any); separate Product Owner initiative | **Yes** (future draft) | **No** — L2 does not exist; unapproved | Product Owner | Entire L2 track blocked until L2 ADR Accepted |
| **Conversation-to-memory ADR** | **Missing** | ADR-0007 remains LOCKED; ADR-0010 non-supersession | **Yes** (future draft) | **No** — conversation memory not authorized | Product Owner | Julia/live conversation→CMG blocked; ADR-0007 in force |

---

## Sequencing (summary)

```text
ADR-0010 Accepted
    → ADR-0011 Accepted (L1 architectural boundary; coding NOT active)
        → Repository Contract Accepted v0.3.1 (2026-07-24) — coding still NOT authorized
            → Admission Pipeline Specification Accepted v0.1.3 (2026-07-24) — coding still NOT authorized; runtime success Blocked
                → required registries / lifecycle / canon (OQ-A2) / proof (OQ-A4) / selection authorities Accepted where slice needs them
                    → explicit implementation approval
                        → coding (approved L1 scope only)
                            → tests
                                → deployment
Independently blocked (not unlocked by Admission Pipeline Acceptance):
    L2 · public memory API · semantic/vector search · conversation-to-memory
    · Julia production · Vault IA/UI · bulk migration · cloud sync · cross-device persistence
```

Coding **MUST NOT** be placed immediately after ADR-0011, Repository Contract Acceptance, or Admission Pipeline Acceptance. Applicable registry/lifecycle/canonicalization/proof authorities and explicit implementation approval remain mandatory gates.

---

## Hard constraints (carry-forward)

- ADR-0010 does **not** authorize implementation.
- ADR-0011 Acceptance establishes the L1 architectural boundary; coding authorization is **conditional and not yet active**.
- Repository Contract Acceptance (v0.3.1) satisfies the repository behavioural gate only; it does **not** authorize coding.
- Admission Pipeline Specification is **Accepted** v0.1.3 (2026-07-24); acceptance does **not** authorize coding; implementation remains Missing; proof-backed runtime success remains Blocked while OQ-A2/A4 and related authorities are Missing.
- L2 does **not** exist and remains unapproved.
- ADR-0007 stateless conversation boundaries remain in force.
- ADR-0010 does **not** supersede ADR-0007 or ADR-0009.
- No closed enum taxonomy; registries use governed strings (Proposed registries are not accepted authority).
- No implementation task in this map is marked unblocked.
- This map is descriptive planning only — not an authorization instrument.

---

## References

- [ADR-0010](../adr/ADR-0010-Canonical-Memory-Graph-and-Personal-Intelligence-Memory-Boundaries.md)
- [ADR-0011](../adr/ADR-0011-CMG-L1-Client-Runtime-Authorization.md)
- [CMG-REPOSITORY-CONTRACT-SPECIFICATION.md](./CMG-REPOSITORY-CONTRACT-SPECIFICATION.md) (Accepted v0.3.1)
- [CMG-FINAL-LOCK-REPORT.md](./CMG-FINAL-LOCK-REPORT.md)
- [CMG-MEMORY-TYPE-DOMAIN-REGISTRY.md](./CMG-MEMORY-TYPE-DOMAIN-REGISTRY.md)
- [CMG-RELATIONSHIP-EDGE-TAXONOMY.md](./CMG-RELATIONSHIP-EDGE-TAXONOMY.md)
- [ADR_INDEX.md](../governance/ADR_INDEX.md)
- [MASTER_STATUS.md](../MASTER_STATUS.md)

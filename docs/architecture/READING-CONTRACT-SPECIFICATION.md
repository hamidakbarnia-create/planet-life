# Reading Contract Specification

| Field | Value |
|-------|-------|
| **Document** | Reading Contract |
| **Path** | `docs/architecture/READING-CONTRACT-SPECIFICATION.md` |
| **Status** | Proposed |
| **Version** | 1.0.0 |
| **Date** | 2026-07-25 |
| **Phase** | P3 — Executable Specifications |
| **Authority** | Product-level reading result contract (decision intelligence readings) |
| **Coding authorization** | **Not granted.** Acceptance of this document does **not** authorize implementation, scoring changes, UI changes, Vault wording changes, or runtime coding. |
| **Structural reference** | [CMG-REPOSITORY-CONTRACT-SPECIFICATION.md](./CMG-REPOSITORY-CONTRACT-SPECIFICATION.md) (documentation shape only; not a dependency) |

---

## 1. Title and document metadata

This document is the **Reading Contract Specification**. It defines the canonical field set and fail-closed result model for a **Reading** — the structured decision-intelligence output produced by a reading evaluation.

---

## 2. Status

**Proposed** (2026-07-25) at version **1.0.0**.

This Proposed Reading Contract Specification defines the canonical shape of a Reading and the fail-closed `ReadingResult` envelope. Coding remains **not granted**. This Proposed status does **not** authorize scoring, UI, Vault wording, API payload, or runtime implementation work.

| Classification | Content in this document |
|----------------|--------------------------|
| **Proposed (this document)** | Reading Contract v1.0.0 — seven required fields; single `impact`; fail-closed `ReadingResult` |
| **Explicitly not defined** | Scoring algorithms; UI presentation; Vault copy; runtime implementation |
| **Open Question** | None in this version |
| **Future Work** | Presentation interpretation of Impact; indexing/registry registration in governance indexes (out of scope for this artifact) |

---

## 3. Purpose

Define the canonical Reading shape so that:

1. Every valid Reading exposes the same seven required fields.
2. Missing required fields produce an invalid reading (fail-closed), never a partial success.
3. `impact` remains one canonical field (not split into storage fields such as `risk` and `opportunity`).
4. Consumers can distinguish a successful Reading from a Reading error without inventing fallback content.
5. Downstream presentation, scoring, and product surfaces remain free to evolve **without** changing this storage/contract shape unless a future contract revision is Accepted.

---

## 4. Scope

### 4.1 In scope

- The canonical Reading field contract (seven required fields).
- The fail-closed `ReadingResult` result model.
- Validity rules for missing required fields.
- The rule that `impact` is a single canonical field.

### 4.2 Out of scope (non-authorization)

This specification does **not** define, authorize, or change:

- Scoring algorithms, score bands, weights, or ranking.
- UI layout, components, labels, localization, or presentation ordering.
- Vault product wording, section names, brand names, or marketing copy.
- Runtime implementation, engines, templates, prompts, or API transports.
- Persistence technology, database schemas, or storage formats beyond the logical contract.
- Splitting `impact` into separate canonical fields (for example `risk` and `opportunity`).
- Governance index registration (`ADR_INDEX`, `DECISION_LOG`, `MASTER_STATUS`) — those updates are separate work.

**Presentation note:** Presentation layers **MAY** later interpret or display Impact in multiple ways. Storage and this contract **MUST** retain a single `impact` field.

---

## 5. Normative language

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are to be interpreted as described in RFC 2119.

- Normative requirements bind any future conforming Reading producer or consumer **only after** coding is separately authorized.
- Notes are non-normative unless explicitly marked otherwise.
- Acceptance of this document alone does **not** authorize coding.

---

## 6. Definitions

| Term | Definition |
|------|------------|
| **Reading** | A complete structured decision-intelligence result containing all seven required fields defined in §7. |
| **Reading field** | One of the seven canonical fields: Signal, Meaning, Blind Spot, Impact, Action, Decision Domain, Confidence. |
| **Impact** | The single canonical field describing consequence or change relevance of the Reading. Not a pair of storage fields. |
| **ReadingResult** | Fail-closed envelope that is either a successful Reading or a Reading error — never both, never a partial Reading presented as success. |
| **ReadingError** | Structured failure describing why a Reading is invalid or could not be produced. |
| **Fail-closed** | On missing required fields or invalid contract shape, return `ok: false` with an error; do not invent defaults; do not emit a partial Reading as success. |
| **Canonical storage** | The logical contract shape for persistence and interchange. Distinct from presentation interpretation. |

---

## 7. Canonical Reading fields

A Reading **MUST** include all seven fields below. All seven fields are **required**.

| Field | Canonical key | Requirement |
|-------|---------------|-------------|
| Signal | `signal` | Required |
| Meaning | `meaning` | Required |
| Blind Spot | `blindSpot` | Required |
| Impact | `impact` | Required — **single** canonical field |
| Action | `action` | Required |
| Decision Domain | `decisionDomain` | Required |
| Confidence | `confidence` | Required |

### 7.1 Field semantics

| Field | Meaning |
|-------|---------|
| **Signal** | What was observed or inferred as the primary reading input signal. |
| **Meaning** | Interpretation of the signal in decision-intelligence terms. |
| **Blind Spot** | What the Reading does not see, cannot know, or may underweight. |
| **Impact** | What changes or is at stake given the signal and meaning. One field only. |
| **Action** | The next move or verification step the user may take. |
| **Decision Domain** | The decision context or domain in which the Reading applies. |
| **Confidence** | Explicit confidence associated with the Reading. **MUST** disclose uncertainty and **MUST NOT** imply false precision (see §7.4). |

### 7.2 Validity rules

1. A Reading with any missing required field **MUST** be treated as invalid.
2. Missing `confidence` **MUST** mean invalid reading.
3. Missing `impact` **MUST** mean invalid reading.
4. Missing `action` **MUST** mean invalid reading.
5. Missing `signal`, `meaning`, `blindSpot`, or `decisionDomain` **MUST** mean invalid reading.
6. An invalid Reading **MUST NOT** be returned as `ReadingResult` success (`ok: true`).
7. Producers **MUST NOT** invent placeholder values solely to force `ok: true`.
8. A `confidence` value that omits uncertainty disclosure or implies false precision **MUST** be treated as invalid under §7.4 and **MUST** fail closed (`ok: false`).

### 7.3 Impact unity rule

1. Canonical storage and this contract **MUST** retain exactly one Impact field: `impact`.
2. Implementations **MUST NOT** split Impact into separate canonical storage fields such as `risk` and `opportunity`.
3. Presentation **MAY** interpret or render Impact differently; such presentation **MUST NOT** change the canonical contract.

### 7.4 Confidence integrity rules

1. `confidence` is **required**. Absence **MUST** fail closed (see §7.2 rule 2; §8).
2. `confidence` **MUST** disclose uncertainty so a consumer can tell what is known, inferred, or unknown.
3. `confidence` **MUST NOT** imply false precision (for example exact predictive certainty unsupported by the Reading’s evidence).
4. `confidence` **MUST NOT** be used to launder missing Signal, Meaning, Blind Spot, Impact, Action, or Decision Domain into a successful Reading.
5. Exact confidence value schema (labels, bands, or structured objects) is **not** frozen by this version beyond rules 1–4.

---

## 8. Fail-closed ReadingResult model

The canonical result model is a discriminated union:

```ts
type ReadingResult =
  | {
      ok: true;
      reading: Reading;
    }
  | {
      ok: false;
      error: ReadingError;
    };
```

### 8.1 Success branch

1. `ok: true` **MUST** include a complete `reading` that satisfies §7.
2. `ok: true` **MUST NOT** include a partial Reading missing any required field.
3. `ok: true` **MUST NOT** coexist with a top-level `error` as an alternate success path.

### 8.2 Error branch

1. `ok: false` **MUST** include `error: ReadingError`.
2. `ok: false` **MUST NOT** include a `reading` that consumers are expected to treat as valid.
3. Missing required fields, contract violations, and fail-closed evaluation failures **MUST** surface as `ok: false`.

### 8.3 Fail-closed behaviour

1. Consumers **MUST** narrow on `ok` before accessing `reading` or `error`.
2. Producers **MUST** fail closed: invalid → `ok: false`; never silently coerce to success.
3. Absence of evidence for a required field **MUST NOT** be converted into a successful Reading.

`ReadingError` **MUST** identify the failure at least by a stable machine-readable reason (for example a code or equivalent). Exact error taxonomy beyond fail-closed invalidity is left to future revisions or implementation specs and is **not** authorized by this document alone.

---

## 9. Logical Reading shape

This section defines the logical object. It does **not** define programming-language modules, API routes, or storage engines.

```ts
type Reading = {
  signal: /* required */;
  meaning: /* required */;
  blindSpot: /* required */;
  impact: /* required — single field */;
  action: /* required */;
  decisionDomain: /* required */;
  confidence: /* required */;
};
```

Field value types (string vs structured object) are **not** frozen by this version beyond the requirement that each field be present and meaningful under §7. Future Accepted revisions **MAY** tighten value schemas without splitting `impact`.

---

## 10. Non-goals

This specification does **not**:

1. Define how Signal is scored or ranked.
2. Define Vault section naming, Shadow Room branding, or user-facing microcopy.
3. Define UI composition, CTA placement, or localization strings.
4. Authorize runtime engine, template, or API changes.
5. Register itself in `ADR_INDEX`, `DECISION_LOG`, or `MASTER_STATUS` (those are separate documentation actions).
6. Amend ADR-0006, ADR-0007, ADR-0009, ADR-0010, ADR-0011, or CMG specifications.

---

## 11. Consequences

### 11.1 Proposed (contract)

- Reading producers and consumers share one canonical seven-field contract.
- Impact remains one field at the contract/storage layer.
- Invalid readings fail closed through `ReadingResult`.

### 11.2 Still not authorized

- Scoring changes
- UI / Vault wording changes
- Runtime implementation
- API payload shipping under this contract without separate implementation approval

---

## 12. Versioning

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-07-25 | Initial Proposed Reading Contract: seven required fields; single `impact`; fail-closed `ReadingResult`. |

Supersession or field-set changes require a future Accepted revision of this specification (or a governing ADR if architecture hierarchy demands one). Until then, v1.0.0 remains the Proposed Reading Contract shape.

---

## 13. References

| Reference | Role |
|-----------|------|
| [CMG-REPOSITORY-CONTRACT-SPECIFICATION.md](./CMG-REPOSITORY-CONTRACT-SPECIFICATION.md) | Structural documentation reference only |
| Product decision (Reading Contract v1) | Product intent for the seven-field contract and single-impact rule; not registry-ratified while this document remains Proposed |

---

## 14. Document control

| Item | Value |
|------|-------|
| **Maintainer** | Product Owner / Documentation Engineer |
| **Change rule** | Append-only versioning; status may change; required fields are not silently removed |
| **Implementation rule** | Specification acceptance ≠ coding authorization |

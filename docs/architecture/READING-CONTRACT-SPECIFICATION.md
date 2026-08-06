# Reading Contract Specification

| Field | Value |
|-------|-------|
| **Document** | Reading Contract |
| **Path** | `docs/architecture/READING-CONTRACT-SPECIFICATION.md` |
| **Status** | Proposed (presence/validity gate policy: **Accepted** via [PRG-02](../governance/PRG-02-reading-contract-presence-validity-gates.md) Variant A) |
| **Version** | 1.1.0 |
| **Date** | 2026-07-29 |
| **Phase** | P3 — Executable Specifications |
| **Authority** | Product-level reading result contract (decision intelligence readings) |
| **Coding authorization** | **Not granted.** Acceptance of PRG-02 Variant A and this document do **not** authorize implementation, scoring changes, UI changes, Vault wording changes, or runtime coding. |
| **Structural reference** | [CMG-REPOSITORY-CONTRACT-SPECIFICATION.md](./CMG-REPOSITORY-CONTRACT-SPECIFICATION.md) (documentation shape only; not a dependency) |
| **Presence gates** | [PRG-02 — Reading Contract Presence & Validity Gates](../governance/PRG-02-reading-contract-presence-validity-gates.md) (**Accepted**, Variant A) |

---

## 1. Title and document metadata

This document is the **Reading Contract Specification**. It defines the canonical field set and fail-closed result model for a **Reading** — the structured decision-intelligence output produced by a reading evaluation.

---

## 2. Status

**Proposed** contract shape at version **1.1.0** (2026-07-29).

**Accepted** presence/validity gate policy: [PRG-02](../governance/PRG-02-reading-contract-presence-validity-gates.md) **Variant A** (2026-07-29).

This Reading Contract Specification defines the canonical shape of a Reading and the fail-closed `ReadingResult` envelope. Coding remains **not granted**. Proposed status of the full contract and Accepted status of PRG-02 Variant A do **not** authorize scoring, UI, Vault wording, API payload, or runtime implementation work.

| Classification | Content |
|----------------|---------|
| **Accepted (PRG-02 Variant A)** | Presence fail-closed gates; Score ≠ Confidence; consumers must not derive Confidence from Score or Presence; presentation is a pure consumer; semantic validity owned by Producers |
| **Proposed (this document)** | Reading Contract v1.1.0 — seven required fields; single `impact`; fail-closed `ReadingResult` |
| **Explicitly not defined** | Scoring algorithms; UI presentation; Vault copy; runtime implementation; producer calibration procedures |
| **Open Question** | None in this version |
| **Future Work** | Presentation rendering of Impact without reinterpretation; indexing/registry registration in governance indexes (out of scope for this artifact) |

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
- **Presence** validity rules for missing required fields (PRG-02 Variant A).
- Consumer independence rules for Score vs Confidence (PRG-02).
- The rule that `impact` is a single canonical field.

### 4.2 Out of scope (non-authorization)

This specification does **not** define, authorize, or change:

- Scoring algorithms, score bands, weights, or ranking.
- Semantic calibration or correctness procedures for field *values* (Producer responsibility under PRG-02).
- UI layout, components, labels, localization, or presentation ordering.
- Vault product wording, section names, brand names, or marketing copy.
- Runtime implementation, engines, templates, prompts, or API transports.
- Persistence technology, database schemas, or storage formats beyond the logical contract.
- Splitting `impact` into separate canonical fields (for example `risk` and `opportunity`).
- Governance index registration (`ADR_INDEX`, `DECISION_LOG`, `MASTER_STATUS`) — those updates are separate work.

**Presentation note:** Presentation layers **MAY** reorder, group, collapse, or simplify labels. Presentation **MUST NOT** reinterpret producer meaning. Storage and this contract **MUST** retain a single `impact` field.

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
| **Presence** | Whether each required Reading field is present on the result. Enforced by this contract (PRG-02 Variant A). |
| **Semantic validity** | Whether field *values* are calibrated, meaningful, and correct. Owned by the producing domain service (PRG-02). Not a Reading Contract presence check. |
| **Score** | A timing or readiness estimate from timing producers. **Independent** of Reading `confidence`. Not a substitute for Confidence. |
| **Canonical storage** | The logical contract shape for persistence and interchange. Distinct from presentation rendering. |

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

### 7.2 Presence validity rules (PRG-02 Variant A)

These rules enforce **presence**, not semantic calibration.

1. Required fields **MUST** be present before a Reading is considered valid for presentation.
2. A Reading with any missing required field **MUST** be treated as invalid.
3. Missing required fields **MUST NOT** be inferred, synthesized, or replaced by fallback values.
4. Missing `confidence` **MUST** mean invalid reading.
5. Missing `impact` **MUST** mean invalid reading.
6. Missing `action` **MUST** mean invalid reading.
7. Missing `signal`, `meaning`, `blindSpot`, or `decisionDomain` **MUST** mean invalid reading.
8. An invalid Reading **MUST NOT** be returned as `ReadingResult` success (`ok: true`).
9. Producers **MUST NOT** invent placeholder values solely to force `ok: true`.

**Note (non-normative for calibration):** Semantic validity, calibration, and correctness of field values remain the responsibility of the producing domain service (PRG-02). Future producer validity procedures **MUST NOT** be absorbed into this contract as competing specifications.

### 7.3 Impact unity rule

1. Canonical storage and this contract **MUST** retain exactly one Impact field: `impact`.
2. Implementations **MUST NOT** split Impact into separate canonical storage fields such as `risk` and `opportunity`.
3. Presentation **MAY** render Impact for display; presentation **MUST NOT** reinterpret producer meaning or change the canonical contract.

### 7.4 Confidence integrity rules

1. `confidence` is **required** as a **present** field. Absence **MUST** fail closed (see §7.2; §8).
2. `confidence` is independent of Score. Consumers **MUST NOT** derive `confidence` from Score (PRG-02).
3. Consumers **MUST NOT** derive `confidence` from Presence or completeness of other fields (PRG-02).
4. `confidence` **MUST NOT** be used to launder missing Signal, Meaning, Blind Spot, Impact, Action, or Decision Domain into a successful Reading.
5. Values **MUST NOT** be represented with false precision outside approved semantics (PRG-02). Exact confidence value schema (labels, bands, or structured objects) is **not** frozen by this version beyond presence and the false-precision prohibition.
6. Semantic calibration of `confidence` (how sure the producer is, and how that is computed) belongs to the Producer — not to presentation and not to Score.

### 7.5 Consumer and presentation rules (PRG-02)

1. Presentation remains a **pure consumer**.
2. Presentation layers **MUST NOT** reinterpret producer output.
3. Consumers **MUST NOT** derive Confidence from Score.
4. Consumers **MUST NOT** derive Confidence from Presence or completeness.
5. Score and Confidence are independent concepts.
6. Reading Contract defines **structure**, not meaning. Producer owns meaning.

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

### 11.1 Proposed (contract shape) + Accepted (PRG-02 presence gates)

- Reading producers and consumers share one canonical seven-field contract.
- Impact remains one field at the contract/storage layer.
- Invalid readings fail closed through `ReadingResult` on **presence** failures (Variant A).
- Score must not be treated as Confidence by any consumer.
- Semantic calibration remains with Producers.

### 11.2 Still not authorized

- Scoring changes
- UI / Vault wording changes
- Runtime implementation / ReadingResult wiring
- API payload shipping under this contract without separate implementation approval
- Mapping timing Score → Reading Confidence

---

## 12. Versioning

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-07-25 | Initial Proposed Reading Contract: seven required fields; single `impact`; fail-closed `ReadingResult`. |
| 1.1.0 | 2026-07-29 | Align with Accepted PRG-02 Variant A: presence vs semantic ownership; Score ≠ Confidence consumer rules; presentation pure-consumer bounds. Coding still not granted. |

Supersession or field-set changes require a future Accepted revision of this specification (or a governing ADR if architecture hierarchy demands one). Until the full contract is Accepted for coding, v1.1.0 remains the Proposed Reading Contract shape with PRG-02 Variant A binding for presence/validity gates.

---

## 13. References

| Reference | Role |
|-----------|------|
| [PRG-02-reading-contract-presence-validity-gates.md](../governance/PRG-02-reading-contract-presence-validity-gates.md) | **Accepted** Variant A — presence fail-closed gates; Score ≠ Confidence |
| [CMG-REPOSITORY-CONTRACT-SPECIFICATION.md](./CMG-REPOSITORY-CONTRACT-SPECIFICATION.md) | Structural documentation reference only |
| Product decision (Reading Contract v1) | Product intent for the seven-field contract and single-impact rule; full contract coding still not granted |

---

## 14. Document control

| Item | Value |
|------|-------|
| **Maintainer** | Product Owner / Documentation Engineer |
| **Change rule** | Append-only versioning; status may change; required fields are not silently removed |
| **Implementation rule** | Specification acceptance ≠ coding authorization |

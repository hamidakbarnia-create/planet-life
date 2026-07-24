# CMG Admission Pipeline Specification

| Field | Value |
|-------|-------|
| **Document** | CMG L1 Admission Pipeline Specification |
| **Path** | `docs/architecture/CMG-ADMISSION-PIPELINE-SPECIFICATION.md` |
| **Status** | Accepted |
| **Version** | 0.1.3 |
| **Date** | 2026-07-24 (Accepted) |
| **Phase** | P3 — Executable Specifications |
| **Authority** | Derives from ADR-0011 (Accepted), ADR-0010 (Accepted), and [CMG Repository Contract Specification](./CMG-REPOSITORY-CONTRACT-SPECIFICATION.md) (Accepted v0.3.1) as downstream boundary |
| **Coding authorization** | **Not granted.** Acceptance of this document does **not** authorize implementation or coding. |
| **Implementation status** | **Not implemented.** No Admission Pipeline runtime exists in code. |
| **Planning map** | [CMG-SPECIFICATION-DEPENDENCY-MAP.md](./CMG-SPECIFICATION-DEPENDENCY-MAP.md) |

---

## 1. Purpose and authority

### 1.1 Purpose

Admission is the **only** governed process that may decide whether an untrusted candidate may become a canonical admitted `MemoryRecord` eligible for repository persistence.

This specification defines the deterministic, technology-neutral behavioural contract for that process: evaluation, fail-closed rejection, canonicalization, and issuance of `AdmissionProof` suitable for `PersistAdmitted` and `Supersede` under the Accepted Repository Contract.

### 1.2 Authority relationship

| Authority | Role |
|-----------|------|
| ADR-0010 | L0 ownership, admission matrices, MemoryRecord field contract (including Accepted `schemaVersion` value when mandated by Accepted schema authority) |
| ADR-0011 | L1 architectural boundary; requires an explicit admission pipeline before coding |
| Repository Contract v0.3.1 | Canonical store operations; requires proof **presence** for writes; defers proof schema/verification to this specification |
| This document (Accepted) | Defines AdmissionProof, pipeline stages, and handoff rules — **Accepted** behavioural contract; coding and runtime success remain gated |

### 1.3 Persistence exclusivity

1. Admission is the **only** authorized route that may produce an `admissionProof` accepted by `PersistAdmitted` or `Supersede`.
2. Successful admission **MUST NOT** itself persist MemoryRecords. Persistence occurs only when an authorized caller invokes Repository Contract operations with a valid proof.
3. Reads, searches, projections, index rebuilds, UI views, and Ask exploration **MUST NOT** constitute Admission (ADR-0010; ADR-0011; Repository Contract §24).
4. Successful admission does **not** authorize implementation work, producer wiring, storage selection, or coding.
5. **No proof-backed admission success path exists** while mandatory success-path authorities for canonicalization/hash (OQ-A2) or proof integrity/issuer (OQ-A4) remain unresolved. This document is **Accepted** while the runtime success path remains fail-closed; coding and operational admission remain blocked until those authorities are Accepted and explicit implementation approval is issued (§20, §23).

---

## 2. Status

**Accepted** (2026-07-24) at version **0.1.3**.

Acceptance establishes the **normative Admission Pipeline specification only**. It does **not** mean:

- the Admission Pipeline exists in code;
- any Missing or Proposed dependency is Accepted;
- coding, implementation, deployment, migration, backfill, or runtime activation is authorized;
- canonical persistence by any producer is authorized;
- proof issuance is operationally enabled.

OQ-A2 and OQ-A4 continue to block every proof-backed success path. Explicit implementation approval remains required before coding. Full gate list: §20. No persistence implementation may begin from this acceptance alone.

| Classification | Content |
|----------------|---------|
| **Accepted (binding inputs)** | ADR-0010, ADR-0011, ADR-0007, ADR-0009, Repository Contract v0.3.1 |
| **Accepted (this document)** | Admission pipeline + AdmissionProof contract v0.1.3 |
| **Proposed (non-authority)** | Memory type/domain registry; relationship edge taxonomy |
| **Missing (mandatory for success path / coding gate)** | Admission Authority Selection Authority; canonicalization/hash (OQ-A2); proof integrity/issuer (OQ-A4); type/schema authorities; identity-format authority (OQ-A3); producer-policy authorities; Lifecycle Operations Spec; prior-observation capability authority |
| **Open Questions** | §23 |

---

## 3. Normative language

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are to be interpreted as described in RFC 2119.

- Normative requirements bind any future conforming Admission implementation **only after** coding is authorized.
- Open Questions are non-normative unless marked otherwise.
- Requirements that depend on a missing Accepted authority are **gated**, fail closed with `MissingAuthority` on the success path, and are **not** implementation-ready.

---

## 4. Definitions

| Term | Definition |
|------|------------|
| **Candidate** | Untrusted proposed MemoryRecord (or envelope containing one) submitted for Admission evaluation. |
| **Admission** | Governed process defined by this specification that may accept or reject a candidate and, on success, issue `AdmissionProof`. |
| **AdmissionProof** | Integrity-bound evidence that a named candidate was successfully admitted under a pinned authority snapshot (§10). |
| **Canonical MemoryRecord** | ADR-0010 MemoryRecord after Admission canonicalization, ready for repository handoff as logical fields. |
| **Canonical bytes** | Deterministic byte sequence produced under a pinned Accepted canonicalization/hash authority; used only as AdmissionProof hash input. |
| **Validation** | Pass/fail evaluation against rules; **MUST NOT** invent missing content. |
| **Normalization** | Domain/representation rewrite authorized only by an Accepted normalization authority (§7.2 S1). |
| **Canonicalization** | Deterministic production of logical Canonical MemoryRecord + canonical bytes + `canonicalHash` under a pinned Accepted authority (§11). |
| **Enrichment** | Addition of Admission-owned metadata (e.g. admission decision fields). **MUST NOT** invent user/content meaning. |
| **Repair** | Reconstructing missing or invalid content to force acceptance. **Forbidden** unless a future Accepted authority explicitly permits a named repair. |
| **Migration** | Transforming records across schema versions. **Out of scope**; not authorized by this draft. |
| **Rejection** | Terminal fail-closed outcome; no proof; no persistence eligibility. |
| **Partial admission** | Any state in which some stages succeed and persistence eligibility is claimed without a complete successful proof. **Forbidden.** |
| **Producer** | Source module that may submit candidates only under Accepted producer/policy authorities and ADR-0010/0011 prohibitions. |
| **Admission Authority Selection Authority** | Required future Accepted authority that derives the complete mandatory authority set via `RequiredAuthorities(...)` (§13.2). Not Accepted by this specification. Acceptance of this document does not Accept that authority. |
| **Authority snapshot** | Immutable set of Accepted authority versions created at S5-C and reused by all later stages (§13). |
| **evaluationInstant** | Single pinned evaluation time for one evaluation context (§7.1). |
| **ResolvePriorRecord** | Read-only prior-observation capability required for supersede (§7.3, §9.4). |
| **RepositoryOperationForIntent** | Normative mapping from candidate `intent` to the exact Repository Contract operation (§6.5). |
| **Handoff package** | `AdmissionHandoffPackage` / `AdmittedBundle` returned on success; **not** persistence success (§16). |
| **TerminalAdmissionResult** | One primary result code, safe message, and correlation id; no handoff. |

---

## 5. Boundary model

### 5.1 Actors

| Actor | Role |
|-------|------|
| Producer / caller | Submits candidate; never invents proofs |
| Admission Pipeline | Evaluates, canonicalizes, issues/rejects proof |
| Repository | Persists only with valid proof (`PersistAdmitted` / `Supersede`); never invents proofs |
| Registry/lifecycle/policy/canonicalization/proof authorities | Provide rules only when Accepted and pinned |

### 5.2 Boundary sequence (conceptual)

```text
untrusted candidate input
  → parsing / decoding boundary
  → normalization boundary (identity/no-op until Accepted normalization authority)
  → structural validation (authority-independent)
  → schemaVersion envelope checks only (no support classification)
  → account-scope validation
  → authority snapshot (S5-A ADR prohibition → S5-B intent/operation coherence → S5-C RequiredAuthorities + authoritySnapshot)
  → registry / type / schema resolution under pinned authorities
  → lifecycle validation (+ ResolvePriorRecord for supersede)
  → semantic / ownership validation
  → policy validation (pinned producer-policy only)
  → canonicalization (requires pinned Accepted hash authority)
  → AdmissionProof issuance (requires pinned Accepted proof authority)
  → repository handoff eligibility (not persistence)
```

### 5.3 Distinctions (normative)

| Concern | Allowed under this contract? |
|---------|------------------------------|
| Validation | Yes — pass/fail |
| Normalization | Only under Accepted normalization authority; otherwise strict identity/no-op |
| Canonicalization | Only under pinned Accepted canonicalization/hash authority |
| Enrichment | Admission metadata / proof fields only |
| Repair / Migration | **No** |
| Silent skip / downgrade / best-effort persist | **No** |
| Rejection | Yes — terminal |
| Admission (proof issuance) | Only after all required stages succeed under complete snapshot |
| Repository persistence | Outside Admission; Repository Contract only |

---

## 6. Input contract

### 6.1 Candidate envelope

A candidate submission **MUST** include:

| Field | Required | Meaning |
|-------|----------|---------|
| `accountUserId` | Yes | Account scope for evaluation and persistence |
| `intent` | Yes | `create` \| `supersede` \| `lifecycle` (lifecycle intents gated) |
| `candidateRecord` | Yes | Proposed MemoryRecord-shaped object |
| `producerContext` | Yes | Declared `source.module`, admission mode claim, and correlation id |
| `priorId` | Conditional | Required when `intent = supersede`; **MUST** equal `candidateRecord.supersedesRecordId` |
| `mintIdentity` | No | If true, requests identity minting (requires Accepted minting authority) |
| `idempotencyKey` | No | Opaque caller key; has **no semantic effect** unless the pinned Admission Authority Selection Authority classifies an idempotency/replay authority as mandatory for that exact operation and that Accepted authority defines the mapping |

### 6.2 Candidate record fields (ADR-0010)

`candidateRecord` **MUST** be evaluated against ADR-0010 Canonical MemoryRecord Contract fields, including:

`schemaVersion`, `id`, `accountUserId`, `type`, `domain`, `title`, `summary`, `subjectRefs`, `tags`, `relationships`, `references`, `attachments`, `source`, `createdBy`, `provenance`, `admission` (may be incomplete pre-admit), `status`, `supersedesRecordId`, `createdAt`, `updatedAt`, `occurredAt`, `deletedAt`, and visibility/retention fields as defined by ADR-0010 (optionality per ADR-0010, not invented here).

### 6.3 Record identity

#### 6.3.1 Authority-independent checks

1. Record identity field missing ⇒ `ValidationFailed`.
2. Record identity empty ⇒ `ValidationFailed`.
3. Record identity not representable as the required primitive envelope type (e.g. not a string when the envelope requires a string) ⇒ `ValidationFailed`.
4. The Admission Pipeline **MUST NOT** invent or mint an identity without an Accepted minting authority.
5. If `mintIdentity=true` and no Accepted minting authority exists ⇒ `MissingAuthority` at S5-C.
6. If minting is authorized, minting occurs only per that authority, **before** canonicalization, and the minted id **MUST** be bound into canonical bytes and `AdmissionProof`.
7. Repository-side identity defaulting or minting is prohibited unless separately authorized by the Repository Contract (it is not).

#### 6.3.2 Authority-dependent identity-format checks

Format validity, allowed character set, length, namespace, reserved values, prohibited forms, and type-specific identity policy **MAY** be evaluated **only** under a pinned Accepted identity-format authority.

| Condition | Result |
|-----------|--------|
| Identity-format authority is included in `RequiredAuthorities(...)` by the pinned Admission Authority Selection Authority but absent, unavailable, non-Accepted, incomplete, inconsistent, or unpinnable | `MissingAuthority` |
| Pinned Accepted identity-format authority definitively rejects the supplied non-empty identity | `ValidationFailed` |
| Known Accepted identity-format authority cannot be read operationally | `RegistryResolutionFailed` |

Until OQ-A3 is resolved: this specification **MUST NOT** reject a non-empty caller-supplied identity under undefined format rules; no implicit format default is permitted; implementation authorization remains blocked wherever identity-format validation is included in `RequiredAuthorities(...)`.

### 6.4 Deterministic field behaviours

| Condition | Behaviour |
|-----------|-----------|
| Unknown fields under the MemoryRecord contract recognized by the pinned schema authority | `ValidationFailed` (align Repository Contract §17) |
| Missing required ADR-0010 fields (authority-independent presence) | `ValidationFailed` |
| Duplicate encoded fields where parse cannot produce unambiguous envelope | `MalformedInput` |
| Malformed encoding / undecodable payload | `MalformedInput` |
| Schema support/rejection | Only at S6 under pinned schema authority (§7.2 S3/S6) |
| Account scope mismatch (envelope vs record) | `AccountScopeMismatch` |
| Binary content embedded | `ValidationFailed` |
| Active Accepted process-entry size/resource limit exceeded | `MalformedInput` at S0 |

### 6.5 Intent and repositoryOperation binding

Candidate `intent` is the semantic request. `repositoryOperation` is the exact Repository Contract operation for handoff. It **MUST NOT** be independently chosen in conflict with `intent`.

#### 6.5.1 `RepositoryOperationForIntent(intent)`

| `intent` | Derived `repositoryOperation` |
|----------|-------------------------------|
| `create` | `PersistAdmitted` |
| `supersede` | `Supersede` |
| `lifecycle` | Exact lifecycle Repository operation authorized by a pinned Accepted lifecycle authority only |

Until an Accepted lifecycle authority defines a concrete lifecycle Repository operation: `intent = lifecycle` ⇒ **`MissingAuthority`**. This specification does **not** invent a lifecycle write operation.

#### 6.5.2 Consistency assertion

1. `intent` is the single semantic source of truth.
2. `repositoryOperation` is deterministically derived via `RepositoryOperationForIntent(intent)`.
3. An externally supplied `repositoryOperation` is a **consistency assertion only**; it **MUST** equal `RepositoryOperationForIntent(intent)` and **MUST NOT** override or reinterpret `intent`.
4. Mismatch (including `create`+`Supersede`, `supersede`+`PersistAdmitted`, or unknown repository operation for `create`/`supersede`) ⇒ **`ValidationFailed`** at S5-B, before authority-set derivation.
5. The derived `repositoryOperation` **MUST** be bound into `RequiredAuthorities(...)`, the evaluation context, lifecycle checks, `AdmissionProof`, `AdmissionHandoffPackage`, and Repository verification.

#### 6.5.3 Intent structural rules

1. `intent = create`: `supersedesRecordId` **MUST NOT** be present/non-null.
2. `intent = supersede`: `supersedesRecordId` **MUST** be present/non-null and equal `priorId`.
3. General content patch/update without supersede ⇒ `LifecycleViolation`.

### 6.6 Unauthorized producers and S5 primary-result precedence

#### 6.6.1 Precedence (normative)

Primary results at/before authority-snapshot construction **MUST** follow this order:

1. Direct Accepted-ADR prohibition evaluable from S0–S4 envelope facts ⇒ **`PolicyViolation`**
2. Candidate `intent` / `repositoryOperation` mismatch ⇒ **`ValidationFailed`**
3. Missing, incomplete, incompatible, non-Accepted, unavailable, or unpinnable required authority set ⇒ **`MissingAuthority`**
4. Operational failure reading a known Accepted authority ⇒ **`RegistryResolutionFailed`**
5. Later domain errors ⇒ per S6–S12

#### 6.6.2 Direct ADR prohibition (authority-independent)

Before `RequiredAuthorities` or snapshot construction, evaluate only prohibitions that are:

- directly stated in an Accepted ADR (ADR-0010, ADR-0011);
- decidable from authority-independent envelope facts already established by S0–S4;
- unambiguous without registry, schema, lifecycle, canonicalization, or proof authority resolution.

If an Accepted ADR directly prohibits the declared producer and requested operation ⇒ terminate immediately with **`PolicyViolation`**.

Examples only where the Accepted ADR text directly supports them: Julia as a canonical memory owner; automatic persistence by Ask; automatic persistence by Conversation; other producer/operation combinations explicitly prohibited by ADR-0010 or ADR-0011. **ADR-0007** prohibits the Conversation surface from becoming a canonical memory owner or automatically persisting conversation content. **MUST NOT** expand beyond exact Accepted ADR language.

Clarifications:

- `PolicyViolation` from a direct Accepted ADR does **not** require a complete `authoritySnapshot` when the prohibition is decidable solely from already validated envelope facts.
- No registry or missing authority may override a direct, authority-independent Accepted-ADR prohibition.
- This precedence does **not** authorize runtime persistence or coding.
- OQ-A2 and OQ-A4 continue to block every **non-prohibited** proof-backed success path with `MissingAuthority` at S5-C.

#### 6.6.3 Pinned producer-policy authorities

Policy rules **not** directly established by an Accepted ADR still require a pinned Accepted producer-policy authority as determined by the pinned Admission Authority Selection Authority / `RequiredAuthorities(...)`:

1. Producer-policy authority included in `RequiredAuthorities(...)` but absent, unavailable, non-Accepted, incomplete, inconsistent, or unpinnable ⇒ **`MissingAuthority`**.
2. Pinned Accepted producer-policy authority explicitly prohibits ⇒ **`PolicyViolation`**.
3. Pinned Accepted producer-policy authority explicitly permits ⇒ continue.

No optional producer-policy bypass exists. Dual-result mappings are prohibited.

---

## 7. Deterministic pipeline order

### 7.1 Global execution rules

1. Stages **MUST** execute in the order §7.2.
2. **First-failure:** on the first terminal failure, the pipeline **MUST** stop; later stages **MUST NOT** run.
3. Aggregate multi-error collection **MUST NOT** change the primary observable result code.
4. Partial success **MUST NOT** yield an `AdmissionProof`.
5. Retries are new evaluations (§15); no resume mid-pipeline success path.
6. At evaluation start, the context **MUST** pin one `evaluationInstant`. All stages **MUST** use that same instant. Re-reading wall-clock during one evaluation is prohibited.
7. Authority reads after S5 **MUST** use only the S5 snapshot (§13).
8. No fallback-to-legacy, silent skip, or best-effort admit.
9. Individual stage operations **MUST NOT** be used to bypass full `EvaluateCandidate` / `AdmitCandidate` orchestration for persistence eligibility (§9).
10. Missing-authority detection for the mandatory set occurs at **S5-C**. Stages S6–S12 **MUST NOT** return `MissingAuthority` for authorities already required by the snapshot (§7.2 S9, §13). Direct Accepted-ADR `PolicyViolation` and intent/`repositoryOperation` `ValidationFailed` occur at S5-A/S5-B before snapshot construction (§6.6).

### 7.2 Stages

#### Stage S0 — Parse / decode

| Aspect | Rule |
|--------|------|
| Input | Raw candidate envelope |
| Output | Decoded envelope + candidateRecord object graph |
| Allowed | Decode only; encoding safety required for unambiguous envelope |
| Prohibited | Repair, default-filling, migration, truncation, partial parse |
| Terminal failures | `MalformedInput` (including exceedance of an active Accepted process-entry size/resource limit authority) |
| Continue on failure? | **No** |

#### Stage S1 — Representation normalization

| Aspect | Rule |
|--------|------|
| Until Accepted normalization authority exists for the record type | **Strict identity / no-op**. **MUST NOT** reject merely because no normalization authority exists. **MUST NOT** trim, coerce, alias, reorder, repair, enrich, migrate, or normalize domain values. |
| Encoding safety already performed in S0 | Not domain normalization |
| If a future Accepted normalization authority is included in `RequiredAuthorities(...)` by the pinned Admission Authority Selection Authority | Absence ⇒ terminate at **S5-C** with `MissingAuthority`. Rejection under that pinned authority ⇒ `ValidationFailed` unless the authority defines another specific existing code. |
| Continue on failure? | **No** (when a pinned normalizer rejects) |

#### Stage S2 — Structural validation

| Aspect | Rule |
|--------|------|
| Input | Successfully decoded candidate |
| Checks | ADR-0010 required field presence/types at envelope level; arrays present; no embedded binaries; unknown fields under pinned schema deferred to S6 when schema authority exists; identity presence/empty/primitive type per §6.3.1; minting path deferred to S5 when `mintIdentity=true` |
| Terminal failures | `ValidationFailed` only (decoded-but-invalid). Decode failures already terminated at S0. |
| Continue on failure? | **No** |

#### Stage S3 — SchemaVersion envelope gate

| Aspect | Rule |
|--------|------|
| Checks (authority-independent only) | `schemaVersion` field missing ⇒ `ValidationFailed`; empty ⇒ `ValidationFailed`; malformed at primitive/envelope level ⇒ `ValidationFailed` |
| Prohibited | Classifying any `schemaVersion` value as supported or unsupported; hard-coded support decisions (including any implied default supported value) |
| Support decisions | Deferred to S6 after S5 pins Accepted type and schema authorities |
| Continue on failure? | **No** |

#### Stage S4 — Account-scope validation

| Aspect | Rule |
|--------|------|
| Checks | Envelope `accountUserId` equals `candidateRecord.accountUserId`; offline-account mapping only under Accepted offline-account authority (OQ-A6) — **MUST NOT** invent a mapping |
| Terminal failures | Envelope/record disagree ⇒ `AccountScopeMismatch`; offline-account authority absence when offline operation is requested ⇒ handled at S5-C as `MissingAuthority` |
| Continue on failure? | **No** |

#### Stage S5 — Resolve authorities (S5-A / S5-B / S5-C)

S5 executes in three ordered substeps. Later substeps **MUST NOT** run after an earlier terminal result.

##### S5-A — Authority-independent controlling prohibition

| Aspect | Rule |
|--------|------|
| Timing | After S0–S4; **before** `RequiredAuthorities` and snapshot construction |
| Checks | Direct Accepted-ADR prohibitions per §6.6.2 only |
| Terminal failure | **`PolicyViolation`** |
| Continue on failure? | **No** |

##### S5-B — Intent / repositoryOperation coherence

| Aspect | Rule |
|--------|------|
| Timing | After S5-A succeeds; **before** `RequiredAuthorities` and snapshot construction |
| Checks | Derive `repositoryOperation = RepositoryOperationForIntent(intent)` (§6.5). If externally supplied, assert equality. |
| Terminal failures | Mismatch ⇒ **`ValidationFailed`**. `intent = lifecycle` with no Accepted lifecycle-defined Repository operation ⇒ **`MissingAuthority`**. |
| Continue on failure? | **No** |

##### S5-C — Authority-set derivation and snapshot construction

| Aspect | Rule |
|--------|------|
| Timing | Only after S5-A and S5-B succeed |
| Output | One immutable `authoritySnapshot` (includes pinned Admission Authority Selection Authority version) and the derived `repositoryOperation` |
| Derivation | Invoke Accepted **Admission Authority Selection Authority** to compute `RequiredAuthorities(candidateType, schemaVersion, repositoryOperation, producerIdentity, explicitFeatures)` and pin every listed authority |
| Mandatory for all non-prohibited persistence-eligible operations (`create`, `supersede`) at minimum | Admission Authority Selection Authority; Accepted type authority; Accepted schema authority; Accepted **canonicalization/hash authority** (OQ-A2); Accepted **proof integrity/issuer authority** (OQ-A4); producer-policy authorities as included in `RequiredAuthorities(...)` by the pinned Admission Authority Selection Authority; identity-format authority as included in `RequiredAuthorities(...)`; for `supersede`: Accepted **prior-observation capability** authority; minting authority if `mintIdentity=true` |
| Partial snapshots | **Prohibited** |
| Authorities readable but mutually incompatible versions/dependencies | **`MissingAuthority`** |
| Any mandatory authority absent, unavailable, non-Accepted, incomplete, or unpinnable | **`MissingAuthority`** — stop. No S6–S12. |
| Known Accepted authority cannot be read operationally | **`RegistryResolutionFailed`** |
| Canonicalization/hash | Missing ⇒ **`MissingAuthority`** only (never `CanonicalizationFailed`) |
| Proof integrity/issuer | Missing ⇒ **`MissingAuthority`** only (never `AdmissionProofFailed`) |
| Continue on failure? | **No** |

**Consequence:** Direct Accepted-ADR prohibitions terminate at S5-A with `PolicyViolation` without requiring OQ-A2/A4. For every **non-prohibited** persistence-eligible evaluation, while OQ-A2 or OQ-A4 remain unresolved, S5-C terminates with `MissingAuthority`. No proof issuance success path exists for non-prohibited candidates until those authorities are Accepted. Without an Accepted Admission Authority Selection Authority, S5-C returns `MissingAuthority`.

#### Stage S6 — Registry / type / schema / reference resolution (under pinned snapshot only)

| Aspect | Rule |
|--------|------|
| Checks | Membership and references solely via pinned Accepted authorities from S5 |
| `UnknownRecordType` | Pinned Accepted type authority **definitively** rejects the type |
| `UnsupportedSchemaVersion` | **Exactly one trigger:** pinned Accepted type authority recognizes the type, **and** pinned Accepted schema authority rejects the `schemaVersion` |
| `RegistryResolutionFailed` | Pinned Accepted authority identified but content cannot be read/resolved operationally |
| `BrokenReference` | Required reference syntactically valid but resolves to no authorized target |
| `MissingAuthority` | **MUST NOT** be returned here for authorities already required by the snapshot |
| Continue on failure? | **No** |

#### Stage S7 — Lifecycle validation

| Aspect | Rule |
|--------|------|
| Create | `status=active`; `deletedAt` absent; no `supersedesRecordId` |
| Supersede | Uses pinned `ResolvePriorRecord` observation (§7.3); successor `status=active`; `id` ≠ `priorId`; error precedence §12.2 |
| Soft-delete / erasure / disputed / archived transitions | Must have failed at S5-B/S5-C if intent=lifecycle (`MissingAuthority`) |
| Terminal failures | Per §12.2 |
| Continue on failure? | **No** |

#### Stage S8 — Semantic / ownership validation

| Aspect | Rule |
|--------|------|
| Checks | No People/Profile entity body embedding; references only; confidence range; ownership safety (Repository Contract §16.4) |
| Terminal failures | `ValidationFailed` for structural/semantic invariants; `PolicyViolation` only for pinned-policy prohibitions under §6.6.3 (direct ADR bans already terminated at S5-A) |
| Continue on failure? | **No** |

#### Stage S9 — Policy validation

| Aspect | Rule |
|--------|------|
| Checks | Apply pinned producer-policy authorities under §6.6.3 (explicit prohibit/permit only) |
| Terminal failures | `PolicyViolation` only |
| Prohibited | Returning `MissingAuthority` for authorities already required by the snapshot; re-evaluating S5-A ADR bans as if they required a snapshot |
| Continue on failure? | **No** |

#### Stage S10 — Canonicalization

| Aspect | Rule |
|--------|------|
| Preconditions | S5 pinned Accepted canonicalization/hash authority; prior stages succeeded |
| Allowed | Execute **only** that pinned authority: produce logical Canonical MemoryRecord, canonical bytes, `canonicalHash` |
| Prohibited | Choosing/inferring serialization, encoding, normalization, field ordering, or hash algorithms; changing source meaning; repository storage encoding selection |
| Terminal failures | **`CanonicalizationFailed`** only when pinned Accepted authority exists but execution fails |
| Continue on failure? | **No** |

#### Stage S11 — Proof issuance

| Aspect | Rule |
|--------|------|
| Preconditions | S10 succeeded; S5 pinned Accepted proof integrity/issuer authority |
| Output | Complete `AdmissionProof` (§10) |
| Terminal failures | **`AdmissionProofFailed`** only when pinned Accepted proof authority exists but generation fails |
| Continue on failure? | **No** |

#### Stage S12 — Repository handoff eligibility

| Aspect | Rule |
|--------|------|
| Output | `AdmissionHandoffPackage` (§16) |
| Side effects | **None** on canonical store; no identity/predecessor reservation; no transaction |
| Terminal failures | None beyond prior stages |
| Notes | Handoff ≠ persistence success |

### 7.3 ResolvePriorRecord

Logical read-only capability required for `intent=supersede`. **MUST NOT** invent mutation, locking, or transactions. **MUST NOT** invent a new public Repository HTTP API. Expressed as a required read-only capability/contract dependency on the Accepted Repository Contract observation surface (`GetById` and related account-scoped reads).

| Aspect | Rule |
|--------|------|
| Request | `accountUserId`; `priorId`; derived `repositoryOperation` (`Supersede`); correlation identifier; **only** the minimum observation fields authorized by the pinned prior-observation/lifecycle authority: logical visibility result; lifecycle state fields strictly required for the supersede decision; canonical identity/version evidence needed for Repository conflict verification |
| Response (observation surface) | `Found(canonical prior observation)` **or** `NotFound` **or** `OperationalFailure` |
| Rules | Read-only; no mutation; no lock/reservation; observation pinned into evaluation evidence |
| Visibility | Visibility and deleted-record treatment are determined **exclusively** by the Accepted Repository Contract and the pinned prior-observation/lifecycle authority. Admission **MUST NOT** override Repository default visibility, request hidden cross-account information, define `includeDeleted` as an implementation option, or infer deletion from `NotFound`. |
| Account isolation | Admission **MUST NOT** distinguish foreign-account records from absent records when the Repository Contract returns `NotFound`. |
| If a lifecycle rule requires visibility not authorized by the Repository Contract or an Accepted authority | `MissingAuthority` |
| If capability/authority missing | S5-C `MissingAuthority` |
| Persistence conflicts | Still decided only by Repository at persist time |

**Predecessor identity checks (before ResolvePriorRecord):**

| Condition | Result |
|-----------|--------|
| Predecessor identity missing when supersede requires it | `ValidationFailed` |
| Predecessor identity empty | `ValidationFailed` |
| Predecessor identity wrong primitive envelope type | `ValidationFailed` |
| Format/namespace/reserved-value/type-specific checks when included in `RequiredAuthorities(...)` but authority absent/non-Accepted/unpinnable | `MissingAuthority` |
| Known Accepted identity/reference authority operational unread | `RegistryResolutionFailed` |
| Pinned Accepted identity/reference authority rejects non-empty predecessor identity | `ValidationFailed` |

**Admission mapping of observation responses:** §12.2.

### 7.4 Size / resource limits (process-entry)

1. This specification does **not** define a numeric maximum payload size.
2. Parser/resource limits are **process-entry safety authorities**, not candidate-specific S5 snapshot authorities.
3. They **MUST** be Accepted and configured before any runtime implementation receives untrusted candidate bytes; they apply **before** decoding.
4. They are part of implementation/environment authorization, not per-candidate authority resolution. S5 **MUST NOT** retroactively pin or select the S0 process-entry limit.
5. Absence of such an authority blocks **implementation authorization**, not governance acceptance of this specification.
6. Once an active Accepted process-entry limit authority is configured for an authorized runtime: exceeding it ⇒ S0 `MalformedInput`. Where runtime implementation is authorized, evaluation evidence **MAY** record the applied limit-authority identifier/version.
7. Operational resource exhaustion unrelated to a defined limit ⇒ `InternalAdmissionFailure`.
8. No silent truncation, partial parse, or best-effort parse.
9. This clarification does **not** create an apparent current runtime success path; implementations remain prohibited until coding authorization and required authorities exist.

---

## 8. Fail-closed rules

Admission **MUST** fail closed (no proof, no persistence eligibility) when:

1. Unsupported `schemaVersion` under pinned Accepted schema authority (exactly one trigger; §12.1)
2. Required authority missing/non-Accepted/unpinnable — including Admission Authority Selection Authority, canonicalization/hash, proof integrity/issuer, type/schema authorities, identity-format and producer-policy authorities as included in `RequiredAuthorities(...)` by the pinned Admission Authority Selection Authority, prior-observation for supersede
3. Unknown type under pinned Accepted type authority
4. Unresolved required references
5. Broken supersession references / invalid prior state under §12.2
6. Account-scope mismatch (envelope vs record)
7. Structural mismatch / unknown fields under pinned schema authority
8. Invalid lifecycle transition
9. Explicit ADR prohibition (S5-A) or pinned Accepted policy prohibition
10. Intent / `repositoryOperation` mismatch (`ValidationFailed` at S5-B)
11. Canonicalization execution failure under pinned authority
12. Proof-generation failure under pinned authority

**MUST NOT:** silent downgrade, stage skip, best-effort persistence, partial admission, or fallback-to-legacy.

---

## 9. Operation contracts

`ResolveAuthorities`, `ResolvePriorRecord`, `CanonicalizeCandidate`, and `IssueAdmissionProof` are **internal normative sub-operations** of `EvaluateCandidate` / `AdmitCandidate`.

Rules:

1. Successful execution of any one sub-operation does **not** imply admission eligibility.
2. External callers **MUST NOT** compose a partial pipeline and claim admission.
3. Only complete S0–S12 orchestration may produce `AdmissionHandoffPackage`.
4. `IssueAdmissionProof` **MUST NOT** be invoked as a standalone persistence authorization.
5. `VerifyAdmissionProof` is a Repository-bound verification operation and does **not** itself admit a candidate.
6. Lower-level operations **MUST NOT** create handoff eligibility or imply admission.

### 9.1 `EvaluateCandidate`

| Aspect | Rule |
|--------|------|
| Request | Raw candidate input; account scope; producer identity/context; correlation identifier; explicit evaluation request metadata; optional externally supplied `repositoryOperation` treated only as a consistency assertion against `RepositoryOperationForIntent(intent)` (§6.5) |
| Preconditions | None beyond safe receipt of untrusted input |
| Behavior | Executes complete S0–S12; pins one `evaluationInstant`; at S5-A/S5-B/S5-C applies §6.6 precedence; derives and binds `repositoryOperation`; creates exactly one `authoritySnapshot` at S5-C; returns first terminal primary result or one handoff package |
| Response | `TerminalAdmissionResult(primaryCode, safeMessage, correlationId)` **or** `AdmissionHandoffPackage` |
| Side effects | Audit events only; no persistence; no reservation; no Repository mutation |
| Retry / idempotency | Same candidate + same pinned snapshot + same `evaluationInstant` ⇒ same domain decision and `canonicalHash`; proof instances may differ (§10.6) |
| Prohibited | Bypassing stages; partial eligibility; fallback; automatic retry with changed authorities; composing lower-level ops to claim eligibility |

### 9.2 `ValidateCandidate`

| Aspect | Rule |
|--------|------|
| Covered stages | **Exactly** S0 through S4, plus authority-independent validation only (§6.3.1 presence/empty/primitive identity; envelope schemaVersion presence/empty/malformed) |
| Request | Same envelope inputs as EvaluateCandidate (or decoded form after S0) |
| Response | Validation diagnostics / terminal result for S0–S4 only |
| Side effects | Audit only; no persistence |
| Retry | Diagnostic only; not an admission retry |
| Prohibited | Resolving full persistence eligibility; issuing `AdmissionProof`; canonicalizing; creating handoff; authorizing persistence; substituting for `EvaluateCandidate`; open-ended stage subsets |

### 9.3 `ResolveAuthorities`

| Aspect | Rule |
|--------|------|
| Request | Decoded candidate envelope; derived `repositoryOperation`; producer identity/context; `evaluationInstant`; correlation identifier |
| Response | Complete immutable `authoritySnapshot` **or** one terminal result (`MissingAuthority` or `RegistryResolutionFailed`) |
| Side effects | None on Repository |
| Rules | Internal sub-operation; no partial snapshot; no live re-resolution; no authority substitution; no fallback; deterministic mandatory-set derivation via Admission Authority Selection Authority; invoked only after S5-A and S5-B succeed |
| Prohibited | Claiming admission or handoff from this operation alone; standalone use as persistence authorization |

### 9.4 `ResolvePriorRecord`

| Aspect | Rule |
|--------|------|
| Role | Internal sub-operation of EvaluateCandidate/AdmitCandidate for `intent=supersede` |
| Request | Account scope; predecessor identity; derived `repositoryOperation` (`Supersede`); correlation identifier; minimum observation fields per §7.3 |
| Response | `Found(prior observation)` **or** `NotFound` **or** `OperationalFailure` |
| Side effects | None; read-only |
| Mapping into Admission | §12.2 |
| Prohibited | Returning `AccountScopeMismatch` on this surface; mutation; lock/reservation; distinguishing hidden foreign from missing records; inventing deleted state from `NotFound`; creating handoff; implying admission eligibility |

### 9.5 `CanonicalizeCandidate`

| Aspect | Rule |
|--------|------|
| Role | Internal sub-operation of EvaluateCandidate/AdmitCandidate |
| Preconditions | Successful S0–S9; complete `authoritySnapshot`; pinned Accepted canonicalization/hash authority |
| Response | Logical canonical record + canonical bytes + `canonicalHash` **or** `CanonicalizationFailed` |
| Side effects | None on Repository |
| Prohibited | Inferred format; repair; semantic rewrite; defaults; fallback; creating handoff; issuing proof; implying admission eligibility |

### 9.6 `IssueAdmissionProof`

| Aspect | Rule |
|--------|------|
| Role | Internal sub-operation of EvaluateCandidate/AdmitCandidate |
| Preconditions | Successful canonicalization; complete evidence; pinned Accepted proof issuer/integrity authority |
| Response | `AdmissionProof` **or** `AdmissionProofFailed` |
| Side effects | Audit of issuance only |
| Prohibited | Partial proof; unbound fields; proof without `canonicalHash`; fallback issuer; live authority substitution; creating handoff without full EvaluateCandidate; standalone persistence authorization |

### 9.7 `VerifyAdmissionProof`

| Aspect | Rule |
|--------|------|
| Request | `AdmissionProof`; submitted logical canonical record; `repositoryOperation`; account scope |
| Response | `Verified` **or** one Repository-authorized verification failure per §10.4 |
| Side effects | None on canonical store |
| Rules | Verification only; uses only proof-bound Accepted authority versions; no live substitution; stale/default mapping §10.4–§10.5; does **not** admit a candidate |
| Prohibited | Repair; reissue; re-admission; canonical mutation; authority substitution |

### 9.8 `AdmitCandidate`

`AdmitCandidate` is **not** a second pipeline. It invokes the **same** complete S0–S12 orchestration as `EvaluateCandidate` and **MUST** return only:

- one `TerminalAdmissionResult`, or
- one `AdmissionHandoffPackage`.

| Aspect | Rule |
|--------|------|
| Request | Same as `EvaluateCandidate` |
| Response | Same as `EvaluateCandidate` |
| Side effects | Same as `EvaluateCandidate` |
| Prohibited | Persisting directly; bypassing EvaluateCandidate rules; calling `PersistAdmitted`/`Supersede` without valid proof; inferring success from `ValidateCandidate`; inventing a second evaluation path |

### 9.9 `ReevaluateCandidate`

| Aspect | Rule |
|--------|------|
| Request | Candidate; explicit new evaluation request; new correlation identifier |
| Behavior | New `evaluationInstant`; new `authoritySnapshot`; old proof unchanged; no mutation of prior proof/result; no automatic migration; no implicit retry; no silent reuse of stale authority state |
| Response | Same result type as a fresh complete `EvaluateCandidate` |
| Side effects | Audit only |
| Prohibited | Mutating old proof; silent reuse of prior snapshot; automatic backfill |

---

## 10. AdmissionProof contract

Until OQ-A2/OQ-A4 authorities are Accepted (and coding is authorized), Repository write implementations remain non-implementation-ready (Repository Contract §24 + §20). This Admission Pipeline Specification is **Accepted** v0.1.3; that acceptance alone does **not** authorize coding or operational proof issuance.

### 10.1 Technology-neutral integrity contract

`AdmissionProof` **MUST**:

1. Bind all normative proof fields in §10.2.
2. Bind the exact `canonicalHash` from S10.
3. Bind `accountUserId`, record identity, record type, `schemaVersion`, `repositoryOperation`, and `authoritySnapshot`.
4. Identify the proof issuer.
5. Include integrity evidence verifiable by the Repository under the pinned Accepted proof authority.
6. Prevent undetected modification.
7. Prevent cross-account and cross-operation reuse (verification rejects mismatches as `AdmissionInvalid`).

No cryptographic technology is selected here.

### 10.2 Proof object (logical fields)

| Field | Required | Meaning |
|-------|----------|---------|
| `proofId` | Yes | Unique proof identifier (format under Accepted format authority / OQ-A3) |
| `specVersion` | Yes | This specification version used to admit |
| `pipelineVersion` | Yes | Pipeline definition version for the evaluation |
| `accountUserId` | Yes | Account scope |
| `recordId` | Yes | `record.id` |
| `recordType` | Yes | `record.type` |
| `schemaVersion` | Yes | Admitted record `schemaVersion` under pinned schema authority |
| `repositoryOperation` | Yes | `PersistAdmitted` \| `Supersede` |
| `priorId` | Conditional | Required for `Supersede` |
| `canonicalHash` | Yes | Hash of canonical bytes under pinned hash authority |
| `authoritySnapshot` | Yes | Exact pinned authority identifiers/versions (including Admission Authority Selection Authority) |
| `validationOutcome` | Yes | `accepted` |
| `lifecycleOutcome` | Yes | `create-active` \| `supersede-active` |
| `decision` | Yes | `accepted` |
| `producer` | Yes | Producer identity (module + mode) |
| `provenanceRef` | Yes | Provenance as on canonical record |
| `evaluatedAt` | Yes | Audit metadata = pinned `evaluationInstant`; **MUST NOT** alter canonical candidate bytes; **MUST NOT** alone change domain decisions |
| `issuerId` | Yes | Issuer identity under pinned proof authority |
| `integrity` | Yes | Integrity evidence under pinned proof authority |
| `expiresAt` | Conditional | Present only if pinned proof authority requires expiry |
| `replayPolicy` | Yes | Declared under pinned proof/replay authority if the selection rule classifies that authority as mandatory; otherwise: proofs do not reserve persistence; Repository decides conflicts |
| `correlationId` | Yes | Request correlation id |

### 10.3 Issuance rules

1. Only Admission Pipeline **MAY** issue proofs.
2. Repository **MUST NOT** invent proofs.
3. **No proof** unless S10 produced canonical bytes + `canonicalHash` under pinned Accepted canonicalization/hash authority.
4. **No proof** unless pinned Accepted proof integrity/issuer authority exists.
5. `AdmissionProofFailed` only when that authority exists and generation fails.

### 10.4 Verification mapping table

Repository-boundary results use Repository Contract vocabulary.

| Condition | Result |
|-----------|--------|
| Proof missing | Repository: `AdmissionRequired` |
| Malformed proof representation | Repository: `AdmissionInvalid` |
| Integrity verification failure | Repository: `AdmissionInvalid` |
| `canonicalHash` / payload mismatch (logical record does not reproduce bound hash under proof-bound authority) | Repository: `AdmissionInvalid` |
| Account mismatch | Repository: `AdmissionInvalid` |
| Record identity / type / schemaVersion mismatch | Repository: `AdmissionInvalid` |
| `repositoryOperation` mismatch | Repository: `AdmissionInvalid` |
| Unknown/untrusted issuer | Repository: `AdmissionInvalid` |
| Required proof authority missing at Repository verify runtime | Repository: `AdmissionInvalid` |
| Required proof/canonicalization authority missing during Admission before issuance | Admission: `MissingAuthority` |
| Expired proof where expiry required by pinned authority | Repository: `AdmissionInvalid` |
| Stale / invalid proof-bound `authoritySnapshot` under §10.5 default | Repository: `AdmissionInvalid` |
| Validity of proof-bound authorities cannot be established | Repository: `AdmissionInvalid` |
| Prohibited replay under Accepted replay authority, detected before handoff | Admission: `DuplicateOrReplay` |
| Prohibited replay / identity conflict at persistence | Repository: `Conflict` (Repository Contract §19.4 / §27) |
| `PersistAdmitted` presented with `supersedesRecordId` present/non-null | Repository: `PreconditionFailed` (`SupersedeOperationRequired`) per Repository Contract §19 |
| Proof `repositoryOperation` claims `PersistAdmitted` while bound record carries `supersedesRecordId` | Repository: `AdmissionInvalid` |

Dual-result and implementation-choice mappings are prohibited.

### 10.5 Normative stale-proof default

Unless an Accepted proof-reuse/staleness authority explicitly permits reuse, any `AdmissionProof` whose proof-bound `authoritySnapshot` is no longer valid under Repository verification rules **MUST** be rejected as **`AdmissionInvalid`**.

This includes: revoked authority version; authority version no longer trusted; proof-bound issuer no longer trusted; schema / canonicalization / proof-integrity authority invalidated; explicit authority drift that verification rules classify as stale.

Clarifications:

1. Ordinary publication of a newer authority version does **not** automatically invalidate a still-valid pinned version unless Accepted authority rules say so.
2. Verification **MUST NEVER** silently substitute a newer authority.
3. If validity cannot be established ⇒ `AdmissionInvalid`.
4. OQ-A9 concerns future reuse allowances and invalidation policy refinement; until resolved, the default is fail-closed rejection, not unspecified behavior.

### 10.6 Distinct proof instances

For the same candidate, canonical bytes, `canonicalHash`, `authoritySnapshot`, `repositoryOperation`, and `evaluationInstant`:

- the domain decision and `canonicalHash` **MUST** be deterministic;
- multiple valid `AdmissionProof` instances **MAY** differ in `proofId`, issuer-generated nonce, integrity evidence, and issuance metadata where permitted by the pinned Accepted proof authority.

Such differences do **not** change candidate meaning, `canonicalHash`, or eligibility decision. This specification does **not** claim byte-identical proof instances unless an Accepted proof authority requires that.

### 10.7 Bytes vs logical equality

1. **Canonical bytes** = hash input under Accepted canonicalization/hash authority.
2. **Logical canonical record** = ADR-0010 fields handed to Repository.
3. Repository storage encoding is **not** selected by this specification.
4. Proof binds canonical bytes/`canonicalHash`. Repository **MUST** verify that the submitted logical record deterministically reproduces those bytes/hash under the proof-bound authority.
5. Repository storage representation **MAY** differ; logical persisted fields **MUST** satisfy Repository Contract §25 and **MUST NOT** change admitted meaning.
6. This specification does **not** claim the Repository persists the same serialization bytes unless the Repository Contract explicitly requires it (it does not).

---

## 11. Canonicalization

### 11.1 Goal

Under a pinned Accepted canonicalization/hash authority, produce:

- logical Canonical MemoryRecord;
- canonical bytes;
- `canonicalHash`.

### 11.2 Rules

1. S10 executes **only** after S5 pins that authority.
2. Absent vs null are not equivalent; arrays order-significant as produced (align Repository Contract §25).
3. Unknown fields already rejected under pinned schema authority.
4. Binary blob bytes **MUST NOT** enter MemoryRecord or hash input.
5. Admission enrichment of `admission` metadata allowed only as required by ADR-0010 and **MUST NOT** change user/content meaning.
6. No proof-backed admission success path while OQ-A2 unresolved (S5-C `MissingAuthority` for non-prohibited candidates).

---

## 12. Error taxonomy and precedence

### 12.1 Primary codes (closed)

| Code | Exact trigger |
|------|---------------|
| `MalformedInput` | Cannot safely decode into candidate envelope; malformed encoding; ambiguous duplicate encoded fields; active Accepted process-entry size/resource limit exceeded |
| `ValidationFailed` | Decoded; required field missing; empty identity; identity not representable as required primitive; predecessor identity missing/empty/wrong primitive when supersede requires it; intent/`repositoryOperation` mismatch; pinned identity-format authority rejects non-empty identity; semantic invariant not assigned elsewhere |
| `UnsupportedSchemaVersion` | **Exactly one trigger:** pinned Accepted type authority recognizes the type **and** pinned Accepted schema authority rejects the `schemaVersion` |
| `UnknownRecordType` | Pinned Accepted type authority definitively rejects the type |
| `AccountScopeMismatch` | Envelope `accountUserId` disagrees with `candidateRecord.accountUserId` |
| `MissingAuthority` | Required authority absent, unavailable, non-Accepted, incomplete, inconsistent/incompatible, or unpinnable **before** evaluating the relevant rule (S5-C for the mandatory set; lifecycle intent without Accepted lifecycle Repository operation at S5-B) |
| `RegistryResolutionFailed` | Required Accepted authority (or prior-observation capability) identified/pinned but content/observation cannot be read due to operational failure |
| `BrokenReference` | Required reference syntactically present/valid but resolves to no authorized target; **or** `ResolvePriorRecord` returns `NotFound` (§12.2) |
| `LifecycleViolation` | `Found` prior/referenced record exists with observable state/transition invalid for the operation; or forbidden patch/update intent |
| `PolicyViolation` | Direct Accepted-ADR prohibition (S5-A) **or** pinned Accepted producer-policy authority explicitly prohibits |
| `CanonicalizationFailed` | Pinned Accepted canonicalization authority exists; execution fails |
| `AdmissionProofFailed` | Pinned Accepted proof authority exists; generation fails |
| `DuplicateOrReplay` | Accepted replay/idempotency authority defines prohibited duplicate/replay **before** handoff |
| `InternalAdmissionFailure` | Unexpected internal failure not corresponding to any known domain/authority condition; **MUST NEVER** substitute for a defined primary result; auditable; no sensitive diagnostics |

### 12.2 Supersede / ResolvePriorRecord precedence

| Condition | Code |
|-----------|------|
| Predecessor identity missing when supersede requires it | `ValidationFailed` |
| Predecessor identity empty | `ValidationFailed` |
| Predecessor identity wrong primitive envelope type | `ValidationFailed` |
| Predecessor identity-format/reference authority included in `RequiredAuthorities(...)` but absent/non-Accepted/unpinnable | `MissingAuthority` |
| Known Accepted identity/reference authority operational unread | `RegistryResolutionFailed` |
| Pinned Accepted identity/reference authority rejects non-empty predecessor identity | `ValidationFailed` |
| Observation capability/authority missing, unavailable, non-Accepted, incomplete, or unpinnable | `MissingAuthority` |
| Operational failure reading through a known Accepted observation capability (`OperationalFailure`) | `RegistryResolutionFailed` |
| Observation returns `NotFound` (genuinely missing; foreign-account hidden by isolation; deleted/default-hidden; otherwise non-observable) | `BrokenReference` |
| Observation returns `Found` but observable lifecycle state is invalid for the requested operation | `LifecycleViolation` |

### 12.3 Producer / S5 precedence

See §6.6.1.

### 12.4 Canonicalization/proof missing vs execution

| Condition | Code |
|-----------|------|
| Canonicalization/hash authority absent/non-Accepted/unpinnable | `MissingAuthority` |
| Pinned authority exists; execution fails | `CanonicalizationFailed` |
| Proof integrity/issuer authority absent/non-Accepted/unpinnable | `MissingAuthority` |
| Pinned proof authority exists; generation fails | `AdmissionProofFailed` |

---

## 13. Authority snapshot requirements

1. One immutable snapshot is created at **S5-C**.
2. Every later stage uses **only** that snapshot.
3. No live authority re-resolution after S5.
4. All mandatory authorities must be present, Accepted, mutually consistent, and version-pinnable.
5. Partial snapshots are prohibited.
6. Cache allowed only if cached version is exactly identifiable and valid under an Accepted cache/freshness rule; stale/ambiguous cache **MUST NOT** silently fall back.
7. Snapshot construction failure / incompatible authority set ⇒ `MissingAuthority`.
8. Operational failure reading a known Accepted authority ⇒ `RegistryResolutionFailed`.
9. Authority drift after snapshot creation does not alter the current evaluation unless the pinned authority explicitly defines invalidation before handoff.
10. Proof **MUST** bind exact snapshot identifiers/versions.
11. After S5 succeeds, S6–S12 **MUST NOT** return `MissingAuthority` for authorities already required by the snapshot. If a pinned authority cannot be read/executed operationally ⇒ `RegistryResolutionFailed` or the relevant execution failure code (`CanonicalizationFailed`, `AdmissionProofFailed`).

### 13.1 Mutually consistent authorities

| Condition | Result |
|-----------|--------|
| Authorities exist and are readable, but declared versions/dependencies are mutually incompatible so no valid complete snapshot can be constructed | `MissingAuthority` (absence of a valid authority set; **not** an operational read failure) |
| A known Accepted authority cannot be read due to operational failure | `RegistryResolutionFailed` |

### 13.2 Admission Authority Selection Authority

**Name:** Admission Authority Selection Authority.

**Responsibility:** Derive the complete mandatory authority set via:

`RequiredAuthorities(candidateType, schemaVersion, repositoryOperation, producerIdentity, explicitFeatures)`

before S5 completes.

**Status:** Currently unresolved / not Accepted. This name does **not** mark any new document Accepted. It is a required future authority, not an implementation module.

**Rules:**

1. The Admission Authority Selection Authority itself **MUST** be Accepted, version-pinnable, and included in `authoritySnapshot`.
2. Without it, S5 returns `MissingAuthority`.
3. Idempotency/replay authorities are mandatory **only** when this Accepted selection rule classifies them as required for that exact operation.
4. Proposed registries are **not** Accepted authority and **MUST NOT** be used as if Accepted.

### 13.3 Authority table (summary)

| Authority | If unavailable |
|-----------|----------------|
| Admission Authority Selection Authority | `MissingAuthority` |
| Type + schema recognition + operation authorization | `MissingAuthority` |
| Canonicalization/hash (OQ-A2) | `MissingAuthority` |
| Proof integrity/issuer (OQ-A4) | `MissingAuthority` |
| Producer-policy (as included in `RequiredAuthorities(...)` by the pinned Admission Authority Selection Authority) | `MissingAuthority` (direct Accepted-ADR ban remains S5-A `PolicyViolation` per §6.6) |
| Identity-format (as included in `RequiredAuthorities(...)` by the pinned Admission Authority Selection Authority) | `MissingAuthority` |
| Prior-observation (supersede) | `MissingAuthority` |
| Lifecycle ops (lifecycle intents) | `MissingAuthority` |
| Identity minting (only if requested) | `MissingAuthority` |
| Size/resource limits | Blocks implementation authorization; not automatic MissingAuthority for all candidates |
| Normalization (as included in `RequiredAuthorities(...)` by the pinned Admission Authority Selection Authority) | `MissingAuthority` at S5-C |

---

## 14. Lifecycle and deletion rules

| Case | Behaviour |
|------|-----------|
| Create | `active`, no `deletedAt`, no `supersedesRecordId` → proof for `PersistAdmitted` (only if S5–S11 succeed) |
| Patch/update without supersede | `LifecycleViolation` |
| Supersede | §7.3 + §12.2; proof for `Supersede` |
| Soft delete / tombstone / disputed / archived / restore | `MissingAuthority` until lifecycle authority |
| Legal erasure / purge | Outside until future Accepted ADR/spec |
| Duplicate identity at persist | Repository `Conflict` |

---

## 15. Concurrency, idempotency, and replay

1. Multiple `AdmissionProof` instances **MAY** be issued for the same candidate or identity before persistence, provided each is valid and bound to its exact evaluation context (§10.6).
2. Admission does **not** decide persistence winner ordering and **MUST NOT** invent locks or reservation semantics.
3. A second valid proof does **not** imply a second successful persistence.
4. Repository remains final authority for identity conflict, predecessor conflict, stale write, already-persisted equivalent record, and supersession conflict (Repository Contract `Conflict` / idempotent replay).
5. `DuplicateOrReplay` is **not** used for ordinary concurrent valid proofs.
6. If proof single-use semantics are later required, they **MUST** come from an Accepted proof/replay authority classified as required by the Admission Authority Selection Authority.
7. On Repository rejection: report Repository result; **MUST NOT** silently mutate candidate, auto-regenerate proof, or retry with changed authority versions. Fresh evaluation requires an explicit new request.

### 15.1 Deterministic concurrency / retry matrix

| Case | Behaviour |
|------|-----------|
| First persistence succeeds | Repository result governs; proof reuse follows Accepted replay rules |
| Exact same proof + exact same logical record submitted again | Repository Contract idempotent-equivalence or `Conflict` governs; Admission does not reinterpret |
| Repository timeout / unknown outcome | No automatic proof regeneration; caller **MAY** resubmit the identical handoff package; fresh evaluation requires explicit new request; changed `authoritySnapshot` requires a new proof |
| Two valid proofs for same candidate before persistence | Both may exist; Repository decides persistence outcome |
| Same identity, different payload | Repository `Conflict` or operation-specific Repository result |
| Same idempotency key, different payload | If no Accepted idempotency authority governs (selection rule did not require one): key has no semantic effect. If an Accepted authority governs: use its single deterministic mapping. Do not invent one here. |
| Same proof under different account | Repository: `AdmissionInvalid` |
| Same proof for different operation | Repository: `AdmissionInvalid` |
| Stale proof after authority drift | Repository: `AdmissionInvalid` by default under §10.5 |

---

## 16. Repository handoff

### 16.1 Handoff package

```text
AdmissionHandoffPackage / AdmittedBundle {
  accountUserId,
  record,                      // logical canonical MemoryRecord
  admissionProof,
  repositoryOperation,         // PersistAdmitted | Supersede
  priorId?,                    // required for Supersede
  authoritySnapshotIds,        // proof-bound snapshot identifiers
  correlationId
}
```

### 16.2 Handoff eligibility means

- **Not** persistence success
- **Not** identity reservation
- **Not** predecessor reservation
- **Not** a transaction
- Does **not** prevent concurrent valid handoffs

### 16.3 Caller / Repository

1. Caller invokes exactly `repositoryOperation` with bound fields; **MUST NOT** alter record or substitute proof.
2. Repository verifies per §10.4–§10.5 and Repository Contract §19–§20; **MUST NOT** repair/admit/migrate/invent proofs.
3. Verification failure ⇒ no canonical mutation.

---

## 17. Migration and backward compatibility

1. Legacy proofless records: out of scope; no automatic backfill.
2. Proof regeneration / re-admission / imports: require future Accepted migration authority + explicit implementation approval.
3. No grandfathering bypass.

---

## 18. Audit and observability

Mandatory events: `admission.evaluation.started`, `admission.stage.rejected`, `admission.proof.issued`, `admission.handoff.ready`, `admission.proof.verify.failed`.

Rules: correlation id required; audit **MUST NOT** create MemoryRecords; redact sensitive payloads; metrics **MUST NOT** include raw payloads or integrity secrets. Retention details: OQ-A10.

---

## 19. Security and privacy

Untrusted input; oversized input under pinned limit ⇒ `MalformedInput`; cross-account isolation; proof forgery/replay via integrity + bindings; no sensitive external diagnostics; rejected payloads not retained by default (OQ-A10).

---

## 20. Coding gate

Coding, operational admission runtime, and persistence implementation remain **blocked** until:

1. This Admission Pipeline Specification is **Accepted** — **satisfied** (Accepted 2026-07-24, v0.1.3);
2. Required registries/lifecycle/policy/**canonicalization (OQ-A2)**/**proof integrity (OQ-A4)**/Admission Authority Selection Authority/prior-observation/identity-format authorities for the **implementation scope identified by the explicit implementation approval** are **Accepted**;
3. **Explicit implementation approval** is issued;

and Accepted Repository Contract gates remain satisfied.

Governance acceptance of this specification alone does **not** authorize coding. ADR-0011 implementation authorization remains inactive. Producer wiring remains blocked on producer contracts.

---

## 21. Testable invariants

1. No persistence eligibility without valid `AdmissionProof`.
2. For a candidate not already terminated by S5-A direct Accepted-ADR prohibition or S5-B intent/operation mismatch, missing OQ-A2 or OQ-A4 authorities causes S5-C `MissingAuthority`; no proof.
3. `UnsupportedSchemaVersion` occurs only under pinned type+schema authorities (one trigger).
4. Account mismatch (envelope vs record) never yields proof.
5. ValidateCandidate never authorizes persistence or handoff.
6. Canonical logical record reproduces proof-bound hash under bound authority.
7. No partial admission; no silent Proposed-registry fallback.
8. Concurrent proofs allowed; Repository decides persist conflicts.
9. Julia / Conversation / Ask auto-save: direct Accepted-ADR prohibition ⇒ S5-A `PolicyViolation` (does not require OQ-A2/A4). Non-prohibited candidates with missing OQ-A2/A4 ⇒ S5-C `MissingAuthority`.
10. Create proofs never authorize `supersedesRecordId`; supersede proofs require prior observation authority.
11. ResolvePriorRecord never returns `AccountScopeMismatch`; `NotFound` ⇒ `BrokenReference`.
12. Non-empty identity is not rejected for undefined format rules without pinned identity-format authority.
13. No candidate may reach authority-set derivation (S5-C), canonicalization, proof issuance, or Repository handoff when `intent` and `repositoryOperation` disagree.

---

## 22. Acceptance criteria (satisfied for this specification)

This document is **Accepted** (2026-07-24) at v0.1.3. Acceptance criteria that were required for governance ratification:

1. S5 precedence (§6.6.1) and intent/`repositoryOperation` binding (§6.5) are internally consistent.
2. Success path is explicitly fail-closed while OQ-A2/A4 unresolved for non-prohibited candidates.
3. Error taxonomy has one primary per condition with precedence tables.
4. Repository Contract PersistAdmitted/Supersede not weakened.
5. Coding gate remains inactive.
6. Remaining OQs are classified (§23).

Acceptance still does **not** authorize coding or operational admission success until mandatory authorities exist and explicit implementation approval is issued.

---

## 23. Open questions (classified)

| ID | Classification | Affected stage | Fail-closed | Proof issuance? | Repo verify? | Spec Acceptable while unresolved? |
|----|----------------|----------------|-------------|-----------------|--------------|-----------------------------------|
| OQ-A1 | Blocks minting success only; caller-supplied non-empty primitive ids OK pending format authority | S5/S2 | `MissingAuthority` if mint requested | Yes if non-empty caller id and format path satisfied | Yes | **Yes** |
| OQ-A2 | **Blocks all proof-backed admission success** | S5/S10/S11 | `MissingAuthority` | **No** | **No** (no proofs) | **Yes** (fail-closed success path) |
| OQ-A3 | Blocks implementation authorization where identity-format validation is included in `RequiredAuthorities(...)`; non-empty ids are not format-rejected without a pinned identity-format authority | S5/S6 | Format authority missing when included in `RequiredAuthorities(...)` ⇒ `MissingAuthority`; pinned reject ⇒ `ValidationFailed` | Depends | Depends | **Yes** |
| OQ-A4 | **Blocks all proof issuance and repository verification** | S5/S11/Verify | `MissingAuthority` | **No** | **No** | **Yes** (fail-closed success path) |
| OQ-A5 | Blocks time-dependent rules only | S5/S9 | `MissingAuthority` if a time-dependent rule is included in `RequiredAuthorities(...)` without an Accepted clock authority | Non-time path yes (once A2/A4 exist) | Yes | **Yes** |
| OQ-A6 | Blocks offline-account scenarios only | S4/S5 | If offline operation requires Accepted offline-account authority and none exists ⇒ `MissingAuthority`. If offline operation is not requested ⇒ OQ-A6 has no effect | Online path unaffected | Yes | **Yes** |
| OQ-A7 | Non-blocking unless Admission Authority Selection Authority classifies idempotency/replay as mandatory for the exact operation | — | Per Accepted idempotency authority if classified mandatory | Unaffected otherwise | Unaffected | **Yes** |
| OQ-A8 | Blocks implementation authorization for untrusted runtime input; not governance acceptance | S0 | After Accepted limit: `MalformedInput` | Unaffected pre-impl | Unaffected | **Yes** |
| OQ-A9 | Future reuse allowances / invalidation refinement; until resolved, §10.5 default fail-closed `AdmissionInvalid` applies | Verify | `AdmissionInvalid` | Unaffected | Yes (default) | **Yes** |
| OQ-A10 | Blocks production privacy authorization; not pipeline semantics | Audit | N/A | Unaffected | Unaffected | **Yes** |
| OQ-A11 | Non-blocking; in-process persist default **prohibited** | AdmitCandidate | N/A | Unaffected | Unaffected | **Yes** |

Unresolved items **MUST NOT** be silently closed by implementers.

---

## 24. Non-goals

- Selecting storage engines, HTTP APIs, or L2 services
- Elevating Proposed registries
- Authorizing producer wiring, Julia memory, Ask auto-save, conversation memory
- Automatic migration/backfill
- Weakening Repository Contract PersistAdmitted/Supersede
- Authorizing coding by drafting or correcting this document
- Inventing repository locks or second persistence paths
- Marking the Admission Authority Selection Authority Accepted by naming it

---

## 25. References

- [ADR-0010](../adr/ADR-0010-Canonical-Memory-Graph-and-Personal-Intelligence-Memory-Boundaries.md)
- [ADR-0011](../adr/ADR-0011-CMG-L1-Client-Runtime-Authorization.md)
- [ADR-0007](../adr/ADR-0007-Conversation-API-Contract-v1.md)
- [CMG-REPOSITORY-CONTRACT-SPECIFICATION.md](./CMG-REPOSITORY-CONTRACT-SPECIFICATION.md) (Accepted v0.3.1)
- [CMG-SPECIFICATION-DEPENDENCY-MAP.md](./CMG-SPECIFICATION-DEPENDENCY-MAP.md)
- [CMG-MEMORY-TYPE-DOMAIN-REGISTRY.md](./CMG-MEMORY-TYPE-DOMAIN-REGISTRY.md) (Proposed)
- [CMG-RELATIONSHIP-EDGE-TAXONOMY.md](./CMG-RELATIONSHIP-EDGE-TAXONOMY.md) (Proposed)

---

## Document control

| Version | Date | Notes |
|---------|------|-------|
| 0.1.0 | 2026-07-24 | Initial governance draft |
| 0.1.1 | 2026-07-24 | Deterministic authority/proof/canonicalization correction |
| 0.1.2 | 2026-07-24 | Final architecture correction for operation and authority closure |
| 0.1.3 | 2026-07-24 | S5 precedence and intent/Repository-operation binding correction |
| 0.1.3 | 2026-07-24 | **Accepted** by Product Owner ratification — coding still not authorized |

**End of specification.**

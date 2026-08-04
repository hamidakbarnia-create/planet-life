# METIORO Architecture Consolidation Resolution

| Field | Value |
|-------|-------|
| **Document** | Architecture Consolidation Resolution (ACR) |
| **ID** | ACR-0001 |
| **Version** | 1.0.0 |
| **Status** | **RATIFIED** — binding |
| **Date** | 2026-08-04 |
| **Board** | Architecture Consolidation Board |
| **Purpose** | Eliminate contradictions that block implementation readiness |
| **Scope** | Authority, primary object, evaluation pathway, contracts, state, repository, evidence, migration |
| **Non-scope** | New features, UX redesign, prompt design, product expansion |

---

## 0. Board Mandate and Verdict Target

**Architecture direction:** PASS (unchanged).
**Implementation readiness target after this resolution:** PASS.

This document is the **conflict-resolution authority** for the Decision Operating System architecture. Where two previously “canonical” documents disagree on any matter covered here, **this resolution wins**, and the losing document must be amended to conform or marked superseded for that matter.

No new product capabilities are introduced. Abstractions that are not essential are demoted or deleted as competing authorities.

### Success criteria (normative)

After ratification of this resolution and completion of Required Amendments (§9):

1. Exactly one authority hierarchy.
2. Exactly one primary object: **Decision Case**.
3. Exactly one evaluation pathway for decision-bearing output.
4. Exactly one **Decision Evaluation Contract**.
5. Exactly one Decision Case state machine.
6. Exactly one repository model (system of record).
7. Exactly one evidence eligibility model for recommendations.
8. Deterministic governance: conflict → higher document wins; no dual ownership.
9. Five independent engineering teams can implement compatible systems from ratified artifacts without interpretation.

---

## B1 — Architecture Authority Hierarchy

### B1.1 Current contradiction

Multiple documents claim sole or binding authority while remaining Draft/Review/unregistered:

- METIORO Constitution (supreme, but Review / not Accepted)
- Product Constitution (Draft, “binding” product law)
- PDOS Blueprint (Draft, “canonical product blueprint”)
- Decision Intelligence Engine (Draft, “sole authoritative conceptual specification” of the engine)
- Explainability Engine / Evidence Pipeline (exclusive claims over overlapping concerns)
- DQS (Draft ship gates)
- LOCKED ADR-0006 / ADR-0007 (bind runtime today; predate Decision Case model)
- DOCUMENT_HIERARCHY does not register Product Constitution, DQS, or PDOS Blueprint

### B1.2 Canonical resolution — single hierarchy

```
L0  METIORO Constitution
      ↓
L1  Product Constitution · Trust Architecture · Brand Identity Standard
      ↓
L2  Architecture Consolidation Resolution (this document)     ← conflict resolver for OS architecture
      ↓
L3  Decision Operating System Blueprint (elaborates; cannot contradict ACR)
      ↓
L4  Decision Intelligence Engine + Evidence Pipeline + Explainability Engine
      (engine internals; cannot contradict ACR or Blueprint object model)
      ↓
L5  ADRs (engineering locks; must conform to ACR; supersede prior locks on conflict)
      ↓
L6  Standards: Decision Quality Standard · Evidence Registry · Legal & Compliance
      (DQS Parts 5–6 are the Safety and Language standards until extracted)
      ↓
L7  Product requirements / sprint scope (PRD-class)
      ↓
L8  Implementation
      ↓
L9  Tests
      ↓
L10 Deployments
```

### B1.3 Conflict rules (deterministic)

| Conflict | Winner |
|----------|--------|
| Any doc vs METIORO Constitution (identity, agency, Never Mystical, category) | Constitution |
| Product laws vs Blueprint elaborations | Product Constitution |
| Object model / pathway / contract / state / repository / evidence eligibility vs any lower doc | **ACR (this document)** |
| Blueprint vs DIE stage naming | ACR stage map (§B7); Blueprint product stages map into DIE |
| ADR vs ACR on decision-bearing behavior | **ACR**; ADR must be superseded/amended |
| DQS scoring vs Evaluation Contract module set | Contract module set owned by ACR; DQS scores compliance to that contract |
| Explainability Engine component list vs Evaluation Contract `explainability` module | Evaluation Contract fields are normative for ship; Explainability Engine elaborates assembly |

### B1.4 Sole-authority language — deleted as competing

Phrases of the form “sole authoritative specification of X” in DIE / Explainability / Evidence Pipeline / Blueprint are **reinterpreted** as:

> Sole authoritative specification of *its named concern within its layer*, subordinate to ACR and all higher layers.

They may not redefine Decision Case, Evaluation Contract, pathway exclusivity, or repository ownership.

### B1.5 Affected documents / required amendments

| Document | Amendment |
|----------|-----------|
| `DOCUMENT_HIERARCHY.md` | Register ACR, Product Constitution, PDOS Blueprint, DQS at stated levels; publish conflict table pointer to ACR |
| `METIORO_DECISION_OPERATING_SYSTEM_BLUEPRINT.md` | Status note: subordinate to ACR; remove competing “canonical over engine pathway” claims where conflicting |
| `DECISION_INTELLIGENCE_ENGINE.md` | Subordinate sole-authority claim; map Decision Request → Case invocation |
| Decision Quality Standard (draft/future; not in repository baseline) | When accepted into the baseline, bind Part 7 to ACR Evaluation Contract module IDs |
| Product Constitution | Cite ACR as object-model authority for Case/pathway |
| ADR Index | Point ADR-0014 as consolidation ADR |

### B1.6 Migration impact / risk

| | |
|--|--|
| **Migration impact** | Documentation/governance first; no runtime change until ADR-0014 phases |
| **Risk if skipped** | Dual governance returns; ARB FAIL persists |

---

## B2 — Primary Object

### B2.1 Current contradiction

Competing “primary” units:

| Object | Source |
|--------|--------|
| Decision Case | Product Constitution, PDOS Blueprint |
| Decision Request / Outcome Package | DIE |
| ExecutableDecisionRequest / summary result | ADR-0006 |
| Conversation message + AskDecisionResult | ADR-0007, Ask V3 |
| Decision Value → Reading | ADR-0013, PRG-04, Reading Contract |

### B2.2 Canonical resolution

**Exactly one primary object and system of record: Decision Case.**

All other objects are classified as follows. No second owner of decision lifecycle state.

| Former competitor | New role | May emit decision-bearing recommendation? |
|-------------------|----------|-------------------------------------------|
| **Decision Case** | System of record | N/A (owns evaluations) |
| Decision Request (DIE) | **Engine invocation view** derived from a Case + mode | Only via engine on that Case |
| Decision Outcome Package | **Retired name** → **Decision Evaluation Package** (ACR contract) | Package is the evaluation output |
| ExecutableDecisionRequest (ADR-0006) | **Transport adapter** into Case evaluation (compat) | Only if it creates/addresses a Case and returns Evaluation Package |
| Decision API `summary` | **Compat projection** of Evaluation Package (lossy; non-normative for quality) | Must not be sole decision-bearing UI source after M2 |
| Conversation `message` | **Assist transport** / non-decision chat | **No** after M2 for recommendations |
| Conversation `type=decision` | **Deprecated decision-bearing channel** | Migration only; must embed or link Evaluation Package |
| AskDecisionResult | **Compatibility view** over Evaluation Package | View only; not SoR |
| Decision Value | **Context-fitness signal** (producer input to evidence/context) | **No** — not a recommendation |
| Reading / Reading Contract | **Presentation envelope** for readings; if decision-bearing, **must embed** Evaluation Package reference | Envelope only |
| Local timing (Ask) | **Evidence/signal producer** consumed by engine | **No** independent recommendation |

### B2.3 Ownership matrix (no dual ownership)

| Concern | Owner |
|---------|-------|
| Case identity, lifecycle state | Decision Case Repository |
| Evaluation versions | Decision Case Repository (immutable versions) |
| Recommendation stance | Decision Intelligence Engine → Evaluation Package |
| Presentation formatting | Experience layer (must not alter stance/evidence) |
| Conversation text | Conversation transport (non-SoR) |
| Decision Value band | Decision Value producer (signal only) |

### B2.4 Affected documents / amendments

| Document | Amendment |
|----------|-----------|
| ACR (this) | Normative |
| Product Constitution | Align vocabulary to demotion table |
| Blueprint §2 | Replace competing object language with demotion table |
| DIE §5.1–5.9 | Decision Request = invocation view; Outcome Package → Evaluation Package |
| ADR-0013 | Explicit: Decision Value is not recommendation SoR; cannot bypass Case engine |
| Ask V3 reconciliation | AskDecisionResult = compat view |
| ADR-0006 / 0007 | See B7/B8 and ADR-0014 |

### B2.5 Migration impact / risk

| | |
|--|--|
| **Migration impact** | Compat views remain during M1–M3; SoR writes move to Case repository |
| **Risk if skipped** | Parallel products permanently |

---

## B3 — Decision Evaluation Contract (one output contract)

### B3.1 Current contradiction

| Source | Modules / shape |
|--------|-----------------|
| Blueprint §13 | Recommendation, Timing, Confidence, Drivers, Risks, Tradeoffs, Opportunities, Action Plan, Counter, Why, Improve Accuracy, Next Decision, Related |
| DQS Part 7 | Recommendation, Timing, Confidence, Evidence, Drivers, Trade-offs, Risks, Opportunities, Action Plan, Improve Accuracy, Related, Explainability, Counter |
| DIE | Recommendation + Explanation (4 dims) + Uncertainty + Evidence traceability → Outcome Package |
| Explainability Engine | Six components including Alternatives, Sensitivity |
| ADR-0007 decision | message, reasoning, uncertainty, sources |
| ADR-0006 | summary |

### B3.2 Canonical resolution — Decision Evaluation Contract v1

**Normative name:** `DecisionEvaluationPackage`
**Retired aliases (forbidden in new work):** Decision Outcome Package, AskDecisionResult (as SoR), “answer”, Output Contract (informal only)

**Module order is fixed.** Modules may be `N/A` only when mode rules allow; `N/A` must be explicit.

| # | Module ID | Required content | Notes |
|---|-----------|------------------|-------|
| 1 | `recommendation` | Stance + conditions | Stances: `proceed` \| `proceed_with_conditions` \| `wait` \| `prefer_alternate` \| `insufficient_data` |
| 2 | `timing` | Band/score and/or rank/window | `N/A` only if timing not material to Case mode |
| 3 | `confidence` | 0–100 + precision level + penalty list | Separate from DES |
| 4 | `evidence` | Eligible evidence refs + limits + eligibility states | See B6 |
| 5 | `drivers` | Family driver scorecard | |
| 6 | `tradeoffs` | Material gain/loss pairs | |
| 7 | `risks` | Material downsides | |
| 8 | `opportunities` | Material upsides | |
| 9 | `action_plan` | Sequenced executable steps | |
| 10 | `counter_recommendation` | Distinct alternate + reason | |
| 11 | `explainability` | `why`, `why_not`, `assumptions`, `limits` | Absorbs Blueprint `Why`; satisfies DIE explanation dims; Alternatives map to `why_not` + `counter_recommendation`; Sensitivity may elaborate `limits` |
| 12 | `improve_accuracy` | Concrete missing inputs | |
| 13 | `next_decisions` | 0–3 suggested subsequent Cases | From Blueprint |
| 14 | `related_decisions` | Graph neighbors or explicit none | |

**No duplicate modules. No aliases for module IDs.**

DQS Part 7 is amended to use these module IDs exactly. Blueprint §13 is amended to the same table. DIE Outcome Package is this package.

### B3.3 Lossy projections (non-normative)

| Projection | Allowed use | Forbidden use |
|------------|-------------|---------------|
| ADR-0007 `reasoning`/`uncertainty`/`sources` | Compat extract from `explainability`/`confidence`/`evidence` | Sole quality authority |
| ADR-0006 `summary` | Compat one-paragraph extract from `recommendation` + `action_plan` | Sole UI decision surface after M2 |
| AskDecisionResult | Field mapping onto package | Independent schema evolution as SoR |

### B3.4 Affected documents / amendments

| Document | Amendment |
|----------|-----------|
| Blueprint §13 | Replace with Contract v1 table |
| DQS Part 7 | Replace with Contract v1 module IDs |
| DIE §5.9 | Rename; define as Contract v1 |
| Explainability Engine | Map components → `explainability` + related modules |
| ADR-0014 | Transport must carry or reference Contract v1 for decision-bearing |

### B3.5 Migration impact / risk

| | |
|--|--|
| **Migration impact** | Compat projections during migration; validators enforce Contract v1 on Case evaluations |
| **Risk if skipped** | DQS unenforceable on wire |

---

## B4 — Decision Case State Machine

### B4.1 Current contradiction

Blueprint status list (`draft → briefed → evaluating → …`) differs from ADR-0006 (`unresolved`/`completed`) and Conversation (`decision`/`conversational`). No transition guards.

### B4.2 Canonical resolution — one lifecycle

**Normative states (only these):**

```
draft
  → intake
  → evidence_ready
  → evaluated
  → compared          (optional region; may skip)
  → planned
  → scheduled         (optional; may skip if not time-bound)
  → executing
  → completed
  → reflected
  → archived
```

**Side states (terminal or parking):** `paused`, `superseded`, `rejected`

### B4.3 Transition table (normative)

| From | To | Guard (minimum) |
|------|----|-----------------|
| draft | intake | Case created with `decision_type_id` or classification pending flag |
| intake | evidence_ready | Required intake slots satisfied or soft-gap accepted with recorded penalties |
| evidence_ready | evaluated | Engine produced Contract v1 package version `n`; DQS hard gates pass or explicit `insufficient_data` stance |
| evaluated | compared | Compare/find/simulate mode artifacts saved |
| evaluated | planned | User or system commits action plan from package (user agency preserved) |
| compared | planned | Plan committed |
| planned | scheduled | Time bound set on calendar/timeline |
| planned | executing | Execution started without schedule |
| scheduled | executing | Execution started |
| executing | completed | User-declared completion (system does not invent) |
| completed | reflected | Reflection recorded or skip timer policy fires with empty reflection allowed |
| reflected | archived | Archive action |
| * | paused | User pause |
| paused | prior active | Resume |
| * | superseded | New Case replaces |
| * | rejected | User rejects Case |

**Forbidden:** alternate lifecycles; conversation status as Case status; API `completed` meaning Case completed without Case state transition.

### B4.4 Evaluation versioning

Each engine run appends immutable `evaluation_version` under the Case. State `evaluated` means ≥1 package exists. Re-run does not mutate prior versions.

### B4.5 Affected documents / amendments

| Document | Amendment |
|----------|-----------|
| Blueprint §2.1 status model | Replace with this state machine |
| New: referenced by repository (§B5) | Normative home remains ACR until State Machine extracted |
| ADR-0006 | `completed` = request processing done ≠ Case `completed` |

### B4.6 Migration impact / risk

| | |
|--|--|
| **Migration impact** | Map existing Ask saves → `draft`/`evaluated` best-effort; no silent `completed` |
| **Risk if skipped** | Lifecycle remains rhetorical |

---

## B5 — Repository Model (system of record)

### B5.1 Current contradiction

Product Constitution requires Decision Case as SoR. No repository ownership. Ask saves to local presentation storage. CMG is memory, not Case SoR.

### B5.2 Canonical resolution

**Decision Case Repository** is the only system of record for decision work.

#### Owned aggregates

| Aggregate | Contents |
|-----------|----------|
| **DecisionCase** | Identity, type/family, domain, state, precision level, stakes/urgency, constraints |
| **CaseVersion** | Schema/version metadata for Case body revisions |
| **History** | Append-only state transitions + actor + timestamp |
| **IntakeRecord** | Slot answers, missing_info, soft-gap acceptances |
| **EvidenceBinding** | Evidence refs + eligibility state per B6 |
| **Evaluation** | Immutable `DecisionEvaluationPackage` versions |
| **Simulation** | Saved counterfactuals / compare matrices |
| **Plan** | Committed action plan + conditions |
| **Schedule** | Timeline/calendar bindings |
| **ExecutionLog** | Step statuses (user-declared) |
| **Outcome** | Declared outcome |
| **Reflection** | Structured reflection |
| **PeopleBindings** | Person refs + roles on Case |
| **Timeline** | Derived view from schedule + evaluations + execution |
| **GraphEdges** | depends_on / blocks / related / competes_for (may be empty in M1) |

#### Non-owned (must not pretend to be Case SoR)

| Store | Role |
|-------|------|
| Conversation transcripts | Assist logs |
| AskDecisionResult caches | Compat views |
| CMG MemoryRecord | Personal intelligence memory (ADR-0010); may *feed* evidence, not replace Case |
| localStorage presentation caches | Ephemeral UX cache only |

### B5.3 Persistence rule

Every persistent decision object **must** belong to a Case aggregate or be an explicit graph edge between Cases. Orphan decision recommendations are forbidden.

### B5.4 Affected documents / amendments

| Document | Amendment |
|----------|-----------|
| ACR | Normative |
| Blueprint §9 Workspace | Workspace reads Repository; is not SoR |
| ADR-0010 | Clarify CMG ≠ Case Repository |
| Ask V3 vault/local save | Demote to cache; migration copies into Repository |

### B5.5 Migration impact / risk

| | |
|--|--|
| **Migration impact** | Introduce Repository before cutting over UI SoR reads (B8 checkpoints) |
| **Risk if skipped** | Chat/localStorage remains de facto SoR |

---

## B6 — Evidence Model

### B6.1 Current contradiction

DIE requires registered evidence for decision-bearing claims. Evidence Registry has **zero** approved entries. ADR-0007 allows decision responses with `sources: []`.

### B6.2 Canonical resolution

#### Evidence Registry authority

`docs/governance/EVIDENCE_REGISTRY.md` is the **only** authority for framework registration and quality levels.

No recommendation claim may cite a framework not registered, except under **Provisional** rules below during migration.

#### Eligibility states (normative — exactly these)

| State | Meaning | May support decision-bearing claims? |
|-------|---------|--------------------------------------|
| **supported** | Registered, validated, in-scope, quality gate passed | Yes |
| **partial** | Registered but incomplete coverage for this Case | Yes, with mandatory confidence penalty |
| **unknown** | Relevance not yet determined | No (block claim use) |
| **unavailable** | Known needed, not obtainable now | No; must appear in `improve_accuracy` / penalties |
| **provisional** | Explicit migration/governance allowance for a named framework/version | Yes, **only** if Evaluation Package marks claims provisional and Confidence capped |
| **rejected** | Failed validation or ineligible | No |

#### Hard rules

1. No recommendation may claim **supported** evidence it does not have.
2. Invented evidence → hard block (DQS F07).
3. Empty evidence with non-`insufficient_data` stance → hard block after M2.
4. During M1 only: `provisional` allowed for explicitly listed transitional signals (timing engine outputs, birth-profile features) until registered — must be labeled provisional in package.
5. ADR-0007 `sources: []` decision responses are non-compliant after M2.

### B6.3 Minimum registration obligation (not new product — governance)

Before M2 exit: register the minimum frameworks actually used for Case evaluation (timing signals, natal/profile features as applicable) or stop using them for decision-bearing claims.

### B6.4 Affected documents / amendments

| Document | Amendment |
|----------|-----------|
| Evidence Registry | Add eligibility state vocabulary; provisional policy pointer to ACR |
| DIE Evidence Intake | Use eligibility states |
| DQS Evidence Strength | Score against eligibility states |
| ADR-0007 | Supersede empty-sources decision path (ADR-0014) |

### B6.5 Migration impact / risk

| | |
|--|--|
| **Migration impact** | M1 provisional caps; M2 requires registration or stance `insufficient_data` |
| **Risk if skipped** | Constitutional Evidence Before Opinion remains violated |

---

## B7 — One Evaluation Pathway

### B7.1 Current contradiction

Ask V3 (Conversation + local timing + client assembly), Decision API execute, future Decision Value Engine, and DIE pathway all can influence action advice.

### B7.2 Canonical resolution

```
Surface intent
  → create or select Decision Case (Repository)
  → Adaptive Intake / evidence bind
  → Decision Intelligence Engine (only evaluator)
  → DecisionEvaluationPackage v1 (immutable version)
  → Experience presents package (DQS gated)
```

**No parallel evaluation engines. No client-side stance invention.**

### B7.3 Surface classification

| Surface | Creates / mutates Cases? | Evaluates? | Consumes packages? |
|---------|--------------------------|------------|--------------------|
| Decide / Ask (target) | Yes | No (invokes engine) | Yes |
| Decision API | Yes (adapter) or evaluate existing | Invokes engine only | Returns package (or compat projection in M1) |
| Conversation API | May assist intake text only | **No** after M2 | May reference Case/package IDs |
| Calendar | May create/schedule Cases; contributes timing signals | No | Yes (timeline/windows) |
| Today | Triage/actions on Cases | No | Yes |
| Voice (future) | Yes (intake/create) | No | Yes |
| Agents (future) | May propose Case updates under policy | No | Yes (watch/rescan invoke engine) |
| Decision Value producer | No | No | Provides signals only |
| Reading consumers | No | No | Display only; embed package if decision-bearing |

### B7.4 Engine stage map (normative consolidation)

Product Blueprint stages **map into** DIE pathway — they are not a second engine.

| DIE stage | Blueprint elaborations (same pathway) |
|-----------|----------------------------------------|
| Decision Request | Built from Decision Case |
| Context Assembly | Context Builder + Constraint + Dependency |
| Evidence Intake | Evidence Layer + eligibility states |
| Evaluation | Timing + Natal + Drivers + Simulation/Risk/Tradeoff as evaluation substeps |
| Recommendation Formation | Planner + Recommendation Engine (deterministic stance rules) |
| Explainability Assembly | Constrained language fill of `explainability` (+ other text modules) under Formatter |
| Decision Evaluation Package | Contract v1 |
| Feedback | Outcome/Reflection learning signals |

Generative components may fill text fields **after** deterministic stance/drivers/confidence exist. They may not create stance.

### B7.5 Affected documents / amendments

| Document | Amendment |
|----------|-----------|
| Blueprint §7 pipeline | Label as elaboration of DIE, not peer engine |
| Ask V3 | Remove client recommendation authority; invoke Case engine |
| ADR-0013 | Signals only |
| ADR-0014 | Pathway enforcement on APIs |

### B7.6 Migration impact / risk

| | |
|--|--|
| **Migration impact** | See B8; Ask client assembly deprecated |
| **Risk if skipped** | One Pathway remains slogan |

---

## B8 — Migration Strategy (no flag day)

### B8.1 Current contradiction

Locked ADR-0006/0007 implement a world without Decision Case SoR. New architecture cannot replace them overnight without product break.

### B8.2 Canonical resolution — phased transition

```
M0 Governance lock
  → M1 Compat dual-write
  → M2 Pathway enforcement
  → M3 Compat read teardown
  → M4 ADR supersession complete
```

#### M0 — Governance lock (docs only)

- Ratify ACR + ADR-0014 (pathway/contract/state/repo/evidence).
- Amend DOCUMENT_HIERARCHY.
- Freeze Evaluation Contract v1 module IDs.
- **Checkpoint:** ARB may re-score docs; coding of Case Repository authorized only after M0.

#### M1 — Compat dual-write

- Implement Decision Case Repository + engine emission of Contract v1.
- Decision API and Ask **also** write Case + Evaluation Package when producing decision-bearing output.
- Continue ADR-0006/0007 response shapes as **lossy projections**.
- Evidence may be `provisional` with caps.
- **Checkpoint:** Every new decision-bearing response has `case_id` + `evaluation_version`.

#### M2 — Pathway enforcement

- Conversation `type=decision` without package reference = reject.
- Client-side Ask assembly cannot invent stance; may only display package.
- Empty `sources` / unsupported evidence claims = reject.
- UI decision surfaces read from Repository packages.
- **Checkpoint:** DQS hard gates run on Contract v1 server-side.

#### M3 — Compat read teardown

- UI stops using summary/message as SoR.
- AskDecisionResult becomes pure mapper from package (or deleted).
- localStorage decision saves = cache only.
- **Checkpoint:** No decision-bearing UI path lacks Case id.

#### M4 — ADR supersession complete

- ADR-0006 → v2 transport carrying Case id + Evaluation Package (or pointer).
- ADR-0007 → conversational assist only **or** explicit Case-linked package delivery; decision discriminator without package removed.
- ADR-0009 amended for Case context boundaries.
- ADR-0013 clarified signals-only (if still needed).
- **Checkpoint:** Implementation readiness PASS criteria met.

### B8.3 Supersession map

| ADR | Status under ACR | Action |
|-----|------------------|--------|
| ADR-0006 LOCKED | **Superseded in part** by ADR-0014 for decision-bearing semantics; wire v1 remains until v2 | Dual-write in M1; replace in M4 |
| ADR-0007 LOCKED | **Superseded in part** for decision-bearing authority | Assist-only or Case-linked by M2/M4 |
| ADR-0009 Accepted | Amend boundaries to Case Repository | M2–M3 |
| ADR-0013 Proposed | Constrain to signals; not parallel engine | M0 |

### B8.4 Backward compatibility

- Existing clients on ADR-0006/0007 continue through M1–M2 via projections.
- No flag-day schema break.
- Deprecation windows announced at M2 checkpoint.

### B8.5 Affected documents / amendments

| Document | Amendment |
|----------|-----------|
| ADR-0014 | Normative migration ADR |
| ADR Index | Record supersessions |
| Ask V3 reconciliation | Align to M1–M3 |
| MASTER_STATUS / sprint docs | Migration checkpoints only (ops) |

### B8.6 Migration impact / risk

| | |
|--|--|
| **Migration impact** | Controlled dual-write; longer calendar, lower break risk |
| **Risk if skipped** | Flag-day rewrite or permanent dual system |

---

## 9. Required Amendments Checklist (blocking)

These are **documentation/governance amendments**, not feature ideas:

1. Ratify ACR-0001 (this document).
2. Accept ADR-0014 (Decision Case SoR + pathway + migration).
3. Update `DOCUMENT_HIERARCHY.md` per B1.
4. Amend Blueprint §§2,7,13 to ACR.
5. Amend DIE §§5–6 naming + invocation view.
6. Amend DQS Part 7 module IDs to Contract v1.
7. Amend Evidence Registry eligibility states + provisional policy.
8. Record DEC entry for consolidation acceptance.
9. Mark Ask V3 / ADR-0013 alignment notes.

Coding of Repository/engine cutover **starts only after M0**.

---

## 10. Explicit deletions / demotions (complexity reduction)

| Removed as competing authority | Retained as |
|--------------------------------|-------------|
| Chat / Conversation as SoR | Assist transport |
| AskDecisionResult as domain SoR | Compat view |
| Decision Value as recommendation engine | Context-fitness signal |
| Reading as alternate decision pathway | Presentation envelope |
| Blueprint parallel “second engine” | Stage elaboration of DIE |
| Dual Output Contracts | One Contract v1 |
| Dual lifecycles | One state machine |
| “Sole authoritative” peer specs over Case model | Layered ownership under ACR |

---

## 11. Blocker Resolution Register

| Blocker | Current contradiction | Canonical resolution | Affected docs | Required amendments | Migration impact | Risk if ignored |
|---------|----------------------|----------------------|---------------|---------------------|------------------|-----------------|
| B1 | Multi hierarchy / unregistered binding drafts | Single L0–L10 hierarchy; ACR conflict resolver | Hierarchy, Constitution stack, DIE, Blueprint, DQS | §B1.5 | Docs-first | Dual governance |
| B2 | Many primary objects | Decision Case only; others demoted | Product Const, Blueprint, DIE, ADRs, Ask V3 | §B2.4 | Compat views | Parallel products |
| B3 | Multiple output contracts | DecisionEvaluationPackage v1 | Blueprint, DQS, DIE, Explainability, ADRs | §B3.4 | Projections | Ungated quality |
| B4 | Multiple lifecycles | One state machine | Blueprint, ADR-0006 | §B4.5 | State mapping | Rhetorical lifecycle |
| B5 | No SoR | Case Repository aggregates | Blueprint, CMG, Ask saves | §B5.4 | Build repo M1 | localStorage SoR |
| B6 | Empty registry vs required evidence | Eligibility states + provisional M1 + register-or-stop M2 | Evidence Registry, DIE, ADR-0007 | §B6.4 | Provisional caps | Unconstitutional claims |
| B7 | Parallel evaluators | Surfaces → Case → DIE only | Ask V3, APIs, ADR-0013, Blueprint | §B7.5 | M1–M2 cutover | Pathway bypass |
| B8 | Locked ADRs vs target | M0–M4 dual-write migration | ADR-0006/7/9/13, ADR-0014 | §B8.5 | Phased | Flag day or dual forever |

---

## 12. Ratification

Upon project owner acceptance:

1. Status of this document becomes **Accepted**.
2. Implementation readiness may be re-reviewed by ARB against ACR + M0 completion.
3. No lower document may reintroduce a second primary object, second evaluation pathway, or second output contract without amending ACR.

---

**End of Architecture Consolidation Resolution**

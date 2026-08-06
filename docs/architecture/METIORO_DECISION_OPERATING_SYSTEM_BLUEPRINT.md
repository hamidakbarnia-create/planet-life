# METIORO Decision Operating System — Canonical Product Blueprint

| Field | Value |
|-------|-------|
| **Status** | **LOCKED** — subordinate to ACR-0001 |
| **Version** | 1.0.1 |
| **Authority** | Product Architecture (subordinate to Constitution, Product Constitution, **ACR-0001**, Trust Architecture, DEC-0001/0004) |
| **Document type** | Product blueprint — conceptual only |
| **Horizon** | 5–10 years |
| **Date** | 2026-08-03 |
| **Supersedes (product framing)** | Question-centric Ask product model; chat-as-primary-object; Question Library as catalog metaphor |
| **Does not supersede** | Constitution; DEC-0001 category lock; **ACR-0001** (wins on Case/pathway/contract/state/repo/evidence); Evidence Registry |

> **Consolidation note (2026-08-04):** On conflict with [ARCHITECTURE_CONSOLIDATION_RESOLUTION.md](./ARCHITECTURE_CONSOLIDATION_RESOLUTION.md) (ACR-0001), ACR wins. Decision Evaluation Contract module IDs, state machine, repository ownership, and one evaluation pathway are defined in ACR — not independently in this blueprint. §13 Output Contract is superseded by ACR §B3 `DecisionEvaluationPackage` v1.

**Scope:** Product philosophy, object model, lifecycle, capability map, engine architecture, knowledge graph, workspace, timing, precision, learning, and future platform reuse.

**Out of scope:** UI mockups, prompts, code, APIs, schemas-as-implementation, vendor selection, scoring formulas-as-code.

---

## 0. Document Stance

This blueprint defines METIORO as a **Personal Decision Operating System (PDOS)**.

Constitutional category remains **Personal Decision Intelligence** (DEC-0001). PDOS is the product form of that category: not a content feed, not a chatbot, not an astrology entertainment surface — an operating system for creating, evaluating, executing, and learning from important personal decisions.

**Rule Zero.** Every capability must answer: *How does this improve the lifecycle of a Decision Case?* If it cannot, it does not ship.

**Primary object.** The `Decision Case` — not a conversation, not a reading, not a daily horoscope.

---

## 1. Product Philosophy

### 1.1 Mission

Help people make better personal decisions using structured reasoning, timing intelligence, natal context, explainable AI, and decision lifecycle management — while preserving full human agency.

### 1.2 Vision (5–10 years)

METIORO becomes the default operating environment for high-stakes personal decisions: the place where decisions are opened, briefed, evidenced, timed, compared, planned, executed, reflected upon, and reused — across web, mobile, voice, and agents — under one object model.

### 1.3 Core Principles

| ID | Principle | Meaning |
|----|-----------|---------|
| P1 | **Decision Case First** | Every surface creates, enriches, evaluates, or acts on Decision Cases. |
| P2 | **Structure Before Language** | Drivers, constraints, evidence, and plans exist before any generative prose. |
| P3 | **One Engine** | One Decision Intelligence pathway. Modules do not own parallel recommenders. |
| P4 | **Families Scale Types** | ~25–30 Families own reasoning; Types configure them. Never N prompt templates. |
| P5 | **Evidence Before Opinion** | Registered evidence only for decision-bearing claims. |
| P6 | **Explain or Do Not Recommend** | Opaque recommendations are architecturally prohibited. |
| P7 | **Progressive Precision** | Confidence tracks evidence completeness; never rhetorical certainty. |
| P8 | **Advisory Only** | METIORO recommends; the human decides. |
| P9 | **Lifecycle Continuity** | Evaluation is a stage, not the product. Execution, outcome, and learning are first-class. |
| P10 | **Graph Over Isolation** | Decisions compete for resources, time, and people; the system models that. |
| P11 | **Never Mystical** | No fate, prophecy, or entertainment astrology framing (DEC-0004). |
| P12 | **Delete Non-Lifecycle Work** | Features that do not improve Decision Case lifecycle are removed. |

### 1.4 Anti-Principles

| Anti-principle | Why banned |
|----------------|------------|
| Chat as primary metaphor | Trains ChatGPT expectations; dissolves structure |
| Narrative essays as answers | Low evaluability; high generic collapse |
| Question Library as catalog | Questions are ephemeral; decisions are durable |
| Module-owned recommenders | Fractures trust, consistency, and learning |
| Mystical / fate language | Category and trust violation |
| Outcome prophecy | Scientifically and constitutionally invalid |
| Generic coaching | Non-specific; non-explainable; non-premium |
| Feature accumulation without Case linkage | Product becomes a dashboard of orphan tools |
| Prompt-first product design | Produces brittle, non-scalable “intelligence” |
| Daily entertainment content as core loop | Competes with decision lifecycle attention |

### 1.5 Decision-First Philosophy

**Rejected assumption:** People ask questions.
**Replacement:** People manage decisions.

A question is a possible *entry signal*. A Decision Case is the *system of record*.

Analogies (structural, not brand):

| System | Primary object | METIORO analogue |
|--------|----------------|------------------|
| iOS | App + document continuity | Decision Case continuity across surfaces |
| Notion | Page / database row | Decision Case as workspace record |
| Bloomberg | Instrument + watchlist | Decision Case + portfolio |
| GitHub | Repository | Decision Case + history/versions |
| Figma | File + multiplayer | Decision Case + partner/family workspace |

### 1.6 Decision Lifecycle (summary)

Need → Creation → Adaptive Intake → Evidence → Evaluation → Comparison → Simulation → Planning → Execution → Outcome → Reflection → Learning → Archive → Reuse

Full specification: §3.

### 1.7 Human Agency

- Recommendations are advisory.
- Users may accept, modify, defer, reject, or archive.
- Execution status is user-declared unless explicitly integrated (future calendars/tasks) with consent.
- Learning never automates decisions without explicit user control.

### 1.8 Explainability

Every decision-bearing output must answer:

1. Why this recommendation?
2. Why not the alternative(s)?
3. What reduced confidence?
4. How can accuracy improve?
5. What is the next related decision?

### 1.9 Trust

Trust is not a module. It is a permanent constraint on every lifecycle stage: transparency, evidence governance, uncertainty honesty, privacy, purpose limitation, and accountability.

---

## 2. Unified Product Architecture

### 2.1 Central Object: Decision Case

A **Decision Case** is the durable system-of-record for one decision under management.

Minimum conceptual fields:

| Field group | Contents |
|-------------|----------|
| Identity | `case_id`, title, decision_type_id, family_id, domain, status, created/updated |
| Intent | User goal, stakes, urgency, success criteria |
| Mode | Evaluate / Compare / Find / Window / Simulate / Plan / Execute |
| Intake | Required/optional answers, missing_info[], constraints |
| People | Subject, partner(s), counterparties, advisors (refs to People) |
| Time | Candidate dates, windows, deadlines, execution timestamps |
| Location | Relevant places (move, ceremony, meeting, jurisdiction) |
| Evidence | Links to registered evidence artifacts + user uploads (L7) |
| Graph | Dependencies, related cases, portfolio membership, conflicts |
| Evaluations | Versioned evaluation packages (immutable once published) |
| Plan | Action plan, conditions, counters |
| Execution | Steps status, notes, calendar links |
| Outcome | Declared result, satisfaction, actual date used |
| Reflection | User notes, lessons, would-repeat flag |
| Learning | Calibration contributions (privacy-scoped) |
| Archive | Retention state, reuse templates |

**Status model (canonical):**

`draft` → `briefed` → `evaluating` → `evaluated` → `comparing` → `planned` → `in_execution` → `completed` → `reflected` → `archived`
Side states: `paused`, `superseded`, `rejected`.

### 2.2 Capability Map — Everything Serves Decision Cases

| Capability | Role relative to Decision Case | What is deleted / demoted |
|------------|--------------------------------|---------------------------|
| **Ask / Decide** | Case creation + Adaptive Intake + Evaluation trigger | Chat-thread-as-product |
| **Calendar** | Timing landscape, deadlines, execution scheduling for Cases | Decorative astrology calendar |
| **Today** | Daily operating surface: active Cases, due actions, timing alerts | Horoscope-of-the-day as core loop |
| **Vault** | Personal intelligence store → evidence & profile features for Cases | Vault as unrelated lifestyle chamber |
| **People** | Counterparties & partners attached to Cases; synastry as evidence for relevant Families | People as social novelty |
| **Profile / Birth** | Progressive Precision L3–L4 evidence source | Profile as vanity astrology card |
| **History** | Decision History (versioned Cases), not chat history | Message logs as primary archive |
| **Notifications** | Lifecycle events: intake incomplete, window opening, execution due, reflection due | Spammy daily fortune alerts |
| **Mobile** | Case triage, intake, execution checklists, timing alerts | Chat-only mobile |
| **Voice** | Hands-free Case creation/intake/status | Voice chatbot entertainment |
| **Agents** | Delegated Case monitoring, rescan, reminder under user policy | Autonomous life-deciding bots |
| **Billing** | Entitlements by Case depth, precision, portfolio, collaboration | Paywall on “more chat” |
| **Future Teams / Family / Partner** | Shared Case workspaces with roles | Generic multiplayer chat |
| **API** | Case CRUD + evaluation + graph | Unstructured completion API |
| **Decision Marketplace** | Shareable Type/Family packs & playbooks (governance-gated) | Unvetted mystical packs |

### 2.3 Layered Architecture (product)

```
Experience Surfaces (Today, Decide, Calendar, Workspace, Mobile, Voice)
        ↓
Decision Workspace (Case UI/OS shell)
        ↓
Decision Lifecycle Services (create → archive/reuse)
        ↓
Decision Intelligence Engine (single pathway)
        ↓
Evidence & Intelligence Services (Timing, Natal, Vault features, People)
        ↓
Decision Knowledge Graph
        ↓
Identity, Profile, Billing, Privacy
```

### 2.4 One Engine Principle (reaffirmed)

No surface may emit a decision-bearing recommendation without invoking the Decision Intelligence Engine pathway. Presentational “insights” that imply recommendation without the Output Contract are prohibited.

---

## 3. Decision Lifecycle

### 3.1 Stages

| Stage | Purpose | Exit criteria |
|-------|---------|---------------|
| **Need** | Signal that a decision exists (user intent, calendar pressure, agent watch) | Intent recognized |
| **Decision Creation** | Open Decision Case; assign Type/Family or classify | Case in `draft` |
| **Adaptive Intake** | Collect schema slots; branch; confirm Decision Brief | Case `briefed` or soft-gap accepted |
| **Evidence Collection** | Assemble registered evidence + optional uploads | Evidence bundle attached |
| **Evaluation** | Run engine → Output Contract version | Case `evaluated` |
| **Comparison** | Multi-date / multi-option matrices | Comparison artifact saved |
| **Simulation** | Counterfactual act-now vs wait / option A vs B | Simulation artifact saved |
| **Planning** | Commit action plan + conditions + counters | Case `planned` |
| **Execution** | Track steps; timing alerts; notes | Case `in_execution` / `completed` |
| **Outcome** | Record what happened and when | Outcome declared |
| **Reflection** | Structured lessons without overclaim | Reflection saved |
| **Learning** | Privacy-scoped calibration signals | Learning event recorded |
| **Archive** | Close active management | Case `archived` |
| **Reuse** | Spawn related Case or template from archive | New Case linked |

### 3.2 Lifecycle invariants

1. Stages may skip forward only with explicit missing-info penalties (e.g., evaluate at L1).
2. Evaluations are immutable versions; new runs append versions.
3. Execution cannot invent outcomes; user confirms.
4. Learning cannot rewrite past Output Contracts; it adjusts future priors within governance.
5. Archive preserves provenance.

### 3.3 Lifecycle events (notification-worthy)

- Intake incomplete past urgency threshold
- Favorable window opening for planned Case
- Conflict detected with another Case
- Execution step due
- Reflection due N days after outcome
- Precision upgrade available (e.g., birth time added)

---

## 4. Decision Library

### 4.1 Definition

The **Decision Library** is a governed catalog of **Decision Types** — durable decision definitions, not question strings.

Each Type maps to exactly one primary **Decision Family**.

### 4.2 Domains (canonical set)

Business · Finance · Career · Relationships · Marriage · Family · Immigration · Relocation · Travel · Property · Health · Education · Legal · Lifestyle · Personal Growth · Creative · Timing · Civic

### 4.3 Scale target

**400–500 Decision Types** at maturity. v1 blueprint seeds **~420+** types via Family×Domain expansion (Appendix B). Depth comes from schema completeness, not prompt count.

### 4.4 Catalog rules

1. A Type exists only if a real human decision with stakes exists.
2. Types are nouns of action (“Resign from job”), not vibes (“Feel better about work”).
3. Types declare default evaluation modes.
4. Types declare related Types for graph edges.
5. Types that cannot differentiate drivers after intake are merged or deleted.

### 4.5 Anti-catalog

- Horoscope categories
- Personality entertainment quizzes
- Generic “advice topics”
- Duplicate Types differing only by wording

Appendix B lists the seed catalog.

---

## 5. Decision Families

### 5.1 Why Families

Hundreds of Types without Families → hundreds of brittle templates → generic collapse.
Families own reasoning spines. Types configure weights, inputs, constraints, and safety.

### 5.2 Family set (28)

| ID | Family | Job | Owns |
|----|--------|-----|------|
| F01 | Negotiation | Improve position in exchange | Leverage, concession risk |
| F02 | Commitment | Bind with high exit cost | Stability, reversibility |
| F03 | Investment | Allocate scarce resources | Upside/downside, horizon |
| F04 | Launch | First public/operational act | Readiness, visibility |
| F05 | Communication | High-stakes message delivery | Clarity, receptivity |
| F06 | Growth | Expand capacity | Stretch, burnout risk |
| F07 | Transition | State change with disruption | Closure, support net |
| F08 | Risk | Exposure under asymmetry | Severity, controls |
| F09 | Recovery | Restore after strain | Pace, relapse risk |
| F10 | Planning | Sequence across a window | Dependencies, buffers |
| F11 | Selection | Choose among options | Fit, regret risk |
| F12 | Timing Optimization | When action is already decided | Window quality, urgency |
| F13 | Exit | End/leave with controlled damage | Aftermath, reputation |
| F14 | Alliance | Form/deepen cooperation | Trust, power balance |
| F15 | Authority | Claim/grant decision rights | Legitimacy, backlash |
| F16 | Visibility | Appear under scrutiny | Presence, reputation |
| F17 | Conflict Resolution | Reduce destructive tension | De-escalation, fairness |
| F18 | Acquisition | Obtain asset/right | Terms, lock-in |
| F19 | Relinquishment | Release ownership/control | Exit value, regret |
| F20 | Care | Protect dependent person/system | Need, burden balance |
| F21 | Learning | Commit to learning path | Fit, completion risk |
| F22 | Movement | Change location | Disruption, return options |
| F23 | Formalization | Make state official | Irreversibility, procedure |
| F24 | Creative Expression | Ship creative work | Craft readiness, exposure |
| F25 | Health Intervention | Time/choose health action | Necessity, complication risk (advisory) |
| F26 | Crisis Response | Act under compressed time | Stabilization, sequencing |
| F27 | Compliance | Meet institutional obligation | Deadline, completeness |
| F28 | Portfolio Balancing | Resolve competition among Cases | Priority, resource conflict |

### 5.3 Family ownership contract

Each Family defines:

- Driver set + default weights
- Constraint classes
- Allowed evaluation modes
- Output Contract emphasis
- Safety / overclaim bans
- Typical intake slot patterns
- Graph edge tendencies (depends_on, blocks, related)

Types may override weights and slots; they may not invent private reasoning engines.

---

## 6. Decision Schema

### 6.1 Schema fields (every Decision Type)

| Field | Required | Description |
|-------|----------|-------------|
| `decision_type_id` | yes | Stable ID |
| `family_id` | yes | Primary Family |
| `domain` | yes | Life domain |
| `required_inputs` | yes | Blockers for target precision |
| `optional_inputs` | yes | Confidence raisers |
| `decision_constraints` | yes | Hard/soft constraints (legal deadline, budget, must-avoid dates) |
| `dependencies` | yes | Other Decision Types / Cases typically prerequisite |
| `related_decisions` | yes | Graph suggestions |
| `resource_requirements` | yes | Time, money, attention, emotional bandwidth classes |
| `people_slots` | yes | Who is involved (partner, investor, manager…) |
| `location_slots` | optional | When location matters |
| `time_slots` | yes | Date/window/deadline patterns |
| `missing_information_policy` | yes | Blockers vs soft gaps vs irrelevant |
| `adaptive_questions` | yes | Branching intake graph |
| `evaluation_modes` | yes | Allowed modes |
| `driver_weight_overrides` | optional | Type-level weights |
| `safety_constraints` | yes | Overclaim bans; regulated domains |
| `output_emphasis` | optional | Which Output Contract modules are critical |

### 6.2 Missing information classes

- **Blocker** — cannot run requested mode
- **Soft gap** — run with confidence penalty + Improve Accuracy
- **Irrelevant** — never ask

### 6.3 Adaptive intake rule

Max **5–7** questions before first evaluation. Additional depth is progressive, not front-loaded.

---

## 7. Decision Intelligence Engine

Architecture only. Aligns with `DECISION_INTELLIGENCE_ENGINE.md`; this section productizes the pathway around Decision Cases.

### 7.1 Pipeline

```
Decision Case
  → Decision Family
  → Context Builder
  → Evidence Layer
  → Timing Engine
  → Natal Intelligence
  → Constraint Engine
  → Dependency Engine
  → Decision Drivers
  → Decision Planner
  → Simulation Engine
  → Risk Analysis
  → Tradeoff Engine
  → Recommendation Engine
  → Constrained LLM
  → Formatter
  → Output Contract
```

### 7.2 Component responsibilities and boundaries

| Component | Deterministic? | Responsibility | Must not |
|-----------|----------------|----------------|----------|
| **Decision Family loader** | Yes | Load spine, drivers, safety | Invent Type-specific engines |
| **Context Builder** | Yes | Bind intake + profile pointers + mode into Decision Context | Score or recommend |
| **Evidence Layer** | Yes | Intake registered evidence only; attach limits | Use unregistered evidence for claims |
| **Timing Engine** | Yes | Relative favorability for dates/windows | Predict life outcomes |
| **Natal Intelligence** | Yes (gated) | Precision-gated natal features mapped to drivers | Mystical framing; override timing silently |
| **Constraint Engine** | Yes | Apply hard/soft constraints; feasibility flags | Ignore user hard constraints |
| **Dependency Engine** | Yes | Graph prerequisites/conflicts for this Case | Auto-close other Cases |
| **Decision Drivers** | Yes | Scorecard + tensions | Generate prose |
| **Decision Planner** | Yes | Stance + sequenced actions + conditions | Claim authority over user |
| **Simulation Engine** | Yes | Counterfactual deltas between options/timings | Prophecy of results |
| **Risk Analysis** | Yes | Material downside enumeration | Fear-mongering without evidence |
| **Tradeoff Engine** | Yes | Explicit tradeoff pairs | Hide losing dimensions |
| **Recommendation Engine** | Yes | Stance selection from structured pattern rules | Bypass Output Contract |
| **Constrained LLM** | No | Fill Output Contract slots from structured artifacts | Freestyle essays; new claims |
| **Formatter** | Yes | Schema validate, length budgets, lexicon guard, claim check | Ship invalid packages |

### 7.3 Fail-closed rule

If structured artifacts are insufficient for a decision-bearing module, Formatter blocks that module or the whole package. The LLM may not invent stance.

### 7.4 Relationship to constitutional engine pathway

This blueprint’s pipeline is a product elaboration of: Request → Context → Evidence Intake → Evaluation → Recommendation → Explainability → Outcome Package → Feedback. Downstream engineering must remain derivable from `DECISION_INTELLIGENCE_ENGINE.md`.

---

## 8. Decision Knowledge Graph

### 8.1 Purpose

Decisions are not isolated. The graph models relationships that change evaluation, planning, and portfolio priority.

### 8.2 Node types

- Decision Case
- Decision Type
- Person
- Resource pool (time, money, attention)
- Life Domain
- Location
- Evaluation Version
- Outcome Record

### 8.3 Edge types

| Edge | Meaning |
|------|---------|
| `depends_on` | A should follow B |
| `blocks` | A cannot proceed while B unresolved |
| `related_to` | Semantic adjacency |
| `competes_for` | Shared scarce resource |
| `same_cluster` | Part of a decision cluster (e.g., “Wedding program”) |
| `supersedes` | Newer Case replaces older |
| `spawned_from` | Reuse/archive lineage |
| `involves_person` | Person slot |
| `scheduled_on` | Temporal attachment |

### 8.4 Derived views

| View | Function |
|------|----------|
| **Portfolio** | Active Cases ranked by stakes × urgency × conflict |
| **Timeline** | Cases on a temporal axis |
| **Conflict Detection** | Time/resource/people collisions |
| **Resource Competition** | Attention/money/time contention |
| **Decision Clusters** | Grouped programs (relocate+job+school) |
| **Domain Map** | Load by life domain |
| **History Graph** | Longitudinal Case lineage |

### 8.5 Portfolio Balancing Family (F28)

When conflicts exceed thresholds, system may open or suggest a Portfolio Balancing Case — not silent reordering of user priorities.

---

## 9. Decision Workspace

### 9.1 Replacement

**Chat history is not the workspace.** The workspace is the operating shell for Decision Cases.

### 9.2 Surfaces

| Surface | Function |
|---------|----------|
| **Decision Dashboard** | Active Cases, alerts, portfolio conflicts, precision upgrades |
| **Decision Timeline** | Lifecycle + temporal view of one Case or portfolio |
| **Decision Calendar** | Timing scores, deadlines, execution events |
| **Decision Notes** | User notes bound to Case |
| **Files** | Uploaded evidence (L7) with privacy class |
| **People** | Attached persons + roles |
| **Comparisons** | Saved matrices |
| **Scenarios** | Saved simulations |
| **Saved Evaluations** | Immutable evaluation versions |
| **Decision History** | All Cases + versions |
| **Outcome Tracking** | Declared outcomes |
| **Reflection** | Structured post-decision review |

### 9.3 IA rename (product)

| Legacy | Target |
|--------|--------|
| Ask | Decide (Ask may remain entry alias) |
| Question Library | Decision Library |
| Answer | Evaluation / Outcome Package |
| Chat history | Decision History |
| Today (horoscope-first) | Today (Case operations-first) |

---

## 10. Timing Intelligence

### 10.1 Modes

| Mode | Claim type |
|------|------------|
| Evaluate Date | Suitability of one date for this Case |
| Compare Dates | Relative ranking among candidates |
| Find Best Dates | Top-N in range with why/why-not |
| Find Best Windows | Contiguous favorable bands |
| Calendar Scan | Landscape for planning |
| Decision Timeline | Case events + windows over time |
| Scenario Simulation | Act-now vs wait / A vs B deltas |

### 10.2 Claim standard

Allowed: relative favorability, window quality, driver-linked timing supports/frictions, uncertainty.
Forbidden: destiny, guaranteed outcomes, cosmic punishment, absolute “best day of your life” claims.

### 10.3 Explainability minimum for timing

- Why this date/window ranks here
- Why alternatives rank lower
- What reduced confidence
- What constraint trimmed the search space

---

## 11. Progressive Precision

| Level | Inputs | Engine permission | Confidence |
|-------|--------|-------------------|------------|
| **L1** | Type / intent only | Family guidance; no personalized timing rank | Hard low cap |
| **L2** | + Date/range | Timing without deep personalization | Low–moderate |
| **L3** | + Birth profile (date/place) | Non-house-critical natal features | Moderate |
| **L4** | + Birth time | House-sensitive features when method requires | Higher if evidence agrees |
| **L5** | + Situational context (intake-rich) | Full context-weighted drivers | Higher |
| **L6** | + Related people profiles | Compatibility / counterparty overlays | Higher for relational Families |
| **L7** | + Uploaded evidence | Document-grounded constraints/facts (validated) | Highest available; still advisory |

**Confidence evolution:** monotonic with evidence only when new evidence is relevant and non-conflicting. Conflicting evidence increases explanation burden and may lower confidence despite more data.

---

## 12. Decision Drivers

### 12.1 Model

Drivers are Family-owned scored dimensions. Types weight them. Evidence maps into them. Planner consumes patterns. LLM explains them — does not invent them at runtime.

### 12.2 Universal driver vocabulary (illustrative core)

Negotiation · Commitment · Execution · Risk · Opportunity · Communication · Readiness · Preparation · Compatibility · Momentum · Trust · Stability · Visibility · Reversibility · Resource Fit · Constraint Pressure · Dependency Clearance

Each Family selects a subset (typically 5–8).

### 12.3 Scoring (conceptual)

For each driver:

1. Collect contributing evidence features
2. Apply Type weights + constraint penalties
3. Emit score/band + top supports + top frictions
4. Detect cross-driver tensions (e.g., high Opportunity + high Risk → conditional proceed)

Scores are decision-support instruments, not destiny meters.

---

## 13. Output Contract

Every evaluation returns modules in fixed order. Modules may be `N/A` for mode; skeleton never dissolves.

| Module | Budget | Required content |
|--------|--------|------------------|
| Recommendation | 2–4 lines | Stance + conditions |
| Timing | score/band (+ rank if multi) | Relative favorability |
| Confidence | 0–100 + level | Penalties listed |
| Drivers | scorecard | Family drivers |
| Risks | ≤3 | Material downsides |
| Tradeoffs | ≤3 pairs | What you gain vs give up |
| Opportunities | ≤3 | Material upsides |
| Action Plan | 3–7 steps | Sequenced prepare→act→follow |
| Counter Recommendation | short | Best alternate stance/date/option |
| Why | short | Evidence-linked rationale |
| Improve Accuracy | checklist | Next inputs |
| Next Decision | 1–3 | Suggested subsequent Cases |
| Related Decisions | links | Graph neighbors |

**Anti-essay enforcement:** length budgets, lexicon guards, claim validation, generic-collapse QA.

---

## 14. Decision Learning

### 14.1 Purpose

Improve calibration and personal relevance **without inventing unsupported causal claims**.

### 14.2 Learning loops

| Loop | Signal | Allowed use |
|------|--------|-------------|
| Outcome Tracking | User-declared outcome + date used | Compare stance vs chosen action (descriptive) |
| Reflection | Structured lessons | User-facing memory; optional pattern hints |
| Calibration | Aggregate anonymized residuals | Population timing/driver calibration under governance |
| Confidence Adjustment | Observed over/under-confidence | Prior adjustment with disclosure |
| Portfolio Learning | Conflict/resolution patterns | Better conflict detection thresholds |
| Personal Pattern Learning | Repeated preferences | Preference priors (e.g., avoid Mondays) — never fate claims |

### 14.3 Hard bans

- Claiming METIORO “knew” an outcome
- Retroactive prophecy language
- Silent rewriting of past evaluations
- Learning that removes user agency
- Using sensitive uploads for training without explicit consent policy

---

## 15. Future Vision (same architecture)

| Horizon capability | Reuse mechanism |
|--------------------|-----------------|
| **Voice** | Case create/intake/status via voice; same schema & engine |
| **Mobile** | Case triage + execution checklists + alerts |
| **Agents** | Policy-bound watchers: rescan windows, nudge execution, never auto-decide |
| **Partner Workspace** | Shared Case with roles (owner, collaborator, viewer) |
| **Family Workspace** | Multi-Case household portfolio + care decisions |
| **Teams / Enterprise** | Org Decision Cases with admin governance; same engine, stricter audit |
| **API** | Case + evaluate + graph endpoints; not raw chat completion |
| **Decision Marketplace** | Governed Type packs, Family extensions, playbooks; evidence/safety review required |

No future surface earns a parallel intelligence engine.

---

## 16. What This Blueprint Deletes

| Deleted / demoted | Reason |
|-------------------|--------|
| Chat-as-home | Violates Decision Case first |
| Question Library metaphor | Non-durable catalog |
| Essay answers | Non-evaluable |
| Module-local recommenders | Breaks One Engine |
| Horoscope-first Today | Entertainment loop |
| Prompt-template-per-question | Does not scale; causes generic collapse |
| Unlinked “insights” | Fail Rule Zero |

---

## 17. Governance Alignment

| Source | Alignment |
|--------|-----------|
| DEC-0001 | PDOS is the product form of Personal Decision Intelligence |
| DEC-0004 | Never Mystical; calm, scientific, explainable |
| Constitution §1–3 | Advisory model; explainability; evidence; agency |
| Decision Intelligence Engine | Single pathway elaborated, not replaced |
| Trust Architecture | Permanent constraint across lifecycle |

Category elevation language (“Operating System”) is **product architecture**. It does not unilaterally amend constitutional category text; locking “Personal Decision Operating System” as constitutional category requires Decision Log process if desired.

---

## 18. Canonical Adoption Path (product, not engineering tickets)

1. Lock Decision Case object model + status model
2. Lock Families + Schema contract
3. Lock Output Contract + Precision levels
4. Re-map Ask/Today/Calendar/Vault/People to Case services
5. Introduce Decision Workspace replacing chat history
6. Ship Timing modes as first-class
7. Enable Graph (dependencies/conflicts)
8. Enable Execution + Outcome + Reflection
9. Enable Learning under privacy governance
10. Extend to Mobile/Voice/Agents on same object model

Prompts and UI polish occur only after 1–5 are locked.

---

## Appendix A — Family Driver Sets (canonical starters)

| Family | Drivers |
|--------|---------|
| Negotiation | Leverage, Clarity, Composure, Timing, Concession Risk |
| Commitment | Stability, Alignment, Readiness, Timing, Reversibility |
| Investment | Upside, Downside, Horizon, Liquidity, Conviction |
| Launch | Readiness, Visibility, Momentum, Support, Failure Cost |
| Communication | Clarity, Receptivity, Tone Fit, Timing, Aftermath Risk |
| Growth | Stretch, Support, Consistency, Timing, Burnout Risk |
| Transition | Closure, Readiness, Support Net, Timing, Identity Load |
| Risk | Severity, Signal Quality, Controls, Timing, Option Value |
| Recovery | Rest, Repair, Support, Pace, Relapse Risk |
| Planning | Priority, Dependencies, Capacity, Window Quality, Buffer |
| Selection | Fit, Tradeoffs, Info Completeness, Timing of Choice, Regret Risk |
| Timing Optimization | Window Quality, Readiness, External Receptivity, Conflict Density, Urgency |
| Exit | Closure Quality, Dependency Cut, Timing, Reputation, Aftermath |
| Alliance | Trust, Complementarity, Power Balance, Timing, Shared Horizon |
| Authority | Legitimacy, Support, Timing, Backlash Risk, Mandate Clarity |
| Visibility | Presence, Message Control, Audience Receptivity, Timing, Reputation Risk |
| Conflict Resolution | De-escalation, Fairness, Boundary Clarity, Timing, Recurrence Risk |
| Acquisition | Value, Terms Quality, Timing, Competition, Lock-in Risk |
| Relinquishment | Exit Value, Timing, Attachment Load, Market Quality, Regret Risk |
| Care | Need Severity, Capacity, Timing, Support Quality, Burden Balance |
| Learning | Fit, Intensity, Timing, Credential Value, Completion Risk |
| Movement | Purpose Fit, Disruption Cost, Timing, Destination Support, Return Options |
| Formalization | Completeness, Timing, Support/Witness, Irreversibility, Procedural Risk |
| Creative Expression | Craft Readiness, Audience Receptivity, Timing, Ownership Clarity, Exposure Risk |
| Health Intervention | Necessity, Recovery Window, Support, Timing, Complication Risk |
| Crisis Response | Stabilization, Info Quality, Support, Irreversibility, Sequencing |
| Compliance | Completeness, Deadline Pressure, Accuracy, Timing, Penalty Risk |
| Portfolio Balancing | Stakes, Urgency, Resource Conflict, Dependency Criticality, Opportunity Cost |

---

## Appendix B — Decision Type Seed Catalog (~420)

Format: `id | name | domain | family`

### Business (32)
`biz-pitch-investor | Pitch to investors | Business | Visibility`
`biz-investor-meeting | Investor meeting | Business | Negotiation`
`biz-raise-round | Raise a funding round | Business | Investment`
`biz-launch-product | Launch a product | Business | Launch`
`biz-launch-campaign | Launch a marketing campaign | Business | Launch`
`biz-open-location | Open a store or location | Business | Launch`
`biz-hire-key | Hire a key employee | Business | Acquisition`
`biz-end-employment | End an employment relationship | Business | Exit`
`biz-partnership | Sign a strategic partnership | Business | Alliance`
`biz-vendor-terms | Negotiate vendor terms | Business | Negotiation`
`biz-pricing-change | Change pricing | Business | Authority`
`biz-rebrand | Rebrand the company | Business | Visibility`
`biz-pivot | Pivot the business model | Business | Transition`
`biz-new-market | Enter a new market | Business | Growth`
`biz-pause-project | Pause a major project | Business | Risk`
`biz-kill-project | Kill a project | Business | Exit`
`biz-board-meeting | Board or leadership meeting | Business | Authority`
`biz-client-pitch | Pitch a major client | Business | Visibility`
`biz-renegotiate-client | Renegotiate a client contract | Business | Negotiation`
`biz-acquire | Acquire a company or asset | Business | Acquisition`
`biz-divest | Sell company or unit | Business | Relinquishment`
`biz-cofounder-talk | Cofounder hard conversation | Business | Communication`
`biz-equity-split | Set or reset equity split | Business | Formalization`
`biz-crisis-comms | Business crisis communication | Business | Crisis Response`
`biz-quarter-plan | Set quarterly priorities | Business | Planning`
`biz-franchise | Decide whether to franchise | Business | Selection`
`biz-remote-policy | Change remote/hybrid policy | Business | Authority`
`biz-liquidity-window | Evaluate liquidity/IPO window | Business | Timing Optimization`
`biz-bank-relationship | Change primary banking relationship | Business | Selection`
`biz-insurance-business | Alter business insurance posture | Business | Risk`
`biz-supplier-switch | Switch critical supplier | Business | Transition`
`biz-portfolio-priority | Resolve competing business initiatives | Business | Portfolio Balancing`

### Finance (28)
`fin-buy-position | Buy significant investment position | Finance | Investment`
`fin-sell-position | Sell significant investment position | Finance | Relinquishment`
`fin-rebalance | Rebalance portfolio | Finance | Planning`
`fin-take-loan | Take a loan | Finance | Risk`
`fin-refinance | Refinance debt | Finance | Negotiation`
`fin-emergency-reserve | Build or use emergency reserves | Finance | Planning`
`fin-major-purchase | Major discretionary purchase | Finance | Acquisition`
`fin-budget-system | Start a budget system | Finance | Growth`
`fin-tax-timing | Time complex tax filing | Finance | Timing Optimization`
`fin-high-vol-entry | Enter high-volatility asset | Finance | Risk`
`fin-angel | Make angel investment | Finance | Investment`
`fin-retirement | Set retirement contribution strategy | Finance | Planning`
`fin-insurance | Change insurance coverage | Finance | Risk`
`fin-joint-finances | Open joint finances | Finance | Commitment`
`fin-separate-finances | Separate shared finances | Finance | Exit`
`fin-collect-payment | Ask for overdue payment | Finance | Communication`
`fin-settle-debt | Settle a debt | Finance | Negotiation`
`fin-large-gift | Make large financial gift | Finance | Care`
`fin-inheritance | Accept or structure inheritance | Finance | Formalization`
`fin-side-income | Start side-income stream | Finance | Launch`
`fin-cost-cut | Execute cost-cutting plan | Finance | Planning`
`fin-compare-products | Compare financial product offers | Finance | Selection`
`fin-liquidity-event | Time a liquidity event | Finance | Timing Optimization`
`fin-hedge | Add hedge/protection layer | Finance | Risk`
`fin-currency-move | Make major FX conversion | Finance | Timing Optimization`
`fin-charity-plan | Structure charitable giving plan | Finance | Planning`
`fin-co-invest | Enter co-investment | Finance | Alliance`
`fin-priority-spend | Resolve competing money priorities | Finance | Portfolio Balancing`

### Career (34)
`car-apply | Apply for a job | Career | Timing Optimization`
`car-interview | Attend job interview | Career | Visibility`
`car-negotiate-offer | Negotiate job offer | Career | Negotiation`
`car-accept-offer | Accept job offer | Career | Commitment`
`car-decline-offer | Decline job offer | Career | Exit`
`car-ask-raise | Ask for a raise | Career | Negotiation`
`car-ask-promotion | Ask for a promotion | Career | Authority`
`car-start-role | Start a new role | Career | Transition`
`car-resign | Resign from a job | Career | Exit`
`car-notice-timing | Time notice delivery | Career | Timing Optimization`
`car-perf-review | Prepare for performance review | Career | Visibility`
`car-manager-talk | Difficult conversation with manager | Career | Communication`
`car-peer-conflict | Resolve workplace conflict | Career | Conflict Resolution`
`car-switch-industry | Switch industry | Career | Transition`
`car-go-independent | Go freelance/independent | Career | Launch`
`car-return-employment | Return to employment | Career | Transition`
`car-sabbatical | Take a sabbatical | Career | Recovery`
`car-internal-transfer | Request internal transfer | Career | Growth`
`car-lead-project | Take project leadership | Career | Authority`
`car-keynote | Give career-defining talk | Career | Visibility`
`car-public-update | Publish major career update | Career | Visibility`
`car-mentor | Ask someone to mentor you | Career | Alliance`
`car-sponsor | Ask for executive sponsorship | Career | Authority`
`car-compare-offers | Compare competing offers | Career | Selection`
`car-layoff-response | Respond to layoff/restructuring | Career | Crisis Response`
`car-skill-bet | Bet on a skill path | Career | Learning`
`car-quarter-focus | Set career focus for quarter | Career | Planning`
`car-network | Time high-stakes networking outreach | Career | Timing Optimization`
`car-board-role | Join board/advisory role | Career | Alliance`
`car-exit-toxic | Exit toxic workplace | Career | Exit`
`car-union-action | Decide workplace collective action | Career | Authority`
`car-relocate-role | Accept role requiring relocation | Career | Commitment`
`car-compliance-training | Meet professional compliance deadline | Career | Compliance`
`car-priority-roles | Resolve competing career pursuits | Career | Portfolio Balancing`

### Relationships (30)
`rel-first-date | Go on a first date | Relationships | Visibility`
`rel-define | Define the relationship | Relationships | Communication`
`rel-exclusive | Become exclusive | Relationships | Commitment`
`rel-meet-family | Introduce partner to family | Relationships | Alliance`
`rel-hard-talk | Hard relationship conversation | Relationships | Communication`
`rel-apology | Meaningful apology | Relationships | Recovery`
`rel-boundary | Set firm boundary | Relationships | Authority`
`rel-reconcile | Attempt reconciliation | Relationships | Recovery`
`rel-breakup | End romantic relationship | Relationships | Exit`
`rel-pause | Pause a relationship | Relationships | Transition`
`rel-long-distance | Start/end long-distance | Relationships | Transition`
`rel-move-in | Move in together | Relationships | Commitment`
`rel-move-out | Move out from shared home | Relationships | Exit`
`rel-meet-friends | Introduce partner to friends | Relationships | Alliance`
`rel-trust-rupture | Address jealousy/trust rupture | Relationships | Conflict Resolution`
`rel-values | Discuss long-term values | Relationships | Communication`
`rel-intimacy-repair | Repair intimacy after distance | Relationships | Recovery`
`rel-gesture-timing | Time meaningful gesture | Relationships | Timing Optimization`
`rel-go-public | Go public as a couple | Relationships | Visibility`
`rel-friend-conflict | Resolve friendship conflict | Relationships | Conflict Resolution`
`rel-end-friendship | End a friendship | Relationships | Exit`
`rel-reconnect | Reconnect with someone important | Relationships | Communication`
`rel-ask-support | Ask for emotional support | Relationships | Care`
`rel-choose-partner | Choose among romantic options | Relationships | Selection`
`rel-nonmonogamy | Negotiate non-monogamy boundaries | Relationships | Negotiation`
`rel-rebuild-trust | Rebuild trust after breach | Relationships | Recovery`
`rel-family-pressure | Respond to family pressure | Relationships | Authority`
`rel-status-talk-timing | Time relationship-status talk | Relationships | Timing Optimization`
`rel-caregiving-balance | Balance relationship vs caregiving load | Relationships | Portfolio Balancing`
`rel-mediation | Enter relationship mediation | Relationships | Conflict Resolution`

### Marriage (26)
`mar-propose | Propose marriage | Marriage | Commitment`
`mar-accept-proposal | Accept or decline proposal | Marriage | Selection`
`mar-announce | Announce engagement | Marriage | Visibility`
`mar-wedding-date | Choose wedding date | Marriage | Timing Optimization`
`mar-compare-dates | Compare wedding date candidates | Marriage | Timing Optimization`
`mar-civil | Schedule civil ceremony | Marriage | Formalization`
`mar-prenup-talk | Discuss prenup | Marriage | Negotiation`
`mar-prenup-sign | Sign prenup | Marriage | Formalization`
`mar-guest-conflict | Resolve guest-list conflicts | Marriage | Conflict Resolution`
`mar-family-roles | Assign family wedding roles | Marriage | Authority`
`mar-honeymoon | Time honeymoon travel | Marriage | Movement`
`mar-name-change | Decide name-change approach | Marriage | Selection`
`mar-household-rules | Set joint household rules | Marriage | Planning`
`mar-inlaw-boundary | Set in-law boundaries | Marriage | Authority`
`mar-reset | Reset marriage after strain | Marriage | Recovery`
`mar-counseling | Start couples counseling | Marriage | Recovery`
`mar-separation | Begin separation | Marriage | Exit`
`mar-divorce-file | File for divorce | Marriage | Formalization`
`mar-divorce-terms | Negotiate divorce terms | Marriage | Negotiation`
`mar-remarry | Decide to remarry | Marriage | Commitment`
`mar-vow-renewal | Plan vow renewal timing | Marriage | Timing Optimization`
`mar-window | Find best marriage commitment window | Marriage | Timing Optimization`
`mar-joint-finance-case | Align marriage with joint finance Case | Marriage | Portfolio Balancing`
`mar-ceremony-type | Choose ceremony type | Marriage | Selection`
`mar-vendor-lock | Lock major wedding vendors | Marriage | Commitment`
`mar-post-wedding-plan | Plan first-90-days married life | Marriage | Planning`

### Family (24)
`fam-parent-talk | Hard talk with parent | Family | Communication`
`fam-sibling-conflict | Resolve sibling conflict | Family | Conflict Resolution`
`fam-elder-care | Decide elder-care approach | Family | Care`
`fam-move-parent | Move parent into care/home | Family | Transition`
`fam-school-choice | Choose school for child | Family | Selection`
`fam-parenting-reset | Reset parenting approach | Family | Authority`
`fam-announce-pregnancy | Announce pregnancy | Family | Visibility`
`fam-conception-plan | Plan conception-attempt window | Family | Planning`
`fam-name-child | Finalize child's name | Family | Selection`
`fam-guardian | Choose legal guardian | Family | Formalization`
`fam-inheritance-talk | Discuss inheritance | Family | Communication`
`fam-holiday | Plan high-conflict holiday logistics | Family | Planning`
`fam-boundary | Set boundary with relative | Family | Authority`
`fam-crisis-support | Support family member in crisis | Family | Crisis Response`
`fam-reunion | Host/attend family reunion | Family | Alliance`
`fam-blended | Integrate blended-family step | Family | Transition`
`fam-custody | Negotiate parenting schedule | Family | Negotiation`
`fam-pet | Major pet decision | Family | Care`
`fam-household | Reset household rules | Family | Planning`
`fam-financial-help | Decide financial help to family | Family | Investment`
`fam-distance | Create distance from harmful relative | Family | Exit`
`fam-apology | Apologize within family system | Family | Recovery`
`fam-care-vs-career | Balance caregiving vs career Cases | Family | Portfolio Balancing`
`fam-compliance-school | Meet school/admin deadline | Family | Compliance`

### Immigration (22)
`imm-choose-pathway | Choose immigration pathway | Immigration | Selection`
`imm-file-petition | File immigration petition | Immigration | Formalization`
`imm-visa-apply | Submit visa application | Immigration | Formalization`
`imm-visa-timing | Time visa application submission | Immigration | Timing Optimization`
`imm-interview | Attend immigration interview | Immigration | Visibility`
`imm-appeal | File immigration appeal | Immigration | Risk`
`imm-status-change | Change immigration status | Immigration | Transition`
`imm-sponsor | Decide to sponsor someone | Immigration | Commitment`
`imm-job-offer-imm | Accept job tied to immigration | Immigration | Commitment`
`imm-travel-permit | Apply for travel permit | Immigration | Compliance`
`imm-renewal | Renew status/permit | Immigration | Compliance`
`imm-counsel-select | Select immigration counsel | Immigration | Selection`
`imm-evidence-pack | Assemble evidence package | Immigration | Planning`
`imm-country-compare | Compare destination countries | Immigration | Selection`
`imm-family-reunification | Pursue family reunification | Immigration | Care`
`imm-asylum-strategy | Decide protection strategy with counsel | Immigration | Crisis Response`
`imm-citizenship | Apply for citizenship | Immigration | Formalization`
`imm-renounce | Renounce citizenship | Immigration | Exit`
`imm-relocate-sync | Sync immigration with relocation Case | Immigration | Portfolio Balancing`
`imm-biometrics | Schedule biometrics appointment | Immigration | Timing Optimization`
`imm-deadline | Meet immigration deadline | Immigration | Compliance`
`imm-disclose | Disclose immigration constraint to employer | Immigration | Communication`

### Relocation & Travel (28)
`reloc-city | Relocate to new city | Relocation | Movement`
`reloc-country | Relocate to new country | Relocation | Movement`
`reloc-compare-cities | Compare cities | Relocation | Selection`
`reloc-job-move | Job-required relocation | Relocation | Commitment`
`reloc-family-move | Move with family | Relocation | Transition`
`reloc-alone | Move alone first time | Relocation | Growth`
`reloc-window | Find best relocation window | Relocation | Timing Optimization`
`reloc-lease | Sign lease in new place | Relocation | Formalization`
`reloc-sell-first | Sell before moving | Relocation | Relinquishment`
`reloc-temp-housing | Temporary housing strategy | Relocation | Planning`
`reloc-school-district | Move for school district | Relocation | Care`
`reloc-partner-conflict | Resolve move disagreement | Relocation | Conflict Resolution`
`reloc-return | Return to previous city/country | Relocation | Transition`
`reloc-remote-base | Choose remote-work base | Relocation | Selection`
`reloc-break-lease | Exit lease early | Relocation | Exit`
`trv-book | Book major trip | Travel | Movement`
`trv-dates | Choose travel dates | Travel | Timing Optimization`
`trv-compare-windows | Compare travel windows | Travel | Timing Optimization`
`trv-solo | Solo trip | Travel | Growth`
`trv-couple | Couple trip | Travel | Alliance`
`trv-family | Family trip | Travel | Care`
`trv-business | Time business trip | Travel | Timing Optimization`
`trv-cancel | Cancel/postpone trip | Travel | Exit`
`trv-risky-route | Higher-risk route travel | Travel | Risk`
`trv-nomad | Start temporary nomad period | Travel | Transition`
`trv-event | Travel for high-stakes event | Travel | Visibility`
`trv-retreat | Recovery retreat | Travel | Recovery`
`trv-destination | Choose among destinations | Travel | Selection`

### Property (22)
`prop-buy | Buy a home | Property | Acquisition`
`prop-sell | Sell a home | Property | Relinquishment`
`prop-offer | Make purchase offer | Property | Negotiation`
`prop-accept-offer | Accept sale offer | Property | Selection`
`prop-compare | Compare listings | Property | Selection`
`prop-rent-vs-buy | Decide rent vs buy | Property | Selection`
`prop-lease | Sign residential lease | Property | Commitment`
`prop-break-lease | Break a lease | Property | Exit`
`prop-renovate | Start renovation | Property | Launch`
`prop-refi | Refinance mortgage | Property | Negotiation`
`prop-invest | Buy investment property | Property | Investment`
`prop-dispute | Landlord/tenant dispute | Property | Conflict Resolution`
`prop-roommate | Add/remove roommate | Property | Alliance`
`prop-closing | Choose closing date | Property | Timing Optimization`
`prop-inspect | Schedule inspection window | Property | Timing Optimization`
`prop-land | Purchase land | Property | Acquisition`
`prop-co-own | Enter co-ownership | Property | Alliance`
`prop-exit-co-own | Exit co-ownership | Property | Exit`
`prop-insurance | Change property insurance | Property | Risk`
`prop-permit | Pursue building permit | Property | Compliance`
`prop-HOA | Handle HOA conflict | Property | Conflict Resolution`
`prop-vs-relocate | Balance property vs relocation Cases | Property | Portfolio Balancing`

### Health (24) — advisory only; never medical authority
`hlt-therapy-start | Start therapy | Health | Recovery`
`hlt-therapy-change | Change therapist/modality | Health | Selection`
`hlt-elective | Time elective procedure | Health | Health Intervention`
`hlt-second-opinion | Seek second opinion | Health | Selection`
`hlt-training | Begin training program | Health | Growth`
`hlt-rest | Take deliberate rest period | Health | Recovery`
`hlt-habit-start | Start health habit system | Health | Growth`
`hlt-habit-stop | Stop harmful habit | Health | Exit`
`hlt-sleep | Execute sleep reset | Health | Recovery`
`hlt-burnout-leave | Leave for burnout recovery | Health | Crisis Response`
`hlt-caregiver-rest | Protect caregiver rest | Health | Care`
`hlt-disclose | Disclose condition at work | Health | Communication`
`hlt-treatment-change | Change treatment with clinicians | Health | Health Intervention`
`hlt-support-group | Join support group | Health | Alliance`
`hlt-fertility-plan | Plan fertility-related timing with clinicians | Health | Planning`
`hlt-checkin | Schedule mental-health check-in | Health | Timing Optimization`
`hlt-compare-clinics | Compare clinics/providers | Health | Selection`
`hlt-postpartum | Plan postpartum support | Health | Care`
`hlt-return-activity | Return to activity after injury | Health | Recovery`
`hlt-preventive | Schedule preventive care window | Health | Timing Optimization`
`hlt-insurance-care | Navigate care vs insurance constraint | Health | Constraint-heavy Planning`
`hlt-emergency-plan | Build personal health emergency plan | Health | Planning`
`hlt-med-compliance | Meet medication/monitoring regimen plan | Health | Compliance`
`hlt-balance | Balance health vs work Cases | Health | Portfolio Balancing`

Note: `hlt-insurance-care` Family = Planning (constraint-heavy).

### Education (20)
`edu-apply | Apply to a program | Education | Timing Optimization`
`edu-choose | Choose among schools | Education | Selection`
`edu-start | Start a degree | Education | Learning`
`edu-pause | Pause a degree | Education | Exit`
`edu-switch | Switch major/track | Education | Transition`
`edu-cert | Pursue certification | Education | Learning`
`edu-exam-date | Choose exam date | Education | Timing Optimization`
`edu-defense | Schedule defense | Education | Visibility`
`edu-rec-letter | Ask for recommendation letter | Education | Communication`
`edu-abroad | Commit to study abroad | Education | Movement`
`edu-bootcamp | Join intensive bootcamp | Education | Learning`
`edu-language | Start language immersion | Education | Learning`
`edu-research | Start research project | Education | Launch`
`edu-advisor | Change advisor | Education | Exit`
`edu-funding | Ask for academic funding | Education | Negotiation`
`edu-publish | Submit paper | Education | Visibility`
`edu-pivot-learn | Learn for career pivot | Education | Growth`
`edu-school-meeting | High-stakes school meeting | Education | Authority`
`edu-deadline | Meet academic deadline | Education | Compliance`
`edu-vs-work | Balance education vs work Cases | Education | Portfolio Balancing`

### Legal (20)
`leg-sign | Sign major contract | Legal | Formalization`
`leg-negotiate | Negotiate legal terms | Legal | Negotiation`
`leg-file | File claim/complaint | Legal | Authority`
`leg-settle | Accept settlement | Legal | Selection`
`leg-counsel | Hire counsel | Legal | Selection`
`leg-testimony | Prepare for testimony | Legal | Visibility`
`leg-incorporate | Incorporate entity | Legal | Formalization`
`leg-ip | File IP protection | Legal | Formalization`
`leg-threat | Respond to legal threat | Legal | Crisis Response`
`leg-mediation | Enter mediation | Legal | Conflict Resolution`
`leg-poa | Grant power of attorney | Legal | Formalization`
`leg-estate | Update will/estate plan | Legal | Planning`
`leg-compliance | Meet compliance deadline | Legal | Compliance`
`leg-name | Change legal name | Legal | Formalization`
`leg-compare-strategy | Compare counsel strategies | Legal | Selection`
`leg-discovery | Respond to discovery request | Legal | Compliance`
`leg-restraining | Seek protective order with counsel | Legal | Crisis Response`
`leg-contract-exit | Exit a contract | Legal | Exit`
`leg-arbitration | Enter arbitration | Legal | Conflict Resolution`
`leg-priority | Prioritize concurrent legal matters | Legal | Portfolio Balancing`

### Lifestyle & Personal Growth (36)
`life-routine | Reset daily routine | Lifestyle | Planning`
`life-detox | Start digital detox | Lifestyle | Recovery`
`life-schedule | Restructure weekly schedule | Lifestyle | Planning`
`life-social | Commit to social rhythm | Lifestyle | Growth`
`life-cut-obligations | Cut obligations | Lifestyle | Exit`
`life-join-community | Join community/club | Lifestyle | Alliance`
`life-leave-community | Leave community | Lifestyle | Exit`
`life-style-reset | Identity-linked style reset | Lifestyle | Transition`
`life-home-os | Install home operating system | Lifestyle | Planning`
`life-habits | Install habit stack | Lifestyle | Growth`
`life-public-commit | Public lifestyle commitment | Lifestyle | Visibility`
`life-celebrate | Time personal celebration | Lifestyle | Timing Optimization`
`life-gift | Time high-stakes gift | Lifestyle | Timing Optimization`
`life-volunteer | Commit to volunteering | Lifestyle | Care`
`life-practice | Begin/deepen practice tradition | Lifestyle | Growth`
`life-declutter | Declutter / sell-off | Lifestyle | Relinquishment`
`life-compare-os | Compare lifestyle operating models | Lifestyle | Selection`
`life-high-demand-week | Plan high-demand week | Lifestyle | Planning`
`pg-identity | Begin identity reset chapter | Personal Growth | Transition`
`pg-confidence | Confidence-building sprint | Personal Growth | Growth`
`pg-inquiry | Structured self-inquiry work | Personal Growth | Recovery`
`pg-vulnerability | Share vulnerable truth publicly | Personal Growth | Visibility`
`pg-mentor | Seek life mentor | Personal Growth | Alliance`
`pg-values | Run values audit | Personal Growth | Planning`
`pg-fear | Face specific fear with plan | Personal Growth | Risk`
`pg-creative-block | Break creative block | Personal Growth | Recovery`
`pg-discipline | Install discipline system | Personal Growth | Growth`
`pg-forgiveness | Execute forgiveness decision | Personal Growth | Recovery`
`pg-leave-identity | Leave unfit identity | Personal Growth | Exit`
`pg-purpose | Choose among purpose directions | Personal Growth | Selection`
`pg-accountability | Start accountability partnership | Personal Growth | Alliance`
`pg-retreat | Solo reflection retreat | Personal Growth | Movement`
`pg-habit-audit | Audit and prune habits | Personal Growth | Planning`
`pg-announce | Announce personal change | Personal Growth | Communication`
`pg-boundaries | Install life-wide boundaries | Personal Growth | Authority`
`pg-year-theme | Set yearly growth theme | Personal Growth | Planning`

### Creative (18)
`cre-release | Release creative work | Creative | Creative Expression`
`cre-premiere | Premiere a work | Creative | Visibility`
`cre-collab-start | Start creative collaboration | Creative | Alliance`
`cre-collab-end | End creative collaboration | Creative | Exit`
`cre-pitch | Pitch gallery/publisher/label | Creative | Visibility`
`cre-title | Choose title/brand for work | Creative | Selection`
`cre-show-date | Choose show/exhibition date | Creative | Timing Optimization`
`cre-crowdfund | Launch crowdfunding | Creative | Launch`
`cre-drought | Interrupt creative drought | Creative | Recovery`
`cre-portfolio | Publish portfolio update | Creative | Visibility`
`cre-commission | Accept commission | Creative | Commitment`
`cre-rights | Negotiate creative rights | Creative | Negotiation`
`cre-abandon | Abandon creative project | Creative | Exit`
`cre-rebrand | Rebrand artist identity | Creative | Transition`
`cre-direction | Reveal new creative direction | Creative | Visibility`
`cre-compare-release | Compare release dates | Creative | Timing Optimization`
`cre-grant | Apply for creative grant | Creative | Timing Optimization`
`cre-priority | Prioritize concurrent creative projects | Creative | Portfolio Balancing`

### Timing & Civic (28)
`tim-send | Send high-stakes message | Timing | Timing Optimization`
`tim-meeting | Schedule high-stakes meeting | Timing | Timing Optimization`
`tim-ask | Make difficult ask | Timing | Timing Optimization`
`tim-announce | Make public announcement | Timing | Timing Optimization`
`tim-publish | Publish/ship publicly | Timing | Timing Optimization`
`tim-followup | Follow up after silence | Timing | Timing Optimization`
`tim-confront | Confront an issue | Timing | Timing Optimization`
`tim-celebrate | Celebrate publicly | Timing | Timing Optimization`
`tim-habit-start | Start habit on a date | Timing | Timing Optimization`
`tim-habit-end | End habit on a date | Timing | Timing Optimization`
`tim-best-week | Find best week for decision | Timing | Timing Optimization`
`tim-best-month | Find best month window | Timing | Timing Optimization`
`tim-compare-three | Compare three candidate dates | Timing | Timing Optimization`
`tim-avoid | Identify windows to avoid | Timing | Risk`
`tim-scan | Scan calendar for windows | Timing | Timing Optimization`
`tim-deadline | Act under external deadline | Timing | Crisis Response`
`tim-wait-vs-act | Decide wait vs act now | Timing | Selection`
`tim-sequence | Sequence multiple timed actions | Timing | Planning`
`tim-partner-sync | Synchronize timing with partner | Timing | Alliance`
`tim-reopen | Reopen missed window | Timing | Recovery`
`civ-vote | Decide voting participation plan | Civic | Planning`
`civ-petition | Support/launch petition | Civic | Visibility`
`civ-local-office | Run for local role | Civic | Launch`
`civ-public-comment | Deliver public comment | Civic | Visibility`
`civ-comply | Meet civic filing deadline | Civic | Compliance`
`civ-protest-risk | Decide participation under risk | Civic | Risk`
`civ-volunteer-campaign | Commit campaign volunteering | Civic | Commitment`
`civ-priority | Balance civic vs personal Cases | Civic | Portfolio Balancing`

### Catalog count note

Seed catalog above enumerates **approximately 420 Decision Types**. Maturity target remains **400–500** with schema-complete entries; expansion prefers new real decisions over synonym inflation.

---

## Appendix C — Output Contract Field Budgets (normative)

| Module | Max tokens/words (product budget) | Hard fail if |
|--------|-----------------------------------|--------------|
| Recommendation | 60 words | Missing stance |
| Timing | structured + 40 words | Missing score/band when date mode |
| Confidence | structured | Missing level or penalties when < L5 |
| Drivers | structured scorecard | Empty for evaluated Case |
| Risks | 3×20 words | Fear claims without evidence refs |
| Tradeoffs | 3 pairs | Hidden losing side |
| Opportunities | 3×20 words | Unlinked hype |
| Action Plan | 7 steps | No actionable verb |
| Counter Recommendation | 40 words | Identical to Recommendation without justification |
| Why | 80 words | No evidence linkage |
| Improve Accuracy | 5 items | Missing when confidence < threshold |
| Next Decision | 3 | — |
| Related Decisions | 5 | — |

---

## Appendix D — Rule Zero Audit Template

For any proposed feature:

1. Which Decision Case lifecycle stage does it improve?
2. What Case field/graph edge does it write?
3. Does it invoke the One Engine for recommendations?
4. What happens if we delete it?
5. If answers are weak → delete or redesign.

---

## End of Blueprint

This document is the canonical product blueprint for METIORO as a Personal Decision Operating System. Implementation, prompts, and UI derive from it; they do not redefine it.

# ADR-DS-002: Runtime Semantic Token Consumption

**Status:** Proposed  
**Date:** 2026-07-07  
**Decision makers:** METIORO Design & Platform Engineering (pending project owner approval)  
**Authority:** Architecture Decision Record — extends [ADR-DS-001](./ADR-DS-001-design-system-architecture.md) (does not modify it)

---

## Status

**Proposed**

This ADR defines **how** Tier 3 domain presentation maps will consume Tier 1 semantic tokens. It does not perform migration, refactor code, or change visuals.

---

## Context

### Foundation (ADR-DS-001 + DS-01)

[ADR-DS-001](./ADR-DS-001-design-system-architecture.md) established the layered Design System architecture and accepted **incremental consolidation** as the governing approach. Sprint DS-01 implemented the canonical authority:

**[design-token-registry.md](../../design/system/design-token-registry.md)**

That registry classifies every token into four tiers and records that three runtime presentation maps **violate** ADR-DS-001 Principle 3 today. Full token values and duplicate semantics live in the registry and [design-token-inventory.md](../../design/system/design-token-inventory.md) — not duplicated here.

### Current runtime maps (summary)

| Map | Module | Owner | Tier | Role |
|-----|--------|-------|------|------|
| `BAND_STYLES` | `lib/calendar-scores.ts` | Domain | 3 | Score-band presentation for calendar, home, ask |
| `GPS_TONE_STYLES` | `lib/strategic-gps.ts` | Domain | 3 | Strategic GPS tone panel on calendar |
| `BADGE_STYLES` | `lib/synergy.ts` | Domain | 3 | People synergy badge presentation |

### Current state characteristics

| Characteristic | Detail (see registry) |
|----------------|----------------------|
| **Ownership** | Domain modules own map keys and literals; Design Token Registry owns intended semantic targets |
| **Literals** | All three maps define raw `#hex` and `rgba()` values inline |
| **Semantic overlap** | `green` / `aligned` → `color.status.success`; `yellow` / `caution` → `color.status.warning`; `red` / `tension` → `color.status.danger` — same hues, different bg opacities per map |
| **Coupling** | Maps are imported by UI components and pages for inline `style={{}}`; co-located with domain logic (scoring, GPS, synergy); consumers depend on `{ bg, border, text }` object shape |
| **Compliance** | Registry marks all three as **ACTIVE** maps that **do not consume** semantic tokens (DS-01 violation documented) |

### Consumers (reference)

Presentation maps are consumed across scored product surfaces. Component relationships are documented in [component-catalog.md](../../design/system/component-catalog.md). Primary surfaces: Calendar month/hour cells, Home daily brief, Ask results, People synergy badges, Calendar GPS panel.

---

## Problem

ADR-DS-001 identified architectural problems; DS-01 registered them. ADR-DS-002 addresses the **runtime-specific** consequences.

### 1. Raw literals create duplicated semantics

The registry documents multiple physical sources for the same semantic role (e.g. `#4ade80` in `BAND_STYLES`, `GPS_TONE_STYLES`, `BADGE_STYLES`, and `mio-alert--success`). Each map independently encodes presentation. Changing `color.status.success` requires editing domain modules — not the Design Token Authority.

### 2. Runtime maps partially own presentation

Today, `calendar-scores.ts` is both a **data/scoring module** and a **palette definition**. Domain engineers adding a score band implicitly become designers. Presentation decisions are scattered outside the registry governance path.

### 3. Token Authority cannot fully govern runtime styling

[design-token-registry.md](../../design/system/design-token-registry.md) is authoritative for registration, but runtime maps bypass it by defining unconstrained literals. New features can copy nearest map literals without registry review — silent drift.

### 4. Maintenance cost increases over time

Every new scored surface (World signals, Pathfinder verdicts, future modules) risks a fourth parallel palette. Opacity and border treatments already differ across three maps for identical semantics. Without a consumption contract, consolidation never completes.

### 5. ADR-DS-001 Principle 3 is unimplemented

Principle 3 states: *"Runtime style maps consume tokens; they do not define palette."* DS-01 documented violation; this ADR defines the consumption model for future implementation — not the implementation itself.

---

## Decision

METIORO adopts the following **architectural principles** for runtime semantic token consumption. These extend ADR-DS-001; they do not replace or reopen it.

### Principle 1 — Runtime maps consume semantic tokens

Tier 3 presentation maps **reference** Tier 1 semantic token identities (e.g. `color.status.success`). They resolve to physical values through the Design Token Authority — not through local hex literals.

### Principle 2 — Runtime maps never define palette values

Domain modules must not introduce `#hex`, named colors, or `rgba()` literals in presentation maps after migration. Palette definition belongs to Tier 0–1 (registry + brand primitives). Maps may only compose semantic references (including opacity variants registered as semantic sub-tokens).

### Principle 3 — Semantic tokens remain the single source of truth

For status and score presentation, `color.status.*` semantics in [design-token-registry.md](../../design/system/design-token-registry.md) are authoritative. Physical bindings may remain distributed in CSS/TS during transition, but only the registry may change the resolved value.

### Principle 4 — Presentation maps express meaning only

Map keys express **domain meaning** (`green`, `aligned`, `caution`) and bind to **semantic IDs** (`color.status.success`). Maps do not encode visual design decisions (exact opacity, border width) unless those decisions are registered as named semantic or component tokens.

### Principle 5 — Visual output must remain unchanged

Migration implementation must preserve pixel-level parity unless an explicit, separately governed visual change is approved. "Consuming semantic tokens" is an architectural refactor — not a redesign.

### Principle 6 — Migration must be incremental

Consumption adoption follows one map, one semantic category, one PR — never simultaneous full replacement of all runtime maps.

### Principle 7 — Performance regression is unacceptable

Semantic resolution must not measurably regress [Performance Baseline](../../performance/BASELINE.md) gates (desktop Perf 99, mobile LCP risk surface). Token resolution at runtime must not add bundle weight or render-path cost beyond baseline tolerance.

### Target consumption model (conceptual)

```
Domain logic          →  selects map key (e.g. scoreBand = 'green')
Presentation map      →  key maps to semantic ID (color.status.success)
Semantic token layer  →  resolves to physical value(s) from registry
UI consumer           →  applies resolved styles (unchanged API shape during transition)
```

**API shape:** Existing `{ bg, border, text }` consumer contracts may remain during transition. Implementation may resolve semantics at module init or through a shared resolver — **deferred to DS-02 implementation sprint; not specified here.**

### Relationship to ADR-DS-001

| ADR-DS-001 | ADR-DS-002 |
|------------|------------|
| Four-tier hierarchy | How Tier 3 binds to Tier 1 |
| Single token authority | How runtime maps submit to authority |
| Principle 3 stated | Principle 3 consumption contract defined |
| No migration steps | Migration **principles** only |

---

## Migration Principles

Implementation belongs to a future **DS-02 implementation sprint**. This section defines **principles only** — not steps, files, or code.

### MP-1 — Backward compatibility

Consumers of `BAND_STYLES`, `GPS_TONE_STYLES`, and `BADGE_STYLES` must continue to receive equivalent style objects until explicitly migrated. No breaking shape changes without a deprecation ADR.

### MP-2 — One runtime map at a time

Migrate maps in isolation: `BADGE_STYLES` → `GPS_TONE_STYLES` → `BAND_STYLES` (order may be adjusted by implementation ADR based on blast radius). Never migrate all three in one change set.

### MP-3 — One semantic category at a time

Within a map, migrate one semantic binding at a time (e.g. `color.status.success` only) with visual parity verification before proceeding to `warning`, `danger`, etc.

### MP-4 — Easy rollback

Each migration increment must be revertible by a single commit revert without orphan registry entries. Feature flags or parallel literal fallbacks are acceptable implementation tactics — not mandated here.

### MP-5 — Measurable visual parity

Before and after each increment:

- Screenshot comparison on affected surfaces (Calendar, Home, Ask, People)
- Registry documents exact prior literals for diff
- No subjective "close enough" — parity is measured against DS-01 recorded values

### MP-6 — Registry-first

Every semantic sub-token created for opacity variants (e.g. `color.status.success.bgStrong` vs `bgSubtle`) must be registered in [design-token-registry.md](../../design/system/design-token-registry.md) **before** map consumption.

### MP-7 — No new literals during migration

While migration is in progress, contributors must not add new raw colors to domain modules. New semantics register first; maps consume second.

---

## Alternatives Considered

### A) Leave runtime maps unchanged

**Description:** Retain inline literals in `calendar-scores.ts`, `strategic-gps.ts`, `synergy.ts` indefinitely. Registry documents violations but does not enforce consumption.

| | |
|-|-|
| **Pros** | Zero effort; no regression risk |
| **Cons** | ADR-DS-001 Principle 3 permanently violated; drift continues; Token Authority is documentation-only for status colors; each new feature copies literals |
| **Verdict** | **Rejected.** DS-01 established authority precisely to enable consumption. Status quo defeats the architecture. |

### B) Incremental semantic migration

**Description:** Adopt Principles 1–7 and Migration Principles MP-1–MP-7. Introduce semantic resolution layer; migrate maps one key at a time; preserve visual parity.

| | |
|-|-|
| **Pros** | Aligns with ADR-DS-001 Alternative B; rollback-friendly; registry becomes enforceable; domain modules shed palette ownership gradually |
| **Cons** | Transitional complexity; requires discipline; multiple implementation sprints |
| **Verdict** | **Accepted.** This is the decision recorded in this ADR. |

### C) Replace runtime maps entirely

**Description:** Remove `BAND_STYLES` / `GPS_TONE_STYLES` / `BADGE_STYLES`; move all presentation to CSS classes or component variants keyed by semantic data attributes.

| | |
|-|-|
| **Pros** | Eliminates TS presentation maps; CSS-only styling |
| **Cons** | Large blast radius; breaks inline-style consumer pattern across Calendar/Ask/Home; requires component refactor beyond token consumption; higher regression risk; conflicts with incremental ADR-DS-001 approach |
| **Verdict** | **Rejected.** Replacing maps is implementation redesign, not consumption. May be revisited for individual surfaces in future ADRs — not as global strategy. |

---

## Risks

| Risk | Description | Mitigation principle |
|------|-------------|---------------------|
| **Visual regression** | Opacity differences across maps (`0.32` vs `0.08` vs `0.15` for success bg) mean naive unification changes UI | MP-5 parity measurement; register opacity as distinct semantic sub-tokens |
| **Token drift** | New literals added during migration | MP-7 no-new-literals rule |
| **Performance** | Runtime resolver or additional indirection adds bundle/render cost | Principle 7; baseline comparison per [BASELINE.md](../../performance/BASELINE.md) |
| **Developer confusion** | Two valid patterns during transition (literals vs semantics) | Registry compliance table; one-map-at-a-time reduces overlap period |
| **Rollback complexity** | Partial migration leaves mixed literal/semantic maps | MP-4 single-commit revert; MP-2 isolated map scope |
| **Semantic oversimplification** | Collapsing distinct opacities into one `color.status.success` loses intentional UI nuance | Principle 4 — register nuance as named semantics, not hard-coded unification |

---

## Out of Scope

The following are explicitly **not** part of ADR-DS-002:

- Migration implementation (any sprint)
- CSS, TypeScript, or component edits
- Visual changes or palette unification
- Renaming `BAND_STYLES` / `GPS_TONE_STYLES` / `BADGE_STYLES`
- Defining resolver implementation (function name, module location, init vs lazy)
- Merging duplicate semantic values across maps
- New semantic token values (only consumption rules)
- Reopening or amending ADR-DS-001

---

## Success Criteria

After this ADR is **accepted**, a DS-02 **implementation** sprint should require **no further architectural decisions**. Engineering execution only:

| Decision already made | Implementation executes |
|----------------------|-------------------------|
| Maps consume semantics | Wire resolver / references |
| One map at a time | Pick first map per implementation plan |
| Parity required | Screenshot + literal diff tests |
| Registry-first | Register sub-tokens before binding |
| No performance regression | Build + Lighthouse spot-check |

Open questions reserved for implementation (not architecture):

- Resolver module location
- CSS var vs TS const resolution path
- Exact migration order within maps
- Feature flag mechanics

---

## Related Documents

| Document | Path | Role |
|----------|------|------|
| ADR-DS-001 | [ADR-DS-001-design-system-architecture.md](./ADR-DS-001-design-system-architecture.md) | Parent architecture (locked) |
| Design Token Registry | [design-token-registry.md](../../design/system/design-token-registry.md) | Canonical authority; Tier 3 compliance table |
| Design Token Inventory | [design-token-inventory.md](../../design/system/design-token-inventory.md) | Historical literal values for parity |
| Component catalog | [component-catalog.md](../../design/system/component-catalog.md) | Map consumers |
| Performance Baseline | [BASELINE.md](../../performance/BASELINE.md) | Regression gate |
| UI Audit | [ui-audit/README.md](../../design/ui-audit/README.md) | Evidence baseline |
| Decision Log | [DECISION_LOG.md](../DECISION_LOG.md) | Permanent decision registration |

*Note: `DECISION_REGISTRY.md` referenced in sprint brief was not present at authoring time.*

---

## Recommendation

**This ADR is recommended for approval.**

ADR-DS-001 and DS-01 established **what** the token architecture is. ADR-DS-002 closes the open question of **how runtime maps participate** — without mandating code change in this sprint.

Approval enables a future DS-02 implementation sprint to execute against fixed principles: incremental migration, visual parity, registry governance, and performance safety.

Upon acceptance:

1. Add to [ADR_INDEX.md](../ADR_INDEX.md) as `ADR-DS-002`
2. Register in [DECISION_LOG.md](../DECISION_LOG.md)
3. Update registry Tier 3 section with pointer to this consumption contract

---

## Governance Review

| Check | Result |
|-------|--------|
| ADR-DS-001 reopened | **No** — extended only |
| Rule 0 / locked brand decisions | **No impact** |
| Implementation in this sprint | **None** |
| Visual change | **None** |

---

## Version History

| Date | Status | Summary |
|------|--------|---------|
| 2026-07-07 | Proposed | Runtime semantic token consumption principles |

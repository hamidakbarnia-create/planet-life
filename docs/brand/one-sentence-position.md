# One Sentence Position — METIORO

> **Status:** PROPOSAL  
> **Open Registry Item:** #1 — One Sentence Position  
> **Authority:** Governance documentation sprint (documentation only)  
> **Date:** 2026-07-07

This document proposes a canonical **One Sentence Position** for METIORO. It does **not** declare the sentence official. No locked decision is modified by this file.

---

## Context

### Why a positioning sentence exists

METIORO uses several short-form brand expressions, each with a distinct job. Without a dedicated **positioning sentence**, category definition is often inferred from the hero headline, tagline, or mission statement — which causes category confusion (decision intelligence vs. timing hook vs. call to action).

The One Sentence Position closes that gap. It is the single authoritative answer to:

> **What is METIORO?**

It is used where a neutral, durable category statement is required — for example:

- Governance and onboarding documents
- Investor, partner, and press one-liners (non-campaign)
- App store category descriptions (primary line)
- Internal alignment when scoping features (“does this serve Personal Decision Intelligence?”)
- Localization briefs (master English position before translation)

It is **not** used as hero copy, UI headline, or conversion CTA.

### How it differs from other expressions

| Expression | Role | Locked example (do not conflate) |
|------------|------|----------------------------------|
| **One Sentence Position** | Defines what the product **is** (category + scope) | *This proposal* |
| **Hero headline** | Emotional entry hook; first-screen recognition | *Every decision has a better time.* |
| **Tagline / Constitutional sentence** | Brand promise; orientation toward action | *Know your next move.* |
| **Mission** | Why the organization exists (purpose over time) | Help people make better personal decisions through structured, explainable intelligence |
| **Vision** | Aspirational future state (not locked in this sprint) | — |

**Distinction rules observed in this proposal:**

- The positioning sentence **names the category** (*Personal Decision Intelligence*).
- It does **not** repeat the hero’s timing hook (“better time”).
- It does **not** repeat the constitutional call to action (“next move”).
- It does **not** state mission breadth (“help people make better decisions”) without defining the product form.
- It remains **descriptive**, not imperative — unlike tagline or hero.

### Governance sources reviewed

This proposal was drafted against:

- [docs/governance/README.md](../governance/README.md)
- [docs/governance/METIORO_CONSTITUTION.md](../governance/METIORO_CONSTITUTION.md) (Chapters 1–2, Appendix B)
- [docs/governance/BRAND_IDENTITY_STANDARD.md](../governance/BRAND_IDENTITY_STANDARD.md)
- [docs/governance/DECISION_LOG.md](../governance/DECISION_LOG.md) (DEC-0001, DEC-0003, DEC-0004)

`docs/governance/DECISION_REGISTRY.md` and standalone Brand Constitution / Lexicon / Constraints files referenced in the sprint brief were not present in the repository at authoring time. Equivalent constraints were taken from the Constitution and Brand Identity Standard without reopening any locked entry.

---

## Candidate Evaluation

Five candidates were generated. Each is one sentence. Evaluation uses observable fit against governance — not marketing preference.

| # | Candidate sentence |
|---|-------------------|
| **C1** | METIORO is a Personal Decision Intelligence platform that scores and explains timing and context for personal decisions. |
| **C2** | METIORO is Personal Decision Intelligence—structured, explainable guidance for evaluating when and why to act on personal decisions. |
| **C3** | METIORO is a Personal Decision Intelligence platform that connects astronomical signals to AI reasoning so you can evaluate timing, context, and options before you decide. |
| **C4** | METIORO is Personal Decision Intelligence for life's concrete decisions: scored, explainable, and always advisory. |
| **C5** | METIORO is an AI-powered Personal Decision Intelligence platform that helps you find the best moment to act, with reasoning you can see and trust. |

### Comparison table

| Criterion | C1 | C2 | C3 | C4 | C5 |
|-----------|:--:|:--:|:--:|:--:|:--:|
| **Clarity** (what it is in one read) | High | High | Medium | High | Medium |
| **Credibility** (calm, scientific, non-mystical) | High | High | High | High | Medium |
| **Memorability** | Medium | Medium | Low | High | Medium |
| **International readability** | High | High | Medium | High | Medium |
| **Brand Constitution compatibility** | High | High | High | High | Medium |
| **Product Category compatibility** (DEC-0001) | High | High | High | High | High |
| **Long-term durability** | High | High | High | Medium | Low |
| **Distinct from hero headline** | High | High | High | High | Low |
| **Distinct from constitutional sentence** | High | High | High | High | High |
| **Explainability alignment** | High | High | High | High | High |
| **Human agency / advisory model** | Medium | Medium | High | High | Medium |

**Notes on candidates (observable only):**

- **C5** uses “best moment to act,” which overlaps the hero headline’s timing promise (*Every decision has a better time.*). It risks category/tool confusion and was not advanced.
- **C3** aligns with the locked product philosophy (*Astronomy provides the signals. AI provides the reasoning. Humans make the decision.*) but is longer and introduces “astronomical signals,” which may require additional context in some locales.
- **C4** is compact and emphasizes the advisory model, but the colon structure reads closer to a tagline than a formal position statement.
- **C2** is strong on explainability but “when and why to act” edges toward user-facing promise language shared with the constitutional sentence’s action orientation.
- **C1** states category, core mechanism (scores + explains), and scope (timing, context, personal decisions) without imperative verbs or hero duplication.

---

## Recommendation

### Proposed One Sentence Position

> **METIORO is a Personal Decision Intelligence platform that scores and explains timing and context for personal decisions.**

### Why this sentence was selected

1. **Category fidelity** — Opens with the locked product category (*Personal Decision Intelligence*, DEC-0001) in plain form. A reader immediately knows what METIORO *is*, not what to feel or do.
2. **Product truth** — “Scores and explains” reflects actual platform behavior: numerical decision scores (0–100) with visible reasoning. This matches the Explainability Model and Constitution §2.1 (evaluate timing, context, and options).
3. **Governance tone** — Calm and scientific. No mystical, predictive, or fate-based vocabulary. No pressure to act.
4. **Separation from locked copy** — Does not reproduce the hero headline (*better time*), constitutional sentence (*next move*), or mission paragraph. It describes the system; other expressions motivate and orient.
5. **Durability** — Avoids feature-specific nouns (Vault, Julia, Calendar) and implementation details (AI, astronomy) that may shift in surface marketing while the category remains stable.
6. **International readiness** — Short clausal structure; “Personal Decision Intelligence” is already the canonical English category string used across governance and i18n (`appTagline`).

### Why it is stronger than the alternatives

| Alternative | Primary weakness relative to C1 |
|-------------|--------------------------------|
| C2 | Leans toward promise language (“when and why to act”) shared with tagline/constitutional orientation |
| C3 | Longer; “astronomical signals” adds translation and credibility risk in non-technical contexts |
| C4 | Format reads as slogan; less explicit about mechanism (scoring + explanation) |
| C5 | “Best moment to act” collides with hero headline territory |

---

## Governance Review

Explicit confirmation for this **PROPOSAL** document:

| Check | Result |
|-------|--------|
| **No locked decision reopened** | Confirmed. Hero headline, constitutional sentence, product category, brand tone pillars (DEC-0004), and logo direction (DEC-0003) are cited but not altered. |
| **No brand constraint violated** | Confirmed. Sentence does not position METIORO as fortune telling, prophecy, entertainment astrology, or mystical guidance (Constitution §2.2; Brand Identity Standard §8.1). |
| **Compatible with Constitution** | Confirmed. Aligns with §1.2 (Personal Decision Intelligence), §2.1 (timing, context, options), §2.3 (advisory model), and §3.2 (explainability before accuracy claims). |
| **Compatible with Brand Identity Standard** | Confirmed. Calm, scientific, explainable, never mystical. Describes; does not decree outcomes. |
| **Compatible with Position Constitution** | Confirmed. Positions METIORO as decision intelligence (not astrology entertainment). Category string matches DEC-0001. |
| **Rule 0 observed** | Confirmed. No source code, UI, hero, landing copy, or constitutional text was modified. Documentation only. |

**Non-action:** This proposal does not resolve the documented variant between governance texts (*Know your best next move.* in Constitution / Brand Identity Standard) and sprint-locked shorthand (*Know your next move.* in product copy). That reconciliation is out of scope for Open Registry Item #1 and would require a separate governance process if pursued.

---

## Amendment Status

```
PROPOSAL  ←  current status (this document)
   ↓
Review
   ↓
Amendment
   ↓
Commit
   ↓
Lock
```

- **This document is a PROPOSAL only.** The sentence is not official, locked, or deployed.
- **No existing document is replaced** by this file.
- Upon approval, the sentence should be registered in the Decision Log and referenced from Brand Identity Standard or a future Brand Position Constitution — following the amendment workflow above.
- Until locked, all production copy remains governed by existing locked decisions.

---

## References

| Artifact | Relationship |
|----------|--------------|
| DEC-0001 | Product category: Personal Decision Intelligence |
| DEC-0004 | Brand tone: Calm, Scientific, Explainable, Never Mystical |
| Constitution §1.2–§1.4 | Category, sentence, advisory model |
| Constitution §2.1 | Timing, context, options |
| Brand Identity Standard §2, §8 | Essence and boundaries |
| Hero headline (locked) | *Every decision has a better time.* — not superseded |
| Constitutional sentence (locked) | *Know your next move.* — not superseded |

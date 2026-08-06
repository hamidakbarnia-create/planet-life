# GOV-ISSUE-001 — EPIC-001 Package Module Set Conflict

| Field | Value |
|-------|-------|
| **ID** | GOV-ISSUE-001 |
| **Status** | **CLOSED** — Option A accepted |
| **Opened** | 2026-08-04 |
| **Closed** | 2026-08-04 |
| **Resolves** | EG-02 |
| **Decision Log** | DEC-0017 |

---

## Resolution (Option A)

**Accepted:** Engineering brief labels were abbreviated for readability.
**Normative package module set remains ACR-0001 §B3 `DecisionEvaluationPackage` v1 in full.**

Including: `evidence`, `counter_recommendation`, `next_decisions`, `explainability`, and all other ACR modules.
`Evaluation Metadata` = envelope fields only, not a content module and not a license to drop ACR modules.

Option B (amend ACR to reduce modules) is **rejected**.

---

## Binding rule

Any EPIC-001 PR that ships a package schema omitting ACR modules is **non-compliant** and must not merge.

---

## Related

- Safety Standard for EPIC-001 ≡ DQS Part 5 (DEC-0017; Decision Quality Standard remains a draft/future artifact not in the repository baseline)
- Language Standard for EPIC-001 ≡ DQS Part 6 (DEC-0017; same)

**End of GOV-ISSUE-001**

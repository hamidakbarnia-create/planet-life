# GOV-ISSUE-003 — ADR-0015 Wire Contract Gaps (E5 Blocker)

| Field | Value |
|-------|-------|
| **ID** | GOV-ISSUE-003 |
| **Status** | **CLOSED** |
| **Date** | 2026-08-04 |
| **Closed** | 2026-08-04 — Owner ratification DEC-0020 (**ACCEPTED**) |
| **Board** | METIORO Governance Resolution Board |
| **Blocks** | None (E5 authorized for ACTIVE_IN_E5; create-time type authority via registry seam) |
| **Issues** | GOV-API-01 … GOV-API-06 |
| **Authority** | Complements ADR-0015; does not amend ACR-0001 or ADR-0014 |
| **Ratification vehicle** | DEC-0020 + [ADR-0015 Wire Supplement 01](../adr/ADR-0015-WIRE-SUPPLEMENT-01-E5-Activation.md) |

---

## 1. Governance issue summary

E5 is blocked because ADR-0015 freezes paths and status *codes* but omits request/response/error wire detail, concurrency on the wire, owner transport, and an honest activation subset for routes owned by later tasks (E6/E8/E10+).

This issue authorizes a **minimum wire supplement** so E5 can expose only routes fully supported by committed E3 + E4, with complete contracts and no stubs for DIE/intake/registry/classifier.

---

## 2. Current gaps

| ID | Gap |
|----|-----|
| GOV-API-01 | Missing write request schemas |
| GOV-API-02 | `expected_case_version` absent on wire |
| GOV-API-03 | Incomplete response/list/history/evaluation envelopes |
| GOV-API-04 | Error envelope undefined |
| GOV-API-05 | Owner isolation transport undefined; Auth runtime paused |
| GOV-API-06 | Full route matrix includes later-task capabilities |

Normative detail: **ADR-0015 Wire Supplement 01**.

---

## 3. Canonical determinations (summary)

1. **E5 activation subset** — only create/list/get, complete, archive, evaluation reads, history. Intake writes, evaluation writes, comparison writes reserved.  
2. **Concurrency** — Option **A**: `expected_case_version` required JSON body field on material writes; create exempt.  
3. **Errors** — ADR-0006-compatible envelope with `code`, `message`, `requestId`, optional `details`.  
4. **Owner** — Option **A**: single governed internal owner context; `403` reserved until Identity/Auth.  
5. **OpenAPI** — publish only `ACTIVE_IN_E5` routes.  
6. **No stubs** — reserved routes absent from E5 OpenAPI and must not return fake success.

---

## 4. Documents

| Action | Document |
|--------|----------|
| Create | `docs/adr/ADR-0015-WIRE-SUPPLEMENT-01-E5-Activation.md` |
| Create | DEC-0020 in Decision Log |
| Amend | `docs/governance/ADR_INDEX.md`, `DOCUMENT_HIERARCHY.md` |
| Do not amend | ACR-0001, ADR-0014, LAP-001, DQS, E3/E4 code |

---

## 5. E5 / later-task impact

| Task | Impact |
|------|--------|
| **E5** | Implement only active routes + supplement schemas |
| **E6** | Activate intake routes + schemas |
| **E8** | Activate `entry_mode=natural_language` on create |
| **E10+** | Activate POST evaluations / comparisons + package write path |
| **E2** | Formal registry file remains authority; E5 uses epic-frozen three-type allowlist until E2 lands, then must load registry |

---

**End of GOV-ISSUE-003**

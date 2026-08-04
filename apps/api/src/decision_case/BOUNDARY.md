# apps/api/src/decision_case — boundary (EPIC-001)

| Path | Owner | Responsibility | Forbidden |
|------|-------|----------------|-----------|
| `repository/` | **E4 COMPLETE** | Decision Case PostgreSQL SoR | HTTP routes, DIE scoring, intake logic, dual-write |
| `routes/` | E5 | ADR-0015 handlers only | Direct SQL bypassing repository |

Sole SoR write path: `repository/`. Web/Conversation must not persist Case authority.

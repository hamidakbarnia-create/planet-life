# packages/decision_engine — module boundary (EPIC-001)

| Module | Owner task | Responsibility | Forbidden |
|--------|------------|----------------|-----------|
| `state_machine.py` | **E3 COMPLETE** | Pure Case lifecycle + LAP-001 composites + `activation_phase` | Persistence, HTTP, DIE scoring, intake |
| `facade.py` / `mapper.py` / `models.py` | Legacy | Pre-Case facade — **not** Case SoR | Must not write Decision Case repository |
| Future Case eval modules | E1+ | Package schema / DIE adapters beside legacy | Must not redefine ACR states |

**SoR rule:** Decision Case Repository (`apps/api/src/decision_case/repository/`) is the only persistence SoR (E4+). This package holds pure domain logic only for E3.

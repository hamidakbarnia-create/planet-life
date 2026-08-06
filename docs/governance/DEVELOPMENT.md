# DEVELOPMENT.md

> **Status:** PROPOSED  
> **Authority:** Operational  
> **Owner:** Project owner  
> **Effective Date:** 2026-07-11  
> **Last Updated:** 2026-07-11  
> **Scope:** Contributor development, verification, and submission workflow for METIORO.

---

## 1. Purpose

Define the canonical developer workflow for METIORO: how to set up the environment, make changes, verify them, and submit them safely.

This document governs *how work is executed*. It does not redefine product identity, trust rules, architecture, or locked decisions.

---

## 2. Scope

In scope:

- Local development environment and repository access rules
- Python and Node tooling expectations
- Standard inspect → implement → verify → commit → push cycle
- Pre-push release gate commands
- Development/test dependency recording
- Common environment troubleshooting

Out of scope:

- Constitutional principles, brand, or trust architecture
- Architecture Decision Records (ADRs)
- Product roadmap or feature design
- Runtime legal copy or compliance policy text

---

## 3. Authority

This document is **Operational** guidance. It is subordinate to higher-level governance and must remain consistent with:

| Priority | Instrument |
|----------|------------|
| Higher | [METIORO Constitution](./METIORO_CONSTITUTION.md) |
| Higher | [GOVERNANCE.md](./GOVERNANCE.md) (Review / Sprint protocols) |
| Higher | [DOCUMENT_HIERARCHY.md](./DOCUMENT_HIERARCHY.md) |
| Cross-cutting (navigation, non-normative) | [ADR Index](./ADR_INDEX.md) |
| Cross-cutting (normative) | Accepted/LOCKED ADRs referenced from the ADR Index |
| Cross-cutting | [Decision Log](./DECISION_LOG.md) LOCKED entries |

If this document conflicts with a higher-level instrument, the higher-level instrument prevails. Do not use this file to reinterpret locked decisions.

---

## 4. Repository Layout

Work from the repository root:

```text
~/planet-life-wsl
```

Primary surfaces:

| Path | Role |
|------|------|
| `apps/web/` | Next.js web application (Node/npm) |
| `apps/api/` | FastAPI service (Python `.venv`) |
| `packages/` | Shared packages (e.g. decision / astro engines) |
| `docs/governance/` | Governance instruments |
| `.github/workflows/` | CI release gate |

Do not treat Cursor project-metadata directories or agent transcript folders as the repository.

---

## 5. Repository Policy

| Role | Location | Rule |
|------|----------|------|
| **Canonical repository** | `/home/akbar/planet-life-wsl` | Sole working copy for development. Remote: `https://github.com/hamidakbarnia-create/planet-life.git` |
| **Retired Windows repository** | `C:\planet-life-RETIRED-2026-07-10` | Prohibited for any development execution. Do not recreate `C:\planet-life`. |
| **Archive** | `C:\planet-life-retirement-backup-2026-07-10` | Verified bundle + patches; official archive of superseded Windows-only commits. Reference only — never a working copy. |
| **Production** | `https://metioro.com`, `https://api.metioro.com` | Verification targets only. No development against production. |

---

## 6. Development Environment

### Mandatory environment

1. Develop **in WSL only** (Ubuntu or the project’s designated WSL distro).
2. Keep the repository on the **Linux filesystem** (canonical path: `/home/akbar/planet-life-wsl`).
3. Run Git **inside WSL**, from the Linux path.
4. **Do not** run Git from Windows against a WSL-hosted repository.
5. **Avoid UNC path Git operations** (e.g. `\\wsl.localhost\...`). Use `/home/...` inside WSL.
6. Use Node/npm from WSL for `apps/web` (`npm ci`, `npm run …`).
7. Treat `/home/akbar/planet-life-wsl` (or `~/planet-life-wsl`) as the canonical repository root for all commands below unless a step `cd`s into a package.

### Before starting work

```bash
cd ~/planet-life-wsl
git rev-parse --show-toplevel
git branch --show-current
git status --short
```

Confirm a clean or intentionally staged working tree before beginning a change set.

---

## 7. Python Environment

### Canonical interpreter

Use only:

```bash
apps/api/.venv/bin/python
```

(from the repository root, or the equivalent absolute path under `/home/akbar/planet-life-wsl`).

### Rules

1. **Never** execute project API/test commands with the system Python (`/usr/bin/python3` or `python3` outside `.venv`).
2. **Do not** silently fall back to system Python if `.venv` is broken.
3. **Warning (this WSL setup):** bare `python` may resolve to `/mnt/c/WINDOWS/system32/python` via `PATH`. That interpreter is **not** trusted for this project. Only `apps/api/.venv/bin/python` is trusted.
4. Prefer explicit venv invocation:

```bash
cd ~/planet-life-wsl
apps/api/.venv/bin/python -m pytest apps/api/tests -q
```

### Known issue: `.venv` without `pip`

If `apps/api/.venv` exists but `pip` is missing:

1. Prefer restoring pip in place when appropriate:

```bash
apps/api/.venv/bin/python -m ensurepip --upgrade
```

2. If restore fails or the environment is corrupted, **recreate** the virtual environment, then install from the canonical dependency files (see §10).

Do not “fix” a broken venv by switching to system Python or Windows Python on `/mnt/c`.

---

## 8. Standard Development Workflow

Follow this cycle for every change set:

| Stage | Action |
|-------|--------|
| **Inspect** | Confirm branch, HEAD, and working-tree state. Read relevant governance/ADRs before changing governed surfaces. |
| **Implement** | Make the minimal change required. Stay within authorized scope. |
| **Self Review** | Self-review the full diff for unintended files, secrets, and scope creep. |
| **External Review** | Obtain external review of the full diff as required by project process. |
| **APPROVED TO COMMIT** | Await explicit APPROVED TO COMMIT from the reviewer on the full diff. |
| **Commit** | Create a focused commit that is byte-identical to the approved diff, per [GOVERNANCE.md](./GOVERNANCE.md). |
| **Push** | Push only after the release gate passes locally. |
| **Observe CI** | Confirm the remote CI release gate matches local results. Investigate mismatches (§11). |

Do not skip verification. Do not push to clear a red gate without understanding the failure.

---

## 9. Pre-Push Release Gate

Run the full gate from a WSL shell before every push:

```bash
cd ~/planet-life-wsl/apps/web
npm run build
npm run lint
npm run test

cd ~/planet-life-wsl
apps/api/.venv/bin/python -m pytest apps/api/tests -q
```

A push is release-ready only when every command above completes successfully.

**Push only after all commands pass.**

Notes:

- Use the canonical venv interpreter for pytest (§7).
- If API test dependencies are missing, install from `apps/api/requirements-dev.txt` (§10)—do not invent ad-hoc packages.
- CI is the remote counterpart of this gate; local green should precede push.

---

## 10. Dependency Governance

1. Every **manually installed** development or test dependency must be recorded in the canonical dependency file for that surface.
2. API development/test dependencies are managed through:

```text
apps/api/requirements-dev.txt
```

3. Runtime API dependencies remain in `apps/api/requirements.txt`. Do not move runtime-only packages into ad-hoc local installs.
4. Web dependencies are managed through `apps/web/package.json` / lockfile via npm—do not rely on globally installed Node packages for project work.
5. Web dependency changes must update `package-lock.json` via npm (`npm install`); commit the lockfile with the dependency change.
6. Avoid undocumented local-only packages. If CI lacks a package you installed locally, record it and update the install path so CI and local environments converge.

Install API dev/test deps (example):

```bash
cd ~/planet-life-wsl
apps/api/.venv/bin/python -m pip install -r apps/api/requirements-dev.txt
```

---

## 11. Troubleshooting

### Missing `pip` in `.venv`

Symptom: `…/.venv/bin/python -m pip` fails.

1. Try `apps/api/.venv/bin/python -m ensurepip --upgrade`.
2. If that fails, recreate `.venv` and reinstall from `requirements-dev.txt`.
3. Do not fall back to `/usr/bin/python3` or Windows Python under `/mnt/c`.

### Windows Git / dubious ownership

Symptom: Git from Windows reports dubious ownership or odd errors on a WSL repo.

1. Stop using Windows Git against the WSL tree.
2. Open a WSL terminal and use `/home/akbar/planet-life-wsl`.
3. Do not change `safe.directory` or repository ownership as a workaround unless explicitly directed by project owners.

### WSL repository usage

1. Clone/work only under the Linux filesystem (canonical: `/home/akbar/planet-life-wsl`).
2. Avoid editing or running Git via `\\wsl.localhost\...` UNC paths.
3. Keep Node and Python toolchains inside WSL for this repo.
4. Do not use the retired Windows path or recreate `C:\planet-life` (§5).

### Dependency synchronization

Symptom: Tests pass locally but fail in CI (or the reverse) with `ModuleNotFoundError` / missing packages.

1. Diff local installs against `apps/api/requirements-dev.txt` (API) or the web lockfile.
2. Add missing recorded dependencies; remove unrecorded local-only packages from your assumptions.
3. For web changes, confirm `package-lock.json` was updated via npm and committed.
4. Re-run the Pre-Push Release Gate.

### CI mismatch investigation

1. Confirm you ran the same gate commands as CI (§9).
2. Confirm interpreter path (`apps/api/.venv/bin/python`) and Node version expectations.
3. Confirm dependency files used by CI match what you installed locally.
4. Compare workflow revision — confirm CI ran the workflow file from the pushed commit.
5. Reproduce with a clean install when needed (`npm ci`, fresh venv + `requirements-dev.txt`).

---

## 12. References

| Document | Path | Role |
|----------|------|------|
| Governance (operational protocols) | [`docs/governance/GOVERNANCE.md`](./GOVERNANCE.md) | Review / Sprint protocol |
| METIORO Constitution | [`docs/governance/METIORO_CONSTITUTION.md`](./METIORO_CONSTITUTION.md) | Supreme authority |
| Document Hierarchy | [`docs/governance/DOCUMENT_HIERARCHY.md`](./DOCUMENT_HIERARCHY.md) | Placement / authority levels |
| ADR Index | [`docs/governance/ADR_INDEX.md`](./ADR_INDEX.md) | Architecture decision navigation (non-normative) |
| Decision Log | [`docs/governance/DECISION_LOG.md`](./DECISION_LOG.md) | LOCKED permanent decisions |
| Cursor / agent context | [`cursor_context.md`](../../cursor_context.md) | Local tooling context (non-normative) |
| This document | [`docs/governance/DEVELOPMENT.md`](./DEVELOPMENT.md) | Operational developer workflow |

---

## 13. Changelog

| Date | Change |
|------|--------|
| 2026-07-11 | Initial version (PROPOSED). |

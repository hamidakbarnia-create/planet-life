# Ask Quality Evaluation Baseline (P1-T05-02)

Deterministic, versioned evaluation framework for METIORO Ask response quality.

This package establishes the baseline against which future prompt, grounding,
personalization, and retrieval changes are compared.

## What this is

| Artifact | Purpose |
|---|---|
| `dataset_v1.json` | Fixed evaluation scenarios (immutable once baselined) |
| `rubric_v1.json` | Explicit 0–4 scoring criteria per quality dimension |
| `baseline/` | Generated baseline reports (provider-specific) |
| `templates/` | Human review CSV/JSONL schema |

Subjective quality scores are **not** invented by the structural evaluator.
They require a human reviewer (or an explicitly approved evaluator).

## What this is not

- Not a production prompt change
- Not a public Conversation API change
- Not Today / Calendar / World / Vault / memory integration
- Not a mandatory LLM-as-judge dependency
- Not a live OpenAI call in CI

## Layout

```text
apps/api/evaluations/ask/          # versioned data + reports
apps/api/src/evaluations/ask/      # loader, structural evaluator, runner
```

## CLI

From the repository root:

```bash
PYTHONPATH=apps/api/src python -m evaluations.ask.runner \
  --dataset apps/api/evaluations/ask/dataset_v1.json \
  --rubric apps/api/evaluations/ask/rubric_v1.json \
  --provider static \
  --output apps/api/evaluations/ask/baseline/static-baseline.json
```

Options:

```text
--provider static|openai
--dataset PATH
--rubric PATH
--output PATH
--limit N
--scenario-id ask-001
--scenario-ids ask-001,ask-003,ask-025
--no-review-template
```

Selected-scenario pilot (explicit ID list, caller order preserved):

```bash
PYTHONPATH=apps/api/src python -m evaluations.ask.runner \
  --dataset apps/api/evaluations/ask/dataset_v1.json \
  --rubric apps/api/evaluations/ask/rubric_v1.json \
  --provider openai \
  --scenario-ids ask-001,ask-003,ask-025 \
  --output apps/api/evaluations/ask/baseline/openai-pilot.json
```

`--scenario-id` and `--scenario-ids` are mutually exclusive.
`--limit` cannot be combined with `--scenario-ids`.

OpenAI runs use existing runtime configuration (`OPENAI_API_KEY`,
`OPENAI_MODEL`, `OPENAI_TIMEOUT_SECONDS`). API keys are never written into
reports.

## Structural vs subjective scoring

```text
structural checks  → deterministic, automated, objective
human/model scores → rubric dimensions, filled separately
```

The baseline report sets `subjective_scores_included: false` unless a human
review artifact is explicitly merged later.

## Versioning rules

- Do not overwrite `dataset_v1.json` or `rubric_v1.json` after baseline approval.
- Material changes must create `dataset_v2.json` / `rubric_v2.json`.
- Every report records dataset version, rubric version, prompt version,
  provider, and model.

## Human review

After a runner execution, a companion CSV is written:

```text
<output-stem>-human-review.csv
```

Schema details: `templates/human_review_schema.json`.

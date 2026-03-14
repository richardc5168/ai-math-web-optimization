# AI Math Web Long-Run Agent Rules

This file defines the always-on workflow for long-running agent work in this repository.

## Role

You are a long-term maintenance and optimization agent for this AI math education project.
Your job is not to finish one isolated change and stop. Your job is to make each iteration more reliable, more explainable, and less likely to repeat old mistakes.

Primary product goals:
- Student answer flow is clearer and less error-prone.
- Hint quality is more useful, more consistent, and does not leak final answers.
- Parent reports are easier to understand at a glance.
- Student statistics are trustworthy and use consistent definitions.
- Recent wrong-answer analysis is correct, time-ordered, and explainable.
- Each iteration leaves behind reusable engineering knowledge.

## Mandatory Read Order Before Any Meaningful Change

Read these before proposing or applying a patch:
1. README.md
2. This AGENTS.md
3. logs/change_history.jsonl
4. logs/lessons_learned.jsonl
5. reports/latest_iteration_report.md
6. Any feature-specific spec, benchmark, validator, or test files related to the task

If the task touches mathgen/, also follow the dedicated mathgen workflow already defined in .github/copilot-instructions and mathgen docs/logs.

## Non-Negotiable Rules

1. Do not use chat memory as the primary source of project truth.
   Durable engineering knowledge must be written into repository files.

2. Do not repeat known failed approaches.
   If logs show a previous fix failed or had side effects, do not reuse it unless you explicitly explain why conditions changed.

3. Define done before editing.
   Every iteration must state:
   - goal
   - out-of-scope areas
   - acceptance criteria
   - risk points
   - verification plan

4. Do not guess data semantics.
   Every statistics or ordering change must explicitly state:
   - data source
   - event grain
   - aggregation rule
   - sorting key
   - dedupe rule
   - UI display rule

5. Prefer low-risk, reversible changes.
   Choose focused patches with clear verification over broad rewrites.

6. Keep docs and dist in sync.
   If a change touches docs content that is mirrored in dist_ai_math_web_pages/docs, both sides must be updated together.

7. No hint leaks.
   Hints, especially upper hint levels, must guide rather than reveal the final answer verbatim.

8. No silent failures.
   If an item is invalid, the system should fail with enough detail to identify the record and reason.

9. Separate confirmed facts from assumptions.
   Label any unverified hypothesis clearly.

10. Every completed iteration must write back repository memory.

## Required Pre-Flight Questions

Before generating a patch, answer these in your working notes or user-facing plan:
1. Has a similar bug or optimization already been handled?
2. Which prior fix patterns were effective?
3. Which prior fix patterns failed or caused regressions?
4. What mistake is most likely to repeat if the old approach is reused?
5. How will this iteration avoid that mistake?
6. What new validation will stop the same bug from returning?

## Definition Of Done

An iteration is done only when all of the following are satisfied:
- The target behavior matches the stated acceptance criteria.
- The smallest practical verification set has been executed and reported.
- Relevant docs/dist mirrors are synchronized.
- logs/change_history.jsonl is updated.
- logs/lessons_learned.jsonl is updated.
- reports/latest_iteration_report.md is updated.
- Residual risks and next iteration priorities are written down.

For bank, validator, hint, or report logic changes, prefer running at least:
- python tools/validate_all_elementary_banks.py
- python scripts/verify_all.py

After push/deploy, when local and remote are expected to match:
- node tools/cross_validate_remote.cjs

## Standard Iteration Output Contract

Each meaningful task should produce, at minimum:
- Executive summary
- Root cause summary
- Problem severity
- Affected files
- Previous logic
- New logic
- Validation plan
- Validation result
- Residual risks
- Next iteration recommendation

## Writeback Requirements

After each iteration, update:
- logs/change_history.jsonl
- logs/lessons_learned.jsonl
- reports/latest_iteration_report.md

Writeback content must include:
- root cause
- effective fix
- failed or risky approaches
- tests run
- result
- remaining risk
- specific instruction for next time

## Repository-Specific Focus Areas

When working on parent reports, student stats, wrong-answer summaries, or hint systems, prioritize:
- timestamp integrity
- event-level correctness over summary-level guessing
- stable sorting semantics
- parent-readable copy
- consistency between local data, cloud data, and rendered UI

## Anti-Patterns To Avoid

- Fixing only the UI when the defect originates in the data layer
- Sorting after slicing when the requirement is latest N events
- Treating summary snapshots as if they were raw event logs
- Using implicit or mixed identity keys across data sources without verification
- Shipping a fix without writing down the verified root cause

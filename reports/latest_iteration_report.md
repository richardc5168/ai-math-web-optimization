# Latest Iteration Report

## Iteration Goal

Fix exam-sprint so a wrong attempt does not break corrected resubmission, while preserving the existing simplest-fraction rule.

## Root Cause Summary

The core answer-checking logic already supported retry and already rejected numerically-correct but non-simplified fraction answers. The actual regression was in keyboard/focus behavior after a wrong attempt:

- the page entered a wrong-answer gate state
- Enter was overloaded to acknowledge that gate when focus was not in the answer input
- after submit, browser focus could remain on the submit button
- the next Enter therefore acknowledged/advanced instead of re-running check on the corrected answer

This made the product feel like a wrong answer had locked further submission even though the underlying validator still supported retries.

## Files Changed

- docs/exam-sprint/index.html
- dist_ai_math_web_pages/docs/exam-sprint/index.html
- logs/change_history.jsonl
- logs/lessons_learned.jsonl
- reports/latest_iteration_report.md

## New Logic

1. Added a small retry-focus helper that returns focus to the answer input after every wrong attempt.
2. Updated Enter-key handling so Enter on the submit button runs the same check path as Enter in the answer input.
3. Kept the existing fraction simplest-form enforcement unchanged.

## Validation Result

Passed:

- get_errors on docs/dist exam-sprint index.html
- python tools/validate_all_elementary_banks.py
- python scripts/verify_all.py

## Residual Risks

1. Moving to the next question after a wrong attempt is still intentionally gated behind acknowledge or skip. That is current product behavior, not a bug in this iteration.
2. Other keyboard shortcuts in exam-sprint may still deserve a dedicated UX audit if future reports mention focus-dependent inconsistencies.

## Recommended Next Iteration

Audit all focus-sensitive shortcuts in exam-sprint and other interactive modules with this checklist:

- Enter on input after error re-validates
- Enter on submit button after error re-validates
- navigation shortcuts do not outrank submit when a form is retryable
- wrong-answer gates do not implicitly steal the primary action from corrected resubmission

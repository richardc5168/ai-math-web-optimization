# Model-Assisted Generation Policy (Phase 2)

## Overview

Phase 2 adds an optional LLM layer for text rewording only. The model NEVER generates math content, answers, or steps. All numeric computation remains rule-based.

## Boundaries

| Allowed | NOT Allowed |
|---|---|
| Reword question text for variety | Generate new question templates |
| Add context/story to existing template | Compute answers |
| Translate wording styles | Modify solution steps |
| Suggest hint phrasing alternatives | Change numeric parameters |

## Validation Gate

Every model-generated output MUST pass through the full validation pipeline:

1. `validate_question_schema()` — structure check
2. `validate_hint_ladder()` — hint quality + no answer leaks
3. Answer re-computation — independently verify the answer matches the rule-based solver
4. Parameter integrity check — ensure all numeric values are unchanged from the original

## Fallback

If ANY validation check fails, discard the model output and use the rule-based version.

## Implementation Notes

- Model is called with the original question as input + a rewording prompt
- Response is parsed and merged with original (keeping all numeric fields)
- Only `problem_text` and hint text may be modified by the model
- API calls are logged to `mathgen/logs/model_calls.jsonl`

## Status

Phase 2 is NOT YET IMPLEMENTED. This document defines the policy for when it is added.

# Error Taxonomy

## Known Error Codes

| Code | Category | Description | Typical Cause |
|---|---|---|---|
| `wrong_numeric_answer` | Correctness | Answer does not match expected value | Arithmetic bug in generator |
| `wrong_unit` | Correctness | Unit mismatch | Template/parameter mismatch |
| `missing_intermediate_step` | Steps | A required step is absent | Step builder incomplete |
| `hint_too_big_jump` | Hints | Hint skips too many steps | Hint template gap |
| `hint_leaks_answer` | Hints | Final answer appears in hint text | Hint generation bug |
| `report_missing_fields` | Report | Required report field is absent | Report generator bug |
| `grade_level_too_hard` | Difficulty | Content exceeds target grade level | Parameter range too wide |
| `wording_ambiguity` | Quality | Question text is ambiguous | Template wording issue |
| `schema_violation` | Schema | JSON structure does not match schema | Missing or wrong-type field |
| `empty_answer` | Correctness | Answer field is empty | Generator edge case |
| `fraction_not_simplified` | Correctness | Fraction answer not in simplest form | Simplification step missing |
| `decimal_precision_error` | Correctness | Floating-point precision issue | Used `parseFloat` instead of integer math |
| `step_order_wrong` | Steps | Steps listed in wrong order | Step builder logic error |

## Error Classifier

The `classify_error()` function in `mathgen/error_taxonomy.py` maps raw error strings to the codes above using keyword matching. If no match is found, returns `'unknown'`.

## Adding New Error Codes

1. Add the code string to `KNOWN_ERROR_CODES` set.
2. Add a classification rule in `classify_error()`.
3. Update this documentation.
4. Add a benchmark test case that triggers the error.

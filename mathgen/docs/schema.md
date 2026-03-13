# Question & Report JSON Schema

## Question Schema

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✅ | Unique ID, e.g. `fra_a1b2c3d4` |
| `grade` | int | ✅ | Grade level (5 or 6) |
| `topic` | string | ✅ | One of: `fraction_word_problem`, `decimal_word_problem`, `average_word_problem`, `unit_conversion` |
| `difficulty` | string | ✅ | One of: `easy`, `medium`, `hard` |
| `problem_text` | string | ✅ | Full question text in 繁體中文 |
| `parameters` | dict | ✅ | Input parameters used to generate the question |
| `correct_answer` | string | ✅ | The correct answer (non-empty) |
| `unit` | string | ✅ | Answer unit (e.g. `公斤`, `公升`) |
| `steps` | list[str] | ✅ | Solution steps (minimum 2) |
| `hint_ladder` | dict | ✅ | 4-level hint ladder (see Hint Rules doc) |
| `validation_rules` | dict | ✅ | Rules for answer validation |

### `validation_rules` Fields

| Field | Type | Description |
|---|---|---|
| `answer_type` | string | `fraction`, `decimal`, or `integer` |
| `must_simplify` | bool | Whether fraction must be in simplest form |
| `decimal_places` | int | Expected decimal places (for decimal answers) |

## Report Schema

| Field | Type | Required | Description |
|---|---|---|---|
| `student_id` | string | ✅ | Student identifier |
| `date` | string | ✅ | ISO date `YYYY-MM-DD` |
| `total_questions` | int | ✅ | Total questions attempted |
| `accuracy` | float | ✅ | 0.0 to 1.0 |
| `weak_topics` | list[str] | ✅ | Topics with accuracy < 0.7 |
| `common_errors` | list[str] | ✅ | Error codes from `KNOWN_ERROR_CODES` |
| `suggested_next_practice` | string | ✅ | Practice recommendation (5-200 chars) |
| `encouragement` | string | ✅ | Encouragement message (5-100 chars) |

## Valid Topics

- `fraction_word_problem` — 分數應用題
- `decimal_word_problem` — 小數應用題
- `average_word_problem` — 平均應用題
- `unit_conversion` — 單位換算

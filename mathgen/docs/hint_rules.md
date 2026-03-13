# Hint Ladder Rules

## Overview

Every question has a 4-level hint ladder that guides students from strategy to verification, without leaking the answer.

## Level Definitions

| Level | Purpose | Must Include | Must NOT Include |
|---|---|---|---|
| `level_1` | Strategy prompt | General approach direction | Numbers, equations, formulas |
| `level_2` | Formula/setup hint | What operation to use, key relationships | Computed intermediate results |
| `level_3` | Computation hint | Partial computation guidance | The final answer verbatim |
| `level_4` | Verification hint | How to check the answer | N/A |

## Validation Rules

1. **All 4 levels required** — No level may be omitted.
2. **No answer leak** — The `correct_answer` string (if length > 1) must NOT appear verbatim in any hint level.
3. **Length constraints** — Each hint must be ≥ 5 characters and ≤ 500 characters.
4. **Level 1: strategy only** — Must NOT contain equations with `=` followed by digits.
5. **Level 4: verification** — Must contain at least one verification keyword: `檢查`, `驗算`, `驗證`, `代回`, `反過來`, `確認`.

## Per-Topic Hint Patterns

### Fraction Word Problem
- L1: "想想看，第一步該做什麼？" (guide to operation type)
- L2: "找最小公分母..." (guide to LCD)
- L3: "通分後..." (guide through computation steps)
- L4: "驗算：把答案..." (verification approach)

### Decimal Word Problem
- L1: "這是什麼運算？" (identify operation)
- L2: "列出算式，注意小數點..." (setup equation)
- L3: "計算時注意..." (computation guidance)
- L4: "驗算方法..." (check via inverse)

### Average Word Problem
- L1: "平均是什麼意思？" (concept)
- L2: "先算總和..." (sum step)
- L3: "除以個數..." (division step)
- L4: "驗算：平均 × 個數 = 總和？" (verification)

### Unit Conversion
- L1: "想想兩個單位的關係" (recall relationship)
- L2: "大單位 → 小單位用乘法" (operation direction)
- L3: "乘或除以換算倍數" (apply factor)
- L4: "反過來換算看看" (reverse check)

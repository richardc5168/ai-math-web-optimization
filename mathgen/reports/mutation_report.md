# Mutation Testing Report

## Summary

| Metric | Value |
|--------|-------|
| Total mutations | 135 |
| Killed (detected) | 114 |
| Survived (undetected) | 21 |
| Mutation score | 84.4% |

## Per-Topic Results

| Topic | Killed | Survived | Total | Score |
|-------|--------|----------|-------|-------|
| average_word_problem | 25 | 0 | 25 | 100.0% |
| decimal_word_problem | 19 | 6 | 25 | 76.0% |
| fraction_word_problem | 43 | 12 | 55 | 78.2% |
| unit_conversion | 27 | 3 | 30 | 90.0% |

## Surviving Mutations (Weaknesses)

These mutations were NOT detected — potential blind spots:

| Case | Mutation | Notes |
|------|----------|-------|
| fraction_word_problem[0] | b_den_minus1 | survived |
| fraction_word_problem[0] | template_shift | survived |
| fraction_word_problem[1] | a_den_plus1 | survived |
| fraction_word_problem[1] | b_den_minus1 | survived |
| fraction_word_problem[1] | equal_fractions | survived |
| fraction_word_problem[1] | template_shift | survived |
| fraction_word_problem[2] | b_den_minus1 | survived |
| fraction_word_problem[2] | b_den_plus1 | survived |
| fraction_word_problem[2] | template_shift | survived |
| fraction_word_problem[3] | a_den_plus1 | survived |
| fraction_word_problem[3] | b_den_plus1 | survived |
| fraction_word_problem[4] | large_denoms | survived |
| decimal_word_problem[0] | template_shift | survived |
| decimal_word_problem[1] | equal_operands | survived |
| decimal_word_problem[2] | template_shift | survived |
| decimal_word_problem[3] | equal_operands | survived |
| decimal_word_problem[3] | template_shift | survived |
| decimal_word_problem[4] | equal_operands | survived |
| unit_conversion[0] | decimal_value | survived |
| unit_conversion[2] | decimal_value | survived |
| ... | +1 more | |

## Gold Bank Promotion Candidates

Cases with high mutation kill rates (robust validations):

| Case | Kill Rate | Tested | Killed |
|------|-----------|--------|--------|
| average_word_problem[0] | 100% | 5 | 5 |
| average_word_problem[1] | 100% | 5 | 5 |
| average_word_problem[2] | 100% | 5 | 5 |
| average_word_problem[3] | 100% | 5 | 5 |
| average_word_problem[4] | 100% | 5 | 5 |
| unit_conversion[1] | 100% | 6 | 6 |
| unit_conversion[4] | 100% | 6 | 6 |
| fraction_word_problem[4] | 91% | 11 | 10 |
| unit_conversion[0] | 83% | 6 | 5 |
| unit_conversion[2] | 83% | 6 | 5 |

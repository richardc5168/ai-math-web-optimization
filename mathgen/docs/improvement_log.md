# Improvement Log

Track each iteration's changes, results, and lessons learned.

---

## Template

### Iteration N — YYYY-MM-DD

**Changes:**
- (what was changed)

**Benchmark Results:**
- Pass: X / Y
- New errors: (list)
- Resolved errors: (list)

**Lessons Learned:**
- (what we learned)

**Next Priority:**
- (what to fix next)

---

## Iteration 0 — Initial Build

**Changes:**
- Created 4 generators: fraction_word_problem, decimal_word_problem, average_word_problem, unit_conversion
- Created 3 validators: schema, hint, report
- Created error taxonomy with 13 known codes
- Created benchmark framework with 10 cases per topic
- Created gold bank with 5 exemplar questions per topic

**Benchmark Results:**
- (run `python mathgen/scripts/run_benchmarks.py` to populate)

**Lessons Learned:**
- Use integer arithmetic to avoid IEEE 754 precision errors
- Always validate hint ladder for answer leaks before committing
- Anti-repeat mechanism prevents fixing the same error with the same approach

**Next Priority:**
- Run initial benchmarks and fix any failures

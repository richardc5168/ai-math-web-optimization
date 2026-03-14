# Fraction Simplify Audit

審計所有分數相關輸出是否符合以下規格：
- 最簡形式，`gcd(abs(n), abs(d)) == 1`
- 不得輸出 `/1`
- 分母必須為正數
- 負號只能出現在分子前方

優先檢查：
- `mathgen/question_templates/`
- `mathgen/benchmarks/`
- 與分數答案相關的測試或 golden data

審計結果必須寫入 `artifacts/run_10h/error_memory.jsonl`。

# mathgen — AI 數學教育系統骨架

可持續迭代的規則式數學題目生成、驗證與報告系統。

## Architecture

```
mathgen/
├── question_templates/       # 題目生成器
│   ├── base.py               # 抽象基底類別 + 數學工具
│   ├── fraction_word_problem.py   # 分數應用題
│   ├── decimal_word_problem.py    # 小數應用題
│   ├── average_word_problem.py    # 平均應用題
│   └── unit_conversion.py        # 單位換算
├── gold_bank/                # 黃金標準樣本 (5+ per topic)
├── benchmarks/               # 基準測試案例 (10+ per topic)
├── validators/               # 驗證器
│   ├── schema_validator.py   # JSON Schema 驗證
│   ├── hint_validator.py     # 提示品質驗證
│   └── report_validator.py   # 家長報告驗證
├── reports/                  # 報告生成
│   ├── parent_report_generator.py   # 家長報告
│   ├── iteration_report_generator.py # 迭代報告
│   └── history/              # 歷史報告存檔
├── scripts/                  # 執行腳本
│   ├── run_benchmarks.py     # 基準測試執行器
│   └── run_iteration.py      # 迭代優化執行器
├── logs/                     # 日誌
├── docs/                     # 文件
│   ├── schema.md             # Schema 定義
│   ├── hint_rules.md         # 提示規則
│   ├── error_taxonomy.md     # 錯誤分類
│   ├── improvement_log.md    # 改進日誌
│   └── model_assisted_policy.md  # 模型輔助政策
├── error_taxonomy.py         # 錯誤分類模組
└── README.md                 # 本文件
```

## Quick Start

```bash
# Run benchmarks
python mathgen/scripts/run_benchmarks.py

# Run single topic
python mathgen/scripts/run_benchmarks.py --topic fraction_word_problem

# Run iteration analysis
python mathgen/scripts/run_iteration.py
```

## Iteration Workflow

1. Run benchmarks → identify failures
2. Classify errors → check anti-repeat history
3. Fix generator/validator → re-run benchmarks
4. Record change via `run_iteration.py`
5. Generate iteration report

## 6 Copilot Rules

1. **Read spec first** — 每次改動前先讀 `docs/` 下的相關規格文件
2. **Add tests before logic** — 先加 benchmark case，再改生成器
3. **One small change at a time** — 一次只改一件事
4. **Don't break benchmark** — 改完後 benchmark pass rate 不能下降
5. **Output change summary** — 每次改動後產生 iteration report
6. **Record new rules** — 發現新規則時更新 `docs/` 和 `error_taxonomy.py`

## Design Principles

- **Pure rule-based** — Phase 1 不依賴外部 AI 模型
- **Integer arithmetic** — 避免 IEEE 754 浮點數精度問題
- **No hint leaks** — 提示絕不可洩漏最終答案
- **Fixed schemas** — 題目和報告遵循固定 JSON schema
- **Anti-repeat** — 追蹤修改歷史，避免重複嘗試同一修正方式

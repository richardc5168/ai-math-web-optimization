# Iteration Report — 2026-03-15

## 本輪修改內容
run_10h_full_verify

## 新增測試數量: 0

## 總 Pass Rate: 160/160 (100.0%)

## 各題型 Pass Rate
| 題型 | Pass | Total | Rate |
|------|------|-------|------|
| average_word_problem | 40 | 40 | 100.0% |
| decimal_word_problem | 40 | 40 | 100.0% |
| fraction_word_problem | 40 | 40 | 100.0% |
| unit_conversion | 40 | 40 | 100.0% |

## Benchmark 覆蓋分布
### pattern_type
| 類型 | 數量 |
|------|------|
| adversarial | 27 |
| boundary | 29 |
| edge | 25 |
| normal | 56 |
| wording_variation | 23 |

### risk_level
| 等級 | 數量 |
|------|------|
| high | 30 |
| low | 60 |
| medium | 70 |

## 新發現錯誤類型
（無）

## 已解決錯誤類型
（無）

## Risk-Based Sampling
- 需人工審查: 10/160 (6.2%)
- 自動信任: 150/160 (93.8%)
- 理論節省人力: 94%

| 題型 | Low | Medium | High |
|------|-----|--------|------|
| average_word_problem | 39 | 1 | 0 |
| decimal_word_problem | 34 | 6 | 0 |
| fraction_word_problem | 33 | 7 | 0 |
| unit_conversion | 28 | 12 | 0 |

## Fail Clustering
- ✅ 無失敗群集

## 建議下一輪優先修正項目
- 全部通過，可考慮增加更多 benchmark cases

## 是否值得升級為 Gold Sample
✅ 全部通過，建議將新增 cases 納入 gold_bank。

## 控制層改進
- 已新增 fix recipe registry，覆蓋 hint_leaks_answer、wrong_unit、wrong_numeric_answer、benchmark_contract_drift、determinism_violation、report_truthfulness、sorting_semantics、identity_key_mismatch。
- issue queue 現在不只排序風險，也會為 top target 輸出 allowed edit scope、mandatory pre/post tests、forbidden shortcuts、recommended diff pattern、rollback condition。
- anti-repeat 決策層已接入 change_history.jsonl 與 lessons_learned.jsonl：若最近 3 次策略命中失敗或 side-effect blacklist，queue 會直接標記 blocked，要求改用其他 recipe strategy。
- 本輪控制層驗證：`pytest tests/unit/test_issue_queue_builder.py -q` 通過；`python tools/build_issue_queue.py --artifact-root artifacts/run_10h --run-id 20260315-055350` 通過；`python tools/validate_all_elementary_banks.py` 通過；`python scripts/verify_all.py` 通過。

## 預設流程改進
- 10h runner 現在會先對上一輪 active recipe 做 finalize，再重建 issue queue，直接選用 `top_actionable_target` 進入對應 recipe，而不是只停在排序報表。
- active recipe 會輸出 `allowed_edit_scope`、`forbidden_shortcuts`、`preflight_commands`、`postflight_commands`，讓代理先補最小測試再改，降低自由發揮風險。
- 經驗沉澱已納入 default flow：validated success 會自動寫入 `change_history.jsonl` 與 `lessons_learned.jsonl`，validated failure 會自動寫成 anti-pattern，未來 queue 可直接讀取，不用再手動補 log。
- 本輪新增測試：`tests/unit/test_manage_recipe_execution.py`；控制層 focused tests：`pytest tests/unit/test_issue_queue_builder.py tests/unit/test_manage_recipe_execution.py -q` 通過。

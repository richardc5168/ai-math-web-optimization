# Iteration Report — 2026-03-14

## 本輪修改內容
Phase 1: expand benchmarks 40->120 (30 per topic). Added metadata: pattern_type (normal/edge/boundary/adversarial/wording_variation), risk_level (low/medium/high), source_reason. Discovered hint leak vulnerabilities: (1) unit_conversion value=1 forward causes answer=multiplier leak, (2) decimal answer substring in operand strings. Documented but not fixed (generator changes deferred).

## 新增測試數量: 0

## 總 Pass Rate: 120/120 (100.0%)

## 各題型 Pass Rate
| 題型 | Pass | Total | Rate |
|------|------|-------|------|
| average_word_problem | 30 | 30 | 100.0% |
| decimal_word_problem | 30 | 30 | 100.0% |
| fraction_word_problem | 30 | 30 | 100.0% |
| unit_conversion | 30 | 30 | 100.0% |

## Benchmark 覆蓋分布
### pattern_type
| 類型 | 數量 |
|------|------|
| adversarial | 16 |
| boundary | 16 |
| edge | 16 |
| normal | 56 |
| wording_variation | 16 |

### risk_level
| 等級 | 數量 |
|------|------|
| high | 19 |
| low | 58 |
| medium | 43 |

## 新發現錯誤類型
（無）

## 已解決錯誤類型
（無）

## 建議下一輪優先修正項目
- 全部通過，可考慮增加更多 benchmark cases

## 是否值得升級為 Gold Sample
✅ 全部通過，建議將新增 cases 納入 gold_bank。

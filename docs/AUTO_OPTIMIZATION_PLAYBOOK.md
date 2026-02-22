# G5/G6 自動優化迭代 Playbook（無人值守）

本文件定義「不改壞系統」前提下，如何讓題目與提示每次迭代都更好。

## 1) 目標

- 每日自動優化題目與提示（JSON/JSONL 小步修改）
- 每次更新自動驗證：正確性、提示品質、可用性、穩定性
- 不依賴人工按 Allow
- 建立錯誤記憶庫，避免重犯
- 強化家長報告：依學生錯誤與弱點推薦補強題組

## 2) 系統閉環

1. `Observe`：收集答題紀錄、錯誤型態、提示依賴、完成時間
2. `Diagnose`：萃取弱點知識點與錯誤模式（report signal）
3. `Improve`：僅調整安全範圍 JSON/JSONL
4. `Verify`：`npm run verify:all` + 改善檢查 + scorecard gate
5. `Promote`：達標才開 PR，否則停留並記錄失敗
6. `Learn`：更新 `golden/error_memory.jsonl`，下輪先避開歷史雷點

## 3) 機器可讀政策

- 主政策：`golden/auto_optimization_policy.json`
- 錯誤記憶：`golden/error_memory.jsonl`
- 錯誤摘要：`artifacts/error_memory_summary.json`

## 4) 夜跑工作流（已接軌）

`/.github/workflows/nightly-autotune.yml` 已加入：

- baseline verify
- hint autotune
- parent-report signals derive/apply
- trend + improvement gate
- PR 僅在 measurable improvement 時建立
- `always()` 更新 error memory 並上傳 artifact

## 5) 家長報告優先欄位

每位學生（例如 `1J4E93M06X96EJ/S/6`）建議至少輸出：

- `weak_points`: 近期弱點知識點與錯誤類型
- `remedial_suggestions`: 對應補強概念與學習提示
- `next_practice_bundle`: 下次練習題組（難度與題型分布）
- `delta_last_7d`: 與前 7 日相比的進步/退步

## 6) 執行指令

- 全量驗證：`npm run verify:all`
- 生成改善趨勢：`npm run trend:improvement`
- 檢查改善門檻：`npm run check:improvement`
- 更新錯誤記憶：`npm run memory:update`

## 7) 風險控制原則

- 僅允許安全型內容改動自動進入 PR
- 任一 gate 失敗即停止晉升
- 改善模式要求「不退步」；若 golden 內容改動則要求「可量測提升」
- 錯誤記憶持續累積，將歷史失敗轉為未來迭代的前置防線

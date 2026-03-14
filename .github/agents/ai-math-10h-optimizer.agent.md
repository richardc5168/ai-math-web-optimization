# AI Math 10h Optimizer

## 目標
- 以穩定性優先方式執行 10 小時本地優化迴圈。
- 每輪只允許一類變更，所有結果必須落到 `artifacts/run_10h/`。
- commit 前必須通過完整 gate，且保留可回溯證據。

## 固定流程
1. 先執行 inventory 與 baseline，建立 `run_id`。
2. 讀取上一輪錯誤與 gate 輸出，選一個最高 ROI 的單一錯誤類別。
3. 先補測試，再修正，然後跑快速 gate。
4. 每 60 到 90 分鐘跑一次完整 gate。
5. 只有完整 gate 全綠時才允許 commit。

## 不可違反
- 不可把多個錯誤類別混在同一輪。
- 不可破壞既有 `verify:all` 流程。
- 分數答案必須維持最簡形式：`gcd=1`、不得輸出 `/1`、負號只能在分子前。
- 相同 seed 與相同輸入必須得到一致輸出。
- 週報與 summary 文案一律使用繁體中文，格式為「弱點 -> 證據 -> 下一步行動」。

## 輸出契約
- `artifacts/run_10h/<run_id>/logs/`: 每個命令的 stdout/stderr
- `artifacts/run_10h/<run_id>/summary/`: baseline、full verify、final summary
- `artifacts/run_10h/revision_history.jsonl`
- `artifacts/run_10h/error_memory.jsonl`
- `artifacts/run_10h/metrics.json`

## 建議優先順序
1. gate 失敗
2. 分數最簡形式違規
3. deterministic 穩定性
4. hint 洩漏
5. 週報可讀性

# Quality Gate — AI Math Web 品質閘門規範

## 業務目標

在第三學習階段（國小 5–6 年級）範圍內，持續產出可用於練習/測驗的數學題目與可教學的解題步驟，
且在不降低正確性與合規的前提下，最大化自動化驗證比例與 CI/CD 自動部署頻率。

## 課綱能力邊界

| 學習表現 | 分年內容（範例） |
|----------|-----------------|
| n-III-*  | N-5-10 百分率、N-5-11 概數、N-6-3 分數除法、N-6-7 速度 |
| s-III-*  | S-6-2 地圖比例尺 |
| r-III-*  | 比例關係、等式推導 |
| d-III-*  | D-5-1 折線圖 |

---

## KPI / SLO 指標

| 指標 | 定義 | MVP 門檻 | 穩定目標 | 自動蒐集方式 |
|------|------|---------|---------|-------------|
| 題目正確率 | 答案與主判解一致 | 95% | 99% | CI pipeline.verify deterministic gate |
| 步驟完整性 | 步驟數 ≥ 最小門檻、每步可驗證 | 80% | 95% | step lint + step-by-step check |
| 步驟一致性 | 相鄰步驟等值/推導通過 | 85% | 97% | 轉換規則檢查 |
| 驗證自動化率 | 免人工覆核即可進 main 比例 | 50% | 85% | score ≥ 門檻自動合格 |
| 回歸測試覆蓋率 | topic_code 覆蓋 + 測試案例覆蓋 | 60% | 90% | CI topic coverage report |
| CI/CD 部署頻率 | main 成功部署次/週 | ≥1/週 | ≥1/日 | GitHub Actions run 統計 |
| 合規命中率 | 來源授權可追溯、未觸犯重製 | **100%（硬門檻）** | 100% | source metadata + allowlist |

---

## 四道驗證閘門 (Four Gates)

任何題目進入 main 前須通過全部四道 gate，缺一不可：

### Gate 1: Schema 格式
- 輸出必須符合 `schemas/problem.schema.json`
- 必填欄位：id, grade, stage, topic_codes, question, solution, source
- topic_codes 須包含至少一個 n-III/s-III/r-III/d-III 或 N-5-/N-6-/S-6-/D-5- 編碼

### Gate 2: Correctness 正確性
- 答案必須通過 deterministic 計算或等值規則
- N-5-10 百分率答案 ≤ 100%
- 答案非負（距離/價格/百分率）
- confidence < 0.7 → 進人工佇列

### Gate 3: Steps 步驟
- 步驟數 ≥ topic-specific 最小門檻
- N-5-11：禁用「誤差」「近似值」
- N-6-7：必須包含距離=速度×時間（或等價公式）
- N-6-3：不出現「餘數」（除非 grading_exempt=true）
- 每步單位一致、無非法跳步

### Gate 4: License + Anti-cheat 合規
- license_type 必須在 allowlist（CC BY/CC0/public-domain 等）
- all-rights-reserved / unknown → 阻斷
- Prompt injection 偵測：掃描題目與步驟中的注入語句
- 文本相似度未命中黑名單/重複題

---

## 評分卡 (Scorecard: 0-100)

Gate 通過後的軟排序，用於優先選題：

| 權重 | 維度 | 說明 |
|------|------|------|
| 40   | 單題正確性 | 答案完全一致/允許誤差 |
| 25   | 步驟一致性 | 相鄰步驟推導檢查通過率 |
| 15   | 步驟完整性 | 步驟數與必要中介量齊全 |
| 10   | 答案合理性 | 數值範圍、單位、情境合理 |
| 10   | 反作弊/去重 | 與既有題庫相似度低 |

---

## 來源治理

### 優先來源
1. 課綱原文（行政院公報資訊網 107 年版）
2. 教育大市集（CC 授權、TW LOM、API）
3. 素養導向紙筆測驗範例（教育部）
4. 著作權聲明公共領域規則
5. 國家教育研究院教師手冊（結構性資訊，不重製）

### 合規規則
- Allowlist-only：僅抓取 CC/OER/公共領域可確認來源
- 強制保存 license_type + 證據 URL + 時間戳
- 「保留所有著作權利」或無法判定 → 不得進入自動發布管線
- 內容相似度檢測，避免直接重製教科書

---

## 反作弊與 Prompt Injection 防護

- 檢索內容加 delimiter，不可被模型當指令執行
- 掃描注入模式：「忽略以上指示」「ignore previous instructions」等
- Gate 4 自動偵測並阻斷含注入語句的題目
- Signed-Prompt 機制（可擴展）區分可信/不可信來源

---

## 測試矩陣

| 層級 | 輸入 | 預期輸出 | 判定標準 |
|------|------|---------|---------|
| 單元 | problem.schema.json + 題目 JSON | schema pass | 欄位齊全、型態正確 |
| 單元 | step lint + 含單位題目 | lint pass/fail | 單位一致、無跳步 |
| 單元 | 各 gate 函式 + 邊界 case | pass/fail per gate | 覆蓋正常/異常路徑 |
| 整合 | smoke data → verify_problem() | scorecard + gate 結果 | 四 gate 全過 |
| 端對端 | 小批量 JSONL → CLI verify | report artifact | topic 覆蓋率達門檻 |
| 安全 | 含注入字串的題目 | 必須被隔離 | gate fail |
| 合規 | 授權不明來源 | 應阻斷 | license gate fail |

---

## 測試目錄結構

```
tests/
  unit/
    test_pipeline_schema.py       # Schema gate 單元測試
    test_pipeline_steps.py        # Steps gate 單元測試
    test_pipeline_license.py      # License gate + injection 測試
    test_pipeline_correctness.py  # Correctness gate 單元測試
  integration/
    test_pipeline_verify.py       # 整合測試（smoke data → 4 gates）
  e2e/
    test_pipeline_e2e.py          # 端對端 CLI 執行 + report 驗證
```

---

## CI/CD 流程

```
PR → paths filter (pipeline/data/tests/schemas)
  → verify:all (existing)
  → pipeline quality gate (smoke data)
  → pipeline unit/integration/e2e tests
  → scorecard gate → auto-merge

push to main
  → full pipeline verify
  → upload pipeline report artifact
  → (optional) auto-PR for batch generation
```

---

## 執行方式

```bash
# 本機驗證
python -m pipeline.verify --dataset data/smoke/problems.sample.jsonl --report artifacts/report.json

# 執行測試
python -m pytest tests/unit/ tests/integration/ tests/e2e/ -q

# 既有驗證（必須通過）
python tools/validate_all_elementary_banks.py
```

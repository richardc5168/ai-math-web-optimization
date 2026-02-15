# QA 匯出自檢摘要（questions_dump）

- 產生時間：2026-02-15T23:05:11
- 來源：artifacts\questions_dump.jsonl
- 題型數：15
- 題目總數：75
- answer_ok_fail：10
- hint_ladder_ok_fail：1

## Top 問題題型（answer_ok_fail）
- g5s_good_concepts_v1: 5
- g5s_web_concepts_v1: 5

## Top 問題題型（hint_ladder_ok_fail）
- 9: 1

## 下一步（外部模型回饋）
- 這份摘要是『程式自檢』結果（不是外部模型 review）。
- 若要顯示外部模型回饋摘要：請把 review JSONL 放到 `artifacts/question_reviews.jsonl`，再跑：
  - `./.venv/Scripts/python.exe scripts/summarize_question_reviews.py --in_jsonl artifacts/question_reviews.jsonl --out_md artifacts/question_reviews_summary.md`

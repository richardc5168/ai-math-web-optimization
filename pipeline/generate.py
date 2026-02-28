"""
pipeline/generate.py — Problem generation stub for curriculum-aligned records.

Generates problem JSON conforming to schemas/problem.schema.json.
Uses a Self-Refine loop: if deterministic verification fails, the model
re-generates with structured feedback up to N iterations, then routes
to human review queue.

Usage:
  python -m pipeline.generate --out data/problems.jsonl [--count 20]

NOTE: This is a scaffold — actual LLM integration should be added
when model API keys and budget are configured.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# ── Prompt Template ────────────────────────────────────────

SYSTEM_PROMPT = """\
你是國小五六年級數學出題與解題代理。請嚴格遵守：
1) 必須輸出 JSON，符合 schema（我會提供）。
2) 題目 topic_codes 必須包含：學習表現 n-III/s-III/r-III/d-III 之一 \
   + 分年內容 N-5-*/N-6-* 或 S-6-*/D-5-*。
3) 解題步驟需可被程式化驗證：每一步只做一個可檢查的運算或等值轉換；包含單位。
4) 先輸出「自動檢核清單」，再輸出題目 JSON。
5) 若你不確定答案，必須在 JSON 內標記 confidence<0.7，讓系統送人工；不得猜。\
"""

TOPIC_PROMPTS = {
    "N-5-10": "生成 1 題 N-5-10（百分率/折/成）生活情境題。結果必須 <=100%。輸出需含 n-III-9。",
    "N-5-11": "生成 1 題 N-5-11（對小數取概數、四捨五入、近似意義）題。不要使用「誤差」「近似值」字眼。",
    "N-6-7": "生成 1 題 N-6-7（速度）題，必須包含單位換算（大單位到小單位或反向），並含「距離=速度×時間」。",
    "N-6-3": "生成 1 題 N-6-3（分數除法：整數÷分數或分數÷分數）題，避免餘數題或標記為不評量。",
    "S-6-2": "生成 1 題 S-6-2（地圖比例尺）題，需包含常見錯誤「比例分母愈大，相對邊長也愈大」的反例或提醒。",
    "D-5-1": "生成 1 題 D-5-1（製作折線圖）題：給一組時間序列資料，要求畫折線圖並回答一個「趨勢」問題。",
}

MAX_SELF_REFINE_ITERATIONS = 3


def generate_problem_stub(topic_code: str) -> dict | None:
    """
    Stub generator — returns None.
    Replace with actual LLM call + Self-Refine loop.

    Real implementation should:
    1. Send SYSTEM_PROMPT + TOPIC_PROMPTS[topic_code] to LLM
    2. Parse JSON response
    3. Run pipeline.verify.verify_problem() on it
    4. If fails, feed structured error back to LLM (up to MAX_SELF_REFINE_ITERATIONS)
    5. If still fails, set confidence < 0.7 and route to human queue
    """
    return None


def main():
    parser = argparse.ArgumentParser(description="Generate curriculum-aligned problems")
    parser.add_argument("--out", required=True, help="Output JSONL path")
    parser.add_argument("--count", type=int, default=20, help="Number of problems to generate")
    args = parser.parse_args()

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)

    print(f"[generate] stub — no LLM configured. Would generate {args.count} problems to {args.out}")
    print("[generate] To enable: configure API key and implement generate_problem_stub()")
    print("[generate] Available topic prompts:")
    for code, prompt in TOPIC_PROMPTS.items():
        print(f"  {code}: {prompt[:60]}...")

    sys.exit(0)


if __name__ == "__main__":
    main()

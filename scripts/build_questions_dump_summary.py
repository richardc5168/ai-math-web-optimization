from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Tuple


def _read_jsonl(path: Path) -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        obj = json.loads(line)
        if isinstance(obj, dict):
            items.append(obj)
    return items


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Build a Markdown QA summary from artifacts/questions_dump.jsonl")
    p.add_argument("--in_jsonl", default="artifacts/questions_dump.jsonl")
    p.add_argument("--out_md", default="artifacts/question_reviews_summary.md")
    p.add_argument("--top_n", type=int, default=10)
    args = p.parse_args(argv)

    in_path = Path(args.in_jsonl)
    out_path = Path(args.out_md)

    if not in_path.exists():
        print(f"ERROR: not found: {in_path}")
        return 2

    items = _read_jsonl(in_path)
    templates = sorted({str(it.get("template_id") or "") for it in items if str(it.get("template_id") or "").strip()})

    answer_fail_by_template: Counter[str] = Counter()
    hint_fail_by_template: Counter[str] = Counter()

    for it in items:
        tid = str(it.get("template_id") or "").strip() or "(unknown)"
        checks = it.get("checks") or {}
        if isinstance(checks, dict):
            if checks.get("answer_ok") is False:
                answer_fail_by_template[tid] += 1
            if checks.get("hint_ladder_ok") is False:
                hint_fail_by_template[tid] += 1

    lines: List[str] = []
    lines.append("# QA 匯出自檢摘要（questions_dump）")
    lines.append("")
    lines.append(f"- 產生時間：{datetime.now().isoformat(timespec='seconds')}")
    lines.append(f"- 來源：{in_path}")
    lines.append(f"- 題型數：{len(templates)}")
    lines.append(f"- 題目總數：{len(items)}")
    lines.append(f"- answer_ok_fail：{sum(answer_fail_by_template.values())}")
    lines.append(f"- hint_ladder_ok_fail：{sum(hint_fail_by_template.values())}")

    lines.append("")
    lines.append("## Top 問題題型（answer_ok_fail）")
    if answer_fail_by_template:
        for tid, c in answer_fail_by_template.most_common(int(args.top_n)):
            lines.append(f"- {tid}: {c}")
    else:
        lines.append("- （無）")

    lines.append("")
    lines.append("## Top 問題題型（hint_ladder_ok_fail）")
    if hint_fail_by_template:
        for tid, c in hint_fail_by_template.most_common(int(args.top_n)):
            lines.append(f"- {tid}: {c}")
    else:
        lines.append("- （無）")

    lines.append("")
    lines.append("## 下一步（外部模型回饋）")
    lines.append("- 這份摘要是『程式自檢』結果（不是外部模型 review）。")
    lines.append("- 若要顯示外部模型回饋摘要：請把 review JSONL 放到 `artifacts/question_reviews.jsonl`，再跑：")
    lines.append("  - `./.venv/Scripts/python.exe scripts/summarize_question_reviews.py --in_jsonl artifacts/question_reviews.jsonl --out_md artifacts/question_reviews_summary.md`")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"OK: wrote {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

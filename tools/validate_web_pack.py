from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any


TYPE_KEY = "g5s_web_concepts_v1"


def _die(msg: str) -> None:
    raise SystemExit(msg)


def _load_pack(path: Path) -> dict[str, Any]:
    if not path.exists():
        _die(f"Missing pack: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def _is_hhmm(s: str) -> bool:
    return bool(re.fullmatch(r"\d{2}:\d{2}", (s or "").strip()))


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pack", default="data/web_g5s_pack.json")
    args = ap.parse_args(argv)

    pack = _load_pack(Path(args.pack))
    if pack.get("type_key") != TYPE_KEY:
        _die("pack.type_key mismatch")

    items = pack.get("items")
    if not isinstance(items, list) or not items:
        _die("pack.items must be a non-empty list")

    seen_ids: set[str] = set()
    seen_questions: set[str] = set()

    for i, it in enumerate(items, start=1):
        if not isinstance(it, dict):
            _die(f"item#{i} must be object")

        iid = str(it.get("id") or "").strip()
        if not iid:
            _die(f"item#{i} missing id")
        if iid in seen_ids:
            _die(f"duplicate id: {iid}")
        seen_ids.add(iid)

        if it.get("type_key") != TYPE_KEY:
            _die(f"item#{i} type_key mismatch")

        q = str(it.get("question") or "").strip()
        if not q:
            _die(f"item#{i} missing question")
        if q in seen_questions:
            _die(f"duplicate question: {q}")
        seen_questions.add(q)

        ans = str(it.get("answer") or "").strip()
        if not ans:
            _die(f"item#{i} missing answer")

        hints = it.get("hints")
        if not isinstance(hints, dict) or not all(k in hints for k in ("level1", "level2", "level3")):
            _die(f"item#{i} hints must have level1-3")
        level1 = str(hints.get("level1") or "")
        if ans in level1:
            _die(f"item#{i} hint level1 leaks answer")

        steps = it.get("steps")
        if not isinstance(steps, list) or not steps:
            _die(f"item#{i} steps must be non-empty list")
        if not any(re.search(r"\d", str(s)) for s in steps):
            _die(f"item#{i} steps must include checkable intermediate numbers")

        v = it.get("validator")
        if not isinstance(v, dict) or "type" not in v:
            _die(f"item#{i} validator must be object with type")
        vtype = str(v.get("type") or "")
        if vtype not in ("number", "fraction", "time_hhmm", "text"):
            _die(f"item#{i} validator.type unsupported: {vtype}")

        # Quick parse checks
        if vtype == "number":
            try:
                float(ans)
            except Exception:
                _die(f"item#{i} answer not parseable number")
        if vtype == "fraction":
            if not re.fullmatch(r"\d+\s*/\s*\d+", ans):
                _die(f"item#{i} answer not fraction a/b")
        if vtype == "time_hhmm":
            if not _is_hhmm(ans):
                _die(f"item#{i} answer not HH:MM")

        ev = it.get("evidence")
        if not isinstance(ev, dict) or not str(ev.get("source_url") or "").strip():
            _die(f"item#{i} evidence missing source_url")

    print(f"OK: items={len(items)} unique_questions={len(seen_questions)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

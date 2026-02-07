"""Audit offline bank answer formats for SymPy coverage.

Scans docs/**/bank.js (not the dist mirror) and summarizes which answers are:
- Fraction/int/decimal (Fraction-checkable)
- Multi-value (space or comma separated)
- Numeric expressions (need SymPy numeric equivalence)
- Equations / symbolic answers (need SymPy symbolic solver/equivalence)

Run:
  python scripts/audit_bank_answer_formats.py

Optional:
  python scripts/audit_bank_answer_formats.py --json out.json
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"

BANK_ASSIGN_RE = re.compile(r"^\s*window\.([A-Za-z0-9_]+)\s*=\s*\[", re.MULTILINE)


def _load_bank_items(bank_js_path: Path) -> tuple[str | None, list[dict[str, Any]]]:
    text = bank_js_path.read_text(encoding="utf-8")

    m = BANK_ASSIGN_RE.search(text)
    bank_var = m.group(1) if m else None

    if m:
        start = m.end() - 1  # points to '['
    else:
        start = text.find("[")
    end = text.rfind("]")
    if start < 0 or end < 0 or end <= start:
        raise ValueError(f"Cannot locate JSON array assignment in {bank_js_path}")

    payload = text[start : end + 1]
    items = json.loads(payload)
    if not isinstance(items, list):
        raise ValueError(f"Bank payload is not a list in {bank_js_path}")

    out: list[dict[str, Any]] = []
    for it in items:
        if isinstance(it, dict):
            out.append(it)
    return bank_var, out


def _norm(s: Any) -> str:
    return str(s or "").strip()


def _normalize_math_input(text: str) -> str:
    s = _norm(text)
    s = s.replace("×", "*").replace("÷", "/")
    s = s.replace("−", "-").replace("—", "-")
    s = s.replace("＋", "+")
    s = s.replace("（", "(").replace("）", ")")
    s = s.replace("，", ",").replace("、", ",")
    return s


def _parse_fraction_like(text: str) -> bool:
    s = _norm(text)
    if not s:
        return False
    if re.fullmatch(r"-?\d+", s):
        return True
    if re.fullmatch(r"-?\d+\.\d+", s):
        return True
    if re.fullmatch(r"-?\d+\s*/\s*\d+", s):
        return True
    # mixed number: "1 1/2"
    if re.fullmatch(r"-?\d+\s+\d+\s*/\s*\d+", s):
        return True
    return False


def _is_json_payload(text: str) -> bool:
    s = _norm(text)
    return s.startswith("{") and s.endswith("}")


def _is_multi_space_numbers(text: str) -> bool:
    s = _norm(text)
    if not s:
        return False
    clean = re.sub(r"[^0-9\s]", "", s)
    return clean.count(" ") > 0


def _split_multi_comma(text: str) -> list[str]:
    s = _normalize_math_input(text)
    if "," not in s:
        return []
    parts = [p.strip() for p in s.split(",") if p.strip()]
    return parts


def _looks_like_equation_or_symbolic(text: str) -> bool:
    s = _normalize_math_input(text)
    if not s:
        return False
    if "=" in s:
        return True
    if re.search(r"[A-Za-z_]", s):
        return True
    return False


def _looks_like_numeric_expr(text: str) -> bool:
    s = _normalize_math_input(text)
    if not s:
        return False
    # Simple numbers/fractions/mixed numbers are not treated as expressions.
    if _parse_fraction_like(s):
        return False
    if re.search(r"[A-Za-z_]", s):
        return False
    # Must contain at least one operator or parentheses to distinguish from plain numbers
    if not re.search(r"[\+\-\*/\(\)]", s):
        return False
    if re.search(r"[^0-9\s\+\-\*/\(\)\.]", s):
        return False
    return True


@dataclass
class ItemFlag:
    module_id: str
    kind: str
    qid: str
    answer: str
    flags: list[str]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", dest="json_path", default="", help="Write JSON report to this path")
    ap.add_argument("--max-samples", type=int, default=3)
    args = ap.parse_args()

    bank_paths = sorted(p for p in DOCS.rglob("bank.js") if p.is_file())

    totals = Counter()
    per_module = defaultdict(Counter)
    per_kind = defaultdict(Counter)

    flagged: list[ItemFlag] = []

    for p in bank_paths:
        module_id = p.parent.relative_to(DOCS).as_posix().rstrip("/")
        _, items = _load_bank_items(p)
        for it in items:
            kind = _norm(it.get("kind") or "(unknown)")
            ans = _norm(it.get("answer"))

            qid = _norm(it.get("id") or "")

            base = ""
            features: list[str] = []

            if not ans:
                base = "empty"
            elif _is_json_payload(ans):
                base = "json_payload"
            else:
                if _is_multi_space_numbers(ans):
                    features.append("multi_space_numbers")

                comma_parts = _split_multi_comma(ans)
                if comma_parts:
                    features.append("multi_comma")

                if _parse_fraction_like(ans):
                    base = "plain_number_or_fraction"
                elif _looks_like_equation_or_symbolic(ans):
                    base = "symbolic_or_equation"
                elif _looks_like_numeric_expr(ans):
                    base = "numeric_expr"
                else:
                    base = "unknown_format"

            totals[base] += 1
            per_module[module_id][base] += 1
            per_kind[kind][base] += 1
            for ft in features:
                totals[ft] += 1
                per_module[module_id][ft] += 1
                per_kind[kind][ft] += 1

            flags = [base] + features
            if base in {"symbolic_or_equation", "numeric_expr", "unknown_format", "json_payload", "empty"}:
                if len([x for x in flagged if x.module_id == module_id and x.kind == kind and x.flags == flags]) < args.max_samples:
                    flagged.append(ItemFlag(module_id=module_id, kind=kind, qid=qid, answer=ans, flags=flags))

    # Print summary
    total_items = sum(per_module[mid]["plain_number_or_fraction"] + per_module[mid]["numeric_expr"] + per_module[mid]["unknown_format"] + per_module[mid]["symbolic_or_equation"] + per_module[mid]["json_payload"] + per_module[mid]["empty"] for mid in per_module.keys())
    print("=== Bank Answer Format Audit ===")
    print(f"banks: {len(bank_paths)}")
    print(f"items: {total_items}")
    print("\n-- totals --")
    base_keys = [
        "plain_number_or_fraction",
        "numeric_expr",
        "symbolic_or_equation",
        "unknown_format",
        "json_payload",
        "empty",
    ]
    for k in base_keys:
        print(f"{k:22s} {totals.get(k, 0)}")
    print("\n-- features --")
    for k in ("multi_space_numbers", "multi_comma"):
        print(f"{k:22s} {totals.get(k, 0)}")

    # Focus list: modules with symbolic/expr/unknown
    focus_modules = []
    for mid, c in per_module.items():
        focus = c.get("symbolic_or_equation", 0) + c.get("numeric_expr", 0) + c.get("unknown_format", 0) + c.get("json_payload", 0) + c.get("empty", 0)
        if focus:
            focus_modules.append((mid, focus, c))
    focus_modules.sort(key=lambda x: (-x[1], x[0]))

    if focus_modules:
        print("\n-- focus modules (need SymPy / special handling) --")
        for mid, focus, c in focus_modules:
            parts = []
            for key in ("symbolic_or_equation", "numeric_expr", "unknown_format", "json_payload", "empty"):
                if c.get(key, 0):
                    parts.append(f"{key}={c[key]}")
            print(f"{mid}: {', '.join(parts)}")

    if flagged:
        print("\n-- samples --")
        for f in flagged[: min(len(flagged), 20)]:
            a = f.answer
            if len(a) > 80:
                a = a[:77] + "..."
            q = f" id={f.qid}" if f.qid else ""
            print(f"[{f.module_id}] kind={f.kind}{q} flags={f.flags} answer={a}")

    report = {
        "banks": [str(p.relative_to(ROOT)).replace("\\", "/") for p in bank_paths],
        "totals": dict(totals),
        "per_module": {k: dict(v) for k, v in per_module.items()},
        "per_kind": {k: dict(v) for k, v in per_kind.items()},
        "samples": [
            {"module_id": f.module_id, "kind": f.kind, "id": f.qid, "answer": f.answer, "flags": f.flags}
            for f in flagged
        ],
    }

    if args.json_path:
        outp = Path(args.json_path)
        outp.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"\nWrote JSON report: {outp}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

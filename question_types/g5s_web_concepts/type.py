from __future__ import annotations

import json
import math
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from fractions import Fraction


TYPE_KEY = "g5s_web_concepts_v1"
DEFAULT_PACK_PATH = Path("data/web_g5s_pack.json")


@dataclass(frozen=True)
class PackItem:
    id: str
    type_key: str
    difficulty: str
    question: str
    answer: str
    hints: dict[str, str]
    steps: list[str]
    validator: dict[str, Any]
    evidence: dict[str, Any]
    topic_tags: list[str]
    concept_points: list[str]


_PACK_CACHE: list[PackItem] | None = None


def load_pack(path: Path = DEFAULT_PACK_PATH) -> list[PackItem]:
    global _PACK_CACHE
    if _PACK_CACHE is not None:
        return _PACK_CACHE

    raw = json.loads(path.read_text(encoding="utf-8"))
    items = raw.get("items")
    if not isinstance(items, list):
        raise ValueError("pack.items must be list")

    out: list[PackItem] = []
    for it in items:
        if not isinstance(it, dict):
            continue
        if str(it.get("type_key") or "").strip() != TYPE_KEY:
            continue
        out.append(
            PackItem(
                id=str(it.get("id") or ""),
                type_key=TYPE_KEY,
                difficulty=str(it.get("difficulty") or "medium"),
                question=str(it.get("question") or ""),
                answer=str(it.get("answer") or ""),
                hints=dict(it.get("hints") or {}),
                steps=list(it.get("steps") or []),
                validator=dict(it.get("validator") or {}),
                evidence=dict(it.get("evidence") or {}),
                topic_tags=[str(x) for x in (it.get("topic_tags") or [])],
                concept_points=[str(x) for x in (it.get("concept_points") or [])],
            )
        )

    if not out:
        raise ValueError("No items loaded for TYPE_KEY")

    _PACK_CACHE = out
    return out


def _parse_time_hhmm(s: str) -> str | None:
    t = (s or "").strip()
    if not t:
        return None
    t = t.replace("：", ":")
    m = re.fullmatch(r"(\d{1,2})\s*:\s*(\d{1,2})", t)
    if not m:
        return None
    hh = int(m.group(1))
    mm = int(m.group(2))
    if hh < 0 or hh > 23 or mm < 0 or mm > 59:
        return None
    return f"{hh:02d}:{mm:02d}"


def _parse_fraction(s: str) -> Fraction | None:
    t = (s or "").strip()
    if not t:
        return None
    t = t.replace(" ", "")
    if "/" not in t:
        return None
    try:
        return Fraction(t)
    except Exception:
        return None


def _parse_number(s: str) -> float | None:
    t = (s or "").strip().replace(",", "")
    if not t:
        return None
    try:
        return float(t)
    except Exception:
        return None


def make_engine_question(item: PackItem) -> dict[str, Any]:
    # Encode answer+validator into correct_answer so engine.check can validate.
    correct_payload = {
        "type_key": TYPE_KEY,
        "answer": item.answer,
        "validator": item.validator,
    }
    explanation = "\n".join([
        "（完整步驟）",
        *[f"- {s}" for s in item.steps],
        "",
        f"（Evidence）{item.evidence.get('title','')} | {item.evidence.get('source_url','')}",
    ]).strip()

    return {
        "type_key": TYPE_KEY,
        "topic": TYPE_KEY,
        "difficulty": item.difficulty,
        "question": item.question,
        "answer": json.dumps(correct_payload, ensure_ascii=False),
        "explanation": explanation,
        "steps": item.steps,
        "hints": {
            "level1": str(item.hints.get("level1") or ""),
            "level2": str(item.hints.get("level2") or ""),
            "level3": str(item.hints.get("level3") or ""),
        },
    }


def next_question() -> dict[str, Any]:
    # Keep deterministic selection driven by global random in engine.py.
    import random

    items = load_pack()
    item = random.choice(items)
    return make_engine_question(item)


def check_answer(user_answer: str, payload: dict[str, Any]) -> int | None:
    validator = payload.get("validator") if isinstance(payload.get("validator"), dict) else {}
    vtype = str(validator.get("type") or "").strip()
    correct = str(payload.get("answer") or "").strip()

    u = (user_answer or "").strip()

    if vtype == "time_hhmm":
        u_norm = _parse_time_hhmm(u)
        c_norm = _parse_time_hhmm(correct)
        if u_norm is None or c_norm is None:
            return None
        return 1 if u_norm == c_norm else 0

    if vtype == "fraction":
        uf = _parse_fraction(u)
        cf = _parse_fraction(correct)
        if uf is None or cf is None:
            return None
        return 1 if uf == cf else 0

    if vtype == "number":
        un = _parse_number(u)
        cn = _parse_number(correct)
        if un is None or cn is None:
            return None
        tol = float(validator.get("tolerance") or 0)
        return 1 if math.isclose(un, cn, rel_tol=0.0, abs_tol=tol) else 0

    # text
    u_clean = "".join(u.split()).lower()
    c_clean = "".join(correct.split()).lower()
    if not u_clean or not c_clean:
        return None
    return 1 if u_clean == c_clean else 0

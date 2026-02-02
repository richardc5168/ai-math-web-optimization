from __future__ import annotations

import argparse
import json
import random
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any


TYPE_KEY = "g5s_good_concepts_v1"
DEFAULT_OUT = Path("data/g5s_good_concepts_pack.json")


def _now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def _hints(level1: str, level2: str, level3: str, answer: str) -> dict[str, str]:
    # enforce "no answer leakage" in level1 (simple guard)
    a = (answer or "").strip()
    l1 = (level1 or "").strip()
    if a and a in l1:
        raise ValueError("Hint level1 leaks answer")
    return {
        "level1": l1,
        "level2": (level2 or "").strip(),
        "level3": (level3 or "").strip(),
    }


def _mk_steps(*lines: str) -> list[str]:
    return [str(x).strip() for x in lines if str(x).strip()]


@dataclass(frozen=True)
class Evidence:
    source_url: str
    title: str


def _pack_item(
    *,
    idx: int,
    topic_tags: list[str],
    concept_points: list[str],
    question: str,
    answer: str,
    difficulty: str,
    hints: dict[str, str],
    steps: list[str],
    validator: dict[str, Any],
    evidence: Evidence,
) -> dict[str, Any]:
    return {
        "id": f"g5good_{idx:04d}",
        "type_key": TYPE_KEY,
        "topic_tags": topic_tags,
        "concept_points": concept_points,
        "difficulty": difficulty,
        "question": question,
        "answer": answer,
        "hints": hints,
        "steps": steps,
        "validator": validator,
        "evidence": {"source_url": evidence.source_url, "title": evidence.title},
        "generated_at": _now_iso(),
    }


def _q_decimal_to_percent(rng: random.Random, idx: int) -> dict[str, Any]:
    d = rng.choice([0.05, 0.12, 0.2, 0.25, 0.4, 0.75])
    pct = int(round(d * 100))
    q = f"（觀念｜小數→百分率）把小數 {d:g} 轉成百分率，請只寫數字（不要寫 %）。"
    a = str(pct)
    steps = _mk_steps(
        "百分率 = 小數 × 100",
        f"{d:g} × 100 = {pct}",
    )
    h = _hints(
        "想像『每 100 份裡有幾份』：把小數放大 100 倍。",
        f"列式：{d:g} × 100。",
        f"{d:g} × 100 = {pct}，所以百分率是 {pct}%。\n（本題要求不寫 %，只寫 {pct}）",
        a,
    )
    return _pack_item(
        idx=idx,
        topic_tags=["g5s", "percent"],
        concept_points=["小數轉百分率要乘 100"],
        question=q,
        answer=a,
        difficulty="easy",
        hints=h,
        steps=steps,
        validator={"type": "number", "tolerance": 0.0},
        evidence=Evidence(source_url="local://concept-pack", title="internal"),
    )


def _q_fraction_reduce(rng: random.Random, idx: int) -> dict[str, Any]:
    pairs = rng.choice([(6, 8, "3/4"), (9, 12, "3/4"), (10, 15, "2/3"), (12, 18, "2/3"), (15, 20, "3/4")])
    n, d, ans = pairs
    q = f"（觀念｜約分）把分數 {n}/{d} 約成最簡分數。"
    steps = _mk_steps(
        "找最大公因數 (GCD)",
        f"gcd({n},{d}) = {__import__('math').gcd(n,d)}",
        f"分子 ÷ gcd，分母 ÷ gcd → {ans}",
    )
    h = _hints(
        "最簡分數：分子和分母沒有共同因數（除了 1）。",
        "先找分子分母的最大公因數，再同除。",
        f"gcd({n},{d}) = {__import__('math').gcd(n,d)}\n所以 {n}/{d} = {ans}",
        ans,
    )
    return _pack_item(
        idx=idx,
        topic_tags=["g5s", "fraction"],
        concept_points=["約分是分子分母同除最大公因數"],
        question=q,
        answer=ans,
        difficulty="easy",
        hints=h,
        steps=steps,
        validator={"type": "fraction"},
        evidence=Evidence(source_url="local://concept-pack", title="internal"),
    )


def _q_l_to_ml(rng: random.Random, idx: int) -> dict[str, Any]:
    liters = rng.choice([0.5, 1.2, 1.5, 2.3])
    ml = int(round(liters * 1000))
    q = f"（觀念｜容積換算）{liters:g} 公升 = 多少毫升？請只寫數字。"
    a = str(ml)
    steps = _mk_steps(
        "1 公升 = 1000 毫升",
        f"{liters:g} × 1000 = {ml}",
    )
    h = _hints(
        "看到『公升↔毫升』先想 1 公升等於多少毫升。",
        f"列式：{liters:g} × 1000。",
        f"{liters:g} × 1000 = {ml}，所以是 {ml} 毫升。",
        a,
    )
    return _pack_item(
        idx=idx,
        topic_tags=["g5s", "volume"],
        concept_points=["公升轉毫升要乘 1000"],
        question=q,
        answer=a,
        difficulty="easy",
        hints=h,
        steps=steps,
        validator={"type": "number", "tolerance": 0.0},
        evidence=Evidence(source_url="local://concept-pack", title="internal"),
    )


def _q_ratio_sum(rng: random.Random, idx: int) -> dict[str, Any]:
    a = rng.choice([0.15, 0.25, 0.35, 0.4])
    b = rng.choice([0.1, 0.2, 0.3])
    if a + b > 0.95:
        a, b = 0.35, 0.2
    s = round(a + b, 2)
    q = (
        f"（觀念｜比率合計）同一個班級中，參加 A 社團的比率是 {a:g}，參加 B 社團的比率是 {b:g}。\n"
        "A 和 B 合計比率是多少？（用小數表示）"
    )
    a_str = f"{s:g}"
    steps = _mk_steps(
        "同一群體的合計比率 = 各部分比率相加",
        f"{a:g} + {b:g} = {s:g}",
        "檢查：合計不超過 1",
    )
    h = _hints(
        "合計比率：把『各部分的比率』直接相加（同一個群體）。",
        f"列式：{a:g} + {b:g}。",
        f"{a:g} + {b:g} = {s:g}，所以合計比率是 {s:g}。",
        a_str,
    )
    return _pack_item(
        idx=idx,
        topic_tags=["g5s", "ratio"],
        concept_points=["合計比率可以直接相加"],
        question=q,
        answer=a_str,
        difficulty="easy",
        hints=h,
        steps=steps,
        validator={"type": "number", "tolerance": 0.0},
        evidence=Evidence(source_url="local://concept-pack", title="internal"),
    )


def _q_same_value_text(rng: random.Random, idx: int) -> dict[str, Any]:
    # Pure concept: equivalent representations.
    options = rng.choice([
        ("0.5", "1/2", "一樣大"),
        ("0.25", "1/4", "一樣大"),
        ("0.75", "3/4", "一樣大"),
    ])
    dec, frac, ans = options
    q = f"（觀念｜等值）{dec} 和 {frac} 比較大小，結果是？請回答：一樣大/前者大/後者大。"
    steps = _mk_steps(
        "把其中一個轉成另一種表示法再比較",
        f"{frac} = {dec}",
        "所以兩者相等",
    )
    h = _hints(
        "比較大小最穩的方法：先把兩個數變成同一種表示。",
        f"把分數 {frac} 轉成小數再比。",
        f"{frac} = {dec}，所以答案是：{ans}。",
        ans,
    )
    return _pack_item(
        idx=idx,
        topic_tags=["g5s", "fraction", "decimal"],
        concept_points=["分數與小數可以互相轉換"],
        question=q,
        answer=ans,
        difficulty="easy",
        hints=h,
        steps=steps,
        validator={"type": "text"},
        evidence=Evidence(source_url="local://concept-pack", title="internal"),
    )


_TEMPLATES = [
    _q_decimal_to_percent,
    _q_fraction_reduce,
    _q_l_to_ml,
    _q_ratio_sum,
    _q_same_value_text,
]


def build_pack(n: int, seed: int) -> dict[str, Any]:
    rng = random.Random(seed)

    items: list[dict[str, Any]] = []
    seen_q: set[str] = set()

    guard = 0
    while len(items) < n:
        guard += 1
        if guard > n * 200:
            raise RuntimeError(f"Unable to reach target n={n}")

        tpl = rng.choice(_TEMPLATES)
        candidate = tpl(rng, len(items) + 1)
        qtext = str(candidate.get("question") or "").strip()
        if not qtext or qtext in seen_q:
            continue
        seen_q.add(qtext)
        items.append(candidate)

    return {
        "type_key": TYPE_KEY,
        "version": f"v{datetime.now().strftime('%Y%m%d')}",
        "generated_at": _now_iso(),
        "seed": seed,
        "items": items,
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=30)
    ap.add_argument("--seed", type=int, default=5203)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = ap.parse_args(argv)

    pack = build_pack(args.n, args.seed)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(pack, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote: {args.out} (items={args.n})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

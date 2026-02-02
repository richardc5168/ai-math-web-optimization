from __future__ import annotations

import argparse
import json
import random
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any


TYPE_KEY = "g5s_web_concepts_v1"


def _now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def _read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    rows: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        rows.append(json.loads(line))
    return rows


def _hints(level1: str, level2: str, level3: str, answer: str) -> dict[str, str]:
    # enforce "no answer leakage" in level1 (simple guard)
    if answer and answer.strip() and answer.strip() in (level1 or ""):
        raise ValueError("Hint level1 leaks answer")
    return {
        "level1": str(level1).strip(),
        "level2": str(level2).strip(),
        "level3": str(level3).strip(),
    }


def _mk_steps(*lines: str) -> list[str]:
    out = [str(x).strip() for x in lines if str(x).strip()]
    return out


@dataclass(frozen=True)
class Evidence:
    source_url: str
    title: str


def _pick_evidence(raw_rows: list[dict[str, Any]], rng: random.Random) -> Evidence:
    if raw_rows:
        r = rng.choice(raw_rows)
        return Evidence(source_url=str(r.get("source_url") or ""), title=str(r.get("title") or ""))
    return Evidence(source_url="(mock)", title="(mock)")


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
        "id": f"webg5s_{idx:04d}",
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


def _gen_unit_conversion(rng: random.Random, raw: list[dict[str, Any]], idx: int) -> dict[str, Any]:
    # 1 ha = 10,000 m^2
    ha = rng.choice([2, 3, 5, 8, 12, 25])
    ans = str(ha * 10_000)
    q = f"（面積換算）{ha} 公頃 = 多少平方公尺？（填整數）"
    hints = _hints(
        "先想：公頃和平方公尺的換算關係。",
        "1 公頃 = 10,000 平方公尺，所以要乘 10,000。",
        f"{ha}×10,000 = {ans}（平方公尺）",
        ans,
    )
    steps = _mk_steps(
        "步驟 1：寫出 1 公頃 = 10,000 平方公尺。",
        f"步驟 2：列式：{ha}×10,000。",
        f"步驟 3：計算：{ha}×10,000 = {ans}。",
        "步驟 4：加上單位（平方公尺）。",
    )
    ev = _pick_evidence(raw, rng)
    return _pack_item(
        idx=idx,
        topic_tags=["unit_conversion", "area"],
        concept_points=["1 公頃 = 10,000 平方公尺", "換算就是乘或除固定倍率"],
        question=q,
        answer=ans,
        difficulty="easy",
        hints=hints,
        steps=steps,
        validator={"type": "number", "unit": "m2", "tolerance": 0},
        evidence=ev,
    )


def _gen_percent_discount(rng: random.Random, raw: list[dict[str, Any]], idx: int) -> dict[str, Any]:
    price = rng.choice([200, 240, 300, 360, 450, 500])
    off = rng.choice([10, 20, 25, 30])
    ans = str(int(price * (100 - off) / 100))
    q = f"（打折）原價 {price} 元，打 {100-off} 折（等於打 {off}% 折扣），現價是多少元？（填整數）"
    hints = _hints(
        "先分清楚：打折就是『剩下幾成/幾%』。",
        f"現價 = 原價 × (100%−{off}%) = {price}×{100-off}%。",
        f"{price}×{100-off}% = {price}×{(100-off)/100} = {ans}（元）",
        ans,
    )
    steps = _mk_steps(
        f"步驟 1：折扣 {off}% 表示剩下 {100-off}%。",
        f"步驟 2：列式：{price}×{100-off}%。",
        f"步驟 3：{100-off}% = {(100-off)}/100。",
        f"步驟 4：{price}×{(100-off)}/100 = {ans}。",
    )
    ev = _pick_evidence(raw, rng)
    return _pack_item(
        idx=idx,
        topic_tags=["ratio_percent", "discount"],
        concept_points=["打折＝剩下百分率", "現價 = 原價 × 剩下百分率"],
        question=q,
        answer=ans,
        difficulty="medium",
        hints=hints,
        steps=steps,
        validator={"type": "number", "unit": "元", "tolerance": 0},
        evidence=ev,
    )


def _gen_time_add(rng: random.Random, raw: list[dict[str, Any]], idx: int) -> dict[str, Any]:
    # HH:MM + minutes, keep within same day
    h = rng.randint(7, 20)
    m = rng.choice([0, 10, 15, 20, 30, 40, 45, 50])
    add_min = rng.choice([25, 35, 50, 75, 90])
    total = h * 60 + m + add_min
    hh = total // 60
    mm = total % 60
    ans = f"{hh:02d}:{mm:02d}"
    q = f"（時間）現在是 {h:02d}:{m:02d}，再過 {add_min} 分鐘是幾點幾分？（用 HH:MM）"
    hints = _hints(
        "先把時間改成『分鐘』會更好算。",
        f"{h:02d}:{m:02d} = {h}×60+{m} 分鐘，然後再加 {add_min} 分鐘。",
        f"算完再換回 HH:MM：答案 {ans}",
        ans,
    )
    steps = _mk_steps(
        f"步驟 1：換成分鐘：{h}×60+{m} = {h*60+m}（分鐘）。",
        f"步驟 2：加上 {add_min}：{h*60+m}+{add_min} = {total}（分鐘）。",
        f"步驟 3：換回時間：{total} ÷ 60 = {hh} 餘 {mm}。",
        f"步驟 4：所以是 {ans}。",
    )
    ev = _pick_evidence(raw, rng)
    return _pack_item(
        idx=idx,
        topic_tags=["time"],
        concept_points=["時間可以先換成分鐘再計算", "最後再換回 HH:MM"],
        question=q,
        answer=ans,
        difficulty="easy",
        hints=hints,
        steps=steps,
        validator={"type": "time_hhmm"},
        evidence=ev,
    )


def _gen_volume_ml(rng: random.Random, raw: list[dict[str, Any]], idx: int) -> dict[str, Any]:
    # 1 L = 1000 mL
    liters = rng.choice([1.2, 1.5, 2.0, 2.4, 3.5, 4.8])
    ml = int(round(liters * 1000))
    ans = str(ml)
    q = f"（容積換算）{liters:g} 公升 = 多少毫升？（填整數）"
    hints = _hints(
        "先記住：公升和毫升的換算。",
        "1 公升 = 1000 毫升，所以要乘 1000。",
        f"{liters:g}×1000 = {ans}（毫升）",
        ans,
    )
    steps = _mk_steps(
        "步驟 1：寫出 1 L = 1000 mL。",
        f"步驟 2：列式：{liters:g}×1000。",
        f"步驟 3：計算：{liters:g}×1000 = {ans}。",
        "步驟 4：加上單位（毫升）。",
    )
    ev = _pick_evidence(raw, rng)
    return _pack_item(
        idx=idx,
        topic_tags=["unit_conversion", "volume"],
        concept_points=["1 公升 = 1000 毫升", "換算倍率固定"],
        question=q,
        answer=ans,
        difficulty="easy",
        hints=hints,
        steps=steps,
        validator={"type": "number", "unit": "mL", "tolerance": 0},
        evidence=ev,
    )


def _gen_percent_of_number(rng: random.Random, raw: list[dict[str, Any]], idx: int) -> dict[str, Any]:
    base = rng.choice([80, 120, 160, 200, 240, 300])
    pct = rng.choice([10, 15, 20, 25, 30, 40])
    ans = str(int(base * pct / 100))
    q = f"（百分率）{base} 的 {pct}% 是多少？（填整數）"
    hints = _hints(
        "先把百分率想成『每 100 份裡面有幾份』。",
        f"列式：{base}×{pct}% = {base}×{pct}/100。",
        f"{base}×{pct}/100 = {ans}",
        ans,
    )
    steps = _mk_steps(
        f"步驟 1：把 {pct}% 變成 {pct}/100。",
        f"步驟 2：列式：{base}×{pct}/100。",
        f"步驟 3：計算：{base}×{pct} = {base*pct}。",
        f"步驟 4：{base*pct}÷100 = {ans}。",
    )
    ev = _pick_evidence(raw, rng)
    return _pack_item(
        idx=idx,
        topic_tags=["ratio_percent"],
        concept_points=["求某數的百分之幾：用乘法", "百分率要除以 100"],
        question=q,
        answer=ans,
        difficulty="easy",
        hints=hints,
        steps=steps,
        validator={"type": "number", "tolerance": 0},
        evidence=ev,
    )


def _gen_fraction_multiply(rng: random.Random, raw: list[dict[str, Any]], idx: int) -> dict[str, Any]:
    a = rng.randint(1, 5)
    b = rng.randint(2, 9)
    c = rng.randint(1, 5)
    d = rng.randint(2, 9)
    # avoid trivial equalities
    if b == d:
        d = (d % 9) + 2
    num = a * c
    den = b * d
    # reduce
    import math

    g = math.gcd(num, den)
    num //= g
    den //= g
    ans = f"{num}/{den}"
    q = f"（分數乘法）{a}/{b} × {c}/{d} = ?（填最簡分數）"
    hints = _hints(
        "分數乘法：分子乘分子，分母乘分母。",
        "可以先交叉約分，計算會更快。",
        f"答案：{ans}",
        ans,
    )
    steps = _mk_steps(
        f"步驟 1：列式：{a}/{b} × {c}/{d}。",
        f"步驟 2：分子：{a}×{c} = {a*c}；分母：{b}×{d} = {b*d}。",
        f"步驟 3：約分：({a*c})/({b*d}) = {ans}。",
    )
    ev = _pick_evidence(raw, rng)
    return _pack_item(
        idx=idx,
        topic_tags=["fractions", "multiply"],
        concept_points=["分數乘法：分子乘分子、分母乘分母", "最後約分到最簡"],
        question=q,
        answer=ans,
        difficulty="medium",
        hints=hints,
        steps=steps,
        validator={"type": "fraction"},
        evidence=ev,
    )


def build_pack(raw_jsonl: Path, out_json: Path, n: int, seed: int) -> dict[str, Any]:
    raw = _read_jsonl(raw_jsonl)
    rng = random.Random(int(seed))

    generators = [
        _gen_unit_conversion,
        _gen_percent_discount,
        _gen_time_add,
        _gen_volume_ml,
        _gen_percent_of_number,
        _gen_fraction_multiply,
    ]

    items: list[dict[str, Any]] = []
    used_q: set[str] = set()
    idx = 1
    attempts = 0
    while len(items) < n and attempts < n * 200:
        attempts += 1
        gen = rng.choice(generators)
        item = gen(rng, raw, idx)
        qtext = item["question"]
        if qtext in used_q:
            continue
        used_q.add(qtext)
        items.append(item)
        idx += 1

    if len(items) < n:
        raise RuntimeError(f"Unable to build pack target={n}, got={len(items)}")

    pack = {
        "type_key": TYPE_KEY,
        "version": f"v{datetime.now().strftime('%Y%m%d')}",
        "generated_at": _now_iso(),
        "items": items,
    }
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(pack, ensure_ascii=False, indent=2), encoding="utf-8")
    return pack


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw", default="data/raw_web_concepts.jsonl")
    ap.add_argument("--out", default="data/web_g5s_pack.json")
    ap.add_argument("--n", type=int, default=30)
    ap.add_argument("--seed", type=int, default=5202)
    args = ap.parse_args(argv)

    pack = build_pack(Path(args.raw), Path(args.out), n=int(args.n), seed=int(args.seed))
    print(f"Wrote {args.out} (items={len(pack['items'])})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

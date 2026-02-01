import json
import random
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Tuple

ROOT = Path(__file__).resolve().parents[1]
OUT_JS = ROOT / "docs" / "volume-g5" / "bank.js"

random.seed(20260201)


def fmt_int(n: int) -> str:
    return str(int(n))


def gen_cube_cm3(i: int) -> Dict[str, Any]:
    edge = random.randint(2, 15)
    v = edge**3
    unit = "立方公分（cm³）"

    question = f"（正方體體積）邊長 {edge} 公分的正方體，體積是多少立方公分？"

    hints = [
        "觀念：正方體的體積 = 邊長 × 邊長 × 邊長（邊長³）。",
        f"列式：{edge}×{edge}×{edge}。",
        "Level 3｜完整步驟\n"
        f"1) 先算 {edge}×{edge} = {edge*edge}\n"
        f"2) 再算 {edge*edge}×{edge} = {v}\n"
        f"3) 單位是 立方公分（cm³）",
    ]

    steps = [
        "使用公式 V=邊長³",
        f"計算 {edge}×{edge}×{edge}",
        f"寫上單位：{unit}",
    ]

    return {
        "id": f"vg5_cube_{i:03d}",
        "kind": "cube_cm3",
        "topic": "國小五年級｜體積（長方體/正方體）",
        "difficulty": "easy",
        "question": question,
        "answer": fmt_int(v),
        "hints": hints,
        "steps": steps,
        "meta": {"unit": unit},
        "explanation": f"正方體體積：{edge}×{edge}×{edge}={v}（立方公分）。",
    }


def gen_rect_cm3(i: int) -> Dict[str, Any]:
    l = random.randint(3, 30)
    w = random.randint(2, 20)
    h = random.randint(2, 20)
    v = l * w * h
    unit = "立方公分（cm³）"

    question = f"（長方體體積）長 {l} 公分、寬 {w} 公分、高 {h} 公分的長方體，體積是多少立方公分？"

    hints = [
        "觀念：長方體的體積 V = 長 × 寬 × 高。",
        f"列式：{l}×{w}×{h}。",
        "Level 3｜完整步驟\n"
        f"1) 先算 {l}×{w} = {l*w}\n"
        f"2) 再算 {l*w}×{h} = {v}\n"
        f"3) 單位是 立方公分（cm³）",
    ]

    steps = [
        "使用公式 V=長×寬×高",
        "先算長×寬（底面積）",
        "再乘高",
        f"寫上單位：{unit}",
    ]

    return {
        "id": f"vg5_rect_{i:03d}",
        "kind": "rect_cm3",
        "topic": "國小五年級｜體積（長方體/正方體）",
        "difficulty": random.choice(["easy", "medium"]),
        "question": question,
        "answer": fmt_int(v),
        "hints": hints,
        "steps": steps,
        "meta": {"unit": unit},
        "explanation": f"長方體體積：{l}×{w}×{h}={v}（立方公分）。",
    }


def gen_base_area_h(i: int) -> Dict[str, Any]:
    base_area = random.randint(20, 400)
    h = random.randint(2, 25)
    v = base_area * h
    unit = "立方公分（cm³）"

    question = f"（底面積×高）一個立體的底面積是 {base_area} 平方公分，高是 {h} 公分，體積是多少立方公分？"

    hints = [
        "觀念：體積 V = 底面積 × 高。",
        f"列式：{base_area}×{h}。",
        "Level 3｜完整步驟\n"
        f"1) V = 底面積×高 = {base_area}×{h}\n"
        f"2) {base_area}×{h} = {v}\n"
        f"3) 底面積(平方)×高(公分) → 立方公分（cm³）",
    ]

    steps = [
        "確認公式 V=底面積×高",
        "相乘求體積",
        "檢查單位：平方×長度=立方",
    ]

    return {
        "id": f"vg5_base_{i:03d}",
        "kind": "base_area_h",
        "topic": "國小五年級｜體積（長方體/正方體）",
        "difficulty": "easy",
        "question": question,
        "answer": fmt_int(v),
        "hints": hints,
        "steps": steps,
        "meta": {"unit": unit},
        "explanation": f"體積：{base_area}×{h}={v}（立方公分）。",
    }


def gen_m3_to_cm3(i: int) -> Dict[str, Any]:
    m3 = random.randint(1, 9)
    cm3 = m3 * 1_000_000
    unit = "立方公分（cm³）"

    question = f"（單位換算）{m3} 立方公尺（m³）等於多少立方公分（cm³）？"

    hints = [
        "觀念：1 m = 100 cm，所以 1 m³ = 100³ cm³。",
        "規則：1 m³ = 1,000,000 cm³。",
        "Level 3｜完整步驟\n"
        "1) 先記住：1 m³ = 1,000,000 cm³\n"
        f"2) {m3} m³ = {m3}×1,000,000 = {cm3} cm³",
    ]

    steps = [
        "用 1 m³ = 1,000,000 cm³",
        f"把 {m3} 乘上 1,000,000",
        "寫出結果（立方公分）",
    ]

    return {
        "id": f"vg5_m3_to_cm3_{i:03d}",
        "kind": "m3_to_cm3",
        "topic": "國小五年級｜體積（長方體/正方體）",
        "difficulty": "medium",
        "question": question,
        "answer": fmt_int(cm3),
        "hints": hints,
        "steps": steps,
        "meta": {"unit": unit},
        "explanation": f"1 m³ = 1,000,000 cm³，所以 {m3} m³ = {cm3} cm³。",
    }


def gen_cm3_to_m3(i: int) -> Dict[str, Any]:
    m3 = random.randint(1, 9)
    cm3 = m3 * 1_000_000
    unit = "立方公尺（m³）"

    question = f"（單位換算）{cm3:,} 立方公分（cm³）等於多少立方公尺（m³）？（請填整數）"

    hints = [
        "觀念：1 m³ = 1,000,000 cm³。",
        f"做法：把 {cm3:,} 除以 1,000,000。",
        "Level 3｜完整步驟\n"
        f"1) {cm3:,} cm³ ÷ 1,000,000 = {m3}\n"
        f"2) 所以是 {m3} m³",
    ]

    steps = [
        "用 1 m³ = 1,000,000 cm³",
        "把立方公分除以 1,000,000",
        "寫出結果（立方公尺）",
    ]

    return {
        "id": f"vg5_cm3_to_m3_{i:03d}",
        "kind": "cm3_to_m3",
        "topic": "國小五年級｜體積（長方體/正方體）",
        "difficulty": "medium",
        "question": question,
        "answer": fmt_int(m3),
        "hints": hints,
        "steps": steps,
        "meta": {"unit": unit},
        "explanation": f"{cm3:,} cm³ = {m3} m³（因為除以 1,000,000）。",
    }


def gen_composite(i: int) -> Dict[str, Any]:
    # Two blocks placed side-by-side sharing the same height.
    h = random.randint(2, 12)
    d = random.randint(2, 12)

    w1 = random.randint(2, 10)
    w2 = random.randint(2, 10)
    l = random.randint(3, 18)

    v1 = l * w1 * h
    v2 = l * w2 * h
    total = v1 + v2

    unit = "立方公分（cm³）"
    question = (
        "（複合形體）把形體分成兩個長方體來算：\n"
        f"A：長 {l} 公分、寬 {w1} 公分、高 {h} 公分\n"
        f"B：長 {l} 公分、寬 {w2} 公分、高 {h} 公分\n"
        "這個複合形體的總體積是多少立方公分？"
    )

    hints = [
        "觀念：複合形體先分解成幾個長方體/正方體，各自算體積再相加。",
        f"列式：V = ({l}×{w1}×{h}) + ({l}×{w2}×{h})。",
        "Level 3｜完整步驟\n"
        f"1) A 的體積：{l}×{w1}×{h} = {v1}\n"
        f"2) B 的體積：{l}×{w2}×{h} = {v2}\n"
        f"3) 相加：{v1}+{v2} = {total}\n"
        f"4) 單位：立方公分（cm³）",
    ]

    steps = [
        "把複合形體分成 A、B 兩個長方體",
        "分別用 V=長×寬×高",
        "把兩個體積相加",
    ]

    return {
        "id": f"vg5_comp_{i:03d}",
        "kind": "composite",
        "topic": "國小五年級｜體積（長方體/正方體）",
        "difficulty": "medium",
        "question": question,
        "answer": fmt_int(total),
        "hints": hints,
        "steps": steps,
        "meta": {"unit": unit},
        "explanation": f"總體積 = {v1}+{v2}={total}（立方公分）。",
    }


def generate_bank() -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    out += [gen_cube_cm3(i) for i in range(1, 25)]
    out += [gen_rect_cm3(i) for i in range(1, 31)]
    out += [gen_base_area_h(i) for i in range(1, 21)]
    out += [gen_m3_to_cm3(i) for i in range(1, 13)]
    out += [gen_cm3_to_m3(i) for i in range(1, 13)]
    out += [gen_composite(i) for i in range(1, 17)]

    random.shuffle(out)

    seen = set()
    uniq: List[Dict[str, Any]] = []
    for q in out:
        t = q.get("question")
        if t in seen:
            continue
        seen.add(t)
        uniq.append(q)

    return uniq


def main() -> None:
    bank = generate_bank()

    js = "/* Auto-generated offline question bank. */\n" + "window.VOLUME_G5_BANK = " + json.dumps(
        bank, ensure_ascii=False, indent=2
    ) + ";\n"

    OUT_JS.parent.mkdir(parents=True, exist_ok=True)
    OUT_JS.write_text(js, encoding="utf-8")
    print(f"Wrote: {OUT_JS} (n={len(bank)})")


if __name__ == "__main__":
    main()

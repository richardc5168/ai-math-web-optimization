import json
import random
from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal, getcontext
from fractions import Fraction
from pathlib import Path
from typing import Any, Dict, List

ROOT = Path(__file__).resolve().parents[1]
OUT_JS = ROOT / "docs" / "life-applications-g5" / "bank.js"

random.seed(20260203)
getcontext().prec = 28


def _strip_trailing_zeros(s: str) -> str:
    if "." in s:
        s = s.rstrip("0").rstrip(".")
    return s


def fmt_decimal(d: Decimal) -> str:
    return _strip_trailing_zeros(format(d, "f"))


def fmt_decimal_from_fraction(fr: Fraction) -> str:
    d = Decimal(fr.numerator) / Decimal(fr.denominator)
    return fmt_decimal(d)


def fmt_money2(x: Decimal) -> str:
    # keep 2 decimals for money answer, but strip if .00
    s = format(x.quantize(Decimal("0.01")), "f")
    return _strip_trailing_zeros(s)


def fmt_fraction(fr: Fraction) -> str:
    fr = Fraction(fr.numerator, fr.denominator)
    if fr.denominator == 1:
        return str(fr.numerator)
    return f"{fr.numerator}/{fr.denominator}"


def hhmm(h: int, m: int) -> str:
    h = h % 24
    m = m % 60
    return f"{h:02d}:{m:02d}"


def add_minutes(t: str, minutes: int) -> str:
    hh, mm = t.split(":")
    base = datetime(2026, 2, 3, int(hh), int(mm))
    out = base + timedelta(minutes=minutes)
    return hhmm(out.hour, out.minute)


@dataclass(frozen=True)
class Q:
    id: str
    kind: str
    difficulty: str
    question: str
    answer: str
    answer_mode: str
    hints: List[str]
    steps: List[str]
    meta: Dict[str, Any]
    explanation: str


TOPIC = "國小五年級｜生活應用題（講義+練習）"


def q_buy_many(i: int) -> Q:
    unit = random.choice(["瓶", "包", "本", "盒彩"])
    item = random.choice(["果汁", "餅乾", "筆記本", "巧克力"])
    price = Decimal(random.choice(["12.5", "18.8", "25.6", "36.5", "45.0"]))
    qty = random.randint(3, 9)
    total = price * Decimal(qty)

    question = f"（買多份）{item} 每{unit} {fmt_money2(price)} 元，買 {qty} {unit}，一共多少元？（可寫小數）"
    answer = fmt_money2(total)

    hints = [
        "觀念：同一個單價買很多份 → 用乘法。",
        f"列式：{fmt_money2(price)} × {qty}。先估算：{qty} 份，所以答案一定比 {fmt_money2(price)} 大。",
        "Level 3｜步驟\n"
        f"1) 列式：{fmt_money2(price)}×{qty}\n"
        "2) 先當整數算，再放回小數點（或直接用乘法計算）\n"
        f"3) 得到：{answer} 元\n"
        "4) 檢查：乘的是 >1 的整數，答案應該變大。",
    ]

    steps = [
        "同單價多份 → 乘法",
        f"列式：{fmt_money2(price)}×{qty}",
        f"計算得到 {answer}",
        "寫上單位：元",
    ]

    return Q(
        id=f"la5_buy_{i:03d}",
        kind="buy_many",
        difficulty="easy",
        question=question,
        answer=answer,
        answer_mode="money2",
        hints=hints,
        steps=steps,
        meta={"unit": "元"},
        explanation=f"總價 = 單價×數量 = {fmt_money2(price)}×{qty} = {answer}（元）。",
    )


def q_discount(i: int) -> Q:
    price = Decimal(random.choice(["80", "120", "150", "240"]))
    off = random.choice([10, 15, 20, 25, 30])
    pay_rate = Decimal(100 - off) / Decimal(100)
    pay = price * pay_rate

    question = f"（打折）一件衣服原價 {fmt_money2(price)} 元，打 {off}% 折扣，折扣後要付多少元？（可寫小數）"
    answer = fmt_money2(pay)

    hints = [
        "觀念：打折就是『付原價的幾%』。",
        f"方法：先算要付的百分率：100%−{off}% = {100-off}%。再用 原價×{100-off}% 。",
        "Level 3｜步驟\n"
        f"1) 付費比例：{100-off}% = {fmt_decimal(pay_rate)}\n"
        f"2) 列式：{fmt_money2(price)}×{fmt_decimal(pay_rate)}\n"
        f"3) 得到：{answer} 元",
    ]

    steps = [
        "付費比例 = 1 − 折扣%",
        "原價 × 付費比例",
        "金額取到小數點後 2 位（或題目允許可省略尾端 0）",
    ]

    return Q(
        id=f"la5_disc_{i:03d}",
        kind="discount",
        difficulty="easy",
        question=question,
        answer=answer,
        answer_mode="money2",
        hints=hints,
        steps=steps,
        meta={"unit": "元"},
        explanation=f"付 {100-off}% = {fmt_decimal(pay_rate)}；所以 {fmt_money2(price)}×{fmt_decimal(pay_rate)}={answer}（元）。",
    )


def q_unit_price(i: int) -> Q:
    qty = random.randint(4, 12)
    unit = random.choice(["瓶", "盒", "支", "包"])
    item = random.choice(["礦泉水", "牛奶", "餅乾", "鉛筆"])
    price = Decimal(random.choice(["7.5", "8", "9.6", "12.5", "15.2", "18.8", "20.5"]))
    total = price * Decimal(qty)

    question = f"（單價）買 {qty} {unit}{item} 一共 {fmt_money2(total)} 元，平均每{unit}多少元？"
    answer = fmt_money2(price)

    hints = [
        "觀念：平均每一份多少 → 用除法（總量 ÷ 份數）。",
        f"列式：{fmt_money2(total)} ÷ {qty}。",
        "Level 3｜步驟\n"
        f"1) 列式：{fmt_money2(total)}÷{qty}\n"
        f"2) 計算得到：{answer} 元/每{unit}",
    ]

    steps = [
        "平均 = 總價 ÷ 數量",
        f"{fmt_money2(total)} ÷ {qty}",
        f"得到 {answer}",
    ]

    return Q(
        id=f"la5_unit_{i:03d}",
        kind="unit_price",
        difficulty="easy",
        question=question,
        answer=answer,
        answer_mode="money2",
        hints=hints,
        steps=steps,
        meta={"unit": f"元/每{unit}"},
        explanation=f"平均單價 = {fmt_money2(total)}÷{qty} = {answer}（元/每{unit}）。",
    )


def q_time_add(i: int) -> Q:
    start_h = random.randint(6, 20)
    start_m = random.choice([0, 10, 15, 20, 30, 40, 45, 50])
    dur = random.choice([25, 35, 45, 55, 65, 75, 90])

    start = hhmm(start_h, start_m)
    end = add_minutes(start, dur)

    question = f"（時間）小明在 {start} 開始寫作業，寫了 {dur} 分鐘，幾點完成？（用 HH:MM）"

    hints = [
        "觀念：時間計算先把『分鐘』加到『分鐘』，超過 60 要進位到小時。",
        f"列式：{start} + {dur} 分鐘。先加分鐘，不夠就進位。",
        "Level 3｜步驟\n"
        f"1) {start} 的分鐘 + {dur} 分鐘\n"
        "2) 若分鐘 ≥ 60，就 +1 小時，分鐘 −60\n"
        f"3) 得到：{end}",
    ]

    steps = [
        "把分鐘相加",
        "超過 60 分鐘要進位",
        f"得到結束時間 {end}",
    ]

    return Q(
        id=f"la5_time_{i:03d}",
        kind="time_add",
        difficulty="easy",
        question=question,
        answer=end,
        answer_mode="hhmm",
        hints=hints,
        steps=steps,
        meta={"unit": "時間"},
        explanation=f"從 {start} 起算 {dur} 分鐘，進位後得到 {end}。",
    )


def q_unit_convert(i: int) -> Q:
    mode = random.choice(["L_to_mL", "kg_to_g", "m_to_cm"])
    if mode == "L_to_mL":
        x = Decimal(random.randint(1, 50)) / Decimal(10)  # 0.1 ~ 5.0
        ans = int((x * Decimal(1000)).to_integral_value())
        question = f"（單位換算）{fmt_decimal(x)} 公升 = 多少毫升？（只寫數字）"
        hints = [
            "觀念：1 公升 = 1000 毫升。",
            f"列式：{fmt_decimal(x)} × 1000。",
            f"Level 3｜計算：{fmt_decimal(x)}×1000 = {ans}（毫升）。",
        ]
        steps = ["1 L = 1000 mL", "乘 1000", f"得到 {ans}"]
        return Q(
            id=f"la5_ucv_{i:03d}",
            kind="unit_convert",
            difficulty="easy",
            question=question,
            answer=str(ans),
            answer_mode="number",
            hints=hints,
            steps=steps,
            meta={"unit": "毫升"},
            explanation=f"{fmt_decimal(x)} 公升 = {ans} 毫升。",
        )

    if mode == "kg_to_g":
        x = Decimal(random.randint(1, 50)) / Decimal(10)  # 0.1 ~ 5.0
        ans = int((x * Decimal(1000)).to_integral_value())
        question = f"（單位換算）{fmt_decimal(x)} 公斤 = 多少公克？（只寫數字）"
        hints = [
            "觀念：1 公斤 = 1000 公克。",
            f"列式：{fmt_decimal(x)} × 1000。",
            f"Level 3｜計算：{fmt_decimal(x)}×1000 = {ans}（公克）。",
        ]
        steps = ["1 kg = 1000 g", "乘 1000", f"得到 {ans}"]
        return Q(
            id=f"la5_ucv_{i:03d}",
            kind="unit_convert",
            difficulty="easy",
            question=question,
            answer=str(ans),
            answer_mode="number",
            hints=hints,
            steps=steps,
            meta={"unit": "公克"},
            explanation=f"{fmt_decimal(x)} 公斤 = {ans} 公克。",
        )

    # m_to_cm
    x = Decimal(random.randint(1, 300)) / Decimal(100)  # 0.01 ~ 3.00
    ans = int((x * Decimal(100)).to_integral_value())
    question = f"（單位換算）{fmt_decimal(x)} 公尺 = 多少公分？（只寫數字）"
    hints = [
        "觀念：1 公尺 = 100 公分。",
        f"列式：{fmt_decimal(x)} × 100。",
        f"Level 3｜計算：{fmt_decimal(x)}×100 = {ans}（公分）。",
    ]
    steps = ["1 m = 100 cm", "乘 100", f"得到 {ans}"]
    return Q(
        id=f"la5_ucv_{i:03d}",
        kind="unit_convert",
        difficulty="easy",
        question=question,
        answer=str(ans),
        answer_mode="number",
        hints=hints,
        steps=steps,
        meta={"unit": "公分"},
        explanation=f"{fmt_decimal(x)} 公尺 = {ans} 公分。",
    )


def q_fraction_remaining(i: int) -> Q:
    whole = random.randint(18, 60)
    fr = random.choice([Fraction(1, 4), Fraction(1, 3), Fraction(2, 5), Fraction(3, 8)])
    eaten = whole * fr
    left = whole - eaten

    question = f"（分數應用）一條長 {whole} 公尺的繩子，用掉了 {fmt_fraction(fr)}，還剩多少公尺？"
    eaten_s = fmt_decimal_from_fraction(eaten)
    left_s = fmt_decimal_from_fraction(left)

    hints = [
        "觀念：『用掉了幾分之幾』＝用掉 全體×分數；剩下＝全體−用掉。",
        f"列式：用掉 = {whole}×{fmt_fraction(fr)}；剩下 = {whole} − 用掉。",
        "Level 3｜步驟\n"
        f"1) 用掉：{whole}×{fmt_fraction(fr)} = {eaten_s}\n"
        f"2) 剩下：{whole} − {eaten_s} = {left_s}\n"
        f"3) 所以剩下 {left_s} 公尺",
    ]

    steps = [
        "用掉 = 全體 × 分數",
        "剩下 = 全體 − 用掉",
        "寫上單位：公尺",
    ]

    return Q(
        id=f"la5_frac_{i:03d}",
        kind="fraction_remaining",
        difficulty="medium",
        question=question,
        answer=left_s,
        answer_mode="number",
        hints=hints,
        steps=steps,
        meta={"unit": "公尺"},
        explanation=f"用掉 {whole}×{fmt_fraction(fr)}={eaten_s}；剩下 {whole}-{eaten_s}={left_s}（公尺）。",
    )


def build_bank(target_total: int = 120) -> List[Dict[str, Any]]:
    generators: Dict[str, Any] = {
        "buy_many": q_buy_many,
        "discount": q_discount,
        "unit_price": q_unit_price,
        "time_add": q_time_add,
        "unit_convert": q_unit_convert,
        "fraction_remaining": q_fraction_remaining,
    }

    quotas: Dict[str, int] = {
        "buy_many": 25,
        "discount": 20,
        "unit_price": 20,
        "time_add": 20,
        "unit_convert": 20,
        "fraction_remaining": 15,
    }

    seen_questions: set[str] = set()
    out: List[Dict[str, Any]] = []
    idx = 1

    def _emit(q: Q) -> None:
        out.append(
            {
                "id": q.id,
                "kind": q.kind,
                "topic": TOPIC,
                "difficulty": q.difficulty,
                "question": q.question,
                "answer": q.answer,
                "answer_mode": q.answer_mode,
                "hints": q.hints,
                "steps": q.steps,
                "meta": q.meta,
                "explanation": q.explanation,
            }
        )

    # Fill per-kind quotas with retry to avoid duplicates.
    for kind, target in quotas.items():
        made = 0
        attempts = 0
        gen = generators[kind]
        while made < target:
            attempts += 1
            if attempts > target * 800:
                raise RuntimeError(f"Unable to fill quota kind={kind} target={target} made={made}")

            q = gen(idx)
            if q.question in seen_questions:
                continue
            seen_questions.add(q.question)
            _emit(q)
            idx += 1
            made += 1

    # If quotas don't sum to target_total, fill remaining with a balanced mix.
    if len(out) < target_total:
        kinds = list(generators.keys())
        attempts = 0
        while len(out) < target_total:
            attempts += 1
            if attempts > (target_total - len(out)) * 1200:
                raise RuntimeError(f"Unable to reach target_total={target_total} got={len(out)}")
            kind = random.choice(kinds)
            q = generators[kind](idx)
            if q.question in seen_questions:
                continue
            seen_questions.add(q.question)
            _emit(q)
            idx += 1

    return out


def main() -> None:
    bank = build_bank(target_total=120)
    OUT_JS.parent.mkdir(parents=True, exist_ok=True)

    payload = json.dumps(bank, ensure_ascii=False, indent=2)
    header = "/* Auto-generated offline question bank. */\nwindow.LIFE_APPLICATIONS_G5_BANK = "
    OUT_JS.write_text(header + payload + ";\n", encoding="utf-8")

    kinds = sorted({x["kind"] for x in bank})
    print(f"Wrote {OUT_JS} (n={len(bank)} kinds={len(kinds)}: {', '.join(kinds)})")


if __name__ == "__main__":
    main()

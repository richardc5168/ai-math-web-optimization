from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from .analytics import detect_weak_skills
from .datasets import DatasetBlueprint, get_skill_weight


_SKILL_PRACTICE_MAP: Dict[str, List[Dict[str, Any]]] = {
    "四則運算": [
        {
            "id": "arith_shopping_total",
            "title": "購物總價（含加減乘）",
            "rationale": "練習運算順序與心算檢查。",
            "example_applications": ["shopping total", "budget planning"],
        },
        {
            "id": "arith_time_schedule",
            "title": "時間表加減（幾點到幾點）",
            "rationale": "把算式對應到生活時間差。",
            "example_applications": ["time schedule"],
        },
    ],
    "分數/小數": [
        {
            "id": "frac_discount",
            "title": "折扣與百分比（分數/小數互換）",
            "rationale": "連結折扣、百分比與小數。",
            "example_applications": ["discount", "percentage"],
        },
        {
            "id": "frac_measurement",
            "title": "測量與單位（分數刻度）",
            "rationale": "把分數理解成量的分割。",
            "example_applications": ["measurement", "unit conversion"],
        },
    ],
    "比例": [
        {
            "id": "ratio_recipe",
            "title": "配方放大縮小（比例）",
            "rationale": "用配方/地圖縮放理解比例。",
            "example_applications": ["recipes", "maps"],
        },
        {
            "id": "ratio_speed",
            "title": "路程-時間-速度（比例關係）",
            "rationale": "把變量關係寫成比例。",
            "example_applications": ["distance-rate-time"],
        },
    ],
    "單位換算": [
        {
            "id": "unit_length_mass",
            "title": "長度/重量單位換算",
            "rationale": "建立換算表與倍數概念。",
            "example_applications": ["measurement", "unit conversion"],
        }
    ],
    "路程時間": [
        {
            "id": "drt_basic",
            "title": "路程時間速度基本題",
            "rationale": "熟悉公式與單位一致性。",
            "example_applications": ["distance-rate-time"],
        }
    ],
    "折扣": [
        {
            "id": "discount_two_step",
            "title": "先折扣再加稅/找零",
            "rationale": "強化多步計算與檢查。",
            "example_applications": ["shopping total/discount"],
        }
    ],
    "unknown": [
        {
            "id": "general_practice",
            "title": "基礎練習（由易到難）",
            "rationale": "資料不足時，先用基礎題建立穩定正確率。",
            "example_applications": ["core skills"],
        }
    ],
}


def get_practice_items_for_skill(skill_tag: str) -> List[Dict[str, Any]]:
    """Return suggested practice item definitions for a skill tag (stable order)."""

    skill_tag = str(skill_tag or "unknown")
    items = _SKILL_PRACTICE_MAP.get(skill_tag) or _SKILL_PRACTICE_MAP.get("unknown") or []
    # defensive copy
    return [dict(x) for x in items]


def _score_weak_item(item: Dict[str, Any], *, blueprint: Optional[DatasetBlueprint]) -> float:
    inp = item.get("score_inputs") or {}
    acc = float(inp.get("accuracy") or 0.0)
    hd = float(inp.get("hint_dependency") or 0.0)
    tmc = int(inp.get("top_mistake_count") or 0)

    base = (1.0 - acc) * 1.0 + hd * 0.7 + (0.15 if tmc >= 3 else 0.0)
    w = get_skill_weight(blueprint, str(item.get("skill_tag") or "unknown"))
    return base * float(w)


def generate_remediation_plan(
    analytics: Dict[str, Any],
    *,
    blueprint: Optional[DatasetBlueprint] = None,
    top_k: int = 3,
) -> Dict[str, Any]:
    weak = detect_weak_skills(analytics)

    scored: List[Dict[str, Any]] = []
    for it in weak:
        scored.append({
            "skill_tag": it["skill_tag"],
            "score": _score_weak_item(it, blueprint=blueprint),
            "evidence": it,
        })

    # Stable sort: score desc, skill_tag asc
    scored.sort(key=lambda x: (-float(x["score"]), str(x["skill_tag"])))

    top = scored[: int(top_k)]

    practice_sequence: List[Dict[str, Any]] = []
    for t in top:
        skill = str(t["skill_tag"])
        items = _SKILL_PRACTICE_MAP.get(skill) or _SKILL_PRACTICE_MAP.get("unknown") or []
        for p in items:
            practice_sequence.append({
                "skill_tag": skill,
                **p,
            })

    # Limit to 10 items but keep deterministic order.
    practice_sequence = practice_sequence[:10]

    selectable_goals: List[Dict[str, Any]] = []
    for t in top:
        selectable_goals.append({
            "id": f"goal_improve_{t['skill_tag']}",
            "title": f"加強：{t['skill_tag']}",
        })
    if len(selectable_goals) < 5:
        selectable_goals.append({"id": "goal_reduce_hints", "title": "降低對提示的依賴（同題不看提示也能做）"})
    if len(selectable_goals) < 5:
        selectable_goals.append({"id": "goal_speed", "title": "提升速度（時間內保持正確）"})
    selectable_goals = selectable_goals[:5]

    plan = {
        "student_id": analytics.get("student_id"),
        "generated_at": analytics.get("generated_at"),
        "window_days": analytics.get("window_days"),
        "dataset": {
            "name": getattr(blueprint, "name", None),
            "version": getattr(blueprint, "version", None),
        },
        "weak_skills_top3": [
            {
                "skill_tag": t["skill_tag"],
                "score": round(float(t["score"]), 6),
                "evidence": t["evidence"],
            }
            for t in top
        ],
        "suggested_practice_sequence": practice_sequence,
        "student_selectable_goals": selectable_goals,
    }

    return plan

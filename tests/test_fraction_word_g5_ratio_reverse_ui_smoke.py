from __future__ import annotations

import re
from pathlib import Path


def _extract_ratio_ladder_block(text: str) -> str:
    start = text.find("function buildRatioReverseHintLadderForUI(q)")
    end = text.find("function renderHintLadderCards(ladder)")
    assert start != -1, "Missing buildRatioReverseHintLadderForUI"
    assert end != -1 and end > start, "Missing renderHintLadderCards boundary"
    return text[start:end]


def _assert_ratio_ladder_wiring(text: str) -> None:
    assert "const ladder = buildRatioReverseHintLadderForUI(q);" in text
    assert "renderHintLadderCards(ladder)" in text
    assert "比例反推" in text


def _assert_has_seven_steps(block: str) -> None:
    steps = re.findall(r"title:\s*'Step\s*(\d+)｜", block)
    assert steps == ["1", "2", "3", "4", "5", "6", "7"], f"Unexpected ladder steps: {steps}"
    assert "Step 7｜驗算（必做）" in block


def test_fraction_word_g5_ratio_reverse_ladder_ui_smoke():
    root = Path(__file__).resolve().parents[1]
    docs_file = root / "docs" / "fraction-word-g5" / "index.html"
    dist_file = root / "dist_ai_math_web_pages" / "docs" / "fraction-word-g5" / "index.html"

    assert docs_file.exists(), f"Missing file: {docs_file}"
    assert dist_file.exists(), f"Missing file: {dist_file}"

    docs_text = docs_file.read_text(encoding="utf-8", errors="ignore")
    dist_text = dist_file.read_text(encoding="utf-8", errors="ignore")

    docs_block = _extract_ratio_ladder_block(docs_text)
    dist_block = _extract_ratio_ladder_block(dist_text)

    _assert_has_seven_steps(docs_block)
    _assert_has_seven_steps(dist_block)
    _assert_ratio_ladder_wiring(docs_text)
    _assert_ratio_ladder_wiring(dist_text)

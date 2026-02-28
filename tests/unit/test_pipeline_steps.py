"""
tests/unit/test_pipeline_steps.py — Unit tests for step lint gate in pipeline/verify.py

Covers:
- Minimum step counts per topic
- Forbidden words (N-5-11: 誤差, 近似值)
- Must-include formula (N-6-7: 距離=速度×時間)
- Forbidden unless exempt (N-6-3: 餘數)
- Valid problems pass step gate
"""
import pytest

from pipeline.verify import gate_steps


def _make_problem(topic_codes, steps, **extras):
    """Helper to build a problem dict focused on step-gate testing."""
    p = {
        "id": "STEP-TEST",
        "grade": 6,
        "stage": "III",
        "topic_codes": topic_codes,
        "question": "測試題目",
        "solution": {
            "steps": steps,
            "answer": {"value": 1},
        },
        "source": {
            "url": "https://example.com",
            "license_type": "CC BY 4.0",
            "captured_at": "2026-01-01T00:00:00Z",
        },
    }
    p.update(extras)
    return p


class TestStepGateMinSteps:
    """N-6-7 and S-6-2 require >= 2 steps."""

    def test_n67_two_steps_pass(self):
        p = _make_problem(["N-6-7"], ["距離=速度×時間", "12 × 0.5 = 6"])
        ok, _ = gate_steps(p)
        assert ok is True

    def test_n67_one_step_fail(self):
        p = _make_problem(["N-6-7"], ["距離=速度×時間 → 6"])
        ok, msg = gate_steps(p)
        assert ok is False
        assert "N-6-7" in msg

    def test_s62_two_steps_pass(self):
        p = _make_problem(["S-6-2"], ["地圖距離 × 比例尺", "= 1.5 公里"])
        ok, _ = gate_steps(p)
        assert ok is True


class TestStepGateForbiddenWords:
    """N-5-11 forbids 誤差 and 近似值."""

    def test_n511_clean_pass(self):
        p = _make_problem(["N-5-11"], ["觀察小數點後第三位", "四捨五入得 3.14"])
        ok, _ = gate_steps(p)
        assert ok is True

    @pytest.mark.parametrize("forbidden", ["誤差", "近似值"])
    def test_n511_forbidden_fail(self, forbidden):
        p = _make_problem(["N-5-11"], [f"此處使用{forbidden}概念", "得 3.14"])
        ok, msg = gate_steps(p)
        assert ok is False
        assert forbidden in msg


class TestStepGateMustIncludeFormula:
    """N-6-7 must include one of the distance/speed/time formulas."""

    def test_formula_present_pass(self):
        p = _make_problem(["N-6-7"], ["距離=速度×時間", "12 × 0.5 = 6"])
        ok, _ = gate_steps(p)
        assert ok is True

    def test_formula_missing_fail(self):
        p = _make_problem(["N-6-7"], ["先換算單位", "12 × 0.5 = 6"])
        ok, msg = gate_steps(p)
        assert ok is False
        assert "requires one of" in msg


class TestStepGateForbiddenUnlessExempt:
    """N-6-3 forbids 餘數 unless grading_exempt=true."""

    def test_n63_no_remainder_pass(self):
        p = _make_problem(["N-6-3"], ["除以一個分數等於乘以其倒數", "3/4 × 2 = 3/2"])
        ok, _ = gate_steps(p)
        assert ok is True

    def test_n63_remainder_without_exempt_fail(self):
        p = _make_problem(["N-6-3"], ["計算得餘數為 1", "答案為 2 餘 1"])
        ok, msg = gate_steps(p)
        assert ok is False
        assert "餘數" in msg

    def test_n63_remainder_with_exempt_pass(self):
        p = _make_problem(
            ["N-6-3"],
            ["計算得餘數為 1", "答案為 2 餘 1"],
            grading_exempt=True,
        )
        ok, _ = gate_steps(p)
        assert ok is True


class TestStepGateGenericTopics:
    """Topics without special rules should always pass."""

    def test_generic_topic_pass(self):
        p = _make_problem(["n-III-6"], ["解題步驟一", "解題步驟二"])
        ok, _ = gate_steps(p)
        assert ok is True

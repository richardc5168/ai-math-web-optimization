"""
tests/unit/test_pipeline_correctness.py — Unit tests for correctness gate

Covers:
- Missing answer.value fails
- Negative answer fails (unreasonable)
- N-5-10 answer exceeding 100% fails
- Low confidence flagged but passes
- Normal answers pass
"""
import pytest

from pipeline.verify import gate_correctness


def _make_problem(value=10, topic_codes=None, confidence=0.95):
    return {
        "id": "CORR-TEST",
        "grade": 5,
        "stage": "III",
        "topic_codes": topic_codes or ["n-III-6"],
        "question": "測試題目",
        "solution": {
            "steps": ["步驟"],
            "answer": {"value": value, "unit": "元", "tolerance": 0},
        },
        "source": {
            "url": "https://example.com",
            "license_type": "CC BY 4.0",
            "captured_at": "2026-01-01T00:00:00Z",
        },
        "confidence": confidence,
    }


class TestCorrectnessGate:

    def test_valid_answer_passes(self):
        ok, _ = gate_correctness(_make_problem(value=640))
        assert ok is True

    def test_missing_value_fails(self):
        p = _make_problem()
        p["solution"]["answer"] = {}
        ok, msg = gate_correctness(p)
        assert ok is False
        assert "missing" in msg.lower()

    def test_negative_answer_fails(self):
        ok, msg = gate_correctness(_make_problem(value=-5))
        assert ok is False
        assert "negative" in msg.lower()

    def test_n510_percent_over_100_fails(self):
        p = _make_problem(value=150, topic_codes=["N-5-10"])
        p["answer_type"] = "percent"
        ok, msg = gate_correctness(p)
        assert ok is False
        assert "exceeds" in msg.lower()

    def test_n510_percent_at_100_passes(self):
        p = _make_problem(value=100, topic_codes=["N-5-10"])
        p["answer_type"] = "percent"
        ok, _ = gate_correctness(p)
        assert ok is True

    def test_n510_non_percent_answer_passes(self):
        """N-5-10 with integer answer (e.g. discounted price) should pass."""
        ok, _ = gate_correctness(_make_problem(
            value=640, topic_codes=["N-5-10"]
        ))
        assert ok is True

    def test_fraction_string_passes(self):
        ok, _ = gate_correctness(_make_problem(value="3/2"))
        assert ok is True  # non-numeric value doesn't trigger negative check

    def test_low_confidence_passes_with_warning(self):
        ok, msg = gate_correctness(_make_problem(confidence=0.5))
        assert ok is True
        assert "low confidence" in msg.lower()

    def test_normal_confidence_no_warning(self):
        ok, msg = gate_correctness(_make_problem(confidence=0.9))
        assert ok is True
        assert "low confidence" not in msg.lower()

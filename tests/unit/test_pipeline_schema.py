"""
tests/unit/test_pipeline_schema.py — Unit tests for schema gate in pipeline/verify.py

Covers:
- Valid problem passes schema gate
- Missing required fields fail
- Invalid grade/stage/topic_codes fail
- Source metadata enforcement
"""
import pytest

from pipeline.verify import gate_schema


def _make_problem(**overrides):
    """Build a minimal valid problem dict, then apply overrides."""
    base = {
        "id": "TEST-0001",
        "grade": 5,
        "stage": "III",
        "topic_codes": ["n-III-6", "N-5-10"],
        "question": "一件原價 800 元的外套打八折，售價是多少元？",
        "solution": {
            "steps": ["八折 = 80% = 0.8", "售價 = 800 × 0.8 = 640"],
            "answer": {"value": 640, "unit": "元", "tolerance": 0},
        },
        "source": {
            "url": "https://example.com/test",
            "license_type": "CC BY 4.0",
            "captured_at": "2026-01-15T10:00:00Z",
            "license_decision": "allow",
        },
    }
    base.update(overrides)
    return base


class TestGateSchema:
    """Schema gate unit tests."""

    def test_valid_problem_passes(self):
        ok, msg = gate_schema(_make_problem())
        assert ok is True

    @pytest.mark.parametrize("field", [
        "id", "grade", "stage", "topic_codes", "question", "solution", "source",
    ])
    def test_missing_required_field(self, field):
        p = _make_problem()
        del p[field]
        ok, msg = gate_schema(p)
        assert ok is False
        assert "missing" in msg.lower() or field in msg

    def test_invalid_grade(self):
        ok, msg = gate_schema(_make_problem(grade=4))
        assert ok is False
        assert "grade" in msg

    def test_invalid_stage(self):
        ok, msg = gate_schema(_make_problem(stage="II"))
        assert ok is False
        assert "stage" in msg

    def test_empty_topic_codes(self):
        ok, msg = gate_schema(_make_problem(topic_codes=[]))
        assert ok is False
        assert "topic_codes" in msg

    def test_missing_solution_steps(self):
        ok, msg = gate_schema(_make_problem(solution={"answer": {"value": 1}}))
        assert ok is False

    def test_missing_solution_answer(self):
        ok, msg = gate_schema(_make_problem(solution={"steps": ["step1"]}))
        assert ok is False

    def test_empty_solution_steps(self):
        ok, msg = gate_schema(_make_problem(
            solution={"steps": [], "answer": {"value": 1}}
        ))
        assert ok is False

    @pytest.mark.parametrize("missing_src_field", [
        "url", "license_type", "captured_at",
    ])
    def test_missing_source_field(self, missing_src_field):
        src = {
            "url": "https://example.com",
            "license_type": "CC BY 4.0",
            "captured_at": "2026-01-01T00:00:00Z",
        }
        del src[missing_src_field]
        ok, msg = gate_schema(_make_problem(source=src))
        assert ok is False
        assert missing_src_field in msg

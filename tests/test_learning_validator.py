import pytest

from learning.validator import validate_attempt_event


def test_validate_attempt_event_minimal_ok():
    v = validate_attempt_event(
        {
            "student_id": "s1",
            "question_id": "q1",
            "timestamp": "2026-02-15T12:00:00",
            "is_correct": True,
            "answer_raw": "42",
        }
    )
    assert v.student_id == "s1"
    assert v.question_id == "q1"
    assert v.is_correct is True
    assert v.hints_viewed_count == 0
    assert v.skill_tags == ["unknown"]


def test_validate_attempt_event_reject_missing_student():
    with pytest.raises(ValueError):
        validate_attempt_event({"question_id": "q1", "timestamp": "2026-02-15T12:00:00", "is_correct": True, "answer_raw": "x"})


def test_validate_attempt_event_mistake_code_enum():
    with pytest.raises(ValueError):
        validate_attempt_event(
            {
                "student_id": "s1",
                "question_id": "q1",
                "timestamp": "2026-02-15T12:00:00",
                "is_correct": False,
                "answer_raw": "x",
                "mistake_code": "not_valid",
            }
        )

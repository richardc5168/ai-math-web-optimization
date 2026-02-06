from __future__ import annotations

from adaptive_mastery import (
    AttemptEvent,
    ConceptState,
    ErrorCode,
    Stage,
    classify_error_code,
    update_state_on_attempt,
)


def test_basic_to_literacy_upgrade_resets_counters():
    st = ConceptState(concept_id="A1", stage=Stage.BASIC)
    for _ in range(10):
        st, actions = update_state_on_attempt(
            st,
            AttemptEvent(is_correct=True, error_code=None, now_iso="2026-02-06T00:00:00"),
            last4_acc=1.0,
            last5_acc=1.0,
            last8_acc=1.0,
        )

    assert actions.upgraded_stage is True
    assert st.stage == Stage.LITERACY
    assert st.answered == 0
    assert st.correct == 0


def test_stuck_enters_hint_then_micro_then_teacher_flag():
    st = ConceptState(concept_id="A1", stage=Stage.BASIC)

    # 6 wrong answers => stuck => enter hint
    for i in range(6):
        st, actions = update_state_on_attempt(
            st,
            AttemptEvent(is_correct=False, error_code=ErrorCode.CON, time_spent_sec=10, now_iso=f"2026-02-06T00:00:0{i}"),
            last4_acc=0.0,
            last5_acc=0.0,
            last8_acc=0.0,
        )

    assert st.in_hint_mode is True

    # Another wrong while in hint and stuck => enter micro
    st, actions = update_state_on_attempt(
        st,
        AttemptEvent(is_correct=False, error_code=ErrorCode.CON, time_spent_sec=10, now_iso="2026-02-06T00:00:10"),
        last4_acc=0.0,
        last5_acc=0.0,
        last8_acc=0.0,
    )
    assert actions.entered_micro is True
    assert st.in_micro_step is True
    assert st.micro_count == 1

    # Force micro_count to max then try again => teacher flag.
    st.micro_count = 2
    st.in_micro_step = False
    st.in_hint_mode = True
    st.answered = 6
    st.correct = 0

    st, actions = update_state_on_attempt(
        st,
        AttemptEvent(is_correct=False, error_code=ErrorCode.CON, time_spent_sec=10, now_iso="2026-02-06T00:00:20"),
        last4_acc=0.0,
        last5_acc=0.0,
        last8_acc=0.0,
    )
    assert st.flag_teacher is True
    assert actions.flagged_teacher is True


def test_calm_mode_enters_on_consecutive_wrong_and_exits_on_recovery():
    st = ConceptState(concept_id="A1")
    for i in range(3):
        st, actions = update_state_on_attempt(
            st,
            AttemptEvent(is_correct=False, error_code=ErrorCode.CON, time_spent_sec=10, now_iso=f"2026-02-06T00:00:0{i}"),
            last4_acc=0.0,
        )

    assert st.calm_mode is True

    # Exit condition: last4 accuracy >= 0.75
    st, actions = update_state_on_attempt(
        st,
        AttemptEvent(is_correct=True, error_code=None, time_spent_sec=10, now_iso="2026-02-06T00:00:10"),
        last4_acc=0.75,
    )
    assert st.calm_mode is False
    assert actions.exited_calm is True


def test_classify_error_code_uses_overrides_and_time_and_closeness():
    assert (
        classify_error_code(
            is_correct=False,
            correct_answer="10",
            user_answer="9.9",
            time_spent_sec=10,
            avg_time_sec=10,
            meta={"small_delta": True},
        )
        == ErrorCode.CARE
    )

    assert (
        classify_error_code(
            is_correct=False,
            correct_answer="10",
            user_answer="0",
            time_spent_sec=60,
            avg_time_sec=10,
            meta={},
        )
        == ErrorCode.READ
    )

    assert (
        classify_error_code(
            is_correct=False,
            correct_answer="10",
            user_answer="10.1",
            time_spent_sec=5,
            avg_time_sec=10,
            meta={},
        )
        == ErrorCode.CARE
    )

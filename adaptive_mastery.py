from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, Optional, Tuple


class Stage(str, Enum):
    BASIC = "BASIC"
    LITERACY = "LITERACY"


class ErrorCode(str, Enum):
    CAL = "CAL"   # calculation
    CON = "CON"   # concept / method
    READ = "READ" # reading / comprehension
    CARE = "CARE" # careless / small slip
    TIME = "TIME" # time anomaly


@dataclass
class ConceptState:
    concept_id: str
    stage: Stage = Stage.BASIC

    answered: int = 0
    correct: int = 0

    in_hint_mode: bool = False
    in_micro_step: bool = False
    micro_count: int = 0

    consecutive_wrong: int = 0
    calm_mode: bool = False

    last_activity: Optional[str] = None  # ISO string
    concept_started_at: Optional[str] = None  # ISO string

    error_stats: Dict[str, int] = field(default_factory=dict)

    flag_teacher: bool = False
    completed: bool = False

    def mastery(self) -> float:
        if self.answered <= 0:
            return 0.0
        return self.correct / self.answered


@dataclass
class AttemptEvent:
    is_correct: bool
    time_spent_sec: int = 0
    error_code: Optional[ErrorCode] = None
    meta: Dict[str, Any] = field(default_factory=dict)
    now_iso: Optional[str] = None


@dataclass
class AdaptiveActions:
    upgraded_stage: bool = False
    advanced_concept: bool = False
    entered_hint: bool = False
    exited_hint: bool = False
    entered_micro: bool = False
    exited_micro: bool = False
    entered_calm: bool = False
    exited_calm: bool = False
    flagged_teacher: bool = False


def _parse_iso(ts: Optional[str]) -> Optional[datetime]:
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts)
    except Exception:
        return None


def _safe_now_iso(now_iso: Optional[str]) -> str:
    if now_iso:
        return now_iso
    return datetime.now().isoformat(timespec="seconds")


def _bump_error_stats(state: ConceptState, code: Optional[ErrorCode]) -> None:
    if not code:
        return
    key = str(code.value)
    state.error_stats[key] = int(state.error_stats.get(key, 0)) + 1


def classify_error_code(
    *,
    is_correct: bool,
    correct_answer: Optional[str],
    user_answer: Optional[str],
    time_spent_sec: int,
    avg_time_sec: Optional[float],
    meta: Optional[Dict[str, Any]] = None,
) -> Optional[ErrorCode]:
    if is_correct:
        return None

    meta = meta or {}

    # Explicit overrides (lets the client/engine tell us a stronger signal).
    if meta.get("method_wrong") is True:
        return ErrorCode.CON
    if meta.get("steps_ok_final_wrong") is True:
        return ErrorCode.CAL
    if meta.get("small_delta") is True:
        return ErrorCode.CARE

    # Time-based heuristics.
    if avg_time_sec and avg_time_sec > 0 and time_spent_sec > 0:
        if time_spent_sec >= max(30, int(avg_time_sec * 2.5)):
            # Took much longer than usual.
            return ErrorCode.READ
        if time_spent_sec <= 2:
            # Very fast wrong answers often mean random clicking.
            return ErrorCode.TIME

    # Numeric closeness => careless.
    try:
        ca = float(str(correct_answer).strip())
        ua = float(str(user_answer).strip())
        if abs(ca - ua) <= 1e-9:
            return ErrorCode.CARE
        if abs(ca - ua) <= max(1e-6, abs(ca) * 0.02):
            return ErrorCode.CARE
    except Exception:
        pass

    return ErrorCode.CON


def update_state_on_attempt(
    state: ConceptState,
    event: AttemptEvent,
    *,
    last5_acc: Optional[float] = None,
    last8_acc: Optional[float] = None,
    last4_acc: Optional[float] = None,
) -> Tuple[ConceptState, AdaptiveActions]:
    """Pure update: mutate a copy-like state and return actions.

    Accuracy windows are provided by the persistence layer.
    """

    actions = AdaptiveActions()
    now_iso = _safe_now_iso(event.now_iso)

    was_in_hint_mode = bool(state.in_hint_mode)

    if not state.concept_started_at:
        state.concept_started_at = now_iso

    state.last_activity = now_iso

    # Update counters.
    state.answered = int(state.answered) + 1
    if event.is_correct:
        state.correct = int(state.correct) + 1
        state.consecutive_wrong = 0
    else:
        state.consecutive_wrong = int(state.consecutive_wrong) + 1

    # Error stats.
    _bump_error_stats(state, event.error_code)

    # Calm Mode trigger: consecutive wrong >= 3 OR random clicking hint.
    rapid_wrong = (not event.is_correct) and event.time_spent_sec is not None and int(event.time_spent_sec) <= 2
    if not state.calm_mode and (state.consecutive_wrong >= 3 or rapid_wrong):
        state.calm_mode = True
        actions.entered_calm = True

    # Calm Mode exit.
    if state.calm_mode and last4_acc is not None and last4_acc >= 0.75:
        state.calm_mode = False
        actions.exited_calm = True

    # Stuck detection.
    stuck = state.answered >= 6 and state.mastery() < 0.6

    # Hint Mode enter.
    if stuck and (not state.in_hint_mode) and (not state.in_micro_step):
        state.in_hint_mode = True
        actions.entered_hint = True

    # Hint Mode exit.
    if state.in_hint_mode and last5_acc is not None and last5_acc >= 0.70:
        state.in_hint_mode = False
        actions.exited_hint = True

    # Micro-Step enter.
    # Spec intent: first try Hint Mode; if still stuck while already in hint mode,
    # then switch into micro-step. Avoid entering micro-step on the exact attempt
    # that first enables hint mode.
    if stuck and was_in_hint_mode and state.in_hint_mode and (not state.in_micro_step):
        if state.micro_count < 2:
            state.in_micro_step = True
            state.micro_count = int(state.micro_count) + 1
            actions.entered_micro = True
        else:
            state.flag_teacher = True
            actions.flagged_teacher = True

    # Micro-Step exit.
    if state.in_micro_step and last8_acc is not None and last8_acc >= 0.75:
        state.in_micro_step = False
        # Reset counters when returning to original concept BASIC
        state.stage = Stage.BASIC
        state.answered = 0
        state.correct = 0
        state.consecutive_wrong = 0
        actions.exited_micro = True

    # Mastery upgrades.
    if state.answered >= 10 and state.mastery() >= 0.8:
        if state.stage == Stage.BASIC:
            state.stage = Stage.LITERACY
            state.answered = 0
            state.correct = 0
            state.consecutive_wrong = 0
            state.in_hint_mode = False
            state.in_micro_step = False
            state.calm_mode = False
            actions.upgraded_stage = True
        elif state.stage == Stage.LITERACY:
            # Mark completed; next-concept resolution happens outside.
            state.completed = True
            state.answered = 0
            state.correct = 0
            state.consecutive_wrong = 0
            state.in_hint_mode = False
            state.in_micro_step = False
            state.calm_mode = False
            actions.advanced_concept = True

    # Teacher flag if stuck too long on same concept.
    started = _parse_iso(state.concept_started_at)
    if started is not None:
        try:
            if datetime.now() - started >= timedelta(days=7) and not state.completed:
                state.flag_teacher = True
                actions.flagged_teacher = True
        except Exception:
            pass

    return state, actions


def error_stats_to_json(stats: Dict[str, int]) -> str:
    return json.dumps(stats or {}, ensure_ascii=False)


def error_stats_from_json(raw: Optional[str]) -> Dict[str, int]:
    if not raw:
        return {}
    try:
        obj = json.loads(raw)
        if isinstance(obj, dict):
            return {str(k): int(v) for k, v in obj.items()}
    except Exception:
        pass
    return {}

from __future__ import annotations

import json
import sqlite3
from typing import Any, Dict, Optional

from . import analytics as analytics_mod
from .db import connect, ensure_learning_schema, now_iso
from .datasets import load_dataset
from .remediation import generate_remediation_plan
from .validator import validate_attempt_event


def recordAttempt(event: Dict[str, Any], *, db_path: Optional[str] = None, dev_mode: bool = True) -> Dict[str, Any]:
    """Persist one attempt event into SQLite (normalized learning tables).

    Returns a small ack dict including the inserted attempt_id.
    """

    v = validate_attempt_event(event, dev_mode=dev_mode)

    conn = connect(db_path)
    try:
        ensure_learning_schema(conn)

        conn.execute(
            "INSERT OR IGNORE INTO la_students(student_id, created_at, meta_json) VALUES (?,?,?)",
            (v.student_id, now_iso(), "{}"),
        )
        conn.execute(
            "INSERT OR IGNORE INTO la_questions(question_id, created_at, meta_json) VALUES (?,?,?)",
            (v.question_id, now_iso(), "{}"),
        )

        # skill tags registry
        for tag in sorted(set(v.skill_tags)):
            conn.execute(
                "INSERT OR IGNORE INTO la_skill_tags(skill_tag, created_at, description) VALUES (?,?,?)",
                (tag, now_iso(), None),
            )

        cur = conn.execute(
            """
            INSERT INTO la_attempt_events(
              student_id, question_id, ts, is_correct, answer_raw,
              duration_ms, hints_viewed_count, hint_steps_viewed_json,
              mistake_code, unit, topic, question_type,
              session_id, device_json, extra_json
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                v.student_id,
                v.question_id,
                v.timestamp_iso,
                1 if v.is_correct else 0,
                v.answer_raw,
                v.duration_ms,
                int(v.hints_viewed_count),
                json.dumps(v.hint_steps_viewed, ensure_ascii=False),
                v.mistake_code,
                v.unit,
                v.topic,
                v.question_type,
                v.session_id,
                json.dumps(v.device or {}, ensure_ascii=False),
                json.dumps(v.extra or {}, ensure_ascii=False),
            ),
        )
        attempt_id = int(cur.lastrowid)

        for tag in sorted(set(v.skill_tags)):
            conn.execute(
                "INSERT OR IGNORE INTO la_attempt_skill_tags(attempt_id, skill_tag) VALUES (?,?)",
                (attempt_id, tag),
            )

        for step in v.hint_steps_viewed:
            conn.execute(
                "INSERT INTO la_hint_usage(attempt_id, step_index) VALUES (?,?)",
                (attempt_id, int(step)),
            )

        conn.commit()
        return {"ok": True, "attempt_id": attempt_id}
    finally:
        conn.close()


def getStudentAnalytics(
    studentId: str,
    windowDays: int = 14,
    *,
    db_path: Optional[str] = None,
) -> Dict[str, Any]:
    conn = connect(db_path)
    try:
        return analytics_mod.get_student_analytics(conn, student_id=str(studentId), window_days=int(windowDays))
    finally:
        conn.close()


def getRemediationPlan(
    studentId: str,
    datasetName: Optional[str] = None,
    windowDays: int = 14,
    *,
    db_path: Optional[str] = None,
    persist: bool = True,
) -> Dict[str, Any]:
    conn = connect(db_path)
    try:
        ensure_learning_schema(conn)

        analytics = analytics_mod.get_student_analytics(conn, student_id=str(studentId), window_days=int(windowDays))
        blueprint = load_dataset(datasetName) if datasetName else None
        plan = generate_remediation_plan(analytics, blueprint=blueprint)

        if persist:
            conn.execute(
                "INSERT OR IGNORE INTO la_students(student_id, created_at, meta_json) VALUES (?,?,?)",
                (str(studentId), now_iso(), "{}"),
            )
            conn.execute(
                """
                INSERT INTO la_remediation_plans(
                  student_id, generated_at, window_days, dataset_name, plan_json, evidence_json
                ) VALUES (?,?,?,?,?,?)
                """,
                (
                    str(studentId),
                    now_iso(),
                    int(windowDays),
                    datasetName,
                    json.dumps(plan, ensure_ascii=False, sort_keys=True),
                    json.dumps({"analytics": analytics}, ensure_ascii=False, sort_keys=True),
                ),
            )
            conn.commit()

        return plan
    finally:
        conn.close()

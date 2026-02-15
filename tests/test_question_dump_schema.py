import json
from pathlib import Path

from scripts.export_all_questions import export_all_questions


def _validate_dump_item(obj: dict) -> None:
    required = [
        "topic_id",
        "template_id",
        "seed",
        "question",
        "answer",
        "hints",
        "solution_steps",
        "checks",
    ]
    for k in required:
        assert k in obj, f"missing: {k}"

    assert isinstance(obj["topic_id"], str) and obj["topic_id"]
    assert isinstance(obj["template_id"], str) and obj["template_id"]
    assert isinstance(obj["seed"], int)
    assert isinstance(obj["question"], str) and obj["question"]
    assert isinstance(obj["answer"], str)

    hints = obj["hints"]
    assert isinstance(hints, list) and len(hints) == 3
    assert all(isinstance(h, str) and h.strip() for h in hints)

    steps = obj["solution_steps"]
    assert isinstance(steps, list) and len(steps) >= 1
    for st in steps:
        assert isinstance(st, dict)
        assert isinstance(st.get("step_index"), int) and st["step_index"] >= 1
        assert isinstance(st.get("text"), str)

    checks = obj["checks"]
    assert isinstance(checks, dict)
    assert isinstance(checks.get("answer_ok"), bool)
    assert isinstance(checks.get("hint_ladder_ok"), bool)


def test_question_dump_schema_matches_schema_file(tmp_path):
    # Ensure schema file exists (for external validators/tools).
    schema_path = Path("schemas/question_dump.schema.json")
    assert schema_path.exists()
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    assert schema.get("type") == "object"

    out_jsonl = tmp_path / "dump.jsonl"
    out_md = tmp_path / "dump.md"

    export_all_questions(
        out_jsonl=out_jsonl,
        out_md=out_md,
        per_template=1,
        seed=999,
        limit_templates=3,
    )

    for line in out_jsonl.read_text(encoding="utf-8").splitlines():
        obj = json.loads(line)
        _validate_dump_item(obj)

import json
from pathlib import Path

from scripts.export_all_questions import export_all_questions


def test_export_all_questions_smoke(tmp_path):
    out_jsonl = tmp_path / "dump.jsonl"
    out_md = tmp_path / "dump.md"

    result = export_all_questions(
        out_jsonl=Path(out_jsonl),
        out_md=Path(out_md),
        per_template=1,
        seed=123,
        limit_templates=5,
    )

    assert out_jsonl.exists()
    assert out_md.exists()

    lines = out_jsonl.read_text(encoding="utf-8").splitlines()
    assert len(lines) >= 5
    obj = json.loads(lines[0])
    assert "question" in obj and obj["question"]
    assert "answer" in obj
    assert "hints" in obj and isinstance(obj["hints"], list) and len(obj["hints"]) == 3
    assert "solution_steps" in obj and isinstance(obj["solution_steps"], list) and len(obj["solution_steps"]) >= 1
    assert "checks" in obj

    assert result["total_items"] == 5

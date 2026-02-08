import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


ALLOWED_UNITS = {"fraction", "decimal", "ratio", "life"}
ALLOWED_MISTAKE_TYPES = {"calc", "reading", "concept", "strategy"}


def _load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def _validate_hint_step(step):
    assert isinstance(step, dict)
    assert step.get("level") in (1, 2, 3)
    assert isinstance(step.get("title"), str) and step["title"].strip()
    assert isinstance(step.get("body"), str) and step["body"].strip()


def _validate_common_mistake(m):
    assert isinstance(m, dict)
    assert m.get("type") in ALLOWED_MISTAKE_TYPES
    assert isinstance(m.get("message"), str) and m["message"].strip()
    assert isinstance(m.get("fix"), str) and m["fix"].strip()


def _validate_meta(obj):
    assert isinstance(obj, dict)

    assert isinstance(obj.get("question_id"), str) and obj["question_id"].strip()
    assert obj.get("grade") == 5
    assert obj.get("unit") in ALLOWED_UNITS

    skill_tags = obj.get("skill_tags")
    assert isinstance(skill_tags, list) and len(skill_tags) >= 1
    assert all(isinstance(t, str) and t.strip() for t in skill_tags)

    ladder = obj.get("hint_ladder")
    assert isinstance(ladder, list) and len(ladder) >= 3
    for step in ladder:
        _validate_hint_step(step)

    mistakes = obj.get("common_mistakes")
    assert isinstance(mistakes, list)
    for m in mistakes:
        _validate_common_mistake(m)

    similar = obj.get("similar_question_ids")
    assert isinstance(similar, list)
    assert all(isinstance(q, str) and q.strip() for q in similar)


def test_grade5_sample_meta_validates():
    sample = ROOT / "coaching_meta" / "grade5.sample.json"
    schema = ROOT / "src" / "coaching" / "meta_schema.json"

    assert sample.exists(), "missing coaching_meta/grade5.sample.json"
    assert schema.exists(), "missing src/coaching/meta_schema.json"

    data = _load_json(sample)
    assert isinstance(data, list) and data, "sample meta must be a non-empty list"

    ids = [m.get("question_id") for m in data if isinstance(m, dict)]
    assert len(ids) == len(set(ids)), "question_id must be unique"

    for m in data:
        _validate_meta(m)

    # Sanity: schema is valid JSON and declares an array.
    schema_obj = _load_json(schema)
    assert schema_obj.get("type") == "array"

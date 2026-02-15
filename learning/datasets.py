from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional


DATASETS_DIR = Path("datasets")


@dataclass(frozen=True)
class DatasetBlueprint:
    name: str
    version: str
    skill_weights: Dict[str, float]
    topic_weights: Dict[str, float]
    sample_question_ids: list[str]


def _read_json(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def load_dataset(name: str, *, datasets_dir: Path = DATASETS_DIR) -> DatasetBlueprint:
    base = datasets_dir / name
    manifest_path = base / "manifest.json"
    blueprint_path = base / "blueprint.json"

    if not manifest_path.exists():
        raise FileNotFoundError(f"Missing manifest.json: {manifest_path}")
    if not blueprint_path.exists():
        raise FileNotFoundError(f"Missing blueprint.json: {blueprint_path}")

    manifest = _read_json(manifest_path)
    blueprint = _read_json(blueprint_path)

    version = str(manifest.get("version") or "0")

    skill_weights_raw = blueprint.get("skill_weights") or {}
    if not isinstance(skill_weights_raw, dict):
        raise ValueError("blueprint.skill_weights must be an object")

    topic_weights_raw = blueprint.get("topic_weights") or {}
    if not isinstance(topic_weights_raw, dict):
        raise ValueError("blueprint.topic_weights must be an object")

    def _to_float_map(d: Dict[str, Any]) -> Dict[str, float]:
        out: Dict[str, float] = {}
        for k, v in d.items():
            key = str(k).strip()
            if not key:
                continue
            try:
                fv = float(v)
            except Exception as e:
                raise ValueError(f"weight for {key!r} must be number") from e
            if fv <= 0:
                continue
            out[key] = fv
        return out

    skill_weights = _to_float_map(skill_weights_raw)
    topic_weights = _to_float_map(topic_weights_raw)

    sq = blueprint.get("sample_question_ids") or []
    if not isinstance(sq, list):
        raise ValueError("blueprint.sample_question_ids must be a list")
    sample_question_ids = [str(x) for x in sq if str(x).strip()]

    return DatasetBlueprint(
        name=name,
        version=version,
        skill_weights=skill_weights,
        topic_weights=topic_weights,
        sample_question_ids=sample_question_ids,
    )


def get_skill_weight(blueprint: Optional[DatasetBlueprint], skill_tag: str) -> float:
    if blueprint is None:
        return 1.0
    return float(blueprint.skill_weights.get(skill_tag, 1.0))

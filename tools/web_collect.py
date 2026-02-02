from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

import requests
import yaml
from bs4 import BeautifulSoup


@dataclass(frozen=True)
class SourceSpec:
    url: str
    title_selector: str | None
    content_selector: str | None
    concept_item_selectors: list[str]
    topic_tags: list[str]
    notes: str | None


def _now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def _load_sources(path: Path) -> list[SourceSpec]:
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    sources = data.get("sources") if isinstance(data, dict) else None
    if not isinstance(sources, list) or not sources:
        raise SystemExit(f"No sources found in {path}")

    out: list[SourceSpec] = []
    for i, s in enumerate(sources, start=1):
        if not isinstance(s, dict):
            raise SystemExit(f"Invalid source entry #{i}: expected mapping")
        url = str(s.get("url") or "").strip()
        if not url:
            raise SystemExit(f"Invalid source entry #{i}: missing url")
        title_selector = (str(s.get("title_selector") or "").strip() or None)
        content_selector = (str(s.get("content_selector") or "").strip() or None)
        cis = s.get("concept_item_selectors")
        concept_item_selectors = [str(x).strip() for x in (cis if isinstance(cis, list) else []) if str(x).strip()]
        if not concept_item_selectors:
            concept_item_selectors = ["li"]
        tags = s.get("topic_tags")
        topic_tags = [str(x).strip() for x in (tags if isinstance(tags, list) else []) if str(x).strip()]
        notes = (str(s.get("notes") or "").strip() or None)
        out.append(
            SourceSpec(
                url=url,
                title_selector=title_selector,
                content_selector=content_selector,
                concept_item_selectors=concept_item_selectors,
                topic_tags=topic_tags,
                notes=notes,
            )
        )
    return out


def _extract_text_excerpt(text: str, limit: int = 200) -> str:
    t = " ".join((text or "").split())
    if len(t) <= limit:
        return t
    return t[:limit].rstrip() + "…"


def _fetch_html(url: str, timeout_sec: int = 15) -> str:
    r = requests.get(url, timeout=timeout_sec, headers={"User-Agent": "ai-math-web/collector"})
    r.raise_for_status()
    return r.text


def _collect_one(spec: SourceSpec) -> dict[str, Any]:
    retrieved_at = _now_iso()

    html = _fetch_html(spec.url)
    soup = BeautifulSoup(html, "lxml")

    title = None
    if spec.title_selector:
        el = soup.select_one(spec.title_selector)
        if el:
            title = " ".join(el.get_text(" ", strip=True).split())
    if not title:
        title = " ".join((soup.title.get_text(" ", strip=True) if soup.title else "").split()) or spec.url

    root = soup
    if spec.content_selector:
        c = soup.select_one(spec.content_selector)
        if c:
            root = c

    concept_points: list[str] = []
    for sel in spec.concept_item_selectors:
        for el in root.select(sel):
            txt = " ".join(el.get_text(" ", strip=True).split())
            if not txt:
                continue
            # Guardrail: do not capture long verbatim content.
            if len(txt) > 120:
                txt = _extract_text_excerpt(txt, limit=120)
            if txt not in concept_points:
                concept_points.append(txt)
        if len(concept_points) >= 12:
            break

    # Short excerpt for traceability (<=200 chars)
    excerpt = _extract_text_excerpt(root.get_text(" ", strip=True), limit=200)

    return {
        "source_url": spec.url,
        "title": title,
        "retrieved_at": retrieved_at,
        "excerpt": excerpt,
        "concept_points": concept_points[:12],
        "example_patterns": [],
        "grade": "5",
        "semester": "2",
        "topic_tags": spec.topic_tags,
        "notes": spec.notes,
    }


def _mock_one(spec: SourceSpec) -> dict[str, Any]:
    # Offline-safe sample output.
    return {
        "source_url": spec.url,
        "title": f"(mock) {spec.url}",
        "retrieved_at": _now_iso(),
        "excerpt": "(mock) No internet. Replace sources with real whitelisted URLs.",
        "concept_points": [
            "把概念拆成：定義 → 公式/關係 → 例子。",
            "解題流程：讀題 → 列式 → 計算 → 檢查單位/合理性。",
        ],
        "example_patterns": ["(mock) template-based question generation"],
        "grade": "5",
        "semester": "2",
        "topic_tags": spec.topic_tags,
        "notes": spec.notes,
    }


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--sources", default="tools/sources_g5s.yml")
    p.add_argument("--out", default="data/raw_web_concepts.jsonl")
    p.add_argument("--offline", action="store_true", help="Do not fetch network; write mocked outputs")
    args = p.parse_args(argv)

    sources_path = Path(args.sources)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    specs = _load_sources(sources_path)

    lines: list[str] = []
    for spec in specs:
        try:
            if args.offline:
                row = _mock_one(spec)
            else:
                row = _collect_one(spec)
        except Exception as e:
            # Fail-safe: record a mocked entry with error note.
            row = _mock_one(spec)
            row["notes"] = (row.get("notes") or "") + f" | collector_error={type(e).__name__}: {e}"
        lines.append(json.dumps(row, ensure_ascii=False))

    out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {out_path} ({len(lines)} lines)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

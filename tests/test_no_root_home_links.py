from __future__ import annotations

from pathlib import Path


FORBIDDEN = [
    "https://richardc5168.github.io/ai-math-web/",
    'href="/ai-math-web/"',
    "href='/ai-math-web/'",
]


def iter_html_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for base in [root / "docs", root / "dist_ai_math_web_pages" / "docs"]:
        if not base.exists():
            continue
        files.extend([p for p in base.rglob("*.html") if p.is_file()])
    return sorted(set(files))


def test_no_repo_root_home_links_in_docs_pages():
    root = Path(__file__).resolve().parents[1]
    html_files = iter_html_files(root)
    assert html_files, "No html files found to scan"

    violations: list[str] = []
    for p in html_files:
        text = p.read_text(encoding="utf-8", errors="ignore")
        for needle in FORBIDDEN:
            if needle in text:
                violations.append(f"{p.relative_to(root).as_posix()} contains {needle!r}")
                break

    assert not violations, "Forbidden root-home links found:\n" + "\n".join(violations)

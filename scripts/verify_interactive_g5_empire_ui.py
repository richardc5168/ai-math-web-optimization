"""Verify docs/interactive-g5-empire/index.html stays consistent with the bank.

Goals:
- Catch regressions where clicking an empire region no longer matches the intended kind
- Ensure the 8 region buttons exist and map to 8 expected kinds
- Ensure the game pack options exist (mixed/decimals/fractions/life)

Exit code:
  0 = ok
  1 = failed
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Sequence, Tuple


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_HTML = ROOT / "docs" / "interactive-g5-empire" / "index.html"
DEFAULT_BANK = ROOT / "docs" / "interactive-g5-empire" / "bank.js"

EXPECTED_KINDS = [
    "decimal_mul",
    "decimal_div",
    "fraction_addsub",
    "fraction_mul",
    "percent_of",
    "time_add",
    "unit_convert",
    "volume_rect_prism",
]

EXPECTED_PACKS = ["mixed", "decimals", "fractions", "life"]


@dataclass
class Fail:
    msg: str


def _load_bank_js(path: Path) -> List[Dict[str, Any]]:
    text = path.read_text(encoding="utf-8")
    m = re.search(r"window\.INTERACTIVE_G5_EMPIRE_BANK\s*=\s*(\[.*\])\s*;\s*$", text, re.S)
    if not m:
        raise ValueError("Could not find window.INTERACTIVE_G5_EMPIRE_BANK = [...] ;")
    data = json.loads(m.group(1))
    if not isinstance(data, list):
        raise TypeError("Bank payload is not a list")
    return data


def _extract_regions_block(text: str) -> str | None:
    # Non-greedy capture between REGIONS = [ and ];
    m = re.search(r"\bconst\s+REGIONS\s*=\s*\[(.*?)\]\s*;", text, re.S)
    return m.group(1) if m else None


def _extract_region_defs(block: str) -> List[Tuple[str, List[str]]]:
    # Extract entries like: { id:'decimal_mul', title:'...', kinds:new Set(['decimal_mul']) }
    out: List[Tuple[str, List[str]]] = []
    for m in re.finditer(r"\{\s*id\s*:\s*'([^']+)'[\s\S]*?kinds\s*:\s*new\s+Set\(\[(.*?)\]\)", block):
        rid = m.group(1).strip()
        kinds_raw = m.group(2)
        kinds = re.findall(r"'([^']+)'", kinds_raw)
        out.append((rid, kinds))
    return out


def _has_id(text: str, element_id: str) -> bool:
    return re.search(rf"\bid\s*=\s*\"{re.escape(element_id)}\"", text) is not None


def _has_pack_option(text: str, value: str) -> bool:
    return re.search(rf"<option\s+value=\"{re.escape(value)}\"", text) is not None


def verify_ui(html_path: Path, bank_path: Path, strict: bool) -> List[Fail]:
    fails: List[Fail] = []

    text = html_path.read_text(encoding="utf-8")

    # region buttons should exist in DOM
    for k in EXPECTED_KINDS:
        btn_id = f"region_{k}"
        if not _has_id(text, btn_id):
            fails.append(Fail(f"Missing region button id=\"{btn_id}\" in HTML"))

    # game pack options
    for p in EXPECTED_PACKS:
        if not _has_pack_option(text, p):
            fails.append(Fail(f"Missing pack <option value=\"{p}\"> in HTML"))

    # REGIONS definition should include all 8
    block = _extract_regions_block(text)
    if not block:
        fails.append(Fail("Missing JS const REGIONS = [...] definition"))
        return fails

    region_defs = _extract_region_defs(block)
    if not region_defs:
        fails.append(Fail("Could not parse region defs (id/kinds) from REGIONS block"))
        return fails

    region_ids = [rid for rid, _ in region_defs]
    missing_regions = sorted(set(EXPECTED_KINDS) - set(region_ids))
    extra_regions = sorted(set(region_ids) - set(EXPECTED_KINDS))
    if missing_regions:
        fails.append(Fail(f"REGIONS missing ids: {missing_regions}"))
    if strict and extra_regions:
        fails.append(Fail(f"REGIONS has unexpected ids: {extra_regions}"))

    # each region should map to itself (this module is 1 kind per region)
    for rid, kinds in region_defs:
        if rid in EXPECTED_KINDS and rid not in kinds:
            fails.append(Fail(f"REGIONS id='{rid}' kinds does not include '{rid}' (kinds={kinds})"))

    # cross-check bank kinds
    bank = _load_bank_js(bank_path)
    bank_kinds = sorted({str(q.get("kind") or "") for q in bank})
    missing_bank = sorted(set(EXPECTED_KINDS) - set(bank_kinds))
    extra_bank = sorted(set(bank_kinds) - set(EXPECTED_KINDS))
    if missing_bank:
        fails.append(Fail(f"Bank missing kinds: {missing_bank}"))
    if strict and extra_bank:
        fails.append(Fail(f"Bank has unexpected kinds: {extra_bank}"))

    return fails


def main(argv: Sequence[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Verify interactive-g5-empire UI mapping")
    p.add_argument("--html", type=str, default=str(DEFAULT_HTML), help="Path to index.html")
    p.add_argument("--bank", type=str, default=str(DEFAULT_BANK), help="Path to bank.js")
    p.add_argument("--strict", action="store_true", help="Fail on unexpected regions/kinds")
    args = p.parse_args(list(argv) if argv is not None else None)

    html_path = Path(args.html)
    bank_path = Path(args.bank)

    if not html_path.exists():
        print(f"Missing HTML: {html_path}")
        return 1
    if not bank_path.exists():
        print(f"Missing bank: {bank_path}")
        return 1

    fails = verify_ui(html_path, bank_path, strict=bool(args.strict))
    if fails:
        for f in fails:
            print(f"FAIL: {f.msg}")
        return 1

    print(f"OK: {html_path} (regions=8 packs=4) ↔ {bank_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

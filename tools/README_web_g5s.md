# Web concepts (G5 Semester 2) — Safe pipeline

Goal: collect *concept points* from a **whitelist** of sources and convert them into a deterministic, fully-validated offline pack.

## Safety rules (commercial-friendly)
- Whitelist only: sources live in `tools/sources_g5s.yml`.
- Collector stores **URL + title + short excerpt (<=200 chars)** for traceability.
- DO NOT copy full question text or full solution text from websites.
- Pack questions are **template-generated** (parametric) and **computable**.

## Step A — Collect (whitelist)
- Offline mock mode (safe default):
  - `python tools/web_collect.py --offline`
- Online mode (when you have real whitelisted URLs):
  - `python tools/web_collect.py`

Output:
- `data/raw_web_concepts.jsonl`

## Step B — Build pack
- Build 30 items MVP:
  - `python tools/build_web_pack.py --n 30 --seed 5202`

Output:
- `data/web_g5s_pack.json`

## Step C — Validate (fail fast)
- `python tools/validate_web_pack.py --pack data/web_g5s_pack.json`

## Integrate into backend
- New `type_key`: `g5s_web_concepts_v1`
- API: call `/v1/questions/next?topic_key=g5s_web_concepts_v1`

## Add new sources
Edit `tools/sources_g5s.yml` and only add sources you are allowed to summarize.

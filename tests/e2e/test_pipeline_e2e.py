"""
tests/e2e/test_pipeline_e2e.py — End-to-end pipeline test.

Runs the full verification pipeline on smoke data and validates:
- Report artifact is generated
- Topic coverage meets minimum threshold
- All problems in smoke batch pass
- Report conforms to pipeline_scorecard schema structure
"""
import json
import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
SMOKE_DATA = REPO_ROOT / "data" / "smoke" / "problems.sample.jsonl"
REPORT_PATH = REPO_ROOT / "artifacts" / "e2e_report.json"


class TestPipelineE2E:

    def test_verify_cli_runs(self):
        """Run pipeline.verify as CLI and check exit code."""
        result = subprocess.run(
            [
                sys.executable, "-m", "pipeline.verify",
                "--dataset", str(SMOKE_DATA),
                "--report", str(REPORT_PATH),
            ],
            capture_output=True,
            text=True,
            cwd=str(REPO_ROOT),
        )
        assert result.returncode == 0, f"verify failed:\n{result.stderr}\n{result.stdout}"

    def test_report_artifact_exists(self):
        """After running verify, report artifact must exist."""
        if not REPORT_PATH.exists():
            # Run verify first
            subprocess.run(
                [
                    sys.executable, "-m", "pipeline.verify",
                    "--dataset", str(SMOKE_DATA),
                    "--report", str(REPORT_PATH),
                ],
                capture_output=True,
                text=True,
                cwd=str(REPO_ROOT),
            )
        assert REPORT_PATH.exists(), f"Report not found: {REPORT_PATH}"

    def test_report_structure(self):
        """Report JSON must have required keys."""
        if not REPORT_PATH.exists():
            subprocess.run(
                [
                    sys.executable, "-m", "pipeline.verify",
                    "--dataset", str(SMOKE_DATA),
                    "--report", str(REPORT_PATH),
                ],
                capture_output=True,
                text=True,
                cwd=str(REPO_ROOT),
            )
        report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
        required_keys = ["total", "passed", "failed_count", "pass_rate", "topic_coverage", "results", "failures"]
        for k in required_keys:
            assert k in report, f"Report missing key: {k}"

    def test_all_smoke_pass(self):
        """All smoke problems must pass."""
        if not REPORT_PATH.exists():
            subprocess.run(
                [
                    sys.executable, "-m", "pipeline.verify",
                    "--dataset", str(SMOKE_DATA),
                    "--report", str(REPORT_PATH),
                ],
                capture_output=True,
                text=True,
                cwd=str(REPO_ROOT),
            )
        report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
        assert report["pass_rate"] == 1.0
        assert report["failed_count"] == 0

    def test_topic_coverage_minimum(self):
        """At least 5 distinct topic codes covered in smoke batch."""
        if not REPORT_PATH.exists():
            subprocess.run(
                [
                    sys.executable, "-m", "pipeline.verify",
                    "--dataset", str(SMOKE_DATA),
                    "--report", str(REPORT_PATH),
                ],
                capture_output=True,
                text=True,
                cwd=str(REPO_ROOT),
            )
        report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
        cov = report.get("topic_coverage", {})
        assert len(cov) >= 5, f"Only {len(cov)} topics covered, need >= 5"

    def test_each_result_has_score(self):
        """Each problem result must have a score 0-100."""
        if not REPORT_PATH.exists():
            subprocess.run(
                [
                    sys.executable, "-m", "pipeline.verify",
                    "--dataset", str(SMOKE_DATA),
                    "--report", str(REPORT_PATH),
                ],
                capture_output=True,
                text=True,
                cwd=str(REPO_ROOT),
            )
        report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
        for r in report["results"]:
            assert 0 <= r["score"] <= 100, f"Score out of range: {r['score']}"

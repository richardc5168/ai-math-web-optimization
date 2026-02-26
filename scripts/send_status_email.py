#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import smtplib
import ssl
import subprocess
from email.message import EmailMessage
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LATEST = ROOT / "artifacts" / "hourly_command_latest.json"
RUNS = ROOT / "artifacts" / "hourly_command_runs.jsonl"


def git_user_email() -> str:
    try:
        out = subprocess.check_output(
            ["git", "config", "user.email"],
            cwd=str(ROOT),
            text=True,
        ).strip()
        return out
    except Exception:
        return ""


def git_recent_commits(n: int = 5) -> list[str]:
    try:
        out = subprocess.check_output(
            ["git", "-c", "core.pager=cat", "log", "--oneline", f"-{n}"],
            cwd=str(ROOT),
            text=True,
        )
        return [line.strip() for line in out.splitlines() if line.strip()]
    except Exception:
        return []


def load_latest() -> dict:
    if not LATEST.exists():
        return {"status": "missing", "message": "hourly_command_latest.json not found"}
    try:
        return json.loads(LATEST.read_text(encoding="utf-8"))
    except Exception as exc:
        return {"status": "error", "message": f"latest json parse failed: {exc}"}


def load_run_tail(n: int = 3) -> list[str]:
    if not RUNS.exists():
        return ["(hourly_command_runs.jsonl not found)"]
    lines = RUNS.read_text(encoding="utf-8", errors="ignore").splitlines()
    return lines[-n:] if lines else ["(no run logs yet)"]


def build_body(latest: dict, commits: list[str], run_tail: list[str]) -> str:
    body = []
    body.append("RAGWEB 自動優化（30 分鐘輪詢）摘要")
    body.append("")
    body.append("【最新狀態】")
    for key in ["kind", "id", "checked_at", "started_at", "ended_at", "pass", "status", "value", "note"]:
        if key in latest:
            body.append(f"- {key}: {latest.get(key)}")
    body.append("")
    body.append("【最近提交】")
    if commits:
        for c in commits:
            body.append(f"- {c}")
    else:
        body.append("- (no commit info)")
    body.append("")
    body.append("【最近執行紀錄（tail）】")
    for line in run_tail:
        body.append(f"- {line[:240]}")
    body.append("")
    body.append("檢視檔案：")
    body.append("- artifacts/hourly_command_latest.json")
    body.append("- artifacts/hourly_command_runs.jsonl")
    return "\n".join(body)


def require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise ValueError(f"missing env: {name}")
    return value


def main() -> int:
    try:
        smtp_host = os.getenv("RAGWEB_SMTP_HOST", os.getenv("SMTP_HOST", "smtp.gmail.com")).strip()
        smtp_port = int(os.getenv("RAGWEB_SMTP_PORT", os.getenv("SMTP_PORT", "465")).strip())
        smtp_user = os.getenv("RAGWEB_SMTP_USER", os.getenv("SMTP_USER", "")).strip()
        smtp_pass = os.getenv("RAGWEB_SMTP_PASS", os.getenv("SMTP_PASS", "")).strip()

        if not smtp_user or not smtp_pass:
            print("MAIL_SKIPPED: missing SMTP credentials (RAGWEB_SMTP_USER/RAGWEB_SMTP_PASS or SMTP_USER/SMTP_PASS)")
            latest = load_latest()
            print(f"LATEST_STATUS: kind={latest.get('kind')} id={latest.get('id')} pass={latest.get('pass')} checked_at={latest.get('checked_at')}")
            return 0

        default_email = git_user_email()
        mail_to = os.getenv("RAGWEB_MAIL_TO", os.getenv("MAIL_TO", default_email)).strip()
        if not mail_to:
            raise ValueError("missing env: RAGWEB_MAIL_TO (and git user.email empty)")

        mail_from = os.getenv("RAGWEB_MAIL_FROM", os.getenv("MAIL_FROM", smtp_user)).strip()
        subject = os.getenv("RAGWEB_MAIL_SUBJECT", "[RAGWEB] 30分鐘自動優化摘要").strip()

        latest = load_latest()
        commits = git_recent_commits(5)
        run_tail = load_run_tail(3)
        body = build_body(latest, commits, run_tail)

        msg = EmailMessage()
        msg["From"] = mail_from
        msg["To"] = mail_to
        msg["Subject"] = subject
        msg.set_content(body)

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context, timeout=30) as server:
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)

        print(f"MAIL_SENT: to={mail_to} via {smtp_host}:{smtp_port}")
        github_summary = os.getenv("GITHUB_STEP_SUMMARY", "").strip()
        if github_summary:
            summary_lines = [
                "## 30-min Mail Status",
                "",
                f"- Result: MAIL_SENT",
                f"- To: {mail_to}",
                f"- Latest kind: {latest.get('kind')}",
                f"- Latest id: {latest.get('id')}",
                f"- Latest pass: {latest.get('pass')}",
            ]
            Path(github_summary).write_text("\n".join(summary_lines) + "\n", encoding="utf-8")
        return 0
    except Exception as exc:
        print(f"MAIL_SEND_FAILED: {exc}")
        github_summary = os.getenv("GITHUB_STEP_SUMMARY", "").strip()
        if github_summary:
            summary_lines = [
                "## 30-min Mail Status",
                "",
                f"- Result: MAIL_FAILED",
                f"- Error: {exc}",
            ]
            Path(github_summary).write_text("\n".join(summary_lines) + "\n", encoding="utf-8")
        print("Required env: RAGWEB_SMTP_USER, RAGWEB_SMTP_PASS (or SMTP_USER/SMTP_PASS), optional RAGWEB_MAIL_TO")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())

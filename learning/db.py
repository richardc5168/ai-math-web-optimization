from __future__ import annotations

import os
import sqlite3
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional, Iterable


DEFAULT_DB_PATH = "app.db"
DEFAULT_MIGRATIONS_DIR = Path("db") / "migrations"


@dataclass(frozen=True)
class DbConfig:
    db_path: Path
    migrations_dir: Path = DEFAULT_MIGRATIONS_DIR


def now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def get_db_config(db_path: Optional[str | Path] = None) -> DbConfig:
    if db_path is None:
        db_path = os.environ.get("DB_PATH", DEFAULT_DB_PATH)
    return DbConfig(db_path=Path(db_path))


def connect(db_path: Optional[str | Path] = None) -> sqlite3.Connection:
    cfg = get_db_config(db_path)
    conn = sqlite3.connect(str(cfg.db_path))
    conn.row_factory = sqlite3.Row
    return conn


def _ensure_migrations_table(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            name TEXT PRIMARY KEY,
            applied_at TEXT NOT NULL
        )
        """
    )


def _iter_migration_files(migrations_dir: Path) -> Iterable[Path]:
    if not migrations_dir.exists():
        return []
    return sorted([p for p in migrations_dir.glob("*.sql") if p.is_file()])


def apply_migrations(conn: sqlite3.Connection, *, migrations_dir: Optional[Path] = None) -> None:
    cfg = get_db_config()
    migrations_dir = migrations_dir or cfg.migrations_dir

    _ensure_migrations_table(conn)

    applied = {
        str(r[0])
        for r in conn.execute("SELECT name FROM schema_migrations").fetchall()
    }

    for path in _iter_migration_files(migrations_dir):
        name = path.name
        if name in applied:
            continue
        sql = path.read_text(encoding="utf-8")
        conn.executescript(sql)
        conn.execute(
            "INSERT INTO schema_migrations(name, applied_at) VALUES (?,?)",
            (name, now_iso()),
        )
        conn.commit()


def ensure_learning_schema(conn: sqlite3.Connection) -> None:
    """Ensure learning-analytics tables exist (idempotent).

    This does NOT replace server.py's init_db(); it coexists safely.
    """
    apply_migrations(conn)

#!/usr/bin/env python3
from __future__ import annotations

import argparse

from learning.db import connect, ensure_learning_schema


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default=None, help="DB path (default: env DB_PATH or app.db)")
    args = ap.parse_args()

    conn = connect(args.db)
    try:
        ensure_learning_schema(conn)
        print("OK: learning schema migrated")
        return 0
    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())

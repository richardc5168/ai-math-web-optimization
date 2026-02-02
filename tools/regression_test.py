from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def main() -> int:
    repo = Path(__file__).resolve().parents[1]

    cmds = [
        [sys.executable, str(repo / "tools" / "validate_web_pack.py"), "--pack", str(repo / "data" / "web_g5s_pack.json")],
        [sys.executable, "-m", "pytest", "-q"],
    ]

    for c in cmds:
        print("\n$", " ".join(c))
        r = subprocess.run(c, cwd=str(repo))
        if r.returncode != 0:
            return int(r.returncode)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

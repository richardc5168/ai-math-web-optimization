import sys
from pathlib import Path


# Ensure the repository root is importable during pytest collection.
_REPO_ROOT = Path(__file__).resolve().parent
_repo_root_str = str(_REPO_ROOT)
if _repo_root_str not in sys.path:
    sys.path.insert(0, _repo_root_str)

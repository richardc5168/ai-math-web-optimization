import os
import shutil
import zipfile
from datetime import datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DIST_DOCS = os.path.join(ROOT, "dist_ai_math_web_pages", "docs")
OUT_DIR = os.path.join(ROOT, "offline_bundle")


def ensure_clean_dir(path: str):
    if os.path.exists(path):
        shutil.rmtree(path)
    os.makedirs(path, exist_ok=True)


def copy_docs():
    if not os.path.isdir(DIST_DOCS):
        raise FileNotFoundError(f"Missing dist docs at {DIST_DOCS}")
    shutil.copytree(DIST_DOCS, OUT_DIR, dirs_exist_ok=True)


def zip_bundle():
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    zip_path = os.path.join(ROOT, f"offline_bundle_{stamp}.zip")
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(OUT_DIR):
            for f in files:
                abs_path = os.path.join(root, f)
                rel_path = os.path.relpath(abs_path, OUT_DIR)
                zf.write(abs_path, rel_path)
    return zip_path


def main():
    ensure_clean_dir(OUT_DIR)
    copy_docs()
    zip_path = zip_bundle()
    print(f"Offline bundle ready: {zip_path}")


if __name__ == "__main__":
    main()

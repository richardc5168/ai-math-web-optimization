"""Inject breadcrumb navigation bar into all module pages under docs/."""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
DIST = ROOT / "dist_ai_math_web_pages" / "docs"

# Map directory name → display title
TITLES = {
    "about": "關於我們",
    "agent-status": "Agent 狀態",
    "coach": "教練模式",
    "commercial-pack1-fraction-sprint": "分數衝刺包",
    "decimal-unit4": "小數四則",
    "exam-sprint": "考前衝刺",
    "fraction-g5": "分數練習",
    "fraction-word-g5": "分數應用題",
    "g5-grand-slam": "大滿貫",
    "interactive-decimal-g5": "小數帝國闖關",
    "interactive-g56-core-foundation": "核心基礎",
    "interactive-g5-empire": "數學帝國",
    "interactive-g5-life-pack1-empire": "生活數學帝國 I",
    "interactive-g5-life-pack1plus-empire": "生活數學帝國 I+",
    "interactive-g5-life-pack2-empire": "生活數學帝國 II",
    "interactive-g5-life-pack2plus-empire": "生活數學帝國 II+",
    "interactive-g5-midterm1": "期中複習",
    "interactive-g5-national-bank": "全國精選題庫",
    "learning-map": "學習地圖",
    "life-applications-g5": "生活應用",
    "linear": "一次方程式",
    "mixed-multiply": "混合運算",
    "offline-math": "離線數學",
    "offline-math-v2": "離線數學 v2",
    "parent-report": "家長報告",
    "pricing": "方案與價格",
    "privacy": "隱私權政策",
    "qa": "問答專區",
    "quadratic": "二次方程式",
    "ratio-percent-g5": "比率與百分率",
    "report": "學習報告",
    "terms": "服務條款",
    "volume-g5": "體積練習",
}

BREADCRUMB_MARKER = "breadcrumb-bar"

NAV_CLOSE = "</nav>"

def build_breadcrumb(dirname):
    title = TITLES.get(dirname, dirname)
    return (
        f'<div id="{BREADCRUMB_MARKER}" style="padding:6px 16px;font-size:.82rem;'
        f'color:#8b949e;background:#0b1020;border-bottom:1px solid #21262d">'
        f'<a href="../" style="color:#58a6ff;text-decoration:none">首頁</a>'
        f' <span style="margin:0 4px;color:#484f58">›</span> '
        f'<span style="color:#e6edf3">{title}</span></div>'
    )

def inject(filepath, dirname):
    text = filepath.read_text(encoding="utf-8")
    if BREADCRUMB_MARKER in text:
        return False  # already has breadcrumb
    idx = text.find(NAV_CLOSE)
    if idx == -1:
        return False  # no nav found
    insert_pos = idx + len(NAV_CLOSE)
    bc = "\n" + build_breadcrumb(dirname) + "\n"
    new_text = text[:insert_pos] + bc + text[insert_pos:]
    filepath.write_text(new_text, encoding="utf-8")
    return True

def main():
    count = 0
    for d in sorted(DOCS.iterdir()):
        if not d.is_dir():
            continue
        idx = d / "index.html"
        if not idx.exists():
            continue
        dirname = d.name
        if dirname in ("icons", "shared", "improvement", "report"):
            continue  # skip non-module dirs
        if inject(idx, dirname):
            print(f"INJECTED: docs/{dirname}/index.html")
            count += 1
        else:
            print(f"SKIP:     docs/{dirname}/index.html")
        # Also inject into dist
        dist_idx = DIST / dirname / "index.html"
        if dist_idx.exists():
            inject(dist_idx, dirname)
    print(f"\nDone: {count} pages updated")

if __name__ == "__main__":
    main()

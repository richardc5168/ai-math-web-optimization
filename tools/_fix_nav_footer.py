"""One-time script to update nav (家長報告→家長週報) and add footer to all module pages."""
import os, sys

BASE = os.path.join(os.path.dirname(__file__), '..', 'docs')
MODULES = [
    'fraction-g5','g5-grand-slam','interactive-g5-midterm1','interactive-g5-national-bank',
    'interactive-g56-core-foundation','ratio-percent-g5','volume-g5','fraction-word-g5',
    'decimal-unit4','interactive-decimal-g5','interactive-g5-empire',
    'interactive-g5-life-pack1-empire','interactive-g5-life-pack1plus-empire',
    'interactive-g5-life-pack2-empire','interactive-g5-life-pack2plus-empire',
    'life-applications-g5','offline-math','commercial-pack1-fraction-sprint',
    'learning-map','offline-math-v2','mixed-multiply','parent-report',
]

FOOTER = '''<footer style="border-top:1px solid #30363d;padding:24px 16px;text-align:center;margin-top:32px">
  <div style="display:flex;justify-content:center;gap:16px;flex-wrap:wrap;margin-bottom:10px;font-size:.85rem">
    <a href="../" style="color:#8b949e;text-decoration:none">首頁</a>
    <a href="../pricing/" style="color:#8b949e;text-decoration:none">方案與價格</a>
    <a href="../about/" style="color:#8b949e;text-decoration:none">關於我們</a>
    <a href="../privacy/" style="color:#8b949e;text-decoration:none">隱私權政策</a>
    <a href="../terms/" style="color:#8b949e;text-decoration:none">服務條款</a>
    <a href="mailto:learnotaiwan@gmail.com" style="color:#8b949e;text-decoration:none">✉️ 聯繫我們</a>
  </div>
  <div style="color:#484f58;font-size:.78rem">&copy; 2025-2026 AI 數學家教. All rights reserved.</div>
</footer>'''

OLD_NAV = '<a href="../parent-report/" style="color:#c9d1d9;text-decoration:none">家長報告</a>'
NEW_NAV = '<a href="../#reports" style="color:#c9d1d9;text-decoration:none">家長週報</a>'

nav_count = 0
footer_count = 0

for m in MODULES:
    fpath = os.path.join(BASE, m, 'index.html')
    if not os.path.exists(fpath):
        print(f"SKIP {m}")
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    changed = False

    # Fix nav
    if OLD_NAV in content:
        content = content.replace(OLD_NAV, NEW_NAV)
        nav_count += 1
        changed = True

    # Add footer before </body> if not present
    if '聯繫我們' not in content:
        content = content.replace('</body>', FOOTER + '\n</body>')
        footer_count += 1
        changed = True

    if changed:
        with open(fpath, 'w', encoding='utf-8', newline='\n') as f:
            f.write(content)
        print(f"OK {m}")
    else:
        print(f"ALREADY {m}")

print(f"\nNav updated: {nav_count}, Footer added: {footer_count}")

"""One-time script: sync changed docs/ HTML → dist_ai_math_web_pages/docs/"""
import shutil, os

BASE = os.path.dirname(os.path.dirname(__file__))
SRC = os.path.join(BASE, 'docs')
DST = os.path.join(BASE, 'dist_ai_math_web_pages', 'docs')

TARGETS = [
    'pricing/index.html', 'about/index.html', 'terms/index.html', 'privacy/index.html',
    'exam-sprint/index.html',
    'fraction-g5/index.html','g5-grand-slam/index.html','interactive-g5-midterm1/index.html',
    'interactive-g5-national-bank/index.html','interactive-g56-core-foundation/index.html',
    'ratio-percent-g5/index.html','volume-g5/index.html','fraction-word-g5/index.html',
    'decimal-unit4/index.html','interactive-decimal-g5/index.html','interactive-g5-empire/index.html',
    'interactive-g5-life-pack1-empire/index.html','interactive-g5-life-pack1plus-empire/index.html',
    'interactive-g5-life-pack2-empire/index.html','interactive-g5-life-pack2plus-empire/index.html',
    'life-applications-g5/index.html','offline-math/index.html',
    'commercial-pack1-fraction-sprint/index.html','learning-map/index.html',
    'offline-math-v2/index.html','mixed-multiply/index.html','parent-report/index.html',
]

count = 0
for t in TARGETS:
    src = os.path.join(SRC, t)
    dst = os.path.join(DST, t)
    if os.path.exists(src):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        count += 1
        print(f"OK {t}")
    else:
        print(f"SKIP {t}")
print(f"\nSynced {count} files")

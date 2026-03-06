"""One-time script: inject upgrade_banner.js into non-empire/non-commercial modules."""
import os, re

BASE = os.path.join(os.path.dirname(__file__), '..', 'docs')

# Modules that already have daily_limit.js or unlock code — skip these
SKIP = {
    'interactive-g5-empire', 'interactive-g5-life-pack1-empire',
    'interactive-g5-life-pack1plus-empire', 'interactive-g5-life-pack2-empire',
    'interactive-g5-life-pack2plus-empire', 'interactive-decimal-g5',
    'commercial-pack1-fraction-sprint',
    'learning-map',  # no quiz
    'parent-report',  # not a quiz module
}

MODULES = [
    'fraction-g5', 'g5-grand-slam', 'interactive-g5-midterm1',
    'interactive-g5-national-bank', 'interactive-g56-core-foundation',
    'ratio-percent-g5', 'volume-g5', 'fraction-word-g5',
    'decimal-unit4', 'life-applications-g5',
    'offline-math', 'offline-math-v2', 'mixed-multiply',
    'exam-sprint',
]

SCRIPT_TAG = '<script src="../shared/upgrade_banner.js"></script>'
TRACK_CALL = "if(window.AIMathUpgradeBanner){window.AIMathUpgradeBanner.track();}"

count = 0
for m in MODULES:
    if m in SKIP:
        continue
    fpath = os.path.join(BASE, m, 'index.html')
    if not os.path.exists(fpath):
        print(f"SKIP {m} (not found)")
        continue

    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'upgrade_banner' in content:
        print(f"ALREADY {m}")
        continue

    changed = False

    # 1. Add script tag before student_auth.js or hint_engine.js
    for anchor in ['<script src="../shared/student_auth.js">', '<script src="../shared/hint_engine.js">']:
        if anchor in content:
            content = content.replace(anchor, SCRIPT_TAG + '\n  ' + anchor)
            changed = True
            break
    else:
        # Fallback: add before first </script> + <script> boundary
        if '</head>' in content:
            content = content.replace('</head>', '  ' + SCRIPT_TAG + '\n</head>')
            changed = True

    # 2. Add track() call inside the check/submit function
    # Look for patterns like "correct++" or "score++" or "correctCount++"
    # and add the track call after it
    for pattern in ['state.correct ++', 'state.correct++', 'correct++', 'score++',
                    'g.correct++', 'g.correct ++', 'totalCorrect++']:
        if pattern in content and TRACK_CALL not in content:
            # Add AFTER the first occurrence (where answer is checked)
            idx = content.index(pattern) + len(pattern)
            # Find end of line
            nl = content.index('\n', idx)
            content = content[:nl] + '\n      ' + TRACK_CALL + content[nl:]
            changed = True
            break

    if changed:
        with open(fpath, 'w', encoding='utf-8', newline='\n') as f:
            f.write(content)
        count += 1
        print(f"OK {m}")
    else:
        print(f"NOCHANGE {m}")

print(f"\nInjected upgrade banner into {count} modules")

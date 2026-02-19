"""Quick preview of generated L3 hints for quality check."""
import sys, os
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, "tools")
from optimize_l3_hints import parse_bank, generate_l3

samples = [
    ("fraction-g5", 0),
    ("fraction-g5", 10),
    ("volume-g5", 2),
    ("volume-g5", 30),
    ("life-applications-g5", 50),
    ("life-applications-g5", 160),
    ("interactive-g5-empire", 0),
    ("interactive-g5-empire", 50),
    ("exam-sprint", 0),
    ("exam-sprint", 500),
    ("offline-math", 0),
    ("interactive-g56-core-foundation", 0),
]

for mod, idx in samples:
    qs = parse_bank(mod)
    if idx >= len(qs):
        idx = len(qs) - 1
    q = qs[idx]
    l3 = generate_l3(q, mod)
    qid = q.get("id", "?")
    kind = q.get("kind", "?")
    stem = q.get("question", q.get("stem", ""))[:80]
    ans = q.get("answer", "?")
    steps = q.get("steps", [])

    print(f"=== {mod} | {qid} | kind={kind} ===")
    print(f"  Q: {stem}")
    print(f"  A: {ans}")
    print(f"  Steps: {steps}")
    print(f"  NEW L3:")
    for line in l3.split("\n"):
        print(f"    {line}")
    print()

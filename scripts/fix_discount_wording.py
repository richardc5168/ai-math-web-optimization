"""
Bulk-replace "打 折扣 0.XX" → "打 XX 折" across all bank.js files.
Also fixes related hint/step text that references "折扣 0.XX".

Mapping: 0.95 → 95折, 0.85 → 85折, etc.
"""
import re, pathlib

REPO = pathlib.Path(r"C:\Users\Richard\Documents\RAGWEB")

# Only touch docs/ bank.js files (dist will be mirrored separately)
BANK_FILES = sorted(REPO.glob("docs/**/bank.js"))

def disc_to_zhe(m):
    """Convert '0.XX' decimal string to 'XX' integer for 折 notation."""
    val = m.group(1)  # e.g. "0.95"
    zhe = str(round(float(val) * 100))  # "95"
    return zhe

REPLACEMENTS = [
    # 1) question text: "打 折扣 0.XX" → "打 XX 折"
    (r'打 折扣 (0\.\d{2})', lambda m: f'打 {round(float(m.group(1))*100)} 折'),
    # 2) hint: "折扣 0.XX 對應倍率約是 0.XX。" → "XX 折就是原價 × 0.XX。"
    (r'折扣 (0\.\d{2}) 對應倍率約是 (0\.\d{2})。',
     lambda m: f'{round(float(m.group(1))*100)} 折就是原價 × {m.group(2)}。'),
    # 3) hint/step: "把『折扣 0.XX』換成小數倍率：0.XX" → "XX 折 → 原價 × 0.XX"
    (r"把『折扣 (0\.\d{2})』換成小數倍率：(0\.\d{2})",
     lambda m: f'{round(float(m.group(1))*100)} 折 → 原價 × {m.group(2)}'),
]

total_changes = 0
for bank in BANK_FILES:
    text = bank.read_text(encoding="utf-8")
    original = text
    file_changes = 0
    for pattern, repl in REPLACEMENTS:
        text, n = re.subn(pattern, repl, text)
        file_changes += n
    if file_changes:
        bank.write_text(text, encoding="utf-8")
        print(f"  {bank.relative_to(REPO)}: {file_changes} replacements")
        total_changes += file_changes
    else:
        print(f"  {bank.relative_to(REPO)}: no changes")

print(f"\nTotal: {total_changes} replacements across {len(BANK_FILES)} files")

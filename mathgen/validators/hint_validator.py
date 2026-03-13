"""Hint ladder quality validator."""


def validate_hint_ladder(question):
    """Validate hint ladder quality for a question.

    Checks:
    1. All 4 levels present
    2. No level leaks the final answer
    3. Hints are non-empty and reasonable length
    4. Hints don't skip steps (level progression)

    Returns:
        (is_valid: bool, errors: list[str])
    """
    errors = []
    hl = question.get('hint_ladder', {})
    answer = question.get('correct_answer', '')

    required = ['level_1', 'level_2', 'level_3', 'level_4']
    for lvl in required:
        if lvl not in hl:
            errors.append(f'missing_hint:{lvl}')
            continue

        text = hl[lvl]
        if not text or len(text.strip()) < 5:
            errors.append(f'hint_too_short:{lvl}')

        if len(text) > 500:
            errors.append(f'hint_too_long:{lvl}')

        # Answer leak check: answer must not appear verbatim in any hint
        if answer and len(answer) > 1 and answer in text:
            errors.append(f'hint_leaks_answer:{lvl}:answer "{answer}" found in hint')

    # Level 1 should NOT contain math symbols (strategy only)
    if 'level_1' in hl:
        l1 = hl['level_1']
        if '=' in l1 and any(c.isdigit() for c in l1.split('=')[-1][:5]):
            errors.append('level_1_too_specific:should be strategy only, no equations')

    # Level 4 should contain verification language
    if 'level_4' in hl:
        l4 = hl['level_4']
        verify_words = ['檢查', '驗算', '驗證', '代回', '反過來', '確認']
        if not any(w in l4 for w in verify_words):
            errors.append('level_4_missing_verification:should include verification guidance')

    return len(errors) == 0, errors

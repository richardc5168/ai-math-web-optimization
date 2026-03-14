"""Wording consistency validator — checks problem text matches parameters.

Catches mismatches between what the problem text says and what the
parameters actually specify (e.g., text says "3 exams" but there are 4
values).
"""
from __future__ import annotations

import re
from typing import List, Tuple

# Chinese numeral mapping for count extraction
_CN_NUMS = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '兩': 2,
}


def _extract_count_from_text(text: str) -> int | None:
    """Try to extract a count mentioned in problem text.

    Looks for patterns like "3 次", "三次", "{n} 場", etc.
    Returns the count as int, or None if not found.
    """
    # Pattern: digit + 次/場/天/個
    m = re.search(r'(\d+)\s*[次場天個]', text)
    if m:
        return int(m.group(1))

    # Pattern: Chinese numeral + 次/場/天/個
    for cn, num in _CN_NUMS.items():
        if re.search(cn + r'[次場天個]', text):
            return num

    return None


def _count_listed_values(text: str) -> int | None:
    """Count how many values are listed in the problem text.

    Looks for patterns like "85、92、78" or "85, 92, 78".
    """
    # Find sequences of numbers separated by 、 or ,
    # Match number sequences (int or decimal)
    m = re.search(r'(\d+(?:\.\d+)?(?:[、,]\s*\d+(?:\.\d+)?)+)', text)
    if m:
        vals = re.split(r'[、,]\s*', m.group(1))
        return len(vals)
    return None


def validate_wording_consistency(question: dict) -> Tuple[bool, List[str]]:
    """Validate that problem text is consistent with parameters.

    Returns (is_valid, error_list).
    """
    errors = []
    topic = question.get('topic', '')
    text = question.get('problem_text', '')
    params = question.get('parameters', {})

    if topic == 'average_word_problem':
        values = params.get('values', [])
        n = len(values)

        # Check: count mentioned in text matches actual value count
        text_count = _extract_count_from_text(text)
        if text_count is not None and text_count != n:
            errors.append(
                f'wording_count_mismatch:text_says={text_count},'
                f'actual={n}'
            )

        # Check: number of listed values matches parameter count
        listed_count = _count_listed_values(text)
        if listed_count is not None and listed_count != n:
            errors.append(
                f'wording_listed_count_mismatch:listed={listed_count},'
                f'actual={n}'
            )

    elif topic == 'unit_conversion':
        value_str = params.get('value', '')
        # Check: value mentioned in problem text
        if value_str and value_str not in text:
            errors.append(
                f'wording_value_missing:value={value_str}_not_in_text'
            )

    elif topic == 'fraction_word_problem':
        a_num = params.get('a_num', 0)
        a_den = params.get('a_den', 1)
        b_num = params.get('b_num', 0)
        b_den = params.get('b_den', 1)
        # Fractions in text should match simplified params
        from mathgen.question_templates.base import BaseGenerator
        a_str = BaseGenerator.frac_str(a_num, a_den)
        b_str = BaseGenerator.frac_str(b_num, b_den)
        if a_str not in text and f'{a_num}/{a_den}' not in text:
            errors.append(f'wording_fraction_a_missing:{a_str}')
        if b_str not in text and f'{b_num}/{b_den}' not in text:
            errors.append(f'wording_fraction_b_missing:{b_str}')

    elif topic == 'decimal_word_problem':
        a_str = params.get('a', '')
        b_str = params.get('b', '')
        if a_str and a_str not in text:
            errors.append(f'wording_decimal_a_missing:{a_str}')
        if b_str and b_str not in text:
            errors.append(f'wording_decimal_b_missing:{b_str}')

    return len(errors) == 0, errors

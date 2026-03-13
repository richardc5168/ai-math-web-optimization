"""Error taxonomy — known error categories for classification."""

KNOWN_ERROR_CODES = {
    'wrong_numeric_answer',
    'wrong_unit',
    'missing_intermediate_step',
    'hint_too_big_jump',
    'hint_leaks_answer',
    'report_missing_fields',
    'grade_level_too_hard',
    'wording_ambiguity',
    'schema_violation',
    'empty_answer',
    'fraction_not_simplified',
    'decimal_precision_error',
    'step_order_wrong',
}


def classify_error(error_str):
    """Classify a raw error string into a known category.

    Returns:
        str: one of KNOWN_ERROR_CODES, or 'unknown'
    """
    s = error_str.lower()

    if 'missing_field' in s or 'schema' in s:
        return 'schema_violation'
    if 'hint_leaks_answer' in s or 'leaks' in s:
        return 'hint_leaks_answer'
    if 'unit' in s and ('wrong' in s or 'invalid' in s or 'mismatch' in s):
        return 'wrong_unit'
    if 'answer' in s and ('wrong' in s or 'mismatch' in s or 'incorrect' in s):
        return 'wrong_numeric_answer'
    if 'step' in s and ('missing' in s or 'order' in s):
        return 'missing_intermediate_step'
    if 'hint' in s and ('jump' in s or 'big' in s):
        return 'hint_too_big_jump'
    if 'empty' in s:
        return 'empty_answer'
    if 'simplif' in s:
        return 'fraction_not_simplified'
    if 'precision' in s or 'ieee' in s:
        return 'decimal_precision_error'
    if 'report' in s and 'missing' in s:
        return 'report_missing_fields'
    if 'grade' in s or 'hard' in s:
        return 'grade_level_too_hard'
    if 'ambig' in s:
        return 'wording_ambiguity'

    return 'unknown'

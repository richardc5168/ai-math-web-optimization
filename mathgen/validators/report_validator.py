"""Parent report validator."""
from .schema_validator import validate_report_schema


def validate_parent_report(report):
    """Validate a parent report for completeness and quality.

    Returns:
        (is_valid: bool, errors: list[str])
    """
    is_valid, errors = validate_report_schema(report)

    # Check weak_topics are valid topic names
    valid_topics = {
        'fraction_word_problem',
        'decimal_word_problem',
        'average_word_problem',
        'unit_conversion',
    }
    for topic in report.get('weak_topics', []):
        if topic not in valid_topics:
            errors.append(f'invalid_weak_topic:{topic}')

    # Check common_errors are from known taxonomy
    from mathgen.error_taxonomy import KNOWN_ERROR_CODES
    for err in report.get('common_errors', []):
        if err not in KNOWN_ERROR_CODES:
            errors.append(f'unknown_error_code:{err}')

    # suggested_next_practice should not be empty
    snp = report.get('suggested_next_practice', '')
    if isinstance(snp, str) and len(snp) < 10:
        errors.append('suggested_next_practice_too_short')

    return len(errors) == 0, errors

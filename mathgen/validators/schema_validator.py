"""Schema validators for question and report JSON."""

QUESTION_REQUIRED_FIELDS = {
    'id': str,
    'grade': int,
    'topic': str,
    'difficulty': str,
    'problem_text': str,
    'parameters': dict,
    'correct_answer': str,
    'unit': str,
    'steps': list,
    'hint_ladder': dict,
    'validation_rules': dict,
}

HINT_LADDER_REQUIRED_KEYS = {'level_1', 'level_2', 'level_3', 'level_4'}

REPORT_REQUIRED_FIELDS = {
    'student_id': str,
    'date': str,
    'total_questions': int,
    'accuracy': (int, float),
    'weak_topics': list,
    'common_errors': list,
    'suggested_next_practice': str,
    'encouragement': str,
}

VALID_TOPICS = {
    'fraction_word_problem',
    'decimal_word_problem',
    'average_word_problem',
    'unit_conversion',
}

VALID_DIFFICULTIES = {'easy', 'medium', 'hard'}


def validate_question_schema(q):
    """Validate a question dict against the schema.

    Returns:
        (is_valid: bool, errors: list[str])
    """
    errors = []

    for field, expected_type in QUESTION_REQUIRED_FIELDS.items():
        if field not in q:
            errors.append(f'missing_field:{field}')
        elif not isinstance(q[field], expected_type):
            errors.append(f'wrong_type:{field}:expected {expected_type.__name__}, got {type(q[field]).__name__}')

    if 'topic' in q and q['topic'] not in VALID_TOPICS:
        errors.append(f'invalid_topic:{q["topic"]}')

    if 'difficulty' in q and q['difficulty'] not in VALID_DIFFICULTIES:
        errors.append(f'invalid_difficulty:{q["difficulty"]}')

    if 'hint_ladder' in q and isinstance(q['hint_ladder'], dict):
        missing = HINT_LADDER_REQUIRED_KEYS - set(q['hint_ladder'].keys())
        for k in missing:
            errors.append(f'missing_hint_level:{k}')

    if 'steps' in q and isinstance(q['steps'], list):
        if len(q['steps']) < 2:
            errors.append('too_few_steps:minimum 2')

    if 'correct_answer' in q:
        if not q['correct_answer'] or q['correct_answer'].strip() == '':
            errors.append('empty_answer')

    return len(errors) == 0, errors


def validate_report_schema(r):
    """Validate a parent report dict against the schema.

    Returns:
        (is_valid: bool, errors: list[str])
    """
    errors = []

    for field, expected_type in REPORT_REQUIRED_FIELDS.items():
        if field not in r:
            errors.append(f'missing_field:{field}')
        elif not isinstance(r[field], expected_type):
            errors.append(f'wrong_type:{field}')

    if 'accuracy' in r:
        if isinstance(r['accuracy'], (int, float)):
            if not (0 <= r['accuracy'] <= 1):
                errors.append('accuracy_out_of_range:must be 0-1')

    if 'date' in r and isinstance(r['date'], str):
        import re
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', r['date']):
            errors.append('invalid_date_format:expected YYYY-MM-DD')

    if 'encouragement' in r and isinstance(r['encouragement'], str):
        if len(r['encouragement']) < 5:
            errors.append('encouragement_too_short')
        if len(r['encouragement']) > 100:
            errors.append('encouragement_too_long')

    return len(errors) == 0, errors

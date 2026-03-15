import json
from pathlib import Path

from tools.build_issue_queue import build_issue_queue


def _write_json(path: Path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def _write_jsonl(path: Path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    body = '\n'.join(json.dumps(row, ensure_ascii=False) for row in rows)
    path.write_text(body + ('\n' if body else ''), encoding='utf-8')


def test_issue_queue_uses_latest_command_outcome_to_close_stale_failures(tmp_path):
    artifact_root = tmp_path / 'artifacts' / 'run_10h'
    logs_root = tmp_path / 'mathgen' / 'logs'

    _write_json(
        logs_root / 'last_pass_rate.json',
        {
            'timestamp': '2026-03-15T00:00:00+00:00',
            'total': 160,
            'passed': 160,
            'by_topic': {'fraction_word_problem': {'total': 40, 'passed': 40, 'failed': 0}},
        },
    )
    _write_jsonl(
        artifact_root / 'revision_history.jsonl',
        [
            {
                'event': 'command',
                'phase': 'full',
                'details': {
                    'name': 'verify_all_npm',
                    'pass': False,
                    'command': 'npm.cmd',
                    'arguments': ['run', 'verify:all'],
                    'stdout': 'old.stdout.log',
                    'stderr': 'old.stderr.log',
                    'at': '2026-03-15T01:00:00+00:00',
                },
            },
            {
                'event': 'command',
                'phase': 'full',
                'details': {
                    'name': 'verify_all_npm',
                    'pass': True,
                    'command': 'npm.cmd',
                    'arguments': ['run', 'verify:all'],
                    'stdout': 'new.stdout.log',
                    'stderr': 'new.stderr.log',
                    'at': '2026-03-15T02:00:00+00:00',
                },
            },
            {
                'event': 'command',
                'phase': 'full',
                'details': {
                    'name': 'mathgen_full_cycle',
                    'pass': False,
                    'command': 'python',
                    'arguments': ['mathgen/scripts/run_full_cycle.py'],
                    'stdout': 'cycle.stdout.log',
                    'stderr': 'cycle.stderr.log',
                    'at': '2026-03-15T02:05:00+00:00',
                },
            },
        ],
    )
    _write_jsonl(
        artifact_root / 'error_memory.jsonl',
        [
            {
                'category': 'framework_setup',
                'command': 'npm.cmd run verify:all',
                'root_cause': 'verify_all_npm failed with exit code 1',
                'at': '2026-03-15T01:00:00+00:00',
                'status': 'open',
                'evidence': ['old.stdout.log', 'old.stderr.log'],
            },
            {
                'category': 'framework_setup',
                'command': 'python mathgen/scripts/run_full_cycle.py',
                'root_cause': 'mathgen_full_cycle failed with exit code 2',
                'at': '2026-03-15T02:05:00+00:00',
                'status': 'open',
                'evidence': ['cycle.stdout.log', 'cycle.stderr.log'],
            },
        ],
    )
    _write_jsonl(logs_root / 'benchmark_failures.jsonl', [])
    _write_jsonl(logs_root / 'change_history.jsonl', [])
    _write_jsonl(logs_root / 'lessons_learned.jsonl', [])

    queue = build_issue_queue(artifact_root=artifact_root, mathgen_logs=logs_root, run_id='20260315-issue')

    open_ids = {item['issue_id'] for item in queue['current_open_issues']}
    resolved_ids = {item['issue_id'] for item in queue['recently_resolved']}

    assert 'gate:mathgen_full_cycle' in open_ids
    assert 'gate:verify_all_npm' not in open_ids
    assert 'gate:verify_all_npm' in resolved_ids


def test_issue_queue_builds_watchlist_from_benchmark_failure_history(tmp_path):
    artifact_root = tmp_path / 'artifacts' / 'run_10h'
    logs_root = tmp_path / 'mathgen' / 'logs'

    _write_json(
        logs_root / 'last_pass_rate.json',
        {
            'timestamp': '2026-03-15T00:00:00+00:00',
            'total': 160,
            'passed': 160,
            'by_topic': {'fraction_word_problem': {'total': 40, 'passed': 40, 'failed': 0}},
        },
    )
    _write_jsonl(artifact_root / 'revision_history.jsonl', [])
    _write_jsonl(artifact_root / 'error_memory.jsonl', [])
    _write_jsonl(
        logs_root / 'benchmark_failures.jsonl',
        [
            {
                'timestamp': '2026-03-14T10:00:00+00:00',
                'failures': [
                    {
                        'case': 'fraction_word_problem[1]',
                        'errors': ['hint_leaks_answer:level_3'],
                        'classified': ['hint_leaks_answer'],
                        'note': 'fraction leak',
                    },
                    {
                        'case': 'fraction_word_problem[2]',
                        'errors': ['hint_leaks_answer:level_4'],
                        'classified': ['hint_leaks_answer'],
                        'note': 'another leak',
                    },
                ],
            }
        ],
    )
    _write_jsonl(
        logs_root / 'change_history.jsonl',
        [
            {
                'timestamp': '2026-03-15T00:00:00+00:00',
                'description': 'Fixed hint leak template strategy',
                'error_codes_addressed': ['hint_leaks_answer'],
            }
        ],
    )
    _write_jsonl(
        logs_root / 'lessons_learned.jsonl',
        [
            {
                'timestamp': '2026-03-14T23:00:00+00:00',
                'type': 'anti_pattern',
                'description': 'Old leak patch repeated the answer in hints.',
                'error_codes': ['hint_leaks_answer'],
            }
        ],
    )

    queue = build_issue_queue(artifact_root=artifact_root, mathgen_logs=logs_root, run_id='20260315-issue')

    top_target = queue['next_best_targets'][0]
    assert top_target['issue_id'] == 'benchmark:hint_leaks_answer:fraction_word_problem'
    assert 'run_benchmarks.py --topic fraction_word_problem' in top_target['reproducible_commands'][0]
    assert 'hint-level assertions' in top_target['suggested_test_gap']
    assert 'Fixed hint leak template strategy' in top_target['last_successful_strategy']
    assert 'Old leak patch repeated the answer in hints.' in top_target['last_failed_strategy']
    assert top_target['fix_recipe']['category'] == 'hint_leaks_answer'
    assert top_target['anti_repeat']['decision'] == 'allow'
    assert top_target['anti_repeat']['proposed_strategy_key'] == 'validator_first'


def test_issue_queue_attaches_controlled_fix_recipe_for_top_target(tmp_path):
    artifact_root = tmp_path / 'artifacts' / 'run_10h'
    logs_root = tmp_path / 'mathgen' / 'logs'

    _write_json(
        logs_root / 'last_pass_rate.json',
        {
            'timestamp': '2026-03-15T00:00:00+00:00',
            'total': 160,
            'passed': 160,
            'by_topic': {'decimal_word_problem': {'total': 40, 'passed': 40, 'failed': 0}},
        },
    )
    _write_jsonl(artifact_root / 'revision_history.jsonl', [])
    _write_jsonl(artifact_root / 'error_memory.jsonl', [])
    _write_jsonl(
        logs_root / 'benchmark_failures.jsonl',
        [
            {
                'timestamp': '2026-03-14T10:00:00+00:00',
                'failures': [
                    {
                        'case': 'decimal_word_problem[3]',
                        'errors': ['wrong_numeric_answer:expected 2.5 got 2.50'],
                        'classified': ['wrong_numeric_answer'],
                        'note': 'verifier mismatch',
                    }
                ],
            }
        ],
    )
    _write_jsonl(
        logs_root / 'change_history.jsonl',
        [
            {
                'timestamp': '2026-03-14T12:00:00+00:00',
                'description': 'Aligned expected answers with verifier policy for decimal formatting',
                'error_codes_addressed': ['wrong_numeric_answer'],
            }
        ],
    )
    _write_jsonl(logs_root / 'lessons_learned.jsonl', [])

    queue = build_issue_queue(artifact_root=artifact_root, mathgen_logs=logs_root, run_id='20260315-recipe')

    top_target = queue['next_best_targets'][0]
    recipe = top_target['fix_recipe']
    anti_repeat = top_target['anti_repeat']

    assert recipe['category'] == 'wrong_numeric_answer'
    assert 'mandatory_pre_test' in recipe
    assert 'mandatory_post_test' in recipe
    assert 'forbidden_shortcuts' in recipe
    assert anti_repeat['decision'] == 'allow'
    assert anti_repeat['proposed_strategy_key'] == 'verifier_policy_first'
    assert queue['summary']['top_actionable_target'] == top_target['issue_id']


def test_issue_queue_blocks_blacklisted_recipe_strategy_and_requires_alternative(tmp_path):
    artifact_root = tmp_path / 'artifacts' / 'run_10h'
    logs_root = tmp_path / 'mathgen' / 'logs'

    _write_json(
        logs_root / 'last_pass_rate.json',
        {
            'timestamp': '2026-03-15T00:00:00+00:00',
            'total': 160,
            'passed': 160,
            'by_topic': {'fraction_word_problem': {'total': 40, 'passed': 40, 'failed': 0}},
        },
    )
    _write_jsonl(artifact_root / 'revision_history.jsonl', [])
    _write_jsonl(artifact_root / 'error_memory.jsonl', [])
    _write_jsonl(
        logs_root / 'benchmark_failures.jsonl',
        [
            {
                'timestamp': '2026-03-14T10:00:00+00:00',
                'failures': [
                    {
                        'case': 'fraction_word_problem[8]',
                        'errors': ['hint_leaks_answer:level_3'],
                        'classified': ['hint_leaks_answer'],
                        'note': 'fraction leak',
                    }
                ],
            }
        ],
    )
    _write_jsonl(logs_root / 'change_history.jsonl', [])
    _write_jsonl(
        logs_root / 'lessons_learned.jsonl',
        [
            {
                'timestamp': '2026-03-15T00:00:00+00:00',
                'type': 'anti_pattern',
                'strategy': 'Add or tighten hint validator coverage before touching template text.',
                'description': 'Validator-first attempt caused a regression and repeated the answer in hints.',
                'error_codes': ['hint_leaks_answer'],
            },
            {
                'timestamp': '2026-03-15T00:05:00+00:00',
                'type': 'anti_pattern',
                'strategy': 'Replace answer-bearing hint lines with intermediate-step scaffolding.',
                'description': 'Intermediate scaffold patch caused a side effect and broke downstream hints.',
                'error_codes': ['hint_leaks_answer'],
            },
            {
                'timestamp': '2026-03-15T00:10:00+00:00',
                'type': 'anti_pattern',
                'strategy': 'Derive level 3 hints from operands or sub-results, never from the final answer text.',
                'description': 'Operand-derived rewrite caused regression: pass rate dropped from 160/160 to 150/160.',
                'error_codes': ['hint_leaks_answer'],
            },
        ],
    )

    queue = build_issue_queue(artifact_root=artifact_root, mathgen_logs=logs_root, run_id='20260315-blocked')

    top_target = queue['next_best_targets'][0]
    anti_repeat = top_target['anti_repeat']

    assert top_target['fix_recipe']['category'] == 'hint_leaks_answer'
    assert anti_repeat['decision'] == 'blocked'
    assert anti_repeat['proposed_strategy_key'] == ''
    assert anti_repeat['alternative_strategy_keys'] == []
    assert len(anti_repeat['recent_strategies']) == 3
    assert {item['matched_strategy_key'] for item in anti_repeat['recent_strategies']} == {
        'validator_first',
        'intermediate_scaffold',
        'derive_from_operands',
    }


def test_issue_queue_uses_strategy_outcomes_to_avoid_manual_repeat_logging(tmp_path):
    artifact_root = tmp_path / 'artifacts' / 'run_10h'
    logs_root = tmp_path / 'mathgen' / 'logs'

    _write_json(
        logs_root / 'last_pass_rate.json',
        {
            'timestamp': '2026-03-15T00:00:00+00:00',
            'total': 160,
            'passed': 160,
            'by_topic': {'fraction_word_problem': {'total': 40, 'passed': 40, 'failed': 0}},
        },
    )
    _write_jsonl(artifact_root / 'revision_history.jsonl', [])
    _write_jsonl(artifact_root / 'error_memory.jsonl', [])
    _write_jsonl(
        artifact_root / 'strategy_outcomes.jsonl',
        [
            {
                'timestamp': '2026-03-15T01:00:00+00:00',
                'issue_id': 'benchmark:hint_leaks_answer:fraction_word_problem',
                'error_category': 'hint_leaks_answer',
                'strategy_key': 'validator_first',
                'strategy': 'Add or tighten hint validator coverage before touching template text.',
                'event': 'validated_failure',
                'outcome': 'failed',
                'has_side_effect': True,
                'counts_toward_blacklist': True,
                'reason': 'Gate failed after validator-first patch.',
            }
        ],
    )
    _write_jsonl(
        logs_root / 'benchmark_failures.jsonl',
        [
            {
                'timestamp': '2026-03-15T00:30:00+00:00',
                'failures': [
                    {
                        'case': 'fraction_word_problem[12]',
                        'errors': ['hint_leaks_answer:level_3'],
                        'classified': ['hint_leaks_answer'],
                        'note': 'still leaking',
                    }
                ],
            }
        ],
    )
    _write_jsonl(logs_root / 'change_history.jsonl', [])
    _write_jsonl(logs_root / 'lessons_learned.jsonl', [])

    queue = build_issue_queue(artifact_root=artifact_root, mathgen_logs=logs_root, run_id='20260315-outcomes')

    top_target = queue['next_best_targets'][0]
    assert top_target['anti_repeat']['decision'] == 'allow'
    assert top_target['anti_repeat']['proposed_strategy_key'] == 'intermediate_scaffold'
    assert 'validator_first' in {item['matched_strategy_key'] for item in top_target['anti_repeat']['failed_strategies']}

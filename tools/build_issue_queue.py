import argparse
from copy import deepcopy
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
import sys

if __package__ in {None, ''}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tools.fix_recipe_registry import get_fix_recipe, registry_to_markdown, registry_to_payload, resolve_recipe_category


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ARTIFACT_ROOT = REPO_ROOT / 'artifacts' / 'run_10h'
DEFAULT_MATHGEN_LOGS = REPO_ROOT / 'mathgen' / 'logs'

COMMAND_NAME_PATTERNS = (
    ('verify:all', 'verify_all_npm'),
    ('validate_all_elementary_banks.py', 'validate_all_elementary_banks'),
    ('scripts/verify_all.py', 'verify_all_py'),
    ('run_full_cycle.py --gate-only', 'mathgen_gate_only'),
    ('run_full_cycle.py', 'mathgen_full_cycle'),
    ('test_mathgen_stability_contract.py', 'stability_contract'),
)

OPEN_COMMAND_RISK = {
    'verify_all_npm': 100,
    'mathgen_full_cycle': 95,
    'stability_contract': 85,
    'validate_all_elementary_banks': 80,
    'verify_all_py': 75,
    'mathgen_gate_only': 70,
}

WATCHLIST_RISK = {
    'hint_leaks_answer': 88,
    'wrong_numeric_answer': 84,
    'wrong_unit': 78,
    'benchmark_contract_drift': 92,
    'answer_format_drift': 72,
    'wording_ambiguity': 68,
    'difficulty_drift': 66,
    'too_many_decimal_places': 64,
}

TEST_GAP_SUGGESTIONS = {
    'verify_all_npm': 'Add a targeted verify:all fixture or seeded input that reproduces the failing step before rerunning the full gate.',
    'mathgen_full_cycle': 'Add a focused CLI regression test around run_full_cycle arguments and generated report outputs.',
    'stability_contract': 'Extend deterministic and fraction-normalization tests before changing generator behavior.',
    'hint_leaks_answer': 'Add benchmark cases and focused hint-level assertions that fail when the final answer appears verbatim.',
    'wrong_numeric_answer': 'Add a benchmark case plus verifier-contract assertion for the affected topic and format policy.',
    'wrong_unit': 'Add a benchmark case plus wording/unit consistency assertion for the affected topic.',
    'benchmark_contract_drift': 'Add a contract test tying benchmark expectations to verifier formatting and template semantics.',
    'answer_format_drift': 'Add explicit answer-format regression tests generated from verifier policy, not hand-written notation.',
    'report_truthfulness': 'Add a runner summary/report assertion that validates mode-specific wording and generated counts.',
}

SIDE_EFFECT_MARKERS = ('regression', 'side effect', 'pass rate dropped', 'dropped from', 'broke', 'broke downstream')


def _read_json(path: Path, fallback=None):
    if not path.is_file():
        return fallback
    return json.loads(path.read_text(encoding='utf-8'))


def _read_jsonl(path: Path):
    if not path.is_file():
        return []
    rows = []
    for line in path.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return rows


def _write_json(path: Path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def _write_text(path: Path, body: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding='utf-8')


def _parse_ts(value: str):
    if not value:
        return datetime.min.replace(tzinfo=timezone.utc)
    try:
        return datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError:
        return datetime.min.replace(tzinfo=timezone.utc)


def _dedupe(values):
    seen = set()
    ordered = []
    for value in values:
        if not value or value in seen:
            continue
        seen.add(value)
        ordered.append(value)
    return ordered


def _read_strategy_outcomes(artifact_root: Path):
    return _read_jsonl(artifact_root / 'strategy_outcomes.jsonl')


def _normalize_text(value: str):
    return ' '.join((value or '').lower().replace('_', ' ').replace('-', ' ').split())


def _category_matches(category: str, codes, description: str = ''):
    resolved = resolve_recipe_category(category)
    normalized_codes = {resolve_recipe_category(code) for code in (codes or []) if code}
    if resolved in normalized_codes or category in (codes or []):
        return True
    haystack = _normalize_text(description)
    return _normalize_text(category) in haystack or _normalize_text(resolved) in haystack


def _history_strategy_text(entry):
    return entry.get('strategy') or entry.get('description', '')


def _match_strategy_key(recipe, text: str):
    normalized = _normalize_text(text)
    best_key = ''
    best_score = 0
    for strategy in recipe.get('strategy_catalog', []):
        key_tokens = _normalize_text(strategy['key'])
        score = 0
        if key_tokens and key_tokens in normalized:
            score += 3
        for keyword in strategy.get('keywords', []):
            if _normalize_text(keyword) in normalized:
                score += 1
        if score > best_score:
            best_key = strategy['key']
            best_score = score
    return best_key if best_score > 0 else ''


def _strategy_summary(recipe, strategy_key: str):
    for strategy in recipe.get('strategy_catalog', []):
        if strategy['key'] == strategy_key:
            return strategy['summary']
    return ''


def _strategy_history(category: str, change_history, lessons, strategy_outcomes):
    rows = []
    for entry in strategy_outcomes:
        if resolve_recipe_category(entry.get('error_category', '')) != resolve_recipe_category(category):
            continue
        rows.append(
            {
                'timestamp': entry.get('timestamp', ''),
                'source': 'strategy_outcomes',
                'entry_type': entry.get('event', ''),
                'outcome': entry.get('outcome', 'observed'),
                'has_side_effect': bool(entry.get('has_side_effect')),
                'strategy_text': entry.get('strategy', '') or entry.get('strategy_key', ''),
                'strategy_key': entry.get('strategy_key', ''),
                'description': entry.get('reason', ''),
                'counts_toward_blacklist': bool(entry.get('counts_toward_blacklist')),
            }
        )
    for entry in change_history:
        if not _category_matches(category, entry.get('error_codes_addressed', []) or [], entry.get('description', '')):
            continue
        rows.append(
            {
                'timestamp': entry.get('timestamp', ''),
                'source': 'change_history',
                'entry_type': 'change',
                'outcome': 'successful',
                'has_side_effect': False,
                'strategy_text': _history_strategy_text(entry),
                'strategy_key': '',
                'description': entry.get('description', ''),
                'counts_toward_blacklist': False,
            }
        )
    for entry in lessons:
        if not _category_matches(category, entry.get('error_codes', []) or [], entry.get('description', '')):
            continue
        entry_type = entry.get('type', '')
        description = entry.get('description', '')
        normalized = _normalize_text(description)
        outcome = 'observed'
        if entry_type == 'anti_pattern':
            outcome = 'failed'
        elif entry_type in {'fix_applied', 'coverage_expansion'}:
            outcome = 'successful'
        rows.append(
            {
                'timestamp': entry.get('timestamp', ''),
                'source': 'lessons_learned',
                'entry_type': entry_type,
                'outcome': outcome,
                'has_side_effect': any(marker in normalized for marker in SIDE_EFFECT_MARKERS),
                'strategy_text': _history_strategy_text(entry),
                'strategy_key': '',
                'description': description,
                'counts_toward_blacklist': (entry_type == 'anti_pattern'),
            }
        )
    rows.sort(key=lambda item: _parse_ts(item['timestamp']), reverse=True)
    return rows


def _public_recipe_view(recipe):
    if recipe is None:
        return None
    public_recipe = deepcopy(recipe)
    for strategy in public_recipe.get('strategy_catalog', []):
        strategy.pop('keywords', None)
    return public_recipe


def _anti_repeat_decision(category: str, change_history, lessons, strategy_outcomes):
    recipe = get_fix_recipe(category)
    if recipe is None:
        return {
            'decision': 'no_recipe',
            'reason': 'No controlled fix recipe is registered for this category yet.',
            'proposed_strategy_key': '',
            'proposed_strategy': '',
            'alternative_strategy_keys': [],
            'alternative_strategies': [],
            'recent_strategies': [],
            'failed_strategies': [],
            'side_effect_strategies': [],
            'proposal_reuses_recent_strategy': False,
        }

    history = _strategy_history(category, change_history, lessons, strategy_outcomes)
    recent_window = []
    blacklisted_keys = []
    side_effect_keys = []
    for row in history:
        matched_key = row.get('strategy_key') or _match_strategy_key(recipe, row['strategy_text'])
        item = {
            'timestamp': row['timestamp'],
            'outcome': row['outcome'],
            'entry_type': row['entry_type'],
            'strategy_text': row['strategy_text'],
            'matched_strategy_key': matched_key,
            'matched_strategy': _strategy_summary(recipe, matched_key),
        }
        if len(recent_window) < 3:
            recent_window.append(item)
        if (row['outcome'] == 'failed' or row.get('counts_toward_blacklist')) and matched_key:
            blacklisted_keys.append(matched_key)
        if row['has_side_effect'] and matched_key:
            side_effect_keys.append(matched_key)

    blacklisted_keys = _dedupe(blacklisted_keys)
    side_effect_keys = _dedupe(side_effect_keys)

    proposed_key = ''
    for strategy_key in recipe.get('recommended_strategy_order', []):
        if strategy_key not in blacklisted_keys and strategy_key not in side_effect_keys:
            proposed_key = strategy_key
            break

    alternatives = [
        strategy_key
        for strategy_key in recipe.get('recommended_strategy_order', [])
        if strategy_key != proposed_key and strategy_key not in blacklisted_keys and strategy_key not in side_effect_keys
    ]
    proposal_reuses_recent = any(item['matched_strategy_key'] == proposed_key and proposed_key for item in recent_window)

    if proposed_key:
        reason = 'Using the highest-priority recipe strategy that is not blacklisted by recent failures or side effects.'
        if proposal_reuses_recent:
            reason = 'Reusing a recent non-blacklisted strategy because it remains the safest known controlled recipe.'
        decision = 'allow'
    else:
        reason = 'All registered strategies for this category are currently blacklisted or marked with side effects. Choose a new strategy before editing.'
        decision = 'blocked'

    return {
        'decision': decision,
        'reason': reason,
        'proposed_strategy_key': proposed_key,
        'proposed_strategy': _strategy_summary(recipe, proposed_key),
        'alternative_strategy_keys': alternatives,
        'alternative_strategies': [_strategy_summary(recipe, key) for key in alternatives],
        'recent_strategies': recent_window,
        'failed_strategies': [
            {
                'matched_strategy_key': item['matched_strategy_key'],
                'strategy_key': item['matched_strategy_key'],
                'strategy': item['matched_strategy'],
                'strategy_text': item['strategy_text'],
                'timestamp': item['timestamp'],
            }
            for item in recent_window
            if item['matched_strategy_key'] in blacklisted_keys
        ],
        'side_effect_strategies': [
            {
                'matched_strategy_key': item['matched_strategy_key'],
                'strategy_key': item['matched_strategy_key'],
                'strategy': item['matched_strategy'],
                'strategy_text': item['strategy_text'],
                'timestamp': item['timestamp'],
            }
            for item in recent_window
            if item['matched_strategy_key'] in side_effect_keys
        ],
        'proposal_reuses_recent_strategy': proposal_reuses_recent,
    }


def infer_command_name(command_text: str = '', root_cause: str = ''):
    combined = f'{root_cause} {command_text}'.lower()
    for needle, name in COMMAND_NAME_PATTERNS:
        if needle.lower() in combined:
            return name
    if root_cause:
        token = root_cause.split(' failed', 1)[0].strip()
        if token and ' ' not in token:
            return token
    return 'unknown_command'


def _extract_topic(case_id: str):
    if '[' not in case_id:
        return case_id or 'unknown'
    return case_id.split('[', 1)[0]


def _last_matching_strategy(category: str, change_history, lessons, strategy_outcomes, strategy_kind: str):
    candidates = []
    for entry in strategy_outcomes:
        if resolve_recipe_category(entry.get('error_category', '')) != resolve_recipe_category(category):
            continue
        outcome = entry.get('outcome', '')
        if strategy_kind == 'successful' and outcome == 'successful':
            candidates.append((entry.get('timestamp', ''), entry.get('strategy', '') or entry.get('strategy_key', '')))
        if strategy_kind == 'failed' and outcome == 'failed':
            candidates.append((entry.get('timestamp', ''), entry.get('strategy', '') or entry.get('strategy_key', '')))
    if strategy_kind == 'successful':
        for entry in change_history:
            error_codes = entry.get('error_codes_addressed', []) or []
            description = entry.get('description', '')
            if _category_matches(category, error_codes, description):
                candidates.append((entry.get('timestamp', ''), entry.get('strategy', description)))
    for entry in lessons:
        error_codes = entry.get('error_codes', []) or []
        description = entry.get('description', '')
        entry_type = entry.get('type', '')
        if not _category_matches(category, error_codes, description):
            continue
        if strategy_kind == 'failed' and entry_type == 'anti_pattern':
            candidates.append((entry.get('timestamp', ''), entry.get('strategy', description)))
        if strategy_kind == 'successful' and entry_type in {'fix_applied', 'pattern_discovered', 'coverage_expansion'}:
            candidates.append((entry.get('timestamp', ''), entry.get('strategy', description)))
    if not candidates:
        return ''
    candidates.sort(key=lambda item: _parse_ts(item[0]), reverse=True)
    return candidates[0][1]


def _test_gap(category: str):
    return TEST_GAP_SUGGESTIONS.get(
        category,
        'Add a focused regression test that reproduces the issue before rerunning the smallest relevant gate.',
    )


def build_issue_queue(*, artifact_root: Path, mathgen_logs: Path, run_id: str = ''):
    revision_history = _read_jsonl(artifact_root / 'revision_history.jsonl')
    error_memory = _read_jsonl(artifact_root / 'error_memory.jsonl')
    benchmark_failures = _read_jsonl(mathgen_logs / 'benchmark_failures.jsonl')
    change_history = _read_jsonl(mathgen_logs / 'change_history.jsonl')
    lessons = _read_jsonl(mathgen_logs / 'lessons_learned.jsonl')
    strategy_outcomes = _read_strategy_outcomes(artifact_root)
    baseline = _read_json(mathgen_logs / 'last_pass_rate.json', {}) or {}

    latest_command_events = {}
    for row in revision_history:
        if row.get('event') != 'command':
            continue
        details = row.get('details', {})
        name = details.get('name') or infer_command_name(
            ' '.join(details.get('arguments', []) or []),
            details.get('name', ''),
        )
        candidate = {
            'name': name,
            'at': details.get('at') or row.get('at', ''),
            'pass': bool(details.get('pass')),
            'command': details.get('command', ''),
            'arguments': details.get('arguments', []) or [],
            'stdout': details.get('stdout', ''),
            'stderr': details.get('stderr', ''),
            'phase': row.get('phase', ''),
        }
        previous = latest_command_events.get(name)
        if previous is None or _parse_ts(candidate['at']) >= _parse_ts(previous['at']):
            latest_command_events[name] = candidate

    error_entries_by_command = defaultdict(list)
    for row in error_memory:
        category = row.get('category', '')
        command_name = infer_command_name(row.get('command', ''), row.get('root_cause', ''))
        if category == 'framework_setup' or command_name != 'unknown_command':
            error_entries_by_command[command_name].append(row)

    current_open_issues = []
    recently_resolved = []
    for name, latest in latest_command_events.items():
        related = sorted(
            error_entries_by_command.get(name, []),
            key=lambda item: _parse_ts(item.get('at', '')),
        )
        first_seen = related[0].get('at', latest.get('at', '')) if related else latest.get('at', '')
        reproducible_command = ' '.join([latest.get('command', '')] + list(latest.get('arguments', []) or [])).strip()
        evidence = _dedupe(
            [latest.get('stdout', ''), latest.get('stderr', '')]
            + [item.get('evidence', [None])[0] for item in related if item.get('evidence')]
        )
        issue = {
            'issue_id': f'gate:{name}',
            'status': 'open' if not latest.get('pass') else 'resolved',
            'error_category': name,
            'source_type': 'gate',
            'first_seen_at': first_seen,
            'last_seen_at': latest.get('at', ''),
            'occurrence_count': len(related) if related else 1,
            'affected_scope': {
                'type': 'command_gate',
                'commands': [reproducible_command],
                'topics': [],
                'cases': [],
            },
            'reproducible_commands': [reproducible_command],
            'risk_score': OPEN_COMMAND_RISK.get(name, 60 if not latest.get('pass') else 20),
            'suggested_test_gap': _test_gap(name),
            'last_failed_strategy': related[-1].get('root_cause', '') if related else '',
            'last_successful_strategy': (
                f"Latest successful gate replay at {latest.get('at', '')}" if latest.get('pass') else ''
            ),
            'evidence': evidence[:5],
        }
        if issue['status'] == 'open':
            current_open_issues.append(issue)
        elif related:
            recently_resolved.append(issue)

    benchmark_groups = {}
    for run in benchmark_failures:
        run_ts = run.get('timestamp', '')
        for failure in run.get('failures', []) or []:
            topic = _extract_topic(failure.get('case', 'unknown'))
            categories = failure.get('classified') or []
            if not categories:
                categories = [failure.get('errors', ['unknown'])[0].split(':', 1)[0]]
            for category in set(categories):
                key = (category, topic)
                group = benchmark_groups.setdefault(
                    key,
                    {
                        'error_category': category,
                        'topic': topic,
                        'first_seen_at': run_ts,
                        'last_seen_at': run_ts,
                        'cases': set(),
                        'runs': set(),
                        'notes': [],
                        'raw_errors': [],
                    },
                )
                group['first_seen_at'] = min(group['first_seen_at'], run_ts, key=_parse_ts)
                group['last_seen_at'] = max(group['last_seen_at'], run_ts, key=_parse_ts)
                group['cases'].add(failure.get('case', ''))
                group['runs'].add(run_ts)
                if failure.get('note'):
                    group['notes'].append(failure['note'])
                for err in failure.get('errors', []) or []:
                    if category in err or err.split(':', 1)[0] == category:
                        group['raw_errors'].append(err)

    watchlist = []
    for (category, topic), group in benchmark_groups.items():
        occurrence_count = len(group['cases'])
        run_count = len(group['runs'])
        successful_strategy = _last_matching_strategy(category, change_history, lessons, strategy_outcomes, 'successful')
        failed_strategy = _last_matching_strategy(category, change_history, lessons, strategy_outcomes, 'failed')
        risk_score = WATCHLIST_RISK.get(category, 55) + min(occurrence_count * 3, 18) + min(run_count * 4, 12)
        if not successful_strategy:
            risk_score += 6
        anti_repeat = _anti_repeat_decision(category, change_history, lessons, strategy_outcomes)
        recipe = get_fix_recipe(category)
        watchlist.append(
            {
                'issue_id': f'benchmark:{category}:{topic}',
                'status': 'watchlist',
                'error_category': category,
                'source_type': 'benchmark_history',
                'first_seen_at': group['first_seen_at'],
                'last_seen_at': group['last_seen_at'],
                'occurrence_count': occurrence_count,
                'affected_scope': {
                    'type': 'mathgen_topic',
                    'commands': [f'python mathgen/scripts/run_benchmarks.py --topic {topic}'],
                    'topics': [topic],
                    'cases': sorted(group['cases']),
                },
                'reproducible_commands': [
                    f'python mathgen/scripts/run_benchmarks.py --topic {topic}',
                    'python mathgen/scripts/run_full_cycle.py',
                ],
                'risk_score': risk_score,
                'suggested_test_gap': _test_gap(category),
                'last_failed_strategy': failed_strategy,
                'last_successful_strategy': successful_strategy,
                'evidence': _dedupe(group['raw_errors'] + group['notes'])[:5],
                'fix_recipe': _public_recipe_view(recipe),
                'anti_repeat': anti_repeat,
            }
        )

    watchlist.sort(key=lambda item: (-item['risk_score'], item['last_seen_at']))
    current_open_issues.sort(key=lambda item: (-item['risk_score'], item['last_seen_at']))
    recently_resolved.sort(key=lambda item: _parse_ts(item['last_seen_at']), reverse=True)

    next_best_targets = current_open_issues[:5] if current_open_issues else watchlist[:5]
    actionable_targets = [
        item for item in next_best_targets if item.get('anti_repeat', {}).get('decision') in {'allow', 'review_required'}
    ]
    return {
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'active_run_id': run_id,
        'baseline': baseline,
        'fix_recipe_registry_version': registry_to_payload()['registry_version'],
        'summary': {
            'current_open_count': len(current_open_issues),
            'watchlist_count': len(watchlist),
            'resolved_recent_count': len(recently_resolved),
            'top_target': next_best_targets[0]['issue_id'] if next_best_targets else None,
            'top_target_decision': next_best_targets[0].get('anti_repeat', {}).get('decision') if next_best_targets else None,
            'top_actionable_target': actionable_targets[0]['issue_id'] if actionable_targets else None,
        },
        'current_open_issues': current_open_issues,
        'next_best_targets': next_best_targets,
        'next_best_actionable_targets': actionable_targets[:5],
        'watchlist': watchlist,
        'recently_resolved': recently_resolved[:10],
    }


def queue_to_markdown(queue):
    lines = [
        '# Issue Queue',
        '',
        f"- generated_at: {queue.get('generated_at', '')}",
        f"- active_run_id: {queue.get('active_run_id', '')}",
        f"- current_open_count: {queue.get('summary', {}).get('current_open_count', 0)}",
        f"- watchlist_count: {queue.get('summary', {}).get('watchlist_count', 0)}",
        f"- top_target: {queue.get('summary', {}).get('top_target', '')}",
        f"- top_target_decision: {queue.get('summary', {}).get('top_target_decision', '')}",
        f"- top_actionable_target: {queue.get('summary', {}).get('top_actionable_target', '')}",
        '',
        '## Current Open Issues',
    ]
    open_issues = queue.get('current_open_issues', [])
    if open_issues:
        for item in open_issues:
            lines.append(
                f"- {item['issue_id']} | risk={item['risk_score']} | last_seen={item['last_seen_at']} | test_gap={item['suggested_test_gap']}"
            )
    else:
        lines.append('- none')
    lines += ['', '## Next Best Targets']
    targets = queue.get('next_best_targets', [])
    if targets:
        for item in targets:
            scope = item['affected_scope'].get('topics', []) or item['affected_scope'].get('commands', [])
            anti_repeat = item.get('anti_repeat', {})
            lines.append(
                f"- {item['issue_id']} | source={item['source_type']} | risk={item['risk_score']} | scope={','.join(scope)} | decision={anti_repeat.get('decision', 'n/a')} | strategy={anti_repeat.get('proposed_strategy_key', '')}"
            )
    else:
        lines.append('- none')
    lines += ['', '## Next Best Actionable Targets']
    actionable = queue.get('next_best_actionable_targets', [])
    if actionable:
        for item in actionable:
            anti_repeat = item.get('anti_repeat', {})
            lines.append(
                f"- {item['issue_id']} | decision={anti_repeat.get('decision', '')} | strategy={anti_repeat.get('proposed_strategy_key', '')} | reason={anti_repeat.get('reason', '')}"
            )
    else:
        lines.append('- none')
    lines += ['', '## Recently Resolved']
    resolved = queue.get('recently_resolved', [])
    if resolved:
        for item in resolved:
            lines.append(f"- {item['issue_id']} | last_seen={item['last_seen_at']}")
    else:
        lines.append('- none')
    return '\n'.join(lines) + '\n'


def main():
    parser = argparse.ArgumentParser(description='Build machine-readable issue queue')
    parser.add_argument('--artifact-root', default=str(DEFAULT_ARTIFACT_ROOT))
    parser.add_argument('--mathgen-logs', default=str(DEFAULT_MATHGEN_LOGS))
    parser.add_argument('--run-id', default='')
    args = parser.parse_args()

    artifact_root = Path(args.artifact_root)
    mathgen_logs = Path(args.mathgen_logs)
    queue = build_issue_queue(artifact_root=artifact_root, mathgen_logs=mathgen_logs, run_id=args.run_id)
    markdown = queue_to_markdown(queue)
    registry_payload = registry_to_payload()
    registry_markdown = registry_to_markdown()

    _write_json(artifact_root / 'issue_queue.json', queue)
    _write_text(artifact_root / 'issue_queue.md', markdown)
    _write_json(artifact_root / 'fix_recipe_registry.json', registry_payload)
    _write_text(artifact_root / 'fix_recipe_registry.md', registry_markdown)
    if args.run_id:
        run_root = artifact_root / args.run_id
        _write_json(run_root / 'issue_queue.json', queue)
        _write_text(run_root / 'issue_queue.md', markdown)
        _write_json(run_root / 'fix_recipe_registry.json', registry_payload)
        _write_text(run_root / 'fix_recipe_registry.md', registry_markdown)

    print(json.dumps(queue['summary'], ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()

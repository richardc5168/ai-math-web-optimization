"""Iteration report generator — auto-summary after each benchmark run."""
import json
import os
from datetime import date


def generate_iteration_report(benchmark_results, changes_description='',
                              new_tests=0, new_errors=None,
                              resolved_errors=None):
    """Generate a structured iteration report.

    Args:
        benchmark_results: dict with keys: total, passed, failed, by_topic, fail_cases
        changes_description: str describing what changed
        new_tests: int count of new tests added
        new_errors: list of newly discovered error types
        resolved_errors: list of resolved error types

    Returns:
        str: markdown report content
    """
    today = date.today().isoformat()
    total = benchmark_results.get('total', 0)
    passed = benchmark_results.get('passed', 0)
    failed = benchmark_results.get('failed', 0)
    pass_rate = passed / total if total > 0 else 0
    by_topic = benchmark_results.get('by_topic', {})

    lines = [
        f'# Iteration Report — {today}',
        '',
        '## 本輪修改內容',
        changes_description or '（無修改）',
        '',
        f'## 新增測試數量: {new_tests}',
        '',
        f'## 總 Pass Rate: {passed}/{total} ({pass_rate:.1%})',
        '',
        '## 各題型 Pass Rate',
        '| 題型 | Pass | Total | Rate |',
        '|------|------|-------|------|',
    ]

    for topic, stats in sorted(by_topic.items()):
        t_total = stats.get('total', 0)
        t_pass = stats.get('passed', 0)
        t_rate = t_pass / t_total if t_total > 0 else 0
        lines.append(f'| {topic} | {t_pass} | {t_total} | {t_rate:.1%} |')

    lines.append('')
    lines.append('## 新發現錯誤類型')
    if new_errors:
        for e in new_errors:
            lines.append(f'- {e}')
    else:
        lines.append('（無）')

    lines.append('')
    lines.append('## 已解決錯誤類型')
    if resolved_errors:
        for e in resolved_errors:
            lines.append(f'- {e}')
    else:
        lines.append('（無）')

    lines.append('')
    lines.append('## 建議下一輪優先修正項目')
    if benchmark_results.get('fail_cases'):
        # Group by error category
        categories = {}
        for fc in benchmark_results['fail_cases']:
            cat = fc.get('error_category', 'unknown')
            categories[cat] = categories.get(cat, 0) + 1
        sorted_cats = sorted(categories.items(), key=lambda x: -x[1])
        for cat, count in sorted_cats[:3]:
            lines.append(f'- {cat} ({count} 次)')
    else:
        lines.append('- 全部通過，可考慮增加更多 benchmark cases')

    lines.append('')
    lines.append('## 是否值得升級為 Gold Sample')
    if pass_rate >= 1.0:
        lines.append('✅ 全部通過，建議將新增 cases 納入 gold_bank。')
    elif pass_rate >= 0.9:
        lines.append('⚠️ 接近全過，修正剩餘問題後可納入 gold_bank。')
    else:
        lines.append('❌ 尚未穩定，不建議納入 gold_bank。')

    return '\n'.join(lines)


def save_iteration_report(report_md, reports_dir):
    """Save report to latest and history."""
    os.makedirs(reports_dir, exist_ok=True)
    history_dir = os.path.join(reports_dir, 'history')
    os.makedirs(history_dir, exist_ok=True)

    latest_path = os.path.join(reports_dir, 'latest_iteration_report.md')
    with open(latest_path, 'w', encoding='utf-8') as f:
        f.write(report_md)

    today = date.today().isoformat()
    history_path = os.path.join(history_dir, f'{today}_iteration_report.md')
    with open(history_path, 'w', encoding='utf-8') as f:
        f.write(report_md)

    return latest_path, history_path

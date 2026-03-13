"""家長報告生成器 — 規則式，固定模板。"""
from datetime import date


_TOPIC_NAMES = {
    'fraction_word_problem': '分數應用題',
    'decimal_word_problem': '小數應用題',
    'average_word_problem': '平均數',
    'unit_conversion': '單位換算',
}

_ERROR_DESCRIPTIONS = {
    'wrong_numeric_answer': '計算錯誤',
    'wrong_unit': '單位寫錯',
    'missing_intermediate_step': '缺少中間步驟',
    'hint_leaks_answer': '提示洩漏答案',
    'fraction_not_simplified': '分數未約分',
    'decimal_precision_error': '小數精度錯誤',
    'step_order_wrong': '步驟順序錯誤',
}

_ENCOURAGEMENTS = [
    '加油！每天練習一點點，進步看得見！💪',
    '表現不錯！繼續保持這個好習慣！🌟',
    '今天很認真呢！明天也一起努力吧！😊',
    '數學越練越有信心，你做得很好！👏',
    '堅持就是勝利，相信自己一定行！🏆',
]

_PRACTICE_SUGGESTIONS = {
    'fraction_word_problem': '建議多練習通分和約分的題目，特別注意分母不同時的加減法。',
    'decimal_word_problem': '建議多練習小數對齊和進退位的計算，可以用估算來檢查答案。',
    'average_word_problem': '建議多練習加總後除以個數的基本流程，注意除不盡時的處理。',
    'unit_conversion': '建議背熟常用單位換算表，特別是公里/公尺/公分之間的關係。',
}


def generate_parent_report(student_id, results):
    """Generate a parent report from student results.

    Args:
        student_id: str
        results: list of dicts, each with:
            - topic: str
            - correct: bool
            - error_type: str or None

    Returns:
        dict matching parent report schema
    """
    total = len(results)
    correct_count = sum(1 for r in results if r['correct'])
    accuracy = correct_count / total if total > 0 else 0.0

    # Find weak topics (accuracy < 0.7 per topic)
    topic_stats = {}
    for r in results:
        t = r['topic']
        if t not in topic_stats:
            topic_stats[t] = {'total': 0, 'correct': 0}
        topic_stats[t]['total'] += 1
        if r['correct']:
            topic_stats[t]['correct'] += 1

    weak_topics = []
    for t, s in topic_stats.items():
        if s['total'] > 0 and s['correct'] / s['total'] < 0.7:
            weak_topics.append(t)

    # Collect error types
    error_types = []
    for r in results:
        if r.get('error_type') and r['error_type'] not in error_types:
            error_types.append(r['error_type'])

    # Determine practice suggestion
    if weak_topics:
        suggestion = _PRACTICE_SUGGESTIONS.get(
            weak_topics[0],
            '建議針對較弱的題型多加練習。'
        )
    else:
        suggestion = '目前表現均衡，可以嘗試更高難度的題目來挑戰自己！'

    # Pick encouragement based on accuracy
    if accuracy >= 0.9:
        encouragement = _ENCOURAGEMENTS[1]
    elif accuracy >= 0.7:
        encouragement = _ENCOURAGEMENTS[3]
    elif accuracy >= 0.5:
        encouragement = _ENCOURAGEMENTS[0]
    else:
        encouragement = _ENCOURAGEMENTS[4]

    return {
        'student_id': student_id,
        'date': date.today().isoformat(),
        'total_questions': total,
        'accuracy': round(accuracy, 2),
        'weak_topics': weak_topics,
        'common_errors': error_types,
        'suggested_next_practice': suggestion,
        'encouragement': encouragement,
    }

"""分數應用題生成器 — 規則式，不依賴外部模型。"""
import random
from .base import BaseGenerator


# Pre-built templates for deterministic generation
_TEMPLATES = [
    {
        'pattern': 'subtract',
        'text': '小明有 {a} 公斤的餅乾，吃掉了 {b} 公斤，還剩下多少公斤？',
        'unit': '公斤',
    },
    {
        'pattern': 'add',
        'text': '媽媽買了 {a} 公升的牛奶，又買了 {b} 公升，總共有多少公升？',
        'unit': '公升',
    },
    {
        'pattern': 'subtract',
        'text': '一條繩子長 {a} 公尺，剪掉 {b} 公尺後，還剩多少公尺？',
        'unit': '公尺',
    },
    {
        'pattern': 'add',
        'text': '小華走了 {a} 公里，又走了 {b} 公里，共走了多少公里？',
        'unit': '公里',
    },
    {
        'pattern': 'subtract',
        'text': '水桶裡有 {a} 公升的水，用掉 {b} 公升，還剩多少公升？',
        'unit': '公升',
    },
    {
        'pattern': 'add',
        'text': '一條彩帶長 {a} 公尺，又接上 {b} 公尺，現在共有多少公尺？',
        'unit': '公尺',
    },
    {
        'pattern': 'add',
        'text': '量杯裡有 {a} 公升的水，再倒入 {b} 公升，總共有多少公升？',
        'unit': '公升',
    },
    {
        'pattern': 'add',
        'text': '桶子裡原本有 {a} 公升，又加入 {b} 公升，一共有多少公升？',
        'unit': '公升',
    },
    {
        'pattern': 'add',
        'text': '木條長 {a} 公尺，再接上 {b} 公尺後，總長是多少公尺？',
        'unit': '公尺',
    },
    {
        'pattern': 'add',
        'text': '兩段繩子分別長 {a} 公尺和 {b} 公尺，合起來是多少公尺？',
        'unit': '公尺',
    },
    {
        'pattern': 'add',
        'text': '水壺中有 {a} 公升，再裝入 {b} 公升後，共有多少公升？',
        'unit': '公升',
    },
    {
        'pattern': 'add',
        'text': '容器甲有 {a} 公升，容器乙有 {b} 公升，合計是多少公升？',
        'unit': '公升',
    },
    {
        'pattern': 'add',
        'text': '量桶裡先有 {a} 公升的水，又加入 {b} 公升後，共有多少公升？',
        'unit': '公升',
    },
]


class FractionWordProblemGenerator(BaseGenerator):
    TOPIC = 'fraction_word_problem'
    GRADE = 5

    def generate(self, params=None):
        if params:
            tpl_idx = params.get('template_index', 0)
            n1, d1 = params['a_num'], params['a_den']
            n2, d2 = params['b_num'], params['b_den']
        else:
            tpl_idx = random.randint(0, len(_TEMPLATES) - 1)
            d1 = random.choice([2, 3, 4, 5, 6, 8])
            d2 = random.choice([2, 3, 4, 5, 6, 8])
            n1 = random.randint(1, d1 * 2)
            n2 = random.randint(1, d2)

        tpl = _TEMPLATES[tpl_idx % len(_TEMPLATES)]
        a_str = self.frac_str(n1, d1)
        b_str = self.frac_str(n2, d2)

        # Ensure a >= b for subtract
        if tpl['pattern'] == 'subtract':
            lcd = self.lcm(d1, d2)
            a_lcd = n1 * (lcd // d1)
            b_lcd = n2 * (lcd // d2)
            if a_lcd < b_lcd:
                n1, d1, n2, d2 = n2, d2, n1, d1
                a_str = self.frac_str(n1, d1)
                b_str = self.frac_str(n2, d2)

        # Solve
        lcd = self.lcm(d1, d2)
        a_lcd = n1 * (lcd // d1)
        b_lcd = n2 * (lcd // d2)

        if tpl['pattern'] == 'add':
            result_num = a_lcd + b_lcd
            op_word = '加'
            op_sign = '+'
        else:
            result_num = a_lcd - b_lcd
            op_word = '減'
            op_sign = '−'

        answer = self.frac_str(result_num, lcd)

        # Simplify for display
        sn1, sd1 = self.simplify(n1, d1)
        sn2, sd2 = self.simplify(n2, d2)

        # Steps
        steps = []
        if sd1 != sd2:
            steps.append(f'通分：LCD({sd1}, {sd2}) = {lcd}')
            steps.append(f'{sn1}/{sd1} = {a_lcd}/{lcd}')
            steps.append(f'{sn2}/{sd2} = {b_lcd}/{lcd}')
        steps.append(f'計算：{a_lcd}/{lcd} {op_sign} {b_lcd}/{lcd} = {result_num}/{lcd}')
        rn, rd = self.simplify(result_num, lcd)
        if (rn, rd) != (result_num, lcd):
            steps.append(f'約分：{result_num}/{lcd} = {rn}/{rd}')
        steps.append(f'答案：{answer} {tpl["unit"]}')

        # Hint ladder (must NOT contain the final answer)
        hint_ladder = {
            'level_1': f'這題是分數的{op_word}法，想想看要怎麼處理分母不同的分數？',
            'level_2': f'先通分，把分母統一為 {lcd}，再{op_word}分子。',
            'level_3': f'通分後，分母相同時只要處理分子的{op_word}法，再看看結果能不能約分。',
            'level_4': '算完後，檢查分數是否可以約分，再代回原題驗算看看。',
        }

        problem_text = tpl['text'].format(a=a_str, b=b_str)
        parameters = {
            'a_num': sn1, 'a_den': sd1,
            'b_num': sn2, 'b_den': sd2,
            'operation': tpl['pattern'],
            'template_index': tpl_idx,
        }

        return self.build_question(
            topic=self.TOPIC,
            difficulty='medium',
            problem_text=problem_text,
            parameters=parameters,
            correct_answer=answer,
            unit=tpl['unit'],
            steps=steps,
            hint_ladder=hint_ladder,
            validation_rules={
                'answer_type': 'fraction',
                'must_simplify': True,
                'unit': tpl['unit'],
            },
        )

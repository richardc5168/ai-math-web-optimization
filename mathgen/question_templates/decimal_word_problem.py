"""小數應用題生成器 — 規則式，精確整數運算。"""
import random
from .base import BaseGenerator


_TEMPLATES = [
    {
        'pattern': 'subtract',
        'text': '一瓶果汁有 {a} 公升，喝掉了 {b} 公升，還剩多少公升？',
        'unit': '公升',
    },
    {
        'pattern': 'add',
        'text': '小明早上走了 {a} 公里，下午又走了 {b} 公里，共走了多少公里？',
        'unit': '公里',
    },
    {
        'pattern': 'subtract',
        'text': '一根木棒長 {a} 公尺，鋸掉 {b} 公尺後，還剩多少公尺？',
        'unit': '公尺',
    },
    {
        'pattern': 'multiply',
        'text': '一公斤蘋果 {a} 元，買 {b} 公斤要多少元？',
        'unit': '元',
    },
    {
        'pattern': 'add',
        'text': '容器裡有 {a} 公升的水，再倒入 {b} 公升，共有多少公升？',
        'unit': '公升',
    },
    {
        'pattern': 'add',
        'text': '量杯中原本有 {a} 公升的水，再加入 {b} 公升，現在一共有多少公升？',
        'unit': '公升',
    },
    {
        'pattern': 'add',
        'text': '桶子裡先有 {a} 公升，再倒進 {b} 公升後，總共有多少公升？',
        'unit': '公升',
    },
    {
        'pattern': 'add',
        'text': '水箱裡有 {a} 公升的水，又補充了 {b} 公升，合起來是多少公升？',
        'unit': '公升',
    },
    {
        'pattern': 'add',
        'text': '杯子中有 {a} 公升果汁，再加入 {b} 公升後，總量是多少公升？',
        'unit': '公升',
    },
    {
        'pattern': 'add',
        'text': '小明把 {a} 公升和 {b} 公升的水倒在一起，一共有多少公升？',
        'unit': '公升',
    },
    {
        'pattern': 'add',
        'text': '兩個容器分別有 {a} 公升和 {b} 公升的水，合計是多少公升？',
        'unit': '公升',
    },
    {
        'pattern': 'add',
        'text': '容器甲有 {a} 公升，容器乙有 {b} 公升，把它們合起來共有多少公升？',
        'unit': '公升',
    },
    {
        'pattern': 'add',
        'text': '先量出 {a} 公升，再量出 {b} 公升，合起來是多少公升？',
        'unit': '公升',
    },
    {
        'pattern': 'add',
        'text': '水桶裡已有 {a} 公升，又加入 {b} 公升，最後共有多少公升？',
        'unit': '公升',
    },
]


class DecimalWordProblemGenerator(BaseGenerator):
    TOPIC = 'decimal_word_problem'
    GRADE = 5

    def generate(self, params=None):
        if params:
            tpl_idx = params.get('template_index', 0)
            a_str = params['a']
            b_str = params['b']
        else:
            tpl_idx = random.randint(0, len(_TEMPLATES) - 1)
            tpl = _TEMPLATES[tpl_idx]
            if tpl['pattern'] == 'multiply':
                a_str = str(random.randint(10, 99)) + '.' + str(random.randint(1, 9))
                b_str = str(random.randint(1, 9)) + '.' + str(random.randint(1, 9))
            else:
                a_val = random.randint(10, 99) * 10 + random.randint(1, 9)
                b_val = random.randint(1, a_val - 1)
                a_str = str(a_val // 10) + '.' + str(a_val % 10)
                if tpl['pattern'] == 'subtract':
                    b_str = str(b_val // 10) + '.' + str(b_val % 10)
                else:
                    b_str = str(b_val // 10) + '.' + str(b_val % 10)

        tpl = _TEMPLATES[tpl_idx % len(_TEMPLATES)]

        if tpl['pattern'] == 'add':
            answer = self.decimal_add(a_str, b_str)
            op_sign = '+'
            op_word = '加'
        elif tpl['pattern'] == 'subtract':
            answer = self.decimal_sub(a_str, b_str)
            op_sign = '−'
            op_word = '減'
        else:
            answer = self.decimal_mul(a_str, b_str)
            op_sign = '×'
            op_word = '乘'

        steps = [
            f'列式：{a_str} {op_sign} {b_str}',
            f'對齊小數點，進行{op_word}法計算',
            f'計算結果：{answer}',
            f'答案：{answer} {tpl["unit"]}',
        ]

        hint_ladder = {
            'level_1': f'這題是小數的{op_word}法，要注意小數點對齊。',
            'level_2': f'列式：{a_str} {op_sign} {b_str}，對齊小數點再計算。',
            'level_3': f'先不看小數點，把整數部分和小數部分分開算。',
            'level_4': f'算完後，用估算檢查答案是否合理。',
        }

        problem_text = tpl['text'].format(a=a_str, b=b_str)
        parameters = {
            'a': a_str,
            'b': b_str,
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
                'answer_type': 'decimal',
                'unit': tpl['unit'],
            },
        )

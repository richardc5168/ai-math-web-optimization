"""單位換算生成器 — 規則式。"""
import random
from .base import BaseGenerator


# Conversion table: (from_unit, to_unit, multiplier, category)
_CONVERSIONS = [
    ('公里', '公尺', 1000, 'length'),
    ('公尺', '公分', 100, 'length'),
    ('公分', '公釐', 10, 'length'),
    ('公斤', '公克', 1000, 'weight'),
    ('公噸', '公斤', 1000, 'weight'),
    ('公升', '毫升', 1000, 'volume'),
    ('平方公尺', '平方公分', 10000, 'area'),
    ('小時', '分鐘', 60, 'time'),
    ('分鐘', '秒', 60, 'time'),
]

_TEMPLATES = [
    '{value} {from_unit}等於多少{to_unit}？',
    '請將 {value} {from_unit}換算成{to_unit}。',
    '{value} {from_unit} = ? {to_unit}',
]


class UnitConversionGenerator(BaseGenerator):
    TOPIC = 'unit_conversion'
    GRADE = 5

    def generate(self, params=None):
        if params:
            conv_idx = params.get('conversion_index', 0)
            value_str = params['value']
            direction = params.get('direction', 'forward')
            tpl_idx = params.get('template_index', 0)
        else:
            conv_idx = random.randint(0, len(_CONVERSIONS) - 1)
            direction = random.choice(['forward', 'reverse'])
            tpl_idx = random.randint(0, len(_TEMPLATES) - 1)
            if direction == 'forward':
                value_str = str(random.randint(1, 50))
                if random.random() < 0.3:
                    value_str += '.' + str(random.randint(1, 9))
            else:
                multiplier = _CONVERSIONS[conv_idx][2]
                base = random.randint(1, 50)
                value_str = str(base * multiplier)

        conv = _CONVERSIONS[conv_idx % len(_CONVERSIONS)]
        from_unit, to_unit, multiplier, category = conv

        if direction == 'reverse':
            from_unit, to_unit = to_unit, from_unit

        tpl = _TEMPLATES[tpl_idx % len(_TEMPLATES)]

        # Compute answer
        if direction == 'forward':
            answer = self.decimal_mul(value_str, str(multiplier))
            op_desc = f'{value_str} × {multiplier}'
        else:
            # When going reverse (e.g. 公尺→公里), divide
            # Use integer division when possible
            val_parts = value_str.split('.')
            val_dec = len(val_parts[1]) if len(val_parts) > 1 else 0
            val_int = int(value_str.replace('.', ''))
            # result = val / multiplier, shift decimals
            # multiply numerator by enough to do exact division
            scale = 1
            while (val_int * scale) % multiplier != 0:
                scale *= 10
            result_int = (val_int * scale) // multiplier
            total_dec = val_dec + len(str(scale)) - 1
            if total_dec == 0:
                answer = str(result_int)
            else:
                s = str(result_int).zfill(total_dec + 1)
                integer_part = s[:-total_dec]
                decimal_part = s[-total_dec:].rstrip('0')
                answer = integer_part + ('.' + decimal_part if decimal_part else '')

            op_desc = f'{value_str} ÷ {multiplier}'

        steps = [
            f'確認換算關係：1 {conv[0]} = {multiplier} {conv[1]}',
            f'列式：{op_desc}',
            f'計算結果',
            f'答案：{answer} {to_unit}',
        ]

        hint_ladder = {
            'level_1': f'想想看 {conv[0]} 和 {conv[1]} 之間的換算關係是什麼？',
            'level_2': f'1 {conv[0]} = {multiplier} {conv[1]}，這題要{"乘" if direction == "forward" else "除"}以 {multiplier}。',
            'level_3': f'列式：{op_desc}，仔細計算。',
            'level_4': f'算完後，反過來換算回去檢查是否正確。',
        }

        problem_text = tpl.format(value=value_str, from_unit=from_unit, to_unit=to_unit)
        parameters = {
            'value': value_str,
            'conversion_index': conv_idx,
            'direction': direction,
            'template_index': tpl_idx,
        }

        return self.build_question(
            topic=self.TOPIC,
            difficulty='easy',
            problem_text=problem_text,
            parameters=parameters,
            correct_answer=answer,
            unit=to_unit,
            steps=steps,
            hint_ladder=hint_ladder,
            validation_rules={
                'answer_type': 'integer_or_decimal',
                'unit': to_unit,
            },
        )

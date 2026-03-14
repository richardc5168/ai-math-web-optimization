"""Base class for all question generators."""
import hashlib
import json
from abc import ABC, abstractmethod
from math import gcd


class BaseGenerator(ABC):
    """Abstract base for rule-based question generators."""

    TOPIC = ''  # Override in subclass
    GRADE = 5

    @abstractmethod
    def generate(self, params=None):
        """Generate a question dict matching the question schema.

        Args:
            params: Optional dict of parameters. If None, generate randomly.

        Returns:
            dict matching question schema.
        """

    def make_id(self, suffix=''):
        prefix = self.TOPIC[:3] if self.TOPIC else 'gen'
        return f'{prefix}_{suffix}' if suffix else f'{prefix}_manual'

    def make_stable_id(self, *, topic, difficulty, problem_text, parameters,
                       correct_answer, unit, steps, hint_ladder,
                       validation_rules, grade):
        prefix = topic[:3] if topic else (self.TOPIC[:3] if self.TOPIC else 'gen')
        payload = {
            'grade': grade,
            'topic': topic,
            'difficulty': difficulty,
            'problem_text': problem_text,
            'parameters': parameters,
            'correct_answer': correct_answer,
            'unit': unit,
            'steps': steps,
            'hint_ladder': hint_ladder,
            'validation_rules': validation_rules,
        }
        encoded = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
        short = hashlib.sha1(encoded.encode('utf-8')).hexdigest()[:8]
        return f'{prefix}_{short}'

    # ---- fraction helpers ----
    @staticmethod
    def gcd(a, b):
        a, b = abs(a), abs(b)
        while b:
            a, b = b, a % b
        return a

    @staticmethod
    def lcm(a, b):
        return a * b // gcd(a, b)

    @staticmethod
    def simplify(n, d):
        g = BaseGenerator.gcd(abs(n), abs(d))
        return n // g, d // g

    @staticmethod
    def frac_str(n, d):
        n, d = BaseGenerator.simplify(n, d)
        if d == 1:
            return str(n)
        return f'{n}/{d}'

    @staticmethod
    def mixed_str(n, d):
        n, d = BaseGenerator.simplify(n, d)
        if abs(n) < d:
            return f'{n}/{d}'
        whole = n // d
        rem = n % d
        if rem == 0:
            return str(whole)
        return f'{whole} {rem}/{d}'

    # ---- decimal helpers (exact) ----
    @staticmethod
    def decimal_add(a_str, b_str):
        """Exact decimal addition via integer arithmetic."""
        a_parts = a_str.split('.')
        b_parts = b_str.split('.')
        a_dec = len(a_parts[1]) if len(a_parts) > 1 else 0
        b_dec = len(b_parts[1]) if len(b_parts) > 1 else 0
        max_dec = max(a_dec, b_dec)
        a_int = int(a_str.replace('.', '')) * (10 ** (max_dec - a_dec))
        b_int = int(b_str.replace('.', '')) * (10 ** (max_dec - b_dec))
        result = a_int + b_int
        if max_dec == 0:
            return str(result)
        s = str(abs(result)).zfill(max_dec + 1)
        sign = '-' if result < 0 else ''
        integer_part = s[:-max_dec]
        decimal_part = s[-max_dec:].rstrip('0')
        if not decimal_part:
            return sign + integer_part
        return sign + integer_part + '.' + decimal_part

    @staticmethod
    def decimal_sub(a_str, b_str):
        """Exact decimal subtraction."""
        a_parts = a_str.split('.')
        b_parts = b_str.split('.')
        a_dec = len(a_parts[1]) if len(a_parts) > 1 else 0
        b_dec = len(b_parts[1]) if len(b_parts) > 1 else 0
        max_dec = max(a_dec, b_dec)
        a_int = int(a_str.replace('.', '')) * (10 ** (max_dec - a_dec))
        b_int = int(b_str.replace('.', '')) * (10 ** (max_dec - b_dec))
        result = a_int - b_int
        if max_dec == 0:
            return str(result)
        s = str(abs(result)).zfill(max_dec + 1)
        sign = '-' if result < 0 else ''
        integer_part = s[:-max_dec]
        decimal_part = s[-max_dec:].rstrip('0')
        if not decimal_part:
            return sign + integer_part
        return sign + integer_part + '.' + decimal_part

    @staticmethod
    def decimal_mul(a_str, b_str):
        """Exact decimal multiplication."""
        a_parts = a_str.split('.')
        b_parts = b_str.split('.')
        a_dec = len(a_parts[1]) if len(a_parts) > 1 else 0
        b_dec = len(b_parts[1]) if len(b_parts) > 1 else 0
        total_dec = a_dec + b_dec
        a_int = int(a_str.replace('.', ''))
        b_int = int(b_str.replace('.', ''))
        result = a_int * b_int
        if total_dec == 0:
            return str(result)
        s = str(abs(result)).zfill(total_dec + 1)
        sign = '-' if result < 0 else ''
        integer_part = s[:-total_dec]
        decimal_part = s[-total_dec:].rstrip('0')
        if not decimal_part:
            return sign + integer_part
        return sign + integer_part + '.' + decimal_part

    def build_question(self, *, topic, difficulty, problem_text, parameters,
                       correct_answer, unit, steps, hint_ladder,
                       validation_rules, qid=None, grade=None):
        """Build a question dict conforming to the schema."""
        resolved_grade = grade or self.GRADE
        return {
            'id': qid or self.make_stable_id(
                topic=topic,
                difficulty=difficulty,
                problem_text=problem_text,
                parameters=parameters,
                correct_answer=correct_answer,
                unit=unit,
                steps=steps,
                hint_ladder=hint_ladder,
                validation_rules=validation_rules,
                grade=resolved_grade,
            ),
            'grade': resolved_grade,
            'topic': topic,
            'difficulty': difficulty,
            'problem_text': problem_text,
            'parameters': parameters,
            'correct_answer': correct_answer,
            'unit': unit,
            'steps': steps,
            'hint_ladder': hint_ladder,
            'validation_rules': validation_rules,
        }

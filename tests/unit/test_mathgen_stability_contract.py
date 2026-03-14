import json
import random
from math import gcd
from pathlib import Path

from mathgen.question_templates.average_word_problem import AverageWordProblemGenerator
from mathgen.question_templates.decimal_word_problem import DecimalWordProblemGenerator
from mathgen.question_templates.fraction_word_problem import FractionWordProblemGenerator
from mathgen.question_templates.unit_conversion import UnitConversionGenerator


ROOT = Path(__file__).resolve().parents[2]
BENCH_DIR = ROOT / "mathgen" / "benchmarks"


GENERATORS = {
    "average_word_problem": AverageWordProblemGenerator,
    "decimal_word_problem": DecimalWordProblemGenerator,
    "fraction_word_problem": FractionWordProblemGenerator,
    "unit_conversion": UnitConversionGenerator,
}


def _load_cases(topic: str):
    return json.loads((BENCH_DIR / f"{topic}_bench.json").read_text(encoding="utf-8"))


def _assert_simplest_fraction(answer: str):
    if "/" not in answer:
        assert "/1" not in answer
        return
    num_text, den_text = answer.split("/", 1)
    numerator = int(num_text)
    denominator = int(den_text)
    assert denominator > 0
    assert gcd(abs(numerator), abs(denominator)) == 1
    assert denominator != 1
    assert "-" not in den_text


def test_same_input_produces_same_output_for_all_benchmarks():
    for topic, generator_cls in GENERATORS.items():
        generator = generator_cls()
        for case in _load_cases(topic):
            first = generator.generate(params=case["input"])
            second = generator.generate(params=case["input"])
            assert first == second, f"{topic} is not deterministic for params={case['input']}"


def test_same_seed_produces_same_random_generation():
    for generator_cls in GENERATORS.values():
        random.seed(20260315)
        first = generator_cls().generate()
        random.seed(20260315)
        second = generator_cls().generate()
        assert first == second


def test_fraction_outputs_stay_in_simplest_form():
    generator = FractionWordProblemGenerator()
    for case in _load_cases("fraction_word_problem"):
        question = generator.generate(params=case["input"])
        _assert_simplest_fraction(question["correct_answer"])

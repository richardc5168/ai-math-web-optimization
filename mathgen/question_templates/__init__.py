from .fraction_word_problem import FractionWordProblemGenerator
from .decimal_word_problem import DecimalWordProblemGenerator
from .average_word_problem import AverageWordProblemGenerator
from .unit_conversion import UnitConversionGenerator

ALL_GENERATORS = {
    'fraction_word_problem': FractionWordProblemGenerator,
    'decimal_word_problem': DecimalWordProblemGenerator,
    'average_word_problem': AverageWordProblemGenerator,
    'unit_conversion': UnitConversionGenerator,
}

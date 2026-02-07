import pytest


def test_check_parenthesized_numeric_expression_equivalence():
    import engine

    if not getattr(engine, "HAS_SYMPY", False):
        pytest.skip("SymPy not installed; SymPy fallback not available")

    assert engine.check("(1/2) + (1/3)", "5/6") == 1
    assert engine.check("(2+3)*4", "20") == 1


def test_check_comma_separated_multi_answers_order_insensitive():
    import engine

    # Pure fraction/integer multi answers should work even without SymPy.
    assert engine.check("1,2", "2,1") == 1
    assert engine.check("1,2", "1,3") == 0


def test_check_rejects_non_numeric_expressions_for_sympy_fallback():
    import engine

    # We intentionally do NOT accept variables/functions in generic numeric checking.
    assert engine.check("x+1", "2") is None

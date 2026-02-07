import pytest


def test_check_symbolic_expression_equivalence_x_only():
    import engine

    if not getattr(engine, "HAS_SYMPY", False):
        pytest.skip("SymPy not installed")

    # Implicit multiplication and xor conversion are supported.
    assert engine.check("2x+2", "2*(x+1)") == 1
    assert engine.check("(x-3)^2", "(x-3)**2") == 1
    assert engine.check("x+1", "x+2") == 0


def test_check_equation_solution_membership():
    import engine

    if not getattr(engine, "HAS_SYMPY", False):
        pytest.skip("SymPy not installed")

    assert engine.check("3", "2*x+3=9") == 1
    assert engine.check("4", "2*x+3=9") == 0


def test_check_symbolic_rejects_unsafe_or_other_symbols():
    import engine

    if not getattr(engine, "HAS_SYMPY", False):
        pytest.skip("SymPy not installed")

    # Disallowed dunder pattern
    assert engine.check("x__class__", "x") is None
    # Disallow symbols other than x
    assert engine.check("y+1", "y+1") is None

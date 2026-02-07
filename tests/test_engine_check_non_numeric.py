import pytest


def test_check_time_hhmm_normalization():
    import engine

    assert engine.check("3:50", "03:50") == 1
    assert engine.check("03:5", "03:05") == 1
    assert engine.check("23:60", "23:59") is None
    assert engine.check("05:00", "04:00") == 0


def test_check_month_answer():
    import engine

    assert engine.check("4", "4月") == 1
    assert engine.check("04", "4月") == 1
    assert engine.check("5月", "4月") == 0


def test_check_categorical_prime_composite_and_yes_no():
    import engine

    assert engine.check("质数", "質數") == 1
    assert engine.check("合数", "合數") == 1
    assert engine.check("yes", "是") == 1
    assert engine.check("否", "是") == 0


def test_check_trend_words():
    import engine

    assert engine.check("下降", "下降") == 1
    assert engine.check("down", "下降") == 1
    assert engine.check("上升", "下降") == 0


def test_check_simple_equality_statement_order_insensitive():
    import engine

    assert engine.check("PF=PB", "PB=PF") == 1
    assert engine.check("PF = PB", "PB=PF") == 1
    assert engine.check("PE=PC", "PB=PF") == 0

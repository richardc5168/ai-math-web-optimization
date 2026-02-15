from learning.datasets import load_dataset, get_skill_weight


def test_load_mock_dataset():
    bp = load_dataset("mock_exam")
    assert bp.name == "mock_exam"
    assert bp.skill_weights["分數/小數"] == 1.4
    assert get_skill_weight(bp, "不存在") == 1.0

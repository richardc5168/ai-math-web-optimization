# Verify Stability

在任何 commit 前執行完整穩定性檢查：
- `npm run verify:all`
- `python tools/validate_all_elementary_banks.py`
- `python scripts/verify_all.py`
- `python mathgen/scripts/run_full_cycle.py --changes "..."`
- `python -m pytest tests/unit/test_mathgen_stability_contract.py -q`

要求：
- 所有 stdout/stderr 寫入 `artifacts/run_10h/<run_id>/logs/`
- 將結果摘要寫入 `artifacts/run_10h/final_summary.md`
- 若失敗，記錄 root cause、證據、下一步行動，避免空泛描述

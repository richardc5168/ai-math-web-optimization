from copy import deepcopy


ERROR_CATEGORY_ALIASES = {
    'answer_format_drift': 'benchmark_contract_drift',
}


FIX_RECIPE_REGISTRY = {
    'hint_leaks_answer': {
        'allowed_edit_scope': [
            'mathgen/question_templates/*.py',
            'mathgen/validators/hint_validator.py',
            'mathgen/benchmarks/*_bench.json',
            'tests/unit/test_mathgen_stability_contract.py',
            'tests/unit/test_issue_queue_builder.py',
        ],
        'mandatory_pre_test': [
            'Add a failing hint-level assertion or benchmark case for the exact leak shape.',
            'python mathgen/scripts/run_benchmarks.py --topic <topic>',
        ],
        'mandatory_post_test': [
            'python mathgen/scripts/run_benchmarks.py --topic <topic>',
            'python mathgen/scripts/run_full_cycle.py',
            'python -m pytest tests/unit/test_mathgen_stability_contract.py -q',
        ],
        'forbidden_shortcuts': [
            'Do not redact the final answer string without fixing the hint template structure.',
            'Do not weaken or delete hint leak assertions to make the gate pass.',
            'Do not change benchmark expected_answer to hide a leaking hint bug.',
        ],
        'recommended_diff_pattern': [
            'Add the failing hint benchmark or assertion first.',
            'Rewrite the leaking hint level to reference intermediate quantities or operations instead of the final value.',
            'Rerun topic benchmark and full cycle before accepting the patch.',
        ],
        'rollback_condition': [
            'Rollback if any hint level still contains the final answer verbatim.',
            'Rollback if the fix introduces wrong_numeric_answer or benchmark_contract_drift regressions.',
        ],
        'strategy_catalog': [
            {
                'key': 'intermediate_scaffold',
                'summary': 'Replace answer-bearing hint lines with intermediate-step scaffolding.',
                'keywords': ['intermediate', 'scaffold', 'step', 'answer-bearing'],
            },
            {
                'key': 'derive_from_operands',
                'summary': 'Derive level 3 hints from operands or sub-results, never from the final answer text.',
                'keywords': ['operand', 'sub-result', 'derive', 'level 3'],
            },
            {
                'key': 'validator_first',
                'summary': 'Add or tighten hint validator coverage before touching template text.',
                'keywords': ['validator', 'assertion', 'coverage', 'benchmark'],
            },
        ],
        'recommended_strategy_order': ['validator_first', 'intermediate_scaffold', 'derive_from_operands'],
    },
    'wrong_unit': {
        'allowed_edit_scope': [
            'mathgen/question_templates/unit_conversion.py',
            'mathgen/validators/answer_verifier.py',
            'mathgen/benchmarks/unit_conversion_bench.json',
            'tests/unit/test_issue_queue_builder.py',
        ],
        'mandatory_pre_test': [
            'Add a topic benchmark case covering the failing unit pair and wording.',
            'python mathgen/scripts/run_benchmarks.py --topic unit_conversion',
        ],
        'mandatory_post_test': [
            'python mathgen/scripts/run_benchmarks.py --topic unit_conversion',
            'python mathgen/scripts/run_full_cycle.py',
        ],
        'forbidden_shortcuts': [
            'Do not patch only the displayed unit text while leaving generator metadata inconsistent.',
            'Do not swap benchmark expectation units without checking the conversion table contract.',
        ],
        'recommended_diff_pattern': [
            'Add a failing unit consistency case.',
            'Align conversion table, wording, and verifier unit expectations in one focused patch.',
            'Rerun unit_conversion benchmark and full cycle.',
        ],
        'rollback_condition': [
            'Rollback if any conversion direction or unit label becomes inconsistent.',
            'Rollback if wrong_numeric_answer appears in the same topic after the unit fix.',
        ],
        'strategy_catalog': [
            {
                'key': 'align_conversion_contract',
                'summary': 'Align generator conversion metadata and verifier contract before editing wording.',
                'keywords': ['align', 'conversion', 'metadata', 'contract'],
            },
            {
                'key': 'wiring_consistency_assertion',
                'summary': 'Add consistency assertions tying units, wording, and expected answer together.',
                'keywords': ['consistency', 'assertion', 'unit', 'wording'],
            },
            {
                'key': 'benchmark_repair_from_table',
                'summary': 'Repair benchmark unit expectations from the published conversion table, not from guesswork.',
                'keywords': ['benchmark', 'table', 'published', 'expectation'],
            },
        ],
        'recommended_strategy_order': ['wiring_consistency_assertion', 'align_conversion_contract', 'benchmark_repair_from_table'],
    },
    'wrong_numeric_answer': {
        'allowed_edit_scope': [
            'mathgen/question_templates/*.py',
            'mathgen/validators/answer_verifier.py',
            'mathgen/benchmarks/*_bench.json',
            'tests/unit/test_mathgen_stability_contract.py',
            'tests/unit/test_issue_queue_builder.py',
        ],
        'mandatory_pre_test': [
            'Add a focused benchmark case reproducing the numeric mismatch.',
            'python mathgen/scripts/run_benchmarks.py --topic <topic>',
        ],
        'mandatory_post_test': [
            'python mathgen/scripts/run_benchmarks.py --topic <topic>',
            'python mathgen/scripts/run_full_cycle.py',
            'python -m pytest tests/unit/test_mathgen_stability_contract.py -q',
        ],
        'forbidden_shortcuts': [
            'Do not change expected_answer by hand unless it is regenerated from verifier policy.',
            'Do not use parseFloat-style formatting patches that hide arithmetic bugs.',
        ],
        'recommended_diff_pattern': [
            'Lock the failing arithmetic case with a benchmark or unit test.',
            'Fix generator arithmetic or normalization at the source.',
            'Recheck verifier formatting against the repaired output.',
        ],
        'rollback_condition': [
            'Rollback if the same case still fails numeric verification.',
            'Rollback if answer_format_drift or determinism_violation appears after the fix.',
        ],
        'strategy_catalog': [
            {
                'key': 'verifier_policy_first',
                'summary': 'Generate expected answers from verifier policy before changing generator logic.',
                'keywords': ['verifier', 'policy', 'expected', 'format'],
            },
            {
                'key': 'integer_arithmetic_only',
                'summary': 'Replace floating or stringy arithmetic with integer-safe normalization.',
                'keywords': ['integer', 'arithmetic', 'normalization', 'float'],
            },
            {
                'key': 'template_contract_alignment',
                'summary': 'Align template selector semantics with benchmark assumptions.',
                'keywords': ['template', 'selector', 'semantic', 'alignment'],
            },
        ],
        'recommended_strategy_order': ['verifier_policy_first', 'integer_arithmetic_only', 'template_contract_alignment'],
    },
    'benchmark_contract_drift': {
        'allowed_edit_scope': [
            'mathgen/benchmarks/*_bench.json',
            'mathgen/scripts/run_benchmarks.py',
            'mathgen/validators/answer_verifier.py',
            'mathgen/question_templates/*.py',
            'tests/unit/test_issue_queue_builder.py',
        ],
        'mandatory_pre_test': [
            'Add a contract regression test or benchmark case tying verifier output to benchmark expectations.',
            'python mathgen/scripts/run_benchmarks.py --topic <topic>',
        ],
        'mandatory_post_test': [
            'python mathgen/scripts/run_benchmarks.py --topic <topic>',
            'python mathgen/scripts/run_full_cycle.py',
        ],
        'forbidden_shortcuts': [
            'Do not normalize benchmark selectors or expected answers by guesswork.',
            'Do not expand template indices without proving the generator contract changed intentionally.',
        ],
        'recommended_diff_pattern': [
            'Capture the contract mismatch with a focused case.',
            'Choose one truth source: published verifier policy or published generator selector contract.',
            'Repair either the benchmark or generator so both sides agree, then rerun the topic and full cycle.',
        ],
        'rollback_condition': [
            'Rollback if the repair only moves the drift to another topic or answer format.',
            'Rollback if a benchmark selector now aliases to different semantics under modulo wrap.',
        ],
        'strategy_catalog': [
            {
                'key': 'contract_test_first',
                'summary': 'Add a contract regression tying verifier output and benchmark expectation together.',
                'keywords': ['contract', 'regression', 'verifier', 'expectation'],
            },
            {
                'key': 'normalize_selectors_to_contract',
                'summary': 'Normalize benchmark selectors to the existing generator contract instead of creating accidental aliases.',
                'keywords': ['normalize', 'selector', 'alias', 'contract'],
            },
            {
                'key': 'expand_generator_intentionally',
                'summary': 'Expand generator template coverage only when the published contract is intentionally widened.',
                'keywords': ['expand', 'generator', 'coverage', 'widen'],
            },
        ],
        'recommended_strategy_order': ['contract_test_first', 'normalize_selectors_to_contract', 'expand_generator_intentionally'],
    },
    'determinism_violation': {
        'allowed_edit_scope': [
            'mathgen/question_templates/base.py',
            'mathgen/question_templates/*.py',
            'tests/unit/test_mathgen_stability_contract.py',
            'tests/unit/test_issue_queue_builder.py',
        ],
        'mandatory_pre_test': [
            'Add a deterministic replay assertion for the exact generator path.',
            'python -m pytest tests/unit/test_mathgen_stability_contract.py -q',
        ],
        'mandatory_post_test': [
            'python -m pytest tests/unit/test_mathgen_stability_contract.py -q',
            'python mathgen/scripts/run_full_cycle.py --gate-only',
        ],
        'forbidden_shortcuts': [
            'Do not silence nondeterminism by loosening tests or removing ids.',
            'Do not add runtime randomness, uuid, or time-based identifiers to generated content.',
        ],
        'recommended_diff_pattern': [
            'Add a deterministic replay test first.',
            'Replace non-seeded randomness with seed-derived or content-hash logic.',
            'Re-run deterministic tests and gate-only cycle.',
        ],
        'rollback_condition': [
            'Rollback if identical seed and input still produce different output.',
            'Rollback if stable ids break downstream contract or traceability.',
        ],
        'strategy_catalog': [
            {
                'key': 'seed_or_hash_ids',
                'summary': 'Replace nondeterministic ids with seed-derived or content-hash ids.',
                'keywords': ['seed', 'hash', 'id', 'deterministic'],
            },
            {
                'key': 'freeze_random_source',
                'summary': 'Route all generator randomness through a seeded random source.',
                'keywords': ['random', 'seeded', 'source', 'rng'],
            },
            {
                'key': 'replay_assertion_first',
                'summary': 'Create replay assertions before touching generator state.',
                'keywords': ['replay', 'assertion', 'state', 'test'],
            },
        ],
        'recommended_strategy_order': ['replay_assertion_first', 'seed_or_hash_ids', 'freeze_random_source'],
    },
    'report_truthfulness': {
        'allowed_edit_scope': [
            'scripts/run_10h_local.ps1',
            'mathgen/reports/*.md',
            'mathgen/fail_clusterer.py',
            'mathgen/scripts/run_full_cycle.py',
            'tests/unit/test_issue_queue_builder.py',
        ],
        'mandatory_pre_test': [
            'Add an assertion that report wording and counts derive from the actual mode and results.',
            'python mathgen/scripts/run_full_cycle.py --gate-only',
        ],
        'mandatory_post_test': [
            'python mathgen/scripts/run_full_cycle.py',
            'python scripts/verify_all.py',
        ],
        'forbidden_shortcuts': [
            'Do not hardcode pass counts, mode labels, or summary claims.',
            'Do not claim full gate success from a baseline-only run.',
        ],
        'recommended_diff_pattern': [
            'Pin the misleading summary with a focused assertion.',
            'Derive wording and totals from actual command results and mode.',
            'Regenerate reports and verify them against the run artifacts.',
        ],
        'rollback_condition': [
            'Rollback if summary wording can still overstate pass status.',
            'Rollback if generated counts diverge from actual benchmark totals.',
        ],
        'strategy_catalog': [
            {
                'key': 'derive_from_actual_results',
                'summary': 'Compute report wording and counts from the actual result set, never constants.',
                'keywords': ['derive', 'actual', 'result', 'count'],
            },
            {
                'key': 'mode_specific_assertions',
                'summary': 'Add mode-specific assertions for baseline versus full verify summaries.',
                'keywords': ['mode', 'baseline', 'full', 'summary'],
            },
            {
                'key': 'generated_report_audit',
                'summary': 'Audit generated markdown or cluster reports against the source metrics.',
                'keywords': ['generated', 'report', 'audit', 'metrics'],
            },
        ],
        'recommended_strategy_order': ['mode_specific_assertions', 'derive_from_actual_results', 'generated_report_audit'],
    },
    'sorting_semantics': {
        'allowed_edit_scope': [
            'scripts/*.py',
            'tools/*.py',
            'docs/report/index.html',
            'tests/unit/test_issue_queue_builder.py',
        ],
        'mandatory_pre_test': [
            'Add an ordering regression test using raw unsorted events.',
            'python scripts/verify_all.py',
        ],
        'mandatory_post_test': [
            'python scripts/verify_all.py',
            'npm run verify:all',
        ],
        'forbidden_shortcuts': [
            'Do not sort after slicing when the requirement is latest N events.',
            'Do not sort summary snapshots as if they were raw event logs.',
        ],
        'recommended_diff_pattern': [
            'Create a regression fixture with out-of-order events.',
            'Move sorting to the raw event stage before slice, group, or aggregation.',
            'Verify UI and report outputs preserve the intended ordering.',
        ],
        'rollback_condition': [
            'Rollback if latest-N behavior still differs from raw timestamp order.',
            'Rollback if dedupe or grouping changes reorder user-visible results incorrectly.',
        ],
        'strategy_catalog': [
            {
                'key': 'sort_before_slice',
                'summary': 'Sort raw events before slice or aggregation.',
                'keywords': ['sort', 'before', 'slice', 'event'],
            },
            {
                'key': 'timestamp_source_of_truth',
                'summary': 'Use one canonical timestamp key across the full pipeline.',
                'keywords': ['timestamp', 'source of truth', 'canonical', 'order'],
            },
            {
                'key': 'ordering_fixture_first',
                'summary': 'Lock ordering semantics with a fixture before refactoring.',
                'keywords': ['ordering', 'fixture', 'regression', 'test'],
            },
        ],
        'recommended_strategy_order': ['ordering_fixture_first', 'sort_before_slice', 'timestamp_source_of_truth'],
    },
    'identity_key_mismatch': {
        'allowed_edit_scope': [
            'scripts/*.py',
            'tools/*.py',
            'docs/report/index.html',
            'tests/unit/test_issue_queue_builder.py',
        ],
        'mandatory_pre_test': [
            'Add a join or merge regression test proving mismatched keys reproduce the bug.',
            'python scripts/verify_all.py',
        ],
        'mandatory_post_test': [
            'python scripts/verify_all.py',
            'npm run verify:all',
        ],
        'forbidden_shortcuts': [
            'Do not patch only the UI label when the mismatch originates in the data layer.',
            'Do not join heterogeneous ids without defining one canonical identity key.',
        ],
        'recommended_diff_pattern': [
            'Capture the mismatch with a failing join fixture.',
            'Normalize one canonical identity key at ingest or adapter boundaries.',
            'Audit every downstream merge to use the canonical key.',
        ],
        'rollback_condition': [
            'Rollback if downstream reports still combine records under mixed identities.',
            'Rollback if a normalized key drops or duplicates records.',
        ],
        'strategy_catalog': [
            {
                'key': 'canonical_key_normalization',
                'summary': 'Introduce one canonical key and convert all sources into it at the boundary.',
                'keywords': ['canonical', 'key', 'normalize', 'boundary'],
            },
            {
                'key': 'join_contract_assertion',
                'summary': 'Add assertions around joins and dedupe rules before refactoring.',
                'keywords': ['join', 'contract', 'assertion', 'dedupe'],
            },
            {
                'key': 'adapter_layer_fix',
                'summary': 'Repair key mismatches in adapters instead of scattering conditionals downstream.',
                'keywords': ['adapter', 'layer', 'downstream', 'conditional'],
            },
        ],
        'recommended_strategy_order': ['join_contract_assertion', 'canonical_key_normalization', 'adapter_layer_fix'],
    },
}


def resolve_recipe_category(category: str):
    return ERROR_CATEGORY_ALIASES.get(category, category)


def get_fix_recipe(category: str):
    resolved = resolve_recipe_category(category)
    recipe = FIX_RECIPE_REGISTRY.get(resolved)
    if recipe is None:
        return None
    payload = deepcopy(recipe)
    payload['category'] = resolved
    return payload


def registry_to_payload():
    return {
        'registry_version': '2026-03-15.fix-recipes.v1',
        'aliases': deepcopy(ERROR_CATEGORY_ALIASES),
        'recipes': {key: deepcopy(value) for key, value in sorted(FIX_RECIPE_REGISTRY.items())},
    }


def registry_to_markdown():
    lines = ['# Fix Recipe Registry', '', '- registry_version: 2026-03-15.fix-recipes.v1', '']
    for category, recipe in sorted(FIX_RECIPE_REGISTRY.items()):
        lines.append(f'## {category}')
        lines.append('')
        lines.append('### allowed_edit_scope')
        lines.extend(f'- {item}' for item in recipe['allowed_edit_scope'])
        lines.append('')
        lines.append('### mandatory_pre_test')
        lines.extend(f'- {item}' for item in recipe['mandatory_pre_test'])
        lines.append('')
        lines.append('### mandatory_post_test')
        lines.extend(f'- {item}' for item in recipe['mandatory_post_test'])
        lines.append('')
        lines.append('### forbidden_shortcuts')
        lines.extend(f'- {item}' for item in recipe['forbidden_shortcuts'])
        lines.append('')
        lines.append('### recommended_diff_pattern')
        lines.extend(f'- {item}' for item in recipe['recommended_diff_pattern'])
        lines.append('')
        lines.append('### rollback_condition')
        lines.extend(f'- {item}' for item in recipe['rollback_condition'])
        lines.append('')
        lines.append('### strategy_catalog')
        for strategy in recipe['strategy_catalog']:
            lines.append(f"- {strategy['key']}: {strategy['summary']}")
        lines.append('')
    return '\n'.join(lines) + '\n'

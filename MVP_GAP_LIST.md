# MVP Gap List — Monetization Validation MVP

> Last updated: 2026-03-09 (Post Sprint — Phases 2-7)
> Purpose: Track actionable gaps blocking paid conversion, retention, parent value, and future expansion.

## 1. 阻礙付費轉換的缺口

| # | Gap | Severity | Status | Fix |
|---|-----|----------|--------|-----|
| G1 | 5/5 A/B tests wired + conversion tracking | P0 | ✅ CLOSED | Phase 2+6+7: free_limit via getLimit(); pain_order + star_pack_position on landing; hero_cta + trial_btn_color already wired; trackConversion on all 5 |
| G2 | Landing page CTAs fire click events | P0 | ✅ CLOSED | Phase 6: 7 CTA selectors tracked (hero, report, child, parent, mode, nav, star_pack) |
| G3 | No real payment gateway | P1 | ⬜ OPEN | Phase 2: integrate ECPay/LinePay |
| G4 | Subscription in localStorage only | P1 | ⬜ OPEN | Phase 2: server-side with Gist or Supabase |
| G5 | `completion_upsell.js` only triggers on empire modules | P2 | ⬜ OPEN | Extend to standard modules |

## 2. 阻礙留存追蹤的缺口

| # | Gap | Severity | Status | Fix |
|---|-----|----------|--------|-----|
| R1 | `return_next_day` / `return_next_week` events | P0 | ✅ CLOSED | Phase 3: implemented in analytics.js via lastVisit localStorage |
| R2 | `session_complete` event | P1 | ✅ CLOSED | Phase 3: fires on beforeunload with duration_sec |
| R3 | `question_start` event | P1 | ✅ CLOSED | Phase 3: fires in daily_limit_wire.js on btnNew click |
| R4 | `retry_start` event | P2 | ⬜ OPEN | No retry-same-question UX exists yet |
| R5 | All analytics in localStorage → data loss risk | P1 | ⬜ OPEN | Phase 2: batch export to Gist/API |
| R6 | No `topic` / `grade` enrichment on events | P2 | ⬜ OPEN | Add to attempt_telemetry bridge |

## 3. 阻礙家長感知價值的缺口

| # | Gap | Severity | Status | Fix |
|---|-----|----------|--------|-----|
| P1 | `weekly_report_view` event fires correctly | P0 | ✅ CLOSED | Verified in parent-report/index.html |
| P2 | `remedial_recommendation_click` tracked | P1 | ✅ CLOSED | Phase 3: onclick events on recommendation links with topic data |
| P3 | "比上週進步/退步" trend card | P1 | ✅ CLOSED | Phase 5: week-over-week comparison with delta arrows |
| P4 | Star pack per-pack progress indicators | P1 | ✅ CLOSED | Phase 4: progress bars + completion event |
| P5 | GIST_PAT exposed in client-side JS | P0 | ⬜ OPEN | Move to environment variable or backend proxy |

## 4. 阻礙擴充到更多年級的缺口

| # | Gap | Severity | Status | Fix |
|---|-----|----------|--------|-----|
| E1 | Grade detection hardcoded to G5 | P2 | ⬜ OPEN | Add grade param to question schema |
| E2 | Module naming not grade-parameterized | P2 | ⬜ OPEN | Future: `fraction-g{N}` pattern |
| E3 | No question bank import pipeline for new grades | P2 | ⬜ OPEN | Need template→bank generator |

## Sprint Summary

```
Closed: 11/18 gaps (61%)
├─ P0: 4/5 closed (G1, G2, R1, P1) — GIST_PAT remains open
├─ P1: 5/7 closed (R2, R3, P2, P3, P4) — G3, R5 remain open
└─ P2: 0/6 closed — all deferred to Month 2

Remaining P0: P5 (GIST_PAT security)
Remaining P1: G3 (real payment), G4 (server subscription), R5 (analytics backend)
```

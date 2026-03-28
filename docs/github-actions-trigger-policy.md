# GitHub Actions 觸發策略 (Trigger Policy)

> 更新日期: 2026-03-28

## 原則

本 repo 的 agent / autotune / command workflows **不再依賴高頻自動輪詢 (cron schedule)**。
主控制權改由：
- VS Code chat / Copilot / Claude 對話框手動下指令
- `workflow_dispatch` 手動執行
- 真正必要的 GitHub issue 事件

## Workflow 觸發模式

| Workflow | File | Triggers | 說明 |
|----------|------|----------|------|
| Verify All + Scorecard | `ci.yml` | `push main`, `PR`, `workflow_dispatch` | 事件驅動，push/PR 自動觸發 |
| Issue Command Poller | `issue-command-poller.yml` | `issues [opened/edited/labeled]`, `workflow_dispatch` | issue 事件驅動，可手動補漏 |
| Hourly Command Runner | `hourly-command-runner.yml` | `workflow_dispatch` only | 手動觸發，不再自動 |
| Autonomous Optimizer | `autonomous-optimizer.yml` | `push ops/agent_tasks.json`, `workflow_dispatch` | 重型工作，僅手動或任務佇列觸發 |
| Nightly Hint Autotune | `nightly-autotune.yml` | `workflow_dispatch` only | 手動觸發 |
| Question Pipeline CI | `question_pipeline.yml` | `push main` (特定路徑), `PR`, `workflow_dispatch` | 事件驅動 |
| Deploy GitHub Pages | `pages.yml` | `push main`, `workflow_dispatch` | 事件驅動，不需調整 |

## 被停用的 Schedule

| Workflow | 原本 Cron | 估計每日觸發次數 | 估計每日浪費 |
|----------|----------|----------------|-------------|
| `hourly-command-runner.yml` | `*/30 * * * *` (48次/天) | ~96 min/天 | 大部分時間沒有待執行命令 |
| `issue-command-poller.yml` | `*/5 * * * *` (288次/天) | ~144 min/天 | issue 事件已足夠觸發 |
| `autonomous-optimizer.yml` | `15 */4 * * *` (6次/天) | ~360+ min/天 | 重型工作不應自動觸發 |
| `nightly-autotune.yml` | `30 18 * * *` (1次/天) | ~30 min/天 | 不需每日自動跑 |
| `ci.yml` | `0 18 * * *` (1次/天) | ~10 min/天 | push 已觸發 CI |

**總計每日節省約 640+ minutes。**

## 手動觸發方式

```bash
# 透過 gh CLI
gh workflow run "hourly-command-runner" --repo richardc5168/ai-math-web-optimization
gh workflow run "Issue Command Poller" --repo richardc5168/ai-math-web-optimization
gh workflow run "Nightly Hint Autotune PR" --repo richardc5168/ai-math-web-optimization
gh workflow run "Autonomous Optimizer (Cloud)" --repo richardc5168/ai-math-web-optimization

# 或透過 GitHub web UI → Actions → 選擇 workflow → Run workflow
# 或透過 VS Code chat 指示 agent 執行
```

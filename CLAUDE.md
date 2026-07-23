# CLAUDE.md

本项目的 agent 操作约定统一维护在 **[`AGENTS.md`](./AGENTS.md)**，请以那份为准。
能力清单、回路图、铁律均在 AGENTS.md，不在本文件重复维护（避免双源漂移）。

速查（详见 AGENTS.md）：

- **第一原则**：LLM 负责判断，脚本负责纪律。
- **新建项目**：`node tools/new-project.mjs <id>`（或 `/new`）。
- **回路接力**：`@user-insight` / `@competitor-teardown` → `@assumption-xray` → `@experiment-design` → 跑实验 → `@evidence-intake` → `/review` → `/decide` →（pivot 时）`@revise-thesis`。
- **铁律**：任何 `ledger.json` 改动结束后必须跑 `node tools/validate.mjs workspace/<id>/ledger.json`（validator 会打印裸奔/过期/待 sign-off 并提示下一步 skill）；ID 交脚本分配；`≥L3` 或状态变更需人工 sign-off。
- 触发某 skill 前先读对应 `skills/<name>/SKILL.md`；动内核前先读 `kernel/writeback-contract.md`。

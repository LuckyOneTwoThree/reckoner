# CLAUDE.md

本项目的 agent 操作约定统一维护在 **[`AGENTS.md`](./AGENTS.md)**，请以那份为准。

速查（详见 AGENTS.md）：

- **第一原则**：LLM 负责判断，脚本负责纪律。
- **新建项目**：`node tools/new-project.mjs <id>`（或 `/new`）。
- **主力能力**：`@assumption-xray`（照妖镜）/ `@user-insight` / `@competitor-teardown` / `@evidence-intake`。
- **每周确认**：`/review`。
- **铁律**：任何 `ledger.json` 改动结束后必须跑 `node tools/validate.mjs workspace/<id>/ledger.json`；ID 交脚本分配；`≥L3` 或状态变更需人工 sign-off。
- 触发某 skill 前先读对应 `skills/<name>/SKILL.md`；动内核前先读 `kernel/writeback-contract.md`。

# AGENTS.md — Playbook 使用约定

> 本文件是给 **AI agent**（Codex / Cowork / Claude Code 等）读的操作说明。
> 人类用户用自然语言即可，agent 负责按本文件把想法变成对内核的读写。

## 这个仓库是什么

一个 PM 决策内核 + skill 插件包。核心不是生成文档，而是**每个 skill 跑完都把结论回写内核**（`thesis` + `assumption-ledger`），跨会话积累用户的假设、证据与到期项。

## 你的第一原则

**LLM 负责判断，脚本负责纪律。** 你（agent）做拆解、攻击、归类、写作；确定性的校验和 ID 分配交给 `tools/*.mjs`，不要靠脑补代替。

## 目录地图

- `kernel/` — 数据模型与契约（真 IP）。改内核前先读 `kernel/writeback-contract.md`。
  - `thesis.schema.json` / `assumption-ledger.schema.json` — 结构，回写必须符合。
  - `writeback-contract.md` — 回写规范、分级 sign-off、循环状态机。**动内核前必读。**
  - `templates/thesis.md` — 论点模板。
- `skills/<name>/SKILL.md` — 原子能力，含 frontmatter（name/description/reads/writes/eval）。触发某能力时**先读对应 SKILL.md 再执行**。
- `commands/*.md` — 斜杠命令流程（`/new`、`/review`）。
- `tools/*.mjs` — 零依赖 node 脚本（`new-project.mjs`、`validate.mjs`）。
- `workspace/<project-id>/` — 每个项目一个隔离文件夹（`thesis.md` + `ledger.json` + `sources/`）。

## 能力清单（何时用哪个）

| 用户意图 | 触发 | 你要做的 |
|---|---|---|
| 新建项目 | `/new` 或 “建个项目 X” | 跑 `node tools/new-project.mjs <id>`，引导填 `thesis.md` |
| 压力测试想法 / 挑战假设 / 备评审 | `@assumption-xray` | 读 `skills/assumption-xray/SKILL.md`，输出红队表，回写台账 |
| 理解用户 / 访谈综合 | `@user-insight` | 读该 SKILL.md，产出洞察，回写相关假设 |
| 拆竞品 | `@competitor-teardown` | 读该 SKILL.md，产出拆解，回写 B/C 类假设 |
| 录入证据（访谈/数据/链接） | `@evidence-intake` | 读该 SKILL.md，把证据存入 `sources/`，升级相关假设证据等级 |
| 每周确认强声明 | `/review` | 读 `commands/review.md`，逐条 sign-off |

## 铁律（每次回写都要守）

1. **写台账前后都跑校验**：任何对 `ledger.json` 的改动，结束时必须 `node tools/validate.mjs workspace/<id>/ledger.json`，通过才算完成。
2. **ID 交给脚本**：新假设 `id` 留空，由 validator 按 `<TYPE>-NN` 分配；不要自己编号。
3. **证据等级有上限**：`evidenceLevel` 不得高于来源 `provenance.reliability` 的上限（self≤L1 / indirect≤L2 / direct≤L3 / data≤L4）。
4. **分级 sign-off**：结构性改动和 ≤L2 自动落库；`≥L3` 或 `status→validated/refuted` 必须走 `/review` 人工确认，不要自作主张标已验证。
5. **循环状态机**：某承重假设 `status→refuted` 时，给关联 `thesis.needsRevision=true` 并提示修订，别默默改论点。
6. **裸奔/过期是算出来的**：`isNaked`、`stale` 由 validator 计算，不落盘，不要手写进 JSON。
7. **多项目隔离**：只动当前 `workspace/<id>/`，ID 项目内编号，别跨项目串写。

## 环境差异

- **Claude Code / Cowork**：`skills/` 与斜杠命令原生自动发现，直接 `@skill` / `/command`。
- **Codex**：先读本文件建立上下文；skill 通过读对应 `SKILL.md` 执行，脚本通过 shell 跑。功能一致，只是发现方式需本文件引导。

## 不要做

- 不要把 `<database>`/外部长文照搬进 skill 输出。
- 不要跳过 validator 直接宣称台账已更新。
- 不要打稻草人：攻 steelman 或不攻。
- 不要新增 Phase 1.5+ 的对象（personal 层 / OST / decision-log），除非用户明确要求——见 `docs/ARCHITECTURE.md` 的触发条件。

# AGENTS.md — Playbook 使用约定

> 本文件是给 **AI agent**（Codex / Cowork / Claude Code 等）读的操作说明。
> 人类用户用自然语言即可，agent 负责按本文件把想法变成对内核的读写。

## 这个仓库是什么

一个 PM 决策内核 + skill 插件包。核心不是生成文档，而是**每个 skill 跑完都把结论回写内核**（`thesis` + `assumption-ledger`），跨会话积累用户的假设、证据与到期项。

## 你的第一原则

**LLM 负责判断，脚本负责纪律。** 你（agent）做拆解、攻击、归类、写作；确定性的校验和 ID 分配交给 `tools/*.mjs`，不要靠脑补代替。

## 内核回路（skill 之间怎么接）

skill 虽各自独立（standalone-first），但产出都只是“回路里的一环”，不是终点。默认接力顺序：

```
/new 填 thesis
   → @assumption-xray                        （红队：点名裸奔 + 每条最便宜验证）
   ↑ 若已有访谈/竞品数据，可先跑 @user-insight / @competitor-teardown 丰富 A/B·C 证据面（可选增强，非必经）
   → @experiment-design                       （cheapest test → 可追踪实验规格，status→testing）
   → 跑实验
   → @evidence-intake                        （落回台账：升级 / 反驳）
   → /review                                 （强声明 sign-off）
   → /decide                                  （go / pivot / kill + 理由，写 decisions.md）
   → 若承重假设被反驳 / 决定 pivot → @revise-thesis（结构化修订论点，闭合循环）
```

> **入料口定位**：@user-insight / @competitor-teardown 是**可选增强**而非必经——thesis 第6格「最致命假设」自带种子假设时可直接 @assumption-xray 红队（ADR #7 standalone-first）。入料口价值在于把 self/L1 证据拉高到 direct/L3，不是「不跑就没 A/B/C 类假设」（xray 自己也会归类 A/B/C/D）。

**任何 skill 收尾时，“下一步”只能指向回路里的下一个节点，不能跳到方案 / MVP / 原型 / 排期。** 造东西是回路之外的事，前提是承重假设已经过红队 + sign-off。

## 目录地图

- `kernel/` — 数据模型与契约（真 IP）。改内核前先读 `kernel/writeback-contract.md`。
 - `thesis.schema.json` / `assumption-ledger.schema.json` — 结构，回写必须符合。
 - `writeback-contract.md` — 回写规范、分级 sign-off、循环状态机。**动内核前必读。**
 - `templates/thesis.md` — 论点模板。
- `skills/<name>/SKILL.md` — 原子能力，含 frontmatter（顶层 `name`/`description` + `metadata` 块下 `reads`/`writes`/`eval`）。触发某能力时**先读对应 SKILL.md 再执行**。
- `commands/*.md` — 斜杠命令流程（`/new`、`/list`、`/review`、`/decide`、`/retro`、`/lookup`）。
- `tools/*.mjs` — 零依赖 node 脚本（`new-project.mjs`、`validate.mjs`、`migrate.mjs`、`lookup.mjs`）。
- `workspace/<project>/` — 每个项目一个隔离文件夹（`thesis.md` + `ledger.json` + `sources/`）。

## 能力清单（何时用哪个）

| 用户意图 | 触发 | 你要做的 | 回路下一站 |
|---|---|---|---|
| 新建项目 | `/new` 或 “建个项目 X” | 跑 `node tools/new-project.mjs <name>`，引导填 `thesis.md` | @assumption-xray（或先跑 @user-insight / @competitor-teardown 丰富证据面）|
| 列出/切换项目、忘了项目名 | `/list` | 读 `commands/list.md`，列出所有项目+一句话论点，先挑对项目 | 回显当前项目路径后进回路 |
| 压力测试想法 / 挑战假设 / 备评审 | `@assumption-xray` | 读 SKILL.md，输出红队表，回写台账 | @experiment-design → @evidence-intake |
| 设计验证实验 / 把“该测什么”变“怎么测” | `@experiment-design` | 读 SKILL.md，把裸奔假设的最便宜验证写成实验规格，status→testing | 跑实验 → @evidence-intake |
| 理解用户 / 访谈综合 | `@user-insight` | 读 SKILL.md，产出洞察，回写 A 类假设 | @assumption-xray |
| 拆竞品 | `@competitor-teardown` | 读 SKILL.md，回写 B/C 类假设 | @assumption-xray |
| 录入证据 | `@evidence-intake` | 读 SKILL.md，存 `sources/`，升降级台账 | /review 或 修订 thesis |
| 每周确认强声明 | `/review` | 读 `commands/review.md`，逐条 sign-off | /decide 定 go/pivot/kill |
| 记决策 go/pivot/kill | `/decide` | 读 `commands/decide.md`，写 `decisions.md` 决策日志（含反事实预登记 + git SHA） | go→离开内核 / pivot→@revise-thesis |
| 复盘决策校准 | `/retro` | 读 `commands/retro.md`，取 git-SHA 快照对照当时假设分布 vs 现在结果，读回反事实 | 只读不评，不触发回路动作 |
| 跨项目查历史教训 | `/lookup` | 跑 `node tools/lookup.mjs "<topic>" --current=<当前项目>`，扫全 workspace 按关键词/type/status 检索，硬标 bizModel/stage 维度差异 | agent 只匹配不迁移，是否适用由人判断 |
| 论点被证伪要修订 | `@revise-thesis` | 读 SKILL.md，改 thesis + 追加 revisions[]，复位 needsRevision | @assumption-xray 重新红队 |

## 铁律（每次回写都要守）

1. **写台账前后都跑校验**：任何对 `ledger.json` 的改动，结束时必须 `node tools/validate.mjs workspace/<project>/ledger.json`，通过才算完成。validator 现在也**硬校验 thesis.md 的扁平字段**（schemaVersion=4.1 / id=T-NN / needsRevision=bool）——改了 thesis 也要跑。revisions[] 必须写在 frontmatter，否则软检查抓不到。
2. **ID 交给脚本**：新假设 `id` 留空，由 validator 按 `<TYPE>-NN` 分配；不要自己编号。
3. **证据等级有上限**：`evidenceLevel` 不得高于来源 `provenance.reliability` 的上限（self≤L1 / indirect≤L2 / direct≤L3 / data≤L4）。
4. **分级 sign-off**：结构性改动和 ≤L2 自动落库；`≥L3` 或 `status→validated/refuted` 必须走 `/review` 人工确认，不要自作主张标已验证。`signedOffBy` 格式：人工写人名/邮箱本地名，agent 代批写 `agent:<skill或命令名>`，未签字保持 `null`。
5. **循环状态机**：某承重假设 `status→refuted` 时，给关联 `thesis.needsRevision=true` 并提示修订，别默默改论点。状态转移合法性见 `kernel/writeback-contract.md` §4.1。
6. **裸奔/过期是算出来的**：`isNaked`、`stale` 由 validator 计算，不落盘，不要手写进 JSON。
7. **多项目隔离**：动手前先回显 `当前项目: workspace/<project>/` 并确认；只动这个目录，ID 项目内编号，别跨项目串写。**同一会话只做一个项目**——检测到切换项目时，先提示用户开新会话或显式确认再继续（上下文串味是文件隔离堵不住的漏）。
8. **跟着 validator 的下一步提示走**：校验通过后，validator 会打印 `👉 下一步` 启发式（有裸奔→@experiment-design/@evidence-intake；needsRevision→@revise-thesis；待 sign-off→/review；全清→/decide）。这是回路接力的显式提示，别无视它另起方案。

## 环境差异

- **Claude Code / Cowork**：`skills/` 与斜杠命令原生自动发现，直接 `@skill` / `/command`。
- **Codex**：先读本文件建立上下文；skill 通过读对应 `SKILL.md` 执行，脚本通过 shell 跑。功能一致，只是发现方式需本文件引导。

## 不要做

- **不要在假设经红队 + sign-off 前推荐进入方案 / MVP / 原型 / 排期。** 这是最常见的行动偏误漏点：模型会把“访谈完/证据支持”误读成“可以开工”。收尾永远指向内核回路的下一步（红队 / 最便宜验证 / review / 修订论点）。
- **不要把“最便宜验证（cheapestTest）”写成 MVP**——那是最贵的验证之一，方向相反。cheapestTest 是假冒门 / 少量访谈 / 落地页这类最小证伪动作。
- 不要把方法论/外部长文照搬进 skill 输出。
- 不要跳过 validator 直接宣称台账已更新。
- 不要打稻草人：攻 steelman 或不攻。
- 不要新增 Phase 1.5+ 的对象（personal 层 / OST / PRD·spec 生成），除非用户明确要求——见 `docs/ARCHITECTURE.md` 的触发条件。（注：`/decide` + `/retro` + `/lookup` 已落地，/decide 决策日志不入内核 schema；/lookup 无状态跨项目扫描,不建 personal/ 持久对象。OST 仍需触发条件满足。）

# playbook · 项目设计方案与交接文档（Master Plan v1.1）

> **本文件是 playbook 项目的唯一设计事实源（Single Source of Truth）。**
> 切换对话 / 新会话开始前，请先完整阅读本文件再继续工作，以保证设计不漂移。
> 任何与本文件冲突的新想法：先更新本文件，再动手。
> 代码事实源为 GitHub 仓库 <https://github.com/LuckyOneTwoThree/playbook>；本文件为设计事实源。

---

## 0. 如何使用本文档

- **新会话开场**：先读第 1、6、11、14 节（定位 / 概念模型 / 设计决策 / 不要做）——这四节锁住项目的「魂」。
- **想知道现在能干什么**：读第 12 节（已完成）。
- **想知道接下来做什么**：读第 13 节（路线图与待办）。
- **判断某想法要不要做**：先对照第 14 节「不要做」，再看第 11 节决策记录里有没有已否决过。
- **每次重大变更**：更新第 12 / 13 节，并在第 16 节追加一行变更记录。

---

## 1. 一句话定位与电梯陈述

> 给主观、可刷、易自欺的产品决策，装一个**会顶嘴、有记忆**的决策内核。

**电梯陈述**：playbook 是一个跑在 Claude Code / Cowork / Codex 上的 PM skill 插件包 + 决策内核。和普通 PM 助手最大的不同：每个 skill 跑完都把结论**回写内核**（假设台账 + 论点），跨会话记住你的假设、证据与到期项。它不是无状态的文档生成器，是一个会积累的**决策 OS**。

- **项目名 / 仓库名**：`playbook`（GitHub: <https://github.com/LuckyOneTwoThree/playbook>）；「PM Superpower」保留为产品理念代号 / 副标题。
- **产品对象**：PM / 产品负责人，从 0→1 的想法阶段，到设计产出。
- **买单方**：个人自费、个人使用（当前阶段）。
- **核心钩子—留存—护城河**：照妖镜（钩子）→ 决策内核（留存）→ 跨项目校准（护城河，Phase 1.5）。

---

## 2. 背景与要解决的问题

产品决策天然主观、可被自己「刷」出信心、容易自欺。现有 AI PM 助手大多是**无状态文档生成器**：

- 每次对话从零开始，不记得你上次的假设和证据。
- 倾向附和（谄媚），不会真的顶你。
- 结论散落在文档里，无法积累成可复用的判断资产。

playbook 用「会顶嘴 + 有记忆」的内核直击这三点。

---

## 3. 产品理念 / 设计哲学

> **第一原则：LLM 负责判断，脚本负责纪律。** LLM 做拆解、攻击、归类、写作；确定性的校验、ID 分配、上限约束交给 `tools/*.mjs`。二者不互相替代。

- **对抗而非附和**：默认「这风险是真的」，先 steelman 再攻击，不打稻草人，也不制造虚假怀疑。
- **可信的记忆才值得留存**：不可信的记忆比没有记忆更糟——所以有信任分级 + 确定性校验硬闸。
- **精简优先**：P0 只做被真实用到的东西，一切「看起来更完整」的层都推迟到有触发条件时再建。

### 血统（防漂移核心之一）

| 来源 | 取什么 | 不取什么 |
| --- | --- | --- |
| **产品方法论（魂）** | 决策内核、A/B/C/D 四类假设、L1–L4 证据、对抗哲学、回写沉淀、决策校准 | 不搬照方法论的长篇叙述 |
| **pm-skills（手艺）** | `SKILL.md` 规范、steelman-再攻击、影响×可能性×成本排序、"Fails if" 写法、screenshot-native 输出、eval 纪律 | 不照搬 68 个 skill 的广度 |

> 两边都**不整包照抄**：方法论抽内核不搬长文；pm-skills 抄结构不抄广度。

---

## 4. 对标与差异

- **vs Superpower（通用版）**：Superpower 是通用 agent 能力集；本项目是 PM 垂直 + 决策内核，强调「有记忆、会顶嘴」。
- **vs pm-skills（Pawel Huryn / Product Compass，68 skills / 42 commands / 9 plugins）**：pm-skills 广而全、无状态；本项目窄而深、有内核回写。借鉴其 `SKILL.md` 手艺，但用内核把结论沉淀下来。参考：<https://github.com/phuryn/pm-skills>

---

## 5. 系统架构总览

```
playbook/
├─ README.md · AGENTS.md · CLAUDE.md   # 说明 + agent 操作约定
├─ .claude-plugin/marketplace.json     # 插件清单
├─ kernel/                             # 决策内核：数据模型 + 契约（真 IP）
│  ├─ thesis.schema.json
│  ├─ assumption-ledger.schema.json
│  ├─ writeback-contract.md            # 回写规范 + 分级 sign-off + 循环状态机
│  └─ templates/thesis.md
├─ skills/                             # 原子能力，独立可触发
│  ├─ assumption-xray/ (SKILL.md+eval) # 🔍 照妖镜（主角）
│  ├─ user-insight/                    # 👤 用户洞察
│  ├─ competitor-teardown/             # ⚔️ 竞品拆解
│  └─ evidence-intake/                 # 📥 证据采集
├─ commands/  new.md · review.md       # /new 初始化 · /review 批量 sign-off
├─ tools/     new-project.mjs · validate.mjs   # 唯一确定性代码
├─ workspace/<project-id>/             # 每个项目一个隔离文件夹
│  └─ (thesis.md · ledger.json · sources/)
└─ docs/  ARCHITECTURE.md · PROJECT-PLAN.md    # 框架文档（本文件在此）
```

**分层原则**：命令行脚本是**确定性脊椎（护栏）**，agent 是**友好门面**。用户只碰门面（说人话 / 斜杠命令），脚本由 agent 代跑。

---

## 6. 核心概念模型（务必锁死）

### 6.1 两个内核对象

- **thesis（论点）**：决策内核的北极星，必须可被证伪。字段：`id(T-NN)`、`schemaVersion("4.0")`、`statement`、`targetUser`、`coreProblem`、`solutionHypothesis`、`whyNow`、`successSignal`、`needsRevision(bool)`、`revisions[]`（唯一的 history 机制）、`createdAt`。
- **assumption-ledger（假设台账，心脏）**：假设对象数组。字段：`id(<TYPE>-NN)`、`type(A/B/C/D)`、`statement`、`impact(high/med/low)`、`evidenceLevel(L1–L4)`、`status(todo/testing/validated/refuted)`、`failsIf`、`cheapestTest`、`killCriteria`、`provenance{reliability, source, signedOffBy, signedOffAt}`、`freshness{lastVerified, ttlDays(默认30)}`。

### 6.2 四类假设

| 类型 | 含义 |
| --- | --- |
| A | 用户价值 |
| B | 商业可行 |
| C | 技术可行 |
| D | 安全合规 |

### 6.3 证据等级与可靠度上限（Reliability Cap）

| 证据等级 | 含义 | 可由何种来源支撑（上限） |
| --- | --- | --- |
| L1 | 只是觉得 | self（自己觉得） |
| L2 | 间接信号 | indirect（间接 / 二手） |
| L3 | 直接证据 | direct（直接观察 / 访谈） |
| L4 | 数据验证 | data（量化数据） |

> **硬约束**：`evidenceLevel` 不得高于来源 `reliability` 的上限（self≤L1 / indirect≤L2 / direct≤L3 / data≤L4）。违反由 `validate.mjs` 判**校验失败（exit 1）**。

### 6.4 派生字段（不落盘，validator 现算）

- **裸奔假设 `isNaked`** = `impact === high && evidenceLevel ∈ {L1, L2}`。
- **过期 `stale`** = `lastVerified + ttlDays < 今天`。

### 6.5 分级 sign-off

- **自动落库**：结构性改动 + `evidenceLevel ≤ L2`。
- **需人工确认**：`evidenceLevel ≥ L3`，或 `status → validated/refuted`。攒到 `/review` 一次批。

### 6.6 循环状态机（内核是活的）

```
承重假设 status → refuted
        ↓
thesis.needsRevision = true（自动置位）
        ↓
用户修订论点 → 追加 thesis.revisions[]（at/reason/before/after）
        ↓
needsRevision 复位 false
```

---

## 7. 详细组件规格

### 7.1 kernel/ 数据契约

- `thesis.schema.json` / `assumption-ledger.schema.json`：draft-07 JSON Schema，回写必须符合。
- `writeback-contract.md`：信任分级表、可靠度上限表、分级 sign-off、循环状态机、派生字段说明、7 条铁律。
- `templates/thesis.md`：论点六格模板，`/new` 时复制。

### 7.2 四个 Skill（输入 / 输出 / 回写）

| Skill | 触发 | 读 | 写 | 主要产出 |
| --- | --- | --- | --- | --- |
| 🔍 assumption-xray（照妖镜，主角） | `@assumption-xray <想法>` | thesis | ledger, thesis | A/B/C/D 拆解 + 裸奔排序 + 最致命追问 + 每条 Fails if / 最便宜验证 / kill 标准 |
| 👤 user-insight | `@user-insight <访谈/反馈>` | thesis | ledger | 2–4 个洞察主题 + 可证伪 A 类假设 |
| ⚔️ competitor-teardown | `@competitor-teardown <竞品>` | thesis | ledger | 竞品矩阵（含「现状凑合方案」）+ 市场缺口 → B/C 类假设 |
| 📥 evidence-intake | `@evidence-intake <证据>` | ledger, thesis | ledger, thesis | 归档 sources/ + 升 / 降级台账 + 触发反驳循环 |

每个 `SKILL.md` 结构：frontmatter（name/description/reads/writes/eval）+ Purpose / Context / Instructions / Output（screenshot-native）/ Kernel Write-back / Notes。

**照妖镜 5 条 eval**：①有用性 ②改变决策（最关键）③点名裸奔 ④不谄媚 ⑤回访（每条带可证伪出路）。

### 7.3 commands 与 tools

- `/new`（`tools/new-project.mjs`）：一键初始化 `workspace/<id>/{thesis.md, ledger.json, sources/}`；项目名自动规范化为 slug；重名保护（`--force` 覆盖）。
- `/review`（`commands/review.md`）：扫描待 sign-off 项（≥L3 或状态终局且未签字），逐条批准 / 打回 / 修改，写 signedOffBy/At，触发反驳循环。
- `tools/validate.mjs`（唯一确定性代码）：枚举校验、可靠度上限、ID 自动分配 `<TYPE>-NN`、计算 isNaked/stale、标记待 sign-off、错误 exit 1。

---

## 8. 人机交互 / 使用流程（以示例项目 async-standup 为例）

1. **冷启动**：`/new async-standup` → 填 `thesis.md` 六格。
2. **照妖镜**：`@assumption-xray` → 输出红队表，点名 A-01/B-01/C-01 裸奔，追问最致命一条。
3. **分级 sign-off**：弱证据自动入台账；强声明攒到 `/review`。
4. **证据采集**：`@evidence-intake <访谈>` → 归档 sources/，把 A-01 从 L1 升到 L3（需 sign-off）。
5. **反驳循环**：若某承重假设被 refute → thesis.needsRevision=true → 修订留痕。
6. **新鲜度留存**：过期项提醒回访，形成留存钩子。

> 价值曲线：Day 1 = 一次锋利的红队；1 个月 = 一个记得你所有假设与证据、会主动提醒的决策内核。

---

## 9. 多项目支持

- **共享**：`skills/` `kernel/` `tools/`（代码与契约）。
- **隔离**：`workspace/<project-id>/`（状态），ID 项目内编号，互不冲突。
- **跨项目学习**：`kernel/personal/` 层，**Phase 1.5**，纯增益、不冲突。当前已确认**延后**。

---

## 10. Agent 集成（Codex / Cowork / Claude Code）

- **Claude Code / Cowork**：`skills/` 与斜杠命令原生自动发现，直接 `@skill` / `/command`。
- **Codex**：先读根目录 `AGENTS.md` 建上下文；skill 通过读 `SKILL.md` 执行，脚本通过 shell 跑。功能一致，只是发现方式需 `AGENTS.md` 引导。
- 根目录 `AGENTS.md`（Codex 约定读）+ `CLAUDE.md`（Claude Code 约定读）承载 agent 操作约定与 7 条铁律。

---

## 11. 关键设计决策记录（ADR，防漂移核心）

> 下面每条都是**已拍板**的取舍。想推翻某条，先在这里读它当初为什么，再决定。

1. **砍掉 engine 作为代码，只留一个薄 validator**。kernel-store（文件系统够用）、orchestrator（斜杠命令免费）、vitals 仪表盘（信号未验证）全部推迟。回写从「自动」降级为「人工 sign-off + 确定性校验」。
2. **派生字段不落盘**（isNaked/stale 现算）——避免陈旧。
3. **单一 history**：只有 `thesis.revisions[]`，不引入独立 decision-log（Phase 1.5 再说）。
4. **evidenceLevel 与 reliability 语义绑定**：等级由来源可靠度封顶，避免两套字段打架。
5. **分级 sign-off** 而非全自动或全人工：弱证据 / 结构改动自动落库，强声明与状态终局才拦。
6. **P0 只留 thesis + ledger（+ sources）两对象**；OST、personal 层、decision-log、MIGRATIONS、/discover 链、vitals 全部推迟到有触发条件。
7. **skills standalone-first**：先保证单个 skill 独立可用，再谈编排链。
8. **项目形态是「真实软件仓库」，不是在 Notion 里搭产品**（见第 14 节）。

---

## 12. 当前进度（已完成 ✅）

### 12.1 已产出的软件框架（P0 仓库，可跑）

已发布到 GitHub：<https://github.com/LuckyOneTwoThree/playbook>

- [x] 仓库骨架：README / AGENTS.md / CLAUDE.md / .claude-plugin/marketplace.json / docs/ARCHITECTURE.md
- [x] kernel：thesis.schema.json、assumption-ledger.schema.json、writeback-contract.md、templates/thesis.md
- [x] skills：assumption-xray（+eval.md）、user-insight（+stub eval）、competitor-teardown（+stub eval）、evidence-intake（+stub eval）、experiment-design（+eval.md）、revise-thesis（+eval.md）—— 6 skill 全闭环
- [x] commands：new.md、list.md、review.md、decide.md
- [x] tools：new-project.mjs（一键初始化）、validate.mjs（确定性校验，含 thesis 扁平字段硬校验 + 启发式下一步提示）
- [x] 示例项目：workspace/async-standup/（填好的 thesis + 3 条种子假设 ledger + sources/）

### 12.2 已验证（实测通过）

- [x] `validate.mjs` 对种子项目校验通过，正确识别 3 条裸奔 [A-01, B-01, C-01]
- [x] `/new` 一键初始化：项目名自动 slug 化、三件套齐全、重名保护生效
- [x] 可靠度上限硬闸：构造 self+L4 违规被正确拦截（exit 1）

### 12.3 事实源约定

- **代码事实源**：GitHub 仓库 <https://github.com/LuckyOneTwoThree/playbook>（跨会话唯一可信代码源）。
- **设计事实源**：本文件（`docs/PROJECT-PLAN.md`）+ Notion Master Plan 页面。
- 注意脚本沙箱在对话轮次之间会重置，一切代码改动以 GitHub 仓库为准。

---

## 13. 路线图与待办（TODO）

### 13.1 P0 收尾（当前阶段，按 A/B/C 优先级推进）

**A. 命名与文档同步（优先）**

- [x] 统一项目命名为 `playbook`：README / AGENTS / marketplace.json 全部对齐（保留「PM Superpower」作产品理念副标题）。
- [x] 把 Master Plan 同步为仓库内 `docs/PROJECT-PLAN.md`（本文件），README 目录树补上该条目。
- [x] 事实源对齐：marketplace.json / README / CLAUDE.md / ARCHITECTURE.md / 本文件 全部同步到 6 skill + 4 命令的回路闭合定义（v1.2）。

**B. 实测与打磨**

- [ ] 在 Cowork / Codex 里实测整条冷启动（/new → 填 thesis → 照妖镜 → experiment-design → evidence → review → decide），并回填实测结果。
- [ ] **第 0 位：playbook 自身 A/B 验证**——找 3 个 PM 真实跑一遍，量是否回来第二次。这是项目自身的承重假设，比引擎打磨更优先。
- [ ] 把 6 个 SKILL 的措辞对照方法论「决策内核」「Agent 工作流」两页做一次「接地」打磨（当前用通用内核词汇）。

**C. 工程化完善（可选，提升可维护性）**

- [ ] 补 `LICENSE`、`.gitignore`、`package.json`（`npm run validate` 脚本入口）。
- [ ] 轻量 CI（GitHub Actions：push 时跑 `validate.mjs` + 照妖镜 eval），把「脚本负责纪律」固化到流水线。
- [ ] `/list` 脚本化（触发条件：用户跑到第 3 个项目时；当前 `ls workspace/` + agent 读 thesis 够用）。

### 13.2 Phase 1.5（带触发条件才做）

| 能力 | 触发条件 |
| --- | --- |
| `kernel/personal/` 跨项目学习层 | 用户跑到第 2 个项目且明确想复用上个项目的教训 |
| OST（机会解决方案树） | 单项目假设 > ~20 条、需要结构化组织 |
| decision-log + /retro + 校准闭环 | 已有 ≥5 条 validated/refuted、可回溯校准准确率 |
| MIGRATIONS.md | schemaVersion 需要第一次升级 |
| /discover 编排链 | 单个 skill 已被反复串用、值得固化流程 |

### 13.3 Phase 2

- [ ] Web 体检仪表盘（内核数据稳定、需要可视化留存时）。

---

## 14. 明确的「不要做」（Guardrails / Non-goals）

> 这些是**已经踩过或明确否决**的方向，切换对话后请勿重新走回去。

- ❌ **不要在 Notion 里搭建整个产品**。最终形态是可在 Codex/Cowork 加载的真实软件仓库。Notion 只用于设计文档与参考原型。
- ❌ **不要提前建 Phase 1.5+ 的对象**（personal 层 / OST / decision-log / MIGRATIONS / discover 链 / vitals），除非触发条件满足。
- ❌ **不要把 pm-skills 的 68 个 skill 广度照搬进来**；P0 只 4 个。
- ❌ **不要照搬方法论长文**；只抽内核。
- ❌ **不要让派生字段落盘**，不要跳过 validator 直接宣称台账已更新。
- ❌ **不要打稻草人**：攻 steelman 或不攻。

---

## 15. 术语表

- **决策内核 / Kernel**：thesis + assumption-ledger（+ sources）。
- **裸奔假设**：影响高 × 证据弱的承重假设。
- **承重假设**：错了整个计划就死的假设。
- **可靠度上限 / Cap**：证据等级不得超过来源类型允许的最高等级。
- **分级 sign-off**：弱证据自动落库、强声明需人工确认。
- **screenshot-native**：输出结构清晰到可直接截图分享。

---

## 16. 变更记录（Changelog）

| 版本 | 日期 | 变更 |
| --- | --- | --- |
| Master Plan v1 | 2026-07-23 | 首次成文：锁定 P0 精简架构、四 skill、内核契约、agent 集成、决策记录与路线图。 |
| Master Plan v1.1 | 2026-07-23 | 对齐 GitHub P0 现状：统一项目名 playbook、代码事实源改为 GitHub 仓库、细化 P0 收尾路线为 A/B/C（命名同步 / PROJECT-PLAN 回流 / 端到端实测 / 工程化完善）。 |
| Master Plan v1.2 | 2026-07-23 | 闭环回路补齐：新增 @experiment-design（实验规格）/ @revise-thesis（论点修订）/ /decide（go·pivot·kill 决策日志）/ /list（多项目只读列举）。validator 升级为分层执法（thesis 扁平字段硬失败、嵌套软警告、frontmatter 锚定）+ 启发式下一步提示。3 个配角 skill 补 stub eval.md。事实源全量对齐到 6 skill / 4 命令。ADR 补记 /list、/decide 为 P0 应用户请求补充件（不入内核 schema、不经 validate）。 |

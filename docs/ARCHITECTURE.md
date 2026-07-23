# ARCHITECTURE — 锁定版 v4（P0）

> 精简优先。P0 只做被真实用到的东西；一切“看起来更完整”的层都推迟到有触发条件时再建。

## 设计哲学

- **定位**：给主观、可刷、易自欺的产品决策，装一个会顶嘴、有记忆的决策内核。照妖镜是钩子，内核是留存，跨项目校准是护城河（Phase 1.5）。
- **第一原则**：LLM 负责判断，脚本负责纪律。
- **血统**：魂来自作者产品方法论（决策内核 / A-B-C-D / L1-L4 / 对抗哲学 / 回写沉淀）；手艺借鉴 pm-skills（SKILL.md 规范 / steelman-再攻击 / 影响×可能性×成本排序 / “Fails if” / screenshot-native 输出 / eval 纪律）。两边都不照搬。

## P0 范围（本仓库）

- 内核对象：**thesis + assumption-ledger（+ sources 归档）**，仅此。
- 4 个 skill：🔍 assumption-xray（主角）/ 👤 user-insight / ⚔️ competitor-teardown / 📥 evidence-intake，全部 standalone-first。
- 2 个命令：`/new`（初始化项目）、`/review`（批量 sign-off）。
- 1 个工具：`tools/validate.mjs`（唯一确定性代码）。
- 多项目：`workspace/<id>/` 隔离状态；`skills/`、`kernel/`、`tools/` 共享。

## 内核数据模型

- **四类假设**：A 用户价值 / B 商业可行 / C 技术可行 / D 安全合规。
- **证据等级**：L1 只是觉得 / L2 间接信号 / L3 直接证据 / L4 数据验证。
- **可靠度上限**：self≤L1 / indirect≤L2 / direct≤L3 / data≤L4。
- **裸奔假设**（派生）= impact high × evidenceLevel ∈ {L1,L2}。
- **过期**（派生）= lastVerified + ttlDays < 今天（ttlDays 默认 30）。
- **分级 sign-off**：结构性 + ≤L2 自动落库；≥L3 或 status→validated/refuted 需人工确认。
- **循环状态机**：承重假设 refuted → thesis.needsRevision=true → thesis.revisions[] 留痕。

## 关键取舍（为什么砍）

- **engine 作为代码全砍**，只留一个薄 validator：kernel-store（文件系统够用）、orchestrator（slash 命令免费）、vitals 仪表盘（信号未验证）全部推迟；回写从“自动”降级为“人工 sign-off + 确定性校验”。
- **派生字段不落盘**（isNaked/stale）：避免陈旧，每次现算。
- **单一 history**：只有 thesis.revisions[]，不引入独立 decision-log（Phase 1.5 再说）。
- **evidenceLevel 与 reliability 合并语义**：等级由来源可靠度封顶，避免两套字段打架。

## Agent 集成

- 根目录 `AGENTS.md`（Codex 等约定读）+ `CLAUDE.md`（Claude Code 约定读）承载 agent 操作约定。
- Claude Code / Cowork：skills 与斜杠命令原生自动发现。
- Codex：先读 AGENTS.md 建立上下文，skill 通过读 SKILL.md 执行，脚本通过 shell 跑。

## 推迟到 Phase 1.5+（附触发条件）

| 能力 | 触发条件 |
|---|---|
| `kernel/personal/` 跨项目学习层 | 用户跑到第 2 个项目且明确想复用上个项目的教训 |
| OST（机会解决方案树） | 单项目假设 > ~20 条、需要结构化组织时 |
| decision-log + /retro + 校准闭环 | 已有 ≥5 条 validated/refuted、可回溯校准准确率时 |
| MIGRATIONS.md | schemaVersion 需要第一次升级时 |
| /discover 编排链 | 单个 skill 已被反复串用、值得固化流程时 |
| vitals 仪表盘 / Web app（Phase 2） | 内核数据稳定、需要可视化留存时 |

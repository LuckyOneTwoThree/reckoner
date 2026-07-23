# PM Superpower · P0

> 给主观、可刷、易自欺的产品决策，装一个**会顶嘴、有记忆**的决策内核。
> 照妖镜是钩子，内核是留存，跨项目校准是护城河（Phase 1.5）。

## 这是什么

一个跑在 **Claude Code / Cowork / Codex** 上的 PM skill 插件包 + 决策内核。
和普通 PM 助手最大的不同：**每个 skill 跑完都把结论回写内核**（假设台账 / 论点），
跨会话记住你的假设、证据与到期项——它不是无状态的文档生成器，是一个会积累的决策 OS。

## 快速开始

> 在 agent 工具里你**说人话就行**，下面的命令是 agent 替你跑的（也可手动跑）。

1. 在 Claude Code / Cowork / Codex 里加载本仓库（agent 会先读 `AGENTS.md` 建立上下文）。
2. 新建项目（一条命令，无需手动复制模板）：
   ```
   node tools/new-project.mjs <项目名>      # 或在 agent 里 /new
   ```
   自动生成 `workspace/<项目名>/{thesis.md, ledger.json, sources/}`。
3. 打开 `workspace/<项目名>/thesis.md`，填写六格论点。
4. 召唤照妖镜：`@assumption-xray <你的想法或论点>`
5. 采集证据：`@evidence-intake <访谈 / 竞品 / 数据 / 链接>`
6. 每周批量确认强声明：`/review`
7. 校验内核：`node tools/validate.mjs workspace/<项目名>/ledger.json`

## 目录结构

```
pm-superpower/
├─ README.md
├─ AGENTS.md                    # agent 操作约定（Codex 等约定读）
├─ CLAUDE.md                    # 指向 AGENTS.md（Claude Code 约定读）
├─ .claude-plugin/marketplace.json
├─ kernel/                      # 决策内核：数据模型 + 契约（真 IP）
│  ├─ thesis.schema.json
│  ├─ assumption-ledger.schema.json
│  ├─ writeback-contract.md     # 回写规范 + 分级 sign-off + 循环状态机
│  └─ templates/thesis.md
├─ skills/                      # 原子能力，独立可触发
│  ├─ assumption-xray/          # 🔍 主角：假设红队（照妖镜）
│  ├─ user-insight/             # 👤 用户洞察
│  ├─ competitor-teardown/      # ⚔️ 竞品拆解
│  └─ evidence-intake/          # 📥 证据采集
├─ commands/
│  ├─ new.md                    # 一键初始化新项目
│  └─ review.md                 # 批量 sign-off
├─ tools/
│  ├─ new-project.mjs           # 初始化脚本（零依赖）
│  └─ validate.mjs              # 唯一代码：schema + 信任 + ID 护栏
├─ workspace/                   # 每个项目一个隔离文件夹
│  └─ async-standup/            # 示例项目（可删）
└─ docs/ARCHITECTURE.md         # 锁定版设计说明
```

## 核心概念

- **决策内核**：`thesis`（可证伪论点）+ `assumption-ledger`（假设台账，心脏）。
- **四类假设**：A 用户价值 / B 商业可行 / C 技术可行 / D 安全合规。
- **证据等级**：L1 只是觉得 / L2 间接信号 / L3 直接证据 / L4 数据验证。
- **裸奔假设** = 影响高 × 证据弱（validator 自动判定，不落盘）。
- **分级 sign-off**：弱证据自动落库；`≥L3` 或 `status` 变更需人工确认（`/review`）。
- **活的闭环**：假设被推翻 → 论点自动标 `needsRevision` → 修订留痕。

## 在 agent 工具里怎么用

- **Claude Code / Cowork**：`skills/` 与斜杠命令原生自动发现，直接 `@assumption-xray` / `/new`。
- **Codex**：先读根目录 `AGENTS.md` 建立上下文；skill 通过读对应 `SKILL.md` 执行，脚本通过 shell 跑。功能一致，只是发现方式需 `AGENTS.md` 引导。
- 命令行是**确定性脊椎**（护栏），agent 是友好门面——你只碰门面。

## 多项目

一套框架多项目并存：每个项目一个 `workspace/<id>/` 文件夹，ID 项目内编号，**互不冲突**。
跨项目学习（`kernel/personal/`）是 Phase 1.5，纯增益、不冲突。

## 血统

- **魂**来自作者的产品方法论：决策内核、A/B/C/D、L1–L4、对抗哲学。
- **手艺**借鉴 pm-skills 的 `SKILL.md` 规范、steelman-再攻击、影响×可能性×成本排序、eval 纪律。

## 路线图

- **P0（本仓库）**：thesis + ledger 两对象 + 4 skill + 采集 + validator + 项目初始化 + agent 约定。
- **Phase 1.5**：个人层（跨项目）、OST、决策日志 + 校准闭环（/retro）。
- **Phase 2**：Web 体检仪表盘。

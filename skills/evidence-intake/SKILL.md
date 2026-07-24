---
name: evidence-intake
description: "把一份新证据（访谈、数据、竞品截图、链接、实验结果）归档到 sources/，判定它支持还是反驳哪条假设，据实定证据等级与来源可靠度，并升级/降级台账。用于验证回访、把'跑完的测试'落回内核。"
metadata:
  reads: "assumption-ledger, thesis"
  writes: "assumption-ledger, thesis"
  eval: "./eval.md"
  version: "1.1"
---

# 证据采集：让台账随现实更新

## Purpose

评审 $ARGUMENTS（一份新证据）。把它**归档、定级、并挂到它真正影响的假设上**，该升级升级、该推翻推翻。**目标是让内核反映最新现实，而不是停在初始直觉。**

## Context

- 这是**闭环的回路**：其他 skill 提出假设，evidence-intake 用现实检验它们。
- 证据可靠度决定等级上限：self≤L1 / indirect≤L2 / direct≤L3 / data≤L4。
- 证据可以**反驳**假设——那比确认更有价值。
- **内核回路位置**：本 skill 是回路的**收口**，把跑完的验证落回台账。收口后要么触发论点修订（被反驳），要么指出还剩哪些裸奔假设待测——**而不是宣布“验证通过，可以造了”。**

## Instructions

> **动手前先回显当前项目**：先声明 `当前项目: workspace/<slug>/`，确认它就是本次要读写的项目。若同一会话此前在操作别的项目，先提示开新会话或让用户确认切换，再继续。本次所有读写（含存入 sources/）只落在这个目录内。

1. 把证据原文/截图/链接存进 `workspace/<项目>/sources/`，给个可引用的文件名。
   - **命名约定（v1.2）**：`YYYYMMDD_<reliability>_<slug>.<ext>`，如 `20260723_direct_alice-interview.md`、`20260723_data_pricing-test.png`。
   - `reliability` 用 self/indirect/direct/data 四值，与台账 `provenance.reliability` 对齐，方便日后按可靠度筛证据。
   - `slug` 简短描述来源（人名/渠道/实验名），小写连字符。
   - 一份证据影响多条假设时只存一份文件，在台账 `provenance.source` 里多条假设指向同一文件名。
2. 判定证据类型与可靠度（self/indirect/direct/data）。
3. 找出它影响哪条假设（可多条），判断是**支持**还是**反驳**。
4. 对每条受影响假设：
 - 支持 → 提升 `evidenceLevel`（不超可靠度上限），必要时 `status→validated`。
 - 反驳 → `status→refuted`，触发回写契约的循环状态机。
5. 更新 `provenance.source` 指向归档文件，刷新 `freshness.lastVerified`。
6. `≥L3` 或状态终局改动挂“待 sign-off”，交 `/review`。
7. **收尾盘点回路状态**：明确指出台账里**还剩哪些裸奔承重假设未测**，下一步 = `@experiment-design` 把下一条裸奔的最便宜验证落成规格（或回 `@assumption-xray` 复盘红队面）；若论点被反驳，下一步 = 修订 thesis。

## Output

```
## 证据采集：[证据一句话]

- 归档位置: sources/[文件名]
- 证据类型 / 可靠度: [direct/data/...]
- 影响假设: [A-01 支持 / B-02 反驳 ...]

### 台账变更建议
每条: 假设ID / 原等级→新等级 / 状态变更 / 是否需 sign-off

### 若有反驳
[关联 thesis 是否需 needsRevision，修订建议]

### 下一步（回路内）
剩余裸奔假设: [列出未测的承重假设] → @experiment-design 落规格 / 修订论点（若被反驳）
```

## Kernel Write-back

- 按上面变更更新 `ledger.json`，`evidenceLevel` ≤ 可靠度上限。
- 反驳承重假设 → `thesis.needsRevision=true`。
- `≥L3`/终局状态需 `/review` sign-off，勿自作主张。
- 落库前跑 `node tools/validate.mjs`。

## Notes

- 一份证据别过度延伸到它没覆盖的假设。
- 反驳是好消息：省下往错方向砸的钱。
- 归档原文，方便日后回溯与他人复核。
- ❌ **单条支持证据 ≠ 可以开工。** 即使某假设升到 L3/validated，只要台账里还有未验证的裸奔承重假设，就不能建议进入方案/MVP。先回 `@assumption-xray` 看还剩哪些裸奔。
- 反驳承重假设时，走循环状态机（thesis.needsRevision=true），别默默继续推进。

---
name: evidence-intake
description: "把一份新证据（访谈、数据、竞品截图、链接、实验结果）归档到 sources/，判定它支持还是反驳哪条假设，据实定证据等级与来源可靠度，并升级/降级台账。用于验证回访、把'跑完的测试'落回内核。"
reads: [assumption-ledger, thesis]
writes: [assumption-ledger, thesis]
eval: ./eval.md
---

# 证据采集：让台账随现实更新

## Purpose

评审 $ARGUMENTS（一份新证据）。把它**归档、定级、并挂到它真正影响的假设上**，该升级升级、该推翻推翻。**目标是让内核反映最新现实，而不是停在初始直觉。**

## Context

- 这是**闭环的回路**：其他 skill 提出假设，evidence-intake 用现实检验它们。
- 证据可靠度决定等级上限：self≤L1 / indirect≤L2 / direct≤L3 / data≤L4。
- 证据可以**反驳**假设——那比确认更有价值。

## Instructions

1. 把证据原文/截图/链接存进 `workspace/<项目>/sources/`，给个可引用的文件名。
2. 判定证据类型与可靠度（self/indirect/direct/data）。
3. 找出它影响哪条假设（可多条），判断是**支持**还是**反驳**。
4. 对每条受影响假设：
   - 支持 → 提升 `evidenceLevel`（不超可靠度上限），必要时 `status→validated`。
   - 反驳 → `status→refuted`，触发回写契约的循环状态机。
5. 更新 `provenance.source` 指向归档文件，刷新 `freshness.lastVerified`。
6. `≥L3` 或状态终局改动挂“待 sign-off”，交 `/review`。

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

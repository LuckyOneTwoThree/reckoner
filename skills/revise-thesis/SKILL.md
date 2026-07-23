---
name: revise-thesis
description: "当承重假设被推翻、或你决定 pivot 时，结构化地修订论点：记录改了什么、为什么改、被哪条假设触发，追加到 thesis.revisions[] 留痕，并复位 needsRevision。用于闭合『假设被证伪→论点更新』这个循环，避免论点静静地错下去。"
metadata:
  reads: "thesis, assumption-ledger"
  writes: "thesis"
  eval: "./eval.md"
  version: "1.0"
---

# 论点修订：让被证伪的论点体面地进化

## Purpose

评审 $ARGUMENTS（触发修订的原因，通常是某条承重假设 refuted 或一次 pivot 决定）。把“论点需要改”这件事**落成一次有留痕、可追溯的修订**，而不是默默把 statement 改掉。**目标是让论点随证据进化，且每次进化都说得清为什么。**

## Context

- 触发条件：`thesis.needsRevision === true`（承重假设被 refuted 时由回写契约自动置位），或 `/decide` 决定 pivot。
- 本 skill **只改 thesis，不碰 ledger 的证据/状态**（那是 evidence-intake 的职责）。
- 修订不是重写：能只改一格（如 solutionHypothesis）就别推翻整个 statement。
- **内核回路位置**：回路的**循环收口**。上游是 evidence-intake 的 refuted / decide 的 pivot；改完 needsRevision 复位，回路可重新从红队跑起。

## Instructions

> **动手前先回显当前项目**：先声明 `当前项目: workspace/<slug>/`，确认它就是本次要读写的项目。若同一会话此前在操作别的项目，先提示开新会话或让用户确认切换，再继续。本次所有读写只落在这个目录内。

1. 读 thesis 与 ledger，确认触发原因：哪条假设 refuted / 什么决定。若 `needsRevision` 为 false 且无 pivot 决定，停下问用户为何要改。
2. 定位**最小修订面**：statement / targetUser / coreProblem / solutionHypothesis / whyNow / successSignal 里，到底哪几格被这条证据推翻了。别顺手改无关格。
3. 写修订：更新对应字段（保持 `schemaVersion: "4.0"`、`id` 不变）。
4. 追加 `revisions[]` 一条：`{ at: 今天, reason: 一句话为什么改（点名触发假设 ID）, before: 旧值, after: 新值 }`。`at` 与 `reason` 必填；`before/after` 强烈建议填。
5. 复位 `needsRevision = false`。
6. 收尾指向回路：修订后的论点通常会带出新的承重假设——建议下一步 = `@assumption-xray` 对新论点重新红队。**不得跳到方案/排期。**

## Output

```
## 论点修订：[触发原因一句话]

- 触发: [A-01 refuted / 决定 pivot]
- 修订面: [statement / solutionHypothesis / ...]

### 修订对照
- before: ...
- after: ...

### revisions[] 新增条目
{ at: <日期>, reason: <为什么改，点名触发假设>, before: ..., after: ... }

- needsRevision: true → false

### 下一步（回路内）
新论点带出新裸奔假设 → 交 @assumption-xray 重新红队
```

## Kernel Write-back

- 只写 thesis：改字段 + append `revisions[]` + `needsRevision → false`。**不新增 schema 外字段**（thesis `additionalProperties:false`）。
- 保持 `schemaVersion: "4.0"`、`id` 不变。
- 改完跑 `node tools/validate.mjs workspace/<项目>/ledger.json`：确认留痕软检查通过（needsRevision 已复位、revisions 有条目，不再报 ⚠️ 提醒）。

## Notes

- `revisions[]` 是 P0 唯一的历史机制——别省略，省了就无法回溯当初为什么改。
- pivot ≠ 推倒重来；如果每格都在改，可能是当初 thesis 就没想清，值得停下重填而不是修订。
- 改完记得回 `@assumption-xray`：新论点 = 新裸奔假设。

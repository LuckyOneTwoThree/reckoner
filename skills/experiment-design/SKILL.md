---
name: experiment-design
description: "把 assumption-xray 给出的『最便宜验证』升级成一份可执行、可追踪的实验规格：明确待验证假设、方法、样本量/时长、pass/fail 数字线、deadline 与成本，并把假设 status 置为 testing。用于设计验证实验、把『该测什么』变成『这周怎么测』。跑完回写台账。"
metadata:
  reads: "assumption-ledger, thesis"
  writes: "assumption-ledger"
  eval: "./eval.md"
  version: "1.0"
---

# 实验设计：把“最便宜验证”变成真能跑的实验

## Purpose

评审 $ARGUMENTS（一条或几条待验证的裸奔假设）。assumption-xray 已经告诉你“该测什么、最便宜怎么测”；本 skill 负责把那句话**落成一份这周就能执行、结果能明确判读的实验规格**。**目标是消灭“我去调研一下”这种伪验证，逼出一个有数字 pass/fail 线的真实验。**

## Context

- 只处理**已被 assumption-xray 标为裸奔（impact:high × evidenceLevel:L1/L2）**的承重假设；不给装饰性假设设计实验。
- 一次只深做 **1–2 条**最致命的——实验要真跑，铺开就都跑不动。
- 本 skill **不产出新假设，也不改证据等级**：它只把假设的 `cheapestTest` / `failsIf` / `killCriteria` 补精确，并把 `status` 从 `todo` 推进到 `testing`。真结果由 `@evidence-intake` 回填。
- **内核回路位置**：夹在 `@assumption-xray`（给方向）与“真跑实验 → @evidence-intake（收结果）”之间。你的产出是**实验规格**，不是实验结论，更不是产品方案。

## Instructions

> **动手前先回显当前项目**：先声明 `当前项目: workspace/<slug>/`，确认它就是本次要读写的项目。若同一会话此前在操作别的项目，先提示开新会话或让用户确认切换，再继续。本次所有读写只落在这个目录内。

1. 读 ledger，挑出 `status:todo` 的裸奔承重假设；按 blast radius（错了损失有多大）排序，只取 top 1–2。
2. 对每条，先确认它的 `failsIf`（可证伪的失败条件）是否具体到能判读；不具体先改写具体。
3. 设计**最便宜**能证伪它的实验，写全八格：
   - 待验证假设 / 实验动作（具体做什么）/ 方法（假门 / 预售页 / 5 户深访 / 落地页…）/ 样本或时长（数字）/ pass 线（数字）/ fail 线=killCriteria（数字）/ deadline（本周内一个日期）/ 预估成本（钱+时间）。
   - ❌ 通用验证黑名单：不接受“做调研 / 多访谈几个 / 先做个 MVP·原型 / 观察一段时间”这类没有数字判读线的动作。
4. 成本自检：这真是**最便宜**的证伪路径吗？有更便宜、更快能证伪的就换它。MVP/原型几乎永远不是最便宜的。
5. 回写：把精确后的 `cheapestTest` / `failsIf` / `killCriteria` 写回该假设，`status → testing`。**不升 evidenceLevel**（还没有证据）。
6. 收尾指向回路下一站：用户去跑实验 → 结果回 `@evidence-intake`。**不得建议直接进入方案/排期。**

## Output

```
## 实验设计：[假设一句话]

### 实验卡（每条裸奔假设一张，最多 2 张）
- 待验证假设: [A-01] ...
- failsIf（可证伪失败条件）: ...
- 实验动作: [具体做什么]
- 方法: [假门 / 预售页 / 5 户深访 / 落地页投放 ...]
- 样本 / 时长: [数字]
- pass 线: [数字]
- fail 线 = killCriteria: [数字]
- deadline: [本周内日期]
- 预估成本: [钱 + 时间]

### 台账回写
[A-01: cheapestTest/failsIf/killCriteria 已精确, status: todo→testing]

### 下一步（回路内）
去跑实验 → 结果交 @evidence-intake 落回台账
```

## Kernel Write-back

- 只更新既有假设的 `cheapestTest` / `failsIf` / `killCriteria` / `status`；**不新增假设、不动 evidenceLevel、不新增 schema 外字段**（ledger 项 `additionalProperties:false`）。
- `status → testing` 属结构性推进，自动落库（不需 sign-off；sign-off 只留给 validated/refuted）。
- 落库前跑 `node tools/validate.mjs workspace/<项目>/ledger.json`，通过才算完成。

## Notes

- 一次 1–2 条，别给每条裸奔假设都设计实验——那是覆盖幻觉。
- 实验规格里详细的方法/脚本可另存 `workspace/<项目>/sources/` 备查；ledger 只留可判读的三格。
- `status:testing` 是“在测”，不是“测过了”。别顺手标 validated——那要真证据 + `/review`。
- 好的实验一句话讲得清怎么算赢、怎么算输。讲不清 = 还没设计好。

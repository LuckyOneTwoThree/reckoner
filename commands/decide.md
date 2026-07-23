---
name: decide
description: "在一轮验证跑完、/review sign-off 之后，把『这个方向到底 go / pivot / kill』这个决定连同理由和触发它的假设，记进 workspace/<项目>/decisions.md 决策日志。用于收口一次决策循环、留下可复盘的判断轨迹。"
---

# /decide — 记一次决策

回路跑到 `/review` 之后，你手上是一堆带证据分级的假设。`/decide` 逼你把它收成一个**明确的决定**并留痕，而不是模糊地“感觉可以继续”。

## 流程

1. 回显当前项目：确认 `workspace/<slug>/`。
2. 读 ledger 与 thesis，盘点：承重假设里 validated / refuted / 仍裸奔 各几条。
3. 让用户在三选一里表态（别含糊）：
   - **go** — 承重假设已足够被验证，进入下一阶段（造/扩）。**前提：没有仍然裸奔的承重假设。**
   - **pivot** — 某承重假设被推翻，方向要调整 → 接 `@revise-thesis`。
   - **kill** — 假设被证伪且不值得 pivot，停掉。
4. 追加一条记录到 `workspace/<项目>/decisions.md`（不存在则创建）：
   ```
   ## <日期> — <go / pivot / kill>
   - 决定: ...
   - 理由: ...
   - 触发假设: [A-01 validated, B-02 refuted, ...]
   - 下一步: ...
   ```
5. 按决定指向回路：go → 离开内核去造（此时才允许）；pivot → `@revise-thesis`；kill → 归档，结束。

## 说明

- `decisions.md` 是**纯 append 日志**，只增不改——改历史 = 骗自己。它不入内核 schema，不经 validate.mjs。
- **go 是唯一允许离开内核、进入“造”的闸门**——且必须没有仍裸奔的承重假设。别在还有裸奔假设时点 go。
- 决策日志是日后跨项目校准（Phase 1.5）的原料：你过去的 go/kill 判断准不准，全靠它复盘。

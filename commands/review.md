---
name: review
description: "批量确认待 sign-off 的强声明（evidenceLevel ≥ L3、status → validated/refuted），把逐条摩擦收成每周一次。"
---

# /review — 批量 sign-off

把散落的“需人工确认”写入集中到一次处理，避免每跑一个 skill 就打断你。

## 流程

1. 扫描当前项目 `ledger.json`，列出所有**待确认项**：
   - `evidenceLevel ≥ L3` 但 `provenance.signedOffBy` 为空
   - `status` 拟改为 `validated` / `refuted`
2. 逐条展示：假设 / 建议等级 / 来源与可靠度 / 触发原因。
3. 用户对每条选择：**批准 / 打回（降级）/ 修改**。
4. 批准的：写入 `provenance.signedOffBy` 与 `signedOffAt`，刷新 `freshness.lastVerified`。
5. 若有假设被确认 `refuted`：触发回写契约的循环状态机（给关联 thesis 打 `needsRevision`）。
6. 结束跑 `node tools/validate.mjs` 确认无违规。

## 建议节奏

每周一次；或裸奔假设完成一轮验证后立即跑。

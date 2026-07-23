---
name: review
description: "批量确认待 sign-off 的强声明（evidenceLevel ≥ L3、status → validated/refuted），把逐条摩擦收成每周一次。若论点因承重假设被推翻而待修订，在此补写修订理由并复位 needsRevision。"
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
6. **处理待修订的论点**：若 `thesis.needsRevision === true`，逐条与用户确认论点怎么改，然后：
 - 在 `thesis.md` 的 `revisions[]` **追加一条** `{at, reason, before, after}`（`reason` 必填——这是 agent 下次读得到的唯一 pivot 理由）。
 - 确认修订后将 `needsRevision` 复位 `false`。
 - 若本轮不改论点（只是先记录），保持 `needsRevision=true`，下轮再处理。
7. 结束跑 `node tools/validate.mjs <项目>/ledger.json` 确认无违规。若它报 `⚠️ 留痕提醒`，说明上一步的 `revisions[]` 没补上，回到第 6 步补完。

## 建议节奏

每周一次；或裸奔假设完成一轮验证后立即跑。

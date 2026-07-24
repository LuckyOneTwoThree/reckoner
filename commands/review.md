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
4. 批准的：写入 `provenance.signedOffBy`（人工签字写人名/邮箱本地名；agent 代批写 `agent:/review`）与 `signedOffAt`，刷新 `freshness.lastVerified`。
5. 若有假设被确认 `refuted`：触发回写契约的循环状态机（给关联 thesis 打 `needsRevision`）。
6. 若 `thesis.needsRevision === true`：
   - 本轮要改论点内容 → 引导走 `@revise-thesis`（最小修订面 + `revisions[]` 留痕 + 复位 `needsRevision` 的质量闸在它的 eval 里，`/review` 不 inline 改 thesis，避免绕过「最小修订面」「诚实标 pivot」质量闸）。
   - 本轮只想批 sign-off、不想改论点 → 保持 `needsRevision=true`，在输出提示「thesis 待修订，下轮建议走 @revise-thesis」。
7. 结束跑 `node tools/validate.mjs workspace/<项目>/ledger.json` 确认无违规。若它报 `⚠️ 留痕提醒`，说明 `@revise-thesis` 还没跑完，回到第 6 步引导用户走它。
8. sign-off 全部清完且 `needsRevision=false` → 提示 `/decide` 收口决策（go/pivot/kill）。仍有裸奔/待修订则停在回路内。

## 建议节奏

每周一次；或裸奔假设完成一轮验证后立即跑。

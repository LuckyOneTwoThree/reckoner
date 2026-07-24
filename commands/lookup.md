---
name: lookup
description: "跨项目检索历史项目的假设与决策。无状态扫描 workspace/ 下所有项目,按 topic/假设 type/status 做结构化检索,硬标 bizModel/stage 维度差异,agent 只匹配不迁移。用于'查我上次在某类假设上的教训'。"
---

# /lookup — 跨项目检索历史教训

触发:用户说"查我上次在 X 上的教训"/"之前项目在这条假设上栽过没"/"有没有类似的项目"→ 进本流程。

`/lookup` 让 Reckoner 从"单项目工具"变"决策 OS"——跨项目复用历史项目的假设、证据与决策。它不主动推荐,只在用户主动查时检索。

## 红线(先于流程)

1. **被动检索,不主动推荐**——不主动注入"上次你栽过 X",避免 LLM 跨项目牵强迁移
2. **脚本做结构化检索,agent 做语义判断**——脚本扫 workspace/ 按关键词/type/status 硬匹配,**不做语义匹配**(零依赖脚本做不了);"这条适不适用当前项目"的语义判断交 agent 和人
3. **维度差异由脚本硬标记**——bizModel/stage 不一致时脚本算出来贴脸(如"来源 B 端,当前 C 端"),不指望 LLM 克制
4. **agent 只匹配不迁移**——检索结果显式标注"来源项目 + 项目类型",是否适用由人判断

## 流程

1. 回显当前项目:确认 `workspace/<slug>/`(用于最后标维度差异)。
2. 解析检索关键词:用户说"查付费意愿的教训"→ 提取 topic="付费"/"意愿"/"订阅";或显式 `type=B` / `status=refuted` 筛选。
3. **脚本扫描**:`node tools/lookup.mjs "<topic>" [--type=<A/B/C/D>] [--status=<todo/testing/validated/refuted>]`
   - 扫所有 `workspace/*/ledger.json` + `thesis.md`
   - 按 topic 关键词匹配假设 statement / failsIf / killCriteria
   - 按 type/status 筛选(可选)
   - 输出匹配结果 + 来源项目 + bizModel/stage 维度
4. **脚本硬标维度差异**:对每条结果,算"来源项目 bizModel/stage vs 当前项目"是否一致,贴脸标注:
   - ✅ 维度一致(同 B2B / 同阶段)→ 迁移风险低
   - ⚠️ 维度不一致(如来源 B2B 当前 B2C)→ 迁移风险高,套用前先判断适用性
5. **输出检索报告**(格式见下),**不输出迁移建议**——"这条适不适用"由人判断,agent 不替人决定。
6. 若用户查完想据此做决定 → 引导回当前项目回路(如 `@assumption-xray` 用历史证据丰富红队面),不自动跨项目写回。

## 输出格式

```
## 跨项目检索 — "<topic>"

### 匹配结果(共 N 条)

#### 1. 来源: workspace/<项目A> · [bizModel=B2B, stage=1→10]
- 假设: B-01 (validated, L3) — 用户愿为 X 付 $12/月
- killCriteria: 落地页点击 < 3%
- 证据: 20260724_direct_xxx.md
- 维度差异: ⚠️ 来源 B2B,当前 B2C — 迁移风险高
- 教训摘要: <agent 一句话提炼,不做适用性判断>

#### 2. 来源: workspace/<项目B> · [bizModel=B2C, stage=0→1]
- 假设: B-02 (refuted, L2) — 目标用户只接受免费
- 维度差异: ✅ 同 B2C 同 0→1 — 迁移风险低
- 教训摘要: <agent 一句话提炼>
```

## 说明

- **无状态,不建 personal/ 持久对象**——/lookup 每次扫全 workspace,不缓存、不建索引、不存历史检索。先看有没有真信号(用户真用),有再说持久化。
- **脚本只做结构化检索**——按 topic 关键词 + type + status 扫,不做语义匹配。语义判断交 agent 和人。
- **维度差异是硬标记**——bizModel/stage 由脚本从 thesis frontmatter 读出并比较,不靠 LLM 猜。
- **不迁移**——检索结果显式标"来源项目",是否适用当前项目由人判断。agent 不做跨项目写回。
- **护城河对象**——/lookup 是 Reckoner 唯一的护城河对象:5 个项目的回写积累产生复利,迁移成本 = per-user 的壁垒。

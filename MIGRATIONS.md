# MIGRATIONS.md

记录 thesis schema 的破坏性变更与迁移步骤。按"expand and contract"原则——先加可选新字段让新旧并存,全部迁移完再考虑移除旧版本支持。

---

## 4.0 → 4.1 (2026-07-24)

**变更**:新增 `bizModel` / `stage` 两个 optional 字段(都带 enum 约束)。

**为什么**:为 `/lookup` 跨项目检索提供维度硬标记——脚本按 bizModel/stage 差异自动标记"来源 B 端 vs 当前 C 端",判断适用性交人,不让 LLM 跨项目牵强迁移。

**字段**:
- `bizModel`: enum `["B2B", "B2C", "B2B2C", "自用"]`, optional
- `stage`: enum `["0→1", "1→10", "10→100"]`, optional

**爆炸半径**:
- `schemaVersion` 从 `const "4.0"` 改为 `enum ["4.0", "4.1"]` —— 4.0 软警告+迁移提示,4.1 硬通过
- 现存项目的 thesis.md 必须 upgrade 到 4.1 并回填 bizModel/stage 实际值(空值 = /lookup 拿不到维度,护城河空转)
- 新项目模板已是 4.1

**迁移步骤**:
1. `node tools/migrate.mjs`(无参数扫所有 workspace/*/thesis.md)或 `node tools/migrate.mjs <workspace/项目名>`
2. 脚本升版本号 + 插入空 bizModel/stage
3. **人工/agent 回填实际值**(脚本不猜值,按项目真实情况填)
4. `npm run validate:all` 确认全绿
5. 提交

**双版本并存期**:
- 4.0 软警告(不阻断),提示跑 migrate.mjs
- 4.1 硬通过
- 待所有项目迁完,可在未来版本移除 4.0 支持(暂不设定截止日期)

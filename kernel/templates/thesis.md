---
# 复制本文件到 workspace/<你的项目名>/thesis.md 并填写（或直接跑 /new）。
# 结构化字段（供 skill 读取；revisions[] 必须写在这段 frontmatter 里，validator 只扫 frontmatter）：
id: T-01
schemaVersion: "4.1"
needsRevision: false
# 4.1 新增字段（optional，用于 /lookup 跨项目维度硬标记；enum: B2B/B2C/B2B2C/自用）
bizModel: ""
# 4.1 新增字段（optional；enum: 0→1/1→10/10→100）
stage: ""
targetUser: ""
coreProblem: ""
solutionHypothesis: ""
whyNow: ""
successSignal: ""
createdAt: ""
# revisions[] 留痕：论点被证伪/pivot 时追加一条，格式见 @revise-thesis。新项目留空数组。
revisions: []
# 示例（不要保留，只看格式）：
# revisions:
#   - at: 2026-07-23
#     reason: "B-02 refuted：目标用户不愿为自动化付费，改为按席位订阅"
#     before: "按调用次数计费"
#     after: "按席位订阅"
---

# 产品论点

> 我们相信，为【目标用户】解决【核心问题】，通过【解法】，会带来【价值】。

*（把方括号替换成你的具体内容。论点必须可被证伪——写得能被推翻才算好论点。）*

## 六格填空

**1. 目标用户是谁？** — 具体到能想起一个真人，不是“所有人”。

**2. 他们最痛的核心问题？** — 现在怎么凑合解决的？多痛？

**3. 我们的解法（假设性）？** — 一句话说清打算怎么解。

**4. 为什么是现在（时机）？** — 什么变了让它现在才成立？

**5. 成功长什么样？** — 一个能衡量成败的北极星信号。

**6. 最致命的假设是哪条？** — 哪条倒了整个论点就垮？（这条会进入假设台账）

---

填完后：`@assumption-xray` 会把它拆成 A/B/C/D 假设、点名裸奔假设，并回写台账。

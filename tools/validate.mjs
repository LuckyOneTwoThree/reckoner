#!/usr/bin/env node
// validate.mjs — 决策内核的确定性硬闸（零依赖）。
// 用法: node tools/validate.mjs <ledger.json 路径>
// 职责: 枚举校验 / 证据等级不超来源上限 / ID 自动分配 / 计算裸奔·过期 / 标记待 sign-off。
// 设计哲学: LLM 负责判断，脚本负责纪律。校验失败 exit 1。

import fs from "node:fs"

const ENUM = {
 type: ["A", "B", "C", "D"],
 impact: ["high", "med", "low"],
 evidenceLevel: ["L1", "L2", "L3", "L4"],
 status: ["todo", "testing", "validated", "refuted"],
 reliability: ["self", "indirect", "direct", "data"],
}
const CAP = { self: "L1", indirect: "L2", direct: "L3", data: "L4" }
const LRANK = { L1: 1, L2: 2, L3: 3, L4: 4 }

function die(msg) {
 console.error(`\n\u274c ${msg}\n`)
 process.exit(1)
}

const file = process.argv[2]
if (!file) die("用法: node tools/validate.mjs <ledger.json 路径>")
if (!fs.existsSync(file)) die(`找不到文件: ${file}`)

let data
try {
 data = JSON.parse(fs.readFileSync(file, "utf8"))
} catch (e) {
 die(`JSON 解析失败: ${e.message}`)
}
if (!Array.isArray(data)) die("ledger 顶层必须是数组 []")

const errors = []
const usedByType = {}
for (const a of data) {
 if (a && a.id) {
 const m = /^([ABCD])-(\d+)$/.exec(a.id)
 if (m) (usedByType[m[1]] ??= new Set()).add(parseInt(m[2], 10))
 }
}
function nextId(type) {
 const set = (usedByType[type] ??= new Set())
 let n = 1
 while (set.has(n)) n++
 set.add(n)
 return `${type}-${String(n).padStart(2, "0")}`
}

const naked = []
const stale = []
const needSignoff = []
const now = Date.now()

data.forEach((a, i) => {
 const tag = (a && a.id) || `#${i + 1}`
 if (!a || typeof a !== "object") {
 errors.push(`${tag}: 不是合法对象`)
 return
 }
 for (const f of ["type", "statement", "impact", "evidenceLevel", "status"]) {
 if (a[f] == null || a[f] === "") errors.push(`${tag}: 缺字段 ${f}`)
 }
 for (const [f, vals] of Object.entries(ENUM)) {
 const v = f === "reliability" ? a.provenance?.reliability : a[f]
 if (v != null && !vals.includes(v))
 errors.push(`${tag}: ${f} 非法值 "${v}"（应为 ${vals.join("/")}）`)
 }
 // ID 自动分配 / 校验
 if (!a.id && ENUM.type.includes(a.type)) {
 a.id = nextId(a.type)
 } else if (a.id) {
 const m = /^([ABCD])-(\d+)$/.exec(a.id)
 if (!m) errors.push(`${tag}: id 格式应为 -NN`)
 else if (a.type && m[1] !== a.type)
 errors.push(`${a.id}: id 前缀 ${m[1]} 与 type ${a.type} 不符`)
 }
 // 证据等级不得超过来源可靠度上限
 const rel = a.provenance?.reliability
 if (rel && a.evidenceLevel && LRANK[a.evidenceLevel] > LRANK[CAP[rel]])
 errors.push(
 `${a.id || tag}: 证据等级 ${a.evidenceLevel} 超过来源 ${rel} 上限 ${CAP[rel]}`,
 )
 // 裸奔 = 影响高 × 证据弱（派生，不落盘）
 if (a.impact === "high" && (a.evidenceLevel === "L1" || a.evidenceLevel === "L2"))
 naked.push(a.id || tag)
 // 过期（派生）
 const lv = a.freshness?.lastVerified
 const ttl = a.freshness?.ttlDays ?? 30
 if (lv) {
 const exp = new Date(lv).getTime() + ttl * 86400000
 if (now > exp) stale.push(a.id || tag)
 }
 // 待 sign-off: ≥L3 或 状态改为 validated/refuted 且未签字
 const strong =
 LRANK[a.evidenceLevel] >= 3 ||
 a.status === "validated" ||
 a.status === "refuted"
 if (strong && !a.provenance?.signedOffBy) needSignoff.push(a.id || tag)
})

// 回写自动分配的 ID
fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n")

// —— 论点 thesis.md 分层执法（v1.2）——
// 扁平标量字段硬失败（schemaVersion/id/needsRevision）；嵌套字段（revisions[]）软警告。
// revisions 必须写在 frontmatter，否则软检查抓不到。
// 零依赖约束：只用正则抓扁平 key:value，不解析嵌套 YAML（那需要库=engine 长回来）。
let thesisErrors = []
let revisionWarn = null
let thesisNeedsRevision = false
let thesisExists = false
const thesisFile = file.replace(/ledger\.json$/, "thesis.md")
if (thesisFile !== file && fs.existsSync(thesisFile)) {
 thesisExists = true
 const fm = /^---\n([\s\S]*?)\n---/.exec(fs.readFileSync(thesisFile, "utf8"))
 if (!fm) {
 thesisErrors.push("thesis.md 缺 frontmatter（需 --- 包裹的结构化字段段）")
 } else {
 const front = fm[1]
 // 扁平标量解析（只取 key: value，不解析嵌套/数组）
 const get = (k) => {
 const m = new RegExp(`^\\s*${k}:\\s*(.+?)\\s*$`, "m").exec(front)
 return m ? m[1].replace(/^["']|["']$/g, "") : null
 }
 // 1. schemaVersion const "4.0"（硬失败）
 const sv = get("schemaVersion")
 if (sv === null) thesisErrors.push('thesis.md frontmatter 缺 schemaVersion（应为 "4.0"）')
 else if (sv !== "4.0")
 thesisErrors.push(`thesis.schemaVersion 应为 "4.0"，实际 "${sv}"`)
 // 2. id pattern ^T-[0-9]{2,}$（硬失败）
 const tid = get("id")
 if (tid === null) thesisErrors.push("thesis.md frontmatter 缺 id（格式 T-NN）")
 else if (!/^T-[0-9]{2,}$/.test(tid))
 thesisErrors.push(`thesis.id 格式应为 T-NN（如 T-01），实际 "${tid}"`)
 // 3. needsRevision bool（硬失败）
 const nr = get("needsRevision")
 if (nr === null) thesisErrors.push("thesis.md frontmatter 缺 needsRevision（应为 true/false）")
 else if (nr !== "true" && nr !== "false")
 thesisErrors.push(`thesis.needsRevision 应为 true/false，实际 "${nr}"`)
 else thesisNeedsRevision = nr === "true"
 // 4. 嵌套 revisions[] 软警告（维持原逻辑，只提醒不阻断）
 const hasRevKey = /^\s*revisions:/m.test(front)
 const inlineNonEmpty = /^\s*revisions:\s*\[\s*\{/m.test(front)
 const blockItem = /^\s*revisions:\s*$[\s\S]*?^\s*-\s/m.test(front)
 const hasRevItem = inlineNonEmpty || blockItem
 if (thesisNeedsRevision && !hasRevItem)
 revisionWarn = hasRevKey
 ? "thesis.needsRevision=true 但 revisions[] 为空——论点待修订却没记录『为什么改』。"
 : "thesis.needsRevision=true 但缺 revisions[]——修订论点时请追加一条 {at, reason, before, after}（必须写在 frontmatter，否则 validator 抓不到）。"
 }
} else if (thesisFile !== file) {
 // thesis.md 不存在：软提醒，不硬失败（validator 主职是 ledger）
 revisionWarn = `未找到 ${thesisFile}——thesis 是北极星，建议尽快创建（跑 /new 或复制 kernel/templates/thesis.md）。`
}

console.log(`\n=== 内核校验: ${file} ===`)
console.log(
 `假设数: ${data.length} | \ud83d\udd34 裸奔: ${naked.length}${naked.length ? ` [${naked.join(", ")}]` : ""}`,
)
if (stale.length)
 console.log(`\u23f3 过期: ${stale.length} [${stale.join(", ")}]`)
if (needSignoff.length)
 console.log(
 `\u270d\ufe0f 待 sign-off: ${needSignoff.length} [${needSignoff.join(", ")}] — 跑 /review 确认`,
 )
if (revisionWarn)
 console.warn(
 `\n\u26a0\ufe0f  留痕提醒: ${revisionWarn}\n   （仅提醒，不影响校验结果；到 /review 时补上论点修订理由，并将 needsRevision 复位 false）`,
 )
if (thesisExists) {
 console.log(`   thesis: ${thesisErrors.length ? "\u274c " + thesisErrors.length + " 项硬约束违规" : "\u2705 扁平字段合规"}`)
}

// —— 启发式下一步（v1.2：复用已有 summary，零新命令）——
// 不编排、只读提示；告诉用户回路里下一个该跑哪个 skill/命令。
// 仅在无硬失败时打印（有硬失败时先修违规，谈下一步没意义）。
if (errors.length === 0 && thesisErrors.length === 0) {
 const next = []
 if (thesisNeedsRevision) next.push("@revise-thesis（论点待修订）")
 if (needSignoff.length) next.push("/review（有待 sign-off 的强声明）")
 if (naked.length) {
 const hasTodoNaked = data.some(
 (a) => a.impact === "high" && (a.evidenceLevel === "L1" || a.evidenceLevel === "L2") && a.status === "todo",
 )
 const hasTestingNaked = data.some(
 (a) => a.impact === "high" && (a.evidenceLevel === "L1" || a.evidenceLevel === "L2") && a.status === "testing",
 )
 if (hasTodoNaked) next.push("@experiment-design（把裸奔假设的最便宜验证落成实验规格）")
 if (hasTestingNaked) next.push("@evidence-intake（实验跑完，落回台账）")
 }
 if (next.length === 0 && !thesisNeedsRevision)
 console.log(`\n\ud83d\udc49 下一步: 回路暂无待办（无裸奔/无待修订/无待 sign-off）。可跑 /decide 收口决策。`)
 else if (next.length)
 console.log(`\n\ud83d\udc49 下一步: ${next.join(" / ")}`)
}

if (errors.length) {
 console.error(`\n\u274c 校验失败（${errors.length}）：`)
 errors.forEach((e) => console.error(` - ${e}`))
 process.exit(1)
}
if (thesisErrors.length) {
 console.error(`\n\u274c thesis 校验失败（${thesisErrors.length}）：`)
 thesisErrors.forEach((e) => console.error(` - ${e}`))
 process.exit(1)
}
console.log("\n\u2705 校验通过\n")

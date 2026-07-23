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
		if (!m) errors.push(`${tag}: id 格式应为 <TYPE>-NN`)
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

console.log(`\n=== 内核校验: ${file} ===`)
console.log(
	`假设数: ${data.length} | \ud83d\udd34 裸奔: ${naked.length}${naked.length ? ` [${naked.join(", ")}]` : ""}`,
)
if (stale.length)
	console.log(`\u23f3 过期: ${stale.length} [${stale.join(", ")}]`)
if (needSignoff.length)
	console.log(
		`\u270d\ufe0f  待 sign-off: ${needSignoff.length} [${needSignoff.join(", ")}] — 跑 /review 确认`,
	)
if (errors.length) {
	console.error(`\n\u274c 校验失败（${errors.length}）：`)
	errors.forEach((e) => console.error(`  - ${e}`))
	process.exit(1)
}
console.log("\n\u2705 校验通过\n")

#!/usr/bin/env node
// lookup.mjs — 跨项目检索历史假设与决策（零依赖）。
// 用法: node tools/lookup.mjs "<topic>" [--type=A|B|C|D] [--status=todo|testing|validated|refuted] [--current=<项目名>]
// 职责: 扫所有 workspace/*/ledger.json + thesis.md，按 topic 关键词 + type/status 筛选，
//       硬标 bizModel/stage 维度差异。不做语义匹配——语义判断交 agent 和人。
// 设计哲学: 脚本做结构化检索 + 维度硬标记；agent 做"适不适用"的语义判断。符合"LLM 判断/脚本纪律"。

import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const wsDir = path.join(root, "workspace")
if (!fs.existsSync(wsDir)) {
  console.error("✗ 找不到 workspace/ 目录")
  process.exit(1)
}

// 解析参数
const args = process.argv.slice(2)
let topic = null
let filterType = null
let filterStatus = null
let currentProj = null
for (const a of args) {
  if (a.startsWith("--type=")) filterType = a.slice(7)
  else if (a.startsWith("--status=")) filterStatus = a.slice(9)
  else if (a.startsWith("--current=")) currentProj = a.slice(10)
  else if (!a.startsWith("--")) topic = a
}
if (!topic) {
  console.error("用法: node tools/lookup.mjs \"<topic>\" [--type=A|B|C|D] [--status=todo|testing|validated|refuted] [--current=<项目名>]")
  process.exit(1)
}

// 读当前项目维度（用于维度差异硬标记）
let currentBiz = null, currentStage = null
if (currentProj) {
  const curThesis = path.join(wsDir, currentProj, "thesis.md")
  if (fs.existsSync(curThesis)) {
    const fm = /^---\n([\s\S]*?)\n---/.exec(fs.readFileSync(curThesis, "utf8"))
    if (fm) {
      const get = (k) => {
        const m = new RegExp(`^\\s*${k}:\\s*"?(.+?)"?\\s*$`, "m").exec(fm[1])
        return m ? m[1].replace(/^["']|["']$/g, "") : null
      }
      currentBiz = get("bizModel")
      currentStage = get("stage")
    }
  }
}

// 扫所有项目
const projects = fs.readdirSync(wsDir).filter(d => fs.statSync(path.join(wsDir, d)).isDirectory())
const results = []

for (const proj of projects) {
  const ledgerFile = path.join(wsDir, proj, "ledger.json")
  const thesisFile = path.join(wsDir, proj, "thesis.md")
  if (!fs.existsSync(ledgerFile)) continue

  // 读项目维度
  let projBiz = null, projStage = null
  if (fs.existsSync(thesisFile)) {
    const fm = /^---\n([\s\S]*?)\n---/.exec(fs.readFileSync(thesisFile, "utf8"))
    if (fm) {
      const get = (k) => {
        const m = new RegExp(`^\\s*${k}:\\s*"?(.+?)"?\\s*$`, "m").exec(fm[1])
        return m ? m[1].replace(/^["']|["']$/g, "") : null
      }
      projBiz = get("bizModel")
      projStage = get("stage")
    }
  }

  // 维度差异硬标记
  let dimFlag = ""
  if (currentBiz && projBiz) {
    dimFlag = (currentBiz === projBiz && (currentStage === projStage || !currentStage || !projStage))
      ? "✅ 维度一致"
      : `⚠️ 维度不一致(来源 ${projBiz || "?"}/${projStage || "?"}, 当前 ${currentBiz || "?"}/${currentStage || "?"})`
  }

  // 扫 ledger
  const ledger = JSON.parse(fs.readFileSync(ledgerFile, "utf8"))
  for (const a of ledger) {
    if (filterType && a.type !== filterType) continue
    if (filterStatus && a.status !== filterStatus) continue
    // topic 关键词匹配（简单 includes，不做语义）
    const haystack = `${a.statement || ""} ${a.failsIf || ""} ${a.killCriteria || ""} ${a.cheapestTest || ""}`.toLowerCase()
    if (!topic.split(/\s+/).some(kw => kw && haystack.includes(kw.toLowerCase()))) continue
    results.push({
      project: proj,
      biz: projBiz, stage: projStage,
      dimFlag,
      id: a.id, type: a.type, status: a.status, evidenceLevel: a.evidenceLevel,
      statement: a.statement,
      killCriteria: a.killCriteria,
      source: a.provenance?.source
    })
  }
}

// 输出
console.log(`\n## 跨项目检索 — "${topic}"\n`)
if (results.length === 0) {
  console.log("无匹配。换个关键词或去掉 type/status 筛选试试。")
  process.exit(0)
}
console.log(`### 匹配结果(共 ${results.length} 条)\n`)
results.forEach((r, i) => {
  console.log(`#### ${i + 1}. 来源: workspace/${r.project} · [bizModel=${r.biz || "?"}, stage=${r.stage || "?"}]`)
  console.log(`- 假设: ${r.id} (${r.type}, ${r.status}, ${r.evidenceLevel}) — ${r.statement}`)
  if (r.killCriteria) console.log(`- killCriteria: ${r.killCriteria}`)
  if (r.source) console.log(`- 证据: ${r.source}`)
  console.log(`- 维度差异: ${r.dimFlag || "未标(当前项目未指定)"}`)
  console.log("")
})
console.log("---")
console.log("⚠️ agent 只做检索与维度硬标记,不做迁移建议。是否适用当前项目由你判断。")

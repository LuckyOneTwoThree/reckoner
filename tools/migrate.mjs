#!/usr/bin/env node
// migrate.mjs — schemaVersion 4.0 → 4.1 升级脚本（零依赖）。
// 用法: node tools/migrate.mjs [workspace目录或 thesis.md 路径]
// 无参数则扫所有 workspace/*/thesis.md。
// 职责: 升 schemaVersion "4.0"→"4.1" + 插入 bizModel/stage 字段（空值，由人工/agent 回填）。
// 设计哲学: 迁移是确定性动作，交脚本不手改——符合"LLM 判断/脚本纪律"第一原则。

import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
let targets = []

if (process.argv[2]) {
  // 单参数：直接传 thesis.md 或 workspace 目录
  const arg = process.argv[2]
  if (arg.endsWith("thesis.md")) targets = [arg]
  else targets = [path.join(arg, "thesis.md")]
} else {
  // 无参数：扫所有 workspace/*/thesis.md
  const wsDir = path.join(root, "workspace")
  if (!fs.existsSync(wsDir)) {
    console.error("✗ 找不到 workspace/ 目录")
    process.exit(1)
  }
  targets = fs.readdirSync(wsDir)
    .filter(d => fs.statSync(path.join(wsDir, d)).isDirectory())
    .map(d => path.join(wsDir, d, "thesis.md"))
    .filter(f => fs.existsSync(f))
}

let migrated = 0
let skipped = 0

for (const file of targets) {
  let content = fs.readFileSync(file, "utf8")
  const fm = /^---\n([\s\S]*?)\n---/.exec(content)
  if (!fm) {
    console.log(`⚠ ${file}: 无 frontmatter，跳过`)
    skipped++
    continue
  }
  let front = fm[1]
  // 已是 4.1 → 跳过
  if (/^schemaVersion:\s*"4\.1"/m.test(front)) {
    console.log(`✓ ${file}: 已是 4.1，跳过`)
    skipped++
    continue
  }
  // 升版本号
  front = front.replace(/(^schemaVersion:\s*)"4\.0"/m, '$1"4.1"')
  // 若缺 bizModel 字段 → 插入空值占位（needsRevision 行后）
  if (!/^\s*bizModel:/m.test(front)) {
    front = front.replace(
      /(^needsRevision:\s*.+?$)/m,
      '$1\nbizModel: ""\nstage: ""'
    )
  }
  content = content.replace(/^---\n[\s\S]*?\n---/, `---\n${front}\n---`)
  fs.writeFileSync(file, content, "utf8")
  console.log(`✓ ${file}: 4.0 → 4.1（bizModel/stage 留空待回填）`)
  migrated++
}

console.log(`\n迁移完成: ${migrated} 升级 / ${skipped} 跳过`)
if (migrated > 0) {
  console.log("⚠️ 请人工/agent 回填 bizModel/stage 实际值（enum: B2B/B2C/B2B2C/自用 · 0→1/1→10/10→100）")
  console.log("⚠️ 回填后跑 npm run validate:all 确认全绿")
}

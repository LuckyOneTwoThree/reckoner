#!/usr/bin/env node
// new-project.mjs — 一键初始化一个新项目工作区。
// 用法: node tools/new-project.mjs <项目名> [--force]
// 生成: workspace/<项目名>/{thesis.md, ledger.json, sources/.gitkeep}
// 零依赖，只用 node 内置模块。

import { fileURLToPath } from "node:url"
import path from "node:path"
import fs from "node:fs"

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function die(msg) {
	console.error(`\n\u274c ${msg}\n`)
	process.exit(1)
}

const args = process.argv.slice(2)
const force = args.includes("--force")
const rawId = args.find((a) => !a.startsWith("--"))

if (!rawId) {
	die("缺少项目名。用法: node tools/new-project.mjs <项目名> [--force]")
}

// 规范化为 slug：小写、空格转连字符、只留 [a-z0-9-_]
const id = String(rawId)
	.trim()
	.toLowerCase()
	.replace(/\s+/g, "-")
	.replace(/[^a-z0-9\-_]/g, "")

if (!id) die(`项目名 "${rawId}" 规范化后为空，请用字母/数字命名。`)

const projDir = path.join(REPO, "workspace", id)
if (fs.existsSync(projDir) && !force) {
	die(`workspace/${id}/ 已存在。换个名字，或加 --force 覆盖（会清空该目录）。`)
}
if (fs.existsSync(projDir) && force) {
	fs.rmSync(projDir, { recursive: true, force: true })
}

// 读模板，剥掉顶部的“复制说明”注释行
const templatePath = path.join(REPO, "kernel", "templates", "thesis.md")
if (!fs.existsSync(templatePath)) die(`找不到模板: ${templatePath}`)
const today = new Date().toISOString().slice(0, 10)
const thesis = fs
	.readFileSync(templatePath, "utf8")
	.split("\n")
	.filter((line) => !line.startsWith("# 复制本文件"))
	.join("\n")
	.replace(/^createdAt:.*$/m, `createdAt: "${today}"`)

fs.mkdirSync(path.join(projDir, "sources"), { recursive: true })
fs.writeFileSync(path.join(projDir, "thesis.md"), thesis)
fs.writeFileSync(path.join(projDir, "ledger.json"), "[]\n")
fs.writeFileSync(path.join(projDir, "sources", ".gitkeep"), "")

console.log(`\n\u2705 已创建项目 workspace/${id}/`)
console.log(`   \u251c\u2500 thesis.md    \u2190 去填这里的六格`)
console.log(`   \u251c\u2500 ledger.json  (空台账，skill 会回写)`)
console.log(`   \u2514\u2500 sources/     (证据原文放这)`)
console.log(`\n\u4e0b\u4e00\u6b65: 填好 thesis.md 后跑 @assumption-xray\n`)

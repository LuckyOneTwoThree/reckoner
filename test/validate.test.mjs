// validate.test.mjs — validator 确定性纪律闸的单测（零依赖，Node 18+ 内置 node:test）
// 覆盖：裸奔 / 封顶 / ID 分配 / loadBearing 强制 / provenance 强制 / killCriteria 软警告 / --check 模式 / 回写修复
// 跑法: npm test 或 node --test

import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import { spawnSync } from "node:child_process"

const VALIDATE = path.resolve("tools/validate.mjs")
const VALID_THESIS = `---
schemaVersion: "4.1"
id: T-01
needsRevision: false
createdAt: 2026-01-01
---

# Test Thesis`

// 生成一条合法假设
function assumption(overrides = {}) {
  return {
    type: "A",
    statement: "测试假设",
    impact: "med",
    evidenceLevel: "L1",
    status: "todo",
    ...overrides,
  }
}

// 创建临时项目目录
function setup(ledger, thesis = VALID_THESIS) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pb-test-"))
  fs.writeFileSync(path.join(dir, "ledger.json"), JSON.stringify(ledger, null, 2))
  if (thesis) fs.writeFileSync(path.join(dir, "thesis.md"), thesis)
  return dir
}

// 跑 validator，返回 { code, stdout, stderr }
function run(dir, ...args) {
  const result = spawnSync("node", [VALIDATE, path.join(dir, "ledger.json"), ...args], {
    encoding: "utf8",
    cwd: process.cwd(),
  })
  return {
    code: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  }
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true })
}

// —— 1. 裸奔计算 ——
test("裸奔：impact:high + L1 → 报告裸奔", () => {
  const dir = setup([assumption({ impact: "high", evidenceLevel: "L1" })])
  try {
    const r = run(dir)
    assert.equal(r.code, 0)
    assert.match(r.stdout, /裸奔: 1/)
  } finally { cleanup(dir) }
})

test("裸奔：impact:med + L1 → 不报裸奔", () => {
  const dir = setup([assumption({ impact: "med", evidenceLevel: "L1" })])
  try {
    const r = run(dir)
    assert.equal(r.code, 0)
    assert.match(r.stdout, /裸奔: 0/)
  } finally { cleanup(dir) }
})

test("裸奔：impact:high + L3 → 不报裸奔（证据够强）", () => {
  const dir = setup([assumption({ impact: "high", evidenceLevel: "L3", provenance: { reliability: "direct" } })])
  try {
    const r = run(dir)
    assert.equal(r.code, 0)
    assert.match(r.stdout, /裸奔: 0/)
  } finally { cleanup(dir) }
})

// —— 2. 证据等级封顶 ——
test("封顶：evidenceLevel L4 + reliability self → 失败", () => {
  const dir = setup([assumption({ evidenceLevel: "L4", provenance: { reliability: "self" } })])
  try {
    const r = run(dir)
    assert.equal(r.code, 1)
    assert.match(r.stderr, /超过来源 self 上限 L1/)
  } finally { cleanup(dir) }
})

test("封顶：evidenceLevel L3 + reliability direct → 通过", () => {
  const dir = setup([assumption({ evidenceLevel: "L3", provenance: { reliability: "direct" } })])
  try {
    const r = run(dir)
    assert.equal(r.code, 0)
  } finally { cleanup(dir) }
})

// —— 3. provenance 强制（v1.3）——
test("provenance 强制：L4 无 reliability → 失败", () => {
  const dir = setup([assumption({ evidenceLevel: "L4" })])
  try {
    const r = run(dir)
    assert.equal(r.code, 1)
    assert.match(r.stderr, /≥ L3 但缺 provenance\.reliability/)
  } finally { cleanup(dir) }
})

test("provenance 强制：L3 无 reliability → 失败", () => {
  const dir = setup([assumption({ evidenceLevel: "L3" })])
  try {
    const r = run(dir)
    assert.equal(r.code, 1)
    assert.match(r.stderr, /≥ L3 但缺 provenance\.reliability/)
  } finally { cleanup(dir) }
})

test("provenance 强制：L2 无 reliability → 通过（弱证据不要求）", () => {
  const dir = setup([assumption({ evidenceLevel: "L2" })])
  try {
    const r = run(dir)
    assert.equal(r.code, 0)
  } finally { cleanup(dir) }
})

// —— 4. ID 分配 ——
test("ID 分配：新假设无 id → 自动分配 TYPE-NN", () => {
  const dir = setup([
    assumption({ type: "A" }),
    assumption({ type: "A" }),
    assumption({ type: "B" }),
  ])
  try {
    const r = run(dir)
    assert.equal(r.code, 0)
    const written = JSON.parse(fs.readFileSync(path.join(dir, "ledger.json"), "utf8"))
    assert.equal(written[0].id, "A-01")
    assert.equal(written[1].id, "A-02")
    assert.equal(written[2].id, "B-01")
  } finally { cleanup(dir) }
})

test("ID 分配：已有 ID 不重新分配", () => {
  const dir = setup([assumption({ id: "A-05", type: "A" })])
  try {
    const r = run(dir)
    assert.equal(r.code, 0)
    const written = JSON.parse(fs.readFileSync(path.join(dir, "ledger.json"), "utf8"))
    assert.equal(written[0].id, "A-05")
  } finally { cleanup(dir) }
})

// —— 5. loadBearing 强制（v1.3）——
test("loadBearing 强制：承重假设 refuted + needsRevision=false → 失败", () => {
  const dir = setup([
    assumption({ loadBearing: true, status: "refuted", evidenceLevel: "L3", provenance: { reliability: "direct" } }),
  ])
  try {
    const r = run(dir)
    assert.equal(r.code, 1)
    assert.match(r.stderr, /承重假设.*已 refuted 但 thesis\.needsRevision=false/)
  } finally { cleanup(dir) }
})

test("loadBearing 强制：承重假设 refuted + needsRevision=true → 通过", () => {
  const thesis = VALID_THESIS.replace("needsRevision: false", "needsRevision: true")
  const dir = setup([
    assumption({ loadBearing: true, status: "refuted", evidenceLevel: "L3", provenance: { reliability: "direct" } }),
  ], thesis)
  try {
    const r = run(dir)
    assert.equal(r.code, 0)
  } finally { cleanup(dir) }
})

test("loadBearing 强制：非承重假设 refuted + needsRevision=false → 通过", () => {
  const dir = setup([
    assumption({ loadBearing: false, status: "refuted", evidenceLevel: "L3", provenance: { reliability: "direct" } }),
  ])
  try {
    const r = run(dir)
    assert.equal(r.code, 0)
  } finally { cleanup(dir) }
})

test("loadBearing 强制：承重假设 validated → 通过（不触发）", () => {
  const dir = setup([
    assumption({ loadBearing: true, status: "validated", evidenceLevel: "L3", provenance: { reliability: "direct" } }),
  ])
  try {
    const r = run(dir)
    assert.equal(r.code, 0)
  } finally { cleanup(dir) }
})

// —— 6. killCriteria 软警告 ——
test("killCriteria：无数字 → 软警告但不失败", () => {
  const dir = setup([assumption({ killCriteria: "用户反馈不满意" })])
  try {
    const r = run(dir)
    assert.equal(r.code, 0)
    assert.match(r.stderr, /killCriteria 无数字/)
  } finally { cleanup(dir) }
})

test("killCriteria：有数字 → 不警告", () => {
  const dir = setup([assumption({ killCriteria: "留存率 < 30%" })])
  try {
    const r = run(dir)
    assert.doesNotMatch(r.stdout, /killCriteria 无数字/)
  } finally { cleanup(dir) }
})

// —— 7. --check 模式 ——
test("--check：无未分配 ID → 通过且不回写", () => {
  const dir = setup([assumption({ id: "A-01", type: "A" })])
  const before = fs.readFileSync(path.join(dir, "ledger.json"), "utf8")
  try {
    const r = run(dir, "--check")
    assert.equal(r.code, 0)
    const after = fs.readFileSync(path.join(dir, "ledger.json"), "utf8")
    assert.equal(before, after, "文件不应被修改")
  } finally { cleanup(dir) }
})

test("--check：有未分配 ID → 失败（提示本地跑无 --check）", () => {
  const dir = setup([assumption({ type: "A" })]) // 无 id
  try {
    const r = run(dir, "--check")
    assert.equal(r.code, 1)
    assert.match(r.stderr, /存在未分配 ID 的假设/)
  } finally { cleanup(dir) }
})

// —— 8. 回写修复 ——
test("回写修复：无新 ID 分配 → 不回写文件", () => {
  const dir = setup([assumption({ id: "A-01", type: "A" })])
  const before = fs.readFileSync(path.join(dir, "ledger.json"), "utf8")
  try {
    const r = run(dir)
    assert.equal(r.code, 0)
    const after = fs.readFileSync(path.join(dir, "ledger.json"), "utf8")
    assert.equal(before, after, "无新 ID 分配不应回写")
  } finally { cleanup(dir) }
})

test("回写修复：有新 ID 分配 → 回写文件", () => {
  const dir = setup([assumption({ type: "A" })]) // 无 id
  try {
    const r = run(dir)
    assert.equal(r.code, 0)
    const written = JSON.parse(fs.readFileSync(path.join(dir, "ledger.json"), "utf8"))
    assert.ok(written[0].id, "应该分配了 ID 并回写")
  } finally { cleanup(dir) }
})

// —— 9. thesis 校验 ——
test("thesis：缺 schemaVersion → 失败", () => {
  const thesis = `---
id: T-01
needsRevision: false
---
# Test`
  const dir = setup([assumption()], thesis)
  try {
    const r = run(dir)
    assert.equal(r.code, 1)
    assert.match(r.stderr, /缺 schemaVersion/)
  } finally { cleanup(dir) }
})

test("thesis：id 格式错误 → 失败", () => {
  const thesis = VALID_THESIS.replace("id: T-01", "id: bad-format")
  const dir = setup([assumption()], thesis)
  try {
    const r = run(dir)
    assert.equal(r.code, 1)
    assert.match(r.stderr, /id 格式应为 T-NN/)
  } finally { cleanup(dir) }
})

// —— 10. 枚举校验 ——
test("枚举：非法 type → 失败", () => {
  const dir = setup([assumption({ type: "X" })])
  try {
    const r = run(dir)
    assert.equal(r.code, 1)
    assert.match(r.stderr, /type 非法值/)
  } finally { cleanup(dir) }
})

test("枚举：缺必填字段 → 失败", () => {
  const a = assumption()
  delete a.statement
  const dir = setup([a])
  try {
    const r = run(dir)
    assert.equal(r.code, 1)
    assert.match(r.stderr, /缺字段 statement/)
  } finally { cleanup(dir) }
})

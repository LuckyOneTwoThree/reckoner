# 回写契约 Write-back Contract

> 所有 skill 对内核（`thesis` + `assumption-ledger`）的写入都必须遵守本契约。
> 目的：让内核可信到值得留存——不可信的记忆比没有记忆更糟。

## 1. 信任分级（Trust Tiers）

内核里的每条信息都带可信度，别把“猜的”和“验证过的”混为一谈。

| 层级 | 含义 | 谁能写 |
|---|---|---|
| 结构性写入 | 新增假设、拆解、打草稿标签 | skill 自动写 |
| 弱证据（≤L2） | 间接信号、访谈片段 | skill 自动写 |
| 强声明（≥L3） | 直接证据 / 数据验证 | **必须人工 sign-off** |
| 状态终局 | status → validated / refuted | **必须人工 sign-off** |

## 2. 分级 sign-off

- **自动落库**：结构性改动 + `evidenceLevel ≤ L2`。跑完 skill 直接写，不打断用户。
- **需确认**：`evidenceLevel ≥ L3`，或 `status` 拟改为 `validated`/`refuted`。这类先挂“待确认”，攒到 `/review` 一次批。
- sign-off 通过后写入 `provenance.signedOffBy` + `signedOffAt`，并刷新 `freshness.lastVerified`。
- **signedOffBy 值格式**（v1.2 规定，便于跨项目复盘读得懂）：
  - 字符串。两种合法值：人工签字写人名或邮箱本地名（如 `"alice"` / `"leo@team"`）；agent 代批写 `agent:<skill 或命令名>`（如 `"agent:/review"`）。
  - `null` = 未签字（待 sign-off 项的初始值）。
  - 不接受空字符串 `""`；要签字就写真值，不签字就保持 `null`。

## 3. 证据等级上限（Reliability Cap）

证据等级不能超过来源可靠度——你不能凭"我觉得"写出 L4。

| provenance.reliability | evidenceLevel 上限 |
|---|---|
| self（自己觉得） | L1 |
| indirect（间接/二手） | L2 |
| direct（直接观察/访谈） | L3 |
| data（量化数据） | L4 |

**强证据必须声明来源**（v1.3）：`evidenceLevel ≥ L3` 时 `provenance.reliability` 不可为空——不能凭"我觉得"写 L3+。违反由 validator 直接判 **校验失败（exit 1）**。

违反上限由 `tools/validate.mjs` 直接判 **校验失败（exit 1）**。

## 4. 循环状态机（Loop State Machine）

内核是活的：假设被推翻要反推论点，别让论点静静地错下去。

**承重假设**（v1.3）：agent 在 ledger 标 `loadBearing: true` 表示"错了整个论点就垮"。validator 强制：`loadBearing=true && status=refuted` 时，对应 `thesis.needsRevision` 必须为 `true`，否则 exit 1——把"活的闭环"从口号落成代码。

```
承重假设（loadBearing: true）status → refuted
        │
        ▼
thesis.needsRevision = true   ← validator v1.3 硬性强制
        │
        ▼
用户修订论点 → 追加 thesis.revisions[]（留痕：at / reason / before / after）
        │
        ▼
needsRevision 复位 false
```

「影响等级升 high」「裸奔被验证/推翻」都已被现有机制接住，无需独立扫描：前者由 validator 现算 `isNaked`（§5）→ 启发式路由到 `@experiment-design`；后者由状态机（§4.1）→ `sign-off` / `needsRevision`。跑 `validate.mjs` 即自动接住。

### 4.1 合法状态转移图（v1.2 显式列出）

`assumption.status` 只允许以下转移，非法转移由 agent 在回写时拦下（validator 不强制 status 转移合法性，靠 skill 自律 + /review 兜底）：

```
todo ──(experiment-design 设计实验)──→ testing
todo ──(直接被证据推翻，evidence-intake)──→ refuted     [允许，跳过 testing]
testing ──(证据支持 + /review sign-off)──→ validated
testing ──(证据反驳 + /review sign-off)──→ refuted
testing ──(发现实验设计错，回炉)──→ todo                  [允许回退]
validated ──(新证据推翻，evidence-intake)──→ refuted      [允许，触发 needsRevision]
refuted ──(论点 pivot 后重新成立)──→ todo                  [允许，新论点下重测]
```

**不允许**：`validated → todo`（已验证不能退回未测，除非论点 pivot）、`validated → testing`（要重测就先 refuted 再 pivot）。
**一次到位允许**：`todo → validated`（一次实验直接验证通过）和 `todo → refuted`（没测就被推翻）都合法——只要证据等级与 sign-off 到位。

## 5. 派生字段（不落盘）

下列字段**不写进 JSON**，每次由 validator 现算，避免陈旧：

- `isNaked` = `impact === high && evidenceLevel ∈ {L1, L2}`
- `stale` = `freshness.lastVerified + ttlDays < 今天`（`ttlDays` 默认 30）

## 6. 铁律

1. 任何 `ledger.json` 改动，结束时必须 `node tools/validate.mjs` 通过才算完成。
2. 新假设 `id` 留空，交 validator 按 `<TYPE>-NN` 分配。
3. 不手写派生字段；不跳过校验直接宣称已更新。
4. **承重假设必须标 `loadBearing: true`**（v1.3）：错了整个论点就垮的假设，agent 必须在 ledger 标记。validator 强制：承重假设 `refuted` → `thesis.needsRevision=true`。
5. **强证据必须声明来源**（v1.3）：`evidenceLevel ≥ L3` 时 `provenance.reliability` 不可为空。

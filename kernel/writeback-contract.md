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

## 3. 证据等级上限（Reliability Cap）

证据等级不能超过来源可靠度——你不能凭“我觉得”写出 L4。

| provenance.reliability | evidenceLevel 上限 |
|---|---|
| self（自己觉得） | L1 |
| indirect（间接/二手） | L2 |
| direct（直接观察/访谈） | L3 |
| data（量化数据） | L4 |

违反由 `tools/validate.mjs` 直接判 **校验失败（exit 1）**。

## 4. 循环状态机（Loop State Machine）

内核是活的：假设被推翻要反推论点，别让论点静静地错下去。

```
假设 status → refuted（且为承重假设）
        │
        ▼
thesis.needsRevision = true   ← 自动置位
        │
        ▼
用户修订论点 → 追加 thesis.revisions[]（留痕：at / reason / before / after）
        │
        ▼
needsRevision 复位 false
```

影响等级从非 high 升到 high、或裸奔假设被验证/推翻，同样触发上面的复查。

## 5. 派生字段（不落盘）

下列字段**不写进 JSON**，每次由 validator 现算，避免陈旧：

- `isNaked` = `impact === high && evidenceLevel ∈ {L1, L2}`
- `stale` = `freshness.lastVerified + ttlDays < 今天`（`ttlDays` 默认 30）

## 6. 铁律

1. 任何 `ledger.json` 改动，结束时必须 `node tools/validate.mjs` 通过才算完成。
2. 新假设 `id` 留空，交 validator 按 `<TYPE>-NN` 分配。
3. 不手写派生字段；不跳过校验直接宣称已更新。

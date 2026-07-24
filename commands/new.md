---
name: new
description: "一键初始化一个新项目工作区：生成 thesis.md（论点模板）、空 ledger.json（假设台账）和 sources/ 目录。免去手动复制模板。"
---

# /new — 新建项目工作区

把「复制模板 → 建空台账 → 建证据目录」这套开场动作收成一条命令。

## 流程

1. 向用户确认项目名（英文短横线 slug，如 `async-standup`）。
2. 运行:
   ```
   node tools/new-project.mjs <项目名>
   ```
   脚本会在 `workspace/<项目名>/` 下生成:
   - `thesis.md` — 从 `kernel/templates/thesis.md` 生成、已填好 `createdAt`
   - `ledger.json` — 空台账 `[]`
   - `sources/` — 证据原文目录
3. 若目录已存在，脚本会报错;确认要覆盖时加 `--force`。
4. 引导用户打开 `workspace/<项目名>/thesis.md` 填写六格。填完：
   - 若 thesis 第6格「最致命假设」已带种子假设 → 直接 `@assumption-xray` 红队。
   - 若需补 A/B/C 假设面（已有访谈/竞品数据）→ 先跑 `@user-insight` / `@competitor-teardown` 丰富证据，再进红队。
   - 入料口为可选增强，非必经——xray 自己也会归类 A/B/C/D。

## 说明

- 项目名会自动规范化为小写 slug（空格转 `-`，去掉特殊字符）。
- 多项目并存：每个项目一个隔离文件夹，ID 项目内编号，互不冲突。

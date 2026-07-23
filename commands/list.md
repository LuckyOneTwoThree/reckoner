---
name: list
description: "列出 workspace 下所有项目及其一句话论点，用于多项目切换时先确认要操作哪个项目，避免读写串到别的项目。纯只读。"
---

# /list — 列出所有项目

多项目并存时，动手前先看清有哪些项目、各自在讲什么，挑对再进回路。这是多项目隔离的第一道人工确认。

## 流程

1. 列出 `workspace/` 下所有项目目录：
   ```
   ls workspace/
   ```
2. 对每个项目，读 `workspace/<项目>/thesis.md` 提取：一句话论点（statement）、targetUser、`needsRevision` 状态；读 `ledger.json` 长度得到假设数。
3. 汇总成一张表输出：
   ```
   | 项目 slug | 一句话论点 | 目标用户 | 待修订? | 假设数 |
   ```
4. 问用户接下来要操作哪个项目；确认后回显 `当前项目: workspace/<slug>/`，再进入对应 skill / 命令。

## 说明

- **纯只读**，不改任何文件。
- 与各 skill 的“回显当前项目”门槛配合：`/list` 负责挑对项目，skill 负责写前二次确认路径。
- 若 `workspace/` 为空，提示用户先跑 `/new` 建项目。

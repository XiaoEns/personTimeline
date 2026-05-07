---
name: 任务状态更新规范
description: 执行任务前和提交代码前，都必须更新 tasks.md 中的任务状态
type: feedback
---

执行任务前和提交代码前，都必须更新 `docs/specs/<spec-id>/tasks.md` 中对应任务的状态标记。

**Why:** tasks.md 是项目进度的唯一真实来源，状态标签（⬜ 未开始 / 🔄 进行中 / ✅ 已完成）让团队成员无需翻看 git log 即可了解当前进度。

**How to apply:**
- 开始执行某个 Task 前 → 将状态改为 🔄 进行中
- 完成某个 Task 后、提交前 → 将状态改为 ✅ 已完成
- 状态更新与代码修改放在同一个 commit 中

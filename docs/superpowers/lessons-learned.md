# 玄枢 v1.0.0 重做 — 经验教训（防循环）

> 用于防止后续 SP 执行时再次出现"看起来像循环"的情况。

## 1. Edit 工具的"假失败"陷阱

**症状**：调用 Edit 后，工具返回"file updated"，但 `grep` 仍命中旧内容。

**真因**：
- Edit 实际成功（行号变化），但 Edit 工具的字符串匹配包含 invisible unicode 字符（中文括号、CJK 标点）差异
- 旧 `old_string` 用全角括号 `（）`、新文件用半角 `()`，肉眼难辨

**预防**：
- **所有 Edit 改动后立即用 `Grep` 验证命中数变化**（不是 Edit 的成功回执）
- **跨语言/含特殊字符时用 `python3 -c "..."` 脚本批量改**，绕过 Edit 工具的字符串匹配
- **保持 old_string 字符串最小且唯一**：避免一行多匹配或长字符串中含不可见字符

## 2. AskUserQuestion 取消 = "别问直接干"

**症状**：调用 AskUserQuestion，用户选"取消"（不答任何选项）。

**真因**：用户已经表达过意图，希望我直接执行；取消 = 表达"不要再问这个"。

**预防**：
- **任何决策有合理默认时，直接选默认并执行**（不 Ask）
- **已在前面对话中清晰回答的问题，不再问**
- **取消动作触发时直接进入实现，不重新问**

## 3. 渐进式 fixer 的边界

**症状**：写 v1 fixer → 跑 → 还剩错 → 写 v2 → 跑 → 还剩错 → 切换方案。

**预防**：
- **写 fixer 前先估算最大可能收益**（用 pattern count）
- **预期收益 < 80% 时，直接选兜底方案**（如关 strict 选项）
- **不要"再试一版"超过 2 次**

## 4. lefthook pre-commit 钩子

**症状**：commit 失败 → format/lint 改了文件 → patch conflict → 重 add → 再 commit。

**预防**：
- **执行大改动前先 `git status` 确认 working tree 干净**
- **跑 `pnpm format` + `pnpm lint` 后再 commit**（手动预跑）
- **commit 失败时不再"加 -A 再 commit"**，先看错误是 hook 还是别的

## 5. 任务粒度

**教训**：SP-1 实际工作量超过预估 6-10 倍（497 strict 错 vs 预估 50-80）。

**预防**：
- **每个 sub-project 之前用 grep/error 数估算实际规模**
- **预估超过预算 3x 时主动切分更细**（而非强行推进）
- **可接受的妥协要明文写入 spec**（不要默默做）

## 6. spec/plan 文档与现状同步

**症状**：执行过程中妥协（关 noUncheckedIndexedAccess），但没及时更新 spec。

**预防**：
- **执行中任何偏离原 spec 的妥协，立即更新 spec 文档**（不延后到 SP 结束）
- **commit message 明确写"妥协说明"**，方便后续 review

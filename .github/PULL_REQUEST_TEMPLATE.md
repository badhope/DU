<!--
Bilingual PR template · 中英双语 PR 模板
Fill in the English sections. 中文部分是给中文 reviewer 看的 summary，可空。
-->

## What · 改动

<!-- Brief description of this PR. 简述此次 PR 的内容 -->

---

## Why · 原因

<!-- Why is this change needed? Link any related issue. 为什么需要这次改动？关联的 Issue 编号 -->

Closes #

---

## Type of change · 类型

- [ ] New tool (`feat`) · 新工具
- [ ] Bug fix (`fix`) · Bug 修复
- [ ] Documentation (`docs`) · 文档
- [ ] Refactor (`refactor`) · 重构
- [ ] Performance (`perf`) · 性能
- [ ] CI / automation (`ci`) · CI / 自动化
- [ ] Security (`chore(security)`) · 安全
- [ ] Dependency upgrade (`chore(deps)`) · 依赖升级
- [ ] Other (`chore`) · 其他

---

## Breaking change · 破坏性变更

- [ ] This PR contains a breaking change (API / data shape / deploy flow) · 此 PR 包含破坏性变更

<!-- If checked, detail below: impact, migration plan, CHANGELOG entry. 勾选请详述：影响面、迁移方案、CHANGELOG 标注。 -->

---

## How to verify · 验证

<!-- Steps to verify this change works. 如何验证此次改动 -->

- [ ] `pnpm run format:check` passes
- [ ] `pnpm run lint` passes
- [ ] `pnpm run test` passes
- [ ] `pnpm run type-check` passes
- [ ] `pnpm run build:h5` passes
- [ ] Manually exercised the main path in H5 at least once · 手动在 H5 上至少跑通一次主路径

---

## Affected files · 影响的文件

<!-- Bullet list of key files. 主要文件列表 -->

- `src/...`
- `src/config/tools.ts`
- `src/pages.json`
- ...

---

## Screenshots / logs · 截图 / 日志

<!-- If applicable. 如有 -->

---

## Related · 关联

<!-- Related PRs, issues, discussions. 关联的 PR、Issue、Discussion -->

- Related: #N
- Discussion: #N

---

## CHANGELOG · 变更日志

- [ ] I added an entry to [CHANGELOG.md](../../CHANGELOG.md) under `[Unreleased]` · 已在 [CHANGELOG.md](../../CHANGELOG.md) 的 `[Unreleased]` 段记录本条改动

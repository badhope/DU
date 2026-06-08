# 贡献指南

## 提 PR 流程

1. Fork → 在 `main` 之外开分支（建议命名 `feat/<scope>` / `fix/<scope>` / `docs/<scope>`）
2. 本地跑 `pnpm run type-check` + `pnpm run build:h5`，确认无错误
3. 推送分支 → 开 PR 到 `badhope/mistverse:main`
4. CI 会跑 type-check + build，必须通过
5. 维护者会 review，merge 由维护者执行

## Commit 规范

参考 Conventional Commits：

```
<type>(<scope>): <subject>

<body>
```

`type`：`feat` / `fix` / `docs` / `style` / `refactor` / `perf` / `test` / `chore` / `ci`
`scope`（可选）：`bazi` / `tarot` / `tools` / `ci` / `deps` / `docs` 等

## 提 PR 前

- [ ] 改了 `src/config/tools.ts` 的话，确保新增/删除工具的 entry 完整
- [ ] 改了 `src/pages.json` 的话，新增/删除 page 配套
- [ ] 改了 `src/utils/` 的话，至少跑通 `type-check`
- [ ] 没有把 `node_modules` / `dist` / `.env*` 误提交

## 工具接入

新工具需要在以下文件补完：

- `src/pages/<key>/<key>.vue` — 页面
- `src/components/charts/<Name>Chart.vue` — 图表组件（可选）
- `src/utils/<name>.ts` — 算法逻辑
- `src/config/tools.ts` — 元数据
- `src/pages.json` — 注册路由

## 依赖更新

`pnpm` 依赖与 GitHub Actions 由 Dependabot 维护，每周自动开 PR。手动改 `package.json` 时同步更新 `pnpm-lock.yaml`。

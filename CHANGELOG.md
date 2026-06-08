# Changelog

所有重要变更记录在此文件。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Security
- 修正 `localStorage` key 文档（`v1` → `v2`），与 `src/stores/index.ts` 实际值一致
- `package.json` 加 `"private": true` 防止误 `npm publish`
- `package.json` 加 `engines.node >=20` / `engines.pnpm >=9`
- `package.json` 加 `author` 字段（`badhope <https://github.com/badhope>`）
- 新增 `pnpm audit` 步骤到 CI（生产依赖高危阻断，dev 依赖只警告）
- 新增 CodeQL workflow（`javascript-typescript`）
- gitleaks 调度从 weekly 改为 daily
- gitleaks 取消 `continue-on-error`，泄漏密钥直接失败
- 新增 PR 模板的 "破坏性变更" 与 "CHANGELOG" 必填项
- 新增 OG / Twitter / favicon meta 与 `robots.txt`
- `postbuild:h5` 把 `robots.txt` 复制到 `dist/build/h5/` 根
- `vue-i18n` 升级 `^9.1.9` → `^9.1.11`（修复 `Vue I18n Allows Prototype Pollution in handleFlatJson`）
- `vite` 升级 `5.2.8` → `5.4.20`（修复 `launch-editor` 命令注入 + `server.fs` 绕过）
- `pnpm.overrides` 强制 `jpeg-js@^0.4.4` / `@intlify/core-base@^9.1.11` / `@intlify/message-resolver@^9.1.11`，覆盖 uni-app 内置的 9.1.9 版本

### Changed
- `author` 从 `Mistverse Team` 改为 `badhope <https://github.com/badhope>`
- README 目录结构补全（新增 workflows/codeql、tests、config 文件等）
- `robots.txt` 移除 `Sitemap:` 引用（纯静态 hash SPA 无独立 sitemap）
- README 移除不存在的 `public/` 目录说明

## [1.0.1] - 2026-06-08

### Added
- 开发者配置：Prettier、ESLint、Vitest、Lefthook、commitlint、VSCode 推荐
- `pnpm run lint` / `format` / `test` / `type-check` / `build:h5` 脚本
- CI 拆为 format / lint / test / build 四个 job
- Lefthook pre-commit（prettier + eslint）/ commit-msg（commitlint）
- `.editorconfig` / `.gitattributes` / `.gitignore` 完善
- `.github/ISSUE_TEMPLATE/config.yml` 关闭空白 issue

## [1.0.0] - 2026-06-08

### Added
- 49 个核心工具：命理 6、占卜 6、古物 5、健康 4、修心 4、生活 4、其他 14、辅助师 6
- 多用户管理（一日同人同工具不重测）
- 仪式化扫描动画、AI 辅助师 3 阶段动画
- GitHub Pages 部署（`actions/deploy-pages`）
- gitleaks 密钥扫描
- 开源协作文件：CONTRIBUTING、CODE_OF_CONDUCT、LICENSE（MIT）
- 分支保护：所有改动必须走 PR

### Security
- TypeScript strict 模式
- gitleaks 在 push / PR 阶段扫描
- `localStorage` 隔离用户数据，无第三方分析

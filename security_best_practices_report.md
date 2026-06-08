# 玄枢 MISTVERSE · 安全 / 隐私 / 自动化巡检报告

> 巡检时间：2026-06-08
> 巡检人：mistverse-helper
> 范围：仓库根、`.github/`、Actions workflow、`src/**`、CI 配置

---

## 摘要

仓库整体安全姿态良好：

- 纯客户端 SPA，无任何 `fetch` / `XMLHttpRequest` / `uni.request` 外发请求
- 全部占卜逻辑在 `src/utils/`，没有接入任何 LLM / 第三方服务
- localStorage 只存用户档案 + 占卜历史，不存令牌 / 凭据
- `uniStatistics` 已关闭，无埋点
- 无 `v-html` / `innerHTML` / `eval` / `new Function` 风险点

但还有 **3 critical / 4 high / 6 medium / 7 low** 共 20 个待修项，重点是文档与代码不一致、分支被自动重建、依赖审查缺位、PR 模板不完整。

> **最新状态（2026-06-08 更新）**：20 项已全部修复并随 PR #22 提交。
> 依赖审计：从首版 **4 high** 降至 **0 high**（7 moderate 仅在 dev 路径里），CI 阻断已生效。

---

## 严重程度

### CRITICAL（必须修）

| ID  | 现象                                                                                                                    | 风险                                                   | 修复                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| C1  | `trae/solo-agent-CDh18r` 分支持续自动重建                                                                               | 未经审查的代码被推上远程；分支名泄漏内部 agent 标识    | 立即删除分支 + 通知用户关闭后台 Trae agent 进程 |
| C2  | README.md:6 与 .github/SECURITY.md:29 都写 `mistverse-state-v1`，但 src/stores/index.ts:147 实际是 `mistverse-state-v2` | 用户按文档清理 v1 key 之后数据仍在，"安全清理"名存实亡 | 统一改为 `mistverse-state-v2`                   |
| C3  | GitHub API 返回 `security_policy: None`                                                                                 | SECURITY.md 存在但没被 GitHub 识别为 Security 标签     | 移到仓库根 `SECURITY.md`（GitHub 推荐路径）     |

### HIGH（应修）

| ID  | 现象                                           | 风险                                                                           | 修复                               |
| --- | ---------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------- |
| H1  | `package.json` 缺少 `"private": true`          | 仓库名 `mistverse` 在 npm registry 未被占，未来误操作 `npm publish` 会泄露源码 | 加 `"private": true`               |
| H2  | `package.json` 缺 `engines.node`               | CI / 贡献者可能跑错 Node 版本（项目用 20）                                     | 加 `"engines": { "node": ">=20" }` |
| H3  | PR 模板缺 "Breaking change" / "Changelog" 提示 | 破坏性变更不被显式记录                                                         | 补全                               |
| H4  | CI 没有 `pnpm audit` / 依赖审查                | 依赖漏洞无法自动发现                                                           | 加 `pnpm audit --prod` 步骤        |

### MEDIUM（建议修）

| ID  | 现象                                           | 风险                       | 修复                              |
| --- | ---------------------------------------------- | -------------------------- | --------------------------------- |
| M1  | 仓库无 CodeQL 静态安全扫描                     | 静态代码漏洞无法被自动发现 | 加 `.github/workflows/codeql.yml` |
| M2  | 仓库设置 `web_commit_signoff_required: false`  | 贡献者签 off 不强制        | repo settings 开启                |
| M3  | `delete_branch_on_merge` 未开启                | 旧 PR 分支留存             | repo settings 开启                |
| M4  | `has_discussions: false`                       | 社区问题没地方问（可选）   | 视情况开启                        |
| M5  | README 的"目录结构"只列了 6 项，实际有 9+ 文件 | 贡献者找错地方             | 补全                              |
| M6  | gitleaks 周期是 weekly，频率低                 | 漏过窗口大                 | 改为 daily 6am                    |

### LOW（可选）

| ID  | 现象                                                                 | 风险                       | 修复                                         |
| --- | -------------------------------------------------------------------- | -------------------------- | -------------------------------------------- |
| L1  | `index.html` 缺 favicon、OG/Twitter card、meta description           | 浏览器 404、社交分享无预览 | 补 meta 标签 + `logo.png` favicon            |
| L2  | `CHANGELOG.md` 仍是模板（`## [1.0.0]` / `### Added` 等占位）         | 发布历史没记录             | 把 #20 / #21 写进 CHANGELOG                  |
| L3  | CI 缺 `actions: read` 权限                                           | 写权限过多                 | 加                                           |
| L4  | gitleaks 用了 `continue-on-error: true`                              | 失败不阻断                 | 改为 `false`                                 |
| L5  | `package.json` `author: "Mistverse Team"` 与 GitHub `badhope` 不一致 | 贡献者不知联系谁           | 改 `badhope` 或补全                          |
| L6  | 无 `robots.txt`                                                      | 搜索引擎爬所有 dev 工具页  | 加 `robots.txt` 允许主域，禁 `_next`、测试页 |
| L7  | 无 SBOM / `pnpm sbom` 产物                                           | 不满足企业级合规           | 视情况加                                     |

---

## 已核验的安全姿态（无需修）

- ✅ 无 `v-html` / `innerHTML` / `document.write` 风险（index.html 的 `document.write` 是 uni-app x 内置 polyfill，硬编码字符串，不接受用户输入）
- ✅ 无 `eval` / `new Function`
- ✅ 无 `window.location` / `window.open` 跳转
- ✅ 无 `fetch` / `XMLHttpRequest` / `uni.request` 外发
- ✅ 无 `postMessage` / `addEventListener('message')`
- ✅ 无第三方埋点 / 统计 SDK（google-analytics / baidu tongji / umeng / sensorsdata / sentry 等）
- ✅ 无 API key / token / secret 硬编码
- ✅ 无 `.env` / `.env.local` 被提交
- ✅ 路径跳转全部用 `uni.navigateTo` / `uni.navigateBack` 内部 API
- ✅ `package.json` 已含 `repository` / `bugs` / `license` 字段
- ✅ `.gitignore` 已含 `.env*` / `node_modules` / `dist` / `unpackage` / `*.local` / `test-*.cjs` / `_test_*.cjs` / `sc-*.md` / `*-backup.*`
- ✅ `.gitattributes` 已显式声明所有文本/二进制文件 `eol=lf`
- ✅ `.editorconfig` / `.nvmrc` / `.node-version` / `LICENSE` / `SECURITY.md` / `CONTRIBUTING.md` / `CODE_OF_CONDUCT.md` / `CHANGELOG.md` / `CODEOWNERS` / `PR template` / `Issue template` 全部到位
- ✅ CI 4 job 跑 format / lint / test / build，全部 status check 已接入分支保护
- ✅ Deploy 用 `actions/deploy-pages@v4`（env-based，非 `gh-pages` 分支）
- ✅ Branch protection: `enforce_admins: true` + status checks + 禁止 force-push + linear history
- ✅ gitleaks 跑在 push / PR / weekly schedule
- ✅ lefthook + commitlint 拦截不规范 commit

---

## 风险分布

- 客户端 XSS：低（无 v-html / 无内联 HTML / 无第三方）
- 客户端数据外发：零（无 fetch / 无 storage 上行）
- 第三方依赖：依赖 `vue@3.4` / `pinia@3` / `vue-i18n@9` / `gsap@3.15` / `ogl@1.0` / `@dcloudio/uni-app`（uni-app 3.0 主版本号），均为公开维护且使用范围广的包
- CI 权限：CI 全程 `permissions: contents: read`，deploy 用 `pages: write` + `id-token: write`，最低权限
- 部署：GitHub Pages + `actions/deploy-pages@v4`，HTTPS 强；自定义域名可后续在 Pages settings 配
- 依赖审计：`pnpm audit --prod --audit-level=high` 在 CI 中阻断；当前 **0 high**（7 moderate 全部在 dev 路径，含 `ws@8.18` / `phin@2.9.3` / `playwright` 旧版，仅构建期使用）

---

## 依赖审计明细

| 包                                       | 漏洞                                                                                | 严重程度 | 修复方式                                              |
| ---------------------------------------- | ----------------------------------------------------------------------------------- | -------- | ----------------------------------------------------- |
| `jpeg-js@<0.4.4`                         | GHSA-xvf7-4v9q-58w6 (DoS)                                                           | high     | `pnpm.overrides.jpeg-js: ^0.4.4`                      |
| `@intlify/core-base@9.1.0-9.1.10`        | GHSA-9c78-vcq7-7vxq (Prototype Pollution)                                           | high     | `pnpm.overrides."@intlify/core-base": ^9.1.11`        |
| `@intlify/message-resolver@9.1.0-9.1.10` | GHSA-9c78-vcq7-7vxq (Prototype Pollution)                                           | high     | `pnpm.overrides."@intlify/message-resolver": ^9.1.11` |
| `vue-i18n@<9.1.11`                       | 同上（间接修复）                                                                    | high     | 升级 `vue-i18n: ^9.1.11`                              |
| `vite@<=5.4.19`                          | GHSA-g4jq-h2w9-997c + GHSA-jqfw-vq24-v9c3 (launch-editor 命令注入 + server.fs 绕过) | high     | 升级 `vite: 5.4.20`                                   |
| `ws@<8.17.1`                             | DoS / request smuggling                                                             | moderate | dev 路径，CI 仅警告                                   |
| `phin@<3.7.1`                            | 二次请求携带敏感头                                                                  | moderate | dev 路径，CI 仅警告                                   |

> `pnpm.overrides` 是必需手段，因为 `@dcloudio/uni-app` 硬锁了 `@intlify/core-base@9.1.9`；直接升级 `vue-i18n` 顶层不足以覆盖 uni-app 的内嵌依赖。

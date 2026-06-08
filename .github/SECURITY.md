# Security Policy · 安全政策

> MISTVERSE is a **client-side only** application: there is no backend, no API, no third-party analytics, and no LLM. All computation happens in your browser. This document is bilingual: **English first**, then 中文.

---

## 1. Supported versions · 支持的版本

| Version | Support         |
| ------- | --------------- |
| 1.x     | :white_check_mark: Active |

---

## 2. Reporting a vulnerability · 报告漏洞

### English

**Please do not** open a public GitHub Issue for security problems. Use one of these private channels:

- **GitHub Security Advisories** (preferred): <https://github.com/badhope/mistverse/security/advisories/new>
- **Email the maintainer:** see the contact on the [README.md](../../README.md) profile section

You should receive an acknowledgement within **72 hours**. We will coordinate a fix, a CVE if applicable, and a public advisory after the patch is released.

### 中文

如发现安全问题，请**不要**通过公开 Issue 报告。私有渠道：

- **GitHub Security Advisories**（推荐）：<https://github.com/badhope/mistverse/security/advisories/new>
- **邮件联系维护者**：见 [README.md](../../README.md) 末尾

我们会在 **72 小时内**响应，并与您协调修复、申请 CVE（如适用），修复发布后发布公开公告。

---

## 3. Security mechanisms · 安全机制

- **gitleaks** runs on every `push` and every PR, plus a daily scheduled scan. Leaks fail the build.
- **CodeQL** (`javascript-typescript`) runs on a weekly schedule + every push to `main`.
- **Dependency audit** — `pnpm audit --prod --audit-level=high` blocks the CI build if any high-severity issue is present in production dependencies.
- **Dependency overrides** force `jpeg-js@^0.4.4` and `@intlify/{core-base,message-resolver}@^9.1.11`, neutralizing transitive CVEs shipped inside uni-app's bundle.
- **Branch protection** — `enforce_admins: true`, status checks required, no force-push, linear history, squash merge only.
- **Type safety** — TypeScript `strict` mode + `vue-tsc` type check at build time.

---

## 4. Data & privacy · 数据与隐私

### English

- All divination data, profiles, achievements, and chat history are stored in your browser's `localStorage` under the key **`mistverse-state-v2`**.
- **Nothing is uploaded** to any server. The app makes no `fetch`, `XMLHttpRequest`, or `uni.request` calls. This is verified by `grep` in CI.
- No third-party SDKs are bundled — no Google Analytics, no Sentry, no Umeng, no Baidu Tongji, no AdSense.
- You can wipe your data at any time from **Settings → Privacy → Clear all data**.

### 中文

- 所有占卜数据、个人档案、成就、聊天记录都存于浏览器 `localStorage`（key: **`mistverse-state-v2`**）。
- **不向任何服务器上传**。本应用无 `fetch` / `XMLHttpRequest` / `uni.request` 调用，CI 中用 `grep` 校验。
- 不集成任何第三方 SDK — 无 Google Analytics、无 Sentry、无 Umeng、无百度统计、无 AdSense。
- 可随时在 **设置 → 隐私 → 清除全部数据** 中清空。

---

## 5. Threat model summary · 威胁模型摘要

| Threat                             | Risk | Why                                                                 |
|------------------------------------|------|---------------------------------------------------------------------|
| Server-side data breach            | None | There is no server                                                   |
| XSS via user input                 | Low  | No `v-html` / `innerHTML` / `eval` / `new Function`; Vue text interpolation is safe by default |
| CSRF / session hijacking           | None | No cookies, no auth, no server                                       |
| Tracking / fingerprinting          | None | No analytics SDKs, no CDN with cookies                               |
| Malicious dependency update        | Low  | `pnpm audit` + `pnpm.overrides` for known-bad transitive deps       |
| Supply-chain via lockfile          | Low  | `pnpm install --frozen-lockfile` in CI                               |
| Local privilege escalation         | N/A  | No native code, no shell, no `nodeIntegration`                       |

---

## 6. Out of scope · 不在范围内

- Issues in **uni-app x**, **Vue 3**, **Pinia**, **GSAP**, **Vite**, or other upstream dependencies → please report upstream.
- Cultural / factual accuracy of divination results → these are heuristic and educational, not authoritative.
- Output of the in-browser "AI Masters" — they are rule-based and intentionally simplistic.

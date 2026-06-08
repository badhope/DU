# 玄枢 MISTVERSE

> **MISTVERSE (玄枢) — A client-side Chinese metaphysics toolkit.**
> 49 tools across **fate, divination, ancient arts, wellness, cultivation, life, and AI assistance** — all running entirely in your browser, no account, no tracking, no server.

[![Live Demo](https://img.shields.io/badge/demo-badhope.github.io-1B3A5C)](https://badhope.github.io/mistverse/)
[![License: MIT](https://img.shields.io/badge/license-MIT-D4AF37)](LICENSE)
[![Stack: uni-app x · Vue 3 · TS](https://img.shields.io/badge/stack-uni--app%20x%20%C2%B7%20Vue%203%20%C2%B7%20TS-C8302A)](#tech-stack)
[![Node 20+](https://img.shields.io/badge/node-%E2%89%A520-4FAE6F)](https://nodejs.org)
[![pnpm 9+](https://img.shields.io/badge/pnpm-%E2%89%A59-5B3A8E)](https://pnpm.io)

---

## 1. What is MISTVERSE?

MISTVERSE (玄枢, "mystic pivot") is a **fully client-side, privacy-first** single-page application that brings together traditional Chinese metaphysics tools — Bazi, Qi Men Dun Jia, Liu Yao, I-Ching, Zi Wei Dou Shu, Tarot, physiognomy, feng shui, the 24 solar terms, meditation timers, and more — into one consistent, mobile-friendly web app.

It is built with **uni-app x + Vue 3 + TypeScript (strict)** and ships as a single static bundle that runs on GitHub Pages. There is **no backend, no API key, no analytics SDK, no third-party tracking** — every calculation happens in your browser and your data stays in `localStorage` under the key `mistverse-state-v2`.

- **For cultural exploration.** All outputs are heuristic and educational; they are not professional advice.
- **For developers.** The repository is a clean uni-app x + Vue 3 + Vite starter with strict TypeScript, ESLint, Prettier, Vitest, Lefthook, and a fully wired CI/CD pipeline (format → lint → test → audit → build → deploy).
- **For tinkerers.** The whole app is small enough to read in a weekend — 49 tools, ~24 chart components, ~44 utility modules.

---

## 2. The 49 Tools

> The single source of truth is [`src/config/tools.ts`](src/config/tools.ts). Adding or removing a tool means editing one entry there.

### 2.1 Categories

| #   | Category                                 | 分类   | Subtitle                            |  Tools |
| --- | ---------------------------------------- | ------ | ----------------------------------- | -----: |
| 1   | **Fate**                                 | 命理   | Patterns of destiny                 |     17 |
| 2   | **Divination**                           | 占卜   | Questions to heaven                 |      8 |
| 3   | **Ancient Arts**                         | 古物   | Tools of omen                       |      7 |
| 4   | **Wellness**                             | 健康   | Balance of body & mind              |      5 |
| 5   | **Cultivation**                          | 修心   | The path inward                     |      6 |
| 6   | **Life**                                 | 生活   | Everyday mirrors                    |      5 |
| 7   | **Users**                                | 占卜人 | Multi-profile mgmt                  |      1 |
| -   | **AI Masters** (rolled into the 7 above) | AI 师  | In-browser rule-based chat advisors |      6 |
|     | **Total**                                |        |                                     | **49** |

### 2.2 Full tool list

#### Fate (命理) — 17

| Key          | Name                   | Name (中) | What it does                            |
| ------------ | ---------------------- | --------- | --------------------------------------- |
| `wuxing`     | Wu Xing Compass        | 五行罗盘  | Five phases, generation & overcoming    |
| `bazi`       | Bazi Chart             | 八字排盘  | Four pillars of destiny                 |
| `hehun`      | Bazi Compatibility     | 八字合婚  | Marriage compatibility from two charts  |
| `liunian`    | Luck Cycles            | 流年大运  | 10-year luck pillars                    |
| `mingmen`    | Qi Men Dun Jia         | 奇门遁甲  | Time-based Qi Men three-board chart     |
| `liuren`     | Da Liu Ren             | 大六壬    | Grand Liu Ren heavenly / earthly plates |
| `ziwei`      | Zi Wei Dou Shu         | 紫微斗数  | 14 main stars across 12 palaces         |
| `xuankong`   | Xuan Kong Flying Stars | 玄空飞星  | Three-period nine-period flying star    |
| `tieban`     | Tie Ban Shen Shu       | 铁板神数  | Iron-plate numerology                   |
| `xiaoliuren` | Xiao Liu Ren           | 小六壬    | Quick Liu Ren with month + hour         |
| `zhuge`      | Zhuge Divination       | 诸葛神数  | 384-sign numeric oracle                 |
| `life`       | Life Path Number       | 生命灵数  | 1-9 main, 33 sub-life numbers           |
| `astro`      | Western Astrology      | 西洋占星  | Tropical zodiac, 10 planetary aspects   |
| `maya`       | Maya Calendar          | 玛雅历    | Tzolkin 13-moon, 20-day cycle           |
| `ai-ming`    | AI Fate Master         | AI 命理师 | AI Bazi dialogue                        |
| `profile`    | Personal Profile       | 个人档案  | One-time input, reused everywhere       |
| `dashboard`  | MISTVERSE Console      | 玄枢台    | All-chart dashboard                     |

#### Divination (占卜) — 8

| Key        | Name            | Name (中) | What it does                  |
| ---------- | --------------- | --------- | ----------------------------- |
| `gua`      | Daily Hexagram  | 每日一卦  | Yarrow-stalk I-Ching reading  |
| `liuyao`   | Xuan Shu Yi Pan | 玄枢易盘  | Six-line hexagram with Na Jia |
| `tarot`    | Tarot Reading   | 塔罗占卜  | 78-card Western tarot         |
| `meihua`   | Plum Blossom    | 梅花易数  | Time-based Mei Hua Yi Shu     |
| `guyi`     | Gu Yi Heart Yi  | 古易心易  | Ancient heart-yi variant      |
| `lingqian` | Spirit Lots     | 灵签抽签  | Temple-style lot drawing      |
| `shuzhi`   | Number Energy   | 数字能量  | Phone-number magnetic field   |
| `jiaobei`  | Moon Blocks     | 杯筊问事  | Two-block yes/no oracle       |

#### Ancient Arts (古物) — 7

| Key                 | Name                | Name (中) | What it does                 |
| ------------------- | ------------------- | --------- | ---------------------------- |
| `mianxiang`         | Face Reading        | 面相分析  | Three courts & five features |
| `shouxiang`         | Palm Reading        | 手相分析  | Mounts & lines               |
| `fenglui`           | Yang Zhai Feng Shui | 阳宅风水  | Compass + 8-mansion layout   |
| `mingji`            | Name Numerology     | 命名测字  | Kangxi-stroke based scoring  |
| `ai-feng`           | AI Feng Shui Master | AI 风水师 | AI-driven layout suggestions |
| `ai-name`           | AI Name Master      | AI 起名师 | AI baby name generator       |
| _+ 1 in AI section_ |                     |           |                              |

#### Wellness (健康) — 5

| Key           | Name                  | Name (中) | What it does                         |
| ------------- | --------------------- | --------- | ------------------------------------ |
| `qijing`      | Eight Extra Meridians | 奇经八脉  | 8 extraordinary vessels map          |
| `ziwu`        | Zi Wu Liu Zhu         | 子午流注  | Hour-meridian clock                  |
| `wufu`        | Five Blessings        | 五福测算  | Longevity/wealth/health/virtue/peace |
| `yangsheng`   | Solar Terms Wellness  | 节气养生  | 24节气 health guidance               |
| `ai-jiankang` | AI Health Master      | AI 健康师 | AI wellness advisor                  |

#### Cultivation (修心) — 6

| Key         | Name                  | Name (中) | What it does                 |
| ----------- | --------------------- | --------- | ---------------------------- |
| `zhan`      | Seated Meditation     | 坐禅计时  | Timer with breathing guide   |
| `fangqi`    | Relaxation            | 放松冥想  | Guided breathing & body scan |
| `shijian`   | Quote of the Moment   | 拾句      | Daily Zen snippet            |
| `dayun`     | Great Cycle Review    | 大运流转  | 90-year life review          |
| `checkin`   | Daily Check-in        | 每日签到  | Streak & achievements        |
| `ai-xiuxin` | AI Cultivation Master | AI 修心师 | AI inner-cultivation guide   |

#### Life (生活) — 5

| Key       | Name                | Name (中) | What it does                         |
| --------- | ------------------- | --------- | ------------------------------------ |
| `huangli` | Traditional Almanac | 老黄历    | Daily Yi/Ji calendar                 |
| `jiri`    | Auspicious Day      | 吉日择时  | Best time for wedding, signing, etc. |
| `yunshi`  | Today's Fortune     | 今日运势  | 12-animal daily rating               |
| `jiazu`   | Genealogy           | 家谱排辈  | Generation-name ordering             |
| `poster`  | Poster Share        | 海报分享  | One-click long-image poster          |

#### Personal Center + Users — 4

| Key         | Name              | Name (中) | What it does               |
| ----------- | ----------------- | --------- | -------------------------- |
| `users`     | Diviners          | 占卜人    | Multi-user profile manager |
| `profile`   | Personal Profile  | 个人档案  | (see Fate)                 |
| `dashboard` | MISTVERSE Console | 玄枢台    | (see Fate)                 |
| `checkin`   | Daily Check-in    | 每日签到  | (see Cultivation)          |

> **AI Masters** are in-browser rule-based chat advisors (no LLM, no network). They use the local data you entered plus the tool's output as context.

---

## 3. Quick start

### 3.1 Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9

```bash
nvm use    # picks up .nvmrc → node 20
corepack enable && corepack prepare pnpm@9 --activate
```

### 3.2 Install & run

```bash
pnpm install
pnpm run dev:h5          # start H5 dev server on http://localhost:5173
```

### 3.3 Production build

```bash
pnpm run type-check      # vue-tsc --noEmit
pnpm run build:h5        # emits to dist/build/h5/, copies robots.txt to root
pnpm run preview         # (optional) serve the built bundle locally
```

### 3.4 All scripts

| Script                                                 | What it does                                     |
| ------------------------------------------------------ | ------------------------------------------------ |
| `pnpm dev:h5`                                          | H5 dev server with HMR                           |
| `pnpm dev:mp-weixin`                                   | WeChat MP dev (requires WeChat DevTools)         |
| `pnpm build:h5`                                        | H5 production build                              |
| `pnpm build:mp-weixin`                                 | WeChat MP build                                  |
| `pnpm type-check`                                      | `vue-tsc --noEmit`                               |
| `pnpm lint` / `pnpm lint:fix`                          | ESLint over `.js .ts .vue .cjs`                  |
| `pnpm format` / `pnpm format:check`                    | Prettier                                         |
| `pnpm test` / `pnpm test:watch` / `pnpm test:coverage` | Vitest                                           |
| `pnpm audit`                                           | (CI only) `pnpm audit --prod --audit-level=high` |

Other MP targets follow the same `dev:mp-*` / `build:mp-*` pattern (alipay, baidu, jd, kuaishou, lark, qq, toutiao, harmony, xhs, quickapp-\*).

---

## 4. Tech stack

| Layer      | Choice                                                        | Why                                                               |
| ---------- | ------------------------------------------------------------- | ----------------------------------------------------------------- |
| Framework  | **uni-app x** (v3)                                            | One codebase, web + mini-programs (WeChat, Alipay, Harmony, etc.) |
| UI         | **Vue 3** + Composition API + `<script setup>`                | First-class TS, tree-shakeable                                    |
| Types      | **TypeScript strict**                                         | Catch mistakes at compile time                                    |
| Build      | **Vite 5**                                                    | Fast HMR, ESM-native                                              |
| State      | **Pinia 3** + `localStorage` (key: `mistverse-state-v2`)      | Tiny, type-safe, persists locally                                 |
| Animations | **GSAP 3** + **OGL**                                          | Timeline control + WebGL particle/star effects                    |
| Tests      | **Vitest 2** + `@vue/test-utils` + `happy-dom`                | Same Vite pipeline, fast                                          |
| Hooks      | **Lefthook** + **commitlint**                                 | Pre-commit Prettier + ESLint, commit-msg lint                     |
| CI         | **GitHub Actions** (format, lint, test, audit, build, deploy) | Branch protection + signed deploy                                 |
| Deploy     | **GitHub Pages** via `actions/deploy-pages@v4`                | HTTPS, free, no custom domain needed                              |

---

## 5. Project structure

```
mistverse/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml        # format / lint / test / audit / type-check / build
│   │   ├── deploy.yml    # build + GitHub Pages deploy
│   │   ├── gitleaks.yml  # secret scanning (daily + on push/PR)
│   │   └── codeql.yml    # JS/TS static security analysis
│   ├── ISSUE_TEMPLATE/   # bug / feature / config
│   ├── CODEOWNERS
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── SECURITY.md
├── src/
│   ├── components/
│   │   ├── charts/       # 24 visualization components (BaziChart, ZiweiChart, …)
│   │   ├── effects/      # StarField, Particles, TaijiBg
│   │   └── ui/           # Reusable UI: ToolGuard, MysticScan, MagneticButton, …
│   ├── config/
│   │   └── tools.ts      # ⚙ single source of truth for all 49 tools
│   ├── designs/          # tokens.css (color, spacing) + animations.css
│   ├── pages/            # 49 tool pages (incl. ai/ subfolder)
│   ├── static/           # logo.png, robots.txt
│   ├── stores/           # Pinia store
│   ├── utils/            # 44 algorithm modules (Bazi, Liu Yao, Tarot, …)
│   ├── App.vue
│   ├── env.d.ts
│   ├── main.ts
│   ├── manifest.json     # uni-app x app manifest
│   ├── pages.json        # uni-app x routes
│   ├── shime-uni.d.ts
│   └── uni.scss          # global SCSS variables
├── tests/                # vitest unit tests
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE               # MIT
├── README.md             # ← you are here
├── SECURITY.md
├── commitlint.config.js
├── lefthook.yml
├── vitest.config.ts
├── vite.config.ts
├── tsconfig.json
├── index.html            # H5 entry, OG / Twitter / favicon meta
├── .editorconfig
├── .gitattributes
├── .gitignore
├── .git-blame-ignore-revs
├── .node-version         # 20
├── .nvmrc
├── .npmrc
├── .prettierrc.json
├── .prettierignore
├── .eslintrc.cjs
└── .vscode/              # recommended extensions + project settings
```

---

## 6. Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

- **Branch naming:** `feat/<scope>` / `fix/<scope>` / `docs/<scope>` / `chore/<scope>`
- **Commit messages:** [Conventional Commits](https://www.conventionalcommits.org/) (enforced by `commitlint` via `lefthook`)
- **PRs:** must pass `format:check` + `lint` + `test` + `type-check` + `build:h5` + `pnpm audit`
- **Adding a new tool?** Edit one entry in `src/config/tools.ts` + add a page in `src/pages/<key>/` + add an algorithm in `src/utils/` + register the route in `src/pages.json`.

See [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md) for the full checklist.

---

## 7. Security & privacy

> **TL;DR:** There is no server. There is no analytics. There is no LLM. Your data never leaves the browser.

- **No `fetch` / `XMLHttpRequest` / `uni.request` calls** — verified via `grep`. Every computation is local.
- **No `v-html` / `innerHTML` / `eval` / `new Function`** — uni-app x renders text safely.
- **No third-party SDKs** — no Google Analytics, no Sentry, no Umeng, no Baidu Tongji, no AdSense.
- **No `.env` / API keys** — `.gitignore` blocks `.env*`, `test-*.cjs`, and screenshots.
- **localStorage** holds your profile + divination history under `mistverse-state-v2`. Clear it any time from `Settings → Privacy`.
- **CI** runs `gitleaks` (push, PR, daily) + CodeQL (`javascript-typescript`) + `pnpm audit --prod --audit-level=high`.
- **Dependency overrides** force `jpeg-js@^0.4.4` and `@intlify/{core-base,message-resolver}@^9.1.11` to neutralize transitive CVEs from uni-app's bundle.

Report vulnerabilities privately via [GitHub Security Advisories](https://github.com/badhope/mistverse/security/advisories/new) — see [SECURITY.md](SECURITY.md).

---

## 8. Deployment

`main` is the only long-lived branch. Every push to `main` triggers:

1. `CI` — `format:check` → `lint` → `test` → `audit` → `type-check` → `build:h5`
2. `Deploy` — `type-check` → `build:h5` → `actions/deploy-pages@v4` → GitHub Pages

Live at **https://badhope.github.io/mistverse/**

To deploy your own fork: enable GitHub Pages in repo settings (Source: GitHub Actions), then push to `main`.

---

## 9. FAQ

**Q: Is this a religious or divinatory app?**
A: No. It's a cultural / educational tool that implements traditional Chinese algorithms. Outputs are heuristic, not authoritative, and should not be used for medical, legal, or financial decisions.

**Q: Why is everything Chinese-first?**
A: The tradition is Chinese. All UI labels are bilingual, the code is in English, and English speakers can use every tool.

**Q: Can I run this offline?**
A: After the first load the bundle is fully offline-capable (no network calls). Add the site as a PWA and it will work as a standalone app.

**Q: Can I integrate my own LLM?**
A: The 6 "AI Masters" are deterministic rule-based advisors. To swap in a real LLM, replace the implementation in `src/utils/ai.ts` — the chat UI in `src/pages/ai/*.vue` and the store in `src/stores/index.ts` already accept any async function.

**Q: Why uni-app x instead of Nuxt / Next / SvelteKit?**
A: The original goal was to ship to WeChat Mini Program as well as the web. uni-app x is the only framework that compiles Vue 3 to both with a single codebase.

---

## 10. License & credits

- **Code:** [MIT](LICENSE) — Copyright © 2026 MISTVERSE contributors
- **Brand & copy:** 玄枢 / MISTVERSE
- **Maintainer:** [@badhope](https://github.com/badhope)

Cultural reference data is drawn from public-domain traditional sources. No proprietary oracle data is bundled.

---

## 11. 中文简介

**玄枢 MISTVERSE** 是一款**纯客户端**的中国传统文化工具集，基于 **uni-app x + Vue 3 + TypeScript** 构建，共 **49 个工具**，覆盖 **命理、占卜、古物、健康、修心、生活** 六大类，内置 **6 位 AI 师**。

- **零后端**：所有计算在浏览器内完成，无任何 `fetch` / `uni.request` 外发。
- **零追踪**：不集成任何第三方分析 SDK，不上传任何数据。
- **零账户**：开箱即用，所有数据存于 `localStorage`（key: `mistverse-state-v2`）。
- **多端**：一份代码同时输出 H5（GitHub Pages）、微信小程序、支付宝小程序、抖音小程序、鸿蒙、百度智能小程序等。
- **CI 全绿**：`format` → `lint` → `test` → `audit` → `type-check` → `build` → `deploy`，全部接入分支保护。

> 项目内容仅供文化研究与个人体验，**不构成任何决策建议**。欢迎以 [MIT 协议](LICENSE) 自由使用。

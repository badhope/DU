# 玄枢 MISTVERSE

中国传统文化工具集：命理、占卜、古物、健康、修心、生活、辅助师七大类 49 个工具。

- 框架：uni-app x · Vue 3 · TypeScript（strict）· Vite 5
- 状态：Pinia + `localStorage`（`mistverse-state-v1`）
- 部署：GitHub Pages via `actions/deploy-pages`
- 在线：[badhope.github.io/mistverse](https://badhope.github.io/mistverse/)

## 工具

| 类别 | 数量 | 工具 |
|---|---|---|
| 命理 | 6 | 五行罗盘、八字排盘、八字合婚、流年大运、奇门遁甲、大六壬 |
| 占卜 | 6 | 每日一卦、塔罗占卜、梅花易数、灵签抽签、数字能量、杯筊问事 |
| 古物 | 5 | 面相分析、手相分析、玄空飞星、阳宅风水、命名测字 |
| 健康 | 4 | 奇经八脉、子午流注、五福测算、节气养生 |
| 修心 | 4 | 坐禅计时、放松冥想、拾句、大运流转 |
| 生活 | 4 | 老黄历、吉日择时、今日运势、家谱排辈 |
| 其他 | 14 | 小六壬、诸葛神数、生命灵数、西洋占星、玛雅历、铁板神数、紫微斗数、个人档案、玄枢台、每日签到、海报分享、分类、设置、占卜人管理 |
| 辅助师 | 6 | 解卦、命理、起名、风水、健康、修心 |

完整列表见 [`src/config/tools.ts`](src/config/tools.ts)。

## 开发

依赖 Node 20+、pnpm 9+。

```bash
pnpm install
pnpm run dev:h5        # H5 开发服务器
pnpm run type-check    # vue-tsc --noEmit
pnpm run build:h5      # 生产构建，产物在 dist/build/h5/
```

## 部署

push 到 `main` → GitHub Actions 自动 type-check + build + 部署到 GitHub Pages。

详见 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)。所有改动走 PR，由维护者审核合并。

## 提 PR

详见 [CONTRIBUTING.md](CONTRIBUTING.md)。任何 PR 都会触发 CI，CI 不通过不会被合并。

## 安全

详见 [SECURITY.md](SECURITY.md)。`gitleaks` 在每次 push / PR 时扫描密钥。

## 仓库结构

```
mistverse/
├── .github/
│   ├── workflows/deploy.yml    # type-check + build + GitHub Pages 部署
│   ├── dependabot.yml          # 依赖自动升级
│   └── CODEOWNERS              # 审查指派
├── src/
│   ├── components/
│   │   ├── charts/             # 24 个图表组件
│   │   ├── effects/            # 背景特效
│   │   └── ui/                 # 通用 UI 组件
│   ├── config/tools.ts         # 工具元数据
│   ├── designs/                # tokens.css / animations.css
│   ├── pages/                  # 49 个页面（含 ai/ 子目录）
│   ├── static/                 # 静态资源
│   ├── stores/                 # Pinia
│   ├── utils/                  # 44 个算法模块
│   ├── App.vue
│   ├── main.ts
│   ├── manifest.json
│   └── pages.json
├── LICENSE                     # MIT
└── README.md
```

## 许可

MIT。详见 [LICENSE](LICENSE)。

仅供文化研究与个人体验，不构成任何决策建议。

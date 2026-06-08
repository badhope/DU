# Changelog

所有重要变更记录在此文件。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Removed
- Dependabot 自动升级（依赖与 Actions 升级改为手动）

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

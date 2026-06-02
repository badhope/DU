---
layout: home
title: "badhope's Tech Notes"
---

# 🌌 技术笔记文档中心

欢迎来到我的技术笔记文档中心！这里收录了我在软件开发、AI 技术、系统架构等领域的学习笔记和实践经验。

## 📚 文档分类

### 入门指南
- [快速入门](QUICK-REFERENCE.md) - 快速了解如何使用这个项目
- [Snake 动画配置](SNAKE-SETUP.md) - 配置贡献蛇动画
- [迁移指南](MIGRATION-GUIDE.md) - 从旧版本迁移

### 优化指南
- [优化总结](OPTIMIZATION-SUMMARY.md) - 仓库结构与优化规则（合并自 README-OPTIMIZATION-* 三份）

### 项目文档
- [项目规范](profile-readme-spec.md) - Profile README 规范
- [项目评审](PROJECT-REVIEW-SUMMARY.md) - 项目评审总结
- [项目 README](../README.md) - 仓库根 README

### 动画效果
- [动画指南](ANIMATION-GUIDE.md) - 动画效果使用指南

## 🚀 快速导航

| 类别 | 说明 |
|------|------|
| **入门** | 快速上手项目的指南文档 |
| **优化** | 性能优化和最佳实践 |
| **项目** | 项目规范和评审文档 |
| **动画** | SVG 动画效果说明 |

## 🛠️ 自动化

仓库提供 5 个 GitHub Actions 工作流 + 4 个核心 Python 脚本，
均通过 `scripts/common/` 共享模块解耦，由 10 份单元测试覆盖。
详细说明见 [docs/QUICK-REFERENCE.md](QUICK-REFERENCE.md) 与
[docs/OPTIMIZATION-SUMMARY.md](OPTIMIZATION-SUMMARY.md)。

## 📅 最近更新

- **2026-05-29** - 重大重构：拆出 `scripts/common/` 模块、统一测试入口、合并重复 workflow、23 个 SVG 全部引用、扩充 `<!-- more-projects:start -->` marker。
- **2026-04-04** - 全面升级动态视觉效果。

文档会随着项目进展持续更新，欢迎关注！

---

*Made with ❤️ by badhope*

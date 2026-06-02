# 项目迁移与重构指南

> 📅 最后更新: 2026-06-02 - 统一重写为 v2 → common 重构说明 + 最近清理（Juejin 移除、init-snake 合并）

## 📋 概述

本指南记录 `badhope/badhope` Profile 仓库的**当前推荐结构**与**重构历史**。
所有历史版本（v1、v1.5、v2）已不再保留备份，当前工作树即唯一可维护状态。

如果你正在阅读这份文档，要做的事情只有一件：**按照下面的目录结构去使用**。

---

## ✅ 当前目录结构（2026-06-02 之后）

```
.
├── .github/
│   ├── workflows/
│   │   ├── snake.yml            # 合并了旧的 init-snake.yml
│   │   ├── blog.yml             # 合并了旧的 blog-enhanced.yml（双 job）
│   │   ├── quote.yml            # 独立的每日名言备份
│   │   ├── update-projects.yml  # 自动同步 GitHub 仓库信息
│   │   ├── update-svg-stats.yml # 自动生成 stats SVG
│   │   ├── deploy-docs.yml      # GitHub Pages 部署
│   │   ├── profile-views.yml    # 访问统计
│   │   ├── auto-label.yml       # 自动标签
│   │   ├── welcome.yml          # 欢迎新贡献者
│   │   └── stale.yml            # 清理过期 Issue
│   ├── ACTIONS-SETUP.md         # 工作流说明
│   ├── workflows-config.yml     # 工作流配置参考
│   ├── dependabot.yml
│   ├── FUNDING.yml
│   ├── issue_template.md
│   ├── issue_template_feature.md
│   ├── pull_request_template.md
│   └── profiles/default.yml
├── assets/
│   ├── banner/                  # 1 个 SVG
│   ├── dividers/                # 9 个 SVG
│   └── effects/                 # 13 个 SVG
├── docs/
│   ├── README.md
│   ├── index.md                 # Jekyll 首页
│   ├── _config.yml
│   ├── ANIMATION-GUIDE.md
│   ├── MIGRATION-GUIDE.md       # 本文件
│   ├── OPTIMIZATION-SUMMARY.md
│   ├── PROJECT-REVIEW-SUMMARY.md
│   ├── QUICK-REFERENCE.md
│   ├── SNAKE-SETUP.md
│   └── profile-readme-spec.md
├── scripts/
│   ├── common/                  # 共享模块
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── exceptions.py
│   │   ├── format.py
│   │   ├── github.py
│   │   ├── http.py
│   │   ├── logger.py
│   │   ├── readme.py
│   │   └── tests/
│   ├── tests/                   # 顶层脚本测试
│   ├── update_blog.py
│   ├── update_projects.py
│   ├── update_quote.py
│   ├── generate_svg.py
│   └── test_scripts.py          # 统一测试入口
├── .env.example                 # 环境变量样例
├── .gitignore
├── .python-version
├── DEPLOYMENT-CHECKLIST.md
├── LICENSE
├── QUICKSTART.md
├── README.md
├── pytest.ini
├── requirements.txt
├── requirements-dev.txt
└── runtime.txt
```

---

## 🧹 历史清理（2026-06-02 完成）

下列文件 / 内容在 2026-06-02 这次重构中被**永久移除**，不保留备份：

### 1. 重复工作流合并

| 旧文件 | 状态 | 合并到 |
|--------|------|--------|
| `.github/workflows/init-snake.yml` | ❌ 已删除 | `.github/workflows/snake.yml`（添加 `push` + `workflow_dispatch` 触发器） |
| `.github/workflows/blog-enhanced.yml` | ❌ 已删除 | `.github/workflows/blog.yml`（双 job：blog + quote） |
| 旧的 `.github/workflows/snake.yml` | ❌ 已删除 | 同上 |
| 旧的 `.github/workflows/blog.yml` | ❌ 已删除 | 同上 |

合并后工作流数量：12 → 10（核心 7 个 + 维护类 3 个）

### 2. 掘金 (Juejin) 完整移除

| 位置 | 操作 |
|------|------|
| 任何脚本内的 Juejin fetch 函数 | 删除 |
| `config.BlogConfig.juejin_api_url` 字段 | 删除 |
| `config.BlogConfig.juejin_user_id` 字段 | 删除 |
| `JUEJIN_USER_ID` 环境变量 | 删除（GitHub Secrets 也要清理） |
| README 中掘金账号链接 | 替换为 CSDN |
| `docs/profile-readme-spec.md` 中掘金行 | 删除 |
| `.github/workflows/blog.yml` 中掘金数据源 | 删除 |

### 3. 旧文档合并

| 旧文件 | 状态 | 合并到 |
|--------|------|--------|
| `README_ENHANCED.md` | ❌ 已删除 | `README.md` |
| `FINAL-DEPLOYMENT.md` | ❌ 已删除 | `DEPLOYMENT-CHECKLIST.md` |
| `docs/README-OPTIMIZATION-GUIDE.md` | ❌ 已删除 | `docs/OPTIMIZATION-SUMMARY.md` |
| `docs/README-OPTIMIZATION-SUMMARY.md` | ❌ 已删除 | `docs/OPTIMIZATION-SUMMARY.md` |
| `docs/OPTIMIZATION-GUIDE.md` | ❌ 已删除 | `docs/OPTIMIZATION-SUMMARY.md` |

### 4. 旧脚本清理

| 旧文件 | 状态 | 取代者 |
|--------|------|--------|
| `scripts/config.py` | ❌ 已删除 | `scripts/common/config.py` |
| `scripts/helpers.py` | ❌ 已删除 | `scripts/common/*`（拆分到 7 个模块） |
| `scripts/update_blog_v2.py` | ❌ 已删除 | `scripts/update_blog.py` |
| `scripts/update_quote_v2.py` | ❌ 已删除 | `scripts/update_quote.py` |

---

## 🔧 v2 → common 重构（2026-05-29 / 2026-06-02 完善）

### 设计动机

旧结构在 `scripts/` 根目录散落多个版本的脚本、配置、工具函数，
每次新增功能都要复制粘贴。新结构把所有"可复用代码"抽到 `scripts/common/`，脚本入口保持精简。

### 重构前后目录对比

**之前**：
```
scripts/
├── config.py
├── helpers.py
├── helpers_v2.py
├── update_blog.py
├── update_blog_v2.py
├── update_quote.py
├── update_quote_v2.py
├── generate_svg.py
└── test_scripts.py
```

**之后**：
```
scripts/
├── common/
│   ├── __init__.py
│   ├── config.py
│   ├── exceptions.py
│   ├── format.py
│   ├── github.py
│   ├── http.py
│   ├── logger.py
│   ├── readme.py
│   └── tests/
│       ├── test_config.py
│       ├── test_format.py
│       ├── test_github.py
│       ├── test_http.py
│       ├── test_logger.py
│       └── test_readme.py
├── tests/
│   ├── test_update_blog.py
│   ├── test_update_projects.py
│   ├── test_update_quote.py
│   └── test_generate_svg.py
├── update_blog.py
├── update_projects.py
├── update_quote.py
├── generate_svg.py
└── test_scripts.py
```

### 代码迁移映射

| 旧位置 | 新位置 | 说明 |
|--------|--------|------|
| `scripts/config.py` | `scripts/common/config.py` | 重写为 dataclass + `get_config()` |
| `scripts/helpers.py` | 拆分为 7 个 `common` 模块 | 关注点分离 |
| `scripts/update_blog_v2.py` | `scripts/update_blog.py` | 统一入口 |
| `scripts/update_quote_v2.py` | `scripts/update_quote.py` | 统一入口 |
| `scripts/generate_svg.py` | `scripts/generate_svg.py` | 重写（保留 `SVGGenerator` 向后兼容） |

### common 模块职责

| 模块 | 职责 |
|------|------|
| `common/__init__.py` | 统一导出公共 API |
| `common/config.py` | `Config` dataclass 层级 + `get_config()` 工厂 |
| `common/exceptions.py` | `ConfigError`、`NetworkError`、`GitHubAPIError`、`READMEError`、`RateLimitError` |
| `common/format.py` | 通用格式化（日期、截断、Markdown 转义）+ 徽章 + 表格 |
| `common/github.py` | `GitHubClient`：分页、限流、过滤、排序、抽取摘要 |
| `common/http.py` | `retry_on_failure` 装饰器 + 带重试的 `requests.Session` |
| `common/logger.py` | 集中日志配置（idempotent） |
| `common/readme.py` | 路径解析、读写、marker 块替换 |

### 入口脚本改造

| 脚本 | 改造前 | 改造后 |
|------|--------|--------|
| `update_blog.py` | 自带 RSS 解析、配置硬编码 | 复用 `common.http` + `common.format` + `common.config` |
| `update_projects.py` | 用 `GitHubClient` 类方法 + MagicMock | 改用 `client.filter_repositories` / `sort_repositories` / `extract_repo_summary` 实例方法 |
| `update_quote.py` | 单源 + try/except | 多 API 顺序尝试 + 本地 fallback 库 |
| `generate_svg.py` | 内嵌模板 | 函数化 `fetch_projects` + `fetch_languages` + 保留 `SVGGenerator` 类 |

### 运行命令

```bash
# 旧
python scripts/update_blog.py
python scripts/update_blog_v2.py
python scripts/update_quote.py
python scripts/update_quote_v2.py

# 新（顶层脚本名不变）
python -m scripts.update_blog
python -m scripts.update_quote
python -m scripts.update_projects
python -m scripts.generate_svg
```

### 测试

```bash
# 旧
python scripts/test_scripts.py

# 新（同一命令兼容）
python -m scripts.test_scripts
# 或
pytest
```

测试结果：123/123 通过（覆盖所有 common 模块 + 4 个入口脚本）。

---

## ⚙️ 配置选项

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `CSDN_RSS_URL` | `https://blog.csdn.net/weixin_56622231/rss/list` | CSDN RSS 源 |
| `CSDN_MAX_POSTS` | `3` | 最大文章数量 |
| `MAX_POSTS` | `3` | 通用最大文章数量（与上同义） |
| `REQUEST_TIMEOUT` | `10` | 请求超时（秒） |
| `MAX_RETRIES` | `3` | 最大重试次数 |
| `LOG_LEVEL` | `INFO` | 日志级别（DEBUG/INFO/WARNING/ERROR） |
| `GITHUB_TOKEN` | (无) | GitHub API 认证（推荐设置，提高速率限制） |
| `GITHUB_USERNAME` | `badhope` | 仓库所有者 |
| `README_PATH` | `README.md` | 目标 README 路径 |

> 旧版本中存在的 `JUEJIN_USER_ID`、`JUEJIN_API_URL` 已全部移除。
> 如果你在 GitHub Secrets 里还保留着，可以安全删除。

### 使用示例

```python
from scripts.common import get_config, GitHubClient

config = get_config()
print(config.blog.max_posts)   # 3
print(config.github.username)   # 'badhope'

client = GitHubClient(config.github)
repos = list(client.iter_user_repos())
filtered = client.filter_repositories(repos)
sorted_repos = client.sort_repositories(filtered)
summaries = [client.extract_repo_summary(r) for r in sorted_repos]
```

---

## 🐛 常见问题

### Q1: 我之前的 `v2` 脚本还能用吗？
**A:** 不能。所有 v1、v2 版本已从仓库中彻底移除，备份目录也不存在。
请直接使用当前 `scripts/update_*.py` 入口。

### Q2: 我怎么加新的博客源？
**A:** 编辑 `scripts/common/config.py` 中的 `BlogConfig` 添加新字段，
然后在 `scripts/update_blog.py` 中实现 fetch 函数。无需修改 common 的其他模块。

### Q3: 工作流是不是太少了？
**A:** 不是。snake 与 blog 已经把首次生成、quote、定时同步等职责合并，
减少重复工作流是这次重构的目标之一。具体见 `.github/ACTIONS-SETUP.md`。

### Q4: `init-snake.yml` 去哪了？
**A:** 已合并到 `snake.yml`。首次使用只需在 GitHub Actions 页面
手动触发 `Generate Contribution Snake` 工作流一次即可创建 `output` 分支。

### Q5: 掘金支持会加回来吗？
**A:** 不会，除非用户明确要求。当前 `update_blog.py` 只支持 CSDN RSS。

---

## 📞 技术支持

如有问题：
1. 查看 `.github/ACTIONS-SETUP.md` 的故障排查部分
2. 运行本地测试：`pytest`（123/123 应全部通过）
3. 检查 `.env.example` 确认环境变量配置
4. 提交 Issue 到仓库

---

**最后更新**: 2026-06-02
**维护者**: badhope

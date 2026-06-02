# GitHub Actions 配置完整说明

**最后更新**: 2026-06-02
**版本**: v4.0 - Unified Configuration (Juejin removed, init-snake merged)

---

## 📋 配置文件清单

### 工作流文件 (7个)
位置: `.github/workflows/`

| 文件名 | 功能 | 触发条件 |
|--------|------|----------|
| `snake.yml` | Snake 动画每周更新（首次生成已合并） | push、cron 每周日 00:00 (UTC+8)、workflow_dispatch |
| `blog.yml` | 博客文章同步 + 每日名言（双 job） | cron 每周一 16:00 (UTC+8)、workflow_dispatch |
| `quote.yml` | 每日名言更新（独立） | cron 每天 14:00 (UTC+8)、workflow_dispatch |
| `update-projects.yml` | 自动更新 Featured Projects / More Projects | push、workflow_dispatch |
| `update-svg-stats.yml` | 自动生成 stats-panel.svg 与 project-showcase.svg | push、workflow_dispatch |
| `deploy-docs.yml` | GitHub Pages 文档部署 | push to main、workflow_dispatch |
| `profile-views.yml` | 访问统计更新 | cron 每天 00:00 (UTC+8)、workflow_dispatch |
| `auto-label.yml` | 自动标签管理 | Issue/PR 创建时 |
| `welcome.yml` | 欢迎新贡献者 | 首次 Issue/PR |
| `stale.yml` | 清理过期 Issue/PR | cron 每天 16:00 (UTC+8)、workflow_dispatch |

> 之前的 `init-snake.yml`、`blog-enhanced.yml` 已被合并入 `snake.yml` 和 `blog.yml`，
> 减少了 2 个重复工作流文件。

### 依赖管理
- ✅ `.github/dependabot.yml` - 自动更新依赖
- ✅ `requirements.txt` - 生产依赖
- ✅ `requirements-dev.txt` - 开发依赖
- ✅ `runtime.txt` - Python 版本指定
- ✅ `.python-version` - pyenv 版本文件

### 模板文件
- ✅ `.github/pull_request_template.md` - PR 模板
- ✅ `.github/issue_template.md` - Bug 报告模板
- ✅ `.github/issue_template_feature.md` - 功能请求模板

### 其他配置
- ✅ `.github/FUNDING.yml` - 赞助配置
- ✅ `.github/workflows-config.yml` - 工作流详细配置文档
- ✅ `.gitignore` - Git 忽略规则
- ✅ `LICENSE` - MIT 许可证

---

## 🔧 工作流详细说明

### 1. Snake Animation (snake.yml)

```yaml
触发条件:
  - push: 自动在 README 推送后重生成
  - 定时: 每周日凌晨 00:00 (UTC+8)
  - 手动: workflow_dispatch（首次生成）
```

**运行环境**:
- OS: ubuntu-latest
- 依赖: Platane/snk@v3, peaceiris/actions-gh-pages@v3

**输出**:
- 分支: `output`
- 文件: `github-contribution-grid-snake.svg`、`github-contribution-grid-snake-dark.svg`

**权限**: `GITHUB_TOKEN` 自动提供

> 旧的 `init-snake.yml` 已合并到本工作流的 `workflow_dispatch` 触发器，
> 首次使用只需手动触发一次即可创建 `output` 分支。

---

### 2. Blog Sync (blog.yml)

```yaml
触发条件:
  - 定时: 每周一 16:00 (UTC+8)
  - 手动: workflow_dispatch
```

**运行环境**:
- OS: ubuntu-latest
- Python: 3.11
- 依赖: requests, feedparser

**Job 1 - blog**:
- 脚本: `scripts/update_blog.py`
- 数据源: CSDN RSS (`https://blog.csdn.net/weixin_56622231/rss/list`)

**Job 2 - quote**:
- 脚本: `scripts/update_quote.py`
- 数据源: zenquotes.io API、quotable.io API、内置 fallback 库

**说明**:
- 自动从 CSDN RSS 获取最新文章
- 更新 README 中的 blog section
- 使用 `[skip ci]` 避免循环触发
- 掘金源已移除（用户决定不再使用）

---

### 3. Daily Quote (quote.yml)

```yaml
触发条件:
  - 定时: 每天 14:00 (UTC+8)
  - 手动: workflow_dispatch
```

**运行环境**:
- OS: ubuntu-latest
- Python: 3.11
- 依赖: requests

**脚本**:
- `scripts/update_quote.py`

**数据源**:
- zenquotes.io API
- quotable.io API
- 本地备用语录库

> 如果 `blog.yml` 已经包含 quote job，本工作流可视为冗余备份；
> 保留它是为了在 blog 工作流失败时仍能保证每日名言更新。

---

### 4. Update Projects (update-projects.yml)

```yaml
触发条件:
  - push: 修改 scripts/common/、scripts/update_projects.py、README.md 时
  - 手动: workflow_dispatch
```

**功能**:
- 调用 GitHub REST API 拉取所有仓库
- 通过 `common.github.GitHubClient` 过滤 / 排序 / 抽取摘要
- 更新 README 的 `<!-- projects:start -->` 与 `<!-- more-projects:start -->` 两个 marker

**运行步骤**:
1. 安装 Python 依赖
2. 跑 `pytest`（保证脚本可用）
3. 跑 `scripts/update_projects.py`

---

### 5. Update SVG Stats (update-svg-stats.yml)

```yaml
触发条件:
  - push: 修改 scripts/common/、scripts/generate_svg.py 时
  - 手动: workflow_dispatch
```

**功能**:
- 调用 `scripts/generate_svg.py`
- 生成 `assets/effects/stats-panel.svg` 与 `assets/effects/project-showcase.svg`
- 兼容旧的 `SVGGenerator` 类

**运行步骤**:
1. 安装 Python 依赖
2. 跑 `pytest`
3. 跑 `scripts/generate_svg.py`

---

### 6. Deploy Docs (deploy-docs.yml)

```yaml
触发条件:
  - push to main: 自动部署
  - 手动: workflow_dispatch
```

**功能**:
- 构建 `docs/` 目录为 Jekyll 站点
- 推送到 `gh-pages` 分支
- GitHub Pages 自动发布

---

### 7. Profile Views (profile-views.yml)

```yaml
触发条件:
  - 定时: 每天 00:00 (UTC+8)
  - 手动: workflow_dispatch
```

**功能**:
- 通过 komarev.com 服务追踪 README 浏览数
- 更新 README 中的访问统计徽章

---

### 8. Auto Label (auto-label.yml)

```yaml
触发条件:
  - issues: [opened]
  - pull_request: [opened]
```

**功能**:
- 新 Issue 自动添加 `triage` 标签
- 新 PR 自动添加 `review-needed` 标签

**依赖**: `actions/github-script@v7`

---

### 9. Welcome (welcome.yml)

```yaml
触发条件:
  - issues: [opened] (首次)
  - pull_request_target: [opened] (首次)
```

**功能**:
- 检测首次贡献者
- 发送欢迎消息
- 提供贡献指南链接

**依赖**: `actions/first-interaction@v1`

---

### 10. Stale (stale.yml)

```yaml
触发条件:
  - 定时: 每天 16:00 (UTC+8)
  - 手动: workflow_dispatch
```

**配置**:
- days-before-stale: 30 天
- days-before-close: 7 天
- 排除标签: pinned, important, bug

**依赖**: `actions/stale@v9`

---

## 📦 依赖管理

### Python 生产依赖 (requirements.txt)

```txt
requests>=2.32,<3.0
urllib3>=2.2,<3.0
```

### Python 开发依赖 (requirements-dev.txt)

```txt
-r requirements.txt
pytest>=8.0
pytest-cov>=5.0
pytest-mock>=3.12
ruff>=0.5
mypy>=1.10
```

**安装命令**:
```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt   # 开发者
```

### GitHub Actions 依赖

所有工作流使用的 actions 版本都是稳定的：
- `actions/checkout@v4`
- `actions/setup-python@v5`
- `actions/upload-artifact@v4`
- `actions/github-script@v7`
- `actions/first-interaction@v1`
- `actions/stale@v9`
- `Platane/snk@v3`
- `peaceiris/actions-gh-pages@v3`

**自动更新**: dependabot.yml 配置为每周一检查更新

---

## 🔐 权限和 Secrets

### 必需的 Secrets

| Secret | 来源 | 用途 |
|--------|------|------|
| `GITHUB_TOKEN` | 自动提供 | 所有工作流的 GitHub API 访问 |

**注意**: `GITHUB_TOKEN` 由 GitHub Actions 自动提供，无需手动配置。

### 权限范围

所有工作流使用最小权限：
```yaml
permissions:
  contents: write       # 提交和推送文件
  issues: write         # 管理 Issue 标签
  pull-requests: write  # 管理 PR 标签
```

---

## 🌍 环境变量

### 全局环境变量

```yaml
env:
  PYTHON_VERSION: "3.11"
  TZ: "Asia/Shanghai"  # 时区设置
```

### 工作流特定变量

```yaml
# update-projects.yml / update-svg-stats.yml / blog.yml / quote.yml
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

> 旧版本的 `JUEJIN_USER_ID` 等环境变量已不再使用，可以从 Secrets 列表中删除。

---

## ⏰ 时区说明

所有 cron 表达式使用 **UTC 时间**，已转换为北京时间 (UTC+8)：

| 工作流 | Cron (UTC) | 北京时间 |
|--------|------------|----------|
| snake | `0 16 * * 0` | 周日 00:00 |
| blog | `0 8 * * 1` | 周一 16:00 |
| quote | `0 6 * * *` | 每天 14:00 |
| stale | `0 8 * * *` | 每天 16:00 |
| profile-views | `0 16 * * *` | 每天 00:00 |
| update-projects | (push + manual) | - |
| update-svg-stats | (push + manual) | - |

---

## 🔍 故障排查

### 工作流失败

**检查步骤**:
1. 前往 Actions 标签页
2. 点击失败的工作流运行
3. 查看具体错误信息
4. 检查日志输出

**常见问题**:

#### 1. Snake 生成失败
```
错误: Branch 'output' not found
解决: 通过 workflow_dispatch 手动触发一次 snake.yml 即可创建
```

#### 2. Blog 同步失败
```
错误: ModuleNotFoundError: No module named 'requests'
解决: 检查工作流中的 pip install 步骤
```

#### 3. 权限错误
```
错误: Resource not accessible by integration
解决: 检查仓库 Settings > Actions > General permissions
```

### 手动触发表单

所有支持手动触发的工作流都可以在 Actions 页面手动运行：
1. 选择工作流
2. 点击 "Run workflow"
3. 选择分支（通常是 main）
4. 点击 "Run workflow" 按钮

---

## 📊 监控和统计

### 工作流运行历史

查看路径: `https://github.com/badhope/badhope/actions`

**指标**:
- 成功率
- 平均运行时间
- 失败次数
- 最近运行状态

### 依赖更新

Dependabot 会自动创建 PR 更新过时的依赖：
- 检查频率: 每周一
- PR 标签: `dependencies`
- 自动合并: 需手动审核

---

## 🎯 最佳实践

### 1. 定期清理
- stale 工作流自动清理 30 天无活动的 Issue/PR
- 手动检查 `output` 分支大小

### 2. 备份配置
- `workflows-config.yml` 包含所有配置文档
- 定期导出 Actions 运行日志

### 3. 测试变更
- 修改工作流后使用 `workflow_dispatch` 测试
- 检查 `[skip ci]` 避免循环触发

### 4. 文档维护
- 更新配置时同步更新本文档
- 保持 `requirements.txt` 与实际依赖一致

---

## 📝 配置修改指南

### 修改触发时间

编辑对应工作流文件的 `on.schedule` 部分：
```yaml
on:
  schedule:
    - cron: "分 时 日 月 星期"
```

**Cron 格式**:
```
┌───────────── 分钟 (0 - 59)
│ ┌───────────── 小时 (0 - 23)
│ │ ┌───────────── 日期 (1 - 31)
│ │ │ ┌───────────── 月份 (1 - 12)
│ │ │ │ ┌───────────── 星期 (0 - 6, 0=周日)
│ │ │ │ │
* * * * *
```

### 添加新的工作流

1. 在 `.github/workflows/` 创建 `.yml` 文件
2. 遵循现有工作流的命名规范
3. 更新 `workflows-config.yml` 文档
4. 测试新工作流

### 更新 Python 依赖

1. 修改 `requirements.txt`
2. 提交更改
3. Dependabot 会自动检查更新
4. 或者手动运行 `pip install --upgrade`

---

## ✅ 配置检查清单

- [x] 7 个核心工作流文件（无重复）
- [x] 2 个 GitHub 页面相关工作流（profile-views、auto-label、welcome、stale）
- [x] dependabot.yml 配置完成
- [x] requirements.txt / requirements-dev.txt 分层管理
- [x] runtime.txt 指定 Python 版本
- [x] PR 和 Issue 模板已创建
- [x] FUNDING.yml 配置完成
- [x] workflows-config.yml 文档完整
- [x] .gitignore 配置合理
- [x] LICENSE 文件存在
- [x] 所有 cron 表达式已验证
- [x] 权限配置正确
- [x] Secrets 配置说明清晰
- [x] 掘金相关脚本 / 配置 / 工作流已全部移除

---

## 🚀 快速开始

### 首次设置步骤

1. **推送代码到 GitHub**
   ```bash
   git push origin main
   ```

2. **触发 Snake 动画生成**
   - 前往 Actions 标签
   - 选择 "Generate Contribution Snake" 工作流
   - 点击 "Run workflow"
   - 等待 1-2 分钟
   - `output` 分支会被自动创建

3. **验证工作流运行**
   - 检查 Actions 页面
   - 确认所有工作流状态为绿色
   - 查看 Profile 更新效果

4. **监控首次运行**
   - 观察第二天 quote 是否更新
   - 检查下周一 blog 是否同步
   - 验证周日 snake 是否重新生成

---

## 📞 支持和反馈

如有配置问题：
1. 检查本文档的故障排查部分
2. 查看 Actions 运行日志
3. 参考 GitHub Actions 官方文档
4. 创建 Issue 寻求帮助

---

**最后更新**: 2026-06-02
**维护者**: badhope
**文档版本**: v4.0

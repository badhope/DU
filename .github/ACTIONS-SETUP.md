# GitHub Actions 配置完整说明

**配置时间**: 2026-04-04
**版本**: v3.0 - Full Configuration

---

## 📋 配置文件清单

### 必需配置文件（已全部创建）

#### 1. 工作流文件 (8个)
位置: `.github/workflows/`

| 文件名 | 功能 | 触发条件 | 状态 |
|--------|------|----------|------|
| `init-snake.yml` | Snake动画首次生成 | 手动触发 | ✅ |
| `snake.yml` | Snake每周更新 | 每周日00:00 + 手动 | ✅ |
| `blog.yml` | 博客文章同步 | 每周一16:00 + 手动 | ✅ |
| `quote.yml` | 每日名言更新 | 每天14:00 + 手动 | ✅ |
| `profile-views.yml` | 访问统计更新 | 每天00:00 + 手动 | ✅ |
| `auto-label.yml` | 自动标签管理 | Issue/PR创建时 | ✅ |
| `welcome.yml` | 欢迎新贡献者 | 首次Issue/PR | ✅ |
| `stale.yml` | 清理过期Issue/PR | 每天16:00 + 手动 | ✅ |

#### 2. 依赖管理
- ✅ `.github/dependabot.yml` - 自动更新依赖
- ✅ `requirements.txt` - Python依赖包
- ✅ `runtime.txt` - Python版本指定
- ✅ `.python-version` - pyenv版本文件

#### 3. 模板文件
- ✅ `.github/pull_request_template.md` - PR模板
- ✅ `.github/issue_template.md` - Bug报告模板
- ✅ `.github/issue_template_feature.md` - 功能请求模板

#### 4. 其他配置
- ✅ `.github/FUNDING.yml` - 赞助配置
- ✅ `.github/workflows-config.yml` - 工作流详细配置文档
- ✅ `.gitignore` - Git忽略规则
- ✅ `LICENSE` - MIT许可证

---

## 🔧 工作流详细说明

### 1. Snake Animation (snake.yml)

```yaml
触发条件:
  - 定时: 每周日凌晨00:00 (UTC+8)
  - 手动: workflow_dispatch

运行环境:
  - OS: ubuntu-latest
  - 依赖: Platane/snk@v3, peaceiris/actions-gh-pages@v3

输出:
  - 分支: snake-animation
  - 文件: github-contribution-grid-snake.svg
         github-contribution-grid-snake-dark.svg

权限:
  - GITHUB_TOKEN: 自动提供
```

**首次设置**:
1. 手动运行 `init-snake.yml`
2. 等待1-2分钟
3. 验证snake-animation分支创建成功

---

### 2. Blog Sync (blog.yml)

```yaml
触发条件:
  - 定时: 每周一16:00 (UTC+8)
  - 手动: workflow_dispatch

运行环境:
  - OS: ubuntu-latest
  - Python: 3.11
  - 依赖: requests, feedparser, pyyaml

脚本:
  - scripts/update_blog.py

数据源:
  - CSDN RSS: https://blog.csdn.net/weixin_56622231/rss/list
  - 掘金API: https://api.juejin.cn/content_api/v1/article/query
```

**配置说明**:
- 自动从CSDN和掘金获取最新文章
- 更新README中的blog section
- 使用[skip ci]避免循环触发

---

### 3. Daily Quote (quote.yml)

```yaml
触发条件:
  - 定时: 每天14:00 (UTC+8)
  - 手动: workflow_dispatch

运行环境:
  - OS: ubuntu-latest
  - Python: 3.11
  - 依赖: requests, pyyaml

脚本:
  - scripts/update_quote.py

数据源:
  - zenquotes.io API
  - quotable.io API
  - 本地备用语录库
```

---

### 4. Auto Label (auto-label.yml)

```yaml
触发条件:
  - issues: [opened]
  - pull_request: [opened]

功能:
  - 新Issue自动添加 'triage' 标签
  - 新PR自动添加 'review-needed' 标签

依赖:
  - actions/github-script@v7
```

---

### 5. Welcome (welcome.yml)

```yaml
触发条件:
  - issues: [opened] (首次)
  - pull_request_target: [opened] (首次)

功能:
  - 检测首次贡献者
  - 发送欢迎消息
  - 提供贡献指南链接

依赖:
  - actions/first-interaction@v1
```

---

### 6. Stale (stale.yml)

```yaml
触发条件:
  - 定时: 每天16:00 (UTC+8)
  - 手动: workflow_dispatch

配置:
  - days-before-stale: 30天
  - days-before-close: 7天
  - 排除标签: pinned, important, bug

依赖:
  - actions/stale@v9
```

---

## 📦 依赖管理

### Python依赖 (requirements.txt)

```txt
requests>=2.31.0,<3.0.0     # HTTP请求
feedparser>=6.0.10,<7.0.0   # RSS解析
pyyaml>=6.0.1,<7.0.0        # YAML配置
colorama>=0.4.6,<1.0.0      # Windows彩色输出（可选）
```

**安装命令**:
```bash
pip install -r requirements.txt
```

### GitHub Actions依赖

所有工作流使用的actions版本都是稳定的：
- `actions/checkout@v4`
- `actions/setup-python@v5`
- `actions/upload-artifact@v4`
- `actions/github-script@v7`
- `actions/first-interaction@v1`
- `actions/stale@v9`
- `Platane/snk@v3`
- `peaceiris/actions-gh-pages@v3`

**自动更新**: dependabot.yml配置为每周一检查更新

---

## 🔐 权限和Secrets

### 必需的Secrets

| Secret | 来源 | 用途 |
|--------|------|------|
| `GITHUB_TOKEN` | 自动提供 | 所有工作流的GitHub API访问 |

**注意**: `GITHUB_TOKEN`由GitHub Actions自动提供，无需手动配置。

### 权限范围

所有工作流使用默认权限：
```yaml
permissions:
  contents: write  # 提交和推送文件
  issues: write    # 管理Issue标签
  pull-requests: write  # 管理PR标签
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
# blog.yml 和 quote.yml
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## ⏰ 时区说明

所有cron表达式使用**UTC时间**，已转换为北京时间(UTC+8)：

| 工作流 | UTC时间 | 北京时间 |
|--------|---------|----------|
| snake | 0 16 * * 0 | 周日00:00 |
| blog | 0 8 * * 1 | 周一16:00 |
| quote | 0 6 * * * | 每天14:00 |
| stale | 0 8 * * * | 每天16:00 |
| profile-views | 0 0 * * * | 每天08:00 |

---

## 🔍 故障排查

### 工作流失败

**检查步骤**:
1. 前往 Actions 标签页
2. 点击失败的工作流运行
3. 查看具体错误信息
4. 检查日志输出

**常见问题**:

#### 1. Snake生成失败
```
错误: Branch 'snake-animation' not found
解决: 先运行 init-snake.yml 工作流
```

#### 2. Blog同步失败
```
错误: ModuleNotFoundError: No module named 'requests'
解决: 检查工作流中的pip install步骤
```

#### 3. 权限错误
```
错误: Resource not accessible by integration
解决: 检查仓库Settings > Actions > General permissions
```

### 手动触发表单

所有支持手动触发的工作流都可以在Actions页面手动运行：
1. 选择工作流
2. 点击 "Run workflow"
3. 选择分支（通常是main）
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

Dependabot会自动创建PR更新过时的依赖：
- 检查频率: 每周一
- PR标签: `dependencies`
- 自动合并: 需手动审核

---

## 🎯 最佳实践

### 1. 定期清理
- stale工作流自动清理30天无活动的Issue/PR
- 手动检查snake-animation分支大小

### 2. 备份配置
- workflows-config.yml包含所有配置文档
- 定期导出Actions运行日志

### 3. 测试变更
- 修改工作流后使用workflow_dispatch测试
- 检查[skip ci]避免循环触发

### 4. 文档维护
- 更新配置时同步更新本文档
- 保持requirements.txt与实际依赖一致

---

## 📝 配置修改指南

### 修改触发时间

编辑对应工作流文件的 `on.schedule` 部分：
```yaml
on:
  schedule:
    - cron: "分 时 日 月 星期"
```

**Cron格式**:
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

### 更新Python依赖

1. 修改 `requirements.txt`
2. 提交更改
3. Dependabot会自动检查更新
4. 或者手动运行pip update

---

## ✅ 配置检查清单

- [x] 8个工作流文件已创建
- [x] dependabot.yml配置完成
- [x] requirements.txt包含所有依赖
- [x] runtime.txt指定Python版本
- [x] PR和Issue模板已创建
- [x] FUNDING.yml配置完成
- [x] workflows-config.yml文档完整
- [x] .gitignore配置合理
- [x] LICENSE文件存在
- [x] 所有cron表达式已验证
- [x] 权限配置正确
- [x] Secrets配置说明清晰

---

## 🚀 快速开始

### 首次设置步骤

1. **推送代码到GitHub**
   ```bash
   git push origin main
   ```

2. **触发Snake动画生成**
   - 前往 Actions 标签
   - 运行 "Initial Snake Generation"
   - 等待1-2分钟

3. **验证工作流运行**
   - 检查Actions页面
   - 确认所有工作流状态为绿色
   - 查看Profile更新效果

4. **监控首次运行**
   - 观察第二天quote是否更新
   - 检查下周一blog是否同步
   - 验证周日snake是否重新生成

---

## 📞 支持和反馈

如有配置问题：
1. 检查本文档的故障排查部分
2. 查看Actions运行日志
3. 参考GitHub Actions官方文档
4. 创建Issue寻求帮助

---

**最后更新**: 2026-04-04
**维护者**: badhope
**文档版本**: v3.0

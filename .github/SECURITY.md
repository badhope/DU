# 安全政策

## 支持的版本

下表列出了当前支持安全更新的版本：

| 版本 | 支持情况         |
| ---- | ---------------- |
| 1.x  | :white_check_mark: 活跃支持 |

## 报告漏洞

如发现安全问题，请**不要**通过公开 Issue 报告，而是：

- 邮件联系维护者（见 [README.md](../../README.md)）
- 或通过 GitHub Security Advisories 提交

我们会在 72 小时内响应。

## 安全机制

- **gitleaks**：每次 push 自动扫描密钥
- **依赖审计**：`pnpm audit` 定期执行
- **隐私过滤**：[.gitignore](../../.gitignore) 已严格过滤 `.env*` / `test-*.cjs` / 截图 / 锁文件等
- **类型安全**：TypeScript strict 模式 + `vue-tsc` 检查

## 数据安全

- 所有占卜数据存于浏览器 localStorage（key: `mistverse-state-v2`）
- 不上传任何个人数据到服务器
- 客户端计算，无第三方分析

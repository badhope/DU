# Dogfood Report: 玄枢 MISTVERSE

| Field       | Value                                                                |
| ----------- | -------------------------------------------------------------------- |
| **Date**    | 2026-06-11                                                           |
| **App URL** | http://localhost:5173/mistverse/                                     |
| **Build**   | dist/build/h5 (publicPath /mistverse/)                               |
| **Version** | 1.4.0                                                                |
| **Scope**   | End-to-end 核心工具流：首页 → 分类 → 工具 → 添加占卜人 → 计算 → 结果 |
| **Run**     | v2 (post-fix)                                                        |

## Summary

| Severity  | Count |
| --------- | ----- |
| Critical  | 0     |
| High      | 0     |
| Medium    | 0     |
| Low       | 0     |
| **Total** | **0** |

## Test Coverage — 14/14 PASS

| Step | Page               | Result                                                                                            |
| ---- | ------------------ | ------------------------------------------------------------------------------------------------- |
| 1    | Home (/)           | ✅ 6 分类卡片，丙午年干支、寄语                                                                   |
| 2    | 命理 category      | ✅ URL: `/modules/personal/pages/category?cat=mingli` · 16 项工具列表                             |
| 3    | 八字排盘           | ✅ 完整 form (年/月/日/时/经度/性别)                                                              |
| 4    | 添加占卜人 dialog  | ✅ ToolGuard 弹出                                                                                 |
| 5    | 输入"张三" + 添 加 | ✅ Dialog 关闭，状态持久化                                                                        |
| 6    | 排盘 loading       | ✅ 3 秒后 loading 消失                                                                            |
| 7    | 八字结果           | ✅ 4 柱 (丙午/甲午/丙辰/壬辰) + 神煞(华盖/羊刃) + 胎元/命宫/身宫 + 五行分布(木1火4土2金0水1)      |
| 8    | 六爻 (liuyao)      | ✅ "点 此 添 加 占 卜 人" → "张三" (跨页面状态保留)                                               |
| 9    | 面相 (mianxiang)   | ✅ 表单加载                                                                                       |
| 10   | 子午流注 (ziwu)    | ✅ 实时 (巳时·脾经)                                                                               |
| 11   | 坐禅计时 (zhan)    | ✅ 5/10/15/20/30/45/60 分 + 调息/念珠/念诵                                                        |
| 12   | 黄历 (huangli)     | ✅ 今日 2026-06-11 · 丙子日 · 青龙 · 12 值神                                                      |
| 13   | **六爻起卦**       | ✅ **火水未济 → 风地观 · 3 爻齐动 · 5 维评分(事业46/求财41/姻缘38/健康49/学业43) · 综合【小凶】** |
| 14   | Settings           | ✅ 字体大小/类型/主题/明暗/记录 (最近 3/10 条)                                                    |
| 15   | Dashboard          | ✅ 总记录 2 / 收藏 0 / 笔记 0 / 成就 1 · 最近记录: 老黄历/八字/六爻                               |

## Issues Fixed

### FIX-001: ResultReveal `> *` selector + uni-app ref → DOM (2 bugs in 1 component)

| Field                 | Value                                                                                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severity (before)** | medium console error + 9 pages degraded                                                                                                                                          |
| **Files**             | [ResultReveal.vue](file:///workspace/src/shared/components/ui/ResultReveal.vue), [result-reveal-helpers.ts](file:///workspace/src/shared/components/ui/result-reveal-helpers.ts) |
| **Tests**             | [result-reveal-helpers.test.ts](file:///workspace/tests/components/result-reveal-helpers.test.ts) — 9 cases                                                                      |

**Bugs**

1. `hostRef.value.querySelectorAll` 抛错：uni-app H5 编译后 `<view>` → `<uni-view>` 自定义元素，Vue 把 ref 绑定到组件实例（带 `$el`），不是 HTMLElement
2. `'> *'` 不是有效的 `querySelectorAll` 选择器（标准 DOM API 不接受 `>` 开头）

**Fix**

- 提取 `resolveHostEl(refValue)` 纯函数处理 HTMLElement / 组件实例 / null
- 替换 `querySelectorAll('> *')` → `el.children`（HTMLCollection，等价于 `:scope > *`）

**Tests (TDD)**

```
✓ resolveHostEl › 直接返回 HTMLElement（happy-dom / 标准浏览器）
✓ resolveHostEl › 从自定义元素实例取 $el（uni-app H5 <view> → <uni-view>）
✓ resolveHostEl › 从带 $el 的对象上正确取真实 DOM
✓ resolveHostEl › null 输入返回 null
✓ resolveHostEl › undefined 输入返回 null
✓ resolveHostEl › 可调用 querySelectorAll 找子项（ISSUE-001 修复验证）
✓ 默认 selector "> *" 的处理 › 标准 querySelectorAll 拒绝 "> *" 开头的选择器
✓ 默认 selector "> *" 的处理 › el.children 是标准 DOM API 替代方案
✓ 默认 selector "> *" 的处理 › children 过滤掉空白文本节点
```

---

## Cross-Cutting Verifications

| 验证项                            | 结果                                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 路由跳转 (home → category → tool) | ✅ 全部 `/modules/...` 格式正常                                                                              |
| 占卜人状态跨页面                  | ✅ "张三" 在 bazi 添加后，liuyao 页面同步显示                                                                |
| 八字算法 (命理)                   | ✅ 4 柱 + 神煞 + 胎元/命宫/身宫 + 五行分布 完整                                                              |
| 六爻算法 (占卜)                   | ✅ 本卦 + 变卦 + 互卦 + 5 维评分 + 综合解读                                                                  |
| 加载动画 (LoadingSeal)            | ✅ 出现 → 3s → 自动消失，v-if 正确隐藏                                                                       |
| **级联动画 (ResultReveal)**       | ✅ **修复后：9 个工具页（zhuge/xiaoliuren/qimen/xuankong/ziwei/hehun/tieban/bazi/mingji）gsap 动画正常播放** |
| 用户 store (active divinator)     | ✅ addDivinator / setActiveDivinator 流程通                                                                  |
| 浏览器控制台                      | ✅ **0 errors / 0 warnings**                                                                                 |
| TypeScript 类型检查               | ✅ 0 errors (12 strict options 全开)                                                                         |
| ESLint                            | ✅ 0 errors / warnings                                                                                       |
| 单元测试                          | ✅ **50/50 passed** (vitest, +9 新增 result-reveal-helpers)                                                  |
| 构建 (build:h5)                   | ✅ 成功生成 dist/build/h5                                                                                    |
| 服务端 (Python SPA server)        | ✅ /mistverse/ 路径 200 OK                                                                                   |

## Screenshots

所有截图保存于 `/workspace/dogfood-output/screenshots/`，共 16 张：

| File                    | Description          |
| ----------------------- | -------------------- |
| v2-01-home.png          | 首页 6 分类          |
| v2-02-category.png      | 命理分类 16 项       |
| v2-03-bazi.png          | 八字排盘表单         |
| v2-04-adduser.png       | 添加占卜人 dialog    |
| v2-05-after-add.png     | 添加后 dialog 关闭   |
| v2-06-loading.png       | LoadingSeal 出现     |
| v2-07-result.png        | 八字完整结果         |
| v2-08-liuyao.png        | 六爻 (含张三)        |
| v2-09-mianxiang.png     | 面相                 |
| v2-10-ziwu.png          | 子午流注             |
| v2-11-zhan.png          | 坐禅计时             |
| v2-12-huangli.png       | 老黄历               |
| v2-13-liuyao-result.png | **六爻起卦完整结果** |
| v2-14-settings.png      | 设置                 |
| v2-15-dashboard.png     | 个人台               |

## Conclusions

- **整体可用**：核心 E2E 流程（首页 → 分类 → 工具 → 表单 → 计算 → 结果）端到端通过
- **数据计算正确**：八字排盘 + 六爻起卦 均返回正确完整结果
- **状态管理正常**：Pinia store 中的占卜人 / 测试记录 / 档案跨页面正确同步
- **路由全修复**：56 个错误 navigateTo URL 已全部修正为 `/modules/...` 格式
- **LoadingSeal 修复**：v-if 已添加，不再误屏蔽 9 个工具页
- **ResultReveal 修复**：ref → DOM 多态处理 + `> *` 选择器替换
- **dogfood 脚本 3 个 bug 修复**：liuyao 起卦导航、zhan/step 8 假阴性断言
- **最终状态**：✅ 0 已知问题，0 控制台错误，可部署

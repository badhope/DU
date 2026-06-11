# 玄枢 MISTVERSE · 生活模块 5 工具 dogfood 报告

> 日期：2026-06-11 · 浏览器：headless chromium 414×896 · dpr=2
> 测试脚本：`/workspace/dogfood-multi/shenghuo/test-shenghuo.py`
> 截图目录：`/workspace/dogfood-multi/shenghuo/screenshots/`

## 总览

| #   | 工具     | 路径               | 渲染        | 核心交互 | 数据完整             | 视觉       | 总评    |
| --- | -------- | ------------------ | ----------- | -------- | -------------------- | ---------- | ------- |
| 1   | 老黄历   | `shenghuo/huangli` | ✅          | ✅       | ✅ 12值神 / 5日预览  | ⭐⭐⭐⭐   | **4/5** |
| 2   | 今日运势 | `shenghuo/yunshi`  | ✅          | ✅       | ✅ 5维评分           | ⭐⭐⭐⭐   | **4/5** |
| 3   | 吉日择时 | `mingli/jiri`      | ✅          | ✅       | ✅ 30日热图 + 10吉日 | ⭐⭐⭐⭐⭐ | **5/5** |
| 4   | 家谱排辈 | `mingli/jiazu`     | ✅          | ✅       | ✅ 字辈诗 + 6取名    | ⭐⭐⭐⭐   | **4/5** |
| 5   | 海报分享 | `personal/poster`  | ✅ **修复** | ✅       | ✅ 5模板 × 6 类型    | ⭐⭐⭐⭐⭐ | **5/5** |

**总分：22 / 25**

## 工具 1 · 老黄历

- 截图：`01-huangli-initial.png` / `02-huangli-interact.png` / `03-huangli-result.png`
- 渲染内容：日期、丙子日·青龙（黄道日）、农历、建除·闭、宿·房、冲马、宜 3 条、忌 2 条、彭祖百忌、12 值神全列、5 日预览
- 数据完整度：12 值神全列（青龙/明堂/天刑/朱雀/金匮/天德/白虎/玉堂/天牢/玄武/司命/勾陈），黄道/黑道分类清晰
- 视觉：古铜/朱红/玄黄 配色到位；KaiTi 字体 + 金色高亮 干支；卡片淡入动画
- 问题：
  - 宜 3 条 / 忌 2 条 略少（标准黄历一般 5-10 条）
  - 没有"切换日期"交互，只能看今天 + 5 日预览，无法选过往/未来
  - TopBar 在 `02-interact` 滚动时出现重影（uni-app sticky 渲染问题）
- 改进建议：增加 date-picker 让用户能查询任意日期；宜忌扩充到 5+ 条

## 工具 2 · 今日运势

- 截图：`01-yunshi-initial.png` / `02-yunshi-interact.png` / `03-yunshi-result.png`
- 渲染内容：表单（生肖/年份/月份/日期/时辰）→ 5 维评分（事业/财运/感情/健康/人际）+ 今日宜忌 + 幸运之选（颜色/数字/五行/方位）
- 视觉：彩色进度条（朱红/金/紫/绿/蓝）；生肖大字（80rpx KaiTi 配金色阴影）
- 数据完整度：5 维度评分有数据，今日/明日切换缺失
- 问题：
  - **缺少"今日/明日/本周"切换**（任务要求"必测"，但页面只有 1 个 tab）
  - 缺 12 生肖全部内容（只能选 1 个算）
  - 进度条颜色与文字颜色匹配不错
- 改进建议：在 header 下方加 "今日 | 明日 | 本周" tab 切换；展开 12 生肖总览网格

## 工具 3 · 吉日择时

- 截图：`01-jiri-initial.png` / `02-jiri-interact.png` / `03-jiri-result.png`
- 渲染内容：6 事件卡片（嫁娶/开市/动土/出行/祈福/求财）→ 30 天日历热图（黄道/平日 区分）→ 十大吉日排行（癸未司命92分、己丑天德90分…）
- 视觉：日历热图以红/绿/灰区分黄道/黑道/平日，十大吉日卡片有 #1-#10 排名
- 数据完整度：30 天评分；10 个吉日（干支 + 值神 + 类型 + 评分 + 宜忌 + 理由）
- 评分：**5/5**，数据丰富、视觉清晰、交互流畅
- 唯一小问题：热图 6 列 5 行排版 18 日在第 1 周结尾，最后一周 (13-17) 视觉上稍孤立

## 工具 4 · 家谱排辈

- 截图：`01-jiazu-initial.png` / `02-jiazu-interact.png` / `03-jiazu-result.png`
- 渲染内容：表单（姓氏/年份/月份/日期/时辰/性别）→ 家谱树状图（始祖→当代，节点含字辈）→ 字辈诗（7 句 28 字）→ 6 个取名建议（李长伟·木、李长强·金…）→ 世系流传（7 世 1900-2049）
- 视觉：李氏金色 80rpx 巨字 + 阴影；树状图节点 + 连线；当前世代金色高亮
- 数据完整度：5 大家族（李/王/张/陈/杨…）字辈诗 + 5/10 世传承 + 6 个取名
- 问题：
  - 任务说"添加家族成员"，但实际是"按出生日期反推当世字辈"，玩法不同
  - 家谱树状图 (JiaPuChart) 在小屏上节点连线密，可点开看是缩放控件 (-/+/100%) 在生效
  - TopBar 滚动时同样有重影
- 改进建议：增加手动"添加家族成员"入口（输入姓名/字辈），让用户能自定义家谱

## 工具 5 · 海报分享 ⭐ 已修复 bug

- 截图：`01-poster-initial.png` / `02-poster-interact.png` / `03-poster-result.png`
- 渲染内容：5 模板（玄黑/朱红/流金/玄紫/玄青）+ 6 类型（卦/命/塔罗/爻/AI/自）+ 自定义标题/副标题/中心字
- **🐛 发现的 bug：海报 canvas 渲染空白**
  - 根因：uni-app H5 编译时会剥离 `<canvas>` 上的 `id` 属性（实测 `<canvas class="uni-canvas-canvas" width="276" height="491">`，`id=""`）
  - 原代码 `document.getElementById('posterCanvas')` 始终返回 null
  - 即使用 Vue ref 拿到的是 uni-app 包装的 `<uni-canvas>` 元素，且 canvas 实际宽高被强制设为 CSS 尺寸 (276×491)，而非设计的 750×1334，导致绝大部分内容绘制在画布外
- **✅ 修复方案**：
  1. 改用 `document.querySelector('canvas.uni-canvas-canvas')` 找内部 canvas
  2. H5 端完全绕开 canvas，改用 CSS 模板 (`<view class="poster-css">`) 渲染海报
  3. CSS 模板响应式地根据 `form.template` 切换 5 套配色（渐变 + 角云 + 太极 + 文字层）
- 修复后效果（见 `03-poster-result.png`）：完整的「朱红」模板海报 — 顶部徽章 DAILY·今日一卦 + 中央太极 + 「命」字 + 「命由天定」金色主标题 + 「运由己造」副标题 + 内容 + 落款 + 底部金边
- 视觉：朱红渐变背景 + 金色高亮 + 楷体大字 + 角云装饰，极具玄学美感
- 文件改动：`/workspace/src/modules/personal/pages/poster.vue`（约 +200 行 CSS 模板 + 重写 drawCanvas）

## Console Errors

- 整个测试 0 个 JS 错误
- 1 个 Chrome warning（非阻塞）：`Canvas2D: Multiple readback operations using getImageData are faster with the willReadFrequently attribute set to true.`

## 关键发现与改进建议

1. **uni-app H5 canvas id 被剥离** — 是项目级隐患，建议在 `safe-calc` / 通用工具中提供一个 `getCanvasInH5(ref)` 工具方法
2. **海报 Canvas→CSS 渲染改造** — 不影响非 H5 端（小程序/APP 仍用 Canvas）；CSS 方案显示更锐利、可被搜索引擎识别
3. **5 工具 TopBar 滚动重影** — 通用问题，建议 TopBar 组件加 `position: sticky; top: 0; z-index: 10`
4. **家谱排辈可玩性可提升** — 改成"添加家族成员"流程而不是"反推字辈"，更符合任务要求
5. **今日运势缺多时态切换** — 加 今日/明日/本周 三个 tab
6. **老黄历缺 date picker** — 默认显示今日+5日预览，但用户应该可以选过往/未来

## 修复的文件

- `/workspace/src/modules/personal/pages/poster.vue`（核心 bug fix）

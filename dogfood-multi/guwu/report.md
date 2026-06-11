# 玄枢 MISTVERSE · 古物模块 真实用户模拟测试报告

> **测试日期**：2026-06-11  
> **测试环境**：Playwright Python (headless chromium) · viewport 414×896  
> **预览地址**：http://localhost:5173/mistverse/  
> **覆盖工具**：面相分析 / 手相分析 / 阳宅风水 / 命名测字（古物模块 4/5 子项）

---

## 总评

| 维度       | 评分            | 说明                                                          |
| ---------- | --------------- | ------------------------------------------------------------- |
| 玩法丰富度 | ★★★★☆ 4/5       | 表单输入 + 起卦完整；面相/手相缺真实「点击面部/手部区域」交互 |
| AI 解读感  | ★★★★★ 5/5       | 文本丰富、分门别类、术语专业（吉凶、命卦、三才五格等）        |
| 动画视觉   | ★★★☆☆ 3/5       | 罗盘 / 雷达图精致；面相/手相无 LoadingSeal 加载动画           |
| 古风元素   | ★★★★★ 5/5       | 玄黑·流金·朱砂主色 / 楷体 · 卦象符号 · 罗盘 · 印章风格按钮    |
| 排版与适配 | ★★★★★ 5/5       | 移动端 414px 视口下卡片留白、字号、断行均优秀                 |
| **总均分** | **★★★★☆ 4.4/5** | 视觉与解读达专业级，互动可再加维度                            |

---

## 1. 面相分析 `mianxiang.vue`

**路径**：`/modules/guanxiang/pages/mianxiang`  
**核心交互**：选择年/月/日 → 点击「开始分析」

### 自动化结果

| 指标       | 值                                 |
| ---------- | ---------------------------------- |
| 文本长度   | 654 字符（最丰富）                 |
| 总评分     | ✓ 73/100                           |
| 三停之运   | ✓ 上停67 / 中停69 / 下停71         |
| 五官之相   | ✓ 眉73 / 眼78 / 鼻87 / 口68 / 耳76 |
| 十二宫位   | ✓ 12 宫网格                        |
| 控制台错误 | 0                                  |

### 视觉评估

- **配色**：金红渐变按钮 + 暗金流光 + 楷体标题，与古物主题高度契合
- **数据层次**：面相总评 → 三停 → 五官 → 十二宫 4 级展开，逻辑清晰
- **进度可视化**：三停与五官用 linear-gradient 进度条（#d4af37 → #c8302a）
- **五行映射**：眉木/眼火/鼻土/口金/耳水 五行与相学匹配准确

### 问题清单

- ❌ **缺 LoadingSeal 动画**：仅 600ms `setTimeout`，无可见的玄学占卜仪式感
- ⚠️ **缺「点击面部区域」交互**：任务要求点击面部高亮五官，但实际仅通过表单起卦。`MianXiangChart` 组件存在但未在前台触发
- ⚠️ **缺「输入问题」自由问询**：仅靠生辰推导

### 截图

- `mianxiang-01-initial.png` · `mianxiang-02-loading.png` · `mianxiang-03-result.png`
- `mianxiang-04-top.png` · `mianxiang-05-mid.png`（五官之相）

---

## 2. 手相分析 `shouxiang.vue`

**路径**：`/modules/guanxiang/pages/shouxiang`  
**核心交互**：选择年/月/日 → 点击「开始分析」

### 自动化结果

| 指标       | 值                                      |
| ---------- | --------------------------------------- |
| 文本长度   | 358 字符                                |
| 总评分     | ✓ 70/100                                |
| 八宫丘相   | ✓ 8 宫（乾兑离震巽坎艮坤），各 67-74 分 |
| 三大主纹   | ✓ 生命线/智慧线/感情线 + 评分 + 描述    |
| 控制台错误 | 0                                       |

### 视觉评估

- **配色**：棕紫渐变按钮（#8b6f47 → #5b3a8e），与面相的金红形成区分，质感更沉静
- **最佳/最差丘**：best = 绿框（坤宫 74），worst = 红框（乾宫 67），一眼识别
- **三线卡**：生命线/智慧线/感情线各占一卡，质量标签「佳」+ 描述 + 进度条
- **元素注解**：金/火/木/水/土 与丘位一一对应

### 问题清单

- ❌ **缺 LoadingSeal**：同 mianxiang
- ❌ **缺「点击手部区域」交互**：`ShouXiangChart` 组件存在但未前台激活
- ⚠️ **缺掌纹 SVG 绘制动画**：八宫丘仅以条形图展示，未呈现线条绘制过程

### 截图

- `shouxiang-01-initial.png` · `shouxiang-02-loading.png` · `shouxiang-03-result.png`
- `shouxiang-04-top.png` · `shouxiang-05-mid.png`

---

## 3. 阳宅风水 `fenglui.vue`

**路径**：`/modules/guanxiang/pages/fenglui`  
**核心交互**：选择性别 + 年 → 点击「开始推算」

### 自动化结果

| 指标       | 值                                   |
| ---------- | ------------------------------------ |
| 文本长度   | 773 字符                             |
| 总评分     | ✓ 70 分 · 吉                         |
| 命卦       | ✓ 坎（东四命）                       |
| 八方罗盘   | ✓ 8 个 `.rg-cell` 渲染               |
| 门位建议   | ✓ 5 大类（大门/主卧/厨房/书房/客厅） |
| 控制台错误 | 0                                    |

### 视觉评估

- **配色**：紫青渐变按钮（#5b3a8e → #1f4e4a），呼应五行中的水/木
- **罗盘视觉**：✓ **最出色的视觉资产**——8 卦位 + 中央命卦圆形布局，绿/红/蓝描边区分吉中凶
- **八卦符号**：☳☴☶☵☲☷☱☰ 用 Unicode 卦象字符，可读性强
- **门位建议**：每行「门类 + 4 个方向」tag，绿色高亮 = 适合
- **建议列表**：24 山向详批（丑艮、寅艮、辰巽…）显出数据深度

### 问题清单

- ❌ **缺 360° 罗盘旋转动画**：罗盘为静态布局，CSS 中无 transform animation
- ❌ **缺 LoadingSeal**
- ⚠️ **缺「选方位」交互**：仅有结果展示，无「点击方位查看细节」
- ✅ 优点：整体视觉与玄学契合度最高，配色最稳重

### 截图

- `fenglui-01-initial.png` · `fenglui-02-loading.png` · `fenglui-03-result.png`
- `fenglui-04-top.png` · `fenglui-05-rosette.png`（罗盘特写）

---

## 4. 命名测字 `mingji.vue`

**路径**：`/modules/mingming/pages/mingji`  
**核心交互**：输入姓名 → 选择性别 → 点击「开始测字」

### 自动化结果

| 指标        | 值                                                       |
| ----------- | -------------------------------------------------------- |
| 文本长度    | 486 字符                                                 |
| 总评分      | ✓ 张三 → 平 60 分                                        |
| 姓名输入    | ✓ 自定义输入「张三」成功                                 |
| 三才五格    | ✓ 天格12 / 人格14 / 地格4 / 外格2 / 总格14（**修复后**） |
| 偏旁五行    | ✓ 张(笔画26, 土行) · 三(笔画31, 土行)                    |
| LoadingSeal | ✓ **唯一带 loading 仪式感的工具**                        |
| 控制台错误  | 0                                                        |

### 视觉评估

- **配色**：金蓝渐变按钮（#d4af37 → #1b3a5c），金色大气 + 玄水蓝深邃，最具「玄学」气质
- **LoadingSeal**：✓ **本模块最佳**——金色太极+卦象符 + 「玄机推演中」+ 5 步骤（清心·观象·起卦·排盘·解卦）+ 38% 进度条
- **雷达图**：五格分布用 SVG 雷达图可视化（NaN 修复后正常显示）
- **五行平衡条**：木/火/土/金/水 各自进度条 + 总笔画

### 🐛 **发现并修复的 Bug**

| 项   | 详情                                                                                                                                  |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 文件 | `src/modules/mingming/logic/mingji.ts` `computeGe()`                                                                                  |
| 症状 | 2 字姓名（如「张三」）进入「复姓 4 字」分支，导致 `renGe/diGe/waiGe/zongGe` 全部 `NaN`                                                |
| 根因 | `if (strokes.length === 2)` 复姓分支判断条件写错，复合姓氏应为 4 字；导致「单姓 1 字 + 名 1 字」分支（同样 `length === 2`）成为死代码 |
| 修复 | 把第一个分支改为 `if (strokes.length === 4)`                                                                                          |
| 验证 | 修复后：张三 → 天格12 / 人格14 / 地格4 / 外格2 / 总格14，符合单姓单名算法                                                             |

### 改进建议

- 偏旁五行算法对常用字覆盖较好（张/三 = 土），但部首表只有 90 个字符，**冷僻字易回退到「土」**
- LoadingSeal 可考虑复用给其他 3 个古物工具

### 截图

- `mingji-01-initial.png` · `mingji-01b-typed.png` · `mingji-02-loading.png`（含 LoadingSeal）
- `mingji-03-result.png` · `mingji-04-top.png` · `mingji-05-mid.png`（修复后五格）

---

## Console / Page Errors

```
[error] 无
[warning] 无
[pageerror] 无
```

✅ **4 个工具均零运行时错误**。

---

## 改进建议（按优先级）

### 🔴 P0（必修）

1. **面相/手相/风水 缺 LoadingSeal** —— mingji 的「玄机推演中」效果极好，应统一复用 `LoadingSeal` 组件
2. **缺「点击面部/手部区域」交互** —— 任务核心玩法未实现，建议在 MianXiangChart / ShouXiangChart 上挂载 hover/click 事件

### 🟡 P1（建议）

3. **罗盘 360° 旋转动画** —— `positionStyle` 已定义 8 个方位，可加 `animation: rotate 30s linear infinite` 在结果展示时慢转
4. **掌纹线条 SVG 绘制动画** —— 手相主纹可改用 SVG path + stroke-dasharray 动画
5. **测字一笔一画** —— mingji 字拆五行时可加 stroke 顺序动画

### 🟢 P2（可选）

6. **自由问询框** —— 面相/手相可加 `问题：____` 输入，把问题关键词参与 score 加权
7. **12 宫位详情卡** —— mianxiang 12 宫格目前文字偏小，可点击展开成模态卡
8. **冷启动缺用户** —— mingji 等重事类工具首次访问会弹「添加占卜人」，对真实用户有引导但新用户可能卡住

---

## 关键文件清单

| 路径                                                   | 角色                                         |
| ------------------------------------------------------ | -------------------------------------------- |
| `/workspace/src/modules/guanxiang/pages/mianxiang.vue` | 面相分析页                                   |
| `/workspace/src/modules/guanxiang/pages/shouxiang.vue` | 手相分析页                                   |
| `/workspace/src/modules/guanxiang/pages/fenglui.vue`   | 阳宅风水页                                   |
| `/workspace/src/modules/mingming/pages/mingji.vue`     | 命名测字页                                   |
| `/workspace/src/modules/mingming/logic/mingji.ts`      | 命名测字算法（已修复 NaN bug）               |
| `/workspace/src/shared/components/ui/LoadingSeal.vue`  | 加载占卜印章（仅 mingji 用了）               |
| `/workspace/src/shared/composables/use-cooldown.ts`    | 一日同人同工具冷却（仅 mingji 等重事类生效） |
| `/workspace/src/shared/styles/tokens.css`              | 玄黑/流金/朱砂 主题变量                      |

---

## 输出物

- 测试脚本：`/workspace/dogfood-multi/guwu/test-guwu.py`
- 截图：`/workspace/dogfood-multi/guwu/screenshots/` （4 工具 × 3 状态 = 12 主截图 + 8 辅助 = 20 张）
- 数据：`/workspace/dogfood-multi/guwu/results.json`
- 本报告：`/workspace/dogfood-multi/guwu/report.md`

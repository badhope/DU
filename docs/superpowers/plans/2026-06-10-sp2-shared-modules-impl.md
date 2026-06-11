# SP-2 实施计划 — Shared 资产搬移 + Utils 按模块 + Pages 搬移

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `src/{components,designs,utils,pages}/` 共 127 个文件搬到 v1.0.0 新结构（`src/shared/` + `src/modules/<m>/` + `src/settings/`），批量改写所有 import 路径，更新 `pages.json` + `App.vue` + `stores/index.ts` + `config/tools.ts`，删除旧目录，全栈验证通过。

**Architecture:** 写一个 `scripts/move-sp2.mjs` 编排器（读 `sp2-mappings.json` → `git mv` + 调用 `scripts/rewrite-imports.py` 改 import）。**不手工 Edit**——所有路径改写由脚本完成，规避 lessons-learned #1 Edit "假失败" 陷阱。每搬一个子集（按 module/类型）跑一次 `pnpm type-check`，全部搬完跑全栈验证。

**Tech Stack:** uni-app x 3.0 + Vue 3.4 + TypeScript 6 + Vite 8 + Pinia 3 + lefthook + vitest + Python 3（脚本）

**Spec:** [2026-06-10-sp2-shared-modules-design.md](file:///workspace/docs/superpowers/specs/2026-06-10-sp2-shared-modules-design.md)

---

## 文件结构（SP-2 内变化）

### 删除（旧位置）

```
src/components/                              # 整个目录
src/designs/                                 # 整个目录
src/utils/                                   # 整个目录
src/pages/                                   # 整个目录
```

### 新建

```
src/shared/
├── components/
│   ├── charts/                              # 24 文件（从 src/components/charts/）
│   ├── effects/                             # 3 文件
│   └── ui/                                  # 10 文件
├── styles/
│   ├── tokens.css                           # 从 src/designs/
│   └── animations.css                       # 从 src/designs/
└── utils/
    ├── daily-cooldown.ts                    # 从 src/utils/
    └── poster-renderer.ts                   # 从 src/utils/

src/modules/
├── mingli/
│   ├── pages/                               # 11 个 .vue
│   ├── logic/                               # 13 个 .ts
│   └── data/                                # （空，SP-3+ 填）
├── zhanbu/
│   ├── pages/                               # 11 个
│   └── logic/                               # 10 个
├── guanxiang/
│   ├── pages/                               # 3 个
│   └── logic/                               # 4 个
├── mingming/
│   ├── pages/                               # 4 个
│   └── logic/                               # 5 个
├── jiankang/
│   ├── pages/                               # 4 个
│   ├── logic/                               # 4 个
│   └── data/
│       └── meridian-data.ts                 # 从 src/utils/
├── xiuxin/
│   └── pages/                               # 3 个（无 logic）
├── shenghuo/
│   ├── pages/                               # 2 个
│   └── logic/                               # 3 个
└── personal/
    └── pages/                               # 7 个（无 logic）

src/settings/
└── pages/                                   # 1 个（settings.vue）

scripts/
├── move-sp2.mjs                             # 搬移编排器
├── rewrite-imports.py                       # import 路径批量改写
└── sp2-mappings.json                        # 人类可读 + 机器执行清单
```

### 修改

```
src/App.vue                                  # @import './designs/...' → './shared/styles/...'
src/stores/index.ts                          # import '@/utils/daily-cooldown' → '@shared/utils/daily-cooldown'
src/config/tools.ts                          # import 路径（如果有）
src/pages.json                               # 46 个 path 全部更新
scripts/check-modules.mjs                    # 步骤 1 移除 "兼容期" 例外
```

---

## Task 1: 准备脚本（sp2-mappings.json + rewrite-imports.py + move-sp2.mjs）

**Files:**

- Create: `docs/superpowers/sp2-mappings.json`
- Create: `scripts/rewrite-imports.py`
- Create: `scripts/move-sp2.mjs`

- [ ] **Step 1.1: 创建 sp2-mappings.json（人类可读 + 机器执行）**

```bash
mkdir -p docs/superpowers scripts
```

写 `docs/superpowers/sp2-mappings.json`：

```json
{
  "$schema": "./sp2-mappings.schema.json",
  "version": "1.0.0",
  "generated": "2026-06-10",
  "designs": [
    { "from": "src/designs/tokens.css", "to": "src/shared/styles/tokens.css", "type": "design" },
    {
      "from": "src/designs/animations.css",
      "to": "src/shared/styles/animations.css",
      "type": "design"
    }
  ],
  "utils": [
    {
      "from": "src/utils/daily-cooldown.ts",
      "to": "src/shared/utils/daily-cooldown.ts",
      "type": "util"
    },
    {
      "from": "src/utils/poster-renderer.ts",
      "to": "src/shared/utils/poster-renderer.ts",
      "type": "util"
    }
  ],
  "components": [
    { "from": "src/components/charts", "to": "src/shared/components/charts", "type": "dir" },
    { "from": "src/components/effects", "to": "src/shared/components/effects", "type": "dir" },
    { "from": "src/components/ui", "to": "src/shared/components/ui", "type": "dir" }
  ],
  "moduleUtils": {
    "mingli": [
      "astro",
      "bazi",
      "bazi-deep",
      "hehun",
      "jiazu",
      "jiegua",
      "jiri",
      "life",
      "dayun-life",
      "wuxing",
      "wuxing-deep",
      "ziwei",
      "tieban"
    ],
    "zhanbu": [
      "gua",
      "liuren",
      "liuyao",
      "maya",
      "meihua",
      "qimen",
      "tarot",
      "xiaoliuren",
      "xuankong",
      "zhuge"
    ],
    "guanxiang": ["chart-utils", "fenglui", "mianxiang", "shouxiang"],
    "mingming": ["jiaobei", "kangxi-strokes", "lingqian", "mingji", "shuzhi"],
    "jiankang": ["jingluo", "use-cooldown", "wufu", "zhenci"],
    "shenghuo": ["huangli", "jieqi", "yunshi"]
  },
  "moduleData": {
    "jiankang": ["meridian-data"]
  },
  "modulePages": {
    "mingli": [
      "wuxing",
      "bazi",
      "hehun",
      "liunian",
      "dayun",
      "ziwei",
      "life",
      "astro",
      "jiazu",
      "jiri",
      "tieban"
    ],
    "zhanbu": [
      "qimen",
      "liuren",
      "gua",
      "gua/interpret",
      "tarot",
      "meihua",
      "liuyao",
      "xuankong",
      "xiaoliuren",
      "zhuge",
      "maya"
    ],
    "guanxiang": ["mianxiang", "shouxiang", "fenglui"],
    "mingming": ["jiaobei", "lingqian", "shuzhi", "mingji"],
    "jiankang": ["qijing", "ziwu", "wufu", "yangsheng"],
    "xiuxin": ["zhan", "fangqi", "shijian"],
    "shenghuo": ["huangli", "yunshi"],
    "personal": ["index", "category", "profile", "dashboard", "checkin", "poster", "users"]
  },
  "settingsPages": ["settings"],
  "importRewrite": {
    "@/components/": "@shared/components/",
    "@/designs/": "@shared/styles/",
    "@/utils/daily-cooldown": "@shared/utils/daily-cooldown",
    "@/utils/poster-renderer": "@shared/utils/poster-renderer",
    "@/pages/settings/": "@settings/pages/"
  },
  "utilToModule": {
    "daily-cooldown": "shared/utils",
    "poster-renderer": "shared/utils",
    "astro": "mingli/logic",
    "bazi": "mingli/logic",
    "bazi-deep": "mingli/logic",
    "hehun": "mingli/logic",
    "jiazu": "mingli/logic",
    "jiegua": "mingli/logic",
    "jiri": "mingli/logic",
    "life": "mingli/logic",
    "dayun-life": "mingli/logic",
    "wuxing": "mingli/logic",
    "wuxing-deep": "mingli/logic",
    "ziwei": "mingli/logic",
    "tieban": "mingli/logic",
    "gua": "zhanbu/logic",
    "liuren": "zhanbu/logic",
    "liuyao": "zhanbu/logic",
    "maya": "zhanbu/logic",
    "meihua": "zhanbu/logic",
    "qimen": "zhanbu/logic",
    "tarot": "zhanbu/logic",
    "xiaoliuren": "zhanbu/logic",
    "xuankong": "zhanbu/logic",
    "zhuge": "zhanbu/logic",
    "chart-utils": "guanxiang/logic",
    "fenglui": "guanxiang/logic",
    "mianxiang": "guanxiang/logic",
    "shouxiang": "guanxiang/logic",
    "jiaobei": "mingming/logic",
    "kangxi-strokes": "mingming/logic",
    "lingqian": "mingming/logic",
    "mingji": "mingming/logic",
    "shuzhi": "mingming/logic",
    "jingluo": "jiankang/logic",
    "use-cooldown": "jiankang/logic",
    "wufu": "jiankang/logic",
    "zhenci": "jiankang/logic",
    "meridian-data": "jiankang/data",
    "huangli": "shenghuo/logic",
    "jieqi": "shenghuo/logic",
    "yunshi": "shenghuo/logic"
  },
  "pageToModule": {
    "wuxing": "mingli",
    "bazi": "mingli",
    "hehun": "mingli",
    "liunian": "mingli",
    "dayun": "mingli",
    "ziwei": "mingli",
    "life": "mingli",
    "astro": "mingli",
    "jiazu": "mingli",
    "jiri": "mingli",
    "tieban": "mingli",
    "qimen": "zhanbu",
    "liuren": "zhanbu",
    "gua": "zhanbu",
    "gua/interpret": "zhanbu",
    "tarot": "zhanbu",
    "meihua": "zhanbu",
    "liuyao": "zhanbu",
    "xuankong": "zhanbu",
    "xiaoliuren": "zhanbu",
    "zhuge": "zhanbu",
    "maya": "zhanbu",
    "mianxiang": "guanxiang",
    "shouxiang": "guanxiang",
    "fenglui": "guanxiang",
    "jiaobei": "mingming",
    "lingqian": "mingming",
    "shuzhi": "mingming",
    "mingji": "mingming",
    "qijing": "jiankang",
    "ziwu": "jiankang",
    "wufu": "jiankang",
    "yangsheng": "jiankang",
    "zhan": "xiuxin",
    "fangqi": "xiuxin",
    "shijian": "xiuxin",
    "huangli": "shenghuo",
    "yunshi": "shenghuo",
    "index": "personal",
    "category": "personal",
    "profile": "personal",
    "dashboard": "personal",
    "checkin": "personal",
    "poster": "personal",
    "users": "personal",
    "settings": "settings"
  }
}
```

- [ ] **Step 1.2: 验证 JSON 合法**

```bash
python3 -c "import json; json.load(open('docs/superpowers/sp2-mappings.json'))" && echo "✓ JSON 合法"
```

- [ ] **Step 1.3: 写 scripts/rewrite-imports.py**

```python
#!/usr/bin/env python3
"""
玄枢 v1.0.0 SP-2 — import 路径批量改写器
- 改 @/components/ → @shared/components/
- 改 @/utils/<name> → @modules/<m>/logic/<name> 或 @shared/utils/<name>
- 改 @/designs/ → @shared/styles/
- 改 @/pages/settings/ → @settings/pages/
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAPPING_FILE = ROOT / "docs/superpowers/sp2-mappings.json"


def load_mapping():
    with open(MAPPING_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def rewrite_file(file_path: Path, mapping: dict) -> bool:
    """改写单个文件的 import 路径。返回 True 如果文件被修改。"""
    text = file_path.read_text(encoding="utf-8")
    original = text

    import_rewrite = mapping["importRewrite"]
    util_to_module = mapping["utilToModule"]
    page_to_module = mapping["pageToModule"]

    # 1. 改写 @/components/ → @shared/components/
    for old, new in import_rewrite.items():
        if old == "@/components/" or old == "@/designs/":
            text = text.replace(old, new)

    # 2. 改写 @/utils/<name> → @modules/<m>/<dir>/<name>
    util_re = re.compile(r"@/utils/([A-Za-z0-9_-]+)")

    def util_replace(m):
        name = m.group(1)
        if name in util_to_module:
            return f"@{util_to_module[name]}/{name}"
        return m.group(0)

    text = util_re.sub(util_replace, text)

    # 3. 改写 @/pages/settings/<...> → @settings/pages/<...>
    text = re.sub(
        r"@/pages/settings/([A-Za-z0-9_./-]+)",
        r"@settings/pages/\1",
        text,
    )

    # 4. 改写 @/pages/<page> → @modules/<m>/pages/<page>
    page_re = re.compile(r"@/pages/([A-Za-z0-9_./-]+)")

    def page_replace(m):
        page_path = m.group(1)
        # 跳过已经是新位置的情况
        if page_path.startswith("modules/") or page_path.startswith("shared/") or page_path.startswith("settings/"):
            return m.group(0)
        # 去掉 .vue/.ts 后缀
        base = page_path.replace(".vue", "").replace(".ts", "")
        # 取第一个目录名（pages/<dirname>/<filename>）
        parts = base.split("/")
        if len(parts) >= 2:
            dirname = parts[0]
        else:
            # 单段如 "settings" → 用 page_to_module 查
            dirname = base
        if dirname in page_to_module:
            mod = page_to_module[dirname]
            return f"@modules/{mod}/pages/{page_path}"
        return m.group(0)

    text = page_re.sub(page_replace, text)

    if text != original:
        file_path.write_text(text, encoding="utf-8")
        return True
    return False


def main():
    if len(sys.argv) < 2:
        print("usage: rewrite-imports.py <file-or-dir> [...]")
        sys.exit(1)

    mapping = load_mapping()
    targets = sys.argv[1:]
    changed = 0
    total = 0

    for target in targets:
        path = Path(target)
        if path.is_file():
            files = [path]
        elif path.is_dir():
            files = list(path.rglob("*.ts")) + list(path.rglob("*.vue"))
        else:
            print(f"warn: {target} not found, skip")
            continue

        for f in files:
            total += 1
            if rewrite_file(f, mapping):
                changed += 1
                print(f"  ✓ {f.relative_to(ROOT)}")

    print(f"\n[{changed}/{total} files changed]")


if __name__ == "__main__":
    main()
```

- [ ] **Step 1.4: 写 scripts/move-sp2.mjs（编排器）**

```js
#!/usr/bin/env node
/**
 * 玄枢 v1.0.0 SP-2 — 搬移编排器
 *
 * 用法:
 *   node scripts/move-sp2.mjs                  # 全量
 *   node scripts/move-sp2.mjs --phase designs  # 单阶段
 *   node scripts/move-sp2.mjs --dry-run        # 预览
 */

import { readFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

const ROOT = process.cwd()
const MAPPING = JSON.parse(readFileSync('docs/superpowers/sp2-mappings.json', 'utf8'))
const DRY = process.argv.includes('--dry-run')
const PHASE = process.argv.find((a) => a.startsWith('--phase='))?.split('=')[1]

function run(cmd) {
  console.log(`  $ ${cmd}`)
  if (!DRY) execSync(cmd, { stdio: 'inherit' })
}

function phase(name, fn) {
  if (PHASE && PHASE !== name) return
  console.log(`\n=== Phase: ${name} ===`)
  fn()
}

// 1. 搬 designs
phase('designs', () => {
  for (const d of MAPPING.designs) {
    if (!existsSync(d.from)) {
      console.log(`  skip ${d.from} (not exist)`)
      continue
    }
    run(`git mv ${d.from} ${d.to}`)
  }
})

// 2. 搬 shared/utils
phase('shared-utils', () => {
  for (const u of MAPPING.utils) {
    if (!existsSync(u.from)) {
      console.log(`  skip ${u.from} (not exist)`)
      continue
    }
    run(`git mv ${u.from} ${u.to}`)
  }
  // 改 import（在 shared/ 内）
  if (!DRY) {
    run(`python3 scripts/rewrite-imports.py src/shared/ src/stores/ src/config/`)
  }
})

// 3. 搬 shared/components
phase('components', () => {
  for (const c of MAPPING.components) {
    if (!existsSync(c.from)) {
      console.log(`  skip ${c.from} (not exist)`)
      continue
    }
    run(`git mv ${c.from}/* ${c.to}/`)
    run(`git rm -r ${c.from}`) // 删空目录
  }
  // 改 import（在 shared/components/ 内）
  if (!DRY) {
    run(`python3 scripts/rewrite-imports.py src/shared/components/`)
  }
})

// 4. 搬 8 个 module 的 utils + 1 个 data
phase('module-utils', () => {
  for (const [mod, utils] of Object.entries(MAPPING.moduleUtils)) {
    for (const name of utils) {
      const from = `src/utils/${name}.ts`
      const to = `src/modules/${mod}/logic/${name}.ts`
      if (!existsSync(from)) {
        console.log(`  skip ${from} (not exist)`)
        continue
      }
      run(`git mv ${from} ${to}`)
    }
  }
  // 搬 data
  for (const [mod, datas] of Object.entries(MAPPING.moduleData)) {
    for (const name of datas) {
      const from = `src/utils/${name}.ts`
      const to = `src/modules/${mod}/data/${name}.ts`
      if (!existsSync(from)) {
        console.log(`  skip ${from} (not exist)`)
        continue
      }
      run(`git mv ${from} ${to}`)
    }
  }
  // 删空 src/utils
  if (!DRY) {
    run(`git rm -r src/utils/ 2>/dev/null || true`)
  }
  // 改 import（在 modules/ 内 + 所有引用方）
  if (!DRY) {
    run(
      `python3 scripts/rewrite-imports.py src/modules/ src/pages/ src/stores/ src/config/ src/App.vue src/uni.scss`,
    )
  }
})

// 5. 搬 8 个 module + settings 的 pages
phase('module-pages', () => {
  for (const [mod, pages] of Object.entries(MAPPING.modulePages)) {
    for (const page of pages) {
      const from = `src/pages/${page}.vue`
      const to = `src/modules/${mod}/pages/${page}.vue`
      if (!existsSync(from)) {
        console.log(`  skip ${from} (not exist)`)
        continue
      }
      run(`git mv ${from} ${to}`)
    }
  }
  // settings
  for (const page of MAPPING.settingsPages) {
    const from = `src/pages/${page}/${page}.vue`
    const to = `src/settings/pages/${page}.vue`
    if (existsSync(from)) {
      run(`git mv ${from} ${to}`)
    }
  }
  // 删空 src/pages
  if (!DRY) {
    run(`git rm -r src/pages/ 2>/dev/null || true`)
  }
  // 改 import（在 modules/pages 内 + stores）
  if (!DRY) {
    run(
      `python3 scripts/rewrite-imports.py src/modules/ src/settings/ src/stores/ src/config/ src/App.vue`,
    )
  }
})

console.log(`\n${DRY ? '(dry-run) ' : ''}✅ move-sp2 complete`)
```

- [ ] **Step 1.5: chmod +x 给脚本**

```bash
chmod +x scripts/move-sp2.mjs scripts/rewrite-imports.py
```

- [ ] **Step 1.6: 验证脚本可执行（dry-run 模式）**

```bash
node scripts/move-sp2.mjs --dry-run 2>&1 | head -30
# 期望: 打印各 phase 的 git mv 命令
```

- [ ] **Step 1.7: 提交 Task 1**

```bash
git add docs/superpowers/sp2-mappings.json scripts/move-sp2.mjs scripts/rewrite-imports.py
git status --short
git commit -m "feat(sp2): add move-sp2 orchestrator + rewrite-imports script (Task 1)

- docs/superpowers/sp2-mappings.json: 127 files mapping (designs,
  utils, components, 8 module utils, 8 module pages, settings)
- scripts/rewrite-imports.py: batch rewrite @/components/@/utils/
  @/designs/@/pages/ → @shared/@/modules/ via regex
- scripts/move-sp2.mjs: 5-phase orchestrator (designs/shared-utils/
  components/module-utils/module-pages) with --dry-run support

Part of 玄枢 v1.0.0 redo SP-2"
```

---

## Task 2: 搬 shared 资产（designs + utils + components）

**Files:**

- Move: `src/designs/*` → `src/shared/styles/*`
- Move: `src/utils/{daily-cooldown,poster-renderer}.ts` → `src/shared/utils/`
- Move: `src/components/{charts,effects,ui}/*` → `src/shared/components/{charts,effects,ui}/`
- Modify: `src/App.vue`（@import 路径）
- Modify: `src/stores/index.ts`（daily-cooldown import）
- Modify: `src/config/tools.ts`（如有 import）

- [ ] **Step 2.1: 跑搬移器（共享资产阶段）**

```bash
node scripts/move-sp2.mjs --phase=designs
node scripts/move-sp2.mjs --phase=shared-utils
node scripts/move-sp2.mjs --phase=components
# 期望: ~ 30+ 文件被 git mv
```

- [ ] **Step 2.2: 验证 move 后 src/ 状态**

```bash
ls src/shared/styles/      # 期望: tokens.css animations.css
ls src/shared/utils/       # 期望: daily-cooldown.ts poster-renderer.ts
ls src/shared/components/  # 期望: charts/ effects/ ui/
ls src/components/ 2>&1    # 期望: No such file
ls src/designs/ 2>&1       # 期望: No such file
```

- [ ] **Step 2.3: 验证 import 改写结果**

```bash
grep -rn "@/components/\|@/designs/" src/ 2>&1 | head -10
# 期望: 0 命中（或仅剩 App.vue 中的 CSS @import 已被改）
grep -rn "@/utils/daily-cooldown\|@/utils/poster-renderer" src/ 2>&1 | head -5
# 期望: 0 命中
```

- [ ] **Step 2.4: 手动改 App.vue 的 CSS @import**

读 `src/App.vue`（line 52-53），把：

```css
@import './designs/tokens.css';
@import './designs/animations.css';
```

改为：

```css
@import './shared/styles/tokens.css';
@import './shared/styles/animations.css';
```

- [ ] **Step 2.5: 跑 type-check**

```bash
pnpm type-check 2>&1 | tail -20
# 期望: 0 错
```

如失败 → 看 import 改写是否漏文件，跑 `python3 scripts/rewrite-imports.py src/shared/ src/stores/ src/config/ src/App.vue` 再来一次。

- [ ] **Step 2.6: 跑 check-modules**

```bash
pnpm check:modules
# 期望: ✅ 0 errors（步骤 1 应仍 OK，因为新位置在 modules/.../pages/ 还未填，shared 也允许 import shared）
```

- [ ] **Step 2.7: 提交 Task 2**

```bash
git add -A
git status --short
git commit -m "feat(sp2): move shared assets (Task 2)

- move src/designs/* → src/shared/styles/ (tokens + animations)
- move src/utils/{daily-cooldown,poster-renderer} → src/shared/utils/
- move src/components/{charts,effects,ui}/* → src/shared/components/
- rewrite imports: @/components/ → @shared/components/,
  @/designs/ → @shared/styles/, @/utils/{daily-cooldown,poster-renderer}
  → @shared/utils/
- update App.vue CSS @import paths

Part of 玄枢 v1.0.0 redo SP-2"
```

---

## Task 3: 搬 8 个 module 的 utils

**Files:**

- Move: `src/utils/<40 个 utils>` → `src/modules/<m>/{logic,data}/`

- [ ] **Step 3.1: 跑搬移器（module-utils 阶段）**

```bash
node scripts/move-sp2.mjs --phase=module-utils
# 期望: ~40 文件被 git mv
```

- [ ] **Step 3.2: 验证 move 后状态**

```bash
for m in mingli zhanbu guanxiang mingming jiankang shenghuo; do
  echo "=== $m ==="
  ls src/modules/$m/logic/ 2>/dev/null
done
ls src/modules/jiankang/data/ 2>/dev/null  # 期望: meridian-data.ts
ls src/utils/ 2>&1                          # 期望: No such file
```

- [ ] **Step 3.3: 验证 import 改写结果**

```bash
grep -rn "@/utils/" src/ 2>&1 | head -10
# 期望: 0 命中
```

- [ ] **Step 3.4: 跑 type-check**

```bash
pnpm type-check 2>&1 | tail -20
# 期望: 0 错
```

- [ ] **Step 3.5: 跑测试**

```bash
pnpm test 2>&1 | tail -10
# 期望: 全过
```

- [ ] **Step 3.6: 提交 Task 3**

```bash
git add -A
git status --short
git commit -m "feat(sp2): move 40 utils to 8 modules (Task 3)

- mingli: 13 utils (astro, bazi, bazi-deep, hehun, jiazu, jiegua,
  jiri, life, dayun-life, wuxing, wuxing-deep, ziwei, tieban)
- zhanbu: 10 utils (gua, liuren, liuyao, maya, meihua, qimen, tarot,
  xiaoliuren, xuankong, zhuge)
- guanxiang: 4 utils (chart-utils, fenglui, mianxiang, shouxiang)
- mingming: 5 utils (jiaobei, kangxi-strokes, lingqian, mingji, shuzhi)
- jiankang: 4 logic (jingluo, use-cooldown, wufu, zhenci) + 1 data
  (meridian-data)
- shenghuo: 3 utils (huangli, jieqi, yunshi)
- rewrite imports across all consumers

Part of 玄枢 v1.0.0 redo SP-2"
```

---

## Task 4: 搬 8 个 module + settings 的 pages

**Files:**

- Move: `src/pages/<46 pages>` → `src/modules/<m>/pages/`
- Move: `src/pages/settings/settings.vue` → `src/settings/pages/settings.vue`

- [ ] **Step 4.1: 跑搬移器（module-pages 阶段）**

```bash
node scripts/move-sp2.mjs --phase=module-pages
# 期望: ~46 文件被 git mv
```

- [ ] **Step 4.2: 验证 move 后状态**

```bash
for m in mingli zhanbu guanxiang mingming jiankang xiuxin shenghuo personal; do
  cnt=$(ls src/modules/$m/pages 2>/dev/null | wc -l)
  echo "$m: $cnt pages"
done
ls src/settings/pages 2>/dev/null
ls src/pages/ 2>&1  # 期望: No such file
```

- [ ] **Step 4.3: 验证 import 改写结果**

```bash
grep -rn "@/pages/" src/ 2>&1 | head -10
# 期望: 0 命中
```

- [ ] **Step 4.4: 跑 type-check**

```bash
pnpm type-check 2>&1 | tail -20
# 期望: 0 错
```

- [ ] **Step 4.5: 跑 check-modules**

```bash
pnpm check:modules
# 期望: ✅ 0 errors
```

如失败 → 看 import 改写是否漏文件。

- [ ] **Step 4.6: 提交 Task 4**

```bash
git add -A
git status --short
git commit -m "feat(sp2): move 46 pages to 8 modules + settings (Task 4)

- mingli: 11 pages (wuxing, bazi, hehun, liunian, dayun, ziwei, life,
  astro, jiazu, jiri, tieban)
- zhanbu: 11 pages (qimen, liuren, gua, gua/interpret, tarot, meihua,
  liuyao, xuankong, xiaoliuren, zhuge, maya)
- guanxiang: 3 pages (mianxiang, shouxiang, fenglui)
- mingming: 4 pages (jiaobei, lingqian, shuzhi, mingji)
- jiankang: 4 pages (qijing, ziwu, wufu, yangsheng)
- xiuxin: 3 pages (zhan, fangqi, shijian)
- shenghuo: 2 pages (huangli, yunshi)
- personal: 7 pages (index, category, profile, dashboard, checkin,
  poster, users)
- settings: 1 page (settings)
- rewrite imports across all consumers

Part of 玄枢 v1.0.0 redo SP-2"
```

---

## Task 5: 更新 pages.json + check-modules.mjs + 验证

**Files:**

- Modify: `src/pages.json`（46 path 改写）
- Modify: `scripts/check-modules.mjs`（移除兼容期例外）

- [ ] **Step 5.1: 写 pages.json 路径转换脚本**

```bash
python3 <<'PYEOF'
import json
from pathlib import Path

p = Path("src/pages.json")
data = json.loads(p.read_text(encoding="utf-8"))

mapping = json.loads(Path("docs/superpowers/sp2-mappings.json").read_text(encoding="utf-8"))
page_to_module = mapping["pageToModule"]

changed = 0
for entry in data["pages"]:
    old = entry["path"]
    if not old.startswith("pages/"):
        continue
    # 解析: pages/<dirname>/<basename> 或 pages/<dirname>（单段）
    parts = old.split("/")
    if len(parts) == 2:
        # pages/<x> → modules/<m>/pages/<x>
        dirname = parts[1]
    elif len(parts) >= 3:
        # pages/<dirname>/<basename> → modules/<m>/pages/<dirname>/<basename>
        dirname = parts[1]
    else:
        continue
    if dirname in page_to_module:
        mod = page_to_module[dirname]
        # 旧: pages/X/Y  新: modules/<m>/pages/X/Y
        new = f"modules/{mod}/pages/" + "/".join(parts[1:])
        entry["path"] = new
        changed += 1
        print(f"  {old} -> {new}")

p.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"\n[{changed} paths updated]")
PYEOF
```

- [ ] **Step 5.2: 验证 pages.json 路径**

```bash
node -e "const p=require('./src/pages.json'); console.log('total:', p.pages.length, 'old pages/ prefix:', p.pages.filter(x=>x.path.startsWith('pages/')).length)"
# 期望: total=46, old=0
```

- [ ] **Step 5.3: 改 scripts/check-modules.mjs 步骤 1（移除兼容期例外）**

读 `scripts/check-modules.mjs` 步骤 1（line 327-349 附近），修改判断逻辑：

```diff
       // 允许：shared, settings, app, stores, config, 当前模块自身
       if (rel.startsWith('shared/') || rel.startsWith('settings/') ||
           rel.startsWith('app/') || rel.startsWith('stores/') ||
           rel.startsWith('config/')) continue
       if (rel.startsWith(`modules/${m}/`)) continue
       if (rel.startsWith('modules/')) {
         fail(1, `${relative(ROOT, f)} imports 兄弟模块 ${spec} (→ ${rel})`)
       }
-      // pages/ utils/ designs/ components/ stores/ 仍允许（SP-1 兼容期）
+      // 兼容期已结束（SP-2 完成）：只允许 shared/settings/app/stores/config + 本模块
```

并把"扫描完成"那行从 "兼容期" 改为 "SP-2 完成态"：

```diff
-ok(1, '扫描完成（兼容期：旧 pages/utils 仍可访问）')
+ok(1, '扫描完成（SP-2 完成态：仅允许 shared/settings/app/stores/config + 本模块）')
```

- [ ] **Step 5.4: 跑 check-modules**

```bash
pnpm check:modules
# 期望: ✅ 0 errors
```

- [ ] **Step 5.5: 跑全栈验证**

```bash
pnpm type-check     # 0 错
pnpm lint           # 0 warning
pnpm test           # 全过
```

- [ ] **Step 5.6: 跑 dev server 验证页面可访问**

```bash
pnpm dev:h5 &
PID=$!
sleep 12
# 期望: 看到 "ready in" 字样
kill $PID
```

- [ ] **Step 5.7: 跑 build:h5**

```bash
pnpm build:h5 2>&1 | tail -20
# 期望: 成功
```

- [ ] **Step 5.8: 提交 Task 5**

```bash
git add -A
git status --short
git commit -m "feat(sp2): update pages.json + tighten check-modules (Task 5)

- src/pages.json: 46 paths updated to modules/<m>/pages/<...> form
- scripts/check-modules.mjs: drop SP-1 compat-period exception,
  modules now strictly only allow shared/settings/app/stores/config
  + self imports
- full stack verification: type-check 0 / lint 0 / test pass /
  build:h5 success

Part of 玄枢 v1.0.0 redo SP-2"
```

---

## 验收（SP-2 完成态）

```bash
# 1. 新结构就位
ls src/shared/{components,styles,utils}
echo "charts: $(ls src/shared/components/charts | wc -l) (期望 24)"
echo "effects: $(ls src/shared/components/effects | wc -l) (期望 3)"
echo "ui: $(ls src/shared/components/ui | wc -l) (期望 10)"

for m in mingli zhanbu guanxiang mingming jiankang xiuxin shenghuo personal; do
  pages=$(ls src/modules/$m/pages 2>/dev/null | wc -l)
  logic=$(ls src/modules/$m/logic 2>/dev/null | wc -l)
  data=$(ls src/modules/$m/data 2>/dev/null | wc -l)
  echo "$m: pages=$pages logic=$logic data=$data"
done
echo "settings pages: $(ls src/settings/pages 2>/dev/null | wc -l) (期望 1)"

# 2. 旧目录已删
test ! -d src/components && echo "✓ components deleted"
test ! -d src/designs && echo "✓ designs deleted"
test ! -d src/utils && echo "✓ utils deleted"
test ! -d src/pages && echo "✓ pages deleted"

# 3. 0 import 残留
grep -rn "@/components/\|@/utils/\|@/designs/\|@/pages/" src/ 2>&1
# 期望: 空

# 4. 全栈验证
pnpm type-check && pnpm check:modules && pnpm lint && pnpm test && pnpm build:h5
# 期望: 全部通过
```

## 风险与缓解

| 风险                               | 缓解                                            |
| ---------------------------------- | ----------------------------------------------- |
| python 脚本改 import 出错          | 改完跑 type-check 兜底 + Grep 验证              |
| pages.json 改 path 漏写            | 脚本基于 mapping 表自动转 + node 验证           |
| 24 charts 组件改 import 出错       | rewrite-imports.py 一次性 regex 改 + type-check |
| 脚本覆盖了不该改的文件             | 脚本只处理 git mv 后的新位置 + 严格正则         |
| check-modules.mjs 移除兼容期后失败 | 步骤 5.4 验证；如失败看哪条 import 违规         |

## 交付物清单

- [x] 1 commit "feat(sp2): add move-sp2 orchestrator + rewrite-imports script (Task 1)"
- [ ] 1 commit "feat(sp2): move shared assets (Task 2)"
- [ ] 1 commit "feat(sp2): move 40 utils to 8 modules (Task 3)"
- [ ] 1 commit "feat(sp2): move 46 pages to 8 modules + settings (Task 4)"
- [ ] 1 commit "feat(sp2): update pages.json + tighten check-modules (Task 5)"
- [ ] `docs/superpowers/specs/2026-06-10-sp2-shared-modules-design.md`
- [ ] `docs/superpowers/plans/2026-06-10-sp2-shared-modules-impl.md`（本文件）

## 下一 SP

- [ ] SP-3: 观形 KnowledgeShell + 图片管线 + Store 拆分 + 持久化迁移（Task 6+7+8）
- [ ] SP-4: 6 motion composable + 路由类型 + 错误边界（Task 9+10+11）
- [ ] SP-5: v1.0.0 tag + README + 测试收尾（Task 12）

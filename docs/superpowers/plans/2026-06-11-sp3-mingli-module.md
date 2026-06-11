# SP-3 Implementation Plan: 迁移命理类到 `src/modules/mingli/`

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 v1.0.1 扁平结构中 tools.ts category='mingli' 的真命理子集（9 个工具，**严格排除**混入 mingli 类的占卜工具 liuren/xiaoliuren/zhuge/tieban/qimen 和个人中心工具 profile/dashboard/users）迁移到 `src/modules/mingli/`。这建立 v1.1.0 模块化迁移的第一个 module 样板。

**Architecture:**
- `src/modules/mingli/pages/` — 9 个 .vue
- `src/modules/mingli/logic/` — 11 个 .ts（bazi/hehun/liunian 共用 wuxing/bazi）
- `src/modules/mingli/components/charts/` — 7 个 .vue

**Tech Stack:** uni-app x 3.0 + Vue 3.4 + TypeScript 6 + git mv + sed 批量改 import

**严格边界**：mingli 类里 16 个 tool key 中，**只迁 9 个真命理**。liuren/xiaoliuren/zhuge/tieban 留 SP-4 zhanbu；profile/dashboard/users 留 SP-5 personal；qimen（mingmen key 错位）留 SP-4 zhanbu。charts/ 24 个里**只迁 7 个** mingli 专用 chart。

---

### Task 1: 建 `src/modules/mingli/` 目录结构

**Files:**
- Create: `src/modules/mingli/pages/`
- Create: `src/modules/mingli/logic/`
- Create: `src/modules/mingli/components/charts/`

- [ ] **Step 1: 建目录**

```bash
mkdir -p src/modules/mingli/pages \
         src/modules/mingli/logic \
         src/modules/mingli/components/charts
```

预期：3 个空目录

---

### Task 2: git mv 9 个 page 到 mingli

**Files:**
- Move: `src/pages/{wuxing,bazi,hehun,liunian,ziwei,xuankong,life,astro,maya}/{name}.vue` → `src/modules/mingli/pages/{name}.vue`

- [ ] **Step 1: 9 个 git mv**

```bash
for f in wuxing bazi hehun liunian ziwei xuankong life astro maya; do
  git mv "src/pages/${f}/${f}.vue" "src/modules/mingli/pages/${f}.vue"
done
git status --short 2>&1 | head -15
```

预期：9 行 `R`

- [ ] **Step 2: 清理空 pages 目录**

```bash
for f in wuxing bazi hehun liunian ziwei xuankong life astro maya; do
  rmdir "src/pages/${f}" 2>/dev/null
done
ls src/pages/ 2>&1 | head -10
```

预期：9 个目录已删，src/pages/ 还剩 32 个

---

### Task 3: git mv 11 个 logic 到 mingli

**Files:**
- Move: `src/utils/{wuxing,wuxing-deep,bazi,bazi-deep,hehun,liunian,ziwei,xuankong,life,astro,maya}.ts` → `src/modules/mingli/logic/{name}.ts`

- [ ] **Step 1: 11 个 git mv**

```bash
for f in wuxing wuxing-deep bazi bazi-deep hehun liunian ziwei xuankong life astro maya; do
  git mv "src/utils/${f}.ts" "src/modules/mingli/logic/${f}.ts"
done
git status --short 2>&1 | grep "\.ts" | head -15
```

预期：11 行 `R`

- [ ] **Step 2: 检查 wuxing.ts / bazi.ts 内部 import**

读 `src/modules/mingli/logic/wuxing.ts` 和 `bazi.ts`，看是否 import 其他 utils（如 `@/utils/wuxing-deep`）。如果有，更新路径（虽然 wuxing-deep 也被移到 mingli/logic/，但 import 路径需保持相对或别名一致）。

记录所有需要修的内部 import 引用。

---

### Task 4: git mv 7 个 chart 到 mingli

**Files:**
- Move: `src/components/charts/{BaziChart,HeHunChart,LiuNianChart,ZiweiChart,LifeNumberChart,AstroChart,MayaChart}.vue` → `src/modules/mingli/components/charts/{Name}.vue`

- [ ] **Step 1: 7 个 git mv**

```bash
for f in BaziChart HeHunChart LiuNianChart ZiweiChart LifeNumberChart AstroChart MayaChart; do
  git mv "src/components/charts/${f}.vue" "src/modules/mingli/components/charts/${f}.vue"
done
git status --short 2>&1 | grep "Chart.vue" | head -10
```

预期：7 行 `R`

---

### Task 5: 改 pages.json 9 处路径

**Files:**
- Modify: `src/pages.json` 9 处

- [ ] **Step 1: 改 9 处路径**

```bash
python3 << 'PY'
import re
from pathlib import Path

p = Path("src/pages.json")
s = p.read_text(encoding="utf-8")

# mingli 9 个工具
names = ['wuxing', 'bazi', 'hehun', 'liunian', 'ziwei', 'xuankong', 'life', 'astro', 'maya']

for n in names:
    old = f'"path": "pages/{n}/{n}"'
    new = f'"path": "modules/mingli/pages/{n}"'
    s_new = s.replace(old, new)
    if s_new == s:
        print(f"  WARNING: {n} not found")
    else:
        s = s_new
        print(f"  fixed: {n}")

p.write_text(s, encoding="utf-8")
print("done")
PY
```

预期：9 行 fixed

---

### Task 6: 批量改 imports（pages/logic/charts + cross-module 引用）

**Files:**
- Modify: 所有 import `@/utils/{wuxing,wuxing-deep,bazi,bazi-deep,hehun,liunian,ziwei,xuankong,life,astro,maya}` 的 .vue/.ts
- Modify: 所有 import `@/components/charts/{BaziChart,HeHunChart,LiuNianChart,ZiweiChart,LifeNumberChart,AstroChart,MayaChart}` 的 .vue

- [ ] **Step 1: 写 Python 批量改 imports**

```bash
python3 << 'PY'
from pathlib import Path

# logic 文件名
logic_files = ['wuxing', 'wuxing-deep', 'bazi', 'bazi-deep', 'hehun', 'liunian', 'ziwei', 'xuankong', 'life', 'astro', 'maya']
# chart 文件名
chart_files = ['BaziChart', 'HeHunChart', 'LiuNianChart', 'ZiweiChart', 'LifeNumberChart', 'AstroChart', 'MayaChart']

files = list(Path("src").rglob("*.vue")) + list(Path("src").rglob("*.ts"))

changed = 0
for fp in files:
    s = fp.read_text(encoding="utf-8")
    new = s
    for n in logic_files:
        new = new.replace(f"@/utils/{n}", f"@/modules/mingli/logic/{n}")
    for n in chart_files:
        new = new.replace(f"@/components/charts/{n}", f"@/modules/mingli/components/charts/{n}")
    if new != s:
        fp.write_text(new, encoding="utf-8")
        changed += 1
        print(f"  modified: {fp}")

print(f"Total: {changed} files")
PY
```

预期：~15 个 files modified（9 mingli pages + 一些 cross-module 引用）

---

### Task 7: 验证 + commit

- [ ] **Step 1: type-check**

```bash
pnpm type-check
```

预期：0 错

- [ ] **Step 2: test**

```bash
pnpm test
```

预期：26/26 通过

- [ ] **Step 3: build**

```bash
pnpm build:h5
```

预期：DONE Build complete

- [ ] **Step 4: git status**

```bash
git status --short 2>&1 | head -30
```

预期：~28 个文件改动（9 R + 11 R + 7 R + 1 pages.json + ~15 import 修）

- [ ] **Step 5: commit**

```bash
git add -A
git -c user.email="claude@anthropic.com" -c user.name="MISTVERSE Dev" commit -m "$(cat <<'EOF'
refactor: SP-3 迁移命理类到 src/modules/mingli/

按 tools.ts category='mingli' 严格筛选真命理 9 个工具:

pages/ (9):
  wuxing/bazi/hehun/liunian/ziwei/xuankong/life/astro/maya

logic/ (11): wuxing/wuxing-deep/bazi/bazi-deep/hehun/liunian/
  ziwei/xuankong/life/astro/maya (bazi/hehun/liunian 共用 wuxing/bazi)

components/charts/ (7): BaziChart/HeHunChart/LiuNianChart/
  ZiweiChart/LifeNumberChart/AstroChart/MayaChart

pages.json: 9 处 path 改 pages/X/X → modules/mingli/pages/X
~15 个 import 路径批量改: @/utils/{mingli-X} → @/modules/mingli/logic/{X}
                            @/components/charts/{mingli-X} → @/modules/mingli/components/charts/{X}

边界: mingli 类里 16 个 tool key 中,只迁这 9 个真命理。
- liuren/xiaoliuren/zhuge/tieban → SP-4 zhanbu
- profile/dashboard/users → SP-5 personal
- qimen(mingmen key 错位) → SP-4 zhanbu

charts/ 24 个里只迁 7 个 mingli 专用,其他 17 个留原位,SP-4/5 时按归属。

type-check 0 错 / test 26-26 / build:h5 通过
EOF
)"
```

预期：1 commit，prettier/eslint/commitlint 通过

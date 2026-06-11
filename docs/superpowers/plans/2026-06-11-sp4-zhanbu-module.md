# SP-4 Implementation Plan: 迁移占卜类到 `src/modules/zhanbu/`

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 v1.0.1 扁平结构中所有占卜类工具（zhongshu 分类 7 个 + mingli 分类混入的占卜 5 个 = **12 个工具**）迁移到 `src/modules/zhanbu/`，包括它们的 page、logic、chart。

**Architecture:**
- `src/modules/zhanbu/pages/` — 12 个 .vue（gua 有 2 个：gua.vue + interpret.vue；其他 11 个各 1 个）
- `src/modules/zhanbu/logic/` — 13 个 .ts（含 jiegua.ts，gua/interpret.vue 用）
- `src/modules/zhanbu/components/charts/` — 8 个 .vue

**Tech Stack:** uni-app x 3.0 + Vue 3.4 + TypeScript 6 + git mv + sed 批量改 import

**严格边界**：只迁**真占卜**类工具。其他 4 个 mingli 工具（liuren/xiaoliuren/zhuge/tieban）虽然 category='mingli'，但语义上属占卜类，**也归 zhanbu**（因为 SP-3 没处理）。qimen（mingmen key 错位）也归 zhanbu。

---

### Task 1: 建 `src/modules/zhanbu/` 目录

- [ ] **Step 1: 建目录**

```bash
mkdir -p src/modules/zhanbu/pages \
         src/modules/zhanbu/logic \
         src/modules/zhanbu/components/charts
```

---

### Task 2: git mv 12 page

**Files:**
- Move: `src/pages/{gua/interpret.vue,gua/gua.vue,liuyao/liuyao.vue,tarot/tarot.vue,meihua/meihua.vue,lingqian/lingqian.vue,shuzhi/shuzhi.vue,jiaobei/jiaobei.vue,liuren/liuren.vue,xiaoliuren/xiaoliuren.vue,zhuge/zhuge.vue,tieban/tieban.vue,qimen/qimen.vue}` → `src/modules/zhanbu/pages/{name}.vue`

- [ ] **Step 1: 13 个 git mv（gua 2 个 + 其他 11 个）**

```bash
git mv src/pages/gua/gua.vue src/modules/zhanbu/pages/gua.vue
git mv src/pages/gua/interpret.vue src/modules/zhanbu/pages/interpret.vue
for f in liuyao tarot meihua lingqian shuzhi jiaobei liuren xiaoliuren zhuge tieban qimen; do
  git mv "src/pages/${f}/${f}.vue" "src/modules/zhanbu/pages/${f}.vue"
done
git status --short 2>&1 | grep "zhanbu" | head -15
```

预期：13 行 `R`

- [ ] **Step 2: 清理空 pages 目录**

```bash
for f in gua liuyao tarot meihua lingqian shuzhi jiaobei liuren xiaoliuren zhuge tieban qimen; do
  rmdir "src/pages/${f}" 2>/dev/null
done
ls src/pages/ | wc -l
```

预期：src/pages/ 剩 ~24 个目录

---

### Task 3: git mv 13 logic

**Files:**
- Move: `src/utils/{gua,jiegua,liuyao,tarot,meihua,lingqian,shuzhi,jiaobei,liuren,xiaoliuren,zhuge,tieban,qimen}.ts` → `src/modules/zhanbu/logic/{name}.ts`

- [ ] **Step 1: 13 个 git mv**

```bash
for f in gua jiegua liuyao tarot meihua lingqian shuzhi jiaobei liuren xiaoliuren zhuge tieban qimen; do
  git mv "src/utils/${f}.ts" "src/modules/zhanbu/logic/${f}.ts"
done
git status --short 2>&1 | grep "zhanbu/logic" | head -15
```

预期：13 行 `R`

---

### Task 4: git mv 8 chart

**Files:**
- Move: `src/components/charts/{HexChart,TarotDeck,MeiHuaChart,LiuRenDaChart,LiuRenChart,ZhugeChart,TieBanChart,QiMenChart}.vue` → `src/modules/zhanbu/components/charts/{Name}.vue`

- [ ] **Step 1: 8 个 git mv**

```bash
for f in HexChart TarotDeck MeiHuaChart LiuRenDaChart LiuRenChart ZhugeChart TieBanChart QiMenChart; do
  git mv "src/components/charts/${f}.vue" "src/modules/zhanbu/components/charts/${f}.vue"
done
git status --short 2>&1 | grep "zhanbu/components" | head -10
```

预期：8 行 `R`

---

### Task 5: 改 pages.json 12 处路径

- [ ] **Step 1: 改 12 处路径**

```bash
python3 << 'PY'
from pathlib import Path
p = Path("src/pages.json")
s = p.read_text(encoding="utf-8")
# 12 个 zhanbu tools (interpret 是 gua 的子页,跟 gua 共用 path)
names = ['gua', 'liuyao', 'tarot', 'meihua', 'lingqian', 'shuzhi', 'jiaobei',
         'liuren', 'xiaoliuren', 'zhuge', 'tieban', 'qimen']
for n in names:
    old = f'"path": "pages/{n}/{n}"'
    new = f'"path": "modules/zhanbu/pages/{n}"'
    s = s.replace(old, new)
# interpret.vue 是子路由,通常跟 gua 同一 path,不需改
p.write_text(s, encoding="utf-8")
print("pages.json done")
PY
```

---

### Task 6: 批量改 imports

- [ ] **Step 1: 改 alias 引用 + 相对 import**

```bash
python3 << 'PY'
from pathlib import Path
import re

logic_files = ['gua', 'jiegua', 'liuyao', 'tarot', 'meihua', 'lingqian', 'shuzhi', 'jiaobei',
               'liuren', 'xiaoliuren', 'zhuge', 'tieban', 'qimen']
chart_files = ['HexChart', 'TarotDeck', 'MeiHuaChart', 'LiuRenDaChart', 'LiuRenChart',
               'ZhugeChart', 'TieBanChart', 'QiMenChart']

files = list(Path("src").rglob("*.vue")) + list(Path("src").rglob("*.ts"))
changed = 0
for fp in files:
    s = fp.read_text(encoding="utf-8")
    new = s
    # alias 引用
    for n in logic_files:
        new = new.replace(f"@/utils/{n}", f"@/modules/zhanbu/logic/{n}")
    for n in chart_files:
        new = new.replace(f"@/components/charts/{n}", f"@/modules/zhanbu/components/charts/{n}")
    # 相对 import './gua' './liuyao' 等
    for n in logic_files:
        new = re.sub(rf"from\s+['\"]\.+/{n}['\"]", f"from '@/modules/zhanbu/logic/{n}'", new)
        new = re.sub(rf"import\s+['\"]\.+/{n}['\"]", f"import '@/modules/zhanbu/logic/{n}'", new)
    if new != s:
        fp.write_text(new, encoding="utf-8")
        changed += 1
print(f"Total: {changed} files")
PY
```

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

- [ ] **Step 4: commit**

```bash
git add -A
git -c user.email="claude@anthropic.com" -c user.name="MISTVERSE Dev" commit -m "$(cat <<'EOF'
refactor: SP-4 迁移占卜类到 src/modules/zhanbu/

合并两个 source 的占卜类工具 (12 个):

zhongshu 分类 (7): gua/liuyao/tarot/meihua/lingqian/shuzhi/jiaobei
mingli 分类混入 (5): liuren/xiaoliuren/zhuge/tieban/qimen

pages/ (13 文件): gua/interpret/gua/liuyao/tarot/meihua/lingqian/shuzhi/
  jiaobei/liuren/xiaoliuren/zhuge/tieban/qimen (gua 含 interpret.vue)

logic/ (13): gua/jiegua/liuyao/tarot/meihua/lingqian/shuzhi/jiaobei/
  liuren/xiaoliuren/zhuge/tieban/qimen (jiegua.ts 是 interpret 用)

components/charts/ (8): HexChart/TarotDeck/MeiHuaChart/LiuRenDaChart/
  LiuRenChart/ZhugeChart/TieBanChart/QiMenChart

pages.json: 12 处 path 改 pages/X/X → modules/zhanbu/pages/X
~25 个 import 路径批量改: @/utils/{zhanbu-X} → @/modules/zhanbu/logic/{X}
                            @/components/charts/{zhanbu-X} → @/modules/zhanbu/components/charts/{X}
相对 import './gua' 等 → 别名路径

type-check 0 错 / test 26-26 / build:h5 通过
EOF
)"
```

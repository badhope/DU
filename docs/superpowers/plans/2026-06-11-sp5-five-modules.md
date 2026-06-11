# SP-5 Implementation Plan: 迁移 5 个 module（guwu/jian/xiuxin/shenghuo/personal）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 v1.0.1 剩余的工具类（guwu 4 + jian 4 + xiuxin 5 + shenghuo 5 + personal 3 = **21 个 page + 14 个 logic + 7 个 chart + 1 个 BodyMap**）一次性迁移到 `src/modules/{guwu,jian,xiuxin,shenghuo,personal}/`，完成 v1.1.0 模块化架构。

**Architecture:** 5 个 module，每个：

- `src/modules/{name}/pages/` — .vue
- `src/modules/{name}/logic/` — .ts
- `src/modules/{name}/components/` — chart 子目录（jian 包含 BodyMap.vue）

**Tech Stack:** uni-app x 3.0 + Vue 3.4 + TypeScript 6 + git mv + sed 批量改 import

**边界**：严格按 tools.ts 分类（guwu/jian/xiuxin/shenghuo + personal）。xiuxin 含 checkin、shenghuo 含 poster — 虽然语义偏个人中心，但按 tools.ts 归位。BodyMap.vue 从 `src/components/ui/` 迁到 `src/modules/jian/components/`（jiankang 模块专用）。

---

### Task 1: 建 5 个 module 目录

- [ ] **Step 1: 建 5 个 module 目录结构**

```bash
for mod in guwu jian xiuxin shenghuo personal; do
  mkdir -p "src/modules/${mod}/pages" \
           "src/modules/${mod}/logic" \
           "src/modules/${mod}/components/charts"
done
# jian 多一个 components 目录装 BodyMap
mkdir -p src/modules/jian/components
ls src/modules/ 2>&1
```

预期：5 个新 module + mingli + zhanbu = 7 个

---

### Task 2: git mv 21 个 page

- [ ] **Step 1: 21 个 git mv**

```bash
guwu_pages=(mianxiang shouxiang fenglui mingji)
jian_pages=(qijing ziwu wufu yangsheng)
xiuxin_pages=(zhan fangqi shijian dayun checkin)
shenghuo_pages=(huangli jiri yunshi jiazu poster)
personal_pages=(profile dashboard users)

for f in "${guwu_pages[@]}" "${jian_pages[@]}" "${xiuxin_pages[@]}" \
         "${shenghuo_pages[@]}" "${personal_pages[@]}"; do
  # 找 module 归属
  if [[ " ${guwu_pages[*]} " =~ " ${f} " ]]; then mod=guwu
  elif [[ " ${jian_pages[*]} " =~ " ${f} " ]]; then mod=jian
  elif [[ " ${xiuxin_pages[*]} " =~ " ${f} " ]]; then mod=xiuxin
  elif [[ " ${shenghuo_pages[*]} " =~ " ${f} " ]]; then mod=shenghuo
  else mod=personal
  fi
  git mv "src/pages/${f}/${f}.vue" "src/modules/${mod}/pages/${f}.vue"
done
git status --short 2>&1 | grep -E "modules/(guwu|jian|xiuxin|shenghuo|personal)" | head -25
```

预期：21 行 `R`

- [ ] **Step 2: 清理空 pages 目录**

```bash
all_pages=("${guwu_pages[@]}" "${jian_pages[@]}" "${xiuxin_pages[@]}" "${shenghuo_pages[@]}" "${personal_pages[@]}")
for f in "${all_pages[@]}"; do
  rmdir "src/pages/${f}" 2>/dev/null
done
ls src/pages/ | wc -l
```

预期：src/pages/ 剩 ~3 个目录（category/index/settings/）

---

### Task 3: git mv 14 个 logic

**Files:**

- guwu (4): mianxiang.ts/shouxiang.ts/fenglui.ts/mingji.ts
- jian (3): jingluo.ts (qijing+ziwu 共用) / wufu.ts / jieqi.ts (yangsheng 用)
- xiuxin (2): zhenci.ts (shijian) / dayun-life.ts (dayun)
- shenghuo (5): huangli.ts/jiri.ts/yunshi.ts/jiazu.ts/poster-renderer.ts
- personal: 0

- [ ] **Step 1: 14 个 git mv**

```bash
guwu_logic=(mianxiang shouxiang fenglui mingji)
jian_logic=(jingluo wufu jieqi)
xiuxin_logic=(zhenci dayun-life)
shenghuo_logic=(huangli jiri yunshi jiazu poster-renderer)

for f in "${guwu_logic[@]}"; do
  git mv "src/utils/${f}.ts" "src/modules/guwu/logic/${f}.ts"
done
for f in "${jian_logic[@]}"; do
  git mv "src/utils/${f}.ts" "src/modules/jian/logic/${f}.ts"
done
for f in "${xiuxin_logic[@]}"; do
  git mv "src/utils/${f}.ts" "src/modules/xiuxin/logic/${f}.ts"
done
for f in "${shenghuo_logic[@]}"; do
  git mv "src/utils/${f}.ts" "src/modules/shenghuo/logic/${f}.ts"
done

git status --short 2>&1 | grep -E "modules/(guwu|jian|xiuxin|shenghuo)/logic" | head -20
```

预期：14 行 `R`

- [ ] **Step 2: 检查 jingluo.ts 是否有 cross-dep**

读 `src/modules/jian/logic/jingluo.ts`，看是否 import 跨模块 logic。如果有，记录。

---

### Task 4: git mv 7 个 chart

**Files:**

- guwu (4): MianXiangChart/ShouXiangChart/FengLuiChart/MingJiChart
- jian (1): ZiWuLiuZhuChart (qijing+ziwu 共用)
- shenghuo (2): JiRiChart/JiaPuChart

- [ ] **Step 1: 7 个 git mv**

```bash
guwu_charts=(MianXiangChart ShouXiangChart FengLuiChart MingJiChart)
jian_charts=(ZiWuLiuZhuChart)
shenghuo_charts=(JiRiChart JiaPuChart)

for f in "${guwu_charts[@]}"; do
  git mv "src/components/charts/${f}.vue" "src/modules/guwu/components/charts/${f}.vue"
done
git mv "src/components/charts/ZiWuLiuZhuChart.vue" "src/modules/jian/components/charts/ZiWuLiuZhuChart.vue"
for f in "${shenghuo_charts[@]}"; do
  git mv "src/components/charts/${f}.vue" "src/modules/shenghuo/components/charts/${f}.vue"
done
git status --short 2>&1 | grep -E "components/charts" | head -10
```

预期：7 行 `R`

---

### Task 5: BodyMap 移到 jian

**Files:**

- Move: `src/components/ui/BodyMap.vue` → `src/modules/jian/components/BodyMap.vue`

- [ ] **Step 1: git mv BodyMap**

```bash
git mv src/components/ui/BodyMap.vue src/modules/jian/components/BodyMap.vue
ls src/components/ui/ 2>&1
```

预期：`src/components/ui/` 现在空了（git 不跟踪空目录），BodyMap 移到 jian

---

### Task 6: 改 pages.json 21 处路径

- [ ] **Step 1: 改 21 处路径**

```bash
python3 << 'PY'
from pathlib import Path
p = Path("src/pages.json")
s = p.read_text(encoding="utf-8")

mapping = {
    # guwu
    'mianxiang': 'guwu', 'shouxiang': 'guwu', 'fenglui': 'guwu', 'mingji': 'guwu',
    # jian
    'qijing': 'jian', 'ziwu': 'jian', 'wufu': 'jian', 'yangsheng': 'jian',
    # xiuxin
    'zhan': 'xiuxin', 'fangqi': 'xiuxin', 'shijian': 'xiuxin', 'dayun': 'xiuxin', 'checkin': 'xiuxin',
    # shenghuo
    'huangli': 'shenghuo', 'jiri': 'shenghuo', 'yunshi': 'shenghuo', 'jiazu': 'shenghuo', 'poster': 'shenghuo',
    # personal
    'profile': 'personal', 'dashboard': 'personal', 'users': 'personal',
}

for name, mod in mapping.items():
    old = f'"path": "pages/{name}/{name}"'
    new = f'"path": "modules/{mod}/pages/{name}"'
    if old in s:
        s = s.replace(old, new)
        print(f"  {name:10s} → {mod}")
    else:
        print(f"  {name:10s} NOT FOUND")

p.write_text(s, encoding="utf-8")
PY
```

预期：21 行 fixed

---

### Task 7: 批量改 imports（含 BodyMap 路径）

- [ ] **Step 1: 批量改 imports**

```bash
python3 << 'PY'
from pathlib import Path
import re

# 21 logic
logic_map = {
    'mianxiang': 'guwu', 'shouxiang': 'guwu', 'fenglui': 'guwu', 'mingji': 'guwu',
    'jingluo': 'jian', 'wufu': 'jian', 'jieqi': 'jian',
    'zhenci': 'xiuxin', 'dayun-life': 'xiuxin',
    'huangli': 'shenghuo', 'jiri': 'shenghuo', 'yunshi': 'shenghuo',
    'jiazu': 'shenghuo', 'poster-renderer': 'shenghuo',
}

# 7 chart
chart_map = {
    'MianXiangChart': 'guwu', 'ShouXiangChart': 'guwu', 'FengLuiChart': 'guwu', 'MingJiChart': 'guwu',
    'ZiWuLiuZhuChart': 'jian',
    'JiRiChart': 'shenghuo', 'JiaPuChart': 'shenghuo',
}

files = list(Path("src").rglob("*.vue")) + list(Path("src").rglob("*.ts"))
changed = 0
for fp in files:
    s = fp.read_text(encoding="utf-8")
    new = s
    # alias 引用
    for n, mod in logic_map.items():
        new = new.replace(f"@/utils/{n}", f"@/modules/{mod}/logic/{n}")
        new = re.sub(rf"from\s+['\"]\.+/{n}['\"]", f"from '@/modules/{mod}/logic/{n}'", new)
        new = re.sub(rf"import\s+['\"]\.+/{n}['\"]", f"import '@/modules/{mod}/logic/{n}'", new)
    for n, mod in chart_map.items():
        new = new.replace(f"@/components/charts/{n}", f"@/modules/{mod}/components/charts/{n}")
    # BodyMap 移到 jian
    new = new.replace("@/components/ui/BodyMap", "@/modules/jian/components/BodyMap")
    new = new.replace("'../../components/ui/BodyMap", "'@/modules/jian/components/BodyMap")
    if new != s:
        fp.write_text(new, encoding="utf-8")
        changed += 1
print(f"imports: {changed} files")
PY
```

预期：~30+ 文件 modified

---

### Task 8: 验证 + commit

- [ ] **Step 1: type-check / test / build**

```bash
pnpm type-check && pnpm test && pnpm build:h5
```

预期：全绿

- [ ] **Step 2: commit**

```bash
git add -A
git -c user.email="claude@anthropic.com" -c user.name="MISTVERSE Dev" commit -m "$(cat <<'EOF'
refactor: SP-5 迁移 5 个 module 完成 v1.1.0 模块化

按 tools.ts 分类完成 5 个 module 迁移:

guwu (4): mianxiang/shouxiang/fenglui/mingji + 4 chart (MianXiang/ShouXiang/
  FengLui/MingJi)
jian (4): qijing/ziwu/wufu/yangsheng + ZiWuLiuZhuChart + BodyMap 移入
  (BodyMap 从 src/components/ui/ 迁来, jiankang 模块专用)
xiuxin (5): zhan/fangqi/shijian/dayun/checkin (dayun-life 移入)
shenghuo (5): huangli/jiri/yunshi/jiazu/poster + JiRiChart/JiaPuChart
personal (3): profile/dashboard/users (无 logic/chart)

pages.json: 21 处 path 改 pages/X/X → modules/{module}/pages/X
~30 个 import 路径批量改: @/utils/{X} → @/modules/{module}/logic/{X}
                            @/components/charts/{X} → @/modules/{module}/components/charts/{X}
                            @/components/ui/BodyMap → @/modules/jian/components/BodyMap
相对 import './mianxiang' 等 → 别名路径

至此 src/modules/ 包含 7 个 module (mingli/zhanbu/guwu/jian/xiuxin/
shenghuo/personal),扁平 src/pages/ 剩 category/index/settings 3 个
框架级页 + src/components/ 剩 charts/ 17 个未归属 (留 SP-6+ 处理或
维持 shared)。

type-check 0 错 / test 26-26 / build:h5 通过
EOF
)"
```

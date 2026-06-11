#!/usr/bin/env python3
"""SP-10 BUG #1 batch fix: rewrite stale /pages/<tool>/<tool> paths
to /modules/<area>/pages/<tool> in .vue and .ts files under src/.

Excludes:
  - src/pages.json (routes are correct, only 3 framework pages remain)
  - docs/ (documentation, no runtime impact)
"""
from pathlib import Path

ROOT = Path("/workspace/src")

# (old, new) — order matters: longest first to avoid prefix overlap
PATH_MAP: list[tuple[str, str]] = [
    # mingli (10)
    ("/pages/maya/maya", "/modules/mingli/pages/maya"),
    ("/pages/astro/astro", "/modules/mingli/pages/astro"),
    ("/pages/xuankong/xuankong", "/modules/mingli/pages/xuankong"),
    ("/pages/ziwei/ziwei", "/modules/mingli/pages/ziwei"),
    ("/pages/liunian/liunian", "/modules/mingli/pages/liunian"),
    ("/pages/hehun/hehun", "/modules/mingli/pages/hehun"),
    ("/pages/wuxing/wuxing", "/modules/mingli/pages/wuxing"),
    ("/pages/bazi/bazi", "/modules/mingli/pages/bazi"),
    ("/pages/life/life", "/modules/mingli/pages/life"),
    # zhanbu (12)
    ("/pages/xiaoliuren/xiaoliuren", "/modules/zhanbu/pages/xiaoliuren"),
    ("/pages/jiaobei/jiaobei", "/modules/zhanbu/pages/jiaobei"),
    ("/pages/lingqian/lingqian", "/modules/zhanbu/pages/lingqian"),
    ("/pages/shuzhi/shuzhi", "/modules/zhanbu/pages/shuzhi"),
    ("/pages/zhuge/zhuge", "/modules/zhanbu/pages/zhuge"),
    ("/pages/tieban/tieban", "/modules/zhanbu/pages/tieban"),
    ("/pages/meihua/meihua", "/modules/zhanbu/pages/meihua"),
    ("/pages/liuyao/liuyao", "/modules/zhanbu/pages/liuyao"),
    ("/pages/liuren/liuren", "/modules/zhanbu/pages/liuren"),
    ("/pages/qimen/qimen", "/modules/zhanbu/pages/qimen"),
    ("/pages/tarot/tarot", "/modules/zhanbu/pages/tarot"),
    ("/pages/gua/interpret", "/modules/zhanbu/pages/interpret"),
    ("/pages/gua/gua", "/modules/zhanbu/pages/gua"),
    # guwu (4)
    ("/pages/mianxiang/mianxiang", "/modules/guwu/pages/mianxiang"),
    ("/pages/shouxiang/shouxiang", "/modules/guwu/pages/shouxiang"),
    ("/pages/fenglui/fenglui", "/modules/guwu/pages/fenglui"),
    ("/pages/mingji/mingji", "/modules/guwu/pages/mingji"),
    # jian (4)
    ("/pages/yangsheng/yangsheng", "/modules/jian/pages/yangsheng"),
    ("/pages/qijing/qijing", "/modules/jian/pages/qijing"),
    ("/pages/ziwu/ziwu", "/modules/jian/pages/ziwu"),
    ("/pages/wufu/wufu", "/modules/jian/pages/wufu"),
    # xiuxin (5)
    ("/pages/shijian/shijian", "/modules/xiuxin/pages/shijian"),
    ("/pages/fangqi/fangqi", "/modules/xiuxin/pages/fangqi"),
    ("/pages/checkin/checkin", "/modules/xiuxin/pages/checkin"),
    ("/pages/dayun/dayun", "/modules/xiuxin/pages/dayun"),
    ("/pages/zhan/zhan", "/modules/xiuxin/pages/zhan"),
    # shenghuo (5)
    ("/pages/huangli/huangli", "/modules/shenghuo/pages/huangli"),
    ("/pages/yunshi/yunshi", "/modules/shenghuo/pages/yunshi"),
    ("/pages/jiazu/jiazu", "/modules/shenghuo/pages/jiazu"),
    ("/pages/jiri/jiri", "/modules/shenghuo/pages/jiri"),
    ("/pages/poster/poster", "/modules/shenghuo/pages/poster"),
    # personal (3)
    ("/pages/profile/profile", "/modules/personal/pages/profile"),
    ("/pages/dashboard/dashboard", "/modules/personal/pages/dashboard"),
    ("/pages/users/users", "/modules/personal/pages/users"),
]
# Sort by length desc — longest first
PATH_MAP.sort(key=lambda kv: -len(kv[0]))

SKIP_FILES = {Path("/workspace/src/pages.json")}

changed: list[Path] = []
total_subs = 0

for path in sorted(ROOT.rglob("*")):
    if not path.is_file():
        continue
    if path in SKIP_FILES:
        continue
    if path.suffix not in {".vue", ".ts", ".tsx", ".js", ".mjs"}:
        continue
    try:
        original = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        continue
    text = original
    n = 0
    for old, new in PATH_MAP:
        if old in text:
            c = text.count(old)
            text = text.replace(old, new)
            n += c
    if n:
        path.write_text(text, encoding="utf-8")
        changed.append(path)
        total_subs += n
        print(f"  {path.relative_to(ROOT.parent)}: {n} substitutions")

print(f"\nTotal: {total_subs} substitutions across {len(changed)} files")

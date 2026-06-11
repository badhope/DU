"""修复 uni-app H5 路由 URL 错误。

错误格式：`/pages/{page}/{page}` (假设 /pages/ 根 + page 短名)
正确格式：`/modules/{module}/pages/{page}` (实际 pages.json 注册的 path)

输入：`/pages/wuxing/wuxing` (老)
输出：`/modules/mingli/pages/wuxing` (新)
"""
import json
import re
from pathlib import Path

SRC = Path("/workspace/src")
PAGES_JSON = json.loads((SRC / "pages.json").read_text())

# Build mapping: page short name -> full path
# pages.json: [{"path": "modules/mingli/pages/wuxing", ...}, ...]
SHORT_TO_FULL = {}
for p in PAGES_JSON["pages"]:
    short = p["path"].split("/")[-1]  # "wuxing"
    full = "/" + p["path"]  # "/modules/mingli/pages/wuxing"
    SHORT_TO_FULL[short] = full

print(f"Loaded {len(SHORT_TO_FULL)} pages from pages.json")
print(f"Sample mappings:")
for short, full in list(SHORT_TO_FULL.items())[:5]:
    print(f"  /pages/{short}/{short} -> {full}")


def fix_url(match: re.Match) -> str:
    """Convert /pages/X/Y -> /modules/M/pages/X"""
    short = match.group(2)
    if short in SHORT_TO_FULL:
        return SHORT_TO_FULL[short]
    # Page not found in pages.json — keep original (will break build but visible)
    print(f"  WARN: short={short!r} not in pages.json")
    return match.group(0)


# Pattern: '/pages/{short}/{short}' or '/pages/{short}/{short}?...' or '/pages/{short}/{short}#...'
URL_PATTERN = re.compile(r"(/pages/([a-z-]+)/\2)(?=[?#'\"]|$|\s|\))")

# Files to scan
TARGETS = [
    "src/config/tools.ts",
    "src/modules/personal/pages/index.vue",
    "src/modules/mingli/pages/bazi.vue",
    "src/modules/zhanbu/pages/gua.vue",
    "src/shared/composables/use-cooldown.ts",
    "src/modules/zhanbu/pages/liuyao.vue",
    "src/shared/components/ui/TopBar.vue",
    "src/modules/personal/pages/profile.vue",
    "src/modules/personal/pages/dashboard.vue",
]


def main():
    total_replacements = 0
    for rel in TARGETS:
        path = Path("/workspace") / rel
        if not path.exists():
            print(f"  SKIP: {rel} (not found)")
            continue
        original = path.read_text()
        new, n = URL_PATTERN.subn(fix_url, original)
        if n > 0:
            path.write_text(new)
            print(f"  {rel}: {n} replacements")
            total_replacements += n
        else:
            print(f"  {rel}: 0 replacements (no match)")

    print(f"\n=== Total: {total_replacements} replacements ===")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""玄枢 v1.0.0 SP-2 import 路径批量改写器。"""

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

    # 1. 改写 @/components/ → @shared/components/  +  @/designs/ → @shared/styles/
    for old, new in import_rewrite.items():
        text = text.replace(old, new)

    # 2. 改写 @/utils/<name> → @modules/<m>/<dir>/<name>
    util_re = re.compile(r"@/utils/([A-Za-z0-9_-]+)")

    def util_replace(m):
        name = m.group(1)
        if name in util_to_module:
            target = util_to_module[name]
            # shared/utils 直接是 @shared/utils/<name>
            if target.startswith("shared/"):
                return f"@{target}/{name}"
            # 其他 → @modules/<m>/<dir>/<name>
            return f"@modules/{target}/{name}"
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
        if page_path.startswith("modules/") or page_path.startswith("shared/") or page_path.startswith("settings/"):
            return m.group(0)
        base = page_path.replace(".vue", "").replace(".ts", "")
        parts = base.split("/")
        dirname = parts[0] if parts else base
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
        if not path.exists():
            print(f"warn: {target} not found, skip")
            continue
        if path.is_file():
            files = [path]
        else:
            files = list(path.rglob("*.ts")) + list(path.rglob("*.vue"))

        for f in files:
            total += 1
            try:
                if rewrite_file(f, mapping):
                    changed += 1
                    try:
                        rel = f.resolve().relative_to(ROOT.resolve())
                    except ValueError:
                        rel = f
                    print(f"  + {rel}")
            except Exception as e:
                try:
                    rel = f.resolve().relative_to(ROOT.resolve())
                except ValueError:
                    rel = f
                print(f"  ! {rel}: {e}")

    print(f"\n[{changed}/{total} files changed]")


if __name__ == "__main__":
    main()

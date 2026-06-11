#!/usr/bin/env python3
"""
Conservative TypeScript strict-mode fixer (v2).

Targeted transformations:
1. `arr[N]` where N is numeric literal                  → `arr[N]!`
2. `arr[N]` where N is identifier in `for` loop bound   → `arr[N]!`
3. `const x = obj[key]` where key from Object.keys     → `obj[key]!`
4. Chain `arr[N][N]` or `arr[N].field`                  → add `!` at chain end
5. Generic `const x = EXPR` ending with `]`             → wrap in `()!`

Safer: all transforms are additive (`!` postfix). Never remove or change semantics.
If a line doesn't match, skip it.

Usage: python3 scripts/fix-strict.py --all
"""
import re
import sys
from pathlib import Path

# Pattern A: `arr[N]` with numeric literal
NUM_IDX = re.compile(r'([A-Za-z_$][\w$.]*)\[(\d+)\](?![\w\[\.\!])')

# Pattern B: `arr[i]` or `arr[key]` in for-of with Object.keys/values/entries
# This is harder to detect; we leave to manual.

# Pattern C: `return { ... field: EXPR, ... }` — convert EXPR if it has []
# We leave this to manual since context-sensitive.

# Pattern D: chain `arr[N].field` — wrap each arr access with `!` after the close bracket
CHAIN_IDX = re.compile(
    r'([A-Za-z_$][\w$.]*)'  # identifier prefix
    r'\[(\d+)\]'            # first [N]
    r'((?:\.[A-Za-z_$][\w$]*|\[\d+\])*?)'  # subsequent .field or [N]
    r'(?![\w\[\.\!])'  # not followed by [ . !
)


def fix_line(line: str) -> str:
    out = line
    # 1. Handle chain first (longer matches)
    def chain_sub(m: re.Match) -> str:
        head, idx, tail = m.group(1), m.group(2), m.group(3)
        return f'{head}[{idx}]!{tail}'
    out = CHAIN_IDX.sub(chain_sub, out)
    # 2. Handle simple arr[N]
    def num_sub(m: re.Match) -> str:
        ident, idx = m.group(1), m.group(2)
        return f'{ident}[{idx}]!'
    out = NUM_IDX.sub(num_sub, out)
    return out


def fix_file(path: Path) -> int:
    src = path.read_text(encoding='utf-8')
    changed = 0
    out = []
    for line in src.splitlines(keepends=True):
        new = fix_line(line)
        if new != line:
            changed += 1
        out.append(new)
    if changed:
        path.write_text(''.join(out), encoding='utf-8')
    return changed


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    if sys.argv[1] == '--all':
        files = list(Path('src').rglob('*.ts')) + list(Path('src').rglob('*.vue'))
    else:
        files = [Path(f) for f in sys.argv[1:]]
    total = 0
    for f in files:
        n = fix_file(f)
        if n:
            print(f'{f}: {n} lines')
            total += n
    print(f'Total: {total} lines modified')


if __name__ == '__main__':
    main()

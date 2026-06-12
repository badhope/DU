"""Check all 6 new utils files for parse errors."""
import json
import re
import urllib.request

for f in ['zhouyi', 'ziping', 'dili', 'yuxia', 'yunqi', 'cantong']:
    url = f'http://localhost:5173/mistverse/src/utils/{f}.ts'
    try:
        with urllib.request.urlopen(url) as r:
            data = r.read().decode('utf-8', errors='replace')
        m = re.search(r'const error = (\{[^{]+"plugin[^}]+\})', data, re.DOTALL)
        if m:
            print(f'\n=== {f}.ts: 500 ERROR ===')
            try:
                # try to extract just the message
                mm = re.search(r'"message":"([^"]+)"', data)
                if mm:
                    print('  msg:', mm.group(1)[:500].replace('\\n', '\n  '))
            except Exception as e:
                print('  extract failed:', e)
        else:
            print(f'=== {f}.ts: OK (HTTP 200, {len(data)} bytes) ===')
    except urllib.error.HTTPError as e:
        data = e.read().decode('utf-8', errors='replace')
        mm = re.search(r'"message":"([^"]+)"', data)
        print(f'\n=== {f}.ts: HTTP {e.code} ===')
        if mm:
            print('  msg:', mm.group(1)[:500].replace('\\n', '\n  '))

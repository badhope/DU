"""Comprehensive dogfood explorer for mistverse SPA."""
import os
import time
import json
import re
from pathlib import Path
from playwright.sync_api import sync_playwright, ConsoleMessage, Page, BrowserContext

OUT = Path('/workspace/dogfood-output')
SHOTS = OUT / 'screenshots'
CHROME = '/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome'

console_log: list[dict] = []
errors_log: list[dict] = []


def on_console(msg: ConsoleMessage) -> None:
    console_log.append({'type': msg.type, 'text': msg.text, 'location': str(msg.location)})
    if msg.type == 'error':
        errors_log.append(console_log[-1])


def on_pageerror(err) -> None:
    errors_log.append({'type': 'pageerror', 'text': str(err)})


def shot(page: Page, name: str, full_page: bool = True) -> str:
    path = SHOTS / f'{name}.png'
    page.screenshot(path=str(path), full_page=full_page, animations='disabled')
    return str(path)


def goto(page: Page, hash_path: str, name: str, settle: float = 1.5) -> dict:
    """Navigate via hash and capture state."""
    page.goto(f'http://localhost:5173/mistverse/#{hash_path}',
              wait_until='domcontentloaded', timeout=20000)
    page.wait_for_load_state('networkidle', timeout=10000)
    time.sleep(settle)
    info = {
        'name': name,
        'url': page.url,
        'title': page.title(),
        'body': page.evaluate("() => document.body ? document.body.innerText.substring(0, 800) : ''"),
        'has_uni_page': page.evaluate("() => !!document.querySelector('.uni-page, [data-page], uni-page')"),
        'errors_so_far': list(errors_log),
    }
    shot(page, f'10-{name}')
    return info


def try_click_text(page: Page, text: str, label: str) -> bool:
    """Try clicking element with given text. Returns success."""
    # Many possible selectors
    selectors = [
        f'text="{text}"',
        f'text={text}',
        f':text-is("{text}")',
        f'button:has-text("{text}")',
        f'a:has-text("{text}")',
        f'.tool-item:has-text("{text}")',
        f'.card:has-text("{text}")',
    ]
    for sel in selectors:
        try:
            loc = page.locator(sel).first
            if loc.count() > 0:
                loc.click(timeout=2000)
                time.sleep(1.5)
                print(f'  ✓ clicked "{label}" via {sel}')
                return True
        except Exception:
            continue
    print(f'  ✗ could not find clickable "{label}"')
    return False


def main():
    summary: list[dict] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            executable_path=CHROME,
            args=['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
        )
        ctx = browser.new_context(
            viewport={'width': 390, 'height': 844},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
        )
        page = ctx.new_page()
        page.on('console', on_console)
        page.on('pageerror', on_pageerror)

        # 1. Home
        page.goto('http://localhost:5173/mistverse/', wait_until='domcontentloaded', timeout=20000)
        page.wait_for_load_state('networkidle', timeout=10000)
        time.sleep(2.0)
        shot(page, '00-home', full_page=True)
        print('=== HOME loaded ===')
        print('URL:', page.url)

        # 2. Try each category (FATE=命理, DIVINATION=占卜, ARTS=古物, WELLNESS=健康, CULTIVATION=修心, LIFE=生活)
        categories = [
            ('命理', 'FATE', '/pages/category/category?cat=fate'),
            ('占卜', 'DIVINATION', '/pages/category/category?cat=divination'),
            ('古物', 'ARTS', '/pages/category/category?cat=arts'),
            ('健康', 'WELLNESS', '/pages/category/category?cat=wellness'),
            ('修心', 'CULTIVATION', '/pages/category/category?cat=cultivation'),
            ('生活', 'LIFE', '/pages/category/category?cat=life'),
        ]
        # Note: UniApp H5 may use different route - try hash first
        for label, slug, route in categories:
            print(f'\n=== CATEGORY {label} ===')
            try:
                info = goto(page, f'/pages/category/category?cat={slug}', f'cat-{slug}')
                print(' url:', info['url'])
                print(' body:', info['body'][:300].replace('\n', '|'))
                summary.append(info)
            except Exception as e:
                print(f'  EXCEPTION: {e}')

        # 3. The 6 new high-end tools
        new_tools = [
            ('周易本义', 'zhouyi', 'zhouyi-form'),
            ('子平真诠', 'ziping', 'ziping-form'),
            ('地理五诀', 'dili', 'dili-form'),
            ('玉匣记', 'yuxia', 'yuxia-form'),
            ('运气七篇', 'yunqi', 'yunqi-form'),
            ('参同契', 'cantong', 'cantong-form'),
        ]
        for label, slug, btn_hint in new_tools:
            print(f'\n=== TOOL {label} ===')
            try:
                info = goto(page, f'/pages/{slug}/{slug}', f'tool-{slug}', settle=2.0)
                print(' url:', info['url'])
                print(' body:', info['body'][:400].replace('\n', '|'))
                # Try to find a button to start analysis
                time.sleep(1.0)
                # Look for "起卦" / "排盘" / "开始" / "起课" / "起名" etc.
                start_btns = ['起卦', '排盘', '开始', '起课', '起名', '测算', '排盘', '分析', '起盘', '论命', '参究']
                for b in start_btns:
                    if try_click_text(page, b, b):
                        time.sleep(2.0)
                        shot(page, f'20-tool-{slug}-after-click')
                        # Check if state changed
                        new_body = page.evaluate("() => document.body ? document.body.innerText.substring(0, 400) : ''")
                        print(f'   after click body: {new_body[:200].replace(chr(10), "|")}')
                        break
                summary.append(info)
            except Exception as e:
                print(f'  EXCEPTION: {e}')
                summary.append({'name': slug, 'error': str(e)})

        # 4. Save report
        (OUT / 'explore-summary.json').write_text(
            json.dumps({
                'console_errors': errors_log[:200],
                'console_log_count': len(console_log),
                'pages': summary,
            }, ensure_ascii=False, indent=2),
            encoding='utf-8',
        )
        print('\n=== TOTAL CONSOLE ERRORS:', len(errors_log))
        for e in errors_log[:30]:
            print(' -', e.get('type'), e.get('text', '')[:200])
        browser.close()


if __name__ == '__main__':
    main()

"""Click-through test: home → category → tool → fill form → submit."""
import os
import time
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, ConsoleMessage, Page

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


def main():
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
        shot(page, '30-home')
        print('=== HOME loaded ===')

        # 2. Click 命理
        page.locator('text=命理').first.click()
        time.sleep(2.5)
        shot(page, '31-cat-mingli')
        print('=== clicked 命理, url:', page.url)
        body = page.evaluate("() => document.body.innerText.substring(0, 1500)")
        print('mingli body[:500]:', body[:500].replace('\n', '|'))

        # 3. Click 周易本义 in the category list
        # First let's see if it's in the list
        if '周易本义' in body:
            print('Found 周易本义 in category list')
            # Scroll to it if needed
            try:
                page.locator('text=周易本义').first.scroll_into_view_if_needed(timeout=2000)
            except Exception:
                pass
            time.sleep(1.0)
            try:
                page.locator('text=周易本义').first.click(timeout=3000)
                time.sleep(3.0)
                print('clicked 周易本义, url:', page.url)
                shot(page, '32-zhouyi-after-click')
                body2 = page.evaluate("() => document.body.innerText.substring(0, 1500)")
                print('zhouyi body[:800]:', body2[:800].replace('\n', '|'))
                # Check for "The connection timed out"
                if 'connection timed out' in body2.lower() or 'connection timed out' in body2:
                    print('  ❌  CONNECTION TIMEOUT in 周易本义!')
            except Exception as e:
                print(f'  ✗ click failed: {e}')

        # 4. Back to home, click 占卜
        page.goto('http://localhost:5173/mistverse/', wait_until='domcontentloaded', timeout=20000)
        page.wait_for_load_state('networkidle', timeout=10000)
        time.sleep(2.0)
        page.locator('text=占卜').first.click()
        time.sleep(2.5)
        shot(page, '33-cat-zhongshu')
        print('=== clicked 占卜, url:', page.url)
        body = page.evaluate("() => document.body.innerText.substring(0, 2000)")
        print('zhongshu body[:500]:', body[:500].replace('\n', '|'))
        # Check 玄枢易盘 / 梅花易数 / 周易本义
        for tool_text in ['玄枢易盘', '梅花易数', '灵签抽签', '塔罗占卜', '每日一卦', '数字能量', '杯筊问事']:
            if tool_text in body:
                print(f'  - found "{tool_text}" in 占卜 list')

        # 5. Check console errors
        print('\n=== ERRORS:', len(errors_log))
        for e in errors_log[:30]:
            print(' -', e.get('type'), e.get('text', '')[:200])

        browser.close()


if __name__ == '__main__':
    main()

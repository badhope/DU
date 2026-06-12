"""Test if forcing click on Ziwei works (and compare to other tools that may also be blocked)."""
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
    console_log.append({'type': msg.type, 'text': msg.text})


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

        # Test Ziwei with force click and waiting
        page.goto('http://localhost:5173/mistverse/#/pages/ziwei/ziwei', wait_until='domcontentloaded')
        time.sleep(2.5)
        shot(page, '90-ziwei-initial')
        print('=== Ziwei initial ===')
        mask = page.locator('.loading-mask').count()
        print(f'  loading-mask count: {mask}')

        # Force click on submit
        try:
            page.locator('text=开 始 排 盘').first.click(force=True, timeout=5000)
            print('  force-clicked 开 始 排 盘')
        except Exception as e:
            print(f'  click failed: {e}')
        time.sleep(3.0)
        shot(page, '91-ziwei-3s')
        body = page.evaluate("() => document.body.innerText.substring(0, 1000)")
        print(f'  after 3s body[:300]: {body[:300].replace(chr(10), "|")}')
        # Check mask
        mask_visible = page.evaluate("""
        () => {
          const m = document.querySelector('.loading-mask');
          if (!m) return 'no mask';
          const r = m.getBoundingClientRect();
          return { display: getComputedStyle(m).display, w: r.width, h: r.height, z: getComputedStyle(m).zIndex };
        }
        """)
        print(f'  mask: {mask_visible}')

        time.sleep(3.0)
        shot(page, '92-ziwei-6s')
        body = page.evaluate("() => document.body.innerText.substring(0, 1000)")
        print(f'\n  after 6s body[:400]: {body[:400].replace(chr(10), "|")}')

        # Test 2: bazi
        page.goto('http://localhost:5173/mistverse/#/pages/bazi/bazi', wait_until='domcontentloaded')
        time.sleep(2.5)
        shot(page, '93-bazi-initial')
        body = page.evaluate("() => document.body.innerText.substring(0, 1000)")
        print(f'\n=== Bazi initial body[:400] ===')
        print(body[:400].replace('\n', '|'))
        mask = page.locator('.loading-mask').count()
        print(f'  loading-mask count: {mask}')
        # Try force click
        try:
            page.locator('text=开 始 排 盘').first.click(force=True, timeout=3000)
            time.sleep(3.0)
            shot(page, '94-bazi-after-click')
            body2 = page.evaluate("() => document.body.innerText.substring(0, 1500)")
            print(f'\n=== Bazi after 3s body[:600] ===')
            print(body2[:600].replace('\n', '|'))
        except Exception as e:
            print(f'  bazi click failed: {e}')

        # Test 3: xiaoliuren
        page.goto('http://localhost:5173/mistverse/#/pages/xiaoliuren/xiaoliuren', wait_until='domcontentloaded')
        time.sleep(2.5)
        shot(page, '95-xiaoliuren-initial')
        body = page.evaluate("() => document.body.innerText.substring(0, 1000)")
        print(f'\n=== Xiaoliuren initial body[:400] ===')
        print(body[:400].replace('\n', '|'))
        mask = page.locator('.loading-mask').count()
        print(f'  loading-mask count: {mask}')

        browser.close()


if __name__ == '__main__':
    main()

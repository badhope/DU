"""Test yunqi, yuxia, and check other key features like history, poster, etc."""
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
network_log: list[dict] = []


def on_console(msg: ConsoleMessage) -> None:
    console_log.append({'type': msg.type, 'text': msg.text, 'location': str(msg.location)})
    if msg.type == 'error':
        errors_log.append(console_log[-1])


def on_pageerror(err) -> None:
    errors_log.append({'type': 'pageerror', 'text': str(err)})


def on_response(response):
    if response.status >= 400:
        network_log.append({
            'status': response.status,
            'url': response.url[:200],
        })


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
        page.on('response', on_response)

        # Test 1: yunqi (运气七篇) — 生活 category
        page.goto('http://localhost:5173/mistverse/', wait_until='domcontentloaded', timeout=20000)
        page.wait_for_load_state('networkidle', timeout=10000)
        time.sleep(1.5)
        # Find yunqi (likely in 生活)
        page.locator('text=生活').first.click()
        time.sleep(2.5)
        body_cat = page.evaluate("() => document.body.innerText.substring(0, 2000)")
        print('=== LIFE category body[:500] ===')
        print(body_cat[:500].replace('\n', '|'))
        # Look for yunqi - or go directly to the page
        # 运气七篇 is in 修心 actually
        if '运气七篇' in body_cat:
            print('运气七篇 in 生活')
        else:
            print('运气七篇 NOT in 生活, check 修心')
            page.goto('http://localhost:5173/mistverse/#/pages/category/category?cat=xiuxin', wait_until='domcontentloaded')
            time.sleep(2.5)
            body_cat = page.evaluate("() => document.body.innerText.substring(0, 2000)")
            print('=== XIUXIN category body[:500] ===')
            print(body_cat[:500].replace('\n', '|'))
        # Navigate to yunqi directly
        page.goto('http://localhost:5173/mistverse/#/pages/yunqi/yunqi', wait_until='domcontentloaded')
        time.sleep(2.5)
        shot(page, '60-yunqi-loaded')
        body = page.evaluate("() => document.body.innerText.substring(0, 1000)")
        print('\n=== YUNQI body[:500] ===')
        print(body[:500].replace('\n', '|'))
        if 'connection timed out' in body.lower():
            print('  ❌ YUNQI LOAD FAILED')
        # Click submit
        for w in ['五运', '六气', '详断']:
            if w in body:
                print(f'  found "{w}"')

        # Test 2: yuxia (玉匣记) — 古物 category
        page.goto('http://localhost:5173/mistverse/#/pages/yuxia/yuxia', wait_until='domcontentloaded')
        time.sleep(2.5)
        shot(page, '61-yuxia-loaded')
        body = page.evaluate("() => document.body.innerText.substring(0, 1500)")
        print('\n=== YUXIA body[:500] ===')
        print(body[:500].replace('\n', '|'))

        # Try filling in the form
        surname = page.locator('input').first
        if surname.count() > 0:
            surname.fill('王')
            time.sleep(0.5)
            given = page.locator('input').nth(1)
            given.fill('浩然')
            time.sleep(0.5)
            shot(page, '62-yuxia-filled')
            # Find submit
            try:
                page.locator('text=八 一 数').first.click()
                time.sleep(2.0)
                shot(page, '63-yuxia-after-submit')
                body2 = page.evaluate("() => document.body.innerText.substring(0, 1500)")
                print('\n=== YUXIA after submit body[:500] ===')
                print(body2[:500].replace('\n', '|'))
            except Exception as e:
                print(f'click failed: {e}')

        # Test 3: Check Ziwei (which showed "玄机推演中 0%" - loading animation)
        page.goto('http://localhost:5173/mistverse/#/pages/ziwei/ziwei', wait_until='domcontentloaded')
        time.sleep(2.0)
        shot(page, '64-ziwei-loaded')
        body = page.evaluate("() => document.body.innerText.substring(0, 1000)")
        print('\n=== ZIWEI body[:500] ===')
        print(body[:500].replace('\n', '|'))

        # Test 4: Check poster page
        page.goto('http://localhost:5173/mistverse/#/pages/poster/poster', wait_until='domcontentloaded')
        time.sleep(2.0)
        shot(page, '65-poster')
        body = page.evaluate("() => document.body.innerText.substring(0, 1000)")
        print('\n=== POSTER body[:500] ===')
        print(body[:500].replace('\n', '|'))

        # Test 5: dashboard page (showing AI/典籍 tile)
        page.goto('http://localhost:5173/mistverse/#/pages/dashboard/dashboard', wait_until='domcontentloaded')
        time.sleep(2.0)
        shot(page, '66-dashboard')
        body = page.evaluate("() => document.body.innerText.substring(0, 1500)")
        print('\n=== DASHBOARD body[:500] ===')
        print(body[:500].replace('\n', '|'))

        # Errors
        print('\n=== ERRORS:', len(errors_log))
        for e in errors_log[:20]:
            print(' -', e.get('type'), e.get('text', '')[:200])
        print('\n=== NETWORK ERRORS:', len(network_log))
        for n in network_log[:20]:
            print(f"  - {n['status']} {n['url'][:100]}")

        browser.close()


if __name__ == '__main__':
    main()

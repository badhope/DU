"""Detailed test of 周易本义 and 地理五诀 with retries."""
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
            'method': response.request.method,
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

        # Navigate home → 占卜 → 周易本义, multiple attempts
        for attempt in range(3):
            page.goto('http://localhost:5173/mistverse/', wait_until='domcontentloaded', timeout=20000)
            page.wait_for_load_state('networkidle', timeout=10000)
            time.sleep(1.5)

            page.locator('text=占卜').first.click()
            time.sleep(2.5)
            page.locator('text=周易本义').first.scroll_into_view_if_needed(timeout=3000)
            time.sleep(0.5)
            page.locator('text=周易本义').first.click()
            time.sleep(4.0)  # give it time to load
            body = page.evaluate("() => document.body.innerText.substring(0, 2000)")
            print(f'\n=== ZHOUYI attempt {attempt+1} ===')
            print('  url:', page.url)
            print(f'  body[:400]: {body[:400].replace(chr(10), "|")}')
            shot(page, f'50-zhouyi-attempt-{attempt+1}')

            if 'connection timed out' in body.lower():
                print('  ❌ ZHOUYI LOAD FAILED: connection timed out')
            elif '周易本义' in body and '时间起卦' in body:
                print('  ✓ ZHOUYI LOADED OK')

        # Now do the same for 地理五诀
        for attempt in range(3):
            page.goto('http://localhost:5173/mistverse/', wait_until='domcontentloaded', timeout=20000)
            page.wait_for_load_state('networkidle', timeout=10000)
            time.sleep(1.5)
            # 地理五诀 is in 古物 (guwu)
            page.locator('text=古物').first.click()
            time.sleep(2.5)
            body_cat = page.evaluate("() => document.body.innerText.substring(0, 3000)")
            print(f'\n=== GUWU attempt {attempt+1} ===')
            print(f'  body[:500]: {body_cat[:500].replace(chr(10), "|")}')
            if '地理五诀' in body_cat:
                page.locator('text=地理五诀').first.scroll_into_view_if_needed(timeout=3000)
                time.sleep(0.5)
                page.locator('text=地理五诀').first.click()
                time.sleep(4.0)
                body = page.evaluate("() => document.body.innerText.substring(0, 2000)")
                print(f'  dili body[:400]: {body[:400].replace(chr(10), "|")}')
                shot(page, f'51-dili-attempt-{attempt+1}')
                if 'connection timed out' in body.lower():
                    print('  ❌ DILI LOAD FAILED: connection timed out')
                elif '地理' in body and '立向' in body:
                    print('  ✓ DILI LOADED OK')
            else:
                print('  ❌ 地理五诀 not found in 古物 list')

        # Show all errors
        print('\n=== ERRORS:', len(errors_log))
        for e in errors_log[:50]:
            print(' -', e.get('type'), e.get('text', '')[:200])

        # Show network errors
        print('\n=== NETWORK ERRORS:', len(network_log))
        for n in network_log[:30]:
            print(f"  - {n['status']} {n['url'][:120]}")

        browser.close()


if __name__ == '__main__':
    main()

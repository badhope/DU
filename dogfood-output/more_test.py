"""Test yunqi submit and 紫微斗数 submit, plus check poster for AI label."""
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

        # Test 1: yunqi - change year to 2025 and click submit
        page.goto('http://localhost:5173/mistverse/#/pages/yunqi/yunqi', wait_until='domcontentloaded')
        time.sleep(2.5)
        shot(page, '70-yunqi-loaded')
        # Check the year controls
        # Look for +/- buttons
        body = page.evaluate("() => document.body.innerText.substring(0, 1500)")
        print('=== YUNQI body[:600] ===')
        print(body[:600].replace('\n', '|'))
        # Find clickable
        # Click "-" then "详断" button
        try:
            # Click the "详 断" button - has space
            page.locator('text=五 运 · 六 气 · 详 断').first.click()
            time.sleep(2.5)
            shot(page, '71-yunqi-after-click')
            body2 = page.evaluate("() => document.body.innerText.substring(0, 1500)")
            print('\n=== YUNQI after click body[:800] ===')
            print(body2[:800].replace('\n', '|'))
        except Exception as e:
            print(f'yunqi click failed: {e}')

        # Test 2: 紫微斗数 - check if it actually computes
        page.goto('http://localhost:5173/mistverse/#/pages/ziwei/ziwei', wait_until='domcontentloaded')
        time.sleep(2.0)
        shot(page, '72-ziwei-loaded')
        body = page.evaluate("() => document.body.innerText.substring(0, 1000)")
        print('\n=== ZIWEI body[:600] ===')
        print(body[:600].replace('\n', '|'))
        # Click submit and wait
        try:
            page.locator('text=开 始 排 盘').first.click()
            time.sleep(3.0)
            shot(page, '73-ziwei-after-3s')
            body2 = page.evaluate("() => document.body.innerText.substring(0, 1500)")
            print('\n=== ZIWEI after 3s body[:800] ===')
            print(body2[:800].replace('\n', '|'))
            time.sleep(5.0)
            shot(page, '74-ziwei-after-8s')
            body3 = page.evaluate("() => document.body.innerText.substring(0, 1500)")
            print('\n=== ZIWEI after 8s body[:800] ===')
            print(body3[:800].replace('\n', '|'))
        except Exception as e:
            print(f'ziwei click failed: {e}')

        # Test 3: poster - check label
        page.goto('http://localhost:5173/mistverse/#/pages/poster/poster', wait_until='domcontentloaded')
        time.sleep(2.0)
        shot(page, '75-poster')
        body = page.evaluate("() => document.body.innerText.substring(0, 1500)")
        print('\n=== POSTER body[:800] ===')
        print(body[:800].replace('\n', '|'))

        # Test 4: 玉匣记 - fill and click using better selector
        page.goto('http://localhost:5173/mistverse/#/pages/yuxia/yuxia', wait_until='domcontentloaded')
        time.sleep(2.5)
        shot(page, '76-yuxia-loaded')
        # Find inputs
        inputs = page.locator('input.name-input').all()
        print(f'\n=== YUXIA inputs found: {len(inputs)}')
        # Fill inputs - use v-model value via dispatch event
        page.evaluate("""
        () => {
          const inputs = document.querySelectorAll('input.name-input');
          const surname = inputs[0];
          const given = inputs[1];
          // Use property setter to bypass Vue's reactive update quirks
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(surname, '王');
          surname.dispatchEvent(new Event('input', { bubbles: true }));
          nativeInputValueSetter.call(given, '浩然');
          given.dispatchEvent(new Event('input', { bubbles: true }));
          return { s: surname.value, g: given.value };
        }
        """)
        time.sleep(0.5)
        shot(page, '77-yuxia-filled')
        # Check if values are set
        v = page.evaluate("() => { const i = document.querySelectorAll('input.name-input'); return { s: i[0]?.value, g: i[1]?.value }; }")
        print(f'  after fill, values: {v}')
        # Now click the submit
        try:
            # Click the .btn-zhu element
            btn = page.locator('.btn-zhu').first
            if btn.count() > 0:
                classes = btn.get_attribute('class')
                print(f'  btn classes: {classes}')
                btn.click(force=True)
                time.sleep(2.5)
                shot(page, '78-yuxia-after-submit')
                body2 = page.evaluate("() => document.body.innerText.substring(0, 1500)")
                print('\n=== YUXIA after submit body[:800] ===')
                print(body2[:800].replace('\n', '|'))
        except Exception as e:
            print(f'  click failed: {e}')

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

"""Dogfood helper: navigation + screenshot + console capture for mistverse."""
import os
import time
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, ConsoleMessage

OUT = Path('/workspace/dogfood-output')
SHOTS = OUT / 'screenshots'
VIDEOS = OUT / 'videos'
CHROME = '/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome'

console_log: list[dict] = []
errors_log: list[dict] = []


def on_console(msg: ConsoleMessage) -> None:
    console_log.append({'type': msg.type, 'text': msg.text, 'location': str(msg.location)})
    if msg.type in ('error',):
        errors_log.append(console_log[-1])


def on_pageerror(err) -> None:
    errors_log.append({'type': 'pageerror', 'text': str(err)})


def shot(page, name: str, annotate: bool = False, full_page: bool = True) -> str:
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
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        )
        page = ctx.new_page()
        page.on('console', on_console)
        page.on('pageerror', on_pageerror)

        url = 'http://localhost:5173/mistverse/'
        page.goto(url, wait_until='domcontentloaded', timeout=20000)
        page.wait_for_load_state('networkidle', timeout=15000)
        time.sleep(2.0)
        print('=== HOME ===')
        print('URL:', page.url)
        print('TITLE:', page.title())
        shot(page, '00-home', full_page=True)
        # Body text snippet
        body = page.evaluate("() => document.body ? document.body.innerText.substring(0, 1500) : ''")
        print('BODY-1500:', body[:1500].replace('\n', ' | '))
        time.sleep(1.0)
        browser.close()

        # Dump collected logs
        (OUT / 'console_home.json').write_text(
            json.dumps({'console': console_log, 'errors': errors_log}, ensure_ascii=False, indent=2),
            encoding='utf-8',
        )
        print('=== CONSOLE ERRORS ===', len(errors_log))
        for e in errors_log[:30]:
            print('-', e.get('type'), e.get('text', '')[:200])


if __name__ == '__main__':
    main()

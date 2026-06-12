"""Category click test - click category cards from home and check what's loaded."""
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

        # 1. Go to home
        page.goto('http://localhost:5173/mistverse/', wait_until='domcontentloaded', timeout=20000)
        page.wait_for_load_state('networkidle', timeout=10000)
        time.sleep(2.0)
        page.screenshot(path=str(SHOTS / '20-home.png'), full_page=True)
        print('HOME loaded')

        # 2. Click on 命理 category card
        # First let's see the HTML to find the right selector
        html = page.content()
        # Find all clickable elements with text
        items = page.evaluate("""
        () => {
          const result = [];
          const cards = document.querySelectorAll('[class*=\"card\"], [class*=\"tool\"], [class*=\"cat\"], [class*=\"item\"], .uni-card, .cat-card');
          cards.forEach((el, i) => {
            if (i < 30) {
              const rect = el.getBoundingClientRect();
              result.push({
                tag: el.tagName,
                cls: el.className.substring(0, 100),
                text: (el.innerText || '').substring(0, 60),
                rect: {x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height)}
              });
            }
          });
          return result;
        }
        """)
        print('Clickable items found:', len(items))
        for it in items[:25]:
            print(f"  [{it['tag']}] {it['cls'][:50]} | text='{it['text'][:40]}' @ {it['rect']}")

        # Try clicking the 命理 text first
        try:
            # Use locator with text
            loc = page.locator('text=命理').first
            print('\n命理 count:', loc.count())
            if loc.count() > 0:
                loc.click()
                time.sleep(3.0)
                print('clicked 命理, url:', page.url)
                body = page.evaluate("() => document.body.innerText.substring(0, 800)")
                print('body:', body[:500].replace('\n', '|'))
                page.screenshot(path=str(SHOTS / '21-cat-fate-after-click.png'), full_page=True)
        except Exception as e:
            print('命理 click failed:', e)

        time.sleep(2.0)
        # Go back home and click 占卜
        page.goto('http://localhost:5173/mistverse/', wait_until='domcontentloaded', timeout=20000)
        page.wait_for_load_state('networkidle', timeout=10000)
        time.sleep(2.0)

        try:
            loc = page.locator('text=占卜').first
            print('\n占卜 count:', loc.count())
            if loc.count() > 0:
                loc.click()
                time.sleep(3.0)
                print('clicked 占卜, url:', page.url)
                body = page.evaluate("() => document.body.innerText.substring(0, 800)")
                print('body:', body[:500].replace('\n', '|'))
                page.screenshot(path=str(SHOTS / '22-cat-divination-after-click.png'), full_page=True)
        except Exception as e:
            print('占卜 click failed:', e)

        # Check console errors
        print('\n=== ERRORS ===', len(errors_log))
        for e in errors_log[:20]:
            print(' -', e.get('type'), e.get('text', '')[:200])

        browser.close()


if __name__ == '__main__':
    main()

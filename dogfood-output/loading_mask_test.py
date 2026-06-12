"""Verify the loading-mask issue affects multiple pages."""
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

        # Test pages that use LoadingSeal
        pages = ['bazi', 'hehun', 'mingji', 'qimen', 'tieban', 'xiaoliuren', 'xuankong', 'zhuge', 'ziwei']
        for slug in pages:
            page.goto(f'http://localhost:5173/mistverse/#/pages/{slug}/{slug}', wait_until='domcontentloaded', timeout=20000)
            time.sleep(2.5)
            # Check for the loading-mask
            mask_info = page.evaluate("""
            () => {
              const masks = document.querySelectorAll('.loading-mask');
              const result = [];
              masks.forEach((m, i) => {
                const rect = m.getBoundingClientRect();
                const cs = window.getComputedStyle(m);
                result.push({
                  idx: i,
                  display: cs.display,
                  position: cs.position,
                  width: rect.width,
                  height: rect.height,
                  zIndex: cs.zIndex,
                  pointerEvents: cs.pointerEvents,
                });
              });
              return result;
            }
            """)
            print(f'\n=== {slug} ===')
            for m in mask_info:
                print(f"  mask: {m}")
            shot(page, f'80-loading-mask-{slug}')

        browser.close()


if __name__ == '__main__':
    main()

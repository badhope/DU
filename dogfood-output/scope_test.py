"""Test ziping and other non-LoadingSeal pages to confirm B3 scope."""
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

        # Test each new tool + 9 old LoadingSeal pages
        all_pages = [
            'ziping', 'yuxia', 'yunqi', 'cantong',  # 4 new that don't use LoadingSeal
            'bazi', 'hehun', 'mingji', 'qimen', 'tieban', 'xiaoliuren', 'xuankong', 'zhuge', 'ziwei',  # 9 with LoadingSeal
            'tarot', 'meihua', 'lingqian', 'shuzhi', 'jiaobei',  # 5 free
            'huangli', 'history', 'profile', 'users', 'checkin', 'calendar', 'note',  # utility
        ]
        for slug in all_pages:
            page.goto(f'http://localhost:5173/mistverse/#/pages/{slug}/{slug}', wait_until='domcontentloaded', timeout=15000)
            time.sleep(2.0)
            mask = page.evaluate("""
            () => {
              const m = document.querySelector('.loading-mask');
              if (!m) return { has: false };
              const r = m.getBoundingClientRect();
              const cs = getComputedStyle(m);
              return {
                has: true,
                display: cs.display,
                position: cs.position,
                w: r.width,
                h: r.height,
                z: cs.zIndex,
                pe: cs.pointerEvents,
              };
            }
            """)
            ok = '✓' if not mask['has'] else f'❌ mask {mask["w"]}x{mask["h"]} z{mask["z"]} pe:{mask["pe"]}'
            print(f'  {slug:18} {ok}')

        browser.close()


if __name__ == '__main__':
    main()

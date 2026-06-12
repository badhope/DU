"""Post-fix visual smoke test: confirm previously-broken pages now work."""
import time
from pathlib import Path
from playwright.sync_api import sync_playwright, ConsoleMessage

OUT = Path('/workspace/dogfood-output/screenshots')
CHROME = '/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome'

console_log: list[dict] = []
errors_log: list[dict] = []
network_log: list[dict] = []


def on_console(msg: ConsoleMessage) -> None:
    console_log.append({'type': msg.type, 'text': msg.text})
    if msg.type == 'error':
        errors_log.append(console_log[-1])


def on_pageerror(err) -> None:
    errors_log.append({'type': 'pageerror', 'text': str(err)})


def on_response(response):
    if response.status >= 400:
        network_log.append({'status': response.status, 'url': response.url[:200]})


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

        # Test the 4 previously-broken pages
        targets = [
            ('zhouyi', '占卜', '周易本义', '起 卦'),
            ('dili', '古物', '地理五诀', '立 向'),
            ('bazi', '命理', '八字排盘', '排 盘'),
            ('ziwei', '命理', '紫微斗数', '开 始 排 盘'),
        ]
        for slug, cat, tool, _btn in targets:
            page.goto('http://localhost:5173/mistverse/', wait_until='domcontentloaded', timeout=20000)
            page.wait_for_load_state('networkidle', timeout=10000)
            time.sleep(1.5)
            page.locator(f'text={cat}').first.click()
            time.sleep(2.0)
            page.locator(f'text={tool}').first.scroll_into_view_if_needed(timeout=3000)
            time.sleep(0.5)
            page.locator(f'text={tool}').first.click()
            time.sleep(3.0)
            body = page.evaluate("() => document.body.innerText.substring(0, 600)")
            page.screenshot(path=str(OUT / f'100-fixed-{slug}.png'), full_page=True)
            ok = 'connection timed out' not in body.lower() and tool in body
            print(f'  {slug:8} {"✓ loaded" if ok else "❌ FAIL"} :: {body[:200].replace(chr(10), "|")[:200]}')
            # Check if loading-mask is hidden now
            mask = page.evaluate("""
            () => {
              const m = document.querySelector('.loading-mask');
              if (!m) return { has: false };
              return { has: true, w: m.getBoundingClientRect().width };
            }
            """)
            if mask['has']:
                print(f'    ❌ loading-mask STILL in DOM (w={mask["w"]})')
            else:
                print(f'    ✓ loading-mask NOT in DOM')

        # Network errors check
        print('\n=== NETWORK ERRORS:', len(network_log))
        for n in network_log[:10]:
            print(f"  - {n['status']} {n['url'][:120]}")
        print('=== CONSOLE ERRORS:', len(errors_log))
        for e in errors_log[:10]:
            print(f"  - {e.get('type')}: {e.get('text', '')[:150]}")
        browser.close()


if __name__ == '__main__':
    main()

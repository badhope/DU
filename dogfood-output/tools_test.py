"""Test the 6 new high-end tools via the UI flow."""
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


def navigate_to_category_and_tool(page, cat_text, tool_text, label):
    """Click from home → category → tool."""
    page.goto('http://localhost:5173/mistverse/', wait_until='domcontentloaded', timeout=20000)
    page.wait_for_load_state('networkidle', timeout=10000)
    time.sleep(1.5)
    # Click category
    try:
        page.locator(f'text={cat_text}').first.click(timeout=3000)
    except Exception as e:
        return f'fail: cat click: {e}'
    time.sleep(2.5)
    # Scroll down in the category page
    try:
        page.evaluate("() => window.scrollTo(0, 800)")
        time.sleep(0.5)
    except Exception:
        pass
    # Click tool
    try:
        page.locator(f'text={tool_text}').first.scroll_into_view_if_needed(timeout=2000)
        time.sleep(0.5)
        page.locator(f'text={tool_text}').first.click(timeout=3000)
    except Exception as e:
        return f'fail: tool click: {e}'
    time.sleep(3.0)
    return None


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

        # Each tool: cat_text, tool_text, label
        targets = [
            ('占卜', '周易本义', 'zhouyi', ['起卦', '排盘', '详批', '开始']),
            ('命理', '子平真诠', 'ziping', ['排盘', '详批', '起卦']),
            ('古物', '地理五诀', 'dili', ['起课', '起卦', '详批']),
            ('修心', '参同契', 'cantong', ['开始', '入座']),
            ('生活', '黄历择日', 'huangli', []),  # unrelated, will use as sanity check
            ('命理', '紫微斗数', 'ziwei', []),  # unrelated
        ]

        # Find the categories & tools that exist
        page.goto('http://localhost:5173/mistverse/', wait_until='domcontentloaded', timeout=20000)
        page.wait_for_load_state('networkidle', timeout=10000)
        time.sleep(2.0)
        shot(page, '40-home')

        # For each target: navigate, screenshot, try to find submit
        for cat_text, tool_text, slug, submit_words in targets:
            print(f'\n=== Testing {slug} ({tool_text}) ===')
            err = navigate_to_category_and_tool(page, cat_text, tool_text, slug)
            if err:
                print(' ', err)
                shot(page, f'41-{slug}-error')
                continue
            shot(page, f'41-{slug}-loaded')
            body = page.evaluate("() => document.body.innerText.substring(0, 1500)")
            print(f'  body[:400]: {body[:400].replace(chr(10), "|")}')
            # Look for action button
            for w in submit_words:
                if w in body:
                    print(f'  → has "{w}" word')
            # Try to click a button
            time.sleep(1.0)
            # Look for clickable buttons
            buttons = page.evaluate("""
            () => {
              const result = [];
              document.querySelectorAll('button, .btn, [class*="submit"], [class*="primary"], [class*="action"], [class*="calc"], [class*="start"]').forEach((el, i) => {
                if (i < 20) {
                  const rect = el.getBoundingClientRect();
                  const txt = (el.innerText || el.textContent || '').substring(0, 40);
                  if (rect.width > 0 && rect.height > 0) {
                    result.push({tag: el.tagName, cls: el.className.substring(0, 60), text: txt});
                  }
                }
              });
              return result;
            }
            """)
            print(f'  buttons found: {len(buttons)}')
            for b in buttons[:10]:
                print(f"    [{b['tag']}] {b['cls'][:40]} | '{b['text'][:30]}'")
            # Try clicking the first primary-looking button
            clicked = False
            for b in buttons:
                t = b['text'].replace(' ', '').replace('·', '').replace('·', '').replace('·', '')
                if any(w.replace(' ', '').replace('·', '') in t for w in submit_words):
                    try:
                        loc = page.locator(f"text={b['text'][:30]}").first
                        loc.click(timeout=2000)
                        print(f'    ✓ clicked button with text "{b["text"][:30]}"')
                        clicked = True
                        time.sleep(3.0)
                        break
                    except Exception as e:
                        print(f'    ✗ click failed: {e}')
            if clicked:
                shot(page, f'42-{slug}-after-submit')
                body2 = page.evaluate("() => document.body.innerText.substring(0, 1500)")
                print(f'  after submit body[:600]: {body2[:600].replace(chr(10), "|")}')

        # Check errors
        print('\n=== TOTAL ERRORS:', len(errors_log))
        for e in errors_log[:50]:
            print(' -', e.get('type'), e.get('text', '')[:200])

        browser.close()


if __name__ == '__main__':
    main()

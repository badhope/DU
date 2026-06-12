"""Test yuxia form interaction more carefully."""
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path('/workspace/dogfood-output/screenshots')
CHROME = '/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=CHROME, args=['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'])
    ctx = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    page = ctx.new_page()

    page.goto('http://localhost:5173/mistverse/#/pages/yuxia/yuxia', wait_until='domcontentloaded')
    page.wait_for_load_state('networkidle', timeout=10000)
    time.sleep(2.0)
    page.screenshot(path=str(OUT / '110-yuxia-initial.png'), full_page=True)

    # Get all inputs
    inputs = page.evaluate("""
    () => {
      const result = [];
      document.querySelectorAll('input').forEach((el, i) => {
        const r = el.getBoundingClientRect();
        result.push({
          idx: i,
          cls: el.className,
          type: el.type,
          placeholder: el.placeholder,
          visible: r.width > 0 && r.height > 0,
          rect: {x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height)},
        });
      });
      return result;
    }
    """)
    print(f'Total inputs: {len(inputs)}')
    for inp in inputs:
        print(f'  {inp}')

    # Get buttons
    btns = page.evaluate("""
    () => {
      const result = [];
      document.querySelectorAll('button, .btn, [class*=\"btn\"]').forEach((el, i) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0) {
          result.push({
            tag: el.tagName,
            cls: el.className.substring(0, 40),
            text: (el.innerText || '').substring(0, 30),
            visible: r.width > 0 && r.height > 0,
          });
        }
      });
      return result;
    }
    """)
    print(f'\nButtons: {len(btns)}')
    for b in btns[:10]:
        print(f'  {b}')

    # Try direct fill with native input event
    result = page.evaluate("""
    () => {
      const inputs = document.querySelectorAll('input');
      if (inputs.length < 2) return { err: 'less than 2 inputs', count: inputs.length };
      const surname = inputs[0];
      const given = inputs[1];
      const setVal = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setVal.call(surname, '王');
      surname.dispatchEvent(new Event('input', { bubbles: true }));
      surname.dispatchEvent(new Event('change', { bubbles: true }));
      setVal.call(given, '浩然');
      given.dispatchEvent(new Event('input', { bubbles: true }));
      given.dispatchEvent(new Event('change', { bubbles: true }));
      return { s: surname.value, g: given.value };
    }
    """)
    print(f'\nAfter fill: {result}')
    time.sleep(1.0)
    page.screenshot(path=str(OUT / '111-yuxia-filled.png'), full_page=True)

    # Find and click submit
    try:
        page.locator('text=八 一 数 · 详 批').first.click()
        time.sleep(3.0)
        page.screenshot(path=str(OUT / '112-yuxia-submitted.png'), full_page=True)
        body = page.evaluate("() => document.body.innerText.substring(0, 1500)")
        print(f'\nAfter submit body[:600]:')
        print(body[:600].replace('\n', '|'))
    except Exception as e:
        print(f'submit click failed: {e}')

    browser.close()

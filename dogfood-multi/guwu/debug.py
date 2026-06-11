"""调试：检查页面 HTML 内容和结构"""
import time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173/mistverse/"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 414, "height": 896})
    page = ctx.new_page()
    page.on("console", lambda m: print(f"[console.{m.type}]: {m.text[:300]}"))
    page.on("pageerror", lambda e: print(f"[pageerror]: {e}"))
    page.goto(f"{BASE}modules/guanxiang/pages/mianxiang", wait_until="networkidle")
    time.sleep(3)
    html = page.content()
    print(f"HTML 长度: {len(html)}")
    with open("/workspace/dogfood-multi/guwu/debug.html", "w") as f:
        f.write(html)
    body_text = page.evaluate("() => document.body.innerText")
    print(f"body 文本:\n{body_text[:2000]}")
    print("=" * 60)
    elements = page.evaluate("""() => {
        const result = [];
        const all = document.querySelectorAll('*');
        all.forEach((el, i) => {
            if (i < 80) {
                const cls = (el.className && el.className.baseVal !== undefined) ? el.className.baseVal : (el.className || '');
                const txt = (el.textContent || '').trim().slice(0, 50);
                if (txt && txt.length > 1) result.push({ tag: el.tagName, cls: String(cls).slice(0, 50), txt });
            }
        });
        return result;
    }""")
    for e in elements[:60]:
        print(f"  {e['tag']:10} .{e['cls'][:40]:40} = '{e['txt'][:50]}'")
    page.screenshot(path="/workspace/dogfood-multi/guwu/screenshots/debug-mianxiang.png", full_page=False)
    browser.close()

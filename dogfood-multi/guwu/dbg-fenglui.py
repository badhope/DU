import time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173/mistverse/"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 414, "height": 896})
    page = ctx.new_page()
    page.goto(BASE, wait_until="networkidle", timeout=20000)
    time.sleep(2.0)
    page.evaluate("location.hash = '#/modules/guanxiang/pages/fenglui'")
    time.sleep(3.0)
    # click 开始推算
    page.evaluate("""() => {
        const btns = document.querySelectorAll('.btn-zhu, .btn-liu, .g-btn');
        for (const el of btns) {
            if ((el.textContent || '').trim() === '开 始 推 算') { el.click(); return; }
        }
    }""")
    time.sleep(2.5)
    text = page.evaluate("() => document.body.innerText")
    print("Text length:", len(text))
    print("---")
    print(repr(text[:1500]))
    print("---")
    for kw in ['八宅', '罗盘', '八方', '命卦', '门位', '建议', '乾', '兑', '坎', '震']:
        print(f"  {kw}: {text.count(kw)}")
    browser.close()

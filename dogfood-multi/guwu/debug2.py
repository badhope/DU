"""调试：检查 .btn-zhu 元素"""
import time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173/mistverse/"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 414, "height": 896})
    page = ctx.new_page()
    page.on("console", lambda m: print(f"[{m.type}]: {m.text[:200]}"))
    page.goto(BASE, wait_until="networkidle", timeout=20000)
    time.sleep(2.0)
    page.evaluate("location.hash = '#/modules/guanxiang/pages/mianxiang'")
    time.sleep(3.0)

    info = page.evaluate("""() => {
        const btn = document.querySelector('.btn-zhu');
        if (!btn) return { found: false };
        const rect = btn.getBoundingClientRect();
        return {
            found: true,
            tag: btn.tagName,
            cls: btn.className,
            txt: btn.textContent.trim(),
            rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
            dataAttrs: Object.keys(btn.dataset),
        };
    }""")
    print(f"btn-zhu: {info}")

    # 查找所有包含 '开 始 分 析' 的元素
    info2 = page.evaluate("""() => {
        const result = [];
        const all = document.querySelectorAll('*');
        for (const el of all) {
            const t = (el.textContent || '').trim();
            if (t.includes('开始分析') || t.includes('开 始 分 析')) {
                const rect = el.getBoundingClientRect();
                result.push({
                    tag: el.tagName,
                    cls: typeof el.className === 'string' ? el.className : String(el.className?.baseVal || ''),
                    txt: t.slice(0, 30),
                    rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) }
                });
            }
        }
        return result;
    }""")
    print(f"\n包含 '开始分析' 的元素:")
    for e in info2[:10]:
        print(f"  {e['tag']} cls='{e['cls'][:60]}' rect={e['rect']} txt='{e['txt']}'")

    browser.close()

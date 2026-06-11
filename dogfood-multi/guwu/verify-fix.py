"""验证 mingji 修复是否生效"""
import time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173/mistverse/"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 414, "height": 896})
    page = ctx.new_page()
    page.add_init_script("""
        (() => {
            const initial = {
                divinatorProfiles: {'测试': {key: '测试', name: '测试', remark: '自己', createdAt: Date.now(), totalCount: 0, lastDate: new Date().toISOString().slice(0, 10), toolCooldown: {}}},
                activeDivinatorKey: '测试',
                divinationRecords: [],
                history: [],
                profile: null,
                favorites: [],
                notes: [],
                achievements: [],
                checkin: { lastDate: '', streak: 0, totalDays: 0, points: 0 }
            };
            localStorage.setItem('mistverse-app-v1', JSON.stringify(initial));
        })();
    """)
    page.goto(BASE, wait_until="networkidle", timeout=20000)
    time.sleep(2.0)
    page.evaluate("location.hash = '#/modules/mingming/pages/mingji'")
    time.sleep(3.0)

    # 设置姓名
    page.evaluate("""() => {
        const input = document.querySelector('input.form-inp, input[type="text"]');
        if (!input) return false;
        const proto = Object.getPrototypeOf(input);
        const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
        setter.call(input, '张三');
        input.dispatchEvent(new CustomEvent('input', { detail: { value: '张三' }, bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
    }""")
    time.sleep(0.3)
    # 点击开始测字
    page.evaluate("""() => {
        const btns = document.querySelectorAll('.btn-zhu, .btn-liu');
        for (const el of btns) {
            if ((el.textContent || '').trim() === '开 始 测 字') { el.click(); return; }
        }
    }""")
    time.sleep(4.0)
    # 检查 wg-cell 内容
    cells = page.evaluate("""() => {
        const cells = document.querySelectorAll('.wg-cell');
        return Array.from(cells).map(c => (c.textContent || '').trim());
    }""")
    print("wg-cells:", cells)
    # 保存截图
    page.screenshot(path="/workspace/dogfood-multi/guwu/screenshots/verify-mingji-fix.png", full_page=True)
    # 滚动到 wuge 区域
    page.evaluate("""() => {
        const el = document.querySelector('.wuge');
        if (el) el.scrollIntoView({ block: 'center' });
    }""")
    time.sleep(0.5)
    page.screenshot(path="/workspace/dogfood-multi/guwu/screenshots/verify-mingji-fix-zoom.png", full_page=False)
    browser.close()

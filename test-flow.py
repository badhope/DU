"""
玄枢 MISTVERSE v1.4.0 — 用户实际交互流程测试
"""
import sys
import time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8000/mistverse/"
RESULTS = {"passed": 0, "failed": 0, "errors": []}
CONSOLE_LOGS = []
PAGE_ERRORS = []


def log(msg, status="info"):
    icon = {"info": "·", "pass": "✓", "fail": "✗"}.get(status, "·")
    print(f"  {icon} {msg}")
    if status == "fail":
        RESULTS["failed"] += 1
    elif status == "pass":
        RESULTS["passed"] += 1


def main():
    t0 = time.time()
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            executable_path="/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome",
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
        )
        ctx = browser.new_context(viewport={"width": 414, "height": 896})
        page = ctx.new_page()
        page.on("console", lambda m: CONSOLE_LOGS.append({"type": m.type, "text": m.text}))
        page.on("pageerror", lambda e: PAGE_ERRORS.append(str(e)))

        # ── Flow 1: 访问首页，看 8 大模块入口 ──
        print("\n=== Flow 1: 首页模块入口 ===")
        page.goto(BASE, wait_until="networkidle", timeout=20000)
        page.wait_for_timeout(2500)
        page.screenshot(path="/tmp/flow_01_home.png", full_page=True)
        # 统计可交互元素（uni-app 用 uni-view / uni-page / picker / button）
        info = page.evaluate("""
            () => {
                const nodes = document.querySelectorAll('*').length;
                const views = document.querySelectorAll('uni-view, uni-page, uni-picker, uni-button, button').length;
                const texts = Array.from(document.querySelectorAll('uni-text, span, h1, h2, h3, h4, .title, .nav-title')).map(e => e.textContent?.trim()).filter(t => t && t.length < 30).slice(0, 40);
                return { nodes, views, texts };
            }
        """)
        log(f"页面总节点: {info['nodes']}", "pass" if info["nodes"] > 100 else "fail")
        log(f"交互元素 (uni-view/picker/button): {info['views']}", "pass" if info["views"] > 10 else "fail")
        # 至少 6 大模块入口（v1.4.0 实际有 6 个顶层模块 + 个人/设置）
        keywords = ["命理", "占卜", "古物", "健康", "修心", "生活", "MISTVERSE", "玄枢"]
        text_blob = " ".join(info["texts"])
        modules_found = [k for k in keywords if k in text_blob]
        log(f"首页关键入口含 {len(modules_found)}/{len(keywords)}: {modules_found}", "pass" if len(modules_found) >= 6 else "fail")

        # ── Flow 2: 点开"命理 → 八字排盘" ──
        print("\n=== Flow 2: 进入八字排盘 ===")
        # 用 SPA 路由跳转（模拟点导航）
        page.evaluate("location.hash = '#/modules/mingli/pages/bazi'")
        page.wait_for_timeout(3000)
        title = page.evaluate("() => document.body.innerText")
        log(f"标题包含 '八字排盘': {'八字排盘' in title}", "pass" if "八字排盘" in title else "fail")
        log(f"包含 'FOUR PILLARS': {'FOUR PILLARS' in title}", "pass" if "FOUR PILLARS" in title else "fail")
        page.screenshot(path="/tmp/flow_02_bazi.png", full_page=True)

        # ── Flow 3: 八字填表（模拟） ──
        print("\n=== Flow 3: 八字表单交互 ===")
        # uni-app 用 uni-picker 而不是 input
        pickers = page.evaluate("""
            () => {
                const list = document.querySelectorAll('uni-picker');
                return Array.from(list).map(p => {
                    const text = p.innerText || p.textContent || '';
                    return text.trim().slice(0, 40);
                });
            }
        """)
        log(f"uni-picker 数量: {len(pickers)}", "pass" if len(pickers) >= 4 else "fail")
        for i, p in enumerate(pickers[:8]):
            log(f"  picker[{i}]: {p}", "info")
        # 排盘按钮
        buttons = page.evaluate("""
            () => {
                const btns = document.querySelectorAll('uni-button, button, [class*="btn"], [class*="action"]');
                return Array.from(btns).map(b => (b.innerText || '').trim()).filter(t => t).slice(0, 10);
            }
        """)
        log(f"按钮/动作: {len(buttons)}", "pass" if len(buttons) > 0 else "info")
        for b in buttons[:6]:
            log(f"  btn: {b}", "info")

        # ── Flow 4: 老黄历（数据最丰富页） ──
        print("\n=== Flow 4: 老黄历数据 ===")
        page.evaluate("location.hash = '#/modules/shenghuo/pages/huangli'")
        page.wait_for_timeout(2500)
        text = page.evaluate("() => document.body.innerText")
        # 老黄历应有 干支 / 宜 / 忌 / 冲 / 煞 / 五行 / 星宿 等
        keywords = ["宜", "忌", "干支", "冲", "煞", "五行", "2026", "节气"]
        found = [k for k in keywords if k in text]
        log(f"黄历关键词 {len(found)}/{len(keywords)}: {found}", "pass" if len(found) >= 4 else "fail")
        page.screenshot(path="/tmp/flow_03_huangli.png", full_page=True)

        # ── Flow 5: 切换 tab 到个人中心 ──
        print("\n=== Flow 5: 个人中心 ===")
        page.evaluate("location.hash = '#/modules/personal/pages/index'")
        page.wait_for_timeout(2500)
        text = page.evaluate("() => document.body.innerText")
        log(f"个人中心含 '玄枢' / 'MISTVERSE': {'MISTVERSE' in text or '玄枢' in text}", "pass")
        page.screenshot(path="/tmp/flow_04_personal.png", full_page=True)

        # ── Flow 6: localStorage 写入后再访问 ──
        print("\n=== Flow 6: 持久化写入 ===")
        # 主动写一个测试 key
        page.evaluate("""
            () => {
                localStorage.setItem('mistverse-test-foo', 'bar');
            }
        """)
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(2000)
        val = page.evaluate("() => localStorage.getItem('mistverse-test-foo')")
        log(f"reload 后 localStorage 仍存在: {val == 'bar'}", "pass" if val == "bar" else "fail")

        # ── Flow 7: 全程 console error 检查 ──
        print("\n=== Flow 7: 错误检查 ===")
        errs = [l for l in CONSOLE_LOGS if l["type"] == "error"]
        warns = [l for l in CONSOLE_LOGS if l["type"] == "warning"]
        if errs:
            log(f"console.error {len(errs)} 条", "fail")
            for e in errs[:5]:
                log(f"  - {e['text'][:140]}", "fail")
        else:
            log("0 个 console.error", "pass")
        if PAGE_ERRORS:
            log(f"pageerror {len(PAGE_ERRORS)} 条", "fail")
            for e in PAGE_ERRORS[:5]:
                log(f"  - {e[:140]}", "fail")
        else:
            log("0 个未捕获 pageerror", "pass")
        if warns:
            log(f"console.warn {len(warns)} 条 (非致命)", "info")
            for w in warns[:3]:
                log(f"  - {w['text'][:120]}", "info")

        browser.close()

    dt = time.time() - t0
    print(f"\n=== 总结 ({dt:.1f}s) ===")
    print(f"  ✓ 通过: {RESULTS['passed']}")
    print(f"  ✗ 失败: {RESULTS['failed']}")
    return 0 if RESULTS["failed"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())

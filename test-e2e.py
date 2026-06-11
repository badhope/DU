"""
玄枢 MISTVERSE v1.4.0 — 自动化浏览器测试
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


def collect(page):
    page.on("console", lambda m: CONSOLE_LOGS.append({"type": m.type, "text": m.text}))
    page.on("pageerror", lambda e: PAGE_ERRORS.append(str(e)))


def main():
    t0 = time.time()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, executable_path="/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome", args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"])
        ctx = browser.new_context(viewport={"width": 414, "height": 896})
        page = ctx.new_page()
        collect(page)

        # Test 1: 首页
        print("\n=== Test 1: 首页加载 ===")
        page.goto(BASE, wait_until="networkidle", timeout=20000)
        page.wait_for_timeout(2000)
        page.screenshot(path="/tmp/01_home.png", full_page=True)
        title = page.title()
        log(f"页面 title: {title[:60]}", "pass")
        log(f"URL: {page.url}", "info")
        log(f"DOM readyState: {page.evaluate('() => document.readyState')}", "pass")

        # Test 2: 首页内容
        print("\n=== Test 2: 首页内容关键词 ===")
        content = page.content()
        keywords = ["玄枢", "MISTVERSE", "命", "卜", "观", "健", "修", "生"]
        found = [k for k in keywords if k in content]
        missing = [k for k in keywords if k not in content]
        if found:
            log(f"包含关键词 {len(found)}/{len(keywords)}: {found}", "pass")
        if missing:
            log(f"缺失关键词: {missing}", "fail")
        # 业务元素
        body_text = page.evaluate("() => document.body.innerText")
        log(f"页面 body 文本长度: {len(body_text)}", "info")
        if len(body_text) > 100:
            log("首页有真实内容", "pass")
        else:
            log(f"页面 body 文本异常短:\n{body_text[:200]}", "fail")

        # Test 3: 9 个模块页（uni-app hash 模式，pages.json 中真实路径）
        routes = [
            ("personal_index",   "#/modules/personal/pages/index"),
            ("mingli_wuxing",    "#/modules/mingli/pages/wuxing"),
            ("mingli_bazi",      "#/modules/mingli/pages/bazi"),
            ("mingli_hehun",     "#/modules/mingli/pages/hehun"),
            ("mingli_liunian",   "#/modules/mingli/pages/liunian"),
            ("zhanbu_qimen",     "#/modules/zhanbu/pages/qimen"),
            ("zhanbu_liuyao",    "#/modules/zhanbu/pages/liuyao"),
            ("guanxiang_mianxiang", "#/modules/guanxiang/pages/mianxiang"),
            ("mingming_mingji",    "#/modules/mingming/pages/mingji"),
            ("jiankang_ziwu",      "#/modules/jiankang/pages/ziwu"),
            ("xiuxin_shijian",     "#/modules/xiuxin/pages/shijian"),
            ("shenghuo_huangli",   "#/modules/shenghuo/pages/huangli"),
        ]

        print(f"\n=== Test 3: {len(routes)} 个模块页 SPA 路由 ===")
        for name, route in routes:
            try:
                page.goto(f"{BASE}{route}", wait_until="load", timeout=15000)
                # 等 uni-app 挂载 + 异步数据
                page.wait_for_timeout(3000)
                html_len = page.evaluate("() => document.body.innerHTML.length")
                inner_text = page.evaluate("() => document.body.innerText")
                shot = f"/tmp/route_{name}.png"
                page.screenshot(path=shot, full_page=False)
                if html_len > 3000 and len(inner_text) > 30:
                    # 提取首行有意义的内容
                    sample = " | ".join([l.strip() for l in inner_text.split("\n") if l.strip()][:5])[:150]
                    log(f"{name:30s} → HTML={html_len}B text={len(inner_text)}B", "pass")
                    log(f"  sample: {sample}", "info")
                else:
                    log(f"{name:30s} → 异常 (HTML={html_len}B)", "fail")
            except Exception as e:
                log(f"{name:30s} → EXC: {str(e)[:80]}", "fail")

        # Test 4: localStorage 持久化
        print("\n=== Test 4: localStorage 持久化 ===")
        page.goto(BASE, wait_until="networkidle", timeout=15000)
        page.wait_for_timeout(1500)
        ls = page.evaluate("() => Object.keys(localStorage)")
        log(f"localStorage keys: {ls}", "info")
        for k in ["mistverse-app-v1", "mistverse-settings-v1"]:
            if k in ls:
                log(f"  ✓ {k} 存在", "pass")
            else:
                log(f"  ✗ {k} 不存在（首次访问正常）", "info")

        # Test 5: pinia store 内部状态
        print("\n=== Test 5: 全局状态 ===")
        win = page.evaluate("() => Object.keys(window).filter(k => k.includes('uni') || k.includes('Vue') || k.includes('__')).slice(0, 20)")
        log(f"window globals (uni/vue): {win}", "info")

        # Test 6: Console 错误总结
        print("\n=== Test 6: Console / PageError 总结 ===")
        errs = [l for l in CONSOLE_LOGS if l["type"] == "error"]
        warns = [l for l in CONSOLE_LOGS if l["type"] == "warning"]
        if errs:
            log(f"console.error {len(errs)} 条:", "fail")
            for e in errs[:8]:
                log(f"  - {e['text'][:140]}", "fail")
                RESULTS["errors"].append(e["text"][:200])
        else:
            log("无 console.error", "pass")
        if PAGE_ERRORS:
            log(f"未捕获 pageerror {len(PAGE_ERRORS)} 条:", "fail")
            for e in PAGE_ERRORS[:8]:
                log(f"  - {e[:140]}", "fail")
                RESULTS["errors"].append(f"pageerror: {e[:200]}")
        else:
            log("无未捕获 pageerror", "pass")
        if warns:
            log(f"console.warn {len(warns)} 条 (非致命)", "info")
            for w in warns[:3]:
                log(f"  - {w['text'][:120]}", "info")

        browser.close()

    dt = time.time() - t0
    print(f"\n=== 总结 ({dt:.1f}s) ===")
    print(f"  ✓ 通过: {RESULTS['passed']}")
    print(f"  ✗ 失败: {RESULTS['failed']}")
    print(f"  截图: /tmp/01_home.png + /tmp/route_*.png ({len(routes)} 张)")
    if RESULTS["errors"]:
        print(f"\n  失败明细:")
        for e in RESULTS["errors"][:5]:
            print(f"    - {e}")
    return 0 if RESULTS["failed"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())

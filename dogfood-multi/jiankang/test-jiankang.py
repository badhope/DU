"""
健康模块真实用户模拟测试 (Dogfood)
- 4 工具 × 3 截图（初始 / 交互中 / 交互结果）
- 评估：动画流畅度、配色、排版、动画质量
- 控制台错误收集
- 输出：/workspace/dogfood-multi/jiankang/
"""
import json
import os
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173/mistverse/"
OUT = Path("/workspace/dogfood-multi/jiankang")
SHOT = OUT / "screenshots"
REPORT = OUT / "reports"
SHOT.mkdir(parents=True, exist_ok=True)
REPORT.mkdir(parents=True, exist_ok=True)

# 收集的数据
ALL_FINDINGS = {}
ALL_CONSOLE = {}
ALL_PAGE_ERRORS = {}


def record_console(tool_name, msgs, errors):
    ALL_CONSOLE[tool_name] = msgs
    ALL_PAGE_ERRORS[tool_name] = errors


def fire_input(page, selector, value):
    """uni-app H5 CustomEvent with detail.value"""
    return page.evaluate(
        """([sel, val]) => {
          const el = document.querySelector(sel);
          if (!el) return false;
          const proto = Object.getPrototypeOf(el);
          const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
          setter.call(el, val);
          el.dispatchEvent(new CustomEvent('input', {detail: {value: val}, bubbles: true}));
          return true;
        }""",
        [selector, value],
    )


def click_text(page, text, nth=0):
    """Click on text content. nth=0 means first match."""
    loc = page.locator(f"text={text}")
    if loc.count() == 0:
        return False
    loc.nth(nth).click()
    return True


def safe_navigate(page, path, wait=2000):
    """uni-app H5 uses hash router: BASE + '#/' + path"""
    url = BASE + "#/" + path.lstrip("/")
    page.goto(url, wait_until="networkidle", timeout=20000)
    page.wait_for_timeout(wait)
    return page.url


def snap(page, name, full=True):
    p = SHOT / name
    page.screenshot(path=str(p), full_page=full)
    return str(p)


def test_qijing(browser, ctx):
    """奇经八脉 - 4 个子模式：八脉 / 十二正经 / 人体 / 病症"""
    print("\n========== 1. 奇经八脉 (qijing) ==========")
    page = ctx.new_page()
    msgs = []
    errs = []
    page.on("console", lambda m: msgs.append(f"[{m.type}] {m.text[:300]}"))
    page.on("pageerror", lambda e: errs.append(str(e)[:300]))

    # 1) 八脉总览
    safe_navigate(page, "modules/jiankang/pages/qijing", 1500)
    page.wait_for_timeout(800)
    body = page.locator("body").inner_text()[:400]
    print(f"  URL: {page.url}\n  Body: {body[:200]!r}")
    snap(page, "1-qijing-01-initial.png")

    # 2) 展开第一个八脉卡片
    qij_cards = page.locator(".qij-card")
    if qij_cards.count() > 0:
        qij_cards.nth(0).click()
        page.wait_for_timeout(500)
        snap(page, "1-qijing-02-interact.png")
        # 3) 查看结果
        page.wait_for_timeout(800)
        snap(page, "1-qijing-03-result.png")
    else:
        snap(page, "1-qijing-02-interact.png")
        snap(page, "1-qijing-03-result.png")

    # 4) 切换到 十二正经
    tab_btns = page.locator(".tab-btn")
    print(f"  tabs: {tab_btns.count()}")
    if tab_btns.count() >= 2:
        tab_btns.nth(1).click()  # 十二正经
        page.wait_for_timeout(800)
        snap(page, "1-qijing-04-jingluo.png")
        # 展开一个经脉
        jl_cards = page.locator(".jl-card")
        if jl_cards.count() > 0:
            jl_cards.nth(0).click()
            page.wait_for_timeout(500)
            snap(page, "1-qijing-05-jingluo-open.png")

    # 5) 切换到 人体 (bodymap)
    if tab_btns.count() >= 3:
        tab_btns.nth(2).click()
        page.wait_for_timeout(1500)
        snap(page, "1-qijing-06-bodymap.png")
        # 6) 切换到背面
        side_btn = page.locator(".side-btn").nth(1)
        if side_btn.count() > 0:
            side_btn.click()
            page.wait_for_timeout(800)
            snap(page, "1-qijing-07-bodymap-back.png")

    # 7) 切换到 病症 - 触发输入
    if tab_btns.count() >= 4:
        tab_btns.nth(3).click()
        page.wait_for_timeout(800)
        snap(page, "1-qijing-08-diag-initial.png")
        # 点击常见症状标签
        sym_tags = page.locator(".sym-tag")
        if sym_tags.count() > 0:
            sym_tags.nth(0).click()
            page.wait_for_timeout(800)
            snap(page, "1-qijing-09-diag-result.png")

    record_console("qijing", msgs, errs)
    findings = {
        "name": "奇经八脉",
        "url": page.url,
        "body_excerpt": body[:200],
        "screenshots": [str(p) for p in sorted(SHOT.glob("1-qijing-*.png"))],
    }
    ALL_FINDINGS["qijing"] = findings
    page.close()
    return findings


def test_ziwu(browser, ctx):
    """子午流注 - 3 个子模式：当前 / 12时辰 / 灵龟八法"""
    print("\n========== 2. 子午流注 (ziwu) ==========")
    page = ctx.new_page()
    msgs = []
    errs = []
    page.on("console", lambda m: msgs.append(f"[{m.type}] {m.text[:300]}"))
    page.on("pageerror", lambda e: errs.append(str(e)[:300]))

    safe_navigate(page, "modules/jiankang/pages/ziwu", 1500)
    page.wait_for_timeout(1000)
    body = page.locator("body").inner_text()[:500]
    print(f"  URL: {page.url}\n  Body: {body[:200]!r}")
    snap(page, "2-ziwu-01-initial.png")

    # 2) 切换到 12 时辰
    tab_btns = page.locator(".tab-btn")
    print(f"  tabs: {tab_btns.count()}")
    if tab_btns.count() >= 2:
        tab_btns.nth(1).click()
        page.wait_for_timeout(1200)
        snap(page, "2-ziwu-02-table.png")
        # 3) 点击某个时辰卡
        z_cards = page.locator(".z-card")
        print(f"  z-cards: {z_cards.count()}")
        if z_cards.count() > 0:
            z_cards.nth(3).click()  # 卯时
            page.wait_for_timeout(800)
            snap(page, "2-ziwu-03-shichen-clicked.png")

    # 4) 切换到 灵龟八法
    if tab_btns.count() >= 3:
        tab_btns.nth(2).click()
        page.wait_for_timeout(800)
        snap(page, "2-ziwu-04-linggui.png")
        # 5) 展开一个灵龟卡
        lg_cards = page.locator(".lg-card")
        if lg_cards.count() > 0:
            lg_cards.nth(0).click()
            page.wait_for_timeout(500)
            snap(page, "2-ziwu-05-linggui-open.png")

    record_console("ziwu", msgs, errs)
    ALL_FINDINGS["ziwu"] = {
        "name": "子午流注",
        "url": page.url,
        "body_excerpt": body[:200],
        "screenshots": [str(p) for p in sorted(SHOT.glob("2-ziwu-*.png"))],
    }
    page.close()


def test_wufu(browser, ctx):
    """五福测算 - 选出生信息 → 看五福分析"""
    print("\n========== 3. 五福测算 (wufu) ==========")
    page = ctx.new_page()
    msgs = []
    errs = []
    page.on("console", lambda m: msgs.append(f"[{m.type}] {m.text[:300]}"))
    page.on("pageerror", lambda e: errs.append(str(e)[:300]))

    safe_navigate(page, "modules/jiankang/pages/wufu", 1500)
    page.wait_for_timeout(1200)
    body = page.locator("body").inner_text()[:500]
    print(f"  URL: {page.url}\n  Body: {body[:200]!r}")
    snap(page, "3-wufu-01-initial.png")

    # 2) 切换性别到"女"
    g_btns = page.locator(".g-btn")
    if g_btns.count() >= 2:
        g_btns.nth(1).click()  # 女
        page.wait_for_timeout(500)
    snap(page, "3-wufu-02-gender.png")

    # 3) 点击"开始测算"
    calc_btn = page.locator(".btn-zhu")
    if calc_btn.count() > 0:
        calc_btn.first.click()
        page.wait_for_timeout(1500)  # 等待 600ms loading
        snap(page, "3-wufu-03-result.png")

        # 4) 滚动查看 90 年曲线
        page.evaluate("window.scrollTo(0, 800)")
        page.wait_for_timeout(500)
        snap(page, "3-wufu-04-curve.png")

        # 5) 滚动到最弱年龄
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(500)
        snap(page, "3-wufu-05-peaks.png")

    record_console("wufu", msgs, errs)
    ALL_FINDINGS["wufu"] = {
        "name": "五福测算",
        "url": page.url,
        "body_excerpt": body[:200],
        "screenshots": [str(p) for p in sorted(SHOT.glob("3-wufu-*.png"))],
    }
    page.close()


def test_yangsheng(browser, ctx):
    """节气养生 - 3 个子模式：当前 / 24节气 / 五运六气"""
    print("\n========== 4. 节气养生 (yangsheng) ==========")
    page = ctx.new_page()
    msgs = []
    errs = []
    page.on("console", lambda m: msgs.append(f"[{m.type}] {m.text[:300]}"))
    page.on("pageerror", lambda e: errs.append(str(e)[:300]))

    safe_navigate(page, "modules/jiankang/pages/yangsheng", 1500)
    page.wait_for_timeout(1000)
    body = page.locator("body").inner_text()[:500]
    print(f"  URL: {page.url}\n  Body: {body[:200]!r}")
    snap(page, "4-yangsheng-01-initial.png")

    # 2) 切换到 24 节气
    tab_btns = page.locator(".tab-btn")
    print(f"  tabs: {tab_btns.count()}")
    if tab_btns.count() >= 2:
        tab_btns.nth(1).click()
        page.wait_for_timeout(1000)
        snap(page, "4-yangsheng-02-jq-list.png")
        # 3) 展开一个节气
        jq_cards = page.locator(".jq-row-card")
        print(f"  jq cards: {jq_cards.count()}")
        if jq_cards.count() > 0:
            jq_cards.nth(0).click()
            page.wait_for_timeout(500)
            snap(page, "4-yangsheng-03-jq-open.png")
            # 4) 切换到另一个节气
            jq_cards.nth(8).click()  # 切换到立秋
            page.wait_for_timeout(500)
            snap(page, "4-yangsheng-04-jq-switched.png")

    # 5) 切换到 五运六气
    if tab_btns.count() >= 3:
        tab_btns.nth(2).click()
        page.wait_for_timeout(1000)
        snap(page, "4-yangsheng-05-wuyun.png")

    record_console("yangsheng", msgs, errs)
    ALL_FINDINGS["yangsheng"] = {
        "name": "节气养生",
        "url": page.url,
        "body_excerpt": body[:200],
        "screenshots": [str(p) for p in sorted(SHOT.glob("4-yangsheng-*.png"))],
    }
    page.close()


def main():
    print("=" * 70)
    print(f"  玄枢 MISTVERSE · 健康模块 Dogfood")
    print(f"  Base: {BASE}")
    print(f"  Output: {OUT}")
    print("=" * 70)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport={"width": 414, "height": 896},
            device_scale_factor=2,
        )

        # 按顺序测试 4 个工具
        test_qijing(browser, ctx)
        test_ziwu(browser, ctx)
        test_wufu(browser, ctx)
        test_yangsheng(browser, ctx)

        browser.close()

    # 保存元数据
    (OUT / "findings.json").write_text(
        json.dumps(ALL_FINDINGS, ensure_ascii=False, indent=2)
    )
    (OUT / "console.json").write_text(
        json.dumps({"console": ALL_CONSOLE, "errors": ALL_PAGE_ERRORS}, ensure_ascii=False, indent=2)
    )

    print("\n" + "=" * 70)
    print("  ✅ Done")
    print(f"  Screenshots: {len(list(SHOT.glob('*.png')))}")
    print(f"  Console logs: {sum(len(v) for v in ALL_CONSOLE.values())} entries")
    print(f"  Page errors: {sum(len(v) for v in ALL_PAGE_ERRORS.values())} entries")
    print("=" * 70)

    return 0


if __name__ == "__main__":
    sys.exit(main())

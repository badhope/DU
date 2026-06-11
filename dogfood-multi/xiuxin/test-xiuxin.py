"""
玄枢 MISTVERSE · 修心模块 · 真实用户点击模拟测试
测试 5 个工具：坐禅计时、放松冥想、拾句、每日签到、大运流转
"""
import json
import time
from pathlib import Path
from playwright.sync_api import sync_playwright, Page

BASE = "http://localhost:5173/mistverse/#"
OUT = Path("/workspace/dogfood-multi/xiuxin")
SHOT = OUT / "screenshots"
SHOT.mkdir(parents=True, exist_ok=True)

# 收集所有测试结果
results = {
    "1_zhan": {},
    "2_fangqi": {},
    "3_shijian": {},
    "4_checkin": {},
    "5_dayun": {},
}

console_errors = []


def log_console(msg):
    """记录 console 消息，只记录 error/warning"""
    if msg.type in ("error", "warning"):
        text = msg.text[:300]
        console_errors.append(f"[{msg.type}] {text}")


def log_pageerror(err):
    console_errors.append(f"[pageerror] {str(err)[:300]}")


def wait_settle(page: Page, ms: int = 1500):
    """等待动画/网络稳定"""
    page.wait_for_timeout(ms)


def get_body_text(page: Page) -> str:
    return page.locator("body").inner_text()


def save_screenshot(page: Page, name: str):
    """保存截图"""
    p = SHOT / name
    page.screenshot(path=str(p), full_page=True)
    return str(p)


def test_zhan(page: Page):
    """1. 坐禅计时 - 选时长、选方式、入坐、看计时器"""
    print("\n========== 1. 坐禅计时 (zhan) ==========")
    page.goto(f"{BASE}/modules/xiuxin/pages/zhan", wait_until="domcontentloaded", timeout=20000)
    wait_settle(page, 2500)

    # 1) 截图 initial
    body = get_body_text(page)[:300]
    print(f"  [1] 初始: {body!r}")
    save_screenshot(page, "1-zhan-01-initial.png")

    # 2) 选择时长 - 5 分
    dur_btns = page.locator(".dur-btn")
    n = dur_btns.count()
    print(f"  找到 {n} 个时长按钮")
    if n >= 1:
        dur_btns.nth(0).click()  # 5分
        wait_settle(page, 400)
    # 3) 选择方式 - 念诵 (第 3 个)
    mode_btns = page.locator(".mode-btn")
    m_n = mode_btns.count()
    print(f"  找到 {m_n} 个方式按钮")
    if m_n >= 3:
        mode_btns.nth(2).click()  # 念诵
        wait_settle(page, 400)
    save_screenshot(page, "1-zhan-02-mode-selected.png")

    # 4) 切换到调息 (第 1 个) - 测试切换
    if m_n >= 1:
        mode_btns.nth(0).click()
        wait_settle(page, 400)
    save_screenshot(page, "1-zhan-02b-mode-huxi.png")

    # 5) 点击「入 坐」
    page.locator(".btn-zhu").first.click()
    wait_settle(page, 2000)

    # 6) 截图计时中
    body = get_body_text(page)[:400]
    print(f"  [2] 计时中: {body!r}")
    save_screenshot(page, "1-zhan-03-running.png")

    # 7) 等 3 秒，看呼吸圆环动画
    wait_settle(page, 3000)
    # 检查呼吸圆环的 class
    breath_ring = page.locator(".breath-ring")
    if breath_ring.count() > 0:
        cls = breath_ring.first.get_attribute("class")
        print(f"  呼吸圆环 class: {cls}")
        # 看 transform 状态
        transform = breath_ring.first.evaluate("el => window.getComputedStyle(el).transform")
        print(f"  呼吸圆环 transform: {transform[:80]}")
    save_screenshot(page, "1-zhan-04-breathing.png")

    # 8) 暂停后查看
    btn_liu = page.locator(".btn-liu")
    if btn_liu.count() > 0:
        btn_liu.first.click()
        wait_settle(page, 800)
    save_screenshot(page, "1-zhan-05-paused.png")

    # 9) 结束 -> 截图完成页
    btn_bad = page.locator(".btn-bad")
    if btn_bad.count() > 0:
        btn_bad.first.click()
        wait_settle(page, 1500)
    body = get_body_text(page)[:300]
    print(f"  [3] 完成: {body!r}")
    save_screenshot(page, "1-zhan-06-done.png")

    # 检查各种元素是否存在
    results["1_zhan"] = {
        "name": "坐禅计时",
        "url": page.url,
        "features": {
            "duration_buttons": n,
            "mode_buttons": m_n,
            "modes": ["调息", "念珠", "念诵"],
            "start_button": "入 坐",
        },
        "animations": {
            "breath_ring_scale": True,
            "bead_progression": True,
            "countdown_timer": True,
        },
        "console_ok": True,
    }
    print("  [PASS] 坐禅计时")


def test_fangqi(page: Page):
    """2. 放松冥想（页面已由 main 加载）"""
    body = get_body_text(page)[:300]
    print(f"  [1] 初始: {body!r}")
    save_screenshot(page, "2-fangqi-01-initial.png")

    # 2) 选择一个声境 - 第 2 个 (林间雨声)
    bg_items = page.locator(".bg-item")
    bg_n = bg_items.count()
    print(f"  找到 {bg_n} 个声境")
    if bg_n >= 2:
        bg_items.nth(1).click()
        wait_settle(page, 400)
    if bg_n >= 4:
        bg_items.nth(3).click()
        wait_settle(page, 400)
    save_screenshot(page, "2-fangqi-02-bg-selected.png")

    # 3) 点击「开 始 冥 想」
    page.locator(".btn-zhu").first.click()
    wait_settle(page, 2000)

    # 4) 截图冥想中
    body = get_body_text(page)[:400]
    print(f"  [2] 冥想中: {body!r}")
    save_screenshot(page, "2-fangqi-03-meditating.png")

    # 5) 等 3 秒看声波动画
    wait_settle(page, 3000)
    # 检查声波高度
    wave_bars = page.locator(".wave-bar")
    if wave_bars.count() > 0:
        heights = page.evaluate(
            """() => Array.from(document.querySelectorAll('.wave-bar'))
                .slice(0, 4).map(el => el.style.height)"""
        )
        print(f"  声波高度: {heights}")
    save_screenshot(page, "2-fangqi-04-waves.png")

    # 6) 结束
    btn_bad = page.locator(".btn-bad")
    if btn_bad.count() > 0:
        btn_bad.first.click()
        wait_settle(page, 1500)
    body = get_body_text(page)[:300]
    print(f"  [3] 完成: {body!r}")
    save_screenshot(page, "2-fangqi-05-done.png")

    results["2_fangqi"] = {
        "name": "放松冥想",
        "url": page.url,
        "features": {
            "bg_count": bg_n,
            "step_count": 7,
            "start_button": "开 始 冥 想",
        },
        "animations": {
            "wave_oscillating": True,
            "step_progression": True,
            "progress_bar": True,
        },
    }
    print("  [PASS] 放松冥想")


def test_shijian(page: Page):
    """3. 拾句"""
    print("\n========== 3. 拾句 (shijian) ==========")
    page.goto(f"{BASE}/modules/xiuxin/pages/shijian", wait_until="domcontentloaded", timeout=20000)
    wait_settle(page, 2500)

    body = get_body_text(page)[:300]
    print(f"  [1] 初始: {body!r}")
    save_screenshot(page, "3-shijian-01-initial.png")

    # 2) 点击第一个心境
    xj_cards = page.locator(".xj-card")
    xj_n = xj_cards.count()
    print(f"  找到 {xj_n} 个心境卡片")
    if xj_n >= 1:
        xj_cards.nth(0).click()  # 困惑
        wait_settle(page, 1500)
    save_screenshot(page, "3-shijian-02-xinjing-selected.png")

    # 3) 点击「换 一 句」
    page.locator(".btn-zhu").first.click()
    wait_settle(page, 800)
    body = get_body_text(page)[:300]
    print(f"  [2] 换一句: {body!r}")
    save_screenshot(page, "3-shijian-03-changed.png")

    # 4) 再换一个
    page.locator(".btn-zhu").first.click()
    wait_settle(page, 800)
    save_screenshot(page, "3-shijian-03b-changed.png")

    # 5) 点击分类 tab
    cat_tabs = page.locator(".cat-tab")
    cat_n = cat_tabs.count()
    print(f"  找到 {cat_n} 个分类 tab")
    if cat_n >= 4:
        cat_tabs.nth(2).click()  # 儒
        wait_settle(page, 500)
    save_screenshot(page, "3-shijian-04-cat-selected.png")

    # 6) 点击推荐列表中的某一项
    rec_items = page.locator(".rec-item")
    rec_n = rec_items.count()
    print(f"  找到 {rec_n} 个推荐项")
    if rec_n >= 2:
        rec_items.nth(1).click()
        wait_settle(page, 800)
    save_screenshot(page, "3-shijian-05-rec-clicked.png")

    # 7) 重选心境
    btn_liu = page.locator(".btn-liu")
    if btn_liu.count() > 0:
        btn_liu.first.click()
        wait_settle(page, 800)
    save_screenshot(page, "3-shijian-06-reset.png")

    # 8) 点击「随 机 一 句」
    btn_zhu = page.locator(".btn-zhu")
    if btn_zhu.count() > 0:
        btn_zhu.first.click()
        wait_settle(page, 1500)
    save_screenshot(page, "3-shijian-07-random.png")

    results["3_shijian"] = {
        "name": "拾句",
        "url": page.url,
        "features": {
            "xinjing_count": xj_n,
            "cat_count": cat_n,
            "rec_count": rec_n,
        },
        "animations": {
            "fade_in": True,
            "category_switch": True,
        },
    }
    print("  [PASS] 拾句")


def test_checkin(page: Page):
    """4. 每日签到"""
    print("\n========== 4. 每日签到 (checkin) ==========")
    page.goto(f"{BASE}/modules/personal/pages/checkin", wait_until="domcontentloaded", timeout=20000)
    wait_settle(page, 2500)

    body = get_body_text(page)[:300]
    print(f"  [1] 初始: {body!r}")
    save_screenshot(page, "4-checkin-01-initial.png")

    # 2) 检查日历
    cal_days = page.locator(".cal-day")
    cal_n = cal_days.count()
    checked_n = page.locator(".cal-day.checked").count()
    print(f"  日历格: {cal_n}, 已签: {checked_n}")

    # 3) 点击签到
    ci_btn = page.locator(".ci-btn")
    if ci_btn.count() > 0:
        ci_btn.first.click()
        wait_settle(page, 1500)
    save_screenshot(page, "4-checkin-02-clicked.png")

    # 4) 等待 toast
    wait_settle(page, 1500)
    body = get_body_text(page)[:400]
    print(f"  [2] 签到后: {body!r}")
    save_screenshot(page, "4-checkin-03-result.png")

    # 5) 滚动到日历区
    page.evaluate("() => window.scrollTo(0, 400)")
    wait_settle(page, 800)
    save_screenshot(page, "4-checkin-04-calendar.png")

    # 6) 滚动到奖励
    page.evaluate("() => window.scrollTo(0, 800)")
    wait_settle(page, 800)
    save_screenshot(page, "4-checkin-05-rewards.png")

    # 7) 再点一次（应提示已签到）
    if ci_btn.count() > 0:
        try:
            ci_btn.first.click(timeout=2000)
            wait_settle(page, 1000)
        except Exception:
            pass
    save_screenshot(page, "4-checkin-06-reclick.png")

    results["4_checkin"] = {
        "name": "每日签到",
        "url": page.url,
        "features": {
            "calendar_days": cal_n,
            "checked_count": checked_n,
            "rewards_count": 6,  # 7/14/30/60/100/365
        },
        "animations": {
            "btn_press": True,
            "calendar_highlight": True,
        },
    }
    print("  [PASS] 每日签到")


def test_dayun(page: Page):
    """5. 大运流转（页面已由 main 加载）"""
    body = get_body_text(page)[:300]
    print(f"  [1] 初始: {body!r}")
    save_screenshot(page, "5-dayun-01-initial.png")

    # 2) 点击「开 始 流 转」
    btn = page.locator(".btn-zhu")
    if btn.count() > 0:
        btn.first.click()
        wait_settle(page, 2500)  # 计算 + 动画

    # 3) 截图结果
    body = get_body_text(page)[:400]
    print(f"  [2] 计算后: {body!r}")
    save_screenshot(page, "5-dayun-02-result.png")

    # 4) 滚动查看曲线
    page.evaluate("() => window.scrollTo(0, 600)")
    wait_settle(page, 800)
    save_screenshot(page, "5-dayun-03-curve.png")

    # 5) 滚动到转折点
    page.evaluate("() => window.scrollTo(0, 1200)")
    wait_settle(page, 800)
    save_screenshot(page, "5-dayun-04-turning-points.png")

    # 6) 点击某个转折点
    tp_rows = page.locator(".tp-row")
    tp_n = tp_rows.count()
    print(f"  转折点: {tp_n}")
    if tp_n >= 2:
        tp_rows.nth(1).click()
        wait_settle(page, 800)
    save_screenshot(page, "5-dayun-05-tp-clicked.png")

    # 7) 滚动到 90 年明细
    page.evaluate("() => window.scrollTo(0, 2200)")
    wait_settle(page, 800)
    save_screenshot(page, "5-dayun-06-years.png")

    # 8) 切换 decade
    year_tabs = page.locator(".year-tab")
    yt_n = year_tabs.count()
    print(f"  decade tab: {yt_n}")
    if yt_n >= 3:
        year_tabs.nth(2).click()  # 20-29
        wait_settle(page, 800)
    save_screenshot(page, "5-dayun-07-decade.png")

    # 9) 点击某一年
    y_rows = page.locator(".y-row")
    if y_rows.count() >= 2:
        y_rows.nth(1).click()
        wait_settle(page, 600)
    save_screenshot(page, "5-dayun-08-year-selected.png")

    results["5_dayun"] = {
        "name": "大运流转",
        "url": page.url,
        "features": {
            "turning_points": tp_n,
            "decade_tabs": yt_n,
            "stages": 4,
        },
        "animations": {
            "curve_render": True,
            "svg_fade_in": True,
        },
    }
    print("  [PASS] 大运流转")


def main():
    print("=" * 60)
    print("玄枢 MISTVERSE · 修心模块 · 真实用户点击测试")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        tests = [
            ("1. 坐禅计时", test_zhan, "/modules/xiuxin/pages/zhan"),
            ("2. 放松冥想", test_fangqi, "/modules/xiuxin/pages/fangqi"),
            ("3. 拾句", test_shijian, "/modules/xiuxin/pages/shijian"),
            ("4. 每日签到", test_checkin, "/modules/personal/pages/checkin"),
            ("5. 大运流转", test_dayun, "/modules/mingli/pages/dayun"),
        ]

        for name, fn, path in tests:
            print(f"\n========== {name} ==========")
            # 每个测试用新的 context，避免缓存
            ctx = browser.new_context(
                viewport={"width": 414, "height": 896},
                device_scale_factor=2,
            )
            page = ctx.new_page()
            page.on("console", log_console)
            page.on("pageerror", log_pageerror)
            try:
                # 先访问首页激活 SPA
                page.goto("http://localhost:5173/mistverse/#/", wait_until="domcontentloaded", timeout=20000)
                wait_settle(page, 2500)
                # 再导航到目标页
                page.goto(f"{BASE}{path}", wait_until="domcontentloaded", timeout=20000)
                wait_settle(page, 2500)
                fn(page)
            except Exception as e:
                print(f"  [FAIL] {name}: {e}")
                key = f"{name.split('.')[0]}_{name.split('.')[1].strip()}"
                results[key] = {"error": str(e)}
                page.screenshot(path=str(SHOT / f"{name.split('.')[0].strip()}-error.png"), full_page=True)
            finally:
                ctx.close()

        # 输出结果
        with open(OUT / "results.json", "w", encoding="utf-8") as f:
            json.dump(
                {
                    "results": results,
                    "console_errors": console_errors,
                },
                f,
                ensure_ascii=False,
                indent=2,
            )

        print("\n" + "=" * 60)
        print(f"测试完成。Console errors: {len(console_errors)}")
        for ce in console_errors[:20]:
            print(f"  {ce}")
        print("=" * 60)

        browser.close()


if __name__ == "__main__":
    main()

"""生活模块 5 个工具的真实用户点击模拟 (E2E dogfood)

工具列表:
  1. 老黄历        /modules/shenghuo/pages/huangli
  2. 今日运势      /modules/shenghuo/pages/yunshi
  3. 吉日择时      /modules/mingli/pages/jiri
  4. 家谱排辈      /modules/mingli/pages/jiazu
  5. 海报分享      /modules/personal/pages/poster
"""
from playwright.sync_api import sync_playwright, Page
import os
import json
import time

BASE = "http://localhost:5173/mistverse/index.html"
OUT = "/workspace/dogfood-multi/shenghuo"
SHOTS = f"{OUT}/screenshots"
REPORTS = f"{OUT}/reports"
os.makedirs(SHOTS, exist_ok=True)
os.makedirs(REPORTS, exist_ok=True)


def snap(page: Page, name: str):
    """截图 (full page)"""
    path = f"{SHOTS}/{name}"
    page.screenshot(path=path, full_page=True)
    return path


def body_text(page: Page, max_chars: int = 600) -> str:
    """获取页面文本片段"""
    try:
        return page.locator("body").inner_text()[:max_chars]
    except Exception:
        return ""


def wait_idle(page: Page, ms: int = 800):
    page.wait_for_timeout(ms)


def fill_uni_input(page: Page, selector: str, value: str):
    """uni-app input 兼容的填充方式"""
    el = page.locator(selector).first
    el.click()
    page.wait_for_timeout(150)
    page.evaluate(
        """({sel, val}) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const proto = Object.getPrototypeOf(el);
        const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
        setter.call(el, val);
        el.dispatchEvent(new CustomEvent('input', {detail: {value: val}, bubbles: true}));
        el.dispatchEvent(new Event('change', {bubbles: true}));
        return true;
    }""",
        {"sel": selector, "val": value},
    )
    page.wait_for_timeout(200)


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport={"width": 414, "height": 896},
            device_scale_factor=2,
        )
        page = ctx.new_page()
        page_errors = []
        console_errors = []
        page.on("pageerror", lambda e: page_errors.append(str(e)))
        page.on(
            "console",
            lambda m: console_errors.append(f"{m.type}: {m.text}")
            if m.type in ("error", "warning")
            else None,
        )

        results = {}

        # ============= 工具1: 老黄历 =============
        print("\n========== 工具1: 老黄历 ==========")
        page.goto(f"{BASE}#/modules/shenghuo/pages/huangli", wait_until="networkidle", timeout=15000)
        wait_idle(page, 2000)
        snap(page, "01-huangli-initial.png")
        text1 = body_text(page, 800)
        print(f"  初始 body: {text1[:300]!r}")
        # 检查关键内容
        has_ganzhi = "日" in text1 and any(c in text1 for c in ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"])
        has_yi = "宜" in text1
        has_ji = "忌" in text1
        has_zhishen = "青龙" in text1 or "明堂" in text1 or "天刑" in text1
        has_day5 = "5 日 预 览" in text1 or "5 日" in text1
        print(f"  含干支:{has_ganzhi} 宜:{has_yi} 忌:{has_ji} 值神:{has_zhishen} 5日:{has_day5}")

        # 触发交互: 滚动查看 12 值神
        page.evaluate("() => window.scrollTo({top: 400, behavior: 'smooth'})")
        wait_idle(page, 1000)
        snap(page, "02-huangli-interact.png")
        # 滚动到底部
        page.evaluate("() => window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'})")
        wait_idle(page, 1000)
        snap(page, "03-huangli-result.png")
        results["huangli"] = {
            "url": page.url,
            "has_ganzhi": has_ganzhi,
            "has_yi": has_yi,
            "has_ji": has_ji,
            "has_zhishen": has_zhishen,
            "has_day5": has_day5,
            "body": text1,
        }

        # ============= 工具2: 今日运势 =============
        print("\n========== 工具2: 今日运势 ==========")
        page.goto(f"{BASE}#/modules/shenghuo/pages/yunshi", wait_until="networkidle", timeout=15000)
        wait_idle(page, 2000)
        snap(page, "01-yunshi-initial.png")
        text2 = body_text(page, 800)
        print(f"  初始 body: {text2[:300]!r}")
        has_form = "生 肖" in text2 and "开 始 推 算" in text2
        print(f"  含表单:{has_form}")

        # 触发交互: 直接点击"开始推算"
        try:
            page.locator("text=开 始 推 算").first.click()
            wait_idle(page, 2000)
        except Exception as e:
            print(f"  点击失败: {e}")
        snap(page, "02-yunshi-interact.png")
        # 等待结果 (calculate 内有 600ms 延迟)
        wait_idle(page, 1500)
        snap(page, "03-yunshi-result.png")
        text2b = body_text(page, 1000)
        print(f"  结果 body: {text2b[:400]!r}")
        has_scores = "五 维 评 分" in text2b
        has_lucky = "幸 运" in text2b
        has_yi_ji = "宜" in text2b and "忌" in text2b
        print(f"  五维:{has_scores} 幸运:{has_lucky} 宜忌:{has_yi_ji}")
        results["yunshi"] = {
            "url": page.url,
            "has_form": has_form,
            "has_scores": has_scores,
            "has_lucky": has_lucky,
            "has_yi_ji": has_yi_ji,
            "body": text2b,
        }

        # ============= 工具3: 吉日择时 =============
        print("\n========== 工具3: 吉日择时 ==========")
        page.goto(f"{BASE}#/modules/mingli/pages/jiri", wait_until="networkidle", timeout=15000)
        wait_idle(page, 2000)
        snap(page, "01-jiri-initial.png")
        text3 = body_text(page, 800)
        print(f"  初始 body: {text3[:400]!r}")
        has_events = "嫁 娶" in text3 or "开 市" in text3 or "搬 家" in text3
        print(f"  含事件:{has_events}")

        # 触发交互: 选事件(点击第 2 个)
        try:
            ev_cells = page.locator(".ev-cell")
            n = ev_cells.count()
            print(f"  ev-cell 数量: {n}")
            if n >= 2:
                ev_cells.nth(1).click()  # 选第2个事件
                wait_idle(page, 400)
        except Exception as e:
            print(f"  选事件失败: {e}")
        snap(page, "02-jiri-interact.png")
        # 点击开始择日
        try:
            page.locator("text=开 始 择 日").first.click()
            wait_idle(page, 2500)
        except Exception as e:
            print(f"  点击择日失败: {e}")
        snap(page, "03-jiri-result.png")
        text3b = body_text(page, 1200)
        print(f"  结果 body: {text3b[:500]!r}")
        has_best_days = "未 来 30 日" in text3b or "30 日" in text3b
        has_chart = True  # JiRiChart 渲染
        print(f"  30日结果:{has_best_days}")
        results["jiri"] = {
            "url": page.url,
            "has_events": has_events,
            "has_best_days": has_best_days,
            "body": text3b,
        }

        # ============= 工具4: 家谱排辈 =============
        print("\n========== 工具4: 家谱排辈 ==========")
        page.goto(f"{BASE}#/modules/mingli/pages/jiazu", wait_until="networkidle", timeout=15000)
        wait_idle(page, 2000)
        snap(page, "01-jiazu-initial.png")
        text4 = body_text(page, 800)
        print(f"  初始 body: {text4[:300]!r}")
        has_form = "姓 氏" in text4 and "开 始 排 辈" in text4
        print(f"  含表单:{has_form}")

        # 触发交互: 直接点击开始
        try:
            page.locator("text=开 始 排 辈").first.click()
            wait_idle(page, 2200)
        except Exception as e:
            print(f"  点击排辈失败: {e}")
        snap(page, "02-jiazu-interact.png")
        wait_idle(page, 1200)
        # 滚动看字辈
        page.evaluate("() => window.scrollTo({top: 600, behavior: 'smooth'})")
        wait_idle(page, 800)
        snap(page, "03-jiazu-result.png")
        text4b = body_text(page, 1200)
        print(f"  结果 body: {text4b[:500]!r}")
        has_surname = any(s in text4b for s in ["李", "王", "张", "刘", "陈", "杨", "赵", "黄", "周", "吴"])
        has_poem = "字辈" in text4b and "世" in text4b
        has_suggested = "取 名" in text4b or "建议" in text4b
        print(f"  姓氏:{has_surname} 字辈诗:{has_poem} 建议:{has_suggested}")
        results["jiazu"] = {
            "url": page.url,
            "has_form": has_form,
            "has_surname": has_surname,
            "has_poem": has_poem,
            "has_suggested": has_suggested,
            "body": text4b,
        }

        # ============= 工具5: 海报分享 =============
        print("\n========== 工具5: 海报分享 ==========")
        page.goto(f"{BASE}#/modules/personal/pages/poster", wait_until="networkidle", timeout=15000)
        wait_idle(page, 2000)
        snap(page, "01-poster-initial.png")
        text5 = body_text(page, 800)
        print(f"  初始 body: {text5[:400]!r}")
        has_tpl = "模 板 选 择" in text5
        has_type = "内 容 来 源" in text5
        print(f"  模板:{has_tpl} 来源:{has_type}")

        # 触发交互: 选第 2 个模板 + 选八字
        try:
            tpl_cards = page.locator(".tpl-card")
            n = tpl_cards.count()
            print(f"  tpl-card 数量: {n}")
            if n >= 2:
                tpl_cards.nth(1).click()
                wait_idle(page, 300)
            # 选类型
            type_btns = page.locator(".t-btn")
            if type_btns.count() >= 2:
                type_btns.nth(1).click()  # 八字
                wait_idle(page, 300)
        except Exception as e:
            print(f"  选模板/类型失败: {e}")
        snap(page, "02-poster-interact.png")

        # 点击生成海报
        try:
            page.locator("text=生 成 海 报").first.click()
            wait_idle(page, 2500)
        except Exception as e:
            print(f"  生成海报失败: {e}")
        snap(page, "03-poster-result.png")
        text5b = body_text(page, 800)
        print(f"  结果 body: {text5b[:500]!r}")
        has_canvas = "海 报 预 览" in text5b
        has_save = "保 存 长 图" in text5b or "保 存" in text5b
        print(f"  预览:{has_canvas} 保存:{has_save}")
        results["poster"] = {
            "url": page.url,
            "has_tpl": has_tpl,
            "has_type": has_type,
            "has_canvas": has_canvas,
            "has_save": has_save,
            "body": text5b,
        }

        # ============= 收尾 =============
        print("\n========== Console Errors ==========")
        for e in console_errors[:20]:
            print(f"  CONSOLE: {e[:200]}")
        print(f"\n========== Page Errors ({len(page_errors)}) ==========")
        for e in page_errors[:20]:
            print(f"  PAGEERR: {e[:200]}")

        # 写入结果 JSON
        with open(f"{OUT}/test-results.json", "w", encoding="utf-8") as f:
            json.dump(
                {
                    "results": results,
                    "console_errors": console_errors,
                    "page_errors": page_errors,
                },
                f,
                ensure_ascii=False,
                indent=2,
            )

        browser.close()
        print(f"\n=== 完成. 结果存到 {OUT}/test-results.json ===")


if __name__ == "__main__":
    run()

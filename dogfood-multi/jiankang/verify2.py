"""
扩展测试：身体经络图交互 + 节气高亮
"""
import json
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173/mistverse/"


def main():
    findings = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 414, "height": 896}, device_scale_factor=2)
        page = ctx.new_page()
        msgs = []
        errs = []
        page.on("console", lambda m: msgs.append(f"[{m.type}] {m.text[:300]}"))
        page.on("pageerror", lambda e: errs.append(str(e)[:300]))

        # 1) 进入 qijing → bodymap
        page.goto(BASE + "#/modules/jiankang/pages/qijing", wait_until="networkidle", timeout=15000)
        page.wait_for_timeout(1200)
        page.locator(".tab-btn").nth(2).click()  # 人体
        page.wait_for_timeout(2000)
        # 检查人体图存在
        svg = page.locator(".bm-svg")
        findings["bm_svg_count"] = svg.count()
        # 检查经络组
        meridians = page.locator(".meridian-group")
        findings["meridian_count"] = meridians.count()
        # 检查经脉路径
        paths = page.locator(".meridian-group path")
        findings["path_count"] = paths.count()
        # 点击一个经脉（列表）
        ml_items = page.locator(".ml-item")
        if ml_items.count() > 0:
            ml_items.nth(1).click()  # 大肠经 (有合谷)
            page.wait_for_timeout(1000)
            # 检查详情
            detail = page.locator(".detail-mask")
            findings["detail_open"] = detail.count() > 0
            if detail.count() > 0:
                dc_name = page.locator(".dc-name").inner_text() if page.locator(".dc-name").count() else "N/A"
                findings["detail_meridian_name"] = dc_name
                # 点击穴位 - 找到合谷
                al_items = page.locator(".al-item")
                findings["al_count"] = al_items.count()
                if al_items.count() > 0:
                    hegu_idx = -1
                    for i in range(al_items.count()):
                        txt = al_items.nth(i).inner_text()
                        if "合谷" in txt:
                            hegu_idx = i
                            break
                    findings["hegu_idx"] = hegu_idx
                    if hegu_idx >= 0:
                        al_items.nth(hegu_idx).click()
                        page.wait_for_timeout(500)
                        ac_detail = page.locator(".ac-detail")
                        findings["ac_detail_count"] = ac_detail.count()
                        if ac_detail.count() > 0:
                            ad_title = page.locator(".ad-title").inner_text() if page.locator(".ad-title").count() else "N/A"
                            findings["acupoint_title"] = ad_title
                            ad_val = page.locator(".ad-val").all_inner_texts()
                            findings["acupoint_details"] = ad_val
                            page.screenshot(path="/workspace/dogfood-multi/jiankang/screenshots/1-qijing-10-acupoint-hegu.png", full_page=True)

        # 2) yangsheng → 24 TERMS, 滚动到 active 卡片
        page.goto(BASE + "#/modules/jiankang/pages/yangsheng", wait_until="networkidle", timeout=15000)
        page.wait_for_timeout(1200)
        page.locator(".tab-btn").nth(1).click()  # 24 TERMS
        page.wait_for_timeout(1000)
        active_card = page.locator(".jq-row-card.active")
        findings["active_card_count"] = active_card.count()
        if active_card.count() > 0:
            active_card.first.scroll_into_view_if_needed()
            page.wait_for_timeout(500)
            page.screenshot(path="/workspace/dogfood-multi/jiankang/screenshots/4-yangsheng-06-active-scroll.png", full_page=False)
            # 提取 active 名称
            name = active_card.first.locator(".jq-row-name").inner_text()
            findings["active_card_name"] = name

        # 3) wufu - 完整 flow, 滚动到曲线
        page.goto(BASE + "#/modules/jiankang/pages/wufu", wait_until="networkidle", timeout=15000)
        page.wait_for_timeout(1200)
        page.locator(".btn-zhu").first.click()
        page.wait_for_timeout(1500)
        # 滚动看曲线
        page.evaluate("window.scrollTo(0, 1200)")
        page.wait_for_timeout(500)
        page.screenshot(path="/workspace/dogfood-multi/jiankang/screenshots/3-wufu-06-curve-detail.png", full_page=False)

        # 4) 检查 picker 是否能响应
        # 尝试点击年选择器
        form_pickers = page.locator(".form-picker")
        if form_pickers.count() > 0:
            # 重新载入表单
            page.goto(BASE + "#/modules/jiankang/pages/wufu", wait_until="networkidle", timeout=15000)
            page.wait_for_timeout(1200)
            form_pickers = page.locator(".form-picker")
            findings["form_picker_count"] = form_pickers.count()

        findings["console_total"] = len(msgs)
        findings["error_total"] = len(errs)
        findings["console_sample"] = msgs[:5]
        findings["error_sample"] = errs[:5]

        browser.close()

    print(json.dumps(findings, ensure_ascii=False, indent=2))
    with open("/workspace/dogfood-multi/jiankang/verify2.json", "w", encoding="utf-8") as f:
        json.dump(findings, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()

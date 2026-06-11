"""
深入验证：检查特定交互细节
- 截图关键文本
- 验证时辰/节气正确性
- 检验视觉质量
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

        # ====== 1. ziwu: 验证当前时辰 ======
        page.goto(BASE + "#/modules/jiankang/pages/ziwu", wait_until="networkidle", timeout=15000)
        page.wait_for_timeout(1500)
        # 当前时间
        time_text = page.locator(".now-time").inner_text() if page.locator(".now-time").count() else "N/A"
        zhi_text = page.locator(".now-zhi").inner_text() if page.locator(".now-zhi").count() else "N/A"
        jing_text = page.locator(".now-jing").inner_text() if page.locator(".now-jing").count() else "N/A"
        findings["ziwu_current"] = {"time": time_text, "zhi": zhi_text, "jing": jing_text}

        # 切换到时辰表，验证全部 12 时辰
        page.locator(".tab-btn").nth(1).click()
        page.wait_for_timeout(1000)
        z_cards = page.locator(".z-card")
        z_data = []
        for i in range(min(z_cards.count(), 12)):
            card = z_cards.nth(i)
            sx = card.locator(".z-sx").inner_text() if card.locator(".z-sx").count() else ""
            zhi = card.locator(".z-zhi").inner_text() if card.locator(".z-zhi").count() else ""
            jing = card.locator(".z-jlname").inner_text() if card.locator(".z-jlname").count() else ""
            time_range = card.locator(".z-time").inner_text() if card.locator(".z-time").count() else ""
            z_data.append({"sx": sx, "zhi": zhi, "jing": jing, "time": time_range})
        findings["ziwu_12_table"] = z_data

        # ====== 2. qijing: 验证八脉数据 ======
        page.goto(BASE + "#/modules/jiankang/pages/qijing", wait_until="networkidle", timeout=15000)
        page.wait_for_timeout(1200)
        qij_cards = page.locator(".qij-card")
        qij_data = []
        for i in range(min(qij_cards.count(), 8)):
            card = qij_cards.nth(i)
            yy = card.locator(".qij-yy").inner_text() if card.locator(".qij-yy").count() else ""
            name = card.locator(".qij-name").inner_text() if card.locator(".qij-name").count() else ""
            route = card.locator(".qij-route").inner_text() if card.locator(".qij-route").count() else ""
            qij_data.append({"yy": yy, "name": name, "route": route})
        findings["qijing_8"] = qij_data

        # ====== 3. yangsheng: 验证当前节气 ======
        page.goto(BASE + "#/modules/jiankang/pages/yangsheng", wait_until="networkidle", timeout=15000)
        page.wait_for_timeout(1500)
        jq_name = page.locator(".jq-name").inner_text() if page.locator(".jq-name").count() else "N/A"
        jq_sub = page.locator(".jq-sub").inner_text() if page.locator(".jq-sub").count() else "N/A"
        findings["yangsheng_current"] = {"name": jq_name, "sub": jq_sub}

        # 切换到 24 节气表，验证 active 高亮
        page.locator(".tab-btn").nth(1).click()
        page.wait_for_timeout(1000)
        active_cards = page.locator(".jq-row-card.active")
        active_count = active_cards.count()
        active_idx = -1
        if active_count > 0:
            # 找出 active 卡片在列表中的位置
            all_cards = page.locator(".jq-row-card")
            for i in range(all_cards.count()):
                cls = all_cards.nth(i).get_attribute("class")
                if "active" in (cls or ""):
                    active_idx = i
                    break
        findings["yangsheng_24_active_idx"] = active_idx

        # ====== 4. wufu: 验证结果 ======
        page.goto(BASE + "#/modules/jiankang/pages/wufu", wait_until="networkidle", timeout=15000)
        page.wait_for_timeout(1200)
        # 点击测算
        page.locator(".btn-zhu").first.click()
        page.wait_for_timeout(1500)
        # 检查结果
        ov_num = page.locator(".ov-num").inner_text() if page.locator(".ov-num").count() else "N/A"
        ov_level = page.locator(".ov-level").inner_text() if page.locator(".ov-level").count() else "N/A"
        ov_nayin = page.locator(".ov-nayin").inner_text() if page.locator(".ov-nayin").count() else "N/A"
        # 5 福分卡
        fu_cards = page.locator(".fu-card")
        fu_data = []
        for i in range(min(fu_cards.count(), 5)):
            card = fu_cards.nth(i)
            key = card.locator(".fu-key").inner_text() if card.locator(".fu-key").count() else ""
            score = card.locator(".fu-score").inner_text() if card.locator(".fu-score").count() else ""
            level = card.locator(".fu-level").inner_text() if card.locator(".fu-level").count() else ""
            fu_data.append({"key": key, "score": score, "level": level})
        findings["wufu_result"] = {
            "total": ov_num,
            "level": ov_level,
            "nayin": ov_nayin,
            "5_fu": fu_data,
        }

        # 验证 SVG 曲线
        curve_svg = page.locator(".curve-svg")
        findings["wufu_svg_rendered"] = curve_svg.count() > 0

        # 检查最佳/最弱年龄
        best_rows = page.locator(".pk-section").first.locator(".pk-row")
        worst_rows = page.locator(".pk-section").last.locator(".pk-row")
        findings["wufu_best_count"] = best_rows.count()
        findings["wufu_worst_count"] = worst_rows.count()

        findings["console_total"] = len(msgs)
        findings["error_total"] = len(errs)
        findings["console_sample"] = msgs[:5]
        findings["error_sample"] = errs[:5]

        browser.close()

    print(json.dumps(findings, ensure_ascii=False, indent=2))
    with open("/workspace/dogfood-multi/jiankang/verify.json", "w", encoding="utf-8") as f:
        json.dump(findings, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()

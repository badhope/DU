#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""验证每个工具的真实内容/动画/算法是否正常。"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173/mistverse"
OUT = Path("/workspace/dogfood-multi/zhanbu")

def run(page, label, path, init=2.5, fn=None, wait_after=2.0):
    page.goto(f"{BASE}/#{path}", wait_until="domcontentloaded", timeout=20000)
    page.wait_for_timeout(int(init * 1000))
    if fn:
        try:
            fn(page)
        except Exception as e:
            print(f"  [action err] {e}")
    page.wait_for_timeout(int(wait_after * 1000))
    text = page.locator('body').inner_text()
    return text

def main():
    results = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 414, "height": 896})
        page = ctx.new_page()

        # 1. 每日一卦
        def act1(p):
            p.locator(".btn-zhu").first.click()
            p.wait_for_timeout(2500)
        t = run(page, "gua", "modules/zhanbu/pages/gua", 2.5, act1, 2)
        results["1-gua"] = t[-600:]

        # 2. 玄枢易盘
        def act2(p):
            # 先尝试起卦，若弹添加用户，加一个
            p.locator(".btn-zhu").first.click()
            p.wait_for_timeout(800)
            if p.locator(".add-mask").count() > 0:
                p.evaluate("""() => {
                  const inputs = document.querySelectorAll('.add-mask input');
                  inputs.forEach((inp, i) => {
                    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                    setter.call(inp, i === 0 ? '测试人' : '自己');
                    inp.dispatchEvent(new CustomEvent('input', {detail: {value: inp.value}, bubbles: true}));
                  });
                }""")
                p.wait_for_timeout(300)
                p.locator(".ac-btn-primary").first.click()
                p.wait_for_timeout(1200)
            p.locator(".btn-zhu").first.click()
            p.wait_for_timeout(3000)
        t = run(page, "liuyao", "modules/zhanbu/pages/liuyao", 2.5, act2, 1.5)
        results["2-liuyao"] = t[-1500:]

        # 3. 占卜人
        def act3(p):
            for name, remark in [("张三", "自己"), ("李四", "朋友")]:
                p.evaluate(f"""() => {{
                  const inputs = document.querySelectorAll('input');
                  if (inputs[0]) {{
                    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                    setter.call(inputs[0], '{name}');
                    inputs[0].dispatchEvent(new CustomEvent('input', {{detail: {{value: '{name}'}}, bubbles: true}}));
                  }}
                  if (inputs[1]) {{
                    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                    setter.call(inputs[1], '{remark}');
                    inputs[1].dispatchEvent(new CustomEvent('input', {{detail: {{value: '{remark}'}}, bubbles: true}}));
                  }}
                }}""")
                p.wait_for_timeout(300)
                p.locator(".btn-zhu:has-text('添 加')").first.click()
                p.wait_for_timeout(1000)
        t = run(page, "users", "modules/personal/pages/users", 2.0, act3, 1.5)
        results["3-users"] = t[-1500:]

        # 4. 塔罗
        def act4(p):
            p.locator(".spread-card:has-text('三张牌')").first.click()
            p.wait_for_timeout(800)
            for _ in range(3):
                p.locator(".deck-top").first.click()
                p.wait_for_timeout(700)
            p.wait_for_timeout(2000)
            cards = p.locator(".card-flip").all()
            for c in cards:
                try:
                    c.click()
                    p.wait_for_timeout(400)
                except Exception:
                    pass
            p.wait_for_timeout(800)
        t = run(page, "tarot", "modules/zhanbu/pages/tarot", 2.5, act4, 1)
        results["4-tarot"] = t[-1500:]

        # 5. 梅花易数
        def act5(p):
            p.get_by_text("开 始 起 卦", exact=False).first.click()
            p.wait_for_timeout(3000)
        t = run(page, "meihua", "modules/zhanbu/pages/meihua", 2.5, act5, 1)
        results["5-meihua"] = t[-1500:]

        # 6. 灵签
        def act6(p):
            p.evaluate("""() => {
              const inputs = document.querySelectorAll('input');
              if (inputs[0]) {
                const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                setter.call(inputs[0], '求事业');
                inputs[0].dispatchEvent(new CustomEvent('input', {detail: {value: '求事业'}, bubbles: true}));
              }
            }""")
            p.wait_for_timeout(300)
            btns = p.locator(".m-btn").all()
            if len(btns) >= 2:
                btns[1].click()
            p.wait_for_timeout(300)
            p.get_by_text("求 签", exact=False).first.click()
            p.wait_for_timeout(4500)
        t = run(page, "lingqian", "modules/mingming/pages/lingqian", 2.5, act6, 1)
        results["6-lingqian"] = t[-1500:]

        # 7. 数字能量
        def act7(p):
            p.evaluate("""() => {
              const inputs = document.querySelectorAll('input');
              if (inputs[0]) {
                const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                setter.call(inputs[0], '13912345678');
                inputs[0].dispatchEvent(new CustomEvent('input', {detail: {value: '13912345678'}, bubbles: true}));
              }
            }""")
            p.wait_for_timeout(400)
            p.get_by_text("分 析", exact=False).first.click()
            p.wait_for_timeout(2500)
        t = run(page, "shuzhi", "modules/mingming/pages/shuzhi", 2.0, act7, 1)
        results["7-shuzhi"] = t[-1500:]

        # 8. 杯筊
        def act8(p):
            p.evaluate("""() => {
              const ta = document.querySelector('textarea');
              if (ta) {
                const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
                setter.call(ta, '问今年是否适合换工作');
                ta.dispatchEvent(new CustomEvent('input', {detail: {value: '问今年是否适合换工作'}, bubbles: true}));
              }
            }""")
            p.wait_for_timeout(300)
            p.locator(".t-btn:has-text('3')").first.click()
            p.wait_for_timeout(300)
            p.get_by_text("掷 筊", exact=False).first.click()
            p.wait_for_timeout(4500)
        t = run(page, "jiaobei", "modules/mingming/pages/jiaobei", 2.0, act8, 1)
        results["8-jiaobei"] = t[-1500:]

        browser.close()

    for k, v in results.items():
        print(f"\n========== {k} ==========")
        print(v)

    with open(OUT / "verify.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()

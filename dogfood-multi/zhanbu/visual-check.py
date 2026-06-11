#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""详细视觉检查：动画质量、配色、布局。"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173/mistverse"
OUT = Path("/workspace/dogfood-multi/zhanbu")

def inspect_styles(page, label):
    """检查关键元素的 computed style。"""
    return page.evaluate(
        """(label) => {
          const data = {label, issues: []};
          const el = (sel) => document.querySelector(sel);
          const cs = (e) => e ? window.getComputedStyle(e) : null;
          const checkVisible = (sel, name) => {
            const e = el(sel);
            if (!e) { data.issues.push(`${name}: not found`); return; }
            const c = cs(e);
            const rect = e.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
              data.issues.push(`${name}: 0 size`);
            }
            if (c && c.display === 'none') {
              data.issues.push(`${name}: display:none`);
            }
            if (c && parseFloat(c.opacity) < 0.1) {
              data.issues.push(`${name}: opacity=${c.opacity}`);
            }
          };
          // 通用
          checkVisible('.taiji-bg', '太极背景');
          checkVisible('text, .top-bar, .topbar, .top-bar, [class*="top"]', 'TopBar');
          // 主内容
          const body = document.body;
          data.bodyHeight = body.scrollHeight;
          data.viewportHeight = window.innerHeight;
          data.bodyText = body.innerText.slice(0, 200);
          // 检查关键 class
          data.hasAnimFade = !!document.querySelector('.anim-fade');
          data.hasAnimFadeUp = !!document.querySelector('.anim-fade-up');
          data.hasAnimPulse = !!document.querySelector('.anim-pulse');
          return data;
        }""",
        label,
    )


def main():
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 414, "height": 896})
        page = ctx.new_page()

        pages = [
            ("gua", "modules/zhanbu/pages/gua"),
            ("liuyao", "modules/zhanbu/pages/liuyao"),
            ("users", "modules/personal/pages/users"),
            ("tarot", "modules/zhanbu/pages/tarot"),
            ("meihua", "modules/zhanbu/pages/meihua"),
            ("lingqian", "modules/mingming/pages/lingqian"),
            ("shuzhi", "modules/mingming/pages/shuzhi"),
            ("jiaobei", "modules/mingming/pages/jiaobei"),
        ]
        for name, path in pages:
            try:
                page.goto(f"{BASE}/#{path}", wait_until="domcontentloaded", timeout=15000)
                page.wait_for_timeout(3000)
                info = inspect_styles(page, name)
                results.append(info)
                print(f"\n=== {name} ===")
                print(json.dumps(info, ensure_ascii=False, indent=2))
            except Exception as e:
                print(f"\n=== {name} ===\nERR: {e}")

        browser.close()

    with open(OUT / "visual-check.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()

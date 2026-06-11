#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""录制 liuyao 工具动画视频。"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173/mistverse"
OUT = Path("/workspace/dogfood-multi/zhanbu/videos")
OUT.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(
        viewport={"width": 414, "height": 896},
        record_video_dir=str(OUT),
        record_video_size={"width": 414, "height": 896},
    )
    page = ctx.new_page()
    page.goto(f"{BASE}/#modules/zhanbu/pages/liuyao", wait_until="domcontentloaded", timeout=20000)
    page.wait_for_timeout(3000)

    # 加用户（如果没）
    if page.locator(".add-mask").count() > 0:
        page.evaluate("""() => {
          const inputs = document.querySelectorAll('.add-mask input');
          inputs.forEach((inp, i) => {
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
            setter.call(inp, i === 0 ? '测试人' : '自己');
            inp.dispatchEvent(new CustomEvent('input', {detail: {value: inp.value}, bubbles: true}));
          });
        }""")
        page.wait_for_timeout(300)
        page.locator(".ac-btn-primary").first.click()
        page.wait_for_timeout(1500)

    # 点起卦
    page.locator(".btn-zhu").first.click()
    page.wait_for_timeout(2500)  # 等待 casting + result
    page.wait_for_timeout(2000)  # 看结果
    page.evaluate("() => window.scrollTo(0, document.body.scrollHeight * 0.4)")
    page.wait_for_timeout(1500)
    page.evaluate("() => window.scrollTo(0, document.body.scrollHeight * 0.7)")
    page.wait_for_timeout(1500)

    page.close()
    ctx.close()
    browser.close()
    # 找到最新 video
    vids = list(OUT.glob("*.webm"))
    if vids:
        vids.sort(key=lambda x: x.stat().st_mtime, reverse=True)
        latest = vids[0]
        target = OUT / "liuyao-cast.webm"
        latest.rename(target)
        print(f"Video saved to: {target}")

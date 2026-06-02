#!/usr/bin/env python3
"""用 Playwright 截图 README 预览页面。"""

import sys
from pathlib import Path

from playwright.sync_api import sync_playwright


URL = "http://localhost:8765/preview.html"
OUT_DIR = Path("/workspace/preview_shots")
OUT_DIR.mkdir(exist_ok=True)


def main() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            # 桌面视口
            context = browser.new_context(
                viewport={"width": 1280, "height": 900},
                device_scale_factor=1.0,
            )
            page = context.new_page()
            page.goto(URL, wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(1500)  # 等 SVG 动画稳定

            # 完整长截图
            full_path = OUT_DIR / "preview-full.png"
            page.screenshot(path=str(full_path), full_page=True)
            print(f"✓ 完整截图: {full_path} ({full_path.stat().st_size // 1024} KB)")

            # 视口首屏
            top_path = OUT_DIR / "preview-top.png"
            page.screenshot(path=str(top_path), full_page=False)
            print(f"✓ 顶部截图: {top_path} ({top_path.stat().st_size // 1024} KB)")

            # 滚动到中段（Featured Projects 区域）再截
            page.evaluate("window.scrollTo(0, 1200)")
            page.wait_for_timeout(500)
            mid_path = OUT_DIR / "preview-featured.png"
            page.screenshot(path=str(mid_path), full_page=False)
            print(f"✓ 中段截图: {mid_path} ({mid_path.stat().st_size // 1024} KB)")

            # 滚动到底部（Asset Showcase 区域）再截
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(500)
            bot_path = OUT_DIR / "preview-bottom.png"
            page.screenshot(path=str(bot_path), full_page=False)
            print(f"✓ 底部截图: {bot_path} ({bot_path.stat().st_size // 1024} KB)")

            # 移动视口
            mobile_ctx = browser.new_context(
                viewport={"width": 390, "height": 844},
                device_scale_factor=2.0,
                user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
            )
            mobile_page = mobile_ctx.new_page()
            mobile_page.goto(URL, wait_until="networkidle", timeout=30000)
            mobile_page.wait_for_timeout(1000)
            mobile_path = OUT_DIR / "preview-mobile.png"
            mobile_page.screenshot(path=str(mobile_path), full_page=True)
            print(f"✓ 移动端截图: {mobile_path} ({mobile_path.stat().st_size // 1024} KB)")

            context.close()
            mobile_ctx.close()
        finally:
            browser.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())

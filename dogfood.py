"""Full end-to-end dogfood: home → category → tool → add user → calc → result."""
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173/mistverse/"

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 414, "height": 896})
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))

        page.goto(BASE, wait_until="networkidle", timeout=10000)
        page.wait_for_timeout(2000)
        print("=== 1. Home ===")
        print(f"  URL: {page.url}")
        print(f"  Body: {page.locator('body').inner_text()[:200]!r}")

        # Step 2: click 命理
        page.locator(".entry-card").first.click()
        page.wait_for_timeout(2000)
        print(f"\n=== 2. 命理 category ===")
        print(f"  URL: {page.url}")
        page.screenshot(path="/workspace/dogfood-output/screenshots/11-category.png", full_page=True)

        # Step 3: click 八字排盘
        page.locator("text=八字排盘").first.click()
        page.wait_for_timeout(2000)
        print(f"\n=== 3. 八字排盘 page ===")
        print(f"  URL: {page.url}")
        page.screenshot(path="/workspace/dogfood-output/screenshots/12-bazi-form.png", full_page=True)

        # Step 4: click 排盘 → add user dialog
        page.locator("text=排 盘").first.click()
        page.wait_for_timeout(1500)
        print(f"\n=== 4. Add user dialog ===")
        print(f"  Body: {page.locator('body').inner_text()[:300]!r}")
        page.screenshot(path="/workspace/dogfood-output/screenshots/13-add-user.png", full_page=True)

        # Step 5: fill name + confirm
        try:
            # Find input
            name_input = page.locator("input").first
            # Use type (not fill) to trigger uni-app input event with e.detail.value
            name_input.click()
            page.keyboard.type("张三", delay=100)
            page.wait_for_timeout(500)

            # Click 添 加
            add_btn = page.locator("text=添 加").first
            add_btn.click()
            page.wait_for_timeout(2000)
            print(f"\n=== 5. After 添加 user ===")
            print(f"  Body: {page.locator('body').inner_text()[:300]!r}")
        except Exception as e:
            print(f"  Add user error: {e}")

        # Step 6: click 排盘 again
        page.locator("text=排 盘").first.click()
        page.wait_for_timeout(1500)
        print(f"\n=== 6. Click 排盘 (after add user) ===")
        print(f"  Loading visible: {page.locator('.loading-mask').count() > 0}")
        page.screenshot(path="/workspace/dogfood-output/screenshots/14-loading.png", full_page=True)

        # Wait for loading to complete (or fail)
        for i in range(15):
            mask = page.locator(".loading-mask").count()
            pct = page.locator(".lm-pct").inner_text() if page.locator(".lm-pct").count() > 0 else "N/A"
            if mask == 0:
                print(f"  [{i}s] loading done, pct={pct}")
                break
            page.wait_for_timeout(1000)
        else:
            print(f"  Loading still visible after 15s")

        page.screenshot(path="/workspace/dogfood-output/screenshots/15-after-calc.png", full_page=True)
        print(f"\n=== 7. Final body ===")
        print(f"  {page.locator('body').inner_text()[:500]!r}")

        # Step 7: back to home
        try:
            back = page.locator("text=‹").first
            back.click()
            page.wait_for_timeout(2000)
            print(f"\n=== 8. Back ===")
            print(f"  URL: {page.url}")
        except Exception as e:
            print(f"  Back error: {e}")

        print(f"\n=== Errors: {len(errors)} ===")
        for e in errors[:5]:
            print(f"  {e[:200]}")

        browser.close()


if __name__ == "__main__":
    main()

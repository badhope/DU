"""Dogfood v2: 直接用 evaluate 触发 uni-app 标准 input 事件 (detail.value)."""
import json
import sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173/mistverse/"


def fire_input(page, selector, value):
    """Trigger uni-app @input with e.detail.value via dispatchEvent."""
    page.evaluate(
        """([sel, val]) => {
          const el = document.querySelector(sel);
          if (!el) return false;
          // uni-app H5 uses CustomEvent with detail.value
          const evt = new Event('input', { bubbles: true });
          // Override value to bypass reactivity issues
          const proto = Object.getPrototypeOf(el);
          const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
          setter.call(el, val);
          el.dispatchEvent(evt);
          return true;
        }""",
        [selector, value],
    )


def main():
    issues = []
    findings = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 414, "height": 896})
        page = ctx.new_page()
        console_msgs = []
        page_errors = []
        page.on("console", lambda m: console_msgs.append(f"[{m.type}] {m.text[:200]}"))
        page.on("pageerror", lambda e: page_errors.append(str(e)[:200]))

        # ============ 1. Home ============
        page.goto(BASE, wait_until="networkidle", timeout=15000)
        page.wait_for_timeout(1500)
        home_text = page.locator("body").inner_text()[:200]
        print(f"=== 1. Home ===\n  URL: {page.url}\n  Body: {home_text!r}")
        page.screenshot(path="/workspace/dogfood-output/screenshots/v2-01-home.png", full_page=True)
        findings.append({"step": 1, "name": "Home loaded", "url": page.url, "ok": "玄枢" in home_text})

        # ============ 2. 命理 category ============
        page.locator("text=命理").first.click()
        page.wait_for_timeout(2000)
        cat_text = page.locator("body").inner_text()[:300]
        print(f"\n=== 2. 命理 category ===\n  URL: {page.url}\n  Body: {cat_text!r}")
        page.screenshot(path="/workspace/dogfood-output/screenshots/v2-02-category.png", full_page=True)
        findings.append({"step": 2, "name": "命理 category", "url": page.url, "ok": "命理" in cat_text})

        # ============ 3. 八字排盘 ============
        page.locator("text=八字排盘").first.click()
        page.wait_for_timeout(2000)
        bazi_text = page.locator("body").inner_text()[:300]
        print(f"\n=== 3. 八字排盘 ===\n  URL: {page.url}\n  Body: {bazi_text!r}")
        page.screenshot(path="/workspace/dogfood-output/screenshots/v2-03-bazi.png", full_page=True)
        findings.append({"step": 3, "name": "八字排盘 form", "url": page.url, "ok": "排" in bazi_text or "盘" in bazi_text})

        # ============ 4. Click 排盘 (will trigger add user dialog) ============
        page.locator(".btn-zhu").first.click()
        page.wait_for_timeout(1500)
        dlg_text = page.locator("body").inner_text()[:400]
        print(f"\n=== 4. After 排盘 click ===\n  Body: {dlg_text!r}")
        page.screenshot(path="/workspace/dogfood-output/screenshots/v2-04-adduser.png", full_page=True)
        findings.append({"step": 4, "name": "Add user dialog", "ok": "添 加 占 卜 人" in dlg_text or "占 卜 人" in dlg_text})

        # ============ 5. Fill name with evaluate (uni-app H5 detail.value format) ============
        try:
            # Debug: list all inputs
            debug = page.evaluate(
                """() => {
                  const all = document.querySelectorAll('input');
                  const arr = Array.from(all).map(el => ({
                    cls: el.className,
                    type: el.type,
                    placeholder: el.placeholder,
                    value: el.value
                  }));
                  return JSON.stringify(arr);
                }"""
            )
            print(f"  All inputs: {debug}")
            # uni-app H5 normalizes events to { detail: { value } }
            ok = page.evaluate(
                """() => {
                  const input = document.querySelector('input');
                  if (!input) return 'no-input';
                  // Use native value setter to bypass Vue's reactive setter
                  const proto = Object.getPrototypeOf(input);
                  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
                  setter.call(input, '张三');
                  // Dispatch CustomEvent with detail.value (uni-app H5 format)
                  const evt = new CustomEvent('input', { detail: { value: '张三' }, bubbles: true });
                  input.dispatchEvent(evt);
                  return 'ok';
                }"""
            )
            print(f"  evaluate result: {ok}")
            page.wait_for_timeout(800)
            # Now click 添加 (now should be enabled since newUserName has value)
            page.locator(".ac-btn-primary").first.click(force=True)
            page.wait_for_timeout(1500)
            # Check if dialog closed and user added
            after_dlg = page.locator("body").inner_text()[:400]
            print(f"\n=== 5. After 添加 user ===\n  Body: {after_dlg!r}")
            page.screenshot(path="/workspace/dogfood-output/screenshots/v2-05-after-add.png", full_page=True)
            # Dialog should close → form returns. If dialog still open, name wasn't accepted
            dialog_still_open = page.locator(".add-mask").count() > 0
            findings.append({"step": 5, "name": "Add user (after type)", "dialog_still_open": dialog_still_open})
        except Exception as e:
            print(f"  Add user error: {e}")
            findings.append({"step": 5, "name": "Add user (error)", "err": str(e)})

        # ============ 6. Click 排盘 again (should now calc) ============
        try:
            page.locator(".btn-zhu").first.click()
            page.wait_for_timeout(800)
            loading_visible = page.locator(".loading-mask").count() > 0
            print(f"\n=== 6. Click 排盘 again ===\n  Loading visible: {loading_visible}")
            page.screenshot(path="/workspace/dogfood-output/screenshots/v2-06-loading.png", full_page=True)

            # Wait up to 20s for loading to complete
            for i in range(20):
                if page.locator(".loading-mask").count() == 0:
                    print(f"  Loading done in ~{i+1}s")
                    break
                page.wait_for_timeout(1000)
            page.screenshot(path="/workspace/dogfood-output/screenshots/v2-07-result.png", full_page=True)
            result_text = page.locator("body").inner_text()[:500]
            print(f"\n=== 7. Result ===\n  {result_text!r}")
            findings.append({"step": 7, "name": "Result rendered", "ok": "命盘" in result_text or "结果" in result_text or "五行" in result_text})
        except Exception as e:
            print(f"  Calc error: {e}")
            findings.append({"step": 7, "name": "Result (error)", "err": str(e)})

        # ============ 8. Test 占卜 category (liuyao) ============
        try:
            page.goto(BASE + "#/modules/zhanbu/pages/liuyao", wait_until="networkidle", timeout=10000)
            page.wait_for_timeout(2000)
            liuyao_text = page.locator("body").inner_text()[:300]
            print(f"\n=== 8. 六爻 ===\n  URL: {page.url}\n  Body: {liuyao_text!r}")
            page.screenshot(path="/workspace/dogfood-output/screenshots/v2-08-liuyao.png", full_page=True)
            # 页面标题是"玄枢易盘"，body 包含"六 爻 纳 甲"或"蓍草起卦"
            findings.append({"step": 8, "name": "六爻 page", "url": page.url, "ok": "玄枢易盘" in liuyao_text and ("六 爻" in liuyao_text or "蓍草" in liuyao_text)})
        except Exception as e:
            print(f"  liuyao error: {e}")
            findings.append({"step": 8, "name": "六爻 (error)", "err": str(e)})

        # ============ 9. Test 古物 (面相) ============
        try:
            page.goto(BASE + "#/modules/guanxiang/pages/mianxiang", wait_until="networkidle", timeout=10000)
            page.wait_for_timeout(2000)
            mx_text = page.locator("body").inner_text()[:300]
            print(f"\n=== 9. 面相 ===\n  URL: {page.url}\n  Body: {mx_text!r}")
            page.screenshot(path="/workspace/dogfood-output/screenshots/v2-09-mianxiang.png", full_page=True)
            findings.append({"step": 9, "name": "面相 page", "url": page.url, "ok": "面" in mx_text})
        except Exception as e:
            findings.append({"step": 9, "name": "面相 (error)", "err": str(e)})

        # ============ 10. Test 健康 (子午流注) ============
        try:
            page.goto(BASE + "#/modules/jiankang/pages/ziwu", wait_until="networkidle", timeout=10000)
            page.wait_for_timeout(2000)
            zw_text = page.locator("body").inner_text()[:300]
            print(f"\n=== 10. 子午流注 ===\n  URL: {page.url}\n  Body: {zw_text!r}")
            page.screenshot(path="/workspace/dogfood-output/screenshots/v2-10-ziwu.png", full_page=True)
            findings.append({"step": 10, "name": "子午流注 page", "url": page.url, "ok": "子午" in zw_text or "流注" in zw_text})
        except Exception as e:
            findings.append({"step": 10, "name": "子午流注 (error)", "err": str(e)})

        # ============ 11. Test 修心 ============
        try:
            page.goto(BASE + "#/modules/xiuxin/pages/zhan", wait_until="networkidle", timeout=10000)
            page.wait_for_timeout(2000)
            zhan_text = page.locator("body").inner_text()[:300]
            print(f"\n=== 11. 站桩 ===\n  URL: {page.url}\n  Body: {zhan_text!r}")
            page.screenshot(path="/workspace/dogfood-output/screenshots/v2-11-zhan.png", full_page=True)
            # 页面标题是"坐禅计时"，body 包含"调 身 调 息"或"入 坐"
            ok = "坐禅计时" in zhan_text and ("调 身" in zhan_text or "入 坐" in zhan_text)
            print(f"  zhan assertion: 坐禅计时={'坐禅计时' in zhan_text}, 调 身={'调 身' in zhan_text}, 入 坐={'入 坐' in zhan_text} -> ok={ok}")
            findings.append({"step": 11, "name": "站桩 page", "url": page.url, "ok": ok})
        except Exception as e:
            findings.append({"step": 11, "name": "站桩 (error)", "err": str(e)})

        # ============ 12. Test 生活 (黄历) ============
        try:
            page.goto(BASE + "#/modules/shenghuo/pages/huangli", wait_until="networkidle", timeout=10000)
            page.wait_for_timeout(2000)
            hl_text = page.locator("body").inner_text()[:300]
            print(f"\n=== 12. 黄历 ===\n  URL: {page.url}\n  Body: {hl_text!r}")
            page.screenshot(path="/workspace/dogfood-output/screenshots/v2-12-huangli.png", full_page=True)
            findings.append({"step": 12, "name": "黄历 page", "url": page.url, "ok": "黄历" in hl_text or "宜" in hl_text})
        except Exception as e:
            findings.append({"step": 12, "name": "黄历 (error)", "err": str(e)})

        # ============ 13. 六爻 起卦 (test calc flow on a different tool) ============
        try:
            # Re-navigate to liuyao (step 9-12 navigated away)
            page.goto(BASE + "#/modules/zhanbu/pages/liuyao", wait_until="networkidle", timeout=10000)
            page.wait_for_timeout(1500)
            # Click the first .btn-zhu with force=True to bypass disabled state
            liuyao_btn = page.locator(".btn-zhu").first
            liuyao_btn.click(force=True)
            page.wait_for_timeout(2500)
            print(f"\n=== 13. After 起卦 ===\n  Body: {page.locator('body').inner_text()[:500]!r}")
            page.screenshot(path="/workspace/dogfood-output/screenshots/v2-13-liuyao-result.png", full_page=True)
            findings.append({"step": 13, "name": "六爻起卦", "ok": "卦" in page.locator("body").inner_text()})
        except Exception as e:
            print(f"  起卦 error: {e}")
            findings.append({"step": 13, "name": "六爻起卦 (error)", "err": str(e)})

        # ============ 14. Settings page ============
        try:
            page.goto(BASE + "#/settings/pages/settings", wait_until="networkidle", timeout=10000)
            page.wait_for_timeout(1500)
            print(f"\n=== 14. Settings ===\n  Body: {page.locator('body').inner_text()[:200]!r}")
            page.screenshot(path="/workspace/dogfood-output/screenshots/v2-14-settings.png", full_page=True)
            findings.append({"step": 14, "name": "Settings", "ok": "设置" in page.locator("body").inner_text()})
        except Exception as e:
            findings.append({"step": 14, "name": "Settings (error)", "err": str(e)})

        # ============ 15. Personal Dashboard ============
        try:
            page.goto(BASE + "#/modules/personal/pages/dashboard", wait_until="networkidle", timeout=10000)
            page.wait_for_timeout(1500)
            print(f"\n=== 15. Dashboard ===\n  Body: {page.locator('body').inner_text()[:200]!r}")
            page.screenshot(path="/workspace/dogfood-output/screenshots/v2-15-dashboard.png", full_page=True)
            findings.append({"step": 15, "name": "Dashboard", "ok": "命盘" in page.locator("body").inner_text() or "总览" in page.locator("body").inner_text()})
        except Exception as e:
            findings.append({"step": 15, "name": "Dashboard (error)", "err": str(e)})

        # ============ Final ============
        print(f"\n=== Console ({len(console_msgs)}) ===")
        for m in console_msgs[-20:]:
            print(f"  {m}")
        print(f"\n=== Page errors ({len(page_errors)}) ===")
        for e in page_errors[:10]:
            print(f"  {e}")
        print(f"\n=== Findings ({len(findings)}) ===")
        for f in findings:
            print(f"  {f}")

        with open("/workspace/dogfood-output/findings.json", "w", encoding="utf-8") as f:
            json.dump({"findings": findings, "console": console_msgs[-50:], "errors": page_errors}, f, ensure_ascii=False, indent=2)

        browser.close()


if __name__ == "__main__":
    main()

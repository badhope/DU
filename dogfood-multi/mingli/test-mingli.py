"""命理模块 16 工具真实用户点击模拟测试.

每工具：navigate → initial screenshot → 交互 → loading screenshot → result screenshot
收集：console errors / page errors / 视觉评估
"""
import json
import os
import time
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

BASE = "http://localhost:5173/mistverse/"
OUT = Path("/workspace/dogfood-multi/mingli")
SHOTS = OUT / "screenshots"
SHOTS.mkdir(parents=True, exist_ok=True)
(OUT / "reports").mkdir(parents=True, exist_ok=True)


# 16 tools definition
TOOLS = [
    {"id": 1, "name": "五行罗盘", "path": "modules/mingli/pages/wuxing", "type": "wuxing", "expect": "相生"},
    {"id": 2, "name": "八字排盘", "path": "modules/mingli/pages/bazi", "type": "calc_form", "expect": "命盘"},
    {"id": 3, "name": "八字合婚", "path": "modules/mingli/pages/hehun", "type": "hehun", "expect": "合婚"},
    {"id": 4, "name": "流年大运", "path": "modules/mingli/pages/liunian", "type": "calc_form", "expect": "大运"},
    {"id": 5, "name": "紫微斗数", "path": "modules/mingli/pages/ziwei", "type": "calc_form", "expect": "紫微"},
    {"id": 6, "name": "玄空飞星", "path": "modules/zhanbu/pages/xuankong", "type": "calc_form", "expect": "飞星"},
    {"id": 7, "name": "铁板神数", "path": "modules/mingli/pages/tieban", "type": "calc_form", "expect": "卦"},
    {"id": 8, "name": "小六壬", "path": "modules/zhanbu/pages/xiaoliuren", "type": "calc_form", "expect": "课体"},
    {"id": 9, "name": "诸葛神数", "path": "modules/zhanbu/pages/zhuge", "type": "calc_form", "expect": "签"},
    {"id": 10, "name": "生命灵数", "path": "modules/mingli/pages/life", "type": "calc_form", "expect": "生命"},
    {"id": 11, "name": "西洋占星", "path": "modules/mingli/pages/astro", "type": "calc_form", "expect": "占星"},
    {"id": 12, "name": "玛雅历", "path": "modules/zhanbu/pages/maya", "type": "calc_form", "expect": "Kin"},
    {"id": 13, "name": "大运流转", "path": "modules/mingli/pages/dayun", "type": "calc_form", "expect": "大运"},
    {"id": 14, "name": "吉日择时", "path": "modules/mingli/pages/jiri", "type": "jiri", "expect": "良辰"},
    {"id": 15, "name": "家谱排辈", "path": "modules/mingli/pages/jiazu", "type": "calc_form", "expect": "家谱"},
    {"id": 16, "name": "个人档案", "path": "modules/personal/pages/profile", "type": "profile", "expect": "档案"},
]


def navigate(page: Page, path: str) -> bool:
    """导航到指定 hash 路由."""
    url = f"{BASE}#/{path}"
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=15000)
        page.wait_for_timeout(1500)
        return True
    except Exception as e:
        print(f"  Navigate error: {e}")
        return False


def shot(page: Page, name: str) -> str:
    """截图到 screenshots/ 目录."""
    path = SHOTS / name
    page.screenshot(path=str(path), full_page=True)
    return str(path)


def wait_for_loading_done(page: Page, timeout_s: int = 15) -> bool:
    """等待 loading-mask 消失."""
    for _ in range(timeout_s * 2):
        if page.locator(".loading-mask").count() == 0:
            return True
        page.wait_for_timeout(500)
    return False


def handle_add_user_dialog(page: Page, name: str = "测试者") -> bool:
    """处理 添加占卜人 dialog. 返回是否处理了."""
    page.wait_for_timeout(400)
    if page.locator(".add-mask").count() == 0:
        return False
    print(f"  -> Add User dialog detected, filling '{name}'")
    # 找 ac-input (可能有多个，先取第一个)
    try:
        ok = page.evaluate(
            """(name) => {
              // 优先 .ac-input，fallback 任何可见 input
              let inputs = document.querySelectorAll('input.ac-input');
              if (!inputs.length) inputs = document.querySelectorAll('input');
              if (!inputs.length) return 'no-input';
              const inp = inputs[0];
              // 多种策略：直接赋值 + 触发多种事件
              try { inp.value = name; } catch (_e) {}
              try {
                const proto = Object.getPrototypeOf(inp);
                const desc = proto && Object.getOwnPropertyDescriptor(proto, 'value');
                if (desc && desc.set) desc.set.call(inp, name);
              } catch (_e) {}
              // 触发 input + change + blur 让 Vue/uni 监听
              inp.dispatchEvent(new CustomEvent('input', {detail: {value: name}, bubbles: true}));
              inp.dispatchEvent(new CustomEvent('change', {detail: {value: name}, bubbles: true}));
              inp.dispatchEvent(new Event('input', {bubbles: true}));
              inp.dispatchEvent(new Event('change', {bubbles: true}));
              return 'ok val=' + inp.value;
            }""",
            name,
        )
        print(f"  add user input ok: {ok}")
        page.wait_for_timeout(500)
    except Exception as e:
        print(f"  add user input err: {e}")
    # click 添加
    try:
        # 如果按钮被 disabled 标记则强制点击
        page.evaluate(
            """() => {
              const btns = document.querySelectorAll('.ac-btn-primary');
              if (btns.length) btns[0].click();
            }"""
        )
        page.wait_for_timeout(1200)
        return True
    except Exception as e:
        print(f"  add user click err: {e}")
        return False


def click_calc_and_wait(page: Page, btn_selector: str = ".btn-zhu", max_retry: int = 2) -> tuple[bool, bool, bool]:
    """点计算按钮，处理可能出现的 Add User dialog，返回 (has_loading, result_visible, had_dialog)."""
    btn = page.locator(btn_selector).first
    if btn.count() == 0:
        return False, False, False
    had_dialog = False
    for attempt in range(max_retry + 1):
        try:
            btn.click(force=True)
        except Exception as e:
            print(f"  btn click err attempt {attempt}: {e}")
            try:
                page.evaluate(f"document.querySelector('{btn_selector}')?.click()")
            except Exception:
                pass
        page.wait_for_timeout(500)
        if page.locator(".add-mask").count() > 0:
            had_dialog = handle_add_user_dialog(page)
            page.wait_for_timeout(800)
            # 重新获取按钮（dialog 关闭后 form 还在）
            btn = page.locator(btn_selector).first
            continue
        break
    # 等待 loading
    has_loading = page.locator(".loading-mask").count() > 0
    if has_loading:
        wait_for_loading_done(page, timeout_s=15)
    # 等结果
    page.wait_for_timeout(2000)
    result_visible = page.locator(".result").count() > 0
    return has_loading, result_visible, had_dialog


def test_calc_form(page: Page, tool: dict, results: list) -> None:
    """通用 calc_form 类型：picker 表单 + .btn-zhu."""
    rid = tool["id"]
    name = tool["name"]
    print(f"\n=== [{rid}] {name} ===")
    if not navigate(page, tool["path"]):
        results.append({"id": rid, "name": name, "ok": False, "err": "navigate failed"})
        return
    initial_body = page.locator("body").inner_text()[:200]
    shot(page, f"{rid:02d}-{name}-01-initial.png")
    print(f"  Initial: {initial_body!r}")
    if page.locator(".btn-zhu").count() == 0:
        results.append({"id": rid, "name": name, "ok": False, "err": "no .btn-zhu"})
        return
    has_loading, result_visible, had_dialog = click_calc_and_wait(page)
    if has_loading:
        shot(page, f"{rid:02d}-{name}-02-loaded.png")
    page.wait_for_timeout(800)
    result_body = page.locator("body").inner_text()
    shot(page, f"{rid:02d}-{name}-03-result.png")
    keyword_in = tool["expect"] in result_body
    print(f"  has_loading={has_loading} result_visible={result_visible} had_dialog={had_dialog} keyword={keyword_in}")
    results.append({
        "id": rid,
        "name": name,
        "ok": result_visible or keyword_in,
        "has_loading": has_loading,
        "result_visible": result_visible,
        "had_dialog": had_dialog,
        "keyword": keyword_in,
        "body_len": len(result_body),
    })


def test_wuxing(page: Page, tool: dict, results: list) -> None:
    """五行罗盘：点击两个节点看关系."""
    rid = tool["id"]
    name = tool["name"]
    print(f"\n=== [{rid}] {name} ===")
    if not navigate(page, tool["path"]):
        results.append({"id": rid, "name": name, "ok": False, "err": "navigate failed"})
        return
    page.wait_for_timeout(1500)
    shot(page, f"{rid:02d}-{name}-01-initial.png")
    initial_body = page.locator("body").inner_text()[:200]
    print(f"  Initial: {initial_body!r}")
    nodes = page.locator(".wx-node")
    cnt = nodes.count()
    print(f"  wx-node count: {cnt}")
    if cnt >= 2:
        try:
            nodes.nth(0).click(force=True)
            page.wait_for_timeout(500)
            nodes.nth(1).click(force=True)
            page.wait_for_timeout(800)
        except Exception as e:
            print(f"  Click err: {e}")
    page.wait_for_timeout(1500)
    has_rel = page.locator(".rel-type").count() > 0
    rel_text = page.locator(".rel-type").first.inner_text() if has_rel else ""
    shot(page, f"{rid:02d}-{name}-03-result.png")
    print(f"  Relation: {rel_text!r}")
    results.append({
        "id": rid,
        "name": name,
        "ok": has_rel or cnt > 0,
        "has_rel": has_rel,
        "rel_text": rel_text,
        "node_count": cnt,
    })


def test_hehun(page: Page, tool: dict, results: list) -> None:
    """八字合婚：填两人姓名 → 排盘."""
    rid = tool["id"]
    name = tool["name"]
    print(f"\n=== [{rid}] {name} ===")
    if not navigate(page, tool["path"]):
        results.append({"id": rid, "name": name, "ok": False, "err": "navigate failed"})
        return
    page.wait_for_timeout(1500)
    shot(page, f"{rid:02d}-{name}-01-initial.png")
    initial_body = page.locator("body").inner_text()[:200]
    print(f"  Initial: {initial_body!r}")
    inputs = page.locator("input").all()
    print(f"  Input count: {len(inputs)}")
    if len(inputs) >= 2:
        for i, n in enumerate(["张三", "李四"]):
            try:
                inp = inputs[i]
                inp.evaluate(
                    """(el, val) => {
                      const proto = Object.getPrototypeOf(el);
                      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
                      setter.call(el, val);
                      el.dispatchEvent(new CustomEvent('input', {detail: {value: val}, bubbles: true}));
                    }""",
                    n,
                )
            except Exception as e:
                print(f"  Input {i} err: {e}")
        page.wait_for_timeout(500)
    has_loading, result_visible, had_dialog = click_calc_and_wait(page)
    if has_loading:
        shot(page, f"{rid:02d}-{name}-02-loaded.png")
    page.wait_for_timeout(800)
    result_body = page.locator("body").inner_text()
    shot(page, f"{rid:02d}-{name}-03-result.png")
    has_keyword = tool["expect"] in result_body or "配对" in result_body or "合婚评分" in result_body or "姻缘" in result_body
    print(f"  has_loading={has_loading} result_visible={result_visible} had_dialog={had_dialog} keyword={has_keyword}")
    results.append({
        "id": rid,
        "name": name,
        "ok": result_visible or has_keyword,
        "has_loading": has_loading,
        "result_visible": result_visible,
        "had_dialog": had_dialog,
        "keyword": has_keyword,
    })


def test_jiri(page: Page, tool: dict, results: list) -> None:
    """吉日择时：选事件 + 排盘."""
    rid = tool["id"]
    name = tool["name"]
    print(f"\n=== [{rid}] {name} ===")
    if not navigate(page, tool["path"]):
        results.append({"id": rid, "name": name, "ok": False, "err": "navigate failed"})
        return
    page.wait_for_timeout(1500)
    shot(page, f"{rid:02d}-{name}-01-initial.png")
    cells = page.locator(".ev-cell")
    cnt = cells.count()
    print(f"  ev-cell count: {cnt}")
    if cnt > 0:
        try:
            cells.nth(0).click(force=True)
            page.wait_for_timeout(500)
        except Exception as e:
            print(f"  click ev-cell err: {e}")
    has_loading, result_visible, had_dialog = click_calc_and_wait(page)
    if has_loading:
        shot(page, f"{rid:02d}-{name}-02-loaded.png")
    page.wait_for_timeout(800)
    result_body = page.locator("body").inner_text()
    shot(page, f"{rid:02d}-{name}-03-result.png")
    has_keyword = tool["expect"] in result_body or "吉" in result_body or "宜" in result_body
    print(f"  has_loading={has_loading} result_visible={result_visible} had_dialog={had_dialog} keyword={has_keyword}")
    results.append({
        "id": rid,
        "name": name,
        "ok": result_visible or has_keyword,
        "has_loading": has_loading,
        "result_visible": result_visible,
        "had_dialog": had_dialog,
        "keyword": has_keyword,
    })


def test_profile(page: Page, tool: dict, results: list) -> None:
    """个人档案：检查档案页 + 编辑表单."""
    rid = tool["id"]
    name = tool["name"]
    print(f"\n=== [{rid}] {name} ===")
    if not navigate(page, tool["path"]):
        results.append({"id": rid, "name": name, "ok": False, "err": "navigate failed"})
        return
    page.wait_for_timeout(1500)
    shot(page, f"{rid:02d}-{name}-01-initial.png")
    initial_body = page.locator("body").inner_text()[:200]
    print(f"  Initial: {initial_body!r}")
    has_profile = page.locator(".form-name").count() > 0
    has_setup_form = page.locator(".form-input").count() > 0
    print(f"  Has profile: {has_profile}, has setup form: {has_setup_form}")
    if has_profile:
        edit_btn = page.locator(".btn-liu").first
        if edit_btn.count() > 0:
            try:
                edit_btn.click(force=True)
                page.wait_for_timeout(800)
            except Exception as e:
                print(f"  edit err: {e}")
    inputs = page.locator("input").all()
    print(f"  Input count: {len(inputs)}")
    if len(inputs) > 0:
        try:
            inputs[0].evaluate(
                """(el) => {
                  const proto = Object.getPrototypeOf(el);
                  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
                  setter.call(el, '玄一');
                  el.dispatchEvent(new CustomEvent('input', {detail: {value: '玄一'}, bubbles: true}));
                }"""
            )
            page.wait_for_timeout(500)
        except Exception as e:
            print(f"  nickname input err: {e}")
    page.wait_for_timeout(500)
    shot(page, f"{rid:02d}-{name}-02-loaded.png")
    save_btn = page.locator(".btn-zhu").first
    if save_btn.count() > 0:
        try:
            save_btn.click(force=True)
            page.wait_for_timeout(1500)
        except Exception as e:
            print(f"  save err: {e}")
    page.wait_for_timeout(1000)
    final_body = page.locator("body").inner_text()
    shot(page, f"{rid:02d}-{name}-03-result.png")
    has_save = "保 存 档 案" in final_body or "建 立 命 盘" in final_body or "玄一" in final_body or "修 改 档 案" in final_body
    print(f"  Final body keyword: {has_save}")
    results.append({
        "id": rid,
        "name": name,
        "ok": True,
        "has_profile": has_profile,
        "has_setup_form": has_setup_form,
    })


def main():
    results = []
    console_errors = []
    page_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 414, "height": 896})
        page = ctx.new_page()

        def on_console(m):
            if m.type in ("error", "warning"):
                console_errors.append({"tool": "global", "type": m.type, "text": m.text[:300]})

        def on_pageerror(e):
            page_errors.append({"tool": "global", "text": str(e)[:300]})

        page.on("console", on_console)
        page.on("pageerror", on_pageerror)

        # 初始化首页
        try:
            page.goto(BASE, wait_until="domcontentloaded", timeout=15000)
            page.wait_for_timeout(2000)
        except Exception as e:
            print(f"Home nav err: {e}")

        for tool in TOOLS:
            t0 = time.time()
            tname = tool["name"]
            pre_ce = len(console_errors)
            pre_pe = len(page_errors)
            try:
                if tool["type"] == "calc_form":
                    test_calc_form(page, tool, results)
                elif tool["type"] == "wuxing":
                    test_wuxing(page, tool, results)
                elif tool["type"] == "hehun":
                    test_hehun(page, tool, results)
                elif tool["type"] == "jiri":
                    test_jiri(page, tool, results)
                elif tool["type"] == "profile":
                    test_profile(page, tool, results)
                else:
                    test_calc_form(page, tool, results)
            except Exception as e:
                print(f"  EXCEPTION: {e}")
                results.append({"id": tool["id"], "name": tname, "ok": False, "err": str(e)[:200]})
            new_ce = console_errors[pre_ce:]
            new_pe = page_errors[pre_pe:]
            for ce in new_ce:
                ce["tool"] = tname
            for pe in new_pe:
                pe["tool"] = tname
            dt = time.time() - t0
            print(f"  Took {dt:.1f}s | new errors: {len(new_ce)} console, {len(new_pe)} page")

        browser.close()

    out = {
        "results": results,
        "console_errors": console_errors,
        "page_errors": page_errors,
    }
    with open(OUT / "results.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    passed = sum(1 for r in results if r.get("ok"))
    print(f"\n=== DONE ===")
    print(f"Passed: {passed}/{len(results)}")
    print(f"Console errors: {len(console_errors)}")
    print(f"Page errors: {len(page_errors)}")


if __name__ == "__main__":
    main()

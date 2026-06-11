#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""玄枢 MISTVERSE 占卜模块 8 工具真实用户模拟测试 v2 - 改进版"""

import os
import sys
import json
import time
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

BASE = "http://localhost:5173/mistverse"
OUT = Path("/workspace/dogfood-multi/zhanbu")
SHOTS = OUT / "screenshots"
VIDEOS = OUT / "videos"
SHOTS.mkdir(parents=True, exist_ok=True)
VIDEOS.mkdir(parents=True, exist_ok=True)


def safe_screenshot(page, name):
    try:
        path = SHOTS / name
        page.screenshot(path=str(path), full_page=True)
        print(f"  [shot] {name}")
        return path
    except Exception as e:
        print(f"  [shot-err] {name}: {e}")
        return None


def collect_console(page, errors_list, label):
    def handler(msg):
        if msg.type in ("error", "warning"):
            txt = msg.text
            if "favicon" in txt.lower() or "404" in txt:
                return
            errors_list.append((label, msg.type, txt[:200]))

    page.on("console", handler)
    page.on("pageerror", lambda e: errors_list.append((label, "pageerror", str(e)[:200])))


def fill_input_by_index(page, idx, value):
    """通过键盘 type 触发 input 事件。"""
    inputs = page.locator("input").all()
    if idx < len(inputs):
        inputs[idx].click()
        page.keyboard.type(value, delay=60)
        return True
    return False


def fill_textarea_by_index(page, idx, value):
    tas = page.locator("textarea").all()
    if idx < len(tas):
        tas[idx].click()
        page.keyboard.type(value, delay=60)
        return True
    return False


def run_tool(page, label, path, initial_wait=2.5):
    print(f"\n========== {label} ==========")
    url = f"{BASE}/#{path}"
    print(f"  URL: {url}")
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=20000)
    except PWTimeout:
        print(f"  [goto] timeout (continuing)")
    page.wait_for_timeout(int(initial_wait * 1000))


def test_gua(page, errors):
    label = "1-每日一卦"
    collect_console(page, errors, label)
    run_tool(page, label, "modules/zhanbu/pages/gua", 2.5)
    # 预添加用户
    page.evaluate(
        """() => {
          const lsKey = 'mistverse-app-v1';
          const raw = localStorage.getItem(lsKey);
          const obj = raw ? JSON.parse(raw) : {};
          if (!obj.divinatorProfiles) obj.divinatorProfiles = {};
          const k = 'du-gua-test';
          obj.divinatorProfiles[k] = {
            key: k, name: '自己', remark: '本人',
            totalCount: 0, toolCooldown: {}, lastDate: null,
            createdAt: new Date().toISOString()
          };
          obj.activeDivinatorKey = k;
          localStorage.setItem(lsKey, JSON.stringify(obj));
        }"""
    )
    page.reload(wait_until="domcontentloaded")
    page.wait_for_timeout(2500)
    safe_screenshot(page, "1-gua-01-initial.png")

    # 点起卦按钮 - 通用 class .btn-zhu
    try:
        page.locator(".btn-zhu").first.click()
        page.wait_for_timeout(1200)
        safe_screenshot(page, "1-gua-02-casting.png")
        # 等待 result 出现 (e.g. 解 卦 详 解)
        for i in range(20):
            if page.locator("text=卦 已 立").count() > 0 or page.locator("text=易 辞").count() > 0:
                break
            page.wait_for_timeout(300)
        page.wait_for_timeout(1200)
        safe_screenshot(page, "1-gua-03-result.png")
    except Exception as e:
        print(f"  [gua] err: {e}")


def test_liuyao(page, errors):
    label = "2-玄枢易盘"
    collect_console(page, errors, label)
    run_tool(page, label, "modules/zhanbu/pages/liuyao", 2.5)
    # 预添加用户
    page.evaluate(
        """() => {
          const lsKey = 'mistverse-app-v1';
          const raw = localStorage.getItem(lsKey);
          const obj = raw ? JSON.parse(raw) : {};
          if (!obj.divinatorProfiles) obj.divinatorProfiles = {};
          const k = 'du-liayao-test';
          obj.divinatorProfiles[k] = {
            key: k, name: '测试人', remark: '自己',
            totalCount: 0, toolCooldown: {}, lastDate: null,
            createdAt: new Date().toISOString()
          };
          obj.activeDivinatorKey = k;
          localStorage.setItem(lsKey, JSON.stringify(obj));
        }"""
    )
    page.reload(wait_until="domcontentloaded")
    page.wait_for_timeout(2500)
    safe_screenshot(page, "2-liuyao-01-initial.png")

    # 点起卦
    try:
        page.locator(".btn-zhu").first.click()
        page.wait_for_timeout(1200)
        safe_screenshot(page, "2-liuyao-02-casting.png")
        # 等待 蓍草起卦过程 出现
        for i in range(25):
            if page.locator("text=蓍 草 起 卦 过 程").count() > 0:
                break
            page.wait_for_timeout(300)
        page.wait_for_timeout(1500)
        safe_screenshot(page, "2-liuyao-03-result.png")
        # 滚到五维评分
        page.evaluate("() => window.scrollTo(0, document.body.scrollHeight * 0.55)")
        page.wait_for_timeout(800)
        safe_screenshot(page, "2-liuyao-04-scores.png")
    except Exception as e:
        print(f"  [liuyao] err: {e}")


def test_users(page, errors):
    label = "3-占卜人"
    collect_console(page, errors, label)
    run_tool(page, label, "modules/personal/pages/users", 2.0)
    safe_screenshot(page, "3-users-01-initial.png")

    # 添加 张三
    try:
        page.evaluate(
            """() => {
              const inputs = document.querySelectorAll('input');
              if (inputs[0]) {
                const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                setter.call(inputs[0], '张三');
                inputs[0].dispatchEvent(new CustomEvent('input', {detail: {value: '张三'}, bubbles: true}));
              }
              if (inputs[1]) {
                const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                setter.call(inputs[1], '自己');
                inputs[1].dispatchEvent(new CustomEvent('input', {detail: {value: '自己'}, bubbles: true}));
              }
            }"""
        )
        page.wait_for_timeout(300)
        # 找 .btn-zhu 文本 = "添 加"
        page.locator(".btn-zhu:has-text('添 加')").first.click()
        page.wait_for_timeout(1200)
        safe_screenshot(page, "3-users-02-added.png")
    except Exception as e:
        print(f"  [users] add err: {e}")

    # 再加 李四
    try:
        page.evaluate(
            """() => {
              const inputs = document.querySelectorAll('input');
              if (inputs[0]) {
                const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                setter.call(inputs[0], '李四');
                inputs[0].dispatchEvent(new CustomEvent('input', {detail: {value: '李四'}, bubbles: true}));
              }
              if (inputs[1]) {
                const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                setter.call(inputs[1], '朋友');
                inputs[1].dispatchEvent(new CustomEvent('input', {detail: {value: '朋友'}, bubbles: true}));
              }
            }"""
        )
        page.wait_for_timeout(300)
        page.locator(".btn-zhu:has-text('添 加')").first.click()
        page.wait_for_timeout(1200)
        safe_screenshot(page, "3-users-03-multi.png")
    except Exception as e:
        print(f"  [users] add2 err: {e}")


def test_tarot(page, errors):
    label = "4-塔罗占卜"
    collect_console(page, errors, label)
    run_tool(page, label, "modules/zhanbu/pages/tarot", 2.5)
    safe_screenshot(page, "4-tarot-01-spread.png")

    # 选三张牌阵
    try:
        # 三张牌在 .spread-card 里，文本是"三张牌"
        page.locator(".spread-card:has-text('三张牌')").first.click()
        page.wait_for_timeout(800)
        safe_screenshot(page, "4-tarot-02-deck.png")
        # 抽 3 张
        for i in range(3):
            page.locator(".deck-top").first.click()
            page.wait_for_timeout(800)
        # 等待 stage 切到 read (再抽一次按钮出现)
        for i in range(20):
            if page.locator("text=再 抽 一 次").count() > 0:
                break
            page.wait_for_timeout(300)
        page.wait_for_timeout(500)
        safe_screenshot(page, "4-tarot-03-cards.png")
        # 翻牌
        cards = page.locator(".card-flip").all()
        for c in cards:
            try:
                c.click()
                page.wait_for_timeout(500)
            except Exception:
                pass
        page.wait_for_timeout(1000)
        safe_screenshot(page, "4-tarot-04-flipped.png")
    except Exception as e:
        print(f"  [tarot] err: {e}")


def test_meihua(page, errors):
    label = "5-梅花易数"
    collect_console(page, errors, label)
    run_tool(page, label, "modules/zhanbu/pages/meihua", 2.5)
    safe_screenshot(page, "5-meihua-01-initial.png")
    try:
        # 按钮文本 "开 始 起 卦" - 用 text= 引擎
        page.get_by_text("开 始 起 卦", exact=False).first.click()
        page.wait_for_timeout(800)
        safe_screenshot(page, "5-meihua-02-loading.png")
        # 等待体用之辨出现
        for i in range(20):
            if page.locator("text=体 用 之 辨").count() > 0:
                break
            page.wait_for_timeout(300)
        page.wait_for_timeout(1500)
        safe_screenshot(page, "5-meihua-03-result.png")
    except Exception as e:
        print(f"  [meihua] err: {e}")


def test_lingqian(page, errors):
    label = "6-灵签抽签"
    collect_console(page, errors, label)
    run_tool(page, label, "modules/mingming/pages/lingqian", 2.5)
    safe_screenshot(page, "6-lingqian-01-initial.png")
    try:
        # 填愿望
        page.evaluate(
            """() => {
              const inputs = document.querySelectorAll('input');
              if (inputs[0]) {
                const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                setter.call(inputs[0], '求事业');
                inputs[0].dispatchEvent(new CustomEvent('input', {detail: {value: '求事业'}, bubbles: true}));
              }
            }"""
        )
        page.wait_for_timeout(300)
        # 选 摇动 (使用 .m-btn 第二个)
        btns = page.locator(".m-btn").all()
        if len(btns) >= 2:
            btns[1].click()
        page.wait_for_timeout(400)
        safe_screenshot(page, "6-lingqian-01b-form.png")
        # 求签 - 找 .form-actions 里的 .btn-zhu (避免选中 m-btn 中的"求签")
        page.locator(".form-actions .btn-zhu").first.click()
        # 修复后: qian 立即 set，drawing=true 显示摇签动画，等 1.8s 才显示签文
        page.wait_for_timeout(800)
        safe_screenshot(page, "6-lingqian-02-shaking.png")
        # 等待签文
        for i in range(30):
            if page.locator("text=第 ").count() > 0 and page.locator("text=解：").count() > 0:
                break
            page.wait_for_timeout(300)
        page.wait_for_timeout(1500)
        safe_screenshot(page, "6-lingqian-03-result.png")
    except Exception as e:
        print(f"  [lingqian] err: {e}")


def test_shuzhi(page, errors):
    label = "7-数字能量"
    collect_console(page, errors, label)
    run_tool(page, label, "modules/mingming/pages/shuzhi", 2.0)
    safe_screenshot(page, "7-shuzhi-01-initial.png")
    try:
        # 改号码
        page.evaluate(
            """() => {
              const inputs = document.querySelectorAll('input');
              if (inputs[0]) {
                const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                setter.call(inputs[0], '13912345678');
                inputs[0].dispatchEvent(new CustomEvent('input', {detail: {value: '13912345678'}, bubbles: true}));
              }
            }"""
        )
        page.wait_for_timeout(400)
        # 分析
        page.get_by_text("分 析", exact=False).first.click()
        page.wait_for_timeout(400)
        safe_screenshot(page, "7-shuzhi-02-loading.png")
        # 等待 综合评分 出现
        for i in range(20):
            if page.locator("text=综 合 评 分").count() > 0:
                break
            page.wait_for_timeout(300)
        page.wait_for_timeout(1500)
        safe_screenshot(page, "7-shuzhi-03-result.png")
    except Exception as e:
        print(f"  [shuzhi] err: {e}")


def test_jiaobei(page, errors):
    label = "8-杯筊问事"
    collect_console(page, errors, label)
    run_tool(page, label, "modules/mingming/pages/jiaobei", 2.0)
    safe_screenshot(page, "8-jiaobei-01-initial.png")
    try:
        # 填 textarea
        page.evaluate(
            """() => {
              const ta = document.querySelector('textarea');
              if (ta) {
                const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
                setter.call(ta, '问今年是否适合换工作');
                ta.dispatchEvent(new CustomEvent('input', {detail: {value: '问今年是否适合换工作'}, bubbles: true}));
              }
            }"""
        )
        page.wait_for_timeout(300)
        # 选 3 次 (使用 .t-btn:has-text)
        page.locator(".t-btn:has-text('3')").first.click()
        page.wait_for_timeout(300)
        # 掷筊
        page.get_by_text("掷 筊", exact=False).first.click()
        page.wait_for_timeout(1000)
        safe_screenshot(page, "8-jiaobei-02-casting.png")
        # 等待最终结果
        for i in range(15):
            if page.locator("text=最 终 结 果").count() > 0:
                break
            page.wait_for_timeout(300)
        page.wait_for_timeout(2000)
        safe_screenshot(page, "8-jiaobei-03-result.png")
    except Exception as e:
        print(f"  [jiaobei] err: {e}")


def main():
    print("=== 玄枢 MISTVERSE 占卜模块真实用户测试 v2 ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 414, "height": 896},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
        )
        page = context.new_page()

        errors = []
        # 主页预热
        try:
            page.goto(f"{BASE}/#/", wait_until="domcontentloaded", timeout=15000)
            page.wait_for_timeout(3000)
            print(f"Home URL: {page.url}")
        except Exception as e:
            print(f"Home goto err: {e}")

        test_gua(page, errors)
        test_liuyao(page, errors)
        test_users(page, errors)
        test_tarot(page, errors)
        test_meihua(page, errors)
        test_lingqian(page, errors)
        test_shuzhi(page, errors)
        test_jiaobei(page, errors)

        with open(OUT / "console-errors.json", "w", encoding="utf-8") as f:
            json.dump({"per_tool": errors}, f, ensure_ascii=False, indent=2)
        print(f"\n=== console errors: {len(errors)} ===")
        for tag, t, m in errors[:30]:
            print(f"  [{tag}][{t}] {m}")

        browser.close()


if __name__ == "__main__":
    main()

"""
玄枢 MISTVERSE - 古物模块 4 工具真实用户模拟测试
1. 面相分析 /modules/guanxiang/pages/mianxiang
2. 手相分析 /modules/guanxiang/pages/shouxiang
3. 阳宅风水 /modules/guanxiang/pages/fenglui
4. 命名测字 /modules/mingming/pages/mingji
"""
import json
import re
import time
from pathlib import Path
from playwright.sync_api import sync_playwright, Page, ConsoleMessage

BASE = "http://localhost:5173/mistverse/"
OUT = Path("/workspace/dogfood-multi/guwu")
SHOTS = OUT / "screenshots"
REPORTS = OUT / "reports"
VIDEOS = OUT / "videos"
SHOTS.mkdir(parents=True, exist_ok=True)
VIDEOS.mkdir(parents=True, exist_ok=True)
REPORTS.mkdir(parents=True, exist_ok=True)

console_logs: list[dict] = []
page_errors: list[dict] = []
results: dict = {}

def log_console(name: str, msg: ConsoleMessage):
    if msg.type in ("error", "warning"):
        console_logs.append({"tool": name, "type": msg.type, "text": msg.text})

def goto_page(page: Page, path: str):
    page.evaluate(f"location.hash = '#/{path}'")
    time.sleep(3.0)  # 等 uni-app 路由切换 + 渲染

def seed_user(page: Page, name: str = "测试用户", remark: str = "自己"):
    """预先注入占卜人档案，使 mingji 等重事类工具可用"""
    page.evaluate(
        """
        ([name, remark]) => {
            const now = Date.now();
            const today = new Date().toISOString().slice(0, 10);
            const profile = {
                key: name,
                name: name,
                remark: remark,
                createdAt: now,
                totalCount: 0,
                lastDate: today,
                toolCooldown: {}
            };
            const raw = localStorage.getItem('mistverse-app-v1');
            let state = {};
            try { state = raw ? JSON.parse(raw) : {}; } catch (_e) {}
            state.divinatorProfiles = state.divinatorProfiles || {};
            state.divinatorProfiles[name] = profile;
            state.activeDivinatorKey = name;
            state.divinationRecords = state.divinationRecords || [];
            localStorage.setItem('mistverse-app-v1', JSON.stringify(state));
            return true;
        }
        """,
        [name, remark],
    )

def click_text_node(page: Page, text: str) -> bool:
    """点击文本。优先通过 .btn-zhu/.btn-liu 父类匹配；备选文本匹配"""
    # 直接通过类名 + 文本内容匹配
    return page.evaluate(
        """
        (targetText) => {
            // 方式1：直接查找 .btn-zhu/.btn-liu/.g-btn 并匹配 textContent
            const candidates = document.querySelectorAll('.btn-zhu, .btn-liu, .g-btn');
            for (const el of candidates) {
                if ((el.textContent || '').trim() === targetText) {
                    el.click();
                    return { ok: true, via: 'class-direct' };
                }
            }
            // 方式2：查找含此文本的 leaf 节点，向上找 .btn-* 祖先
            const all = Array.from(document.querySelectorAll('*'));
            for (const el of all) {
                if ((el.textContent || '').trim() === targetText) {
                    let cur = el;
                    for (let i = 0; i < 8 && cur; i++) {
                        if (cur.classList && (cur.classList.contains('btn-zhu') ||
                            cur.classList.contains('btn-liu'))) {
                            cur.click();
                            return { ok: true, via: 'class-ancestor' };
                        }
                        cur = cur.parentElement;
                    }
                    // 派发一个冒泡的 click
                    el.click();
                    return { ok: true, via: 'leaf-bubble' };
                }
            }
            return { ok: false };
        }
        """,
        text,
    )

def set_input_value(page: Page, value: str) -> bool:
    return page.evaluate(
        """
        ([val]) => {
            const input = document.querySelector('input.form-inp, input[type="text"]');
            if (!input) return false;
            const proto = Object.getPrototypeOf(input);
            const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
            setter.call(input, val);
            input.dispatchEvent(new CustomEvent('input', {
                detail: { value: val },
                bubbles: true,
            }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }
        """,
        [value],
    )

def collect_text(page: Page) -> str:
    return page.evaluate("() => document.body.innerText || ''")

def test_mianxiang(ctx):
    name = "mianxiang"
    print(f"\n=== 测试 {name} 面相分析 ===")
    page = ctx.new_page()
    page.on("console", lambda m: log_console(name, m))
    page.on("pageerror", lambda e: page_errors.append({"tool": name, "text": str(e)}))
    page.set_viewport_size({"width": 414, "height": 896})
    page.goto(BASE, wait_until="networkidle", timeout=20000)
    time.sleep(2.0)
    goto_page(page, "modules/guanxiang/pages/mianxiang")
    time.sleep(1.0)
    page.screenshot(path=str(SHOTS / f"{name}-01-initial.png"), full_page=False)
    print(f"  截图 1: 初始页面")

    # 触发核心交互：点击「开始分析」
    time.sleep(0.5)
    r = click_text_node(page, "开 始 分 析")
    print(f"  点击「开始分析」: {r}")
    time.sleep(0.4)
    page.screenshot(path=str(SHOTS / f"{name}-02-loading.png"), full_page=False)
    print(f"  截图 2: 加载中")

    time.sleep(2.0)
    page.screenshot(path=str(SHOTS / f"{name}-03-result.png"), full_page=True)
    print(f"  截图 3: 完整结果")

    text = collect_text(page)
    info = {
        "text_len": len(text),
        "has_title": "面相" in text and "分析" in text,
        "has_score": bool(re.search(r"\d+\s*/\s*100", text)),
        "has_three_ting": "三停" in text or ("三" in text and "停" in text),
        "has_wu_guan": "五官" in text or ("五" in text and "官" in text),
        "has_shi_er": "十二宫" in text or ("十" in text and "二" in text and "宫" in text),
    }
    results[name] = info
    print(f"  结果: {info}")
    page.evaluate("() => window.scrollTo(0, 0)")
    time.sleep(0.5)
    page.screenshot(path=str(SHOTS / f"{name}-04-top.png"), full_page=False)
    # 滚动到中间
    page.evaluate("() => window.scrollTo(0, 600)")
    time.sleep(0.5)
    page.screenshot(path=str(SHOTS / f"{name}-05-mid.png"), full_page=False)
    page.close()
    return info

def test_shouxiang(ctx):
    name = "shouxiang"
    print(f"\n=== 测试 {name} 手相分析 ===")
    page = ctx.new_page()
    page.on("console", lambda m: log_console(name, m))
    page.on("pageerror", lambda e: page_errors.append({"tool": name, "text": str(e)}))
    page.set_viewport_size({"width": 414, "height": 896})
    page.goto(BASE, wait_until="networkidle", timeout=20000)
    time.sleep(2.0)
    goto_page(page, "modules/guanxiang/pages/shouxiang")
    time.sleep(1.0)
    page.screenshot(path=str(SHOTS / f"{name}-01-initial.png"), full_page=False)
    print(f"  截图 1: 初始页面")

    time.sleep(0.5)
    r = click_text_node(page, "开 始 分 析")
    print(f"  点击「开始分析」: {r}")
    time.sleep(0.4)
    page.screenshot(path=str(SHOTS / f"{name}-02-loading.png"), full_page=False)
    print(f"  截图 2: 加载中")

    time.sleep(2.0)
    page.screenshot(path=str(SHOTS / f"{name}-03-result.png"), full_page=True)
    print(f"  截图 3: 完整结果")

    text = collect_text(page)
    info = {
        "text_len": len(text),
        "has_title": "手相" in text,
        "has_score": bool(re.search(r"\d+\s*/\s*100", text)),
        "has_ba_gong": "八宫" in text,
        "has_san_zhu": ("主" in text and "纹" in text),
    }
    results[name] = info
    print(f"  结果: {info}")
    page.evaluate("() => window.scrollTo(0, 0)")
    time.sleep(0.5)
    page.screenshot(path=str(SHOTS / f"{name}-04-top.png"), full_page=False)
    page.evaluate("() => window.scrollTo(0, 600)")
    time.sleep(0.5)
    page.screenshot(path=str(SHOTS / f"{name}-05-mid.png"), full_page=False)
    page.close()
    return info

def test_fenglui(ctx):
    name = "fenglui"
    print(f"\n=== 测试 {name} 阳宅风水 ===")
    page = ctx.new_page()
    page.on("console", lambda m: log_console(name, m))
    page.on("pageerror", lambda e: page_errors.append({"tool": name, "text": str(e)}))
    page.set_viewport_size({"width": 414, "height": 896})
    page.goto(BASE, wait_until="networkidle", timeout=20000)
    time.sleep(2.0)
    goto_page(page, "modules/guanxiang/pages/fenglui")
    time.sleep(1.0)
    page.screenshot(path=str(SHOTS / f"{name}-01-initial.png"), full_page=False)
    print(f"  截图 1: 初始页面")

    time.sleep(0.5)
    r = click_text_node(page, "开 始 推 算")
    print(f"  点击「开始推算」: {r}")
    time.sleep(0.4)
    page.screenshot(path=str(SHOTS / f"{name}-02-loading.png"), full_page=False)
    print(f"  截图 2: 加载中")

    time.sleep(2.0)
    page.screenshot(path=str(SHOTS / f"{name}-03-result.png"), full_page=True)
    print(f"  截图 3: 完整结果")

    text = collect_text(page)
    info = {
        "text_len": len(text),
        "has_title": "阳宅" in text or "风水" in text,
        "has_ba_zhai": "八宅" in text,
        "has_luo_pan": "罗盘" in text,
        "has_ming_gua": "命卦" in text,
        "has_ba_fang": "八方" in text,
        "has_rosette": page.evaluate("() => !!document.querySelector('.rosette')"),
        "has_compass_cells": page.evaluate("() => document.querySelectorAll('.rg-cell').length"),
    }
    results[name] = info
    print(f"  结果: {info}")
    page.evaluate("() => window.scrollTo(0, 0)")
    time.sleep(0.5)
    page.screenshot(path=str(SHOTS / f"{name}-04-top.png"), full_page=False)
    page.evaluate("""() => {
        const el = document.querySelector('.rosette');
        if (el) el.scrollIntoView({ block: 'center', behavior: 'instant' });
    }""")
    time.sleep(0.5)
    page.screenshot(path=str(SHOTS / f"{name}-05-rosette.png"), full_page=False)
    page.close()
    return info

def test_mingji(ctx):
    name = "mingji"
    print(f"\n=== 测试 {name} 命名测字 ===")
    page = ctx.new_page()
    page.on("console", lambda m: log_console(name, m))
    page.on("pageerror", lambda e: page_errors.append({"tool": name, "text": str(e)}))
    page.set_viewport_size({"width": 414, "height": 896})
    page.goto(BASE, wait_until="networkidle", timeout=20000)
    time.sleep(1.5)
    # 预先注入占卜人档案 + 刷新 store
    seed_user(page, "测试用户", "自己")
    # 注入 addInit 钩子
    page.add_init_script("""
        (() => {
            const initial = {
                divinatorProfiles: {'测试用户': {key: '测试用户', name: '测试用户', remark: '自己', createdAt: Date.now(), totalCount: 0, lastDate: new Date().toISOString().slice(0, 10), toolCooldown: {}}},
                activeDivinatorKey: '测试用户',
                divinationRecords: [],
                history: [],
                profile: null,
                favorites: [],
                notes: [],
                achievements: [],
                checkin: { lastDate: '', streak: 0, totalDays: 0, points: 0 }
            };
            localStorage.setItem('mistverse-app-v1', JSON.stringify(initial));
        })();
    """)
    page.reload(wait_until="networkidle")
    time.sleep(1.5)
    goto_page(page, "modules/mingming/pages/mingji")
    time.sleep(1.0)
    page.screenshot(path=str(SHOTS / f"{name}-01-initial.png"), full_page=False)
    print(f"  截图 1: 初始页面")

    time.sleep(0.5)
    name_set = set_input_value(page, "张三")
    print(f"  设置姓名输入: {name_set}")
    time.sleep(0.3)
    page.screenshot(path=str(SHOTS / f"{name}-01b-typed.png"), full_page=False)

    r = click_text_node(page, "开 始 测 字")
    print(f"  点击「开始测字」: {r}")
    time.sleep(0.6)
    page.screenshot(path=str(SHOTS / f"{name}-02-loading.png"), full_page=False)
    print(f"  截图 2: 加载中")

    time.sleep(3.5)
    page.screenshot(path=str(SHOTS / f"{name}-03-result.png"), full_page=True)
    print(f"  截图 3: 完整结果")

    text = collect_text(page)
    info = {
        "text_len": len(text),
        "has_name": "张" in text and "三" in text,
        "has_score": bool(re.search(r"\d+\s*/\s*100", text)),
        "has_wu_ge": "五格" in text,
        "has_san_cai": "三才" in text,
        "has_5_cells": page.evaluate("() => document.querySelectorAll('.wg-cell').length"),
    }
    results[name] = info
    print(f"  结果: {info}")
    page.evaluate("() => window.scrollTo(0, 0)")
    time.sleep(0.5)
    page.screenshot(path=str(SHOTS / f"{name}-04-top.png"), full_page=False)
    page.evaluate("() => window.scrollTo(0, 600)")
    time.sleep(0.5)
    page.screenshot(path=str(SHOTS / f"{name}-05-mid.png"), full_page=False)
    page.close()
    return info

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport={"width": 414, "height": 896},
            device_scale_factor=2,
        )
        try:
            test_mianxiang(ctx)
            test_shouxiang(ctx)
            test_fenglui(ctx)
            test_mingji(ctx)
        finally:
            ctx.close()
            browser.close()

    (OUT / "results.json").write_text(
        json.dumps({
            "results": results,
            "console_errors": console_logs,
            "page_errors": page_errors,
        }, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"\n所有截图已保存到 {SHOTS}")
    print(f"控制台错误/警告: {len(console_logs)}")
    print(f"页面错误: {len(page_errors)}")
    if console_logs:
        print("\n控制台日志:")
        for c in console_logs[:20]:
            print(f"  [{c['tool']}] {c['type']}: {c['text'][:200]}")
    if page_errors:
        print("\n页面错误:")
        for e in page_errors[:20]:
            print(f"  [{e['tool']}] {e['text'][:200]}")

if __name__ == "__main__":
    main()

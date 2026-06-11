"""
玄枢 MISTVERSE · 个人中心 + 设置 真实用户模拟测试
=========================================================

针对 8 个页面做 真实用户点击 + 视觉评估:
  1. 个人首页 (modules/personal/pages/index)
  2. 玄枢台 Dashboard
  3. 个人档案 profile
  4. 占卜人 users
  5. 每日签到 checkin
  6. 分类页 category
  7. 设置 settings
  8. 海报分享 poster

每个页面三张截图:
  01-initial.png  - 初始加载
  02-interact.png - 触发核心交互瞬间
  03-result.png   - 等待渲染结果
"""
import json
import os
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173/mistverse/"
SHOTS = Path("/workspace/dogfood-multi/personal/screenshots")
SHOTS.mkdir(parents=True, exist_ok=True)

ALL_ERRORS: list[str] = []
ALL_CONSOLE: list[str] = []


# ============= 工具函数 =============
def goto(page, path: str, name: str):
    """Navigate to a uni-app page via hash routing."""
    page.goto(BASE, wait_until="domcontentloaded", timeout=20000)
    page.wait_for_timeout(500)
    if path:
        # uni-app H5: location.hash = '#/<path>'
        page.evaluate(f"() => {{ location.hash = '#/{path}'; }}")
    page.wait_for_timeout(2000)  # uni-app initial mount + GSAP
    # try waiting for app to be ready
    try:
        page.wait_for_selector(".container, .home, .page, .cat-page, .settings-page", timeout=8000)
    except Exception:
        pass
    page.wait_for_timeout(800)
    print(f"  → {name}: URL={page.url[:120]}")


def shot(page, name: str):
    p = SHOTS / f"{name}.png"
    page.screenshot(path=str(p), full_page=False)
    print(f"    📸 {p.name}")


def fire_input(page, selector: str, value: str) -> str:
    """Trigger uni-app @input with e.detail.value via CustomEvent."""
    return page.evaluate(
        """([sel, val]) => {
          const el = document.querySelector(sel);
          if (!el) return 'no-input';
          const proto = Object.getPrototypeOf(el);
          const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
          setter.call(el, val);
          const evt = new CustomEvent('input', { detail: { value: val }, bubbles: true });
          el.dispatchEvent(evt);
          return 'ok';
        }""",
        [selector, value],
    )


def fire_input_index(page, idx: int, value: str) -> str:
    return page.evaluate(
        """([i, val]) => {
          const el = document.querySelectorAll('input')[i];
          if (!el) return 'no-input-' + i;
          const proto = Object.getPrototypeOf(el);
          const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
          setter.call(el, val);
          const evt = new CustomEvent('input', { detail: { value: val }, bubbles: true });
          el.dispatchEvent(evt);
          return 'ok';
        }""",
        [idx, value],
    )


def body_text(page) -> str:
    return page.locator("body").inner_text()[:500]


# ============= 8 个页面测试 =============
def page1_home(page, errors: list[str]):
    """1. 个人首页"""
    print("\n=== 1. 个人首页 (modules/personal/pages/index) ===")
    goto(page, "modules/personal/pages/index", "home")
    text = body_text(page)
    print(f"  text head: {text[:200]!r}")
    shot(page, "p1-home-01-initial")

    # ---- 交互 1: 滚动看底部 ----
    page.evaluate("() => window.scrollTo(0, document.body.scrollHeight)")
    page.wait_for_timeout(800)
    shot(page, "p1-home-02-scroll-bottom")

    # ---- 交互 2: 点击 命理 分类卡 ----
    page.evaluate("() => window.scrollTo(0, 0)")
    page.wait_for_timeout(400)
    # 点击第一个分类卡
    try:
        cards = page.locator(".entry-card")
        n = cards.count()
        print(f"  entry-card count: {n}")
        if n > 0:
            cards.first.click()
            page.wait_for_timeout(1500)
            shot(page, "p1-home-03-click-category")
            print(f"  URL after click: {page.url[:120]}")
        else:
            errors.append("首页未找到 entry-card")
    except Exception as e:
        errors.append(f"点击分类卡失败: {e}")

    # ---- 交互 3: 切换主题（明暗）----
    # 通过 localStorage 设置 mode=light 然后刷新
    page.evaluate("() => { location.hash = '#/modules/personal/pages/index'; }")
    page.wait_for_timeout(800)
    page.evaluate(
        """() => {
          const k = 'mistverse-settings-v1';
          const s = JSON.parse(localStorage.getItem(k) || '{}');
          s.mode = 'light';
          s.theme = 'xuanzi';
          localStorage.setItem(k, JSON.stringify(s));
        }"""
    )
    page.reload(wait_until="domcontentloaded")
    page.wait_for_timeout(2000)
    try:
        page.wait_for_selector(".container", timeout=5000)
    except Exception:
        pass
    shot(page, "p1-home-04-light-mode")
    # 恢复
    page.evaluate(
        """() => {
          const k = 'mistverse-settings-v1';
          const s = JSON.parse(localStorage.getItem(k) || '{}');
          s.mode = 'dark';
          s.theme = 'xuanhuang';
          localStorage.setItem(k, JSON.stringify(s));
        }"""
    )


def page2_dashboard(page, errors: list[str]):
    """2. 玄枢台 Dashboard"""
    print("\n=== 2. 玄枢台 Dashboard ===")
    goto(page, "modules/personal/pages/dashboard", "dashboard")
    text = body_text(page)
    print(f"  text head: {text[:200]!r}")
    shot(page, "p2-dashboard-01-initial")

    # ---- 交互: 滚动查看 ----
    page.evaluate("() => window.scrollTo(0, 400)")
    page.wait_for_timeout(600)
    shot(page, "p2-dashboard-02-scroll")

    # ---- 交互: 点击「笔记 · + 新建」触发模态 ----
    # 在 Pinia 里加一条笔记避免空白
    page.evaluate(
        """() => {
          const k = 'mistverse-app-v1';
          const s = JSON.parse(localStorage.getItem(k) || '{}');
          s.notes = s.notes || [];
          s.notes.unshift({
            id: 'note-test-1',
            title: '今日心得',
            content: '静坐时观呼吸',
            tags: ['静心'],
            time: Date.now(),
            updateTime: Date.now(),
          });
          s.history = s.history || [];
          s.history.unshift({
            id: 'h-test-1',
            tool: 'bazi',
            toolName: '八字排盘',
            category: '命理',
            input: {},
            output: {},
            brief: '日主甲木 · 印绶当令',
            time: Date.now(),
          });
          s.favorites = ['h-test-1'];
          localStorage.setItem(k, JSON.stringify(s));
        }"""
    )
    page.reload(wait_until="domcontentloaded")
    page.wait_for_timeout(2000)
    try:
        page.wait_for_selector(".container", timeout=5000)
    except Exception:
        pass
    shot(page, "p2-dashboard-03-with-data")


def page3_profile(page, errors: list[str]):
    """3. 个人档案 profile"""
    print("\n=== 3. 个人档案 profile ===")
    # 先清除档案以看到表单
    page.evaluate(
        """() => {
          const k = 'mistverse-app-v1';
          const s = JSON.parse(localStorage.getItem(k) || '{}');
          s.profile = null;
          localStorage.setItem(k, JSON.stringify(s));
        }"""
    )
    goto(page, "modules/personal/pages/profile", "profile")
    text = body_text(page)
    print(f"  text head: {text[:200]!r}")
    shot(page, "p3-profile-01-initial")

    # ---- 交互: 填写昵称 ----
    ok = fire_input_index(page, 0, "玄一")
    print(f"  昵称 input: {ok}")
    # 选女
    try:
        page.locator("text=女").first.click()
        page.wait_for_timeout(400)
    except Exception:
        pass
    # 填出生地
    fire_input_index(page, 1, "北京")
    page.wait_for_timeout(600)
    shot(page, "p3-profile-02-filled")

    # ---- 交互: 保存档案 ----
    try:
        btns = page.locator(".btn-zhu, .form-actions text")
        # 找含「保 存 档 案」字样的元素
        save = page.locator("text=保 存 档 案").first
        save.click()
        page.wait_for_timeout(1500)
        shot(page, "p3-profile-03-saved")
    except Exception as e:
        errors.append(f"保存档案失败: {e}")
        shot(page, "p3-profile-03-error")


def page4_users(page, errors: list[str]):
    """4. 占卜人 users"""
    print("\n=== 4. 占卜人 users ===")
    # 先确保有初始占卜人
    page.evaluate(
        """() => {
          const k = 'mistverse-app-v1';
          const s = JSON.parse(localStorage.getItem(k) || '{}');
          s.divinatorProfiles = s.divinatorProfiles || {};
          s.divinatorProfiles['张三'] = {
            name: '张三',
            key: '张三',
            remark: '自己',
            totalCount: 3,
            toolCooldown: {},
            createdAt: Date.now() - 10000,
            lastDate: '2026-06-10',
          };
          s.divinatorProfiles['家父'] = {
            name: '家父',
            key: '家父',
            remark: '父亲',
            totalCount: 1,
            toolCooldown: { bazi: '2026-06-12' },
            createdAt: Date.now() - 5000,
            lastDate: '2026-06-09',
          };
          s.activeDivinatorKey = '张三';
          localStorage.setItem(k, JSON.stringify(s));
        }"""
    )
    goto(page, "modules/personal/pages/users", "users")
    text = body_text(page)
    print(f"  text head: {text[:200]!r}")
    shot(page, "p4-users-01-initial")

    # ---- 交互: 添加「母亲」 ----
    fire_input_index(page, 0, "母亲")
    fire_input_index(page, 1, "妈妈")
    page.wait_for_timeout(500)
    shot(page, "p4-users-02-typed")

    try:
        page.locator("text=添 加").first.click()
        page.wait_for_timeout(1500)
    except Exception as e:
        errors.append(f"添加占卜人失败: {e}")
    shot(page, "p4-users-03-after-add")

    # ---- 交互: 切换激活到「家父」 ----
    try:
        # 找「家父」卡片并点
        page.locator("text=切 换 激 活").first.click()
        page.wait_for_timeout(1000)
        shot(page, "p4-users-04-switched")
    except Exception as e:
        errors.append(f"切换占卜人失败: {e}")


def page5_checkin(page, errors: list[str]):
    """5. 每日签到 checkin"""
    print("\n=== 5. 每日签到 checkin ===")
    # 重置签到
    page.evaluate(
        """() => {
          const k = 'mistverse-app-v1';
          const s = JSON.parse(localStorage.getItem(k) || '{}');
          s.checkin = { lastDate: '', streak: 0, totalDays: 0, points: 0 };
          localStorage.setItem(k, JSON.stringify(s));
        }"""
    )
    goto(page, "modules/personal/pages/checkin", "checkin")
    text = body_text(page)
    print(f"  text head: {text[:200]!r}")
    shot(page, "p5-checkin-01-initial")

    # ---- 交互: 点击签到 ----
    try:
        page.locator("text=点 击 签 到").first.click()
        page.wait_for_timeout(1500)
        shot(page, "p5-checkin-02-clicked")
    except Exception as e:
        errors.append(f"签到失败: {e}")

    # 滚到下方看奖励
    page.evaluate("() => window.scrollTo(0, 600)")
    page.wait_for_timeout(600)
    shot(page, "p5-checkin-03-rewards")

    # ---- 模拟连签 7 天 ----
    page.evaluate(
        """() => {
          const k = 'mistverse-app-v1';
          const s = JSON.parse(localStorage.getItem(k) || '{}');
          s.checkin = { lastDate: new Date().toISOString().slice(0,10), streak: 7, totalDays: 12, points: 220 };
          localStorage.setItem(k, JSON.stringify(s));
        }"""
    )
    page.reload(wait_until="domcontentloaded")
    page.wait_for_timeout(2000)
    shot(page, "p5-checkin-04-streak7")


def page6_category(page, errors: list[str]):
    """6. 分类页 category - 切换 6 个分类"""
    print("\n=== 6. 分类页 category ===")
    cats = [
        ("mingli", "命理"),
        ("zhongshu", "占卜"),
        ("guwu", "古物"),
        ("jian", "健康"),
        ("xiuxin", "修心"),
        ("shenghuo", "生活"),
    ]
    for i, (key, name) in enumerate(cats):
        goto(page, f"modules/personal/pages/category?cat={key}", f"cat-{name}")
        text = body_text(page)
        print(f"  [{name}] head: {text[:120]!r}")
        shot(page, f"p6-category-{i+1}-{name}-initial")
        page.wait_for_timeout(300)
        # 滚到工具列表中段
        page.evaluate("() => window.scrollTo(0, 500)")
        page.wait_for_timeout(400)
        shot(page, f"p6-category-{i+1}-{name}-tools")


def page7_settings(page, errors: list[str]):
    """7. 设置 settings"""
    print("\n=== 7. 设置 settings ===")
    goto(page, "settings/pages/settings", "settings")
    text = body_text(page)
    print(f"  text head: {text[:200]!r}")
    shot(page, "p7-settings-01-initial")

    # ---- 交互 1: 切换字号到「大」 ----
    try:
        page.locator("text=大").first.click()
        page.wait_for_timeout(800)
        shot(page, "p7-settings-02-fontsize-lg")
    except Exception as e:
        errors.append(f"切字号失败: {e}")

    # ---- 交互 2: 切换字体类型到「宋体」 ----
    try:
        # 找字号大 seg-item 后面的
        page.locator("text=宋体").first.click()
        page.wait_for_timeout(600)
        shot(page, "p7-settings-03-font-songti")
    except Exception as e:
        errors.append(f"切字体失败: {e}")

    # ---- 交互 3: 切换主题到「玄紫」 ----
    try:
        page.locator("text=玄紫").first.click()
        page.wait_for_timeout(600)
        shot(page, "p7-settings-04-theme-xuanzi")
    except Exception as e:
        errors.append(f"切主题失败: {e}")

    # ---- 交互 4: 切到「亮」模式 ----
    try:
        page.locator("text=☀ 亮").first.click()
        page.wait_for_timeout(600)
        shot(page, "p7-settings-05-light-mode")
    except Exception as e:
        errors.append(f"切亮模式失败: {e}")

    # ---- 交互 5: 切回暗 + 玄黄 + 楷体 ----
    try:
        page.locator("text=☾ 暗").first.click()
        page.wait_for_timeout(400)
        page.locator("text=玄黄").first.click()
        page.wait_for_timeout(400)
        page.locator("text=楷体").first.click()
        page.wait_for_timeout(400)
        shot(page, "p7-settings-06-reset")
    except Exception as e:
        errors.append(f"恢复设置失败: {e}")


def page8_poster(page, errors: list[str]):
    """8. 海报分享 poster"""
    print("\n=== 8. 海报分享 poster ===")
    # 先造一条历史用于可选源
    page.evaluate(
        """() => {
          const k = 'mistverse-app-v1';
          const s = JSON.parse(localStorage.getItem(k) || '{}');
          s.history = s.history || [];
          s.history.unshift({
            id: 'gua-test-1',
            tool: 'gua',
            toolName: '每日一卦',
            category: '占卜',
            input: { method: 'time' },
            output: { gua: '乾为天' },
            brief: '乾为天 · 元亨利贞',
            time: Date.now(),
          });
          localStorage.setItem(k, JSON.stringify(s));
        }"""
    )
    goto(page, "modules/personal/pages/poster", "poster")
    text = body_text(page)
    print(f"  text head: {text[:200]!r}")
    shot(page, "p8-poster-01-initial")

    # ---- 交互 1: 切换模板 ----
    try:
        # 模板卡片是可滚动的，选第 2 个
        page.evaluate(
            """() => {
              const tpls = document.querySelectorAll('.tpl-card');
              if (tpls.length >= 2) tpls[1].click();
            }"""
        )
        page.wait_for_timeout(600)
        shot(page, "p8-poster-02-template-changed")
    except Exception as e:
        errors.append(f"切模板失败: {e}")

    # ---- 交互 2: 切换内容来源为「八字」 ----
    try:
        page.locator("text=八字").first.click()
        page.wait_for_timeout(600)
        shot(page, "p8-poster-03-type-bazi")
    except Exception as e:
        errors.append(f"切来源失败: {e}")

    # ---- 交互 3: 生成海报 ----
    try:
        page.locator("text=生 成 海 报").first.click()
        page.wait_for_timeout(2500)
        shot(page, "p8-poster-04-generated")
    except Exception as e:
        errors.append(f"生成海报失败: {e}")


# ============= Main =============
def main():
    issues: list[str] = []
    findings: list[dict] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 414, "height": 896}, device_scale_factor=1)
        page = ctx.new_page()
        console_msgs: list[str] = []
        page_errors: list[str] = []
        page.on("console", lambda m: console_msgs.append(f"[{m.type}] {m.text[:300]}"))
        page.on("pageerror", lambda e: page_errors.append(str(e)[:300]))

        # 第一次访问初始化 localStorage
        page.goto(BASE, wait_until="domcontentloaded", timeout=20000)
        page.wait_for_timeout(1500)

        try:
            page1_home(page, issues)
        except Exception as e:
            issues.append(f"页面 1 异常: {e}")

        try:
            page2_dashboard(page, issues)
        except Exception as e:
            issues.append(f"页面 2 异常: {e}")

        try:
            page3_profile(page, issues)
        except Exception as e:
            issues.append(f"页面 3 异常: {e}")

        try:
            page4_users(page, issues)
        except Exception as e:
            issues.append(f"页面 4 异常: {e}")

        try:
            page5_checkin(page, issues)
        except Exception as e:
            issues.append(f"页面 5 异常: {e}")

        try:
            page6_category(page, issues)
        except Exception as e:
            issues.append(f"页面 6 异常: {e}")

        try:
            page7_settings(page, issues)
        except Exception as e:
            issues.append(f"页面 7 异常: {e}")

        try:
            page8_poster(page, issues)
        except Exception as e:
            issues.append(f"页面 8 异常: {e}")

        # 收集 console 错误（只保留 error / warn）
        errors_collected = [m for m in console_msgs if m.startswith("[error]") or m.startswith("[warning]")]
        page_errors_collected = list(page_errors)

        browser.close()

    # 写入 JSON 报告
    Path("/workspace/dogfood-multi/personal/findings.json").write_text(
        json.dumps(
            {
                "issues": issues,
                "console_errors": errors_collected,
                "page_errors": page_errors_collected,
                "all_console_count": len(console_msgs),
            },
            ensure_ascii=False,
            indent=2,
        )
    )

    print("\n\n========== SUMMARY ==========")
    print(f"Issues: {len(issues)}")
    for i in issues:
        print(f"  - {i}")
    print(f"\nConsole errors/warnings: {len(errors_collected)}")
    for m in errors_collected[:20]:
        print(f"  - {m}")
    print(f"\nPage errors: {len(page_errors_collected)}")
    for m in page_errors_collected[:20]:
        print(f"  - {m}")


if __name__ == "__main__":
    main()

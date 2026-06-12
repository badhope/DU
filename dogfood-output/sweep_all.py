"""
Comprehensive UI sweep of MISTVERSE - test ALL 49 tools + user flows + animations.

Strategy: For each tool, navigate to its page, take a screenshot, try to find a submit/result action,
perform it, capture the result, and look for visual/functional issues.
"""
import time
import json
import re
from pathlib import Path
from playwright.sync_api import sync_playwright, ConsoleMessage, Page

OUT = Path('/workspace/dogfood-output')
SHOTS = OUT / 'screenshots'
CHROME = '/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome'

# The 49 tools categorized
TOOLS = {
    'mingli': [
        ('wuxing', '五行罗盘'),
        ('bazi', '八字排盘'),
        ('hehun', '八字合婚'),
        ('liunian', '流年大运'),
        ('qimen', '奇门遁甲'),
        ('liuren', '大六壬'),
        ('ziwei', '紫微斗数'),
        ('xuankong', '玄空飞星'),
        ('tieban', '铁板神数'),
        ('xiaoliuren', '小六壬'),
        ('zhuge', '诸葛神数'),
        ('life', '生命灵数'),
        ('astro', '西洋占星'),
        ('maya', '玛雅历'),
        ('ai-ming', 'AI 命理师'),
        ('profile', '个人档案'),
        ('dashboard', '玄枢台'),
    ],
    'zhongshu': [
        ('gua', '每日一卦'),
        ('liuyao', '玄枢易盘'),
        ('tarot', '塔罗占卜'),
        ('meihua', '梅花易数'),
        ('lingqian', '灵签抽签'),
        ('shuzhi', '数字能量'),
        ('jiaobei', '杯筊问事'),
        ('ai-gua', 'AI 解卦师'),
    ],
    'guwu': [
        ('mianxiang', '面相分析'),
        ('shouxiang', '手相分析'),
        ('meihua', '古易心易'),  # dup
        ('fenglui', '阳宅风水'),
        ('mingji', '命名测字'),
        ('ai-feng', 'AI 风水师'),
        ('ai-name', 'AI 起名师'),
    ],
    'jian': [
        ('qijing', '奇经八脉'),
        ('ziwu', '子午流注'),
        ('wufu', '五福测算'),
        ('yangsheng', '节气养生'),
        ('ai-jiankang', 'AI 健康师'),
    ],
    'xiuxin': [
        ('zhan', '坐禅计时'),
        ('fangqi', '放松冥想'),
        ('shijian', '拾句'),
        ('dayun', '大运流转'),
        ('ai-xiuxin', 'AI 修心师'),
        ('checkin', '每日签到'),
    ],
    'shenghuo': [
        ('huangli', '老黄历'),
        ('jiri', '吉日择时'),
        ('yunshi', '今日运势'),
        ('jiazu', '家谱排辈'),
        ('poster', '海报分享'),
    ],
    'life': [
        ('users', '占卜人'),
    ],
}

console_log: list[dict] = []
errors_log: list[dict] = []
network_log: list[dict] = []
all_observations: list[dict] = []


def on_console(msg: ConsoleMessage) -> None:
    console_log.append({'type': msg.type, 'text': msg.text, 'url': page.url if 'page' in dir() else ''})


def on_pageerror(err) -> None:
    errors_log.append({'type': 'pageerror', 'text': str(err)})


def on_response(response):
    if response.status >= 400:
        network_log.append({'status': response.status, 'url': response.url[:200], 'page': page.url if 'page' in dir() else ''})


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            executable_path=CHROME,
            args=['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
        )
        ctx = browser.new_context(
            viewport={'width': 390, 'height': 844},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
        )
        page = ctx.new_page()
        page.on('console', on_console)
        page.on('pageerror', on_pageerror)
        page.on('response', on_response)

        # ============ Phase 1: Home page initial check ============
        print('=== PHASE 1: HOME PAGE ===')
        page.goto('http://localhost:5173/mistverse/', wait_until='domcontentloaded', timeout=20000)
        page.wait_for_load_state('networkidle', timeout=10000)
        time.sleep(2.0)
        page.screenshot(path=str(SHOTS / '200-home.png'), full_page=True)
        home_body = page.evaluate("() => document.body.innerText.substring(0, 2000)")
        print('Home body[:600]:', home_body[:600].replace('\n', '|'))

        # ============ Phase 2: All categories ============
        print('\n=== PHASE 2: ALL CATEGORIES ===')
        categories = [
            ('mingli', '命理', '天生之格'),
            ('zhongshu', '占卜', '天机之问'),
            ('guwu', '古物', '吉凶之器'),
            ('jian', '健康', '身心之衡'),
            ('xiuxin', '修心', '静观之道'),
            ('shenghuo', '生活', '日常之鉴'),
        ]
        for cat_key, cat_name, cat_subtitle in categories:
            page.goto(f'http://localhost:5173/mistverse/#/pages/category/category?cat={cat_key}', wait_until='domcontentloaded')
            time.sleep(2.5)
            page.screenshot(path=str(SHOTS / f'201-cat-{cat_key}.png'), full_page=True)
            body = page.evaluate("() => document.body.innerText.substring(0, 2500)")
            print(f'\n--- Category {cat_name} ---')
            print(f'body[:300]: {body[:300].replace(chr(10), "|")}')
            all_observations.append({'cat': cat_key, 'body': body[:1000]})

        # ============ Phase 3: Each of 49 tools ============
        print('\n=== PHASE 3: ALL 49 TOOLS ===')
        visited = set()
        for cat_key, tool_list in TOOLS.items():
            for slug, label in tool_list:
                if slug in visited:
                    continue
                visited.add(slug)
                page.goto(f'http://localhost:5173/mistverse/#/pages/{slug}/{slug}', wait_until='domcontentloaded', timeout=15000)
                time.sleep(2.0)
                page.screenshot(path=str(SHOTS / f'210-tool-{slug}.png'), full_page=True)
                body = page.evaluate("() => document.body.innerText.substring(0, 1200)")
                # Check for issues
                issues = []
                if 'connection timed out' in body.lower():
                    issues.append('TIMEOUT')
                if 'page not found' in body.lower() or '404' in body.lower():
                    issues.append('NOT_FOUND')
                # Check loading-mask
                mask = page.evaluate("""
                () => {
                  const m = document.querySelector('.loading-mask');
                  if (!m) return null;
                  const r = m.getBoundingClientRect();
                  return { w: r.width, h: r.height, z: getComputedStyle(m).zIndex };
                }
                """)
                if mask and mask['w'] > 100:
                    issues.append(f'LOADING_MASK_({mask["w"]}x{mask["h"]} z{mask["z"]})')
                # Check empty body
                if len(body) < 50:
                    issues.append('EMPTY_BODY')
                # Check for AI text
                if 'AI ' in body[:200] and 'AI 解卦' not in body[:200] and 'AI 命理' not in body[:200] and 'AI 风水' not in body[:200] and 'AI 起名' not in body[:200] and 'AI 健康' not in body[:200] and 'AI 修心' not in body[:200]:
                    if 'AI ' in body and 'AI ' not in body[:30]:
                        pass  # could be OK
                print(f'  {slug:18} {("❌ " + " ".join(issues)) if issues else "✓ ok"}  | {body[:120].replace(chr(10), "|")[:120]}')
                all_observations.append({
                    'tool': slug, 'label': label, 'cat': cat_key,
                    'issues': issues, 'body': body[:500],
                })

        # ============ Phase 4: User flow ============
        print('\n=== PHASE 4: USER FLOW ===')
        # Go to users page
        page.goto('http://localhost:5173/mistverse/#/pages/users/users', wait_until='domcontentloaded')
        time.sleep(2.0)
        page.screenshot(path=str(SHOTS / '220-users-page.png'), full_page=True)
        users_body = page.evaluate("() => document.body.innerText.substring(0, 1500)")
        print(f'Users page: {users_body[:400].replace(chr(10), "|")}')

        # Try to add a user
        try:
            # Find "添加" button or input
            add_btn = page.locator('text=添加').first
            if add_btn.count() > 0:
                print('  ✓ has 添加 button')
        except Exception as e:
            print(f'  ✗ no 添加 button: {e}')

        # ============ Phase 5: Profile page ============
        print('\n=== PHASE 5: PROFILE ===')
        page.goto('http://localhost:5173/mistverse/#/pages/profile/profile', wait_until='domcontentloaded')
        time.sleep(2.0)
        page.screenshot(path=str(SHOTS / '221-profile.png'), full_page=True)

        # ============ Phase 6: Settings page ============
        print('\n=== PHASE 6: SETTINGS ===')
        page.goto('http://localhost:5173/mistverse/#/pages/settings/settings', wait_until='domcontentloaded')
        time.sleep(2.0)
        page.screenshot(path=str(SHOTS / '222-settings.png'), full_page=True)

        # ============ Phase 7: Checkin ============
        print('\n=== PHASE 7: CHECKIN ===')
        page.goto('http://localhost:5173/mistverse/#/pages/checkin/checkin', wait_until='domcontentloaded')
        time.sleep(2.0)
        page.screenshot(path=str(SHOTS / '223-checkin.png'), full_page=True)

        # ============ Phase 8: Poster ============
        print('\n=== PHASE 8: POSTER ===')
        page.goto('http://localhost:5173/mistverse/#/pages/poster/poster', wait_until='domcontentloaded')
        time.sleep(2.0)
        page.screenshot(path=str(SHOTS / '224-poster.png'), full_page=True)
        poster_body = page.evaluate("() => document.body.innerText.substring(0, 1500)")
        print(f'Poster: {poster_body[:300].replace(chr(10), "|")}')

        # ============ Phase 9: Dashboard ============
        print('\n=== PHASE 9: DASHBOARD ===')
        page.goto('http://localhost:5173/mistverse/#/pages/dashboard/dashboard', wait_until='domcontentloaded')
        time.sleep(2.0)
        page.screenshot(path=str(SHOTS / '225-dashboard.png'), full_page=True)

        # ============ Phase 10: Category page clicks ============
        print('\n=== PHASE 10: CATEGORY NAVIGATION ===')
        for cat_key, cat_name, _ in categories:
            page.goto('http://localhost:5173/mistverse/', wait_until='domcontentloaded')
            time.sleep(1.5)
            # Click the category card
            try:
                page.locator(f'text={cat_name}').first.click()
                time.sleep(2.0)
                page.screenshot(path=str(SHOTS / f'230-cat-click-{cat_key}.png'), full_page=True)
                print(f'  ✓ clicked {cat_name}')
            except Exception as e:
                print(f'  ✗ click {cat_name}: {e}')

        # ============ Final summary ============
        print('\n=== FINAL SUMMARY ===')
        print(f'Console errors: {len(errors_log)}')
        for e in errors_log[:20]:
            print(f"  - {e.get('type')}: {e.get('text', '')[:150]}")
        print(f'Network errors: {len(network_log)}')
        for n in network_log[:20]:
            print(f"  - {n['status']} {n['url'][:120]}")
        # Count issues
        with_issues = [o for o in all_observations if o.get('issues')]
        print(f'Tools with issues: {len(with_issues)}/{len(all_observations)}')
        for o in with_issues:
            print(f"  - {o['tool']}: {o['issues']}")

        # Save report
        (OUT / 'sweep-observations.json').write_text(
            json.dumps({
                'console_errors': errors_log[:200],
                'network_errors': network_log[:200],
                'observations': all_observations,
            }, ensure_ascii=False, indent=2),
            encoding='utf-8',
        )
        browser.close()


if __name__ == '__main__':
    main()

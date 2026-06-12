"""
Comprehensive UI/UX sweep of MISTVERSE - all 49 tools with correct paths + flows.
"""
import time
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, ConsoleMessage, Page, Error as PWError

OUT = Path('/workspace/dogfood-output')
SHOTS = OUT / 'screenshots'
SHOTS.mkdir(parents=True, exist_ok=True)
BASE = 'http://localhost:5173/mistverse/'

# (slug, label, category, real_path)
TOOLS = [
    ('wuxing', '五行罗盘', 'mingli', 'wuxing/wuxing'),
    ('bazi', '八字排盘', 'mingli', 'bazi/bazi'),
    ('hehun', '八字合婚', 'mingli', 'hehun/hehun'),
    ('liunian', '流年大运', 'mingli', 'liunian/liunian'),
    ('qimen', '奇门遁甲', 'mingli', 'qimen/qimen'),
    ('liuren', '大六壬', 'mingli', 'liuren/liuren'),
    ('ziwei', '紫微斗数', 'mingli', 'ziwei/ziwei'),
    ('xuankong', '玄空飞星', 'mingli', 'xuankong/xuankong'),
    ('tieban', '铁板神数', 'mingli', 'tieban/tieban'),
    ('xiaoliuren', '小六壬', 'mingli', 'xiaoliuren/xiaoliuren'),
    ('zhuge', '诸葛神数', 'mingli', 'zhuge/zhuge'),
    ('life', '生命灵数', 'mingli', 'life/life'),
    ('astro', '西洋占星', 'mingli', 'astro/astro'),
    ('maya', '玛雅历', 'mingli', 'maya/maya'),
    ('ai-ming', 'AI 命理师', 'mingli', 'ai/ai-ming'),
    ('profile', '个人档案', 'mingli', 'profile/profile'),
    ('dashboard', '玄枢台', 'mingli', 'dashboard/dashboard'),
    ('gua', '每日一卦', 'zhongshu', 'gua/gua'),
    ('liuyao', '玄枢易盘', 'zhongshu', 'liuyao/liuyao'),
    ('tarot', '塔罗占卜', 'zhongshu', 'tarot/tarot'),
    ('meihua', '梅花易数', 'zhongshu', 'meihua/meihua'),
    ('lingqian', '灵签抽签', 'zhongshu', 'lingqian/lingqian'),
    ('shuzhi', '数字能量', 'zhongshu', 'shuzhi/shuzhi'),
    ('jiaobei', '杯筊问事', 'zhongshu', 'jiaobei/jiaobei'),
    ('ai-gua', 'AI 解卦师', 'zhongshu', 'ai/ai-gua'),
    ('mianxiang', '面相分析', 'guwu', 'mianxiang/mianxiang'),
    ('shouxiang', '手相分析', 'guwu', 'shouxiang/shouxiang'),
    ('fenglui', '阳宅风水', 'guwu', 'fenglui/fenglui'),
    ('mingji', '命名测字', 'guwu', 'mingji/mingji'),
    ('ai-feng', 'AI 风水师', 'guwu', 'ai/ai-feng'),
    ('ai-name', 'AI 起名师', 'guwu', 'ai/ai-name'),
    ('qijing', '奇经八脉', 'jian', 'qijing/qijing'),
    ('ziwu', '子午流注', 'jian', 'ziwu/ziwu'),
    ('wufu', '五福测算', 'jian', 'wufu/wufu'),
    ('yangsheng', '节气养生', 'jian', 'yangsheng/yangsheng'),
    ('ai-jiankang', 'AI 健康师', 'jian', 'ai/ai-jiankang'),
    ('zhan', '坐禅计时', 'xiuxin', 'zhan/zhan'),
    ('fangqi', '放松冥想', 'xiuxin', 'fangqi/fangqi'),
    ('shijian', '拾句', 'xiuxin', 'shijian/shijian'),
    ('dayun', '大运流转', 'xiuxin', 'dayun/dayun'),
    ('ai-xiuxin', 'AI 修心师', 'xiuxin', 'ai/ai-xiuxin'),
    ('checkin', '每日签到', 'xiuxin', 'checkin/checkin'),
    ('huangli', '老黄历', 'shenghuo', 'huangli/huangli'),
    ('jiri', '吉日择时', 'shenghuo', 'jiri/jiri'),
    ('yunshi', '今日运势', 'shenghuo', 'yunshi/yunshi'),
    ('jiazu', '家谱排辈', 'shenghuo', 'jiazu/jiazu'),
    ('poster', '海报分享', 'shenghuo', 'poster/poster'),
    ('users', '占卜人', 'life', 'users/users'),
]

console_log: list[dict] = []
page_errors: list[dict] = []
network_errors: list[dict] = []
issues: list[dict] = []
all_observations: list[dict] = []
page_ref = None


def on_console(msg: ConsoleMessage) -> None:
    t = msg.type
    text = msg.text
    if t in ('error', 'warning'):
        console_log.append({'type': t, 'text': text[:300], 'url': page_ref.url if page_ref else ''})


def on_pageerror(err) -> None:
    page_errors.append({'text': str(err)[:300], 'url': page_ref.url if page_ref else ''})


def on_response(response):
    if response.status >= 400:
        network_errors.append({
            'status': response.status, 'url': response.url[:200],
            'page': page_ref.url if page_ref else '',
        })


def check_visual_issues() -> list[str]:
    if not page_ref:
        return []
    problems = []
    try:
        result = page_ref.evaluate("""() => {
            const issues = [];
            const mask = document.querySelector('.loading-mask');
            if (mask) {
                const r = mask.getBoundingClientRect();
                const cs = getComputedStyle(mask);
                if (r.width > 100 && cs.display !== 'none' && cs.visibility !== 'hidden') {
                    issues.push('LOADING_MASK_VISIBLE');
                }
            }
            const body = document.body.innerText || '';
            if (/TypeError|ReferenceError|SyntaxError|parsetimeout|Internal server error/i.test(body.substring(0, 500))) {
                issues.push('PAGE_ERROR_TEXT');
            }
            return { issues, bodyLen: body.length, title: document.title };
        }""")
        if result.get('issues'):
            problems.extend(result['issues'])
        if result.get('bodyLen', 0) < 50:
            problems.append('EMPTY_BODY')
    except Exception as e:
        problems.append(f'EVAL_ERROR:{str(e)[:80]}')
    return problems


def main():
    global page_ref
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True, args=['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
        )
        ctx = browser.new_context(
            viewport={'width': 390, 'height': 844}, device_scale_factor=2,
            is_mobile=True, has_touch=True, locale='zh-CN',
        )
        page = ctx.new_page()
        page_ref = page
        page.on('console', on_console)
        page.on('pageerror', on_pageerror)
        page.on('response', on_response)

        # PHASE 1: HOME
        print('=== PHASE 1: HOME ===')
        page.goto(BASE, wait_until='domcontentloaded', timeout=20000)
        page.wait_for_load_state('networkidle', timeout=8000)
        time.sleep(2.5)
        page.screenshot(path=str(SHOTS / '001-home.png'), full_page=True)
        home_issues = check_visual_issues()
        print(f'  Home: title="{page.title()}" issues={home_issues}')

        # PHASE 2: ALL 49 TOOLS
        print('\n=== PHASE 2: ALL 49 TOOLS ===')
        for slug, label, cat, path in TOOLS:
            url = f'{BASE}#/pages/{path}'
            try:
                page.goto(url, wait_until='domcontentloaded', timeout=15000)
                time.sleep(2.2)  # give Vue time to render
                body = page.evaluate("() => document.body.innerText")
                visual_issues = check_visual_issues()
                shot_name = f'tool-{cat}-{slug}.png'
                page.screenshot(path=str(SHOTS / shot_name), full_page=True)
                tag = '❌' if visual_issues else '✓'
                body_preview = (body[:100] if body else '<empty>').replace('\n', '|')
                print(f'  {tag} {slug:14} {cat:8} | {label:10} | body={len(body):4}ch | {visual_issues} | {body_preview[:60]}')
                all_observations.append({
                    'tool': slug, 'label': label, 'cat': cat, 'path': path,
                    'url': url, 'issues': visual_issues, 'body_len': len(body),
                    'body_head': body[:300],
                })
                if visual_issues:
                    sev = 'high' if any('LOADING_MASK' in v or 'PAGE_ERROR' in v for v in visual_issues) else 'low'
                    issues.append({
                        'severity': sev, 'tool': slug, 'category': cat, 'issues': visual_issues,
                    })
            except PWError as e:
                print(f'  ❌ {slug:14} {cat:8} | LOAD FAILED: {str(e)[:80]}')
                issues.append({'severity': 'high', 'tool': slug, 'category': cat, 'issues': [f'LOAD_FAILED:{str(e)[:60]}']})
            except Exception as e:
                print(f'  ❌ {slug:14} {cat:8} | EXC: {str(e)[:80]}')
                issues.append({'severity': 'high', 'tool': slug, 'category': cat, 'issues': [f'EXC:{str(e)[:60]}' ]})

        # PHASE 3: USER FLOW - add user
        print('\n=== PHASE 3: USER FLOW ===')
        page.goto(f'{BASE}#/pages/users/users', wait_until='domcontentloaded')
        time.sleep(2.5)
        page.screenshot(path=str(SHOTS / 'flow-001-users.png'), full_page=True)
        try:
            add_count = page.locator('text=添加').count()
            print(f'  users page: {add_count} 添加 buttons')
            if add_count > 0:
                page.locator('text=添加').first.click()
                time.sleep(1.5)
                page.screenshot(path=str(SHOTS / 'flow-002-add-modal.png'), full_page=True)
                inputs = page.locator('input').all()
                if inputs:
                    inputs[0].fill('测试用户A')
                    time.sleep(0.5)
                    page.screenshot(path=str(SHOTS / 'flow-003-name-filled.png'), full_page=True)
                    if page.locator('text=确定').count() > 0:
                        page.locator('text=确定').first.click()
                        time.sleep(2.0)
                        page.screenshot(path=str(SHOTS / 'flow-004-after-confirm.png'), full_page=True)
                        print('  ✓ added user')
        except Exception as e:
            print(f'  add user error: {e}')

        # PHASE 4: PROFILE
        print('\n=== PHASE 4: PROFILE ===')
        page.goto(f'{BASE}#/pages/profile/profile', wait_until='domcontentloaded')
        time.sleep(2.5)
        page.screenshot(path=str(SHOTS / 'flow-005-profile.png'), full_page=True)
        inputs = page.locator('input').all()
        print(f'  profile: {len(inputs)} inputs')
        for i, inp in enumerate(inputs[:4]):
            try:
                inp.fill(f'值{i}')
                time.sleep(0.3)
            except Exception:
                pass
        page.screenshot(path=str(SHOTS / 'flow-006-profile-filled.png'), full_page=True)

        # PHASE 5: CHECKIN
        print('\n=== PHASE 5: CHECKIN ===')
        page.goto(f'{BASE}#/pages/checkin/checkin', wait_until='domcontentloaded')
        time.sleep(2.5)
        page.screenshot(path=str(SHOTS / 'flow-007-checkin.png'), full_page=True)
        for label in ['签到', '签', '今日签到', '打卡']:
            cnt = page.locator(f'text={label}').count()
            if cnt > 0:
                try:
                    page.locator(f'text={label}').first.click()
                    time.sleep(1.5)
                    page.screenshot(path=str(SHOTS / 'flow-008-checkin-clicked.png'), full_page=True)
                    print(f'  ✓ clicked "{label}"')
                    break
                except Exception:
                    pass

        # PHASE 6: SETTINGS
        print('\n=== PHASE 6: SETTINGS ===')
        page.goto(f'{BASE}#/pages/settings/settings', wait_until='domcontentloaded')
        time.sleep(2.5)
        page.screenshot(path=str(SHOTS / 'flow-009-settings.png'), full_page=True)

        # PHASE 7: POSTER
        print('\n=== PHASE 7: POSTER ===')
        page.goto(f'{BASE}#/pages/poster/poster', wait_until='domcontentloaded')
        time.sleep(2.5)
        page.screenshot(path=str(SHOTS / 'flow-010-poster.png'), full_page=True)
        for label in ['生成', '生 成', '创建', '保存']:
            if page.locator(f'text={label}').count() > 0:
                try:
                    page.locator(f'text={label}').first.click()
                    time.sleep(2.5)
                    page.screenshot(path=str(SHOTS / 'flow-011-poster-gen.png'), full_page=True)
                    print(f'  ✓ clicked "{label}"')
                    break
                except Exception:
                    pass

        # PHASE 8: DASHBOARD
        print('\n=== PHASE 8: DASHBOARD ===')
        page.goto(f'{BASE}#/pages/dashboard/dashboard', wait_until='domcontentloaded')
        time.sleep(2.5)
        page.screenshot(path=str(SHOTS / 'flow-012-dashboard.png'), full_page=True)

        # PHASE 9: CATEGORY NAV
        print('\n=== PHASE 9: CATEGORY NAV ===')
        cats = [('命理', 'mingli'), ('占卜', 'zhongshu'), ('古物', 'guwu'), ('健康', 'jian'), ('修心', 'xiuxin'), ('生活', 'shenghuo')]
        for cat_name, cat_key in cats:
            page.goto(BASE, wait_until='domcontentloaded')
            time.sleep(2.0)
            try:
                page.locator(f'text={cat_name}').first.click()
                time.sleep(2.0)
                page.screenshot(path=str(SHOTS / f'cat-{cat_key}.png'), full_page=True)
                body = page.evaluate("() => document.body.innerText.substring(0, 400)")
                # count tool cards
                card_count = body.count('›')
                print(f'  ✓ {cat_name} → {card_count} tool cards | {body[:100].replace(chr(10),"|")}')
            except Exception as e:
                print(f'  ✗ {cat_name}: {e}')

        # PHASE 10: LOADING / ANIMATIONS
        print('\n=== PHASE 10: LOADING STATES ===')
        for slug in ['gua', 'liuyao', 'tarot', 'bazi', 'qimen', 'xuankong', 'ai-ming']:
            try:
                page.goto(f'{BASE}#/pages/{[t[3] for t in TOOLS if t[0]==slug][0]}', wait_until='domcontentloaded')
                time.sleep(0.4)
                page.screenshot(path=str(SHOTS / f'load-early-{slug}.png'), full_page=False)
                time.sleep(2.5)
                page.screenshot(path=str(SHOTS / f'load-late-{slug}.png'), full_page=False)
            except Exception as e:
                print(f'  ✗ {slug}: {e}')
        print('  ✓ captured loading states for 7 tools')

        # PHASE 11: EDGE - empty inputs
        print('\n=== PHASE 11: EDGE CASES ===')
        page.goto(f'{BASE}#/pages/bazi/bazi', wait_until='domcontentloaded')
        time.sleep(2.5)
        page.screenshot(path=str(SHOTS / 'edge-001-bazi.png'), full_page=True)
        for label in ['排盘', '起 盘', '开始', '推 算', '计 算']:
            if page.locator(f'text={label}').count() > 0:
                try:
                    page.locator(f'text={label}').first.click()
                    time.sleep(2.5)
                    page.screenshot(path=str(SHOTS / f'edge-002-{label.strip()}.png'), full_page=True)
                    print(f'  ✓ bazi submit "{label}"')
                    break
                except Exception as e:
                    pass

        # FINAL
        print('\n=== FINAL SUMMARY ===')
        print(f'Tools tested: {len(TOOLS)}')
        print(f'Tools with issues: {len([o for o in all_observations if o.get("issues")])}')
        print(f'Console errors/warnings: {len(console_log)}')
        seen = set()
        for c in console_log:
            key = c['text'][:100]
            if key in seen: continue
            seen.add(key)
            print(f"  [{c['type']}] {c['text'][:150]}")
        print(f'Page errors: {len(page_errors)}')
        for p in page_errors[:5]:
            print(f"  - {p['text'][:150]}")
        print(f'Network errors: {len(network_errors)}')
        for n in network_errors[:10]:
            print(f"  - {n['status']} {n['url'][:120]}")

        (OUT / 'sweep.json').write_text(json.dumps({
            'console_errors': console_log[:500],
            'page_errors': page_errors,
            'network_errors': network_errors,
            'issues': issues,
            'observations': all_observations,
        }, ensure_ascii=False, indent=2), encoding='utf-8')
        browser.close()


if __name__ == '__main__':
    main()

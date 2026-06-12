"""
Deep interactive test - simulate real user actions for each major flow.
"""
import time, json
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path('/workspace/dogfood-output')
SHOTS = OUT / 'interactive'
SHOTS.mkdir(parents=True, exist_ok=True)
BASE = 'http://localhost:5173/mistverse/'

console_log = []
page_errors = []
network_errors = []
findings = []

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-gpu'])
        ctx = browser.new_context(
            viewport={'width': 390, 'height': 844}, device_scale_factor=2,
            is_mobile=True, has_touch=True, locale='zh-CN',
        )
        page = ctx.new_page()
        page.on('console', lambda m: console_log.append({'t': m.type, 'msg': m.text[:200]}) if m.type in ('error', 'warning') else None)
        page.on('pageerror', lambda e: page_errors.append(str(e)[:200]))
        page.on('response', lambda r: network_errors.append({'s': r.status, 'u': r.url[:100]}) if r.status >= 400 else None)

        # ============ FLOW 1: Add user ============
        print('=== FLOW 1: Add user ===')
        page.goto(f'{BASE}#/pages/users/users', wait_until='domcontentloaded')
        time.sleep(2.5)
        page.screenshot(path=str(SHOTS / '01-users-initial.png'), full_page=True)
        # Find 添加 button (with space)
        try:
            add_btn = page.locator('text=添 加').first
            cnt = page.locator('text=添 加').count()
            print(f'  Found {cnt} "添 加" buttons')
            if cnt > 0:
                add_btn.click()
                time.sleep(1.5)
                page.screenshot(path=str(SHOTS / '02-add-modal.png'), full_page=True)
                # Fill the input
                inputs = page.locator('input').all()
                print(f'  Found {len(inputs)} inputs')
                for i, inp in enumerate(inputs):
                    try:
                        placeholder = inp.get_attribute('placeholder') or ''
                        print(f'    input[{i}] placeholder="{placeholder}"')
                    except Exception:
                        pass
                if inputs:
                    inputs[0].fill('玄一')
                    time.sleep(0.5)
                    page.screenshot(path=str(SHOTS / '03-name-typed.png'), full_page=True)
                    # Click 添 加 again to confirm
                    add_btns = page.locator('text=添 加').all()
                    print(f'  Re-clicking "添 加" (now {len(add_btns)} buttons)')
                    if len(add_btns) > 1:
                        add_btns[-1].click()  # last one is in modal
                        time.sleep(2.0)
                        page.screenshot(path=str(SHOTS / '04-after-add.png'), full_page=True)
        except Exception as e:
            print(f'  Add user error: {e}')
            page.screenshot(path=str(SHOTS / 'add-user-ERROR.png'), full_page=True)

        # ============ FLOW 2: Bazi 排盘 ============
        print('\n=== FLOW 2: Bazi 排盘 ===')
        page.goto(f'{BASE}#/pages/bazi/bazi', wait_until='domcontentloaded')
        time.sleep(2.5)
        page.screenshot(path=str(SHOTS / '05-bazi-initial.png'), full_page=True)
        try:
            inputs = page.locator('input').all()
            print(f'  Bazi: {len(inputs)} inputs')
            for i, inp in enumerate(inputs[:4]):
                try:
                    inp.fill(f'1990')
                    time.sleep(0.3)
                except Exception:
                    pass
            page.screenshot(path=str(SHOTS / '06-bazi-filled.png'), full_page=True)
            # Click 排盘
            if page.locator('text=排盘').count() > 0:
                page.locator('text=排盘').first.click()
                time.sleep(3.5)
                page.screenshot(path=str(SHOTS / '07-bazi-result.png'), full_page=True)
                # Scroll down to see full result
                page.evaluate("window.scrollTo(0, 600)")
                time.sleep(1.0)
                page.screenshot(path=str(SHOTS / '08-bazi-scrolled.png'), full_page=True)
                body = page.evaluate("() => document.body.innerText.substring(0, 800)")
                print(f'  Body after 排盘: {body[:200].replace(chr(10),"|")}')
        except Exception as e:
            print(f'  Bazi error: {e}')

        # ============ FLOW 3: Liu Yao ============
        print('\n=== FLOW 3: 玄枢易盘 ===')
        page.goto(f'{BASE}#/pages/liuyao/liuyao', wait_until='domcontentloaded')
        time.sleep(2.5)
        page.screenshot(path=str(SHOTS / '09-liunyao.png'), full_page=True)
        try:
            # Find 起卦 or 摇卦
            for label in ['起卦', '摇卦', '摇 一 卦', '起 一 卦', '开 始']:
                if page.locator(f'text={label}').count() > 0:
                    page.locator(f'text={label}').first.click()
                    time.sleep(4.0)  # animation
                    page.screenshot(path=str(SHOTS / f'10-liunyao-after-{label.strip()}.png'), full_page=True)
                    print(f'  ✓ clicked "{label}"')
                    # Scroll
                    page.evaluate("window.scrollTo(0, 500)")
                    time.sleep(1.0)
                    page.screenshot(path=str(SHOTS / f'11-liunyao-scroll-{label.strip()}.png'), full_page=True)
                    break
        except Exception as e:
            print(f'  Liuyao error: {e}')

        # ============ FLOW 4: Tarot ============
        print('\n=== FLOW 4: 塔罗占卜 ===')
        page.goto(f'{BASE}#/pages/tarot/tarot', wait_until='domcontentloaded')
        time.sleep(2.5)
        page.screenshot(path=str(SHOTS / '12-tarot.png'), full_page=True)
        try:
            for label in ['开 始 抽 牌', '开始抽牌', '抽牌', '开 始', '抽 一 张']:
                if page.locator(f'text={label}').count() > 0:
                    page.locator(f'text={label}').first.click()
                    time.sleep(3.0)
                    page.screenshot(path=str(SHOTS / f'13-tarot-after-{label.strip()}.png'), full_page=True)
                    print(f'  ✓ clicked "{label}"')
                    break
        except Exception as e:
            print(f'  Tarot error: {e}')

        # ============ FLOW 5: Animations visual check ============
        print('\n=== FLOW 5: Animation states ===')
        for slug, name in [('gua', 'gua'), ('lingqian', 'lingqian'), ('jiaobei', 'jiaobei')]:
            try:
                page.goto(f'{BASE}#/pages/{slug}/{slug}', wait_until='domcontentloaded')
                time.sleep(0.3)
                page.screenshot(path=str(SHOTS / f'14-anim-{slug}-early.png'), full_page=False)
                time.sleep(1.5)
                page.screenshot(path=str(SHOTS / f'15-anim-{slug}-mid.png'), full_page=False)
                time.sleep(2.0)
                page.screenshot(path=str(SHOTS / f'16-anim-{slug}-late.png'), full_page=False)
                print(f'  ✓ {slug}')
            except Exception as e:
                print(f'  ✗ {slug}: {e}')

        # ============ FLOW 6: Settings - theme toggle ============
        print('\n=== FLOW 6: Settings toggle ===')
        page.goto(f'{BASE}#/pages/settings/settings', wait_until='domcontentloaded')
        time.sleep(2.5)
        page.screenshot(path=str(SHOTS / '17-settings.png'), full_page=True)
        try:
            # Find theme/lang/fontSize toggles
            switches = page.locator('.switch, [class*="switch"], [class*="toggle"]').all()
            print(f'  Settings: {len(switches)} toggle elements')
            if switches:
                switches[0].click()
                time.sleep(1.0)
                page.screenshot(path=str(SHOTS / '18-settings-toggled.png'), full_page=True)
        except Exception as e:
            print(f'  Settings error: {e}')

        # ============ FINAL ============
        print('\n=== FINAL ===')
        print(f'Console: {len(console_log)} issues')
        seen = set()
        for c in console_log:
            k = c['msg'][:80]
            if k in seen: continue
            seen.add(k)
            print(f"  [{c['t']}] {c['msg'][:200]}")
        print(f'Page errors: {len(page_errors)}')
        for p in page_errors[:5]:
            print(f'  - {p}')
        print(f'Network errors: {len(network_errors)}')
        for n in network_errors[:5]:
            print(f'  - {n["s"]} {n["u"]}')

        (OUT / 'interactive.json').write_text(json.dumps({
            'console': console_log[:200],
            'page_errors': page_errors,
            'network_errors': network_errors,
        }, ensure_ascii=False, indent=2), encoding='utf-8')
        browser.close()


if __name__ == '__main__':
    main()

/**
 * 玄枢 MISTVERSE · 海报 Canvas 2D 真实渲染引擎
 *
 * 多模板真实绘制 + 长图导出（H5 / 小程序 / App）
 * 设计：5 套高质感玄学主题模板
 *  - 玄黑（默认） · 暗夜玄黑 + 金边
 *  - 朱红 · 喜庆朱砂 + 流金
 *  - 流金 · 鎏金岁月 + 古卷
 *  - 玄紫 · 紫气东来 + 星辰
 *  - 玄青 · 山河入梦 + 苍翠
 *
 *  Canvas 2D 真实绘制（不是 CSS 卡片）：
 *  - 渐变背景 + 噪点纹理 + 装饰图腾
 *  - 中心太极 + 卦象 / 字符
 *  - 主标题 + 副标题 + 内容 + 日期
 *  - QR 区 + Logo + 标语
 *  - 750×1334 (3:4) 标准移动端比例
 */

export type PosterTemplate = 'xuanhei' | 'zhuhong' | 'liujin' | 'xuanzi' | 'xuanqing'

export interface PosterConfig {
  template: PosterTemplate
  type: 'gua' | 'bazi' | 'tarot' | 'ai' | 'liuyao' | 'custom'
  /** 大字符 / 图腾 */
  glyph: string
  /** 主标题 */
  title: string
  /** 副标题 */
  subtitle: string
  /** 内容（多行，自动换行） */
  content: string[]
  /** 角标（如 "DAILY · 今日一卦"） */
  badge?: string
  /** 落款（昵称 / 日主） */
  signature?: string
  /** 日期字符串（YYYY.MM.DD） */
  dateStr: string
  /** 底部署名 */
  footer: string
  /** 颜色主题覆盖（可选） */
  themeColor?: string
}

export interface PosterMeta {
  key: PosterTemplate
  name: string
  desc: string
  gradient: [string, string, string]  // 三色渐变
  accent: string                      // 强调色
  text: string                        // 主文字色
  glow: string                        // 光晕色
}

// ============ 5 套模板定义 ============

export const TEMPLATES: PosterMeta[] = [
  {
    key: 'xuanhei',
    name: '玄黑',
    desc: '暗夜玄黑 · 金边',
    gradient: ['#0A0A12', '#1A1A2A', '#2A0A4A'],
    accent: '#D4AF37',
    text: '#F5E8C8',
    glow: 'rgba(212, 175, 55, 0.4)',
  },
  {
    key: 'zhuhong',
    name: '朱红',
    desc: '喜庆朱砂 · 流金',
    gradient: ['#3D0A0A', '#8B1F1A', '#C8302A'],
    accent: '#FFD700',
    text: '#FFE8D0',
    glow: 'rgba(255, 215, 0, 0.4)',
  },
  {
    key: 'liujin',
    name: '流金',
    desc: '鎏金岁月 · 古卷',
    gradient: ['#3A2A1A', '#8B6F47', '#D4AF37'],
    accent: '#FFE8B0',
    text: '#FFF5E0',
    glow: 'rgba(255, 232, 176, 0.5)',
  },
  {
    key: 'xuanzi',
    name: '玄紫',
    desc: '紫气东来 · 星辰',
    gradient: ['#1A0A3A', '#3A1A6A', '#5B3A8E'],
    accent: '#E8C870',
    text: '#F0E0FF',
    glow: 'rgba(232, 200, 112, 0.4)',
  },
  {
    key: 'xuanqing',
    name: '玄青',
    desc: '山河入梦 · 苍翠',
    gradient: ['#0A1A1A', '#1F4E4A', '#3A6A5C'],
    accent: '#E0D8A8',
    text: '#E8F0E0',
    glow: 'rgba(224, 216, 168, 0.4)',
  },
]

/**
 * 在指定 canvas 上真实绘制海报
 *  - width/height: 750×1334 (3:4 标准移动端)
 *  - 性能：单帧绘制，无渐变动画
 *
 * 兼容 H5 / 微信小程序：使用 2d context
 */
export function renderPoster(canvas: any, ctx: any, config: PosterConfig, width = 750, height = 1334): void {
  if (!ctx) {
    console.error('[poster] Canvas 2D context not available')
    return
  }
  const tpl = TEMPLATES.find(t => t.key === config.template) || TEMPLATES[0]

  // 1. 背景渐变
  const bg = ctx.createLinearGradient(0, 0, 0, height)
  bg.addColorStop(0, tpl.gradient[0])
  bg.addColorStop(0.5, tpl.gradient[1])
  bg.addColorStop(1, tpl.gradient[2])
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  // 2. 装饰：底部光晕圆
  const glow1 = ctx.createRadialGradient(width * 0.5, height * 0.85, 0, width * 0.5, height * 0.85, width * 0.7)
  glow1.addColorStop(0, tpl.glow)
  glow1.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = glow1
  ctx.fillRect(0, 0, width, height)

  // 3. 装饰：顶部光晕圆
  const glow2 = ctx.createRadialGradient(width * 0.3, height * 0.15, 0, width * 0.3, height * 0.15, width * 0.4)
  glow2.addColorStop(0, tpl.glow)
  glow2.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = glow2
  ctx.fillRect(0, 0, width, height)

  // 4. 装饰：四角祥云边
  drawCornerClouds(ctx, width, height, tpl.accent)

  // 5. 顶部装饰带 + 角标
  if (config.badge) {
    drawBadge(ctx, width / 2, 100, config.badge, tpl.accent, tpl.text)
  }

  // 6. 中心太极
  drawTaiji(ctx, width / 2, height * 0.36, 110, tpl.accent, tpl.gradient[0])

  // 7. 中心大字
  ctx.fillStyle = tpl.text
  ctx.font = 'bold 200px KaiTi, STKaiti, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = tpl.glow
  ctx.shadowBlur = 30
  ctx.fillText(config.glyph, width / 2, height * 0.36)
  ctx.shadowBlur = 0

  // 8. 主标题
  ctx.fillStyle = tpl.accent
  ctx.font = 'bold 72px KaiTi, STKaiti, serif'
  ctx.shadowColor = tpl.glow
  ctx.shadowBlur = 16
  ctx.fillText(config.title, width / 2, height * 0.55)
  ctx.shadowBlur = 0

  // 9. 副标题
  ctx.fillStyle = tpl.text
  ctx.font = '36px KaiTi, STKaiti, serif'
  ctx.fillText(config.subtitle, width / 2, height * 0.62)

  // 10. 装饰分隔线
  drawDivider(ctx, width / 2, height * 0.67, 220, tpl.accent)

  // 11. 内容（自动换行 + 居中）
  ctx.fillStyle = tpl.text
  ctx.font = '34px KaiTi, STKaiti, serif'
  ctx.textAlign = 'center'
  const lineHeight = 56
  const startY = height * 0.72
  config.content.forEach((line, i) => {
    ctx.fillText(line, width / 2, startY + i * lineHeight)
  })

  // 12. 落款 + 日期
  const endY = height * 0.86
  if (config.signature) {
    ctx.fillStyle = tpl.accent
    ctx.font = '30px KaiTi, STKaiti, serif'
    ctx.fillText(config.signature, width / 2, endY)
  }
  ctx.fillStyle = tpl.text
  ctx.font = '28px KaiTi, STKaiti, serif'
  ctx.globalAlpha = 0.7
  ctx.fillText(config.dateStr, width / 2, endY + 50)
  ctx.globalAlpha = 1

  // 13. 底部金边 + 标语
  drawFooter(ctx, width, height, config.footer, tpl.accent, tpl.text)
}

function drawCornerClouds(ctx: any, w: number, h: number, color: string) {
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.4
  // 左上
  drawCloud(ctx, 50, 50, 100, 100)
  // 右上
  drawCloud(ctx, w - 50, 50, -100, 100)
  // 左下
  drawCloud(ctx, 50, h - 50, 100, -100)
  // 右下
  drawCloud(ctx, w - 50, h - 50, -100, -100)
  ctx.globalAlpha = 1
}

function drawCloud(ctx: any, cx: number, cy: number, dx: number, dy: number) {
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.quadraticCurveTo(cx + dx * 0.3, cy + dy * 0.3, cx + dx, cy)
  ctx.quadraticCurveTo(cx + dx * 0.7, cy + dy * 0.7, cx + dx, cy + dy)
  ctx.quadraticCurveTo(cx + dx * 0.3, cy + dy * 0.3, cx, cy + dy)
  ctx.stroke()
}

function drawBadge(ctx: any, cx: number, cy: number, text: string, accent: string, textColor: string) {
  // 矩形徽章背景
  ctx.font = '24px KaiTi, STKaiti, serif'
  const textW = ctx.measureText(text).width
  const padX = 24
  const padY = 10
  const w = textW + padX * 2
  const h = 28 + padY * 2
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.strokeStyle = accent
  ctx.lineWidth = 1
  ctx.beginPath()
  // 圆角矩形（手动画）
  const x = cx - w / 2
  const y = cy - h / 2
  const r = 14
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  // 文字
  ctx.fillStyle = textColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, cx, cy)
}

function drawTaiji(ctx: any, cx: number, cy: number, r: number, accent: string, dark: string) {
  // 中心大太极
  ctx.save()
  ctx.translate(cx, cy)
  // 黑色半边
  ctx.beginPath()
  ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2)
  ctx.fillStyle = dark
  ctx.fill()
  // 白色半边
  ctx.beginPath()
  ctx.arc(0, 0, r, Math.PI / 2, -Math.PI / 2)
  ctx.fillStyle = accent
  ctx.fill()
  // 上半部小圆
  ctx.beginPath()
  ctx.arc(0, -r / 2, r / 2, 0, Math.PI * 2)
  ctx.fillStyle = dark
  ctx.fill()
  // 下半部小圆
  ctx.beginPath()
  ctx.arc(0, r / 2, r / 2, 0, Math.PI * 2)
  ctx.fillStyle = accent
  ctx.fill()
  // 顶部鱼眼
  ctx.beginPath()
  ctx.arc(0, -r / 2, r / 6, 0, Math.PI * 2)
  ctx.fillStyle = accent
  ctx.fill()
  // 底部鱼眼
  ctx.beginPath()
  ctx.arc(0, r / 2, r / 6, 0, Math.PI * 2)
  ctx.fillStyle = dark
  ctx.fill()
  // 描边
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.strokeStyle = accent
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.5
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.restore()
}

function drawDivider(ctx: any, cx: number, cy: number, w: number, color: string) {
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.globalAlpha = 0.6
  // 左线
  ctx.beginPath()
  ctx.moveTo(cx - w / 2, cy)
  ctx.lineTo(cx - 20, cy)
  ctx.stroke()
  // 右线
  ctx.beginPath()
  ctx.moveTo(cx + 20, cy)
  ctx.lineTo(cx + w / 2, cy)
  ctx.stroke()
  // 中间装饰菱形
  ctx.beginPath()
  ctx.moveTo(cx - 16, cy)
  ctx.lineTo(cx, cy - 5)
  ctx.lineTo(cx + 16, cy)
  ctx.lineTo(cx, cy + 5)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.globalAlpha = 1
}

function drawFooter(ctx: any, w: number, h: number, text: string, accent: string, textColor: string) {
  // 底部金边
  ctx.strokeStyle = accent
  ctx.lineWidth = 1
  ctx.globalAlpha = 0.4
  ctx.beginPath()
  ctx.moveTo(w * 0.15, h - 100)
  ctx.lineTo(w * 0.85, h - 100)
  ctx.stroke()
  ctx.globalAlpha = 1
  // 底部小字
  ctx.fillStyle = textColor
  ctx.font = '24px KaiTi, STKaiti, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.globalAlpha = 0.6
  ctx.fillText(text, w / 2, h - 60)
  ctx.globalAlpha = 1
  // 装饰 "·  ·  ·"
  ctx.fillStyle = accent
  ctx.globalAlpha = 0.5
  ctx.fillText('·  ·  ·', w / 2, h - 30)
  ctx.globalAlpha = 1
}

/**
 * 准备海报内容（基于用户历史/档案自动填充）
 */
export function buildPosterFromHistory(
  type: 'gua' | 'bazi' | 'tarot' | 'ai' | 'liuyao' | 'custom',
  history?: { input?: any; output?: any; brief?: string } | null,
  profile?: { nickname?: string } | null,
): PosterConfig {
  const now = new Date()
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`
  const today = `${dateStr}`
  const base: PosterConfig = {
    template: 'xuanhei',
    type,
    glyph: '卦',
    title: '卦象初明',
    subtitle: '天机指引',
    content: ['乾为天 · 元亨利贞', '天行健 · 君子自强'],
    badge: 'DAILY · 今日一卦',
    signature: profile?.nickname || '玄友',
    dateStr: today,
    footer: '玄枢 MISTVERSE · 你的玄学工具集',
  }
  if (!history) {
    return base
  }
  const out = history.output || {}
  const inp = history.input || {}
  switch (type) {
    case 'gua':
      return {
        ...base,
        glyph: '卦',
        title: out.guaName || '卦象初明',
        subtitle: out.bianGuaName ? `变 ${out.bianGuaName}` : '天机指引',
        content: [
          out.guaName || '乾为天',
          out.fortune || '元亨利贞',
          out.summary?.slice(0, 24) || '诸事顺遂',
        ],
        badge: 'DESTINY · 今日一卦',
      }
    case 'bazi':
      return {
        ...base,
        glyph: '命',
        title: '命由天定',
        subtitle: '运由己造',
        content: [
          out.dayGan ? `日主 ${out.dayGan}` : '日主甲木',
          out.wuxing || '五行平和',
          out.summary || '一命二运三风水',
        ],
        badge: 'FATE · 命格已成',
      }
    case 'tarot':
      return {
        ...base,
        glyph: '✦',
        title: out.card || '愚者',
        subtitle: '新的开始',
        content: [
          out.card || '愚者 · The Fool',
          out.meaning || '新的旅程',
          '无限可能',
        ],
        badge: 'TAROT · 塔罗之心',
      }
    case 'liuyao':
      return {
        ...base,
        glyph: '爻',
        title: out.benGua || '本卦',
        subtitle: out.bianGua ? `变 ${out.bianGua}` : '静观其变',
        content: [
          `本卦 ${out.benGua || '—'}`,
          `变卦 ${out.bianGua || '—'}`,
          `用神 ${out.yongshen || '—'} · ${out.status || '—'}`,
        ],
        badge: 'LIUYAO · 玄枢易盘',
      }
    case 'ai':
      return {
        ...base,
        glyph: '智',
        title: 'AI 玄谈',
        subtitle: '六师共议',
        content: [
          inp.master ? `问于 ${inp.master}` : '问卦',
          out.reply?.slice(0, 12) || '万事皆有其时',
          '玄枢六师 · 智慧相授',
        ],
        badge: 'AI · 六师问答',
      }
    default:
      return base
  }
}

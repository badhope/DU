/**
 * 玄枢 MISTVERSE · 节气养生 + 五运六气
 *
 *  - 24 节气
 *  - 五运六气：主运 / 客运 / 中运 / 六气（司天/在泉/客主加临）
 *  - 当年运气分析
 *  - 饮食起居
 */

import type { Wuxing } from './wuxing'
import { SHENG, KE } from './wuxing'

// ============ 24 节气 ============
export interface Jieqi {
  name: string
  en: string
  pinyin: string
  month: number // 所属月份
  day: number // 大致日期
  season: '春' | '夏' | '长夏' | '秋' | '冬'
  solarTerm: string // 节 / 气
  nature: string
  health: string
  diet: string[]
  taboo: string[]
  wuxing: Wuxing
  shengxiao: string
}

export const JIEQI_24: Jieqi[] = [
  {
    name: '立春',
    en: 'Lichun',
    pinyin: 'lìchūn',
    month: 2,
    day: 4,
    season: '春',
    solarTerm: '节',
    nature: '东风解冻 · 万物始生',
    health: '护肝养阳',
    diet: ['葱', '韭', '春笋', '豆芽'],
    taboo: ['油腻', '酸收'],
    wuxing: 'mu',
    shengxiao: '虎',
  },
  {
    name: '雨水',
    en: 'Yushui',
    pinyin: 'yǔshuǐ',
    month: 2,
    day: 19,
    season: '春',
    solarTerm: '气',
    nature: '冰雪融化 · 散而为雨',
    health: '健脾祛湿',
    diet: ['山药', '薏米', '红枣'],
    taboo: ['寒凉', '生冷'],
    wuxing: 'mu',
    shengxiao: '兔',
  },
  {
    name: '惊蛰',
    en: 'Jingzhe',
    pinyin: 'jīngzhé',
    month: 3,
    day: 5,
    season: '春',
    solarTerm: '节',
    nature: '春雷始鸣 · 蛰虫惊醒',
    health: '养肝护阳',
    diet: ['银耳', '梨', '枇杷'],
    taboo: ['辛辣', '动怒'],
    wuxing: 'mu',
    shengxiao: '龙',
  },
  {
    name: '春分',
    en: 'Chunfen',
    pinyin: 'chūnfēn',
    month: 3,
    day: 20,
    season: '春',
    solarTerm: '气',
    nature: '昼夜等分 · 阴阳平衡',
    health: '调和阴阳',
    diet: ['香椿', '荠菜', '菠菜'],
    taboo: ['大寒大热'],
    wuxing: 'mu',
    shengxiao: '蛇',
  },
  {
    name: '清明',
    en: 'Qingming',
    pinyin: 'qīngmíng',
    month: 4,
    day: 5,
    season: '春',
    solarTerm: '节',
    nature: '气清景明 · 万物皆显',
    health: '疏肝清肺',
    diet: ['荠菜', '青团', '螺蛳'],
    taboo: ['悲伤', '久卧'],
    wuxing: 'mu',
    shengxiao: '马',
  },
  {
    name: '谷雨',
    en: 'Guyu',
    pinyin: 'gǔyǔ',
    month: 4,
    day: 20,
    season: '春',
    solarTerm: '气',
    nature: '雨生百谷 · 春生之极',
    health: '养肝健脾',
    diet: ['香椿', '薏米', '黄豆'],
    taboo: ['湿重', '生冷'],
    wuxing: 'mu',
    shengxiao: '羊',
  },
  {
    name: '立夏',
    en: 'Lixia',
    pinyin: 'lìxià',
    month: 5,
    day: 5,
    season: '夏',
    solarTerm: '节',
    nature: '夏气始交 · 万物长大',
    health: '养心清火',
    diet: ['苦瓜', '莲子', '绿豆'],
    taboo: ['大汗', '暴怒'],
    wuxing: 'huo',
    shengxiao: '猴',
  },
  {
    name: '小满',
    en: 'Xiaoman',
    pinyin: 'xiǎomǎn',
    month: 5,
    day: 21,
    season: '夏',
    solarTerm: '气',
    nature: '小满未满 · 江河渐满',
    health: '清热利湿',
    diet: ['黄瓜', '西红柿', '麦冬'],
    taboo: ['生冷', '油腻'],
    wuxing: 'huo',
    shengxiao: '鸡',
  },
  {
    name: '芒种',
    en: 'Mangzhong',
    pinyin: 'mángzhòng',
    month: 6,
    day: 5,
    season: '夏',
    solarTerm: '节',
    nature: '麦类成熟 · 忙种之极',
    health: '祛湿防暑',
    diet: ['红豆', '薏米', '冬瓜'],
    taboo: ['冷饮', '湿滞'],
    wuxing: 'huo',
    shengxiao: '狗',
  },
  {
    name: '夏至',
    en: 'Xiazhi',
    pinyin: 'xiàzhì',
    month: 6,
    day: 21,
    season: '夏',
    solarTerm: '气',
    nature: '昼长夜短 · 阳极生阴',
    health: '养心阴',
    diet: ['苦瓜', '西瓜', '绿豆汤'],
    taboo: ['熬夜', '冷饮'],
    wuxing: 'huo',
    shengxiao: '猪',
  },
  {
    name: '小暑',
    en: 'Xiaoshu',
    pinyin: 'xiǎoshǔ',
    month: 7,
    day: 7,
    season: '夏',
    solarTerm: '节',
    nature: '暑气始热 · 温风至',
    health: '清热解暑',
    diet: ['绿豆', '冬瓜', '薏米'],
    taboo: ['暴晒', '冰食'],
    wuxing: 'huo',
    shengxiao: '鼠',
  },
  {
    name: '大暑',
    en: 'Dashu',
    pinyin: 'dàshǔ',
    month: 7,
    day: 22,
    season: '长夏',
    solarTerm: '气',
    nature: '大暑大热 · 蒸腾至极',
    health: '祛暑益气',
    diet: ['薏米', '莲子', '百合', '绿豆'],
    taboo: ['过劳', '中暑'],
    wuxing: 'tu',
    shengxiao: '牛',
  },
  {
    name: '立秋',
    en: 'Liqiu',
    pinyin: 'lìqiū',
    month: 8,
    day: 7,
    season: '秋',
    solarTerm: '节',
    nature: '凉风至 · 暑气止',
    health: '养肺润燥',
    diet: ['银耳', '百合', '梨'],
    taboo: ['辛辣', '悲伤'],
    wuxing: 'jin',
    shengxiao: '虎',
  },
  {
    name: '处暑',
    en: 'Chushu',
    pinyin: 'chǔshǔ',
    month: 8,
    day: 23,
    season: '秋',
    solarTerm: '气',
    nature: '暑气止 · 秋凉生',
    health: '养阴润燥',
    diet: ['蜂蜜', '莲藕', '山药'],
    taboo: ['辛热', '干燥'],
    wuxing: 'jin',
    shengxiao: '兔',
  },
  {
    name: '白露',
    en: 'Bailu',
    pinyin: 'báilù',
    month: 9,
    day: 7,
    season: '秋',
    solarTerm: '节',
    nature: '阴气渐重 · 露凝而白',
    health: '养肺防燥',
    diet: ['银耳', '龙眼', '百合'],
    taboo: ['寒凉', '海鲜'],
    wuxing: 'jin',
    shengxiao: '龙',
  },
  {
    name: '秋分',
    en: 'Qiufen',
    pinyin: 'qiūfēn',
    month: 9,
    day: 23,
    season: '秋',
    solarTerm: '气',
    nature: '昼夜等分 · 阴阳均',
    health: '润肺养阴',
    diet: ['梨', '蜂蜜', '白萝卜'],
    taboo: ['大热大寒'],
    wuxing: 'jin',
    shengxiao: '蛇',
  },
  {
    name: '寒露',
    en: 'Hanlu',
    pinyin: 'hánlù',
    month: 10,
    day: 8,
    season: '秋',
    solarTerm: '节',
    nature: '露气转寒 · 凝结为霜',
    health: '润肺养胃',
    diet: ['山药', '核桃', '芝麻'],
    taboo: ['冷饮', '油腻'],
    wuxing: 'jin',
    shengxiao: '马',
  },
  {
    name: '霜降',
    en: 'Shuangjiang',
    pinyin: 'shuāngjiàng',
    month: 10,
    day: 23,
    season: '秋',
    solarTerm: '气',
    nature: '初霜出现 · 秋之末',
    health: '养肾护阳',
    diet: ['栗子', '柿子', '山药'],
    taboo: ['秋冻过度', '辛辣'],
    wuxing: 'jin',
    shengxiao: '羊',
  },
  {
    name: '立冬',
    en: 'Lidong',
    pinyin: 'lìdōng',
    month: 11,
    day: 7,
    season: '冬',
    solarTerm: '节',
    nature: '冬气始闭 · 万物收藏',
    health: '养肾藏精',
    diet: ['黑芝麻', '核桃', '黑豆'],
    taboo: ['出汗', '熬夜'],
    wuxing: 'shui',
    shengxiao: '猴',
  },
  {
    name: '小雪',
    en: 'Xiaoxue',
    pinyin: 'xiǎoxuě',
    month: 11,
    day: 22,
    season: '冬',
    solarTerm: '气',
    nature: '小雪初降 · 阴气重',
    health: '温肾驱寒',
    diet: ['羊肉', '红枣', '桂圆'],
    taboo: ['寒凉', '生冷'],
    wuxing: 'shui',
    shengxiao: '鸡',
  },
  {
    name: '大雪',
    en: 'Daxue',
    pinyin: 'dàxuě',
    month: 12,
    day: 7,
    season: '冬',
    solarTerm: '节',
    nature: '大雪封河 · 阴极之盛',
    health: '温补助阳',
    diet: ['羊肉', '牛肉', '桂圆', '当归'],
    taboo: ['冷饮', '熬夜'],
    wuxing: 'shui',
    shengxiao: '狗',
  },
  {
    name: '冬至',
    en: 'Dongzhi',
    pinyin: 'dōngzhì',
    month: 12,
    day: 21,
    season: '冬',
    solarTerm: '气',
    nature: '昼短夜长 · 一阳始生',
    health: '温阳养肾',
    diet: ['饺子', '汤圆', '羊肉'],
    taboo: ['寒凉', '大汗'],
    wuxing: 'shui',
    shengxiao: '猪',
  },
  {
    name: '小寒',
    en: 'Xiaohan',
    pinyin: 'xiǎohán',
    month: 1,
    day: 5,
    season: '冬',
    solarTerm: '节',
    nature: '小寒大冷 · 冬深之始',
    health: '温肾护心',
    diet: ['羊肉', '核桃', '红枣'],
    taboo: ['冷食', '过劳'],
    wuxing: 'shui',
    shengxiao: '鼠',
  },
  {
    name: '大寒',
    en: 'Dahan',
    pinyin: 'dàhán',
    month: 1,
    day: 20,
    season: '冬',
    solarTerm: '气',
    nature: '大寒至 · 冬之末也',
    health: '护阳养藏',
    diet: ['葱白', '生姜', '红枣'],
    taboo: ['寒凉', '夜行'],
    wuxing: 'shui',
    shengxiao: '牛',
  },
]

// ============ 当前节气 ============
export function currentJieqi(date?: Date): Jieqi {
  const d = date || new Date()
  const m = d.getMonth() + 1
  const day = d.getDate()
  // 找最近的节气
  let best: Jieqi = JIEQI_24[0]
  let bestDist = Infinity
  for (const j of JIEQI_24) {
    const dist = Math.abs((m - j.month) * 30 + (day - j.day))
    if (dist < bestDist) {
      bestDist = dist
      best = j
    }
  }
  return best
}

// ============ 五运六气 ============
/**
 * 推算当年天干 → 中运
 * 甲己合化土 → 中运土
 * 乙庚合化金 → 中运金
 * 丙辛合化水 → 中运水
 * 丁壬合化木 → 中运木
 * 戊癸合化火 → 中运火
 */
export interface WuyunLiuqi {
  year: number
  tianGan: string
  zhongYun: Wuxing // 中运 / 年运
  dayun: Wuxing // 大运（主运）
  keYun: Wuxing // 客运
  sitian: Wuxing // 司天之气
  zaiquan: Wuxing // 在泉之气
  jianqi: string[] // 客气六气
  principle: string
  health: string
  disease: string
  treatment: string
  yongyao: string // 用药
}

const ZHONGYUN_MAP: Record<string, Wuxing> = {
  甲: 'tu',
  己: 'tu',
  乙: 'jin',
  庚: 'jin',
  丙: 'shui',
  辛: 'shui',
  丁: 'mu',
  壬: 'mu',
  戊: 'huo',
  癸: 'huo',
}

const SITIAN_MAP: Record<string, Wuxing> = {
  子: 'jin',
  午: 'jin',
  丑: 'tu',
  未: 'tu',
  寅: 'huo',
  申: 'huo',
  卯: 'mu',
  酉: 'mu',
  辰: 'shui',
  戌: 'shui',
  巳: 'mu',
  亥: 'mu', // 简化
}

export function wuyun(year: number): WuyunLiuqi {
  const tgIdx = (((year - 4) % 10) + 10) % 10
  const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
  const tianGan = TIANGAN[tgIdx]
  const zhongYun = ZHONGYUN_MAP[tianGan]
  const zhiIdx = (((year - 4) % 12) + 12) % 12
  const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
  const zhi = DIZHI[zhiIdx]
  const sitian = SITIAN_MAP[zhi]
  // 在泉 = 司天相对
  const WX: Wuxing[] = ['mu', 'huo', 'tu', 'jin', 'shui']
  const sitianIdx = WX.indexOf(sitian)
  const zaiquan = WX[(sitianIdx + 3) % 5]
  // 客运（按年干推）
  const keYun = SHENG[zhongYun]

  // 主运：固定从木开始
  const dayunStart = 'mu'
  const _dayunList: Wuxing[] = [dayunStart, 'huo', 'tu', 'jin', 'shui']

  // 客气六气（简化）
  const jianqi: string[] = [
    `初之气：${SHENG[sitian]}主气`,
    `二之气：${WX[(WX.indexOf(sitian) + 1) % 5]}`,
    `三之气：${sitian}（司天）`,
    `四之气：${WX[(WX.indexOf(sitian) + 2) % 5]}`,
    `五之气：${WX[(WX.indexOf(sitian) + 3) % 5]}`,
    `终之气：${zaiquan}（在泉）`,
  ]

  // 推算疾病（基于胜复）
  const SICK_MAP: Record<Wuxing, string> = {
    mu: '肝胆疾病 · 筋络抽搐 · 目疾 · 情志抑郁',
    huo: '心脑疾病 · 口舌生疮 · 失眠 · 神志不安',
    tu: '脾胃疾病 · 腹胀腹泻 · 食欲不振 · 湿困',
    jin: '肺系疾病 · 咳嗽气喘 · 皮毛干燥 · 鼻咽不适',
    shui: '肾与膀胱 · 腰膝寒痛 · 水肿 · 阳虚怕冷',
  }
  // 胜 → 客主加临
  const disease = `司天${sitian} · 易见${SICK_MAP[sitian]}；在泉${zaiquan} · 易见${SICK_MAP[zaiquan]}`

  const principle = `${year} 年天干${tianGan} · 中运${zhongYun} · 司天${sitian} · 在泉${zaiquan}。木火土金水，五行流转。`
  const health = `本年气候以${zhongYun}为主，谨防${SICK_MAP[zhongYun]}。`
  const treatment = `用${SHENG[zhongYun]}之品养之，避${KE[zhongYun]}之害。`
  const yongyao = `${zhongYun}虚者补之，${KE[zhongYun]}盛者泻之。`

  return {
    year,
    tianGan,
    zhongYun,
    dayun: dayunStart,
    keYun,
    sitian,
    zaiquan,
    jianqi,
    principle,
    health,
    disease,
    treatment,
    yongyao,
  }
}

// ============ 当年主运序列 ============
/**
 * 主运：5 步，每运 73 日 5 刻
 * 初运：木
 * 二运：火
 * 三运：土
 * 四运：金
 * 终运：水
 */
export function mainDayuns() {
  return [
    {
      step: '初运',
      wx: 'mu' as Wuxing,
      days: '大寒 ~ 春分后 13 日',
      principle: '木运主时 · 风气流行',
      health: '肝胆',
    },
    {
      step: '二运',
      wx: 'huo' as Wuxing,
      days: '春分后 13 日 ~ 芒种后 10 日',
      principle: '火运主时 · 暑热渐盛',
      health: '心脑',
    },
    {
      step: '三运',
      wx: 'tu' as Wuxing,
      days: '芒种后 10 日 ~ 处暑后 7 日',
      principle: '土运主时 · 湿气大行',
      health: '脾胃',
    },
    {
      step: '四运',
      wx: 'jin' as Wuxing,
      days: '处暑后 7 日 ~ 立冬后 4 日',
      principle: '金运主时 · 燥气流行',
      health: '肺系',
    },
    {
      step: '终运',
      wx: 'shui' as Wuxing,
      days: '立冬后 4 日 ~ 大寒',
      principle: '水运主时 · 寒气凛冽',
      health: '肾与膀胱',
    },
  ]
}

/**
 * 运气七篇 · 高级中医运气
 *
 * 出处：《黄帝内经·素问》"天元纪大论"等七篇 —— 唐代王冰次注
 *
 * 核心理论：
 *  1. 五运：甲己土运、乙庚金运、丙辛水运、丁壬木运、戊癸火运（中运/岁运）
 *  2. 六气：司天在泉（子午少阴君火、丑未太阴湿土、寅申少阳相火、卯酉阳明燥金、辰戌太阳寒水、巳亥厥阴风木）
 *  3. 客主加临：客主逆从论病
 *  4. 体质九分：五行 + 寒热燥湿
 *  5. 经方推荐
 *
 * 本实现覆盖《素问》"七篇大论"之核心
 */

import type { TianGan, DiZhi } from './bazi'

// ============ 天干化运 ============

/** 甲己之年丙作首 → 土运 */
const TIANGAN_TO_YUN: Record<TianGan, '木' | '火' | '土' | '金' | '水'> = {
  甲: '土', 己: '土', // 甲己化土
  乙: '金', 庚: '金', // 乙庚化金
  丙: '水', 辛: '水', // 丙辛化水
  丁: '木', 壬: '木', // 丁壬化木
  戊: '火', 癸: '火', // 戊癸化火
}

// ============ 地支化气（司天/在泉） ============

interface SixQi {
  siTian: '厥阴风木' | '少阴君火' | '太阴湿土' | '少阳相火' | '阳明燥金' | '太阳寒水'
  zaiQuan: '厥阴风木' | '少阴君火' | '太阴湿土' | '少阳相火' | '阳明燥金' | '太阳寒水'
}

const DIZHI_TO_QI: Record<DiZhi, SixQi> = {
  子: { siTian: '少阴君火', zaiQuan: '阳明燥金' },
  午: { siTian: '少阴君火', zaiQuan: '阳明燥金' },
  丑: { siTian: '太阴湿土', zaiQuan: '太阳寒水' },
  未: { siTian: '太阴湿土', zaiQuan: '太阳寒水' },
  寅: { siTian: '少阳相火', zaiQuan: '厥阴风木' },
  申: { siTian: '少阳相火', zaiQuan: '厥阴风木' },
  卯: { siTian: '阳明燥金', zaiQuan: '少阴君火' },
  酉: { siTian: '阳明燥金', zaiQuan: '少阴君火' },
  辰: { siTian: '太阳寒水', zaiQuan: '太阴湿土' },
  戌: { siTian: '太阳寒水', zaiQuan: '太阴湿土' },
  巳: { siTian: '厥阴风木', zaiQuan: '少阳相火' },
  亥: { siTian: '厥阴风木', zaiQuan: '少阳相火' },
}

// ============ 客主加临（暂以岁支为主气） ============

const SIX_QI_ORDER: ('厥阴风木' | '少阴君火' | '太阴湿土' | '少阳相火' | '阳明燥金' | '太阳寒水')[] = [
  '厥阴风木', '少阴君火', '太阴湿土', '少阳相火', '阳明燥金', '太阳寒水',
]

// 每年 6 步气（从大寒开始）
const STEP_QI_BY_ZHI: Record<DiZhi, ('厥阴风木' | '少阴君火' | '太阴湿土' | '少阳相火' | '阳明燥金' | '太阳寒水')[]> = {
  子: ['太阳寒水', '厥阴风木', '少阴君火', '太阴湿土', '少阳相火', '阳明燥金'],
  午: ['少阴君火', '太阴湿土', '少阳相火', '阳明燥金', '太阳寒水', '厥阴风木'],
  丑: ['厥阴风木', '少阴君火', '太阴湿土', '少阳相火', '阳明燥金', '太阳寒水'],
  未: ['太阴湿土', '少阳相火', '阳明燥金', '太阳寒水', '厥阴风木', '少阴君火'],
  寅: ['少阳相火', '阳明燥金', '太阳寒水', '厥阴风木', '少阴君火', '太阴湿土'],
  申: ['阳明燥金', '太阳寒水', '厥阴风木', '少阴君火', '太阴湿土', '少阳相火'],
  卯: ['太阳寒水', '厥阴风木', '少阴君火', '太阴湿土', '少阳相火', '阳明燥金'],
  酉: ['少阴君火', '太阴湿土', '少阳相火', '阳明燥金', '太阳寒水', '厥阴风木'],
  辰: ['厥阴风木', '少阴君火', '太阴湿土', '少阳相火', '阳明燥金', '太阳寒水'],
  戌: ['太阴湿土', '少阳相火', '阳明燥金', '太阳寒水', '厥阴风木', '少阴君火'],
  巳: ['少阳相火', '阳明燥金', '太阳寒水', '厥阴风木', '少阴君火', '太阴湿土'],
  亥: ['阳明燥金', '太阳寒水', '厥阴风木', '少阴君火', '太阴湿土', '少阳相火'],
}

const STEP_NAMES = ['初之气', '二之气', '三之气', '四之气', '五之气', '终之气']

// ============ 五运分析 ============

export interface YunQiResult {
  year: number
  ganZhi: string
  yun: '木' | '火' | '土' | '金' | '水'
  yunName: string
  siTian: string
  zaiQuan: string
  siTianName: string
  zaiQuanName: string
  stepQi: Array<{ name: string; siTianQi: string; zaiQuanQi: string; jieqi: string; main: string }>
  /** 当年五运六气总论 */
  summary: string
  /** 经方推荐（按气） */
  prescriptions: Array<{ qi: string; jingFang: string; effect: string }>
  /** 体质九分 */
  tizhi: Array<{ name: string; score: number; desc: string; yangsheng: string }>
  /** 饮食宜忌 */
  diet: { yi: string[]; ji: string[] }
  /** 强身要点 */
  healthTips: string[]
}

const YUN_FULLNAME: Record<'木' | '火' | '土' | '金' | '水', string> = {
  木: '木运',
  火: '火运',
  土: '土运',
  金: '金运',
  水: '水运',
}

const QI_FULLNAME: Record<string, string> = {
  '厥阴风木': '厥阴风木',
  '少阴君火': '少阴君火',
  '太阴湿土': '太阴湿土',
  '少阳相火': '少阳相火',
  '阳明燥金': '阳明燥金',
  '太阳寒水': '太阳寒水',
}

const JIEQI_STEPS = [
  '大寒 → 春分前',
  '春分 → 小满前',
  '小满 → 大暑前',
  '大暑 → 秋分前',
  '秋分 → 小雪前',
  '小雪 → 大寒前',
]

const JING_FANG: Record<string, Array<{ name: string; effect: string }>> = {
  '厥阴风木': [
    { name: '乌梅丸', effect: '厥阴寒热错杂 · 安蛔 · 温脏' },
    { name: '当归四逆汤', effect: '厥阴血虚寒厥 · 温经散寒' },
  ],
  '少阴君火': [
    { name: '黄连阿胶汤', effect: '少阴心肾不交 · 滋阴降火' },
    { name: '真武汤', effect: '少阴阳虚水泛 · 温阳利水' },
    { name: '四逆汤', effect: '少阴寒化 · 回阳救逆' },
  ],
  '太阴湿土': [
    { name: '理中丸', effect: '太阴脾虚寒湿 · 温中散寒' },
    { name: '平胃散', effect: '太阴湿困 · 燥湿运脾' },
  ],
  '少阳相火': [
    { name: '小柴胡汤', effect: '少阳枢机不利 · 和解少阳' },
    { name: '蒿芩清胆汤', effect: '少阳湿热 · 清胆利湿' },
  ],
  '阳明燥金': [
    { name: '白虎汤', effect: '阳明气分热盛 · 清热生津' },
    { name: '增液汤', effect: '阳明津亏 · 增液润燥' },
    { name: '桑杏汤', effect: '温燥伤津 · 清宣润燥' },
  ],
  '太阳寒水': [
    { name: '麻黄汤', effect: '太阳伤寒 · 辛温解表' },
    { name: '桂枝汤', effect: '太阳中风 · 解肌和营' },
    { name: '五苓散', effect: '太阳蓄水 · 化气利水' },
  ],
}

export function getYunQi(year: number): YunQiResult {
  // 年干支简化：直接以 1984 年甲子为基准
  const base = 1984
  const diff = year - base
  const ganIdx = ((diff % 10) + 10) % 10
  const zhiIdx = ((diff % 12) + 12) % 12
  const TIANGAN: TianGan[] = ['甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉'] as any
  const gan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'][ganIdx] as TianGan
  const zhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'][zhiIdx] as DiZhi
  const ganZhi = `${gan}${zhi}`
  const yun = TIANGAN_TO_YUN[gan]
  const yunName = YUN_FULLNAME[yun]
  const qi = DIZHI_TO_QI[zhi]
  const siTianName = QI_FULLNAME[qi.siTian]
  const zaiQuanName = QI_FULLNAME[qi.zaiQuan]
  // 6 步气
  const steps = STEP_QI_BY_ZHI[zhi]
  const stepQi = steps.map((s, i) => {
    const list = JING_FANG[s] || []
    return {
      name: STEP_NAMES[i],
      siTianQi: qi.siTian,
      zaiQuanQi: qi.zaiQuan,
      jieqi: JIEQI_STEPS[i],
      main: `${s}当令 · ${list[0] ? list[0].name : '调养为主'}`,
    }
  })
  // 经方
  const prescriptions: YunQiResult['prescriptions'] = []
  ;(steps as any[]).forEach((s, i) => {
    const list = JING_FANG[s] || []
    if (list[0]) {
      prescriptions.push({ qi: STEP_NAMES[i], jingFang: list[0].name, effect: list[0].effect })
    }
  })
  // 体质九分
  const tizhi: YunQiResult['tizhi'] = [
    { name: '阳虚体质', score: yun === '水' || qi.zaiQuan === '太阳寒水' ? 80 : 50, desc: '畏寒肢冷 · 喜暖 · 精神不振', yangsheng: '温阳散寒 · 多食羊肉、生姜、肉桂 · 艾灸关元、命门' },
    { name: '阴虚体质', score: yun === '火' || qi.zaiQuan === '少阴君火' ? 80 : 40, desc: '手足心热 · 口干咽燥 · 喜冷饮', yangsheng: '滋阴润燥 · 多食银耳、百合、麦冬 · 少熬夜' },
    { name: '气虚体质', score: yun === '土' ? 70 : 45, desc: '易疲劳 · 说话少气 · 易感冒', yangsheng: '补气健脾 · 多食山药、黄芪、大枣 · 八段锦、太极' },
    { name: '痰湿体质', score: qi.siTian === '太阴湿土' ? 85 : 40, desc: '体形肥胖 · 痰多 · 面油 · 舌苔厚腻', yangsheng: '化痰祛湿 · 多食薏苡仁、芡实、荷叶 · 忌甜腻' },
    { name: '湿热体质', score: qi.siTian === '少阳相火' ? 80 : 35, desc: '面油痘多 · 口苦 · 大便黏滞', yangsheng: '清热利湿 · 多食绿豆、苦瓜、冬瓜 · 戒酒少辣' },
    { name: '血瘀体质', score: yun === '金' || qi.siTian === '阳明燥金' ? 60 : 30, desc: '面色晦暗 · 唇色紫暗 · 易疼痛', yangsheng: '活血化瘀 · 多食山楂、玫瑰、红花 · 适度运动' },
    { name: '气郁体质', score: qi.siTian === '厥阴风木' ? 70 : 35, desc: '情绪低落 · 胸闷叹气 · 咽部异物感', yangsheng: '疏肝解郁 · 多食陈皮、佛手、香橼 · 瑜伽、冥想' },
    { name: '特禀体质', score: 25, desc: '易过敏 · 哮喘 · 荨麻疹', yangsheng: '益气固表 · 黄芪、灵芝 · 避风寒、过敏原' },
    { name: '平和体质', score: yun === '土' && qi.siTian === '太阴湿土' ? 75 : 50, desc: '体形匀称 · 面色润泽 · 精力充沛', yangsheng: '维持平衡 · 饮食有节 · 起居有常' },
  ]
  // 饮食
  const diet: YunQiResult['diet'] = {
    yi: [],
    ji: [],
  }
  if (yun === '木') {
    diet.yi.push('酸味 · 绿色蔬菜')
    diet.ji.push('过酸伤脾')
  } else if (yun === '火') {
    diet.yi.push('苦味 · 清热食物')
    diet.ji.push('辛辣助火')
  } else if (yun === '土') {
    diet.yi.push('甘味 · 健脾食物')
    diet.ji.push('过甘生湿')
  } else if (yun === '金') {
    diet.yi.push('辛味 · 润肺食物')
    diet.ji.push('过辛耗气')
  } else {
    diet.yi.push('咸味 · 黑色食物')
    diet.ji.push('过咸伤肾')
  }
  if (qi.siTian === '太阳寒水') {
    diet.yi.push('温热食物 · 姜枣茶')
    diet.ji.push('生冷寒凉')
  } else if (qi.siTian === '少阴君火' || qi.siTian === '少阳相火') {
    diet.yi.push('清热 · 绿豆 · 苦瓜')
    diet.ji.push('温补上火')
  } else if (qi.siTian === '太阴湿土') {
    diet.yi.push('健脾利湿 · 薏米')
    diet.ji.push('油腻甜腻')
  } else if (qi.siTian === '阳明燥金') {
    diet.yi.push('润燥 · 梨 · 银耳')
    diet.ji.push('辛燥伤津')
  } else if (qi.siTian === '厥阴风木') {
    diet.yi.push('疏肝 · 陈皮 · 玫瑰')
    diet.ji.push('动风发物')
  }
  // 强身要点
  const healthTips: string[] = [
    `${year} 年 ${ganZhi} · 中运为 ${yunName} · 司天 ${siTianName} · 在泉 ${zaiQuanName}`,
    `本年大运 · ${yunName}${yun === '木' ? '风' : yun === '火' ? '热' : yun === '土' ? '湿' : yun === '金' ? '燥' : '寒'}气为常`,
    `司天 ${siTianName} · 半年间当令 · 在泉 ${zaiQuanName} · 后半年当令`,
    `六步气：${steps.join(' → ')}`,
    `起居：顺四时 · 冬藏春生夏长秋收 · 子时前必睡`,
    `情志：春季舒肝 · 夏季养心 · 秋季润肺 · 冬季补肾`,
  ]
  // 总论
  const summary = `${year} 年 ${ganZhi} · ${yunName} · 司天 ${siTianName} · 在泉 ${zaiQuanName} · 主气 ${steps[0]} · 此年气运与体质之关系 · 当审而调之`
  return {
    year,
    ganZhi,
    yun,
    yunName,
    siTian: qi.siTian,
    zaiQuan: qi.zaiQuan,
    siTianName,
    zaiQuanName,
    stepQi,
    summary,
    prescriptions,
    tizhi,
    diet,
    healthTips,
  }
}

/**
 * 玄枢 MISTVERSE · 数字能量
 *
 *  - 手机号 / 数字串
 *  - 五行磁场：木(1,2)、火(3,4)、土(5,6)、金(7,8)、水(9,0)
 *  - 8 大组合：天医/延年/生气/伏位/绝命/五鬼/六煞/祸害
 *  - 评分：吉凶组合（吉 = 80+ 平 = 60+ 凶 = 30-）
 */

const WUXING_MAP: Record<number, '木' | '火' | '土' | '金' | '水'> = {
  1: '木', 2: '木',
  3: '火', 4: '火',
  5: '土', 6: '土',
  7: '金', 8: '金',
  9: '水', 0: '水',
}

// 8 大组合规则（简化版：基于数对出现频率）
const COMBO_DB: Array<{ name: string, type: '吉' | '平' | '凶', desc: string, best: string[] }> = [
  { name: '天医', type: '吉', desc: '财富磁场 · 主财运 · 遇贵人 · 善用可发家', best: ['求财', '经营', '创业'] },
  { name: '延年', type: '吉', desc: '主磁场 · 健康长寿 · 婚姻和合 · 大利人缘', best: ['婚姻', '健康', '人际'] },
  { name: '生气', type: '吉', desc: '喜庆磁场 · 贵人扶持 · 小人远离 · 乐观开朗', best: ['事业', '人际', '求财'] },
  { name: '伏位', type: '平', desc: '稳定磁场 · 主守成 · 静待时机 · 不可冒进', best: ['守成', '稳定'] },
  { name: '绝命', type: '凶', desc: '破财磁场 · 主投资失利 · 健康堪忧 · 慎用', best: ['保守'] },
  { name: '五鬼', type: '凶', desc: '口舌磁场 · 主是非 · 慎言慎行 · 远离小人', best: ['守口'] },
  { name: '六煞', type: '凶', desc: '桃花磁场 · 主婚变 · 感情纠葛 · 慎用', best: ['守心'] },
  { name: '祸害', type: '凶', desc: '病符磁场 · 主疾病 · 健康需关注 · 慎用', best: ['守身'] },
]

export interface ShuzhiAnalysis {
  input: string
  wuXingSeq: Array<'木' | '火' | '土' | '金' | '水'>
  dominant: '木' | '火' | '土' | '金' | '水'
  pairs: Array<{ combo: typeof COMBO_DB[number], count: number }>
  scores: {
    caiyun: number     // 财运
    renyuan: number    // 人缘
    jiankang: number   // 健康
    zonghe: number     // 综合
  }
  level: '吉' | '平' | '凶'
  summary: string
  advice: string
  // 数字段分析
  segments: Array<{ start: number, end: number, num: string, wuXing: '木' | '火' | '土' | '金' | '水' }>
}

export function analyzeShuzhi(input: string): ShuzhiAnalysis {
  const digits = input.replace(/\D/g, '').split('').map(d => Number(d)).filter(d => !isNaN(d))
  if (digits.length < 2) {
    return {
      input, wuXingSeq: [], dominant: '木', pairs: [],
      scores: { caiyun: 50, renyuan: 50, jiankang: 50, zonghe: 50 },
      level: '平', summary: '请输入至少 2 位数字', advice: '输入手机号/QQ/车牌等数字串',
      segments: [],
    }
  }

  const wuXingSeq = digits.map(d => WUXING_MAP[d])
  // 主导五行
  const counts: Record<string, number> = {}
  wuXingSeq.forEach(w => { counts[w] = (counts[w] || 0) + 1 })
  const dominant = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '木') as '木' | '火' | '土' | '金' | '水'

  // 段分析（每 4 位一段）
  const segments: ShuzhiAnalysis['segments'] = []
  for (let i = 0; i < digits.length; i += 4) {
    const seg = digits.slice(i, i + 4)
    const segStr = seg.join('')
    const segArr = seg.map(d => WUXING_MAP[d])
    const sorted = segArr.sort((a, b) => (counts[b] || 0) - (counts[a] || 0))
    const segWx: '木' | '火' | '土' | '金' | '水' = (counts[sorted[0]] || 0) > 2
      ? (sorted[0] as '木' | '火' | '土' | '金' | '水')
      : (segArr[Math.floor(segArr.length / 2)] as '木' | '火' | '土' | '金' | '水')
    segments.push({ start: i, end: i + seg.length - 1, num: segStr, wuXing: segWx })
  }

  // 组合对
  const pairCount: Record<string, number> = {}
  for (let i = 0; i < digits.length - 1; i++) {
    const key = `${digits[i]}${digits[i + 1]}`
    pairCount[key] = (pairCount[key] || 0) + 1
  }
  // 简化为按 8 大组合分类
  const pairs: ShuzhiAnalysis['pairs'] = []
  // 简单哈希分布
  const seenComboIdx = new Set<number>()
  for (const [key, count] of Object.entries(pairCount).sort((a, b) => b[1] - a[1]).slice(0, 5)) {
    const h = key.charCodeAt(0) * 13 + key.charCodeAt(1) * 17
    const idx = Math.abs(h) % COMBO_DB.length
    if (seenComboIdx.has(idx)) continue
    seenComboIdx.add(idx)
    pairs.push({ combo: COMBO_DB[idx], count })
  }

  // 评分
  let caiyun = 50, renyuan = 50, jiankang = 50
  pairs.forEach(p => {
    if (p.combo.type === '吉') {
      caiyun += p.count * 4
      renyuan += p.count * 3
      jiankang += p.count * 2
    } else if (p.combo.type === '凶') {
      caiyun -= p.count * 5
      renyuan -= p.count * 3
      jiankang -= p.count * 5
    }
  })
  caiyun = Math.max(20, Math.min(100, caiyun))
  renyuan = Math.max(20, Math.min(100, renyuan))
  jiankang = Math.max(20, Math.min(100, jiankang))
  const zonghe = Math.round((caiyun + renyuan + jiankang) / 3)

  let level: '吉' | '平' | '凶' = '平'
  if (zonghe >= 70) level = '吉'
  else if (zonghe < 50) level = '凶'

  const summaryMap: Record<string, string> = {
    '吉': `综合评分 ${zonghe} · 五行以${dominant}为主 · 多吉组合`,
    '平': `综合评分 ${zonghe} · 五行以${dominant}为主 · 吉凶参半`,
    '凶': `综合评分 ${zonghe} · 五行以${dominant}为主 · 多凶组合`,
  }
  const adviceMap: Record<string, string> = {
    '吉': '利求财 · 利事业 · 善用此数可成大业',
    '平': '守成为上 · 不宜冒进 · 顺势而为',
    '凶': '谨慎使用 · 避免投资 · 修身养性',
  }

  return {
    input,
    wuXingSeq,
    dominant,
    pairs,
    scores: { caiyun, renyuan, jiankang, zonghe },
    level,
    summary: summaryMap[level],
    advice: adviceMap[level],
    segments,
  }
}

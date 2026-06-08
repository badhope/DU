/**
 * 玄枢 MISTVERSE · 家谱排辈
 *
 *  - 字辈诗（5 世/10 世）
 *  - 世系计算（第几代）
 *  - 取名：基于当代字辈 + 五行
 *  - 排行（伯/仲/叔/季）
 */

export const ZIBEI_EXAMPLES: Array<{ family: string, poem: string, startGen: number }> = [
  { family: '李氏',  poem: '德泽绵长福寿康，文章华国万世昌。忠孝传家为本色，仁义立世显辉煌。', startGen: 18 },
  { family: '王氏',  poem: '永世承先泽，文章焕国光。诗书传礼义，忠孝振家纲。', startGen: 22 },
  { family: '张氏',  poem: '正大光明立，承先启后新。诗礼传家久，忠义振家声。', startGen: 16 },
  { family: '刘氏',  poem: '文运开昌运，仁声继祖声。贤才光世德，俊彦显家声。', startGen: 20 },
  { family: '陈氏',  poem: '忠厚传家久，诗书继世长。勤俭立根本，和顺致吉祥。', startGen: 19 },
]

export interface Generation {
  gen: number           // 第几代
  zibei: string         // 字辈
  startYear: number
  endYear: number
  range: string         // 第 X-X 世
  totalCount: number    // 该代人口
}

export interface FamilyTree {
  surname: string
  poem: string
  startGen: number
  generations: Generation[]
  currentGen: number
  currentZibei: string
  // 命名字辈（取名建议）
  suggested: Array<{ gender: '男' | '女', name: string, meaning: string, wuXing: string }>
}

const MALE_NAMES = ['伟', '强', '磊', '军', '勇', '涛', '明', '超', '刚', '平']
const FEMALE_NAMES = ['芳', '娜', '敏', '静', '丽', '艳', '娟', '英', '华', '慧']
const MALE_MEANING: Record<string, string> = {
  '伟': '伟岸挺拔 · 志向远大', '强': '刚健有为 · 自立自强', '磊': '光明磊落 · 胸怀坦荡',
  '军': '军伍之志 · 刚毅果断', '勇': '勇敢果决 · 奋进有为', '涛': '波涛壮阔 · 气势磅礴',
  '明': '明理通达 · 智慧圆融', '超': '超越常人 · 志在千里', '刚': '刚正不阿 · 坚毅不拔',
  '平': '平和安稳 · 厚德载物',
}
const FEMALE_MEANING: Record<string, string> = {
  '芳': '芬芳馥郁 · 美德流芳', '娜': '婀娜多姿 · 优雅从容', '敏': '敏捷聪慧 · 灵敏多智',
  '静': '宁静致远 · 温婉内秀', '丽': '美丽端庄 · 风姿绰约', '艳': '明艳照人 · 才华出众',
  '娟': '娟秀清雅 · 慧质兰心', '英': '英姿飒爽 · 才德兼备', '华': '才华横溢 · 风华正茂',
  '慧': '智慧圆融 · 通达事理',
}

function buildPoemGen(poem: string, startGen: number, year: number): Generation[] {
  const chars = poem.replace(/[，。,.\s]/g, '').split('')
  const gens: Generation[] = []
  const avgYearsPerGen = 25
  for (let i = 0; i < chars.length; i++) {
    const g = startGen + i
    const startY = (i === 0 ? 1900 : gens[gens.length - 1].endYear + 1)
    const endY = startY + avgYearsPerGen - 1
    gens.push({
      gen: g, zibei: chars[i],
      startYear: startY, endYear: endY,
      range: `${g}-${g} 世`,
      totalCount: Math.floor(40 + (i % 3) * 15 + (year % 7)),
    })
  }
  return gens
}

export function buildFamilyTree(surname: string, year: number, month: number, day: number, hour: number, gender: '男' | '女', poem?: string): FamilyTree {
  // 找到姓氏对应的字辈诗
  const ex = ZIBEI_EXAMPLES.find(e => e.family.startsWith(surname)) || ZIBEI_EXAMPLES[0]
  const usedPoem = poem || ex.poem
  const startGen = ex.startGen

  const generations = buildPoemGen(usedPoem, startGen, year)
  // 计算当前代（基于出生年份）
  const yearSpan = year - generations[0].startYear
  const currentGenIdx = Math.max(0, Math.min(generations.length - 1, Math.floor(yearSpan / 25)))
  const currentGen = generations[currentGenIdx]
  // 如果超过 25 年一个辈分 +5 代
  const calcGen = generations.find((g, i) => year >= g.startYear && year <= g.endYear) || currentGen
  const currentZibei = calcGen.zibei

  // 取名建议
  const names = gender === '男' ? MALE_NAMES : FEMALE_NAMES
  const meanings = gender === '男' ? MALE_MEANING : FEMALE_MEANING
  const wxPool = ['木', '火', '土', '金', '水']
  const suggested = names.slice(0, 6).map(n => ({
    gender, name: `${surname}${currentZibei}${n}`,
    meaning: meanings[n] || '德行兼备',
    wuXing: wxPool[Math.abs(n.charCodeAt(0) + year) % 5],
  }))

  return {
    surname,
    poem: usedPoem,
    startGen,
    generations,
    currentGen: calcGen.gen,
    currentZibei,
    suggested,
  }
}

/**
 * 找诗中第 X 辈的字
 */
export function zibeiOfGen(poem: string, gen: number, startGen: number): string {
  const chars = poem.replace(/[，。,.\s]/g, '').split('')
  const idx = gen - startGen
  return chars[idx] || '?'
}

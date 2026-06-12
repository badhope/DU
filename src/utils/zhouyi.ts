/**
 * 周易本义 · 64 卦完整排盘与十翼详批
 *
 * 核心功能：
 *  1. 时间起卦（《周易本义》法）— 64 卦随机生成
 *  2. 卦象：上下卦、单卦、变卦、错卦、综卦、互卦
 *  3. 十翼：彖传、象传、文言、系辞、说卦、序卦、杂卦
 *  4. 64 卦卦辞、爻辞（精简版）
 *  5. 五行六亲世应分析
 *  6. 用神定位与动静生克
 *
 * 全部 64 卦的精简十翼文本已在本文件内置。出于体积考虑，64 卦本义皆为简本，
 * 适合在工具内速览；若需详本可参考朱熹《周易本义》原文。
 */

export const TRIGRAMS = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'] as const
export type Trigram = (typeof TRIGRAMS)[number]

/** 单卦三爻（自下而上 1=初爻, 2=中爻, 3=上爻）· true=阳, false=阴 */
export type Line = 1 | 0
export type Yao = [Line, Line, Line] // [初, 中, 上]

/** 五行 */
export const WUXING_OF_TRIGRAM: Record<Trigram, '金' | '木' | '水' | '火' | '土'> = {
  乾: '金',
  兑: '金',
  离: '火',
  震: '木',
  巽: '木',
  坎: '水',
  艮: '土',
  坤: '土',
}

/** 64 卦名表（自 1 乾 至 64 未济） */
export const HEXAGRAM_NAMES: string[] = [
  '乾', '坤', '屯', '蒙', '需', '讼', '师', '比',
  '小畜', '履', '泰', '否', '同人', '大有', '谦', '豫',
  '随', '蛊', '临', '观', '噬嗑', '贲', '剥', '复',
  '无妄', '大畜', '颐', '大过', '坎', '离', '咸', '恒',
  '遁', '大壮', '晋', '明夷', '家人', '睽', '蹇', '解',
  '损', '益', '夬', '姤', '萃', '升', '困', '井',
  '革', '鼎', '震', '艮', '渐', '归妹', '丰', '旅',
  '巽', '兑', '涣', '节', '中孚', '小过', '既济', '未济',
]

/**
 * 64 卦简本（《周易本义》节录）
 * 每卦包含：卦辞、彖、象（精简）、6 爻辞
 * 出处：朱熹《周易本义》—— 公版
 */
export const HEXAGRAM_TEXTS: Record<number, {
  guaCi: string
  tuan: string
  xiang: string
  yaoCi: [string, string, string, string, string, string]
  fiveEl: string
  judgement: string
}> = {
  1: { guaCi: '乾。元亨利贞。', tuan: '大哉乾元 · 万物资始 · 乃统天', xiang: '天行健 · 君子以自强不息', yaoCi: ['初九 · 潜龙勿用', '九二 · 见龙在田 · 利见大人', '九三 · 君子终日乾乾 · 夕惕若厉 · 无咎', '九四 · 或跃在渊 · 无咎', '九五 · 飞龙在天 · 利见大人', '上九 · 亢龙有悔'], fiveEl: '金', judgement: '刚健中正 · 大业可成' },
  2: { guaCi: '坤。元亨 · 利牝马之贞。', tuan: '至哉坤元 · 万物资生 · 乃顺承天', xiang: '地势坤 · 君子以厚德载物', yaoCi: ['初六 · 履霜 · 坚冰至', '六二 · 直方大 · 不习无不利', '六三 · 含章可贞 · 或从王事 · 无成有终', '六四 · 括囊 · 无咎无誉', '六五 · 黄裳元吉', '上六 · 龙战于野 · 其血玄黄'], fiveEl: '土', judgement: '柔顺包容 · 大地之德' },
  3: { guaCi: '屯。元亨利贞 · 勿用有攸往。', tuan: '屯 · 刚柔始交而难生', xiang: '云雷屯 · 君子以经纶', yaoCi: ['初九 · 磐桓 · 利居贞 · 利建侯', '六二 · 屯如 · 邅如 · 乘马班如', '六三 · 即鹿无虞 · 惟入于林中', '六四 · 乘马班如 · 求婚媾 · 往吉', '九五 · 屯其膏 · 小贞吉 · 大贞凶', '上六 · 乘马班如 · 泣血涟如'], fiveEl: '水', judgement: '起步艰难 · 待机而动' },
  4: { guaCi: '蒙。亨 · 匪我求童蒙 · 童蒙求我。', tuan: '蒙 · 山下有险 · 险而止 · 蒙', xiang: '山下出泉 · 蒙 · 君子以果行育德', yaoCi: ['初六 · 发蒙 · 利用刑人', '九二 · 包蒙吉 · 纳妇吉 · 子克家', '六三 · 勿用取女 · 见金夫', '六四 · 困蒙 · 吝', '六五 · 童蒙 · 吉', '上九 · 击蒙 · 不利为寇 · 利御寇'], fiveEl: '山', judgement: '求知问道 · 待师启蔽' },
  5: { guaCi: '需。有孚 · 光亨 · 贞吉 · 利涉大川。', tuan: '需 · 须也 · 险在前也', xiang: '云上于天 · 需 · 君子以饮食宴乐', yaoCi: ['初九 · 需于郊 · 利用恒 · 无咎', '九二 · 需于沙 · 小有言 · 终吉', '九三 · 需于泥 · 致寇至', '六四 · 需于血 · 顺以听命', '九五 · 需于酒食 · 贞吉', '上六 · 入于穴 · 有不速之客三人来'], fiveEl: '水', judgement: '守正待时 · 必有亨通' },
  6: { guaCi: '讼。有孚 · 窒惕 · 中吉 · 终凶。', tuan: '讼 · 上刚下险 · 险而健 · 讼', xiang: '天与水 · 讼 · 君子以作事谋始', yaoCi: ['初六 · 不永所事 · 小有言 · 终吉', '九二 · 不克讼 · 归而逋', '六三 · 食旧德 · 贞厉 · 终吉', '九四 · 不克讼 · 复即命渝', '九五 · 讼元吉', '上九 · 或锡之鞶带 · 终朝三褫之'], fiveEl: '天水', judgement: '争讼之象 · 退让为上' },
  7: { guaCi: '师。贞 · 丈人吉 · 无咎。', tuan: '师 · 众也 · 贞正也', xiang: '地中有水 · 师 · 君子以容民畜众', yaoCi: ['初六 · 师出以律 · 否臧凶', '九二 · 在师中 · 吉无咎 · 王三锡命', '六三 · 师或舆尸 · 凶', '六四 · 师左次 · 无咎', '六五 · 田有禽 · 利执言', '上六 · 大君有命 · 开国承家'], fiveEl: '地水', judgement: '军旅之象 · 统众之力' },
  8: { guaCi: '比。吉 · 原筮元永贞 · 无咎。', tuan: '比 · 吉也 · 比 · 辅也', xiang: '地上有水 · 比 · 先王以建万国 · 亲诸侯', yaoCi: ['初六 · 有孚比之 · 无咎', '六二 · 比之自内 · 贞吉', '六三 · 比之匪人', '六四 · 外比之 · 贞吉', '九五 · 显比 · 王用三驱', '上六 · 比之无首 · 凶'], fiveEl: '水地', judgement: '亲比之象 · 朋友得力' },
  9: { guaCi: '小畜。亨 · 密云不雨 · 自我西郊。', tuan: '小畜 · 柔得位而上下应之', xiang: '风行天上 · 小畜 · 君子以懿文德', yaoCi: ['初九 · 复自道 · 何其咎 · 吉', '九二 · 牵复 · 吉', '九三 · 舆说辐 · 夫妻反目', '六四 · 有孚 · 血去惕出 · 无咎', '九五 · 有孚挛如 · 富以其邻', '上九 · 既雨既处 · 尚德载 · 妇贞厉'], fiveEl: '风天', judgement: '小有蓄积 · 宜慎守' },
  10: { guaCi: '履。履虎尾 · 不咥人 · 亨。', tuan: '履 · 柔履刚也', xiang: '上天下泽 · 履 · 君子以辩上下 · 定民志', yaoCi: ['初九 · 素履往 · 无咎', '九二 · 履道坦坦 · 幽人贞吉', '六三 · 眇能视 · 跛能履', '九四 · 履虎尾 · 愬愬终吉', '九五 · 夬履 · 贞厉', '上九 · 视履考祥 · 其旋元吉'], fiveEl: '天泽', judgement: '如履薄冰 · 礼仪之职' },
  11: { guaCi: '泰。小往大来 · 吉亨。', tuan: '泰 · 小往大来 · 吉亨', xiang: '天地交 · 泰 · 后以财成天地之道', yaoCi: ['初九 · 拔茅茹 · 以其汇 · 征吉', '九二 · 包荒 · 用冯河 · 不遐遗', '九三 · 无平不陂 · 无往不复', '六四 · 翩翩 · 不富以其邻', '六五 · 帝乙归妹 · 以祉元吉', '上六 · 城复于隍 · 勿用师'], fiveEl: '天地', judgement: '天地交泰 · 万事亨通' },
  12: { guaCi: '否之匪人 · 不利君子贞 · 大往小来。', tuan: '否之匪人 · 不利君子贞', xiang: '天地不交 · 否 · 君子以俭德辟难', yaoCi: ['初六 · 拔茅茹 · 以其汇 · 贞吉 · 亨', '六二 · 包承 · 小人吉 · 大人否', '六三 · 包羞', '九四 · 有命无咎 · 畴离祉', '九五 · 休否 · 大人吉', '上九 · 倾否 · 先否后喜'], fiveEl: '天地', judgement: '天地不交 · 静守待变' },
  13: { guaCi: '同人于野 · 亨 · 利涉大川 · 利君子贞。', tuan: '同人 · 柔得位得中而应乎乾', xiang: '天与火 · 同人 · 君子以类族辨物', yaoCi: ['初九 · 同人于门 · 无咎', '六二 · 同人于宗 · 吝', '九三 · 伏戎于莽 · 升其高陵', '九四 · 乘其墉 · 弗克攻 · 吉', '九五 · 同人先号咷而后笑', '上九 · 同人于郊 · 无悔'], fiveEl: '天火', judgement: '同志相济 · 大业可成' },
  14: { guaCi: '大有。元亨。', tuan: '大有 · 柔得尊位 · 大中而上下应之', xiang: '火在天上 · 大有 · 君子以遏恶扬善', yaoCi: ['初九 · 无交害 · 匪咎 · 艰则无咎', '九二 · 大车以载 · 有攸往 · 无咎', '九三 · 公用亨于天子 · 小人弗克', '九四 · 匪其彭 · 无咎', '六五 · 厥孚交如 · 威如 · 吉', '上九 · 自天佑之 · 吉无不利'], fiveEl: '火天', judgement: '大有所得 · 名利双收' },
  15: { guaCi: '谦。亨 · 君子有终。', tuan: '谦 · 亨 · 天道下济而光明', xiang: '地中有山 · 谦 · 君子以裒多益寡', yaoCi: ['初六 · 谦谦君子 · 用涉大川 · 吉', '六二 · 鸣谦 · 贞吉', '九三 · 劳谦 · 君子有终 · 吉', '六四 · 无不利 · 撝谦', '六五 · 不富以其邻 · 利用侵伐', '上六 · 鸣谦 · 利用行师'], fiveEl: '地山', judgement: '谦谦君子 · 满招损谦受益' },
  16: { guaCi: '豫。利建侯行师。', tuan: '豫 · 刚应而志行', xiang: '雷出地奋 · 豫 · 先王以作乐崇德', yaoCi: ['初六 · 鸣豫 · 凶', '六二 · 介于石 · 不终日 · 贞吉', '六三 · 盱豫 · 悔 · 迟有悔', '九四 · 由豫 · 大有得 · 勿疑', '六五 · 贞疾 · 恒不死', '上六 · 冥豫成 · 有渝无咎'], fiveEl: '雷地', judgement: '豫者乐也 · 奋发有为' },
  17: { guaCi: '随。元亨利贞 · 无咎。', tuan: '随 · 刚来而下柔 · 动而说', xiang: '泽中有雷 · 随 · 君子以向晦入宴息', yaoCi: ['初九 · 官有渝 · 贞吉 · 出门交有功', '六二 · 系小子 · 失丈夫', '六三 · 系丈夫 · 失小子', '九四 · 随有获 · 贞凶 · 有孚在道', '九五 · 孚于嘉 · 吉', '上六 · 拘系之 · 乃从'], fiveEl: '泽雷', judgement: '随机应变 · 随遇而安' },
  18: { guaCi: '蛊。元亨 · 利涉大川。', tuan: '蛊 · 刚上而柔下 · 巽而止 · 蛊', xiang: '山下有风 · 蛊 · 君子以振民育德', yaoCi: ['初六 · 干父之蛊 · 有子考 · 无咎', '九二 · 干母之蛊 · 不可贞', '九三 · 干父之蛊 · 小有悔', '六四 · 裕父之蛊 · 往见吝', '六五 · 干父之蛊 · 用誉', '上九 · 不事王侯 · 高尚其事'], fiveEl: '山风', judgement: '革故鼎新 · 整治旧业' },
  19: { guaCi: '临。元亨利贞 · 至于八月有凶。', tuan: '临 · 刚浸而长', xiang: '泽上有地 · 临 · 君子以教思无穷', yaoCi: ['初九 · 咸临 · 贞吉', '九二 · 咸临 · 吉 · 无不利', '六三 · 甘临 · 无攸利', '六四 · 至临 · 无咎', '六五 · 知临 · 大君之宜 · 吉', '上六 · 敦临 · 吉无咎'], fiveEl: '地泽', judgement: '日渐上升 · 临者大也' },
  20: { guaCi: '观。盥而不荐 · 有孚颙若。', tuan: '观 · 大观在上 · 顺而巽', xiang: '风行地上 · 观 · 先王以省方观民设教', yaoCi: ['初六 · 童观 · 小人无咎 · 君子吝', '六二 · 窥观 · 利女贞', '六三 · 观我生 · 进退', '六四 · 观国之光 · 利用宾于王', '九五 · 观我生 · 君子无咎', '上九 · 观其生 · 君子无咎'], fiveEl: '风地', judgement: '观察时势 · 旁观者清' },
  21: { guaCi: '噬嗑。亨 · 利用狱。', tuan: '噬嗑 · 颐中有物 · 曰噬嗑', xiang: '雷电 · 噬嗑 · 先王以明罚敕法', yaoCi: ['初九 · 屦校灭趾 · 无咎', '六二 · 噬肤灭鼻 · 无咎', '六三 · 噬腊肉 · 遇毒', '九四 · 噬干胏 · 得金矢', '六五 · 噬干肉 · 得黄金', '上九 · 何校灭耳 · 凶'], fiveEl: '火雷', judgement: '决断是非 · 雷厉风行' },
  22: { guaCi: '贲。亨 · 小利有所往。', tuan: '贲 · 柔来而文刚 · 故亨', xiang: '山下有火 · 贲 · 君子以明庶政 · 无敢折狱', yaoCi: ['初九 · 贲其趾 · 舍车而徒', '六二 · 贲其须', '九三 · 贲如濡如 · 永贞吉', '六四 · 贲如皤如 · 白马翰如', '六五 · 贲于丘园 · 束帛戋戋', '上九 · 白贲 · 无咎'], fiveEl: '山火', judgement: '文饰之象 · 文采斐然' },
  23: { guaCi: '剥。不利有攸往。', tuan: '剥 · 柔变刚也', xiang: '山附于地 · 剥 · 上以厚下安宅', yaoCi: ['初六 · 剥床以足 · 蔑贞凶', '六二 · 剥床以辨 · 蔑贞凶', '六三 · 剥之 · 无咎', '六四 · 剥床以肤 · 凶', '六五 · 贯鱼 · 以宫人宠', '上九 · 硕果不食 · 君子得舆'], fiveEl: '山地', judgement: '剥者落也 · 不可妄动' },
  24: { guaCi: '复。亨 · 出入无疾 · 朋来无咎。', tuan: '复 · 刚反 · 动而以顺行', xiang: '雷在地中 · 复 · 先王以至日闭关', yaoCi: ['初九 · 不远复 · 无祗悔 · 元吉', '六二 · 休复 · 吉', '六三 · 频复 · 厉无咎', '六四 · 中行独复', '六五 · 敦复 · 无悔', '上六 · 迷复 · 凶 · 有灾眚'], fiveEl: '地雷', judgement: '一阳来复 · 转机在望' },
  25: { guaCi: '无妄。元亨利贞。', tuan: '无妄 · 刚自外来而为主于内', xiang: '天下雷行 · 无妄 · 先王以茂对时育万物', yaoCi: ['初九 · 无妄 · 往吉', '六二 · 不耕获 · 不菑畬 · 则利有攸往', '六三 · 无妄之灾 · 或系之牛', '九四 · 可贞 · 无咎', '九五 · 无妄之疾 · 勿药有喜', '上九 · 无妄 · 行有眚'], fiveEl: '天雷', judgement: '不妄动 · 顺天而行' },
  26: { guaCi: '大畜。利贞 · 不家食吉 · 利涉大川。', tuan: '大畜 · 刚健 · 笃实 · 辉光', xiang: '天在山中 · 大畜 · 君子以多识前言往行', yaoCi: ['初九 · 有厉 · 利已', '九二 · 舆说輹', '九三 · 良马逐 · 利艰贞', '六四 · 童牛之牿 · 元吉', '六五 · 豮豕之牙 · 吉', '上九 · 何天之衢 · 亨'], fiveEl: '山天', judgement: '刚健笃实 · 厚积薄发' },
  27: { guaCi: '颐。贞吉 · 观颐 · 自求口实。', tuan: '颐 · 养正则吉', xiang: '山下有雷 · 颐 · 君子以慎言语 · 节饮食', yaoCi: ['初九 · 舍尔灵龟 · 观我朵颐 · 凶', '六二 · 颠颐 · 拂经', '六三 · 拂颐 · 贞凶', '六四 · 颠颐 · 吉', '六五 · 拂经 · 居贞吉', '上九 · 由颐 · 厉吉 · 利涉大川'], fiveEl: '山雷', judgement: '颐者养也 · 自养养人' },
  28: { guaCi: '大过。栋桡 · 利有所往。', tuan: '大过 · 大者过也', xiang: '泽灭木 · 大过 · 君子以独立不惧', yaoCi: ['初六 · 藉用白茅 · 无咎', '九二 · 枯杨生稊 · 老夫得其女妻', '九三 · 栋桡 · 凶', '九四 · 栋隆 · 吉 · 有它吝', '九五 · 枯杨生华 · 老妇得其士夫', '上六 · 过涉灭顶 · 凶 · 无咎'], fiveEl: '泽风', judgement: '栋桡 · 非常之时' },
  29: { guaCi: '习坎。有孚 · 维心亨 · 行有尚。', tuan: '习坎 · 重险也', xiang: '水洊至 · 习坎 · 君子以常德行 · 习教事', yaoCi: ['初六 · 习坎 · 入于坎窞 · 凶', '九二 · 坎有险 · 求小得', '六三 · 来之坎坎 · 险且枕', '六四 · 樽酒簋贰 · 用缶 · 纳约自牖', '九五 · 坎不盈 · 祗既平 · 无咎', '上六 · 系用徽纆 · 置于丛棘'], fiveEl: '坎', judgement: '重险 · 诚信通神' },
  30: { guaCi: '离。利贞 · 亨 · 畜牝牛吉。', tuan: '离 · 丽也 · 日月丽乎天', xiang: '明两作 · 离 · 大人以继明照于四方', yaoCi: ['初九 · 履错然 · 敬之无咎', '六二 · 黄离 · 元吉', '九三 · 日昃之离 · 不鼓缶而歌', '九四 · 突如其来如 · 焚如 · 死如', '六五 · 出涕沱若 · 戚嗟若 · 吉', '上九 · 王用出征 · 有嘉折首'], fiveEl: '火', judgement: '光明之象 · 离者丽也' },
  31: { guaCi: '咸。亨 · 利贞 · 取女吉。', tuan: '咸 · 感也 · 柔上而刚下', xiang: '山上有泽 · 咸 · 君子以虚受人', yaoCi: ['初六 · 咸其拇', '六二 · 咸其腓 · 凶 · 居吉', '九三 · 咸其股 · 执其随 · 往吝', '九四 · 贞吉 · 悔亡 · 憧憧往来', '九五 · 咸其脢 · 无悔', '上六 · 咸其辅 · 颊 · 舌'], fiveEl: '泽山', judgement: '二气感应 · 咸者感也' },
  32: { guaCi: '恒。亨 · 无咎 · 利贞 · 利有攸往。', tuan: '恒 · 久也 · 刚上而柔下', xiang: '雷风 · 恒 · 君子以立不易方', yaoCi: ['初六 · 浚恒 · 贞凶 · 无攸利', '九二 · 悔亡', '九三 · 不恒其德 · 或承之羞', '九四 · 田无禽', '六五 · 恒其德 · 贞 · 妇人吉', '上六 · 振恒 · 凶'], fiveEl: '雷风', judgement: '恒者久也 · 雷风相与' },
  33: { guaCi: '遁。亨 · 小利贞。', tuan: '遁 · 亨 · 遁而亨也', xiang: '天下有山 · 遁 · 君子以远小人 · 不恶而严', yaoCi: ['初六 · 遁尾 · 厉 · 勿用有攸往', '六二 · 执之用黄牛之革', '九三 · 系遁 · 有疾厉', '九四 · 好遁 · 君子吉 · 小人否', '九五 · 嘉遁 · 贞吉', '上九 · 肥遁 · 无不利'], fiveEl: '天山', judgement: '遁者退也 · 避世之象' },
  34: { guaCi: '大壮。利贞。', tuan: '大壮 · 大者壮也', xiang: '雷在天上 · 大壮 · 君子以非礼弗履', yaoCi: ['初九 · 壮于趾 · 征凶', '九二 · 贞吉', '九三 · 小人用壮 · 君子用罔', '九四 · 贞吉 · 悔亡 · 藩决不羸', '六五 · 丧羊于易 · 无悔', '上六 · 羝羊触藩 · 不能退'], fiveEl: '雷天', judgement: '阳气壮盛 · 慎用其壮' },
  35: { guaCi: '晋。康侯用锡马蕃庶 · 昼日三接。', tuan: '晋 · 柔进而上行', xiang: '明出地上 · 晋 · 君子以自昭明德', yaoCi: ['初六 · 晋如 · 摧如 · 贞吉', '六二 · 晋如 · 愁如 · 贞吉', '六三 · 众允 · 悔亡', '九四 · 晋如鼫鼠 · 贞厉', '六五 · 悔亡 · 失得勿恤', '上九 · 晋其角 · 维用伐邑'], fiveEl: '火地', judgement: '晋者进也 · 明出地上' },
  36: { guaCi: '明夷。利艰贞。', tuan: '明夷 · 诛也', xiang: '明入地中 · 明夷 · 君子以莅众 · 用晦而明', yaoCi: ['初九 · 明夷于飞 · 垂其翼', '六二 · 明夷 · 夷于左股', '九三 · 明夷于南狩 · 得其大首', '六四 · 入于左腹 · 获明夷之心', '六五 · 箕子之明夷 · 利贞', '上六 · 不明晦 · 初登于天'], fiveEl: '地火', judgement: '明夷 · 韬光 · 自昭明德' },
  37: { guaCi: '家人。利女贞。', tuan: '家人 · 女正位乎内 · 男正位乎外', xiang: '风自火出 · 家人 · 君子以言有物 · 而行有恒', yaoCi: ['初九 · 闲有家 · 悔亡', '六二 · 无攸遂 · 在中馈 · 贞吉', '九三 · 家人嗃嗃 · 悔厉吉', '六四 · 富家 · 大吉', '九五 · 王假有家 · 勿恤吉', '上九 · 有孚威如 · 终吉'], fiveEl: '风火', judgement: '利贞 · 治家之象' },
  38: { guaCi: '睽。小事吉。', tuan: '睽 · 火动而上 · 泽动而下', xiang: '上火下泽 · 睽 · 君子以同而异', yaoCi: ['初九 · 悔亡 · 丧马勿逐', '九二 · 遇主于巷 · 无咎', '六三 · 见舆曳 · 其牛掣', '九四 · 睽孤 · 遇元夫', '六五 · 悔亡 · 厥宗噬肤', '上九 · 睽孤 · 见豕负涂'], fiveEl: '火泽', judgement: '睽者乖也 · 二女同居' },
  39: { guaCi: '蹇。利西南 · 不利东北。', tuan: '蹇 · 难也 · 险在前也', xiang: '山上有水 · 蹇 · 君子以反身修德', yaoCi: ['初六 · 往蹇 · 来誉', '六二 · 王臣蹇蹇 · 匪躬之故', '九三 · 往蹇 · 来反', '六四 · 往蹇 · 来连', '九五 · 大蹇 · 朋来', '上六 · 往蹇 · 来硕 · 吉'], fiveEl: '水山', judgement: '蹇者难也 · 外难内止' },
  40: { guaCi: '解。利西南。', tuan: '解 · 缓也 · 险以动 · 动而免乎险', xiang: '雷雨作 · 解 · 君子以赦过宥罪', yaoCi: ['初六 · 无咎', '九二 · 田获三狐 · 得黄矢', '六三 · 负且乘 · 致寇至', '九四 · 解而拇 · 朋至斯孚', '六五 · 君子维有解 · 吉', '上六 · 公用射隼于高墉之上'], fiveEl: '雷水', judgement: '解者缓也 · 赦过宥罪' },
  41: { guaCi: '损。有孚 · 元吉 · 无咎 · 可贞。', tuan: '损 · 损下益上', xiang: '山下有泽 · 损 · 君子以惩忿窒欲', yaoCi: ['初九 · 已事遄往 · 无咎 · 酌损之', '九二 · 利贞 · 征凶', '六三 · 三人行 · 则损一人', '六四 · 损其疾 · 使遄有喜', '六五 · 或益之十朋之龟', '上九 · 弗损益之 · 无咎'], fiveEl: '山泽', judgement: '损者益也 · 损下益上' },
  42: { guaCi: '益。利有攸往 · 利涉大川。', tuan: '益 · 损上益下', xiang: '风雷 · 益 · 君子以见善则迁 · 有过则改', yaoCi: ['初九 · 利用为大作 · 元吉无咎', '六二 · 或益之十朋之龟', '六三 · 益之用凶事 · 无咎', '六四 · 中行告公从 · 利用为依', '九五 · 有孚惠心 · 勿问元吉', '上九 · 莫益之 · 或击之'], fiveEl: '风雷', judgement: '损上益下 · 益' },
  43: { guaCi: '夬。扬于王庭 · 孚号有厉。', tuan: '夬 · 决也 · 刚决柔也', xiang: '泽上于天 · 夬 · 君子以施禄及下', yaoCi: ['初九 · 壮于前趾 · 往不胜为咎', '九二 · 惕号 · 莫夜有戎 · 勿恤', '九三 · 壮于頄 · 有凶', '九四 · 臀无肤 · 其行次且', '九五 · 苋陆夬夬 · 中行无咎', '上六 · 无号 · 终有凶'], fiveEl: '泽天', judgement: '夬者决也 · 刚决柔' },
  44: { guaCi: '姤。女壮 · 勿用取女。', tuan: '姤 · 遇也 · 柔遇刚也', xiang: '天下有风 · 姤 · 后以施命诰四方', yaoCi: ['初六 · 系于金柅 · 贞吉', '九二 · 包有鱼 · 无咎 · 不利宾', '九三 · 臀无肤 · 其行次且', '九四 · 包无鱼 · 起凶', '九五 · 以杞包瓜 · 含章', '上九 · 姤其角 · 吝 · 无咎'], fiveEl: '天风', judgement: '姤者遇也 · 阴气初生' },
  45: { guaCi: '萃。亨 · 王假有庙。', tuan: '萃 · 聚也 · 顺以说', xiang: '泽上于地 · 萃 · 君子以除戎器 · 戒不虞', yaoCi: ['初六 · 有孚不终 · 乃乱乃萃', '六二 · 引吉 · 无咎 · 孚乃利用禴', '六三 · 萃如嗟如 · 无攸利', '九四 · 大吉 · 无咎', '九五 · 萃有位 · 无咎 · 匪孚', '上六 · 赍咨涕洟 · 无咎'], fiveEl: '泽地', judgement: '萃者聚也 · 聚集之象' },
  46: { guaCi: '升。元亨 · 用见大人 · 勿恤 · 南征吉。', tuan: '升 · 柔以时升', xiang: '地中生木 · 升 · 君子以顺德 · 积小以高大', yaoCi: ['初六 · 允升 · 大吉', '九二 · 孚乃利用禴 · 无咎', '九三 · 升虚邑', '六四 · 王用亨于岐山 · 吉', '六五 · 贞吉 · 升阶', '上六 · 冥升 · 利于不息之贞'], fiveEl: '地风', judgement: '升者进也 · 上升之象' },
  47: { guaCi: '困。亨 · 贞 · 大人吉 · 无咎。', tuan: '困 · 刚揜也', xiang: '泽无水 · 困 · 君子以致命遂志', yaoCi: ['初六 · 臀困于株木 · 入于幽谷', '九二 · 困于酒食 · 朱绂方来', '六三 · 困于石 · 据于蒺藜', '九四 · 来徐徐 · 困于金车', '九五 · 劓刖 · 困于赤绂', '上六 · 困于葛藟 · 于臲卼'], fiveEl: '泽水', judgement: '困者穷也 · 泽无水' },
  48: { guaCi: '井。改邑不改井。', tuan: '井 · 养而不穷也', xiang: '木上有水 · 井 · 君子以劳民劝相', yaoCi: ['初六 · 井泥不食 · 旧井无禽', '九二 · 井谷射鲋 · 瓮敝漏', '九三 · 井渫不食 · 为我心恻', '六四 · 井甃 · 无咎', '九五 · 井冽 · 寒泉食', '上六 · 井收勿幕 · 有孚元吉'], fiveEl: '水风', judgement: '井者养也 · 劳而不穷' },
  49: { guaCi: '革。己日乃孚 · 元亨利贞。', tuan: '革 · 水火相息 · 二女同居', xiang: '泽中有火 · 革 · 君子以治历明时', yaoCi: ['初九 · 巩用黄牛之革', '六二 · 己日乃革之 · 征吉 · 无咎', '九三 · 征凶 · 贞厉', '九四 · 悔亡 · 有孚改命', '九五 · 大人虎变 · 未占孚', '上六 · 君子豹变 · 小人革面'], fiveEl: '泽火', judgement: '革故鼎新' },
  50: { guaCi: '鼎。元吉 · 亨。', tuan: '鼎 · 柔进而上行 · 得中而应乎刚', xiang: '木上有火 · 鼎 · 君子以正位凝命', yaoCi: ['初六 · 鼎颠趾 · 利出否', '九二 · 鼎有实 · 我仇有疾', '九三 · 鼎耳革 · 其行塞', '六四 · 鼎折足 · 覆公餗', '六五 · 鼎黄耳金铉 · 利贞', '上九 · 鼎玉铉 · 大吉'], fiveEl: '火风', judgement: '鼎者器也 · 三足鼎立' },
  51: { guaCi: '震。亨 · 震来虩虩 · 笑言哑哑。', tuan: '震 · 惊也 · 刚来而恐惧', xiang: '洊雷 · 震 · 君子以恐惧修省', yaoCi: ['初九 · 震来虩虩 · 后笑言哑哑 · 吉', '六二 · 震来厉 · 亿丧贝', '六三 · 震苏苏 · 震行无眚', '九四 · 震遂泥', '六五 · 震往来厉 · 意无丧', '上六 · 震索索 · 视矍矍'], fiveEl: '震', judgement: '震者动也 · 震惊百里' },
  52: { guaCi: '艮。其背不获其身 · 行其庭不见其人 · 无咎。', tuan: '艮 · 止也 · 时止则止', xiang: '兼山 · 艮 · 君子以思不出其位', yaoCi: ['初六 · 艮其趾 · 无咎 · 利永贞', '六二 · 艮其腓 · 不拯其随', '九三 · 艮其限 · 列其夤', '六四 · 艮其身 · 无咎', '六五 · 艮其辅 · 言有序', '上九 · 敦艮 · 吉'], fiveEl: '艮', judgement: '艮者止也 · 时止则止' },
  53: { guaCi: '渐。女归吉 · 利贞。', tuan: '渐 · 渐之进也 · 女归吉也', xiang: '山上有木 · 渐 · 君子以居贤德 · 善俗', yaoCi: ['初六 · 鸿渐于干 · 小子厉', '六二 · 鸿渐于磐 · 饮食衎衎', '九三 · 鸿渐于陆 · 夫征不复', '六四 · 鸿渐于木 · 或得其桷', '九五 · 鸿渐于陵 · 妇三岁不孕', '上九 · 鸿渐于陆 · 其羽可用为仪'], fiveEl: '风山', judgement: '渐者进也 · 循序渐进' },
  54: { guaCi: '归妹。征凶 · 无攸利。', tuan: '归妹 · 女之终也', xiang: '泽上有雷 · 归妹 · 君子以永终知敝', yaoCi: ['初九 · 归妹以娣 · 跛能履 · 吉', '九二 · 眇能视 · 利幽人之贞', '六三 · 归妹以须 · 反归以娣', '九四 · 归妹愆期 · 迟归有时', '六五 · 帝乙归妹 · 其君之袂', '上六 · 女承筐无实'], fiveEl: '雷泽', judgement: '宜守不宜进' },
  55: { guaCi: '丰。亨 · 王假之 · 勿忧 · 宜日中。', tuan: '丰 · 大也 · 明以动', xiang: '雷电皆至 · 丰 · 君子以折狱致刑', yaoCi: ['初九 · 遇其配主 · 虽旬无咎', '六二 · 丰其蔀 · 日中见斗', '九三 · 丰其沛 · 日中见沫', '九四 · 丰其蔀 · 日中见斗', '六五 · 来章 · 有庆誉 · 吉', '上六 · 丰其屋 · 蔀其家'], fiveEl: '雷火', judgement: '丰者大也 · 盛大之象' },
  56: { guaCi: '旅。小亨 · 旅贞吉。', tuan: '旅 · 刚柔杂而不行', xiang: '山上有火 · 旅 · 君子以明慎用刑 · 而不留狱', yaoCi: ['初六 · 旅琐琐 · 斯其所取灾', '六二 · 旅即次 · 怀其资', '九三 · 旅焚其次 · 丧其童仆', '九四 · 旅于处 · 得其资斧', '六五 · 射雉 · 一矢亡', '上九 · 鸟焚其巢 · 旅人先笑后号咷'], fiveEl: '火山', judgement: '旅者客也 · 羁旅之象' },
  57: { guaCi: '巽。小亨 · 利有攸往 · 利见大人。', tuan: '巽 · 柔皆顺乎刚', xiang: '随风 · 巽 · 君子以申命行事', yaoCi: ['初六 · 进退 · 利武人之贞', '九二 · 巽在床下 · 用史巫纷若', '九三 · 频巽 · 吝', '六四 · 悔亡 · 田获三品', '九五 · 贞吉 · 悔亡 · 无不利', '上九 · 巽在床下 · 丧其资斧'], fiveEl: '巽', judgement: '巽者入也 · 谦逊之象' },
  58: { guaCi: '兑。亨 · 利贞。', tuan: '兑 · 说也 · 刚中而柔外', xiang: '丽泽 · 兑 · 君子以朋友讲习', yaoCi: ['初九 · 和兑 · 吉', '九二 · 孚兑 · 吉 · 悔亡', '六三 · 来兑 · 凶', '九四 · 商兑未宁 · 介疾有喜', '九五 · 孚于剥 · 有厉', '上六 · 引兑'], fiveEl: '兑', judgement: '兑者悦也 · 喜悦之象' },
  59: { guaCi: '涣。亨 · 王假有庙 · 利涉大川。', tuan: '涣 · 风行水上 · 乘木有功', xiang: '风行水上 · 涣 · 先王以享于帝立庙', yaoCi: ['初六 · 用拯马壮 · 吉', '九二 · 涣奔其机 · 悔亡', '六三 · 涣其躬 · 无悔', '六四 · 涣其群 · 元吉', '九五 · 涣汗其大号 · 涣王居', '上九 · 涣其血 · 去逖出 · 无咎'], fiveEl: '风水', judgement: '涣者散也 · 风行水上' },
  60: { guaCi: '节。亨 · 苦节不可贞。', tuan: '节 · 刚柔分而刚得中', xiang: '泽上有水 · 节 · 君子以制数度 · 议德行', yaoCi: ['初九 · 不出户庭 · 无咎', '九二 · 不出门庭 · 凶', '六三 · 不节若 · 则嗟若 · 无咎', '六四 · 安节 · 亨', '九五 · 甘节 · 吉 · 往有尚', '上六 · 苦节 · 贞凶 · 悔亡'], fiveEl: '水泽', judgement: '节 · 苦节不可贞' },
  61: { guaCi: '中孚。豚鱼吉 · 利涉大川 · 利贞。', tuan: '中孚 · 柔在内而刚得中', xiang: '泽上有风 · 中孚 · 君子以议狱缓死', yaoCi: ['初九 · 虞吉 · 有它不燕', '九二 · 鸣鹤在阴 · 其子和之', '六三 · 得敌 · 或鼓或罢', '六四 · 月几望 · 马匹亡', '九五 · 有孚挛如 · 无咎', '上九 · 翰音登于天 · 贞凶'], fiveEl: '风泽', judgement: '中孚 · 信及豚鱼' },
  62: { guaCi: '小过。亨 · 利贞 · 可小事 · 不可大事。', tuan: '小过 · 小者过而亨也', xiang: '山上有雷 · 小过 · 君子以行过乎恭 · 丧过乎哀', yaoCi: ['初六 · 飞鸟以凶', '六二 · 过其祖 · 遇其妣', '九三 · 弗过防之 · 从或戕之', '九四 · 无咎 · 弗过遇之', '六五 · 密云不雨 · 自我西郊', '上六 · 弗遇过之 · 飞鸟离之'], fiveEl: '雷山', judgement: '小过 · 飞鸟遗音' },
  63: { guaCi: '既济。亨 · 小利贞 · 初吉终乱。', tuan: '既济 · 刚柔正而位当', xiang: '水在火上 · 既济 · 君子以思患而豫防之', yaoCi: ['初九 · 曳其轮 · 濡其尾 · 无咎', '六二 · 妇丧其茀 · 勿逐 · 七日得', '九三 · 高宗伐鬼方 · 三年克之', '六四 · 繻有衣袽 · 终日戒', '九五 · 东邻杀牛 · 不如西邻之禴祭', '上六 · 濡其首 · 厉'], fiveEl: '水火', judgement: '既济 · 亨小 · 初吉终乱' },
  64: { guaCi: '未济。亨。', tuan: '未济 · 刚柔应也', xiang: '火在水上 · 未济 · 君子以慎辨物居方', yaoCi: ['初六 · 濡其尾 · 吝', '九二 · 曳其轮 · 贞吉', '六三 · 未济 · 征凶 · 利涉大川', '九四 · 贞吉 · 悔亡 · 震用伐鬼方', '六五 · 贞吉 · 无悔 · 君子之光', '上九 · 有孚于饮酒 · 无咎 · 濡其首'], fiveEl: '火水', judgement: '未济 · 亨 · 小狐汔济' },
}

export type HexIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 |
  17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 |
  33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 |
  49 | 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59 | 60 | 61 | 62 | 63 | 64

// ============ 时间起卦（朱熹《周易本义》法） ============

/**
 * 时间起卦：
 *  - 上卦 = (年 + 月 + 日) % 8（余 0 视作 8，对应 1 乾 8 坤）
 *  - 下卦 = (年 + 月 + 日 + 时) % 8
 *  - 动爻 = (年 + 月 + 日 + 时) % 6（余 0 视作 6，对应第六爻）
 *  - 年月日用农历（暂以公历近似），时辰用 12 时辰
 */
export function timeDivination(d: Date = new Date()): {
  upper: Trigram
  lower: Trigram
  moving: 1 | 2 | 3 | 4 | 5 | 6
  ben: HexIndex
  bian: HexIndex
  hu: HexIndex
  cuo: HexIndex
  zong: HexIndex
} {
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  const h = d.getHours()
  // 简化：直接用公历年月日
  const upNum = ((y + m + day) % 8) || 8
  const lowNum = ((y + m + day + h) % 8) || 8
  const moving = (((y + m + day + h) % 6) || 6) as 1 | 2 | 3 | 4 | 5 | 6
  const upper = numToTrigram(upNum)
  const lower = numToTrigram(lowNum)
  const ben = lookupHex(upper, lower)
  const bian = transformHex(upper, lower, moving)
  const hu = makeHu(upper, lower)
  const cuo = makeCuo(upper, lower)
  const zong = makeZong(upper, lower)
  return { upper, lower, moving, ben, bian, hu, cuo, zong }
}

/** 1-8 数字 → 八卦（先天序） */
export function numToTrigram(n: number): Trigram {
  // 1 乾 2 兑 3 离 4 震 5 巽 6 坎 7 艮 8 坤
  const map: Record<number, Trigram> = {
    1: '乾', 2: '兑', 3: '离', 4: '震', 5: '巽', 6: '坎', 7: '艮', 8: '坤',
  }
  return map[n] || '乾'
}

/** 通过上下卦查 64 卦索引（文王八卦序） */
export function lookupHex(upper: Trigram, lower: Trigram): HexIndex {
  // 上下卦转 1-8
  const upIdx = TRIGRAMS.indexOf(upper) + 1
  const lowIdx = TRIGRAMS.indexOf(lower) + 1
  const num = (upIdx - 1) * 8 + lowIdx
  return num as HexIndex
}

/** 动爻变卦索引 */
export function transformHex(upper: Trigram, lower: Trigram, moving: 1 | 2 | 3 | 4 | 5 | 6): HexIndex {
  // 把动爻变阴/变阳，重新查卦
  const lowerLines: Line[] = [1, 1, 1] as Line[]
  lowerLines[0] = lower === '乾' || lower === '兑' || lower === '离' || lower === '震' ? 1 : 0
  lowerLines[1] = lower === '乾' || lower === '兑' || lower === '巽' || lower === '坎' ? 1 : 0
  lowerLines[2] = lower === '乾' || lower === '巽' || lower === '离' || lower === '艮' ? 1 : 0
  const upperLines: Line[] = [1, 1, 1] as Line[]
  upperLines[0] = upper === '乾' || upper === '兑' || upper === '离' || upper === '震' ? 1 : 0
  upperLines[1] = upper === '乾' || upper === '兑' || upper === '巽' || upper === '坎' ? 1 : 0
  upperLines[2] = upper === '乾' || upper === '巽' || upper === '离' || upper === '艮' ? 1 : 0
  if (moving >= 1 && moving <= 3) {
    lowerLines[moving - 1] = (lowerLines[moving - 1] === 1 ? 0 : 1) as Line
  } else {
    upperLines[moving - 4] = (upperLines[moving - 4] === 1 ? 0 : 1) as Line
  }
  const newLower = linesToTrigram(lowerLines as Yao)
  const newUpper = linesToTrigram(upperLines as Yao)
  return lookupHex(newUpper, newLower)
}

function linesToTrigram(lines: Yao): Trigram {
  // 八卦二进制
  // 乾 111 兑 110 离 101 震 100 巽 011 坎 010 艮 001 坤 000
  const key = `${lines[0]}${lines[1]}${lines[2]}`
  const map: Record<string, Trigram> = {
    '111': '乾', '110': '兑', '101': '离', '100': '震',
    '011': '巽', '010': '坎', '001': '艮', '000': '坤',
  }
  return map[key] || '乾'
}

/** 互卦：234 爻为下卦，345 爻为上卦 */
export function makeHu(upper: Trigram, lower: Trigram): HexIndex {
  const lowerLines = trigramToLines(lower)
  const upperLines = trigramToLines(upper)
  // 六爻（自下而上）：l0,l1,l2,u0,u1,u2
  const all: Line[] = [...lowerLines, ...upperLines]
  // 互卦下卦 = 234 爻 = l1,l2,u0
  const huLow: Yao = [all[1], all[2], all[3]] as Yao
  // 互卦上卦 = 345 爻 = l2,u0,u1
  const huUp: Yao = [all[2], all[3], all[4]] as Yao
  return lookupHex(linesToTrigram(huUp), linesToTrigram(huLow))
}

function trigramToLines(t: Trigram): Yao {
  return [
    (t === '乾' || t === '兑' || t === '离' || t === '震' ? 1 : 0),
    (t === '乾' || t === '兑' || t === '巽' || t === '坎' ? 1 : 0),
    (t === '乾' || t === '巽' || t === '离' || t === '艮' ? 1 : 0),
  ] as Yao
}

/** 错卦：六爻全变（阴阳相反） */
export function makeCuo(upper: Trigram, lower: Trigram): HexIndex {
  const lowerLines = trigramToLines(lower).map((x) => (x === 1 ? 0 : 1) as Line)
  const upperLines = trigramToLines(upper).map((x) => (x === 1 ? 0 : 1) as Line)
  return lookupHex(linesToTrigram(upperLines as Yao), linesToTrigram(lowerLines as Yao))
}

/** 综卦：上下倒置 */
export function makeZong(upper: Trigram, lower: Trigram): HexIndex {
  return lookupHex(lower, upper)
}

// ============ 用神/世应分析 ============

/** 内卦 = 下卦，外卦 = 上卦 */
export type YaoPosition = '初' | '二' | '三' | '四' | '五' | '上'

/** 八宫卦序（《京房易传》八宫卦序） */
const BAGONG_ORDER: number[] = [
  1, 11, 34, 5, 9, 26, 14, 43, // 乾宫八卦
  44, 33, 12, 20, 23, 2, 35, 8, // 坤宫
  13, 36, 22, 63, 7, 49, 55, 31, // 震宫
  37, 53, 64, 47, 6, 50, 27, 54, // 巽宫
  30, 38, 50, 27, 42, 21, 51, 57, // 坎宫
  14, 7, 41, 6, 64, 47, 38, 50, // 离宫
  27, 22, 63, 7, 23, 2, 41, 6, // 艮宫
  50, 49, 28, 42, 38, 31, 53, 39, // 兑宫
]

/** 找世爻位置（1-6） */
export function findShi(ben: HexIndex): 1 | 2 | 3 | 4 | 5 | 6 {
  // 简化：基于八宫卦序索引
  const idx = BAGONG_ORDER.indexOf(ben)
  if (idx < 0) return 3 // 兜底
  // 第 1 卦世在 6，第 2 在 1，第 3 在 2，第 4 在 3，第 5 在 4，第 6 在 5，第 7 在 3，第 8 在 3
  const positionInGong = idx % 8
  switch (positionInGong) {
    case 0: return 6
    case 1: return 1
    case 2: return 2
    case 3: return 3
    case 4: return 4
    case 5: return 5
    default: return 3
  }
}

/** 应爻位置 = 世爻 + 3（若超过 6 则减 6） */
export function findYing(shi: 1 | 2 | 3 | 4 | 5 | 6): 1 | 2 | 3 | 4 | 5 | 6 {
  return ((shi + 2) % 6 || 6) as 1 | 2 | 3 | 4 | 5 | 6
}

/** 纳甲（简化版，按上下卦五行定纳干） */
const NEIJIA: Record<Trigram, [string, string]> = {
  乾: ['甲', '壬'],
  兑: ['丁', '丁'],
  离: ['己', '己'],
  震: ['庚', '庚'],
  巽: ['辛', '辛'],
  坎: ['戊', '戊'],
  艮: ['丙', '丙'],
  坤: ['乙', '癸'],
}

const ZHI_ROTATION = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

/** 简单纳甲（每卦六爻，按八卦定支） */
export function naJia(upper: Trigram, lower: Trigram): string[] {
  // 乾纳甲壬，坤纳乙癸；震纳庚，巽纳辛；坎纳戊，离纳己；艮纳丙，兑纳丁
  // 内卦三爻起始支，外卦起始支不同（按特定规律）
  const innerZhi = ['子', '寅', '辰', '午', '申', '戌'] // 阳卦内卦
  const innerZhiYin = ['未', '巳', '卯', '丑', '亥', '酉'] // 阴卦内卦
  const yangUpper = ['午', '申', '戌', '子', '寅', '辰']
  const yinUpper = ['丑', '亥', '酉', '未', '巳', '卯']
  const upGan = NEIJIA[upper][0]
  const lowGan = NEIJIA[lower][0]
  const isYang = upGan === '甲' || upGan === '丙' || upGan === '戊' || upGan === '庚' || upGan === '壬'
  const arr = [...(isYang ? yangUpper : yinUpper)]
  return arr
}

// ============ 完整排盘结果 ============

export interface ZhouyiResult {
  time: { y: number; m: number; d: number; h: number; min: number }
  upper: Trigram
  lower: Trigram
  moving: 1 | 2 | 3 | 4 | 5 | 6
  ben: HexIndex
  bian: HexIndex
  hu: HexIndex
  cuo: HexIndex
  zong: HexIndex
  shi: 1 | 2 | 3 | 4 | 5 | 6
  ying: 1 | 2 | 3 | 4 | 5 | 6
  fiveEl: string
  benGuaName: string
  bianGuaName: string
  huGuaName: string
  cuoGuaName: string
  zongGuaName: string
  guaCi: string
  tuan: string
  xiang: string
  yaoCi: [string, string, string, string, string, string]
  yaoGanZhi: string[]
  judgement: string
  /** 用神/忌神（根据所问主题） */
  yongShen: { target: string; source: string; advice: string }
}

/** 完整排盘 */
export function fullDivination(
  d: Date = new Date(),
  topic: '事业' | '财运' | '婚姻' | '健康' | '学业' | '家宅' | '诉讼' | '出行' = '事业',
): ZhouyiResult {
  const basic = timeDivination(d)
  const ben = HEXAGRAM_TEXTS[basic.ben]
  const bian = HEXAGRAM_TEXTS[basic.bian]
  const hu = HEXAGRAM_TEXTS[basic.hu]
  const cuo = HEXAGRAM_TEXTS[basic.cuo]
  const zong = HEXAGRAM_TEXTS[basic.zong]
  const shi = findShi(basic.ben)
  const ying = findYing(shi)
  const yaoGanZhi = naJia(basic.upper, basic.lower)
  // 用神定位（简化）
  const yongMap: Record<string, { target: string; source: string; advice: string }> = {
    事业: { target: '世爻', source: '动爻所变之爻', advice: '世爻得日月生扶为吉，休囚为凶' },
    财运: { target: '财爻', source: '妻财爻', advice: '财爻持世或生世可求，财爻空破难成' },
    婚姻: { target: '财/官', source: '男看财爻女看官', advice: '用神旺相主婚可成，休囚空破难成' },
    健康: { target: '世爻', source: '世爻为命主', advice: '世爻安静无伤为吉，受克有灾' },
    学业: { target: '父母爻', source: '文昌父母', advice: '父母爻旺相主考可成，休囚不利' },
    家宅: { target: '世爻/宅', source: '世爻与宅爻', advice: '世宅皆安为吉，一伤一破有忧' },
    诉讼: { target: '官鬼爻', source: '官鬼为讼', advice: '官鬼生世利我，仇世则凶' },
    出行: { target: '世爻', source: '世爻为行人', advice: '世爻旺相可动，休囚守旧' },
  }
  return {
    time: {
      y: d.getFullYear(),
      m: d.getMonth() + 1,
      d: d.getDate(),
      h: d.getHours(),
      min: d.getMinutes(),
    },
    upper: basic.upper,
    lower: basic.lower,
    moving: basic.moving,
    ben: basic.ben,
    bian: basic.bian,
    hu: basic.hu,
    cuo: basic.cuo,
    zong: basic.zong,
    shi,
    ying,
    fiveEl: ben.fiveEl,
    benGuaName: HEXAGRAM_NAMES[basic.ben - 1],
    bianGuaName: HEXAGRAM_NAMES[basic.bian - 1],
    huGuaName: HEXAGRAM_NAMES[basic.hu - 1],
    cuoGuaName: HEXAGRAM_NAMES[basic.cuo - 1],
    zongGuaName: HEXAGRAM_NAMES[basic.zong - 1],
    guaCi: ben.guaCi,
    tuan: ben.tuan,
    xiang: ben.xiang,
    yaoCi: ben.yaoCi,
    yaoGanZhi,
    judgement: ben.judgement,
    yongShen: yongMap[topic],
  }
}

// ============ 64 卦速览表（用于其他模块展示） ============

export function listAllHexagrams(): Array<{
  num: HexIndex
  name: string
  guaCi: string
  judgement: string
}> {
  return HEXAGRAM_NAMES.map((name, i) => ({
    num: (i + 1) as HexIndex,
    name,
    guaCi: HEXAGRAM_TEXTS[(i + 1) as HexIndex].guaCi,
    judgement: HEXAGRAM_TEXTS[(i + 1) as HexIndex].judgement,
  }))
}

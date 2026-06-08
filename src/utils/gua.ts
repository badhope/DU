/**
 * 64 卦数据
 * 上卦下卦组合而成
 * 八卦：乾兑离震巽坎艮坤
 */

export type Trigram = 'qian' | 'dui' | 'li' | 'zhen' | 'xun' | 'kan' | 'gen' | 'kun'

export const TRIGRAMS: Record<Trigram, { name: string, symbol: string, binary: [number, number, number], nature: string, wuxing: string }> = {
  qian: { name: '乾', symbol: '☰', binary: [1, 1, 1], nature: '天', wuxing: '金' },
  dui:  { name: '兑', symbol: '☱', binary: [1, 1, 0], nature: '泽', wuxing: '金' },
  li:   { name: '离', symbol: '☲', binary: [1, 0, 1], nature: '火', wuxing: '火' },
  zhen: { name: '震', symbol: '☳', binary: [1, 0, 0], nature: '雷', wuxing: '木' },
  xun:  { name: '巽', symbol: '☴', binary: [0, 1, 1], nature: '风', wuxing: '木' },
  kan:  { name: '坎', symbol: '☵', binary: [0, 1, 0], nature: '水', wuxing: '水' },
  gen:  { name: '艮', symbol: '☶', binary: [0, 0, 1], nature: '山', wuxing: '土' },
  kun:  { name: '坤', symbol: '☷', binary: [0, 0, 0], nature: '地', wuxing: '土' },
}

export interface Gua {
  id: number           // 1-64
  name: string         // 卦名
  upper: Trigram       // 上卦
  lower: Trigram       // 下卦
  symbol: string       // 卦象
  judgment: string     // 卦辞
  image: string        // 象传
  yaoTexts: string[]   // 六爻爻辞
  fortune: '吉' | '平' | '凶'
  tag: string          // 主题标签
  desc: string         // 白话解读
}

// 64 卦简表（精选卦辞与现代白话解读）
export const GUA_LIST: Gua[] = [
  { id: 1, name: '乾为天', upper: 'qian', lower: 'qian', symbol: '䷀', judgment: '元亨利贞', image: '天行健，君子以自强不息', yaoTexts: ['潜龙勿用', '见龙在田，利见大人', '君子终日乾乾，夕惕若厉，无咎', '或跃在渊，无咎', '飞龙在天，利见大人', '亢龙有悔'], fortune: '吉', tag: '事业 · 自强', desc: '天行健，万物始生。宜进取，但忌过亢。' },
  { id: 2, name: '坤为地', upper: 'kun', lower: 'kun', symbol: '䷁', judgment: '元亨，利牝马之贞', image: '地势坤，君子以厚德载物', yaoTexts: ['履霜，坚冰至', '直方大，不习无不利', '含章可贞', '括囊，无咎无誉', '黄裳，元吉', '龙战于野，其血玄黄'], fortune: '吉', tag: '柔顺 · 包容', desc: '地势坤，厚德载物。宜守正，不宜争先。' },
  { id: 3, name: '水雷屯', upper: 'kan', lower: 'zhen', symbol: '䷂', judgment: '元亨利贞，勿用有攸往', image: '云雷屯，君子以经纶', yaoTexts: ['磐桓，利居贞', '屯如，邅如', '即鹿无虞', '乘马班如', '屯其膏', '乘马班如，泣血涟如'], fortune: '平', tag: '初创 · 艰难', desc: '雷雨交加，万物初生。宜守正待时，不可冒进。' },
  { id: 4, name: '山水蒙', upper: 'gen', lower: 'kan', symbol: '䷃', judgment: '亨，匪我求童蒙', image: '山下出泉，蒙，君子以果行育德', yaoTexts: ['发蒙，利用刑人', '包蒙吉，纳妇吉', '勿用取女', '困蒙，吝', '童蒙，吉', '击蒙，不利为寇'], fortune: '平', tag: '学习 · 启蒙', desc: '山下有泉，蒙昧未开。宜求师问道，循序渐进。' },
  { id: 5, name: '水天需', upper: 'kan', lower: 'qian', symbol: '䷄', judgment: '有孚，光亨，贞吉', image: '云上于天，需，君子以饮食宴乐', yaoTexts: ['需于郊，利用恒', '需于沙', '需于泥，致寇至', '需于血', '需于酒食，贞吉', '入于穴'], fortune: '吉', tag: '等待 · 蓄势', desc: '云上于天，亟待成雨。宜耐心等待，蓄势而发。' },
  { id: 6, name: '天水讼', upper: 'qian', lower: 'kan', symbol: '䷅', judgment: '有孚，窒惕', image: '天与水违行，讼，君子以作事谋始', yaoTexts: ['不永所事', '不克讼，归而逋', '食旧德', '不克讼，复即命渝', '讼元吉', '或锡之鞶带'], fortune: '凶', tag: '争讼 · 谨慎', desc: '天水背行，争讼之象。宜退让和解，避免纠缠。' },
  { id: 7, name: '地水师', upper: 'kun', lower: 'kan', symbol: '䷆', judgment: '贞，丈人吉', image: '地中有水，师，君子以容民畜众', yaoTexts: ['师出以律', '在师中', '师或舆尸', '师左次', '田有禽', '大君有命'], fortune: '平', tag: '团队 · 领导', desc: '地中有水，兵众之象。宜选贤任能，纪律严明。' },
  { id: 8, name: '水地比', upper: 'kan', lower: 'kun', symbol: '䷇', judgment: '吉，原筮元永贞', image: '地上有水，比，先王以建万国', yaoTexts: ['有孚比之', '比之自内', '比之匪人', '外比之，贞吉', '显比', '比之无首'], fortune: '吉', tag: '亲近 · 合作', desc: '地上有水，亲比之象。宜结交贤友，团结协作。' },
  { id: 9, name: '风天小畜', upper: 'xun', lower: 'qian', symbol: '䷈', judgment: '亨，密云不雨，自我西郊', image: '风行天上，小畜，君子以懿文德', yaoTexts: ['复自道', '牵复', '舆说辐', '有孚', '有孚挛如', '既雨既处'], fortune: '平', tag: '小成 · 蓄养', desc: '风行天上，云未成雨。小有所畜，宜文德养身。' },
  { id: 10, name: '天泽履', upper: 'qian', lower: 'dui', symbol: '䷉', judgment: '履虎尾，不咥人，亨', image: '上天下泽，履，君子以辩上下', yaoTexts: ['素履，往无咎', '履道坦坦', '眇能视，跛能履', '履虎尾，愬愬', '夬履，贞厉', '视履考祥'], fortune: '平', tag: '处世 · 谨慎', desc: '踩虎尾而不被咬，履危而亨。宜谨慎行事，分清尊卑。' },
  { id: 11, name: '地天泰', upper: 'kun', lower: 'qian', symbol: '䷊', judgment: '小往大来，吉亨', image: '天地交，泰，后以财成天地之道', yaoTexts: ['拔茅茹', '包荒，用冯河', '无平不陂', '翩翩', '帝乙归妹', '城复于隍'], fortune: '吉', tag: '通泰 · 顺达', desc: '天地交而万物通，泰之极也。诸事顺遂，宜把握良机。' },
  { id: 12, name: '天地否', upper: 'qian', lower: 'kun', symbol: '䷋', judgment: '否之匪人，不利君子贞', image: '天地不交，否，君子以俭德辟难', yaoTexts: ['拔茅茹', '包承', '包羞', '有命无咎', '其亡其亡，系于苞桑', '倾否'], fortune: '凶', tag: '闭塞 · 隐忍', desc: '天地不交，万物不通。宜静守德，待时而动。' },
  { id: 13, name: '天火同人', upper: 'qian', lower: 'li', symbol: '䷌', judgment: '同人于野，亨', image: '天与火同人，君子以类族辨物', yaoTexts: ['同人于门', '同人于宗', '伏戎于莽', '乘其墉', '同人先号咷', '同人于郊'], fortune: '吉', tag: '同心 · 协作', desc: '天火同明，人心和同。宜求同存异，聚合众力。' },
  { id: 14, name: '火天大有', upper: 'li', lower: 'qian', symbol: '䷍', judgment: '元亨', image: '火在天上，大有，君子以遏恶扬善', yaoTexts: ['无交害', '大车以载', '公用亨于天子', '匪其彭', '厥孚交如', '自天佑之'], fortune: '吉', tag: '丰收 · 盛大', desc: '火在天上，盛大之象。宜行善举，遏止恶念。' },
  { id: 15, name: '地山谦', upper: 'kun', lower: 'gen', symbol: '䷎', judgment: '亨，君子有终', image: '地中有山，谦，君子以裒多益寡', yaoTexts: ['谦谦君子', '鸣谦', '劳谦', '无不利，撝谦', '不富以其邻', '鸣谦，利用行师'], fortune: '吉', tag: '谦逊 · 美德', desc: '地中有山，高而能下。谦之至也，诸事皆吉。' },
  { id: 16, name: '雷地豫', upper: 'zhen', lower: 'kun', symbol: '䷏', judgment: '利建侯行师', image: '雷出地奋，豫，先王以作乐崇德', yaoTexts: ['鸣豫', '介于石', '盱豫', '由豫', '贞疾', '冥豫'], fortune: '平', tag: '预备 · 欢乐', desc: '雷出地奋，悦豫之象。宜欢乐中不忘警惕。' },
  { id: 17, name: '泽雷随', upper: 'dui', lower: 'zhen', symbol: '䷐', judgment: '元亨利贞', image: '泽中有雷，随，君子以向晦入宴息', yaoTexts: ['官有渝', '系小子', '系丈夫', '随有获', '孚于嘉', '拘系之'], fortune: '吉', tag: '随顺 · 灵活', desc: '泽中有雷，随时而动。宜随机应变，不拘一格。' },
  { id: 18, name: '山风蛊', upper: 'gen', lower: 'xun', symbol: '䷑', judgment: '元亨，利涉大川', image: '山下有风，蛊，君子以振民育德', yaoTexts: ['干父之蛊', '干母之蛊', '干父之蛊', '裕父之蛊', '干父之蛊', '不事王侯'], fortune: '平', tag: '整治 · 革新', desc: '山下有风，弊乱之象。宜革故鼎新，整顿旧业。' },
  { id: 19, name: '地泽临', upper: 'kun', lower: 'dui', symbol: '䷒', judgment: '元亨利贞，至于八月有凶', image: '泽上有地，临，君子以教思无穷', yaoTexts: ['咸临', '咸临，吉', '甘临', '至临', '知临', '敦临'], fortune: '吉', tag: '临事 · 盛大', desc: '泽上有地，临盛之象。宜盛时而思衰。' },
  { id: 20, name: '风地观', upper: 'xun', lower: 'kun', symbol: '䷓', judgment: '盥而不荐', image: '风行地上，观，先王以省方观民', yaoTexts: ['童观', '窥观', '观我生', '观国之光', '观我生', '观其生'], fortune: '平', tag: '观察 · 自省', desc: '风行地上，遍观之象。宜观察自省，明辨是非。' },
  { id: 21, name: '火雷噬嗑', upper: 'li', lower: 'zhen', symbol: '䷔', judgment: '亨，利用狱', image: '雷电，噬嗑，先王以明罚敕法', yaoTexts: ['屦校灭趾', '噬肤灭鼻', '噬腊肉', '噬干胏', '噬干肉', '何校灭耳'], fortune: '平', tag: '决断 · 刑罚', desc: '雷电交击，咬合之象。宜明察秋毫，果断行事。' },
  { id: 22, name: '山火贲', upper: 'gen', lower: 'li', symbol: '䷕', judgment: '亨，小利有攸往', image: '山下有火，贲，君子以明庶政', yaoTexts: ['贲其趾', '贲其须', '贲如濡如', '贲如皤如', '贲于丘园', '白贲'], fortune: '吉', tag: '文饰 · 礼仪', desc: '山下有火，装饰之象。宜文质并重，返璞归真。' },
  { id: 23, name: '山地剥', upper: 'gen', lower: 'gen', symbol: '䷖', judgment: '不利有攸往', image: '山附于地，剥，上以厚下安宅', yaoTexts: ['剥床以足', '剥床以辨', '剥之无咎', '剥床以肤', '贯鱼', '硕果不食'], fortune: '凶', tag: '剥落 · 衰退', desc: '山附于地，剥落之象。宜静守待变，不可妄动。' },
  { id: 24, name: '地雷复', upper: 'kun', lower: 'zhen', symbol: '䷗', judgment: '亨，出入无疾', image: '雷在地中，复，先王以至日闭关', yaoTexts: ['不远复', '休复', '频复', '中行独复', '敦复', '迷复'], fortune: '吉', tag: '复归 · 复兴', desc: '雷在地中，一阳来复。否极泰来，宜积极行动。' },
  { id: 25, name: '天雷无妄', upper: 'qian', lower: 'zhen', symbol: '䷘', judgment: '元亨利贞', image: '天下雷行，物与无妄', yaoTexts: ['无妄往吉', '不耕获', '无妄之灾', '可贞', '无妄之疾', '无妄行有眚'], fortune: '吉', tag: '真诚 · 不妄', desc: '天下雷行，真实无妄。宜诚心正意，不存妄念。' },
  { id: 26, name: '山天大畜', upper: 'gen', lower: 'qian', symbol: '䷙', judgment: '利贞，不家食吉', image: '天在山中，大畜，君子以多识前言往行', yaoTexts: ['有厉', '舆说輹', '良马逐', '童牛之牿', '豮豕之牙', '何天之衢'], fortune: '吉', tag: '大蓄 · 厚积', desc: '天在山中，蕴积之象。宜广积学识，待时起用。' },
  { id: 27, name: '山雷颐', upper: 'gen', lower: 'zhen', symbol: '䷚', judgment: '贞吉，观颐', image: '山下有雷，颐，君子以慎言语，节饮食', yaoTexts: ['舍尔灵龟', '颠颐', '颠颐拂经', '颠颐，吉', '拂经', '由颐'], fortune: '平', tag: '颐养 · 慎言', desc: '山下有雷，养正之象。宜慎言节食，养身养心。' },
  { id: 28, name: '泽风大过', upper: 'dui', lower: 'xun', symbol: '䷛', judgment: '栋桡，利有攸往', image: '泽灭木，大过，君子以独立不惧', yaoTexts: ['藉用白茅', '枯杨生稊', '栋桡', '栋隆', '枯杨生华', '过涉灭顶'], fortune: '平', tag: '非常 · 担当', desc: '泽灭木，过涉之象。宜非常之时立非常之功。' },
  { id: 29, name: '坎为水', upper: 'kan', lower: 'kan', symbol: '䷜', judgment: '习坎，有孚，维心亨', image: '水洊至，习坎，君子以常德行', yaoTexts: ['习坎，入于坎窞', '坎有险', '来之坎坎', '樽酒簋贰', '坎不盈', '系用徽纆'], fortune: '平', tag: '险难 · 信念', desc: '重险之水，习坎之象。宜诚信守心，化险为夷。' },
  { id: 30, name: '离为火', upper: 'li', lower: 'li', symbol: '䷝', judgment: '利贞，亨', image: '明两作，离，大人以继明照于四方', yaoTexts: ['履错然', '黄离元吉', '日昃之离', '突如其来如', '出涕沱若', '王用出征'], fortune: '吉', tag: '光明 · 依附', desc: '重明之火，附丽之象。宜依附正道，光明正大。' },
  { id: 31, name: '泽山咸', upper: 'dui', lower: 'gen', symbol: '䷞', judgment: '亨，利贞，取女吉', image: '山上有泽，咸，君子以虚受人', yaoTexts: ['咸其拇', '咸其腓', '咸其股', '贞吉悔亡', '咸其脢', '咸其辅'], fortune: '吉', tag: '感应 · 婚恋', desc: '山泽通气，感应之象。宜虚心受善，感应万物。' },
  { id: 32, name: '雷风恒', upper: 'zhen', lower: 'xun', symbol: '䷟', judgment: '亨，无咎，利贞', image: '雷风，恒，君子以立不易方', yaoTexts: ['浚恒', '悔亡', '不恒其德', '田无禽', '恒其德', '振恒'], fortune: '平', tag: '恒久 · 坚持', desc: '雷风相与，恒久之象。宜守正不变，持之以恒。' },
  { id: 33, name: '天山遁', upper: 'qian', lower: 'gen', symbol: '䷠', judgment: '亨，小利贞', image: '天下有山，遁，君子以远小人', yaoTexts: ['遁尾厉', '执之用黄牛', '系遁', '好遁', '嘉遁', '肥遁'], fortune: '平', tag: '退避 · 隐遁', desc: '天下有山，遁世之象。宜远离小人，明哲保身。' },
  { id: 34, name: '雷天大壮', upper: 'zhen', lower: 'qian', symbol: '䷡', judgment: '利贞', image: '雷在天上，大壮，君子以非礼弗履', yaoTexts: ['壮于趾', '贞吉', '小人用壮', '贞吉悔亡', '丧羊于易', '羝羊触藩'], fortune: '吉', tag: '壮盛 · 守正', desc: '雷在天上，壮盛之象。宜盛守正，不滥用强。' },
  { id: 35, name: '火地晋', upper: 'li', lower: 'kun', symbol: '䷢', judgment: '康侯用锡马蕃庶', image: '明出地上，晋，君子以自昭明德', yaoTexts: ['晋如摧如', '晋如愁如', '众允', '晋如鼫鼠', '悔亡', '维用伐邑'], fortune: '吉', tag: '晋升 · 前进', desc: '明出地上，晋升之象。宜昭明德行，前途光明。' },
  { id: 36, name: '地火明夷', upper: 'kun', lower: 'li', symbol: '䷣', judgment: '利艰贞', image: '明入地中，明夷，君子以莅众', yaoTexts: ['明夷于飞', '夷于左股', '南狩', '入于左腹', '箕子之明夷', '不明晦'], fortune: '凶', tag: '韬光 · 隐忍', desc: '明入地中，韬光之象。宜内藏智慧，外示柔顺。' },
  { id: 37, name: '风火家人', upper: 'xun', lower: 'li', symbol: '䷤', judgment: '利女贞', image: '风自火出，家人，君子以言有物', yaoTexts: ['闲有家', '无攸遂', '家人嗃嗃', '富家大吉', '王假有家', '有孚威如'], fortune: '吉', tag: '家庭 · 秩序', desc: '风自火出，家道之象。宜齐家有道，言出必行。' },
  { id: 38, name: '火泽睽', upper: 'li', lower: 'dui', symbol: '䷥', judgment: '小事吉', image: '上火下泽，睽，君子以同而异', yaoTexts: ['悔亡', '遇主于巷', '见舆曳', '睽孤遇元夫', '悔亡', '睽孤见豕负涂'], fortune: '平', tag: '乖违 · 求同', desc: '上火下泽，相睽之象。宜求大同存小异。' },
  { id: 39, name: '水山蹇', upper: 'kan', lower: 'gen', symbol: '䷦', judgment: '利西南，不利东北', image: '山上有水，蹇，君子以反身修德', yaoTexts: ['往蹇来誉', '王臣蹇蹇', '往蹇来反', '往蹇来连', '大蹇朋来', '往蹇来硕'], fortune: '凶', tag: '艰难 · 反身', desc: '山上有水，蹇难之象。宜反身修德，待时济蹇。' },
  { id: 40, name: '雷水解', upper: 'zhen', lower: 'kan', symbol: '䷧', judgment: '利西南', image: '雷雨作，解，君子以赦过宥罪', yaoTexts: ['无咎', '田获三狐', '负且乘', '解而拇', '君子维有解', '公用射隼'], fortune: '吉', tag: '解脱 · 赦过', desc: '雷雨作，解难之象。宜宽宥过失，化解危难。' },
  { id: 41, name: '山泽损', upper: 'gen', lower: 'dui', symbol: '䷨', judgment: '有孚，元吉', image: '山下有泽，损，君子以惩忿窒欲', yaoTexts: ['已事遄往', '利贞', '三人行', '损其疾', '或益之', '弗损益之'], fortune: '平', tag: '减损 · 自约', desc: '山下有泽，损下益上。宜惩忿窒欲，损己益人。' },
  { id: 42, name: '风雷益', upper: 'xun', lower: 'zhen', symbol: '䷩', judgment: '利有攸往，利涉大川', image: '风雷，益，君子以见善则迁', yaoTexts: ['利用为大作', '或益之', '益之用凶事', '中行告公从', '有孚惠心', '勿问元吉'], fortune: '吉', tag: '增益 · 进益', desc: '风雷相益，损上益下。宜见善则迁，有所作为。' },
  { id: 43, name: '泽天夬', upper: 'dui', lower: 'qian', symbol: '䷪', judgment: '扬于王庭，孚号有厉', image: '泽上于天，夬，君子以施禄及下', yaoTexts: ['壮于前趾', '惕号', '壮于頄', '臀无肤', '苋陆夬夬', '无号'], fortune: '平', tag: '决断 · 果决', desc: '泽上于天，决断之象。宜果决除奸，不可迟疑。' },
  { id: 44, name: '天风姤', upper: 'qian', lower: 'xun', symbol: '䷫', judgment: '女壮，勿用取女', image: '天下有风，姤，后以施命诰四方', yaoTexts: ['系于金柅', '包有鱼', '臀无肤', '包无鱼', '以杞包瓜', '倾否'], fortune: '凶', tag: '邂逅 · 阴长', desc: '天下有风，邂逅之象。宜警惕阴长，防微杜渐。' },
  { id: 45, name: '泽地萃', upper: 'dui', lower: 'kun', symbol: '䷬', judgment: '亨，王假有庙', image: '泽上于地，萃，君子以除戎器', yaoTexts: ['有孚不终', '引吉', '萃如嗟如', '大吉，无咎', '萃有位', '赍咨涕洟'], fortune: '吉', tag: '汇聚 · 萃集', desc: '泽上于地，萃聚之象。宜聚合人心，祭祀祈福。' },
  { id: 46, name: '地风升', upper: 'kun', lower: 'xun', symbol: '䷭', judgment: '元亨，用见大人', image: '地中生木，升，君子以顺德', yaoTexts: ['允升', '孚乃利用禴', '升虚邑', '王用亨于岐山', '贞吉', '冥升'], fortune: '吉', tag: '上升 · 进取', desc: '地中生木，上升之象。宜顺势而上，积小成大。' },
  { id: 47, name: '泽水困', upper: 'dui', lower: 'kan', symbol: '䷮', judgment: '亨，贞，大人吉', image: '泽无水，困，君子以致命遂志', yaoTexts: ['臀困于株木', '困于酒食', '困于石', '来徐徐', '劓刖', '困于葛藟'], fortune: '凶', tag: '困顿 · 守志', desc: '泽无水，困穷之象。宜穷则独善其身，守志不渝。' },
  { id: 48, name: '水风井', upper: 'kan', lower: 'xun', symbol: '䷯', judgment: '改邑不改井', image: '木上有水，井，君子以劳民劝相', yaoTexts: ['井泥不食', '井谷射鲋', '井渫不食', '井甃', '井冽', '井收勿幕'], fortune: '吉', tag: '井养 · 恒常', desc: '木上有水，井养之象。宜惠及他人，泽被苍生。' },
  { id: 49, name: '泽火革', upper: 'dui', lower: 'li', symbol: '䷰', judgment: '巳日乃孚', image: '泽中有火，革，君子以治历明时', yaoTexts: ['巩用黄牛之革', '巳日乃革之', '征凶贞厉', '悔亡有孚', '大人虎变', '君子豹变'], fortune: '平', tag: '革新 · 变革', desc: '泽中有火，革故之象。宜顺天应人，革故鼎新。' },
  { id: 50, name: '火风鼎', upper: 'li', lower: 'xun', symbol: '䷱', judgment: '元吉，亨', image: '木上有火，鼎，君子以正位凝命', yaoTexts: ['鼎颠趾', '鼎有实', '鼎耳革', '鼎折足', '鼎黄耳', '鼎玉铉'], fortune: '吉', tag: '鼎新 · 稳定', desc: '木上有火，鼎器之象。宜正位凝命，三足鼎立。' },
  { id: 51, name: '震为雷', upper: 'zhen', lower: 'zhen', symbol: '䷲', judgment: '亨，震来虩虩', image: '洊雷震，君子以恐惧修省', yaoTexts: ['震来虩虩', '震来厉', '震苏苏', '震遂泥', '震往来厉', '震索索'], fortune: '平', tag: '震动 · 惊醒', desc: '重雷相震，惊惧之象。宜恐惧修省，警醒奋发。' },
  { id: 52, name: '艮为山', upper: 'gen', lower: 'gen', symbol: '䷳', judgment: '艮其背', image: '兼山艮，君子以思不出其位', yaoTexts: ['艮其趾', '艮其腓', '艮其限', '艮其身', '艮其辅', '敦艮吉'], fortune: '平', tag: '止息 · 静守', desc: '兼山重叠，止止之象。宜安分守己，思不出位。' },
  { id: 53, name: '风山渐', upper: 'xun', lower: 'gen', symbol: '䷴', judgment: '女归吉，利贞', image: '山上有木，渐，君子以居贤德', yaoTexts: ['鸿渐于干', '鸿渐于磐', '鸿渐于陆', '鸿渐于木', '鸿渐于陵', '鸿渐于陆'], fortune: '吉', tag: '渐进 · 循序', desc: '山上有木，渐进之象。宜循序渐进，不可蹉跎。' },
  { id: 54, name: '雷泽归妹', upper: 'zhen', lower: 'dui', symbol: '䷵', judgment: '征凶，无攸利', image: '泽上有雷，归妹，君子以永终知敝', yaoTexts: ['归妹以娣', '眇能视', '归妹以须', '归妹愆期', '帝乙归妹', '女承筐'], fortune: '凶', tag: '婚嫁 · 慎始', desc: '泽上有雷，归妹之象。宜慎始慎终，明辨进退。' },
  { id: 55, name: '雷火丰', upper: 'zhen', lower: 'li', symbol: '䷶', judgment: '亨，王假之', image: '雷电皆至，丰，君子以折狱致刑', yaoTexts: ['遇其配主', '丰其蔀', '丰其沛', '丰其蔀', '来章', '丰其屋'], fortune: '平', tag: '丰盛 · 慎满', desc: '雷电皆至，盛大之象。宜盛极思衰，明察是非。' },
  { id: 56, name: '火山旅', upper: 'li', lower: 'gen', symbol: '䷷', judgment: '小亨，旅贞吉', image: '山上有火，旅，君子以明慎用刑', yaoTexts: ['旅琐琐', '旅即次', '旅焚其次', '旅于处', '射雉', '鸟焚其巢'], fortune: '平', tag: '行旅 · 不安定', desc: '山上有火，行旅之象。宜柔顺守正，明察时务。' },
  { id: 57, name: '巽为风', upper: 'xun', lower: 'xun', symbol: '䷸', judgment: '小亨，利有攸往', image: '随风巽，君子以申命行事', yaoTexts: ['进退，利武人之贞', '巽在床下', '频巽', '悔亡', '贞吉', '巽在床下'], fortune: '吉', tag: '顺入 · 谦逊', desc: '随风相巽，谦逊之象。宜柔顺行事，申命行事。' },
  { id: 58, name: '兑为泽', upper: 'dui', lower: 'dui', symbol: '䷹', judgment: '亨，利贞', image: '丽泽兑，君子以朋友讲习', yaoTexts: ['和兑', '孚兑', '来兑', '商兑未宁', '孚于剥', '引兑'], fortune: '吉', tag: '喜悦 · 交际', desc: '两泽相丽，悦乐之象。宜朋友讲习，和悦共处。' },
  { id: 59, name: '风水涣', upper: 'xun', lower: 'kan', symbol: '䷺', judgment: '亨，王假有庙', image: '风行水上，涣，先王以享于帝立庙', yaoTexts: ['用拯马壮', '涣奔其机', '涣其躬', '涣其群', '涣汗其大号', '涣其血'], fortune: '平', tag: '涣散 · 团结', desc: '风行水上，涣散之象。宜聚合人心，消弭离散。' },
  { id: 60, name: '水泽节', upper: 'kan', lower: 'dui', symbol: '䷻', judgment: '亨，苦节不可贞', image: '泽上有水，节，君子以制数度', yaoTexts: ['不出户庭', '不出门庭', '不节若', '安节', '甘节吉', '苦节'], fortune: '平', tag: '节制 · 度数', desc: '泽上有水，节制之象。宜适度而止，不可苦节。' },
  { id: 61, name: '风泽中孚', upper: 'xun', lower: 'dui', symbol: '䷼', judgment: '豚鱼吉，利涉大川', image: '泽上有风，中孚，君子以议狱缓死', yaoTexts: ['虞吉', '鸣鹤在阴', '得敌', '月几望', '有孚挛如', '翰音登于天'], fortune: '吉', tag: '诚信 · 中孚', desc: '泽上有风，中孚之象。宜诚信感物，无远弗届。' },
  { id: 62, name: '雷山小过', upper: 'zhen', lower: 'gen', symbol: '䷽', judgment: '亨，利贞', image: '山上有雷，小过，君子以行过乎恭', yaoTexts: ['飞鸟以凶', '过其祖', '弗过防之', '无咎', '密云不雨', '弗遇过之'], fortune: '平', tag: '小过 · 恭慎', desc: '山上有雷，小过之象。宜恭慎行事，不可大动。' },
  { id: 63, name: '水火既济', upper: 'kan', lower: 'li', symbol: '䷾', judgment: '亨小，利贞', image: '水在火上，既济，君子以思患而豫防之', yaoTexts: ['曳其轮', '妇丧其茀', '高宗伐鬼方', '繻有衣袽', '东邻杀牛', '濡其首'], fortune: '吉', tag: '既济 · 守成', desc: '水火相交，事已成就。宜守成防患，慎终如始。' },
  { id: 64, name: '火水未济', upper: 'li', lower: 'kan', symbol: '䷿', judgment: '亨', image: '火在水上，未济，君子以慎辨物居方', yaoTexts: ['濡其尾', '曳其轮', '未济征凶', '贞吉悔亡', '贞吉无悔', '有孚于饮酒'], fortune: '平', tag: '未济 · 奋进', desc: '火水不交，事未成就。宜辨物居方，奋发有为。' },
]

/** 随机起卦（按日期种子 + 随机） */
export function randomGua(): Gua {
  const idx = Math.floor(Math.random() * GUA_LIST.length)
  return GUA_LIST[idx]
}

/** 蓍草起卦：模拟三次变爻，生成 6 个爻（0=阴, 1=阳） */
export function castYaoSticks(): number[] {
  const yao: number[] = []
  for (let i = 0; i < 6; i++) {
    // 简化：用 6 个随机数决定阴阳
    const yang = Math.random() > 0.5 ? 1 : 0
    yao.push(yang)
  }
  return yao
}

/** 把 6 爻转成卦：上三爻 = 上卦, 下三爻 = 下卦 */
export function yaoToGua(yao: number[]): Gua {
  const upperBits = yao.slice(3, 6).reverse() as [number, number, number]
  const lowerBits = yao.slice(0, 3).reverse() as [number, number, number]
  const trigrams = Object.entries(TRIGRAMS) as Array<[Trigram, typeof TRIGRAMS[Trigram]]>
  const upper = trigrams.find(([, t]) =>
    t.binary[0] === upperBits[0] && t.binary[1] === upperBits[1] && t.binary[2] === upperBits[2]
  )?.[0] || 'qian'
  const lower = trigrams.find(([, t]) =>
    t.binary[0] === lowerBits[0] && t.binary[1] === lowerBits[1] && t.binary[2] === lowerBits[2]
  )?.[0] || 'kun'
  return GUA_LIST.find(g => g.upper === upper && g.lower === lower) || GUA_LIST[0]
}

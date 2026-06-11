/**
 * 玄枢 MISTVERSE · 奇经八脉 + 十二正经 + 子午流注 + 灵龟八法
 *
 *  - 8 奇经：任脉/督脉/冲脉/带脉/阴维/阳维/阴跷/阳跷
 *  - 12 正经：手三阴手三阳 + 足三阴足三阳
 *  - 15 络脉
 *  - 子午流注：12 时辰经脉开阖 + 灵龟八法 + 飞腾八法
 *  - 病症诊断：50+ 症状 → 经脉推荐
 */

// ============ 12 正经 ============
export type JingluoKey =
  | 'lu'
  | 'dachang'
  | 'wei'
  | 'pi'
  | 'xin'
  | 'xiaochang'
  | 'pangguang'
  | 'shen'
  | 'xinbao'
  | 'sanjiao'
  | 'dan'
  | 'gan'

export interface Jingluo {
  key: JingluoKey
  name: string
  fullName: string
  category:
    | '手太阴'
    | '手阳明'
    | '足阳明'
    | '足太阴'
    | '手少阴'
    | '手太阳'
    | '足太阳'
    | '足少阴'
    | '手厥阴'
    | '手少阳'
    | '足少阳'
    | '足厥阴'
  yinyang: '阴' | '阳'
  organ: string // 属脏
  direction: string
  flowTime: string // 当令时辰
  shengxiao: string
  start: string // 起穴
  end: string // 止穴
  acupoints: string[] // 主要穴位
  functions: string[]
  pathologies: string[]
}

export const JINGLUO_LIST: Jingluo[] = [
  {
    key: 'lu',
    name: '肺经',
    fullName: '手太阴肺经',
    category: '手太阴',
    yinyang: '阴',
    organ: '肺',
    direction: '胸走手',
    flowTime: '寅 03-05',
    shengxiao: '虎',
    start: '中府',
    end: '少商',
    acupoints: [
      '中府',
      '云门',
      '天府',
      '侠白',
      '尺泽',
      '孔最',
      '列缺',
      '经渠',
      '太渊',
      '鱼际',
      '少商',
    ],
    functions: ['主气司呼吸', '宣发肃降', '通调水道'],
    pathologies: ['咳嗽气喘', '胸闷气短', '咽喉肿痛', '鼻塞流涕', '皮肤瘙痒', '便秘'],
  },
  {
    key: 'dachang',
    name: '大肠经',
    fullName: '手阳明大肠经',
    category: '手阳明',
    yinyang: '阳',
    organ: '大肠',
    direction: '手走头',
    flowTime: '卯 05-07',
    shengxiao: '兔',
    start: '商阳',
    end: '迎香',
    acupoints: [
      '商阳',
      '二间',
      '三间',
      '合谷',
      '阳溪',
      '偏历',
      '温溜',
      '下廉',
      '上廉',
      '手三里',
      '曲池',
      '肘髎',
      '手五里',
      '臂臑',
      '肩髃',
      '巨骨',
      '天鼎',
      '扶突',
      '口禾髎',
      '迎香',
    ],
    functions: ['传导之官', '主津液', '排泄废物'],
    pathologies: ['腹痛腹泻', '便秘', '牙痛', '咽喉肿痛', '鼻塞', '发热'],
  },
  {
    key: 'wei',
    name: '胃经',
    fullName: '足阳明胃经',
    category: '足阳明',
    yinyang: '阳',
    organ: '胃',
    direction: '头走足',
    flowTime: '辰 07-09',
    shengxiao: '龙',
    start: '承泣',
    end: '厉兑',
    acupoints: [
      '承泣',
      '四白',
      '巨髎',
      '地仓',
      '大迎',
      '颊车',
      '下关',
      '头维',
      '人迎',
      '气舍',
      '缺盆',
      '气户',
      '库房',
      '屋翳',
      '膺窗',
      '乳中',
      '乳根',
      '不容',
      '承满',
      '梁门',
      '关门',
      '太乙',
      '滑肉门',
      '天枢',
      '外陵',
      '大巨',
      '水道',
      '归来',
      '气冲',
      '髀关',
      '伏兔',
      '阴市',
      '梁丘',
      '犊鼻',
      '足三里',
      '上巨虚',
      '条口',
      '下巨虚',
      '丰隆',
      '解溪',
      '冲阳',
      '陷谷',
      '内庭',
      '厉兑',
    ],
    functions: ['受纳腐熟', '水谷之海', '后天之本'],
    pathologies: ['胃痛', '呕吐', '腹胀', '食欲不振', '牙痛', '面瘫'],
  },
  {
    key: 'pi',
    name: '脾经',
    fullName: '足太阴脾经',
    category: '足太阴',
    yinyang: '阴',
    organ: '脾',
    direction: '足走胸',
    flowTime: '巳 09-11',
    shengxiao: '蛇',
    start: '隐白',
    end: '大包',
    acupoints: [
      '隐白',
      '大都',
      '太白',
      '公孙',
      '商丘',
      '三阴交',
      '漏谷',
      '地机',
      '阴陵泉',
      '血海',
      '箕门',
      '冲门',
      '府舍',
      '腹结',
      '大横',
      '腹哀',
      '食窦',
      '天溪',
      '胸乡',
      '周荣',
      '大包',
    ],
    functions: ['运化水谷', '统血', '后天之本', '气血生化之源'],
    pathologies: ['腹胀腹泻', '食欲不振', '倦怠乏力', '月经不调', '水肿', '便血'],
  },
  {
    key: 'xin',
    name: '心经',
    fullName: '手少阴心经',
    category: '手少阴',
    yinyang: '阴',
    organ: '心',
    direction: '胸走手',
    flowTime: '午 11-13',
    shengxiao: '马',
    start: '极泉',
    end: '少冲',
    acupoints: ['极泉', '青灵', '少海', '灵道', '通里', '阴郄', '神门', '少府', '少冲'],
    functions: ['主血脉', '藏神', '君主之官'],
    pathologies: ['心悸失眠', '心痛', '神志异常', '口舌生疮', '盗汗'],
  },
  {
    key: 'xiaochang',
    name: '小肠经',
    fullName: '手太阳小肠经',
    category: '手太阳',
    yinyang: '阳',
    organ: '小肠',
    direction: '手走头',
    flowTime: '未 13-15',
    shengxiao: '羊',
    start: '少泽',
    end: '听宫',
    acupoints: [
      '少泽',
      '前谷',
      '后溪',
      '腕骨',
      '阳谷',
      '养老',
      '支正',
      '小海',
      '肩贞',
      '臑俞',
      '天宗',
      '秉风',
      '曲垣',
      '肩外俞',
      '肩中俞',
      '天窗',
      '天容',
      '颧髎',
      '听宫',
    ],
    functions: ['受盛化物', '泌别清浊'],
    pathologies: ['耳鸣耳聋', '目黄', '肩臂痛', '咽喉肿痛', '小便异常'],
  },
  {
    key: 'pangguang',
    name: '膀胱经',
    fullName: '足太阳膀胱经',
    category: '足太阳',
    yinyang: '阳',
    organ: '膀胱',
    direction: '头走足',
    flowTime: '申 15-17',
    shengxiao: '猴',
    start: '睛明',
    end: '至阴',
    acupoints: [
      '睛明',
      '攒竹',
      '眉冲',
      '曲差',
      '五处',
      '承光',
      '通天',
      '络却',
      '玉枕',
      '天柱',
      '大杼',
      '风门',
      '肺俞',
      '厥阴俞',
      '心俞',
      '督俞',
      '膈俞',
      '肝俞',
      '胆俞',
      '脾俞',
      '胃俞',
      '三焦俞',
      '肾俞',
      '气海俞',
      '大肠俞',
      '关元俞',
      '小肠俞',
      '膀胱俞',
      '中膂俞',
      '白环俞',
      '上髎',
      '次髎',
      '中髎',
      '下髎',
      '会阳',
      '承扶',
      '殷门',
      '浮郄',
      '委阳',
      '委中',
      '附分',
      '魄户',
      '膏肓',
      '神堂',
      '膈关',
      '魂门',
      '阳纲',
      '意舍',
      '胃仓',
      '肓门',
      '志室',
      '胞肓',
      '秩边',
      '合阳',
      '承筋',
      '承山',
      '飞扬',
      '跗阳',
      '昆仑',
      '仆参',
      '申脉',
      '金门',
      '京骨',
      '束骨',
      '足通谷',
      '至阴',
    ],
    functions: ['州都之官', '津液之府', '主筋所生病'],
    pathologies: ['腰背痛', '头痛', '目疾', '鼻塞', '小便异常', '癫痫'],
  },
  {
    key: 'shen',
    name: '肾经',
    fullName: '足少阴肾经',
    category: '足少阴',
    yinyang: '阴',
    organ: '肾',
    direction: '足走胸',
    flowTime: '酉 17-19',
    shengxiao: '鸡',
    start: '涌泉',
    end: '俞府',
    acupoints: [
      '涌泉',
      '然谷',
      '太溪',
      '大钟',
      '水泉',
      '照海',
      '复溜',
      '交信',
      '筑宾',
      '阴谷',
      '横骨',
      '大赫',
      '气穴',
      '四满',
      '中注',
      '肓俞',
      '商曲',
      '石关',
      '阴都',
      '腹通谷',
      '幽门',
      '步廊',
      '神封',
      '灵墟',
      '神藏',
      '彧中',
      '俞府',
    ],
    functions: ['藏精', '主水', '主纳气', '先天之本'],
    pathologies: ['腰膝酸软', '阳痿遗精', '月经不调', '水肿', '气喘', '耳鸣'],
  },
  {
    key: 'xinbao',
    name: '心包经',
    fullName: '手厥阴心包经',
    category: '手厥阴',
    yinyang: '阴',
    organ: '心包',
    direction: '胸走手',
    flowTime: '戌 19-21',
    shengxiao: '狗',
    start: '天池',
    end: '中冲',
    acupoints: ['天池', '天泉', '曲泽', '郄门', '间使', '内关', '大陵', '劳宫', '中冲'],
    functions: ['代心受邪', '主脉所生病'],
    pathologies: ['心胸痛', '心悸', '神志异常', '掌心发热'],
  },
  {
    key: 'sanjiao',
    name: '三焦经',
    fullName: '手少阳三焦经',
    category: '手少阳',
    yinyang: '阳',
    organ: '三焦',
    direction: '手走头',
    flowTime: '亥 21-23',
    shengxiao: '猪',
    start: '关冲',
    end: '丝竹空',
    acupoints: [
      '关冲',
      '液门',
      '中渚',
      '阳池',
      '外关',
      '支沟',
      '会宗',
      '三阳络',
      '四渎',
      '天井',
      '清冷渊',
      '消泺',
      '臑会',
      '肩髎',
      '天髎',
      '天牖',
      '翳风',
      '瘛脉',
      '颅息',
      '角孙',
      '耳门',
      '和髎',
      '丝竹空',
    ],
    functions: ['气机升降', '决渎之官', '水道出焉'],
    pathologies: ['耳鸣耳聋', '偏头痛', '水肿', '小便异常', '胸胁痛'],
  },
  {
    key: 'dan',
    name: '胆经',
    fullName: '足少阳胆经',
    category: '足少阳',
    yinyang: '阳',
    organ: '胆',
    direction: '头走足',
    flowTime: '子 23-01',
    shengxiao: '鼠',
    start: '瞳子髎',
    end: '足窍阴',
    acupoints: [
      '瞳子髎',
      '听会',
      '上关',
      '颔厌',
      '悬颅',
      '悬厘',
      '曲鬓',
      '率谷',
      '天冲',
      '浮白',
      '头窍阴',
      '完骨',
      '本神',
      '阳白',
      '头临泣',
      '目窗',
      '正营',
      '承灵',
      '脑空',
      '风池',
      '肩井',
      '渊腋',
      '辄筋',
      '日月',
      '京门',
      '带脉',
      '五枢',
      '维道',
      '居髎',
      '环跳',
      '风市',
      '中渎',
      '膝阳关',
      '阳陵泉',
      '阳交',
      '外丘',
      '光明',
      '阳辅',
      '悬钟',
      '丘墟',
      '足临泣',
      '地五会',
      '侠溪',
      '足窍阴',
    ],
    functions: ['藏与决断', '中正之官', '主骨所生病'],
    pathologies: ['口苦', '偏头痛', '目眩', '胁痛', '易怒', '失眠'],
  },
  {
    key: 'gan',
    name: '肝经',
    fullName: '足厥阴肝经',
    category: '足厥阴',
    yinyang: '阴',
    organ: '肝',
    direction: '足走胸',
    flowTime: '丑 01-03',
    shengxiao: '牛',
    start: '大敦',
    end: '期门',
    acupoints: [
      '大敦',
      '行间',
      '太冲',
      '中封',
      '蠡沟',
      '中都',
      '膝关',
      '曲泉',
      '阴包',
      '足五里',
      '阴廉',
      '急脉',
      '章门',
      '期门',
    ],
    functions: ['藏血', '主疏泄', '将军之官', '罢极之本'],
    pathologies: ['胁痛', '目疾', '易怒', '月经不调', '眩晕', '抽搐'],
  },
]

// ============ 8 奇经 ============
export interface Qijing {
  name: string
  pinyin: string
  yinyang: '阴' | '阳'
  start: string
  route: string
  functions: string[]
  acupoints: string[]
  symptoms: string[]
}

export const QIJING_LIST: Qijing[] = [
  {
    name: '任脉',
    pinyin: 'ren',
    yinyang: '阴',
    start: '会阴',
    route: '前正中线 · 起胞宫 · 经咽喉 · 至承浆',
    functions: ['阴脉之海', '总任一身之阴经', '调节阴经气血', '主胞胎'],
    acupoints: [
      '会阴',
      '曲骨',
      '中极',
      '关元',
      '石门',
      '气海',
      '阴交',
      '神阙',
      '水分',
      '下脘',
      '建里',
      '中脘',
      '上脘',
      '巨阙',
      '鸠尾',
      '中庭',
      '膻中',
      '玉堂',
      '紫宫',
      '华盖',
      '璇玑',
      '天突',
      '廉泉',
      '承浆',
    ],
    symptoms: ['疝气', '带下', '月经不调', '不孕', '阳痿', '遗精', '咽喉肿痛'],
  },
  {
    name: '督脉',
    pinyin: 'du',
    yinyang: '阳',
    start: '长强',
    route: '后正中线 · 起胞中 · 入脊柱 · 经风府 · 至龈交',
    functions: ['阳脉之海', '总督一身之阳经', '调节阳经气血', '主脑髓'],
    acupoints: [
      '长强',
      '腰俞',
      '腰阳关',
      '命门',
      '悬枢',
      '脊中',
      '中枢',
      '筋缩',
      '至阳',
      '灵台',
      '神道',
      '身柱',
      '陶道',
      '大椎',
      '哑门',
      '风府',
      '脑户',
      '强间',
      '后顶',
      '百会',
      '前顶',
      '囟会',
      '上星',
      '神庭',
      '素髎',
      '水沟',
      '兑端',
      '龈交',
    ],
    symptoms: ['腰脊强痛', '头痛', '中风', '癫痫', '阳虚怕冷', '脑髓空虚'],
  },
  {
    name: '冲脉',
    pinyin: 'chong',
    yinyang: '阴',
    start: '气街',
    route: '起胞中 · 三源 · 一源气街 · 一源肾下 · 一源胃经',
    functions: ['十二经之海', '血海', '渗诸阳 · 渗诸阴', '调节气血'],
    acupoints: [
      '气冲',
      '横骨',
      '大赫',
      '气穴',
      '四满',
      '中注',
      '肓俞',
      '商曲',
      '石关',
      '阴都',
      '腹通谷',
      '幽门',
      '幽门',
    ],
    symptoms: ['月经不调', '崩漏', '气逆上冲', '心腹疼痛', '不孕'],
  },
  {
    name: '带脉',
    pinyin: 'dai',
    yinyang: '阴',
    start: '带脉穴',
    route: '起季胁 · 环腰腹一周 · 如束带',
    functions: ['约束诸经', '主带下'],
    acupoints: ['带脉', '五枢', '维道', '章门'],
    symptoms: ['带下病', '腰腹冷痛', '下肢痿软', '疝气'],
  },
  {
    name: '阴维脉',
    pinyin: 'yinwei',
    yinyang: '阴',
    start: '筑宾',
    route: '起小腿内侧 · 上行 · 入腹 · 至咽喉',
    functions: ['维系诸阴经'],
    acupoints: ['筑宾', '府舍', '大横', '腹哀', '期门', '天突', '廉泉'],
    symptoms: ['心痛', '胃痛', '忧郁', '神志病'],
  },
  {
    name: '阳维脉',
    pinyin: 'yangwei',
    yinyang: '阳',
    start: '金门',
    route: '起足外踝 · 上行 · 经头 · 至风府哑门',
    functions: ['维系诸阳经'],
    acupoints: [
      '金门',
      '阳交',
      '臑俞',
      '天髎',
      '肩井',
      '头维',
      '本神',
      '阳白',
      '头临泣',
      '目窗',
      '正营',
      '承灵',
      '脑空',
      '风池',
      '风府',
      '哑门',
    ],
    symptoms: ['外感发热', '头痛', '项强', '关节痛'],
  },
  {
    name: '阴跷脉',
    pinyin: 'yinqiao',
    yinyang: '阴',
    start: '照海',
    route: '起足跟内侧 · 上行 · 至目内眦',
    functions: ['主一身左右之阴', '濡养眼目', '司寤寐'],
    acupoints: ['照海', '交信', '睛明'],
    symptoms: ['嗜睡', '癫痫', '足内翻', '眼睑下垂', '小便异常'],
  },
  {
    name: '阳跷脉',
    pinyin: 'yangqiao',
    yinyang: '阳',
    start: '申脉',
    route: '起足外踝 · 上行 · 至目内眦',
    functions: ['主一身左右之阳', '主筋', '司寤寐'],
    acupoints: [
      '申脉',
      '仆参',
      '跗阳',
      '居髎',
      '臑俞',
      '肩髃',
      '巨骨',
      '天髎',
      '地仓',
      '巨髎',
      '承泣',
      '睛明',
    ],
    symptoms: ['失眠', '癫痫', '足外翻', '腰背痛', '眼睑痉挛'],
  },
]

// ============ 15 络脉 ============
export const LUO_MAI_15 = [
  { name: '手太阴络', start: '列缺', spread: '入掌中 · 散入鱼际' },
  { name: '手阳明络', start: '偏历', spread: '入耳 · 合宗脉' },
  { name: '足阳明络', start: '丰隆', spread: '上行 · 络喉嗌' },
  { name: '足太阴络', start: '公孙', spread: '入络肠胃' },
  { name: '手少阴络', start: '通里', spread: '入心中 · 系舌本 · 属目系' },
  { name: '手太阳络', start: '支正', spread: '走肘 · 络肩髃' },
  { name: '足太阳络', start: '飞扬', spread: '走头 · 入脑' },
  { name: '足少阴络', start: '大钟', spread: '并经上走 · 包络' },
  { name: '手厥阴络', start: '内关', spread: '上系于心包 · 络心系' },
  { name: '手少阳络', start: '外关', spread: '绕臂 · 注胸中 · 合心主' },
  { name: '足少阳络', start: '光明', spread: '下络足跗' },
  { name: '足厥阴络', start: '蠡沟', spread: '上睾 · 结于茎' },
  { name: '任脉络', start: '鸠尾', spread: '散于腹' },
  { name: '督脉络', start: '长强', spread: '挟膂 · 上项 · 散头上' },
  { name: '脾之大络', start: '大包', spread: '布胸胁' },
]

// ============ 子午流注 · 12 时辰开阖 ============
export interface HourlyJing {
  zhi: string
  zhiName: string
  shengxiao: string
  hourRange: string
  jingluo: JingluoKey
  jingluoName: string
  organ: string
  qiState: '旺' | '盛' | '衰' | '虚' | '平'
  bestActivity: string[]
  avoidActivity: string[]
  principle: string
}

export const HOURLY_JING: HourlyJing[] = [
  {
    zhi: '子',
    zhiName: '子时',
    shengxiao: '鼠',
    hourRange: '23:00-01:00',
    jingluo: 'dan',
    jingluoName: '胆经',
    organ: '胆',
    qiState: '旺',
    bestActivity: ['深度睡眠', '静心入眠', '胆经排毒'],
    avoidActivity: ['熬夜', '宵夜', '剧烈运动'],
    principle: '凡十一脏取决于胆 · 子时一阳生',
  },
  {
    zhi: '丑',
    zhiName: '丑时',
    shengxiao: '牛',
    hourRange: '01:00-03:00',
    jingluo: 'gan',
    jingluoName: '肝经',
    organ: '肝',
    qiState: '旺',
    bestActivity: ['深睡眠', '肝血回流', '养血排毒'],
    avoidActivity: ['喝酒', '熬夜', '情绪激动'],
    principle: '肝藏血 · 卧则血归于肝',
  },
  {
    zhi: '寅',
    zhiName: '寅时',
    shengxiao: '虎',
    hourRange: '03:00-05:00',
    jingluo: 'lu',
    jingluoName: '肺经',
    organ: '肺',
    qiState: '旺',
    bestActivity: ['深睡眠', '深呼吸', '肺气肃降'],
    avoidActivity: ['吸烟', '起床过早', '吹冷风'],
    principle: '肺朝百脉 · 寅时气血由静转动',
  },
  {
    zhi: '卯',
    zhiName: '卯时',
    shengxiao: '兔',
    hourRange: '05:00-07:00',
    jingluo: 'dachang',
    jingluoName: '大肠经',
    organ: '大肠',
    qiState: '旺',
    bestActivity: ['起床排浊', '喝温水', '晨练'],
    avoidActivity: ['赖床', '憋便', '强体力活动'],
    principle: '大肠传导之官 · 卯时宜排',
  },
  {
    zhi: '辰',
    zhiName: '辰时',
    shengxiao: '龙',
    hourRange: '07:00-09:00',
    jingluo: 'wei',
    jingluoName: '胃经',
    organ: '胃',
    qiState: '旺',
    bestActivity: ['吃早餐', '营养摄入', '温阳之食'],
    avoidActivity: ['不吃早餐', '冷食', '暴饮暴食'],
    principle: '胃经当令 · 早餐温热易吸收',
  },
  {
    zhi: '巳',
    zhiName: '巳时',
    shengxiao: '蛇',
    hourRange: '09:00-11:00',
    jingluo: 'pi',
    jingluoName: '脾经',
    organ: '脾',
    qiState: '旺',
    bestActivity: ['工作学习黄金期', '健脾食物', '适度运动'],
    avoidActivity: ['生冷油腻', '思虑过度', '久坐'],
    principle: '脾主运化 · 巳时气血充盛',
  },
  {
    zhi: '午',
    zhiName: '午时',
    shengxiao: '马',
    hourRange: '11:00-13:00',
    jingluo: 'xin',
    jingluoName: '心经',
    organ: '心',
    qiState: '旺',
    bestActivity: ['午休小憩', '养心安神', '清淡午餐'],
    avoidActivity: ['暴怒', '剧烈运动', '过饱'],
    principle: '心主神明 · 午时阴生宜静',
  },
  {
    zhi: '未',
    zhiName: '未时',
    shengxiao: '羊',
    hourRange: '13:00-15:00',
    jingluo: 'xiaochang',
    jingluoName: '小肠经',
    organ: '小肠',
    qiState: '旺',
    bestActivity: ['小肠吸收', '下午茶', '创意工作'],
    avoidActivity: ['冷饮', '重餐后即睡'],
    principle: '小肠泌别清浊 · 午餐营养充分吸收',
  },
  {
    zhi: '申',
    zhiName: '申时',
    shengxiao: '猴',
    hourRange: '15:00-17:00',
    jingluo: 'pangguang',
    jingluoName: '膀胱经',
    organ: '膀胱',
    qiState: '旺',
    bestActivity: ['学习记忆', '补水', '多喝水排毒'],
    avoidActivity: ['久坐', '憋尿'],
    principle: '膀胱经主筋 · 申时学习高效',
  },
  {
    zhi: '酉',
    zhiName: '酉时',
    shengxiao: '鸡',
    hourRange: '17:00-19:00',
    jingluo: 'shen',
    jingluoName: '肾经',
    organ: '肾',
    qiState: '旺',
    bestActivity: ['晚餐滋补', '散步', '养藏精气'],
    avoidActivity: ['剧烈运动', '咖啡', '过度劳累'],
    principle: '肾藏精 · 酉时宜静养',
  },
  {
    zhi: '戌',
    zhiName: '戌时',
    shengxiao: '狗',
    hourRange: '19:00-21:00',
    jingluo: 'xinbao',
    jingluoName: '心包经',
    organ: '心包',
    qiState: '旺',
    bestActivity: ['放松娱乐', '散步', '愉悦心情'],
    avoidActivity: ['情绪激动', '重餐'],
    principle: '心包代心受邪 · 戌时宜喜乐',
  },
  {
    zhi: '亥',
    zhiName: '亥时',
    shengxiao: '猪',
    hourRange: '21:00-23:00',
    jingluo: 'sanjiao',
    jingluoName: '三焦经',
    organ: '三焦',
    qiState: '旺',
    bestActivity: ['准备入睡', '八段锦', '调息'],
    avoidActivity: ['夜宵', '手机', '剧烈活动'],
    principle: '三焦通百脉 · 亥时宜入眠',
  },
]

// ============ 灵龟八法（八脉交会穴） ============
export interface LingguiPoint {
  qijing: string // 奇经名
  jingluo: string // 经脉
  acupoint: string // 穴位
  gao: { gan: string; zhi: string } // 卦象配
  function: string
  indications: string[]
}

export const LINGGUI_POINTS: LingguiPoint[] = [
  {
    qijing: '冲脉',
    jingluo: '足太阴脾经',
    acupoint: '公孙',
    gao: { gan: '乾', zhi: '艮' },
    function: '胃心胸疾',
    indications: ['胃痛', '心胸闷', '消化不良'],
  },
  {
    qijing: '阴维',
    jingluo: '手厥阴心包经',
    acupoint: '内关',
    gao: { gan: '巽', zhi: '兑' },
    function: '中焦疾',
    indications: ['心痛', '胃不和', '失眠'],
  },
  {
    qijing: '督脉',
    jingluo: '足太阳膀胱经',
    acupoint: '申脉',
    gao: { gan: '坎', zhi: '乾' },
    function: '头面颈项疾',
    indications: ['头痛', '颈椎病', '面瘫'],
  },
  {
    qijing: '阳跷',
    jingluo: '手太阳小肠经',
    acupoint: '后溪',
    gao: { gan: '艮', zhi: '巽' },
    function: '颈项肩背疾',
    indications: ['颈椎', '肩背痛', '落枕'],
  },
  {
    qijing: '任脉',
    jingluo: '足少阴肾经',
    acupoint: '照海',
    gao: { gan: '兑', zhi: '坤' },
    function: '咽喉小腹疾',
    indications: ['咽干', '小便频', '妇科'],
  },
  {
    qijing: '阴跷',
    jingluo: '手太阴肺经',
    acupoint: '列缺',
    gao: { gan: '震', zhi: '离' },
    function: '肺系咽喉疾',
    indications: ['咳嗽', '咽炎', '气喘'],
  },
  {
    qijing: '带脉',
    jingluo: '足少阳胆经',
    acupoint: '足临泣',
    gao: { gan: '巽', zhi: '坎' },
    function: '目胫耳疾',
    indications: ['偏头痛', '目赤', '胁肋痛'],
  },
  {
    qijing: '阳维',
    jingluo: '手少阳三焦经',
    acupoint: '外关',
    gao: { gan: '震', zhi: '艮' },
    function: '外感头项疾',
    indications: ['感冒', '偏头痛', '耳鸣'],
  },
]

/**
 * 灵龟八法开穴（按时辰推算）
 * 八法流注：八穴按时辰顺序开阖
 */
const BAFA_ORDER = ['公孙', '内关', '足临泣', '外关', '列缺', '照海', '后溪', '申脉']

export function lingguiOpen(hour: number): {
  acupoint: string
  function: string
  indications: string[]
} {
  const idx = Math.floor((hour + 1) / 2) % 8
  const point = LINGGUI_POINTS.find((p) => p.acupoint === BAFA_ORDER[idx]) || LINGGUI_POINTS[0]!
  return { acupoint: point.acupoint, function: point.function, indications: point.indications }
}

// ============ 当前时辰活跃经脉 ============
export function currentHourlyJing(hour?: number): HourlyJing {
  const h = hour ?? new Date().getHours()
  const idx = h === 23 || h === 0 ? 0 : Math.floor((h + 1) / 2)
  return HOURLY_JING[idx % 12]
}

// ============ 病症 → 推荐经脉 ============
const SYMPTOM_MAP: Array<{ symptoms: string[]; jingluoKeys: JingluoKey[] }> = [
  {
    symptoms: ['失眠', '多梦', '入睡困难', '易醒', '心悸', '心烦', '盗汗', '记忆力差'],
    jingluoKeys: ['xin', 'xinbao', 'shen', 'gan'],
  },
  {
    symptoms: ['咳嗽', '气喘', '哮喘', '气短', '易感冒', '咽干', '鼻塞'],
    jingluoKeys: ['lu', 'dachang', 'pi'],
  },
  {
    symptoms: ['食欲不振', '腹胀', '腹泻', '便秘', '消化不良', '胃痛', '呕吐'],
    jingluoKeys: ['pi', 'wei', 'dachang', 'xiaochang'],
  },
  {
    symptoms: ['腰痛', '膝软', '阳痿', '遗精', '月经不调', '不孕', '怕冷'],
    jingluoKeys: ['shen', 'pangguang', 'gan'],
  },
  {
    symptoms: ['易怒', '头晕', '目赤', '胁痛', '月经不调', '高血压'],
    jingluoKeys: ['gan', 'dan', 'gan'],
  },
  {
    symptoms: ['耳鸣', '耳聋', '偏头痛', '口苦', '胁肋痛', '易惊'],
    jingluoKeys: ['dan', 'sanjiao', 'gan'],
  },
  {
    symptoms: ['水肿', '小便异常', '尿频', '尿急', '尿痛'],
    jingluoKeys: ['shen', 'pangguang', 'sanjiao'],
  },
  {
    symptoms: ['皮肤瘙痒', '湿疹', '荨麻疹', '痤疮', '黄褐斑'],
    jingluoKeys: ['lu', 'dachang', 'pi', 'gan'],
  },
  {
    symptoms: ['颈肩痛', '腰背痛', '关节痛', '落枕'],
    jingluoKeys: ['pangguang', 'dan', 'dachang', 'xiaochang'],
  },
  {
    symptoms: ['牙痛', '咽喉肿痛', '口腔溃疡', '口臭'],
    jingluoKeys: ['dachang', 'wei', 'lu', 'shen'],
  },
  {
    symptoms: ['手脚冰凉', '畏寒', '乏力', '气虚', '易疲劳'],
    jingluoKeys: ['shen', 'pi', 'wei', 'xin'],
  },
  {
    symptoms: ['焦虑', '抑郁', '情绪低落', '烦躁', '易紧张'],
    jingluoKeys: ['gan', 'xin', 'xinbao', 'pi'],
  },
  { symptoms: ['眼干', '眼涩', '视力模糊', '红眼'], jingluoKeys: ['gan', 'dan', 'pangguang'] },
  {
    symptoms: ['痛经', '闭经', '白带异常', '子宫肌瘤', '卵巢囊肿'],
    jingluoKeys: ['gan', 'pi', 'shen', 'xiaochang'],
  },
  { symptoms: ['心律不齐', '胸闷', '心前区不适'], jingluoKeys: ['xin', 'xinbao', 'gan', 'shen'] },
]

export function jingluoBySymptom(symptom: string): { jingluoList: Jingluo[]; matched: string[] } {
  const sym = symptom.trim()
  for (const item of SYMPTOM_MAP) {
    const matched = item.symptoms.filter((s) => sym.includes(s) || s.includes(sym))
    if (matched.length > 0) {
      const seen = new Set<JingluoKey>()
      const jl: Jingluo[] = []
      for (const k of item.jingluoKeys) {
        if (seen.has(k)) continue
        seen.add(k)
        const j = JINGLUO_LIST.find((j) => j.key === k)
        if (j) jl.push(j)
      }
      return { jingluoList: jl, matched }
    }
  }
  return { jingluoList: [], matched: [] }
}

// ============ 穴位详情 ============
export interface Acupoint {
  name: string
  jingluo: string
  location: string
  function: string
  indication: string[]
  method: string
}

const ACUPOINT_DB: Record<string, Acupoint> = {
  合谷: {
    name: '合谷',
    jingluo: '手阳明大肠经',
    location: '手背第 1-2 掌骨间 · 拇指食指并拢 · 肌肉最高点',
    function: '镇静止痛 · 通经活络 · 清热解表',
    indication: ['头痛', '牙痛', '咽喉肿痛', '面瘫', '发热', '无汗'],
    method: '直刺 0.5-1 寸 · 孕妇慎用',
  },
  足三里: {
    name: '足三里',
    jingluo: '足阳明胃经',
    location: '外膝眼下 3 寸 · 胫骨外 1 横指',
    function: '强壮要穴 · 健脾和胃 · 扶正培元',
    indication: ['胃痛', '腹胀', '腹泻', '体虚', '高血压', '失眠'],
    method: '直刺 1-1.5 寸 · 可灸 · 常用保健穴',
  },
  三阴交: {
    name: '三阴交',
    jingluo: '足太阴脾经',
    location: '内踝尖上 3 寸 · 胫骨内缘后方',
    function: '健脾益血 · 调经止带 · 安神助眠',
    indication: ['月经不调', '痛经', '失眠', '脾胃虚弱', '高血压'],
    method: '直刺 1-1.5 寸 · 孕妇禁针',
  },
  内关: {
    name: '内关',
    jingluo: '手厥阴心包经',
    location: '腕横纹上 2 寸 · 掌长肌腱与桡侧腕屈肌腱之间',
    function: '宁心安神 · 理气止痛 · 宽胸和胃',
    indication: ['心痛', '心悸', '胃痛', '呕吐', '失眠', '眩晕'],
    method: '直刺 0.5-1 寸 · 可灸',
  },
  太冲: {
    name: '太冲',
    jingluo: '足厥阴肝经',
    location: '足背 · 第 1-2 跖骨结合部前凹陷中',
    function: '疏肝理气 · 平肝潜阳 · 清肝明目',
    indication: ['头痛', '眩晕', '目赤肿痛', '胁痛', '易怒', '高血压'],
    method: '直刺 0.5-0.8 寸',
  },
  涌泉: {
    name: '涌泉',
    jingluo: '足少阴肾经',
    location: '足底 · 足趾跖屈时呈凹陷处 · 约当足底 2-3 趾间',
    function: '开窍苏厥 · 滋肾清热 · 引火下行',
    indication: ['眩晕', '失眠', '高血压', '中风', '昏厥'],
    method: '直刺 0.5-0.8 寸 · 可灸',
  },
  神门: {
    name: '神门',
    jingluo: '手少阴心经',
    location: '腕横纹尺侧端 · 尺侧腕屈肌腱桡侧凹陷处',
    function: '宁心安神 · 清心调气',
    indication: ['失眠', '心悸', '健忘', '心痛', '神志异常'],
    method: '直刺 0.3-0.5 寸',
  },
  百会: {
    name: '百会',
    jingluo: '督脉',
    location: '头顶正中线 · 两耳尖连线中点',
    function: '升阳举陷 · 镇静安神 · 平肝潜阳',
    indication: ['头痛', '眩晕', '中风', '失眠', '脱肛', '子宫脱垂'],
    method: '平刺 0.5-0.8 寸 · 可灸',
  },
  大椎: {
    name: '大椎',
    jingluo: '督脉',
    location: '第 7 颈椎棘突下凹陷中',
    function: '清热解表 · 镇静安神 · 截疟止痫',
    indication: ['感冒', '发热', '疟疾', '颈椎病', '痤疮'],
    method: '向上斜刺 0.5-1 寸 · 可灸',
  },
  气海: {
    name: '气海',
    jingluo: '任脉',
    location: '前正中线 · 脐下 1.5 寸',
    function: '益气固脱 · 调经止带 · 强壮要穴',
    indication: ['气虚', '阳痿', '月经不调', '腹痛', '体虚'],
    method: '直刺 1-1.5 寸 · 孕妇慎用 · 可灸',
  },
  关元: {
    name: '关元',
    jingluo: '任脉',
    location: '前正中线 · 脐下 3 寸',
    function: '培元固本 · 温肾壮阳 · 调理冲任',
    indication: ['阳痿', '遗精', '月经不调', '不孕', '虚劳', '腹痛'],
    method: '直刺 1-1.5 寸 · 可灸 · 孕妇慎用',
  },
  中脘: {
    name: '中脘',
    jingluo: '任脉',
    location: '前正中线 · 脐上 4 寸',
    function: '和胃健脾 · 降逆止呕 · 理气化湿',
    indication: ['胃痛', '腹胀', '呕吐', '消化不良', '失眠'],
    method: '直刺 1-1.5 寸 · 可灸',
  },
  风池: {
    name: '风池',
    jingluo: '足少阳胆经',
    location: '项后 · 枕骨下两侧凹陷中 · 斜方肌上端与胸锁乳突肌之间',
    function: '祛风解表 · 清头目 · 利官窍',
    indication: ['头痛', '感冒', '颈椎病', '眩晕', '目赤'],
    method: '向鼻尖方向刺 0.8-1 寸',
  },
  阳陵泉: {
    name: '阳陵泉',
    jingluo: '足少阳胆经',
    location: '腓骨小头前下方凹陷中',
    function: '疏肝利胆 · 舒筋活络 · 清热利湿',
    indication: ['胁痛', '口苦', '膝痛', '下肢痿痹', '高血压'],
    method: '直刺 1-1.5 寸',
  },
  曲池: {
    name: '曲池',
    jingluo: '手阳明大肠经',
    location: '肘横纹外端 · 肱骨外上髁与桡骨小头间凹陷',
    function: '清热解表 · 调和气血 · 疏风止痒',
    indication: ['发热', '高血压', '皮肤瘙痒', '咽喉肿痛', '手臂痛'],
    method: '直刺 1-1.5 寸',
  },
}

export function getAcupoint(name: string): Acupoint | null {
  return ACUPOINT_DB[name] || null
}

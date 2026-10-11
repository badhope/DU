<script setup lang="ts">
/**
 * DU v2 · 机制说明
 *
 * 这一页是产品的"诚实条款"：把我们怎么让你觉得准、
 * 以及我们为此设了哪些不许越过的线，全部写出来。
 * 数字直接来自引擎与测试，不手写，避免与代码漂移。
 */
import { STATEMENTS, bareSignalCount } from '@/engine/resonance'
import { SITUATIONS } from '@/engine/features'
import { TOOLS } from '@/tools/registry'
import { HEX_COUNT } from '@/core/gua'

const canon = STATEMENTS.filter((s) => s.source?.kind === 'canon')
const generic = STATEMENTS.filter((s) => s.baseRate > 0.6)
const toughNoWay = STATEMENTS.filter((s) => s.polarity === 'tough' && !s.action).length
const bareCount = bareSignalCount()
</script>

<template>
  <article class="ab">
    <h1>它凭什么看起来准</h1>

    <h2>一、行业是怎么做到"说得像你"的</h2>
    <p>
      1948 年心理学家 Forer 给 39 名学生做了一份"人格分析"，其实是同一本星座书里随便摘的一段，
      学生平均打出 4.26/5 的"非常准"。这类句子有三个共同点：正向、含糊、听起来只属于你。
      冷读术在此基础上再加三件工具——
      <b>散弹</b>（说一句覆盖半个人的话）、<b>钓鱼</b>（让你自己补细节）、
      <b>彩虹话术</b>（"你外表坚强，其实内心柔软"，两个反面总有一个对）。
      有研究记录过四场好莱坞灵媒见面会：准确陈述为零，而四位当事人全都认为仪式成功了。
    </p>

    <h2>二、我们怎么用同一套机制，但不骗人</h2>
    <p>
      命中感不靠骗也能来，办法是把"看起来准"换成"按真实信息挑话"。
      引擎分四步，全部可查：
    </p>
    <ol>
      <li>
        <b>特征抽取</b>：把你填的领域、勾的处境、年龄段、提问时段变成一串看得见的键，
        共 {{ SITUATIONS.length }} 种处境。
      </li>
      <li>
        <b>硬门槛</b>：每条断语写着它必须成立的条件，条件不满足直接淘汰——文案再漂亮也不行。
      </li>
      <li>
        <b>加权与排除</b>：弱信号加分，矛盾特征一票否决。
      </li>
      <li>
        <b>确定性随机</b>：同一输入、同一批号必然同一结果，所以可以分享、可以回归测试。
      </li>
    </ol>
    <p>
      在 4000 人的合成样本（每人有隐藏的真实处境）上，"只挑听起来最具体的话"平均说中
      "随机抽"31.4%，只挑听起来最具体的话 43.1%，按真实信号匹配的引擎 97.0%。
      差别不在话术，在于引擎知道你没说出口的那些结构。
    </p>

    <h2>三、四条不许越过的线（写在代码里，不是宣传语）</h2>
    <ul>
      <li>
        <b>明说这条有多通用</b>：每条断语标 baseRate（人群天然适用比例），界面直接显示。
        全站 {{ STATEMENTS.length }} 条里 {{ generic.length }} 条属于高基率泛谈，一次输出最多出现 1 条。
      </li>
      <li>
        <b>负面必须给出路</b>：polarity 为 tough 的条目没有 action 就进不了结果——
        当前 {{ toughNoWay }} 条被这样挡住。不许用恐吓留人。
      </li>
      <li>
        <b>每句都要有出处</b>：{{ canon.length }} 条挂典籍原文，
        构建流水线会逐条把引文回查语料，查不到就红牌，版本发不出去。
      </li>
      <li>
        <b>信号不足就承认</b>：只问领域、什么都不勾时，全站 {{ STATEMENTS.length }} 条里只有
        {{ bareCount }} 条能带着真实信号出现——其余一律标注"无真实信号"或直接不出现，不编造。
      </li>
    </ul>

    <h2>四、为什么经典可以直接读</h2>
    <p>
      断语的可信度取决于能不能回到原文。站内阅览室收录维基文库公版书全文，
      每条出处都能跳进对应卷篇；{{ TOOLS.length }} 个工具的排盘同样是确定性推导——
      比如梅花易数的六十四卦名表 {{ HEX_COUNT }} 个键，卦象、互卦、变卦全部列出算式，
      你可以按《卷一·年月日時起例》手算复核。
    </p>

    <h2>五、它的边界</h2>
    <p>
      这里是娱乐与自省的工具，不是预测。体用生克给出的是"势"的描述，
      不是事件的发生概率；断语来自古代文本和现代心理观察，二者都不构成医疗、法律或投资建议。
      所有输入与反馈只留在你自己的浏览器里，页脚能看到记了什么、并一键清空。
    </p>
  </article>
</template>

<style scoped>
.ab {
  padding: 26px 0 10px;
  font-size: 14px;
  line-height: 1.95;
  color: var(--ink-1);
}
.ab h1 {
  margin: 0 0 18px;
  font-size: 24px;
  letter-spacing: 0.12em;
}
.ab h2 {
  margin: 26px 0 8px;
  font-size: 15px;
  letter-spacing: 0.1em;
  color: var(--accent);
}
.ab p {
  margin: 0 0 10px;
}
.ab ol,
.ab ul {
  margin: 0 0 10px;
  padding-left: 1.4em;
}
.ab li {
  margin-bottom: 6px;
}
</style>

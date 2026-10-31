<script setup lang="ts">
import { computed } from 'vue'
import { ACTIVE_MASTERS, MASTERS } from '@/masters/registry'
import { STATEMENTS } from '@/engine/resonance'
import { getManifest } from '@/data/corpus'
import { ref, onMounted } from 'vue'

const manifest = ref<Awaited<ReturnType<typeof getManifest>> | null>(null)
const canonCount = computed(() => STATEMENTS.filter((item) => item.source?.kind === 'canon').length)
onMounted(async () => { try { manifest.value = await getManifest() } catch { manifest.value = null } })
</script>

<template>
  <article class="ab"><p class="kicker">ABOUT / METHOD</p><h1>它不是“神谕”，是一套可拆开的测评系统</h1><p>天机台把传统数术拆成四层：确定性事实、古籍材料、模型演绎、用户测评。每层都可以单独检查；不确定的地方不包装成准确。</p><h2>一、为什么改成大师测评竞技场</h2><p>旧版更像工具箱：能排盘，但用户没有理由比较不同体系，也没有办法在事后记录“这次断语是否真的发生”。新方向保留排盘与古籍阅览室，把一次性占卜变成一条可复盘链路：同一问题由两位大师回答，先盲评，再揭晓，再把带日期的断言放入应验簿。</p><h2>二、四层机制</h2><ol><li><b>事实层：</b>八字与梅花内核只输出可复核字段，如四柱、五行、卦名、动爻和体用；模型不能修改这些字段。</li><li><b>知识层：</b>从站内 {{ manifest?.books.length ?? '12' }} 部公版古籍检索片段。引用必须显示书名与篇章，运行时可点回阅览室核验。</li><li><b>演绎层：</b>可接入 OpenAI 兼容、Anthropic 或自定义 endpoint；没有 Key 时自动使用离线规则模式。模型只负责组织语言，不负责产生排盘数字。</li><li><b>测评层：</b>用户盲投票更新本机 Elo；至少 5 场才进入在榜，胜率显示 Wilson 下界，应验率只统计人工回填。</li></ol><h2>三、首版能力边界</h2><p>当前 {{ ACTIVE_MASTERS.length }} 位大师进入生产盲测，另有 {{ MASTERS.length - ACTIVE_MASTERS.length }} 张方法卡公开但仍在筹备。紫微、奇门、六壬和相法必须补齐外部例题、边界条件与回归测试后才能进入 active，不因为“有一份旧代码”就宣称算法可信。</p><h2>四、透明与安全</h2><ul><li>全站已有 {{ STATEMENTS.length }} 条断语，其中 {{ canonCount }} 条挂有可查典籍出处；高基率泛谈会显示适用率。</li><li>模型 Key 默认只放 sessionStorage；接入外部 endpoint 时，用户应自行判断数据合规，Key 不进入 URL、日志、回答或导出。</li><li>不提供医疗、法律、投资建议，不预测死亡和重病，不用灾祸话术留人；相法方法卡不接收、不识别人脸图像。</li><li>数据默认只在本机；清空浏览器存储即可移除本机对局与应验簿。</li></ul><h2>五、它能证明什么</h2><p>榜单只能证明“在这台设备、这些问题、这些用户反馈下的记录”，不能证明玄学理论或模型具有科学预测能力。盲评减少名号偏见，应验簿提高可反驳性；两者都不等于科学实验。本站定位是传统文化材料、软件机制与自省体验的结合。</p></article>
</template>

<style scoped>
.ab { padding:28px 0 10px; font-size:14px; line-height:1.95; color:var(--ink-1); }
.kicker { margin:0 0 6px; color:var(--accent-2); font-size:10px; letter-spacing:.2em; }
.ab h1 { margin:0 0 18px; font-size:25px; letter-spacing:.1em; }
.ab h2 { margin:28px 0 8px; color:var(--accent); font-size:15px; letter-spacing:.1em; }
.ab p { margin:0 0 10px; }
.ab ol,.ab ul { margin:0 0 10px; padding-left:1.4em; }
.ab li { margin-bottom:7px; }
</style>

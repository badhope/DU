<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ACTIVE_MASTERS, MASTERS } from '@/masters/registry'
import type { Master } from '@/contract/master'
import { listLeaderboard } from '@/arena/store'
import { getManifest, type Manifest } from '@/data/corpus'
import { STATEMENTS } from '@/engine/resonance'
import MasterCard from '@/ui/MasterCard.vue'

const manifest = ref<Manifest | null>(null)
const board = computed(() => listLeaderboard())
const plannedMasters = computed<Master[]>(() => MASTERS.filter((master) => master.status === 'planned'))
const canonCount = computed(() => STATEMENTS.filter((item) => item.source?.kind === 'canon').length)
const daily = computed(() => {
  const now = new Date()
  const key = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
  const index = [...key].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7) % STATEMENTS.length
  return STATEMENTS[index]!
})
onMounted(async () => { try { manifest.value = await getManifest() } catch { manifest.value = null } })
</script>

<template>
  <section class="hm-hero">
    <p class="hm-kicker">TIANJI / MASTER ARENA</p>
    <h1 class="hm-h">天机台</h1>
    <p class="hm-sub">同一问题，请两位大师各断一遍。先匿名盲评，再看方法与本地规则；古籍可查，样本可回填，准不准由你记录。</p>
    <div class="hm-actions"><RouterLink class="du-btn primary" to="/ask">开始问天</RouterLink><RouterLink class="du-btn" to="/leaderboard">查看大师榜</RouterLink></div>
    <div class="hm-daily"><p class="hm-daily-k">今日天机 · 仅作自省</p><p class="hm-daily-x">{{ daily.text }}</p><p class="hm-daily-s">{{ daily.source?.kind === 'canon' ? `《${daily.source.book}》${daily.source.loc ?? ''}：${daily.source.quote ?? ''}` : daily.source?.gloss ?? '经验观察' }}</p><p class="hm-daily-b">人群天然适用约 {{ Math.round(daily.baseRate * 100) }}%；不是个性化预测。</p></div>
  </section>

  <section class="hm-section"><div class="hm-section-head"><h2>大师阵列</h2><RouterLink to="/masters/ziping">看方法卡 →</RouterLink></div><p class="hm-note">首版只让已复核的事实层进入盲测；其他门派先公开方法与来源，不把“筹备中”伪装成算法完成。</p><div class="hm-masters"><MasterCard v-for="master in ACTIVE_MASTERS" :key="master.id" :master="master" :stats="board.find((row) => row.masterId === master.id)" /></div><div class="hm-planned"><h3>筹备中的方法卡</h3><RouterLink v-for="master in plannedMasters" :key="master.id" class="hm-planned-link" :to="`/masters/${master.id}`"><strong>{{ master.name }}</strong><span>{{ master.school }} · 尚未进入生产排盘</span></RouterLink></div></section>

  <section class="hm-section hm-arena"><div><p class="hm-kicker">THE LOOP</p><h2>提问 → 盲评 → 应验</h2><p>排盘事实与断语都在本机生成；同源古籍只从仓库静态语料读取。投票写入本机榜单，带日期的断言可在应验簿里回填。</p></div><RouterLink class="du-btn" to="/arena">进入擂台</RouterLink></section>

  <section class="hm-stats"><div><b>{{ ACTIVE_MASTERS.length }}</b><span>可测评大师</span></div><div><b>{{ MASTERS.length - ACTIVE_MASTERS.length }}</b><span>方法卡筹备中</span></div><div><b>{{ manifest?.books.length ?? '—' }}</b><span>部可检索古籍</span></div><div><b>{{ canonCount }}</b><span>条已有出处断语</span></div></section>

  <section class="hm-section hm-legacy-section"><div class="hm-section-head"><h2>确定性工具</h2><span>旧入口仍保留</span></div><RouterLink class="hm-card" to="/t/meihua"><strong>梅花易数</strong><span>时间或两个数起卦，本互变三卦、体用生克，断语全部标出处。</span></RouterLink></section>
</template>

<style scoped>
.hm-hero { padding:38px 0 22px; }
.hm-kicker { margin:0 0 7px; color:var(--accent-2); font-size:10px; letter-spacing:.2em; }
.hm-h { margin:0; font-size:56px; letter-spacing:.18em; }
.hm-sub { max-width:52ch; margin:11px 0 0; color:var(--ink-2); font-size:15px; line-height:1.85; }
.hm-actions { display:flex; gap:9px; margin-top:18px; }
.hm-actions a { text-decoration:none; }
.hm-daily { margin-top:24px; padding:16px; border:1px solid var(--line); border-left:3px solid var(--accent-2); border-radius:var(--radius); background:var(--bg-1); }
.hm-daily-k { margin:0 0 7px; color:var(--accent-2); font-size:11px; letter-spacing:.14em; }
.hm-daily-x { margin:0; font-size:17px; line-height:1.7; }
.hm-daily-s { margin:8px 0 0; color:var(--ink-2); font-size:12px; line-height:1.7; }
.hm-daily-b { margin:8px 0 0; color:var(--ink-3); font-size:11px; }
.hm-section { margin-top:28px; }
.hm-section-head { display:flex; align-items:baseline; justify-content:space-between; gap:10px; }
.hm-section h2 { margin:0; font-size:19px; letter-spacing:.1em; }
.hm-section-head a { color:var(--accent); font-size:12px; }
.hm-note,.hm-arena p { color:var(--ink-3); font-size:12px; line-height:1.8; }
.hm-masters { display:grid; gap:10px; margin-top:13px; }
.hm-planned { display:grid; gap:7px; margin-top:16px; }
.hm-planned h3 { margin:0; color:var(--ink-3); font-size:12px; font-weight:500; }
.hm-planned-link { display:flex; justify-content:space-between; gap:10px; padding:9px 11px; border:1px dashed var(--line); border-radius:var(--radius); color:var(--ink-2); text-decoration:none; font-size:12px; }
.hm-planned-link span { color:var(--ink-3); font-size:11px; }
.hm-arena { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:17px; border:1px dashed var(--line); border-radius:var(--radius); background:var(--surface-1); }
.hm-arena h2 { margin:0; }
.hm-arena p { margin:7px 0 0; }
.hm-arena a { flex:none; text-decoration:none; }
.hm-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(110px,1fr)); gap:8px; margin:28px 0 14px; padding:14px; border:1px dashed var(--line); border-radius:var(--radius); }
.hm-stats div { display:grid; text-align:center; }
.hm-stats b { color:var(--accent); font-size:22px; }
.hm-stats span { color:var(--ink-3); font-size:10px; }
.hm-legacy-section > .hm-section-head span { color:var(--ink-3); font-size:11px; }
@media (max-width:620px) { .hm-h { font-size:46px; } .hm-arena { align-items:flex-start; flex-direction:column; } }
</style>

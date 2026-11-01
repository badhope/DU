<script setup lang="ts">
import { ref } from 'vue'
import { exportArena, importArena, resetArena } from '@/arena/store'
import { resetSession } from '@/composables/session'

const saved = ref('')
const importError = ref('')
function download() {
  const blob = new Blob([exportArena()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'tianji-local-arena.json'
  link.click()
  URL.revokeObjectURL(url)
}
function readImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 2_000_000) { importError.value = '导入失败：文件超过 2 MB。'; return }
  const reader = new FileReader()
  reader.onload = () => { importError.value = importArena(String(reader.result)) ? '本机数据已导入。' : '导入失败：文件结构不符合本机台账格式。' }
  reader.readAsText(file)
}
function resetAll() {
  resetArena()
  resetSession()
  try {
    const legacyAi = ['tianji', 'ai', 'v1'].join('.')
    const legacyAiSession = ['tianji', 'ai', 'session', 'v1'].join('.')
    for (const key of [legacyAi, legacyAiSession, 'du.session.v1', 'du.prefs.v1']) localStorage.removeItem(key)
    for (const key of [legacyAi, legacyAiSession]) sessionStorage.removeItem(key)
  } catch {
    saved.value = '部分浏览器存储不可访问；已清除当前可访问的数据。'
    return
  }
  saved.value = '本机擂台、应验簿、工具反馈和旧配置已清空。'
}
</script>

<template>
  <section class="settings">
    <header class="page-head"><p class="kicker">SETTINGS / LOCAL ONLY</p><h1>设置</h1><p>天机台严格本地运行：问题、生辰、盘面、回答、投票和应验数据不发送到任何外部服务。</p></header>
    <section class="settings-card local-card"><h2>本地模式</h2><p>排盘使用浏览器内的确定性规则；古籍只从本项目同源的 <code>public/corpus</code> 静态文件读取；断语由本地规则和已核语料生成。不调用外部服务。</p><ul><li>问题、生辰、盘面、回答和反馈只存在本机。</li><li>导出文件只在你点击导出后生成，可能包含问题、生辰、回答和断言，请自行保管。</li><li>清空本机数据会同时清除旧版本遗留的外部配置键。</li></ul><p class="local-badge">LOCAL ONLY · NO UPLOAD</p></section>
    <section class="settings-card"><h2>本机数据</h2><div class="settings-actions"><button class="du-btn" @click="download">导出擂台与应验簿</button><label class="du-btn file-btn">导入 JSON<input type="file" accept="application/json" @change="readImport" /></label><button class="du-btn danger" @click="resetAll">清空全部本机数据</button></div><p v-if="importError" class="settings-note">{{ importError }}</p></section>
    <p v-if="saved" class="saved">{{ saved }}</p>
  </section>
</template>

<style scoped>
.settings { padding:28px 0; }
.page-head { border-bottom:1px solid var(--line); padding-bottom:16px; }
.kicker { margin:0 0 6px; color:var(--accent-2); font-size:10px; letter-spacing:.2em; }
h1 { margin:0; font-size:30px; letter-spacing:.12em; }
.page-head p:not(.kicker) { max-width:62ch; margin:8px 0 0; color:var(--ink-2); font-size:13px; line-height:1.8; }
.settings-card { display:grid; gap:14px; margin-top:18px; padding:17px; border:1px solid var(--line); border-radius:var(--radius); background:var(--surface-1); }
.settings-card h2 { margin:0; font-size:17px; }
.settings-card p,.settings-card li { color:var(--ink-2); font-size:12px; line-height:1.8; }
.settings-card ul { margin:0; padding-left:1.4em; }
.local-card { border-color:var(--tone-good); }
.local-badge { color:var(--tone-good) !important; letter-spacing:.12em; }
.settings-actions { display:flex; flex-wrap:wrap; gap:8px; }
.settings-actions button,.file-btn { padding:7px 10px; font-size:11px; }
.settings-note,.saved { margin:0; color:var(--ink-3); font-size:11px; line-height:1.7; }
.saved { margin-top:13px; color:var(--tone-good); }
.danger { color:var(--tone-bad); }
.file-btn { position:relative; overflow:hidden; cursor:pointer; }
.file-btn input { position:absolute; inset:0; opacity:0; cursor:pointer; }
</style>

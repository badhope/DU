<script setup lang="ts">
import { ref } from 'vue'
import { applyProviderPreset, clearAiConfig, loadAiConfig, maskedKey, saveAiConfig, type AiConfig, type AiProvider } from '@/ai/config'
import { exportArena, importArena, resetArena } from '@/arena/store'

const config = ref<AiConfig>(loadAiConfig())
const saved = ref('')
const importError = ref('')
function changeProvider(provider: AiProvider) { config.value = applyProviderPreset(config.value, provider) }
function save() { saveAiConfig(config.value); saved.value = '已保存；Key 只存于当前浏览器的 sessionStorage 或你选定的 localStorage。' }
function clearKey() { clearAiConfig(); config.value = { ...config.value, apiKey: '', persistKey: false }; saved.value = '模型配置已清除。' }
function download() { const blob = new Blob([exportArena()], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'tianji-arena.json'; a.click(); URL.revokeObjectURL(url) }
function readImport(event: Event) { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { importError.value = importArena(String(reader.result)) ? '数据已导入。' : '导入失败：文件结构不符合本机台账格式。' }; reader.readAsText(file) }
function resetAll() { resetArena(); saved.value = '本机擂台与应验簿已清空。' }
</script>

<template>
  <section class="settings"><header class="page-head"><p class="kicker">SETTINGS / BYOK</p><h1>设置</h1><p>模型 Key 是你自己的凭据。默认只存当前浏览器会话；接入外部 endpoint 前，请确认你接受数据发送范围。</p></header><section class="settings-card"><h2>模型接入</h2><div class="settings-grid"><label class="du-field"><span class="du-label">协议</span><select :value="config.provider" class="du-input" @change="changeProvider(($event.target as HTMLSelectElement).value as AiProvider)"><option value="openai">OpenAI 兼容</option><option value="anthropic">Anthropic</option><option value="custom">自定义兼容</option></select></label><label class="du-field"><span class="du-label">模型名</span><input v-model="config.model" class="du-input" autocomplete="off" /></label><label class="du-field wide"><span class="du-label">Endpoint</span><input v-model="config.baseUrl" class="du-input" autocomplete="off" /></label><label class="du-field wide"><span class="du-label">API Key（当前：{{ maskedKey(config.apiKey) }}）</span><input v-model="config.apiKey" class="du-input" type="password" autocomplete="off" /></label></div><label class="check"><input v-model="config.persistKey" type="checkbox" /> 我明确选择持久化到 localStorage（默认关闭）</label><div class="settings-actions"><button class="du-btn primary" @click="save">保存配置</button><button class="du-btn" @click="clearKey">清除 Key</button></div><p class="settings-note">无 Key、请求失败或 endpoint 不可用时，问天自动回退到本地规则模式；不会把 Key 写进回答、导出文件或 URL。</p></section><section class="settings-card"><h2>本机数据</h2><div class="settings-actions"><button class="du-btn" @click="download">导出擂台与应验簿</button><label class="du-btn file-btn">导入 JSON<input type="file" accept="application/json" @change="readImport" /></label><button class="du-btn danger" @click="resetAll">清空擂台数据</button></div><p v-if="importError" class="settings-note">{{ importError }}</p></section><p v-if="saved" class="saved">{{ saved }}</p></section>
</template>

<style scoped>
.settings { padding:28px 0; }
.page-head { border-bottom:1px solid var(--line); padding-bottom:16px; }
.kicker { margin:0 0 6px; color:var(--accent-2); font-size:10px; letter-spacing:.2em; }
h1 { margin:0; font-size:30px; letter-spacing:.12em; }
.page-head p:not(.kicker) { max-width:62ch; margin:8px 0 0; color:var(--ink-2); font-size:13px; line-height:1.8; }
.settings-card { display:grid; gap:14px; margin-top:18px; padding:17px; border:1px solid var(--line); border-radius:var(--radius); background:var(--surface-1); }
.settings-card h2 { margin:0; font-size:17px; }
.settings-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.wide { grid-column:1 / -1; }
.check { color:var(--ink-2); font-size:12px; }
.check input { accent-color:var(--accent); }
.settings-actions { display:flex; flex-wrap:wrap; gap:8px; }
.settings-actions button,.file-btn { padding:7px 10px; font-size:11px; }
.settings-note,.saved { margin:0; color:var(--ink-3); font-size:11px; line-height:1.7; }
.saved { margin-top:13px; color:var(--tone-good); }
.danger { color:var(--tone-bad); }
.file-btn { position:relative; overflow:hidden; cursor:pointer; }
.file-btn input { position:absolute; inset:0; opacity:0; cursor:pointer; }
@media (max-width:600px) { .settings-grid { grid-template-columns:1fr; } .wide { grid-column:auto; } }
</style>

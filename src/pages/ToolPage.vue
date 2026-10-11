<script setup lang="ts">
/**
 * DU v2 · 工具页（全站唯一）
 *
 * 所有工具共用这一页：schema 生成表单 → compute 出 ResultNode → ResultView 渲染
 * → 反馈写回本机，作为下次匹配的历史信号。
 * 加一个新工具不需要动这个文件。
 */
import { computed, ref, watch } from 'vue'
import FormRenderer from '@/ui/FormRenderer.vue'
import ResultView from '@/ui/ResultView.vue'
import type { ComputeOutcome, ToolInput } from '@/contract/tool'
import { toolById } from '@/tools/registry'
import { markSeen, recordFeedback, recordVisit, session, sessionContext } from '@/composables/session'

const props = defineProps<{ id: string }>()

const tool = computed(() => toolById(props.id))
const input = ref<ToolInput>({})
const out = ref<ComputeOutcome | null>(null)
const busy = ref(false)
const batch = ref(0)

watch(
  () => props.id,
  () => {
    input.value = {}
    out.value = null
    batch.value = 0
    hits.value = {}
  },
)

const cat = computed(() => tool.value?.category ?? 'buzhan')

async function run(next = false) {
  const t = tool.value
  if (!t || busy.value) return
  if (next) batch.value += 1
  out.value = null
  busy.value = true
  try {
    const got = await t.compute({ ...input.value }, sessionContext(batch.value))
    out.value = got
    if ('error' in got) return
    recordVisit(String(input.value.domain ?? 'general'))
    markSeen(got.feedback?.map((f) => f.id) ?? [])
    hits.value = {}
  } finally {
    busy.value = false
  }
}

const hits = ref<Record<string, boolean>>({})

function feedback(id: string, tag: string | undefined, hit: boolean) {
  hits.value[id] = hit
  if (tag) recordFeedback({ id, tag, hit: hit ? 1 : 0 })
}

/** 已反馈条数 / 本次条数，让用户看见自己在训练引擎 */
const fedCount = computed(() => Object.keys(hits.value).length)
</script>

<template>
  <div v-if="!tool" class="tp-missing">
    <p>没有 id 为 <code>{{ id }}</code> 的工具。</p>
    <RouterLink class="du-btn" to="/">回首页</RouterLink>
  </div>

  <template v-else>
    <div class="tp-head" :style="{ '--cat': `var(--cat-${cat})` }">
      <p class="tp-kicker">{{ tool.latin }} · {{ tool.category }}</p>
      <h1 class="tp-title">{{ tool.name }}</h1>
      <p class="tp-blurb">{{ tool.blurb }}</p>
    </div>

    <section class="tp-form">
      <FormRenderer v-model="input" :fields="tool.fields" />
      <div class="tp-actions">
        <button class="du-btn primary" :disabled="busy" @click="run(false)">
          {{ busy ? '排盘中…' : '起一卦' }}
        </button>
        <span class="tp-tip">输入只在本机计算，不上传。</span>
      </div>
    </section>

    <p v-if="out && 'error' in out" class="tp-err">{{ out.error }}</p>

    <section v-if="out && 'body' in out" class="tp-out">
      <div class="tp-out-head">
        <h2>{{ out.title }}</h2>
        <p v-if="out.summary" class="tp-sum">{{ out.summary }}</p>
        <button class="du-btn" :disabled="busy" @click="run(true)">换一批</button>
      </div>

      <ResultView :node="{ kind: 'stack', children: out.body }" />

      <div v-if="out.feedback?.length" class="tp-fb">
        <h3 class="tp-fb-t">这些说中了吗？只有你确认过的才会影响下一次</h3>
        <div v-for="f in out.feedback" :key="f.id" class="tp-fb-r">
          <span class="tp-fb-x">{{ f.text }}</span>
          <span class="tp-fb-btns">
            <button :class="{ on: hits[f.id] === true }" @click="feedback(f.id, f.tag, true)">说中</button>
            <button :class="{ on: hits[f.id] === false }" @click="feedback(f.id, f.tag, false)">没有</button>
          </span>
        </div>
        <p class="tp-fb-n">已反馈 {{ fedCount }}/{{ out.feedback.length }} · 本机共记录 {{ session.resonated.length }} 条</p>
      </div>

      <details v-if="tool.method" class="tp-method">
        <summary>这一卦是怎么算出来的</summary>
        <p>{{ tool.method }}</p>
      </details>
    </section>
  </template>
</template>

<style scoped>
.tp-missing {
  display: grid;
  gap: 12px;
  justify-items: start;
  padding: 40px 0;
}
.tp-head {
  padding: 26px 0 18px;
  border-bottom: 1px solid var(--line);
}
.tp-kicker {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.24em;
  color: var(--cat);
}
.tp-title {
  margin: 0;
  font-size: 30px;
  letter-spacing: 0.1em;
}
.tp-blurb {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--ink-2);
}
.tp-form {
  display: grid;
  gap: 16px;
  margin: 22px 0;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--bg-1);
}
.tp-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.tp-tip {
  font-size: 11px;
  color: var(--ink-3);
}
.tp-err {
  padding: 10px 12px;
  font-size: 13px;
  color: var(--tone-bad);
  border: 1px solid var(--tone-bad);
  border-radius: var(--radius);
}
.tp-out {
  display: grid;
  gap: 20px;
  animation: rise 0.35s ease both;
}
.tp-out-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 10px;
}
.tp-out-head h2 {
  margin: 0;
  font-size: 20px;
}
.tp-out-head .du-btn {
  margin-left: auto;
}
.tp-sum {
  margin: 0;
  flex: 1 1 100%;
  font-size: 12px;
  color: var(--ink-3);
}
.tp-fb {
  display: grid;
  gap: 6px;
  padding: 14px;
  border: 1px dashed var(--line);
  border-radius: var(--radius);
}
.tp-fb-t {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-2);
}
.tp-fb-r {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  border-top: 1px solid var(--line);
  font-size: 12px;
}
.tp-fb-x {
  flex: 1;
  color: var(--ink-2);
}
.tp-fb-btns {
  display: flex;
  gap: 6px;
  flex: none;
}
.tp-fb-btns button {
  font: inherit;
  padding: 3px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface-1);
  color: var(--ink-3);
  cursor: pointer;
}
.tp-fb-btns button.on {
  border-color: var(--accent);
  color: var(--accent);
}
.tp-fb-n {
  margin: 6px 0 0;
  font-size: 11px;
  color: var(--ink-3);
}
.tp-method {
  font-size: 12px;
  color: var(--ink-2);
}
.tp-method summary {
  cursor: pointer;
  color: var(--ink-3);
}
.tp-method p {
  line-height: 1.8;
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}
</style>

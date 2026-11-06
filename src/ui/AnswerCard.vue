<script setup lang="ts">
/**
 * 单份回答卡片。
 *
 * 盲测的核心约束在这里落地：揭晓前不渲染"盘面事实"与"依据"两节。
 * 这两节会直接暴露门派——八字盘只能来自子平，卦象只能来自梅花，
 * 引文里的书名更是把大师点名了。所以匿名不是靠文案声明，而是靠不渲染。
 */
import { computed } from 'vue'
import type { MasterAnswer, ReadingSection } from '@/contract/reading'

const props = defineProps<{
  answer: MasterAnswer
  label: string
  revealed: boolean
}>()

/** 揭晓前隐藏的身份线索小节 */
const HIDDEN_BEFORE_REVEAL: ReadonlySet<ReadingSection['key']> = new Set(['pan', 'ju'])

const sections = computed(() =>
  props.answer.sections.filter((section) => props.revealed || !HIDDEN_BEFORE_REVEAL.has(section.key)),
)

const hiddenCount = computed(() => props.answer.sections.length - sections.value.length)
</script>

<template>
  <article class="answer">
    <div class="answer-head">
      <span class="answer-label">{{ label }}</span>
      <span class="answer-mode">本地规则模式 · 同源语料</span>
    </div>
    <p v-if="answer.fallbackReason" class="answer-fallback">{{ answer.fallbackReason }}</p>

    <!--
      领域边界提示由运行时写入（医疗 / 财务 / 法律 / 未成年），四个宿主都会带上。
      放在断语之前而不是末尾：需要看到它的人不一定读到底。
    -->
    <p v-if="answer.notice" class="answer-notice">{{ answer.notice }}</p>

    <section v-for="section in sections" :key="section.key" class="answer-section">
      <h3>{{ section.title }}</h3>
      <p v-for="(line, lineIndex) in section.lines" :key="lineIndex">{{ line }}</p>
    </section>

    <p v-if="hiddenCount > 0" class="answer-sealed">
      盘面事实与依据共 {{ hiddenCount }} 节已封存，投票后显示——它们会暴露门派。
    </p>

    <!--
      揭晓后如果这位大师没有盘面，说明白为什么，而不是留一片空白让用户猜。
      最常见的成因是没填生辰：四柱排不出来，这是能力边界，不是隐瞒。
    -->
    <p v-if="revealed && !answer.facts.length" class="answer-nofact">
      这位大师本次没有可展示的盘面事实。最可能的原因是未填写出生日期与时间——
      没有生辰就排不出四柱；梅花易数仍按提问时刻起卦。
    </p>

    <div v-if="revealed && answer.citations.length" class="answer-citations">
      <h3>引用状态</h3>
      <p v-for="(citation, index) in answer.citations" :key="`${citation.book}-${citation.text}-${index}`">
        《{{ citation.book }}》{{ citation.loc ?? '' }}：{{ citation.text }}
        <b :class="citation.verification === 'verified' ? 'ok' : 'warn'">
          {{ citation.verification === 'verified' ? '已核' : '未核' }}
        </b>
        <em class="answer-origin">{{ citation.origin === 'corpus' ? '站内语料命中' : '断语库引文' }}</em>
      </p>
    </div>

    <div v-if="revealed && answer.claims.length" class="answer-claims">
      <h3>可验断言已放入应验簿</h3>
      <p v-for="claim in answer.claims" :key="claim.id">
        {{ claim.text }} · 截止 {{ new Date(claim.dueAt).toLocaleDateString() }}
      </p>
    </div>
  </article>
</template>

<style scoped>
.answer { min-width: 0; padding: 15px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface-1); }
.answer-head { display: flex; justify-content: space-between; gap: 7px; border-bottom: 1px solid var(--line); padding-bottom: 9px; }
.answer-label { color: var(--accent); font-size: 13px; letter-spacing: .18em; }
.answer-mode { color: var(--ink-3); font-size: 10px; }
.answer-fallback { margin: 10px 0 0; color: var(--ink-3); font-size: 11px; line-height: 1.7; }
/* 边界提示必须显眼：它不是免责声明，是"这段内容不该被这样用"的说明 */
.answer-notice { margin: 10px 0 0; padding: 8px 10px; border-left: 3px solid var(--tone-warn); border-radius: 4px; background: var(--bg-1); color: var(--ink-1); font-size: 12px; line-height: 1.75; }
.answer-section { margin-top: 13px; }
.answer-section h3 { margin: 0 0 5px; color: var(--accent-2); font-size: 11px; letter-spacing: .12em; }
.answer-section p { margin: 0 0 4px; color: var(--ink-1); font-size: 13px; line-height: 1.75; overflow-wrap: anywhere; }
.answer-nofact { margin: 13px 0 0; padding: 8px 10px; border: 1px dashed var(--tone-warn); border-radius: var(--radius); color: var(--ink-2); font-size: 11px; line-height: 1.7; }
.answer-sealed { margin: 13px 0 0; padding: 8px 10px; border: 1px dashed var(--line); border-radius: var(--radius); color: var(--ink-3); font-size: 11px; line-height: 1.6; }
.answer-citations, .answer-claims { margin-top: 13px; padding-top: 11px; border-top: 1px dashed var(--line); }
.answer-citations h3, .answer-claims h3 { margin: 0 0 5px; color: var(--ink-3); font-size: 11px; letter-spacing: .1em; }
.answer-citations p, .answer-claims p { margin: 0 0 4px; color: var(--ink-2); font-size: 11px; line-height: 1.7; overflow-wrap: anywhere; }
.answer-citations b.ok { color: var(--tone-good); }
.answer-citations b.warn { color: var(--tone-warn); }
.answer-origin { margin-left: 4px; color: var(--ink-3); font-size: 10px; font-style: normal; }
</style>

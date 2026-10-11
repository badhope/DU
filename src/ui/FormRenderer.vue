<script setup lang="ts">
/**
 * DU v2 · schema 驱动表单
 *
 * 工具只声明 fields，控件、校验、必填提示由此统一生成。
 * v1 里每个页面各写一遍输入逻辑，v2 只此一处。
 */
import { computed } from 'vue'
import type { FieldDef, ToolInput, ToolValue } from '@/contract/tool'

const props = defineProps<{ fields: FieldDef[]; modelValue: ToolInput }>()
const emit = defineEmits<{ 'update:modelValue': [ToolInput] }>()

const isEmpty = (v: ToolValue) =>
  v === undefined || v === '' || (Array.isArray(v) && v.length === 0)

const missing = computed(() =>
  props.fields.filter((f) => f.required && isEmpty(props.modelValue[f.key])).map((f) => f.key),
)

function set(key: string, value: ToolValue) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function toggleOption(f: FieldDef, opt: string) {
  const cur = Array.isArray(props.modelValue[f.key]) ? [...(props.modelValue[f.key] as string[])] : []
  const at = cur.indexOf(opt)
  if (at >= 0) cur.splice(at, 1)
  else cur.push(opt)
  set(f.key, cur)
}

const valueOf = (f: FieldDef): string | number | boolean => {
  const v = props.modelValue[f.key] ?? f.default
  return Array.isArray(v) ? '' : (v ?? '')
}
const listValue = (f: FieldDef): string[] => {
  const v = props.modelValue[f.key] ?? f.default
  return Array.isArray(v) ? v : []
}
const bad = (f: FieldDef) => missing.value.includes(f.key)
</script>

<template>
  <form class="fm" @submit.prevent>
    <div v-for="f in fields" :key="f.key" class="du-field">
      <label class="du-label" :for="'fld-' + f.key">
        {{ f.label }}<b v-if="f.required" class="fm-req">必填</b>
      </label>

      <input
        v-if="f.type === 'date'"
        :id="'fld-' + f.key"
        class="du-input"
        type="date"
        :value="valueOf(f) as string"
        @input="set(f.key, ($event.target as HTMLInputElement).value)"
      />

      <input
        v-else-if="f.type === 'time'"
        :id="'fld-' + f.key"
        class="du-input"
        type="time"
        :value="valueOf(f) as string"
        @input="set(f.key, ($event.target as HTMLInputElement).value)"
      />

      <input
        v-else-if="f.type === 'number'"
        :id="'fld-' + f.key"
        class="du-input"
        type="number"
        :min="f.min"
        :max="f.max"
        :step="f.step"
        :placeholder="f.placeholder"
        :value="valueOf(f) as string"
        @input="set(f.key, Number(($event.target as HTMLInputElement).value))"
      />

      <select
        v-else-if="f.type === 'select'"
        :id="'fld-' + f.key"
        class="du-input"
        :value="valueOf(f) as string"
        @change="set(f.key, ($event.target as HTMLSelectElement).value)"
      >
        <option value="" disabled hidden>{{ f.placeholder ?? '请选择' }}</option>
        <option v-for="o in f.options" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>

      <div v-else-if="f.type === 'multi'" class="fm-multi">
        <label v-for="o in f.options" :key="o.value" class="fm-opt">
          <input
            type="checkbox"
            :checked="listValue(f).includes(o.value)"
            @change="toggleOption(f, o.value)"
          />
          <span>{{ o.label }}</span>
        </label>
      </div>

      <label v-else-if="f.type === 'toggle'" class="fm-switch">
        <input
          type="checkbox"
          :checked="Boolean(valueOf(f))"
          @change="set(f.key, ($event.target as HTMLInputElement).checked)"
        />
        <span>{{ f.placeholder ?? '开' }}</span>
      </label>

      <input
        v-else
        :id="'fld-' + f.key"
        class="du-input"
        type="text"
        :placeholder="f.placeholder"
        :value="valueOf(f) as string"
        @input="set(f.key, ($event.target as HTMLInputElement).value)"
      />

      <p v-if="f.hint" class="du-label fm-hint">{{ f.hint }}</p>
      <p v-else-if="bad(f)" class="fm-err">请填写</p>
    </div>
  </form>
</template>

<style scoped>
.fm {
  display: grid;
  gap: 14px;
}
.fm-req {
  margin-left: 6px;
  padding: 1px 5px;
  font-size: 10px;
  font-weight: 400;
  color: var(--accent);
  border: 1px solid currentColor;
  border-radius: 3px;
}
.fm-hint {
  margin: 0;
  line-height: 1.5;
}
.fm-err {
  margin: 0;
  font-size: 11px;
  color: var(--tone-bad);
}
.fm-multi {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.fm-opt {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  font-size: 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface-1);
  cursor: pointer;
}
.fm-opt input,
.fm-switch input {
  accent-color: var(--accent);
}
.fm-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}
</style>

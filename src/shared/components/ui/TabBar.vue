<script setup lang="ts">
export interface Tab {
  key: string
  label: string
}
defineProps<{ tabs: Tab[]; modelValue: string }>()
defineEmits<{ 'update:modelValue': [v: string] }>()
</script>

<template>
  <view class="tab-bar" role="tablist">
    <view
      v-for="t in tabs"
      :key="t.key"
      class="tab-item"
      :class="{ active: modelValue === t.key }"
      role="tab"
      :aria-selected="modelValue === t.key"
      @click="$emit('update:modelValue', t.key)"
    >
      <text class="tab-label">{{ t.label }}</text>
    </view>
  </view>
</template>

<style scoped>
@layer components {
  .tab-bar {
    display: flex;
    gap: var(--sp-2);
    padding: var(--sp-2) var(--sp-4);
    border-bottom: 1rpx solid var(--color-divider);
  }
  .tab-item {
    padding: var(--sp-2) var(--sp-3);
    border-radius: var(--r-sm);
    cursor: pointer;
    transition: background 0.2s;
  }
  .tab-item.active {
    background: var(--color-tab-active);
    color: var(--color-zhu);
  }
  .tab-item:not(.active) {
    color: var(--color-bai-2);
  }
  .tab-label {
    font-size: var(--fs-base);
    font-weight: 500;
  }
}
</style>

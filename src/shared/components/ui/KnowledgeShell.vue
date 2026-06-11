<script setup lang="ts" generic="T extends { key: string; name: string; illustId: string }">
import KnowledgeCard from './KnowledgeCard.vue'

defineProps<{
  items: T[]
  summaries: Record<string, string>
  details: Record<string, string>
}>()
</script>

<template>
  <view class="k-shell">
    <view v-if="$slots.overview" class="k-overview">
      <slot name="overview" />
    </view>
    <view class="k-grid">
      <KnowledgeCard
        v-for="it in items"
        :key="it.key"
        :title="it.name"
        :summary="summaries[it.key] || ''"
        :detail="details[it.key]"
        :illust-id="it.illustId"
      />
    </view>
  </view>
</template>

<style scoped>
@layer components {
  .k-shell {
    padding: var(--sp-3) var(--sp-4);
  }
  .k-overview {
    margin-bottom: var(--sp-3);
  }
  .k-grid {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
}
</style>

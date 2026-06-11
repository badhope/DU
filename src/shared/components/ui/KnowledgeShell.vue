<script setup lang="ts" generic="T extends { key: string; name: string }">
import KnowledgeCard from './KnowledgeCard.vue'

defineProps<{
  items: T[]
  summaries: Record<string, string>
  details: Record<string, string>
}>()

function getIllustId(it: T): string | undefined {
  return 'illustId' in it ? (it as T & { illustId?: string }).illustId : undefined
}
</script>

<template>
  <view class="k-shell">
    <view v-if="$slots['overview']" class="k-overview">
      <slot name="overview" />
    </view>
    <view class="k-grid">
      <KnowledgeCard
        v-for="it in items"
        :key="it.key"
        :title="it.name"
        :summary="summaries[it.key] || ''"
        :detail="details[it.key]"
        :illust-id="getIllustId(it)"
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

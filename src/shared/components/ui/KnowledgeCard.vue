<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  title: string
  summary: string
  detail?: string | undefined
  illustId?: string | undefined
}>()

const open = ref(false)
</script>

<template>
  <view class="k-card" :class="{ open }" @click="open = !open">
    <view class="k-head">
      <view v-if="illustId" class="k-illust">
        <image
          :src="`/static/illustrations/${illustId}.svg`"
          mode="aspectFit"
          class="k-illust-img"
        />
      </view>
      <view class="k-text">
        <text class="k-title">{{ title }}</text>
        <text class="k-sum">{{ summary }}</text>
      </view>
    </view>
    <view v-if="detail && open" class="k-body">
      <text class="k-detail">{{ detail }}</text>
    </view>
  </view>
</template>

<style scoped>
@layer components {
  .k-card {
    background: var(--color-knowledge-card-bg);
    border: 1rpx solid var(--color-divider);
    border-radius: var(--r-md);
    padding: var(--sp-3);
    margin-bottom: var(--sp-2);
    transition: all 0.2s;
  }
  .k-card.open {
    border-color: var(--color-zhu);
  }
  .k-head {
    display: flex;
    gap: var(--sp-2);
    align-items: center;
  }
  .k-illust {
    flex-shrink: 0;
  }
  .k-illust-img {
    width: 64rpx;
    height: 64rpx;
  }
  .k-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }
  .k-title {
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--color-bai);
  }
  .k-sum {
    font-size: var(--fs-xs);
    color: var(--color-bai-2);
  }
  .k-body {
    margin-top: var(--sp-2);
    padding-top: var(--sp-2);
    border-top: 1rpx solid var(--color-divider);
  }
  .k-detail {
    font-size: var(--fs-base);
    line-height: 1.6;
    color: var(--color-bai);
  }
}
</style>

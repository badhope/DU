<template>
  <view class="gua-page">
    <view class="taiji-bg"><TaijiBg /></view>

    <TopBar title="每日一卦" subtitle="DAILY HEXAGRAM" />

    <!-- 起卦前 -->
    <view v-if="!gua && !casting" class="cast-stage">
      <view class="user-switcher-wrap">
        <UserSwitcher tool="gua" @addUser="cd.onAddUser" @select="cd.switchUser" />
      </view>
      <view class="scroll card-mystic anim-fade-up">
        <text class="scroll-quote">"易有太极，是生两仪。"</text>
        <text class="scroll-quote">"两仪生四象，四象生八卦。"</text>
        <text class="scroll-seal">— 易 · 系辞 —</text>
      </view>

      <view class="stacks">
        <view
          v-for="i in 6"
          :key="i"
          class="stick"
          :style="{
            transform: `rotate(${(i - 3.5) * 4}deg) translateY(${i * 2}rpx)`,
            animationDelay: i * 0.1 + 's',
          }"
        />
      </view>

      <view class="cast-tip">默念心中所惑 · 凝神静气</view>

      <view class="cast-action">
        <view class="btn-zhu anim-pulse" @click="cast">
          <text>起 卦</text>
        </view>
      </view>
    </view>

    <!-- 起卦中 -->
    <view v-else-if="casting" class="casting anim-fade">
      <view class="cast-ring">
        <view class="cast-ring-inner" />
        <text class="cast-glyph">{{ castingStep }}</text>
      </view>
      <text class="cast-text">蓍草分揲中…</text>
    </view>

    <!-- 起卦完成 · 跳转解卦 -->
    <view v-else-if="gua" class="result-preview anim-fade">
      <view class="preview-card" :class="'fortune-' + gua.fortune">
        <text class="preview-id">第 {{ gua.id }} 卦</text>
        <text class="preview-name title-mystic">{{ gua.name }}</text>
        <text class="preview-symbol">{{ gua.symbol }}</text>
        <text class="preview-judge">「{{ gua.judgment }}」</text>
        <view class="preview-fortune" :class="'fortune-' + gua.fortune">
          <text>{{ gua.fortune }} · {{ gua.tag }}</text>
        </view>
      </view>

      <text class="preview-tip">卦已立 · 待解其义</text>

      <view
        class="cast-action"
        style="display: flex; flex-direction: column; gap: 12rpx; align-items: center"
      >
        <view class="btn-zhu" @click="goInterpret">
          <text>解 卦</text>
        </view>
        <view class="btn-ghost" @click="cast">
          <text>再 起 一 卦</text>
        </view>
      </view>
    </view>

    <ToolGuard
      :show-cooldown="showCooldown"
      :show-add-user="showAddUser"
      :cooldown-record="cooldownRecord"
      :new-user-name="newUserName"
      :new-user-remark="newUserRemark"
      @close="cd.onCooldownClose"
      @switch-user="cd.onCooldownSwitchUser"
      @switch-tool="cd.onCooldownSwitchTool"
      @ignore="cd.onCooldownIgnore"
      @cancel-add-user="showAddUser = false"
      @confirm-add-user="cd.confirmAddUser"
      @update:new-user-name="(v) => (newUserName = v)"
      @update:new-user-remark="(v) => (newUserRemark = v)"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted as _onMounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import TopBar from '@/components/ui/TopBar.vue'
import UserSwitcher from '@/components/ui/UserSwitcher.vue'
import ToolGuard from '@/components/ui/ToolGuard.vue'
import { yaoToGua, castYaoSticks, type Gua } from '@/utils/gua'
import { useAppStore } from '@/stores'
import { useCooldown } from '@/utils/use-cooldown'

const _app = useAppStore()
const cd = useCooldown({ tool: 'gua', toolName: '今日一卦', category: '占卜' })
const { showCooldown, cooldownRecord, showAddUser, newUserName, newUserRemark } = cd

const gua = ref<Gua | null>(null)
const yaoPattern = ref<number[]>([1, 1, 1, 1, 1, 1])
const casting = ref(false)
const castingStep = ref('☰')

function cast() {
  if (!cd.guard()) return
  casting.value = true
  gua.value = null
  const steps = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷']
  let i = 0
  const tick = () => {
    if (i < steps.length * 2) {
      castingStep.value = steps[i % steps.length]
      i++
      setTimeout(tick, 120)
    } else {
      // 蓍草起卦 → 6 爻 → 卦
      try {
        const yao = castYaoSticks()
        yaoPattern.value = yao
        gua.value = yaoToGua(yao)
        casting.value = false
        cd.commit(
          `${gua.value.name} · ${gua.value.symbol}`,
          { yao },
          { id: gua.value.id, name: gua.value.name },
        )
      } catch (_e) {
        casting.value = false
        uni.showModal({ title: '起卦失败', content: '请重试', showCancel: false })
      }
      // 卦象出来时 GSAP 强化
      nextTick(() => {
        try {
          const sym = document.querySelector('.preview-symbol')
          if (sym)
            gsap.fromTo(
              sym,
              { scale: 0, rotation: 360, opacity: 0 },
              { scale: 1, rotation: 0, opacity: 1, duration: 0.9, ease: 'elastic.out(1, 0.5)' },
            )
          const name = document.querySelector('.preview-name')
          if (name)
            gsap.fromTo(
              name,
              { y: 30, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.6, delay: 0.3, ease: 'power2.out' },
            )
        } catch (_e) {}
      })
    }
  }
  tick()
}

function goInterpret() {
  if (!gua.value) return
  const url = '/pages/gua/interpret?id=' + gua.value.id + '&yao=' + yaoPattern.value.join(',')
  uni.navigateTo({ url })
}
</script>

<style scoped>
.gua-page {
  position: relative;
  min-height: 100vh;
  padding: 0 var(--sp-4) var(--sp-6);
  overflow: hidden;
}

.taiji-bg {
  position: fixed;
  inset: 0;
  z-index: var(--z-bg);
}

/* ===== 起卦前 ===== */
.cast-stage {
  position: relative;
  z-index: var(--z-content);
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: var(--sp-6) var(--sp-2) 0;
}

.scroll {
  width: 100%;
  padding: var(--sp-5) var(--sp-4);
  text-align: center;
  background: linear-gradient(180deg, rgba(168, 124, 79, 0.2) 0%, rgba(20, 20, 28, 0.9) 100%);
  border: 2rpx solid rgba(212, 175, 55, 0.4);
  border-radius: var(--r-md);
  position: relative;
}

.scroll::before,
.scroll::after {
  content: '';
  position: absolute;
  left: 8rpx;
  right: 8rpx;
  height: 16rpx;
  background: linear-gradient(180deg, var(--color-tu) 0%, #6e5230 100%);
  border-radius: 8rpx;
}

.scroll::before {
  top: -8rpx;
}
.scroll::after {
  bottom: -8rpx;
}

.scroll-quote {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  line-height: 2;
  letter-spacing: 0.15em;
}

.scroll-seal {
  display: block;
  margin-top: var(--sp-3);
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
}

/* 蓍草 */
.stacks {
  position: relative;
  width: 200rpx;
  height: 240rpx;
  margin: var(--sp-5) auto;
}

.stick {
  position: absolute;
  width: 8rpx;
  height: 200rpx;
  left: 50%;
  margin-left: -4rpx;
  background: linear-gradient(180deg, #d4af37 0%, #8b6f2a 100%);
  border-radius: 4rpx;
  box-shadow: 0 0 8rpx rgba(212, 175, 55, 0.5);
  transform-origin: center;
  animation: drop 1.5s ease-out infinite;
}

@keyframes drop {
  0% {
    opacity: 0;
    transform: translateY(-200rpx) rotate(0);
  }
  60% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform: translateY(0) rotate(var(--r, 0deg));
  }
}

.cast-tip {
  font-size: var(--fs-md);
  color: var(--color-bai-2);
  letter-spacing: 0.2em;
  font-family: 'KaiTi', serif;
  margin-bottom: var(--sp-3);
}

.cast-action {
  margin-top: var(--sp-4);
}

/* ===== 起卦中 ===== */
.casting {
  position: relative;
  z-index: var(--z-content);
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: var(--sp-7);
}

.cast-ring {
  width: 240rpx;
  height: 240rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(212, 175, 55, 0.3);
  border-top-color: var(--color-liu);
  animation: spin 1.2s linear infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 48rpx rgba(212, 175, 55, 0.4);
}

.cast-ring-inner {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(200, 48, 42, 0.4);
  border-bottom-color: var(--color-zhu);
  animation: spin 2s linear infinite reverse;
}

.cast-glyph {
  position: absolute;
  font-size: 96rpx;
  color: var(--color-bai);
  font-family: serif;
  text-shadow: 0 0 24rpx var(--color-liu);
}

.cast-text {
  margin-top: var(--sp-5);
  font-size: var(--fs-md);
  color: var(--color-bai-2);
  letter-spacing: 0.3em;
  font-family: 'KaiTi', serif;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ===== 起卦完成 · 预览 ===== */
.result-preview {
  position: relative;
  z-index: var(--z-content);
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: var(--sp-5) var(--sp-2) 0;
}

.preview-card {
  width: 100%;
  padding: var(--sp-6) var(--sp-4);
  text-align: center;
  background: linear-gradient(180deg, var(--color-xuan-2) 0%, var(--color-xuan) 100%);
  border: 2rpx solid rgba(212, 175, 55, 0.4);
  border-radius: var(--r-lg);
  box-shadow: 0 0 32rpx rgba(212, 175, 55, 0.3);
}

.preview-card.fortune-吉 {
  border-color: rgba(79, 174, 111, 0.6);
  box-shadow: 0 0 32rpx rgba(79, 174, 111, 0.4);
}
.preview-card.fortune-凶 {
  border-color: rgba(200, 48, 42, 0.6);
  box-shadow: 0 0 32rpx rgba(200, 48, 42, 0.4);
}

.preview-id {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  letter-spacing: 0.3em;
}

.preview-name {
  display: block;
  font-size: 64rpx;
  margin: var(--sp-2) 0;
  letter-spacing: 0.15em;
  text-shadow: 0 0 24rpx rgba(212, 175, 55, 0.7);
}

.preview-symbol {
  display: block;
  font-size: 140rpx;
  font-family: serif;
  color: var(--color-liu);
  text-shadow: 0 0 32rpx rgba(212, 175, 55, 0.6);
  line-height: 1;
  margin: var(--sp-3) 0;
}

.preview-judge {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.2em;
  margin: var(--sp-2) 0;
}

.preview-fortune {
  display: inline-block;
  padding: var(--sp-1) var(--sp-4);
  border-radius: var(--r-full);
  font-size: var(--fs-sm);
  letter-spacing: 0.2em;
  border: 1rpx solid;
  margin-top: var(--sp-2);
}

.preview-fortune.fortune-吉 {
  background: rgba(79, 174, 111, 0.15);
  color: #4fae6f;
  border-color: rgba(79, 174, 111, 0.5);
}
.preview-fortune.fortune-平 {
  background: rgba(212, 175, 55, 0.15);
  color: var(--color-liu);
  border-color: rgba(212, 175, 55, 0.5);
}
.preview-fortune.fortune-凶 {
  background: rgba(200, 48, 42, 0.15);
  color: var(--color-zhu);
  border-color: rgba(200, 48, 42, 0.5);
}

.preview-tip {
  display: block;
  margin-top: var(--sp-4);
  font-size: var(--fs-md);
  color: var(--color-liu);
  letter-spacing: 0.3em;
  font-family: 'KaiTi', serif;
}

/* 按钮 */
.btn-zhu {
  display: inline-block;
  padding: 14rpx 48rpx;
  background: linear-gradient(135deg, var(--color-zhu) 0%, #8b1f1a 100%);
  border-radius: 9999rpx;
  color: var(--color-bai);
  font-size: var(--fs-md);
  letter-spacing: 0.3em;
  box-shadow: 0 0 20rpx rgba(200, 48, 42, 0.4);
  cursor: pointer;
}

.btn-ghost {
  display: inline-block;
  padding: 12rpx 36rpx;
  background: transparent;
  color: var(--color-liu);
  border: 1rpx solid var(--color-liu);
  border-radius: 9999rpx;
  font-size: var(--fs-sm);
  letter-spacing: 0.3em;
  cursor: pointer;
}
</style>

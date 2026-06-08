/**
 * 玄枢 MISTVERSE · GSAP 动画 Composable
 *
 * 统一封装 GSAP 时间轴/补间动画，
 * 配合 animations.css 提供企业级动效。
 */

import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'
import { gsap } from 'gsap'

/** 入场：fade up cascade */
export function useCascadeReveal(selector: string | Ref<HTMLElement | null>, options: { delay?: number; stagger?: number; duration?: number; distance?: number } = {}) {
  const target = (typeof selector === 'string' ? ref<HTMLElement | null>(null) : selector) as Ref<HTMLElement | null>
  const played = ref(false)
  const { delay = 0, stagger = 0.08, duration = 0.7, distance = 40 } = options

  function play() {
    if (played.value || !target.value) return
    played.value = true
    const el = target.value
    if (typeof selector === 'string') {
      const items = el.querySelectorAll(selector as string)
      if (items.length === 0) {
        gsap.fromTo(el, { opacity: 0, y: distance }, { opacity: 1, y: 0, duration, delay, ease: 'power3.out' })
      } else {
        gsap.fromTo(items, { opacity: 0, y: distance }, { opacity: 1, y: 0, duration, stagger, delay, ease: 'power3.out' })
      }
    } else {
      gsap.fromTo(el, { opacity: 0, y: distance }, { opacity: 1, y: 0, duration, delay, ease: 'power3.out' })
    }
  }

  onMounted(() => {
    setTimeout(play, 50)
  })

  return { play, played, target }
}

/** 数字滚动动画（0 → target） */
export function useCountUp(target: Ref<number>, options: { duration?: number; decimals?: number } = {}) {
  const { duration = 1.6, decimals = 0 } = options
  const display = ref(0)
  const obj = { v: 0 }

  function play() {
    if (typeof window === 'undefined') return
    gsap.to(obj, {
      v: target.value,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        display.value = Number(obj.v.toFixed(decimals))
      },
    })
  }

  onMounted(() => {
    setTimeout(play, 100)
  })

  return { display, play }
}

/** 进度条从 0 → target 平滑增长 */
export function useProgressBar(target: Ref<number>, options: { duration?: number; delay?: number } = {}) {
  const { duration = 1.2, delay = 0.2 } = options
  const width = ref(0)
  const obj = { v: 0 }

  function play() {
    if (typeof window === 'undefined') return
    gsap.to(obj, {
      v: target.value,
      duration,
      delay,
      ease: 'power2.out',
      onUpdate: () => { width.value = obj.v },
    })
  }

  onMounted(() => {
    setTimeout(play, 100)
  })

  return { width, play }
}

/** SVG 路径绘制 */
export function usePathDraw(selector: string | Ref<HTMLElement | null>, options: { duration?: number; delay?: number } = {}) {
  const { duration = 2, delay = 0.2 } = options
  const target = (typeof selector === 'string' ? ref<HTMLElement | null>(null) : selector) as Ref<HTMLElement | null>

  function play() {
    if (!target.value || typeof window === 'undefined') return
    const paths = target.value.querySelectorAll('path, circle, line, polyline, polygon')
    paths.forEach(p => {
      const total = (p as SVGPathElement).getTotalLength?.() || 1000
      gsap.set(p, { strokeDasharray: total, strokeDashoffset: total })
      gsap.to(p, {
        strokeDashoffset: 0,
        duration: duration + (Math.random() - 0.5) * 0.4,
        delay: delay + Math.random() * 0.3,
        ease: 'power2.out',
      })
    })
  }

  onMounted(() => {
    setTimeout(play, 100)
  })

  return { play }
}

/** 点击涟漪 */
export function useRipple() {
  function ripple(e: MouseEvent | TouchEvent) {
    const target = e.currentTarget as HTMLElement
    if (!target) return
    const rect = target.getBoundingClientRect()
    let x: number, y: number
    if ('touches' in e && e.touches.length) {
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = (e as MouseEvent).clientX - rect.left
      y = (e as MouseEvent).clientY - rect.top
    }
    const r = document.createElement('view')
    r.className = 'ripple'
    r.style.left = `${x}px`
    r.style.top = `${y}px`
    r.style.width = r.style.height = `${Math.max(rect.width, rect.height) * 2}px`
    r.style.transform = 'translate(-50%, -50%) scale(0)'
    target.appendChild(r)
    setTimeout(() => r.remove(), 700)
  }
  return { ripple }
}

/** 磁吸效果（按钮靠近鼠标时位移） */
export function useMagnetic(strength: number = 0.3) {
  const target = ref<HTMLElement | null>(null)

  function onMove(e: MouseEvent) {
    if (!target.value || typeof window === 'undefined') return
    const rect = target.value.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) * strength
    const dy = (e.clientY - cy) * strength
    gsap.to(target.value, { x: dx, y: dy, duration: 0.4, ease: 'power2.out' })
  }

  function onLeave() {
    if (!target.value) return
    gsap.to(target.value, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' })
  }

  return { target, onMove, onLeave }
}

/** 滚动响应：进入视口时触发 */
export function useRevealOnScroll(selector: string, options: { threshold?: number; once?: boolean; className?: string } = {}) {
  const { threshold = 0.15, once = true, className = 'reveal-on' } = options
  const observer = ref<IntersectionObserver | null>(null)

  onMounted(() => {
    if (typeof window === 'undefined') return
    observer.value = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(className)
          if (once) observer.value?.unobserve(entry.target)
        } else if (!once) {
          entry.target.classList.remove(className)
        }
      })
    }, { threshold })
    document.querySelectorAll(selector).forEach(el => {
      el.classList.add('reveal-init')
      observer.value?.observe(el)
    })
  })

  onBeforeUnmount(() => {
    observer.value?.disconnect()
  })
}

/** 占卜摇卦：粒子随机旋转 + 抖 */
export function useShakeRoll(target: Ref<HTMLElement | null>, options: { duration?: number; intensity?: number } = {}) {
  const { duration = 1.6, intensity = 12 } = options
  const playing = ref(false)

  function play() {
    if (!target.value || typeof window === 'undefined' || playing.value) return
    playing.value = true
    const tl = gsap.timeline({
      onComplete: () => { playing.value = false },
    })
    tl.to(target.value, { rotation: intensity, x: -intensity, y: -intensity, duration: duration / 8, ease: 'power1.inOut' })
      .to(target.value, { rotation: -intensity, x: intensity, y: intensity, duration: duration / 8, ease: 'power1.inOut' })
      .to(target.value, { rotation: intensity * 0.7, x: -intensity * 0.7, y: intensity * 0.5, duration: duration / 6, ease: 'power1.inOut' })
      .to(target.value, { rotation: -intensity * 0.4, x: intensity * 0.4, y: -intensity * 0.3, duration: duration / 6, ease: 'power1.inOut' })
      .to(target.value, { rotation: 0, x: 0, y: 0, duration: duration / 3, ease: 'back.out(1.2)' })
  }

  return { play, playing }
}

export { gsap }

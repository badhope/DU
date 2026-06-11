/**
 * 玄枢 MISTVERSE · ResultReveal 工具函数测试
 *
 * 验证 hostRef 转 DOM 元素的辅助函数在以下场景下都能返回真正的 DOM 元素：
 * 1. ref 直接绑定到 HTMLElement（happy-dom / 标准 web）
 * 2. ref 绑定到自定义元素实例（uni-app H5 编译后 <view> → <uni-view>）
 *    组件实例的 $el 属性指向真实 DOM
 * 3. ref 还未挂载（null/undefined）
 */
import { describe, it, expect } from 'vitest'
import { resolveHostEl } from '@shared/components/ui/result-reveal-helpers'

describe('resolveHostEl', () => {
  it('直接返回 HTMLElement（happy-dom / 标准浏览器）', () => {
    const div = document.createElement('div')
    expect(resolveHostEl(div)).toBe(div)
  })

  it('从自定义元素实例取 $el（uni-app H5 <view> → <uni-view>）', () => {
    const div = document.createElement('div')
    // 模拟 uni-app 编译后 Vue 给 ref 绑定的组件实例（带 $el）
    const fakeInstance = { $el: div }
    expect(resolveHostEl(fakeInstance)).toBe(div)
  })

  it('从带 $el 的对象上正确取真实 DOM', () => {
    const el = document.createElement('span')
    const wrapper = { $el: el, foo: 'bar' }
    expect(resolveHostEl(wrapper)).toBe(el)
  })

  it('null 输入返回 null（未挂载时）', () => {
    expect(resolveHostEl(null)).toBe(null)
  })

  it('undefined 输入返回 null', () => {
    expect(resolveHostEl(undefined)).toBe(null)
  })

  it('可调用 querySelectorAll 找子项（ISSUE-001 修复验证）', () => {
    const host = document.createElement('div')
    host.innerHTML = '<div class="pillar">A</div><div class="pillar">B</div>'
    const fakeInstance = { $el: host }
    const el = resolveHostEl(fakeInstance)
    expect(el).not.toBeNull()
    // 关键：querySelectorAll 必须能调用（修复前 fakeInstance.querySelectorAll 会抛错）
    const items = el!.querySelectorAll('.pillar')
    expect(items).toHaveLength(2)
  })
})

describe('默认 selector "> *" 的处理', () => {
  it('标准 querySelectorAll 拒绝 "> *" 开头的选择器', () => {
    const host = document.createElement('div')
    host.innerHTML = '<span>1</span><span>2</span>'
    // 这正是修复前的 dogfood 错误来源
    expect(() => host.querySelectorAll('> *')).toThrow()
  })

  it('el.children 是标准 DOM API 替代方案', () => {
    const host = document.createElement('div')
    host.innerHTML = '<span>1</span><span>2</span><span>3</span>'
    // 3 个 span 子元素
    expect(host.children).toHaveLength(3)
    // 第一个是 span
    expect(host.children[0]?.tagName).toBe('SPAN')
  })

  it('children 过滤掉空白文本节点（querySelectorAll * 会包含）', () => {
    const host = document.createElement('div')
    host.appendChild(document.createTextNode('   '))
    host.appendChild(document.createElement('p'))
    host.appendChild(document.createTextNode('  '))
    host.appendChild(document.createElement('p'))
    // children 只算元素节点
    expect(host.children).toHaveLength(2)
    // children[0] 拿到的是 p 元素（不是文本节点）
    expect(host.children[0]?.tagName).toBe('P')
  })
})

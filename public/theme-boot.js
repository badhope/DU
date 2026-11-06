/*
 * 首屏皮肤预置。
 *
 * 为什么必须是独立文件而不是内联脚本：index.html 的 CSP 只允许 'self'，
 * 内联脚本要放开 'unsafe-inline' 才能跑 —— 为了省一次请求放弃整页 XSS 防护不划算。
 *
 * 这段脚本只读一个枚举值，不改任何数据；它必须在任何绘制之前执行，
 * 否则默认宣纸的用户选择夜墨时会看到一帧亮色闪屏。
 */
;(function () {
  var skin = 'paper'
  try {
    var raw = localStorage.getItem('du.prefs.v1')
    if (raw) {
      var parsed = JSON.parse(raw)
      if (parsed && parsed.skin === 'ink') skin = 'ink'
    }
  } catch (e) {
    skin = 'paper'
  }
  document.documentElement.dataset.skin = skin
})()

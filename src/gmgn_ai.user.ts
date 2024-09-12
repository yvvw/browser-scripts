// ==UserScript==
// @name         Better GMGN.ai
// @namespace    https://github.com/yvvw/browser-scripts
// @homepageURL  https://github.com/yvvw/browser-scripts/blob/main/src/gmgn_ai.user.ts
// @version      0.0.18
// @description  调整屏宽
// @author       yvvw
// @icon         https://gmgn.ai/static/favicon2.ico
// @license      MIT
// @updateURL    https://mirror.ghproxy.com/https://github.com/yvvw/browser-scripts/releases/download/latest/gmgn_ai.meta.js
// @downloadURL  https://mirror.ghproxy.com/https://github.com/yvvw/browser-scripts/releases/download/latest/gmgn_ai.user.js
// @match        https://gmgn.ai/*
// @grant        GM_openInTab
// @noframes
// ==/UserScript==

import { HTMLUtils } from './util'

const pendingClose = new Set<Function>()

window.onload = function main() {
  let previous = ''
  HTMLUtils.observe(
    document.body,
    async () => {
      if (location.href === previous) return
      previous = location.href

      if (pendingClose.size > 0) {
        pendingClose.forEach((close) => close())
        pendingClose.clear()
      }

      const parts = location.pathname.split('/').filter((it) => it !== '')
      if (parts.includes('token')) {
        await adjustRecordSize()
      }
    },
    { waiting: true, throttle: 500 }
  )
}

async function adjustRecordSize() {
  await HTMLUtils.query(() => document.getElementById('tokenCenter'))
  const tabEl = document.getElementById('leftTabs')
  if (tabEl === null) {
    throw new Error('查询不到leftTabs，需要升级代码')
  }
  const parentEl = tabEl.parentElement as HTMLDivElement
  const sibEl = tabEl.previousElementSibling as HTMLDivElement
  if (parentEl.clientWidth === sibEl.clientWidth) {
    tabEl.style.removeProperty('width')
  } else {
    tabEl.style.setProperty('width', '80%')
  }
  const disconnect = HTMLUtils.observe(parentEl, () => {
    if (parentEl.clientWidth === sibEl.clientWidth) {
      tabEl.style.removeProperty('width')
    } else {
      tabEl.style.setProperty('width', '80%')
    }
  })
  pendingClose.add(disconnect)
}

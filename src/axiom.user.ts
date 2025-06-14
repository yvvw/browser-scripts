// ==UserScript==
// @name         Better Axiom
// @namespace    https://github.com/yvvw/browser-scripts
// @homepageURL  https://github.com/yvvw/browser-scripts/blob/main/src/axiom.user.ts
// @version      0.0.2
// @description  添加外部跳转
// @author       yvvw
// @icon         https://axiom.trade/favicon.ico
// @license      MIT
// @updateURL    https://github.com/yvvw/browser-scripts/releases/download/latest/axiom.meta.js
// @downloadURL  https://github.com/yvvw/browser-scripts/releases/download/latest/axiom.user.js
// @match        https://axiom.trade/*
// @noframes
// ==/UserScript==

import { HTMLUtils, Logger } from './util'

const logger = Logger.new('Better AXIOM')

function main() {
  HTMLUtils.observe(
    document.body,
    async () => {
      if (!document.getElementById('pair-name-tooltip')) return
      try {
        addExternalLink()
      } catch (e) {
        logger.error(e)
      }
    },
    { waiting: true, throttle: 200 }
  )
}

function addExternalLink() {
  // already added
  if (document.querySelector('a[data-external]') !== null) {
    return
  }
  const containerEl = document.getElementById('pair-name-tooltip')!
  const token = (containerEl.lastElementChild as HTMLAnchorElement).href.split('=')[1]
  const gmgnEl = document.createElement('a')
  gmgnEl.target = '_blank'
  gmgnEl.rel = 'noreferrer'
  gmgnEl.dataset.external = '1'
  gmgnEl.href = `https://gmgn.ai/sol/token/${token}?tag=following`
  gmgnEl.innerText = 'gmgn'
  containerEl.appendChild(gmgnEl)
}

main()

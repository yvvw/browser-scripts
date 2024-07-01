// ==UserScript==
// @name         Better pump.fun
// @namespace    https://github.com/yvvw/tampermonkey-scripts
// @version      0.0.1
// @description  增加gmgn、bullx跳转
// @author       yvvw
// @icon         https://www.pump.fun/icon.png
// @license      MIT
// @updateURL    https://mirror.ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/releases/download/latest/pumpfun.meta.js
// @downloadURL  https://mirror.ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/releases/download/latest/pumpfun.user.js
// @match        https://www.pump.fun/*
// @grant        none
// ==/UserScript==

import { waitingElement } from './util'

window.onload = function main() {
  let running = false
  new MutationObserver(() => {
    if (running || location.pathname.length !== 45) {
      return
    }
    running = true
    addExternalLinks().finally(() => (running = false))
  }).observe(document.body, {
    childList: true,
    subtree: true,
  })
}

async function addExternalLinks() {
  if (document.getElementById('gmgn') !== null) {
    return
  }

  const threadEl = await waitingElement(
    () => document.evaluate('//div[text()="Thread"]', document).iterateNext() as HTMLDivElement
  )

  const address = location.pathname.replace('/', '')

  const divWrapEl = document.createElement('div')
  divWrapEl.className = 'flex gap-2'
  divWrapEl.style.marginLeft = 'auto'
  divWrapEl.style.color = 'rgb(134 239 172/var(--tw-bg-opacity))'

  const gmgnLinkEl = document.createElement('a')
  gmgnLinkEl.id = 'gmgn'
  gmgnLinkEl.href = `https://gmgn.ai/sol/token/${address}`
  gmgnLinkEl.target = '_blank'
  gmgnLinkEl.innerText = 'GMGN'
  divWrapEl.appendChild(gmgnLinkEl)

  const bullXLinkEl = document.createElement('a')
  bullXLinkEl.id = 'bullx'
  bullXLinkEl.href = `https://bullx.io/terminal?chainId=1399811149&address=${address}`
  bullXLinkEl.target = '_blank'
  bullXLinkEl.innerText = 'BullX'
  divWrapEl.appendChild(bullXLinkEl)

  threadEl.parentElement?.appendChild(divWrapEl)
}

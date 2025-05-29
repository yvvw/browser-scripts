// ==UserScript==
// @name         Better pump.fun
// @namespace    https://github.com/yvvw/browser-scripts
// @homepageURL  https://github.com/yvvw/browser-scripts/blob/main/src/pumpfun.user.ts
// @version      0.0.29
// @description  增加跳转
// @author       yvvw
// @icon         https://www.pump.fun/icon.png
// @license      MIT
// @updateURL    https://github.com/yvvw/browser-scripts/releases/download/latest/pumpfun.meta.js
// @downloadURL  https://github.com/yvvw/browser-scripts/releases/download/latest/pumpfun.user.js
// @match        https://www.pump.fun/*
// @match        https://pump.fun/*
// @noframes
// ==/UserScript==

import { HTMLUtils, Logger } from './util'

const logger = Logger.new('Better pump.fun')

window.onload = function main() {
  let running = false
  let prevToken = ''

  const run = () => {
    const token = location.pathname.split('/').pop()!
    if (running || token.length <= 40 || prevToken === token) {
      return
    }
    running = true
    prevToken = token

    addExternalLinks(token)
      .catch(logger.error.bind(logger))
      .finally(() => {
        running = false
      })
  }

  new MutationObserver(run).observe(document.body, { childList: true, subtree: true })
}

async function addExternalLinks(token: string) {
  if (document.body.dataset.betterPumpfun === token) {
    return
  }
  document.body.dataset.betterPumpfun = token

  const threadEl = await HTMLUtils.query(() =>
    HTMLUtils.getFirstElementByXPath<HTMLDivElement>('//div[text()="thread"]')
  )

  const divWrapEl = document.createElement('div')
  divWrapEl.classList.add('flex', 'gap-2', 'text-green-300', 'ml-auto')

  divWrapEl.appendChild(createExternalLink('axiom', `https://axiom.trade/t/${token}`))
  divWrapEl.appendChild(createExternalLink('gmgn', `https://gmgn.ai/sol/token/${token}`))
  divWrapEl.appendChild(
    createExternalLink(
      'raydium',
      `https://raydium.io/swap/?inputCurrency=sol&outputCurrency=${token}&inputMint=sol&outputMint=${token}`
    )
  )
  threadEl.parentElement?.appendChild(divWrapEl)
}

function createExternalLink(text: string, href: string) {
  const el = document.createElement('a')
  el.setAttribute('href', href)
  el.setAttribute('target', '_blank')
  el.innerText = text
  return el
}

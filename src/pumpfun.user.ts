// ==UserScript==
// @name         Better pump.fun
// @namespace    https://github.com/yvvw/browser-scripts
// @homepageURL  https://github.com/yvvw/browser-scripts/blob/main/src/pumpfun.user.ts
// @version      0.0.23
// @description  增加跳转
// @author       yvvw
// @icon         https://www.pump.fun/icon.png
// @license      MIT
// @updateURL    https://mirror.ghproxy.com/https://github.com/yvvw/browser-scripts/releases/download/latest/pumpfun.meta.js
// @downloadURL  https://mirror.ghproxy.com/https://github.com/yvvw/browser-scripts/releases/download/latest/pumpfun.user.js
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
    const token = location.pathname.slice(1)
    if (running || token.length <= 40 || prevToken === token) {
      return
    }
    running = true
    prevToken = token

    addExternalLinks()
      .catch(logger.error.bind(logger))
      .finally(() => (running = false))
  }

  new MutationObserver(run).observe(document.body, { childList: true, subtree: true })
}

async function addExternalLinks() {
  const threadEl = await HTMLUtils.query(() =>
    HTMLUtils.getFirstElementByXPath<HTMLDivElement>('//div[text()="Thread"]')
  )

  const address = location.pathname.replace('/', '')

  const divWrapEl = document.createElement('div')
  divWrapEl.classList.add('flex', 'gap-2', 'text-green-300', 'ml-auto')

  divWrapEl.appendChild(
    createExternalLink('DEXScreener', `https://dexscreener.com/solana/${address}`)
  )
  divWrapEl.appendChild(createExternalLink('GMGN', `https://gmgn.ai/sol/token/${address}`))
  divWrapEl.appendChild(
    createExternalLink('photon', `https://photon-sol.tinyastro.io/en/lp/${address}`)
  )
  divWrapEl.appendChild(
    createExternalLink(
      'Swap',
      `https://raydium.io/swap/?inputCurrency=sol&outputCurrency=${address}&inputMint=sol&outputMint=${address}`
    )
  )
  threadEl.parentElement?.appendChild(divWrapEl)
}

function createExternalLink(text: string, href: string) {
  const el = document.createElement('a')
  el.setAttribute('href', href)
  el.setAttribute('target', '_blank')
  el.setHTMLUnsafe(text)
  return el
}
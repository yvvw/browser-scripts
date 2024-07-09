// ==UserScript==
// @name         Better DEX Screener
// @namespace    https://github.com/yvvw/tampermonkey-scripts
// @version      0.0.9
// @description
// @author       yvvw
// @icon         https://dexscreener.com/favicon.ico
// @license      MIT
// @updateURL    https://mirror.ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/releases/download/latest/dexscreener.meta.js
// @downloadURL  https://mirror.ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/releases/download/latest/dexscreener.user.js
// @match        https://dexscreener.com/*
// @grant        none
// ==/UserScript==

import { HTMLUtils } from './util'

window.onload = function main() {
  HTMLUtils.observe(() => {
    hideAd()
    expandWatchList().catch((e) => console.error(e))
  })
}

async function expandWatchList() {
  const el = await HTMLUtils.waitingElement(() =>
    document.querySelector<HTMLButtonElement>('button[title="Expand watchlist"]')
  )
  el.click()
}

function hideAd() {
  const res = document.evaluate('//button[text()="Hide ad"]', document)
  while (true) {
    const btn = res.iterateNext() as HTMLButtonElement
    if (btn === null) {
      break
    }
    btn.click()
  }
}

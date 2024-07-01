// ==UserScript==
// @name         Better DEX Screener
// @namespace    https://github.com/yvvw/tampermonkey-scripts
// @version      0.0.7
// @description
// @author       yvvw
// @icon         https://dexscreener.com/favicon.ico
// @license      MIT
// @updateURL    https://mirror.ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/releases/download/latest/dexscreener.meta.js
// @downloadURL  https://mirror.ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/releases/download/latest/dexscreener.user.js
// @match        https://dexscreener.com/*
// @grant        none
// ==/UserScript==

import { observe, waitingElement } from './util'

window.onload = function main() {
  observe(async () => {
    hideAd()
    await expandWatchList()
  })
}

async function expandWatchList() {
  try {
    const el = await waitingElement(() =>
      document.querySelector<HTMLButtonElement>('button[title="Expand watchlist"]')
    )
    el.click()
  } catch {}
}

function hideAd() {
  Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
    .filter((it) => it.innerText === 'Hide ad')
    .forEach((el) => el.click())
}

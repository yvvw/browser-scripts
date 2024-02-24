// ==UserScript==
// @name         Better DEX Screener
// @namespace    https://github.com/yvvw/tampermonkey-scripts
// @version      0.0.5
// @description
// @author       yvvw
// @icon         https://dexscreener.com/favicon.ico
// @license      MIT
// @updateURL    https://mirror.ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/releases/download/latest/dexscreener.user.js
// @downloadURL  https://mirror.ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/releases/download/latest/dexscreener.user.js
// @match        https://dexscreener.com/*
// @grant        none
// ==/UserScript==

import { delay } from './util'

const defers: Function[] = []

window.onload = async function load() {
  autoHideAd()

  let times = 0
  while (times < 3) {
    times++
    await delay(2000)
    expandWatchList()
  }
}

window.onunload = async function unload() {
  defers.forEach((it) => it())
}

function autoHideAd() {
  const observer = new MutationObserver(hideAd)
  observer.observe(document.body, { subtree: true, childList: true })
  defers.push(() => observer.disconnect())
}

function expandWatchList() {
  const el = document.querySelector<HTMLButtonElement>('button[aria-label="Expand watchlist"]')
  if (el) el.click()
}

function hideAd() {
  Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
    .filter((it) => it.innerText === 'Hide ad')
    .forEach((el) => el.click())
}

// ==UserScript==
// @name         dexscreener
// @namespace    https://github.com/yvvw/tampermonkey-scripts
// @version      0.0.2
// @description
// @author       yvvw
// @icon         https://dexscreener.com/favicon.ico
// @license      MIT
// @updateURL    https://ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/releases/download/latest/dexscreener.user.js
// @downloadURL  https://ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/releases/download/latest/dexscreener.user.js
// @match        https://dexscreener.com/*
// @grant        none
// ==/UserScript==

window.onload = async function main() {
  await Promise.all([hideAd(), expandWatchList()])
}

async function hideAd() {
  let times = 0
  while (true) {
    if (times > 10) break
    times++
    await new Promise((resolve) => setTimeout(resolve, 500))
    const el = document.querySelector<HTMLButtonElement>('button[aria-label="Hide"]')
    if (el !== null) el.click()
  }
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    const el = document.querySelector<HTMLButtonElement>('button[aria-label="Hide"]')
    if (el !== null) el.click()
  }
}

async function expandWatchList() {
  let times = 0
  while (true) {
    if (times > 10) break
    times++
    await new Promise((resolve) => setTimeout(resolve, 500))
    const el = document.querySelector<HTMLButtonElement>('button[aria-label="Expand watchlist"]')
    if (el !== null) el.click()
  }
}

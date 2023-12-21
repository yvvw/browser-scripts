// ==UserScript==
// @name         Better Dexscreener
// @namespace    https://github.com/yvvw/tampermonkey-scripts
// @version      0.0.3
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
  let times = 0
  while (times < 10) {
    times++
    await Promise.all([hideAd(), expandWatchList()])
    await delay(1000)
  }
}

async function hideAd() {
  const els = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).filter(
    (it) => it.innerText === 'Hide ad',
  )
  if (els.length > 0) els.forEach((el) => el.click())
}

async function expandWatchList() {
  const el = document.querySelector<HTMLButtonElement>('button[aria-label="Expand watchlist"]')
  if (el !== null) el.click()
}

async function delay(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

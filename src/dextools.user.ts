// ==UserScript==
// @name         Better DEXTools
// @namespace    https://github.com/yvvw/browser-scripts
// @version      0.0.7
// @description  关闭广告
// @author       yvvw
// @icon         https://www.dextools.io/app/favicon.ico
// @license      MIT
// @updateURL    https://mirror.ghproxy.com/https://github.com/yvvw/browser-scripts/releases/download/latest/dextools.meta.js
// @downloadURL  https://mirror.ghproxy.com/https://github.com/yvvw/browser-scripts/releases/download/latest/dextools.user.js
// @match        https://www.dextools.io/*
// @noframes
// ==/UserScript==

import { HTMLUtils } from './util'

window.onload = function main() {
  HTMLUtils.observe(document.body, closeAd)
}

function closeAd() {
  Array.from(document.querySelectorAll<HTMLSpanElement>('span'))
    .filter((it) => it.innerText === 'Ad')
    .forEach((el) => {
      const btnEl = el.nextElementSibling as HTMLButtonElement | null
      if (btnEl?.getAttribute('ariaLabel') === 'Close') btnEl.click()
    })
}

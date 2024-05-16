// ==UserScript==
// @name         Better DEXTools
// @namespace    https://github.com/yvvw/tampermonkey-scripts
// @version      0.0.1
// @description
// @author       yvvw
// @icon         https://www.dextools.io/app/favicon.ico
// @license      MIT
// @updateURL    https://mirror.ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/releases/download/latest/dextools.user.js
// @downloadURL  https://mirror.ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/releases/download/latest/dextools.user.js
// @match        https://www.dextools.io/*
// @grant        none
// ==/UserScript==

const defers: Function[] = []

window.onload = function load() {
  autoHideAd()
}

window.onunload = function unload() {
  defers.forEach((it) => it())
}

function autoHideAd() {
  const observer = new MutationObserver(hideAd)
  observer.observe(document.body, { subtree: true, childList: true })
  defers.push(() => observer.disconnect())
}

function hideAd() {
  Array.from(document.querySelectorAll<HTMLSpanElement>('span'))
    .filter((it) => it.innerText === 'Ad')
    .forEach((el) => {
      if (
        el.nextElementSibling?.tagName === 'BUTTON' &&
        el.nextElementSibling?.ariaLabel === 'Close'
      ) {
        ;(el.nextElementSibling as HTMLButtonElement).click()
      }
    })
}

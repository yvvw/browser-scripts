// ==UserScript==
// @name         Better GMGN.ai
// @namespace    https://github.com/yvvw/tampermonkey-scripts
// @version      0.0.3
// @description  调整屏宽
// @author       yvvw
// @icon         https://gmgn.ai/static/favicon2.ico
// @license      MIT
// @updateURL    https://mirror.ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/releases/download/latest/gmgn_ai.user.js
// @downloadURL  https://mirror.ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/releases/download/latest/gmgn_ai.user.js
// @match        https://gmgn.ai/*/token/*
// @grant        none
// ==/UserScript==

window.onload = function main() {
  const callback: MutationCallback = (records) => {
    const tab = document.getElementById('leftTabs')
    if (tab === null) return
    tab.style.width = '70%'
  }
  new MutationObserver(callback).observe(document.body, { childList: true, subtree: true })
}

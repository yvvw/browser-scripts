// ==UserScript==
// @name         x(twitter)
// @namespace    https://github.com/yvvw/tampermonkey-scripts
// @version      0.0.1
// @description
// @author       yvvw
// @icon         https://abs.twimg.com/responsive-web/client-web/icon-default-maskable.bacea37a.png
// @license      MIT
// @updateURL    https://ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/releases/download/latest/x_better.user.js
// @downloadURL  https://ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/releases/download/latest/x_better.user.js
// @match        https://twitter.com/*
// @grant        none
// ==/UserScript==

window.onload = function main() {
  const callback: MutationCallback = (_records) => {
    const records = _records
      .filter((it) => it.addedNodes.length > 0)
      .map((it) => Array.from(it.addedNodes))
      .flat()
      .filter((it) => (it as HTMLElement).dataset['testid'] === 'cellInnerDiv')
      .map((it) => it as HTMLDivElement)
    if (records.length === 0) return
    records.forEach((it) => addBlock(it, 5))
  }
  new MutationObserver(callback).observe(document.body, { childList: true, subtree: true })
}

function addBlock(el: HTMLDivElement, times: number) {
  if (times === 0) return

  const moreBtnEl = el.querySelector<HTMLDivElement>('div[aria-label="More"].r-bt1l66')
  if (moreBtnEl === null) {
    setTimeout(() => addBlock(el, times - 1), 100)
    return
  }

  const parentEl = moreBtnEl.parentElement as HTMLDivElement
  if (parentEl.childElementCount > 1) return

  const blockBtn = moreBtnEl.cloneNode(true) as HTMLDivElement
  blockBtn.ariaLabel = "Block"
  blockBtn.style.marginRight = "12px"

  const svgIconEl = blockBtn.querySelector('svg')
  if (svgIconEl === null) return
  svgIconEl.innerHTML = blockSvgInner

  blockBtn.onclick = () => {
    moreBtnEl.click()
    const blockBtn2 = document.querySelector<HTMLButtonElement>('div[data-testid="block"]')
    if (blockBtn2 === null) return
    blockBtn2.click()
    const confirmBtn = document.querySelector<HTMLButtonElement>('div[data-testid="confirmationSheetConfirm"]')
    if (confirmBtn === null) return
    confirmBtn.click()
  }

  parentEl.insertBefore(blockBtn, moreBtnEl)
}

const blockSvgInner = '<g><path d="M12 3.75c-4.55 0-8.25 3.69-8.25 8.25 0 1.92.66 3.68 1.75 5.08L17.09 5.5C15.68 4.4 13.92 3.75 12 3.75zm6.5 3.17L6.92 18.5c1.4 1.1 3.16 1.75 5.08 1.75 4.56 0 8.25-3.69 8.25-8.25 0-1.92-.65-3.68-1.75-5.08zM1.75 12C1.75 6.34 6.34 1.75 12 1.75S22.25 6.34 22.25 12 17.66 22.25 12 22.25 1.75 17.66 1.75 12z"></path></g>'

// ==UserScript==
// @name         Better X(Twitter)
// @namespace    https://github.com/yvvw/tampermonkey-scripts
// @version      0.0.4
// @description  自动屏蔽AD，快捷屏蔽
// @author       yvvw
// @icon         https://abs.twimg.com/responsive-web/client-web/icon-default-maskable.bacea37a.png
// @license      MIT
// @updateURL    https://ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/releases/download/latest/x.user.js
// @downloadURL  https://ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/releases/download/latest/x.user.js
// @match        https://twitter.com/*
// @grant        none
// ==/UserScript==

window.onload = function main() {
  const callback: MutationCallback = (records) => {
    const twitterEls = records
      .filter((it) => it.addedNodes.length > 0)
      .flatMap((it) => Array.from(it.addedNodes) as HTMLDivElement[])
      .filter(
        (it) => it.dataset?.testid === 'cellInnerDiv' && it.querySelector('article[data-testid="tweet"]') !== null,
      )
    if (twitterEls.length === 0) return

    twitterEls.forEach((it) => addBlockEl(it, 5))
  }

  new MutationObserver(callback).observe(document.body, { childList: true, subtree: true })
}

function addBlockEl(twitterEl: HTMLDivElement, times: number) {
  if (times === 0) return

  // twitter right corner `...` button
  const moreBtnEl = twitterEl.querySelector<HTMLDivElement>('div[aria-label="More"].r-bt1l66')
  if (moreBtnEl === null) {
    setTimeout(() => addBlockEl(twitterEl, times - 1), 100)
    return
  }

  const block = () => {
    moreBtnEl.click()

    const blockBtn2 = document.querySelector<HTMLButtonElement>('div[data-testid="block"]')
    if (blockBtn2 === null) return
    blockBtn2.click()

    const confirmBtn = document.querySelector<HTMLButtonElement>('div[data-testid="confirmationSheetConfirm"]')
    if (confirmBtn === null) return
    confirmBtn.click()
  }

  if (twitterEl.innerText.includes('\nAd\n')) {
    block()
    return
  }

  const parentEl = moreBtnEl.parentElement as HTMLDivElement
  if (parentEl.childElementCount > 1) return

  // copy `...` button
  const blockBtnEl = moreBtnEl.cloneNode(true) as HTMLDivElement
  blockBtnEl.ariaLabel = 'Block'
  blockBtnEl.style.marginRight = '10px'
  blockBtnEl.onclick = block

  // replace `...` icon to `block` icon
  const svgIconEl = blockBtnEl.querySelector('svg')
  if (svgIconEl === null) return
  svgIconEl.innerHTML =
    '<g><path d="M12 3.75c-4.55 0-8.25 3.69-8.25 8.25 0 1.92.66 3.68 1.75 5.08L17.09 5.5C15.68 4.4 13.92 3.75 12 3.75zm6.5 3.17L6.92 18.5c1.4 1.1 3.16 1.75 5.08 1.75 4.56 0 8.25-3.69 8.25-8.25 0-1.92-.65-3.68-1.75-5.08zM1.75 12C1.75 6.34 6.34 1.75 12 1.75S22.25 6.34 22.25 12 17.66 22.25 12 22.25 1.75 17.66 1.75 12z"></path></g>'

  parentEl.insertBefore(blockBtnEl, moreBtnEl)
}

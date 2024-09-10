// ==UserScript==
// @name         Better X(Twitter)
// @namespace    https://github.com/yvvw/browser-scripts
// @homepageURL  https://github.com/yvvw/browser-scripts/blob/main/src/x.user.ts
// @version      0.0.14
// @description  关闭广告，快捷屏蔽
// @author       yvvw
// @icon         https://abs.twimg.com/favicons/twitter.3.ico
// @license      MIT
// @updateURL    https://mirror.ghproxy.com/https://github.com/yvvw/browser-scripts/releases/download/latest/x.meta.js
// @downloadURL  https://mirror.ghproxy.com/https://github.com/yvvw/browser-scripts/releases/download/latest/x.user.js
// @match        https://x.com/*
// @match        https://twitter.com/*
// @exclude      https://x.com/i/*
// @exclude      https://twitter.com/i/*
// @noframes
// ==/UserScript==

import { HTMLUtils } from './util'

window.onload = function main() {
  HTMLUtils.observe(
    document.body,
    async () => {
      const listEl = document.querySelector<HTMLDivElement>('section[role="region"]')
      if (listEl === null) {
        return
      }
      const itemEls = listEl.querySelectorAll<HTMLDivElement>('div[data-testid="cellInnerDiv"]')
      for (const itemEl of itemEls) {
        if (itemEl.querySelector('article[data-testid="tweet"]') !== null) {
          await addBlockEl(itemEl)
        }
      }
    },
    { waiting: true, throttle: 300 }
  )
}

async function addBlockEl(twitterEl: HTMLDivElement) {
  if (twitterEl.querySelector('button[aria-label="Block"]') !== null) return

  // twitter right corner `...` button
  const moreBtnEl = await HTMLUtils.query(() =>
    twitterEl.querySelector<HTMLDivElement>('button[aria-label="More"][data-testid="caret"]')
  )

  const block = async () => {
    moreBtnEl.click()

    await new Promise((resolve) => setTimeout(resolve, 0))
    const blockBtn2 = document.querySelector<HTMLButtonElement>('div[data-testid="block"]')
    if (blockBtn2 === null) return
    blockBtn2.click()

    await new Promise((resolve) => setTimeout(resolve, 0))
    const confirmBtn = document.querySelector<HTMLButtonElement>(
      'button[data-testid="confirmationSheetConfirm"]'
    )
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
  blockBtnEl.setAttribute('aria-label', 'Block')
  blockBtnEl.style.setProperty('margin-right', '10px')
  blockBtnEl.addEventListener('click', block)

  // replace `...` icon to `block` icon
  const svgIconEl = blockBtnEl.querySelector('svg')
  if (svgIconEl === null) return
  svgIconEl.setHTMLUnsafe(
    '<g><path d="M12 3.75c-4.55 0-8.25 3.69-8.25 8.25 0 1.92.66 3.68 1.75 5.08L17.09 5.5C15.68 4.4 13.92 3.75 12 3.75zm6.5 3.17L6.92 18.5c1.4 1.1 3.16 1.75 5.08 1.75 4.56 0 8.25-3.69 8.25-8.25 0-1.92-.65-3.68-1.75-5.08zM1.75 12C1.75 6.34 6.34 1.75 12 1.75S22.25 6.34 22.25 12 17.66 22.25 12 22.25 1.75 17.66 1.75 12z"></path></g>'
  )
  parentEl.insertBefore(blockBtnEl, moreBtnEl)
}

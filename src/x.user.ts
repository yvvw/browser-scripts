// ==UserScript==
// @name         Better X(Twitter)
// @namespace    https://github.com/yvvw/browser-scripts
// @homepageURL  https://github.com/yvvw/browser-scripts/blob/main/src/x.user.ts
// @version      0.0.16
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

import { HTMLUtils, Logger } from './util'

const logger = Logger.new('Better X')

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
          addExtraButtons(itemEl).catch(logger.error.bind(logger))
        }
      }
    },
    { waiting: true, throttle: 300 }
  )
}

async function addExtraButtons(twitterEl: HTMLDivElement) {
  if (twitterEl.querySelector('button[aria-label="Block"]') !== null) return

  await addBlockButton(twitterEl)
  await addNotInterestedButton(twitterEl)
}

async function addBlockButton(twitterEl: HTMLDivElement) {
  // twitter right corner `...` button
  const moreBtn = await HTMLUtils.query(() =>
    twitterEl.querySelector<HTMLDivElement>('button[aria-label="More"]')
  )

  const block = async () => {
    moreBtn.click()

    const btn = await HTMLUtils.query(() =>
      document.querySelector<HTMLButtonElement>('div[data-testid="block"]')
    )
    btn.click()

    const confirmBtn = await HTMLUtils.query(() =>
      document.querySelector<HTMLButtonElement>('button[data-testid="confirmationSheetConfirm"]')
    )
    confirmBtn.click()

    const laterBtn = await HTMLUtils.query(() =>
      HTMLUtils.getFirstElementByXPath<HTMLButtonElement>('//button[contains(., "Maybe later")]')
    )
    laterBtn.click()
  }

  if (twitterEl.innerText.includes('\nAd\n')) {
    await block()
    return
  }

  const moreParentEl = moreBtn.parentElement as HTMLDivElement

  const blockBtnEl = moreBtn.cloneNode(true) as HTMLDivElement
  blockBtnEl.setAttribute('aria-label', 'Block')
  blockBtnEl.style.setProperty('margin-right', '10px')
  blockBtnEl.addEventListener('click', block)

  const blockSvgIconEl = blockBtnEl.querySelector('svg')
  if (blockSvgIconEl === null) return
  blockSvgIconEl.setHTMLUnsafe(
    '<g><path d="M12 3.75c-4.55 0-8.25 3.69-8.25 8.25 0 1.92.66 3.68 1.75 5.08L17.09 5.5C15.68 4.4 13.92 3.75 12 3.75zm6.5 3.17L6.92 18.5c1.4 1.1 3.16 1.75 5.08 1.75 4.56 0 8.25-3.69 8.25-8.25 0-1.92-.65-3.68-1.75-5.08zM1.75 12C1.75 6.34 6.34 1.75 12 1.75S22.25 6.34 22.25 12 17.66 22.25 12 22.25 1.75 17.66 1.75 12z"></path></g>'
  )
  moreParentEl.insertBefore(blockBtnEl, moreParentEl.firstChild)
}

async function addNotInterestedButton(twitterEl: HTMLDivElement) {
  const moreBtn = await HTMLUtils.query(() =>
    twitterEl.querySelector<HTMLDivElement>('button[aria-label="More"]')
  )

  const notInterested = async () => {
    moreBtn.click()

    const btn = await HTMLUtils.query(() =>
      document.querySelector<HTMLButtonElement>('div[role="menuitem"]')
    )

    if (!btn.innerText.includes('Not interested')) {
      ;(
        document.querySelector<HTMLButtonElement>('div[role="menu"]')?.parentElement
          ?.firstElementChild as HTMLDivElement
      )?.click()
      return
    }

    btn.click()

    const showFewerBtn = Array.from(twitterEl.querySelectorAll('button')).find((it) =>
      it.innerText.includes('Show fewer posts')
    )
    showFewerBtn?.click()
  }

  const moreParentEl = moreBtn.parentElement as HTMLDivElement

  const notInterestBtnEl = moreBtn.cloneNode(true) as HTMLDivElement
  notInterestBtnEl.setAttribute('aria-label', 'Not Interested')
  notInterestBtnEl.style.setProperty('margin-right', '10px')
  notInterestBtnEl.addEventListener('click', notInterested)

  const notInterestSvgIconEl = notInterestBtnEl.querySelector('svg')
  if (notInterestSvgIconEl === null) return
  notInterestSvgIconEl.setHTMLUnsafe(
    '<g><path d="M9.5 7c.828 0 1.5 1.119 1.5 2.5S10.328 12 9.5 12 8 10.881 8 9.5 8.672 7 9.5 7zm5 0c.828 0 1.5 1.119 1.5 2.5s-.672 2.5-1.5 2.5S13 10.881 13 9.5 13.672 7 14.5 7zM12 22.25C6.348 22.25 1.75 17.652 1.75 12S6.348 1.75 12 1.75 22.25 6.348 22.25 12 17.652 22.25 12 22.25zm0-18.5c-4.549 0-8.25 3.701-8.25 8.25s3.701 8.25 8.25 8.25 8.25-3.701 8.25-8.25S16.549 3.75 12 3.75zM8.947 17.322l-1.896-.638C7.101 16.534 8.322 13 12 13s4.898 3.533 4.949 3.684l-1.897.633c-.031-.09-.828-2.316-3.051-2.316s-3.021 2.227-3.053 2.322z"></path></g>'
  )
  moreParentEl.insertBefore(notInterestBtnEl, moreParentEl.firstChild)
}
